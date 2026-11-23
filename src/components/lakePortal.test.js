import { LAKE_PORTAL_Z, nearLakePortal, touchingLakePortal } from './lakePortal';

test('the spawn is near the portal without immediately triggering it', () => {
  const spawn={x:0,z:31};
  expect(nearLakePortal(spawn)).toBe(true);
  expect(touchingLakePortal(spawn)).toBe(false);
});

test('touching the portal platform activates it from either side', () => {
  expect(touchingLakePortal({x:0,z:LAKE_PORTAL_Z-2})).toBe(true);
  expect(touchingLakePortal({x:2,z:LAKE_PORTAL_Z})).toBe(true);
  expect(touchingLakePortal({x:3,z:LAKE_PORTAL_Z})).toBe(false);
});


test('the same proximity and contact distances work for a portal at another location', () => {
  const portal={x:5,z:31};
  expect(nearLakePortal({x:5,z:34.5},portal)).toBe(true);
  expect(touchingLakePortal({x:5,z:34.5},portal)).toBe(false);
  expect(touchingLakePortal({x:5,z:33},portal)).toBe(true);
  expect(nearLakePortal({x:0,z:34},portal)).toBe(false);
});
