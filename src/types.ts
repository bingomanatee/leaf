export type TreeId = symbol;
export type ForestId = symbol;

export type TreeInit = {
  forest?: ForestIF;
  name?: string;
  id?: ForestId;
};

export interface ForestIF {
  id: ForestId;
  get(id: TreeId): TreeIF[];
  last(id: TreeId): TreeIF | undefined;
  makeTree(props: TreeInit): TreeIF;

  onBranch(branch: BranchIF, tree?: TreeIF): void;
}

export type TimeValue = number;

export interface TreeIF extends WithTime {
  readonly time: TimeValue;
  forest?: ForestIF;
  id: TreeId;
  branch(id: BranchId): BranchIF | undefined;
  addBranch(init: BranchInit): BranchIF | undefined;
}

export enum StateEnum {
  new = 'new',
  good = 'good',
  old = 'old',
  removed = 'removed',
  error = 'error',
}

export type BranchId = symbol;
export type BranchName = string | number;

export interface BranchIF extends WithTime {
  readonly tree?: TreeIF;
  id: BranchId;
  name: BranchName;
  schema?: BranchSchemaIF;
  state: StateEnum;
  update(update: BranchUpdate): BranchIF;
  value?: any;
  onError(err): void;
}

export type BranchUpdate = {
  value?: any;
  schema?: BranchSchemaIF;
  state?: StateEnum;
  parent?: BranchId;
};

export type BranchInit = {
  name: BranchName;
  id?: BranchId;
  tree?: TreeIF;
} & BranchUpdate;

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

export type BranchRuleOrBasic = BranchRuleIF | BranchTest | TypeEnum | FormEnum;

export type BranchSchemaIF = BranchRuleOrBasic[] | BranchRuleOrBasic;

export interface LeafIF {
  branch: BranchId;
  value: any;
}

export interface WithTime {
  time: TimeValue;
}
