export const SITES = [
  { x: -7, z: -6, title: 'TAVERNA', detail: 'Minha história', color: '#ba724b' },
  { x: 7, z: -6, title: 'BIBLIOTECA', detail: 'Sobre mim', color: '#6f9eac' },
  { x: -7, z: 6, title: 'OFICINA', detail: 'Projetos', color: '#b99456' },
  { x: 7, z: 6, title: 'CORREIO', detail: 'Contato', color: '#83a78a' },
];

export const PORTAL = { x: -16, z: 0 };
export const MARKET_DISPLAY = { x: 26, z: 5.2 };
export const MARKET_FOOD = { x: 26, z: -5.2 };
export const MARKET_POTIONS = { x: 26, z: 0 };
export const CASTLE_ENTRANCE = { x: 0, z: -17.3 };

export function canWalk(x, z) {
  const island = Math.abs(x) < 18 && z > -32 && z < 14;
  const dock = z >= 14 && z < 21.5 && Math.abs(x) < 1.35;
  const marketPlaza = x >= 18 && x < 30 && Math.abs(z) < 8.5;
  const castle = z < CASTLE_ENTRANCE.z;
  const marketWall = x > 17.7 && x < 19.2 && Math.abs(z) >= 2.6;
  return (island || dock || marketPlaza) && !castle && !marketWall && !SITES.some(b => Math.abs(x - b.x) < 3.05 && Math.abs(z - b.z) < 2.5) && Math.hypot(x, z) > 1.7;
}

export function isCastleThreshold(x, z) {
  return Math.abs(x - CASTLE_ENTRANCE.x) < 1.35 && z > CASTLE_ENTRANCE.z - .1 && z < CASTLE_ENTRANCE.z + .8;
}

export function isThroneExit(x, z) {
  return Math.abs(x) < 2.1 && z > 13;
}

export function nearbySite(x, z) {
  if (Math.hypot(x - MARKET_FOOD.x, z - MARKET_FOOD.z) < 1.65) return 7;
  if (Math.hypot(x - MARKET_POTIONS.x, z - MARKET_POTIONS.z) < 1.65) return 8;
  if (Math.hypot(x - MARKET_DISPLAY.x, z - MARKET_DISPLAY.z) < 1.65) return 6;
  if (Math.abs(x - CASTLE_ENTRANCE.x) < 1.5 && z > CASTLE_ENTRANCE.z - .1 && z < CASTLE_ENTRANCE.z + 1.6) return 5;
  if (Math.hypot(x - PORTAL.x, z - PORTAL.z) < 2.5) return 4;
  return SITES.findIndex(b => Math.hypot(x - b.x, z - (b.z + 3.1)) < 2.8);
}

export function walkingSurface(x, z) {
  return (x >= 18 && x < 30 && Math.abs(z) < 8.5) || (z >= 14 && z < 21.5 && Math.abs(x) < 1.35) || Math.abs(x) < 1.5 || Math.abs(z) < 1.5 || (Math.abs(z - 9) < .9 && Math.abs(x) < 10.5) ? 'stone' : 'grass';
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


export const ENGLISH_VILLAGE_SIGNS = {
  'TAVERNA': 'TAVERN', 'Minha hist\u00f3ria': 'My story',
  'BIBLIOTECA': 'LIBRARY', 'Sobre mim': 'About me',
  'OFICINA': 'WORKSHOP', 'Projetos': 'Projects',
  'CORREIO': 'POST OFFICE', 'Contato': 'Contact',
  'EXPERI\u00caNCIA': 'EXPERIENCE', 'FORMA\u00c7\u00c3O': 'EDUCATION',
  'TECNOLOGIAS': 'TECHNOLOGIES', 'Toque para conhecer': 'Tap to explore',
  'F \u00b7 CONVERSAR': 'F \u00b7 TALK',
};
