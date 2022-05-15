import Node from '../src/Node';
import { Time } from '../src/Time';
import { Branch } from '../src/Branch';

describe('Node', () => {
  describe('constructor', () => {
    Time.clear();
    it('has an id', () => {
      const node = new Node({});
      expect(typeof node.id).toBe('string');
      expect(node.id).toBeTruthy();
    });
    Time.clear();
  });

  describe('change', () => {
    it('accepts single change', () => {
      Time.clear();
      const node = new Node({
        values: new Map([['vey', 100]]),
      });

      expect(node.get('foo')).toBeUndefined();
      expect(node.get('vey')).toBe(100);

      node.set('foo', 3);
      expect(node.get('foo')).toBe(3);
      expect(node.get('vey')).toBe(100);

      node.set('bar', 12);
      expect(node.get('bar')).toBe(12);
      expect(node.get('foo')).toBe(3);
      expect(node.get('vey')).toBe(100);
      expect(node.history?.size).toBe(2);
      Time.clear();
    });

    it('accepts multi change', () => {
      const node = new Node({});

      node.change(
        new Map([
          ['foo', 3],
          ['bar', 12],
        ])
      );

      expect(node.get('bar')).toBe(12);
      expect(node.get('foo')).toBe(3);
      expect(node.history?.size).toBe(1);
    });
  });

  describe('delete', () => {
    it('removes value', () => {
      Time.clear();
      const node = new Node({
        values: new Map([
          ['foo', 3],
          ['bar', 12],
        ]),
      });
      node.debug = true;

      expect(node.has('foo')).toBeTruthy();
      expect(node.has('bar')).toBeTruthy();
      node.delete('foo');
      expect(node.has('foo')).toBeFalsy();
      expect(node.has('bar')).toBeTruthy();
    });
    Time.clear();
  });

  describe('.addBranch', () => {
    it('adds the correct parent/child keys', () => {
      Time.clear();
      const n1 = new Node({});
      const n2 = new Node({});
      // console.log('pc keys:', n1.id, n2.id);
      const branch = new Branch(n1.id, n2.id, {});
      n1.addBranch(branch);
      n2.addBranch(branch);

      expect(n1.parents).toEqual([]);
      expect(n1.children).toEqual([n2.id]);

      expect(n2.parents).toEqual([n1.id]);
      expect(n2.children).toEqual([]);

      Time.clear();
    });

    it('allows multiple keys', () => {
      Time.clear();
      const n1 = new Node({});
      const n2 = new Node({});
      const n3 = new Node({});
      const n4 = new Node({});
      const n5 = new Node({});

      const branch = new Branch(n1.id, n2.id, {});
      const branch2 = new Branch(n1.id, n3.id, {});
      const branch3 = new Branch(n1.id, n4.id, {});

      const branch4 = new Branch(n4.id, n3.id, {});
      const branch5 = new Branch(n4.id, n5.id, {});

      const branches: Branch[] = [branch2, branch3, branch4, branch5];

      n1.addBranch(branch, ...branches);
      n2.addBranch(branch, ...branches);
      n3.addBranch(branch, ...branches);
      n4.addBranch(branch, ...branches);
      n5.addBranch(branch, ...branches);

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
      Time.clear();
      const n1 = new Node({});
      const n2 = new Node({});
      const n3 = new Node({});
      const n4 = new Node({});
      const n5 = new Node({});

      const branch = new Branch(n1.id, n2.id, {});
      const branch2 = new Branch(n1.id, n3.id, {});
      const branch2_2 = new Branch(n1.id, n3.id, { del: true });
      const branch3 = new Branch(n1.id, n4.id, {});
      const branch2_0 = new Branch(n1.id, n5.id, {});

      const branch2_1 = new Branch(n2.id, n4.id, {});

      const branch4 = new Branch(n4.id, n3.id, {});
      const branch5 = new Branch(n4.id, n5.id, {});

      const branches: Branch[] = [branch2, branch3, branch4, branch5];

      const branches2 = [branch2_1, branch2_2];

      n1.addBranch(branch, ...branches);
      n2.addBranch(branch, ...branches);
      n3.addBranch(branch, ...branches);
      n4.addBranch(branch, ...branches);
      n5.addBranch(branch, ...branches);

      n1.addBranch(branch2_0, ...branches2);
      n2.addBranch(branch2_0, ...branches2);
      n3.addBranch(branch2_0, ...branches2);
      n4.addBranch(branch2_0, ...branches2);
      n5.addBranch(branch2_0, ...branches2);

      expect(n1.parents).toEqual([]);
      expect(n1.children).toEqual([n2.id, n3.id, n4.id, n5.id].sort());

      expect(n2.parents).toEqual([n1.id].sort());
      expect(n2.children).toEqual([n4.id]);

      expect(n3.parents).toEqual([n1.id, n4.id].sort());
      expect(n3.children).toEqual([]);

      expect(n4.parents).toEqual([n1.id, n2.id].sort());
      expect(n4.children).toEqual([n3.id, n5.id].sort());

      expect(n5.parents).toEqual([n4.id, n1.id].sort());
      expect(n5.children).toEqual([]);

      Time.clear();
    });
  });
});
