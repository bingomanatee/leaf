import { Forest } from '../src/Forest';
import { Node } from '../src/Node';
describe('Node', () => {
  describe('validation', () => {
    it('should error on form change', () => {
      const forest = new Forest();
      const n1 = forest.nodes.add({ value: 'foo' });
      expect(() => {
        const node = forest.nodes.get(n1) as Node;
        node.update(['philistine']);
      }).toThrow();
      const node = forest.nodes.get(n1) as Node;
      expect(node?.value).toBe('foo');
      expect(node?.form).toBe('scalar');
      expect(node?.type).toBe('string');
    });

    it('should allow different types', () => {
      const forest = new Forest();
      const n1 = forest.nodes.add({ value: 'foo' });
      const node = forest.nodes.get(n1) as Node;
      node?.update(100);
      expect(node?.value).toBe(100);
      expect(node?.form).toBe('scalar');
      expect(node?.type).toBe('number');
    });

    it('should error on type change if types constraint is present', () => {
      const forest = new Forest();
      const n1 = forest.nodes.add({ value: 'foo', config: { type: true } });
      expect(() => {
        const node = forest.nodes.get(n1) as Node;
        node.update(100);
      }).toThrow();
      const node = forest.nodes.get(n1) as Node;
      expect(node?.value).toBe('foo');
      expect(node?.form).toBe('scalar');
      expect(node?.type).toBe('string');
    });
  });
});
