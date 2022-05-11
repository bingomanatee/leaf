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

/**
 * A Tree is a universal collection of one or more values.
 * They are indexed by id (a symbol) and name (path).
 * Branches may supersede or delete other branches, or change the schema.
 *
 * Each branch is created with a new increasing time - a posint that indicates the order in which they are created.
 * In the event of a failure, branches (or whole trees) are erased from the id of the failure on down.
 */
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
    this.time = Time.next;
    this.id = props.id || Symbol(props.name || '--root--');

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
      if (this.forest) {
        this.forest.onBranch(branch, this);
      }
      // @TODO: merge with old content, test against schema, etc.
      this._branchMaps.set(branch.id, branch);
      this._branchMaps.set(branch.name, branch);
      // @TODO: broadcast new tree value.
    });
  }
}
