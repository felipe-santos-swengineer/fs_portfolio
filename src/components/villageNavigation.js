export const SITES = [
  { x: -7, z: -6, title: 'TAVERNA', detail: 'Minha história', color: '#ba724b' },
  { x: 7, z: -6, title: 'BIBLIOTECA', detail: 'Sobre mim', color: '#6f9eac' },
  { x: -7, z: 6, title: 'OFICINA', detail: 'Projetos', color: '#b99456' },
  { x: 7, z: 6, title: 'CORREIO', detail: 'Contato', color: '#83a78a' },
];

export const PORTAL = { x: -16, z: 0 };
export const CASTLE_ENTRANCE = { x: 0, z: -10.3 };

export function canWalk(x, z) {
  const island = Math.abs(x) < 18 && Math.abs(z) < 14;
  const dock = z >= 14 && z < 21.5 && Math.abs(x) < 1.35;
  const castle = Math.abs(x) < 5.2 && z < -10.3;
  return (island || dock) && !castle && !SITES.some(b => Math.abs(x - b.x) < 3.05 && Math.abs(z - b.z) < 2.5) && Math.hypot(x, z) > 1.7;
}

export function isCastleThreshold(x, z) {
  return Math.abs(x - CASTLE_ENTRANCE.x) < .9 && z > -10.4 && z < -9.8;
}

export function nearbySite(x, z) {
  if (Math.abs(x - CASTLE_ENTRANCE.x) < 1.5 && z > -10.4 && z < -8.7) return 5;
  if (Math.hypot(x - PORTAL.x, z - PORTAL.z) < 2.5) return 4;
  return SITES.findIndex(b => Math.hypot(x - b.x, z - (b.z + 3.1)) < 2.8);
}

export function walkingSurface(x, z) {
  return (z >= 14 && z < 21.5 && Math.abs(x) < 1.35) || Math.abs(x) < 1.5 || Math.abs(z) < 1.5 || (Math.abs(z - 9) < .9 && Math.abs(x) < 10.5) ? 'stone' : 'grass';
}

// Keep scenery and its visible canopy clear of all paved corridors.
export function overlapsRoad(x, z, margin = 0) {
  return Math.abs(x) < 1.5 + margin || Math.abs(z) < 1.5 + margin ||
    (Math.abs(z - 9) < .9 + margin && Math.abs(x) < 10.5 + margin);
}

// Advance only with real displacement; pushing into a wall never emits steps.
export function advanceFootsteps(distance, displacement, stride = 1.25) {
  const total = distance + displacement;
  return { steps: Math.floor(total / stride), distance: total % stride };
}
