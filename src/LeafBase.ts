import EventEmitter from 'emitix';
import {
  LeafOptionsType,
  LeafType,
  MessageStatus,
  MessageType,
  mType,
  PushType,
  TestFnType,
  TransTokenType,
} from './type';
import { Message } from './Message';
import { Token } from './Token';
import { detectForm, isThere } from './utils/tests';
import { ABSENT } from './constants';

function asError(err) {
  let error = err;
  if (!(error instanceof Error)) {
    if (typeof err === 'string') {
      error = new Error(err);
    } else if (!err) {
      error = new Error('unknown error');
    } else if (typeof err === 'object') {
      if ('message' in err) {
        err = new Error(err.messaage);
      } else {
        error = new Error('unknown error');
      }
    }
  }
  return error;
}

export default class LeafBase
  extends EventEmitter.Protected<{
    'version-change': [MessageType]; // split up any child-centric updates in change to child.next()s
    'version-prep': [MessageType]; // integrate child values into value
    'version-validate': [MessageType]; // test pending value against any user confirmations.
    'version-post': [MessageType]; // run any decorators; remove any child keys from base (@TODO)
    rollback: [Token];
    commit: [Token];
    trans: [Token];
    recompute: []; // deprecated?
  }>()
  implements LeafType {
  protected readonly _initialized: boolean = false;
  name: any;

  constructor(value, options?: LeafOptionsType) {
    super();

    if (options) {
      this.config(options);
    }
    this._transListen();
    this._initialized = true;
    this.push(value, PushType.first);
  }

  // region reflection

  public get form(): symbol {
    if (this._activeVersion?.data) {
      if (!this._activeVersion?.data?.form) {
        this._activeVersion.data.form = detectForm(this.value);
      }
    }
    return this._activeVersion?.data?.form || ABSENT;
  }

  // endregion

  /**
   * this is the last _locked in_ version id
   * - the one after a non-errored out transaction.
   * @protected
   */
  protected _vid = 0;

  // endregion

  // region stack
  protected readonly history: Message[] = [];

  get vid(): number {
    return this._vid;
  }

  /**
   * returns the version associated with the vid of this leaf;
   * ignores status, errors, later candidates etc.
   */
  get _current(): MessageType | null {
    for (let i = this.history.length - 1; i >= 0; --i) {
      const message = this.history[i];
      if (message && message.type === mType.version) {
        if (message.vid === this.vid) {
          return message;
        }
      }
    }
    return null;
  }

  get data() {
    return this._activeVersion?.data;
  }

  /**
   * the "top of the stack" -- the last confirmed/candidate,*/
  get _activeVersion(): Message | null {
    for (let i = this.history.length - 1; i >= 0; --i) {
      const message = this.history[i];
      if (
        message &&
        message.type === mType.version &&
        [MessageStatus.confirmed, MessageStatus.candidate].includes(
          message.status
        )
      ) {
        return message;
      }
    }
    return null;
  }

  /**
   * value is the "decorated" value of the leaf
   * including any post-filters, etc.
   */
  get value(): any | null {
    if (this._activeVersion) {
      return this._activeVersion.data?.value;
    }
    return undefined;
  }

  /**
   * base is the "raw" true core value of the leaf
   */
  get base(): any | null {
    if (this._activeVersion) {
      return this._activeVersion.data?.base;
    }
    return undefined;
  }

  // endregion

  // region tests
  public addTest(_test?: TestFnType | TestFnType[]) {
    //@TOO: implement
  }
  // endregion

  // region change

  /**
   *
   * @param change {any} the value to replace / amend the current one
   * @param direction indicates whether:
   *   - the value is an initializer (first)
   *   - the value is an update from the parent (up)
   *   - the value is an update from a child (down)
   *   - the value is an external update (default)
   */
  push(change, direction = PushType.default) {
    const base = this._amend(this.base, change);
    const version = new Message(this, mType.version, {
      value: base,
      change,
      base: base,
      direction,
    });
    this.history.push(version);
    if (version.status === MessageStatus.candidate) {
      this.emit('version-change', version);
    }
    if (version.status === MessageStatus.candidate) {
      this.emit('version-prep', version);
    }
    if (version.status === MessageStatus.candidate) {
      this.emit('version-validate', version);
    }
    if (version.status === MessageStatus.candidate) {
      this.emit('version-post', version);
    }
    if (version.err) {
      throw version.err;
    }
  }

  next(change, direction?: PushType) {
    this.trans(() => {
      this.push(change, direction);
    }, TransTokenType.TRANS_TOKEN_VERSION);
  }

  /**
   * this computes the decorated value.
   * Its used internally, and cached in versions - don't call in your app.
   */
  getValue(base) {
    return base;
  }

  // endregion

  // region broadcast

  public isCompleted = false;
  complete() {
    this.isCompleted = true;
  }

  subscribe(_listener: any) {
    return {
      unsubscribe() {},
    };
  }

  // endregion

  // region transact

  protected readonly pendingTokens = new Set();

  _transListen() {
    this.on('rollback', (trans: Token) => {
      this.history.forEach(version => {
        if (
          version.status === MessageStatus.confirmed &&
          version.vid > trans.vid
        ) {
          version.cancel();
        }
      });
    });

    this.on('commit', (_trans: Token) => {
      if (_trans.type === TransTokenType.TRANS_TOKEN_VERSION) {
        const lastGood = this._activeVersion;
        if (!lastGood) {
          return;
        }
        if (lastGood.vid !== this.vid) {
          if (lastGood.status !== MessageStatus.confirmed) {
            lastGood.confirm();
          }
          this._vid = lastGood.vid;
          //@todo: broadcast
        }
      }
    });
  }

  trans(fn, type: TransTokenType, label?: string) {
    const token = this._startTrans(type, label);
    try {
      fn();
      this._endTrans(token);
    } catch (err) {
      this._endTrans(token, asError(err));
    }
    return token;
  }

  _startTrans(type, label?) {
    const token = new Token(this, this.vid, type, label);
    this.pendingTokens.add(token);
    this.emit('trans', token);
    return token;
  }

  _endTrans(token: Token, err?: Error) {
    this.pendingTokens.delete(token);

    if (err) {
      token.error = err;
      this.emit('rollback', token);
      throw err;
    } else if (!this.pendingTokens.size) {
      this.emit('commit', token);
    } else {
      console.log('_endTrans: size is ', this.pendingTokens.size);
    }
  }

  protected _amend(_base, change = ABSENT) {
    if (isThere(change)) {
      return change;
    } else {
      return _base;
    }
  }

  // endregion

  // region misc

  private config(options: LeafOptionsType) {
    if ('test' in options) {
      this.addTest(options.test);
    }

    if ('name' in options) {
      this.name = options.name;
    }
  }

  // endregion

  // region stand-ins
  /**
   * these are methods / properties implemented in child classes but
   * that are required for LeafType implementation
   */

  get root(): LeafType {
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasChild(_key) {
    return false;
  }

  // endregion
}
