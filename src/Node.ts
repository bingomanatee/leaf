/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Stateful } from './Stateful';
import {
  collectionObj,
  DefEnum,
  FormEnum,
  idStatefulDataObj,
  nodeInitObj,
  timeValue,
} from './types';
import { Time } from './Time';
import { Forest } from './Forest';
import { Branch } from './Branch';
import { detectForm, e } from './utils/tests';
import { NodeValueChange } from './NodeValueChange';

export class Node extends Stateful implements idStatefulDataObj {
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

  _validateForm() {
    if (this.config?.form !== FormEnum.any) {
      if (this._form !== this.form) {
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
    return (
      this.forest.branches
        .index('target')
        ?.recordsForKey(this.time)
        .map(record => {
          const branch = record as Branch;
          return branch.node;
        })
        .filter(b => b instanceof Node) || []
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
}
