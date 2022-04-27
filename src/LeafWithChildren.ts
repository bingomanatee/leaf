import { LeafOptionsType, LeafType, MessageType, valueType } from './type';
import LeafBase from './LeafBase';
import { branchingFormIDs } from './constants';
import Leaf from './Leaf';
import { clone, setKey } from './utils/tests';
import { toMap } from './utils/conversion';

export default class LeafWithChildren extends LeafBase {
  constructor(value: valueType, config?: LeafOptionsType) {
    super(value, config);
    if (config) {
      this._childOpts(config);
    }
    this.on('version-prep', (version: MessageType) => {
      if (this.canBranch) {
        if (version.data) {
          version.data.value = this.withChildren(version.data.base);
        }
      }
    });
    if (this.hasChildren) {
      this.push(this.base);
    }
  }

  private _childOpts(config: LeafOptionsType) {
    const { parent, children } = config;
    this._parent = parent;

    if (children) {
      this.addChildren(children);
    }
  }

  // region parent, root

  private _parent?;
  get parent(): LeafType | undefined {
    return this._parent;
  }

  get root(): LeafType {
    if (this.parent) {
      return this.parent.root;
    }
    return this;
  }

  // endregion

  // region value

  // endregion

  // region children

  /**
   * indicates that the value of the leaf is one with keyed values --
   * a Map, Array or Object.
   */
  get canBranch() {
    return this.form && branchingFormIDs.includes(this.form);
  }

  withChildren(base: any): any {
    if (!this.hasChildren || !this.children) {
      return base;
    }

    let value = clone(base);
    this.children.forEach((leaf, key) => {
      value = setKey(value, leaf.value, key, this.form);
    });
    return value;
  }

  public children? = new Map();

  /**
   * true if there is a children map with at least one member.
   */
  get hasChildren() {
    return this.children && this.children.size > 0;
  }

  addChild(key, value) {
    if (this.canBranch) {
      if (!this.children) {
        this.children = new Map();
      }
      let child = value;
      if (!(value instanceof Leaf)) {
        child = new Leaf(value, { parent: this });
      }
      this.children.set(key, child);
      if (this._initialized) {
        this.push(this.base);
      }
    }
  }

  addChildren(children) {
    const m = toMap(children);
    m.forEach((value, key) => this.addChild(key, value));
  }

  remChild(key) {
    if (this.children?.has(key)) {
      //@TODO: complete() ?
      this.children.delete(key);
      this.push(this.base);
    }
  }

  // endregion;
}
