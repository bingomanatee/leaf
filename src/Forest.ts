import { Collection } from './Collection';
import { Node } from './Node';
import { Branch } from './Branch';
import { Tree } from './Tree';
import { NodeValueChange } from './NodeValueChange';
import { Trans } from './Trans';
import {
  ABSENT,
  cacheFn,
  collectionObj,
  nodeInitObj,
  tablesObj,
  transData,
} from './types';
import { returnOrError } from './utils/tests';

export class Forest {
  trees: collectionObj;
  nodes: collectionObj;
  branches: collectionObj;
  nodeValueChanges: collectionObj;
  transColl: collectionObj;

  constructor() {
    this.nodes = new Collection(
      'nodes',
      (table: collectionObj, data: nodeInitObj) => new Node(table, data),
      this
    );
    this.branches = new Collection(
      'branches',
      (branches: collectionObj, data) => new Branch(branches, data),
      this
    );

    this.branches.index('node', record => {
      const branch = record as Branch;
      return branch.nodeId;
    });
    this.branches.index('target', record => {
      const branch = record as Branch;
      return branch.targetId;
    });

    this.trees = new Collection(
      'trees',
      (trees: collectionObj, data) => new Tree(trees, data),
      this
    );
    this.trees.index(
      'rootNodeId',
      record => {
        const tree = record as Tree;
        return tree.rootNodeId;
      },
      { unique: true }
    );

    this.nodeValueChanges = new Collection(
      'nodeValueChanges',
      (nvc: collectionObj, change) => new NodeValueChange(nvc, change),
      this
    );
    this.nodeValueChanges.index('node', change => change.nodeId);

    this.transColl = new Collection(
      'trans',
      (nvc: collectionObj, data: transData) => new Trans(nvc, data),
      this
    );

    this._watchNodeChangesForValidation();
  }

  _watchNodeChangesForValidation() {
    this.nodeValueChanges.on('added', record => {
      if (this.validationActive) {
        const change = record as NodeValueChange;
        if (record?.node) {
          const error = returnOrError(() => change.node?.validate());
          if (error) {
            change.fail(error);
            this.nodeValueChanges.delete(change.time);
            throw error;
          }
          change.node?.parents().forEach(parent => {
            parent.validate();
          });
        }
      }
    });
  }

  addTree(name, value, configs?) {
    this.trees.add({ name, value, configs });
  }

  private _validationActiveCache?: (() => boolean) | null = null;

  get validationActive() {
    if (!this._validationActiveCache) {
      this._validationActiveCache = this.cache(
        forest => {
          return !forest.transColl.active.some(
            trans => (trans as Trans).noValidation
          );
        },
        { transColl: true }
      );
    }
    return !!this._validationActiveCache();
  }

  transact(message: any, action: (forest?: Forest) => any) {
    const transId = this.transColl.add(message);
    let out: any = null;
    try {
      out = action(this);
    } catch (err) {
      this.transColl.doState(transId, 'fail', err);
      this.transColl.delete(transId);
      throw err;
    }
    this.transColl.doState(transId, 'complete');
    this.transColl.delete(transId);
    return out;
  }

  /**
   *
   * @param generator:  {(forest: any) => any} a method that computes a value
   * @param tables  {tableObj} an object that defines the tables to watch
   */
  cache(generator: (forest: any) => any, tables: tablesObj): cacheFn {
    let cached = ABSENT;
    const context = this;
    Object.keys(tables).forEach(tableName => {
      try {
        const table = this[tableName];
        if (table instanceof Collection) {
          const ivValue = tables[tableName];
          const listener = (message, value) => {
            if (typeof ivValue === 'function') {
              if (ivValue(message, value, tableName, this)) {
                cached = ABSENT;
              }
            } else {
              if (tables[tableName]) {
                cached = ABSENT;
              }
            }
          };
          table.on('added', value => listener('added', value));
          table.on('deleted', value => listener('deleted', value));
          table.on('stateChange', value => listener('stateChange', value));
        }
      } catch (err) {
        console.warn('bad table get', err);
      }
    });
    return function() {
      if (cached === ABSENT) {
        cached = generator(context);
      }
      return cached;
    };
  }
}
