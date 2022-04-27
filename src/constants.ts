export const FORM_MAP = Symbol('form:map');
export const FORM_OBJECT = Symbol('form:object');
export const FORM_VALUE = Symbol('form:value');
export const FORM_ARRAY = Symbol('form:array');
export const FORM_FUNCTION = Symbol('form:function');
export const TYPE_ANY = Symbol('type:any');
export const TYPE_SYMBOL = Symbol('type:symbol');
export const TYPE_STRING = Symbol('string');
export const TYPE_NUMBER = Symbol('number');
export const TYPE_DATE = Symbol('type:date');

export const NAME_UNNAMED = Symbol('unnamed');

export const ABSENT = Symbol('ABSENT');

export const formIDs = [
  FORM_MAP,
  FORM_OBJECT,
  FORM_VALUE,
  FORM_ARRAY,
  FORM_FUNCTION,
  TYPE_SYMBOL,
  TYPE_ANY,
  TYPE_STRING,
  TYPE_NUMBER,
  TYPE_DATE,
];

export const branchingFormIDs = [FORM_MAP, FORM_OBJECT, FORM_ARRAY];
