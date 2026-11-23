import { CAVE_LENGTH, CAVE_SPAWN, CAVE_CHECKPOINT, CAVE_HAZARDS, CAVE_DIVIDERS, CAVE_ALCOVES, CAVE_BRANCHES, CAVE_LOST, CAVE_HEARTS, CAVE_LEVERS, CAVE_CHAMBER_ENTRANCE, CAVE_STAIRS_START, CAVE_ARROW_TRAPS, caveStairHeight, nearCaveChamberEntrance, CAVE_CHECKPOINT_RADIUS, nearCaveCheckpoint, caveBlocked, caveHazardAt, caveSpikeExtension, caveRespawn, caveSwordHits, caveMonsterIntent } from './caveWorld';

test('the cave entrance and checkpoint are safe and within the walkable boundaries', () => {
  for (const point of [CAVE_SPAWN,CAVE_CHECKPOINT]) {
    expect(caveBlocked(point.x,point.z)).toBe(false);
    expect(caveHazardAt(point.x,point.z)).toBeNull();
  }
  expect(caveBlocked(12,0)).toBe(true);
  expect(caveBlocked(0,-CAVE_LENGTH-1)).toBe(true);
});

test('visible hazard areas cause damage and the player respawns at the correct safe point', () => {
  CAVE_HAZARDS.forEach(h=>expect(caveHazardAt(h.x,h.z)).toBe(h));
  expect(caveRespawn(-30)).toEqual(CAVE_SPAWN);
  expect(caveRespawn(-100)).toEqual(CAVE_CHECKPOINT);
});


test('stone dividers split the route while both sides stay open', () => {
  for (const r of CAVE_DIVIDERS) {
    const z = (r.minZ+r.maxZ)/2;
    expect(caveBlocked(0,z)).toBe(true);
    expect(caveBlocked(-6,z)).toBe(false);
    expect(caveBlocked(6,z)).toBe(false);
  }
});

test('each alcove and healing item is reachable and away from fixed hazards', () => {
  for (const h of CAVE_HEARTS) {
    expect(caveBlocked(h.x,h.z)).toBe(false);
    expect(caveHazardAt(h.x,h.z)).toBeNull();
  }
  for (const r of CAVE_ALCOVES) expect(caveBlocked((r.minX+r.maxX)/2,(r.minZ+r.maxZ)/2)).toBe(false);
});


test('sword attacks use the dungeon reach and facing arc', () => {
  const player={x:0,z:0};
  expect(caveSwordHits(player,0,{x:0,z:2})).toBe(true);
  expect(caveSwordHits(player,0,{x:0,z:-2})).toBe(false);
  expect(caveSwordHits(player,0,{x:0,z:3})).toBe(false);
  expect(caveSwordHits(player,Math.PI/2,{x:2,z:0})).toBe(true);
});


test('spike damage follows the visible trap and remains predictable with reduced motion', () => {
  const index=CAVE_HAZARDS.findIndex(h=>h.type==='spikes'),trap=CAVE_HAZARDS[index];
  const extended=(Math.PI*2-index*.9)/1.2, retracted=(Math.PI-index*.9)/1.2;
  expect(caveSpikeExtension(extended,index)).toBeCloseTo(1);
  expect(caveHazardAt(trap.x,trap.z,extended)).toBe(trap);
  expect(caveSpikeExtension(retracted,index)).toBeCloseTo(0);
  expect(caveHazardAt(trap.x,trap.z,retracted)).toBeNull();
  expect(caveHazardAt(trap.x,trap.z,retracted,true)).toBe(trap);
});


test('both lost travelers are at the end of connected winding branches', () => {
  const routes=[[[0,-50],[-15,-50],[-25,-50],[-31,-50],[-34,-60],[-34,-68],[-41,-70]],[[0,-93],[15,-93],[25,-93],[31,-93],[34,-102],[34,-108],[41,-110]]];
  routes.forEach((route,i)=>{route.forEach(([x,z],j)=>{expect(caveBlocked(x,z)).toBe(false);if(j){const [px,pz]=route[j-1];for(let t=0;t<=20;t++)expect(caveBlocked(px+(x-px)*t/20,pz+(z-pz)*t/20)).toBe(false);}});expect(caveBlocked(CAVE_LOST[i].x,CAVE_LOST[i].z)).toBe(false);});
  expect(CAVE_BRANCHES.length).toBe(9);
});

test('monster intent pursues, winds up and strikes with a cooldown', () => {
  const m={x:0,z:0,attackAt:0,nextAttack:0};
  expect(caveMonsterIntent(m,{x:5,z:0},0)).toBe('chase');
  expect(caveMonsterIntent(m,{x:1,z:0},1)).toBe('beginAttack');
  m.attackAt=1.55;m.nextAttack=2.9;
  expect(caveMonsterIntent(m,{x:1,z:0},1.2)).toBe('windup');
  expect(caveMonsterIntent(m,{x:1,z:0},1.6)).toBe('strike');
  m.attackAt=0;
  expect(caveMonsterIntent(m,{x:1,z:0},2)).toBe('idle');
});


test('levers are reachable without entering a fixed hazard', () => {
  CAVE_LEVERS.forEach(p=>{expect(caveBlocked(p.x,p.z)).toBe(false);expect(caveHazardAt(p.x,p.z)).toBeNull();});
});


test('the checkpoint activates only on the green floor', () => {
  expect(nearCaveCheckpoint(CAVE_CHECKPOINT.x,CAVE_CHECKPOINT.z)).toBe(true);
  expect(nearCaveCheckpoint(CAVE_CHECKPOINT.x+CAVE_CHECKPOINT_RADIUS+.1,CAVE_CHECKPOINT.z)).toBe(false);
  expect(nearCaveCheckpoint(9,CAVE_CHECKPOINT.z-8)).toBe(false);
});


test('the hidden mechanism is reachable through the winding deep branch', () => {
  const route=[[0,-168],[-15,-168],[-25,-168],[-32,-168],[-35,-180],[-35,-189],[-41,-192]];
  route.forEach(([x,z],i)=>{expect(caveBlocked(x,z,false)).toBe(false);if(i){const [px,pz]=route[i-1];for(let t=0;t<=20;t++)expect(caveBlocked(px+(x-px)*t/20,pz+(z-pz)*t/20,false)).toBe(false);}});
  expect(CAVE_LEVERS).toHaveLength(1);
});

test('the stairs and dragon chamber entrance require the hidden lever', () => {
  expect(caveBlocked(0,CAVE_STAIRS_START-1,false)).toBe(true);
  expect(caveBlocked(0,CAVE_STAIRS_START-1,true)).toBe(false);
  expect(caveStairHeight(0,-228,true)).toBeGreaterThan(0);
  expect(caveStairHeight(0,-228,false)).toBe(0);
  expect(nearCaveChamberEntrance(CAVE_CHAMBER_ENTRANCE.x,CAVE_CHAMBER_ENTRANCE.z,false)).toBe(false);
  expect(nearCaveChamberEntrance(CAVE_CHAMBER_ENTRANCE.x,CAVE_CHAMBER_ENTRANCE.z,true)).toBe(true);
});


test('every arrow launcher is mounted on a wall rather than an opening', () => {
  CAVE_ARROW_TRAPS.forEach(({z,side})=>{
    const opening=side<0?((z<=-40&&z>=-56)||(z<=-159&&z>=-177)):(z<=-83&&z>=-99);
    expect(opening).toBe(false);
  });
});

test('stairs and the chamber facade prevent walking outside or through stone', () => {
  expect(caveBlocked(2.3,-228,true)).toBe(true);
  expect(caveBlocked(0,-239.3,true)).toBe(true);
  expect(caveBlocked(0,-238,true)).toBe(false);
  expect(caveStairHeight(0,-220.5,true)).toBeCloseTo(.2);
  expect(caveStairHeight(0,-238,true)).toBeCloseTo(3.2);
});
