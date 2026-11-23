import { spectralEyeOpacity } from './cursedCastleWeather';

test('the eyes fade in and out slowly and remain still with reduced motion', () => {
  expect(spectralEyeOpacity(0, 0, false)).toBe(0);
  expect(spectralEyeOpacity(3, 0, false)).toBeCloseTo(.375);
  expect(spectralEyeOpacity(5, 0, false)).toBe(.75);
  expect(spectralEyeOpacity(7, 0, false)).toBeCloseTo(.375);
  expect(spectralEyeOpacity(9, 0, false)).toBe(0);
  expect(spectralEyeOpacity(3, 1, true)).toBe(.32);
  expect(spectralEyeOpacity(9, 1, true)).toBe(.32);
});
