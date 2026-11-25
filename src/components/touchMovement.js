// Track each on-screen direction separately so releasing one arrow during a
// diagonal still runs, and clearing the input set also clears touch running.
const touchDirections = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']
  .map(key => Symbol.for('touch-run-' + key));

export function setTouchMovement(keys, key, down) {
  const marker = Symbol.for('touch-run-' + key);
  if (down) {
    keys.add(key);
    keys.add(marker);
  } else {
    keys.delete(key);
    keys.delete(marker);
  }
}

export function isRunning(keys) {
  return keys.has('shift') || touchDirections.some(marker => keys.has(marker));
}
