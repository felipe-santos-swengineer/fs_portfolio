import * as THREE from 'three';

export const COURTYARD_EXIT_Z = -20.6;

export function createCourtyardRewards(scene, { mesh, box }) {
  const key = new THREE.Group();
  const gold = '#efc665';
  mesh(key, new THREE.TorusGeometry(.23, .065, 8, 16), gold, 0, .28, 0);
  box(key, .105, .74, .105, gold, 0, -.17, 0);
  box(key, .32, .11, .11, gold, .11, -.31, 0);
  box(key, .24, .11, .11, gold, .07, -.49, 0);
  const keyLight = new THREE.PointLight(gold, 4, 4);
  key.add(keyLight);
  key.visible = false;
  scene.add(key);

  const exit = new THREE.Group();
  exit.position.z = COURTYARD_EXIT_Z;
  const stone = '#5e5653';
  for (const side of [-1, 1]) {
    box(exit, .62, 3.2, .95, stone, side * 1.7, 1.6, 0);
    box(exit, .74, .24, 1.06, '#827264', side * 1.7, .12, 0);
  }
  const arch = mesh(exit, new THREE.TorusGeometry(1.7, .31, 6, 14, Math.PI), stone, 0, 3.1, 0);
  arch.scale.z = 1.45;
  const passage = new THREE.Shape();
  passage.moveTo(-1.39, .03);
  passage.lineTo(1.39, .03);
  passage.lineTo(1.39, 3.1);
  passage.absarc(0, 3.1, 1.39, 0, Math.PI, false);
  passage.closePath();
  const opening = new THREE.Mesh(new THREE.ShapeGeometry(passage),
    new THREE.MeshBasicMaterial({ color: '#d19a50', side: THREE.DoubleSide }));
  opening.position.z = -.14;
  exit.add(opening);
  box(exit, 3.35, .055, 1.65, '#9f7c51', 0, .025, .17);
  const exitLight = new THREE.PointLight('#ffb969', 38, 11);
  exitLight.position.set(0, 2.3, 1.15);
  exit.add(exitLight);
  exit.visible = false;
  scene.add(exit);
  return { key, exit };
}
