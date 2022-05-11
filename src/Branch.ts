import { StateEnum, TimeValue } from './types';
import { ABSENT } from './constants';
import { Time } from './Time';
import {
  BranchId,
  BranchIF,
  BranchInit,
  BranchName,
  BranchSchemaIF,
  BranchUpdate,
} from './types/branch.types';
import { TreeId } from './types/tree.types';

export class Branch implements BranchIF {
  /**
   * A branch is a structural part of a tree's definition.
   * It is actually a version - a time-indexed snapshot of the branch.
   * @param props
   */

  constructor(props: BranchInit) {
    const {
      treeId,
      name = '',
      id = null,
      value = ABSENT,
      schema = ABSENT,
      parent = ABSENT,
    } = props;
    this.treeId = treeId;
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
    this.time = Time.next;
  }

  public readonly value: any;
  treeId?: TreeId;
  id: BranchId;
  parent?: BranchId;
  name: BranchName;
  state: StateEnum;
  schema?: BranchSchemaIF;
  error = null;
  time: TimeValue;

  public update(update: BranchUpdate): BranchIF {
    const props = {
      treeId: this.treeId,
      name: this.name,
      id: this.id,
      parent: this.parent,
      ...update,
    };
    return new Branch(props);
  }

  onError(err) {
    this.error = err;
    this.state = StateEnum.error;
  }
}
