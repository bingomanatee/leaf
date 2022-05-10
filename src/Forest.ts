import { TreeId, TreeIF, TreeInit } from './types';
import { Tree } from './Tree';

/**
 * a Forest is a collection of 0 or more trees.
 * Some "trees" are actually "possible future updates" of other trees; they are stored
 * in able to allow update and merging to occur.
 * There should only be one "good" tree for every given ID. The others should be either "new" or "old".
 */

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
