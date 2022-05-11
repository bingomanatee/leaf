import { FormEnum, StateEnum, TestResult, TypeEnum, WithTime } from '../types';
import { TreeId } from './tree.types';

export type BranchId = symbol;
export type BranchName = string | number;

export interface BranchIF extends WithTime {
  readonly treeId?: TreeId;
  id: BranchId;
  name: BranchName;
  schema?: BranchSchemaIF;
  state: StateEnum;
  parent?: BranchId;
  error?: any;
  value?: any;

  update(update: BranchUpdate): BranchIF;
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
  treeId?: TreeId;
} & BranchUpdate;
export type BranchTest = (value: any) => TestResult;

export interface BranchRuleIF {
  name: string;
  test?: BranchTest;
}

export type BranchRuleOrBasic = BranchRuleIF | BranchTest | TypeEnum | FormEnum;
export type BranchSchemaIF = BranchRuleOrBasic[] | BranchRuleOrBasic;
