/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Stateful } from './Stateful';
import { collectionObj, DefEnum, nvcInit, timeObj, timeValue } from './types';
import { Time } from './Time';
import { Forest } from './Forest';
import { detectForm, detectType } from './utils/tests';
import { Node } from './Node';

export class NodeValueChange extends Stateful implements timeObj {
  get type(): DefEnum {
    if (!this._type) {
      this._type = detectType(this.value);
    }
    return this._type;
  }

  get form(): DefEnum {
    if (!this._form) {
      this._form = detectForm(this.value);
    }
    return this._form;
  }

  get node(): Node | undefined {
    const node = this.forest.nodes.get(this.nodeId);
    if (node) {
      return node as Node;
    }
    return undefined;
  }

  public nodeId: timeValue;
  // @ts-ignore
  private forest: Forest;
  time: timeValue;
  value: any;
  private _form?: DefEnum;
  private _type?: DefEnum;

  constructor(nodes: collectionObj, data: nvcInit) {
    super();
    this.forest = nodes.context;
    this.nodeId = data.node;
    this.value = data.value;
    this.time = Time.next;
  }

  get data() {
    return this.value;
  }

  static get(time: timeValue, forest): NodeValueChange | undefined {
    const value = forest.nodes.get(time);
    if (value) {
      return value as NodeValueChange;
    }
    return undefined;
  }
}
