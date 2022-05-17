import { detectForm, detectType, isThere } from './tests';
import { DefEnum, FormEnum, TypeEnum } from '../types';

export function setKey(target, keyValue, key, form?: DefEnum) {
  if (!isThere(form)) {
    form = detectForm(target);
  }
  const out = target;
  switch (form) {
    case FormEnum.map:
      out.set(key, keyValue);
      break;

    case FormEnum.object:
      try {
        out[key] = keyValue;
      } catch (err) {
        console.warn('illegal key ', key, 'for target', target);
      }
      break;

    case FormEnum.array:
      out[key] = keyValue;
      break;
  }
  return out;
}

export function clone(value, type?: DefEnum) {
  if (!isThere(type)) {
    type = detectType(value);
  }
  let out = value;
  switch (type) {
    case FormEnum.map:
      out = new Map(value);
      break;

    case FormEnum.object:
      out = { ...value };
      break;

    case FormEnum.array:
      out = [...value];
      break;

    case TypeEnum.date:
      out = new Date(value);
      break;
  }
  return out;
}

export function iterate(value, fn, type?: DefEnum) {
  if (!isThere(type)) {
    type = detectForm(value);
  }

  switch (type) {
    case FormEnum.map:
      value.forEach(fn);
      break;

    case FormEnum.object:
      Object.keys(value).forEach(key => fn(value[key], key));
      break;

    case FormEnum.array:
      value.forEach(fn);
      break;

    default:
      console.warn('cannot iterate type ', type, 'of', value);
  }
}

// deprecated -- use create
export function makeNew(type: DefEnum, isInstance = false) {
  if (isInstance) {
    return makeNew(detectForm(type));
  }

  let out: any = null;
  switch (type) {
    case FormEnum.map:
      out = new Map();
      break;

    case FormEnum.array:
      out = [];
      break;

    case FormEnum.object:
      out = {};
      break;
  }

  return out;
}
