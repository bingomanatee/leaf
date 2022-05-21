import { Forest } from '../src/Forest';
import { Time } from '../src/Time';
import { FormEnum } from '../src/types';
import { Node } from '../src/Node';

describe('forest', () => {
  beforeEach(() => {
    Time.clear();
  });
  describe('Node', () => {
    it('has the right value', () => {
      const forest = new Forest();

      const nid = forest.nodes.add({ value: 'foo' });

      const node = forest.nodes.get(nid);
      expect(node?.data).toBe('foo');
      if (node) {
        const nodeAdNode = node as Node;
        expect(nodeAdNode.form).toBe(FormEnum.scalar);
      }
    });
  });

  describe('.update', () => {
    describe('with any form allowed', () => {
      it('allows value and form changes', () => {
        const forest = new Forest();

        const nid = forest.nodes.add({
          value: 'foo',
          config: { form: FormEnum.any },
        });
        const node = forest.nodes.get(nid) as Node;
        // console.log('node: ', node);
        node.update([1, 2, 3]);

        expect(node.data).toEqual([1, 2, 3]);
        expect(node.form).toEqual(FormEnum.array);
      });
    });

    describe('standard - locked form', () => {
      it('allows for value change', () => {
        const forest = new Forest();

        const nid = forest.nodes.add({
          value: 'foo',
          config: { form: FormEnum.any },
        });
        const node = forest.nodes.get(nid) as Node;
        // console.log('node: ', node);
        node.update('updated to');

        expect(node.data).toEqual('updated to');
        expect(node.form).toEqual(FormEnum.scalar);
      });
    });
  });
});
