import { Stateful } from './Stateful';
import { collectionObj, timeObj, timeValue } from './types';
import { Node } from './Node';
import { Time } from './Time';
import { Forest } from './Forest';

export class Branch extends Stateful implements timeObj {
  get target(): Node {
    return this.forest.nodes.get(this._target) as Node;
  }

  get node(): Node {
    return this.forest.nodes.get(this._node) as Node;
  }

  get nodeId() {
    return this._node;
  }

  get targetId() {
    return this._target;
  }

  private forest: Forest;
  name: any;

  time: timeValue;
  private _node: timeValue;
  private _target: timeValue;

  constructor(branches: collectionObj, { name, node, target }) {
    super();
    this.forest = branches.context;
    this.name = name;

    this._node = node;
    this._target = target;

    if (node === target) {
      throw new Error('cannot self-branch');
    }
    this.time = Time.next;
  }

  get data() {
    return { node: this._node, target: this._target };
  }
}
