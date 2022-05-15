import { nanoid } from 'nanoid';
import Node from './Node';
import { nodeID, TimeValue, valueMap } from './types';
import { Branch } from './Branch';

export class Forest {
  readonly name: string;
  readonly history = new Map<TimeValue, any>();
  constructor(name?: string) {
    this.name = name || nanoid();
  }

  nodes = new Map<string, Node>();

  makeNode(values?: Map<string, any>): Node {
    const node = new Node({ forest: this, values }); // internally sets nodes property
    return node;
  }

  node(id): Node | undefined {
    return this.nodes.get(id);
  }

  changeNode(id: string, changes: valueMap): Node | undefined {
    const target = this.node(id);
    if (target) {
      const change = target.change(changes);
      this.history.set(change.time, change);
      //todo: broadcast, resolve change;
      return target;
    }
    return undefined;
  }

  branch(source: nodeID, dest: nodeID, del = false) {
    const branch = new Branch({forest: this, source: source, dest: dest, del: del}); // can throw
    this.history.set(branch.time, branch);
    this.node(source)?.addBranch(branch);
    this.node(dest)?.addBranch(branch);
    // @todo: broadcast, resolve changes
  }
}
