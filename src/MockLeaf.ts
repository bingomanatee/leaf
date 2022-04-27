import { LeafType, SubscriberType } from './type';
import {FORM_VALUE} from "./constants";

export class MockLeaf implements LeafType {
  constructor(value, vid = 1) {
    this.value = value;
    this.vid = vid;
  }

  base: any;

  complete(): void {}

  next(change: any): void {
    this.value = change;
  }

  subscribe(
    _istener: (
      value: any
    ) => void | { next: (value: any) => void; complete: () => void }
  ): SubscriberType {
    return {
      unsubscribe() {},
    };
  }

  value: any;
  vid = 0;

  form = FORM_VALUE;
  root = this;
}
