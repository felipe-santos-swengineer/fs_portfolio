import { SHRINES, SHIPWRECK, COLUMNS, SHORE_POINTS, BOAT_SHORE_CLEARANCE, shorePoint, insideRuinsShore, ruinsObstacle, nearTempleEntrance } from './ruinsWorld';

test('the boat detects stone and wooden obstacles', () => {
  expect(ruinsObstacle(SHRINES[0].x,SHRINES[0].z)).toBe('stone');
  expect(ruinsObstacle(SHIPWRECK.x,SHIPWRECK.z)).toBe('wood');
  expect(ruinsObstacle(COLUMNS[1][0],COLUMNS[1][1])).toBe('stone');
  expect(ruinsObstacle(0,10)).toBeNull();
});

test('the tunnel entrance is accessible only after all runes and near the gate', () => {
  const near={x:0,z:-25};
  expect(nearTempleEntrance(near,[])).toBe(false);
  expect(nearTempleEntrance(near,[true,true,false])).toBe(false);
  expect(nearTempleEntrance(near,[true,true,true])).toBe(true);
  expect(nearTempleEntrance({x:10,z:-25},[true,true,true])).toBe(false);
  expect(nearTempleEntrance({x:0,z:0},[true,true,true])).toBe(false);
});


test('shore collision follows every segment of the visible cliff with hull clearance', () => {
  expect(insideRuinsShore(0,25)).toBe(true);
  expect(insideRuinsShore(34,34)).toBe(false);
  for(let i=0;i<SHORE_POINTS;i++) {
    const a=shorePoint(i),b=shorePoint(i+1),x=(a.x+b.x)/2,z=(a.z+b.z)/2;
    const distance=Math.hypot(x,z),ux=x/distance,uz=z/distance;
    expect(insideRuinsShore(x,z)).toBe(false);
    expect(insideRuinsShore(x-ux*(BOAT_SHORE_CLEARANCE*.5),z-uz*(BOAT_SHORE_CLEARANCE*.5))).toBe(false);
    expect(insideRuinsShore(x+ux,z+uz)).toBe(false);
    expect(insideRuinsShore(x-ux*6,z-uz*6)).toBe(true);
  }
});


test('the shipwreck can be seen and approached from the entrance without overlapping the boat', () => {
  const distance=Math.hypot(SHIPWRECK.x,SHIPWRECK.z-25);
  expect(distance).toBeLessThan(8);
  expect(ruinsObstacle(0,25)).toBeNull();
});
