export abstract class Time {
  static get next(): number {
    Time._second += 1;
    return Time.second;
  }

  protected static _second = 0;

  static get second() {
    return Time._second;
  }

  public static clear() {
    Time._second = 0;
  }
}
