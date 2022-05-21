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
    });
  });
});
