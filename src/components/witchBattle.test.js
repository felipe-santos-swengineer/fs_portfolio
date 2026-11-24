import * as THREE from 'three';
import { advanceWitchBattle, createWitchBattle, createWitchShockFlash, isWitchRefuge, witchLightningProgress, WITCH_WAVES } from './witchBattle';

function finishPhase(fight, position) {
  advanceWitchBattle(fight, fight.remaining, position);
}

function dodgePoison(fight) {
  while (fight.phase === 'poisonWarning') {
    const [first] = fight.poison.drops;
    const dodge = fight.poison.across
      ? { x: 0, z: first.z + (first.z > 0 ? -4 : 4) }
      : { x: first.x + (first.x > 0 ? -4 : 4), z: 0 };
    finishPhase(fight, dodge);
    finishPhase(fight, dodge);
  }
}

test('the electrified floor takes one life per wave and three mistakes end the fight', () => {
  const player = { x: 0, z: 7 };
  const fight = createWitchBattle(player);
  for (let lives = 2; lives >= 0; lives--) {
    const outside = { x: -16, z: 0 };
    dodgePoison(fight);
    finishPhase(fight, outside);
    expect(fight.phase).toBe('groundCast');
    expect(fight.lives).toBe(lives + 1);
    finishPhase(fight, outside);
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
  const fight = createWitchBattle({ x: 16.4, z: -21.9 }, () => .99);
  for (let wave = 1; wave <= WITCH_WAVES; wave++) {
    dodgePoison(fight);
    expect(fight.safe).toHaveLength(3);
    const position = fight.safe[0];
    expect(isWitchRefuge(fight.safe, position)).toBe(true);
    finishPhase(fight, position);
    finishPhase(fight, position);
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

test('poison timing varies and each attack makes two passes with a new line and a shared hit limit', () => {
  const player = { x: 1, z: 7 };
  const fight = createWitchBattle(player, () => 0);
  expect(fight.poisonWaves).toEqual([2, 4, 7]);
  expect(createWitchBattle(player, () => .99).poisonWaves).toEqual([3, 6, 9]);
  const safe = fight.safe[0];
  finishPhase(fight, safe);
  finishPhase(fight, safe);
  finishPhase(fight, safe);
  finishPhase(fight, player);
  expect(fight.phase).toBe('poisonWarning');
  const [first, second, ...rest] = fight.poison.drops;
  expect(rest.every(drop => drop.z === player.z)).toBe(true);
  expect(second.at).toBeGreaterThan(first.at);
  advanceWitchBattle(fight, fight.remaining, first);
  expect(fight.lives).toBe(3);
  advanceWitchBattle(fight, .01, second);
  expect(fight.lives).toBe(3);
  advanceWitchBattle(fight, second.at, second);
  expect(fight.lives).toBe(2);
  advanceWitchBattle(fight, .1, first);
  expect(fight.lives).toBe(2);
  const moved = { x: 1, z: 11 };
  finishPhase(fight, moved);
  expect(fight.phase).toBe('poisonWarning');
  expect(fight.poison.pass).toBe(2);
  expect(fight.poison.drops[0]).toMatchObject({ x: -first.x, z: moved.z });
  finishPhase(fight, moved);
  finishPhase(fight, fight.poison.drops[0]);
  expect(fight.phase).toBe('warning');
  expect(fight.wave).toBe(2);
  expect(fight.lives).toBe(2);
});

test('leaving a refuge while the floor is electrified costs a life', () => {
  const fight = createWitchBattle({ x: 0, z: 7 });
  finishPhase(fight, fight.safe[0]);
  finishPhase(fight, fight.safe[0]);
  expect(fight.lives).toBe(3);
  advanceWitchBattle(fight, .1, { x: -16, z: 0 });
  expect(fight.lives).toBe(2);
});

test('both characters can show independent shock colors and recover their original materials', () => {
  const player = new THREE.Mesh();
  const witch = new THREE.Mesh();
  const playerMaterial = player.material;
  const witchMaterial = witch.material;
  const flash = createWitchShockFlash(player, witch);
  flash.player();
  flash.update(.25, false);
  expect(player.material.color.getHex()).toBe(0xffffff);
  expect(witch.material).toBe(witchMaterial);
  flash.witch();
  flash.update(.25, false);
  expect(player.material.color.getHex()).toBe(0x56aaff);
  expect(witch.material.color.getHex()).toBe(0xffffff);
  flash.update(.1, true);
  expect(witch.material.color.getHex()).toBe(0x56aaff);
  flash.update(.8, true);
  expect(player.material).toBe(playerMaterial);
  expect(witch.material).toBe(witchMaterial);
  flash.dispose();
});
