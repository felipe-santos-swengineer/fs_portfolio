import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X } from 'lucide-react';
import caveDialogue from './caveDialogue.json';
import { addFaceDetails, createAdventurer } from './VillageScene';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import { CAVE_LENGTH, CAVE_SPAWN, CAVE_CHECKPOINT, CAVE_HAZARDS, CAVE_DIVIDERS, CAVE_LOST, CAVE_HEARTS, CAVE_LEVERS, CAVE_CHAMBER_ENTRANCE, CAVE_STAIRS_START, CAVE_ARROW_TRAPS, caveStairHeight, nearCaveChamberEntrance, CAVE_CHECKPOINT_RADIUS, nearCaveCheckpoint, caveBlocked, caveHazardAt, caveSpikeExtension, caveRespawn, caveSwordHits, caveMonsterIntent } from './caveWorld';
import './Lake.css';
import './DragonCave.css';

export default function DragonCave({language,paused,reduceMotion,onExit,onEnterChamber,startAtChamber=false,onSound,onStep,onSpeak,onStop,speaking,voiceEnabled,voiceNotice}) {
  const mount=useRef(null),keys=useRef(new Set()),settings=useRef({}),healthRef=useRef(3),attackRef=useRef(null),nearRef=useRef(-1),leverNearRef=useRef(-1),leverAction=useRef(null),chamberNotice=useRef(null),exitNearRef=useRef(false),talkRef=useRef(null),panel=useRef(null),initialAtChamber=useRef(startAtChamber);
  settings.current={paused,reduceMotion,onSound,onStep,onSpeak,onStop,onExit,onEnterChamber};
  const [unlocked,setUnlocked]=useState(()=>{if(startAtChamber)return true;try{return sessionStorage.getItem('cave-stairs')==='open';}catch{return false;}}),unlockedRef=useRef(unlocked);unlockedRef.current=unlocked;
  const [nearExit,setNearExit]=useState(false),[chamberFound,setChamberFound]=useState(false);
  const [health,setHealth]=useState(3),[checkpoint,setCheckpoint]=useState(false),[endReached,setEndReached]=useState(false),[notice,setNotice]=useState(''),[near,setNear]=useState(-1),[nearLever,setNearLever]=useState(-1),[talk,setTalk]=useState(null),[error,setError]=useState(false);
  const en=language==='en-US';
  const closeTalk=()=>{talkRef.current=null;setTalk(null);onStop?.();mount.current?.querySelector('canvas')?.focus({preventScroll:true});};
  const openTalk=()=>{if(settings.current.paused||talkRef.current!==null)return;const i=nearRef.current;if(i>=0){keys.current.clear();talkRef.current=i;setTalk(i);settings.current.onSpeak?.(i);return;}if(leverNearRef.current>=0){leverAction.current?.(leverNearRef.current);return;}if(exitNearRef.current&&unlockedRef.current){keys.current.clear();setChamberFound(true);settings.current.onEnterChamber?.();}};
  const actions=useRef({});actions.current={openTalk,closeTalk};
  useEffect(()=>{if(talk!==null)panel.current?.focus();},[talk]);
  useEffect(()=>{
    const el=mount.current;let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Dragon cave / Caverna do dragao');el.appendChild(renderer.domElement);renderer.domElement.focus({preventScroll:true});
    const scene=new THREE.Scene();scene.background=new THREE.Color('#101919');scene.fog=new THREE.Fog('#101919',16,53);
    scene.add(new THREE.HemisphereLight('#687e75','#1a211d',1.2));const ambient=new THREE.DirectionalLight('#9fa99b',.55);ambient.position.set(3,13,5);scene.add(ambient);
    const camera=new THREE.PerspectiveCamera(52,1,.1,95);
    const materials=new Map();const material=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.95}));return materials.get(color);};
    const add=(p,g,c,x,y,z)=>{const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);p.add(m);return m;};
    const box=(p,w,h,d,c,x,y,z)=>add(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);
    const sphere=(p,r,c,x,y,z)=>add(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z);
    const cylinder=(p,r,h,c,x,y,z,n=8)=>add(p,new THREE.CylinderGeometry(r,r,h,n),c,x,y,z);
    const mesh=(p,g,c,x,y,z)=>add(p,g,c,x,y,z);
    const floor=add(scene,new THREE.PlaneGeometry(100,CAVE_LENGTH+24),'#39443a',0,-.04,-CAVE_LENGTH/2+7);floor.rotation.x=-Math.PI/2;
    // Interior-facing surfaces disappear from the outside while staying solid from within.
    const ceiling=mesh(scene,new THREE.PlaneGeometry(100,CAVE_LENGTH+24),'#27342e',0,11.8,-CAVE_LENGTH/2+7);ceiling.rotation.x=Math.PI/2;
    const boundaryMarks=[];
    const wall=(x,z,width,nx,nz,inset=.2)=>{const angle=Math.atan2(nx,nz),panel=mesh(scene,new THREE.PlaneGeometry(width,13),'#344137',x,5.7,z);panel.rotation.y=angle;
      const length=Math.hypot(nx,nz);boundaryMarks.push({x:x+nx/length*inset,z:z+nz/length*inset,width,angle});return panel;};
    const wallRocks=[];
    [-1,1].forEach(side=>{
      for(let z=9;z>-CAVE_LENGTH-10;z-=4){const inDoor=side<0?((z<=-40&&z>=-56)||(z<=-159&&z>=-177)):(z<=-83&&z>=-99);if(!inDoor)wall(side*11.7,z,4.2,-side,0,.6);}
      for(let i=0;i<Math.ceil((CAVE_LENGTH+20)/8);i++){const z=7-i*8;if((side<0&&((z<=-38&&z>=-58)||(z<=-157&&z>=-179)))||(side>0&&z<=-81&&z>=-101))continue;const rock=mesh(scene,new THREE.DodecahedronGeometry(2.7+(i%3)*.3,0),i%2?'#3b4940':'#435146',side*(12+i%2*.3),3+(i%3)*1.2,z);rock.scale.set(.8,1.6,1.45);rock.rotation.set(.12*(i%3),.37*i,.16*(i%4-1));wallRocks.push({rock,side});
        for(let j=0;j<2;j++){const stal=mesh(scene,new THREE.ConeGeometry(.7+j*.2,2.7+j*.6,6),i%2?'#627063':'#4d5c50',side*(9+j*1.8),10.5-j*.5,z+j*2);stal.rotation.z=Math.PI;}
      }});
    // Stone islands divide two sections into distinct routes that rejoin; side chambers end in alcoves.
    CAVE_DIVIDERS.forEach((r,i)=>{const w=r.maxX-r.minX,d=r.maxZ-r.minZ,z=(r.minZ+r.maxZ)/2;box(scene,w,6,d,'#354238',0,3,z);for(let j=0;j<4;j++){const crag=mesh(scene,new THREE.DodecahedronGeometry(1.45,0),'#56665a',(j%2?1:-1)*1.2,5,z-d/2+j*d/3);crag.scale.set(.9,1.3,1.2);crag.rotation.y=j*.5;}});
    // Trace the walkable side passages to build walls around their turns and dead ends.
    for(let x=-45;x<=45;x+=2)for(let z=-197;z<=-39;z+=2){
      if(Math.abs(x)<11||caveBlocked(x,z))continue;
      [[2,0],[-2,0],[0,2],[0,-2]].forEach(([dx,dz])=>{
        if(!caveBlocked(x+dx,z+dz))return;
        if(Math.abs(x+dx/2)<11.2)return;
        wall(x+dx/2,z+dz/2,2.1,-dx,-dz);
      });
    }
    // A low-contrast luminous stone seam stays visible even when the wall's back face is hidden.
    const boundaryGeometry=new THREE.BoxGeometry(1,1,1),boundaryMaterial=new THREE.MeshBasicMaterial({color:'#b9c9a5',transparent:true,opacity:.72,depthWrite:false});
    const boundaryMesh=new THREE.InstancedMesh(boundaryGeometry,boundaryMaterial,boundaryMarks.length),boundaryTransform=new THREE.Object3D();
    boundaryMarks.forEach((mark,i)=>{boundaryTransform.position.set(mark.x,.035,mark.z);boundaryTransform.rotation.set(0,mark.angle,0);boundaryTransform.scale.set(mark.width,.045,.16);boundaryTransform.updateMatrix();boundaryMesh.setMatrixAt(i,boundaryTransform.matrix);});
    boundaryMesh.instanceMatrix.needsUpdate=true;boundaryMesh.frustumCulled=false;scene.add(boundaryMesh);
    // Ember pools and stone spikes correspond exactly to the collision zones.
    const glows=[],spikeTraps=[],flames=[];CAVE_HAZARDS.forEach((h,i)=>{if(h.type==='lava'){
      const pool=mesh(scene,new THREE.CircleGeometry(h.radius,24),'#a34427',h.x,.025,h.z);pool.rotation.x=-Math.PI/2;pool.material=new THREE.MeshStandardMaterial({color:'#9f3a23',emissive:'#b8411b',emissiveIntensity:.9,roughness:.6});
      const rim=mesh(scene,new THREE.TorusGeometry(h.radius,.16,6,24),'#6b5b4b',h.x,.08,h.z);rim.rotation.x=Math.PI/2;
      const light=new THREE.PointLight('#f36e30',8,13);light.position.set(h.x,1,h.z);scene.add(light);glows.push({light,phase:i});
      for(let j=0;j<3;j++){const a=j*Math.PI*2/3,flame=mesh(scene,new THREE.ConeGeometry(.18,.65,6),'#f49c41',h.x+Math.cos(a)*h.radius*.5,.4,h.z+Math.sin(a)*h.radius*.5);flame.material=new THREE.MeshStandardMaterial({color:'#f49c41',emissive:'#c34b20',emissiveIntensity:1});flames.push({flame,phase:i+j});}
    }else{const spikes=new THREE.Group();spikes.position.set(h.x,0,h.z);scene.add(spikes);for(let j=0;j<9;j++){const a=j*2.4,r=(j%3)*.6;mesh(spikes,new THREE.ConeGeometry(.38,.8+(j%3)*.3,6),'#a2aa94',Math.cos(a)*r,.42,Math.sin(a)*r);}spikeTraps.push({group:spikes,index:i});
      const ring=mesh(scene,new THREE.TorusGeometry(h.radius,.08,5,24),'#b6a47d',h.x,.035,h.z);ring.rotation.x=Math.PI/2;}});
    // Slow arrows cross the corridor from alternating wall launchers.
    const arrows=CAVE_ARROW_TRAPS.map(({z,side},i)=>{box(scene,.45,.7,1,'#7b6850',side*11.5,1,z);const barrel=cylinder(scene,.13,.8,'#4e493c',side*11.05,1,z,8);barrel.rotation.z=Math.PI/2;
      const group=new THREE.Group();scene.add(group);group.position.set(side*10.5,1,z);group.rotation.y=side<0?0:Math.PI;
      const shaft=cylinder(group,.045,1.5,'#a18057',0,0,0,6);shaft.rotation.z=-Math.PI/2;
      const tip=mesh(group,new THREE.ConeGeometry(.13,.42,4),'#c7cbb7',.9,0,0);tip.rotation.z=-Math.PI/2;
      [-1,1].forEach(k=>{const feather=box(group,.35,.16,.03,'#c4b499',-.62,k*.1,0);feather.rotation.z=k*.35;});
      return {group,z,side,phase:i*2.9,lastCycle:-1};});
    // Distant fires guide the route and make the dangers legible in the dark.
    for(let i=0;i<18;i++){const z=3-i*13,side=i%2?1:-1;cylinder(scene,.1,2.3,'#71553a',side*9,1.15,z);const flame=mesh(scene,new THREE.ConeGeometry(.24,.7,7),'#f2a34c',side*9,2.6,z);flame.material=new THREE.MeshStandardMaterial({color:'#f2a34c',emissive:'#bd5420',emissiveIntensity:1});const lamp=new THREE.PointLight('#ff9a4b',8,13);lamp.position.set(side*9,2.5,z);scene.add(lamp);glows.push({light:lamp,phase:i*.9});flames.push({flame,phase:i*.9});}
    [[-34,-57],[-41,-69],[34,-100],[41,-109]].forEach(([x,z],i)=>{cylinder(scene,.09,2,'#71553a',x,1,z);const flame=mesh(scene,new THREE.ConeGeometry(.2,.55,7),'#f2a34c',x,2.25,z);flame.material=new THREE.MeshStandardMaterial({color:'#f2a34c',emissive:'#bd5420',emissiveIntensity:1});const lamp=new THREE.PointLight('#ff9a4b',7,12);lamp.position.set(x,2.2,z);scene.add(lamp);glows.push({light:lamp,phase:i+5});flames.push({flame,phase:i+5});});
    const hearts=CAVE_HEARTS.map((p,i)=>{const group=new THREE.Group();group.position.set(p.x,1,p.z);scene.add(group);const color='#e66b79';const left=sphere(group,.28,color,-.16,.12,0),right=sphere(group,.28,color,.16,.12,0);left.scale.z=.6;right.scale.z=.6;const tip=mesh(group,new THREE.ConeGeometry(.35,.55,4),color,0,-.12,0);tip.rotation.z=Math.PI;tip.rotation.y=Math.PI/4;return {group,phase:i,collected:false};});
    // The cave's sentries patrol short loops and hurt the traveler on contact.
    const monsters=[[-7,-13],[7,-44],[-7,-87],[6,-123],[-17,-50],[17,-93],[-6,-158],[7,-195],[-34,-181]].map(([x,z],i)=>{const group=new THREE.Group();scene.add(group);group.position.set(x,.12,z);const body=sphere(group,.8,i%2?'#55554c':'#46574d',0,.75,0);body.scale.set(1,1.1,.8);const head=sphere(group,.5,'#344139',0,1.55,.2);head.scale.set(1,.7,1);[-1,1].forEach(side=>{const eye=sphere(group,.075,'#ec754c',side*.2,1.6,.63);eye.material=new THREE.MeshStandardMaterial({color:'#ec754c',emissive:'#b32f16',emissiveIntensity:1.4});const horn=mesh(group,new THREE.ConeGeometry(.12,.4,5),'#afa98e',side*.35,1.95,.05);horn.rotation.z=-side*.35;});const legs=[],arms=[];[-1,1].forEach(side=>{const leg=new THREE.Group();leg.position.set(side*.38,.52,0);group.add(leg);box(leg,.22,.65,.27,'#354339',0,-.28,0);legs.push(leg);const arm=new THREE.Group();arm.position.set(side*.75,1.25,.05);group.add(arm);box(arm,.25,.72,.28,'#46554a',0,-.3,0);for(let j=-1;j<=1;j++){const claw=mesh(arm,new THREE.ConeGeometry(.06,.22,5),'#b9b29a',j*.08,-.72,.06);claw.rotation.z=Math.PI;}arms.push(arm);});return {group,body,legs,arms,x,z,phase:i*1.8,hp:2,death:0,defeated:false,attackAt:0,nextAttack:0};});
    const lost=CAVE_LOST.map((p,i)=>{
      // Two stranded explorers with their own clothing, hair and equipment.
      const figure=new THREE.Group(),torso=new THREE.Group();figure.position.set(p.x,0,p.z);figure.rotation.y=i?-Math.PI/2:Math.PI/2;figure.add(torso);scene.add(figure);
      const skin=i?'#b98968':'#a97b59',coat=i?'#7d626c':'#8c7655',hair=i?'#382e2b':'#625348';
      box(torso,.65,.82,.39,coat,0,1.15,0);box(torso,.7,.12,.43,'#5b4735',0,.85,0);sphere(torso,.28,skin,0,1.82,0);sphere(torso,.29,hair,0,1.96,-.05).scale.set(1,.65,1);
      [-1,1].forEach(side=>{sphere(torso,.03,'#1b2422',side*.1,1.85,.27);box(torso,.22,.6,.22,'#554d45',side*.18,.5,0);box(torso,.2,.55,.22,coat,side*.43,1.2,0);sphere(torso,.1,skin,side*.43,.9,0);});
      addFaceDetails(torso,{box,sphere},{headY:1.82,skin});
      if(i){box(torso,.5,.6,.16,hair,0,1.62,-.23);box(torso,.7,.1,.42,'#c2a56e',0,1.48,.04);box(torso,.2,.35,.25,'#7b664a',.4,1.0,0);}
      else{box(torso,.47,.5,.23,'#6a5039',0,1.25,-.29);box(torso,.2,.09,.42,'#c4ad81',0,1.44,.08);box(torso,.5,.06,.08,'#c1b194',0,2.04,.02);}
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#1a2522';ctx.fillRect(4,4,504,152);ctx.strokeStyle='#c3a778';ctx.lineWidth=5;ctx.strokeRect(7,7,498,146);ctx.textAlign='center';ctx.fillStyle='#f6e9ca';ctx.font='bold 54px sans-serif';ctx.fillText(p.name,256,70);ctx.fillStyle='#d3c8a8';ctx.font='30px sans-serif';ctx.fillText('E / F',256,125);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sign.position.set(0,2.9,0);sign.scale.set(2.1,.66,1);figure.add(sign);return {...p,figure,texture};
    });
    // Scattered remains and abandoned supplies suggest earlier expeditions.
    [[-8,-8],[8,-20],[-8,-35],[8,-59],[-8,-82],[8,-105],[-8,-126],[8,-150],[-29,-50],[32,-95]].forEach(([x,z],i)=>{
      const remains=new THREE.Group();remains.position.set(x,.1,z);remains.rotation.y=i*1.1;scene.add(remains);
      const skull=sphere(remains,.32,'#c1bba4',0,.28,0);skull.scale.set(1,.83,.9);box(remains,.4,.12,.25,'#aaa58f',0,.08,.2);
      [-1,1].forEach(side=>{sphere(remains,.09,'#202c27',side*.13,.32,.26);const bone=cylinder(remains,.045,.8,'#c1bba4',side*.5,.09,-.1,6);bone.rotation.z=side*1.2;});
      for(let j=-1;j<=1;j++)box(remains,.055,.08,.06,'#e0d8bd',j*.09,.12,.34);
      if(i%3===0){const pack=box(remains,.65,.38,.4,'#675743',.9,.2,.5);pack.rotation.y=.5;box(remains,.7,.06,.08,'#a9946d',.9,.4,.5);}
    });
    // A single concealed mechanism stands behind stone in the distant side branch.
    const lever=CAVE_LEVERS[0],leverBase=new THREE.Group();leverBase.position.set(lever.x,0,lever.z);scene.add(leverBase);
    box(leverBase,.45,.14,.42,'#4b5549',0,.07,0);const leverHandle=new THREE.Group();leverHandle.position.y=.15;leverBase.add(leverHandle);cylinder(leverHandle,.045,.65,'#8c8268',0,.32,0,6);sphere(leverHandle,.09,'#a99b79',0,.68,0);leverHandle.rotation.z=unlockedRef.current?-.9:0;
    const secretLight=new THREE.PointLight('#b2c996',4,9);secretLight.position.set(-38,2,-188);scene.add(secretLight);
    [[-43,-194],[-38,-194],[-43,-189]].forEach(([x,z],i)=>{const rock=mesh(scene,new THREE.DodecahedronGeometry(.75+i*.15,0),'#4d5b4e',x,.5,z);rock.scale.set(1,.8,1.2);});
    // The checkpoint is a welcoming green floor with a decorative guardian, never an interaction target.
    const checkpointFloor=cylinder(scene,CAVE_CHECKPOINT_RADIUS,.15,'#538a65',CAVE_CHECKPOINT.x,.035,CAVE_CHECKPOINT.z,32);
    checkpointFloor.material=new THREE.MeshStandardMaterial({color:'#538a65',emissive:'#2a8455',emissiveIntensity:.65,roughness:.8});
    const checkpointRing=mesh(scene,new THREE.TorusGeometry(CAVE_CHECKPOINT_RADIUS-.15,.08,8,48),'#c5e6b3',CAVE_CHECKPOINT.x,.13,CAVE_CHECKPOINT.z);checkpointRing.rotation.x=Math.PI/2;
    for(let j=0;j<12;j++){const a=j*Math.PI/6,rune=box(scene,.12,.035,.38,'#d7edc5',CAVE_CHECKPOINT.x+Math.sin(a)*2.65,.14,CAVE_CHECKPOINT.z+Math.cos(a)*2.65);rune.rotation.y=a;}
    const angel=new THREE.Group();angel.position.set(CAVE_CHECKPOINT.x,.75,CAVE_CHECKPOINT.z);scene.add(angel);
    const dress=mesh(angel,new THREE.CylinderGeometry(.23,.52,.9,10),'#e9eee2',0,.75,0);dress.material=new THREE.MeshStandardMaterial({color:'#e9eee2',emissive:'#96bca0',emissiveIntensity:.2});
    box(angel,.38,.33,.26,'#f2eddb',0,1.27,0);sphere(angel,.25,'#d9b797',0,1.61,0);sphere(angel,.255,'#a8804e',0,1.74,-.04).scale.set(1,.5,1);
    // Layered hair frames the face and falls behind the shoulders.
    const hairBack=box(angel,.48,.72,.18,'#a8804e',0,1.38,-.19);hairBack.rotation.x=-.08;
    [-1,1].forEach(side=>{const lock=box(angel,.12,.62,.14,'#b58d58',side*.245,1.43,-.015);lock.rotation.z=-side*.1;sphere(angel,.025,'#33433c',side*.085,1.63,.23);box(angel,.14,.44,.15,'#f2eddb',side*.29,1.16,0);sphere(angel,.075,'#d9b797',side*.29,.94,.02);});
    addFaceDetails(angel,{box,sphere},{headY:1.61,skin:'#d9b797',radius:.25,brow:'#765c46'});
    const halo=mesh(angel,new THREE.TorusGeometry(.3,.035,6,24),'#f3d994',0,2.05,0);halo.rotation.x=Math.PI/2;
    const wings=[-1,1].map(side=>{const wing=new THREE.Group();wing.position.set(side*.2,1.25,-.18);angel.add(wing);for(let j=0;j<3;j++){const feather=sphere(wing,.3,'#e8f2df',side*(.22+j*.15),.12-j*.14,0);feather.scale.set(1.25,.7,.3);feather.rotation.z=side*.4;}return wing;});
    const checkpointLight=new THREE.PointLight('#94e6ab',8,12);checkpointLight.position.set(CAVE_CHECKPOINT.x,2,CAVE_CHECKPOINT.z);scene.add(checkpointLight);

    // A hidden mechanism reveals stairs to the future dragon chamber entrance.
    const stairs=new THREE.Group();stairs.visible=unlockedRef.current;scene.add(stairs);
    // Each tread rests on a masonry fill; the side beams and posts meet the ground.
    for(let j=0;j<16;j++){const z=CAVE_STAIRS_START-j-.5,top=(j+1)*.2;
      box(stairs,4.8,top,1.02,'#51493a',0,top/2,z);
      box(stairs,4.8,.12,1.03,'#967149',0,top-.06,z);
      for(let k=-1;k<=1;k++)box(stairs,.045,.025,.96,'#5c4732',k*1.35,top+.015,z);
      if(j%3===0)[-1,1].forEach(side=>{box(stairs,.16,top+.85,.16,'#76583c',side*2.32,(top+.85)/2,z);});
    }
    box(scene,7,3.2,4.4,'#4d594e',0,1.6,-238);
    box(scene,5.8,.2,4.3,'#839080',0,3.2,-238);
    const mouthLight=new THREE.PointLight('#e5a163',9,19);mouthLight.position.set(0,6,CAVE_CHAMBER_ENTRANCE.z+2);scene.add(mouthLight);
    const mouth=new THREE.Group();mouth.position.set(CAVE_CHAMBER_ENTRANCE.x,3.3,CAVE_CHAMBER_ENTRANCE.z-2);scene.add(mouth);
    // A rock-carved head frames the sealed chamber rather than floating above the floor.
    box(mouth,9,.8,2.3,'#59665a',0,.4,0);box(mouth,5.2,4.1,.4,'#111a18',0,2.55,.55);
    [-1,1].forEach(side=>{const cheek=mesh(mouth,new THREE.DodecahedronGeometry(2.1,0),'#697469',side*3.1,2.5,0);cheek.scale.set(.85,1.3,.7);
      box(mouth,1.25,3.7,1.6,'#58665b',side*3.05,1.85,-.1);
      const ridge=mesh(mouth,new THREE.DodecahedronGeometry(1.45,0),'#849082',side*2.15,4.65,.05);ridge.scale.set(1.1,.6,.7);
      const brow=box(mouth,1.15,.28,.65,'#48564b',side*1.95,4.75,.95);brow.rotation.z=side*.25;
      const eye=sphere(mouth,.25,'#e9a15e',side*2.05,4.5,.95);eye.material=new THREE.MeshStandardMaterial({color:'#e9a15e',emissive:'#a63e1e',emissiveIntensity:1});
      const horn=mesh(mouth,new THREE.ConeGeometry(.5,2,6),'#879184',side*3.15,5.8,-.15);horn.rotation.z=-side*.35;
      for(let j=0;j<3;j++){const scale=mesh(mouth,new THREE.ConeGeometry(.25,.7,5),'#9da894',side*(3.5+j*.18),3.1-j*.8,.35);scale.rotation.z=-side*1.2;}
    });
    box(mouth,7.2,1.3,1.5,'#798476',0,5.15,0);
    const nose=mesh(mouth,new THREE.DodecahedronGeometry(1.7,0),'#718073',0,5.1,.55);nose.scale.set(1.3,.55,.6);
    [-1,1].forEach(side=>sphere(mouth,.15,'#303c34',side*.72,5.3,1.45));
    for(let j=-2;j<=2;j++){const fang=mesh(mouth,new THREE.ConeGeometry(.24,.9,5),'#c0c3ad',j*.9,4.15,.95);fang.rotation.z=Math.PI;const lower=mesh(mouth,new THREE.ConeGeometry(.19,.55,5),'#afb7a3',j*.85,.85,.95);lower.rotation.z=0;}
    const traveler=createAdventurer(scene,{box,sphere,mesh,cylinder}),player=traveler.player;player.position.set(0,initialAtChamber.current?3.2:0,initialAtChamber.current?-237:CAVE_SPAWN.z);player.rotation.y=initialAtChamber.current?0:Math.PI;
    // Clone only the player's materials so the damage tint never affects shared scenery.
    const redTint=new THREE.Color('#ff3838'),redGlow=new THREE.Color('#8a0808');
    const playerMaterials=new Map();player.traverse(object=>{if(!object.isMesh||!object.material?.isMeshStandardMaterial)return;const original=object.material;if(!playerMaterials.has(original)){const copy=original.clone();playerMaterials.set(original,{copy,color:copy.color.clone(),emissive:copy.emissive.clone(),intensity:copy.emissiveIntensity});}object.material=playerMaterials.get(original).copy;});
    const burning=new THREE.Group();player.add(burning);burning.visible=false;for(let i=0;i<6;i++){const a=i*Math.PI/3,flame=mesh(burning,new THREE.ConeGeometry(.13,.55,6),i%2?'#ffb447':'#e95c28',Math.cos(a)*.48,.55+(i%2)*.3,Math.sin(a)*.38);flame.material=new THREE.MeshStandardMaterial({color:i%2?'#ffb447':'#e95c28',emissive:'#bd471c',emissiveIntensity:1});}
    camera.position.set(0,initialAtChamber.current?10:7,initialAtChamber.current?-225:15);const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,initialAtChamber.current?4.2:1,initialAtChamber.current?-237:5);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=5;orbit.maxDistance=12;orbit.minPolarAngle=.55;orbit.maxPolarAngle=1.25;orbit.update();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const down=e=>{const k=e.key.toLowerCase();if(k==='escape'&&talkRef.current!==null&&!settings.current.paused){e.preventDefault();actions.current.closeTalk();return;}if(document.activeElement!==renderer.domElement||settings.current.paused||talkRef.current!==null)return;if((k==='j'||k===' ')&&!e.repeat){e.preventDefault();attackRef.current?.();return;}if((k==='e'||k==='f')&&!e.repeat){e.preventDefault();actions.current.openTalk();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}};
    const up=e=>keys.current.delete(e.key.toLowerCase()),clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    let frame,last=performance.now(),time=0,invulnerable=0,reached=false,lastNotice=0,previousEnd=false,previousExit=false,deathTimer=0,burnTimer=0,stepTimer=0,lastAttack=-10,attackUntil=0,previousNear=-1,previousLever=-1,hitVisual=0;
    chamberNotice.current=()=>{setNotice('chamber');lastNotice=time;};
    leverAction.current=index=>{if(index!==0||settings.current.paused||talkRef.current!==null||deathTimer>0||unlockedRef.current)return;unlockedRef.current=true;setUnlocked(true);try{sessionStorage.setItem('cave-stairs','open');}catch{}leverHandle.rotation.z=-.9;stairs.visible=true;setNotice('stairs');lastNotice=time;settings.current.onSound?.('lever');};
    attackRef.current=()=>{if(settings.current.paused||talkRef.current!==null||deathTimer>0||time-lastAttack<.6)return;lastAttack=time;attackUntil=time+.45;settings.current.onSound?.('attack');monsters.forEach(m=>{if(m.defeated||!caveSwordHits(player.position,player.rotation.y,m.group.position))return;m.hp--;if(m.hp<=0){m.defeated=true;m.death=settings.current.reduceMotion?.05:.65;settings.current.onSound?.('defeat');}else settings.current.onSound?.('monsterHit');});};
    const animate=now=>{frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
      if(!settings.current.paused&&talkRef.current===null){time+=dt;invulnerable=Math.max(0,invulnerable-dt);hitVisual=Math.max(0,hitVisual-dt);const red=hitVisual>0&&(settings.current.reduceMotion||Math.floor(hitVisual*8)%2===0);playerMaterials.forEach(m=>{m.copy.color.copy(red?redTint:m.color);m.copy.emissive.copy(red?redGlow:m.emissive);m.copy.emissiveIntensity=red?.55:m.intensity;});burnTimer=Math.max(0,burnTimer-dt);burning.visible=burnTimer>0;if(burning.visible&&!settings.current.reduceMotion)burning.children.forEach((flame,i)=>{flame.scale.y=.8+Math.abs(Math.sin(time*11+i))* .55;flame.rotation.z=Math.sin(time*7+i)*.2;});
        if(deathTimer>0){deathTimer-=dt;traveler.body.rotation.z=settings.current.reduceMotion?0:Math.min(1.5,(1.2-deathTimer)*1.6);if(deathTimer<=0){const p=caveRespawn(reached?CAVE_CHECKPOINT.z:CAVE_SPAWN.z);player.position.set(p.x,0,p.z);traveler.body.rotation.z=0;traveler.body.position.y=0;burning.visible=false;burnTimer=0;hitVisual=0;healthRef.current=3;setHealth(3);invulnerable=2;setNotice('respawn');lastNotice=time;}}
        const x=Number(keys.current.has('d')||keys.current.has('arrowright'))-Number(keys.current.has('a')||keys.current.has('arrowleft')),z=Number(keys.current.has('s')||keys.current.has('arrowdown'))-Number(keys.current.has('w')||keys.current.has('arrowup'));
        let moving=false;if(deathTimer<=0&&(x||z)){const dir=cameraRelativeDirection(camera,x,z),speed=keys.current.has('shift')?6.8:4,nx=player.position.x+dir.x*speed*dt,nz=player.position.z+dir.z*speed*dt;if(!caveBlocked(nx,player.position.z,unlockedRef.current)){player.position.x=nx;moving=true;}if(!caveBlocked(player.position.x,nz,unlockedRef.current)){player.position.z=nz;moving=true;}player.rotation.y=Math.atan2(dir.x,dir.z);}
        player.position.y=caveStairHeight(player.position.x,player.position.z,unlockedRef.current);
        traveler.limbs.forEach((limb,i)=>{limb.rotation.x=moving&&!settings.current.reduceMotion?Math.sin(time*9)*(i%2===0?.5:-.45)*(i<2?1:-1):0;});
        if(moving){stepTimer-=dt;if(stepTimer<=0){settings.current.onStep?.();stepTimer=keys.current.has('shift')?.3:.48;}}else stepTimer=0;
        if(!settings.current.reduceMotion)hearts.forEach(h=>{if(!h.collected){h.group.rotation.y=time*1.2+h.phase;h.group.position.y=1+Math.sin(time*2+h.phase)*.18;}});
        let monsterHit=false;
        monsters.forEach(m=>{if(m.defeated)return;const p=m.group.position,dx=player.position.x-p.x,dz=player.position.z-p.z,d=Math.hypot(dx,dz),intent=caveMonsterIntent({x:p.x,z:p.z,attackAt:m.attackAt,nextAttack:m.nextAttack},player.position,time);let walking=false;
          if(intent==='chase'&&deathTimer<=0){const step=Math.min(d,dt*1.7),nx=p.x+dx/d*step,nz=p.z+dz/d*step;if(!caveBlocked(nx,p.z))p.x=nx;if(!caveBlocked(p.x,nz))p.z=nz;walking=true;}
          if(intent==='beginAttack'&&deathTimer<=0){m.attackAt=time+.55;m.nextAttack=time+1.9;}
          if(intent==='strike'){m.attackAt=0;if(d<1.8&&deathTimer<=0)monsterHit=true;}
          if((intent==='chase'||intent==='beginAttack'||intent==='windup'||intent==='strike')&&d>.001)m.group.rotation.y=Math.atan2(dx,dz);
          if(!settings.current.reduceMotion){m.legs.forEach((leg,i)=>{leg.rotation.x=walking?Math.sin(time*7+m.phase+i*Math.PI)*.42:0;});const swing=m.attackAt>time?Math.sin((1-(m.attackAt-time)/.55)*Math.PI):0;m.arms.forEach((arm,i)=>{arm.rotation.x=-swing*1.5+(walking?Math.sin(time*7+m.phase+i*Math.PI)*.3:0);});m.body.position.y=.75+(walking?Math.abs(Math.sin(time*7+m.phase))*.06:0);}
        });
        traveler.sword.rotation.x=time<attackUntil&&!settings.current.reduceMotion?.15+1.45*Math.sin((1-(attackUntil-time)/.45)*Math.PI):.15;
        monsters.forEach(m=>{if(m.death>0){m.death=Math.max(0,m.death-dt);if(!settings.current.reduceMotion){m.group.rotation.z=(1-m.death/.65)*1.45;m.group.position.y=.12-(1-m.death/.65)*.45;}if(m.death===0)m.group.visible=false;}});
        let closest=-1,closestDistance=2.8;lost.forEach((p,i)=>{const d=Math.hypot(player.position.x-p.x,player.position.z-p.z);if(d<closestDistance){closest=i;closestDistance=d;}});nearRef.current=closest;if(closest!==previousNear){previousNear=closest;setNear(closest);}let leverIndex=-1;const leverDistance=Math.hypot(player.position.x-lever.x,player.position.z-lever.z);if(leverDistance<2&&!unlockedRef.current)leverIndex=0;leverNearRef.current=leverIndex;if(leverIndex!==previousLever){previousLever=leverIndex;setNearLever(leverIndex);}
        hearts.forEach(h=>{if(!h.collected&&deathTimer<=0&&healthRef.current<3&&Math.hypot(player.position.x-h.group.position.x,player.position.z-h.group.position.z)<1.2){h.collected=true;h.group.visible=false;healthRef.current++;setHealth(healthRef.current);setNotice('heal');lastNotice=time;settings.current.onSound?.('heal');}});
        const atExit=nearCaveChamberEntrance(player.position.x,player.position.z,unlockedRef.current);exitNearRef.current=atExit;if(atExit!==previousExit){previousExit=atExit;setNearExit(atExit);if(atExit)setChamberFound(true);}const atEnd=player.position.z< -214&&!unlockedRef.current;if(atEnd!==previousEnd){previousEnd=atEnd;setEndReached(atEnd);}
        if(!reached&&nearCaveCheckpoint(player.position.x,player.position.z)){reached=true;setCheckpoint(true);setNotice('checkpoint');lastNotice=time;}
        spikeTraps.forEach(trap=>{trap.group.position.y=(caveSpikeExtension(time,trap.index,settings.current.reduceMotion)-1)*.95;});
        arrows.forEach(arrow=>{if(settings.current.reduceMotion){arrow.group.position.x=0;arrow.group.visible=true;return;}const elapsed=(time+arrow.phase)%12,cycle=Math.floor((time+arrow.phase)/12);arrow.group.visible=elapsed<8;arrow.group.position.x=arrow.side*(10.5-elapsed*2.625);if(cycle!==arrow.lastCycle){arrow.lastCycle=cycle;if(Math.abs(player.position.z-arrow.z)<18)settings.current.onSound?.('arrowLaunch');}});
        const arrowHit=arrows.some(a=>a.group.visible&&Math.abs(player.position.x-a.group.position.x)<.9&&Math.abs(player.position.z-a.z)<.8);
        const hazard=caveHazardAt(player.position.x,player.position.z,time,settings.current.reduceMotion)||(arrowHit?{type:'arrow'}:monsterHit?{type:'monster'}:null);if(hazard&&invulnerable<=0&&deathTimer<=0){const next=healthRef.current-1;invulnerable=2;hitVisual=2;healthRef.current=next;setHealth(next);setNotice(hazard.type);lastNotice=time;if(hazard.type==='lava')burnTimer=1.5;settings.current.onSound?.(hazard.type);if(next<=0){deathTimer=settings.current.reduceMotion?.4:1.2;keys.current.clear();setNotice('death');settings.current.onSound?.('death');}}
        if(time-lastNotice>3.5)setNotice('');
      }else clear();
      if(!settings.current.reduceMotion&&!settings.current.paused&&talkRef.current===null){angel.position.y=.75+Math.sin(time*1.5)*.12;wings.forEach((wing,i)=>{wing.rotation.z=(i?1:-1)*(.08+Math.sin(time*1.7)*.09);});halo.rotation.z=Math.sin(time*.8)*.05;glows.forEach(g=>{g.light.intensity=8+Math.sin(time*5+g.phase)*1.1;});flames.forEach(f=>{f.flame.scale.y=.8+Math.abs(Math.sin(time*7+f.phase))*.55;f.flame.rotation.z=Math.sin(time*4+f.phase)*.12;});}
      const target=new THREE.Vector3(player.position.x,player.position.y+1,player.position.z),shift=target.clone().sub(orbit.target);camera.position.add(shift);orbit.target.copy(target);orbit.enabled=!settings.current.paused&&talkRef.current===null;orbit.enableDamping=!settings.current.reduceMotion;orbit.update();wallRocks.forEach(({rock,side})=>{rock.visible=camera.position.x*side<11.7;});renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);clear();attackRef.current=null;leverAction.current=null;chamberNotice.current=null;orbit.dispose();lost.forEach(p=>p.texture.dispose());const shared=new Set(materials.values());scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(!shared.has(m))m.dispose();});});materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  const press=(key,down)=>{if(paused||talkRef.current!==null)return;if(down)keys.current.add(key);else keys.current.delete(key);};
  return <section className="lake dragon-cave"><div className="lake-viewport"><div ref={mount} className="lake-canvas"/><button className="lake-exit" onClick={onExit}>{en?'Return to village':'Voltar para a aldeia'}</button>
    <div className="cave-status" aria-live="polite"><strong>{en?'THE ELDER\u2019S CAVE':'CAVERNA DO ANCI\u00c3O'}</strong><span>{en?'Health':'Vida'}: {'\u2665'.repeat(health)}{'\u2661'.repeat(3-health)}</span><small>{chamberFound?(en?'Mission complete: entrance to the dragon chamber found.':'Missão concluída: entrada da câmara do dragão encontrada.'):unlocked?(en?'Climb the wooden stairs to the dragon chamber entrance.':'Suba a escada de madeira até a entrada da câmara do dragão.'):(en?'Mission: find the hidden lever and reach the dragon chamber.':'Missão: encontre a alavanca escondida e alcance a câmara do dragão.')}</small><small>{checkpoint?(en?'Checkpoint reached':'Ponto de retorno ativado'):(en?'Find the green checkpoint':'Encontre o ponto de retorno verde')}</small></div>
    {!notice&&endReached&&<p className="cave-notice" role="status">{en?'The passage deeper into the mountain is sealed.':'A passagem para as profundezas est\u00e1 selada.'}</p>}
    {notice&&<p className="cave-notice" role="status">{notice==='checkpoint'?(en?'Checkpoint reached.':'Ponto de retorno ativado.'):notice==='respawn'?(en?'You return to the last safe point.':'Voc\u00ea voltou ao \u00faltimo ponto seguro.'):notice==='death'?(en?'You have fallen.':'Voc\u00ea caiu.'):notice==='chamber'?(en?'The dragon chamber lies beyond. This area is not yet available.':'A câmara do dragão fica além desta porta. Esta área ainda não está disponível.'):notice==='stairs'?(en?'A wooden stair opens in the depths!':'Uma escada de madeira se abriu nas profundezas!'):notice==='heal'?(en?'Health restored.':'Vida recuperada.'):notice==='monster'?(en?'A cave creature attacks!':'Uma criatura da caverna atacou!'):notice==='lava'?(en?'The embers burn!':'As brasas queimam!'):notice==='arrow'?(en?'Watch out for arrows!':'Cuidado com as flechas!'):(en?'Watch out for the spikes!':'Cuidado com os espinhos!')}</p>}
    {nearExit&&near<0&&nearLever<0&&talk===null&&<div className="village-actions"><button onClick={openTalk}>{en?'Enter the dragon chamber':'Entrar na câmara do dragão'} <kbd>E</kbd></button></div>}
    {near<0&&nearLever>=0&&talk===null&&<div className="village-actions"><button onClick={openTalk}>{en?'Pull the hidden lever':'Acionar alavanca escondida'} <kbd>E</kbd></button></div>}
    {near>=0&&talk===null&&<div className="village-actions"><button onClick={openTalk}>{en?'Talk to':'Conversar com'} {near===0?'Davi':'Mara'} <kbd>E</kbd></button></div>}
    {talk!==null&&<section className="npc-dialogue" role="dialog" aria-labelledby="cave-resident-title" tabIndex={-1} ref={panel}><div className="npc-dialogue-heading"><span className="npc-avatar" style={{background:'#766b57'}} aria-hidden="true">{talk===0?'D':'M'}</span><div><h2 id="cave-resident-title">{talk===0?'Davi':'Mara'}</h2><small>{en?'Lost traveler':'Viajante perdido'}</small></div><button onClick={closeTalk} aria-label={en?'End conversation':'Encerrar conversa'}><X size={18}/></button></div><p aria-live="polite">{caveDialogue[en?'en-US':'pt-BR'][talk]}</p><div className="npc-dialogue-actions"><button disabled={!voiceEnabled} onClick={()=>speaking?onStop?.():onSpeak?.(talk)}>{speaking?(en?'Stop voice':'Parar voz'):(en?'Listen':'Ouvir mensagem')}</button></div><small className="npc-voice-note">{voiceNotice||(!voiceEnabled?(en?'Enable NPC voices in audio settings.':'Ative as vozes dos NPCs nas configura\u00e7\u00f5es de \u00e1udio.'):(en?'Recorded voice':'Voz gravada'))}</small></section>}
    {error&&<div className="lake-scene-error"><p>{en?'3D is unavailable in this browser.':'O 3D n\u00e3o est\u00e1 dispon\u00edvel neste navegador.'}</p><button onClick={onExit}>{en?'Return to village':'Voltar para a aldeia'}</button></div>}
    <div className="scene-guide map-control-guide"><div className="scene-caption"><span className="live-dot"/> {en?'THE ELDER\u2019S CAVE':'CAVERNA DO ANCI\u00c3O'}</div><div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en?'or arrows to move':'ou setas para caminhar'} {'\u00b7'} <kbd>Shift</kbd> {en?'run':'correr'} {'\u00b7'} <kbd>J</kbd> / <kbd>{en?'Space':'Espa\u00e7o'}</kbd> {en?'attack':'atacar'} {'\u00b7'} <kbd>E</kbd> {en?'talk':'conversar'}</span><span className="touch-guide">{en?'Use arrows to move \u00b7 drag to rotate':'Use as setas para caminhar \u00b7 arraste para girar'}</span></div></div>
    </div><div className="lake-touch" aria-label={en?'Walking controls':'Controles de caminhada'}>{[['arrowleft',en?'Left':'Esquerda','\u2190'],['arrowup',en?'Forward':'Frente','\u2191'],['arrowdown',en?'Back':'Tr\u00e1s','\u2193'],['arrowright',en?'Right':'Direita','\u2192']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}<button type="button" onClick={()=>attackRef.current?.()} disabled={paused||talk!==null} aria-label={en?'Attack with sword':'Atacar com espada'}> {en?'Attack':'Atacar'} </button></div></section>;
}
