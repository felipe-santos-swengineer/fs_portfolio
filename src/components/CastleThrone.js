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
import './Lake.css';
import './CursedCastle.css';

const initial = { lives: 4, health: 12 };
const arrows = [['arrowleft','←','Left','Esquerda'],['arrowup','↑','Forward','Frente'],
  ['arrowdown','↓','Back','Trás'],['arrowright','→','Right','Direita']];
const walkKeys = ['w','a','s','d','shift',...arrows.map(([key])=>key)];

export default function CastleThrone({ en, paused, reduceMotion, keys, campaignNavigation, onSound, onRestart, onReturn }) {
  const host=useRef(null), attack=useRef(null), live=useRef(null);
  live.current={paused,reduceMotion,onSound};
  const [status,setStatus]=useState(initial);
  const [error,setError]=useState(false);
  const active=status.health>0 && status.lives>0 && !error;
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
    const {king,weapon}=createCastleLord(scene,shapes);
    const {player,limbs,sword}=createAdventurer(scene,shapes);
    player.position.set(0,.08,12); player.rotation.y=Math.PI;
    const damageRed = new THREE.MeshBasicMaterial({ color: '#ff3030' });
    const damageMaterial = (elapsed, reduced) =>
      reduced || Math.floor(elapsed * 14) % 2 === 0 ? damageRed : null;
    const playerFlash = attachCombatFlash(player, .7, damageMaterial);
    const kingFlash = attachCombatFlash(king, .5, damageMaterial);
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
    const swordZone = makeZone(3.8, Math.PI * 2 / 3);
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
    orbitCamera.position.set(2,4.35,player.position.z+7.5);
    const orbit=allowRunAndRotate(new OrbitControls(orbitCamera,canvas));
    orbit.target.set(0,2.75,player.position.z);
    orbit.enablePan=false; orbit.enableDamping=true;
    orbit.minDistance=5; orbit.maxDistance=15; orbit.maxPolarAngle=Math.PI/2-.07;
    orbit.update();
    const focus=new THREE.Vector3(), shift=new THREE.Vector3(), offset=new THREE.Vector3();
    const local=new THREE.Vector3(), inverse=new THREE.Quaternion();
    let framingDistance=0;
    function updateCamera(dt) {
      focus.copy(player.position).lerp(king.position,.23);
      focus.y=2.35;
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
    let cooldown=0, swing=0, age=0, turns=0;
    let frame=0, previous=0;
    const forward=new THREE.Vector3(), right=new THREE.Vector3(), move=new THREE.Vector3();
    const clear=()=>keys.current.clear();
    const distance=()=>Math.hypot(player.position.x-king.position.x,player.position.z-king.position.z);
    attack.current=()=>{
      if(live.current.paused || !health || !lives || cooldown>0) return;
      swing=.45; cooldown=.54; live.current.onSound('attack');
      if(distance()>3.1) return;
      player.rotation.y=Math.atan2(king.position.x-player.position.x,king.position.z-player.position.z);
      health--; kingFlash.trigger(); setStatus({health,lives});
      if(!health) { clearZone(); clear(); live.current.onSound('win'); }
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
      const p=player.position, speed=isRunning(pressed)?6.5:4;
      p.x=THREE.MathUtils.clamp(p.x+move.x*dt*speed,-11.7,11.7);
      p.z=THREE.MathUtils.clamp(p.z+move.z*dt*speed,-11.6,16);
      if(x||z) player.rotation.y=Math.atan2(move.x,move.z);
      poseAdventurerStride(limbs,age,x||z,live.current.reduceMotion);
    }
    function fight(dt) {
      const p=player.position, b=king.position, gap=distance(), furious=health<=6;
      timer-=dt;
      if(phase==='pursuit') {
        king.rotation.y=Math.atan2(p.x-b.x,p.z-b.z);
        if(gap>2) {
          const step=Math.min(gap-2,dt*(furious?3.4:2.7));
          b.x+=Math.sin(king.rotation.y)*step; b.z+=Math.cos(king.rotation.y)*step;
        }
        if(timer<=0 && (gap<3.4 || turns%2===1 || timer < -2)) {
          const curse=gap>=3.4 || turns%2===1;
          turns++;
          zone = curse ? curseZone : swordZone;
          zone.marker.position.set(curse ? p.x : b.x, .045, curse ? p.z : b.z);
          zone.marker.rotation.y = king.rotation.y;
          zone.marker.visible = true;
          phase='warning'; timer=furious ? .82 : 1.1;
        }
      } else if(phase==='warning') {
        const progress = 1 - Math.max(0, timer) / (furious ? .82 : 1.1);
        weapon.rotation.x = live.current.reduceMotion ? -.75 : -Math.min(1, progress * 2);
        if(timer>0) return;
        phase='strike'; timer=.16;
      } else if(phase==='strike') {
        weapon.rotation.x = live.current.reduceMotion ? 1 : 1 - 2 * Math.max(0,timer) / .16;
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
          if(!lives) { clear(); live.current.onSound('defeat'); }
        }
      } else if(phase==='impact' && timer<=0) {
        weapon.rotation.x=0; phase='recovery'; timer=furious ? .72 : 1.1;
      } else if(phase==='recovery' && timer<=0) { phase='pursuit'; timer=.55; }
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
          cooldown=Math.max(0,cooldown-dt);
          walk(dt); fight(dt);
        } else {
          poseAdventurerStride(limbs,age,false,live.current.reduceMotion);
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
      cancelAnimationFrame(frame); clear(); attack.current=null; observer.disconnect(); orbit.dispose();
      document.removeEventListener('visibilitychange',visibility); canvas.removeEventListener('keydown',down);
      canvas.removeEventListener('blur',clear); window.removeEventListener('keyup',up); window.removeEventListener('blur',clear);
      clearZone(); playerFlash.reset(); kingFlash.reset(); damageRed.dispose();
      const geometries=new Set(), materials=new Set();
      scene.traverse(o=>{ if(o.isInstancedMesh)o.dispose(); if(o.geometry)geometries.add(o.geometry); if(o.material)materials.add(o.material); });
      geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); renderer.dispose(); canvas.remove();
    };
  },[keys]);
  const title=en?'Castle Lord':'Senhor do Castelo';
  return <section className="lake cursed-castle castle-courtyard"><div className="lake-viewport">
    <div className="lake-canvas" ref={host} role="group" aria-label={title}/>
    <div className="encounter-controls">{campaignNavigation}</div>
    <div className="courtyard-status"><div className="cursed-heading"><strong>{en?'Throne Room':'Sala do Trono'}</strong></div>
      {active && <div className="witch-battle-status"><span className="witch-lives" aria-label={en?`Player health ${status.lives}/4`:`Vida do jogador ${status.lives}/4`}>{'♥'.repeat(status.lives)}{'♡'.repeat(4-status.lives)}</span>
        <small className="witch-health">{title} · {status.health}/{initial.health}</small></div>}</div>
    {!active && <div className="witch-battle-status courtyard-progress" role="status">
      <strong>{error?(en?'Could not open the 3D room.':'Não foi possível abrir a sala 3D.'):status.health===0?(en?'The crown falls silent.':'A coroa silencia.'):(en?'You fell before the throne.':'Você caiu diante do trono.')}</strong>
      <button className="courtyard-action" disabled={paused} onClick={status.health===0?onReturn:onRestart}>{status.health===0?(en?'Return to the entrance':'Voltar à entrada'):(en?'Try again':'Tentar novamente')}</button></div>}
    {active && <MapControlGuide language={en ? 'en-US' : 'pt-BR'} scene="castleThrone" />}
    </div><div className="lake-touch sword-controls">{arrows.map(([key,symbol,english,portuguese])=><button key={key} aria-label={en?english:portuguese} disabled={!active || paused}
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setTouchMovement(keys.current,key,true);}}
      onPointerUp={()=>setTouchMovement(keys.current,key,false)} onLostPointerCapture={()=>setTouchMovement(keys.current,key,false)}
      onPointerCancel={()=>setTouchMovement(keys.current,key,false)}>{symbol}</button>)}
      <TouchAttack en={en} disabled={!active || paused} onAttack={()=>attack.current?.()}/></div></section>;
}
