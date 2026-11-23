export const RAPIDS_DISTANCE = 360;
export const RAPIDS_SPEED = 8;
export const RAPIDS_LIVES = 3;
export const RAPIDS_LANES = [-5, 0, 5];

// A single obstacle per row leaves at least two routes through every encounter.
export function createRapidsCourse() {
  let seed = 11937;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const course = [];
  for (let distance = 35; distance < RAPIDS_DISTANCE - 15; distance += 14 + random() * 6) {
    course.push({ distance, x: RAPIDS_LANES[Math.floor(random() * 3)], type: ['rock', 'log', 'crocodile'][Math.floor(random() * 3)] });
  }
  return course;
}

export function rapidsCollision(boatX, obstacle, distance) {
  const radius = obstacle.type === 'log' ? 2.35 : obstacle.type === 'crocodile' ? 1.9 : 1.8;
  return Math.abs(obstacle.distance - distance) < 2.5 && Math.abs(obstacle.x - boatX) < radius;
}
