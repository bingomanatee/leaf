/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Stateful } from './Stateful';
import {
  cacheFn,
  collectionObj,
  DefEnum,
  FormEnum,
  idStatefulDataObj,
  nodeInitObj,
  timeValue,
  TypeEnum,
} from './types';
import { Time } from './Time';
import { Forest } from './Forest';
import { Branch } from './Branch';
import { detectForm, detectType, e, isCompound, isStr } from './utils/tests';
import { NodeValueChange } from './NodeValueChange';
import { clone, setKey } from './utils/compound';

export class Node extends Stateful implements idStatefulDataObj {
  get name(): string {
    return this._name;
  }

  private readonly _type: TypeEnum | FormEnum;
  private readonly _name: string;

  get config(): any {
    return this._config;
  }

  private _config: any;

  get lastChange(): NodeValueChange | undefined {
    const changes = this.changes;
    if (changes.length) {
      for (let i = changes.length - 1; i >= 0; --i) {
        const change = changes[i];
        if (change.isActive) {
          return change;
        }
      }
    }
    return undefined;
  }

  get form(): DefEnum {
    const lc = this.lastChange;
    if (lc) {
      return lc.form;
    }
    return this._form;
  }

  get type() {
    const lc = this.lastChange;
    if (lc) {
      return lc.type;
    }
    return this._type;
  }

  _mergeChildren() {
    const merged = clone(this._baseValue);
    this.children().forEach((child: Node) => {
      setKey(merged, child.value, child.name, this.form);
    });
    return merged;
  }

  private _valueCache?: cacheFn;
  get valueCache() {
    if (!this._valueCache) {
      this._valueCache = this.forest.cache(
        _forest => {
          if (!isCompound(this.form)) {
            return this._baseValue;
          }

          if (!this.children().length) {
            return this._baseValue;
          }

          return this._mergeChildren();
        },
        {
          nodeValueChanges: (_, record) => {
            const change = record as NodeValueChange;
            if (change.nodeId === this.time) {
              return true;
            }
            return false;
          },
        }
      );
    }
    return this._valueCache;
  }

  private get _baseValue() {
    let root = this._value;
    const lc = this.lastChange;
    if (lc) {
      root = lc.value;
    }
    return root;
  }

  get value(): any {
    return this.valueCache();
  }

  // @ts-ignore
  private forest: Forest;
  private _value: any;
  private _form: DefEnum;
  time: timeValue;

  constructor(nodes: collectionObj, data: nodeInitObj) {
    super();
    this.forest = nodes.context;
    if (!this.forest) {
      console.log('bad input to node: ', nodes, typeof nodes);
    }
    this._value = data.value;
    this._name = data.name;
    this._form = detectForm(data.value);
    this._type = detectType(data.value);
    this.time = Time.next;
    this._config = data.config || {};
  }

  private _changesCache: (() => NodeValueChange[]) | null = null;

  get changes(): NodeValueChange[] {
    if (!this._changesCache) {
      const myTime = this.time;
      this._changesCache = this.forest.cache(
        forest => {
          return (
            forest?.nodeValueChanges
              ?.index('node')
              ?.recordsForKey(this.time)
              .map(record => record as NodeValueChange) || []
          );
        },
        {
          nodeValueChanges: (_, node) => {
            return node.time === myTime;
          },
        }
      );
    }
    return this._changesCache();
  }

  update(value) {
    this.forest.nodeValueChanges.add({ node: this.time, value });
  }

  get data() {
    return this.value;
  }

  addChildNode(value) {
    const target = this.forest.branches.add(value);
    this.forest.branches.add({ node: this.time, target });
  }

  linkTo(targetId: timeValue) {
    this.forest.branches.add({ node: this.time, target: targetId });
  }

  _validateType() {
    if (typeof this.config?.type === 'function') {
      return this.config.type(this.type);
    } else if (this.config?.type !== TypeEnum.any) {
      const expectedForm = isStr(typeof this.config?.type)
        ? this._form
        : this.config.type;
      if (expectedForm !== this.type) {
        const notes = {
          target: this,
          originalForm: this._form,
          currentForm: this.type,
        };
        throw e('type error mismatch', notes);
      }
    }
  }

  _validateForm() {
    if (this.config?.type) {
      return this._validateType();
    }
    if (typeof this.config?.form === 'function') {
      return this.config.form(this.form);
    } else if (this.config?.form !== FormEnum.any) {
      const expectedForm = isStr(typeof this.config?.form)
        ? this._form
        : this.config.form;
      if (expectedForm !== this.form) {
        const notes = {
          target: this,
          originalForm: this._form,
          currentForm: this.form,
        };
        throw e('Form error mismatch', notes);
      }
    }
  }

  _testValue() {
    if (typeof this.config?.test === 'function') {
      const result = this.config.test(this.value, this);
      if (result) {
        throw result;
      }
    }
  }

  validate() {
    this._validateForm();
    this._testValue();
  }

  parents(): Node[] {
    const times =
      this.forest.branches?.index('target')?.timesForKey(this.time) || [];
    const branches = Branch.getMany(times, this.forest);
    return branches.reduce((list: Node[], branch: Branch) => {
      const node = branch?.node;
      if (node) {
        list.push(node);
      }
      return list;
    }, []);
  }

  children(): Node[] {
    const times =
      this.forest.branches?.index('node')?.timesForKey(this.time) || [];
    const branches = Branch.getMany(times, this.forest);
    return branches.reduce((list: Node[], branch: Branch) => {
      const node = branch?.target;
      if (node) {
        list.push(node);
      }
      return list;
    }, []);
  }

  static get(time: timeValue, forest): Node | undefined {
    const node = forest.nodes.get(time);
    if (node) {
      return node as Node;
    }
    return undefined;
  }

  static getMany(times: Array<timeValue>, forest): Node[] {
    return times.reduce((list: Node[], time: timeValue) => {
      const node = Node.get(time, forest);
      if (node) {
        list.push(node);
      }
      return list;
    }, []);
  }
}
