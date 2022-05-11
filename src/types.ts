import { BranchId, BranchIF } from './types/branch.types';
import { TreeId, TreeIF } from './types/tree.types';

export type ForestId = symbol;

export interface ForestIF {
  id: ForestId;
  trees: Map<TreeId, TreeIF>;
  branches: Map<BranchId, BranchIF[]>;
  onBranch(branch: BranchIF, tree?: TreeIF): void;
}

export type TimeValue = number;

export enum StateEnum {
  new = 'new',
  good = 'good',
  old = 'old',
  removed = 'removed',
  error = 'error',
}

export type TestResult = boolean | string;

export enum TypeEnum {
  string = 'string',
  number = 'number',
  date = 'date',
  null = 'null',
  symbol = 'symbol',
}

export enum FormEnum {
  array = 'Array',
  map = 'Map',
  object = 'object',
  scalar = 'scalar',
}

export interface LeafIF {
  branch: BranchId;
  value: any;
}

export interface WithTime {
  time: TimeValue;
}
