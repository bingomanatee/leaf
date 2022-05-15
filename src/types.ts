export type TimeValue = number;

export enum StateEnum {
  new = 'new',
  good = 'good',
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
}

export type DefEnum = TypeEnum | FormEnum;

export interface WithTime {
  time: TimeValue;
}

export enum ChangeEnum {
  set = 'set',
  delete = 'delete',
}

export type valueKey = string | number | symbol;
export type valueMap = Map<valueKey, any>;
export type nodeID = string;
