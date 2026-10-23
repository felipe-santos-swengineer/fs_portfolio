export const SITES = [
  { x: -7, z: -6, title: 'TAVERNA', detail: 'Minha história', color: '#ba724b' },
  { x: 7, z: -6, title: 'BIBLIOTECA', detail: 'Sobre mim', color: '#6f9eac' },
  { x: -7, z: 6, title: 'OFICINA', detail: 'Projetos', color: '#b99456' },
  { x: 7, z: 6, title: 'CORREIO', detail: 'Contato', color: '#83a78a' },
];

export function canWalk(x, z) {
  return Math.hypot(x, z) < 17 && !SITES.some(b => Math.abs(x - b.x) < 3.05 && Math.abs(z - b.z) < 2.5) && Math.hypot(x, z) > 1.7;
}

export function nearbySite(x, z) {
  return SITES.findIndex(b => Math.hypot(x - b.x, z - (b.z + 3.1)) < 2.8);
}

export function walkingSurface(x, z) {
  return Math.abs(x) < 1.5 || Math.abs(z) < 1.5 || (Math.abs(z - 9) < .9 && Math.abs(x) < 10.5) ? 'stone' : 'grass';
}

// Advance only with real displacement; pushing into a wall never emits steps.
export function advanceFootsteps(distance, displacement, stride = 1.25) {
  const total = distance + displacement;
  return { steps: Math.floor(total / stride), distance: total % stride };
}
