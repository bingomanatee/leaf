/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Stateful } from './Stateful';
import { collectionObj, DefEnum, nvcInit, timeObj, timeValue } from './types';
import { Time } from './Time';
import { Forest } from './Forest';
import { detectForm } from './utils/tests';
import { Node } from './Node';
export class NodeValueChange extends Stateful implements timeObj {
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
  form: DefEnum;

  constructor(nodes: collectionObj, data: nvcInit) {
    super();
    this.forest = nodes.context;
    this.nodeId = data.node;
    this.value = data.value;
    this.form = detectForm(data.value);
    this.time = Time.next;
  }

  get data() {
    return this.value;
  }
}
