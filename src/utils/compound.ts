import {
  ABSENT,
  FORM_ARRAY,
  FORM_MAP,
  FORM_OBJECT,
  TYPE_DATE,
} from '../constants';
import { detectForm, detectType, isThere } from './tests';

export function setKey(target, keyValue, key, form: string | symbol = ABSENT) {
  if (!isThere(form)) {
    form = detectForm(target);
  }
  const out = target;
  switch (form) {
    case FORM_MAP:
      out.set(key, keyValue);
      break;

    case FORM_OBJECT:
      try {
        out[key] = keyValue;
      } catch (err) {
        console.warn('illegal key ', key, 'for target', target);
      }
      break;

    case FORM_ARRAY:
      out[key] = keyValue;
      break;
  }
  return out;
}

export function clone(value, type: symbol | string = ABSENT) {
  if (!isThere(type)) {
    type = detectType(value);
  }
  let out = value;
  switch (type) {
    case FORM_MAP:
      out = new Map(value);
      break;

    case FORM_OBJECT:
      out = { ...value };
      break;

    case FORM_ARRAY:
      out = [...value];
      break;

    case TYPE_DATE:
      out = new Date(value);
      break;
  }
  return out;
}

export function iterate(value, fn, type: symbol | string = ABSENT) {
  if (!isThere(type)) {
    type = detectForm(value);
  }

  switch (type) {
    case FORM_MAP:
      value.forEach(fn);
      break;

    case FORM_OBJECT:
      Object.keys(value).forEach(key => fn(value[key], key));
      break;

    case FORM_ARRAY:
      value.forEach(fn);
      break;

    default:
      console.warn('cannot iterate type ', type, 'of', value);
  }
}

export function makeNew(type, isInstance = false) {
  if (isInstance) {
    return makeNew(detectForm(type));
  }

  let out: any = null;
  switch (type) {
    case FORM_MAP:
      out = new Map();
      break;

    case FORM_ARRAY:
      out = [];
      break;

    case FORM_OBJECT:
      out = {};
      break;
  }

  return out;
}
