export function sceneFrameDelta(now, last) {
  return Math.max(0, Math.min((now - last) / 1000, .05));
}
