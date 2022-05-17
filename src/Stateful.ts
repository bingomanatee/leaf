import { StateEnum } from './types';

export class Stateful {
  state: StateEnum;
  stateError?: any;

  constructor() {
    this.state = StateEnum.new;
  }

  fail(err) {
    this.state = StateEnum.error;
    this.stateError = err;
  }

  get isActive() {
    return ![StateEnum.complete, StateEnum.error, StateEnum.removed].includes(
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
