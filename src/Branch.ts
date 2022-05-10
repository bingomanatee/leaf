import {
  BranchId,
  BranchIF,
  BranchInit,
  BranchName,
  BranchSchemaIF,
  BranchUpdate,
  StateEnum,
  TreeIF,
} from './types';
import { ABSENT } from './constants';

export class Branch implements BranchIF {
  /**
   * A branch is a creation, deletion or updating of the value and/or schema of a "path" - the chain of branches
   * indicated through parentage -- in the same Tree (see).
   * Branches -- and their containing trees -- are only considered "stable" when their state has been advanced to "good".
   * Older branches are of state "old" -- and those with errors are marked with state "bad".
   * @param props
   */

  constructor(props: BranchInit) {
    const {
      tree,
      name,
      id,
      value = ABSENT,
      schema = ABSENT,
      parent = ABSENT,
    } = props;
    this.tree = tree;
    this.name = name;
    this.id = id || Symbol(name);
    if (value !== ABSENT) {
      this.value = value;
    }
    if (schema !== ABSENT) {
      this.schema = schema;
    }
    if (parent !== ABSENT) {
      this.parent = parent;
    }
    this.state = StateEnum.new;
  }

  public readonly value: any;
  tree?: TreeIF;
  id: BranchId;
  parent?: BranchId;
  name: BranchName;
  state: StateEnum;
  schema?: BranchSchemaIF;
  error = null;

  public update(update: BranchUpdate): BranchIF {
    const props = {
      tree: this.tree,
      name: this.name,
      id: this.id,
      parent: this.parent,
      ...update,
    };
    return new Branch(props);
  }
}
