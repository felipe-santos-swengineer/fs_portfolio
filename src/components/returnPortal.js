import * as THREE from 'three';
import { dungeonPortalLabel } from './dungeonI18n';

// Matches the return portal in Lake.js: dimensions, materials and sign.
export function createReturnPortal(scene, position, language, labelFor = dungeonPortalLabel) {
  const group=new THREE.Group();group.position.set(position.x,0,position.z);scene.add(group);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.1,.25,24),new THREE.MeshStandardMaterial({color:'#4a5268',roughness:.88}));base.position.y=.3;group.add(base);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(1.65,.2,12,40),new THREE.MeshStandardMaterial({color:'#86c9e7',roughness:.88,emissive:'#86c9e7',emissiveIntensity:1.1}));arch.position.y=2.25;group.add(arch);
  const surface=new THREE.Mesh(new THREE.CircleGeometry(1.46,40),new THREE.MeshBasicMaterial({color:'#5b8fd5',transparent:true,opacity:.8,side:THREE.DoubleSide}));surface.position.y=2.25;group.add(surface);
  const light=new THREE.PointLight('#78aaff',14,8);light.position.set(0,2,1);group.add(light);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));label.position.y=4.8;label.scale.set(5,1.25,1);group.add(label);
  const setLanguage=lang=>{ctx.fillStyle='#201d20';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#8ecce4';ctx.lineWidth=5;ctx.strokeRect(4,4,504,120);ctx.fillStyle='#f4e3c2';ctx.textAlign='center';ctx.font='bold 34px sans-serif';ctx.fillText(labelFor(lang),256,78);texture.needsUpdate=true;};setLanguage(language);
  return {group,setLanguage,texture};
}
