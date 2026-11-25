import { isRunning, setTouchMovement } from './touchMovement';
import TouchInteract from './TouchInteract';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { allowRunAndRotate } from './runAndRotate';
import { facePlayer } from './facePlayer';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import { addFaceDetails, createAdventurer } from './VillageScene';
import { createLakeBoat } from './lakeBoat';
import './Lake.css';
import './Ruins.css';
import MapControlGuide from './MapControlGuide';
import PirateDialogue from './PirateDialogue';
import pirateLines from './ruinsPirate.json';
import { SHRINES, SHIPWRECK, COLUMNS, ruinsObstacle, nearTempleEntrance } from './ruinsWorld';
import { addCoveHull, createCoveCoast, createCoveOcclusion } from './ruinsCoast';
import { sceneFrameDelta } from './sceneFrameDelta';


export default function Ruins({ campaignNavigation,language,paused,reduceMotion,onExit,onEnterTunnel,onSound,onSpeak,onStop,speaking,voiceEnabled,voiceNotice,active=true,startNearPassage=false}) {
  const mount=useRef(null),keys=useRef(new Set()), settings=useRef({paused,reduceMotion}), returnToPassage=useRef(null);
  settings.current={paused,reduceMotion,language,onSound,onEnterTunnel};
  const [talking,setTalking]=useState(false),[pirateNear,setPirateNear]=useState(false),[pirateLine,setPirateLine]=useState(0);
  const talkingRef=useRef(false),pirateNearRef=useRef(false),pirateVisits=useRef(0),piratePanel=useRef(null),pirateSignRef=useRef(null),stopVoice=useRef(onStop);stopVoice.current=onStop;
  const [activated,setActivated]=useState(() => SHRINES.map(() => false)), [near,setNear]=useState(-1), [nearTunnel,setNearTunnel]=useState(false), [error,setError]=useState(false);
  const activeRef=useRef(activated), nearRef=useRef(-1), tunnelNearRef=useRef(false); activeRef.current=activated;
  const en=language==='en-US';
  const talkPirate=({fromClick=false}={})=>{if(paused||(!pirateNearRef.current&&!fromClick&&!talkingRef.current))return;keys.current.clear();const line=pirateVisits.current++%pirateLines['pt-BR'].length;setPirateLine(line);talkingRef.current=true;setTalking(true);settings.current.onSound?.('talk');onSpeak?.(line);};
  const closePirate=()=>{talkingRef.current=false;setTalking(false);onStop?.();mount.current?.querySelector('canvas')?.focus({preventScroll:true});};
  const pirateActions=useRef({talkPirate,closePirate});pirateActions.current={talkPirate,closePirate};
  useEffect(()=>{if(talking)piratePanel.current?.focus();},[talking]);
  useEffect(()=>{pirateSignRef.current?.(language);},[language]);
  useEffect(()=>{if(active)mount.current?.querySelector('canvas')?.focus({preventScroll:true});},[active]);
  const activate=()=>{
    if(settings.current.paused || talkingRef.current)return;
    if(tunnelNearRef.current){keys.current.clear();settings.current.onSound?.('passage');settings.current.onEnterTunnel?.();return;}
    const i=nearRef.current;if(i<0 || activeRef.current[i])return;
    const next=activeRef.current.map((value,index)=>index===i?true:value);activeRef.current=next;setActivated(next);
    settings.current.onSound?.('rune');if(next.every(Boolean))settings.current.onSound?.('gate');
  };
  const activateRef=useRef(activate); activateRef.current=activate;
  useEffect(()=>{
    const el=mount.current;let renderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true});} catch {setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)); renderer.domElement.tabIndex=0;
    renderer.domElement.setAttribute('aria-label','Sunken ruins / Ruínas submersas'); el.appendChild(renderer.domElement); renderer.domElement.focus({preventScroll:true});
    const scene=new THREE.Scene();scene.background=new THREE.Color('#b9cdca');scene.fog=new THREE.Fog('#b9cdca',48,144);
    scene.add(new THREE.HemisphereLight('#e1f2ff','#74705e',1.72));const light=new THREE.DirectionalLight('#ffe0ad',2.05);light.position.set(-16,18,-19);scene.add(light);
    const camera=new THREE.PerspectiveCamera(48,1,.1,165);
    const add=(parent,geometry,color,x,y,z)=>{const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.88}));mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
    // A painted horizon surrounds the cove without becoming part of navigation.
    const horizonCanvas=document.createElement('canvas');horizonCanvas.width=1024;horizonCanvas.height=256;
    const horizonContext=horizonCanvas.getContext('2d'), sky=horizonContext.createLinearGradient(0,0,0,256);
    sky.addColorStop(0,'#82aebb');sky.addColorStop(.52,'#bcceca');sky.addColorStop(.76,'#e4ccb0');sky.addColorStop(1,'#9fbdbb');
    horizonContext.fillStyle=sky;horizonContext.fillRect(0,0,1024,256);
    const horizonRidge=(baseline,height,color,phase)=>{horizonContext.fillStyle=color;horizonContext.beginPath();horizonContext.moveTo(0,256);
      for(let x=0;x<=1024;x+=4){const a=x/1024*Math.PI*2;horizonContext.lineTo(x,baseline-Math.sin(a*3+phase)*height-Math.sin(a*7-phase)*height*.3);}
      horizonContext.lineTo(1024,256);horizonContext.closePath();horizonContext.fill();};
    horizonRidge(184,12,'#a9b7ae',.4);horizonRidge(213,10,'#8fa8a5',1.2);
    const horizonTexture=new THREE.CanvasTexture(horizonCanvas);horizonTexture.colorSpace=THREE.SRGBColorSpace;
    const horizon=new THREE.Mesh(new THREE.CylinderGeometry(122,122,58,64,1,true),new THREE.MeshBasicMaterial({map:horizonTexture,side:THREE.BackSide,depthWrite:false,fog:false}));
    horizon.position.y=8;horizon.renderOrder=-10;horizon.frustumCulled=false;scene.add(horizon);
    const animateCoast=createCoveCoast(scene);
    const occluders=[];
    // Soft light sprites are shared by all altars, but each keeps its own color and opacity.
    const haloCanvas=document.createElement('canvas');haloCanvas.width=128;haloCanvas.height=128;
    const haloContext=haloCanvas.getContext('2d'), haloGradient=haloContext.createRadialGradient(64,64,1,64,64,64);
    haloGradient.addColorStop(0,'rgba(255,255,255,.9)');haloGradient.addColorStop(.18,'rgba(255,255,255,.5)');haloGradient.addColorStop(1,'rgba(255,255,255,0)');
    haloContext.fillStyle=haloGradient;haloContext.fillRect(0,0,128,128);
    const haloTexture=new THREE.CanvasTexture(haloCanvas);haloTexture.colorSpace=THREE.SRGBColorSpace;
    const makeHalo=(parent,x,y,z)=>{const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTexture,color:'#ffd595',transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.position.set(x,y,z);sprite.scale.set(3.4,3.4,1);parent.add(sprite);return sprite;};
    // Each rune has a warm, visible idle glow and turns turquoise when activated.
    const beacons=SHRINES.map(({x,z},i)=>{
      const shrine=new THREE.Group();shrine.position.set(x,0,z);scene.add(shrine);occluders.push(shrine);
      const island=add(shrine,new THREE.CylinderGeometry(2.6,3,.5,9),'#a9aa91',0,.05,0);island.rotation.y=.3*i;
      add(shrine,new THREE.CylinderGeometry(2.12,2.25,.18,10),'#c0bda2',0,.34,0);
      const baseRing=add(shrine,new THREE.TorusGeometry(1.65,.07,6,32),'#c3a977',0,.46,0);baseRing.rotation.x=Math.PI/2;
      for(let j=0;j<8;j++) {const a=j*Math.PI/4;const tile=add(shrine,new THREE.BoxGeometry(.22,.07,.38),'#819384',Math.cos(a)*1.4,.47,Math.sin(a)*1.4);tile.rotation.y=-a;}
      add(shrine,new THREE.CylinderGeometry(1.05,1.2,.4,8),'#788a7b',0,.66,0);
      const pillar=add(shrine,new THREE.BoxGeometry(.95,2.25,.95),'#b0b19b',0,1.95,0);pillar.rotation.y=i*.3;
      add(shrine,new THREE.BoxGeometry(1.25,.22,1.25),'#d0c8a9',0,3.13,0);
      const rune=add(shrine,new THREE.OctahedronGeometry(.52,0),'#f4cb84',0,3.8,0);rune.material.emissive=new THREE.Color('#b56a24');rune.material.emissiveIntensity=.8;
      const halo=makeHalo(shrine,0,3.8,0);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.85,.045,8,40),new THREE.MeshBasicMaterial({color:'#ffd18a',transparent:true,opacity:.7}));ring.rotation.x=Math.PI/2;ring.position.y=3.8;shrine.add(ring);
      const beam=new THREE.Mesh(new THREE.CylinderGeometry(.12,.4,9,12,1,true),new THREE.MeshBasicMaterial({color:'#70f2dc',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));beam.position.y=8.5;shrine.add(beam);
      const glow=new THREE.PointLight('#ffc57c',4,12);glow.position.set(0,3.8,0);shrine.add(glow);
      for(let j=0;j<5;j++){const a=j*Math.PI*2/5+i;const shrub=add(shrine,new THREE.IcosahedronGeometry(.34,0),'#678867',Math.cos(a)*2.15,.45,Math.sin(a)*2.15);shrub.scale.set(1.1,.7,1);}
      return {rune,glow,halo,ring,beam};
    });
    // Each capital is attached to its column and leans with the same structure.
    COLUMNS.forEach(([x,z],i)=>{
      const ruin=new THREE.Group();ruin.position.set(x,-.2,z);ruin.rotation.z=(i%2?1:-1)*.16;scene.add(ruin);occluders.push(ruin);
      const height=[2.8,1.2,3.1,.72,1.6,1.95][i];
      add(ruin,new THREE.CylinderGeometry(.7,.85,.28,8),'#b6b8a1',0,.14,0);
      add(ruin,new THREE.CylinderGeometry(.58,.7,height,8),'#929e8c',0,.28+height/2,0);
      const cap=add(ruin,new THREE.CylinderGeometry(.75,.62,.22,8),'#aeb7a2',0,height+.39,0);
      cap.rotation.z=i%2?.2:.04;
      const moss=add(ruin,new THREE.IcosahedronGeometry(.28,0),'#698869',.48,.55,0);moss.scale.set(1,.65,.8);
    });
    const temple=new THREE.Group();temple.position.set(0,0,-31);scene.add(temple);occluders.push(temple);
    [-1,1].forEach(side=>{add(temple,new THREE.BoxGeometry(2.1,7,4),'#8c9785',side*5.1,3.5,0);add(temple,new THREE.BoxGeometry(2.7,.6,4.5),'#b0b29b',side*5.1,7.2,0);});
    const arch=new THREE.Shape();
    arch.moveTo(-6,6.45);arch.lineTo(-6,8.92);arch.lineTo(6,8.92);arch.lineTo(6,6.45);
    arch.lineTo(3.85,6.45);arch.quadraticCurveTo(0,9.3,-3.85,6.45);arch.closePath();
    add(temple,new THREE.ExtrudeGeometry(arch,{depth:3.85,bevelEnabled:false}),'#9fa793',0,0,-1.92);
    for(let i=0;i<13;i++){
      const x=i*.86-5.16,y=7.15+1.08*(1-(x/5.59)**2);
      const voussoir=add(temple,new THREE.BoxGeometry(.82,.43,.27),i%3?'#a7ab98':'#b9b5a0',x,y,2.06);
      voussoir.rotation.z=-x*.064;
    }
    add(temple,new THREE.BoxGeometry(13,.35,4.4),'#c1c2a9',0,8.5,0);
    add(temple,new THREE.BoxGeometry(10.5,.3,4.2),'#788d7d',0,9.1,0);
    [-1,1].forEach(side=>{
      for(let j=0;j<3;j++)add(temple,new THREE.BoxGeometry(.19,5.8,.12),'#b9c1a9',side*(4.45+j*.42),3.4,2.03);
      const moss=add(temple,new THREE.IcosahedronGeometry(.55,0),'#66896b',side*5.3,5.2,2.05);moss.scale.set(1.8,.55,.5);
      const guardian=add(temple,new THREE.OctahedronGeometry(.3,0),'#d6c18c',side*4.85,7.9,2.15);guardian.material.emissive=new THREE.Color('#987844');guardian.material.emissiveIntensity=.5;
    });
    const gate=add(temple,new THREE.BoxGeometry(7.5,6.8,.45),'#6e7f72',0,3.4,.8);
    for(let i=-2;i<=2;i++)add(gate,new THREE.BoxGeometry(.07,5.5,.08),'#98b0a0',i*1.1,0,.25);
    // A dark opening behind the gate is the entrance to the next area.
    const tunnelMouth=add(temple,new THREE.PlaneGeometry(7.3,6.6),'#101b1a',0,3.35,-1.9);
    tunnelMouth.material.side=THREE.DoubleSide;
    // A damaged hull and broken mast form a small shipwreck for the stranded pirate.
    const wreck=new THREE.Group();wreck.position.set(SHIPWRECK.x,0,SHIPWRECK.z);wreck.rotation.y=.35;scene.add(wreck);
    const hullColors=['#594332','#78583d','#9b7954'];
    addCoveHull(wreck,(parent,geometry,shade,x,y,z)=>add(parent,geometry,hullColors[shade],x,y,z),true);
    const transom=add(wreck,new THREE.BoxGeometry(1.12,.62,.14),'#694c37',0,.23,2.4);
    transom.rotation.x=.22;
    for(let i=0;i<3;i++){
      const rib=add(wreck,new THREE.BoxGeometry(.11,.51,.14),'#594638',1.07,.49,.47+i*.42);
      rib.rotation.z=-.28;
    }
    const mast=new THREE.Group();mast.position.set(.75,.5,-.8);mast.rotation.z=-.38;wreck.add(mast);occluders.push(mast);
    add(mast,new THREE.CylinderGeometry(.09,.16,4.2,8),'#705039',0,2.05,0);
    const cross=add(mast,new THREE.CylinderGeometry(.06,.07,2,7),'#705039',0,3.2,0);cross.rotation.z=Math.PI/2;
    const torn=new THREE.Shape();torn.moveTo(-.85,3.12);torn.lineTo(.8,3.12);torn.lineTo(.57,1.8);torn.lineTo(.25,2.1);torn.lineTo(-.04,1.62);torn.lineTo(-.36,2.08);torn.lineTo(-.8,1.8);torn.closePath();
    const sail=add(mast,new THREE.ShapeGeometry(torn),'#c6b99c',0,0,.05);sail.material.side=THREE.DoubleSide;
    const pirate=new THREE.Group();pirate.position.set(-.25,.55,.8);pirate.rotation.y=1.1;wreck.add(pirate);
    const skin='#c39370',hair='#3d302b';
    const pirateBox=(parent,w,h,d,color,x,y,z)=>add(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);
    const pirateSphere=(parent,r,color,x,y,z)=>add(parent,new THREE.IcosahedronGeometry(r,1),color,x,y,z);
    pirateBox(pirate,.67,.86,.4,'#6e5144',0,1.15,0);pirateBox(pirate,.72,.12,.44,'#473b32',0,.85,0);
    pirateBox(pirate,.12,.16,.46,'#d6b87c',0,.86,.02);
    pirateSphere(pirate,.28,skin,0,1.84,0);
    add(pirate,new THREE.SphereGeometry(.3,12,8,0,Math.PI*2,0,Math.PI*.45),hair,0,1.85,0);
    pirateBox(pirate,.5,.3,.15,hair,0,1.7,-.22);
    addFaceDetails(pirate,{box:pirateBox,sphere:pirateSphere},{headY:1.84,skin,brow:'#49372d',eyes:true});
    add(pirate,new THREE.CylinderGeometry(.45,.45,.09,10),'#4e3b31',0,2.09,0);
    add(pirate,new THREE.CylinderGeometry(.23,.29,.29,9),'#594538',0,2.25,0);
    [-1,1].forEach(side=>{
      pirateBox(pirate,.2,.72,.23,'#434744',side*.18,.42,0);pirateBox(pirate,.24,.16,.34,'#493b30',side*.18,.12,.05);
      const arm=pirateBox(pirate,.2,.58,.2,'#6e5144',side*.42,1.15,0);arm.rotation.z=side*.09;
      pirateSphere(pirate,.1,skin,side*.45,.82,0);
    });
    const pirateSignCanvas=document.createElement('canvas');pirateSignCanvas.width=768;pirateSignCanvas.height=224;
    const pirateSignContext=pirateSignCanvas.getContext('2d'),pirateSignTexture=new THREE.CanvasTexture(pirateSignCanvas);pirateSignTexture.colorSpace=THREE.SRGBColorSpace;
    const pirateSign=new THREE.Sprite(new THREE.SpriteMaterial({map:pirateSignTexture,depthTest:true}));
    pirateSignRef.current=lang=>{pirateSignContext.fillStyle='#101b24';pirateSignContext.fillRect(0,0,768,224);pirateSignContext.strokeStyle='#a5896b';pirateSignContext.lineWidth=5;pirateSignContext.strokeRect(10,10,748,204);pirateSignContext.textAlign='center';pirateSignContext.fillStyle='#d9c4a0';pirateSignContext.font='bold 49px sans-serif';pirateSignContext.fillText('DUARTE',384,92);pirateSignContext.fillStyle='#e6e0d2';pirateSignContext.font='32px sans-serif';pirateSignContext.fillText(lang==='en-US'?'F \u00b7 TALK':'F \u00b7 CONVERSAR',384,159);pirateSignTexture.needsUpdate=true;};
    pirateSignRef.current(settings.current.language);pirateSign.position.set(0,3.05,0);pirateSign.scale.set(2.5,.73,1);pirate.add(pirateSign);
    const boat=createLakeBoat(add);scene.add(boat);boat.position.set(0,0,25);
    const mesh=(parent,geometry,color,x,y,z)=>add(parent,geometry,color,x,y,z);
    const box=(parent,w,h,d,color,x,y,z)=>add(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);
    const sphere=(parent,r,color,x,y,z)=>add(parent,new THREE.IcosahedronGeometry(r,1),color,x,y,z);
    const cylinder=(parent,r,h,color,x,y,z,segments=8)=>add(parent,new THREE.CylinderGeometry(r,r,h,segments),color,x,y,z);
    const {player}=createAdventurer(boat,{box,sphere,mesh,cylinder});player.position.set(0,1,.55);player.rotation.y=Math.PI;
    const boatSail=boat.children.find(object=>object.geometry?.type==='ShapeGeometry');
    if(boatSail)occluders.push(boatSail);
    const keepPlayerVisible=createCoveOcclusion(occluders);
    camera.position.set(10,8.5,45);
    const orbit=allowRunAndRotate(new OrbitControls(camera,renderer.domElement)); orbit.target.set(0,1,25); orbit.enablePan=false; orbit.enableDamping=true; orbit.minDistance=5; orbit.maxDistance=24; orbit.maxPolarAngle=Math.PI/2-.08; orbit.update();
    returnToPassage.current=()=>{const target=new THREE.Vector3(0,1,-23),shift=target.clone().sub(orbit.target);boat.position.set(0,0,-23);boat.rotation.y=0;camera.position.add(shift);orbit.target.copy(target);orbit.update();};
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const down=e=>{const k=e.key.toLowerCase();if(k==='escape'&&talkingRef.current&&!settings.current.paused){e.preventDefault();pirateActions.current.closePirate();return;}if(document.activeElement!==renderer.domElement||settings.current.paused||talkingRef.current)return;if(k==='f'&&pirateNearRef.current){e.preventDefault();pirateActions.current.talkPirate();return;}if(k==='e'){e.preventDefault();activateRef.current();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}};
    const up=e=>keys.current.delete(e.key.toLowerCase());const clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);renderer.domElement.addEventListener('blur',clear);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
    const pointerDown=e=>{if(e.isPrimary&&e.button===0)pointerStart={id:e.pointerId,x:e.clientX,y:e.clientY};};
    const pointerUp=e=>{const start=pointerStart;pointerStart=null;if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>6||settings.current.paused||talkingRef.current)return;
      const rect=renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return;
      pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
      if(raycaster.intersectObject(pirate,true).length)pirateActions.current.talkPirate({fromClick:true});};
    const pointerCancel=()=>{pointerStart=null;};renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',pointerCancel);

    let frame,last=performance.now(),time=0,coastTime=0,nextImpact=0;
    const animate=now=>{
      frame=requestAnimationFrame(animate);const dt=sceneFrameDelta(now,last);last=now;
      if(!settings.current.paused && !talkingRef.current){
        time+=dt;const x=(keys.current.has('d')||keys.current.has('arrowright')?1:0)-(keys.current.has('a')||keys.current.has('arrowleft')?1:0);
        const z=(keys.current.has('s')||keys.current.has('arrowdown')?1:0)-(keys.current.has('w')||keys.current.has('arrowup')?1:0);
        if(x||z){
          const direction=cameraRelativeDirection(camera,x,z);
          const speed=isRunning(keys.current)?9.75:6,nx=boat.position.x+direction.x*speed*dt,nz=boat.position.z+direction.z*speed*dt;
          const obstacle=ruinsObstacle(nx,nz);
          if(!obstacle){boat.position.x=nx;boat.position.z=nz;boat.rotation.y=Math.atan2(-direction.x,-direction.z);}
          else if(time>=nextImpact){settings.current.onSound?.(obstacle);nextImpact=time+.9;}
        }
        boat.position.y=settings.current.reduceMotion?0:Math.sin(time*1.4)*.06;
        const closeToPirate=Math.hypot(boat.position.x-SHIPWRECK.x,boat.position.z-SHIPWRECK.z)<8;
        if(closeToPirate!==pirateNearRef.current){pirateNearRef.current=closeToPirate;setPirateNear(closeToPirate);}
        const closest=SHRINES.findIndex((p,i)=>!activeRef.current[i]&&Math.hypot(boat.position.x-p.x,boat.position.z-p.z)<6);
        if(closest!==nearRef.current){nearRef.current=closest;setNear(closest);}
        const closeToTunnel=nearTempleEntrance(boat.position,activeRef.current);
        if(closeToTunnel!==tunnelNearRef.current){tunnelNearRef.current=closeToTunnel;setNearTunnel(closeToTunnel);}
      }else clear();
      if(!settings.current.paused)facePlayer(pirate,player);
      const reduced=settings.current.reduceMotion,open=activeRef.current.every(Boolean);
      if(!settings.current.paused) gate.position.y=reduced?(open?11:3.4):THREE.MathUtils.lerp(gate.position.y,open?11:3.4,Math.min(1,dt*2));
      beacons.forEach(({rune,glow,halo,ring,beam},i)=>{
        const active=activeRef.current[i], pulse=reduced?1:1+Math.sin(time*1.5+i)*.12;
        rune.material.color.set(active?'#8dfff0':'#f4cb84');rune.material.emissive.set(active?'#38dec4':'#b56a24');rune.material.emissiveIntensity=active?2:.8;
        halo.material.color.set(active?'#66ffdc':'#ffd595');halo.material.opacity=(active?.8:.48)*pulse;halo.scale.setScalar((active?5:3.4)*pulse);
        ring.material.color.set(active?'#89ffe7':'#ffd18a');ring.material.opacity=active?.95:.65;
        beam.material.opacity=active?.15:0;glow.color.set(active?'#71f6d4':'#ffc57c');glow.intensity=(active?13:4)*pulse;
        if(!reduced){rune.rotation.y=time*.6+i;ring.rotation.z=time*.28+i;}
      });
      if(!reduced && !settings.current.paused && !talkingRef.current && dt>0){
        coastTime+=dt;
        animateCoast(coastTime);
      }
      horizon.position.x=camera.position.x;horizon.position.z=camera.position.z;
      const target=new THREE.Vector3(boat.position.x,1,boat.position.z), shift=target.clone().sub(orbit.target);
      camera.position.add(shift); orbit.target.copy(target); orbit.enabled=!settings.current.paused && !talkingRef.current; orbit.enableDamping=!settings.current.reduceMotion; orbit.update(); keepPlayerVisible(camera,player,settings.current.paused?0:dt,reduced,gate.position.y); renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return()=>{returnToPassage.current=null;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',pointerCancel);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);renderer.domElement.removeEventListener('blur',clear);clear();stopVoice.current?.();pirateSignRef.current=null;orbit.dispose();horizonTexture.dispose();haloTexture.dispose();pirateSignTexture.dispose();const geometries=new Set(),materials=new Set();
      scene.traverse(object=>{
        if(object.isInstancedMesh)object.dispose();
        if(object.geometry)geometries.add(object.geometry);
        if(Array.isArray(object.material))object.material.forEach(surface=>materials.add(surface));
        else if(object.material)materials.add(object.material);
      });
      geometries.forEach(geometry=>geometry.dispose());
      materials.forEach(surface=>surface.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  const press=(key,down)=>{if(paused || talkingRef.current)return;setTouchMovement(keys.current, key, down);};
  useEffect(()=>{if(active && startNearPassage)returnToPassage.current?.();},[active,startNearPassage]);
  const count=activated.filter(Boolean).length;
  return <section className="lake ruins"><div className="lake-viewport"><div className="lake-canvas" ref={mount}/>{campaignNavigation ?? <button className="lake-exit" onClick={onExit}>{en?'Return to village':'Voltar para a vila'}</button>}
    <MapControlGuide language={language} scene="ruins"/>
    {pirateNear && !talking && <button className="ruins-pirate-talk" onClick={talkPirate}>{en?'Talk to Duarte':'Conversar com Duarte'} <kbd>F</kbd></button>}
    {talking && <PirateDialogue ref={piratePanel} language={language} line={pirateLine} speaking={speaking} voiceEnabled={voiceEnabled} voiceNotice={voiceNotice} onSpeak={onSpeak} onStop={onStop} onNext={talkPirate} onClose={closePirate}/>}
    <div className="ruins-status" aria-live="polite"><strong>{en?'Sunken Ruins Cove':'Enseada das Ruínas Submersas'}</strong><span>{error?(en?'3D is unavailable in this browser.':'O 3D não está disponível neste navegador.'):count===3?(en?'The gate is open. Approach to enter the tunnel.':'A porta se abriu. Aproxime-se para entrar no túnel.'):(en?`Activate the island runes: ${count}/3`:`Ative as runas das ilhas: ${count}/3`)}</span></div>
    {(nearTunnel || near>=0)&&<button className="lake-portal-action" onClick={()=>{activate();if(!tunnelNearRef.current)mount.current?.querySelector('canvas')?.focus();}}>{nearTunnel?(en?'Enter tunnel':'Entrar no túnel'):(en?'Activate rune':'Ativar runa')} <kbd>E</kbd></button>}</div>
    <div className="lake-touch" aria-label={en?'Boat controls':'Controles do barco'}>{[['arrowleft',en?'Left':'Esquerda','←'],['arrowup',en?'Forward':'Frente','↑'],['arrowdown',en?'Back':'Trás','↓'],['arrowright',en?'Right':'Direita','→']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}<TouchInteract language={language} scene={mount} disabled={paused || talking || !(pirateNear || nearTunnel || (near >= 0 && !activated[near]))} /></div></section>;
}
