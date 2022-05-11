import { LeafIF } from './types';
import {BranchId} from "./types/branch.types";

// may be deprecated - as a case of branch

export class Leaf implements LeafIF {
  constructor(branch: BranchId, value: any) {
    this.branch = branch;
    this.value = value;
  }

  branch: BranchId;
  value: any;
}
