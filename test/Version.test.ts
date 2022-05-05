import { VersionMessage } from '../src/Message';
import { MockLeaf } from '../src/MockLeaf';
import { MessageKind } from '../src/type';

describe('Version', () => {
  it('should have the value passed in on creation', () => {
    const v = new VersionMessage(new MockLeaf(100), MessageKind.version, { value: 100 });

    expect(v.data?.value).toEqual(100);
  });
  it('should create version numbers in ascending orders', () => {
    const mockLeaf = new MockLeaf(100);
    const v = new VersionMessage(mockLeaf, MessageKind.version, { value: 100 });
    const v2 = new VersionMessage(mockLeaf, MessageKind.version, { value: 200 });

    expect(v2.vid).toBeGreaterThan(v.vid);
  });
});
