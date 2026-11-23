import * as THREE from 'three';
import { cameraRelativeDirection } from './cameraRelativeDirection';

test('boat movement follows the camera orientation and stays horizontal', () => {
  const camera=new THREE.PerspectiveCamera();
  camera.position.set(0,10,10);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const forward=cameraRelativeDirection(camera,0,-1);
  expect(forward.z).toBeCloseTo(-1); expect(forward.y).toBe(0);
  const right=cameraRelativeDirection(camera,1,0);
  expect(right.x).toBeCloseTo(1);
  camera.position.set(10,10,0);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  expect(cameraRelativeDirection(camera,0,-1).x).toBeCloseTo(-1);
  expect(cameraRelativeDirection(camera,1,0).z).toBeCloseTo(-1);
});
