import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SITES, canWalk, nearbySite, walkingSurface, advanceFootsteps } from './villageNavigation';
import { VILLAGERS, createWalkingGraph, advanceVillager } from './villagers';
import './VillageScene.css';

export function createVillage(scene) {
  const materials = new Map();
  const material = (color, glow = false) => {
    const key = color + glow;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: glow ? .1 : 0, ...(glow ? { emissive: color, emissiveIntensity: 1.7 } : {}) }));
    return materials.get(key);
  };
  const mesh = (parent, geo, color, x, y, z, glow = false) => {
    const m = new THREE.Mesh(geo, material(color, glow)); m.position.set(x, y, z); m.castShadow = !glow; m.receiveShadow = true; parent.add(m); return m;
  };
  const box = (p, w, h, d, c, x, y, z, glow = false) => mesh(p, new THREE.BoxGeometry(w, h, d), c, x, y, z, glow);
  const cylinder = (p, r, h, c, x, y, z, sides = 8) => mesh(p, new THREE.CylinderGeometry(r, r, h, sides), c, x, y, z);
  const sphere = (p, r, c, x, y, z, glow = false) => mesh(p, new THREE.IcosahedronGeometry(r, 1), c, x, y, z, glow);
  const lamp = (p, x, y, z, color = '#ffb66d', intensity = 9) => {
    box(p, .12, .42, .12, '#202a31', x, y + .38, z);
    box(p, .24, .3, .24, color, x, y + .06, z, true);
    const light = new THREE.PointLight(color, intensity, 5, 2); light.position.set(x, y, z); p.add(light); return light;
  };
  const label = (p, title, subtitle, color, x, y, z) => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 224;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#101b24'; ctx.fillRect(0, 0, 768, 224);
    ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(10, 10, 748, 204);
    ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.font = 'bold 49px sans-serif'; ctx.fillText(title, 384, 92);
    ctx.fillStyle = '#e6e0d2'; ctx.font = '32px sans-serif'; ctx.fillText(subtitle, 384, 159);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true })); sprite.position.set(x, y, z); sprite.scale.set(4.8, 1.4, 1); p.add(sprite); return sprite;
  };
  const barrel = (p, x, z) => {
    cylinder(p, .4, .85, '#65503e', x, .5, z, 10);
    [.17, .75].forEach(y => cylinder(p, .415, .09, '#27343c', x, y, z, 10));
  };

  // A raised island, stone retaining wall and individual cobblestones.
  cylinder(scene, 19, 1.5, '#17232c', 0, -.9, 0, 64);
  cylinder(scene, 18.8, .22, '#253b36', 0, -.06, 0, 64);
  cylinder(scene, 17.6, .12, '#293b36', 0, .04, 0, 64);
  for (let i = 0; i < 90; i++) {
    const angle = i * Math.PI * 2 / 90;
    const rock = box(scene, 1.05, .65 + (i % 3) * .13, .7, i % 2 ? '#33424b' : '#2c3b43', Math.cos(angle) * 18.5, .08, Math.sin(angle) * 18.5); rock.rotation.y = -angle;
  }
  for (let x = -13; x <= 13; x++) for (let z = -13; z <= 13; z++) {
    if ((Math.abs(x) <= 1 || Math.abs(z) <= 1 || (Math.abs(z - 9) < 1 && Math.abs(x) < 10)) && Math.hypot(x, z) > 1.8) {
      const stone = box(scene, .88, .1, .86, (x + z) % 3 ? '#455056' : '#535c5e', x, .16, z); stone.rotation.y = Math.sin(x * 4 + z) * .08;
    }
  }
  // Fountain with luminous water and central crystal.
  cylinder(scene, 1.65, .45, '#53616a', 0, .32, 0, 16);
  cylinder(scene, 1.4, .08, '#3b939e', 0, .59, 0, 32);
  cylinder(scene, .34, 1.3, '#647579', 0, 1.1, 0);
  const crystal = mesh(scene, new THREE.OctahedronGeometry(.55), '#77c8d5', 0, 2.2, 0, true);
  const wellLight = new THREE.PointLight('#73bfcf', 17, 8); wellLight.position.set(0, 2, 0); scene.add(wellLight);

  const buildings = [];
  const flames = [];
  SITES.forEach((site, index) => {
    const g = new THREE.Group(); g.position.set(site.x, 0, site.z); g.userData.site = index; scene.add(g); buildings.push(g);
    box(g, 5.6, .35, 4.7, '#3e4a51', 0, .25, 0);
    box(g, 5, 3.6, 4, index === 1 ? '#485464' : '#4d4e4c', 0, 2.15, 0);
    // Timber framing, sills, masonry and stair at the door.
    [-2.4, 0, 2.4].forEach(x => box(g, .19, 3.7, 4.1, '#252a30', x, 2.15, 0));
    [1, 3.5].forEach(y => box(g, 5.1, .18, 4.12, '#2a3033', 0, y, 0));
    [-1.55, 1.55].forEach(x => {
      box(g, .95, 1.3, .14, '#242e39', x, 2.35, 2.07);
      box(g, .71, 1.05, .17, index === 1 ? '#96c1da' : '#e4a768', x, 2.35, 2.15, true);
      box(g, .07, 1.1, .2, '#383a3c', x, 2.35, 2.25); box(g, .8, .07, .2, '#383a3c', x, 2.35, 2.25);
      box(g, 1.25, .16, .45, '#64635c', x, 1.72, 2.2);
    });
    box(g, .95, 1.85, .17, '#775b42', 0, 1.3, 2.14); sphere(g, .07, '#bd9a62', .3, 1.3, 2.3);
    [0, 1, 2].forEach(i => box(g, 1.5 + i * .2, .15, .5, '#657074', 0, .45 - i * .11, 2.3 + i * .4));
    // Pitched roof: a triangular prism with actual enclosed gables.
    const shape = new THREE.Shape(); shape.moveTo(-2.9, 0); shape.lineTo(0, 2.1); shape.lineTo(2.9, 0); shape.closePath();
    const roof = mesh(g, new THREE.ExtrudeGeometry(shape, { depth: 4.8, bevelEnabled: false }), site.color, 0, 4, -2.4);
    roof.material = material(index === 0 ? '#633d3c' : index === 1 ? '#364d65' : index === 2 ? '#66513d' : '#3c5650');
    for (let r = 0; r < 5; r++) [-1, 1].forEach(side => {
      const beam = box(g, 3.65, .06, .07, '#222e36', side * 1.43, 5.05, -2.35 + r * 1.17); beam.rotation.z = side * -.627;
    });
    lamp(g, -2.1, 2.8, 2.5, '#ffb66d', 12);
    label(g, site.title, site.detail, site.color, 0, 7.2, 0);

    if (index === 0) {
      // Tavern: chimney, barrels, outdoor tables and a hanging mug sign.
      box(g, .7, 2.5, .7, '#5e6061', -1.5, 5.2, -.8);
      barrel(g, -3.4, 1.1); barrel(g, -3.5, -.2);
      cylinder(g, .85, .16, '#7b6047', 3.6, 1.1, 2.6); cylinder(g, .1, 1, '#423930', 3.6, .55, 2.6);
      [-1, 1].forEach(s => box(g, 1.2, .22, .45, '#64513e', 3.6, .55, 2.6 + s));
      box(g, 1.3, .13, .13, '#77654a', 2.6, 3.6, 2.6);
      cylinder(g, .32, .55, '#dfb46e', 3.1, 3.1, 2.6); const handle = mesh(g, new THREE.TorusGeometry(.23, .07, 6, 12), '#d9b168', 3.45, 3.1, 2.6); handle.rotation.y = 0;
    }
    if (index === 1) {
      // Library: tower and a clearly visible outdoor bookshelf with colored spines.
      cylinder(g, 1, 6.3, '#455464', 2.4, 3.35, -1.25, 12);
      mesh(g, new THREE.ConeGeometry(1.45, 2.2, 12), '#374e69', 2.4, 7.5, -1.25);
      box(g, 2.4, 2.6, .7, '#292f39', -3.6, 1.5, 1);
      [0, 1, 2].forEach(row => {
        box(g, 2.5, .12, .8, '#827055', -3.6, .42 + row * .8, 1);
        for (let b = 0; b < 8; b++) { const book = box(g, .2, .4 + (b % 3) * .1, .45, ['#a57454', '#688a98', '#ae9d6d', '#6b7c63'][b % 4], -4.6 + b * .28, .8 + row * .8, 1.1); book.rotation.z = b % 3 === 0 ? .12 : 0; }
      });
      // Open book above the entrance, rendered as two angled pages.
      [-1, 1].forEach(s => { const page = box(g, .7, .08, .9, '#e0c895', s * .32, 3.55, 2.5); page.rotation.z = s * .25; });
    }
    if (index === 2) {
      // Workshop: open forge, glowing coals, anvil and a large hammer.
      box(g, 1.7, 1.7, 1.5, '#353c43', -3.5, 1, .3); box(g, 1.2, .7, .12, '#fa7839', -3.5, 1.1, 1.1, true);
      box(g, .8, 3, .8, '#454b51', -3.5, 3.2, .1);
      const flame = sphere(g, .4, '#ffb350', -3.5, 1.2, 1.2, true); flames.push(flame);
      const fire = new THREE.PointLight('#ff7837', 19, 7); fire.position.set(-3.4, 1.4, 1.8); g.add(fire);
      box(g, .8, .5, .8, '#645542', 3.7, .6, 1.5); box(g, .6, .5, .6, '#46515a', 3.7, 1.1, 1.5); box(g, 1.3, .25, .65, '#8c9697', 3.7, 1.45, 1.5);
      const horn = mesh(g, new THREE.ConeGeometry(.3, .75, 4), '#8c9697', 4.55, 1.45, 1.5); horn.rotation.z = -Math.PI / 2;
      box(g, .13, 1.2, .13, '#a17c50', 1.2, 3.4, 2.3); box(g, .7, .35, .4, '#a3a6a4', 1.2, 3.9, 2.3);
      barrel(g, 3.4, -1);
    }
    if (index === 3) {
      // Post office: envelope emblem, mailbox, packages and a flag.
      box(g, 1.35, .85, .15, '#dfc69c', 0, 3.5, 2.2);
      [-1, 1].forEach(s => { const line = box(g, .82, .04, .06, '#826b4c', s * .32, 3.55, 2.31); line.rotation.z = s * .55; });
      cylinder(g, .12, 1.6, '#445252', 3.4, .8, 2.3); box(g, .85, .8, .65, '#638e7c', 3.4, 1.6, 2.3); box(g, .55, .09, .05, '#17252b', 3.4, 1.65, 2.65);
      [0, 1, 2].forEach(i => { box(g, .6, .5 + i % 2 * .2, .65, '#a0845c', -3.3 + i * .45, .45 + (i === 2 ? .5 : 0), 2); box(g, .1, .53, .68, '#d0ba88', -3.3 + i * .45, .45 + (i === 2 ? .5 : 0), 2); });
      cylinder(g, .065, 4, '#7d8581', 3.3, 2, -.8); box(g, 1.1, .65, .05, '#84aa8e', 3.85, 3.5, -.8);
    }
  });

  // Pine forest, rocks, mushrooms and lanterns make the surroundings readable in the dark.
  for (let i = 0; i < 44; i++) {
    const a = i * 2.39996, r = 14.5 + (i % 5) * .7, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const tree = new THREE.Group(); tree.position.set(x, 0, z); scene.add(tree); const h = 2.6 + i % 4 * .55;
    cylinder(tree, .16, h, '#493c36', 0, h / 2, 0);
    for (let j = 0; j < 3; j++) mesh(tree, new THREE.ConeGeometry(1.2 - j * .23, 2.1, 7), ['#253f39', '#2d4a41', '#36574b'][j], 0, h * .6 + j * .75, 0);
    if (i % 3 === 0) { const rock = mesh(scene, new THREE.DodecahedronGeometry(.45 + i % 2 * .3), '#4a555c', x * .88, .35, z * .88); rock.scale.y = .65; }
  }
  [[-2.8, -9], [2.8, -9], [-2.8, 9], [2.8, 9], [-11, 0], [11, 0]].forEach(([x, z]) => { cylinder(scene, .08, 2.6, '#39434b', x, 1.3, z); lamp(scene, x, 2.8, z); });
  // Articulated, fully volumetric adventurer.
  const player = new THREE.Group(); scene.add(player); player.position.set(0, .2, 5);
  const body = new THREE.Group(); player.add(body);
  box(body, .65, .85, .4, '#496e76', 0, 1.12, 0);
  box(body, .71, .13, .45, '#9e8054', 0, .87, 0); box(body, .13, .17, .48, '#dec38c', 0, .87, .02);
  sphere(body, .28, '#c5a27f', 0, 1.82, 0); sphere(body, .29, '#463c39', 0, 1.94, -.06);
  box(body, .5, .15, .1, '#c5a27f', 0, 1.79, .22);
  [-1, 1].forEach(s => sphere(body, .035, '#17232d', s * .11, 1.83, .285));
  const hat = mesh(body, new THREE.ConeGeometry(.43, .5, 8), '#345360', 0, 2.22, 0); hat.rotation.z = -.16;
  cylinder(body, .47, .08, '#345360', 0, 2.02, 0);
  const cape = box(body, .7, 1.05, .08, '#933e4d', 0, 1.1, -.29); cape.rotation.x = -.13;
  box(body, .42, .5, .25, '#7e6248', 0, 1.3, -.42);
  const limbs = [];
  [-1, 1].forEach(s => {
    const leg = new THREE.Group(); leg.position.set(s * .19, .8, 0); body.add(leg); box(leg, .24, .62, .25, '#303846', 0, -.3, 0); box(leg, .28, .2, .42, '#514737', 0, -.61, .07); limbs.push(leg);
    const arm = new THREE.Group(); arm.position.set(s * .46, 1.5, 0); body.add(arm); box(arm, .22, .62, .25, '#496e76', 0, -.28, 0); sphere(arm, .12, '#c5a27f', 0, -.61, 0); limbs.push(arm);
  });
  const ring = mesh(player, new THREE.TorusGeometry(.55, .025, 5, 36), '#a9d4ba', 0, .03, 0, true); ring.rotation.x = Math.PI / 2;
  const travelerLight = new THREE.PointLight('#c6e0d3', 2.4, 4); travelerLight.position.set(0, 1.4, 1); player.add(travelerLight);

  const npcs = VILLAGERS.map((person, index) => {
    const group = new THREE.Group(); group.position.set(person.x, .2, person.z); group.userData.npc = index; scene.add(group);
    const torso = new THREE.Group(); group.add(torso);
    const librarian = person.name === 'Bia', messenger = person.name === 'Lia';
    const feminine = librarian || messenger;
    if (feminine) {
      // Tailored silhouettes rather than recoloring the same square tunic.
      mesh(torso, new THREE.CylinderGeometry(.31, .25, .67, 8), person.color, 0, 1.22, 0);
      box(torso, .52, .09, .4, '#bca276', 0, .9, 0);
      if (librarian) {
        mesh(torso, new THREE.CylinderGeometry(.26, .53, .65, 10), '#566f99', 0, .58, 0);
        cylinder(torso, .53, .055, '#bda376', 0, .28, 0, 10);
        [-1, 1].forEach(s => { const collar = box(torso, .2, .08, .25, '#d5cbb7', s * .12, 1.52, .16); collar.rotation.z = s * .28; });
        sphere(torso, .065, '#d9b979', 0, 1.35, .31);
        // A small book reinforces her role even away from the library.
        box(torso, .28, .36, .12, '#8b5b62', -.34, .99, .22);
        box(torso, .22, .28, .13, '#dacbb0', -.34, .99, .23);
      } else {
        mesh(torso, new THREE.CylinderGeometry(.26, .4, .4, 8), '#527b6c', 0, .78, 0);
        box(torso, .49, .12, .44, '#d2aa68', 0, 1.53, 0);
        const scarf = box(torso, .15, .43, .07, '#d2aa68', -.18, 1.32, .25); scarf.rotation.z = -.16;
      }
    } else {
      box(torso, .62, .8, .42, person.color, 0, 1.12, 0);
      box(torso, .66, .12, .45, '#5e4938', 0, .86, 0);
    }
    sphere(torso, .28, person.skin, 0, 1.81, 0);
    if (feminine) {
      const hair = librarian ? '#52352d' : '#29252e';
      mesh(torso, new THREE.SphereGeometry(.305, 12, 8, 0, Math.PI * 2, 0, Math.PI * .45), hair, 0, 1.82, 0);
      if (librarian) {
        box(torso, .49, .65, .22, hair, 0, 1.58, -.22);
        [-1, 1].forEach(s => { const lock = box(torso, .13, .64, .19, hair, s * .265, 1.6, -.015); lock.rotation.z = s * -.08; });
        [.0, .14, .28, .42].forEach(offset => sphere(torso, .115 - offset * .06, hair, -.31, 1.65 - offset, -.22));
        sphere(torso, .065, '#d7b46b', -.31, 1.19, -.22);
        // A visible headband catches the lantern light.
        const band = mesh(torso, new THREE.TorusGeometry(.305, .025, 5, 16, Math.PI), '#c6a775', 0, 1.85, .005); band.rotation.y = Math.PI / 2;
      } else {
        box(torso, .48, .32, .15, hair, 0, 1.79, -.23);
        sphere(torso, .18, hair, 0, 1.99, -.33);
        sphere(torso, .115, '#c5a165', 0, 1.91, -.45);
        const ponytail = mesh(torso, new THREE.ConeGeometry(.19, .67, 8), hair, 0, 1.61, -.5); ponytail.rotation.x = -.2;
        [-1, 1].forEach(s => { const lock = box(torso, .1, .32, .12, hair, s * .26, 1.76, .01); lock.rotation.z = s * .12; });
      }
    } else sphere(torso, .28, '#494039', 0, 1.96, -.06);
    [-1, 1].forEach(s => sphere(torso, .028, '#14212b', s * .1, 1.85, .26));
    if (index === 1) { box(torso, .4, .55, .08, '#5f4837', 0, 1.05, .25); cylinder(torso, .32, .13, '#ab8c5e', 0, 2.05, 0); }
    if (index === 2) { box(torso, .2, .32, .5, '#9a7754', .4, .9, 0); box(torso, .1, .8, .06, '#b69767', .25, 1.3, .26); }
    if (index === 3) cylinder(torso, .39, .12, '#704a54', 0, 2.08, 0);
    const joints = [];
    [-1, 1].forEach(s => {
      const leg = new THREE.Group(); leg.position.set(s * (feminine ? .16 : .18), .79, 0); torso.add(leg); box(leg, feminine ? .19 : .23, .6, .24, '#333d48', 0, -.3, 0); box(leg, feminine ? .23 : .26, .19, .38, '#514639', 0, -.61, .06); joints.push(leg);
      const arm = new THREE.Group(); arm.position.set(s * (feminine ? .36 : .43), 1.5, 0); torso.add(arm); box(arm, feminine ? .17 : .2, .57, .24, person.color, 0, -.27, 0); sphere(arm, feminine ? .095 : .11, person.skin, 0, -.58, 0); joints.push(arm);
    });
    const sign = label(group, person.name.toUpperCase(), 'F · CONVERSAR', person.color, 0, 3.05, 0); sign.scale.set(2.5, .73, 1);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 3, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); hit.position.y = 1.5; group.add(hit);
    return { group, body: torso, limbs: joints, route: [], wait: index * .6, speed: person.speed, phase: index * 1.7 };
  });

  const positions = [];
  for (let i = 0; i < 160; i++) positions.push(Math.sin(i * 134.8) * 21, 1 + (i % 19) * .55, Math.cos(i * 82.3) * 21);
  const particleGeo = new THREE.BufferGeometry(); particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const fireflies = new THREE.Points(particleGeo, new THREE.PointsMaterial({ color: '#b3caaa', size: .055, transparent: true, opacity: .65 })); scene.add(fireflies);
  return { buildings, player, body, limbs, crystal, flames, fireflies, cape, npcs };
}

export default function VillageScene({ keys, paused, onOpen, onNear, onStep, onTalk, onNearNpc, talkingNpc, zoom, resetKey }) {
  const mount = useRef(null);
  const live = useRef({ paused, onOpen, onNear, onStep, onTalk, onNearNpc, talkingNpc, zoom, resetKey });
  live.current = { paused, onOpen, onNear, onStep, onTalk, onNearNpc, talkingNpc, zoom, resetKey };
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = mount.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); } catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute('aria-label', 'Cenário 3D: arraste para girar a câmera e use WASD para caminhar');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0c131c'); scene.fog = new THREE.FogExp2('#0c131c', .009);
    scene.add(new THREE.HemisphereLight('#9fb9df', '#28382d', 1.3));
    const moon = new THREE.DirectionalLight('#a9c6ef', 2.6); moon.position.set(-12, 22, 8); moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -23, right: 23, top: 23, bottom: -23, far: 70 }); moon.shadow.camera.updateProjectionMatrix(); moon.shadow.normalBias = .035; scene.add(moon);
    const world = createVillage(scene);
    const walkingGraph = createWalkingGraph();
    const portrait = container.clientWidth < 600;
    const camera = new THREE.PerspectiveCamera(44, 1, .1, 160); camera.position.set(24, 24, 32).multiplyScalar(portrait ? 1.4 : 1);
    const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, 1.1, 0); controls.enableDamping = true; controls.dampingFactor = .07; controls.enablePan = false;
    controls.minDistance = 7; controls.maxDistance = 78; controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2 - .09; controls.update();
    const resize = () => { const { width, height } = container.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let start;
    const pointerdown = e => { start = { x: e.clientX, y: e.clientY }; };
    const pointerup = e => {
      if (!start || live.current.paused || Math.hypot(start.x - e.clientX, start.y - e.clientY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...world.buildings, ...world.npcs.map(n => n.group)], true)[0]; if (!hit) return;
      let object = hit.object; while (object && object.userData.site === undefined && object.userData.npc === undefined) object = object.parent;
      if (object?.userData.npc !== undefined) live.current.onTalk?.(object.userData.npc);
      else if (object) live.current.onOpen(object.userData.site);
    };
    renderer.domElement.addEventListener('pointerdown', pointerdown); renderer.domElement.addEventListener('pointerup', pointerup);
    const lost = e => { e.preventDefault(); setError(true); }; renderer.domElement.addEventListener('webglcontextlost', lost);
    const down = e => { const k = e.key.toLowerCase(); if (!live.current.paused && ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k) && !e.target.closest('button,a,input,audio')) { e.preventDefault(); keys.current.add(k); } };
    const up = e => keys.current.delete(e.key.toLowerCase()); const clear = () => keys.current.clear();
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    const forward = new THREE.Vector3(), right = new THREE.Vector3(), movement = new THREE.Vector3(); const target = new THREE.Vector3(); const delta = new THREE.Vector3();
    let frame, previous = 0, clock = 0, stepDistance = 0, oldNear = -2, oldNearNpc = -2, oldZoom = live.current.zoom, oldReset = live.current.resetKey;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = time => {
      const dt = Math.min((time - previous) / 1000 || 0, .04); previous = time; clock += dt;
      const k = keys.current; const movingX = Number(k.has('d') || k.has('arrowright')) - Number(k.has('a') || k.has('arrowleft')); const movingZ = Number(k.has('w') || k.has('arrowup')) - Number(k.has('s') || k.has('arrowdown'));
      let walking = false;
      if (!live.current.paused && (movingX || movingZ)) {
        camera.getWorldDirection(forward); forward.y = 0; forward.normalize(); right.crossVectors(forward, camera.up).normalize();
        movement.copy(forward).multiplyScalar(movingZ).addScaledVector(right, movingX).normalize().multiplyScalar(dt * 4.2);
        const p = world.player.position; const oldX = p.x, oldZ = p.z;
        if (canWalk(p.x + movement.x, p.z)) p.x += movement.x;
        if (canWalk(p.x, p.z + movement.z)) p.z += movement.z;
        const displacement = Math.hypot(p.x - oldX, p.z - oldZ);
        walking = displacement > .001;
        const footsteps = advanceFootsteps(stepDistance, displacement);
        stepDistance = footsteps.distance;
        if (footsteps.steps) live.current.onStep?.(walkingSurface(p.x, p.z));
        if (walking) { const yaw = Math.atan2(movement.x, movement.z); world.player.rotation.y += Math.atan2(Math.sin(yaw - world.player.rotation.y), Math.cos(yaw - world.player.rotation.y)) * Math.min(1, dt * 14);
          target.set(p.x * .65, 1.1, p.z * .65); delta.subVectors(target, controls.target).multiplyScalar(Math.min(1, dt * 2)); controls.target.add(delta); camera.position.add(delta);
        }
      }
      world.limbs.forEach((limb, i) => { limb.rotation.x = walking ? Math.sin(clock * 10) * .65 * (i < 2 ? 1 : -1) * (i % 2 ? -1 : 1) : THREE.MathUtils.damp(limb.rotation.x, 0, 14, dt); });
      world.body.position.y = walking ? Math.abs(Math.sin(clock * 10)) * .07 : 0;
      world.npcs.forEach((npc, index) => {
        const talking = live.current.talkingNpc === index;
        const moving = !live.current.paused && !talking && advanceVillager(npc, dt, walkingGraph);
        if (talking) { const p = world.player.position; npc.body.rotation.y = Math.atan2(p.x - npc.group.position.x, p.z - npc.group.position.z); }
        npc.limbs.forEach((joint, i) => { joint.rotation.x = moving ? Math.sin(clock * 6.5 + npc.phase) * .48 * ([1, -1, -1, 1][i]) : THREE.MathUtils.damp(joint.rotation.x, 0, 12, dt); });
        npc.body.position.y = moving ? Math.abs(Math.sin(clock * 6.5 + npc.phase)) * .045 : 0;
      });
      if (!reducedMotion) { world.crystal.rotation.y += dt * .45; world.crystal.position.y = 2.2 + Math.sin(clock * 1.4) * .1; world.cape.rotation.x = -.13 + Math.sin(clock * (walking ? 10 : 2)) * (walking ? .13 : .025); world.fireflies.rotation.y += dt * .012; world.flames.forEach(f => { f.scale.y = 1 + Math.sin(clock * 9) * .18; }); }
      const p = world.player.position; const near = nearbySite(p.x, p.z);
      if (near !== oldNear) { oldNear = near; live.current.onNear(near); }
      let closestNpc = -1, closestDistance = 2.7;
      world.npcs.forEach((npc, index) => { const d = Math.hypot(npc.group.position.x - p.x, npc.group.position.z - p.z); if (d < closestDistance) { closestNpc = index; closestDistance = d; } });
      if (closestNpc !== oldNearNpc) { oldNearNpc = closestNpc; live.current.onNearNpc?.(closestNpc); }
      if (live.current.zoom !== oldZoom) { camera.position.sub(controls.target).multiplyScalar(oldZoom / live.current.zoom).add(controls.target); oldZoom = live.current.zoom; }
      if (live.current.resetKey !== oldReset) { controls.target.set(p.x, 1.1, p.z); camera.position.set(p.x + 13, 15, p.z + 18); oldReset = live.current.resetKey; }
      controls.enabled = !live.current.paused; controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(draw);
    }; frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); clear();
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear);
      renderer.domElement.removeEventListener('pointerdown', pointerdown); renderer.domElement.removeEventListener('pointerup', pointerup); renderer.domElement.removeEventListener('webglcontextlost', lost);
      scene.traverse(o => { o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose(); m.dispose(); }); });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [keys]);

  return <div className="webgl-scene" ref={mount}>{error && <div className="scene-error"><strong>O cenário 3D precisa de WebGL 2.</strong><p>Você pode acessar todas as histórias pelo modo leitura ou pelos destinos abaixo.</p></div>}</div>;
}
