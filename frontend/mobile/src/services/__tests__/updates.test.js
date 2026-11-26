import { compareVersions } from '../updates';

test('compareVersions orders major.minor.patch, with or without the v prefix', () => {
  expect(compareVersions('v1.2.0', '1.1.9')).toBe(1);
  expect(compareVersions('1.1.0', 'v1.1.0')).toBe(0);
  expect(compareVersions('1.0.10', '1.0.9')).toBe(1);
  expect(compareVersions('1.9.0', '2.0.0')).toBe(-1);
});
