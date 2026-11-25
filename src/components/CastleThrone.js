import { attachCombatFlash, groundDangerGeometry } from './combatFeedback';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { allowRunAndRotate } from './runAndRotate';
import { createAdventurer } from './VillageScene';
import { poseAdventurerStride, poseAdventurerSword } from './adventurerAnimation';
import { sceneFrameDelta } from './sceneFrameDelta';
import { isRunning, setTouchMovement } from './touchMovement';
import TouchAttack from './TouchAttack';
import MapControlGuide from './MapControlGuide';
import { buildRoyalArena, createCastleLord } from './royalArena';
import kingDialogue from './kingDialogue.json';
import './Lake.css';
import './CursedCastle.css';

const initial = { lives: 3, health: 12 };
const KING_INTRO_FALLBACK_DURATIONS = [3.1, 3.6, 4.3];
const KING_INTRO_AUDIO_FALLBACK_DURATIONS = [2.4, 2.5, 3.2];
const KING_INTRO_LINE_GAP = .8;
const arrows = [['arrowleft','←','Left','Esquerda'],['arrowup','↑','Forward','Frente'],
  ['arrowdown','↓','Back','Trás'],['arrowright','→','Right','Direita']];
const walkKeys = ['w','a','s','d','shift',...arrows.map(([key])=>key)];

export default function CastleThrone({ en, paused, reduceMotion, keys, campaignNavigation, voiceEnabled, voiceNotice, onSpeak, onStop, onSound, onBattleStart, onRestart, onReturn }) {
  const host=useRef(null), attack=useRef(null), live=useRef(null), skipIntro=useRef(null);
  const introVoiceDone=useRef(false), introVoiceSucceeded=useRef(false), introGapElapsed=useRef(0);
  live.current={paused,reduceMotion,onSound,onBattleStart,voiceEnabled,en,onStop};
  const [status,setStatus]=useState(initial);
  const [error,setError]=useState(false);
  const [intro,setIntro]=useState(false);
  const [introLine,setIntroLine]=useState(-1);
  const active=status.health>0 && status.lives>0 && !error;
  useEffect(()=>{
    if(!intro || introLine<0 || paused || !voiceEnabled) {
      onStop?.();
      introVoiceDone.current=true;
      introVoiceSucceeded.current=false;
      return;
    }
    introVoiceDone.current=false;
    introVoiceSucceeded.current=false;
    if(onSpeak) {
      onSpeak(introLine,success=>{
        introVoiceSucceeded.current=success;
        introVoiceDone.current=true;
        introGapElapsed.current=0;
      });
    } else introVoiceDone.current=true;
    return ()=>onStop?.();
  },[en,intro,introLine,onSpeak,onStop,paused,voiceEnabled]);
  useEffect(()=>()=>onStop?.(),[onStop]);
  useEffect(()=>{
    const mount=host.current;
    let renderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true}); }
    catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
    const canvas=renderer.domElement;
    canvas.tabIndex=0; mount.appendChild(canvas); canvas.focus({preventScroll:true});
    const scene=new THREE.Scene();
    scene.background=new THREE.Color('#34313a');
    scene.fog=new THREE.FogExp2('#393642',.014);
    scene.add(new THREE.HemisphereLight('#c6d6e3','#403a38',1.65));
    const light=new THREE.DirectionalLight('#d8c8bb',1.2);
    light.position.set(-9,19,14); scene.add(light);
    const rim=new THREE.PointLight('#a98aff',95,22);
    rim.position.set(0,7,-13); scene.add(rim);
    const shapes=buildRoyalArena(scene);
    const {king,weapon,legs,castingArm}=createCastleLord(scene,shapes);
    const {player,body,limbs,sword}=createAdventurer(scene,shapes);
    king.position.set(0,1.15,-15.1);
    king.rotation.y=0;
    legs.forEach(leg=>{leg.rotation.x=-1.35;});
    player.position.set(0,.08,12); player.rotation.y=Math.PI;
    const damageRed = new THREE.MeshBasicMaterial({ color: '#ff3030' });
    const damageMaterial = (elapsed, reduced) =>
      reduced || Math.floor(elapsed * 14) % 2 === 0 ? damageRed : null;
    const playerFlash = attachCombatFlash(player, .7, damageMaterial);
    const kingFlash = attachCombatFlash(king, .5, damageMaterial);
    const kingShield = new THREE.Group();
    kingShield.position.y=2.2;
    kingShield.visible=false;
    const shieldGeometry=new THREE.IcosahedronGeometry(2.4,1);
    const shieldShell=new THREE.Mesh(
      shieldGeometry,
      new THREE.MeshBasicMaterial({color:'#258cff',transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})
    );
    const shieldLines=new THREE.Mesh(
      shieldGeometry,
      new THREE.MeshBasicMaterial({color:'#72caff',transparent:true,opacity:.62,depthWrite:false,wireframe:true,blending:THREE.AdditiveBlending})
    );
    kingShield.add(shieldShell,shieldLines);
    king.add(kingShield);
    const immuneCanvas=document.createElement('canvas');
    immuneCanvas.width=256; immuneCanvas.height=96;
    const immuneContext=immuneCanvas.getContext('2d');
    immuneContext.fillStyle='rgba(9,53,112,.9)';
    immuneContext.strokeStyle='#8cddff';
    immuneContext.lineWidth=5;
    immuneContext.beginPath();
    immuneContext.roundRect(7,7,242,82,22);
    immuneContext.fill(); immuneContext.stroke();
    immuneContext.fillStyle='#effaff';
    immuneContext.font='bold 44px sans-serif';
    immuneContext.textAlign='center'; immuneContext.textBaseline='middle';
    immuneContext.fillText(en?'IMMUNE':'IMUNE',128,49);
    const immuneTexture=new THREE.CanvasTexture(immuneCanvas);
    const immuneTextMaterial=new THREE.SpriteMaterial({map:immuneTexture,transparent:true,depthWrite:false,depthTest:false});
    const immuneText=new THREE.Sprite(immuneTextMaterial);
    immuneText.position.set(0,5.15,.05);
    immuneText.scale.set(2.2,.83,1);
    immuneText.visible=false;
    king.add(immuneText);
    const rageAura = new THREE.Group();
    rageAura.visible = false;
    const flameOuterGeometry=new THREE.ConeGeometry(.22,1.15,6,2);
    const flameInnerGeometry=new THREE.ConeGeometry(.11,.68,5,1);
    const flameOuterMaterial=new THREE.MeshBasicMaterial({color:'#e51625',transparent:true,opacity:.76,depthWrite:false,blending:THREE.AdditiveBlending});
    const flameInnerMaterial=new THREE.MeshBasicMaterial({color:'#ff5733',transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending});
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6;
      const radius=.92+(i%3)*.2;
      const flame=new THREE.Group();
      flame.position.set(Math.cos(angle)*radius,-1.05+(i%4)*.68,Math.sin(angle)*radius);
      flame.rotation.x=Math.sin(angle)*.16;
      flame.rotation.z=Math.cos(angle)*.16;
      flame.rotation.y=-angle;
      flame.userData.flameIndex=i;
      flame.userData.baseY=flame.position.y;
      flame.userData.baseTiltX=flame.rotation.x;
      flame.userData.baseTiltZ=flame.rotation.z;
      const outer=new THREE.Mesh(flameOuterGeometry,flameOuterMaterial);
      outer.position.y=.48;
      const inner=new THREE.Mesh(flameInnerGeometry,flameInnerMaterial);
      inner.position.y=.34;
      flame.add(outer,inner);
      rageAura.add(flame);
    }
    const rageLight=new THREE.PointLight('#ff1638',0,8);
    rageAura.add(rageLight);
    king.add(rageAura);
    const magicOrb = new THREE.Group();
    const magicCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.34,2),
      new THREE.MeshBasicMaterial({color:'#b96cff',transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending})
    );
    magicOrb.add(magicCore);
    const magicHalo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.55,2),
      new THREE.MeshBasicMaterial({color:'#8d24d8',transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending})
    );
    magicOrb.add(magicHalo);
    const magicLight=new THREE.PointLight('#a44cff',18,5);
    magicOrb.add(magicLight);
    magicOrb.visible=false;
    scene.add(magicOrb);
    const magicTrail=Array.from({length:6},(_,index)=>{
      const bead=new THREE.Mesh(
        new THREE.IcosahedronGeometry(.16-index*.014,1),
        new THREE.MeshBasicMaterial({color:index<2?'#e1a3ff':'#8c32d1',transparent:true,opacity:.8-index*.09,depthWrite:false,blending:THREE.AdditiveBlending})
      );
      bead.visible=false;
      scene.add(bead);
      return bead;
    });
    const magicImpact = new THREE.Group();
    const impactShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.65,2),
      new THREE.MeshBasicMaterial({color:'#d58aff',transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending})
    );
    const impactRing = new THREE.Mesh(
      new THREE.RingGeometry(.55,1.1,48),
      new THREE.MeshBasicMaterial({color:'#a42ad7',transparent:true,opacity:.82,depthWrite:false,side:THREE.DoubleSide})
    );
    impactRing.rotation.x=-Math.PI/2;
    magicImpact.add(impactShell,impactRing);
    magicImpact.visible=false;
    scene.add(magicImpact);
    function makeTeleportEffect() {
      const effect=new THREE.Group();
      const outer=new THREE.Mesh(
        new THREE.TorusGeometry(.92,.075,8,48),
        new THREE.MeshBasicMaterial({color:'#d9a1ff',transparent:true,opacity:.88,depthWrite:false,blending:THREE.AdditiveBlending})
      );
      outer.scale.y=2.4;
      const inner=new THREE.Mesh(
        new THREE.TorusGeometry(.64,.045,8,48),
        new THREE.MeshBasicMaterial({color:'#8f27d9',transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending})
      );
      inner.scale.y=2.15;
      const floor=new THREE.Mesh(
        new THREE.RingGeometry(.65,1.05,48),
        new THREE.MeshBasicMaterial({color:'#b45cff',transparent:true,opacity:.58,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})
      );
      floor.rotation.x=-Math.PI/2;
      floor.position.y=-1.95;
      const sparks=Array.from({length:8},(_,index)=>{
        const spark=new THREE.Mesh(
          new THREE.IcosahedronGeometry(.09,1),
          new THREE.MeshBasicMaterial({color:index%2?'#9b3be3':'#e0b2ff',transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending})
        );
        spark.userData.angle=index*Math.PI/4;
        effect.add(spark);
        return spark;
      });
      const light=new THREE.PointLight('#a43bff',0,7);
      effect.add(outer,inner,floor,light);
      effect.visible=false;
      scene.add(effect);
      return {group:effect,outer,inner,floor,sparks,light};
    }
    const teleportSource=makeTeleportEffect(), teleportDestination=makeTeleportEffect();
    let teleportStarted=false, kingRelocated=false, teleportTime=0;
    let impactTime=0;
    const magicOrigin=new THREE.Vector3(), magicTarget=new THREE.Vector3();
    const makeZone = (radius, arc) => {
      const { geometry, pool, outlineGeometry, outline } =
        groundDangerGeometry(radius, 64, -Math.PI / 2 - arc / 2, arc);
      const marker = new THREE.Group();
      const fill = new THREE.Mesh(geometry, pool);
      const edge = new THREE.Mesh(outlineGeometry, outline);
      fill.renderOrder = 3;
      edge.renderOrder = 4;
      edge.position.y = .004;
      marker.add(fill, edge);
      marker.visible = false;
      scene.add(marker);
      return { marker, radius, arc };
    };
    const swordZone = makeZone(4.6, Math.PI * 5 / 6);
    const spinZone = makeZone(5.2, Math.PI * 2);
    const curseZone = makeZone(2.5, Math.PI * 2);
    let zone = null;
    function clearZone() {
      if (zone) zone.marker.visible = false;
      zone = null;
    }
    const sparks=[];
    for(let i=0;i<18;i++) sparks.push(shapes.sphere(scene,.045,'#a790ca',Math.sin(i*7)*5,1+i%5,-15+Math.cos(i)*2,true));
    // Keep the courtyard orbit independent of the extra framing distance.
    const camera=new THREE.PerspectiveCamera(48,1,.1,160);
    const orbitCamera=camera.clone();
    orbitCamera.position.set(0,4.35,player.position.z+7.5);
    const orbit=allowRunAndRotate(new OrbitControls(orbitCamera,canvas));
    orbit.target.set(0,2.75,player.position.z);
    orbit.enablePan=false; orbit.enableDamping=true;
    orbit.minDistance=5; orbit.maxDistance=15; orbit.maxPolarAngle=Math.PI/2-.07;
    orbit.update();
    const focus=new THREE.Vector3(), shift=new THREE.Vector3(), offset=new THREE.Vector3();
    const local=new THREE.Vector3(), inverse=new THREE.Quaternion();
    const cinematicPosition=new THREE.Vector3(), cinematicFocus=new THREE.Vector3(), returnPosition=new THREE.Vector3();
    const sceneExitOffset=new THREE.Vector3();
    let introActive=false, introStarted=false, introComplete=false, introDistance=0, introSpoken=-1, introLineElapsed=0;
    let framingDistance=0;
    function updateCamera(dt) {
      focus.copy(player.position).lerp(king.position,.23);
      focus.y=2.35;
      if(introActive) {
        orbit.enabled=false;
        orbit.enableDamping=false;
        if(live.current.reduceMotion) {
          shapes.updateView(camera.position);
          return;
        }
        const exitBlend=teleportStarted?THREE.MathUtils.smoothstep(teleportTime,.2,.78):0;
        cinematicPosition.set(king.position.x,king.position.y+4.4,king.position.z+10.2);
        cinematicFocus.set(king.position.x,king.position.y+2.7,king.position.z);
        cinematicPosition.lerpVectors(orbitCamera.position,cinematicPosition,Math.min(1,dt*1.35));
        cinematicFocus.lerpVectors(orbit.target,cinematicFocus,Math.min(1,dt*1.35));
        returnPosition.copy(focus).add(sceneExitOffset);
        cinematicPosition.lerp(returnPosition,exitBlend);
        cinematicFocus.lerp(focus,exitBlend);
        orbitCamera.position.copy(cinematicPosition);
        orbit.target.copy(cinematicFocus);
        orbit.update();
        camera.position.copy(orbitCamera.position);
        camera.quaternion.copy(orbitCamera.quaternion);
        shapes.updateView(camera.position);
        return;
      }
      orbitCamera.position.add(shift.subVectors(focus,orbit.target));
      orbit.target.copy(focus);
      orbit.enableDamping=!live.current.reduceMotion;
      orbit.update();
      offset.subVectors(orbitCamera.position,focus);
      let required=offset.length();
      inverse.copy(orbitCamera.quaternion).invert();
      const tanY=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      for(const actor of [player,king]) {
        local.copy(actor.position).sub(focus).applyQuaternion(inverse);
        const width=actor===king?1.9:.85, height=actor===king?4.85:2.55;
        // Reserve space below the feet for the sword warnings and control guide.
        required=Math.max(required,local.z+(Math.abs(local.x)+width)/(tanY*camera.aspect*.85),
          local.z+(1.15-local.y)/(tanY*.86));
        shift.set(0,height,0).applyQuaternion(inverse);
        required=Math.max(required,local.z+shift.z+(local.y+shift.y+.35)/(tanY*.83));
      }
      framingDistance=Math.max(required,THREE.MathUtils.damp(framingDistance,required,5,dt));
      camera.position.copy(focus).addScaledVector(offset.normalize(),framingDistance);
      camera.quaternion.copy(orbitCamera.quaternion);
      shapes.updateView(camera.position);
    }
    const resize=()=>{
      const width=Math.max(1,mount.clientWidth), height=Math.max(1,mount.clientHeight);
      camera.aspect=width/height;
      camera.updateProjectionMatrix(); renderer.setSize(width,height);
    };
    const observer=new ResizeObserver(resize); observer.observe(mount); resize();
    let lives=initial.lives, health=initial.health, phase='pursuit', timer=1.3;
    let cooldown=0, swing=0, age=0, deathTimer=0, kingInvulnerability=0, immuneNoticeTimer=0, kingWalking=false, closeAttacks=0;
    let rangedAttack=false, spinAttack=false, spinStartRotation=0, projectileDuration=0;
    let frame=0, previous=0;
    const forward=new THREE.Vector3(), right=new THREE.Vector3(), move=new THREE.Vector3();
    const clear=()=>keys.current.clear();
    const distance=()=>Math.hypot(player.position.x-king.position.x,player.position.z-king.position.z);
    function beginKingTeleport() {
      if(teleportStarted) return;
      teleportStarted=true;
      teleportTime=0;
      king.visible=false;
      teleportSource.group.position.set(king.position.x,2.15,king.position.z+.7);
      teleportDestination.group.position.set(0,2.15,-9.3);
      teleportSource.group.visible=true;
      teleportDestination.group.visible=true;
    }
    function animateTeleportEffect(effect,elapsed,arrival) {
      const progress=THREE.MathUtils.clamp(elapsed/.55,0,1);
      const fade=1-THREE.MathUtils.smoothstep(elapsed,.38,.78);
      const reduced=live.current.reduceMotion;
      const size=reduced ? .9 : arrival ? .32+progress*.85 : 1.15-progress*.58;
      effect.outer.scale.set(size,size*2.4,1);
      effect.inner.scale.set(size*(arrival?1.12:.9),size*2.15,1);
      effect.floor.scale.setScalar(reduced?1:.45+progress*1.25);
      effect.outer.material.opacity=.88*fade;
      effect.inner.material.opacity=.75*fade;
      effect.floor.material.opacity=.58*fade;
      effect.light.intensity=(reduced?14:20+Math.sin(elapsed*20)*4)*fade;
      if(!reduced) {
        effect.outer.rotation.z+=arrival ? -.08 : .08;
        effect.inner.rotation.z+=arrival ? .12 : -.12;
      }
      effect.sparks.forEach((spark,index)=>{
        const angle=spark.userData.angle+(reduced?0:elapsed*(arrival?2.8:-2.8));
        const radius=reduced ? .9 : .68+progress*.72;
        spark.position.set(Math.cos(angle)*radius,Math.sin(angle)*radius*1.2,0);
        spark.material.opacity=.9*fade;
      });
    }
    function updateKingTeleport(dt) {
      if(!teleportStarted) return;
      teleportTime+=dt;
      animateTeleportEffect(teleportSource,teleportTime,false);
      animateTeleportEffect(teleportDestination,teleportTime,true);
      const revealAt=live.current.reduceMotion?0:.28;
      if(!kingRelocated && teleportTime>=revealAt) {
        king.position.set(0,0,-10);
        king.rotation.z=0;
        king.rotation.y=Math.atan2(player.position.x-king.position.x,player.position.z-king.position.z);
        legs.forEach(leg=>{leg.rotation.x=0;});
        king.visible=true;
        kingRelocated=true;
      }
      if(teleportTime>=.78) {
        teleportSource.group.visible=false;
        teleportDestination.group.visible=false;
      }
    }
    function finishKingIntro() {
      if(!introActive) return;
      introActive=false;
      introComplete=true;
      introSpoken=-1;
      live.current.onStop?.();
      live.current.onBattleStart?.();
      setIntro(false);
      setIntroLine(-1);
      clear();
      king.position.set(0,0,-10);
      king.visible=true;
      king.rotation.z=0;
      legs.forEach(leg=>{leg.rotation.x=0;});
      castingArm.rotation.z=0;
      teleportSource.group.visible=false;
      teleportDestination.group.visible=false;
      phase='pursuit';
      timer=1;
    }
    function startKingIntro() {
      if(introStarted || introComplete) return;
      introStarted=true;
      introActive=true;
      introLineElapsed=0;
      introSpoken=0;
      introVoiceDone.current=false;
      introVoiceSucceeded.current=false;
      introGapElapsed.current=0;
      sceneExitOffset.subVectors(orbitCamera.position,orbit.target);
      setIntro(true);
      setIntroLine(0);
      clear();
    }
    function updateKingIntro(dt) {
      introLineElapsed+=dt;
      const reduced=live.current.reduceMotion;
      const voiceActive=live.current.voiceEnabled;
      if(voiceActive&&introVoiceDone.current&&introVoiceSucceeded.current) introGapElapsed.current+=dt;
      const lineDuration=voiceActive&&introVoiceDone.current&&introVoiceSucceeded.current
        ? .35
        : (live.current.en?KING_INTRO_AUDIO_FALLBACK_DURATIONS:KING_INTRO_FALLBACK_DURATIONS)[introSpoken];
      const lineReady=introLineElapsed>=lineDuration&&(!voiceActive||introVoiceDone.current)
        &&(!voiceActive||!introVoiceSucceeded.current||introGapElapsed.current>=KING_INTRO_LINE_GAP);
      king.rotation.y=Math.atan2(player.position.x-king.position.x,player.position.z-king.position.z);
      king.rotation.z=0;
      const gesture=introSpoken>0&&!teleportStarted
        ? -1.65*(reduced?1:Math.min(1,introLineElapsed*1.5))
        : 0;
      castingArm.rotation.z=reduced?gesture:THREE.MathUtils.damp(castingArm.rotation.z,gesture,8,dt);
      if(lineReady&&introSpoken<2) {
        introSpoken++;
        introLineElapsed=0;
        introVoiceDone.current=false;
        introVoiceSucceeded.current=false;
        introGapElapsed.current=0;
        setIntroLine(introSpoken);
      } else if(lineReady&&introSpoken===2) beginKingTeleport();
      updateKingTeleport(dt);
      if(teleportStarted&&teleportTime>=.78) finishKingIntro();
    }
    skipIntro.current=finishKingIntro;
    attack.current=()=>{
      if(live.current.paused || introActive || !introComplete || !health || !lives || cooldown>0) return;
      swing=.45; cooldown=.54; live.current.onSound('attack');
      if(distance()>3.1) return;
      player.rotation.y=Math.atan2(king.position.x-player.position.x,king.position.z-player.position.z);
      if(kingInvulnerability>0) {
        immuneNoticeTimer=.65;
        return;
      }
      kingInvulnerability=.8;
      health--; kingFlash.trigger(); setStatus({health,lives});
      if(!health) {
        clearZone(); clear(); magicOrb.visible=false; magicImpact.visible=false;
        kingShield.visible=false; immuneText.visible=false;
        magicTrail.forEach(bead=>{bead.visible=false;});
        live.current.onSound('win');
      }
    };
    const down=e=>{
      if(live.current.paused || e.ctrlKey || e.altKey || e.metaKey) return;
      const key=e.key.toLowerCase();
      if([' ','e','j'].includes(key)) { e.preventDefault(); if(!e.repeat) attack.current(); }
      else if(walkKeys.includes(key)) { e.preventDefault(); keys.current.add(key); }
    };
    const up=e=>keys.current.delete(e.key.toLowerCase());
    canvas.addEventListener('keydown',down); canvas.addEventListener('blur',clear);
    window.addEventListener('keyup',up); window.addEventListener('blur',clear);
    function walk(dt) {
      const pressed=keys.current;
      const x=Number(pressed.has('d')||pressed.has('arrowright'))-Number(pressed.has('a')||pressed.has('arrowleft'));
      const z=Number(pressed.has('w')||pressed.has('arrowup'))-Number(pressed.has('s')||pressed.has('arrowdown'));
      camera.getWorldDirection(forward); forward.y=0; forward.normalize(); right.crossVectors(forward,camera.up);
      move.copy(forward).multiplyScalar(z).addScaledVector(right,x).normalize();
      const p=player.position, startX=p.x, startZ=p.z, speed=isRunning(pressed)?6.5:4;
      p.x=THREE.MathUtils.clamp(p.x+move.x*dt*speed,-11.7,11.7);
      p.z=THREE.MathUtils.clamp(p.z+move.z*dt*speed,-11.6,16);
      if(x||z) player.rotation.y=Math.atan2(move.x,move.z);
      poseAdventurerStride(limbs,age,x||z,live.current.reduceMotion);
      if(!introStarted) {
        introDistance+=Math.hypot(p.x-startX,p.z-startZ);
        if(introDistance>=2.4) startKingIntro();
      }
    }
    function fight(dt) {
      const p=player.position, b=king.position, gap=distance(), furious=health<=6;
      timer-=dt;
      kingWalking=false;
      rageAura.visible=furious;
      rageAura.position.set(0,2.15,0);
      const casting=['warning','projectile','strike','impact'].includes(phase)&&rangedAttack;
      const armPose=casting?-2.45:0;
      castingArm.rotation.z=live.current.reduceMotion
        ? armPose
        : THREE.MathUtils.damp(castingArm.rotation.z,armPose,14,dt);
      const spinning=spinAttack&&['warning','strike','impact'].includes(phase);
      weapon.position.y=live.current.reduceMotion
        ? (spinning?1.25:2)
        : THREE.MathUtils.damp(weapon.position.y,spinning?1.25:2,12,dt);
      if(phase==='pursuit') {
        king.rotation.y=Math.atan2(p.x-b.x,p.z-b.z);
        if(gap>2) {
          kingWalking=true;
          const step=Math.min(gap-2,dt*(furious?3.4:2.7));
          b.x+=Math.sin(king.rotation.y)*step; b.z+=Math.cos(king.rotation.y)*step;
        } else kingWalking=false;
        if(timer<=0 && (gap<=3.4 || gap>=6)) {
          rangedAttack=gap>=6;
          spinAttack=!rangedAttack&&closeAttacks%2===1;
          if(!rangedAttack) closeAttacks++;
          zone=rangedAttack?curseZone:spinAttack?spinZone:swordZone;
          zone.marker.position.set(rangedAttack ? p.x : b.x, .045, rangedAttack ? p.z : b.z);
          zone.marker.rotation.y = king.rotation.y;
          zone.marker.visible = true;
          if(rangedAttack){
            magicTarget.set(zone.marker.position.x,.65,zone.marker.position.z);
            castingArm.localToWorld(magicOrigin.set(-.31,-1.22,.42));
            magicOrb.position.copy(magicOrigin);
            magicOrb.scale.setScalar(.68);
            magicOrb.visible=true;
            magicTrail.forEach(bead=>{bead.visible=false;});
            weapon.rotation.x=0;
          }else{
            magicOrb.visible=false;
            magicTrail.forEach(bead=>{bead.visible=false;});
          }
          phase='warning'; timer=furious ? .58 : .82;
        }
      } else if(phase==='warning') {
        const duration=furious ? .58 : .82;
        const progress=1-Math.max(0,timer)/duration;
        if(rangedAttack){
          castingArm.localToWorld(magicOrigin.set(-.31,-1.22,.42));
          magicOrb.visible=true;
          magicOrb.position.copy(magicOrigin);
          magicOrb.scale.setScalar(.68+progress*.42+Math.sin(age*18)*.1);
          magicCore.rotation.x+=dt*5;
          magicCore.rotation.y+=dt*7;
          magicHalo.rotation.y-=dt*3;
          weapon.rotation.x=0;
          if(timer<=0){
            magicOrigin.copy(magicOrb.position);
            projectileDuration=THREE.MathUtils.clamp(magicOrigin.distanceTo(magicTarget)/16,.45,1.5);
            phase='projectile';
            timer=projectileDuration;
          }
          return;
        }else if(spinAttack){
          weapon.rotation.x=live.current.reduceMotion?1.35:THREE.MathUtils.damp(weapon.rotation.x,1.35,12,dt);
        }else{
          weapon.rotation.x=live.current.reduceMotion?-.75:-Math.min(1,progress*2);
        }
        if(timer>0) return;
        phase='strike';
        timer=spinAttack ? .62 : .16;
        if(spinAttack) spinStartRotation=king.rotation.y;
      } else if(phase==='projectile') {
        const progress=1-Math.max(0,timer)/projectileDuration;
        magicOrb.visible=true;
        magicOrb.position.lerpVectors(magicOrigin,magicTarget,progress);
        magicOrb.position.y+=Math.sin(progress*Math.PI)*.45;
        magicOrb.scale.setScalar(1+Math.sin(age*20)*.14);
        magicCore.rotation.x+=dt*7;
        magicCore.rotation.y+=dt*9;
        magicHalo.rotation.y-=dt*5;
        magicTrail.forEach((bead,index)=>{
          const trailProgress=progress-index*.075;
          bead.visible=trailProgress>0;
          if(bead.visible){
            bead.position.lerpVectors(magicOrigin,magicTarget,trailProgress);
            bead.position.y+=Math.sin(trailProgress*Math.PI)*.45;
            bead.scale.setScalar(1-trailProgress*.28);
          }
        });
        if(timer<=0){
          magicOrb.visible=false;
          magicTrail.forEach(bead=>{bead.visible=false;});
          magicImpact.visible=true;
          magicImpact.position.copy(magicTarget);
          impactTime=.22;
          magicImpact.scale.setScalar(1);
          impactRing.scale.setScalar(.9);
          impactShell.scale.setScalar(.75);
          impactRing.material.opacity=.82;
          impactShell.material.opacity=.9;
          phase='strike'; timer=.16;
        }
      } else if(phase==='strike') {
        if(rangedAttack){
          weapon.rotation.x=0;
        }else if(spinAttack){
          const progress=1-Math.max(0,timer)/.62;
          if(!live.current.reduceMotion) king.rotation.y=spinStartRotation+progress*Math.PI*2;
          weapon.rotation.x=live.current.reduceMotion?1.35:1.35+.14*Math.sin(progress*Math.PI*2);
        }else{
          weapon.rotation.x=live.current.reduceMotion?1:1-2*Math.max(0,timer)/.16;
        }
        if(timer>0) return;
        const dx = p.x - zone.marker.position.x, dz = p.z - zone.marker.position.z;
        const bearing = Math.atan2(dx, dz) - zone.marker.rotation.y;
        const angle = Math.atan2(Math.sin(bearing), Math.cos(bearing));
        const hit = Math.hypot(dx,dz) <= zone.radius &&
          ((dx === 0 && dz === 0) || Math.abs(angle) <= zone.arc / 2);
        clearZone();
        phase='impact'; timer=.22;
        live.current.onSound('monsterAttack');
        if(hit) {
          lives--; playerFlash.trigger(); setStatus({lives,health});
          if(!lives) { deathTimer=1.2; clear(); live.current.onSound('defeat'); }
        }
      } else if(phase==='impact' && timer<=0) {
        weapon.rotation.x=0;
        magicImpact.visible=false;
        rangedAttack=false;
        if(spinAttack) king.rotation.y=spinStartRotation+Math.PI*2;
        spinAttack=false;
        phase='recovery'; timer=furious ? .48 : 1.1;
      } else if(phase==='recovery' && timer<=0) { phase='pursuit'; timer=furious ? .28 : .55; }
    }
    function draw(now) {
      const dt=previous?sceneFrameDelta(now,previous):0; previous=now;
      orbit.enabled=!live.current.paused;
      if(live.current.paused) clear();
      else {
        age+=dt;
        swing=Math.max(0,swing-dt);
        poseAdventurerSword(sword,swing,live.current.reduceMotion);
        if(health && lives) {
          if(introActive) {
            kingWalking=false;
            updateKingIntro(dt);
            poseAdventurerStride(limbs,age,false,live.current.reduceMotion);
          } else if(!introComplete) {
            walk(dt);
            if(!introActive) {
              king.position.y=1.15;
              legs.forEach(leg=>{leg.rotation.x=-1.35;});
            }
          } else {
          cooldown=Math.max(0,cooldown-dt);
          kingInvulnerability=Math.max(0,kingInvulnerability-dt);
          immuneNoticeTimer=Math.max(0,immuneNoticeTimer-dt);
          walk(dt); fight(dt);
          kingShield.visible=kingInvulnerability>0;
          immuneText.visible=immuneNoticeTimer>0;
          if(kingShield.visible){
            const pulse=live.current.reduceMotion?1:1+Math.sin(age*18)*.035;
            kingShield.scale.setScalar(pulse);
            shieldShell.material.opacity=live.current.reduceMotion ? .1 : .1+Math.sin(age*18)*.035;
            shieldLines.material.opacity=live.current.reduceMotion ? .58 : .5+Math.sin(age*18)*.16;
            if(!live.current.reduceMotion) kingShield.rotation.y+=dt*.7;
          }
          if(immuneText.visible){
            const progress=1-immuneNoticeTimer/.65;
            immuneText.position.y=5.15+progress*.6;
            immuneText.scale.set(2.2+progress*.25,.83+progress*.1,1);
            immuneTextMaterial.opacity=1-progress*.55;
          }
          const furious=health<=6;
          if(furious&&!live.current.reduceMotion){
            rageLight.intensity=14+Math.sin(age*12)*5;
            rageAura.children.forEach(object=>{
              if(object.userData.flameIndex!==undefined){
                const index=object.userData.flameIndex;
                const flicker=age*13+index*1.7;
                object.position.y=object.userData.baseY+Math.sin(flicker)*.13;
                object.rotation.x=object.userData.baseTiltX+Math.sin(flicker*.8)*.1;
                object.rotation.z=object.userData.baseTiltZ+Math.cos(flicker)*.12;
                object.scale.set(1+.12*Math.sin(flicker),.82+.24*Math.abs(Math.sin(flicker)),1+.12*Math.cos(flicker));
              }
            });
          }else rageLight.intensity=0;
          if(magicImpact.visible){
            impactTime=Math.max(0,impactTime-dt);
            const progress=1-impactTime/.22;
            magicImpact.scale.setScalar(.7+progress*1.8);
            impactShell.scale.setScalar(.75+Math.sin(progress*Math.PI)*.65);
            impactRing.scale.setScalar(.9+progress*1.8);
            impactRing.material.opacity=.82*(1-progress);
            impactShell.material.opacity=.9*(1-progress);
          }
          legs.forEach((leg,index)=>{
            const target=kingWalking&&!live.current.reduceMotion
              ? Math.sin(age*7+(index ? Math.PI : 0))* .42
              : 0;
            leg.rotation.x=live.current.reduceMotion
              ? 0
              : THREE.MathUtils.damp(leg.rotation.x,target,14,dt);
          });
          king.position.y=kingWalking&&!live.current.reduceMotion
            ? Math.abs(Math.sin(age*7))* .055
            : THREE.MathUtils.damp(king.position.y,0,14,dt);
          }
        } else {
          poseAdventurerStride(limbs,age,false,live.current.reduceMotion);
          if(deathTimer>0){
            deathTimer=Math.max(0,deathTimer-dt);
            body.rotation.z=live.current.reduceMotion?0:Math.min(1.5,(1.2-deathTimer)*1.6);
          }
          kingWalking=false;
          rageAura.visible=false;
          rageLight.intensity=0;
          magicOrb.visible=false;
          magicTrail.forEach(bead=>{bead.visible=false;});
          magicImpact.visible=false;
          kingShield.visible=false;
          immuneText.visible=false;
          rangedAttack=false;
          spinAttack=false;
          castingArm.rotation.z=live.current.reduceMotion?0:THREE.MathUtils.damp(castingArm.rotation.z,0,14,dt);
          legs.forEach(leg=>{
            leg.rotation.x=live.current.reduceMotion?0:THREE.MathUtils.damp(leg.rotation.x,0,14,dt);
          });
          king.position.y=live.current.reduceMotion?0:THREE.MathUtils.damp(king.position.y,0,14,dt);
        }
        playerFlash.update(dt,live.current.reduceMotion);
        kingFlash.update(dt,live.current.reduceMotion);
        if(!health) {
          king.rotation.z=live.current.reduceMotion?1.45:THREE.MathUtils.damp(king.rotation.z,1.45,4,dt);
          rim.intensity=THREE.MathUtils.damp(rim.intensity,14,2,dt);
        }
        if(!live.current.reduceMotion) sparks.forEach((s,i)=>{s.position.y=1+i%5+Math.sin(age+i)*.35;});
      }
      updateCamera(dt); renderer.render(scene,camera); frame=requestAnimationFrame(draw);
    }
    const visibility=()=>{ cancelAnimationFrame(frame); clear(); previous=0; if(!document.hidden) frame=requestAnimationFrame(draw); };
    document.addEventListener('visibilitychange',visibility); visibility();
    return ()=>{
      cancelAnimationFrame(frame); clear(); attack.current=null; skipIntro.current=null; observer.disconnect(); orbit.dispose();
      document.removeEventListener('visibilitychange',visibility); canvas.removeEventListener('keydown',down);
      canvas.removeEventListener('blur',clear); window.removeEventListener('keyup',up); window.removeEventListener('blur',clear);
      clearZone(); playerFlash.reset(); kingFlash.reset(); damageRed.dispose(); immuneTexture.dispose();
      const geometries=new Set(), materials=new Set();
      scene.traverse(o=>{ if(o.isInstancedMesh)o.dispose(); if(o.geometry)geometries.add(o.geometry); if(o.material)materials.add(o.material); });
      geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); renderer.dispose(); canvas.remove();
    };
  },[keys]);
  const title=en?'Castle Lord':'Senhor do Castelo';
  return <section className="lake cursed-castle castle-courtyard"><div className="lake-viewport">
    <div className="lake-canvas" ref={host} role="group" aria-label={title}/>
    <div className="encounter-controls">{campaignNavigation}
      {intro && <button className="battle-skip" disabled={paused} onClick={()=>skipIntro.current?.()}>
        {en?'Skip cutscene':'Pular cena'}
      </button>}
    </div>
    <div className="courtyard-status"><div className="cursed-heading"><strong>{en?'Evil Throne Room':'Sala do Trono Maligno'}</strong></div>
      {active && <div className="witch-battle-status"><span className="witch-lives" aria-label={en?`Player health ${status.lives}/${initial.lives}`:`Vida do jogador ${status.lives}/${initial.lives}`}>{'♥'.repeat(status.lives)}{'♡'.repeat(initial.lives-status.lives)}</span>
        <small className="witch-health">{title} · {status.health}/{initial.health}</small></div>}</div>
    {intro && introLine>=0 && <div className="chamber-subtitle castle-intro-subtitle" role="status" aria-live="polite">
      <strong>{en?'THE KING':'O REI'}</strong>
      <p>{kingDialogue[en?'en-US':'pt-BR'][introLine]}</p>
      {!voiceEnabled && <small>{en?'Enable voices in audio settings to hear the king.':'Ative as vozes nas configurações de áudio para ouvir o rei.'}</small>}
      {voiceEnabled && voiceNotice && <small>{voiceNotice}</small>}
    </div>}
    {!active && <div className="witch-battle-status courtyard-progress" role="status">
      <strong>{error?(en?'Could not open the 3D room.':'Não foi possível abrir a sala 3D.'):status.health===0?(en?'The crown falls silent.':'A coroa silencia.'):(en?'You fell before the throne.':'Você caiu diante do trono.')}</strong>
      <button className="courtyard-action" disabled={paused} onClick={status.health===0?onReturn:onRestart}>{status.health===0?(en?'Return to the entrance':'Voltar à entrada'):(en?'Try again':'Tentar novamente')}</button></div>}
    {active && !intro && <MapControlGuide language={en ? 'en-US' : 'pt-BR'} scene="castleThrone" />}
    </div><div className="lake-touch sword-controls" hidden={intro}>{arrows.map(([key,symbol,english,portuguese])=><button key={key} aria-label={en?english:portuguese} disabled={!active || paused || intro}
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setTouchMovement(keys.current,key,true);}}
      onPointerUp={()=>setTouchMovement(keys.current,key,false)} onLostPointerCapture={()=>setTouchMovement(keys.current,key,false)}
      onPointerCancel={()=>setTouchMovement(keys.current,key,false)}>{symbol}</button>)}
      <TouchAttack en={en} disabled={!active || paused || intro} onAttack={()=>attack.current?.()}/></div></section>;
}
