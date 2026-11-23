import * as THREE from 'three';
import { addFaceDetails } from './VillageScene';

// The same proportions, face details and sign treatment as village residents.
export function createPrincess(scene, { box, sphere, mesh, cylinder }) {
  const group=new THREE.Group(); group.position.set(0,0,4); group.rotation.y=0; group.visible=false; scene.add(group);
  const skin='#d2aa8d',hair='#57372f',dress='#a96587';
  mesh(group,new THREE.CylinderGeometry(.31,.25,.67,8),dress,0,1.22,0);
  mesh(group,new THREE.CylinderGeometry(.26,.53,.65,10),'#875879',0,.58,0);
  cylinder(group,.53,.055,'#d8bb80',0,.28,0,10);box(group,.52,.09,.4,'#d2b479',0,.9,0);
  sphere(group,.28,skin,0,1.81,0);
  mesh(group,new THREE.SphereGeometry(.305,12,8,0,Math.PI*2,0,Math.PI*.45),hair,0,1.82,0);
  box(group,.49,.65,.22,hair,0,1.58,-.22);
  [-1,1].forEach(side=>{const lock=box(group,.13,.64,.19,hair,side*.265,1.6,-.015);lock.rotation.z=-side*.08;sphere(group,.028,'#14212b',side*.1,1.85,.26);box(group,.17,.57,.24,dress,side*.36,1.22,0);sphere(group,.095,skin,side*.36,.92,0);box(group,.19,.6,.24,'#554458',side*.16,.49,0);box(group,.23,.19,.38,'#514639',side*.16,.18,.06);});
  addFaceDetails(group,{box,sphere},{headY:1.81,skin,brow:hair});
  cylinder(group,.23,.11,'#d9b966',0,2.13,0,10);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;mesh(group,new THREE.ConeGeometry(.065,.18,5),'#e7c776',Math.sin(a)*.19,2.23,Math.cos(a)*.19);}
  sphere(group,.06,'#c14e72',0,2.16,.22);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=224;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sign.position.set(0,3.05,0);sign.scale.set(2.5,.73,1);group.add(sign);
  const setLanguage=language=>{ctx.fillStyle='#101b24';ctx.fillRect(0,0,768,224);ctx.strokeStyle='#d5a5b8';ctx.lineWidth=5;ctx.strokeRect(10,10,748,204);ctx.fillStyle='#d5a5b8';ctx.textAlign='center';ctx.font='bold 49px sans-serif';ctx.fillText(language==='en-US'?'PRINCESS ELARA':'PRINCESA ELARA',384,92);ctx.fillStyle='#e6e0d2';ctx.font='32px sans-serif';ctx.fillText(language==='en-US'?'F \u00b7 TALK':'F \u00b7 CONVERSAR',384,159);texture.needsUpdate=true;};
  return {group,setLanguage};
}

export function createDragonSkeleton(scene,{mesh,sphere}) {
  const group=new THREE.Group();group.position.set(0,0,-17);group.visible=false;scene.add(group);const bone='#c7b995',shadow='#413b30';
  const oval=(x,y,z,sx,sy,sz)=>{const part=sphere(group,1,bone,x,y,z);part.scale.set(sx,sy,sz);return part;};
  // Spine and ribs form a dragon skeleton resting on its back, ribs facing upward.
  oval(0,1,0,.9,.55,8);for(let i=-3;i<=3;i++){const rib=mesh(group,new THREE.TorusGeometry(2.4-Math.abs(i)*.17,.2,7,24,Math.PI),bone,0,1,i*1.8);rib.rotation.z=0;}
  for(let i=0;i<6;i++)oval(0,.8,-8-i*1.15,.3-i*.035,.3-i*.035,.8);
  oval(0,1,9,2.5,1,2.6);oval(0,.75,11,1.5,.55,2.3);
  [-1,1].forEach(side=>{const socket=sphere(group,.6,shadow,side*1.3,1.72,9.6);socket.scale.set(1,.35,1.2);const horn=mesh(group,new THREE.ConeGeometry(.38,2.7,7),bone,side*2.15,1.1,7.6);horn.rotation.z=-side*1.15;horn.rotation.x=-.5;
    for(let j=0;j<4;j++){const tooth=mesh(group,new THREE.ConeGeometry(.16,.62,5),bone,side*(.95+j*.08),1.15,10+j*.7);tooth.rotation.z=Math.PI;}
    for(const z of [-4,4]){const limb=mesh(group,new THREE.CylinderGeometry(.17,.29,4.8,7),bone,side*3.3,1.4,z);limb.rotation.z=side*.9;const claw=mesh(group,new THREE.ConeGeometry(.22,1.4,6),bone,side*5.1,2.8,z);claw.rotation.z=-side*.7;}
    for(let i=0;i<3;i++){const wing=mesh(group,new THREE.CylinderGeometry(.07,.18,6+i,6),bone,side*(4+i),.45,-2-i*.7);wing.rotation.z=side*Math.PI/2;wing.rotation.y=side*(.2+i*.18);}
  });return group;
}

export function createCelebratingVillagers(scene,{box,sphere,mesh},language) {
  const root=new THREE.Group();root.visible=false;scene.add(root);
  const messages=[
    {pt:['Olha o fogo dele agora: apagou!','A aldeia est\u00e1 livre!','Obrigada, aventureiro!'],en:['His fire finally went out!','The village is free!','Thank you, adventurer!']},
    {pt:['Que bela soneca, lagart\u00e3o!','N\u00e3o temos mais medo!','Voc\u00ea salvou a todos!'],en:['Enjoy your nap, big lizard!','We are not afraid anymore!','You saved us all!']},
    {pt:['O drag\u00e3o virou enfeite!','Vamos comemorar na aldeia!','Viva nosso her\u00f3i!'],en:['The dragon is decoration now!','Let us celebrate at home!','Hooray for our hero!']},
  ];
  const people=messages.map((phrases,i)=>{const group=new THREE.Group();const positions=[[-12,-14],[12,-14],[7,-33]], [x,z]=positions[i];group.position.set(x,0,z);group.rotation.y=Math.atan2(-x,-17-z);root.add(group);
    const color=['#718eae','#b18556','#789e83'][i],skin=['#b98d6d','#d2aa83','#8f624d'][i];box(group,.62,.8,.42,color,0,1.12,0);box(group,.66,.12,.45,'#5e4938',0,.86,0);sphere(group,.28,skin,0,1.81,0);sphere(group,.28,'#494039',0,1.96,-.06);
    const arms=[];[-1,1].forEach(side=>{sphere(group,.028,'#14212b',side*.1,1.85,.26);const arm=new THREE.Group();arm.position.set(side*.43,1.52,0);group.add(arm);box(arm,.2,.57,.24,color,0,-.27,0);sphere(arm,.11,skin,0,-.58,0);arm.rotation.z=side*2.4;arms.push({arm,side});box(group,.23,.6,.24,'#333d48',side*.18,.49,0);box(group,.26,.19,.38,'#514639',side*.18,.18,.06);});addFaceDetails(group,{box,sphere},{headY:1.81,skin});
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=240;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));bubble.position.y=3.6;bubble.scale.set(5.3,1.65,1);bubble.renderOrder=5;group.add(bubble);
    const draw=(index,lang)=>{const text=phrases[lang==='en-US'?'en':'pt'][index];ctx.clearRect(0,0,768,240);ctx.fillStyle='#f4ead3';ctx.strokeStyle='#9a7e5e';ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(10,10,748,188,22);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(354,196);ctx.lineTo(386,229);ctx.lineTo(413,196);ctx.fill();ctx.fillStyle='#27313a';ctx.textAlign='center';ctx.font='bold 35px sans-serif';let line='',lines=[];text.split(' ').forEach(word=>{const next=line?line+' '+word:word;if(ctx.measureText(next).width>675){lines.push(line);line=word;}else line=next;});lines.push(line);lines.forEach((value,n)=>ctx.fillText(value,384,lines.length===1?115:92+n*48));texture.needsUpdate=true;};draw(0,language);return {group,arms,draw,index:0,language};});
  return {root,update(time,lang,reduceMotion){people.forEach((person,i)=>{const phase=time*5+i*2;person.group.position.y=reduceMotion?0:Math.abs(Math.sin(phase))*.1;person.group.rotation.z=reduceMotion?0:Math.sin(phase)*.045;person.arms.forEach(({arm,side})=>{arm.rotation.z=side*(2.4+(reduceMotion?0:Math.sin(phase)*.18));});const index=Math.floor((time+i*3)/8)%3;if(index!==person.index||lang!==person.language){person.index=index;person.language=lang;person.draw(index,lang);}});}};
}
