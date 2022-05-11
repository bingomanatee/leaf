import { BranchId } from './branch.types';
import { ForestId, ForestIF } from '../types';

export type TreeId = symbol;
export type TreeInit = {
  forest?: ForestIF;
  name?: string;
  id?: ForestId;
  treeId?: TreeId;
};

export interface TreeIF {
  forest?: ForestIF;
  id: TreeId;
  branchIds: BranchId[];
}
