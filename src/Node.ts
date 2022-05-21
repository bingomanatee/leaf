/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Stateful } from './Stateful';
import {
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
import { detectForm, detectType, e, isStr } from './utils/tests';
import { NodeValueChange } from './NodeValueChange';

export class Node extends Stateful implements idStatefulDataObj {
  private _type: TypeEnum | FormEnum;
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
  get value(): any {
    const lc = this.lastChange;
    if (lc) {
      return lc.value;
    }
    return this._value;
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
      if (result) throw result;
    }
  }

  validate() {
    this._validateForm();
    this._testValue();
  }

  parents(): Node[] {
    const branches = this.forest?.branches;
    const branchRecords = branches?.index('target')?.recordsForKey(this.time);
    return (
      branchRecords?.reduce((list: Node[], record) => {
        const branch = record as Branch;
        const node = branch?.node;
        if (node instanceof Node) {
          list.push(node);
        }
        return list;
      }, []) || []
    );
  }

  children() {
    return this.forest.branches
      .index('node')
      ?.recordsForKey(this.time)
      .map(record => {
        const branch = record as Branch;
        return branch.target;
      })
      .filter(b => b instanceof Node);
  }

  static get(time: timeValue, forest): Node | undefined {
    const node = forest.nodes.get(time);
    if (node) {
      return node as Node;
    }
    return undefined;
  }
}
