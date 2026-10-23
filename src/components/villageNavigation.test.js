import { canWalk, nearbySite, SITES, walkingSurface, advanceFootsteps } from './villageNavigation';

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
  expect(canWalk(17, 0)).toBe(false);
  expect(canWalk(0, -18)).toBe(false);
  expect(nearbySite(0, 5)).toBe(-1);
});
