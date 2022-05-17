import Node from '../src/Node/Node';
import { Time } from '../src/Time';
import { Branch } from '../src/Branch';
import { Forest } from '../src';

describe('Node', () => {
  describe('constructor', () => {
    Time.clear();
    it('has an id', () => {
      const node = new Node(null);
      expect(typeof node.id).toBe('string');
      expect(node.id).toBeTruthy();
    });
    Time.clear();
  });

  describe('change', () => {
    it('accepts single change', () => {
      Time.clear();
      const node = new Node(null, 'node', new Map([['vey', 100]]));

      expect(node.config('foo')).toBeUndefined();
      expect(node.config('vey')).toBe(100);

      node.config('foo', 3);
      expect(node.config('foo')).toBe(3);
      expect(node.config('vey')).toBe(100);

      node.config('bar', 12);
      expect(node.config('bar')).toBe(12);
      expect(node.config('foo')).toBe(3);
      expect(node.config('vey')).toBe(100);
      Time.clear();
    });

    it('accepts multi change', () => {
      const node = new Node({});

      node.changeConfig(
        new Map([
          ['foo', 3],
          ['bar', 12],
        ])
      );

      expect(node.config('bar')).toBe(12);
      expect(node.config('foo')).toBe(3);
    });
  });

  describe('delete', () => {
    it('removes configs', () => {
      Time.clear();
      const node = new Node(
        null,
        'node',
        new Map([
          ['foo', 3],
          ['bar', 12],
        ])
      );
      node.debug = true;

      expect(node.hasConfig('foo')).toBeTruthy();
      expect(node.hasConfig('bar')).toBeTruthy();
      node.deleteConfig('foo');
      expect(node.hasConfig('foo')).toBeFalsy();
      expect(node.hasConfig('bar')).toBeTruthy();
    });
    Time.clear();
  });

  describe('.branches', () => {
    it('adds the correct parent/child keys', () => {
      Time.clear();
      const forest = new Forest();
      const n1 = forest.makeNode(null, 'n1');
      const n2 = forest.makeNode(null, 'n2');

      forest.branchNodes(n1, n2);

      expect(n1.parents).toEqual([]);
      expect(n1.children).toEqual([n2.id]);

      expect(n2.parents).toEqual([n1.id]);
      expect(n2.children).toEqual([]);

      Time.clear();
    });

    it('allows multiple keys', () => {
      Time.clear();
      const forest = new Forest();
      const n1 = forest.makeNode(null, 'n1');
      const n2 = forest.makeNode(null, 'n2');
      const n3 = forest.makeNode(null, 'n3');
      const n4 = forest.makeNode(null, 'n4');
      const n5 = forest.makeNode(null, 'n5');

      const branch = new Branch(n1.id, n2.id, {});
      const branch2 = new Branch(n1.id, n3.id, {});
      const branch3 = new Branch(n1.id, n4.id, {});

      const branch4 = new Branch(n4.id, n3.id, {});
      const branch5 = new Branch(n4.id, n5.id, {});

      const branches: Branch[] = [branch, branch2, branch3, branch4, branch5];

      forest.addBranches(branches);

      expect(n1.parents).toEqual([]);
      expect(n1.children).toEqual([n2.id, n3.id, n4.id].sort());

      expect(n2.parents).toEqual([n1.id]);
      expect(n2.children).toEqual([]);

      expect(n3.parents).toEqual([n1.id, n4.id].sort());
      expect(n3.children).toEqual([]);

      expect(n4.parents).toEqual([n1.id].sort());
      expect(n4.children).toEqual([n3.id, n5.id].sort());

      expect(n5.parents).toEqual([n4.id]);
      expect(n5.children).toEqual([]);

      Time.clear();
    });

    it('accepts multiple additions', () => {
      const forest = new Forest();
      Time.clear();
      const n1 = forest.makeNode(null, 'n1');
      const n2 = forest.makeNode(null, 'n2');
      const n3 = forest.makeNode(null, 'n3');
      const n4 = forest.makeNode(null, 'n4');
      const n5 = forest.makeNode(null, 'n5');

      const branch = new Branch(n1.id, n2.id);
      const branch2 = new Branch(n1.id, n3.id);
      const branch3 = new Branch(n1.id, n4.id);
      const branch4 = new Branch(n4.id, n3.id);
      const branch5 = new Branch(n4.id, n5.id);
      const branch2_0 = new Branch(n1.id, n5.id);
      const branch2_1 = new Branch(n2.id, n4.id);
      const branch2_2 = new Branch(n1.id, n3.id, { del: true });

      const branches: Branch[] = [branch, branch2, branch3, branch4, branch5];

      const branches2 = [branch2_0, branch2_1, branch2_2];

      forest.addBranches(branches);
      forest.addBranches(branches2);

      expect(n1.parents).toEqual([]);
      expect(n1.children).toEqual([n2.id, n4.id, n5.id].sort());

      expect(n2.parents).toEqual([n1.id].sort());
      expect(n2.children).toEqual([n4.id]);

      expect(n3.parents).toEqual([n4.id].sort());
      expect(n3.children).toEqual([]);

      expect(n4.parents).toEqual([n1.id, n2.id].sort());
      expect(n4.children).toEqual([n3.id, n5.id].sort());

      expect(n5.parents).toEqual([n4.id, n1.id].sort());
      expect(n5.children).toEqual([]);

      Time.clear();
    });
  });
});
