import { timeValue, timeObj } from '../src/types';

export abstract class Time {
  protected static _now = 0;
  public static readonly NEVER_TIME = -1;

  static get next(): timeValue {
    Time._now += 1;
    return Time.now;
  }

  static get now(): timeValue {
    return Time._now;
  }

  public static clear() {
    Time._now = 0;
  }

  public static byTime(t1: timeObj, t2: timeObj) {
    return t2.time - t1.time;
  }
}
