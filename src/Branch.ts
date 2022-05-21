import { Stateful } from './Stateful';
import { collectionObj, timeObj, timeValue } from './types';
import { Node } from './Node';
import { Time } from './Time';
import { Forest } from './Forest';

export class Branch extends Stateful implements timeObj {
  get target(): Node | undefined {
    return Node.get(this._target, this.forest);
  }

  get node(): Node | undefined {
    return Node.get(this._node, this.forest);
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
  static get(time: timeValue, forest): Branch | undefined {
    const branch = forest.nodes.get(time);
    if (branch) {
      return branch as Branch;
    }
    return undefined;
  }
}
