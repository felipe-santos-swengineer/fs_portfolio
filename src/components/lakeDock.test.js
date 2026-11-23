import { BOARDING_DISTANCE, BOAT_MOORING, dockLanding } from './lakeDock';

test('boat can touch the front and either side of the dock', () => {
  expect(dockLanding(0, 10.1, 0)).toEqual({x:0,z:14.5});
  expect(dockLanding(-4.8, 17, Math.PI/2)).toEqual({x:-1.25,z:17});
  expect(dockLanding(4.8, 20, -Math.PI/2)).toEqual({x:1.25,z:20});
});

test('only contact with the rotated hull permits disembarking', () => {
  expect(dockLanding(8, 17, Math.PI/2)).toBeNull();
  expect(dockLanding(0, 8, 0)).toBeNull();
  expect(dockLanding(4.1, 20, 0)).toBeNull();
});


test('the moored boat stays clear of the dock at any heading while remaining boardable', () => {
  for (let step=0;step<32;step++) {
    expect(dockLanding(BOAT_MOORING.x, BOAT_MOORING.z, step*Math.PI/16)).toBeNull();
  }
  expect(Math.hypot(BOAT_MOORING.x, 12.4-BOAT_MOORING.z)).toBeLessThan(BOARDING_DISTANCE);
});
