import { setTouchMovement } from './touchMovement';
import TouchInteract from './TouchInteract';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createAdventurer } from './VillageScene';
import { createLakeBoat } from './lakeBoat';
import MapControlGuide from './MapControlGuide';
import { sceneFrameDelta } from './sceneFrameDelta';
import { TUNNEL, createDragonTunnel, tunnelCenter, tunnelFloor, tunnelRegion } from './dragonTunnelWorld';
import './Lake.css';
import './AncientTunnel.css';

const ROW_SPEED = 4.2;
const REGION_TEXT = {
  entrance: ['ENTRADA · A SUPERFÍCIE', 'ENTRANCE · THE SURFACE', 'Luz do dia, musgo e raízes antigas', 'Daylight, moss and ancient roots'],
  descent: ['DESCIDA · O ABANDONO', 'DESCENT · LEAVING THE LIGHT', 'As paredes fecham-se sobre a passagem', 'The walls close in around the passage'],
  depths: ['PROFUNDEZAS', 'THE DEEPS', 'Cristais, brasas e ecos ancestrais', 'Crystals, embers and ancestral echoes'],
  arrival: ['CHEGADA · O VILAREJO', 'ARRIVAL · THE VILLAGE', 'Uma civilização oculta revela-se', 'A hidden civilization is revealed'],
};

export default function AncientTunnel({ campaignNavigation, language, paused, reduceMotion, fromVillage = false, onExit, onArrive, onReturnCove, onSound }) {
  const spawnZ = fromVillage ? TUNNEL.endZ + 8 : TUNNEL.startZ - 2;
  const mount = useRef(null), keys = useRef(new Set()), settings = useRef({}), nearRef = useRef(fromVillage), startRef = useRef(!fromVillage), headingRef = useRef(null);
  settings.current = { paused, reduceMotion, onSound, onArrive, onReturnCove };
  const [near, setNear] = useState(fromVillage), [atStart, setAtStart] = useState(!fromVillage), [region, setRegion] = useState(fromVillage ? 'arrival' : 'entrance'), [error, setError] = useState(false);
  const en = language === 'en-US';
  const interact = () => {
    if (settings.current.paused) return;
    const destination = nearRef.current ? settings.current.onArrive
      : startRef.current ? settings.current.onReturnCove : null;
    if (!destination) return;
    keys.current.clear();
    settings.current.onSound?.('passage');
    destination();
  };
  const actions = useRef({ interact }); actions.current = { interact };

  useEffect(() => {
    const el = mount.current; let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', 'Dragon village tunnel / Túnel do vilarejo do dragão');
    el.appendChild(renderer.domElement);
    renderer.domElement.focus({ preventScroll: true });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, .1, 110);
    const world = createDragonTunnel(scene);
    scene.add(new THREE.HemisphereLight('#93a69b', '#2b211a', 1.05));
    const daylight = new THREE.DirectionalLight('#d4dcc8', 1.5);
    daylight.position.set(7, 20, 26);
    scene.add(daylight);

    const add = (parent, geometry, color, x, y, z) => {
      const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .9 }));
      object.position.set(x, y, z); parent.add(object); return object;
    };
    const boat = createLakeBoat(add);
    const sail = boat.getObjectByName('boat-sail');
    if (sail) {
      // Material exclusivo deste mapa: sem blending, sempre totalmente opaco.
      sail.material.dispose();
      sail.material = new THREE.MeshBasicMaterial({
        color: '#f1e4c7',
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1,
        depthWrite: true,
        fog: false,
      });
    }
    const faceAlongPath = (z, direction) => {
      const tangentX = tunnelCenter(z - .6) - tunnelCenter(z + .6);
      const forwardAngle = Math.atan2(-tangentX, 1.2);
      // S/↓ rows toward the cove (+z): snap to the reversed heading, no tween.
      boat.rotation.y = direction > 0 ? forwardAngle + Math.PI : forwardAngle;
    };
    scene.add(boat);
    boat.position.set(tunnelCenter(spawnZ), tunnelFloor(spawnZ) + .12, spawnZ);
    faceAlongPath(spawnZ, fromVillage ? 1 : -1);
    const lamp = new THREE.PointLight('#ffc07a', 9, 14);
    lamp.position.set(0, 2.2, .2); boat.add(lamp);

    const mesh = (parent, geometry, color, x, y, z) => add(parent, geometry, color, x, y, z);
    const box = (parent, w, h, d, color, x, y, z) => add(parent, new THREE.BoxGeometry(w, h, d), color, x, y, z);
    const sphere = (parent, r, color, x, y, z) => add(parent, new THREE.IcosahedronGeometry(r, 1), color, x, y, z);
    const cylinder = (parent, r, h, color, x, y, z, segments = 8) => add(parent, new THREE.CylinderGeometry(r, r, h, segments), color, x, y, z);
    const { player } = createAdventurer(boat, { box, sphere, mesh, cylinder });
    player.position.set(0, 1, .55);
    player.rotation.y = Math.PI;

    let sceneDt = 0;
    const updateCamera = instant => {
      const aheadZ = Math.max(TUNNEL.endZ, boat.position.z - 8);
      const aheadX = tunnelCenter(aheadZ);
      const desired = new THREE.Vector3(
        THREE.MathUtils.lerp(boat.position.x, aheadX, .34),
        boat.position.y + 5.6,
        Math.min(boat.position.z + 7.6, TUNNEL.startZ + 4));
      if (instant) camera.position.copy(desired);
      else camera.position.lerp(desired, Math.min(1, sceneDt * 3.2));
      camera.lookAt(THREE.MathUtils.lerp(boat.position.x, aheadX, .45), boat.position.y + 1.4, boat.position.z - 5.5);
    };
    updateCamera(true);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();
    const rowDirection = () => (keys.current.has('s') || keys.current.has('arrowdown') ? 1 : 0)
      - (keys.current.has('w') || keys.current.has('arrowup') ? 1 : 0);
    const syncHeading = () => {
      const direction = rowDirection();
      if (direction) faceAlongPath(boat.position.z, direction);
    };
    headingRef.current = syncHeading;
    const down = e => {
      const k = e.key.toLowerCase();
      if (document.activeElement !== renderer.domElement || settings.current.paused) return;
      if (k === 'e') { e.preventDefault(); actions.current.interact(); return; }
      if (['w', 's', 'arrowup', 'arrowdown'].includes(k)) {
        e.preventDefault();
        keys.current.add(k);
        syncHeading();
      }
    };
    const up = e => {
      keys.current.delete(e.key.toLowerCase());
      if (!settings.current.paused) syncHeading();
    }, clear = () => keys.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    renderer.domElement.addEventListener('blur', clear);

    let frame, last = performance.now(), time = 0, nextImpact = 0, nextAmbient = 7, nextEcho = 0, previousRegion = fromVillage ? 'arrival' : 'entrance';
    const animate = now => {
      frame = requestAnimationFrame(animate);
      sceneDt = sceneFrameDelta(now, last); last = now;
      if (!settings.current.paused) {
        time += sceneDt;
        const row = rowDirection();
        if (row) {
          const wantedZ = boat.position.z + row * ROW_SPEED * sceneDt;
          const zNext = THREE.MathUtils.clamp(wantedZ, TUNNEL.endZ + 1, TUNNEL.startZ - 2);
          if (zNext !== wantedZ && time >= nextImpact) {
            settings.current.onSound?.('stone'); nextImpact = time + .9;
          }
          boat.position.z = zNext;
          boat.position.x = tunnelCenter(zNext);
          faceAlongPath(zNext, row);
          if (time >= nextEcho) { settings.current.onSound?.('echo'); nextEcho = time + 1.1; }
        }
        boat.position.y = tunnelFloor(boat.position.z) + .12 + (settings.current.reduceMotion ? 0 : Math.sin(time * 1.4) * .045);
        daylight.intensity = Math.max(0, 1.5 - THREE.MathUtils.clamp((TUNNEL.startZ - boat.position.z) / 28, 0, 1) * 1.5);
        const current = tunnelRegion(boat.position.z);
        if (current !== previousRegion) {
          previousRegion = current; setRegion(current);
          settings.current.onSound?.(current === 'depths' ? 'deep' : current === 'arrival' ? 'village' : 'passage');
        }
        if (time >= nextAmbient) {
          nextAmbient = time + 7 + Math.random() * 5;
          const ambience = current === 'arrival' ? 'village'
            : current === 'depths' ? ['drip', 'wind', 'fire', 'deep'][Math.floor(Math.random() * 4)]
              : ['drip', 'fire'][Math.floor(Math.random() * 2)];
          settings.current.onSound?.(ambience);
        }
        const close = boat.position.z < TUNNEL.endZ + 9;
        if (close !== nearRef.current) { nearRef.current = close; setNear(close); }
        const atEntrance = boat.position.z >= TUNNEL.startZ - 4;
        if (atEntrance !== startRef.current) { startRef.current = atEntrance; setAtStart(atEntrance); }
      } else clear();
      world.update(time, sceneDt, settings.current.reduceMotion, previousRegion);
      updateCamera();
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear);
      renderer.domElement.removeEventListener('blur', clear); clear(); headingRef.current = null;
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.isInstancedMesh) object.dispose();
        if (object.geometry) geometries.add(object.geometry);
        if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
        else if (object.material) materials.add(object.material);
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => { material.map?.dispose(); material.dispose(); });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [fromVillage, spawnZ]);

  const press = (key, down) => {
    if (paused) return;
    setTouchMovement(keys.current, key, down);
    headingRef.current?.();
  };
  const caption = REGION_TEXT[region];
  return <section className="lake ancient-tunnel">
    <div className="lake-viewport">
      <div className="lake-canvas" ref={mount} />
      {campaignNavigation ?? <button className="lake-exit" onClick={onExit}>{en ? 'Return to ruins' : 'Voltar às ruínas'}</button>}
      <MapControlGuide language={language} scene="tunnel" />
      <div className="tunnel-region" aria-live="polite"><strong>{en ? caption[1] : caption[0]}</strong><span>{en ? caption[3] : caption[2]}</span></div>
      {error && <p className="lake-scene-error">{en ? '3D is unavailable in this browser.' : 'O 3D não está disponível neste navegador.'}</p>}
      {(near || atStart) && <div className="village-actions"><button onClick={interact}>
        {near ? (en ? 'Enter the dragon village' : 'Entrar no vilarejo do dragão')
          : en ? 'Return to the cove' : 'Voltar à enseada'} <kbd>E</kbd>
      </button></div>}
    </div>
    <div className="lake-touch" aria-label={en ? 'Boat controls' : 'Controles do barco'}>
      {[['arrowup', en ? 'Forward' : 'Frente', '↑'], ['arrowdown', en ? 'Back' : 'Trás', '↓']].map(([key, label, symbol]) =>
        <button key={key} type="button" aria-label={label} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); press(key, true); }}
          onPointerUp={() => press(key, false)} onPointerCancel={() => press(key, false)} onLostPointerCapture={() => press(key, false)}>{symbol}</button>)}
      <TouchInteract language={language} onInteract={interact} disabled={paused || (!near && !atStart)} />
    </div>
  </section>;
}
