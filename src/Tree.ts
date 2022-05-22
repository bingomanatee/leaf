import { Stateful } from './Stateful';
import { collectionObj, timeObj, timeValue, treeInitType } from './types';
import { Time } from './Time';
import { Forest } from './Forest';
import { e } from './utils/tests';
import { Node } from './Node';

export class Tree extends Stateful implements timeObj {
  get rootNodeId(): timeValue {
    return this._rootNodeId;
  }
  get config(): any {
    return this._config;
  }
  get rootNode(): Node | undefined {
    return Node.get(this._rootNodeId, this.forest);
  }
  time: timeValue;
  name: string;
  private readonly forest: Forest;
  private readonly _rootNodeId: timeValue;
  private readonly _config: any;

  constructor(trees: collectionObj, props: treeInitType) {
    super();
    this.forest = trees.context;
    this.name = props.name;
    if (props.nodeId) {
      this._rootNodeId = props.nodeId;
    } else if ('value' in props) {
      this._rootNodeId = this.forest.nodes.add({
        value: props.value,
        name: props.name,
        config: props.nodeConfig,
      });
    } else {
      throw e('tree requires either value or nodeId', { props });
    }
    this._config = props.config;
    this.time = Time.next;
  }

  get data() {
    return this.rootNode?.value;
  }

  static get(time: timeValue, forest): Tree | undefined {
    const value = forest.Trees.get(time);
    if (value) {
      return value as Tree;
    }
    return undefined;
  }

  static getMany(times: Array<timeValue>, forest): Tree[] {
    return times.reduce((list: Tree[], time: timeValue) => {
      const node = Tree.get(time, forest);
      if (node) {
        list.push(node);
      }
      return list;
    }, []);
  }
}
