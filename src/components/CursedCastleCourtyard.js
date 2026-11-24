import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { allowRunAndRotate } from './runAndRotate';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import { createAdventurer } from './VillageScene';
import { sceneFrameDelta } from './sceneFrameDelta';
import { createCourtyardWitch, witchDialogue, witchLineAt, witchVoices, WITCH_DIALOGUE_AT, WITCH_FLIGHT_END, WITCH_LAUGH_AT, WITCH_SCENE_END } from './courtyardWitch';
import { advanceWitchBattle, createWitchBattle, createWitchBattleFloor, createWitchLightning, witchLightningProgress, WITCH_LIGHTNING_HITS, WITCH_LIVES, WITCH_WAVES } from './witchBattle';
import './Lake.css';
import './CursedCastle.css';
import './DragonChamber.css';

export default function CursedCastleCourtyard({language,paused,reduceMotion,onExit,onStep,onSound,onWeather,onEncounterChange,onSpeak,onStopVoice,voiceEnabled,weatherEffects=true}) {
  const mount=useRef(null),keys=useRef(new Set()),state=useRef({});
  state.current={paused,reduceMotion,onStep,onSound,onWeather,onEncounterChange,weatherEffects};
  const sceneActive = useRef(false);
  const skipScene = useRef(null);
  const restartFight = useRef(null);
  const [intro, setIntro] = useState(false);
  const [line, setLine] = useState(-1);
  const [fight, setFight] = useState(null);
  useEffect(() => { if (paused) state.current.onSound?.('witch-stop'); }, [paused]);
  useEffect(() => () => onEncounterChange?.(false), [onEncounterChange]);
  useEffect(() => {
    if (!intro || line < 0 || paused || !voiceEnabled || !witchVoices[language]) return;
    onSpeak?.(witchDialogue[language][line], witchVoices[language]);
    return () => onStopVoice?.();
  }, [intro, line, paused, voiceEnabled, language, onSpeak, onStopVoice]);
  const [error,setError]=useState(false);const en=language==='en-US';
  useEffect(()=>{
    const el=mount.current;let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Pátio do Castelo / Castle Courtyard');el.appendChild(renderer.domElement);renderer.domElement.focus({preventScroll:true});
    const scene = new THREE.Scene();
    const sky = '#505b65';
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.FogExp2(sky, .047);
    scene.add(new THREE.HemisphereLight('#c6d6e3', '#303932', 1.65));
    const daylight = new THREE.DirectionalLight('#c4d3de', .65);
    daylight.position.set(-10, 20, 12);
    scene.add(daylight);
    const camera=new THREE.PerspectiveCamera(48,1,.1,120),materials=new Map();const material=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.94}));return materials.get(c);};
    const mesh=(p,g,c,x,y,z)=>{const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);p.add(m);return m;};const box=(p,w,h,d,c,x,y,z)=>mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z),sphere=(p,r,c,x,y,z)=>mesh(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z),cylinder=(p,r,h,c,x,y,z,n=8)=>mesh(p,new THREE.CylinderGeometry(r,r,h,n),c,x,y,z);
    const ground = mesh(scene, new THREE.PlaneGeometry(42, 52), '#252c2b', 0, -.08, 0);
    ground.rotation.x = -Math.PI / 2;
    const stones = ['#454e50', '#50585a', '#3e4849', '#49534e'];
    const pavers = new THREE.InstancedMesh(new THREE.BoxGeometry(2.06, .08, 2.4),
      new THREE.MeshStandardMaterial({ roughness: .65 }), 20 * 17);
    const paverTransform = new THREE.Matrix4(), paverColor = new THREE.Color();
    let paverIndex = 0;
    for (let row = 0; row < 20; row++) {
      for (let col = -8; col <= 8; col++) {
        const x = col * 2.15 + (row % 2) * 1.075;
        const z = -23.75 + row * 2.5;
        const color = stones[Math.abs(row * 7 + col * 13 + (row * col) % 5) % stones.length];
        pavers.setMatrixAt(paverIndex, paverTransform.makeTranslation(x, -.035, z));
        pavers.setColorAt(paverIndex, paverColor.set(color));
        paverIndex++;
      }
    }
    scene.add(pavers);

    for (const side of [-1, 1]) {
      box(scene, 1.4, 8, 50, '#424b55', side * 18.5, 4, 0);
      box(scene, 1.75, .45, 50, '#677379', side * 18.5, 8, 0);
      box(scene, 38, 8, 1.4, '#424b55', 0, 4, side * 24.5);
      box(scene, 38, .45, 1.75, '#677379', 0, 8, side * 24.5);
      for (let z = -20; z <= 20; z += 3.3) {
        box(scene, 1.55, 1.6, 1.5, '#536068', side * 18.5, 8.9, z);
        box(scene, .15, .85, 2.9, '#535e64', side * 17.74, 2, z);
      }
      for (let x = -15; x <= 15; x += 3) {
        box(scene, 1.55, 1.6, 1.55, '#536068', x, 8.9, side * 24.5);
      }
      for (const z of [-24, 24]) {
        cylinder(scene, 3.2, 12.5, '#4f5a62', side * 18.5, 6.25, z, 10);
        cylinder(scene, 3.45, .55, '#66747b', side * 18.5, 12.6, z, 10);
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          box(scene, .85, 1.3, .85, '#56646d',
            side * 18.5 + Math.cos(angle) * 2.9, 13.4, z + Math.sin(angle) * 2.9);
        }
      }
    }

    const puddleMaterial = new THREE.MeshStandardMaterial({ color: '#52636d', roughness: .18, metalness: .35 });
    for (let i = 0; i < 15; i++) {
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 20), puddleMaterial);
      puddle.position.set(((i * 67) % 279) / 10 - 14, .008, ((i * 113) % 406) / 10 - 20);
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.set(1 + (i % 5) * .24, .5 + (i % 4) * .22, 1);
      scene.add(puddle);
    }

    const rainCount = 1100;
    const rainPositions = new Float32Array(rainCount * 6);
    for (let i = 0; i < rainCount; i++) {
      const x = ((i * 173) % 4000) / 100 - 20;
      const y = ((i * 97) % 1500) / 100;
      const z = ((i * 277) % 5000) / 100 - 25;
      rainPositions.set([x, y, z, x - .11, y - .65, z + .06], i * 6);
    }
    const rainGeometry = new THREE.BufferGeometry();
    const rainAttribute = new THREE.BufferAttribute(rainPositions, 3).setUsage(THREE.DynamicDrawUsage);
    rainGeometry.setAttribute('position', rainAttribute);
    const rain = new THREE.LineSegments(rainGeometry,
      new THREE.LineBasicMaterial({ color: '#b5cadb', transparent: true, opacity: .53, depthWrite: false }));
    rain.frustumCulled = false;
    scene.add(rain);

    const traveler=createAdventurer(scene,{box,sphere,mesh,cylinder}),player=traveler.player;player.position.set(0,0,11);player.rotation.y=Math.PI;
    const witch = createCourtyardWitch(scene, { mesh, sphere, cylinder });
    const battleFloor = createWitchBattleFloor(scene);
    const lightning = createWitchLightning(scene);
    camera.position.set(2,4.5,17);
    const orbitCamera = camera.clone();
    const orbit=allowRunAndRotate(new OrbitControls(orbitCamera,renderer.domElement));orbit.target.set(0,1.2,11);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=5;orbit.maxDistance=15;orbit.maxPolarAngle=Math.PI/2-.07;orbit.update();
    const target = new THREE.Vector3(), cameraShift = new THREE.Vector3();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const clear=()=>keys.current.clear(),down=e=>{if(document.activeElement!==renderer.domElement||state.current.paused||sceneActive.current)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}},up=e=>keys.current.delete(e.key.toLowerCase());window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);renderer.domElement.addEventListener('blur',clear);
    let frame, last = performance.now(), time = 0, stepTimer = 0;
    let flight, sceneTime = 0, spoken = -1, laughed = false;
    const incomingView = new THREE.Vector3(), closeView = new THREE.Vector3();
    const sceneView = new THREE.Vector3(), look = new THREE.Vector3(), destination = new THREE.Vector3();
    const encounterTargetHeight = 2.75;
    let battle, fightTime = 0, witchFlightTime = 0, spinAngle = 0, hudKey = '';
    let witchLaughing = false;
    const setWitchLaughing = playing => { witchLaughing = playing; };
    const syncFight = () => {
      const seconds = Math.ceil(battle.remaining);
      const key = [battle.phase, battle.wave, battle.lives, battle.strikes, seconds, battle.hit].join('/');
      if (hudKey === key) return;
      hudKey = key;
      setFight({ phase: battle.phase, wave: battle.wave, lives: battle.lives, strikes: battle.strikes, seconds, hit: battle.hit });
    };
    const startFight = () => {
      battle = createWitchBattle(player.position);
      fightTime = witchFlightTime = 0;
      battleFloor.update(battle);
      syncFight();
      witch.root.visible = true;
      witch.root.position.copy(destination);
      witch.root.rotation.x = 0;
      lightning.visible = false;
      state.current.onSound?.('witch-stop');
      clear();
      state.current.onEncounterChange?.(true);
      renderer.domElement.focus({ preventScroll: true });
    };
    restartFight.current = () => {
      if (state.current.paused) return;
      player.position.set(0, 0, 6.8);
      player.rotation.y = Math.PI;
      startFight();
    };
    const finishScene = () => {
      if (!sceneActive.current || state.current.paused) return;
      sceneActive.current = false;
      setIntro(false);
      setLine(-1);
      state.current.onSound?.('witch-stop');
      witch.root.rotation.z = 0;
      witch.mouth.scale.y = .36;
      witch.head.rotation.x = 0;
      orbit.target.set(player.position.x, encounterTargetHeight, player.position.z);
      orbitCamera.position.set(player.position.x + 2, encounterTargetHeight + 1.6, player.position.z + 7.5);
      startFight();
    };
    skipScene.current = finishScene;
    const startScene = () => {
      sceneActive.current = true;
      setIntro(true);
      clear();
      destination.set(player.position.x * .65, 4, player.position.z - 5.4);
      flight = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-13, 10.8, -20),
        new THREE.Vector3(9, 7, -13),
        new THREE.Vector3(4, 3.8, -5),
        destination.clone(),
      ]);
      incomingView.copy(camera.position);
      witch.root.visible = true;
    };
    const animate = now => {
      frame = requestAnimationFrame(animate);
      const dt = sceneFrameDelta(now, last);
      last = now;
      const { paused: isPaused, reduceMotion: reduced, onSound } = state.current;
      rain.visible = state.current.weatherEffects;
      state.current.onWeather?.(rain.visible && !isPaused ? 1 : 0);
      if (!isPaused) {
        if (rain.visible && !state.current.reduceMotion) {
          for (let i = 0; i < rainCount; i++) {
            const offset = i * 6;
            let y = rainPositions[offset + 1] - (8 + i % 7 * .55) * dt;
            if (y < 0) y += 15;
            rainPositions[offset + 1] = y;
            rainPositions[offset + 4] = y - .65;
          }
          rainAttribute.needsUpdate = true;
        }
        time += dt;
        let moving = false;
        if (sceneActive.current) {
          sceneTime += dt;
          if (sceneTime >= WITCH_LAUGH_AT && !laughed) {
            laughed = true;
            onSound?.('witch-intro-laugh');
          }
          const nextLine = witchLineAt(sceneTime);
          if (nextLine !== spoken) {
            spoken = nextLine;
            if (nextLine === 0) onSound?.('witch-stop');
            setLine(nextLine);
          }
          if (sceneTime >= WITCH_SCENE_END) finishScene();
        } else {
          const x = Number(keys.current.has('d') || keys.current.has('arrowright'))
            - Number(keys.current.has('a') || keys.current.has('arrowleft'));
          const z = Number(keys.current.has('s') || keys.current.has('arrowdown'))
            - Number(keys.current.has('w') || keys.current.has('arrowup'));
          if ((x || z) && battle?.phase !== 'lost') {
            const direction = cameraRelativeDirection(camera, x, z);
            const running = keys.current.has('shift');
            const speed = running ? 6.5 : 4;
            const nx = player.position.x + direction.x * speed * dt;
            const nz = player.position.z + direction.z * speed * dt;
            if (Math.abs(nx) < 16.5 && Math.abs(nz) < 22 && Math.hypot(18.5 - Math.abs(nx), 24 - Math.abs(nz)) > 3.55) {
              player.position.set(nx, 0, nz);
              player.rotation.y = Math.atan2(direction.x, direction.z);
              moving = true;
              stepTimer -= dt;
              if (stepTimer <= 0) {
                state.current.onStep?.();
                stepTimer = running ? .3 : .48;
              }
            }
          }
          if (!moving) stepTimer = 0;
          if (!flight && player.position.z < 7) startScene();
        }
        if (battle && battle.phase !== 'lost' && battle.phase !== 'won') {
          fightTime += dt;
          const lastPhase = battle.phase, lastLives = battle.lives;
          advanceWitchBattle(battle, dt, player.position);
          if (lastPhase !== battle.phase) {
            battleFloor.update(battle);
            if (lastPhase === 'warning') onSound?.('witch-electric-floor');
            if (battle.phase === 'ascent' || battle.phase === 'lost') onSound?.('witch-stop');
            if (battle.phase === 'strike') {
              spinAngle = 0;
              const struckBattle = battle;
              if (onSound) {
                struckBattle.reactionPending = true;
                onSound('witch-lightning', () => { struckBattle.reactionPending = false; });
              }
            }
            if (lastPhase === 'spin' && battle.reactionPending) onSound?.('witch-stop');
            if (battle.phase === 'won' || battle.phase === 'lost') {
              clear();
              state.current.onEncounterChange?.(false);
              if (battle.phase === 'won') witch.root.visible = false;
            }
          }
          if (battle.lives < lastLives) onSound?.('witch-hit');
          syncFight();
          battleFloor.animate(fightTime, reduced);
          const spinning = battle.phase === 'strike' || battle.phase === 'spin';
          const aerialPhase = spinning || ['ascent', 'descent', 'fall'].includes(battle.phase);
          const dodging = ['warning', 'shock', 'recovery'].includes(battle.phase);
          if (dodging) onSound?.('witch-battle-laugh', setWitchLaughing);
          const lift = witchLightningProgress(battle);
          if (!aerialPhase) witchFlightTime += dt;
          if (!reduced) {
            const drift = THREE.MathUtils.smoothstep(witchFlightTime, 0, 2.8);
            witch.root.position.set(
              THREE.MathUtils.lerp(destination.x, Math.sin(witchFlightTime * .62) * 9, drift),
              THREE.MathUtils.lerp(destination.y, 4.5 + Math.sin(witchFlightTime * 2) * .32, drift),
              THREE.MathUtils.lerp(destination.z, Math.cos(witchFlightTime * .62) * 7 - 4, drift),
            );
            witch.root.rotation.z = Math.sin(witchFlightTime * .62) * .2 * drift;
          } else {
            witch.root.position.copy(destination);
            witch.root.rotation.z = 0;
          }
          if (battle.phase === 'fall') {
            witch.root.position.y = .5 + (witch.root.position.y + 5.8 - .5) * (reduced ? 0 : lift);
            witch.root.rotation.x = reduced ? 0 : (1 - lift) * 1.2;
          } else {
            const height = reduced ? Number(spinning) : THREE.MathUtils.smoothstep(lift, 0, 1);
            witch.root.position.y += height * 5.8;
            witch.root.rotation.x = !reduced && spinning ? .13 : 0;
          }
          if (spinning && !reduced) spinAngle += dt * 10;
          const towardPlayer = Math.atan2(player.position.x - witch.root.position.x, player.position.z - witch.root.position.z);
          witch.root.rotation.y = towardPlayer + (!reduced && spinning ? spinAngle : 0);
          const cackling = dodging && witchLaughing && !reduced;
          witch.head.rotation.x = cackling ? -.18 : 0;
          witch.mouth.scale.y = cackling ? .55 + Math.abs(Math.sin(time * 11)) * .57 : .36;
          lightning.visible = battle.phase === 'strike';
          if (lightning.visible) lightning.position.copy(witch.root.position);
        }
        traveler.limbs.forEach((limb, i) => {
          limb.rotation.x = moving && !reduced ? Math.sin(time * 9) * (i % 2 === 0 ? .5 : -.45) * (i < 2 ? 1 : -1) : 0;
        });
      } else clear();

      if (sceneActive.current) {
        const approach = reduced ? 1 : THREE.MathUtils.smoothstep(sceneTime, 0, WITCH_FLIGHT_END);
        flight.getPoint(approach, witch.root.position);
        const witchPosition = witch.root.position;
        if (!reduced) witchPosition.y += Math.sin(sceneTime * 3) * .13 * approach;
        witch.root.rotation.y = Math.atan2(player.position.x - witchPosition.x, player.position.z - witchPosition.z);
        witch.root.rotation.z = reduced ? 0 : Math.sin(approach * Math.PI * 2) * .26;
        witch.cloak.rotation.x = .9 + (reduced ? 0 : Math.sin(sceneTime * 6) * .12);
        const cackling = sceneTime >= WITCH_LAUGH_AT && sceneTime < WITCH_DIALOGUE_AT;
        witch.mouth.scale.y = reduced || (!cackling && spoken < 0) ? .36 : .55 + Math.abs(Math.sin(sceneTime * 11)) * .62;
        witch.head.rotation.x = !reduced && cackling ? -.23 : 0;

        const zoom = reduced ? 1 : THREE.MathUtils.smoothstep(sceneTime, 3.2, 6);
        closeView.set(destination.x + 2.1, destination.y + 1.55, destination.z + 6.3);
        sceneView.lerpVectors(incomingView, closeView, zoom);
        camera.position.copy(sceneView);
        look.lerpVectors(target, witchPosition, reduced ? 1 : THREE.MathUtils.smoothstep(sceneTime, 0, .6));
        look.y += reduced ? 1 : THREE.MathUtils.smoothstep(sceneTime, 0, .6);
        camera.lookAt(look);
        orbit.enabled = false;
        renderer.render(scene, camera);
        return;
      }
      target.set(player.position.x, flight ? encounterTargetHeight : 1.2, player.position.z);
      orbitCamera.position.add(cameraShift.subVectors(target, orbit.target));
      orbit.target.copy(target);
      orbit.enabled = !state.current.paused;
      orbit.enableDamping = !state.current.reduceMotion;
      orbit.update();
      camera.position.set(
        THREE.MathUtils.clamp(orbitCamera.position.x, -17.45, 17.45),
        orbitCamera.position.y,
        THREE.MathUtils.clamp(orbitCamera.position.z, -23.45, 23.45),
      );
      const skyFocus = battle ? witchLightningProgress(battle) : 0;
      look.copy(target);
      if (skyFocus > 0) look.lerp(witch.root.position, reduced ? Number(battle.phase === 'strike' || battle.phase === 'spin') * .8 : skyFocus * .82);
      camera.lookAt(look);
      renderer.render(scene,camera);};frame=requestAnimationFrame(animate);
    return()=>{skipScene.current=null;restartFight.current=null;state.current.onSound?.('witch-stop');state.current.onWeather?.(0);cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);renderer.domElement.removeEventListener('blur',clear);clear();orbit.dispose();scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(![...materials.values()].includes(m))m.dispose();});});materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  const press=(key,down)=>{if(paused||sceneActive.current)return;if(down)keys.current.add(key);else keys.current.delete(key);};
  const fightActive = fight && !['won', 'lost'].includes(fight.phase);
  const fightMessages = {
    warning: en ? 'Get to a green safe zone.' : 'Corra para uma área verde.',
    shock: fight?.hit
      ? (en ? 'You were shocked! Stay on green.' : 'Você levou um choque! Fique no verde.')
      : (en ? 'The floor is electrified! Stay on green.' : 'Piso eletrificado! Fique no verde.'),
    recovery: en ? 'Watch for the next safe zones.' : 'Fique de olho nas próximas áreas seguras.',
    ascent: en ? 'The witch is rising into the storm.' : 'A bruxa está subindo em direção à tempestade.',
    strike: en ? 'Lightning struck the witch!' : 'O raio atingiu a bruxa!',
    spin: en ? 'The witch is spinning out of control!' : 'A bruxa está girando sem controle!',
    descent: en ? 'The witch is descending.' : 'A bruxa está descendo.',
    fall: en ? 'The witch is falling!' : 'A bruxa está caindo!',
  };
  return <section className="lake cursed-castle castle-courtyard"><div className="lake-viewport"><div ref={mount} className="lake-canvas"/><button className="lake-exit" onClick={onExit}>{en?'Return to outskirts':'Voltar aos arredores'}</button><div className="cursed-heading"><strong>{en?'CASTLE COURTYARD':'PÁTIO DO CASTELO'}</strong></div>{error&&<p className="lake-scene-error">{en?'3D is unavailable in this browser.':'O 3D n\u00e3o est\u00e1 dispon\u00edvel neste navegador.'}</p>}{intro && <button type="button" className="chamber-skip" disabled={paused} onClick={() => skipScene.current?.()}>{en ? 'Skip cutscene' : 'Pular cutscene'}</button>}{intro && line !== -1 && <div className="chamber-subtitle" role="status" aria-live="polite"><strong>{en ? 'THE WITCH' : 'A BRUXA'}</strong><p>{line === -2 ? (en ? '[The witch cackles]' : '[A bruxa gargalha]') : witchDialogue[en ? 'en-US' : 'pt-BR'][line]}</p></div>}{fight && <div className="witch-battle-status">
      <span className="witch-lives" role="img" aria-label={en ? `${fight.lives} of ${WITCH_LIVES} lives` : `${fight.lives} de ${WITCH_LIVES} vidas`}>{'♥'.repeat(fight.lives)}{'♡'.repeat(WITCH_LIVES - fight.lives)}</span>
      <small>{en ? `Wave ${fight.wave}/${WITCH_WAVES}` : `Onda ${fight.wave}/${WITCH_WAVES}`}</small>
      <small>{en ? `Lightning strikes ${fight.strikes}/${WITCH_LIGHTNING_HITS}` : `Raios na bruxa ${fight.strikes}/${WITCH_LIGHTNING_HITS}`}</small>
      {fightActive && <><strong role="status" className={fight.phase === 'shock' ? 'witch-danger' : 'witch-refuge'}>{fightMessages[fight.phase]}</strong>{fight.phase === 'warning' && <span>{en ? `Shock in ${fight.seconds}s` : `Choque em ${fight.seconds}s`}</span>}</>}
    </div>}
    {fight && !fightActive && <div className="battle-result" role="region" aria-label={en ? 'Battle result' : 'Resultado da batalha'}>
      <strong role="status">{fight.phase === 'won' ? (en ? 'The witch is defeated!' : 'Bruxa derrotada!') : (en ? 'You fell in battle.' : 'Você caiu em batalha.')}</strong>
      <button type="button" disabled={paused} onClick={() => restartFight.current?.()}>{en ? 'Fight again' : 'Lutar novamente'}</button>
    </div>}
    <div className="scene-guide map-control-guide" hidden={intro}><div className="scene-caption"><span className="live-dot"/> {en?'CASTLE COURTYARD':'PÁTIO DO CASTELO'}</div><div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en?'or arrows to walk':'ou setas para caminhar'} {' '}<kbd>Shift</kbd> {en?'run':'correr'}</span><span className="keyboard-guide">{en?'Drag to rotate':'Arraste para girar'}</span><span className="touch-guide">{en?'Use arrows to walk and drag to rotate':'Use as setas para caminhar e arraste para girar'}</span></div></div></div><div className="lake-touch" aria-label={en?'Walking controls':'Controles de caminhada'}>{[['arrowleft',en?'Left':'Esquerda','\u2190'],['arrowup',en?'Forward':'Frente','\u2191'],['arrowdown',en?'Back':'Tr\u00e1s','\u2193'],['arrowright',en?'Right':'Direita','\u2192']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} disabled={intro || fight?.phase === 'lost'} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}</div></section>;
}
