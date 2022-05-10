import { Branch } from '../src/Branch';
import { StateEnum } from '../src/types';

describe('Branch', () => {
  it('has the passed-in name', () => {
    const branch = new Branch({
      name: 'alpha',
      value: 1,
    });

    expect(branch.name).toBe('alpha');
    expect(branch.value).toBe(1);
    expect(typeof branch.id === 'symbol').toBeTruthy();
    expect(branch.state).toBe(StateEnum.new);
  });

  describe('.update', () => {
    it('updates value', () => {
      const branch = new Branch({
        name: 'alpha',
        value: 1,
      });

      const update = branch.update({ value: 2 });
      expect(update?.value).toBe(2);
      expect(branch.value).toBe(1);
      expect(branch.id).toBe(update.id);
    });
  });
});
