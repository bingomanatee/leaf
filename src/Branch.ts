import { nodeID, StateEnum } from './types';
import { e } from './utils/tests';
import { Time } from './Time';

export class Branch {
  readonly forest?: any;
  readonly source: string;
  readonly dest: string;
  state: StateEnum;
  readonly time: number;
  readonly del: boolean;

  constructor(
    source: nodeID,
    dest: nodeID,
    { forest = undefined, del = false }
  ) {
    if (!(source && dest)) {
      throw e('invalid branch - missing source &/or dest', {
        forest,
        source,
        dest,
      });
    }
    if (source === dest) {
      throw e('cannot create circular-reference', { forest, source, dest });
    }
    this.forest = forest;
    this.source = source;
    this.dest = dest;
    this.state = StateEnum.new;
    this.time = Time.next;
    this.del = del;
  }

  eq({ source, dest }) {
    return source === this.source && dest === this.dest;
  }
}
