import { canWalk } from './villageNavigation';

export const VILLAGERS = [
  { name: 'Bia', role: 'Guardiã da biblioteca', color: '#718eae', skin: '#b98d6d', x: 3, z: -10, speed: 1.05, lines: ['Que bom receber você por aqui! Obrigada por visitar o portfólio do Felipe. Na biblioteca, você encontra a formação, as experiências e as ideias que acompanham essa jornada.', 'Cada visita traz uma nova história para a vila. Obrigada por dedicar seu tempo ao trabalho do Felipe. Explore com calma: sempre há algo para descobrir!'] },
  { name: 'Tom', role: 'Artesão da oficina', color: '#b18556', skin: '#d2aa83', x: -3, z: 9, speed: .9, lines: ['Olá, viajante! Obrigado por visitar o portfólio do Felipe. Na oficina, as ideias ganham forma: entre para conhecer os projetos e as soluções que ele construiu.', 'Uma boa criação começa com curiosidade. Obrigado por trazer a sua até aqui! Dê uma olhada nos projetos da oficina e, se uma ideia surgir, passe no correio para conversar.'] },
  { name: 'Lia', role: 'Mensageira da vila', color: '#789e83', skin: '#8f624d', x: 3, z: 9, speed: 1.25, lines: ['Boas-vindas à vila! Obrigada por conhecer o portfólio do Felipe. Se quiser trocar ideias ou conversar sobre um projeto, o correio tem os caminhos para entrar em contato.', 'Sua visita já faz parte desta jornada. Obrigada por passear pela vila! Espero que você encontre inspiração por aqui e uma boa oportunidade de começar uma conversa.'] },
  { name: 'Rui', role: 'Anfitrião da taverna', color: '#aa6570', skin: '#c49b7b', x: -3, z: -9, speed: .85, lines: ['Entre e fique à vontade! Obrigado por visitar o portfólio do Felipe. A taverna guarda as histórias que deram origem a esta vila. Escolha uma porta e faça seu próprio caminho.', 'Sempre cabe mais uma pessoa nesta aventura. Obrigado pelo seu tempo e pela visita! Conheça a trajetória do Felipe, ouça as histórias e volte quando quiser.'] },
];

// An orthogonal graph keeps every segment outside the houses and fountain.
export function createWalkingGraph() {
  const graph = new Map();
  for (let x = -13; x <= 13; x++) for (let z = -13; z <= 13; z++) if (canWalk(x, z)) graph.set(`${x},${z}`, { x, z });
  return graph;
}

export function randomRoute(graph, position, random = Math.random) {
  const start = `${Math.round(position.x)},${Math.round(position.z)}`;
  if (!graph.has(start)) return [];
  const candidates = [...graph.values()].filter(p => Math.hypot(p.x - position.x, p.z - position.z) > 5);
  if (!candidates.length) return [];
  const destination = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
  const goal = `${destination.x},${destination.z}`;
  const queue = [start], previous = new Map([[start, null]]);
  for (let head = 0; head < queue.length && !previous.has(goal); head++) {
    const key = queue[head], p = graph.get(key);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = `${p.x + dx},${p.z + dz}`;
      if (graph.has(next) && !previous.has(next)) { previous.set(next, key); queue.push(next); }
    }
  }
  if (!previous.has(goal)) return [];
  const route = []; let key = goal;
  while (key !== start) { route.unshift(graph.get(key)); key = previous.get(key); }
  return route;
}

export function advanceVillager(npc, dt, graph, random = Math.random) {
  if (npc.wait > 0) { npc.wait = Math.max(0, npc.wait - dt); return false; }
  if (!npc.route.length) { npc.route = randomRoute(graph, npc.group.position, random); npc.wait = .8 + random() * 2.5; return false; }
  const p = npc.group.position, target = npc.route[0];
  const dx = target.x - p.x, dz = target.z - p.z, distance = Math.hypot(dx, dz), step = Math.min(distance, npc.speed * dt);
  if (distance < .001) { npc.route.shift(); return false; }
  p.x += dx / distance * step; p.z += dz / distance * step;
  const angle = Math.atan2(dx, dz);
  npc.body.rotation.y += Math.atan2(Math.sin(angle - npc.body.rotation.y), Math.cos(angle - npc.body.rotation.y)) * Math.min(1, dt * 10);
  if (step >= distance) npc.route.shift();
  return true;
}
