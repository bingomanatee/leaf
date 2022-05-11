import { Tree } from '../src/Tree';
import { StateEnum, TypeEnum } from '../src/types';
import { Forest } from '../src';

describe('Tree', () => {
  describe('constructor', () => {
    it('should have the right name', () => {
      const tree = new Tree({ name: 'ent' });
      expect(tree.name).toBe('ent');
    });
  });

  describe('addBranch', () => {
    it('should add a new branch', () => {
      const tree = new Tree({ name: 'ent' });
      const branch = tree.addBranch({ name: 'alpha', value: 1 });
      if (branch) {
        expect(branch.value).toBe(1);
        expect(branch.name).toBe('alpha');
      } else {
        throw new Error('did not create branch');
      }
    });

    it('should update if called with the same name', () => {
      const tree = new Tree({ name: 'ent' });
      const branch = tree.addBranch({ name: 'alpha', value: 1 });
      const updated = tree.addBranch({ name: 'alpha', value: 2 });
      if (branch) {
        expect(branch.value).toBe(1);
        expect(branch.name).toBe('alpha');
      } else {
        throw new Error('did not create branch');
      }
      if (updated) {
        expect(updated.id).toBe(branch.id);
        expect(updated.name).toBe(branch.name);
        expect(updated.value).toBe(2);
      }
    });
  });

  describe('schema', () => {
    describe('basic types', () => {
      it('should accept branches of the right type when they have values', () => {
        const forest = new Forest('wood');
        const tree = forest.makeTree({
          name: 'ent',
        });
        const last = tree.addBranch({
          value: 'foo',
          name: '',
          schema: TypeEnum.string,
        });

        if (last) {
          expect(last.state).toBe(StateEnum.good);
        } else {
          throw new Error('last not made');
        }
      });
    });
  });
});
