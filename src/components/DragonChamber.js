import laugh1 from '../assets/audio/effects/dragon-laughs/1.mp3';
import laugh2 from '../assets/audio/effects/dragon-laughs/2.mp3';
import laugh3 from '../assets/audio/effects/dragon-laughs/3.mp3';
import laugh4 from '../assets/audio/effects/dragon-laughs/4.mp3';
import { bindNpcTap } from './bindNpcTap';
import { poseAdventurerStride, poseAdventurerSword } from './adventurerAnimation';
import { isRunning, setTouchMovement } from './touchMovement';
import { createDragonLair } from './dragonLair';
import TouchAttack from './TouchAttack';
import TouchInteract from './TouchInteract';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { facePlayer } from './facePlayer';
import { allowRunAndRotate } from './runAndRotate';
import { createAdventurer } from './VillageScene';
import { createElderDragon } from './ElderDragon';
import { createPrincess, createDragonSkeleton, createCelebratingVillagers } from './dragonAftermath';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import { sceneFrameDelta } from './sceneFrameDelta';
import dialogue from './dragonDialogue.json';
import princessDialogue from './princessDialogue.json';
import { DRAGON_SCENE_DURATION, dragonSceneLineAt } from './dragonScene';
import './Lake.css';
import './DragonChamber.css';

const DRAGON_HEALTH = 12;
const dragonLaughs = [laugh1, laugh2, laugh3, laugh4];

export default function DragonChamber({ campaignNavigation,onPrincessSpeak,speaking,onVictoryChange,onDialogueChange,onBattleChange,language,paused,reduceMotion,onExit,onReturnVillage,onSpeak,onStop,onSound,voiceEnabled,voiceNotice}){
  const mount=useRef(null),keys=useRef(new Set()),state=useRef({}),modeRef=useRef('sleep'),skipRef=useRef(null),stopVoice=useRef(onStop);stopVoice.current=onStop;
  const [mode,setMode]=useState('sleep'),[line,setLine]=useState(-1),[error,setError]=useState(false),[hud,setHud]=useState({lives:3,hits:0,phase:'fire'}),[princessLine,setPrincessLine]=useState(0),[princessNear,setPrincessNear]=useState(false),[princessTalking,setPrincessTalking]=useState(false);
  const attackRef=useRef(null),restartRef=useRef(null),skipBattleRef=useRef(null),skipDeathRef=useRef(null),voiceRef=useRef(voiceEnabled),laughRef=useRef(null),princessNearRef=useRef(false),princessTalkingRef=useRef(false),princessActionRef=useRef(null);voiceRef.current=voiceEnabled;
  useEffect(()=>{if((paused||!voiceEnabled)&&laughRef.current){laughRef.current.pause();}},[paused,voiceEnabled]);
  state.current={paused,reduceMotion,onSound,language};const en=language==='en-US';
  const dialogueActive=mode==='scene'&&line>=0&&voiceEnabled;
  useEffect(()=>{onDialogueChange?.(dialogueActive);return ()=>onDialogueChange?.(false);},[dialogueActive,onDialogueChange]);
  useEffect(()=>{if(paused){if(mode==='scene')stopVoice.current?.();return;}if(mode==='scene'&&line>=0)onSpeak?.(line);},[mode,line,onSpeak,paused]);
  useEffect(()=>{if(!princessTalking)return;if(!paused&&voiceEnabled)onPrincessSpeak?.(princessLine);return ()=>stopVoice.current?.();},[princessTalking,princessLine,paused,voiceEnabled,onPrincessSpeak]);
  useEffect(()=>()=>stopVoice.current?.(),[]);
  useEffect(()=>{onBattleChange?.(mode==='battle');return ()=>onBattleChange?.(false);},[mode,onBattleChange]);
  const victoryActive=mode==='dying'||mode==='won';
  useEffect(()=>{onVictoryChange?.(victoryActive);return ()=>onVictoryChange?.(false);},[victoryActive,onVictoryChange]);
  const skip=()=>{onStop?.();skipRef.current?.();};
  useEffect(()=>{
    const el=mount.current;let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Dragon chamber / Camara do dragao');el.appendChild(renderer.domElement);renderer.domElement.focus({preventScroll:true});
    const scene=new THREE.Scene();const lair=createDragonLair(scene);
    const camera=new THREE.PerspectiveCamera(48,1,.1,200);const mats=new Map();const material=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c);};
    const add=(p,g,c,x,y,z)=>{const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);p.add(m);return m;};
    const box=(p,w,h,d,c,x,y,z)=>add(p,new THREE.BoxGeometry(w,h,d),c,x,y,z),sphere=(p,r,c,x,y,z)=>add(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z),cylinder=(p,r,h,c,x,y,z,n=8)=>add(p,new THREE.CylinderGeometry(r,r,h,n),c,x,y,z),mesh=(p,g,c,x,y,z)=>add(p,g,c,x,y,z);
    const dragon=createElderDragon(scene);dragon.group.scale.setScalar(6.4);dragon.group.position.set(0,0,-17);dragon.group.rotation.y=0;const dragonBody=dragon.body;
    const dizzy=new THREE.Group();scene.add(dizzy);dizzy.visible=false;
    const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.34:.8,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)starShape.moveTo(x,y);else starShape.lineTo(x,y);}starShape.closePath();
    const stars=Array.from({length:4},()=>{const star=new THREE.Mesh(new THREE.ShapeGeometry(starShape),new THREE.MeshBasicMaterial({color:'#ffe27a',side:THREE.DoubleSide}));dizzy.add(star);return star;});
    const headPosition=new THREE.Vector3();let headLowered=0;
    const heartShape=new THREE.Shape();heartShape.moveTo(0,-.7);heartShape.bezierCurveTo(-.2,-.48,-.85,-.12,-.85,.3);heartShape.bezierCurveTo(-.85,.82,-.25,.94,0,.53);heartShape.bezierCurveTo(.25,.94,.85,.82,.85,.3);heartShape.bezierCurveTo(.85,-.12,.2,-.48,0,-.7);
    const makeHeart=()=>{const heart=new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape,{depth:.25,bevelEnabled:true,bevelThickness:.1,bevelSize:.1,bevelSegments:3,curveSegments:10}),new THREE.MeshStandardMaterial({color:'#f4435a',emissive:'#aa122d',emissiveIntensity:.45,roughness:.35}));heart.position.z=-.125;return heart;};
    const traveler=createAdventurer(scene,{box,sphere,mesh,cylinder}),player=traveler.player;player.position.set(0,0,39);player.rotation.y=Math.PI;
    // The adventurer's materials normally belong to the environment palette.
    // Clone them so a damage flash cannot tint unrelated scenery.
    const playerMaterials=new Map();player.traverse(o=>{if(!o.isMesh||!o.material)return;const original=o.material;if(!playerMaterials.has(original))playerMaterials.set(original,original.clone());o.material=playerMaterials.get(original);});
    const colorsOf=root=>{const entries=new Map();root.traverse(o=>{if(o.isMesh&&o.material?.color&&!entries.has(o.material))entries.set(o.material,o.material.color.clone());});return entries;};
    const playerColors=colorsOf(player),dragonColors=colorsOf(dragon.group);
    const flash=(colors,active)=>colors.forEach((color,mat)=>mat.color.copy(active?new THREE.Color('#ff3030'):color));
    const helpers={box,sphere,mesh,cylinder};
    const princessNpc=createPrincess(scene,helpers),princess=princessNpc.group;
    princessNpc.setLanguage(state.current.language);let princessLanguage=state.current.language;
    const skeleton=createDragonSkeleton(scene,helpers),celebration=createCelebratingVillagers(scene,helpers,state.current.language);
    let dragonHitUntil=0,playerHitUntil=0,spitUntil=0,deathStarted=0;
    camera.position.set(0,11,53);const orbit=allowRunAndRotate(new OrbitControls(camera,renderer.domElement));orbit.target.set(0,1.2,39);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=7;orbit.maxDistance=32;orbit.maxPolarAngle=Math.PI/2-.07;orbit.update();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const clear=()=>keys.current.clear(),down=e=>{const k=e.key.toLowerCase();if(k==='escape'&&princessTalkingRef.current&&!state.current.paused){e.preventDefault();princessActionRef.current?.(false);return;}if(document.activeElement!==renderer.domElement||state.current.paused||modeRef.current==='scene'||princessTalkingRef.current)return;if(k==='e'&&!e.repeat&&modeRef.current==='won'&&princessNearRef.current){e.preventDefault();princessActionRef.current?.(true);return;}if(k===' '&&!e.repeat){e.preventDefault();attackRef.current?.();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}},up=e=>keys.current.delete(e.key.toLowerCase());window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    let frame,last=performance.now(),time=0,sceneTime=0,spoken=-1;
    let battle, laughAudio=null;
    const hazards=[], pickups=[];
    const talkPrincess=(open,fromClick=false)=>{if(open&&(modeRef.current!=='won'||(!fromClick&&!princessNearRef.current)||state.current.paused))return;princessTalkingRef.current=open;setPrincessTalking(open);keys.current.clear();if(!open)renderer.domElement.focus({preventScroll:true});};princessActionRef.current=talkPrincess;
    const removeNpcTap = bindNpcTap(renderer.domElement, camera, [princess],
      () => modeRef.current === 'won' && !state.current.paused && !princessTalkingRef.current,
      () => talkPrincess(true, true));
    const removeObject=(list,item)=>{scene.remove(item.group);item.group.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});list.splice(list.indexOf(item),1);};
    const resetBattle=()=>{while(hazards.length)removeObject(hazards,hazards[0]);while(pickups.length)removeObject(pickups,pickups[0]);battle={lives:3,hits:0,phase:'fire',timer:-4,spawn:4,pickup:12,invincible:0,swing:0};princess.visible=false;celebration.root.visible=false;skeleton.visible=false;dragon.group.visible=true;princessNearRef.current=false;setPrincessNear(false);princessTalkingRef.current=false;setPrincessTalking(false);dragonHitUntil=0;playerHitUntil=0;spitUntil=0;deathStarted=0;dragonBody.rotation.z=0;dragonBody.position.y=0;setPrincessLine(0);setHud({...battle});};
    const sync=()=>setHud({lives:battle.lives,hits:battle.hits,phase:battle.phase});
    const laugh=()=>{if(!voiceRef.current)return;if(laughAudio){laughAudio.pause();}laughAudio=new Audio(dragonLaughs[Math.floor(Math.random()*dragonLaughs.length)]);laughRef.current=laughAudio;laughAudio.play().catch(()=>{});};
    const groundMesh=(geometry,color,opacity=1)=>{const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;return m;};
    // Volumetric flame clusters give each attack a bright core and flickering outer fire.
    const flame=(parent,size,color)=>{const part=new THREE.Mesh(new THREE.IcosahedronGeometry(size,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));parent.add(part);return part;};
    const makeHazard=(type)=>{const group=new THREE.Group(), duration=type==='cone'?2.6:2.2;let x,z,angle=0,radius;
      if(type==='cone'){x=0;z=-7;angle=Math.atan2(player.position.x-x,player.position.z-z);radius=27;const area=groundMesh(new THREE.CircleGeometry(radius,48,-Math.PI/5,Math.PI*2/5),'#ff4c20',.3);area.rotation.z=angle-Math.PI/2;area.position.y=.08;group.add(area);const edge=groundMesh(new THREE.RingGeometry(radius-.16,radius,48,1,-Math.PI/5,Math.PI*2/5),'#ffffff',.9);edge.rotation.z=angle-Math.PI/2;edge.position.y=.1;group.add(edge);}
      else{spitUntil=time+.65;x=player.position.x+(Math.random()-.5)*9;z=player.position.z+(Math.random()-.5)*9;radius=3.4;const edge=groundMesh(new THREE.RingGeometry(radius-.14,radius,48),'#ffffff');edge.position.y=.1;group.add(edge);const fill=groundMesh(new THREE.CircleGeometry(radius,48),'#f32718',.65);fill.position.y=.09;fill.scale.setScalar(.001);group.add(fill);group.userData.fill=fill;const ball=new THREE.Mesh(new THREE.SphereGeometry(.8,12,8),new THREE.MeshBasicMaterial({color:'#ff781a'}));ball.position.y=24;group.add(ball);group.userData.ball=ball;ball.material.color.set('#fff0a0');const corona=flame(ball,1.4,'#ff6200');corona.scale.set(1,1.1,1);group.userData.corona=corona;}
      group.position.set(x,0,z);scene.add(group);const mouth=type==='rain'?dragon.head.localToWorld(new THREE.Vector3(0,.18,1.45)):null;state.current.onSound?.(type==='rain'?'fireball':'inhale');hazards.push({group,type,x,z,angle,radius,mouth,age:0,duration,hit:false});};
    const completeDeath=()=>{if(modeRef.current!=='dying'||state.current.paused)return;princess.visible=true;celebration.root.visible=true;skeleton.visible=true;dragon.group.visible=false;player.position.set(0,0,7);player.rotation.y=Math.PI;camera.position.set(6,7.5,16);orbit.target.set(0,1.2,7);orbit.update();modeRef.current='won';setMode('won');renderer.domElement.focus({preventScroll:true});};skipDeathRef.current=completeDeath;
    const victory=()=>{if(!battle||modeRef.current!=='battle')return;battle.hits=12;battle.phase='won';deathStarted=time;modeRef.current='dying';setMode('dying');keys.current.clear();while(hazards.length)removeObject(hazards,hazards[0]);while(pickups.length)removeObject(pickups,pickups[0]);if(laughAudio)laughAudio.pause();sync();};skipBattleRef.current=victory;
    const attack=()=>{if(!battle||modeRef.current!=='battle'||battle.swing>0)return;battle.swing=.45;state.current.onSound?.('attack');if(battle.phase==='stun'&&Math.hypot(player.position.x,player.position.z+17)<14){battle.hits++;dragonHitUntil=time+.5;if(battle.hits>=DRAGON_HEALTH){victory();}else if(battle.hits%3===0){battle.phase='fire';battle.timer=0;battle.spawn=0;laugh();}sync();}};attackRef.current=attack;
    const restart=()=>{resetBattle();laugh();player.position.set(0,0,30);modeRef.current='battle';setMode('battle');renderer.domElement.focus({preventScroll:true});};restartRef.current=restart;
    const updateBattle=dt=>{if(!battle||modeRef.current!=='battle')return;battle.timer+=dt;battle.invincible=Math.max(0,battle.invincible-dt);battle.swing=Math.max(0,battle.swing-dt);battle.pickup-=dt;
      if(battle.phase==='fire'){battle.spawn-=dt;if(battle.spawn<=0){makeHazard(Math.floor(battle.timer/5)%2===0?'rain':'cone');battle.spawn=Math.floor(battle.timer/5)%2===0?.8:4;}if(battle.timer>=20){battle.phase='stun';battle.timer=0;while(hazards.length)removeObject(hazards,hazards[0]);sync();}}
      if(battle.pickup<=0){battle.pickup=14+Math.random()*10;if(pickups.length<2){const group=new THREE.Group(),heart=makeHeart();group.add(heart);group.position.set((Math.random()-.5)*44,1,(Math.random()-.5)*35+8);scene.add(group);pickups.push({group});}}
      pickups.slice().forEach(p=>{p.group.rotation.y+=dt*2;if(Math.hypot(player.position.x-p.group.position.x,player.position.z-p.group.position.z)<2&&battle.lives<3){battle.lives++;sync();removeObject(pickups,p);}});
      hazards.slice().forEach(h=>{h.age+=dt;const progress=Math.min(1,h.age/h.duration);if(h.group.userData.fill)h.group.userData.fill.scale.setScalar(Math.max(.001,progress));if(h.group.userData.ball){h.group.userData.ball.position.set((h.mouth.x-h.x)*(1-progress),.8+(h.mouth.y-.8)*(1-progress)+12*Math.sin(Math.PI*progress),(h.mouth.z-h.z)*(1-progress));}if(h.age>=h.duration&&!h.hit){h.hit=true;state.current.onSound?.(h.type==='rain'?'impact':'breath');
        // The warning disappears as the real fire erupts; its footprint remains the damage area.
        h.group.children.forEach(child=>{child.visible=false;});
        const fire=new THREE.Group();h.group.add(fire);h.fire=fire;h.particles=[];
        const count=h.type==='rain'?32:72;
        for(let i=0;i<count;i++){const u=(i+.5)/count, theta=i*2.399963, part=flame(fire,h.type==='rain'?.45+(i%4)*.12:.55+(i%5)*.13,i%4===0?'#fff19a':i%3===0?'#ffb323':'#ff4a0a');
          if(h.type==='rain'){const r=Math.sqrt(u)*h.radius;h.particles.push({part,x:Math.cos(theta)*r,z:Math.sin(theta)*r,y:.3+(i%5)*.18,phase:i*.83});}
          else{const distance=2+u*(h.radius-3),spread=Math.sin(i*12.9898)*distance*.62;h.particles.push({part,x:Math.sin(h.angle)*distance+Math.cos(h.angle)*spread,z:Math.cos(h.angle)*distance-Math.sin(h.angle)*spread,y:Math.max(.35,8*(1-u))+(i%3)*.35,phase:i*.83});}}
        if(h.type==='rain'){const ring=groundMesh(new THREE.RingGeometry(.85,1,48),'#ffca5a',.8);ring.position.y=.14;fire.add(ring);h.ring=ring;}
        const light=new THREE.PointLight('#ff5810',70,h.type==='rain'?15:28);light.position.set(0,2,0);fire.add(light);h.light=light;
        const dx=player.position.x-h.x,dz=player.position.z-h.z,dist=Math.hypot(dx,dz),diff=Math.atan2(Math.sin(Math.atan2(dx,dz)-h.angle),Math.cos(Math.atan2(dx,dz)-h.angle));if((h.type==='rain'?dist<h.radius:dist<h.radius&&Math.abs(diff)<Math.PI/5)&&battle.invincible<=0){battle.lives--;playerHitUntil=time+.7;battle.invincible=1.5;if(battle.lives<=0){battle.phase='lost';modeRef.current='lost';setMode('lost');}sync();}}if(h.hit){const elapsed=h.age-h.duration,life=h.type==='rain'?.85:1.15,t=Math.min(1,elapsed/life);h.particles.forEach(({part,x,y,z,phase})=>{const flicker=state.current.reduceMotion?1:.75+.25*Math.sin(time*18+phase);const expansion=h.type==='rain'?Math.min(1,elapsed*6):Math.min(1,elapsed*3);part.position.set(x*expansion,y+elapsed*(h.type==='rain'?3:1.5),z*expansion);part.scale.setScalar(Math.max(.01,(1-t)*flicker));part.material.opacity=(1-t)*.9;});if(h.ring){h.ring.scale.setScalar(1+t*h.radius);h.ring.material.opacity=(1-t)*.8;}h.light.intensity=70*(1-t);if(elapsed>life)removeObject(hazards,h);}else if(h.group.userData.corona){h.group.userData.corona.scale.setScalar(1+.18*Math.sin(time*20));}});
    };
    const finish=()=>{stopVoice.current?.();resetBattle();laugh();modeRef.current='battle';setMode('battle');setLine(-1);keys.current.clear();camera.position.set(player.position.x+8,11,player.position.z+15);orbit.target.set(player.position.x,1.2,player.position.z);orbit.update();renderer.domElement.focus({preventScroll:true});};skipRef.current=finish;
    const animate=now=>{frame=requestAnimationFrame(animate);const dt=sceneFrameDelta(now,last);last=now;
      if(!state.current.paused){time+=dt;updateBattle(dt);if(modeRef.current==='dying'&&time-deathStarted>=2.5)completeDeath();
        if(modeRef.current!=='scene'){const x=Number(keys.current.has('d')||keys.current.has('arrowright'))-Number(keys.current.has('a')||keys.current.has('arrowleft')),z=Number(keys.current.has('s')||keys.current.has('arrowdown'))-Number(keys.current.has('w')||keys.current.has('arrowup'));
          if((x||z)&&modeRef.current!=='lost'&&modeRef.current!=='dying'&&!princessTalkingRef.current){const dir=cameraRelativeDirection(camera,x,z),speed=isRunning(keys.current)?6.5:4,nx=player.position.x+dir.x*speed*dt,nz=player.position.z+dir.z*speed*dt;if(Math.hypot(nx,nz)<52&&Math.hypot(nx,nz+17)>10){player.position.x=nx;player.position.z=nz;player.rotation.y=Math.atan2(dir.x,dir.z);}}
          const near=modeRef.current==='won'&&Math.hypot(player.position.x-princess.position.x,player.position.z-princess.position.z)<4;if(near!==princessNearRef.current){princessNearRef.current=near;setPrincessNear(near);}
          poseAdventurerStride(traveler.limbs,time,x||z,state.current.reduceMotion);
          if(modeRef.current==='sleep'&&player.position.z<32){modeRef.current='scene';setMode('scene');keys.current.clear();sceneTime=0;spoken=-1;}
        }else{sceneTime+=dt;const next=dragonSceneLineAt(sceneTime);if(next!==spoken){spoken=next;setLine(next);if(next===0)state.current.onSound?.('anger');}if(sceneTime>=DRAGON_SCENE_DURATION)finish();}
      }else clear();
      if(!state.current.paused&&princess.visible)facePlayer(princess,player);
      if(princessLanguage!==state.current.language){princessLanguage=state.current.language;princessNpc.setLanguage(princessLanguage);}if(celebration.root.visible){const idleTime=Math.max(0,time-deathStarted-2.5);celebration.update(idleTime,state.current.language,state.current.reduceMotion);princess.position.y=state.current.reduceMotion?0:Math.sin(idleTime*1.5)*.025;}
      const awakening=modeRef.current==='sleep'?0:modeRef.current!=='scene'?1:state.current.reduceMotion?Number(sceneTime>=4):THREE.MathUtils.smoothstep(sceneTime,1.5,5.8);
      const eyesOpen=modeRef.current==='sleep'?0:modeRef.current!=='scene'?1:state.current.reduceMotion?Number(sceneTime>=2.5):THREE.MathUtils.smoothstep(sceneTime,2,3.4);
      const angry=modeRef.current==='scene'&&sceneTime>=6&&sceneTime<13;
      const threat=angry&&!state.current.reduceMotion?Math.sin(Math.min(1,(sceneTime-6)/1.5)*Math.PI/2):0;
      dragonBody.position.y=state.current.reduceMotion?0:Math.sin(time*1.2)*.008;dragonBody.position.z=threat*.15;dragonBody.rotation.x=-threat*.1;
      dragon.eyes.emissiveIntensity=eyesOpen*(angry?2.4:1.3);dragon.eyeParts.forEach(({mesh,height})=>{mesh.scale.y=height*(.04+eyesOpen*.96);});
      poseAdventurerSword(traveler.sword,battle?.swing || 0,state.current.reduceMotion);
      const downed=battle?.phase==='stun'||battle?.phase==='won';
      if(!state.current.paused)headLowered=state.current.reduceMotion?Number(downed):THREE.MathUtils.damp(headLowered,downed?1:0,4,dt);
      if(battle?.phase==='won'){const fall=state.current.reduceMotion?1:THREE.MathUtils.smoothstep(time-deathStarted,0,2.2);dragonBody.rotation.z=fall*.85;dragonBody.position.y-=fall*.3;dragonBody.rotation.x=fall*.18;}else dragonBody.rotation.z=0;
      const blink=state.current.reduceMotion||Math.floor(time*14)%2===0;flash(dragonColors,time<dragonHitUntil&&blink);flash(playerColors,time<playerHitUntil&&blink);
      dragon.head.rotation.x=(time<spitUntil&&!downed&&!state.current.reduceMotion?-.2*Math.sin((spitUntil-time)/.65*Math.PI):0)+1.1*(1-awakening)+(state.current.reduceMotion?0:(Math.sin(time*1.4)*.025+(modeRef.current==='scene'&&sceneTime>=6?Math.sin(time*5)*(angry?.075:.045):0))*awakening)+headLowered*1.5;
      dragon.wings.forEach(({pivot,side})=>{pivot.rotation.z=side*(.65*(1-awakening)+.16*awakening-threat*.18);});
      dragon.jaw.rotation.x=state.current.reduceMotion?0:(time<spitUntil&&!downed?.35*Math.sin((spitUntil-time)/.65*Math.PI):hazards.some(h=>h.type==='cone'&&h.hit)?.3:modeRef.current==='scene'&&sceneTime>=6?.08+Math.abs(Math.sin(time*5))*.12:0);
      dizzy.visible=battle?.phase==='stun';
      if(dizzy.visible){dragon.head.getWorldPosition(headPosition);dizzy.position.copy(headPosition).add(new THREE.Vector3(0,5,0));stars.forEach((star,i)=>{const a=(state.current.reduceMotion?0:time*2)+i*Math.PI/2;star.position.set(Math.cos(a)*3.2,Math.sin(a*2)*.35,Math.sin(a)*3.2);star.quaternion.copy(camera.quaternion);});}
      if(!state.current.reduceMotion)dragon.tail.forEach((joint,i)=>{joint.rotation.y=Math.sin(time*.8-i*.35)*.035*awakening;});
      if(modeRef.current==='dying'){const target=new THREE.Vector3(4,6,-10),view=new THREE.Vector3(20,15,16);if(state.current.reduceMotion){camera.position.copy(view);orbit.target.copy(target);}else{camera.position.lerp(view,Math.min(1,dt*1.5));orbit.target.lerp(target,Math.min(1,dt*1.5));}}else if(modeRef.current==='scene'){
        const sceneCamera=sceneTime<7?new THREE.Vector3(19,15,10):new THREE.Vector3(12,13,5);const look=new THREE.Vector3(0,10,-7);
        if(state.current.reduceMotion){camera.position.copy(sceneCamera);orbit.target.copy(look);}else{camera.position.lerp(sceneCamera,Math.min(1,dt*.8));orbit.target.lerp(look,Math.min(1,dt));}
      }else{const target=new THREE.Vector3(player.position.x,1.2,player.position.z),shift=target.clone().sub(orbit.target);camera.position.add(shift);orbit.target.copy(target);}
      orbit.enabled=!state.current.paused&&!princessTalkingRef.current&&!['scene','dying'].includes(modeRef.current);orbit.enableDamping=!state.current.reduceMotion;orbit.update();lair.update(camera.position,time,state.current.reduceMotion);renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return()=>{removeNpcTap();cancelAnimationFrame(frame);if(laughAudio){laughAudio.pause();laughAudio=null;laughRef.current=null;}attackRef.current=null;restartRef.current=null;skipBattleRef.current=null;skipDeathRef.current=null;princessActionRef.current=null;skipRef.current=null;observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);clear();orbit.dispose();lair.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(![...mats.values()].includes(m)){m.map?.dispose();m.dispose();}});});mats.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  const press=(key,down)=>{if(paused||modeRef.current==='scene'||princessTalkingRef.current)return;setTouchMovement(keys.current, key, down);};
  return <section className="lake dragon-chamber"><div className="lake-viewport"><div ref={mount} className="lake-canvas"/><div className="encounter-controls">
      {campaignNavigation ?? <button className="lake-exit" onClick={mode==='dying'||mode==='won'?onReturnVillage:onExit}>{mode==='dying'||mode==='won'?(en?'Return to the starting village':'Voltar \u00e0 vila inicial'):(en?'Return to cave':'Voltar para a caverna')}</button>}
      {mode==='scene'&&<button className="chamber-skip" onClick={skip}>{en?'Skip scene':'Pular cena'}</button>}
      {mode==='dying'&&<button className="battle-skip" disabled={paused} onClick={()=>skipDeathRef.current?.()}>{en?'Skip death scene':'Pular cena de morte'}</button>}
      {mode==='battle'&&<button className="battle-skip" onClick={()=>skipBattleRef.current?.()}>{en?'Skip battle':'Pular luta'}</button>}
    </div>
    <div className="dragon-chamber-status">
    <div className="chamber-heading"><strong>{en?'THE ELDER\u2019S CHAMBER':'C\u00c2MARA DO ANCI\u00c3O'}</strong><small>{mode==='sleep'?(en?'The dragon sleeps. Tread carefully.':'O drag\u00e3o dorme. Avance com cuidado.'):mode==='battle'?(hud.phase==='stun'?(en?'Stunned! Strike with your sword!':'Atordoado! Ataque com a espada!'):(en?'Dodge the fire!':'Desvie do fogo!')):['dying','won'].includes(mode)?(en?'The Elder is defeated!':'O Anci\u00e3o foi derrotado!'):mode==='lost'?(en?'You fell in battle.':'Voc\u00ea caiu em batalha.'):(en?'The Elder awakens':'O Anci\u00e3o desperta')}</small></div>
    {['battle','lost'].includes(mode)&&<div className="battle-hud" role="status"><div className="battle-player" aria-label={`${en?'Your lives':'Suas vidas'}: ${hud.lives}/3`}><small>{en?'YOUR LIVES':'SUAS VIDAS'}</small><b aria-hidden="true">{'\u2665'.repeat(hud.lives)}{'\u2661'.repeat(3-hud.lives)}</b></div><div className="battle-dragon"><small>{en?'DRAGON':'DRAG\u00c3O'}</small><strong>{en?'Health':'Vida'}: {DRAGON_HEALTH - hud.hits}/{DRAGON_HEALTH}</strong><span className="dragon-phase">{hud.phase==='stun'?(en?'Vulnerable':'Vulner\u00e1vel'):(en?'Invulnerable':'Invulner\u00e1vel')}</span></div></div>}
    </div>
    {mode==='lost'&&<div className="battle-result"><strong>{en?'Defeat':'Derrota'}</strong><button onClick={()=>restartRef.current?.()}>{en?'Fight again':'Jogar novamente'}</button></div>}
    {mode==='won'&&princessNear&&!princessTalking&&<div className="village-actions"><button className="villager-talk" onClick={()=>princessActionRef.current?.(true)}>{en?'Talk to':'Conversar com'} {en?'Princess Elara':'Princesa Elara'} <kbd>E</kbd></button></div>}
    {mode==='won'&&princessTalking&&<section className="npc-dialogue" aria-label={en?'Conversation with Princess Elara':'Conversa com a Princesa Elara'}><div className="npc-dialogue-heading"><span className="npc-avatar" style={{background:'#b77391'}}>E</span><div><h2>Elara</h2><small>{en?'Princess':'Princesa'}</small></div><button onClick={()=>princessActionRef.current?.(false)} aria-label={en?'End conversation':'Encerrar conversa'}>×</button></div><p aria-live="polite">{princessDialogue[en?'en-US':'pt-BR'][princessLine]}</p><div className="npc-dialogue-actions"><button disabled={!voiceEnabled} onClick={()=>speaking?onStop?.():onPrincessSpeak?.(princessLine)}>{speaking?(en?'Stop voice':'Parar voz'):(en?'Listen':'Ouvir mensagem')}</button>{princessLine===0?<button onClick={()=>setPrincessLine(1)}>{en?'Next message':'Outra mensagem'} {'\u2197'}</button>:<><button onClick={onReturnVillage}>{en?'Return to the starting village':'Voltar \u00e0 vila inicial'}</button><button onClick={()=>restartRef.current?.()}>{en?'Fight the dragon again':'Enfrentar o drag\u00e3o novamente'}</button></>}</div>{(!voiceEnabled||voiceNotice)&&<small className="npc-voice-note">{voiceNotice||(en?'Enable NPC voices in audio settings.':'Ative as vozes dos NPCs nas configura\u00e7\u00f5es de \u00e1udio.')}</small>}</section>}
    {mode==='scene'&&line>=0&&<div className="chamber-subtitle" role="status" aria-live="polite"><strong>{en?'THE ELDER':'O ANCI\u00c3O'}</strong><p>{dialogue[en?'en-US':'pt-BR'][line]}</p>{(!voiceEnabled||voiceNotice)&&<small>{voiceNotice|| (en?'Enable NPC voices in audio settings to hear the dialogue.':'Ative as vozes dos NPCs nas configura\u00e7\u00f5es de \u00e1udio para ouvir o di\u00e1logo.')}</small>}</div>}
    {error&&<p className="lake-scene-error">{en?'3D is unavailable in this browser.':'O 3D n\u00e3o est\u00e1 dispon\u00edvel neste navegador.'}</p>}
    {!['scene','dying'].includes(mode)&&!princessTalking&&<div className="scene-guide map-control-guide"><div className="scene-caption"><span className="live-dot"/> {en?'THE ELDER\u2019S CHAMBER':'C\u00c2MARA DO ANCI\u00c3O'}</div><div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en?'or arrows to walk':'ou setas para caminhar'} {' '} <kbd>Shift</kbd> {en?'run':'correr'} {mode==='won'&&<> {' '} <kbd>E</kbd> {en?'Interaction':'Interação'}</>}{mode==='battle'&&<> {' '} <kbd>{en?'Space':'Espaço'}</kbd> {en?'attack':'atacar'}</>}</span><span className="touch-guide">{en?'Use arrows to walk':'Use as setas para caminhar'}</span></div></div>}
    </div><div className="lake-touch sword-controls" aria-label={en?'Walking controls':'Controles de caminhada'}>{[['arrowleft',en?'Left':'Esquerda','\u2190'],['arrowup',en?'Forward':'Frente','\u2191'],['arrowdown',en?'Back':'Tr\u00e1s','\u2193'],['arrowright',en?'Right':'Direita','\u2192']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} disabled={mode==='scene'} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}<TouchInteract language={language} scene={mount} disabled={paused || mode !== 'won' || !princessNear || princessTalking} />{mode === 'battle' && <TouchAttack en={en} onAttack={()=>attackRef.current?.()} disabled={paused} />}</div></section>;
}
