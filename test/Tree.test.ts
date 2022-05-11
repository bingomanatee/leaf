import { Tree } from '../src/Tree';
import { Forest } from '../src';
import { Branch } from '../src/Branch';
import { TypeEnum } from '../src/types';

describe('Tree', () => {
  describe('constructor', () => {
    it('should have the right name', () => {
      const tree = new Tree({ name: 'ent' });
      expect(tree.name).toBe('ent');
    });
  });

  describe('.onBranch', () => {
    it('should add a branch', () => {
      const forest = new Forest('wood');
      const tree = new Tree({ forest });
      const branch = new Branch({
        name: '',
        treeId: tree.id,
        schema: TypeEnum.number,
        value: 1,
      });

      forest.onBranch(branch);
      const branches = forest.branches.get(branch.id);
      if (Array.isArray(branches)) {
        expect(branches[0]).toBe(branch);
      } else {
        throw new Error('branches is empty');
      }
    });
  });

  describe('schema', () => {
    describe('basic types', () => {
      it('should accept branches of the right type when they have values', () => {
        const forest = new Forest('wood');
        const tree = new Tree({ forest });
        const branch = new Branch({
          name: '',
          treeId: tree.id,
          schema: TypeEnum.number,
          value: 1,
        });

        forest.onBranch(branch);

        expect(branch.error).toBeFalsy();
      });
    });
  });
});
