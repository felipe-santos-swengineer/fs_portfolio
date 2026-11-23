import * as THREE from 'three';

const targetInParent = new THREE.Vector3();

// Characters face their local +Z axis. Convert the player position into the
// character parent's coordinates so boats and rotated scenery work too.
export function facePlayer(character, player) {
  if (!character?.parent || !player) return;
  player.getWorldPosition(targetInParent);
  character.parent.worldToLocal(targetInParent);
  const dx=targetInParent.x-character.position.x, dz=targetInParent.z-character.position.z;
  if (Math.hypot(dx,dz)>0.001) character.rotation.y=Math.atan2(dx,dz);
}
