import { Time } from './Time';
import { StateEnum } from '../src/types';
import {Stateful} from "./Stateful";

export class Trans extends Stateful {
  forest: any;
  time: number;
  endTime?: number;
  error?: any;

  constructor(forest) {
    super();
    this.forest = forest;
    this.time = Time.next;
    this.state = StateEnum.active;
  }
}
