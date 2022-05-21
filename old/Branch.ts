import {
  branchable,
  branchObj,
  configMap,
  configType,
  nanoID,
  timeObj,
} from '../src/types';
import { e } from '../src/utils/tests';
import { Time } from './Time';
import { Stateful } from './Stateful';
import { toMap } from '../src/utils/conversion';

/**
 * represents a directional join from the object represented by source
 * to the object represented by dest.
 *
 * it is stateful in that if it is not active it is not considered "live".
 *
 * note - branches do not have "ids" as such - their identity is the net sum
 * of their values.
 *
 * it can be considered as a verb
 * as in, "join(or break) a and b at [time]"
 */
export class Branch extends Stateful implements branchObj, timeObj {
  readonly forest?: any;
  readonly source: string;
  readonly dest: string;
  readonly time: number;
  readonly del: boolean;

  constructor(
    source: nanoID,
    dest: nanoID,
    configs?: configType,
    forest?: any
  ) {
    super();
    if (!(source && dest)) {
      throw e('invalid branch - missing source &/or dest', {
        configs,
        source,
        dest,
      });
    }
    if (source === dest) {
      throw e('cannot create circular-reference', { configs, source, dest });
    }
    this.source = source;
    this.dest = dest;
    this.time = Time.next;

    const configMap = toMap(configs);
    this.del = configMap?.get('del');
    this.forest = forest || configMap?.get('forest');
  }

  static eq(branch: branchObj, otherBranch: branchObj) {
    return (
      otherBranch.source === branch.source && otherBranch.dest === branch.dest
    );
  }

  static includes(branch: branchObj, id: nanoID) {
    return branch.source === id || branch.dest === id;
  }

  /**
   * a convenience utility for linking two nodes.
   * Note - it does NOT fire off any validation/cachebusting events,
   * OR put the branch into a forest --
   * it just creates the branch record.
   * @param t1
   * @param t2
   * @param configs
   */
  static between(t1: branchable, t2: branchable, configs?: configMap) {
    return new Branch(t1.id, t2.id, configs);
  }
}
