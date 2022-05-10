import { TimeIF, TreeIF } from './interfaces';
import { Time } from './Time';

export class Forest {
  public name: any;

  constructor(name) {
    this.name = name;
    this.time = Time.create();
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly trees: Map<string, TreeIF> = new Map<string, TreeIF>();
  public readonly time: TimeIF;
}
