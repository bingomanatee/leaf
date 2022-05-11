import {
  BranchIF,
  ForestIF,
  TreeId,
  TreeIF,
  TreeInit,
} from './types';
import { Tree } from './Tree';
import EventEmitter from 'emitix';
import { e } from './utils/tests';
import { Time } from './Time';
import {ABSENT} from "./constants";
import {Schema} from "./utils/Schema";

/**
 * a Forest is a collection of 0 or more trees.
 * Some "trees" are actually "possible future updates" of other trees; they are stored
 * in able to allow update and merging to occur.
 * There should only be one "good" tree for every given ID. The others should be either "new" or "old".
 */

export class Forest
  extends EventEmitter.Protected<{ branch: [BranchIF, TreeIF?] }>()
  implements ForestIF {
  constructor(name = '') {
    super();
    if (!name) {
      name = `forest---${Forest.inc}`;
      ++Forest.inc;
    }
    this.name = name;
    this.id = Symbol(name);

    this._listen();
  }

  public name: any;
  protected static inc = 0;
  public readonly id: symbol;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly trees: TreeIF[] = [];
  public get(id: TreeId) {
    return this.trees.filter((tree: TreeIF) => tree.id === id);
  }
  public makeTree(props: TreeInit) {
    const tree = new Tree({ ...props, forest: this });
    this.trees.push(tree);
    return tree;
  }
  public last(id: TreeId) {
    return [...this.get(id)].pop();
  }

  // -------------------- events --------------

  onBranch(branch, tree?) {
    this.emit('branch', branch, tree);
  }

  _getBranchSchema(branch, tree) {
    const trees = this.get(tree.id).sort(Time.byTime);
    const branches = trees.reduce((br: BranchIF[], tree) => {
      const treeBranch = tree.branch(branch.id);
      if (treeBranch && treeBranch.schema) {
        br.push(treeBranch);
      }
      return br;
    }, []);

    branches.push(branch);

    return branches.sort(Time.byTime).pop()?.schema;
  }

  _getBranchValue(branch, tree) {
    const trees = this.get(tree.id).sort(Time.byTime);
    const branches = trees.reduce((br: BranchIF[], tree) => {
      const treeBranch = tree.branch(branch.id);
      if (treeBranch && 'value' in treeBranch) {
        br.push(treeBranch);
      }
      return br;
    }, []);

    branches.push(branch);

    return branches.sort(Time.byTime).pop()?.value;
  }

  _listen() {
    this.on('branch', (branch, tree?) => {
      if (!tree) {
        tree = branch.tree;
      }

      if (!tree) {
        throw e('Cannot find tree for branch', { branch });
      }

      const schema = this._getBranchSchema(branch, tree);
      const value = this._getBranchValue(branch, tree);

      if (!schema || (value === ABSENT)) {
        return;
      }

      const error = Schema.validate(schema, value);
      if (error) {
        branch.onError(error);
      }
    });
  }
}
