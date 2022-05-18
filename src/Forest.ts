import { nanoid } from 'nanoid';
import Node from './Node/Node';
import {
  branchObj,
  compoundKey,
  configMap,
  configType,
  nanoID,
  nanoIdObj,
  StateEnum,
  timeObj,
  timeValue,
} from './types';
import { Branch } from './Branch';
import EventEmitter from 'emitix';
import { Trans } from './Trans';
import { Time } from './Time';
import { NodeConfigChange } from './Node/NodeConfigChange';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
} from 'rxjs';
import { e } from './utils/tests';
import { NodeValueChange } from './Node/NodeValueChange';

export class Forest extends EventEmitter {
  readonly name: string;
  readonly history = new Map<timeValue, any>();
  nodes = new Map<string, Node>();
  pending = new Set<Trans>();

  constructor(name?: string) {
    super();
    this.name = name || nanoid();
    this._listenForHistory();
    this._listenForBranch();
    this._listenNode();
    this._listenForTrans();
  }

  makeNode(value, name?, configs?: configType): Node {
    const node = new Node(value, name, configs, this);
    this.emit('setHistory', node);
    this.emit('node', node);
    return node;
  }

  node(id): Node | undefined {
    return this.nodes.get(id);
  }
  changeNodeConfig(
    id: string,
    changes: configMap
  ): NodeConfigChange | undefined {
    const target = this.node(id);
    if (target) {
      const change = target.changeConfig(changes);
      this.emit('setHistory', change);
      try {
        this.emit('validateNode', target);
        if (change.isActive) {
          change.accept();
        }
      } catch (err) {
        change.fail(err);
        this.emit('updateHistory', change);
        target.revertConfig(change);
      }
      //todo: broadcast, resolve change;
      return change;
    }
    return undefined;
  }

  changeNodeValue(id: nanoID, value: any): NodeConfigChange | undefined {
    const target = this.node(id);
    if (target) {
      const change = target.next(value);
      this.emit('setHistory', change);
      try {
        this.emit('changeNodeValue', target);
        if (change.isActive) {
          change.accept();
          this.emit('updateHistory', change);
        }
      } catch (err) {
        change.fail(err);
        this.emit('updateHistory', change);
        this.emit('changeNodeValueError', target, target.value, err);
        target.next(change.current);
        throw err;
      }
      //todo: broadcast, resolve change;
      return change;
    }
    return undefined;
  }

  addBranches(branches: branchObj[]) {
    branches.forEach(branch => this.addBranch(branch));
  }

  addBranch(branch: branchObj) {
    this.branches.push(branch);
    this.emit('setHistory', branch);
    this.emit('branch', branch);
  }
  branch(source: nanoID, dest: nanoID, del = false): branchObj {
    const branch = new Branch(source, dest, {
      del: del,
    }); // can throw
    this.addBranch(branch);
    return branch;
  }
  makeChildNode(
    rootId: nanoID,
    value: any,
    name: compoundKey,
    config?: configType
  ) {
    const node = this.makeNode(value, name, config);
    this.branch(rootId, node.id);
    return node;
  }
  branchNodes(n1: nanoIdObj, n2: nanoIdObj, del = false): branchObj {
    return this.branch(n1.id, n2.id, del);
  }

  _listenForBranch() {
    this.on('branch', () => {
      this.emit('validateNodes');
    });
  }

  private _listenNode() {
    this.on('node', (node: Node) => {
      this.nodes.set(node.id, node);
      this.emit('setHistory', node);
      this.emit('validateNodes');
    });
    this.on('changeNodeValue', () => {
      this.emit('validateNodes');
    });
    this.on('validateNodes', () => {
      this.nodes.forEach(node => {
        if (node.isActive) {
          node.validate();
        }
      });
    });
  }

  public transact(mutate: (forest: Forest, trans: Trans) => void) {
    const trans = new Trans(this);
    this.emit('trans-start', trans);
    try {
      mutate(this, trans);
      this.emit('trans-end', trans);
    } catch (err) {
      this.emit('trans-rollback', trans, err);
      throw err;
    }
  }

  private _transCountSubject?: BehaviorSubject<number>;
  private get transCountSubject(): BehaviorSubject<number> {
    if (!this._transCountSubject) {
      this._transCountSubject = new BehaviorSubject(this.transactions.length);
    }
    this.on('trans-start', () => {
      this._transCountSubject?.next(this._transCountSubject.value + 1);
    });
    this.on('trans-end', () => {
      this._transCountSubject?.next(
        Math.max(this._transCountSubject.value - 1, 0)
      );
    });
    this.on('trans-rollback', () => {
      this._transCountSubject?.next(
        Math.max(this._transCountSubject?.value - 1, 0)
      );
    });

    return this._transCountSubject;
  }

  public nodeValueSubject(id: nanoID) {
    const node = this.node(id);
    if (!node) {
      throw e('no node subject with id ', { id });
    }
    const subject = new BehaviorSubject(node.value);
    this.on('updateHistory', change => {
      if (
        change instanceof NodeValueChange ||
        change instanceof NodeConfigChange
      ) {
        if (change.state == StateEnum.complete) {
          const node = this.node(id);
          if (node?.isActive) subject.next(node.value);
        }
      }
    });

    return combineLatest([
      subject.pipe(distinctUntilChanged()),
      this.transCountSubject,
    ]).pipe(
      filter(list => list[1] === 0),
      map(([value]) => value),
      distinctUntilChanged()
    );
  }

  private get transactions(): Trans[] {
    return Array.from(this.history.values()).filter(item => {
      return item instanceof Trans && item.isActive;
    });
  }

  private _listenForTrans() {
    this.on('trans-start', (trans: Trans) => {
      this.emit('setHistory', trans);
      this.pending.add(trans);
    });

    this.on('trans-end', (trans: Trans) => {
      trans.endTime = Time.next;
      this.pending.delete(trans);
    });

    this.on('trans-rollback', (trans: Trans, error: any) => {
      trans.endTime = Time.next;
      this.pending.delete(trans);
      trans.error = error;
      for (let time = trans.endTime; time > trans.time; --time) {
        const item = this.history.get(time);
        if (!item) {
          continue;
        }
        if (item instanceof Node) {
          item.state = StateEnum.removed;
        } else if (item instanceof NodeConfigChange) {
          const target = this.node(item.target);
          if (target) {
            target.revertConfig(item);
          }
        } else if (item instanceof Branch) {
          item.remove();
        }
      }
      this.emit('compute');
    });
  }

  private _listenForHistory() {
    this.on('setHistory', (change: timeObj) => {
      this.history.set(change.time, change);
    });
  }

  /** ------------ branches --------------- */

  branches: branchObj[] = [];
}
