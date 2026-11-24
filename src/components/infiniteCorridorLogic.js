// Pure rules for the Hall of Infinity room. Keeping them separate lets the
// procedural loop and the cloak cycle be tested without a WebGL context.
export const SEGMENT_LENGTH = 14;
export const START_Z = 8;
export const BARRIER_Z = 1;
export const CORRIDOR_START_Z = START_Z - SEGMENT_LENGTH;
export const CORRIDOR_MIN_X = -3.3;
export const CORRIDOR_MAX_X = 3.3;
export const FOYER_CENTER_Z = START_Z;
export const FOYER_WALL_RADIUS = 6.5;
export const FOYER_WALK_RADIUS = 5.8;
export const FOYER_NECK_Z = 3.2;
export const FOYER_MAX_Z = FOYER_CENTER_Z + FOYER_WALK_RADIUS;
export const CLOAK_SECONDS = 10;
export const SPIN_EVERY = 10;
export const SPINS_TO_ESCAPE = 4;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function segmentCenterZ(index) {
  return START_Z - index * SEGMENT_LENGTH;
}

export function segmentFrontZ(index) {
  return segmentCenterZ(index) - SEGMENT_LENGTH / 2;
}

export function segmentIndexAt(z) {
  return Math.max(0, Math.floor((START_Z - z) / SEGMENT_LENGTH));
}

export function createSegmentPlan(index, random = Math.random) {
  const pick = total => Math.floor(random() * total);
  const palette = ['#4c4b52', '#514c56', '#454b50'][pick(3)];
  const debris = Array.from({ length: 2 + pick(3) }, () => ({
    x: (pick(2) ? 1 : -1) * (1.2 + random() * 2.1),
    z: (random() - .5) * (SEGMENT_LENGTH - 3),
    rotation: random() * Math.PI,
  }));
  return {
    index,
    palette,
    arch: random() > .45,
    sconceSide: pick(2) ? 1 : -1,
    crack: random() > .4,
    portrait: random() > .55,
    portraitSide: pick(2) ? 1 : -1,
    deviceOffset: (random() - .5) * 8,
    debris,
  };
}

export function cloakPhase(elapsed, seconds = CLOAK_SECONDS) {
  const time = Math.max(0, elapsed);
  const cycle = Math.floor(time / seconds);
  return {
    invisible: cycle % 2 === 0,
    remaining: seconds - (time % seconds),
    total: seconds,
  };
}

// Circular entrance room. The player can walk back and sideways freely; only
// the front neck leads to the dark corridor, and it stays closed without the
// cloak. The narrow neck shares the corridor's X limits.
export function clampFoyerPosition(next, { allowCross = false } = {}) {
  if (next.z <= FOYER_NECK_Z) {
    return {
      x: clamp(next.x, CORRIDOR_MIN_X, CORRIDOR_MAX_X),
      z: allowCross ? next.z : Math.max(BARRIER_Z, next.z),
    };
  }
  const dx = next.x, dz = next.z - FOYER_CENTER_Z;
  const distance = Math.hypot(dx, dz);
  if (distance <= FOYER_WALK_RADIUS) return { x: next.x, z: next.z };
  const scale = FOYER_WALK_RADIUS / distance;
  return { x: dx * scale, z: FOYER_CENTER_Z + dz * scale };
}

// Inside the corridor maxZ follows the furthest point already reached: it is
// never possible to walk back towards the safe room.
export function clampCorridorPosition(next, { maxZ = START_Z, minZ = -Infinity } = {}) {
  return {
    x: clamp(next.x, CORRIDOR_MIN_X, CORRIDOR_MAX_X),
    z: Math.max(minZ, Math.min(maxZ, next.z)),
  };
}

export function canPassBarrier(z, cloakTaken) {
  return cloakTaken || z > BARRIER_Z;
}

export function segmentsToGenerate(currentIndex, generatedIndex, { ahead = 2, stopIndex = null } = {}) {
  const last = stopIndex === null ? currentIndex + ahead : Math.min(stopIndex, currentIndex + ahead);
  const indices = [];
  for (let index = generatedIndex + 1; index <= last; index++) indices.push(index);
  return indices;
}

export function segmentsToRemove(currentIndex, generatedIndex, keep = 2) {
  const indices = [];
  for (let index = 0; index <= Math.min(generatedIndex, currentIndex - keep); index++) indices.push(index);
  return indices;
}

export function canSeePlayer(monster, player, invisible, range = 11) {
  if (invisible) return false;
  return Math.hypot(monster.x - player.x, monster.z - player.z) <= range;
}

// A floor door shows up at every tenth stretch. Using it turns the room once;
// after four turns the corridor opens into the next room.
export function hasFloorDoor(segmentIndex) {
  return segmentIndex > 0 && segmentIndex % SPIN_EVERY === 0;
}

export function spinCountAt(segmentIndex) {
  return Math.min(SPINS_TO_ESCAPE, Math.floor(Math.max(0, segmentIndex) / SPIN_EVERY));
}

export function floorDoorActive(segmentIndex, completedSpins) {
  return hasFloorDoor(segmentIndex) && spinCountAt(segmentIndex) > completedSpins;
}

export function inCheckpointSafeZone(position) {
  const checkpoint = Math.round((START_Z - position.z) / (SEGMENT_LENGTH * SPIN_EVERY));
  return checkpoint >= 1 && checkpoint <= SPINS_TO_ESCAPE
    && withinReach(position, { x: 0, z: segmentCenterZ(checkpoint * SPIN_EVERY) }, 4.5);
}

export function isCorridorComplete(completedSpins) {
  return completedSpins >= SPINS_TO_ESCAPE;
}

// Each turn rolls the room a quarter further around the player's forward axis.
// The roll is kept after the animation: the first turn leaves the floor as a
// wall, the second puts the player on the ceiling. The second target is chosen
// in the shortest direction so it always reads as a 180 degree flip.
export function spinTargetRoll(spinNumber, currentRoll, direction = 1) {
  if (spinNumber <= 1) return direction * Math.PI / 2;
  if (spinNumber === 2) return (currentRoll < 0 ? -1 : 1) * Math.PI;
  return currentRoll + direction * Math.PI / 2;
}

export function spinSurface(spinNumber) {
  if (spinNumber <= 0 || spinNumber >= SPINS_TO_ESCAPE) return 'floor';
  return spinNumber === 2 ? 'ceiling' : 'wall';
}

// "Up" for the rolled corridor. The camera orbits around this direction so it
// stays on the walkable side of the floor instead of seeing underneath it.
export function rollUp(roll) {
  return { x: -Math.sin(roll), y: Math.cos(roll) };
}

export function corridorCameraOffset(position, playerX, roll, insideCorridor) {
  // Keep the viewpoint inside the pillars and under the arches in room coordinates.
  const x = insideCorridor ? clamp(playerX + position.x, -3.65, 3.65) - playerX : position.x;
  const y = insideCorridor ? clamp(position.y, 1.5, 5.6) : position.y;
  const up = rollUp(roll);
  return { x: x * up.y + y * up.x, y: -x * up.x + y * up.y };
}

// Dying sends the player to the corridor entrance, unless a turning door was
// already reached: that door becomes the checkpoint.
export function checkpointRespawnZ(checkpointZ) {
  return Number.isFinite(checkpointZ) ? checkpointZ : CORRIDOR_START_Z;
}

// Monsters only pursue inside the corridor while the room is active.
export function shouldMonsterChase({ insideCorridor, seesPlayer, corridorEnded }) {
  return insideCorridor && seesPlayer && !corridorEnded;
}

export function withinReach(first, second, radius = 2.4) {
  return Math.hypot(first.x - second.x, first.z - second.z) <= radius;
}

// A wall is hidden only when the camera is on its outer side, so the player is
// never blocked by a wall while orbiting around the room.
export function shouldHideWall(cameraPoint, wallPoint, outwardNormal) {
  return (cameraPoint.x - wallPoint.x) * outwardNormal.x
    + ((cameraPoint.y ?? 0) - (wallPoint.y ?? 0)) * outwardNormal.y
    + (cameraPoint.z - wallPoint.z) * outwardNormal.z > 0;
}
