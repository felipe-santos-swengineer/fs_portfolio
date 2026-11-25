import { isRunning, setTouchMovement } from './touchMovement';
import { createCorridorGallery } from './infiniteCorridorGallery';
import TouchInteract from './TouchInteract';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import MapControlGuide from './MapControlGuide';
import { allowRunAndRotate } from './runAndRotate';
import { createAdventurer } from './VillageScene';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import { sceneFrameDelta } from './sceneFrameDelta';
import { isDungeonPortalTap } from './dungeonPortalTap';
import {
  BARRIER_Z, CLOAK_SECONDS, FOYER_MAX_Z, FOYER_NECK_Z, FOYER_WALL_RADIUS,
  SEGMENT_LENGTH, SPINS_TO_ESCAPE, START_Z,
  canSeePlayer, checkpointRespawnZ, clampCorridorPosition, clampFoyerPosition, cloakPhase, createSegmentPlan,
  corridorCameraOffset, floorDoorActive, hasFloorDoor, inCheckpointSafeZone, isCorridorComplete, rollUp, segmentCenterZ, segmentFrontZ, spinSurface, spinTargetRoll,
  segmentIndexAt, segmentsToGenerate, segmentsToRemove, shouldHideWall, shouldMonsterChase, withinReach,
} from './infiniteCorridorLogic';
import './Lake.css';
import './CursedCastle.css';
import './InfiniteCorridor.css';

export default function InfiniteCorridor({ campaignNavigation, language, paused, reduceMotion, onExit, onAdvance, onSound }) {
  const mount = useRef(null), canvasRef = useRef(null), keys = useRef(new Set()), state = useRef({});
  const noticeOpenRef = useRef(false), signsRef = useRef(null), exitRequested = useRef(false);
  const cloakNearRef = useRef(false), floorDoorNearRef = useRef(false), doorNearRef = useRef(false);
  const cloakTakenRef = useRef(false), phaseInvisibleRef = useRef(true);
  const maxZRef = useRef(FOYER_MAX_Z), minZRef = useRef(-Infinity), sanityRef = useRef(3), stunRef = useRef(0);
  const flashRef = useRef(0), caughtRef = useRef(0), flashVisibleRef = useRef(false), caughtVisibleRef = useRef(false);
  const toastVisibleRef = useRef(false), toastUntilRef = useRef(0), noticeCooldownRef = useRef(0);
  const spinsRef = useRef(0), spinningRef = useRef(false), corridorEndedRef = useRef(false), checkpointZRef = useRef(null);
  const lastRemainingRef = useRef(CLOAK_SECONDS);
  const actions = useRef({});
  state.current = { language, paused, reduceMotion, onExit, onAdvance, onSound };

  const [error, setError] = useState(false), [noticeOpen, setNoticeOpen] = useState(false);
  const [cloakTaken, setCloakTaken] = useState(false);
  const [spinCount, setSpinCount] = useState(0), [spinning, setSpinning] = useState(false);
  const [corridorEnded, setCorridorEnded] = useState(false);
  const [phase, setPhase] = useState({ invisible: true, remaining: CLOAK_SECONDS, total: CLOAK_SECONDS });
  const [sanity, setSanity] = useState(3), [segment, setSegment] = useState(0);
  const [nearCloak, setNearCloak] = useState(false), [nearFloorDoor, setNearFloorDoor] = useState(false);
  const [nearDoor, setNearDoor] = useState(false);
  const [toast, setToast] = useState(null), [flash, setFlash] = useState(false), [caught, setCaught] = useState(false);
  const en = language === 'en-US';
  const surface = spinSurface(spinCount);

  const closeNotice = () => {
    noticeOpenRef.current = false; setNoticeOpen(false);
    requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
  };
  useEffect(() => {
    signsRef.current?.(language);
    canvasRef.current?.setAttribute('aria-label', language === 'en-US' ? 'Hall of Infinity' : 'Corredor do Infinito');
  }, [language]);
  useEffect(() => { if (paused) state.current.onSound?.('witch-stop'); }, [paused]);

  const exitScene = () => { if (state.current.paused) return; keys.current.clear(); state.current.onExit?.(); };
  const advanceScene = useCallback(() => {
    if (state.current.paused || exitRequested.current) return;
    exitRequested.current = true;
    keys.current.clear();
    state.current.onAdvance?.();
  }, []);
  const focusCanvas = () => requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
  const takeCloak = () => { if (state.current.paused || !cloakNearRef.current) return; actions.current.takeCloak?.(); focusCanvas(); };
  const turnRoom = () => { if (state.current.paused || !floorDoorNearRef.current) return; actions.current.useFloorDoor?.(); focusCanvas(); };
  const enterDoor = () => { if (state.current.paused || !doorNearRef.current) return; actions.current.enterDoor?.(); focusCanvas(); };
  const interact = () => {
    if (nearCloak) takeCloak();
    else if (nearFloorDoor) turnRoom();
    else if (nearDoor) enterDoor();
  };

  useEffect(() => {
    const el = mount.current; let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', state.current.language === 'en-US' ? 'Hall of Infinity' : 'Corredor do Infinito');
    el.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;
    renderer.domElement.focus({ preventScroll: true });

    const scene = new THREE.Scene();
    const darkBackground = new THREE.Color('#191720'), litBackground = new THREE.Color('#1d1d2b');
    scene.background = darkBackground.clone();
    scene.fog = new THREE.Fog(darkBackground.clone(), 8, 33);
    const hemi = new THREE.HemisphereLight('#c4c2d0', '#625252', 1.12);
    const moon = new THREE.DirectionalLight('#d1cad3', .83);
    moon.position.set(-6, 12, -8);
    scene.add(hemi, moon);

    const camera = new THREE.PerspectiveCamera(48, 1, .1, 120), materials = new Map(), textures = [];
    const material = color => {
      if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: .94 }));
      return materials.get(color);
    };
    const mesh = (parent, geometry, color, x, y, z) => {
      const item = new THREE.Mesh(geometry, color.isMaterial ? color : material(color));
      item.position.set(x, y, z); parent.add(item); return item;
    };
    const box = (p, w, h, d, c, x, y, z) => mesh(p, new THREE.BoxGeometry(w, h, d), c, x, y, z);
    const sphere = (p, r, c, x, y, z) => mesh(p, new THREE.IcosahedronGeometry(r, 1), c, x, y, z);
    const cylinder = (p, r, h, c, x, y, z, n = 8) => mesh(p, new THREE.CylinderGeometry(r, r, h, n), c, x, y, z);
    const glowMaterial = (color, intensity = 1) => new THREE.MeshStandardMaterial({ color, roughness: .5, emissive: new THREE.Color(color), emissiveIntensity: intensity });
    // eslint-disable-next-line no-unused-vars
    const basicMaterial = color => new THREE.MeshBasicMaterial({ color });
    const makeLabel = (parent, y, width, height) => {
      const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 192;
      const ctx = canvas.getContext('2d'), texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace; textures.push(texture);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
      sprite.position.y = y; sprite.scale.set(width, height, 1); parent.add(sprite);
      return { ctx, texture, sprite, draw: (title, subtitle, color) => {
        ctx.fillStyle = '#101116'; ctx.fillRect(0, 0, 768, 192);
        ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(7, 7, 754, 178);
        ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.font = 'bold 52px sans-serif'; ctx.fillText(title, 384, 82);
        ctx.fillStyle = '#e6e0d2'; ctx.font = '32px sans-serif'; ctx.fillText(subtitle, 384, 143);
        texture.needsUpdate = true;
      } };
    };

    // The room and the player roll together around the forward axis. The camera
    // stays upright, so each turn reads as walking on the wall, then the ceiling.
    const worldPivot = new THREE.Group(), world = new THREE.Group();
    worldPivot.add(world); scene.add(worldPivot);
    const gallery = createCorridorGallery();
    const occluders = [];
    const registerWall = (object, normal, segmentIndex) => occluders.push({ object, normal: normal.clone(), segmentIndex });

    const disposeObjects = root => root.traverse(item => {
      if (item.userData.galleryShared) return;
      item.geometry?.dispose();
      const list = item.material ? (Array.isArray(item.material) ? item.material : [item.material]) : [];
      list.forEach(value => { if (![...materials.values()].includes(value)) value.dispose(); });
    });

    const cloakGroup = new THREE.Group();
    // Center the cloak on a wall panel, with clearance behind the draped hem.
    const cloakWallAngle = 9 * Math.PI / 16;
    const cloakWallDistance = FOYER_WALL_RADIUS - 1.05;
    cloakGroup.position.set(
      Math.sin(cloakWallAngle) * cloakWallDistance,
      0,
      START_Z + Math.cos(cloakWallAngle) * cloakWallDistance,
    );
    cloakGroup.rotation.y = cloakWallAngle + Math.PI;
    world.add(cloakGroup);
    function createCloak(parent, shoulderHeight) {
      const cloak = new THREE.Group();
      cloak.position.y = shoulderHeight;
      parent.add(cloak);

      const fabric = new THREE.PlaneGeometry(1, 1, 32, 16);
      const positions = fabric.getAttribute('position');
      for (let index = 0; index < positions.count; index++) {
        const across = positions.getX(index) * 2;
        const drop = .5 - positions.getY(index);
        const angle = across * (2.18 - drop * .65);
        const radius = .42 + drop * .23 + Math.cos(across * Math.PI * 6) * (.025 + drop * .035);
        const hem = .065 * Math.sin(across * Math.PI * 5) + .035 * Math.cos(across * Math.PI * 9);
        positions.setXYZ(index, Math.sin(angle) * radius, -drop * 1.45 + drop ** 4 * hem,
          -Math.cos(angle) * radius * .78 - drop ** 2 * .18);
      }
      fabric.computeVertexNormals();
      const drape = mesh(cloak, fabric, '#544367', 0, 0, 0);
      drape.material.side = THREE.DoubleSide;

      mesh(cloak, new THREE.SphereGeometry(.33, 20, 14), '#21182f', 0, .26, .01)
        .scale.set(.93, 1.15, .92);
      mesh(cloak, new THREE.SphereGeometry(.36, 24, 16, 2.22, Math.PI * 2 - 1.3), '#66527d', 0, .28, 0)
        .scale.set(1, 1.17, 1);
      mesh(cloak, new THREE.TorusGeometry(.072, .018, 8, 16), '#c9a875', 0, -.06, .24);
      mesh(cloak, new THREE.IcosahedronGeometry(.041, 1), '#b9a7d6', 0, -.06, .25);
      return { cloak, drape };
    }

    const peg = cylinder(cloakGroup, .06, .94, '#8a7d69', 0, 3.16, -.38, 10);
    peg.rotation.x = Math.PI / 2;
    mesh(cloakGroup, new THREE.SphereGeometry(.09, 8, 6), '#a49379', 0, 3.16, .06);
    const { cloak: hangingCloak } = createCloak(cloakGroup, 2.63);
    const cloakLight = new THREE.PointLight('#8f7bb8', 1.8, 4);
    cloakLight.position.set(0, 2.6, .8); cloakGroup.add(cloakLight);
    const cloakLabel = makeLabel(cloakGroup, 4.15, 2.7, .7);
    cloakLabel.sprite.material.depthTest = false;
    cloakLabel.sprite.material.depthWrite = false;
    cloakLabel.sprite.renderOrder = 5;
    cloakGroup.userData.cloak = true;

    const traveler = createAdventurer(scene, { box, sphere, mesh, cylinder }), player = traveler.player;
    player.position.set(0, .2, START_Z + 1); player.rotation.order = 'ZYX'; player.rotation.y = Math.PI;
    const { cloak: ghost, drape: ghostDrape } = createCloak(player, 1.7);
    ghost.visible = false;
    // The worn cloak is the player model after pickup. Isolate its materials
    // from the matching cloak in the foyer and the corridor palette.
    const wornMaterials = new Map();
    ghost.traverse(part => {
      if (!part.isMesh) return;
      const original = part.material;
      if (!wornMaterials.has(original)) wornMaterials.set(original, original.clone());
      part.material = wornMaterials.get(original);
    });
    let faded = false;
    function setCloakFaded(next) {
      if (faded === next) return;
      faded = next;
      wornMaterials.forEach(mat => {
        mat.transparent = next;
        mat.opacity = next ? .35 : 1;
        mat.depthWrite = !next;
        mat.needsUpdate = true;
      });
    }
    ghost.userData.ghost = true;

    camera.position.set(0, 5.6, START_Z + 5);
    // OrbitControls keeps a fixed up axis. Solve the orbit in the unrolled room.
    const orbitCamera = camera.clone();
    orbitCamera.position.z -= player.position.z;
    const orbit = allowRunAndRotate(new OrbitControls(orbitCamera, renderer.domElement));
    orbit.target.set(0, 1.2, 0);
    orbit.enablePan = false; orbit.enableDamping = true;
    orbit.minDistance = 4; orbit.maxDistance = 13;
    orbit.minAzimuthAngle = -.62; orbit.maxAzimuthAngle = .62;
    orbit.maxPolarAngle = Math.PI / 2 - .08; orbit.update();
    const resize = () => {
      const width = el.clientWidth, height = el.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(el); resize();

    const segments = new Map(), monsters = [];
    let generatedIndex = 0, currentIndex = 0;
    let floorDoor = null, floorDoorIndex = null, floorDoorLabel = null;
    let door = null, doorLabel = null, finalIndex = null;
    let phaseElapsed = 0, cloakSway = 0, spinElapsed = 0, brighten = 0;
    let worldRoll = 0, spinStartRoll = 0, spinTargetAngle = 0, spinDirection = Math.random() < .5 ? -1 : 1;
    const showToast = (text, warning = false) => { setToast({ text, warning }); toastVisibleRef.current = true; toastUntilRef.current = phaseElapsed + 3.2; };

    const clearFloorDoor = () => {
      if (!floorDoor) return;
      const texture = floorDoorLabel.texture;
      textures.splice(textures.indexOf(texture), 1); texture.dispose();
      world.remove(floorDoor); disposeObjects(floorDoor);
      floorDoor = null; floorDoorIndex = null; floorDoorLabel = null;
      floorDoorNearRef.current = false; setNearFloorDoor(false);
    };
    const buildFloorDoor = index => {
      if (floorDoorIndex === index) return;
      clearFloorDoor();
      floorDoor = new THREE.Group(); floorDoor.position.set(0, 0, segmentCenterZ(index)); world.add(floorDoor);
      floorDoorIndex = index;
      mesh(floorDoor, new THREE.CylinderGeometry(1.18, 1.18, .08, 20), '#2a2433', 0, .11, 0);
      const ring = mesh(floorDoor, new THREE.TorusGeometry(.94, .07, 8, 24), glowMaterial('#b9a7d6', .8), 0, .18, 0);
      ring.rotation.x = Math.PI / 2;
      for (let spoke = 0; spoke < 6; spoke++) {
        const angle = spoke / 6 * Math.PI * 2;
        const bar = box(floorDoor, .07, .03, .82, '#8d7ca8', Math.sin(angle) * .5, .19, Math.cos(angle) * .5);
        bar.rotation.y = angle;
      }
      mesh(floorDoor, new THREE.IcosahedronGeometry(.16, 1), glowMaterial('#d8c18a', 1.2), 0, .24, 0);
      const light = new THREE.PointLight('#b9a7d6', 2.6, 6); light.position.set(0, .9, 0); floorDoor.add(light);
      floorDoorLabel = makeLabel(floorDoor, 2.2, 2.8, .7);
      floorDoor.userData.floorDoor = true;
      signsRef.current?.(state.current.language);
    };

    const disposeSegment = index => {
      const entry = segments.get(index);
      if (!entry) return;
      world.remove(entry.group); disposeObjects(entry.group); segments.delete(index);
      for (let i = occluders.length - 1; i >= 0; i--) if (occluders[i].segmentIndex === index) occluders.splice(i, 1);
      for (let i = monsters.length - 1; i >= 0; i--) if (monsters[i].segmentIndex === index) {
        world.remove(monsters[i].group); disposeObjects(monsters[i].group); monsters.splice(i, 1);
      }
      if (floorDoorIndex === index) clearFloorDoor();
    };
    const spawnMonster = (index, plan) => {
      if (!index || hasFloorDoor(index) || spinningRef.current || corridorEndedRef.current) return;
      const side = plan.portraitSide, x = side * (1 + Math.random() * 1.8);
      const z = segmentCenterZ(index) + (Math.random() - .5) * 8;
      const group = new THREE.Group(); group.position.set(x, 0, z); world.add(group);
      const body = mesh(group, new THREE.ConeGeometry(.42, 1.5, 7), '#15131b', 0, .9, 0);
      mesh(group, new THREE.IcosahedronGeometry(.26, 1), '#0c0b10', 0, 1.75, 0);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#8c3f3a', transparent: true, opacity: .1 });
      [-.1, .1].forEach(dx => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), eyeMaterial);
        eye.position.set(dx, 1.78, .23); group.add(eye);
      });
      group.userData.monster = true;
      monsters.push({ group, body, eyeMaterial, phase: Math.random() * 6, hitCooldown: 0, segmentIndex: index });
    };
    const buildSegment = index => {
      if (segments.has(index)) return;
      const group = new THREE.Group(); group.position.z = segmentCenterZ(index); world.add(group);
      const plan = createSegmentPlan(index);
      let light = null, flame = null, dust = null;
      if (index === 0) {
        // Circular safe room. The front arc is open and funnels into the straight corridor.
        mesh(group, new THREE.CylinderGeometry(FOYER_WALL_RADIUS, FOYER_WALL_RADIUS, .14, 24), plan.palette, 0, 0, 0);
        const ring = mesh(group, new THREE.TorusGeometry(FOYER_WALL_RADIUS - .45, .045, 6, 32), '#5b5960', 0, .09, 0);
        ring.rotation.x = Math.PI / 2;
        for (let spoke = 0; spoke < 8; spoke++) {
          const angle = spoke / 8 * Math.PI * 2;
          const line = box(group, .06, .02, FOYER_WALL_RADIUS - .8, '#4a4950', Math.sin(angle) * (FOYER_WALL_RADIUS - .8) / 2, .085, Math.cos(angle) * (FOYER_WALL_RADIUS - .8) / 2);
          line.rotation.y = angle;
        }
        const panels = 16;
        for (let panel = 0; panel < panels; panel++) {
          const angle = (panel + .5) / panels * Math.PI * 2;
          const frontGap = Math.abs(Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI))) < .7;
          if (frontGap) continue;
          const x = Math.sin(angle) * FOYER_WALL_RADIUS, z = Math.cos(angle) * FOYER_WALL_RADIUS;
          const wall = box(group, 2.65, 4.4, .5, '#3b3a43', x, 2.2, z);
          wall.rotation.y = angle; registerWall(wall, new THREE.Vector3(0, 0, 1), index);
          const columnAngle = angle + Math.PI / panels;
          const column = cylinder(group, .32, 4.5, '#57545d', Math.sin(columnAngle) * FOYER_WALL_RADIUS, 2.25, Math.cos(columnAngle) * FOYER_WALL_RADIUS, 8);
          registerWall(column, new THREE.Vector3(Math.sin(columnAngle), 0, Math.cos(columnAngle)), index);
        }
        const neckFront = BARRIER_Z - START_Z, neckEnd = FOYER_NECK_Z - START_Z;
        box(group, 9.2, .14, neckEnd - neckFront, plan.palette, 0, 0, (neckFront + neckEnd) / 2);
        [-1, 1].forEach(side => {
          const wall = box(group, .7, 5, neckEnd - neckFront, '#3b3a43', side * 4.6, 2.5, (neckFront + neckEnd) / 2);
          registerWall(wall, new THREE.Vector3(side, 0, 0), index);
          const trim = box(group, .18, .18, neckEnd - neckFront, '#5b5862', side * 4.35, 4.9, (neckFront + neckEnd) / 2);
          registerWall(trim, new THREE.Vector3(side, 0, 0), index);
        });
        [-1, 1].forEach(side => {
          const x = side * 5.4, z = .5;
          cylinder(group, .12, .7, '#514d55', x, 3.4, z);
          const fire = mesh(group, new THREE.ConeGeometry(.16, .42, 7), '#e8a467', x, 3.85, z);
          const glow = new THREE.PointLight('#d18d5f', 3.5, 10); glow.position.set(side * 5, 3.9, z); group.add(glow);
          if (!state.current.reduceMotion) fire.userData.flicker = true;
          if (!flame) { flame = fire; light = glow; }
        });
      } else {
        box(group, 9, .14, SEGMENT_LENGTH, plan.palette, 0, 0, 0);
        dust = gallery.add(group, index, registerWall);
        const side = plan.sconceSide;
        const fireColor = index % 4 === 0 ? '#87ae9f' : '#efb476';
        flame = mesh(group, new THREE.OctahedronGeometry(.095), fireColor, side * 3.99, 2.72, side * .1);
        flame.material = material(fireColor);
        flame.material.emissive.set(fireColor);
        flame.material.emissiveIntensity = .55;
        flame.userData.flicker = true;
        light = new THREE.PointLight(fireColor, 5, 9);
        light.position.set(side * 3.6, 2.8, side * .1); group.add(light);
        plan.debris.forEach(piece => {
          const rock = sphere(group, .14, '#57534e', Math.sign(piece.x) * (3.45 + Math.abs(piece.x) * .08), .13, piece.z);
          rock.rotation.y = piece.rotation; rock.scale.set(1.4, .52, .84);
        });
        spawnMonster(index, plan);
        if (floorDoorActive(index, spinsRef.current)) buildFloorDoor(index);
      }
      segments.set(index, { group, plan, light, flame, dust, baseIntensity: light ? light.intensity : 0 });
      signsRef.current?.(state.current.language);
    };
    buildSegment(0);

    const openFinalDoor = () => {
      if (door) return;
      finalIndex = currentIndex + 1;
      [...segments.keys()].filter(index => index > finalIndex).forEach(disposeSegment);
      generatedIndex = Math.max(generatedIndex, finalIndex);
      buildSegment(finalIndex);
      door = new THREE.Group(); door.position.set(0, 0, segmentFrontZ(finalIndex) + 1.4); world.add(door);
      [-1, 1].forEach(side => box(door, .55, 5.2, .7, '#6e6470', side * 2, 2.6, 0));
      box(door, 4.6, .6, .8, '#6e6470', 0, 5.1, 0);
      const surface = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 4.6), glowMaterial('#6a92bf', 1.2));
      surface.position.y = 2.35; door.add(surface);
      const light = new THREE.PointLight('#93bde6', 10, 12); light.position.set(0, 2.4, 1); door.add(light);
      doorLabel = makeLabel(door, 6.2, 3.4, .85);
      door.userData.door = true;
      signsRef.current?.(state.current.language);
    };
    const endCorridor = () => {
      if (corridorEndedRef.current) return;
      corridorEndedRef.current = true; setCorridorEnded(true);
      monsters.forEach(monster => { monster.group.visible = false; });
      clearFloorDoor(); openFinalDoor();
      state.current.onSound?.('gate');
      showToast(state.current.language === 'en-US' ? 'The turning stops. The way out is lit ahead.' : 'O giro parou. A saída está iluminada adiante.');
      signsRef.current?.(state.current.language);
    };
    actions.current = {
      takeCloak: () => {
        if (cloakTakenRef.current) return;
        cloakTakenRef.current = true; setCloakTaken(true);
        cloakGroup.visible = false; traveler.body.visible = false; ghost.visible = true; setCloakFaded(true);
        maxZRef.current = player.position.z;
        phaseElapsed = 0; phaseInvisibleRef.current = true;
        setPhase({ invisible: true, remaining: CLOAK_SECONDS, total: CLOAK_SECONDS });
        noticeOpenRef.current = false; setNoticeOpen(false);
        state.current.onSound?.('cloak');
        showToast(state.current.language === 'en-US' ? 'Move forward while you are invisible.' : 'Avance enquanto estiver invisível.');
        requestAnimationFrame(() => canvasRef.current?.focus({ preventScroll: true }));
      },
      useFloorDoor: () => {
        if (spinningRef.current || corridorEndedRef.current || floorDoorIndex === null) return;
        const next = Math.min(SPINS_TO_ESCAPE, spinsRef.current + 1);
        spinsRef.current = next; setSpinCount(next);
        checkpointZRef.current = player.position.z;
        spinStartRoll = worldRoll;
        spinTargetAngle = spinTargetRoll(next, worldRoll, spinDirection);
        spinningRef.current = true; setSpinning(true);
        spinElapsed = 0; keys.current.clear(); clearFloorDoor();
        monsters.forEach(monster => { monster.group.visible = false; });
        state.current.onSound?.('gate');
        showToast(next >= SPINS_TO_ESCAPE
          ? (state.current.language === 'en-US' ? 'The final turn begins...' : 'O último giro começa...')
          : (state.current.language === 'en-US' ? 'The room turns around you.' : 'A sala gira ao seu redor.'));
        signsRef.current?.(state.current.language);
      },
      enterDoor: () => {
        if (corridorEndedRef.current) advanceScene();
      },
    };

    signsRef.current = lang => {
      const isEnglish = lang === 'en-US';
      cloakLabel.draw(isEnglish ? 'GHOST CLOAK' : 'MANTO DO FANTASMA', isEnglish ? 'Take it to pass' : 'Pegue para atravessar', '#b9a7d6');
      if (floorDoorLabel) floorDoorLabel.draw(
        isEnglish ? 'TURNING DOOR' : 'PORTA GIRATÓRIA',
        isEnglish ? `Turn ${spinsRef.current + 1} of ${SPINS_TO_ESCAPE}` : `Giro ${spinsRef.current + 1} de ${SPINS_TO_ESCAPE}`,
        '#c9a7ff',
      );
      if (doorLabel) doorLabel.draw(isEnglish ? 'NEXT ROOM' : 'PRÓXIMA SALA', isEnglish ? 'The corridor is over' : 'O corredor terminou', '#d8c18a');
    };
    signsRef.current(state.current.language);

    const respawn = z => {
      [...segments.keys()].forEach(index => disposeSegment(index));
      while (monsters.length) {
        const monster = monsters.pop();
        world.remove(monster.group); disposeObjects(monster.group);
      }
      generatedIndex = 0;
      currentIndex = segmentIndexAt(z); setSegment(currentIndex);
      player.position.set(0, .2, z); player.rotation.y = Math.PI;
      maxZRef.current = z; minZRef.current = -Infinity;
      sanityRef.current = 3; setSanity(3);
      stunRef.current = 0;
      phaseElapsed = 0; phaseInvisibleRef.current = true;
      setPhase({ invisible: true, remaining: CLOAK_SECONDS, total: CLOAK_SECONDS });
      caughtRef.current = 1.5; keys.current.clear();
      cloakNearRef.current = false; floorDoorNearRef.current = false; doorNearRef.current = false;
      setNearCloak(false); setNearFloorDoor(false); setNearDoor(false);
      for (let index = 0; index <= currentIndex; index++) { buildSegment(index); generatedIndex = index; }
      monsters.forEach(monster => {
        monster.hitCooldown = 1; monster.group.visible = true;
      });
    };

    const clear = () => keys.current.clear();
    const down = e => {
      const key = e.key.toLowerCase();
      if (key === 'escape' && noticeOpenRef.current && !state.current.paused) { e.preventDefault(); closeNotice(); return; }
      if (document.activeElement !== canvasRef.current || state.current.paused) return;
      if (key === 'e' && !e.repeat) {
        if (cloakNearRef.current) { e.preventDefault(); actions.current.takeCloak(); return; }
        if (floorDoorNearRef.current) { e.preventDefault(); actions.current.useFloorDoor(); return; }
        if (doorNearRef.current) { e.preventDefault(); actions.current.enterDoor(); return; }
      }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
        if (key !== 'shift') e.preventDefault(); keys.current.add(key);
      }
    };
    const up = e => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);

    let pointerStart = null;
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
    const pointerDown = e => { if (e.isPrimary && e.button === 0) pointerStart = { id: e.pointerId, x: e.clientX, y: e.clientY }; };
    const pointerUp = e => {
      const start = pointerStart; pointerStart = null;
      if (!isDungeonPortalTap(start, e, state.current.paused, false)) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1, -(e.clientY - bounds.top) / bounds.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const targets = [cloakGroup, floorDoor, door].filter(Boolean);
      const hit = raycaster.intersectObjects(targets, true).find(item => {
        let object = item.object;
        while (object) { if (!object.visible) return false; object = object.parent; }
        return true;
      });
      if (!hit) return;
      let object = hit.object;
      while (object && !targets.includes(object)) object = object.parent;
      if (object === cloakGroup) actions.current.takeCloak();
      else if (object === floorDoor) actions.current.useFloorDoor();
      else if (object === door) actions.current.enterDoor();
    };
    const pointerCancel = () => { pointerStart = null; };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    renderer.domElement.addEventListener('pointercancel', pointerCancel);

    let frame, last = performance.now(), time = 0, backwardHeld = false;
    const setNear = (value, ref, setter) => { if (ref.current !== value) { ref.current = value; setter(value); } };
    const hitPlayer = () => {
      sanityRef.current = Math.max(0, sanityRef.current - 1); setSanity(sanityRef.current);
      stunRef.current = .7; flashRef.current = 1; state.current.onSound?.('monster');
      if (sanityRef.current === 0) respawn(checkpointRespawnZ(checkpointZRef.current));
    };
    const cameraPoint = new THREE.Vector3(), objectPoint = new THREE.Vector3(), objectQuaternion = new THREE.Quaternion(), worldNormal = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();
    const animate = now => {
      frame = requestAnimationFrame(animate);
      const dt = sceneFrameDelta(now, last); last = now;
      const insideCorridor = cloakTakenRef.current && player.position.z < BARRIER_Z;
      if (!state.current.paused) {
        state.current.onSound?.('witch-start');
        time += dt; phaseElapsed += dt;
        stunRef.current = Math.max(0, stunRef.current - dt);
        noticeCooldownRef.current = Math.max(0, noticeCooldownRef.current - dt);

        if (spinningRef.current) {
          spinElapsed += dt;
          const duration = state.current.reduceMotion ? 0 : 1.4;
          const raw = duration ? Math.min(1, spinElapsed / duration) : 1;
          const eased = raw * raw * (3 - 2 * raw);
          worldRoll = spinStartRoll + (spinTargetAngle - spinStartRoll) * eased;
          if (raw >= 1) {
            worldRoll = spinTargetAngle; spinningRef.current = false; setSpinning(false);
            if (isCorridorComplete(spinsRef.current)) {
              worldRoll = 0;
              endCorridor();
            }
            else monsters.forEach(monster => { monster.group.visible = true; monster.hitCooldown = 1; });
          }
        }

        const nextIndex = segmentIndexAt(player.position.z);
        if (nextIndex !== currentIndex) {
          currentIndex = nextIndex; setSegment(currentIndex);
          segmentsToRemove(currentIndex, generatedIndex).forEach(disposeSegment);
        }
        const stopIndex = corridorEndedRef.current ? finalIndex : null;
        segmentsToGenerate(currentIndex, generatedIndex, { ahead: cloakTakenRef.current ? 2 : 1, stopIndex }).forEach(index => {
          buildSegment(index); generatedIndex = index;
        });
        minZRef.current = corridorEndedRef.current && door ? door.position.z + 1.5 : segmentFrontZ(generatedIndex) + 1.5;

        const forward = keys.current.has('w') || keys.current.has('arrowup');
        const backward = keys.current.has('s') || keys.current.has('arrowdown');
        const blockedBackward = insideCorridor && backward && !spinningRef.current;
        if (blockedBackward && !backwardHeld) showToast(null, true);
        backwardHeld = blockedBackward;
        const left = keys.current.has('a') || keys.current.has('arrowleft');
        const right = keys.current.has('d') || keys.current.has('arrowright');
        const ix = Number(right) - Number(left), iz = Number(backward && !insideCorridor) - Number(forward);
        let moving = false;
        if (!spinningRef.current && (ix || iz)) {
          const direction = cameraRelativeDirection(orbitCamera, ix, iz);
          if (!cloakTakenRef.current && direction.z < -.25 && player.position.z <= BARRIER_Z + .25 && noticeCooldownRef.current === 0) {
            noticeCooldownRef.current = 2.5; noticeOpenRef.current = true; setNoticeOpen(true);
          }
          const running = isRunning(keys.current);
          const speed = (running ? 6.5 : 4) * (stunRef.current > 0 ? .4 : 1);
          const target = {
            x: player.position.x + direction.x * speed * dt,
            z: player.position.z + direction.z * speed * dt,
          };
          const next = insideCorridor
            ? clampCorridorPosition(target, { maxZ: maxZRef.current, minZ: minZRef.current })
            : clampFoyerPosition(target, { allowCross: cloakTakenRef.current });
          if (next.z < maxZRef.current) maxZRef.current = next.z;
          player.position.x = next.x; player.position.z = next.z;
          player.rotation.y = Math.atan2(direction.x, direction.z);
          moving = true;
        }

        if (!spinningRef.current && !cloakTakenRef.current && withinReach(player.position, cloakGroup.position, 1.15)) actions.current.takeCloak();

        const currentPhase = cloakPhase(phaseElapsed);
        const rounded = Math.ceil(currentPhase.remaining);
        if (currentPhase.invisible !== phaseInvisibleRef.current || rounded !== lastRemainingRef.current) {
          phaseInvisibleRef.current = currentPhase.invisible;
          lastRemainingRef.current = rounded;
          setPhase(currentPhase);
        }
        setCloakFaded(cloakTakenRef.current && currentPhase.invisible);
        if (!state.current.reduceMotion) {
          player.position.y = .2 + (cloakTakenRef.current ? Math.sin(time * 2) * .07 : 0);
          cloakSway += dt;
          hangingCloak.rotation.z = Math.sin(cloakSway * .8) * .035;
          segments.forEach(entry => {
            if (entry.flame.userData.flicker) entry.flame.scale.y = 1.1 + Math.sin(time * 5 + entry.group.position.z) * .16;
            if (entry.dust) entry.dust.position.y = Math.sin(time * .35 + entry.group.position.z) * .14;
          });
        }

        const playerAtCheckpoint = inCheckpointSafeZone(player.position);
        monsters.forEach(monster => {
          const position = monster.group.position;
          const alerted = shouldMonsterChase({
            insideCorridor,
            seesPlayer: !playerAtCheckpoint && canSeePlayer(position, player.position, currentPhase.invisible),
            corridorEnded: corridorEndedRef.current || spinningRef.current,
          });
          monster.eyeMaterial.opacity = alerted ? .95 : .1;
          monster.eyeMaterial.color.set(alerted ? '#ff6b5e' : '#8c3f3a');
          if (alerted) {
            const dx = player.position.x - position.x, dz = player.position.z - position.z;
            const distance = Math.hypot(dx, dz) || 1;
            const chase = Math.min(1.7 * dt, distance);
            const next = { x: position.x + dx / distance * chase, z: position.z + dz / distance * chase };
            if (!inCheckpointSafeZone(next)) {
              position.x = next.x; position.z = next.z;
            }
            monster.group.rotation.y = Math.atan2(dx, dz);
            if (distance < .95 && monster.hitCooldown === 0) { monster.hitCooldown = 1.2; hitPlayer(); }
          }
          monster.hitCooldown = Math.max(0, monster.hitCooldown - dt);
          if (alerted && !state.current.reduceMotion) monster.body.position.y = .9 + Math.sin(time * 2 + monster.phase) * .05;
        });

        setNear(!spinningRef.current && !cloakTakenRef.current && withinReach(player.position, cloakGroup.position, 2.6), cloakNearRef, setNearCloak);
        setNear(!spinningRef.current && !corridorEndedRef.current && !!floorDoor && withinReach(player.position, floorDoor.position, 2.4), floorDoorNearRef, setNearFloorDoor);
        setNear(!spinningRef.current && !!door && withinReach(player.position, { x: door.position.x, z: door.position.z + 1 }, 2.8), doorNearRef, setNearDoor);
        if (cloakNearRef.current && !state.current.reduceMotion) cloakLabel.sprite.scale.set(2.9, .77, 1);
        else cloakLabel.sprite.scale.set(2.7, .7, 1);

        if (toastVisibleRef.current && phaseElapsed > toastUntilRef.current) { toastVisibleRef.current = false; setToast(null); }
        if (flashRef.current > 0) {
          flashRef.current = Math.max(0, flashRef.current - dt * 1.7);
          if (flashRef.current === 0 && flashVisibleRef.current) { flashVisibleRef.current = false; setFlash(false); }
          else if (!flashVisibleRef.current) { flashVisibleRef.current = true; setFlash(true); }
        }
        if (caughtRef.current > 0) {
          caughtRef.current = Math.max(0, caughtRef.current - dt);
          if (caughtRef.current === 0 && caughtVisibleRef.current) { caughtVisibleRef.current = false; setCaught(false); }
          else if (!caughtVisibleRef.current) { caughtVisibleRef.current = true; setCaught(true); }
        }

        const stride = moving && !state.current.reduceMotion ? Math.sin(time * 9) : 0;
        traveler.limbs.forEach((limb, index) => {
          limb.rotation.x = moving && !state.current.reduceMotion && !cloakTakenRef.current ? stride * (index % 2 === 0 ? .5 : -.45) * (index < 2 ? 1 : -1) : 0;
        });
        if (cloakTakenRef.current) {
          ghostDrape.rotation.x = state.current.reduceMotion ? 0
            : (moving ? .24 : .04) + Math.sin(time * 2.4) * .04;
          ghostDrape.rotation.z = state.current.reduceMotion ? 0 : Math.sin(time * 1.8) * .035;
        }

        if (corridorEndedRef.current && brighten < 1) {
          brighten = Math.min(1, brighten + dt / 1.6);
          hemi.intensity = 1.12 + brighten * 1.1;
          moon.intensity = .83 + brighten * 1.3;
          scene.background.copy(darkBackground).lerp(litBackground, brighten);
          scene.fog.color.copy(scene.background);
          scene.fog.far = 33 + brighten * 34;
          segments.forEach(entry => { if (entry.light) entry.light.intensity = entry.baseIntensity + brighten * 1.5; });
        }
      } else { clear(); backwardHeld = false; }

      // Look at the player's torso while keeping the image world-upright.
      const up = rollUp(worldRoll);
      lookTarget.set(player.position.x + up.x, player.position.y + up.y, player.position.z);
      // Once inside the corridor the camera stays in the forward cone: the player cannot look back.
      orbit.maxAzimuthAngle = insideCorridor ? .5 : .62;
      orbit.minAzimuthAngle = -orbit.maxAzimuthAngle;
      orbit.minPolarAngle = insideCorridor ? .55 : 0;
      orbit.enabled = !state.current.paused && !spinningRef.current;
      orbit.enableDamping = !state.current.reduceMotion;
      orbit.update();
      const offset = corridorCameraOffset(orbitCamera.position, player.position.x, worldRoll, insideCorridor);
      camera.position.set(player.position.x + offset.x, offset.y, player.position.z + orbitCamera.position.z);
      camera.lookAt(lookTarget);

      worldPivot.position.set(player.position.x, 0, player.position.z);
      world.position.set(-player.position.x, 0, -player.position.z);
      worldPivot.rotation.z = player.rotation.z = worldRoll;
      scene.updateMatrixWorld(true);
      occluders.forEach(({ object, normal }) => {
        object.getWorldPosition(objectPoint);
        object.getWorldQuaternion(objectQuaternion);
        worldNormal.copy(normal).applyQuaternion(objectQuaternion);
        object.visible = !shouldHideWall(cameraPoint.copy(camera.position), objectPoint, worldNormal);
      });
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      state.current.onSound?.('witch-stop'); state.current.onSound?.('stop');
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      renderer.domElement.removeEventListener('pointercancel', pointerCancel);
      clear(); actions.current = {}; signsRef.current = null; canvasRef.current = null;
      textures.forEach(texture => texture.dispose());
      const shared = new Set(materials.values());
      scene.traverse(item => {
        if (item.userData.galleryShared) return;
        item.geometry?.dispose();
        const list = item.material ? (Array.isArray(item.material) ? item.material : [item.material]) : [];
        list.forEach(value => { if (!shared.has(value)) value.dispose(); });
      });
      shared.forEach(value => value.dispose());
      gallery.dispose(); orbit.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [advanceScene]);

  const press = (key, down) => {
    if (paused || spinning) { setTouchMovement(keys.current, key, false); return; }
    setTouchMovement(keys.current, key, down);
  };

  return <section className="lake cursed-castle corridor">
    <div className="lake-viewport">
      <div ref={mount} className="lake-canvas" />
      {campaignNavigation ?? <button className="lake-exit" onClick={exitScene}>{en ? 'Return to outskirts' : 'Voltar aos arredores'}</button>}
      <div className="corridor-status">
        <div className="cursed-heading">
          <strong>{en ? 'HALL OF INFINITY' : 'CORREDOR DO INFINITO'}</strong>
          <small>{en ? 'Every tenth door turns the room.' : 'A cada dez trechos, a sala gira.'}</small>
          {!campaignNavigation && <button type="button" className="lake-exit corridor-skip" onClick={advanceScene} disabled={paused}>
            {en ? 'Skip to next room' : 'Pular para a próxima sala'}
          </button>}
        </div>
        <div className="corridor-hud" aria-label={en ? 'Cloak status' : 'Estado do manto'}>
          <span className="corridor-stretch">{en ? `Stretch ${segment}` : `Trecho ${segment}`}</span>
          <span className="corridor-spins">{en ? `Turns ${spinCount}/${SPINS_TO_ESCAPE}` : `Giros ${spinCount}/${SPINS_TO_ESCAPE}`}</span>
          {spinCount > 0 && <span className="corridor-checkpoint">{en ? 'Door checkpoint set' : 'Checkpoint da porta marcado'}</span>}
          {spinCount > 0 && !spinning && <span className="corridor-surface">{surface === 'floor' ? (en ? 'Back on the floor' : 'De volta ao chão') : surface === 'ceiling' ? (en ? 'On the ceiling' : 'No teto') : (en ? 'On the wall' : 'Na parede')}</span>}
          {cloakTaken && <><div className={`corridor-phase ${phase.invisible ? 'invisible' : 'visible'}`} aria-live="polite"><strong>{phase.invisible ? (en ? 'Invisible' : 'Invisível') : (en ? 'Visible' : 'Visível')}</strong><span>{Math.ceil(phase.remaining)}s</span></div><div className="corridor-sanity"><small>{en ? 'Sanity' : 'Sanidade'}</small><span>{Array.from({ length: 3 }, (_, index) => <i key={index} className={index < sanity ? 'alive' : ''} />)}</span></div></>}
          {spinning && <span className="corridor-turning">{en ? 'The room is turning...' : 'A sala está girando...'}</span>}
          {corridorEnded && <span className="corridor-end">{en ? 'Corridor over · door ahead' : 'Corredor encerrado · porta adiante'}</span>}
        </div>
        {toast && <p className={`corridor-toast${toast.warning ? ' corridor-back-warning' : ''}${toast.warning && !reduceMotion ? ' corridor-back-warning-pulse' : ''}`} role="status">{toast.warning ? (en ? 'You cannot go back. Keep moving forward.' : 'Não é possível voltar. Siga em frente.') : toast.text}</p>}
      </div>
      {flash && <div className="corridor-flash" aria-hidden="true" />}
      {caught && <div className="corridor-caught" role="status">{en ? 'The shadows caught you. The corridor starts this stretch again.' : 'As sombras alcançaram você. O trecho recomeça.'}</div>}
      <div className="village-actions">
        {nearCloak && !cloakTaken && <button onClick={takeCloak}>{en ? 'Wear the ghost cloak' : 'Vestir o manto do fantasma'} <kbd>E</kbd></button>}
        {nearFloorDoor && !corridorEnded && <button onClick={turnRoom} disabled={spinning}>{en ? 'Turn the room' : 'Girar a sala'} <kbd>E</kbd></button>}
        {nearDoor && <button onClick={enterDoor}>{en ? 'Enter the next room' : 'Entrar na próxima sala'} <kbd>E</kbd></button>}
      </div>
      {error && <p className="lake-scene-error">{en ? '3D is unavailable in this browser.' : 'O 3D não está disponível neste navegador.'}</p>}
      <MapControlGuide language={language} scene="corridor" />
      {noticeOpen && <div className="corridor-notice"><article className="corridor-notice-card" role="dialog" aria-modal="false" aria-labelledby="corridor-notice-title"><h2 id="corridor-notice-title">{en ? 'No mortal may pass' : 'Um mortal não pode avançar'}</h2><p>{en ? 'You can explore this entrance freely, but not go into the corridor: it rebuilds itself for anyone who does not belong here. Take the ghost\'s cloak hanging on the wall: it hides you for 10 seconds, then leaves you visible for 10. While you are visible, nearby creatures can see and chase you. Every tenth stretch has a door on the floor: it is your checkpoint. The first three turns take you across both walls and the ceiling. The fourth puts you back on the floor and opens the way to the exit.' : 'Você pode explorar esta entrada à vontade, mas não avançar para o corredor: ele se reconstrói para quem não pertence aqui. Pegue o manto do fantasma pendurado na parede: ele esconde você por 10 segundos e depois deixa você visível por 10. Enquanto você estiver visível, as criaturas próximas podem enxergar e perseguir você. A cada dez trechos há uma porta no chão: ela é seu checkpoint. Os primeiros três giros levam você pelas duas paredes e pelo teto. O quarto devolve você ao chão e abre o caminho para a saída.'}</p><div className="npc-dialogue-actions"><button onClick={closeNotice}>{en ? 'I understand' : 'Entendi'}</button></div></article></div>}
    </div>
    <div className="lake-touch" aria-label={en ? 'Walking controls' : 'Controles de caminhada'}>
      {[['arrowleft', en ? 'Left' : 'Esquerda', '←'], ['arrowup', en ? 'Forward' : 'Frente', '↑'], ['arrowdown', en ? 'Back' : 'Trás', '↓'], ['arrowright', en ? 'Right' : 'Direita', '→']].map(([key, label, symbol]) => <button key={key} type="button" aria-label={label} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); press(key, true); }} onPointerUp={() => press(key, false)} onPointerCancel={() => press(key, false)} onLostPointerCapture={() => press(key, false)}>{symbol}</button>)}
      <TouchInteract language={language} disabled={paused || noticeOpen || caught || spinning || (((!nearCloak || cloakTaken) && !nearFloorDoor) && !nearDoor)} onInteract={interact} />
    </div>
  </section>;
}
