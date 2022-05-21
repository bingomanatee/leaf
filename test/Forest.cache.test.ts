import { Forest } from '../src/Forest';

describe('forest', () => {
  describe('cache', () => {
    it('invalidates when tables are changes', () => {
      let genCount = 0;
      const forest = new Forest();
      const gen = forest.cache(
        () => {
          return ++genCount;
        },
        { nodes: true }
      );

      expect(gen()).toBe(1);
      expect(gen()).toBe(1);
      // clears cache when nodes are added
      const n1 = forest.nodes.add('foo');
      const n2 = forest.nodes.add('bar');
      expect(gen()).toBe(2);
      expect(gen()).toBe(2);
      // doesn't trigger on other tables
      forest.branches.add({ node: n1, target: n2 });
      expect(gen()).toBe(2);
      expect(gen()).toBe(2);
    });
  });
});
