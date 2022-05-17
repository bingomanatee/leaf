import { Time } from './Time';
import { ABSENT } from './constants';
import { isFn, isThere } from './utils/tests';
import { statefulObj, timeValue } from './types';

/**
 * a function that returns the same value until time changes.
 * The return value is preserved until time changes. Unlike memoized
 * functions, the cache is smaller
 *
 * @param generator {function} a lambda that takes the target and returns a value.
 * @param target {statefulObj} optional - an object whose values and activeness affect the outcome.
 * @param onError
 * @param args
 *
 * @returns () => any
 */
export default function cache({
  generator,
  target,
  onError,
  afterInactive,
}: {
  generator: (target: any) => any;
  target?: any;
  onError?: (error: any, target: statefulObj, isInactive?: boolean) => void;
  afterInactive?: (target: statefulObj) => any;
}): () => any {
  let currentValue: any = ABSENT;
  let currentTime: timeValue = Time.NEVER_TIME;
  let inactiveValue: any = ABSENT;

  return () => {
    if (target && 'state' in target && !target.isActive) {
      if (isFn(afterInactive)) {
        if (inactiveValue === ABSENT) {
          try {
            inactiveValue = afterInactive
              ? afterInactive(target)
              : generator(target);
          } catch (err) {
            if (onError && isFn(onError)) {
              onError(err, target, true);
            }
            inactiveValue = undefined;
          }
        }
        return inactiveValue;
      }
    }
    // if afterInactive is not a function do not freeze cacched value
    // regardless of the targets' state.
    if (Time.now === currentTime) {
      return currentValue;
    }
    try {
      currentTime = Time.now;
      currentValue = generator(target);
    } catch (err) {
      currentValue = ABSENT;
      if (onError && isFn(onError)) {
        onError(err, target);
      }
    }

    return isThere(currentValue) ? currentValue : undefined;
  };
}
