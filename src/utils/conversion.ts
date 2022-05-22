import {
  detectForm,
  e,
  isArr,
  isFn,
  isMap,
  isNum,
  isObj,
  isStr,
  isThere,
} from './tests';
import { DefEnum, FormEnum, TypeEnum } from '../types';

/**
 * @returns {Map}  a javascript Map instance, with the same content as the input
 *
 * @param m {any} any object - ideally, a compound
 *    in which case the return value has the same key/value content
 * @param cloneMe {boolean} if a map is passed the same map will be returned --
 *    UNLESS cloneMe is true, in which case an identical copy is returned
 */
export function toMap(m: any, cloneMe = false) {
  if (m instanceof Map) {
    return cloneMe ? new Map(m) : m;
  }
  const map = new Map();
  if (!m) {
    return map;
  }

  if (isArr(m)) {
    m.forEach((value, index) => map.set(index, value));
  } else if (isObj(m)) {
    Object.keys(m).forEach(key => map.set(key, m[key]));
  } // else - return empty map
  return map;
}

export function toArr(m) {
  return isArr(m) ? m : [m];
}

/**
 * returns a POJO object equivalent to the input;
 * or the input itself if force !== true;
 * If a map is passed, its keys are forced into a POJO; unusable keys
 * are silently skipped.
 *
 * @param m
 * @param force {boolean} returns a clone of an input object; otherwise is a noop for POJOS
 * @returns {Object}
 */
export function toObj(m: any, force = false) {
  if (!(isObj(m) || isMap(m))) {
    throw e('cannot convert target to object', { target: m });
  }
  let out = m;
  if (isObj(m)) {
    if (force) {
      out = { ...m };
    }
  } else if (isMap(m)) {
    out = {};
    m.forEach((val: any, key: any) => {
      if (!(isNum(val) || isStr(val, true))) {
        return;
      }
      try {
        out[key] = val;
      } catch (e) {
        console.warn(
          'toObj map/object conversion -- skipping exporting of child key',
          key,
          'of ',
          m
        );
      }
    });
  }

  return out;
}

/**
 * returns the union of two values, combining dictionary key/values;
 * prefers the first parameter.
 *
 * for simple/scalar types returns the first parameter.
 *
 * @param base any
 * @param update any
 */
export function makeValue(base, update) {
  const baseType = detectForm(base);
  const updateType = detectForm(update);

  if (baseType !== updateType) {
    throw e('makeValue Type Mismatch', {
      base,
      update,
      baseType,
      updateType,
    });
  }

  let out = update;
  switch (baseType) {
    case FormEnum.map:
      out = new Map(base);
      update.forEach((val, key) => {
        out.set(key, val);
      });
      break;

    case FormEnum.object:
      out = { ...base, ...update };
      break;

    case FormEnum.array:
      out = [...base];
      update.forEach((val, key) => {
        if (isThere(val)) {
          out[key] = val;
        }
      });
      break;
  }
  return out;
}

/**
 * creates a platonic
 */
export function create(de: DefEnum) {
  let out: any = undefined;
  switch (de) {
    case FormEnum.map:
      out = new Map();
      break;

    case FormEnum.object:
      out = {};
      break;

    case FormEnum.array:
      out = [];
      break;

    case TypeEnum.number:
      out = 0;
      break;

    case TypeEnum.date:
      out = new Date();
      break;

    case TypeEnum.string:
      out = '';
      break;

    case TypeEnum.null:
      out = null;
      break;
  }
  return out;
}

export function mapReduce(
  map: Map<any, any>,
  fn: (out: any, value: any, name: any, map: Map<any, any>) => any,
  initial: any = {}
) {
  if (isFn(initial)) {
    return mapReduce(map, fn, initial());
  }

  let out = initial;

  map.forEach((value, name) => {
    out = fn(out, value, name, map);
  });

  return out;
}
