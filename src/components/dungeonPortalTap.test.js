import { isDungeonPortalTap } from './dungeonPortalTap';

test('a click or short touch can activate the portal', () => {
  const start={id:1,x:40,y:50};
  expect(isDungeonPortalTap(start,{pointerId:1,clientX:42,clientY:51},false,false)).toBe(true);
});

test('camera drags, other pointers, paused scenes and challenges do not activate it', () => {
  const start={id:1,x:40,y:50},tap={pointerId:1,clientX:40,clientY:50};
  expect(isDungeonPortalTap(start,{...tap,clientX:50},false,false)).toBe(false);
  expect(isDungeonPortalTap(start,{...tap,pointerId:2},false,false)).toBe(false);
  expect(isDungeonPortalTap(start,tap,true,false)).toBe(false);
  expect(isDungeonPortalTap(start,tap,false,true)).toBe(false);
});
