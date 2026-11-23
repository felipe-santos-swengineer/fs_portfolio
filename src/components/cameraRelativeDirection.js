import * as THREE from 'three';

// Input z is positive backwards, matching screen arrow and WASD controls.
export function cameraRelativeDirection(camera, x, z) {
  const forward=new THREE.Vector3(); camera.getWorldDirection(forward); forward.y=0; forward.normalize();
  const right=new THREE.Vector3(-forward.z,0,forward.x);
  return forward.multiplyScalar(-z).addScaledVector(right,x).normalize();
}
