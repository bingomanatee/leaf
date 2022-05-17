export type timeValue = number;

export enum StateEnum {
  new = 'new',
  active = 'active',
  good = 'good',
  complete = 'complete',
  old = 'old',
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
  addParent: (parentId: nanoID) => void;
  addChild: (childId: nanoID) => void;
  deleteParent: (parentId: nanoID) => void;
  deleteChild: (childId: nanoID) => void;
  readonly parents: nanoID[];
  readonly children: nanoID[];
} & nanoIdObj;

export type statefulObj = {
  state: StateEnum;
  isActive: boolean;
};

export type branchObj = {
  source: nanoID;
  dest: nanoID;
  del?: boolean;
} & statefulObj &
  timeObj;

export type compoundKey = string | number;
