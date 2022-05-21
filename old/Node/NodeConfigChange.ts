import { configMap, nanoID } from '../../src/types';
import { nanoid } from 'nanoid';
import { Time } from '../Time';
import { Stateful } from '../Stateful';

export class NodeConfigChange extends Stateful {
  readonly next: configMap;
  readonly target: nanoID;
  readonly time: number;
  readonly id: string; // useful????
  current?: configMap;

  constructor(target: nanoID, next: configMap, current?: configMap) {
    super();
    this.target = target;
    this.id = nanoid();
    this.next = next;
    this.current = current;
    this.time = Time.next;
  }
}
