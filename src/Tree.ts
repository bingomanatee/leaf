import {
  BranchId,
  BranchIF,
  BranchName,
  BranchInit,
  ForestIF,
  TimeValue,
  TreeId,
  TreeIF,
  TreeInit,
} from './types';
import { Time } from './Time';
import { Branch } from './Branch';
import EventEmitter from 'emitix';

export class Tree
  extends EventEmitter.Protected<{
    branch: [BranchIF];
  }>()
  implements TreeIF {
  protected static inc = 0;

  constructor(props: TreeInit) {
    super();
    this.forest = props.forest;
    this.name = props.name;
    this.id = props.id || Symbol(props.name || '--root--');
    this.time = Time.next;

    this._listen();
  }

  forest?: ForestIF;
  id: TreeId;
  name?: string;
  readonly time: TimeValue;

  _branchMaps = new Map<BranchId | BranchName, BranchIF>();

  branch(id: BranchId): BranchIF | undefined {
    return this._branchMaps.get(id);
  }

  addBranch(init: BranchInit): BranchIF | undefined {
    let branch;
    if (this._branchMaps.has(init.name)) {
      branch = this._branchMaps
        .get(init.name)
        ?.update({ value: init.value, schema: init.schema });
    } else {
      const id = Symbol(init.name);
      branch = new Branch({ tree: this, id, ...init });
    }
    if (branch) {
      this.emit('branch', branch);
    }
    return branch;
  }

  protected _listen() {
    this.on('branch', (branch: BranchIF) => {
      // @TODO: merge with old content, test against schema, etc.
      this._branchMaps.set(branch.id, branch);
      this._branchMaps.set(branch.name, branch);
      // @TODO: broadcast new tree value.
    });
  }
}
