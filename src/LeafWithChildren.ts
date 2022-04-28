import {
  LeafOptionsType,
  LeafType,
  MessageType,
  PushType,
  valueType,
} from './type';
import LeafBase from './LeafBase';
import { ABSENT, branchingFormIDs } from './constants';
import Leaf from './Leaf';
import { amend, detectForm, e, isCompound, isThere } from './utils/tests';
import { toMap } from './utils/conversion';
import { clone, iterate, makeNew, setKey } from './utils/compound';

export default class LeafWithChildren extends LeafBase {
  constructor(value: valueType, config?: LeafOptionsType) {
    super(value, config);
    if (config) {
      this._childOpts(config);
    }

    this._listenForChildren();

    if (this.hasChildren) {
      this.next(this.base, PushType.first);
    }
  }

  private _listenForChildren() {
    this.on('version-change', (version: MessageType) => {
      if (this.hasChildren) {
        iterate(version.data?.change, (value, key) => {
          if (this.hasChild(key)) {
            this.children?.get(key).next(value, PushType.up);
          }
        });
      }
    });

    this.on('version-prep', (version: MessageType) => {
      if (this.canBranch) {
        if (version.data) {
          version.data.value = this.withChildren(version.data.base);
        }
      }
    });

    this.on('version-post', (version: MessageType) => {
      if (this.parent) {
        switch (version.data?.direction) {
          case PushType.up:
            // no change: came from parent
            break;

          case PushType.down:
            this.parent.next(this._asChange, PushType.down);
            break;

          case PushType.first:
            // no change - assume parent will harvest
            break;

          case PushType.default:
            this.parent.next(this._asChange, PushType.down);
            break;
        }
      }
    });
  }

  private get _asChange() {
    if (this.parent) {
      const form = this.parent.form;
      const change = makeNew(form);
      setKey(change, this.value, this.name);
      return change;
    }
    return undefined;
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
  /**
   * combine base value and updates into a single value.
   *
   * @param base {any}
   * @param change {any}
   * @protected
   */
  protected _amend(base, change = ABSENT) {
    if (isThere(change)) {
      const baseForm = detectForm(base);
      if (!isCompound(baseForm)) {
        return change;
      }

      if (detectForm(change) !== baseForm) {
        if (this.hasChildren) {
          throw e('you cannot change the form of leafs that have children', {
            target: this,
            base: base,
            change,
          });
        }
        return change;
      }
      return amend(base, change, baseForm);
    } else {
      return base;
    }
  }
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
        child = new Leaf(value, { parent: this, name: key });
      }
      this.children.set(key, child);
      if (this._initialized) {
        this.next(this.base, PushType.down);
      }
    }
  }

  hasChild(key) {
    return (this.hasChildren && this.children?.has(key)) || false;
  }

  addChildren(children) {
    const m = toMap(children);
    m.forEach((value, key) => this.addChild(key, value));
  }

  remChild(key) {
    if (this.children?.has(key)) {
      //@TODO: complete() ?
      this.children.delete(key);
      this.next(this.base, PushType.down);
    }
  }

  // endregion;
}
