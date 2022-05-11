import { ForestIF } from './types';
import EventEmitter from 'emitix';
import { Schema } from './utils/Schema';
import { BranchIF, BranchId } from './types/branch.types';
import { TreeId, TreeIF } from './types/tree.types';
import { Time } from './Time';

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
  public readonly trees: Map<TreeId, TreeIF> = new Map<TreeId, TreeIF>();

  // -------------------- branchList -----------

  branches: Map<BranchId, BranchIF[]> = new Map<BranchId, BranchIF[]>();

  // -------------------- events --------------

  onBranch(branch, tree?) {
    this.emit('branch', branch, tree);
  }

  private pushBranch(branch) {
    const branchList = this.branches.get(branch);
    if (Array.isArray(branchList)) {
      if (!branchList.includes(branch))
        this.branches.set(branch.id, [...branchList, branch].sort(Time.byTime));
    } else {
      this.branches.set(branch.id, [branch]);
    }
  }

  _listen() {
    this.on('branch', (branch, _tree?) => {
      this.pushBranch(branch);

      if (branch.schema && 'value' in branch) {
        const error = Schema.validate(branch.schema, branch.value);
        if (error) {
          branch.onError(error);
        }
      }
    });
  }
}
