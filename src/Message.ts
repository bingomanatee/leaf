import { LeafType, MessageType, MessageKind, MessageStatus } from './type';

let nextVID = 1;

export abstract class MessageBase {
  constructor(target, messageType: MessageKind) {
    this.target = target;
    this.type = messageType;
    this._status = MessageStatus.candidate;
    this.vid = nextVID;
    ++nextVID;
  }

  readonly vid: number;
  readonly type: MessageKind;
  readonly target: LeafType;
  protected _status: MessageStatus;
  get status(): MessageStatus {
    return this._status;
  }

  // region statusMethods
  public err: Error | null = null;

  confirm() {
    switch (this.status) {
      case MessageStatus.candidate:
        this._status = MessageStatus.confirmed;
        break;

      default:
        console.warn(
          'attempt to cancel Version with status',
          this.status,
          this
        );
    }
  }

  cancel() {
    switch (this.status) {
      case MessageStatus.candidate:
        this._status = MessageStatus.cancelled;
        break;

      default:
        console.warn(
          'attempt to cancel Version with status',
          this.status,
          this
        );
    }
  }

  fail(err: Error) {
    switch (this.status) {
      case MessageStatus.candidate:
        this._status = MessageStatus.cancelled;
        this.err = err;
        break;

      default:
        console.warn('attempt to fail Version with status', this.status, this);
    }
  }

  // endregion
}

type dataType = { [key: string]: any };

/**
 * the default version is "change driver" -- the value of change drives base
 * which in turn drives value
 */
export class VersionMessage extends MessageBase implements MessageType {
  constructor(target: LeafType, data?: dataType) {
    super(target, MessageKind.version);
    this.data = data || {};
  }
  readonly data?: { [key: string]: any };
}
