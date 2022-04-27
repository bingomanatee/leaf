import { LeafType, TransTokenType } from './type';

export class Token {
  constructor(
    target: LeafType,
    vid: number,
    type: TransTokenType,
    label?: string
  ) {
    this.target = target;
    this.label = label;
    this.type = type;
    this.vid = vid;
  }

  target: LeafType;
  type: TransTokenType;
  label: string | undefined;
  vid: number;
  error?: Error | null;
}
