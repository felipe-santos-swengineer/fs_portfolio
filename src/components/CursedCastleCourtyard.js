import TouchInteract from './TouchInteract';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { allowRunAndRotate } from './runAndRotate';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import { createAdventurer } from './VillageScene';
import { sceneFrameDelta } from './sceneFrameDelta';
import { COURTYARD_EXIT_Z, createCourtyardRewards } from './castleCourtyardProgress';
import { createCourtyardWitch, witchDialogue, witchLineAt, witchVoices, WITCH_DIALOGUE_AT, WITCH_FLIGHT_END, WITCH_LAUGH_AT, WITCH_SCENE_END } from './courtyardWitch';
import { advanceWitchBattle, createWitchBattle, createWitchBattleFloor, createWitchGroundLightning, createWitchLightning, createWitchPoison, createWitchShockFlash, isWitchRefuge, witchGroundCastProgress, witchLightningProgress, witchPoisonProgress, WITCH_LIGHTNING_HITS, WITCH_LIVES, WITCH_WAVES } from './witchBattle';
import { createThroneEntrance, BOARD_Z, THRONE_DOOR_Z } from './throneEntrance';
import { furnishThroneEntrance } from './throneEntranceDecor';
import WizardChess from './WizardChess';
import './Lake.css';
import './CursedCastle.css';
import './DragonChamber.css';

export default function CursedCastleCourtyard({ campaignNavigation,language,paused,reduceMotion,onExit,onAdvance,onStep,onSound,onWeather,onEncounterChange,onSpeak,onStopVoice,voiceEnabled,weatherEffects=true,interior=false,completed=false,throneUnlocked=false,onThroneUnlock,onChessPieceFocus,onChessAttack,onChessOpenChange}) {
  const mount=useRef(null),keys=useRef(new Set()),state=useRef({});
  const [chessOpen, setChessOpen] = useState(false);
  useEffect(() => {
    if (!chessOpen || !onChessOpenChange) return;
    onChessOpenChange(true);
    return () => onChessOpenChange(false);
  }, [chessOpen, onChessOpenChange]);
  const [sealRevealed, setSealRevealed] = useState(false);
  const [nearSeal, setNearSeal] = useState(false);
  const chessInteraction = useRef(null);
  const chessControls = useRef(null);
  const chessGesture = useRef(null);
  const canOrbitChess = () => chessOpen && !paused && chessInteraction.current?.show3D;
  const startChessGesture = event => {
    if (!canOrbitChess() || event.button !== 0) return;
    const gesture = chessGesture.current ?? { points: new Map(), dragged: false };
    if (gesture.points.size >= 2 || (gesture.points.size && event.pointerType !== 'touch')) return;
    gesture.points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.points.size === 2) gesture.dragged = true;
    chessGesture.current = gesture;
    event.currentTarget.setPointerCapture(event.pointerId);
    mount.current?.querySelector('canvas')?.focus({ preventScroll: true });
  };
  const moveChessGesture = event => {
    const gesture = chessGesture.current;
    const from = gesture?.points.get(event.pointerId);
    if (!canOrbitChess() || !from) return;
    const to = { x: event.clientX, y: event.clientY };
    if (gesture.points.size === 2) {
      const other = [...gesture.points.entries()].find(([id]) => id !== event.pointerId)[1];
      const previous = Math.hypot(from.x - other.x, from.y - other.y);
      const next = Math.hypot(to.x - other.x, to.y - other.y);
      if (previous > 4 && next > 4) chessControls.current?.zoom(next / previous);
    } else {
      if (!gesture.dragged && Math.hypot(to.x - from.x, to.y - from.y) < 6) return;
      gesture.dragged = true;
      chessControls.current?.rotate((from.x - to.x) * .012, (to.y - from.y) * .008);
    }
    gesture.points.set(event.pointerId, to);
  };
  const endChessGesture = event => {
    const gesture = chessGesture.current;
    if (!gesture?.points.delete(event.pointerId) || gesture.points.size) return;
    chessGesture.current = null;
    if (event.type === 'pointerup' && !gesture.dragged && canOrbitChess()) chessControls.current?.pick(event);
  };
  const [chessBoard, setChessBoard] = useState(null);
  const [capturePending, setCapturePending] = useState(false);
  const updateChessBoard = useCallback(next => {
    const captured = Boolean(next.move?.captured);
    setCapturePending(captured && Boolean(chessControls.current));
    if (captured && !chessControls.current) state.current.onChessAttack?.(next.move.piece);
    setChessBoard(next);
  }, []);
  const showChess = () => { keys.current.clear(); setChessOpen(true); };
  const closeChess = () => {
    keys.current.clear();
    chessGesture.current = null;
    setChessOpen(false);
    mount.current?.querySelector('canvas')?.focus({ preventScroll: true });
  };
  const releaseSeal = () => {
    onSound?.('passage');
    onThroneUnlock?.();
  };
  const skipChess = () => {
    closeChess();
    releaseSeal();
  };
  state.current={onChessAttack,chessOpen,throneUnlocked,chessBoard,showChess,paused,reduceMotion,onStep,onSound,onWeather,onEncounterChange,onAdvance,weatherEffects};
  const sceneActive = useRef(false);
  const skipScene = useRef(null);
  const restartFight = useRef(null);
  const skipFight = useRef(null);
  const rewardAction = useRef(null);
  const [intro, setIntro] = useState(false);
  const [line, setLine] = useState(-1);
  const [fight, setFight] = useState(null);
  const [reward, setReward] = useState(completed ? 'exit' : null);
  const [nearReward, setNearReward] = useState(false);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label',interior ? 'Câmara do Guardião Arcano / Arcane Guardian Chamber' : 'Pátio do Castelo / Castle Courtyard');el.appendChild(renderer.domElement);renderer.domElement.focus({preventScroll:true});
    const scene = new THREE.Scene();
    const sky = interior ? '#282c39' : '#505b65';
    scene.background = new THREE.Color(sky);
    scene.fog = new THREE.FogExp2(sky, interior ? .057 : .047);
    scene.add(new THREE.HemisphereLight('#c6d6e3', '#303932', 1.65));
    const daylight = new THREE.DirectionalLight(interior ? '#a8a8d2' : '#c4d3de', .65);
    daylight.position.set(-10, 20, 12);
    scene.add(daylight);
    const camera=new THREE.PerspectiveCamera(interior ? 52 : 48,1,.1,120),materials=new Map();const material=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.94}));return materials.get(c);};
    const mesh=(p,g,c,x,y,z)=>{const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);p.add(m);return m;};const box=(p,w,h,d,c,x,y,z)=>mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z),sphere=(p,r,c,x,y,z)=>mesh(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z),cylinder=(p,r,h,c,x,y,z,n=8)=>mesh(p,new THREE.CylinderGeometry(r,r,h,n),c,x,y,z);
    const ground = mesh(scene, new THREE.PlaneGeometry(42, 52), '#252c2b', 0, -.08, 0);
    ground.rotation.x = -Math.PI / 2;
    if (!interior) {
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
    }

    const puddleMaterial = new THREE.MeshStandardMaterial({ color: '#52636d', roughness: .18, metalness: .35 });
    const rainPuddles = new THREE.Group();
    scene.add(rainPuddles);
    for (let i = 0; i < 15; i++) {
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 20), puddleMaterial);
      puddle.position.set(((i * 67) % 279) / 10 - 14, .008, ((i * 113) % 406) / 10 - 20);
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.set(1 + (i % 5) * .24, .5 + (i % 4) * .22, 1);
      rainPuddles.add(puddle);
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

    const entranceDecor = interior ? furnishThroneEntrance(scene, { mesh, box, cylinder, sphere }, BOARD_Z, THRONE_DOOR_Z) : null;
    const throne = interior ? createThroneEntrance(scene, { mesh, box, cylinder, sphere }) : null;
    const clickChess = event => {
      const game = chessInteraction.current;
      if (!state.current.chessOpen || state.current.paused || !game?.show3D) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      const point = new THREE.Vector2((event.clientX - bounds.left) * 2 / bounds.width - 1,
        1 - (event.clientY - bounds.top) * 2 / bounds.height);
      const square = throne.pick(point);
      if (square) game.pick(square);
    };
    if (throne) chessControls.current = {
      pick: clickChess, rotate: throne.rotate, zoom: throne.zoom, reset: () => throne.resetView(),
    };
    const wheelChess = event => {
      if (state.current.paused || !chessInteraction.current?.show3D) return;
      event.preventDefault();
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1;
      throne.zoom(Math.exp(THREE.MathUtils.clamp(-event.deltaY * scale * .0018, -1, 1)));
    };
    if (throne) renderer.domElement.addEventListener('wheel', wheelChess, { passive: false });
    let revealed = false, nearDoor = false, entering = false, lastBoard = null;
    const traveler=createAdventurer(scene,{box,sphere,mesh,cylinder}),player=traveler.player;player.position.set(0,0,completed ? COURTYARD_EXIT_Z + 3.6 : 11);player.rotation.y=Math.PI;
    const rewards = createCourtyardRewards(scene, { box, mesh });
    let rewardPhase = completed ? 'exit' : null;
    let near = false;
    rewards.exit.visible = completed;
    const witch = createCourtyardWitch(scene, { mesh, sphere, cylinder });
    const shockFlash = createWitchShockFlash(player, witch.root);
    const battleFloor = createWitchBattleFloor(scene);
    const updatePoison = createWitchPoison(scene);
    const updateGroundLightning = createWitchGroundLightning(scene);
    const lightningImpact = new THREE.Vector3();
    const attackOrigin = new THREE.Vector3();
    const poisonApproach = new THREE.Vector3();
    const poisonExit = new THREE.Vector3();
    const poisonTarget = new THREE.Vector3();
    let poisonExitTime = 0;
    const lightning = createWitchLightning(scene);
    camera.position.set(interior ? 0 : 2,4.5,player.position.z + 6);
    const walkingViewHeight = interior ? 2.2 : 1.2;
    const orbitCamera = camera.clone();
    const orbit=allowRunAndRotate(new OrbitControls(orbitCamera,renderer.domElement));orbit.target.set(0,walkingViewHeight,player.position.z);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=5;orbit.maxDistance=15;orbit.maxPolarAngle=Math.PI/2-.07;orbit.update();
    const target = new THREE.Vector3(), cameraShift = new THREE.Vector3();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const clear=()=>keys.current.clear(),down=e=>{if (state.current.chessOpen && !state.current.paused && e.key === 'Escape') {
      chessInteraction.current?.onClose();
      return;
    }
    if (document.activeElement === renderer.domElement && !state.current.paused && chessInteraction.current?.show3D) {
      const direction = { ArrowLeft: [-.26, 0], ArrowRight: [.26, 0], ArrowUp: [0, .13], ArrowDown: [0, -.13] }[e.key];
      if (direction) {
        e.preventDefault();
        throne.rotate(...direction);
        return;
      }
      if (e.key === '+' || e.key === '=' || e.key === '-') {
        e.preventDefault();
        throne.zoom(e.key === '-' ? 1 / 1.18 : 1.18);
        return;
      }
    }
    if(document.activeElement!==renderer.domElement||state.current.paused||state.current.chessOpen||sceneActive.current)return;const k=e.key.toLowerCase();if(k==='e'&&!e.repeat) {
      if (throne && nearDoor && !state.current.throneUnlocked) state.current.showChess();
      else rewardAction.current?.();
    }if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}},up=e=>keys.current.delete(e.key.toLowerCase());window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);renderer.domElement.addEventListener('blur',clear);
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
    const setProgress = phase => {
      rewardPhase = phase;
      setReward(phase);
      near = false;
      setNearReward(false);
      rewards.key.visible = phase === 'key';
      rewards.exit.visible = phase === 'exit';
    };
    const endFight = () => {
      clear();
      battleFloor.update(battle);
      updatePoison(battle);
      updateGroundLightning(false);
      lightning.visible = false;
      state.current.onSound?.('witch-stop');
      state.current.onEncounterChange?.(false);
      if (battle.phase === 'won') {
        witch.root.visible = false;
        rewards.key.position.set(THREE.MathUtils.clamp(witch.root.position.x, -14, 14), .95,
          THREE.MathUtils.clamp(witch.root.position.z, -19, 19));
        setProgress('key');
      }
      syncFight();
    };
    skipFight.current = () => {
      if (state.current.paused || !battle || ['won', 'lost'].includes(battle.phase)) return;
      battle.phase = 'won';
      battle.remaining = 0;
      endFight();
      renderer.domElement.focus({ preventScroll: true });
    };
    rewardAction.current = () => {
      if (state.current.paused || !near) return;
      if (rewardPhase === 'key') {
        setProgress('exit');
        renderer.domElement.focus({ preventScroll: true });
      } else if (rewardPhase === 'exit') {
        setProgress('departing');
        clear();
        state.current.onAdvance?.();
      }
    };
    const startFight = () => {
      shockFlash.reset();
      battle = createWitchBattle(player.position);
      fightTime = witchFlightTime = 0;
      battleFloor.update(battle);
      updatePoison(battle);
      updateGroundLightning(false);
      rainPuddles.visible = false;
      poisonExitTime = 0;
      syncFight();
      witch.root.visible = true;
      witch.root.position.copy(destination);
      witch.root.rotation.x = 0;
      witch.poseAttack(0, 0);
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
      rain.visible = !interior && state.current.weatherEffects;
      rainPuddles.visible = rain.visible && !battle && !completed;
      state.current.onWeather?.(rain.visible && !isPaused ? 1 : 0);
      if (throne) {
        const { chessBoard, throneUnlocked } = state.current;
        if (chessBoard && lastBoard !== chessBoard) {
          const { position, move } = chessBoard;
          if (move?.captured) {
            throne.capture(position, move, kind => {
              if (state.current.chessOpen) state.current.onChessAttack?.(kind);
            }, () => setCapturePending(false));
          } else throne.updateBoard(position, move);
          lastBoard = chessBoard;
        }
        throne.animate(isPaused ? 0 : dt, revealed, throneUnlocked && !state.current.chessOpen, reduced, time);
        const game = chessInteraction.current;
        throne.highlight(game?.show3D ? game.selected : null, game?.show3D ? game.targets : null);
        player.visible = !game?.show3D;
        entranceDecor.update(isPaused ? 0 : dt, {
          reduced, revealed, unlocked: throneUnlocked, chessView: game?.show3D,
          showMist: state.current.weatherEffects && !game?.show3D,
        });
        if (state.current.chessOpen && game?.show3D) {
          orbit.enabled = false;
          const hudFraction = (game.hudHeight.current + 16) / el.clientHeight;
          const chessCamera = throne.view(camera.aspect, hudFraction);
          entranceDecor.updateArchitectureView(chessCamera.position, true);
          renderer.render(scene, chessCamera);
          return;
        }
      }
      if (isPaused || state.current.chessOpen) clear();
      if (!isPaused && !state.current.chessOpen) {
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
            if (Math.abs(nx) < (interior ? 9.3 : 16.5) && Math.abs(nz) < 22
              && (!throne || (!entranceDecor.blocks(nx, nz) && !throne.blocks(nx, nz, revealed, state.current.throneUnlocked)
                && (nz > THRONE_DOOR_Z + .45 || (state.current.onAdvance && state.current.throneUnlocked && Math.abs(nx) < 1.65))))
              && Math.hypot(18.5 - Math.abs(nx), 24 - Math.abs(nz)) > 3.55) {
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
          if (throne) {
            const { x: px, z: pz } = player.position;
            const close = Math.hypot(px, pz - THRONE_DOOR_Z) < 12.6;
            if (close && !revealed) {
              revealed = true;
              setSealRevealed(true);
              onSound?.('rune');
            }
            if (close !== nearDoor) {
              nearDoor = close;
              setNearSeal(close);
            }
            if (!entering && state.current.onAdvance && state.current.throneUnlocked && Math.abs(px) < 1.65 && pz <= THRONE_DOOR_Z + .65) {
              entering = true;
              clear();
              state.current.onAdvance?.();
              return;
            }
          }
          if (!moving) stepTimer = 0;
          if (!interior && !completed && !flight && player.position.z < 7) startScene();
          if (rewardPhase === 'key' || rewardPhase === 'exit') {
            const object = rewardPhase === 'key' ? rewards.key : rewards.exit;
            const distance = Math.hypot(object.position.x - player.position.x, object.position.z - player.position.z);
            const close = distance <= 3;
            if (near !== close) {
              near = close;
              setNearReward(close);
            }
            if (rewardPhase === 'key' && !reduced) {
              rewards.key.position.y = .95 + Math.sin(time * 3) * .12;
              rewards.key.rotation.y = time * 1.3;
            }
            if (distance <= 1.05) rewardAction.current();
          }
        }
        if (battle && battle.phase !== 'lost' && battle.phase !== 'won') {
          fightTime += dt;
          const lastPhase = battle.phase, lastLives = battle.lives, wasShocked = battle.hit;
          advanceWitchBattle(battle, dt, player.position);
          if (battle.hit && !wasShocked) shockFlash.player();
          if (lastPhase !== battle.phase) {
            battleFloor.update(battle);
            if (battle.phase === 'poisonWarning') {
              poisonApproach.copy(witch.root.position);
            }
            if (lastPhase === 'poison' && battle.phase === 'warning') {
              poisonExit.copy(witch.root.position);
              poisonExitTime = 1;
            }
            if (battle.phase === 'groundCast') {
              lightningImpact.set(witch.root.position.x, .035, witch.root.position.z + 1.4);
              if (isWitchRefuge(battle.safe, lightningImpact)) {
                const refuge = battle.safe.find(cell => isWitchRefuge([cell], lightningImpact));
                lightningImpact.x = refuge.x + 2.6;
              }
              onSound?.('witch-stop');
            }
            if (lastPhase === 'groundCast') onSound?.('witch-electric-floor');
            if (battle.phase === 'ascent' || battle.phase === 'lost') onSound?.('witch-stop');
            if (battle.phase === 'strike') {
              shockFlash.witch();
              spinAngle = 0;
              const struckBattle = battle;
              if (onSound) {
                struckBattle.reactionPending = true;
                onSound('witch-lightning', () => { struckBattle.reactionPending = false; });
              }
            }
            if (lastPhase === 'spin' && battle.reactionPending) onSound?.('witch-stop');
            if (battle.phase === 'won' || battle.phase === 'lost') {
              endFight();
            }
          }
          if (battle.lives < lastLives) onSound?.('witch-hit');
          syncFight();
          battleFloor.animate(fightTime, reduced);
          const spinning = battle.phase === 'strike' || battle.phase === 'spin';
          const aerialPhase = spinning || ['ascent', 'descent', 'fall'].includes(battle.phase);
          const poisoning = battle.phase === 'poisonWarning' || battle.phase === 'poison';
          const canLaugh = poisoning || battle.phase === 'warning' || battle.phase === 'recovery';
          if (canLaugh) onSound?.('witch-battle-laugh', setWitchLaughing);
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
          let pour = 0;
          if (poisoning) {
            const { drops } = battle.poison;
            const first = drops[0], last = drops[drops.length - 1];
            const progress = witchPoisonProgress(battle);
            poisonTarget.set(first.x, 2.4, first.z);
            if (battle.phase === 'poisonWarning') {
              witch.root.position.lerpVectors(poisonApproach, poisonTarget, progress);
              pour = .35 * progress;
            } else {
              witch.root.position.set(THREE.MathUtils.lerp(first.x, last.x, progress), 2.4,
                THREE.MathUtils.lerp(first.z, last.z, progress));
              pour = THREE.MathUtils.lerp(.35, 1, THREE.MathUtils.smoothstep(battle.poison.elapsed, 0, .12))
                * (1 - THREE.MathUtils.smoothstep(battle.poison.elapsed, last.at, last.at + .45));
            }
            witch.root.rotation.set(0, Math.atan2(last.x - first.x, last.z - first.z), reduced ? 0 : -.18);
          } else if (battle.phase === 'fall') {
            witch.root.position.y = .5 + (witch.root.position.y + 5.8 - .5) * (reduced ? 0 : lift);
            witch.root.rotation.x = reduced ? 0 : (1 - lift) * 1.2;
          } else {
            const height = reduced ? Number(spinning) : THREE.MathUtils.smoothstep(lift, 0, 1);
            witch.root.position.y += height * 5.8;
            witch.root.rotation.x = !reduced && spinning ? .13 : 0;
          }
          if (spinning && !reduced) spinAngle += dt * 10;
          const towardPlayer = Math.atan2(player.position.x - witch.root.position.x, player.position.z - witch.root.position.z);
          if (!poisoning) {
            const aim = battle.phase === 'groundCast' || battle.phase === 'shock'
              ? Math.atan2(lightningImpact.x - witch.root.position.x, lightningImpact.z - witch.root.position.z)
              : towardPlayer;
            witch.root.rotation.y = aim + (!reduced && spinning ? spinAngle : 0);
          }
          if (poisonExitTime > 0) {
            poisonExitTime = Math.max(0, poisonExitTime - dt);
            witch.root.position.lerp(poisonExit, poisonExitTime);
          }
          const cackling = canLaugh && witchLaughing && !reduced;
          witch.head.rotation.x = cackling ? -.18 : 0;
          witch.mouth.scale.y = cackling ? .55 + Math.abs(Math.sin(time * 11)) * .57 : .36;
          lightning.visible = battle.phase === 'strike';
          if (lightning.visible) lightning.position.copy(witch.root.position);
          const cast = witchGroundCastProgress(battle);
          witch.poseAttack(reduced && cast > 0 && cast < 1 ? (cast < .45 ? .44 : .72) : cast, pour);
          updateGroundLightning(battle.phase === 'shock' && cast < .91,
            witch.castingHand.getWorldPosition(attackOrigin), lightningImpact);
          updatePoison(battle, poisoning ? witch.spout.getWorldPosition(attackOrigin) : undefined, reduced);
        }
        shockFlash.update(dt, reduced);
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
      target.set(player.position.x, flight ? encounterTargetHeight : walkingViewHeight, player.position.z);
      orbitCamera.position.add(cameraShift.subVectors(target, orbit.target));
      orbit.target.copy(target);
      orbit.enabled = !state.current.paused && !state.current.chessOpen;
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
      entranceDecor?.updateArchitectureView(camera.position);
      renderer.render(scene,camera);};frame=requestAnimationFrame(animate);
    return()=>{chessControls.current=null;chessGesture.current=null;skipScene.current=null;restartFight.current=null;skipFight.current=null;rewardAction.current=null;state.current.onSound?.('witch-stop');state.current.onWeather?.(0);cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);renderer.domElement.removeEventListener('blur',clear);renderer.domElement.removeEventListener('wheel',wheelChess);clear();orbit.dispose();throne?.dispose();shockFlash.dispose();scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(![...materials.values()].includes(m))m.dispose();});});materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  },[completed, interior]);
  const press=(key,down)=>{if(paused||chessOpen||sceneActive.current)return;if(down)keys.current.add(key);else keys.current.delete(key);};
  const fightActive = fight && !['won', 'lost'].includes(fight.phase);
  const mapName = interior ? (en ? 'ARCANE GUARDIAN CHAMBER' : 'CÂMARA DO GUARDIÃO ARCANO') : (en ? 'CASTLE COURTYARD' : 'PÁTIO DO CASTELO');
  const rewardLabel = reward === 'key' ? (en ? 'Pick up the key' : 'Pegar a chave') : (en ? 'Enter the throne room entrance' : 'Ir à entrada da sala do trono');
  const fightMessages = {
    warning: en ? 'Get to a dry, green safe zone.' : 'Corra para uma área seca marcada em verde.',
    groundCast: en ? 'The witch is casting lightning into the water!' : 'A bruxa vai lançar um raio na água!',
    shock: fight?.hit
      ? (en ? 'You were shocked! Stay on green.' : 'Você levou um choque! Fique no verde.')
      : (en ? 'The floor is electrified! Stay on green.' : 'Piso eletrificado! Fique no verde.'),
    recovery: en ? 'Watch for the next safe zones.' : 'Fique de olho nas próximas áreas seguras.',
    poisonWarning: en ? 'Potion dash! Move out of the marked trail.' : 'Investida de poção! Saia da faixa marcada.',
    poison: en ? 'Avoid the red areas!' : 'Desvie das áreas vermelhas!',
    ascent: en ? 'The witch is rising into the storm.' : 'A bruxa está subindo em direção à tempestade.',
    strike: en ? 'Lightning struck the witch!' : 'O raio atingiu a bruxa!',
    spin: en ? 'The witch is spinning out of control!' : 'A bruxa está girando sem controle!',
    descent: en ? 'The witch is descending.' : 'A bruxa está descendo.',
    fall: en ? 'The witch is falling!' : 'A bruxa está caindo!',
  };
  return <section className="lake cursed-castle castle-courtyard"><div className="lake-viewport"><div ref={mount} className="lake-canvas"
      onPointerDown={interior ? startChessGesture : undefined} onPointerMove={interior ? moveChessGesture : undefined}
      onPointerUp={interior ? endChessGesture : undefined} onLostPointerCapture={interior ? endChessGesture : undefined}
      onPointerCancel={interior ? endChessGesture : undefined}/><div className="encounter-controls" hidden={chessOpen}>
      {campaignNavigation ?? <button className="lake-exit" hidden={chessOpen} disabled={paused || chessOpen} onClick={onExit}>{interior ? (en ? 'Return to courtyard' : 'Voltar ao pátio') : (en ? 'Return to outskirts' : 'Voltar aos arredores')}</button>}
      {intro && <button type="button" className="battle-skip" disabled={paused} onClick={() => skipScene.current?.()}>{en ? 'Skip cutscene' : 'Pular cutscene'}</button>}
      {fightActive && <button type="button" className="battle-skip" disabled={paused} onClick={() => skipFight.current?.()}>{en ? 'Skip fight' : 'Pular luta'}</button>}
    </div><div className="courtyard-status" hidden={chessOpen}><div className="cursed-heading"><strong>{mapName}</strong></div>{fightActive && <div className="witch-battle-status">
      <span className="witch-lives" role="img" aria-label={en ? `${fight.lives} of ${WITCH_LIVES} lives` : `${fight.lives} de ${WITCH_LIVES} vidas`}>{'♥'.repeat(fight.lives)}{'♡'.repeat(WITCH_LIVES - fight.lives)}</span>
      <small className="witch-health">{en ? 'Witch health' : 'Vida da bruxa'}: {WITCH_LIGHTNING_HITS - fight.strikes}/{WITCH_LIGHTNING_HITS}</small>
      <small>{en ? `Wave ${fight.wave}/${WITCH_WAVES}` : `Onda ${fight.wave}/${WITCH_WAVES}`}</small>
      <small>{en ? `Lightning strikes ${fight.strikes}/${WITCH_LIGHTNING_HITS}` : `Raios na bruxa ${fight.strikes}/${WITCH_LIGHTNING_HITS}`}</small>
      {fightActive && <><strong role="status" className={['groundCast', 'shock', 'poisonWarning', 'poison'].includes(fight.phase) ? 'witch-danger' : 'witch-refuge'}>{fightMessages[fight.phase]}</strong>{fight.phase === 'warning' && <span>{en ? `Shock in ${fight.seconds}s` : `Choque em ${fight.seconds}s`}</span>}</>}
    </div>}
    {(reward === 'key' || reward === 'exit') && <div className="witch-battle-status courtyard-progress">
      <strong role="status">{reward === 'key'
        ? (en ? 'The witch dropped a key. Pick it up.' : 'A bruxa deixou cair uma chave. Pegue-a.')
        : (en ? 'The exit to the throne room entrance is open.' : 'A saída para a entrada da sala do trono está aberta.')}</strong>
      {nearReward && <button type="button" className="courtyard-action" disabled={paused} onClick={() => rewardAction.current?.()}>{rewardLabel} <kbd className="keyboard-guide">E</kbd></button>}
    </div>}
    {interior && (sealRevealed || throneUnlocked || error) && !chessOpen &&
      <div className="witch-battle-status courtyard-progress" role="status">{throneUnlocked
        ? (en ? 'The seal is broken. The Dark King’s throne room is unavailable.' : 'O selo foi quebrado. A sala do trono do Rei das Trevas está indisponível.')
        : (en ? 'An ancient seal blocks the door.' : 'Um selo antigo bloqueia a porta.')}</div>}
    </div>
    {error&&<p className="lake-scene-error">{en?'3D is unavailable in this browser.':'O 3D n\u00e3o est\u00e1 dispon\u00edvel neste navegador.'}</p>}{intro && line !== -1 && <div className="chamber-subtitle" role="status" aria-live="polite"><strong>{en ? 'THE WITCH' : 'A BRUXA'}</strong><p>{line === -2 ? (en ? '[The witch cackles]' : '[A bruxa gargalha]') : witchDialogue[en ? 'en-US' : 'pt-BR'][line]}</p></div>}
    {fight?.phase === 'lost' && <div className="battle-result" role="region" aria-label={en ? 'Battle result' : 'Resultado da batalha'}>
      <strong role="status">{en ? 'You fell in battle.' : 'Você caiu em batalha.'}</strong>
      <button type="button" disabled={paused} onClick={() => restartFight.current?.()}>{en ? 'Fight again' : 'Lutar novamente'}</button>
    </div>}

    {interior && !chessOpen && (throneUnlocked ? onAdvance : nearSeal || error) && <div className="village-actions">
      <button type="button" aria-keyshortcuts={throneUnlocked ? undefined : 'E'} disabled={paused}
        onClick={throneUnlocked ? onAdvance : showChess}>{throneUnlocked
          ? (en ? 'Enter the throne room' : 'Entrar na sala do trono')
          : <>{en ? 'Play Wizard’s Chess' : 'Jogar Xadrez de Bruxo'} <kbd aria-hidden="true">E</kbd></>}</button>
    </div>}
    {interior && <WizardChess interaction={chessInteraction} has3D={!error} onPieceFocus={onChessPieceFocus} onResetView={() => chessControls.current?.reset()} onZoom={factor => chessControls.current?.zoom(factor)} en={en} open={chessOpen} paused={paused} onClose={closeChess} onBoard={updateChessBoard} capturePending={!error && capturePending} onWin={releaseSeal} onSkip={skipChess}/>}
    <div className="scene-guide map-control-guide" hidden={intro || chessOpen}><div className="scene-caption"><span className="live-dot"/> {mapName}</div><div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en?'or arrows to walk':'ou setas para caminhar'} {' '}<kbd>Shift</kbd> {en?'run':'correr'}</span><span className="keyboard-guide">{en?'Drag to rotate':'Arraste para girar'}</span><span className="touch-guide">{en?'Use arrows to walk and drag to rotate':'Use as setas para caminhar e arraste para girar'}</span></div></div></div><div className={chessOpen ? "lake-touch chess-walking-hidden" : "lake-touch"} aria-label={en?'Walking controls':'Controles de caminhada'}>{[['arrowleft',en?'Left':'Esquerda','\u2190'],['arrowup',en?'Forward':'Frente','\u2191'],['arrowdown',en?'Back':'Tr\u00e1s','\u2193'],['arrowright',en?'Right':'Direita','\u2192']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} disabled={paused || chessOpen || intro || fight?.phase === 'lost'} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}<TouchInteract language={language} onInteract={interior ? (throneUnlocked ? onAdvance : showChess) : () => rewardAction.current?.()} disabled={paused || chessOpen || intro || !(interior ? nearSeal && (!throneUnlocked || onAdvance) : nearReward && (reward === 'key' || reward === 'exit'))} /></div></section>;
}
