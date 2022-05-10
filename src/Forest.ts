import { TreeId, TreeIF, TreeInit } from './types';
import { Tree } from './Tree';

export class Forest {
  constructor(name = '') {
    if (!name) {
      name = `forest---${Forest.inc}`;
      ++Forest.inc;
    }
    this.name = name;
    this.id = Symbol(name);
  }

  public name: any;
  protected static inc = 0;
  public readonly id: symbol;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly trees: TreeIF[] = [];
  public get(id: TreeId) {
    return this.trees.filter((tree: TreeIF) => tree.id === id);
  }
  public makeTree(props: TreeInit) {
    const tree = new Tree({ ...props, forest: this });
    this.trees.push(tree);
    return tree;
  }
  public last(id: TreeId) {
    return [...this.get(id)].pop();
  }
}
