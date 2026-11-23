import { createRapidsCourse, rapidsCollision, RAPIDS_DISTANCE } from './rapidsCourse';

test('the course has spaced obstacles of each kind and safe routes', () => {
  const course=createRapidsCourse();
  expect(new Set(course.map(item=>item.type))).toEqual(new Set(['rock','log','crocodile']));
  expect(course.every((item,i)=>item.distance<RAPIDS_DISTANCE && (!i || item.distance-course[i-1].distance>=14))).toBe(true);
  course.forEach(item=>expect([-6.8,6.8].some(x=>!rapidsCollision(x,item,item.distance))).toBe(true));
});

test('collisions require overlap along the river and across the boat', () => {
  const obstacle={type:'rock',x:0,distance:50};
  expect(rapidsCollision(0,obstacle,50)).toBe(true);
  expect(rapidsCollision(5,obstacle,50)).toBe(false);
  expect(rapidsCollision(0,obstacle,54)).toBe(false);
});
