/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Stateful } from './Stateful';
import { collectionObj, timeObj, timeValue, transData } from './types';
import { Time } from './Time';
import { Forest } from './Forest';

export class Trans extends Stateful implements timeObj {
  // @ts-ignore
  private forest: Forest;
  name: any;

  time: timeValue;
  private message: any;
  noValidation: boolean | undefined;

  constructor(branches: collectionObj, data: transData) {
    super();
    this.forest = branches.context;
    this.message = data.message;
    this.time = Time.next;
    this.noValidation = data.noValidation;
  }

  get data() {
    return this.message;
  }
}
