/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isNumber, sortBy } from 'lodash-es';
import { DefEnum, FormEnum, TypeEnum } from '../types';
import { ABSENT } from './../types';

export function isThere(item) {
  return ![ABSENT, undefined].includes(item);
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
  name: DefEnum;
  order: number;
  constructor(name: DefEnum, test: any, isForm = false, order = 0) {
    this.name = name;
    this.isForm = isForm;
    this.test = test;
    this.order = order;
  }
}

const ORDER_LAST = Number.POSITIVE_INFINITY;

// @ts-ignore
export const TESTS = new Map([
  [FormEnum.map, new TypeDef(FormEnum.map, isMap, true, 0)],
  [TypeEnum.symbol, new TypeDef(TypeEnum.symbol, isSymbol, false, 3)],
  [FormEnum.array, new TypeDef(FormEnum.array, isArr, true, 1)],
  [FormEnum.function, new TypeDef(FormEnum.function, isFn, true, 2)],
  [TypeEnum.date, new TypeDef(TypeEnum.date, isDate, false, 3)],
  [FormEnum.object, new TypeDef(FormEnum.object, isObj, true, 4)],
  [TypeEnum.string, new TypeDef(TypeEnum.string, isStr, false, 5)],
  [TypeEnum.number, new TypeDef(TypeEnum.number, isNum, false, 6)],
  [FormEnum.scalar, new TypeDef(FormEnum.scalar, () => true, true, ORDER_LAST)],
]);

const typeKeys = Array.from(TESTS.keys());
let tests = sortBy(Array.from(TESTS.values()), 'order');

/**
 * allow custom form/type definitions by application developer;
 * @param name
 * @param test
 * @param isForm
 * @param order
 */
export function addTest(name, test, isForm = false, order = 0) {
  TESTS.set(name, new TypeDef(name, test, isForm, order));
  tests = sortBy(Array.from(TESTS.values()), 'order');
}

/**
 * detectForm is only concerned with containment patterns.
 * @param value
 */
export function detectForm(value): DefEnum {
  const tests = sortBy(Array.from(TESTS.values()), 'order');
  for (let i = 0; i < tests.length; ++i) {
    const def: TypeDef = tests[i];
    if (!def.isForm) continue;
    if (def.test(value)) {
      return def.name;
    }
  }

  return FormEnum.scalar;
}

export function isCompound(type) {
  if (!typeKeys.includes(type)) {
    type = detectType(type);
  }
  return [FormEnum.map, FormEnum.map, FormEnum.array, FormEnum.object].includes(
    type
  );
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

export function hasKey(value, key, vType?: DefEnum) {
  if (!vType) {
    return hasKey(value, key, detectForm(value));
  }

  let isInValue = false;
  switch (vType) {
    case FormEnum.scalar:
      isInValue = false;
      break;

    case FormEnum.object:
      isInValue = key in value;
      break;

    case FormEnum.map:
      isInValue = value.has(key);
      break;

    case FormEnum.array:
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
    case FormEnum.map:
      out = new Map(value);
      change.forEach((keyValue, key) => {
        out.set(key, keyValue);
      });
      break;

    case FormEnum.object:
      out = { ...value };
      Object.keys(change).forEach(key => {
        out[key] = change[key];
      });
      break;

    case FormEnum.array:
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
  if (target.type === TypeEnum.any) return null;
  let out: any = null;
  if (!target.type) {
    out = null;
  } else if (isFn(target.type)) {
    out = target.type(next);
  } else if (target.type === FormEnum.scalar) {
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
