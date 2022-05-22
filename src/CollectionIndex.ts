import {
  ABSENT,
  collectionObj,
  idStatefulDataObj,
  indexTestFn,
  timeValue,
} from './types';

export class CollectionIndex {
  yes = new Set<timeValue>();
  no = new Set<timeValue>();
  index = new Map<any, timeValue | Set<timeValue>>();

  private readonly unique: boolean;
  private readonly binary: boolean;
  private collection: collectionObj;
  name: string;
  private readonly test: indexTestFn;
  private readonly onlyYes: boolean;

  constructor(name: string, collection, test: indexTestFn, opts?) {
    this.unique = !!opts?.unique;
    this.binary = !!opts?.binary;
    this.onlyYes = !!opts?.onlyYes;
    this.collection = collection;
    this.name = name;
    this.test = test;

    this._listen();
  }

  _listen() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.collection.on('index', (record, action?: string) => {
      if (action === 'add') {
        this.recordAdded(record);
      }
      if (action === 'delete') {
        this.recordDeleted(record);
      }
    });
  }

  recordAdded(record: idStatefulDataObj) {
    const key = this.test(record);
    if (this.binary) {
      if (key) {
        this.yes.add(record.time);
      } else if (!this.onlyYes) {
        this.no.add(record.time);
      }
    } else {
      if (this.unique) {
        this.index.set(key, record.time);
      } else {
        if (!this.index.has(key)) {
          this.index.set(key, new Set());
        }
        let recordSet = this.index.get(key);
        if (!(recordSet instanceof Set)) {
          recordSet = new Set();
          this.index.set(key, recordSet);
        }
        recordSet.add(record.time);
      }
    }
  }

  recordDeleted(record: idStatefulDataObj) {
    if (this.binary) {
      this.yes.delete(record.time);
      this.no.delete(record.time);
    } else {
      // key not found
      this.index.forEach((recordSet, key) => {
        if (recordSet instanceof Set) {
          recordSet.delete(record.time);
        }
        if (!this.unique) {
          if (recordSet === record.time) {
            this.index.delete(key);
          }
        }
      });
    }
  }

  timesForKey(key = ABSENT): timeValue[] {
    if (this.binary) {
      return Array.from(key ? this.yes : this.no);
    }
    if (!this.index.has(key)) {
      return [];
    }
    const result = this.index.get(key);
    if (!result) {
      return [];
    }
    if (result instanceof Set) {
      return Array.from(result.values());
    }
    return [result];
  }

  recordsForKey(key): idStatefulDataObj[] {
    return this.timesForKey(key).reduce(
      (list: idStatefulDataObj[], id: timeValue) => {
        const record = this.collection.get(id);
        if (record) {
          list.push(record);
        }
        return list;
      },
      []
    );
  }
}
