import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { facePlayer } from './facePlayer';
import { allowRunAndRotate } from './runAndRotate';
import { addFaceDetails, createAdventurer } from './VillageScene';
import { dungeonPortalLabel } from './dungeonI18n';
import './Lake.css';

import { createLakeBoat } from './lakeBoat';
import { BOARDING_DISTANCE, BOAT_MOORING, dockLanding } from './lakeDock';
import { LAKE_PORTAL_Z, nearLakePortal, touchingLakePortal } from './lakePortal';
import lakeGuide from './lakeGuide.json';
import LakeGuideDialogue from './LakeGuideDialogue';
import MapControlGuide from './MapControlGuide';


export default function Lake({ language, paused, reduceMotion, onExit, onSound, onEnterRapids, onSpeak, onStop, speaking, voiceEnabled, voiceNotice }) {
  const mount = useRef(null);
  const portalSignRef = useRef(null);
  const guideSignRef = useRef(null);
  const controls = useRef(new Set());
  const dialogueOpen = useRef(false);
  const [talking, setTalking] = useState(false);
  const [guideLine, setGuideLine] = useState(0);
  const guideVisits = useRef(0);
  const guidePanel = useRef(null);
  const stopVoice = useRef(onStop); stopVoice.current = onStop;
  const [nearGuide, setNearGuide] = useState(false);
  const nearGuideRef = useRef(false);
  const state = useRef({ paused, reduceMotion });
  state.current = { paused, reduceMotion, language, onSound };
  const [error, setError] = useState(false);
  const [aboard, setAboard] = useState(false);
  const [nearCave, setNearCave] = useState(false);
  const enterRapidsRef = useRef(onEnterRapids); enterRapidsRef.current = onEnterRapids;
  const exitRef = useRef(onExit); exitRef.current = onExit;
  const aboardRef = useRef(false);
  const en = language === 'en-US';
  const openGuide=({fromClick=false}={})=>{ if(paused || (!nearGuideRef.current && !fromClick && !dialogueOpen.current)) return; controls.current.clear(); const line=guideVisits.current++ % lakeGuide['pt-BR'].length; setGuideLine(line); dialogueOpen.current=true; setTalking(true); onSpeak?.(line); };
  const closeGuide=()=>{ dialogueOpen.current=false; setTalking(false); onStop?.(); mount.current?.querySelector('canvas')?.focus({preventScroll:true}); };
  useEffect(()=>{ if(talking) guidePanel.current?.focus(); },[talking]);
  const guideActions=useRef({openGuide,closeGuide}); guideActions.current={openGuide,closeGuide};
  useEffect(() => { portalSignRef.current?.(language); guideSignRef.current?.(language); }, [language]);
  useEffect(() => {
    const el = mount.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', 'Lake / Lago');
    el.appendChild(renderer.domElement);
    renderer.domElement.focus({ preventScroll: true });
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#a7d3d1'); scene.fog = new THREE.Fog('#a7d3d1', 32, 75);
    scene.add(new THREE.HemisphereLight('#e6f4e6', '#4a6450', 2));
    const light = new THREE.DirectionalLight('#fff3d0', 2); light.position.set(5, 15, 8); scene.add(light);
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
    // A camera-centred panorama keeps distant shores visible along the river.
    const horizonCanvas=document.createElement('canvas'); horizonCanvas.width=2048; horizonCanvas.height=512;
    const horizonContext=horizonCanvas.getContext('2d');
    const sky=horizonContext.createLinearGradient(0,0,0,512);
    sky.addColorStop(0,'#93c7cc'); sky.addColorStop(.65,'#c4dcd0'); sky.addColorStop(1,'#d7d4b0');
    horizonContext.fillStyle=sky; horizonContext.fillRect(0,0,2048,512);
    const ridge=(base,amplitude,color,phase)=>{
      horizonContext.fillStyle=color; horizonContext.beginPath(); horizonContext.moveTo(0,512);
      for(let x=0;x<=2048;x+=8) {
        const a=x/2048*Math.PI*2;
        const y=base-Math.sin(a*3+phase)*amplitude-Math.sin(a*7-phase)*amplitude*.35-Math.cos(a*11+phase)*amplitude*.16;
        horizonContext.lineTo(x,y);
      }
      horizonContext.lineTo(2048,512); horizonContext.closePath(); horizonContext.fill();
    };
    ridge(340,45,'#a0bcb2',.4); ridge(385,55,'#7fa59a',1.3); ridge(435,35,'#678f80',2.1);
    // Warm distant hills blend into the desert bank.
    const warmth=horizonContext.createLinearGradient(0,0,2048,0);
    warmth.addColorStop(0,'rgba(199,171,122,0)'); warmth.addColorStop(.35,'rgba(199,171,122,0)');
    warmth.addColorStop(.55,'rgba(199,171,122,.55)'); warmth.addColorStop(.8,'rgba(199,171,122,.4)'); warmth.addColorStop(1,'rgba(199,171,122,0)');
    horizonContext.fillStyle=warmth; horizonContext.fillRect(0,300,2048,212);
    const horizonTexture=new THREE.CanvasTexture(horizonCanvas); horizonTexture.colorSpace=THREE.SRGBColorSpace;
    const alphaPixels=new Uint8Array(256*4);
    for(let y=0;y<256;y++) { const opacity=Math.round(255*Math.min(1,Math.max(0,(1-y/255)*5))); alphaPixels.set([opacity,opacity,opacity,255],y*4); }
    const horizonFade=new THREE.DataTexture(alphaPixels,1,256,THREE.RGBAFormat);
    horizonFade.magFilter=THREE.LinearFilter; horizonFade.minFilter=THREE.LinearFilter; horizonFade.needsUpdate=true;
    const panorama=new THREE.Mesh(new THREE.CylinderGeometry(80,80,55,64,1,true),new THREE.MeshBasicMaterial({map:horizonTexture,alphaMap:horizonFade,side:THREE.BackSide,transparent:true,depthWrite:false,fog:false}));
    panorama.name='Panorama do lago'; panorama.renderOrder=-9; panorama.frustumCulled=false; scene.add(panorama);

    const mat = color => new THREE.MeshStandardMaterial({ color, roughness: .85 });
    const add = (parent, geo, color, x, y, z) => { const m = new THREE.Mesh(geo, mat(color)); m.position.set(x,y,z); parent.add(m); return m; };
    // A straight river separates the forest and desert along its full length.
    // A translucent, softly undulating surface reveals the fish below it.
    add(scene,new THREE.BoxGeometry(24,.12,138),'#316f78',0,-.8,-49);
    const waterGeometry=new THREE.PlaneGeometry(24,138,24,100);
    waterGeometry.rotateX(-Math.PI/2);
    const waterBase=waterGeometry.attributes.position.array.slice();
    const water=new THREE.Mesh(waterGeometry,new THREE.MeshStandardMaterial({color:'#62b5bb',transparent:true,opacity:.68,roughness:.28,metalness:.12,side:THREE.DoubleSide,depthWrite:false}));
    water.position.set(0,.02,-49); water.renderOrder=2; scene.add(water);
    const fish=[];
    for(let i=0;i<20;i++) {
      const group=new THREE.Group(); scene.add(group);
      const body=add(group,new THREE.SphereGeometry(.26,10,7),['#d48650','#dfbc80','#a9c5bc','#d5a48a'][i%4],0,0,0); body.scale.set(.55,.55,1.35);
      const tail=add(group,new THREE.ConeGeometry(.19,.34,4),'#b76f4e',0,0,.43); tail.rotation.x=Math.PI/2;
      const fin=add(group,new THREE.ConeGeometry(.1,.18,4),'#dfad78',0,.16,0); fin.rotation.z=.2;
      fish.push({group,tail,x:-8+(i%5)*4,z:10-Math.floor(i/5)*28-(i%3)*4,phase:i*1.71});
    }
    let waterTime=0;
    add(scene,new THREE.BoxGeometry(34,.4,145),'#728b5a',-29,-.3,-45);
    add(scene,new THREE.BoxGeometry(34,.4,145),'#d7b779',29,-.3,-45);
    add(scene,new THREE.BoxGeometry(30,.4,18),'#879363',0,-.2,29);
    // Seeded rejection sampling keeps the landscape stable across renders while
    // leaving room for landmarks and for the horses' animated paths.
    let scenerySeed=87321;
    const random=()=>{ scenerySeed=(Math.imul(scenerySeed,1664525)+1013904223)>>>0; return scenerySeed/4294967296; };
    const occupied=[
      {x:-19,z:-16,r:5}, {x:-19,z:-35,r:12}, // cabin and horses
      {x:17,z:-22,r:5}, {x:24,z:-21,r:3}, // camp and tent
      {x:16,z:-57,r:3.5}, {x:24,z:-57,r:3.5},
      {x:26,z:-83,r:8}, {x:-12.8,z:-42,r:2}, {x:12.8,z:-42,r:2}
    ];
    const place=(minX,maxX,minZ,maxZ,r)=>{
      for(let attempt=0;attempt<500;attempt++) {
        const x=minX+random()*(maxX-minX), z=minZ+random()*(maxZ-minZ);
        const nearBridgeStairs=Math.abs(z+42)<3.5+r && Math.abs(x)>14 && Math.abs(x)<28+r;
        if(!nearBridgeStairs && occupied.every(item=>Math.hypot(x-item.x,z-item.z)>=r+item.r)) {
          occupied.push({x,z,r}); return {x,z};
        }
      }
      return null;
    };
    for(let i=0;i<80;i++) {
      const spot=place(-42,-14,-113,22,1.5);
      if(!spot) break;
      const {x,z}=spot;
      add(scene,new THREE.CylinderGeometry(.25,.4,2.4,7),'#70513b',x,1,z);
      add(scene,new THREE.ConeGeometry(1.4,3.5,7),i%2?'#32664e':'#4c8055',x,3,z);
    }
    for(let i=0;i<30;i++) {
      const spot=place(14,42,-113,22,1.4);
      if(!spot) break;
      const {x:dx,z}=spot;
      {
        const cactus=new THREE.Group(); cactus.position.set(dx,0,z); cactus.scale.setScalar(.8+(i%4)*.13); scene.add(cactus);
        const green=i%2 ? '#4f8050' : '#598d57';
        add(cactus,new THREE.CylinderGeometry(.36,.42,2.5,10),green,0,1.25,0);
        const cap=add(cactus,new THREE.SphereGeometry(.36,10,8),green,0,2.5,0); cap.scale.y=.8;
        [-1,1].forEach((side,j)=>{
          const height=j ? 1.4 : 1.05;
          const branch=add(cactus,new THREE.CylinderGeometry(.22,.25,.68,9),green,side*.48,height,0); branch.rotation.z=side*Math.PI/2;
          add(cactus,new THREE.CylinderGeometry(.22,.22,.8,9),green,side*.8,height+.4,0);
          const tip=add(cactus,new THREE.SphereGeometry(.22,9,7),green,side*.8,height+.8,0); tip.scale.y=.8;
        });
        for(let rib=0;rib<8;rib++){const angle=rib*Math.PI/4; add(cactus,new THREE.CylinderGeometry(.018,.018,2.25,4),'#93ad76',Math.cos(angle)*.36,1.25,Math.sin(angle)*.36);}
        if(i%2===0) { const bloom=add(cactus,new THREE.IcosahedronGeometry(.16,1),'#e9a5a0',0,2.82,0); bloom.scale.set(1,.6,1); }
      }
    }
    for(let i=0;i<16;i++) {
      const spot=place(14,42,-113,22,.95);
      if(!spot) break;
      const rock=add(scene,new THREE.DodecahedronGeometry(.9),'#bf985e',spot.x,.3,spot.z); rock.scale.y=.5;
    }
    // Small stories along both shores unfold as the boat travels north.
    const horses=[];
    for(let i=0;i<4;i++) {
      const horse=new THREE.Group(); scene.add(horse);
      const color=['#9b6540','#684936','#c79761','#8a5638'][i];
      add(horse,new THREE.BoxGeometry(1.45,.75,.62),color,0,1.35,0);
      const neck=add(horse,new THREE.BoxGeometry(.4,.8,.48),color,.57,1.85,0); neck.rotation.z=-.35;
      add(horse,new THREE.BoxGeometry(.65,.37,.4),color,.82,2.14,0);
      add(horse,new THREE.BoxGeometry(.16,.28,.13),color,.93,2.43,-.13); add(horse,new THREE.BoxGeometry(.16,.28,.13),color,.93,2.43,.13);
      add(horse,new THREE.BoxGeometry(.35,.14,.48),'#513c30',-.15,1.77,0);
      const legs=[]; [-.48,.48].forEach(x=>[-.23,.23].forEach(z=>{const leg=new THREE.Group();leg.position.set(x,1.05,z);horse.add(leg);add(leg,new THREE.BoxGeometry(.16,.8,.16),color,0,-.4,0);legs.push(leg);}));
      const tail=add(horse,new THREE.BoxGeometry(.15,.65,.15),'#48352b',-.83,1.35,0); tail.rotation.z=-.5;
      horses.push({horse,legs,tail,phase:i*1.5,z:-30-i*3});
    }
    const volcano=new THREE.Group(); volcano.position.set(26,0,-83); scene.add(volcano);
    add(volcano,new THREE.CylinderGeometry(2.1,7,8,9),'#6f5147',0,4,0);
    add(volcano,new THREE.CylinderGeometry(1.75,1.75,.16,16),'#f0833c',0,8.08,0);
    const smoke=[]; for(let i=0;i<7;i++){const puff=add(volcano,new THREE.IcosahedronGeometry(.6+i*.13,1),i%2?'#777877':'#97948b',0,9+i*.8,0); smoke.push(puff);}
    const sparks=[]; for(let i=0;i<8;i++) sparks.push(add(volcano,new THREE.SphereGeometry(.13,7,5),'#ffb051',0,8,0));
    const gunslingers=[];
    [-1,1].forEach((side,i)=>{
      const gunman=new THREE.Group(); gunman.position.set(20+side*4,0,-57); gunman.rotation.y=side<0 ? Math.PI/2 : -Math.PI/2; scene.add(gunman);
      add(gunman,new THREE.BoxGeometry(.65,.85,.35),i?'#625449':'#8b624a',0,1.2,0);
      add(gunman,new THREE.SphereGeometry(.28,10,8),'#d2a782',0,1.95,0);
      add(gunman,new THREE.CylinderGeometry(.46,.46,.1,10),'#554233',0,2.19,0); add(gunman,new THREE.CylinderGeometry(.25,.3,.32,10),'#554233',0,2.35,0);
      const legs=[]; [-1,1].forEach(x=>{const leg=new THREE.Group(); leg.position.set(x*.18,.78,0); gunman.add(leg); add(leg,new THREE.BoxGeometry(.22,.75,.24),'#4d4b42',0,-.38,0); legs.push(leg);});
      const arm=new THREE.Group(); arm.position.set(.4,1.5,0); gunman.add(arm); add(arm,new THREE.BoxGeometry(.2,.65,.2),i?'#625449':'#8b624a',0,-.2,0);
      add(arm,new THREE.BoxGeometry(.13,.15,.5),'#424340',0,-.48,.24);
      const flash=add(arm,new THREE.IcosahedronGeometry(.22,0),'#ffda74',0,-.48,.58); flash.visible=false;
      gunslingers.push({gunman,arm,flash,legs,side});
    });
    const birds=[]; for(let i=0;i<5;i++){const bird=new THREE.Group();scene.add(bird); add(bird,new THREE.BoxGeometry(.3,.15,.55),'#423d38',0,0,0); const left=add(bird,new THREE.BoxGeometry(.8,.08,.22),'#534a42',-.5,0,0), right=add(bird,new THREE.BoxGeometry(.8,.08,.22),'#534a42',.5,0,0);birds.push({bird,left,right,phase:i*1.4});}
    // River details stay clear of the boat's navigation path.
    const waterOccupied=[];
    const waterPlace=(minX,maxX,r)=>{
      for(let attempt=0;attempt<200;attempt++) {
        const x=minX+random()*(maxX-minX), z=-110+random()*120;
        if(waterOccupied.every(item=>Math.hypot(x-item.x,z-item.z)>=r+item.r)) {
          waterOccupied.push({x,z,r}); return {x,z};
        }
      }
      return null;
    };
    const lilies=[];
    for(let i=0;i<28;i++) {
      const spot=i%2 ? waterPlace(7.4,10.4,.55) : waterPlace(-10.4,-7.4,.55); if(!spot) continue;
      const pad=new THREE.Group(); pad.position.set(spot.x,.09,spot.z); scene.add(pad);
      const leaf=add(pad,new THREE.CylinderGeometry(.42,.42,.045,12),'#578f68',0,0,0); leaf.scale.z=.8;
      if(i%3===0) { const flower=add(pad,new THREE.IcosahedronGeometry(.16,1),i%2?'#f5d5cf':'#f6e9be',0,.14,0); flower.scale.y=.65; }
      lilies.push({pad,phase:i*.8});
    }
    const reeds=[];
    for(let i=0;i<52;i++) {
      const spot=i%2 ? waterPlace(11.1,11.7,.4) : waterPlace(-11.7,-11.1,.4); if(!spot) continue;
      const reed=new THREE.Group(); reed.position.set(spot.x,0,spot.z); scene.add(reed);
      for(let j=0;j<3;j++){const stalk=add(reed,new THREE.CylinderGeometry(.025,.035,.7+j*.18,5),'#83965a',(j-1)*.15,.4+j*.09,0); stalk.rotation.z=(j-1)*.12; add(reed,new THREE.CylinderGeometry(.055,.055,.2,6),'#73523e',(j-1)*.15,.8+j*.18,0);}
      reeds.push({reed,phase:i*.63});
    }
    const driftwood=[];
    for(let i=0;i<5;i++) { const log=add(scene,new THREE.CylinderGeometry(.2,.24,2.2,8),'#86684b',i%2?-6:6,.12,-12-i*21); log.rotation.z=Math.PI/2; log.rotation.y=i*.65; driftwood.push({log,phase:i}); }
    const ripples=[];
    for(let i=0;i<18;i++){const ring=new THREE.Mesh(new THREE.RingGeometry(.36,.41,24),new THREE.MeshBasicMaterial({color:'#d4efdf',transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=-Math.PI/2; ring.position.set((i%2?-1:1)*(4+(i%3)*2),.12,8-i*7); scene.add(ring); ripples.push({ring,phase:i*.57});}
    // A high timber crossing leaves ample clearance for the sail.
    const bridge=new THREE.Group(); bridge.position.set(0,0,-42); scene.add(bridge);
    add(bridge,new THREE.BoxGeometry(30,.55,3.6),'#8b6746',0,7.3,0);
    for(let x=-14;x<=14;x+=1.2) add(bridge,new THREE.BoxGeometry(.07,.08,3.5),'#654a34',x,7.61,0);
    [-1,1].forEach(side=>{ add(bridge,new THREE.BoxGeometry(30,.16,.16),'#684a32',0,8.5,side*1.65); for(let x=-14;x<=14;x+=2.8) add(bridge,new THREE.BoxGeometry(.16,1.1,.16),'#684a32',x,8.02,side*1.65); });
    [-12.8,12.8].forEach(x=>add(bridge,new THREE.BoxGeometry(.65,7.3,.65),'#6d5038',x,3.65,0));
    // Stairs climb from both banks to the bridge deck.
    [-1,1].forEach(side=>{
      const steps=18, run=.7, rise=7.575/steps;
      for(let i=0;i<steps;i++) {
        const height=(i+1)*rise, x=side*(27.6-(i+.5)*run);
        add(bridge,new THREE.BoxGeometry(run+.02,height,3.2),'#8b6746',x,height/2,0);
        add(bridge,new THREE.BoxGeometry(run+.02,.06,3.2),'#a57c53',x,height+.03,0);
      }
      [-1,1].forEach(edge=>{
        for(let i=0;i<=steps;i+=3) {
          const x=side*(27.6-i*run), height=i*rise;
          add(bridge,new THREE.BoxGeometry(.14,1.1,.14),'#684a32',x,height+.55,edge*1.48);
        }
        const rail=add(bridge,new THREE.BoxGeometry(Math.hypot(steps*run,7.575),.15,.15),'#684a32',side*21.3,4.75,edge*1.48);
        rail.rotation.z=-side*Math.atan2(7.575,steps*run);
      });
    });
    // Fishermen stand by the rail with their lines reaching the water.
    [-7,6].forEach((x,i)=>{
      const fisher=new THREE.Group(); fisher.position.set(x,7.575,-43.05); scene.add(fisher);
      add(fisher,new THREE.BoxGeometry(.55,.8,.34),i ? '#647b65' : '#805d49',0,1.15,0);
      add(fisher,new THREE.SphereGeometry(.25,10,8),'#d0a47e',0,1.8,0);
      add(fisher,new THREE.CylinderGeometry(.4,.4,.1,10),'#665340',0,2.04,0);
      add(fisher,new THREE.CylinderGeometry(.23,.28,.24,10),'#665340',0,2.19,0);
      [-.16,.16].forEach(offset=>add(fisher,new THREE.BoxGeometry(.2,.72,.23),'#494a42',offset,.36,0));
      const arm=add(fisher,new THREE.BoxGeometry(.18,.65,.18),i ? '#647b65' : '#805d49',.35,1.25,-.18); arm.rotation.x=-.7;
      const rod=new THREE.Group(); rod.position.set(.4,1.05,-.45); rod.rotation.x=-.85; fisher.add(rod);
      add(rod,new THREE.CylinderGeometry(.025,.045,4.5,6),'#70543b',0,2.25,0);
      const tip=new THREE.Vector3(x+.4,7.575+1.05+4.5*Math.cos(.85),-43.5-4.5*Math.sin(.85));
      const line=new THREE.BufferGeometry().setFromPoints([tip,new THREE.Vector3(tip.x,.1,tip.z)]);
      scene.add(new THREE.Line(line,new THREE.LineBasicMaterial({color:'#ddd5bd'})));
    });
    // Forest cabin, flowers and a glowing campfire on the opposite bank.
    const cabin=new THREE.Group(); cabin.position.set(-19,0,-16); scene.add(cabin);
    add(cabin,new THREE.BoxGeometry(4,3,3.5),'#946d4b',0,1.5,0);
    const roof=add(cabin,new THREE.ConeGeometry(3.3,1.8,4),'#644639',0,3.8,0); roof.rotation.y=Math.PI/4;
    add(cabin,new THREE.BoxGeometry(1,1.8,.08),'#513a2c',0,.9,1.78);
    [-1.2,1.2].forEach(x=>add(cabin,new THREE.BoxGeometry(.65,.65,.09),'#f3c777',x,1.8,1.8));
    for(let i=0;i<34;i++){const spot=place(-19,-13,-113,20,.2); if(!spot) continue; const {x,z}=spot; add(scene,new THREE.CylinderGeometry(.025,.03,.45,5),'#668a50',x,.2,z); add(scene,new THREE.IcosahedronGeometry(.12,0),['#e9c281','#f4c5bb','#e1d4e6'][i%3],x,.47,z);}
    const camp=new THREE.Group(); camp.position.set(17,0,-22); scene.add(camp);
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7; add(camp,new THREE.DodecahedronGeometry(.25),'#a58e70',Math.cos(a)*.7,.18,Math.sin(a)*.7);}
    const flame=add(camp,new THREE.ConeGeometry(.36,1.1,7),'#f09a42',0,.7,0);
    const firelight=new THREE.PointLight('#ff9447',3,7); firelight.position.set(0,1,0); camp.add(firelight);
    // Two travelers sit by the fire and toast marshmallows; they are scenery.
    const skewers=[];
    [-1,1].forEach((side,i)=>{
      const person=new THREE.Group(), x=side*1.65, z=1.45;
      person.position.set(x,0,z); person.rotation.y=Math.atan2(-x,-z); camp.add(person);
      const skin=i?'#b98467':'#d1aa85', hair=i?'#44352f':'#5a4032', shirt=i?'#8b6258':'#668271';
      const faceBox=(parent,w,h,d,color,x,y,z)=>add(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);
      const faceSphere=(parent,r,color,x,y,z)=>add(parent,new THREE.IcosahedronGeometry(r,1),color,x,y,z);
      add(person,new THREE.CylinderGeometry(.4,.44,.38,8),'#75543b',0,.2,-.15);
      faceBox(person,.6,.68,.38,shirt,0,.88,0);
      faceSphere(person,.28,skin,0,1.52,0);
      add(person,new THREE.SphereGeometry(.29,10,8,0,Math.PI*2,0,Math.PI*.48),hair,0,1.53,0);
      faceBox(person,.46,.34,.14,hair,0,1.37,-.22);
      if(i) [-1,1].forEach(s=>faceBox(person,.11,.38,.12,hair,s*.26,1.35,-.02));
      addFaceDetails(person,{box:faceBox,sphere:faceSphere},{headY:1.52,skin,brow:hair,eyes:true});
      [-1,1].forEach(s=>{
        const leg=faceBox(person,.2,.2,.62,'#4d5650',s*.16,.42,.25); leg.rotation.x=-.1;
        faceBox(person,.22,.19,.28,'#544536',s*.16,.3,.55);
      });
      const arm=faceBox(person,.18,.55,.2,shirt,.36,.88,.22);arm.rotation.x=-.85;
      faceSphere(person,.095,skin,.37,.69,.43);
      const otherArm=faceBox(person,.18,.55,.2,shirt,-.36,.88,.08);otherArm.rotation.x=-.35;
      faceSphere(person,.095,skin,-.36,.65,.17);
      const skewer=new THREE.Group();skewer.position.set(.37,.69,.43);person.add(skewer);
      const stick=add(skewer,new THREE.CylinderGeometry(.025,.035,1.45,6),'#725034',0,0,.72);stick.rotation.x=Math.PI/2;
      const treat=add(skewer,new THREE.CylinderGeometry(.11,.11,.2,10),'#f2e8d7',0,0,1.44);treat.rotation.x=Math.PI/2;
      skewers.push({skewer,phase:i*1.7});
    });
    // A rocky cliff frames the falls and a shadowed grotto behind the water.
    const falls=new THREE.Group(); falls.position.set(0,0,-117); scene.add(falls);
    const rockColors=['#737d74','#879087','#626f69','#929a8b'];
    for(let i=0;i<25;i++) {
      const x=-17+i*1.42, height=5.8+random()*3.3;
      const rock=add(falls,new THREE.DodecahedronGeometry(1,1),rockColors[i%rockColors.length],x,height*.48,-2.1-random());
      rock.scale.set(1.5+random()*.7,height*.58,2.3+random()); rock.rotation.y=random()*Math.PI;
    }
    // The dark inset suggests a cave; the waterfall remains in front of it.
    const caveShape=new THREE.Shape(); caveShape.moveTo(-3.4,0); caveShape.lineTo(-3.4,2.1);
    caveShape.quadraticCurveTo(-3.4,5.5,0,5.5); caveShape.quadraticCurveTo(3.4,5.5,3.4,2.1);
    caveShape.lineTo(3.4,0); caveShape.closePath();
    const cave=add(falls,new THREE.ShapeGeometry(caveShape),'#263b38',0,0,.1); cave.material.side=THREE.DoubleSide;
    [-1,1].forEach(side=>{
      for(let i=0;i<6;i++) {
        const rock=add(falls,new THREE.DodecahedronGeometry(1,0),rockColors[(i+1)%rockColors.length],side*(7.6+i*1.35),.7+random()*4,-.2-random());
        rock.scale.set(1.2+random(),1.3+random()*1.5,1.1); rock.rotation.z=(random()-.5)*.5;
      }
      for(let i=0;i<9;i++) {
        const shrub=add(falls,new THREE.IcosahedronGeometry(.55,1),i%2?'#59815e':'#72946a',side*(8+random()*8),2+random()*4,.35-random()*.4);
        shrub.scale.set(1.2,.65,.75);
      }
    });
    // Paint the water as a broken, softly blended curtain instead of a flat rectangle.
    const fallCanvas=document.createElement('canvas'); fallCanvas.width=512; fallCanvas.height=512;
    const fallContext=fallCanvas.getContext('2d');
    const curtain=fallContext.createLinearGradient(0,0,0,512);
    curtain.addColorStop(0,'rgba(222,248,240,.78)'); curtain.addColorStop(.35,'rgba(161,219,213,.48)');
    curtain.addColorStop(.8,'rgba(194,236,227,.4)'); curtain.addColorStop(1,'rgba(227,249,237,.12)');
    fallContext.fillStyle=curtain; fallContext.beginPath();
    fallContext.moveTo(84,0); fallContext.bezierCurveTo(104,58,70,140,76,235);
    fallContext.bezierCurveTo(82,325,38,410,26,512); fallContext.lineTo(478,512);
    fallContext.bezierCurveTo(451,403,440,333,442,232); fallContext.bezierCurveTo(444,135,413,63,424,0);
    fallContext.closePath(); fallContext.fill();
    for(let i=0;i<34;i++) {
      const x=90+random()*330, width=1+random()*9, alpha=.08+random()*.2;
      const streak=fallContext.createLinearGradient(0,0,0,512);
      streak.addColorStop(0,'rgba(239,255,248,0)'); streak.addColorStop(.18,`rgba(239,255,248,${alpha})`);
      streak.addColorStop(.78,`rgba(239,255,248,${alpha*.8})`); streak.addColorStop(1,'rgba(239,255,248,0)');
      fallContext.strokeStyle=streak; fallContext.lineWidth=width; fallContext.lineCap='round'; fallContext.beginPath();
      fallContext.moveTo(x,random()*75); fallContext.bezierCurveTo(x-20+random()*40,155,x-24+random()*48,330,x-30+random()*60,470); fallContext.stroke();
    }
    const fallTexture=new THREE.CanvasTexture(fallCanvas); fallTexture.colorSpace=THREE.SRGBColorSpace;
    const waterfall=new THREE.Mesh(new THREE.PlaneGeometry(11.8,7.6),new THREE.MeshBasicMaterial({map:fallTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    waterfall.position.set(0,3.85,.85); falls.add(waterfall);
    const mistCanvas=document.createElement('canvas'); mistCanvas.width=128; mistCanvas.height=128;
    const mistContext=mistCanvas.getContext('2d'), mistGradient=mistContext.createRadialGradient(64,64,0,64,64,64);
    mistGradient.addColorStop(0,'rgba(237,255,245,.38)'); mistGradient.addColorStop(1,'rgba(237,255,245,0)');
    mistContext.fillStyle=mistGradient; mistContext.fillRect(0,0,128,128);
    const mistTexture=new THREE.CanvasTexture(mistCanvas); mistTexture.colorSpace=THREE.SRGBColorSpace;
    const spray=[];
    for(let i=0;i<12;i++) {
      const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:mistTexture,transparent:true,depthWrite:false,opacity:.7}));
      puff.position.set(-5.5+i, .35, 1.15); falls.add(puff); spray.push(puff);
    }
    const foam=new THREE.Mesh(new THREE.RingGeometry(2.4,2.65,40),new THREE.MeshBasicMaterial({color:'#d8f2e6',transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}));
    foam.rotation.x=-Math.PI/2; foam.scale.set(2.1,.55,1); foam.position.set(0,.08,1.5); falls.add(foam);
    const butterflies=[]; for(let i=0;i<7;i++){const butterfly=new THREE.Group();scene.add(butterfly); const left=add(butterfly,new THREE.SphereGeometry(.15,8,6),i%2?'#e8bb67':'#e7a2aa',-.12,0,0), right=add(butterfly,new THREE.SphereGeometry(.15,8,6),i%2?'#e8bb67':'#e7a2aa',.12,0,0);left.scale.set(1,.35,1.4);right.scale.set(1,.35,1.4); butterflies.push({butterfly,left,right,phase:i*1.9});}
    const soundTicks={};
    // Return portal at the start of the dock.
    const portal=new THREE.Group(); portal.position.set(0,0,LAKE_PORTAL_Z); scene.add(portal);
    add(portal,new THREE.CylinderGeometry(2.1,2.1,.25,24),'#4a5268',0,.3,0);
    const arch=add(portal,new THREE.TorusGeometry(1.65,.2,12,40),'#86c9e7',0,2.25,0);
    arch.material.emissive=new THREE.Color('#86c9e7'); arch.material.emissiveIntensity=1.1;
    const surface=new THREE.Mesh(new THREE.CircleGeometry(1.46,40),new THREE.MeshBasicMaterial({color:'#5b8fd5',transparent:true,opacity:.8,side:THREE.DoubleSide})); surface.position.set(0,2.25,0); portal.add(surface);
    const portalLight=new THREE.PointLight('#78aaff',14,8); portalLight.position.set(0,2,1); portal.add(portalLight);
    const labelCanvas=document.createElement('canvas'); labelCanvas.width=512; labelCanvas.height=128;
    const labelContext=labelCanvas.getContext('2d');
    const labelTexture=new THREE.CanvasTexture(labelCanvas); labelTexture.colorSpace=THREE.SRGBColorSpace;
    const label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture}));
    portalSignRef.current=lang=>{ labelContext.fillStyle='#201d20'; labelContext.fillRect(0,0,512,128); labelContext.strokeStyle='#8ecce4'; labelContext.lineWidth=5; labelContext.strokeRect(4,4,504,120); labelContext.fillStyle='#f4e3c2'; labelContext.textAlign='center'; labelContext.font='bold 34px sans-serif'; labelContext.fillText(dungeonPortalLabel(lang),256,78); labelTexture.needsUpdate=true; };
    portalSignRef.current(state.current.language); label.position.set(0,4.8,LAKE_PORTAL_Z); label.scale.set(5,1.25,1); scene.add(label);
    add(scene, new THREE.BoxGeometry(4,.35,9), '#8b6948', 0,.15,17.5);
    for (let z=13.3; z<22; z+=.8) add(scene,new THREE.BoxGeometry(3.9,.08,.08),'#614832',0,.35,z);
    [-1.8,1.8].forEach(x => [14,17,20].forEach(z => add(scene,new THREE.CylinderGeometry(.13,.13,1.4,8),'#68472f',x,-.1,z)));
    // The cove guide uses the same face proportions as the village residents.
    const guide=new THREE.Group(); guide.position.set(3.2,.08,22.2); guide.rotation.y=-Math.PI/2; scene.add(guide);
    const guideSkin='#c69b78', guideHair='#573a30';
    const guideBox=(parent,w,h,d,color,x,y,z)=>add(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);
    const guideSphere=(parent,r,color,x,y,z)=>add(parent,new THREE.IcosahedronGeometry(r,1),color,x,y,z);
    add(guide,new THREE.CylinderGeometry(.29,.26,.66,8),'#608679',0,1.2,0);
    add(guide,new THREE.CylinderGeometry(.27,.52,.72,10),'#7b6b58',0,.57,0);
    add(guide,new THREE.CylinderGeometry(.53,.53,.06,10),'#bba77f',0,.22,0);
    guideBox(guide,.52,.1,.4,'#a98e63',0,.88,0);
    guideBox(guide,.38,.47,.04,'#ded0ad',0,.56,.45);
    [-1,1].forEach(side=>{
      const sleeve=add(guide,new THREE.SphereGeometry(.19,9,7),'#e4d7bc',side*.34,1.43,0);sleeve.scale.set(1,.75,1);
      const arm=guideBox(guide,.16,.52,.2,'#e4d7bc',side*.37,1.12,0);arm.rotation.z=side*.1;
      guideSphere(guide,.09,guideSkin,side*.4,.84,0);
      guideBox(guide,.2,.22,.33,'#59483a',side*.17,.16,.04);
    });
    guideSphere(guide,.28,guideSkin,0,1.81,0);
    add(guide,new THREE.SphereGeometry(.305,12,8,0,Math.PI*2,0,Math.PI*.48),guideHair,0,1.82,0);
    guideBox(guide,.49,.63,.22,guideHair,0,1.57,-.22);
    [-1,1].forEach(side=>{const lock=guideBox(guide,.13,.55,.18,guideHair,side*.265,1.62,-.01);lock.rotation.z=side*-.08;});
    [.0,.13,.26,.39].forEach(offset=>guideSphere(guide,.105-offset*.045,guideHair,-.3,1.63-offset,-.2));
    guideSphere(guide,.055,'#d9be84',-.3,1.19,-.2);
    addFaceDetails(guide,{box:guideBox,sphere:guideSphere},{headY:1.81,skin:guideSkin,brow:'#523d35',eyes:true});
    const hat=add(guide,new THREE.CylinderGeometry(.45,.45,.07,12),'#bba16f',0,2.08,0);hat.rotation.z=-.08;
    const crown=add(guide,new THREE.CylinderGeometry(.23,.3,.23,10),'#c6ad7e',0,2.2,0);crown.rotation.z=-.08;
    guideSphere(guide,.07,'#e6c98f',.27,2.15,.19);
    const guideSignCanvas=document.createElement('canvas'); guideSignCanvas.width=768; guideSignCanvas.height=224;
    const guideSignContext=guideSignCanvas.getContext('2d');
    const guideSignTexture=new THREE.CanvasTexture(guideSignCanvas); guideSignTexture.colorSpace=THREE.SRGBColorSpace;
    const guideSign=new THREE.Sprite(new THREE.SpriteMaterial({map:guideSignTexture,depthTest:true}));
    guideSignRef.current=lang=>{
      guideSignContext.fillStyle='#101b24'; guideSignContext.fillRect(0,0,768,224);
      guideSignContext.strokeStyle='#608679'; guideSignContext.lineWidth=5; guideSignContext.strokeRect(10,10,748,204);
      guideSignContext.textAlign='center'; guideSignContext.fillStyle='#9dc9b8'; guideSignContext.font='bold 49px sans-serif'; guideSignContext.fillText('MARINA',384,92);
      guideSignContext.fillStyle='#e6e0d2'; guideSignContext.font='32px sans-serif'; guideSignContext.fillText(lang==='en-US'?'F \u00b7 TALK':'F \u00b7 CONVERSAR',384,159);
      guideSignTexture.needsUpdate=true;
    };
    guideSignRef.current(state.current.language); guideSign.position.set(0,3.05,0); guideSign.scale.set(2.5,.73,1); guide.add(guideSign);
    const boat=createLakeBoat(add); scene.add(boat); boat.position.set(BOAT_MOORING.x,0,BOAT_MOORING.z);
    const mesh = (parent, geometry, color, x, y, z) => add(parent,geometry,color,x,y,z);
    const box = (parent,w,h,d,color,x,y,z) => add(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);
    const sphere = (parent,r,color,x,y,z) => add(parent,new THREE.IcosahedronGeometry(r,1),color,x,y,z);
    const cylinder = (parent,r,h,color,x,y,z,segments=8) => add(parent,new THREE.CylinderGeometry(r,r,h,segments),color,x,y,z);
    const { player, limbs } = createAdventurer(scene,{box,sphere,mesh,cylinder});
    player.position.set(0,.23,31); player.rotation.y=Math.PI;
    const orbit = allowRunAndRotate(new OrbitControls(camera,renderer.domElement)); orbit.enableDamping=true; orbit.enablePan=false; orbit.minDistance=5; orbit.maxDistance=24; orbit.maxPolarAngle=Math.PI/2-.08;
    camera.position.set(10,12,41); orbit.target.set(0,1,31); orbit.update();
    aboardRef.current=false; setAboard(false);

    const resize = () => { const w=el.clientWidth, h=el.clientHeight; if (!w || !h) return; renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const keydown = e => { const k=e.key.toLowerCase(); if (k==='escape' && dialogueOpen.current && !state.current.paused) { e.preventDefault(); guideActions.current.closeGuide(); return; } if (document.activeElement !== renderer.domElement || state.current.paused || dialogueOpen.current) return; if(k==='f' && nearGuideRef.current) { e.preventDefault(); guideActions.current.openGuide(); return; } if (k === 'e' && aboardRef.current && boat.position.z < -107 && Math.abs(boat.position.x)<4) { e.preventDefault(); clear(); enterRapidsRef.current?.(); return; } if (k === 'e' && !aboardRef.current && nearLakePortal(player.position)) { e.preventDefault(); exitRef.current(); return; } if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)) { if (k !== 'shift') e.preventDefault(); controls.current.add(k); } };
    const keyup = e => controls.current.delete(e.key.toLowerCase());
    const clear = () => controls.current.clear();
    let exitRequested=false, pointerStart=null;
    const enterVillage=()=>{ if(exitRequested)return; exitRequested=true; clear(); exitRef.current(); };
    const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
    const pointerDown=e=>{ if(e.isPrimary && e.button===0) pointerStart={id:e.pointerId,x:e.clientX,y:e.clientY}; };
    const pointerUp=e=>{
      const start=pointerStart; pointerStart=null;
      if(!start || start.id!==e.pointerId || Math.hypot(e.clientX-start.x,e.clientY-start.y)>6 || state.current.paused || dialogueOpen.current) return;
      const bounds=renderer.domElement.getBoundingClientRect(); if(!bounds.width||!bounds.height)return;
      pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);
      raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects([portal,guide],true)[0]; if(!hit)return;
      let object=hit.object;
      while(object && object!==portal && object!==guide) object=object.parent;
      if(object===portal) enterVillage();
      else if(object===guide) guideActions.current.openGuide({fromClick:true});
    };
    const pointerCancel=()=>{pointerStart=null;};
    renderer.domElement.addEventListener('pointerdown',pointerDown);
    renderer.domElement.addEventListener('pointerup',pointerUp);
    renderer.domElement.addEventListener('pointercancel',pointerCancel);
    window.addEventListener('keydown',keydown); window.addEventListener('keyup',keyup); window.addEventListener('blur',clear);
    let frame, last = performance.now();
    const animate = now => {
      frame=requestAnimationFrame(animate); const dt=Math.min((now-last)/1000,.05); last=now;
      const k=controls.current; let moving=false;
      if (!state.current.paused && !state.current.reduceMotion) {
        waterTime+=dt;
        const vertices=waterGeometry.attributes.position;
        for(let i=0;i<vertices.count;i++) {
          const x=waterBase[i*3], z=waterBase[i*3+2];
          vertices.array[i*3+1]=Math.sin(x*.7+waterTime*1.15+z*.16)*.045+Math.sin(z*.35-waterTime*.8)*.035;
        }
        vertices.needsUpdate=true; waterGeometry.computeVertexNormals();
      }
      fish.forEach((fishItem,i)=>{
        const t=waterTime*.45+fishItem.phase;
        const jumpPhase=(waterTime+i*2.13)%14;
        const jump=!state.current.reduceMotion && jumpPhase<1.4 ? Math.sin(jumpPhase/1.4*Math.PI) : 0;
        fishItem.group.position.set(fishItem.x+Math.sin(t)*1.2, -.13+jump*1.35, fishItem.z+Math.cos(t)*2);
        fishItem.group.rotation.y=Math.atan2(Math.cos(t)*1.2,-Math.sin(t)*2)+Math.PI;
        fishItem.group.rotation.x=jump ? Math.cos(jumpPhase/1.4*Math.PI)*.55 : 0;
        fishItem.tail.rotation.y=Math.sin(waterTime*7+fishItem.phase)*.4;
      });
      if (!state.current.paused && !dialogueOpen.current) {
        const x=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0);
        const z=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0);
        if(x||z) {
          const forward=new THREE.Vector3(); camera.getWorldDirection(forward); forward.y=0; forward.normalize();
          const right=new THREE.Vector3(-forward.z,0,forward.x);
          const direction=forward.multiplyScalar(-z).addScaledVector(right,x).normalize();
          const target=aboardRef.current ? boat : player;
          const speed=(aboardRef.current ? 4.5 : 3.3) * (k.has('shift') ? 1.8 : 1);
          const nx=target.position.x+direction.x*speed*dt, nz=target.position.z+direction.z*speed*dt;
          const boatHeading=Math.atan2(-direction.x,-direction.z);
          const landing=aboardRef.current && Math.abs(nx)<9.8 && nz>=-112 && nz<=20
            ? dockLanding(nx,nz,boatHeading) : null;
          if (landing) {
            scene.add(player); player.position.set(landing.x,.36,landing.z); player.rotation.y=0;
            boat.position.set(BOAT_MOORING.x,0,BOAT_MOORING.z); boat.rotation.y=0;
            aboardRef.current=false; setAboard(false); clear(); moving=false;
          } else if (aboardRef.current ? Math.abs(nx)<9.8 && nz>=-112 && nz<=20 : nz>=12.4 && nz<=36.5 && (nz>=21 ? Math.abs(nx)<8 : Math.abs(nx)<1.7)) {
            target.position.x=nx; target.position.z=nz; if (!aboardRef.current) target.position.y=nz>=22 ? .23 : .36; moving=true;
          }
          if (moving && !aboardRef.current && touchingLakePortal(player.position)) { enterVillage(); return; }
          if (moving) target.rotation.y=aboardRef.current ? Math.atan2(-direction.x,-direction.z) : Math.atan2(direction.x,direction.z);
          if (!aboardRef.current && Math.hypot(player.position.x-boat.position.x,player.position.z-boat.position.z)<BOARDING_DISTANCE) {
            aboardRef.current=true; setAboard(true); boat.add(player); player.position.set(0,1, .55); player.rotation.y=Math.PI;
          }
        }
        if (limbs) { const swing=moving && !aboardRef.current ? Math.sin(now*.012)*.45 : 0; limbs[0].rotation.x=swing; limbs[2].rotation.x=-swing; limbs[1].rotation.x=-swing; limbs[3].rotation.x=swing; }
        boat.position.y=state.current.reduceMotion ? 0 : Math.sin(now*.002)*.06;
      } else clear();
      if(!state.current.paused)facePlayer(guide,player);
      const sceneryTime=state.current.reduceMotion ? 0 : waterTime;
      lilies.forEach(({pad,phase})=>{pad.position.y=.09+Math.sin(sceneryTime*1.2+phase)*.035; pad.rotation.y=Math.sin(sceneryTime*.3+phase)*.12;});
      reeds.forEach(({reed,phase})=>{reed.rotation.z=Math.sin(sceneryTime*.8+phase)*.06;});
      driftwood.forEach(({log,phase})=>{log.position.y=.12+Math.sin(sceneryTime+phase)*.05; log.rotation.x=Math.sin(sceneryTime*.7+phase)*.04;});
      ripples.forEach(({ring,phase})=>{const cycle=(sceneryTime*.35+phase)%1; ring.scale.setScalar(.6+cycle*1.5); ring.material.opacity=state.current.reduceMotion ? .2 : .4*(1-cycle);});
      skewers.forEach(({skewer,phase})=>{skewer.rotation.y=state.current.reduceMotion?0:Math.sin(sceneryTime*.8+phase)*.08;});
      flame.scale.set(.8+Math.sin(sceneryTime*7)*.15,1+Math.sin(sceneryTime*9)*.2,.8); firelight.intensity=3+Math.sin(sceneryTime*8)*.5;
      spray.forEach((p,i)=>{const t=(sceneryTime*.45+i*.12)%1; p.position.y=.3+t*1.4; p.scale.setScalar(.5+t);});
      butterflies.forEach(({butterfly,left,right,phase},i)=>{const t=sceneryTime*.7+phase; butterfly.position.set(-15.5+Math.sin(t)*1.5,1.7+Math.sin(t*1.7)*.5,-8-i*12+Math.cos(t)*2); left.rotation.z=Math.sin(t*16)*.8; right.rotation.z=-Math.sin(t*16)*.8;});
      horses.forEach(({horse,legs,tail,phase,z})=>{
        const t=sceneryTime*.28+phase;
        // The model faces +X, so align it with the tangent of its path.
        horse.position.set(-19+Math.sin(t)*1.1, .08, z+Math.cos(t)*1.1);
        horse.rotation.y=Math.atan2(Math.sin(t),Math.cos(t));
        const stride=state.current.reduceMotion ? 0 : Math.sin(sceneryTime*3.5+phase)*.35;
        legs.forEach((leg,i)=>{leg.rotation.z=(i===0 || i===3 ? 1 : -1)*stride;});
        tail.rotation.z=-.5+(state.current.reduceMotion ? 0 : Math.sin(sceneryTime*1.5+phase)*.12);
      });
      smoke.forEach((p,i)=>{const t=(sceneryTime*.7+i*.85)%6; p.position.set(Math.sin(t+i)*.7+t*.25,8.7+t*1.1,Math.cos(t+i)*.35); p.scale.setScalar(.6+t*.18);});
      sparks.forEach((p,i)=>{const t=(sceneryTime*.65+i*.19)%1; p.position.set(Math.cos(i*2.4)*t*2,8+t*5-3*t*t,Math.sin(i*2.4)*t*2); p.visible=!state.current.reduceMotion && t<.8;});
      gunslingers.forEach(({gunman,arm,flash,legs,side},i)=>{
        const shot=(sceneryTime+i*1.5)%3;
        const pace=state.current.reduceMotion ? 0 : Math.sin(sceneryTime*.65+i*Math.PI)*.8;
        gunman.position.x=20+side*4+pace;
        const stride=state.current.reduceMotion ? 0 : Math.sin(sceneryTime*4+i*Math.PI)*.25;
        legs[0].rotation.x=stride; legs[1].rotation.x=-stride;
        arm.rotation.x=shot<.16 && !state.current.reduceMotion ? .2 : 0;
        flash.visible=!state.current.reduceMotion && shot<.1;
      });
      birds.forEach(({bird,left,right,phase})=>{const t=sceneryTime*.35+phase; bird.position.set(-20+Math.cos(t)*5,7+Math.sin(t*2)*.6,-70+Math.sin(t)*9); bird.rotation.y=-t; left.rotation.z=Math.sin(t*14)*.5; right.rotation.z=-Math.sin(t*14)*.5;});
      if (!state.current.paused && !state.current.reduceMotion && aboardRef.current) {
        [['horse',-35,5],['shot',-57,3],['volcano',-83,8],['birds',-70,7]].forEach(([event,z,interval])=>{
          const tick=Math.floor(sceneryTime/interval);
          if(Math.abs(boat.position.z-z)<17 && soundTicks[event]!==tick){soundTicks[event]=tick; state.current.onSound?.(event);}
        });
      }
      const guideNearby=!aboardRef.current && Math.hypot(player.position.x-guide.position.x,player.position.z-guide.position.z)<4.6;
      if(guideNearby!==nearGuideRef.current){nearGuideRef.current=guideNearby;setNearGuide(guideNearby);}
      const isNearCave=aboardRef.current && boat.position.z < -107 && Math.abs(boat.position.x)<4; setNearCave(previous => previous === isNearCave ? previous : isNearCave);
      const follow=aboardRef.current ? boat.position : player.position;
      const nextTarget=new THREE.Vector3(follow.x,1,follow.z); const shift=nextTarget.clone().sub(orbit.target);
      camera.position.add(shift); orbit.target.copy(nextTarget); orbit.enabled=!state.current.paused && !dialogueOpen.current; orbit.update(); panorama.position.set(camera.position.x,6,camera.position.z); renderer.render(scene,camera);
    }; frame=requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.domElement.removeEventListener('pointerdown',pointerDown); renderer.domElement.removeEventListener('pointerup',pointerUp); renderer.domElement.removeEventListener('pointercancel',pointerCancel); window.removeEventListener('keydown',keydown); window.removeEventListener('keyup',keyup); window.removeEventListener('blur',clear); clear(); stopVoice.current?.(); orbit.dispose(); portalSignRef.current=null; guideSignRef.current=null; labelTexture.dispose(); guideSignTexture.dispose(); horizonTexture.dispose(); horizonFade.dispose(); fallTexture.dispose(); mistTexture.dispose(); scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.material) o.material.dispose(); }); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  const press = (key, down) => { if (paused || dialogueOpen.current) return; if(down) controls.current.add(key); else controls.current.delete(key); };
  return <section className="lake"><div className="lake-viewport"><div className="lake-canvas" ref={mount}/><button className="lake-exit" onClick={onExit}>{en ? 'Return to village' : 'Voltar para a vila'}</button>{nearCave && <button className="lake-portal-action" onClick={onEnterRapids}>{en ? 'Enter the rapids' : 'Entrar nas corredeiras'} <kbd>E</kbd></button>}{nearGuide && !talking && <button className="marina-talk" onClick={openGuide}>{en ? 'Talk to Marina' : 'Conversar com Marina'} <kbd>F</kbd></button>}{talking && <LakeGuideDialogue ref={guidePanel} language={language} line={guideLine} speaking={speaking} voiceEnabled={voiceEnabled} voiceNotice={voiceNotice} onSpeak={onSpeak} onStop={onStop} onNext={openGuide} onClose={closeGuide} />}{error ? <p className="lake-scene-error">{en ? '3D is unavailable in this browser.' : 'O 3D não está disponível neste navegador.'}</p> : <MapControlGuide language={language} scene="lake" aboard={aboard}/>}</div><div className="lake-touch" aria-label={en ? 'Boat controls' : 'Controles do barco'}>{[['arrowleft','←'],['arrowup','↑'],['arrowdown','↓'],['arrowright','→']].map(([key,label]) => <button key={key} type="button" aria-label={{arrowleft: en?'Left':'Esquerda',arrowup: en?'Forward':'Frente',arrowdown: en?'Back':'Trás',arrowright: en?'Right':'Direita'}[key]} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId); press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{label}</button>)}</div></section>;
}
