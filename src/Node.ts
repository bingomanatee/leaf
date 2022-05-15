/* eslint-disable @typescript-eslint/ban-ts-comment */
import { nanoid } from 'nanoid';
import { nodeID, StateEnum, TimeValue, valueKey, valueMap } from './types';
import { Time } from './Time';
import { Forest } from './Forest';
import { DELETE, VALUES } from './constants';
import { Branch } from './Branch';

export class NodeChange {
  readonly changes: Map<valueKey, any>;
  readonly target: string;
  state: StateEnum;
  readonly time: number;
  error?: any;
  readonly id: string;

  constructor(target, changes: Map<valueKey, any>) {
    this.target = target;
    this.id = nanoid();
    this.changes = changes;
    this.state = StateEnum.new;
    this.time = Time.next;
  }

  get(key: valueKey) {
    return this.changes?.get(key);
  }

  has(key: valueKey) {
    return this.changes.has(key);
  }
}

export default class Node {
  readonly time: number;
  private _parents?: nodeID[];
  private _children?: nodeID[];
  get history(): Map<TimeValue, NodeChange> | undefined {
    return this._history;
  }

  get values(): valueMap | undefined {
    return this._values;
  }

  id: nodeID;
  private _values?: valueMap;
  private _history?: Map<TimeValue, NodeChange>;
  forest?: Forest;
  state: StateEnum;
  public debug = false;
  private _branches: Branch[] = [];

  constructor({ forest, values }: { forest?: Forest; values?: valueMap }) {
    this.id = nanoid();
    if (forest) {
      this.forest = forest;
      this.forest.nodes.set(this.id, this);
    }
    if (values) {
      this._values = values;
    }
    this.state = StateEnum.new;
    this.time = Time.next;
  }

  change(changes: valueMap) {
    return this.addChange(new NodeChange(this.id, changes));
  }

  addChange(change: NodeChange) {
    if (!this._history) {
      this._history = new Map<TimeValue, NodeChange>();
    }
    this._history.set(change.time, change);
    this.computeValues(change);
    const values = change.get(VALUES);
    if (values instanceof Map) {
      this._values = values;
    }
    return change;
  }

  _findBasis() {
    // @ts-ignore
    const keys = Array.from(this.history?.keys());
    if (!keys) return;
    const times = keys.sort().reverse();
    let basis: valueMap | null = null;
    let timeFrom = -1;
    for (let t = 0; t < times.length; ++t) {
      const time = times[t];
      const change = this.history?.get(time);
      if (change) {
        if (change.has(VALUES)) {
          basis = change.get(VALUES);
          timeFrom = time;
          break;
        }
      }
    }

    return { basis, timeFrom };
  }

  computeValues(sourceChange: NodeChange) {
    if (!this._history) {
      return;
    }

    const keys = Array.from(this._history.keys());
    // eslint-disable-next-line prefer-const
    let { basis, timeFrom = -1 } = this._findBasis() || {};
    if (!basis) {
      basis = new Map<valueKey, any>(this.values);
    }

    keys
      .sort()
      .filter(time => time > timeFrom)
      .forEach(changeTime => {
        const change = this._history?.get(changeTime);
        if (change && basis) {
          change.changes.forEach((value, name) => {
            if (basis) {
              if (value === DELETE) {
                basis.delete(name);
              } else {
                basis.set(name, value);
              }
            }
          });
        }
      });

    sourceChange.changes.set(VALUES, basis);
    return basis;
  }

  set(key: valueKey, value) {
    return this.change(
      new Map<valueKey, any>([[key, value]])
    );
  }

  get(key: valueKey) {
    return this.values?.get(key);
  }

  has(key) {
    return this.values?.has(key) || false;
  }

  delete(key: valueKey) {
    return this.set(key, DELETE);
  }

  /* --------- branches --------------- */

  get parents(): nodeID[] {
    if (!this._parents) {
      this._parents = this._branches
        .filter(b => b.dest === this.id)
        .map(({ source }) => source)
        .sort();
    }
    return this._parents;
  }
  get children(): nodeID[] {
    if (!this._children) {
      this._children = this._branches
        .filter(b => b.source === this.id)
        .map(({ dest }) => dest)
        .sort();
    }
    return this._children;
  }

  addBranch(branch: Branch, ...other: Branch[]) {
    if (!(branch.source === this.id || branch.dest === this.id)) {
      if (this.debug) console.warn('misapplied branch', this, branch);
    } else {
      if (branch.del) {
        this._branches = this._branches.filter(otherBranch => {
          return !otherBranch.eq(branch);
        });
      }
      this._branches.push(branch);
      if (this.id === branch.source) {
        delete this._children;
      } else {
        delete this._parents;
      }
    }

    if (other) {
      other.forEach(b => this.addBranch(b));
    }
  }

  /* --------- pointers to last change ---------- */

  get _changeTimes() {
    const times: number[] = [];
    this.history?.forEach((_v, key) => {
      times.push(key);
    });
    return times.sort();
  }

  get _lastChangeTime() {
    return Math.max(...this._changeTimes);
  }

  private _lc?: NodeChange;
  private _lcs?;
  get lastChange() {
    if (!this.history) {
      return undefined;
    }
    // return cached if available
    if (this.history?.size === this._lcs) {
      return this._lc;
    }

    const index = this._lastChangeTime;
    this._lc = this.history?.get(index);
    this._lcs = this.history?.size;
    return this._lc;
  }
}
