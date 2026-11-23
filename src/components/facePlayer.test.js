import * as THREE from 'three';
import { facePlayer } from './facePlayer';

test('faces a moving player without turning when both positions coincide', () => {
  const scene=new THREE.Scene(), npc=new THREE.Group(),player=new THREE.Group();scene.add(npc,player);
  player.position.set(4,0,0);facePlayer(npc,player);expect(npc.rotation.y).toBeCloseTo(Math.PI/2);
  player.position.set(0,0,-3);facePlayer(npc,player);expect(Math.abs(npc.rotation.y)).toBeCloseTo(Math.PI);
  const before=npc.rotation.y;player.position.set(0,0,0);facePlayer(npc,player);expect(npc.rotation.y).toBe(before);
});

test('faces the player when the NPC and player have transformed parents', () => {
  const scene=new THREE.Scene(),wreck=new THREE.Group(),boat=new THREE.Group(),npc=new THREE.Group(),player=new THREE.Group();
  scene.add(wreck,boat);wreck.position.set(7,0,-3);wreck.rotation.y=Math.PI/2;boat.position.set(13,0,-3);wreck.add(npc);boat.add(player);
  facePlayer(npc,player);scene.updateMatrixWorld(true);
  const direction=new THREE.Vector3(0,0,1).transformDirection(npc.matrixWorld),toPlayer=player.getWorldPosition(new THREE.Vector3()).sub(npc.getWorldPosition(new THREE.Vector3())).setY(0).normalize();
  expect(direction.dot(toPlayer)).toBeCloseTo(1);
});
