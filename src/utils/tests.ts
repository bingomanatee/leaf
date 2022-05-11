import {
  ABSENT,
  FORM_ARRAY,
  FORM_FUNCTION,
  FORM_MAP,
  FORM_OBJECT,
  FORM_VALUE,
  NAME_UNNAMED,
  TYPE_ANY,
  TYPE_DATE,
  TYPE_NUMBER,
  TYPE_STRING,
  TYPE_SYMBOL,
} from '../constants';

import { isNumber, sortBy } from 'lodash-es';

export function isThere(item) {
  return ![ABSENT, NAME_UNNAMED, undefined].includes(item);
}

export const isNum = isNumber;

/**
 * a type check; if nonEmpty = true, only true if array has indexed values.
 * @param a
 * @param nonEmpty
 * @returns {boolean}
 */
export function isArr(a, nonEmpty = false) {
  return Array.isArray(a) && (!nonEmpty || a.length);
}

export const isMap = m => m && m instanceof Map;

/**
 * returns true if the object is a POJO object -- that is,
 * its non-null, is an instance of Object, and is not an array.
 *
 * @param o
 * @param isAnyObj {boolean} whether arrays, maps should be included as objecg
 * @returns {boolean}
 */
export function isObj(o, isAnyObj = false) {
  return o && typeof o === 'object' && (isAnyObj || !(isArr(o) || isMap(o)));
}

export const isFn = f => typeof f === 'function';

export const isDate = d => d instanceof Date;

export const isSymbol = s => typeof s === 'symbol';

export function isWhole(value) {
  if (!isNum(value)) {
    return false;
  }
  return value >= 0 && !(value % 2);
}

/**
 * returns a decorated error; an Error instance with extra annotations
 * @param err
 * @param notes
 */
export const e = (err, notes = {}) => {
  if (typeof err === 'string') {
    err = new Error(err);
  }
  if (!isThere(notes)) {
    notes = {};
  } else if (!isObj(notes)) {
    notes = { notes };
  }
  return Object.assign(err, notes);
};

export function isStr(s, nonEmpty = false) {
  if (typeof s === 'string') {
    return nonEmpty ? !!s : true;
  }
  return false;
}

export function ucFirst(str) {
  if (!isStr(str, true)) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

class TypeDef {
  test: any;
  isForm: boolean;
  name: symbol;
  order: number;
  constructor(name: symbol, test: any, isForm = false, order = 0) {
    this.name = name;
    this.isForm = isForm;
    this.test = test;
    this.order = order;
  }
}

const ORDER_LAST = Number.POSITIVE_INFINITY;

export const TESTS = new Map([
  [FORM_MAP, new TypeDef(FORM_MAP, isMap, true, 0)],
  [TYPE_SYMBOL, new TypeDef(TYPE_STRING, isSymbol, false, 3)],
  [FORM_ARRAY, new TypeDef(FORM_ARRAY, isArr, true, 1)],
  [FORM_FUNCTION, new TypeDef(FORM_FUNCTION, isFn, true, 2)],
  [TYPE_DATE, new TypeDef(TYPE_DATE, isDate, false, 3)],
  [FORM_OBJECT, new TypeDef(FORM_OBJECT, isObj, true, 4)],
  [TYPE_STRING, new TypeDef(TYPE_STRING, isStr, false, 5)],
  [TYPE_NUMBER, new TypeDef(TYPE_NUMBER, isNum, false, 6)],
  [FORM_VALUE, new TypeDef(FORM_VALUE, () => null, true, ORDER_LAST)],
]);

const typeKeys = Array.from(TESTS.keys());
let tests = sortBy(Array.from(TESTS.values()), 'order');

export function addTest(name, test, isForm = false, order = 0) {
  TESTS.set(name, new TypeDef(name, test, isForm, order));
  tests = sortBy(Array.from(TESTS.values()), 'order');
}

/**
 * detectForm is only concerned with containment patterns.
 * @param value
 */
export function detectForm(value): symbol {
  const tests = sortBy(Array.from(TESTS.values()), 'order');
  for (let i = 0; i < tests.length; ++i) {
    const def: TypeDef = tests[i];
    if (!def.isForm) continue;
    if (def.test(value)) {
      return def.name;
    }
  }

  return FORM_VALUE;
}

export function isCompound(type) {
  if (!typeKeys.includes(type)) {
    type = detectType(type);
  }
  return [FORM_ARRAY, FORM_MAP, FORM_OBJECT].includes(type);
}

export function detectType(value) {
  for (let i = 0; i < tests.length; ++i) {
    const def: TypeDef = tests[i];
    if (def.isForm) continue;
    if (def.test(value)) {
      return def.name;
    }
  }

  return detectForm(value);
}

export function hasKey(value, key, vType?: symbol) {
  if (!vType) {
    return hasKey(value, key, detectForm(value));
  }

  let isInValue = false;
  switch (vType) {
    case FORM_VALUE:
      isInValue = false;
      break;

    case FORM_OBJECT:
      isInValue = key in value;
      break;

    case FORM_MAP:
      isInValue = value.has(key);
      break;

    case FORM_ARRAY:
      if (!isArr(value) || isWhole(key)) {
        isInValue = false;
      } else {
        isInValue = key < value.length;
      }
      break;

    default:
      isInValue = false;
  }

  return isInValue;
}

/**
 * merge similar form
 * @param value
 * @param change
 * @param form
 */
export function amend(value, change, form: string | symbol = ABSENT) {
  if (!isThere(form)) {
    form = detectForm(value);
  }
  let out = value;
  switch (form) {
    case FORM_MAP:
      out = new Map(value);
      change.forEach((keyValue, key) => {
        out.set(key, keyValue);
      });
      break;

    case FORM_OBJECT:
      out = { ...value };
      Object.keys(change).forEach(key => {
        out[key] = change[key];
      });
      break;

    case FORM_ARRAY:
      out = [...value];
      change.forEach((item, index) => {
        out[index] = item;
      });
      break;
  }
  return out;
}

const FIND_SYMBOL = /Symbol\((.*:)?(.*)\)/;

/** used in a test filter to throw errors if the value deviates
 * from the leaf's expectations;
 * @param next
 * @param target
 */
export function testForType({ next, target }): string | null {
  if (target.type === TYPE_ANY) return null;
  let out: any = null;
  if (!target.type) {
    out = null;
  } else if (isFn(target.type)) {
    out = target.type(next);
  } else if (target.type === FORM_VALUE) {
    out = null;
  } else {
    const nextType = detectType(next);
    if (isArr(target.type)) {
      if (!target.type.includes(nextType)) {
        out = `type cannot be ${nextType
          .toString()
          .replace(FIND_SYMBOL, (_, _prefix, name) => name)}`;
      }
    } else if (nextType !== target.type) {
      out = `type must be ${target.type
        .toString()
        .replace(FIND_SYMBOL, (_, _prefix, name) => name)}`;
    }
  }
  return out;
}

export function returnOrError(fn, ...args) {
  if (typeof fn !== 'function') {
    throw new Error('returnOrError MUST be passed a function');
  }
  try {
    return fn(...args);
  } catch (err) {
    return err;
  }
}
