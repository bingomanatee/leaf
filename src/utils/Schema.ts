import { FormEnum, TypeEnum } from '../types';
import { ABSENT } from '../constants';
import { identity } from 'lodash-es';
import {
  e,
  isArr,
  isDate,
  isMap,
  isNum,
  isObj,
  isStr,
  isSymbol,
  returnOrError,
} from './tests';
import {BranchSchemaIF} from "../types/branch.types";

export abstract class Schema {
  static validate(schema: BranchSchemaIF, value) {
    const bad = name => {
      Schema.bad(name, value, schema);
    };

    if (!schema || value === ABSENT) {
      return;
    }

    if (Array.isArray(schema)) {
      if (schema.length === 0) {
        return;
      }
      if (schema.length === 1) {
        return Schema.validate(schema[0], value);
      }

      const errors = schema
        .map(subSchema => {
          return returnOrError(() => {
            Schema.validate(subSchema, value);
          });
        })
        .filter(identity);
      if (errors.length === schema.length) {
        bad('did not satisfy any of the schema');
      }
      return; // AT LEAST ONE  of the schema was non-erroneus
    }
    // else not an array

    switch (schema) {
      case FormEnum.array:
        if (!isArr(value)) {
          bad('Array');
        }
        break;

      case FormEnum.map:
        if (!isMap(value)) {
          bad('Map');
        }
        break;

      case FormEnum.object:
        if (!isObj(value)) {
          bad('Object');
        }
        break;

      case FormEnum.scalar:
        if (isObj(value) || isMap(value) || isArr(value)) {
          bad('scalar');
        }
        break;

      case TypeEnum.date:
        if (!isDate(value)) {
          bad('Date');
        }
        break;

      case TypeEnum.null:
        if (!isDate) {
          bad('null');
        }
        break;

      case TypeEnum.string:
        if (!isStr(value)) {
          bad('string');
        }
        break;

      case TypeEnum.number:
        if (!isNum(value)) {
          bad('number');
        }
        break;

      case TypeEnum.symbol:
        if (!isSymbol(value)) {
          bad('symbol');
        }
        break;

      default:
        if (typeof schema === 'function') {
          return returnOrError(schema(value));
        }
    }
  }

  static bad(name, value, schema) {
    throw e('must be a ' + name, { value, schema });
  }
}
