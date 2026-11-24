import {
  BARRIER_Z,
  CLOAK_SECONDS,
  CORRIDOR_MAX_X,
  CORRIDOR_MIN_X,
  CORRIDOR_START_Z,
  FOYER_CENTER_Z,
  FOYER_MAX_Z,
  FOYER_NECK_Z,
  FOYER_WALK_RADIUS,
  SEGMENT_LENGTH,
  SPIN_EVERY,
  SPINS_TO_ESCAPE,
  START_Z,
  canPassBarrier,
  canSeePlayer,
  checkpointRespawnZ,
  clampCorridorPosition,
  clampFoyerPosition,
  cloakPhase,
  createSegmentPlan,
  floorDoorActive,
  hasFloorDoor,
  inCheckpointSafeZone,
  isCorridorComplete,
  corridorCameraOffset,
  rollUp,
  segmentCenterZ,
  segmentFrontZ,
  segmentIndexAt,
  segmentsToGenerate,
  segmentsToRemove,
  shouldHideWall,
  shouldMonsterChase,
  spinCountAt,
  spinSurface,
  spinTargetRoll,
  withinReach,
} from './infiniteCorridorLogic';

test.each([10, 20, 30, 40])('keeps the approach to checkpoint stretch %s clear of monsters', stretch => {
  const z = segmentCenterZ(stretch);
  expect(inCheckpointSafeZone({ x: 0, z })).toBe(true);
  expect(inCheckpointSafeZone({ x: 2, z: z + 3 })).toBe(true);
  expect(inCheckpointSafeZone({ x: 0, z: z - 5 })).toBe(false);
});

test('a dormant monster cannot resume chasing even when it sees the player', () => {
  expect(shouldMonsterChase({ insideCorridor: true, seesPlayer: true, corridorEnded: false, dormant: true })).toBe(false);
});

test.each([0, Math.PI / 4, -Math.PI / 2, Math.PI / 2, Math.PI])(
  'keeps the camera inside the playable side of the room at roll %s',
  roll => {
    const playerX = 3.3;
    const offset = corridorCameraOffset({ x: 6, y: 9 }, playerX, roll, true);
    const horizontal = offset.x * Math.cos(roll) + offset.y * Math.sin(roll);
    const height = -offset.x * Math.sin(roll) + offset.y * Math.cos(roll);
    expect(playerX + horizontal).toBeCloseTo(3.65);
    expect(height).toBeCloseTo(5.6);
  },
);

const seeded = value => {
  let state = value;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

test('os trechos formam uma linha reta contínua rumo ao fundo', () => {
  expect(segmentCenterZ(0)).toBe(START_Z);
  expect(segmentCenterZ(3)).toBe(START_Z - SEGMENT_LENGTH * 3);
  expect(segmentFrontZ(0)).toBe(BARRIER_Z);
  expect(segmentIndexAt(START_Z)).toBe(0);
  expect(segmentIndexAt(BARRIER_Z)).toBe(0);
  expect(segmentIndexAt(BARRIER_Z - SEGMENT_LENGTH)).toBe(1);
});

test('o plano de um trecho varia sem sair dos limites do corredor', () => {
  const plan = createSegmentPlan(2, seeded(42));
  expect(plan.index).toBe(2);
  expect(['#4c4b52', '#514c56', '#454b50']).toContain(plan.palette);
  expect([-1, 1]).toContain(plan.sconceSide);
  expect([-1, 1]).toContain(plan.portraitSide);
  expect(Math.abs(plan.deviceOffset)).toBeLessThanOrEqual(4);
  expect(plan.debris.length).toBeGreaterThanOrEqual(2);
  expect(plan.debris.every(piece => Math.abs(piece.x) <= 3.3)).toBe(true);
  expect(createSegmentPlan(2, seeded(42))).toEqual(plan);
});

test('o manto alterna dez segundos de invisibilidade e dez segundos sem aura', () => {
  expect(cloakPhase(0)).toEqual({ invisible: true, remaining: 10, total: 10 });
  expect(cloakPhase(9.9).invisible).toBe(true);
  expect(cloakPhase(CLOAK_SECONDS).invisible).toBe(false);
  expect(cloakPhase(15).remaining).toBe(5);
  expect(cloakPhase(20).invisible).toBe(true);
  expect(cloakPhase(31).remaining).toBe(9);
  expect(cloakPhase(-5)).toEqual(cloakPhase(0));
});

test('a sala circular permite voltar e andar lateralmente, mas não entrar no corredor', () => {
  expect(FOYER_CENTER_Z).toBe(START_Z);
  expect(FOYER_MAX_Z).toBe(START_Z + FOYER_WALK_RADIUS);
  expect(canPassBarrier(BARRIER_Z, false)).toBe(false);
  expect(canPassBarrier(BARRIER_Z + .1, false)).toBe(true);
  expect(canPassBarrier(BARRIER_Z, true)).toBe(true);
  expect(clampFoyerPosition({ x: 4, z: START_Z })).toEqual({ x: 4, z: START_Z });
  expect(clampFoyerPosition({ x: 20, z: START_Z })).toEqual({ x: FOYER_WALK_RADIUS, z: START_Z });
  expect(clampFoyerPosition({ x: 0, z: START_Z + 20 })).toEqual({ x: 0, z: FOYER_MAX_Z });
  expect(clampFoyerPosition({ x: 9, z: FOYER_NECK_Z })).toEqual({ x: CORRIDOR_MAX_X, z: FOYER_NECK_Z });
  expect(clampFoyerPosition({ x: -9, z: FOYER_NECK_Z })).toEqual({ x: CORRIDOR_MIN_X, z: FOYER_NECK_Z });
  expect(clampFoyerPosition({ x: 0, z: BARRIER_Z - 4 })).toEqual({ x: 0, z: BARRIER_Z });
  expect(clampFoyerPosition({ x: 0, z: BARRIER_Z - 4 }, { allowCross: true })).toEqual({ x: 0, z: BARRIER_Z - 4 });
});

test('o corredor é estreito e não permite voltar', () => {
  expect(clampCorridorPosition({ x: 9, z: -6 }, { maxZ: 14 })).toEqual({ x: CORRIDOR_MAX_X, z: -6 });
  expect(clampCorridorPosition({ x: 0, z: 2 }, { maxZ: -4, minZ: -12 })).toEqual({ x: 0, z: -4 });
  expect(clampCorridorPosition({ x: 0, z: -20 }, { maxZ: -4, minZ: -12 })).toEqual({ x: 0, z: -12 });
});

test('a geração avança dois trechos e descarta o que ficou para trás', () => {
  expect(segmentsToGenerate(0, 0)).toEqual([1, 2]);
  expect(segmentsToGenerate(2, 3)).toEqual([4]);
  expect(segmentsToGenerate(3, 3, { stopIndex: 4 })).toEqual([4]);
  expect(segmentsToRemove(3, 5)).toEqual([0, 1]);
  expect(segmentsToRemove(1, 3)).toEqual([]);
});

test('monstros só enxergam sem a aura e exigem proximidade para atacar', () => {
  const player = { x: 0, z: -10 };
  expect(canSeePlayer({ x: 1, z: -12 }, player, true)).toBe(false);
  expect(canSeePlayer({ x: 1, z: -12 }, player, false)).toBe(true);
  expect(canSeePlayer({ x: 1, z: 30 }, player, false)).toBe(false);
  expect(withinReach({ x: 0, z: -10 }, { x: .5, z: -11 }, 1.5)).toBe(true);
  expect(withinReach({ x: 0, z: -10 }, { x: 4, z: -11 }, 1.5)).toBe(false);
});

test('uma porta no chão aparece a cada dez trechos e faz a sala girar três vezes', () => {
  expect(SPIN_EVERY).toBe(10);
  expect(SPINS_TO_ESCAPE).toBe(4);
  expect(hasFloorDoor(0)).toBe(false);
  expect(hasFloorDoor(9)).toBe(false);
  expect(hasFloorDoor(10)).toBe(true);
  expect(hasFloorDoor(20)).toBe(true);
  expect(hasFloorDoor(30)).toBe(true);
  expect(hasFloorDoor(40)).toBe(true);
  expect(spinCountAt(9)).toBe(0);
  expect(spinCountAt(10)).toBe(1);
  expect(spinCountAt(20)).toBe(2);
  expect(spinCountAt(30)).toBe(3);
  expect(spinCountAt(50)).toBe(4);
  expect(floorDoorActive(10, 0)).toBe(true);
  expect(floorDoorActive(10, 1)).toBe(false);
  expect(floorDoorActive(20, 1)).toBe(true);
  expect(floorDoorActive(30, 2)).toBe(true);
  expect(floorDoorActive(30, 3)).toBe(false);
  expect(isCorridorComplete(2)).toBe(false);
  expect(floorDoorActive(40, 3)).toBe(true);
  expect(floorDoorActive(40, 4)).toBe(false);
  expect(isCorridorComplete(3)).toBe(false);
  expect(isCorridorComplete(4)).toBe(true);
});

test('cada giro mantém o corredor virado: parede, teto e parede oposta', () => {
  expect(spinTargetRoll(1, 0, 1)).toBeCloseTo(Math.PI / 2);
  expect(spinTargetRoll(1, 0, -1)).toBeCloseTo(-Math.PI / 2);
  expect(spinTargetRoll(2, Math.PI / 2, 1)).toBeCloseTo(Math.PI);
  expect(spinTargetRoll(2, -Math.PI / 2, -1)).toBeCloseTo(-Math.PI);
  expect(spinTargetRoll(3, Math.PI, 1)).toBeCloseTo(Math.PI * 1.5);
  expect(spinTargetRoll(3, -Math.PI, -1)).toBeCloseTo(-Math.PI * 1.5);
  expect(spinSurface(0)).toBe('floor');
  expect(spinSurface(1)).toBe('wall');
  expect(spinSurface(2)).toBe('ceiling');
  expect(spinSurface(3)).toBe('wall');
  expect(spinSurface(4)).toBe('floor');
  expect(spinTargetRoll(4, Math.PI * 1.5, 1)).toBeCloseTo(Math.PI * 2);
  expect(spinTargetRoll(4, -Math.PI * 1.5, -1)).toBeCloseTo(-Math.PI * 2);
  expect(rollUp(0).x).toBeCloseTo(0);
  expect(rollUp(0).y).toBeCloseTo(1);
  expect(rollUp(Math.PI / 2).x).toBeCloseTo(-1);
  expect(rollUp(Math.PI / 2).y).toBeCloseTo(0);
  expect(rollUp(Math.PI).x).toBeCloseTo(0);
  expect(rollUp(Math.PI).y).toBeCloseTo(-1);
});

test('a morte volta ao início do corredor, ou ao checkpoint da porta', () => {
  expect(CORRIDOR_START_Z).toBe(START_Z - SEGMENT_LENGTH);
  expect(checkpointRespawnZ(null)).toBe(CORRIDOR_START_Z);
  expect(checkpointRespawnZ(-132)).toBe(-132);
  expect(segmentIndexAt(checkpointRespawnZ(null))).toBe(1);
});

test('as paredes desaparecem quando a câmera fica do lado de fora', () => {
  const right = { x: 1, y: 0, z: 0 }, left = { x: -1, y: 0, z: 0 };
  expect(shouldHideWall({ x: 0, z: 0 }, { x: 4.75, z: 0 }, right)).toBe(false);
  expect(shouldHideWall({ x: 6, z: 0 }, { x: 4.75, z: 0 }, right)).toBe(true);
  expect(shouldHideWall({ x: -6, z: 0 }, { x: -4.75, z: 0 }, left)).toBe(true);
  expect(shouldHideWall({ x: 0, z: 0 }, { x: -4.75, z: 0 }, left)).toBe(false);
});

test('os monstros só perseguem depois que o jogador entra no corredor', () => {
  expect(shouldMonsterChase({ insideCorridor: false, seesPlayer: true, corridorEnded: false })).toBe(false);
  expect(shouldMonsterChase({ insideCorridor: true, seesPlayer: true, corridorEnded: false })).toBe(true);
  expect(shouldMonsterChase({ insideCorridor: true, seesPlayer: false, corridorEnded: false })).toBe(false);
  expect(shouldMonsterChase({ insideCorridor: true, seesPlayer: true, corridorEnded: true })).toBe(false);
});
