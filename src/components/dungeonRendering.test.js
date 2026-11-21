import * as THREE from 'three';
import { batchStaticBoxes } from './dungeonRendering';

test('agrupa blocos estaticos identicos preservando posicao e cores', () => {
  const scene = new THREE.Scene();
  const make = (x, color) => { const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 2), new THREE.MeshStandardMaterial({ color })); mesh.position.x = x; scene.add(mesh); return mesh; };
  make(-4, '#aa9988'); make(7, '#aa9988'); const different = make(3, '#112233');
  expect(batchStaticBoxes(scene)).toBe(1);
  const batch = scene.children.find(o => o.isInstancedMesh);
  expect(batch.count).toBe(2);
  const matrix = new THREE.Matrix4(); batch.getMatrixAt(0, matrix); expect(matrix.elements[12]).toBe(-4);
  batch.getMatrixAt(1, matrix); expect(matrix.elements[12]).toBe(7);
  expect(scene.children).toContain(different);
});
