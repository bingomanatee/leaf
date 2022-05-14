import { ForestIF, TimeValue } from './types';
import { Time } from './Time';
import { BranchId, BranchIF } from './types/branch.types';
import { TreeId, TreeIF, TreeInit } from './types/tree.types';

/**
 * A Tree is a universal collection of one or more values.
 * They are indexed by id (a symbol) and name (path).
 * Branches may supersede or delete other branches, or change the schema.
 *
 * Each branch is created with a new increasing time - a posint that indicates the order in which they are created.
 * In the event of a failure, branches (or whole trees) are erased from the id of the failure on down.
 */
export class Tree implements TreeIF {
  protected static inc = 0;

  constructor(props: TreeInit) {
    this.forest = props.forest;
    this.name = props.name;
    this.time = Time.next;
    this.id = props.id || Symbol(props.name || `--tree ${Tree.inc++} --`);
  }

  forest?: ForestIF;
  id: TreeId;
  name?: string;
  readonly time: TimeValue;
  branchIds: BranchId[] = [];
}
