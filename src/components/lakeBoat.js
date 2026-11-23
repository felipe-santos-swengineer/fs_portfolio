import * as THREE from 'three';

// Shared by the lake and the rapids so both scenes use the same vessel.
export function createLakeBoat(add) {
  const boat=new THREE.Group();
  add(boat,new THREE.CylinderGeometry(1.8,1.15,.9,6).scale(1,1,1.65),'#714629',0,.38,0);
  add(boat,new THREE.CylinderGeometry(1.55,1.55,.14,6).scale(1,1,1.65),'#b58c5a',0,.87,0);
  [-1,1].forEach(side=>{const rail=add(boat,new THREE.BoxGeometry(.16,.24,3.9),'#573922',side*1.25,1.08,0); rail.rotation.y=side*.06;});
  add(boat,new THREE.CylinderGeometry(.1,.13,4.7,10),'#64442c',0,3.25,-.85);
  add(boat,new THREE.BoxGeometry(2.5,.12,.12),'#64442c',0,4.85,-.85);
  const shape=new THREE.Shape(); shape.moveTo(-1.13,0); shape.lineTo(1.13,0); shape.lineTo(.86,2.55); shape.lineTo(-.86,2.55); shape.closePath();
  const sail=add(boat,new THREE.ShapeGeometry(shape),'#f1e4c7',0,2.12,-.84); sail.material.side=THREE.DoubleSide;
  add(boat,new THREE.BoxGeometry(2.45,.1,.1),'#765235',0,2.1,-.85);
  add(boat,new THREE.BoxGeometry(1.7,.15,.48),'#8b643d',0,1.05,1.55);
  return boat;
}
