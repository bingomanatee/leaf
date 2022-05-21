/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  branchable,
  branchObj,
  compoundKey,
  configKey,
  configMap,
  configType,
  FormEnum,
  nanoID,
  nodeIdMap,
} from '../../src/types';
import { Time } from '../Time';
import { Forest } from '../Forest';
import { ABSENT, DELETE } from '../constants';
import { NodeConfigChange } from './NodeConfigChange';
import { Stateful } from '../Stateful';
import { NodeValueChange } from './NodeValueChange';
import {
  detectForm,
  detectType,
  e,
  isCompound,
  isFn,
  isThere,
} from '../../src/utils/tests';
import { clone, setKey } from '../../src/utils/compound';
import { toMap } from '../../src/utils/conversion';
import createId from '../../src/utils/createId';
import cache from '../cache';
import { Branch } from '../Branch';

export default class Node extends Stateful implements branchable {
  readonly time: number;
  name?: compoundKey;
  private _observer: any;

  get configs(): configMap | undefined {
    return this._configs;
  }

  id: nanoID;
  public debug = false;
  forest?: Forest;
  private _configs?: configMap;
  private _value: any;
  private _created = false;

  constructor(
    value: any,
    name?: compoundKey,
    configs?: configType,
    forest?: Forest
  ) {
    super();
    this.id = createId(name);
    this.name = name;
    this._value = value;
    this._configs = toMap(configs);
    this.time = Time.next;
    this.forest = forest;

    // in the absence of user-defined type or form constraints, constrain by initial form
    if (!(this.configs?.has('form') || this.configs?.has('type'))) {
      const form = detectForm(this.value);
      this.config('form', form);
    }
    this._created = true;
  }

  /* ----------- configs ---------------- */

  config(key: configKey, updateValue: any = ABSENT) {
    if (!isThere(updateValue)) {
      // get
      return this.configs?.get(key);
    } else {
      return this.changeConfig(new Map([[key, updateValue]]));
    }
  }

  hasConfig(key) {
    return this.configs?.has(key);
  }

  deleteConfig(key) {
    return this.changeConfig(new Map([[key, DELETE]]));
  }

  changeConfig(changes: configType): NodeConfigChange {
    const next = toMap(this.configs, true);

    toMap(changes).forEach((value, key) => {
      if (value === DELETE) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    const change = new NodeConfigChange(this.id, next, this.configs);
    this._configs = next;
    return change;
  }

  revertConfig(change: NodeConfigChange) {
    this._configs = change.current;
  }

  /* -------- value/next -------------- */

  next(value) {
    const valueChange = new NodeValueChange(this.id, value, this.value);
    this._value = value;
    return valueChange;
  }

  private _valueCache;
  get value(): any {
    // todo: decorate with branches etc.
    if (!this._valueCache) {
      this._valueCache = cache({
        generator: target => {
          return target.netValue();
        },
        afterInactive: () => undefined,
        target: this,
      });
    }
    return this._valueCache();
  }

  /**
   * the value of this node - appended with any values of its tree children.
   * @param network
   */
  netValue(network?: Set<nanoID>): any {
    const baseValue = this._value;
    if (!isCompound(baseValue)) {
      return baseValue;
    }
    let netValue = clone(baseValue);
    const form = detectForm(baseValue);
    this.eachChild((child, childId) => {
      if (!network?.has(childId)) {
        netValue = setKey(netValue, child.netValue(network), child.name, form);
      }
      network?.add(childId);
    });
    return netValue;
  }

  eachChild(fn: (child: Node, childId: nanoID) => void, onlyActive = false) {
    if (!this.forest) return;
    this.children.forEach(childId => {
      if (!this.forest) return;
      const child = this.forest.node(childId);
      if (child) {
        if (onlyActive && !child.isActive) {
          return;
        }
        fn(child, childId);
      }
    });
  }

  childValues(network?: Set<nanoID>): nodeIdMap {
    if (!network) {
      network = new Set(this.id);
    }
    const childValues: nodeIdMap = new Map();
    if (!this.forest) {
      return childValues;
    }
    this.eachChild((child, childId) => {
      const value = child.netValue(network);
      childValues.set(childId, { value, child });
    }, true);
    return childValues;
  }

  /* --------- branches --------------- */

  private _parentCache?: () => nanoID[];
  get parents(): nanoID[] {
    if (!this._parentCache) {
      this._parentCache = cache({
        target: this,
        generator: target => {
          if (target.forest) {
            return target.forest.branches
              .filter(branch => {
                return branch.isActive && branch.dest === target.id;
              })
              .reduce((list: branchObj[], branch) => {
                if (branch.del) {
                  return list.filter(
                    foundBranch => !Branch.eq(branch, foundBranch)
                  );
                }
                list.push(branch);
                return list;
              }, [])
              .map(branch => branch.source)
              .sort();
          }
          return [];
        },
        afterInactive: () => [],
      });
    }
    return this._parentCache();
  }

  private _childCache?: () => nanoID[];

  get children(): nanoID[] {
    if (!this._childCache) {
      this._childCache = cache({
        target: this,
        generator: target => {
          if (target.forest) {
            return target.forest.branches
              .filter(branch => {
                return branch.isActive && branch.source === target.id;
              })
              .reduce((list: branchObj[], branch) => {
                if (branch.del) {
                  return list.filter(
                    foundBranch => !Branch.eq(branch, foundBranch)
                  );
                }
                list.push(branch);
                return list;
              }, [])
              .map(branch => branch.dest)
              .sort();
          }
          return [];
        },
        afterInactive: () => [],
      });
    }
    return this._childCache();
  }

  addChild(targetId: nanoID) {
    if (this.forest) {
      this.forest.branch(this.id, targetId);
    }
  }

  deleteChild(targetId) {
    if (this.forest) this.forest.branch(this.id, targetId, true);
  }

  addParent(targetId: nanoID) {
    if (this.forest) {
      this.forest.branch(targetId, this.id);
    }
  }

  deleteParent(targetId) {
    if (this.forest) this.forest.branch(targetId, this.id, true);
  }

  private _validateForm() {
    const form = this.configs?.get('form');
    if (!form) return;
    if (form === FormEnum.any) {
      return;
    }

    if (isFn(form)) {
      const err = form(this.value);
      if (err) throw err;
    }

    const valueForm = detectForm(this.value);
    if (valueForm !== form) {
      const notes = {
        node: this,
        form,
        valueForm,
        value: this.value,
      };
      throw e('node value is not correct form', notes);
    }
  }

  _validateType() {
    const type = this.configs?.get('type');
    if (!type) return;
    if (type === FormEnum.any) {
      return;
    }

    if (isFn(type)) {
      const err = type(this.value);
      if (err) throw err;
    }

    if (detectType(this.value) !== type) {
      const notes = {
        node: this,
        type,
        value: this.value,
      };
      throw e('node value is not correct type', notes);
    }
  }
  validate() {
    if (!this._created) return;
    this._validateForm();
    this._validateType();
  }

  subscribe(listener) {
    if (!this.forest) {
      throw e('cannot listen to node without forest', { node: this });
    }
    if (!this._observer) {
      this._observer = this.forest.nodeValueSubject(this.id);
    }
    return this._observer.subscribe(listener);
  }
}
