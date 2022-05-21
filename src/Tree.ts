import { Stateful } from './Stateful';
import { collectionObj, timeObj, timeValue } from './types';
import { Time } from './Time';
import { Forest } from './Forest';

export class Tree extends Stateful implements timeObj {
  private forest: Forest;
  name: any;
  private _rootNode: timeValue;
  time: timeValue;

  constructor(nodes: collectionObj, { name, value, configs }) {
    super();
    this.forest = nodes.context;
    this.name = name;
    this._rootNode = this._addRootNode(value);
    this._config(configs);
    this.time = Time.next;
  }

  get data() {
    return this._rootNode;
  }

  _addRootNode(value) {
    return this.forest.nodes.add({ value });
  }

  _config(configs?) {
    if (configs) {
    }
  }

  static get(time: timeValue, forest): Tree | undefined {
    const value = forest.Trees.get(time);
    if (value) {
      return value as Tree;
    }
    return undefined;
  }
}
