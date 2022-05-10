export interface TimeIF {
  readonly second: number;
  next: () => TimeIF;
}

export interface TreeIF {
  readonly time: number;
  getBranch(id: BranchId): BranchIF;
  setBranch(id: BranchId, BranchIF): TreeIF;
  getLeaf(id: BranchId): LeafIF;
  setLeaf(id: BranchId, value: any);
}

export enum StateEnum {
  new = 'new',
  good = 'good',
  removed = 'removed',
}

export type BranchId = string;
export type BranchName = string | number;

export interface BranchIF {
  readonly tree: TreeIF;
  id: BranchId;
  parent?: string;
  name: BranchName;
  schema: BranchSchemaIF;
  state: StateEnum;
}

export type TestResult = boolean | string;
export type BranchTest = (value: any) => TestResult;

export interface BranchRuleIF {
  name: string;
  test?: BranchTest;
}

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

export type BranchRuleOrBasic = BranchRuleIF | TypeEnum | FormEnum;

export interface BranchSchemaIF {
  readonly rules: BranchRuleOrBasic[];
}

export interface LeafIF {
  branch: BranchId;
  value: any;
  time: number;
}
