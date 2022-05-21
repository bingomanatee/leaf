/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  collectionIndexObj,
  collectionObj,
  idStatefulDataObj,
  indexOptions,
  indexTestFn,
  StateEnum,
  timeValue,
} from './types';
import EventEmitter from 'emitix';
import { CollectionIndex } from './CollectionIndex';

export class Collection extends EventEmitter implements collectionObj {
  name: any;
  private _timeIndex: Map<timeValue, idStatefulDataObj> = new Map();
  indexes = new Map<string, collectionIndexObj>();

  private readonly _creator: (
    collection: collectionObj,
    data: any
  ) => idStatefulDataObj;
  // @ts-ignore
  private _context: any;
  constructor(
    name,
    recordCreator: (collection: collectionObj, data: any) => idStatefulDataObj,
    context?: any
  ) {
    super();
    this.name = name;
    this._creator = recordCreator;
    this._context = context;
  }

  get context() {
    return this._context;
  }

  add(data) {
    const record = this._creator(this, data);
    this._timeIndex.set(record.time, record);
    this.emit('index', record, 'add');
    this.emit('added', record);
    return record.time;
  }

  get(time): idStatefulDataObj | undefined {
    return this._timeIndex.get(time);
  }

  has(time) {
    return this._timeIndex.has(time);
  }

  delete(time): idStatefulDataObj | undefined {
    const record = this.get(time);
    if (!record) {
      return;
    }
    if (record && record.isActive) {
      record.complete();
    }
    this._timeIndex.delete(time);
    this.emit('index', record, 'delete');
    this.emit('deleted', record);
    return record;
  }

  doState(time: timeValue, method: string, value?: any) {
    if (!this.has(time)) return undefined;
    const record = this.get(time);
    if (record) {
      const lastState = record.state;
      switch (method) {
        case 'fail':
          record.fail(value);
          break;

        case 'complete':
          record.complete();
          break;

        case 'accept':
          record.accept();
          break;

        case 'remove':
          record.remove();
          break;
      }
      this.emit('index', record, 'stateChange');
      this.emit('stateChange', record, lastState);
      return record;
    }
    return undefined;
  }
  // @ts-ignore
  setState(time: timeValue, state: StateEnum): idStatefulDataObj | undefined {
    if (!this.has(time)) return;
    const record = this.get(time);
    if (record && record.state !== state) {
      const lastState = record.state;
      record.state = state;
      this.emit('index', record, 'doState');
      this.emit('stateChange', record, lastState);
      return record;
    }
    return undefined;
  }

  get all(): idStatefulDataObj[] {
    return Array.from(this._timeIndex.values());
  }

  get active() {
    return this.all.filter(record => record.isActive);
  }

  // ----------- indexes ---------------

  public index(
    name,
    test?: indexTestFn,
    opts?: indexOptions
  ): collectionIndexObj | undefined {
    if (test) {
      this.indexes.set(name, new CollectionIndex(name, this, test, opts));
    }
    return this.indexes.get(name);
  }

  indexRecords(name, key): idStatefulDataObj[] {
    if (!this.indexes.has(name)) {
      return [];
    }
    return this.indexes.get(name)?.recordsForKey(key) || [];
  }
}
