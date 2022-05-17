/* eslint-disable @typescript-eslint/ban-ts-comment */

import {
  branchable,
  branchObj,
  configKey,
  configMap,
  configType,
  nanoID,
  nodeIdMap,
} from '../types';
import { Time } from '../Time';
import { Forest } from '../Forest';
import { ABSENT, DELETE } from '../constants';
import { NodeConfigChange } from './NodeConfigChange';
import { Stateful } from '../Stateful';
import { NodeValueChange } from './NodeValueChange';
import { detectForm, isCompound, isThere } from '../utils/tests';
import { clone, setKey } from '../utils/compound';
import { toMap } from '../utils/conversion';
import createId from '../utils/createId';
import cache from '../cache';
import { Branch } from '../Branch';

export default class Node extends Stateful implements branchable {
  readonly time: number;
  name?: configKey;

  get configs(): configMap | undefined {
    return this._configs;
  }

  id: nanoID;
  public debug = false;
  forest?: Forest;
  private _configs?: configMap;
  private _value: any;

  constructor(value, name?: configKey, configs?: configType, forest?: Forest) {
    super();
    this.id = createId(name);
    this.name = name;
    this._value = value;
    this._configs = toMap(configs);
    this.time = Time.next;
    this.forest = forest;
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

  changeConfig(changes: configType) {
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

  get value(): any {
    // todo: decorate with branches etc.
    return this.netValue();
  }

  /**
   * the value of this node - adjusted for any values of its tree children.
   * @param network
   */
  netValue(network?: Set<nanoID>): any {
    const baseValue = this._value;
    if (!isCompound(baseValue)) {
      return baseValue;
    }
    let netValue = clone(baseValue);
    const form = detectForm(baseValue);
    const childValues = this.childValues(network);
    childValues.forEach(({ child, value }, childId) => {
      if (!network?.has(childId)) {
        netValue = setKey(netValue, value, child.name, form);
      }
      network?.add(childId);
    });
    // @todo: cache;
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
    /*   
 if (this.isActive && this.forest) {
      return this.forest.branches
        .filter(branch => {
          return branch.isActive && branch.dest === this.id;
        })
        .reduce((list: branchObj[], branch) => {
          if (branch.del) {
            return list.filter(foundBranch => !branch.eq(foundBranch));
          }
          list.push(branch);
          return list;
        }, [])
        .map(branch => branch.source)
        .sort();
    }
    return [];*/
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
}
