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
  public readonly value: any;
  tree?: TreeIF;
  id: BranchId;
  parent?: BranchId;
  name: BranchName;
  state: StateEnum;
  schema?: BranchSchemaIF;

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