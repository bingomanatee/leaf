import EventEmitter from 'emitix';

export type timeValue = number;
export const ABSENT = Symbol('absent');

/**
 * state is a combination of validity and liveniness.
 *
 *              invalid   |  neutral  | valid
 *    ------------------------------------------
 *    current      (N/A)    active        good
 *    complete     error    complete
 *    outdated              removed
 *
 *
 */
export enum StateEnum {
  active = 'active',
  good = 'good',
  complete = 'complete',
  removed = 'removed',
  error = 'error',
}

export enum TypeEnum {
  string = 'string',
  number = 'number',
  date = 'date',
  null = 'null',
  symbol = 'symbol',
  any = 'any',
}

export enum FormEnum {
  array = 'Array',
  map = 'Map',
  object = 'object',
  scalar = 'scalar',
  function = 'function',
  any = 'any',
}

export type DefEnum = TypeEnum | FormEnum;

export interface timeObj {
  time: timeValue;
}

export type configKey = string | number | symbol;
export type configMap = Map<configKey, any>;
export type configObj = configMap | { [key: string]: any };
export type configType = configObj | configMap;
export type nanoID = string;
export type nodeIdMap = Map<nanoID, any>;

export type nanoIdObj = {
  id: nanoID;
};
export type branchable = {
  addParent: (parentId: nanoID) => undefined;
  addChild: (childId: nanoID) => undefined;
  deleteParent: (parentId: nanoID) => undefined;
  deleteChild: (childId: nanoID) => undefined;
  readonly parents: nanoID[];
  readonly children: nanoID[];
} & nanoIdObj;

export type statefulObj = {
  state: StateEnum;
  isActive: boolean;
  isGood: boolean;
  accept: () => void;
  complete: () => void;
  remove: () => void;
  fail: (err) => void;
  stateError?: any;
};

export type compoundKey = string | number;

export type idStatefulObj = statefulObj & timeObj;
export type idStatefulDataObj = { data: any } & idStatefulObj;
export type collectionObj = {
  get: (time: timeValue) => idStatefulDataObj | undefined;
  add: (value: any) => timeValue;
  index: (name, test?, opts?: indexOptions) => collectionIndexObj | undefined;
  delete: (time: timeValue) => idStatefulObj | undefined;
  has: (time: timeValue) => boolean;
  setState: (
    time: timeValue,
    state: StateEnum
  ) => idStatefulDataObj | undefined;
  doState: (
    time: timeValue,
    method: string,
    value?
  ) => idStatefulDataObj | undefined;
  context: any;
  all: idStatefulDataObj[];
  active: idStatefulDataObj[];
} & EventEmitter;

export type indexOptions = {
  binary?: boolean;
  unique?: boolean;
  onlyYes?: boolean;
};
export type collectionIndexObj = {
  timesForKey: (key) => timeValue[];
  recordsForKey: (key) => idStatefulDataObj[];
};
export type transData = { message: any; noValidation?: boolean };
export type nodeInitObj = {
  value: any;
  config?: configObj;
};
export type tablesObj = { [name: string]: ivValue };
type ivFn = (
  message: string,
  content: any,
  tableName: string,
  forest: any
) => boolean;
type ivValue = boolean | ivFn;

export type indexTestFn = (record: idStatefulDataObj) => boolean;

export type nvcInit = { node: timeValue; value: any };
