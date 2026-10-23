import { VILLAGERS, createWalkingGraph, randomRoute, advanceVillager } from './villagers';
import { canWalk } from './villageNavigation';

test('os moradores escolhem rotas transitáveis sem atravessar casas ou a fonte', () => {
  const graph = createWalkingGraph();
  for (const person of VILLAGERS) for (const random of [() => 0, () => .37, () => .99]) {
    const route = randomRoute(graph, person, random);
    expect(route.length).toBeGreaterThan(0);
    let previous = person;
    for (const point of route) {
      expect(canWalk(point.x, point.z)).toBe(true);
      for (let i = 0; i <= 10; i++) expect(canWalk(previous.x + (point.x - previous.x) * i / 10, previous.z + (point.z - previous.z) * i / 10)).toBe(true);
      previous = point;
    }
  }
});

test('a caminhada não ultrapassa o destino e as pausas são respeitadas', () => {
  const npc = { group: { position: { x: 0, z: 5 } }, body: { rotation: { y: 0 } }, speed: 1, route: [{ x: 0, z: 6 }], wait: 1 };
  const graph = createWalkingGraph();
  expect(advanceVillager(npc, .5, graph)).toBe(false);
  expect(npc.group.position.z).toBe(5);
  advanceVillager(npc, .5, graph);
  expect(advanceVillager(npc, 2, graph)).toBe(true);
  expect(npc.group.position.z).toBe(6);
  expect(npc.route).toHaveLength(0);
});
