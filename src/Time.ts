import { TimeValue } from './types';

export abstract class Time {
  static get next(): TimeValue {
    Time._second += 1;
    return Time.second;
  }

  protected static _second = 0;

  static get second(): TimeValue {
    return Time._second;
  }

  public static clear() {
    Time._second = 0;
  }
}
