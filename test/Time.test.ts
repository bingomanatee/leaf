import { Time } from '../src/Time';

describe('Time', () => {
  it('should start at second zero', () => {
    Time.clear();
    expect(Time.second).toBe(0);
    Time.clear();
  });

  describe('Time.next', () => {
    Time.clear();
    const time = Time.next;
    const nextTime = Time.next;
    expect(time + 1).toBe(nextTime);

    const nextNextTime = Time.next;
    expect(nextTime + 1).toBe(nextNextTime);
    Time.clear();
  });
});
