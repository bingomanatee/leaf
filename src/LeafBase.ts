import EventEmitter from "emitix";
import {LeafOptionsType, LeafType, MessageStatus, MessageType, mType, TestFnType, TransTokenType} from "./type";
import {Message} from "./Message";
import {Token} from "./Token";
import {detectForm, isThere} from "./utils/tests";
import {ABSENT} from "./constants";

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

export default class LeafBase extends EventEmitter.Protected<{
  'version-prep': [MessageType],
  'version-validate': [MessageType],
  'version-post': [MessageType],
  rollback: [Token],
  commit: [Token],
  trans: [Token],
  recompute: []
}>() implements LeafType {

  protected readonly _initialized: boolean = false;
  constructor(value, options?: LeafOptionsType) {
    super();

    if (options) this.config(options);
    this._transListen();
    this._initialized = true;
    this.push(value);
  }

  private config(options: LeafOptionsType) {
    if (Array.isArray(options.test)) {
      options.test.forEach((test) => this.addTest(test));
    } else if (options.test) {
      this.addTest(options.test);
    }
  }

  // region reflection

  public get form(): symbol | undefined {
    if (!this._activeVersion?.data) return undefined;

    if (!(this._activeVersion.data.form)) {
      this._activeVersion.data.form = detectForm(this.value);
    }
    return this._activeVersion.data.form;
  }

  // endregion

  // region tests
  public addTest(_test: TestFnType) {
    //@TOO: implement
  }

  // endregion

  // region stack

  protected readonly history: Message [] = [];

  /**
   * this is the last _locked in_ version id
   * - the one after a non-errored out transaction.
   * @protected
   */
  protected _vid: number = 0;
  get vid(): number {
    return this._vid;
  }

  push(change) {
    this.trans(() => {
      const base = this._doChange(this.base, change);
      const version = new Message(this, mType.version, {value: base, base: base});
      this.history.push(version);

      this.emit('version-prep', version);
      if (version.status === MessageStatus.candidate) this.emit('version-validate', version);
      if (version.status === MessageStatus.candidate) this.emit('version-post', version);
      if (version.err) throw version.err;
    }, TransTokenType.TRANS_TOKEN_VERSION);
  }

  /**
   * returns the version associated with the vid of this leaf;
   * ignores status, errors, subsquent candidates etc.
   */
  get _current(): MessageType | null {
    let i = -1;
    while (i > -this.history.length) {
      const message = this.history.at(i);
      if (message && message.type === mType.version) {
        if (message.vid === this.vid) {
          return message;
        }
      }
      i -= 1;
    }
    return null;
  }

  get data () {
    return this._activeVersion?.data;
  }

  /**
   * the "top of the stack" -- the last confirmed/candidate,*/
  get _activeVersion(): Message | null {
    for (let i = this.history.length - 1; i >=0; --i) {
      const message = this.history.at(i);
      if (message && message.type === mType.version
        && [MessageStatus.confirmed, MessageStatus.candidate].includes(message.status)) {
        return message;
      }
    }
    return null;
  }

// endregion

  // region change
  next(change) {
    this.push(change);
  }

  //endregion

  // region value

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

  /**
   * this computes the decorated value.
   * Its used internally, and cached in versions - don't call in your app.
   */
  getValue(base) {
    return base;
  }

  // endregion

  // region mutators

  complete() {

  }

  subscribe(_listener: any) {
    return {
      unsubscribe() {
      }
    }
  }

  // endregion

  // region transact

  _transListen() {
    this.on('rollback', (trans: Token) => {
      this.history.forEach((version) => {
        if (version.status === MessageStatus.confirmed && (version.vid > trans.vid)) {
          version.cancel();
        }
      })
    });

    this.on('commit', (_trans: Token) => {
      if (_trans.type === TransTokenType.TRANS_TOKEN_VERSION) {
        const lastGood = this._activeVersion;
        if (!lastGood) return;
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

  private _pendingTokens = new Set();
  get pendingTokens() {
    return this._pendingTokens;
  }

  _startTrans(type, label?) {
    const token = new Token(this, this.vid, type, label);
    this._pendingTokens.add(token);
    this.emit('trans', token);
    return token;
  }

  _endTrans(token: Token, err?: Error) {
    this._pendingTokens.delete(token);

    if (err) {
      token.error = err;
      this.emit('rollback', token);
      throw err;
    } else if (!this._pendingTokens.size) {
      this.emit('commit', token);
    } else {
      console.log('_endTrans: size is ', this._pendingTokens.size);
    }
  }

  // endregion

  // region stand-ins
  /**
   * these are methods / properties implemented in child classes but
   * that are required for LeafType iemplementation
   */

  get root(): LeafType {
    return this;
  }

  protected _doChange(_base, change = ABSENT) {
    return isThere(change) ? change : _base;
  }
  // endregion
}
