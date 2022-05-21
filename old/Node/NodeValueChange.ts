import { nanoID } from '../../src/types';
import { nanoid } from 'nanoid';
import { Time } from '../Time';
import { Stateful } from '../Stateful';

export class NodeValueChange extends Stateful {
  readonly next: any;
  current: any;
  readonly target: nanoID;
  readonly time: number;
  readonly id: string;

  constructor(target: nanoID, next: any, current: any) {
    super();
    this.target = target;
    this.id = nanoid();
    this.next = next;
    this.current = current;
    this.time = Time.next;
  }
}
