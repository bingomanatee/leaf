import { StateEnum, statefulObj } from './types';

export class Stateful implements statefulObj {
  state: StateEnum;
  stateError?: any;

  constructor() {
    this.state = StateEnum.active;
  }

  fail(err) {
    this.state = StateEnum.error;
    this.stateError = err;
  }

  get isActive() {
    return [StateEnum.active, StateEnum.good].includes(this.state);
  }

  get isGood() {
    return [StateEnum.active, StateEnum.good, StateEnum.complete].includes(
      this.state
    );
  }

  accept() {
    if (this.isActive) {
      this.state = StateEnum.good;
    }
  }

  complete() {
    if (this.isActive) {
      this.state = StateEnum.complete;
    }
  }

  remove() {
    if (this.isActive) {
      this.state = StateEnum.removed;
    }
  }
}
