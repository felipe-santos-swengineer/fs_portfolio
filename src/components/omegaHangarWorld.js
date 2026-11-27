import { buildOmegaSector } from './omegaSectorWorld';
import { createOmegaSuit, suitRack, SUIT_READY, SUIT_EQUIPPED } from './omegaSuit';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { allowRunAndRotate } from './runAndRotate';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import { isRunning } from './touchMovement';
import { createAdventurer } from './VillageScene';
import { sceneFrameDelta } from './sceneFrameDelta';
import galaxyPanorama from '../assets/images/omega-galaxy.jpg';

import { buildCommandCenter, commandOffset } from './omegaCommandCenter';
import { buildDock, canWalk, deckHeight, consolePosition } from './omegaDock';

function applyContainmentLight(light, level) {
  light.color.setRGB(.73+.27*level,.88-.56*level,1-.7*level);
  light.intensity=2.2-level*.4;
}

export function mountHangar(host, settings, keys, onNear, interact) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  const {branch,map,arena} = settings.current;
  const command = settings.current.command || branch;
  canvas.setAttribute('aria-label', branch ? (map==='omega-lab'?'Laboratório / Laboratory':'Reator / Reactor') : command ? 'Centro de Comando / Command Center' : 'Hangar de chegada / Arrival hangar');
  if(arena)canvas.setAttribute('aria-label','Núcleo NEXUS / NEXUS core');
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#081121');
  scene.backgroundRotation.y = Math.PI / 2;
  let disposed = false;
  const panorama = new THREE.TextureLoader().load(galaxyPanorama, texture => {
    if (!disposed) scene.background = texture;
  });
  panorama.mapping = THREE.EquirectangularReflectionMapping;
  panorama.colorSpace = THREE.SRGBColorSpace;
  const camera = new THREE.PerspectiveCamera(52, 1, .1, arena ? 170 : 100);
  const materials = new Map();
  const mesh = (parent, geometry, color, x, y, z) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color }));
    const object = new THREE.Mesh(geometry, materials.get(color));
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  };
  const cube = new THREE.BoxGeometry();
  const box = (parent, w, h, d, color, x, y, z) => {
    const object = mesh(parent, cube, color, x, y, z);
    object.scale.set(w, h, d);
    return object;
  };
  const sphere = (p, r, c, x, y, z) => mesh(p, new THREE.IcosahedronGeometry(r, 1), c, x, y, z);
  const cylinder = (p, r, h, c, x, y, z, n = 8) => mesh(p, new THREE.CylinderGeometry(r, r, h, n), c, x, y, z);
  scene.add(new THREE.HemisphereLight(0xcbe7ff, 0x637080, 1.65));
  const light = new THREE.DirectionalLight('#ff644e', 2);
  light.position.set(-8, 12, 5);
  scene.add(light);
  const dock = command ? null : buildDock(scene, settings.current.language);
  const hub = new THREE.Group();
  hub.position.z = command ? 0 : commandOffset;
  hub.visible = command;
  scene.add(hub);
  let center = arena ? arena.build(hub,{box,cylinder,sphere}) : branch ? buildOmegaSector(hub,{box,cylinder,sphere},map,settings.current.mission) : command ? buildCommandCenter(hub,{box,cylinder,sphere}) : null;
  const arrival = (command || arena) && settings.current.arrival;
  if (command) light.color.set('#b3ecff');
  const floor = command ? center.floor : deckHeight;
  const walkable = command ? center.canWalk : (x,z,h) =>
    canWalk(x,z,h,dock.open && settings.current.phase !== 6,dock.exitOpen);
  const spawnZ = command || arena ? (arrival ? arrival.z : branch ? 14 : 20) : settings.current.phase >= 6 ? -28 : 12;
  const player = new THREE.Group();
  scene.add(player);
  const suit = createOmegaSuit();
  let limbs = suit.limbs;
  let original;
  function equipSuit() {
    if (original) original.visible = false;
    player.add(suit.root);
    suit.root.position.set(0,0,0);
    suit.root.rotation.y = 0;
    suit.root.visible = true;
    limbs = suit.limbs;
  }
  if (command) equipSuit();
  else {
    const adventurer = createAdventurer(player, { box, mesh, sphere, cylinder });
    original = adventurer.player;
    original.position.set(0,0,0);
    adventurer.sword.visible = false;
    limbs = adventurer.limbs;
    scene.add(suit.root);
    suit.root.position.set(suitRack.x,.25,suitRack.z);
    suit.root.rotation.y = -Math.PI / 2;
    suit.root.visible = false;
  }
  const spawnX=arrival ? arrival.x : 0;
  player.position.set(spawnX,.05+floor(spawnX,spawnZ),spawnZ);
  if(arrival)player.rotation.y=arrival.heading;
  camera.position.set(0, 7, spawnZ + 10);
  const orbitCamera = arena ? camera.clone() : camera;
  const orbit = allowRunAndRotate(new OrbitControls(orbitCamera, canvas));
  orbit.target.set(player.position.x,1.25,spawnZ);
  if(arrival) orbitCamera.position.fromArray(arrival.offset).add(orbit.target);
  orbit.enablePan = false;
  orbit.minDistance = 5;
  orbit.maxDistance = 12;
  orbit.minPolarAngle = .55;
  orbit.maxPolarAngle = 1.25;
  orbit.update();
  if(arena){camera.position.copy(orbitCamera.position);camera.quaternion.copy(orbitCamera.quaternion);}
  const cameraShift = new THREE.Vector3();
  const nexusLook = new THREE.Vector3(), nexusView = new THREE.Vector3(), nexusFront = new THREE.Vector3();
  let nexusCutTime = 0;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const clear = () => keys.clear();
  const down = event => {
    if (settings.current.paused) return;
    const k = event.key.toLowerCase();
    if (k === 'e' && !event.repeat) interact();
    if (['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown','shift'].includes(k)) {
      if (k !== 'shift') event.preventDefault();
      keys.add(k);
    }
  };
  const up = event => keys.delete(event.key.toLowerCase());
  const focus = () => canvas.focus({ preventScroll: true });
  canvas.addEventListener('pointerdown', focus);
  canvas.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('blur', clear);
  window.addEventListener('blur', clear);
  focus();
  let frame, last = performance.now(), previous = -1;
  const axis = (a, b) => Number(keys.has(a) || keys.has(b));
  let elapsed = 0, lastPhase = -1, walked = 0;
  let nexusContainment = 0;
  let gait = 0;
  const render = now => {
    const dt = sceneFrameDelta(now, last);
    last = now;
    if (!settings.current.paused) {
      const dx = axis('d','arrowright') - axis('a','arrowleft');
      const dz = axis('s','arrowdown') - axis('w','arrowup');
      const pos = player.position;
      if(arena?.battle.spawn){
        pos.set(spawnX,.05,spawnZ);
        if(arrival)player.rotation.y=arrival.heading;
        arena.battle.spawn=false;
      }
      const oldX = pos.x, oldZ = pos.z;
      const pulling=Boolean(arena?.battle.pull);
      if (arena) {
        const direction = dx || dz ? cameraRelativeDirection(camera,dx,dz) : {x:0,z:0};
        if(settings.current.canMove){
          arena.move(arena.battle,pos,direction,isRunning(keys)?6.5:4,dt,walkable);
          if(!pulling&&(dx || dz))player.rotation.y=Math.atan2(direction.x,direction.z);
        }
        player.visible=!['flight','completed'].includes(arena.battle.mode);
      } else if (dx || dz) {
        const direction = cameraRelativeDirection(camera, dx, dz);
        const step = (isRunning(keys) ? 6.5 : 4) * dt;
        const x = pos.x + direction.x * step;
        const z = pos.z + direction.z * step;
        if (walkable(x,pos.z,floor(pos.x,pos.z))) pos.x = x;
        if (walkable(pos.x,z,floor(pos.x,pos.z))) pos.z = z;
        pos.y = .05 + floor(pos.x,pos.z);
        player.rotation.y = Math.atan2(direction.x, direction.z);
      }
      const distance = Math.hypot(pos.x - oldX, pos.z - oldZ);
      gait += distance * 2.25;
      const swing = distance && !pulling && !settings.current.reduceMotion ? Math.sin(gait) : 0;
      limbs.forEach((limb, i) => {
        limb.rotation.x = swing * (i % 2 === 0 ? .5 : -.45) * (i < 2 ? 1 : -1);
      });
      const equipped = command || settings.current.phase >= SUIT_EQUIPPED;
      if (equipped && suit.root.parent !== player) equipSuit();
      else if (!equipped) suit.root.visible = settings.current.phase === SUIT_READY;
      suit.update(equipped, command && Math.hypot(pos.x,pos.z)<4.6, dt,settings.current.reduceMotion);
      if (command) {
        light.intensity=settings.current.mission.powered?2.9:1.9;
        center.update(dt,settings.current.reduceMotion,settings.current.mission,pos,distance,player);
        if(arena){
          const combat=['betrayal','fight','lost'].includes(arena.battle.mode);
          nexusContainment=THREE.MathUtils.clamp(nexusContainment+(combat?dt*.42:-dt*.85),0,1);
          if(nexusContainment>0)applyContainmentLight(light,nexusContainment);
          else light.color.set('#b3ecff');
        }
        const near = center.target(pos.x,pos.z);
        if (near !== previous) { previous = near; onNear(near); }
        if(arena)settings.current.sync(dt);
      } else {
        const { phase, advance, speechBusy, reduceMotion } = settings.current;
        if (phase !== lastPhase) { elapsed = 0; lastPhase = phase; }
        elapsed += dt;
        walked += distance;
        const ready = !speechBusy() && elapsed > [7,6,3,9,0,0,9][phase];
        if ((phase === 0 && walked > 3 && ready) ||
            ((phase === 1 || phase === 2 || phase === 3) && ready) ||
            (phase === 5 && pos.z < -25 && !speechBusy()) ||
            (phase === 6 && ready)) advance(phase);
        const near = phase === SUIT_READY
          ? Math.hypot(suitRack.x-pos.x,suitRack.z-pos.z) < 2
          : Math.hypot(consolePosition.x-pos.x,consolePosition.z-pos.z) < 2.8 && pos.y > 3;
        if (near !== previous) { previous = near; onNear(near); }
        const lockdown = dock.update(dt,phase,reduceMotion);
        applyContainmentLight(light,lockdown);
        if(settings.current.mission.powered){
          light.color.set('#d4eaff');
          light.intensity=2.8;
        }
        hub.visible = pos.z < -23;
        if (hub.visible && !center) center = buildCommandCenter(hub,{box,cylinder,sphere},true);
        if (hub.visible) {
          center.update(dt,reduceMotion,null);
          light.color.lerp(new THREE.Color('#b3ecff'),THREE.MathUtils.clamp((-pos.z-28)/10,0,1));
        }
        if (dock.exitOpen && pos.z < -36) {
          clear();
          settings.current.onEnterCommand({x:pos.x,z:pos.z-commandOffset,heading:player.rotation.y,offset:camera.position.clone().sub(orbit.target).toArray()});
          return;
        }
      }
    }
    const nexusCloseup=arena&&['liberation','autonomy','betrayal','defeated'].includes(arena.battle.mode);
    const nexusFlight=arena&&['flight','completed'].includes(arena.battle.mode);
    orbit.enabled = !settings.current.paused&&!nexusCloseup&&!nexusFlight;
    if (!settings.current.paused) {
      const cameraTargetY=arena?.battle.pull?1.25:player.position.y+1.2;
      cameraShift.set(player.position.x, cameraTargetY, player.position.z).sub(orbit.target);
      orbitCamera.position.add(cameraShift);
      orbit.target.add(cameraShift);
      orbit.enableDamping = !settings.current.reduceMotion;
      orbit.update();
      if(arena){camera.position.copy(orbitCamera.position);camera.quaternion.copy(orbitCamera.quaternion);}
      if(nexusCloseup){
        nexusCutTime+=dt;
        center.cinematicFocus(nexusLook);
        nexusFront.set(player.position.x-nexusLook.x,0,player.position.z-nexusLook.z).normalize();
        const reduced=settings.current.reduceMotion;
        const blend=reduced?1:THREE.MathUtils.smoothstep(nexusCutTime,0,.85);
        const materializing=arena.battle.mode==='liberation';
        const approach=materializing?THREE.MathUtils.smoothstep(arena.battle.materialization,1.4,4.6):1;
        const framing=Math.max(1,.88/camera.aspect);
        const distance=THREE.MathUtils.lerp(5.4,3.5,reduced?1:approach)*framing;
        nexusView.copy(nexusLook).addScaledVector(nexusFront,distance);
        nexusView.y+=.16;
        camera.position.lerp(nexusView,blend);
        nexusLook.lerpVectors(orbit.target,nexusLook,blend);
        camera.lookAt(nexusLook);
      } else nexusCutTime=0;
      if(nexusFlight){
        const flight=arena.battle.flight;
        const framing=Math.max(1,.93/camera.aspect);
        camera.position.set(16+flight*.38,11+flight*.42,center.pod.position.z+18*framing);
        camera.lookAt(0,3.7+flight*.15,8+flight*.55);
      }
    }
    dock?.setLanguage(settings.current.language);
    if(hub.visible)center?.cutaway(camera.position,nexusCloseup?nexusLook:orbit.target);
    dock?.updateVisibility(camera.position, orbit.target);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return () => {
    disposed = true;
    panorama.dispose();
    cancelAnimationFrame(frame);
    observer.disconnect();
    orbit.dispose();
    clear();
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', clear);
    canvas.removeEventListener('pointerdown', focus);
    canvas.removeEventListener('keydown', down);
    canvas.removeEventListener('blur', clear);
    const geometries = new Set(), usedMaterials = new Set();
    scene.traverse(o => { if (o.isInstancedMesh) o.dispose(); if (o.geometry) geometries.add(o.geometry); if (o.material) usedMaterials.add(o.material); });
    geometries.forEach(g => g.dispose());
    usedMaterials.forEach(m => { m.map?.dispose(); m.dispose(); });
    renderer.dispose();
    canvas.remove();
  };
}
