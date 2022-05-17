import { Time } from './Time';
import { StateEnum } from './types';

export class Trans {
  forest: any;
  time: number;
  endTime?: number;
  state: StateEnum;
  error?: any;

  constructor(forest) {
    this.forest = forest;
    this.time = Time.next;
    this.state = StateEnum.active;
  }
}
