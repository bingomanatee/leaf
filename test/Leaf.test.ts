import { Leaf } from '../src';

describe('Leaf', () => {
  it('should have the value passed in on creation', () => {
    const l = new Leaf(100);

    expect(l.value).toBe(100);
  });

  describe('.next(..)', () => {
    it('should update the value', () => {
      const l = new Leaf(100);
      l.next(200);
      expect(l.value).toBe(200);
    });
    it('should increase the vid', () => {
      const l = new Leaf(100);
      const firstVid = l.vid;
      l.next(200);
      expect(l.vid).toBeGreaterThan(firstVid);
    });
  });

  describe('with children', () => {
    describe('.canBranch', () => {
      it('should NOT recognize branches in number', () => {
        expect(new Leaf(1000).canBranch).toBeFalsy();
      });
      it('should NOT recognize branches in string', () => {
        expect(new Leaf('a string').canBranch).toBeFalsy();
      });
      it('should NOT recognize branches in Symbol', () => {
        expect(new Leaf(Symbol('foo')).canBranch).toBeFalsy();
      });
      it('should recognize branches in Map', () => {
        expect(new Leaf(new Map()).canBranch).toBeTruthy();
      });
      it('should recognize branches in Array', () => {
        expect(new Leaf([]).canBranch).toBeTruthy();
      });
      it('should recognize branches in Map', () => {
        expect(new Leaf({}).canBranch).toBeTruthy();
      });
    });
    describe('with child values', () => {
      it('includes child values', () => {
        expect(new Leaf({ foo: 1, bar: 2 }).hasChildren).toBeFalsy();
        const l = new Leaf(
          { foo: 1, bar: 2 },
          {
            children: {
              vey: 3,
            },
          }
        );

        console.log('--- leaf with child is ', l, 'data is ', l.data);
        expect(l.value).toEqual({
          foo: 1,
          bar: 2,
          vey: 3,
        });
      });
    });
    describe('.hasChildren', () => {
      it('reflects presence/absence of children', () => {
        expect(new Leaf({ foo: 1, bar: 2 }).hasChildren).toBeFalsy();
        const l = new Leaf(
          { foo: 1, bar: 2 },
          {
            children: {
              vey: 3,
            },
          }
        );
        expect(l.hasChildren).toBeTruthy();
      });
    });
    describe('.addChild, remChild', () => {
      it('should reflect added children in value', () => {
        const l = new Leaf({ x: 0, y: 1 });
        expect(l.value).toEqual({ x: 0, y: 1 });
        l.addChild('z', 2);
        expect(l.value).toEqual({ x: 0, y: 1, z: 2 });
      });

      it('should reflect removed children in value', () => {
        const l = new Leaf(
          { x: 0, y: 1 },
          {
            children: {
              w: -1,
              z: 2,
            },
          }
        );
        expect(l.value).toEqual({ w: -1, x: 0, y: 1, z: 2 });
        l.remChild('w');
        expect(l.value).toEqual({ x: 0, y: 1, z: 2 });
      });
    });
  });
});
