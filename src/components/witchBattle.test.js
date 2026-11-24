import { advanceWitchBattle, createWitchBattle, isWitchRefuge, witchLightningProgress, WITCH_WAVES } from './witchBattle';

test('the electrified floor takes one life per wave and three mistakes end the fight', () => {
  const player = { x: 0, z: 7 };
  const fight = createWitchBattle(player);
  for (let lives = 2; lives >= 0; lives--) {
    const outside = { x: -16, z: 0 };
    advanceWitchBattle(fight, fight.remaining, outside);
    expect(fight.lives).toBe(lives);
    advanceWitchBattle(fight, .3, outside);
    expect(fight.lives).toBe(lives);
    if (lives) {
      advanceWitchBattle(fight, fight.remaining, outside);
      advanceWitchBattle(fight, fight.remaining, player);
    }
  }
  expect(fight.phase).toBe('lost');
});

test('every third wave causes a lightning strike and the third strike wins the fight', () => {
  const fight = createWitchBattle({ x: 16.4, z: -21.9 });
  for (let wave = 1; wave <= WITCH_WAVES; wave++) {
    expect(fight.safe).toHaveLength(3);
    const position = fight.safe[0];
    expect(isWitchRefuge(fight.safe, position)).toBe(true);
    advanceWitchBattle(fight, fight.remaining, position);
    expect(fight.phase).toBe('shock');
    advanceWitchBattle(fight, fight.remaining, position);
    if (wave % 3 === 0) {
      expect(fight.phase).toBe('ascent');
      expect(witchLightningProgress(fight)).toBe(0);
      advanceWitchBattle(fight, fight.remaining, position);
      expect(fight.phase).toBe('strike');
      expect(witchLightningProgress(fight)).toBe(1);
      expect(fight.strikes).toBe(wave / 3);
      fight.reactionPending = true;
      advanceWitchBattle(fight, fight.remaining, position);
      expect(fight.phase).toBe('spin');
      advanceWitchBattle(fight, 2.5, position);
      expect(fight.phase).toBe('spin');
      expect(witchLightningProgress(fight)).toBe(1);
      fight.reactionPending = false;
      advanceWitchBattle(fight, .016, position);
      expect(fight.phase).toBe(wave === WITCH_WAVES ? 'fall' : 'descent');
    } else {
      expect(fight.phase).toBe('recovery');
    }
    advanceWitchBattle(fight, fight.remaining, position);
  }
  expect(fight.phase).toBe('won');
  expect(fight.lives).toBe(3);
});

test('leaving a refuge while the floor is electrified costs a life', () => {
  const fight = createWitchBattle({ x: 0, z: 7 });
  advanceWitchBattle(fight, fight.remaining, fight.safe[0]);
  expect(fight.lives).toBe(3);
  advanceWitchBattle(fight, .1, { x: -16, z: 0 });
  expect(fight.lives).toBe(2);
});
