import { canWalk, nearbySite, SITES, PORTAL, isCastleThreshold, walkingSurface, overlapsRoad, advanceFootsteps } from './villageNavigation';

test('o viajante pode caminhar nas ruas e se aproximar de todas as entradas', () => {
  expect(canWalk(0, 5)).toBe(true);
  for (const [index, site] of SITES.entries()) {
    expect(canWalk(site.x, site.z + 3.1)).toBe(true);
    expect(nearbySite(site.x, site.z + 3.1)).toBe(index);
  }
});

test('os passos acompanham a distância percorrida, sem disparar ao ficar parado', () => {
  expect(advanceFootsteps(.5, 0)).toEqual({ steps: 0, distance: .5 });
  expect(advanceFootsteps(1, .5)).toEqual({ steps: 1, distance: .25 });
  expect(advanceFootsteps(0, 2.5)).toEqual({ steps: 2, distance: 0 });
  const lowFps = Array.from({ length: 30 }).reduce(s => { const n = advanceFootsteps(s.distance, 4.2 / 30); return { distance: n.distance, steps: s.steps + n.steps }; }, { distance: 0, steps: 0 });
  const highFps = Array.from({ length: 120 }).reduce(s => { const n = advanceFootsteps(s.distance, 4.2 / 120); return { distance: n.distance, steps: s.steps + n.steps }; }, { distance: 0, steps: 0 });
  expect(lowFps.steps).toBe(highFps.steps);
  expect(walkingSurface(0, 5)).toBe('stone');
  expect(walkingSurface(-7, 9)).toBe('stone');
  expect(walkingSurface(4, 4)).toBe('grass');
});

test('casas, fonte e limite do mapa bloqueiam a caminhada', () => {
  for (const site of SITES) expect(canWalk(site.x, site.z)).toBe(false);
  expect(canWalk(0, 0)).toBe(false);
  expect(canWalk(17, 0)).toBe(true);
  expect(canWalk(0, 19)).toBe(true);
  expect(canWalk(2, 19)).toBe(false);
  expect(canWalk(0, 22)).toBe(false);
  expect(canWalk(0, -18)).toBe(false);
  expect(nearbySite(0, 5)).toBe(-1);
  expect(canWalk(PORTAL.x, PORTAL.z)).toBe(true);
  expect(nearbySite(PORTAL.x, PORTAL.z)).toBe(4);
  expect(canWalk(0, -12)).toBe(false);
});

test('a margem das ruas protege o caminho das arvores e pedras', () => {
  expect(overlapsRoad(0, 13, 1.3)).toBe(true);
  expect(overlapsRoad(-14, 2, 1.3)).toBe(true);
  expect(overlapsRoad(8, 10, 1.3)).toBe(true);
  expect(overlapsRoad(8, 5, 1.3)).toBe(false);
});

test('a porta do castelo e acessivel sem atravessar a parede', () => {
  expect(canWalk(0, -10)).toBe(true);
  expect(isCastleThreshold(0, -10)).toBe(true);
  expect(nearbySite(0, -10)).toBe(5);
  expect(isCastleThreshold(3, -10)).toBe(false);
  expect(canWalk(0, -10.5)).toBe(false);
});
