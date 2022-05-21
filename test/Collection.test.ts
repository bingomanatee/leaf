import { Collection } from '../src';
import { Stateful } from '../src/Stateful';
import { Time } from '../src/Time';
import {collectionObj, idStatefulObj} from '../src/types';

class DataItem extends Stateful implements idStatefulObj {
  data: any;
  time: number;
  coll: Collection;

  constructor(coll, data) {
    super();
    this.coll = coll;
    this.time = Time.next;
    this.data = data;
  }
}

const dataItemCreator = (coll: collectionObj, value) => new DataItem(coll, value);

describe('Collection', () => {
  beforeEach(() => {
    Time.clear();
  });
  it('creates a named collection', () => {
    const c = new Collection('foo', dataItemCreator);
    expect(c.name).toBe('foo');
  });

  describe('add/get/has', () => {
    const c = new Collection('foo', dataItemCreator);
    const addTime = c.add('bar');
    expect(c.has(addTime)).toBeTruthy();
    expect(c.get(addTime)?.data).toBe('bar');
  });

  describe('delete', () => {
    describe('add/get/has', () => {
      const c = new Collection('foo', dataItemCreator);
      const addTime = c.add('bar');
      const addTime2 = c.add('barella');
      c.delete(addTime2);
      expect(c.has(addTime)).toBeTruthy();
      expect(c.has(addTime2)).toBeFalsy();
    });
  });

  describe('indexes', () => {
    describe('keyed', () => {
      it('returns a collection of items based on a computed value', () => {
        const c = new Collection('foo', dataItemCreator);
        c.index('roundValue', record => {
          if (!(record && typeof record.data == 'number')) {
            return 0;
          }
          return Math.floor(record.data);
        });

        c.add(10);
        c.add(10.5);
        c.add(20);
        const tTime = c.add(20.5);
        c.add(20.75);

        let tens = c.indexRecords('roundValue', 10);
        expect(tens?.map(({ data }) => data)).toEqual([10, 10.5]);

        let twenties = c.indexRecords('roundValue', 20);
        expect(twenties?.map(({ data }) => data)).toEqual([20, 20.5, 20.75]);

        let thirties = c.indexRecords('roundValue', 30);
        expect(thirties?.length).toBe(0);

        c.delete(tTime);

        expect(tens?.map(({ data }) => data)).toEqual([10, 10.5]);

        tens = c.indexRecords('roundValue', 10);
        expect(tens?.map(({ data }) => data)).toEqual([10, 10.5]);

        twenties = c.indexRecords('roundValue', 20);
        expect(twenties?.map(({ data }) => data)).toEqual([20, 20.75]);

        thirties = c.indexRecords('roundValue', 30);
        expect(thirties?.length).toBe(0);
      });

      describe('unique', () => {
        const c = new Collection('foo', dataItemCreator);
        c.index('name', record => {
          return record.data.name;
        });

        c.add({ name: 'Bob', age: 10 });
        const mayTime = c.add({ name: 'May', age: 20 });

        c.add({ name: 'Sue', age: 30 });

        const mays = c.indexRecords('name', 'May');

        expect(mays[0]?.data.age).toBe(20);
        expect(mays?.length).toBe(1);

        c.delete(mayTime);

        expect(c.indexRecords('name', 'May').length).toBe(0);
      });
    });
  });
});
