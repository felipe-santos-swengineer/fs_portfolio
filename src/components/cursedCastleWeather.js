// The long fade avoids abrupt flashes; reduced motion keeps the eyes steady.
export function spectralEyeOpacity(time, index, reduceMotion) {
  if (reduceMotion) return .32;
  const cycle = (time + index * 2.6) % 12;
  if (cycle < 2 || cycle >= 8) return 0;
  if (cycle < 4) return (cycle - 2) / 2 * .75;
  if (cycle < 6) return .75;
  return (8 - cycle) / 2 * .75;
}
