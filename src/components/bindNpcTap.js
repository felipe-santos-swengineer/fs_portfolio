import { Raycaster, Vector2 } from 'three';
import { isDungeonPortalTap } from './dungeonPortalTap';

export function bindNpcTap(canvas, camera, characters, canTalk, talk) {
  const ray = new Raycaster();
  const pointer = new Vector2();
  let start = null;
  const cancel = () => { start = null; };
  const down = event => {
    start = event.isPrimary && event.button === 0 && canTalk()
      ? { id: event.pointerId, x: event.clientX, y: event.clientY }
      : null;
  };
  const up = event => {
    const initial = start;
    cancel();
    if (!isDungeonPortalTap(initial, event, !canTalk(), false)) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    ray.setFromCamera(pointer, camera);
    const objects = characters.filter(character => character.visible);
    let object = ray.intersectObjects(objects, true)[0]?.object;
    while (object && !characters.includes(object)) object = object.parent;
    if (object) talk(characters.indexOf(object));
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', cancel);
  };
}
