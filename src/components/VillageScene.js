import { createVillageWeather } from './VillageWeather';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ENGLISH_VILLAGE_SIGNS, SITES, PORTAL, isCastleThreshold, canWalk, nearbySite, walkingSurface, overlapsRoad, advanceFootsteps } from './villageNavigation';
import { VILLAGERS, createWalkingGraph, advanceVillager } from './villagers';
import { createDragon, createDayNight } from './VillageAtmosphere';
import { createMissionFireworks } from './MissionFireworks';
import mountainHorizon from '../assets/images/mountain-horizon.png';
import './VillageScene.css';

// Small facial details share the same proportions as the village residents.
export function addFaceDetails(parent, { box, sphere }, { headY, skin, radius = .28, brow = '#514139', mouthDepth = radius * .92, eyes = false }) {
  const face = new THREE.Group(); face.name = 'Detalhes do rosto'; face.position.y = headY; parent.add(face);
  [-1, 1].forEach(side => {
    box(face, .1, .022, .025, brow, side * .1, radius * .43, radius * .91);
    if (eyes) sphere(face, .028, '#14212b', side * .1, radius * .14, radius * .93);
  });
  sphere(face, .045, skin, 0, -radius * .16, radius * .98);
  box(face, .105, .022, .025, '#805e56', 0, -radius * .47, mouthDepth);
  return face;
}

export function createAdventurer(scene, { box, sphere, mesh, cylinder }, { armored = false } = {}) {
  // Articulated, fully volumetric adventurer.
  const player = new THREE.Group(); scene.add(player); player.position.set(0, .2, 5);
  const body = new THREE.Group(); player.add(body);
  box(body, .65, .85, .4, '#496e76', 0, 1.12, 0);
  box(body, .71, .13, .45, '#9e8054', 0, .87, 0); box(body, .13, .17, .48, '#dec38c', 0, .87, .02);
  sphere(body, .28, '#c5a27f', 0, 1.82, 0); sphere(body, .29, '#463c39', 0, 1.94, -.06);
  [-1, 1].forEach(s => sphere(body, .035, '#17232d', s * .11, 1.83, .285));
  addFaceDetails(body, { box, sphere }, { headY: 1.82, skin: '#c5a27f' });
  const hat = mesh(body, new THREE.ConeGeometry(.43, .5, 8), '#345360', 0, 2.22, 0); hat.rotation.z = -.16;
  hat.visible = !armored;
  const brim = cylinder(body, .47, .08, '#345360', 0, 2.02, 0); brim.visible = !armored;
  const cape = box(body, .7, 1.05, .08, '#933e4d', 0, 1.1, -.29); cape.rotation.x = -.13;
  const pack = box(body, .42, .5, .25, '#7e6248', 0, 1.3, -.42); pack.visible = !armored;
  cape.visible = !armored;
  const limbs = [];
  [-1, 1].forEach(s => {
    const leg = new THREE.Group(); leg.position.set(s * .19, .8, 0); body.add(leg); box(leg, .24, .62, .25, '#303846', 0, -.3, 0); box(leg, .28, .2, .42, '#514737', 0, -.61, .07); limbs.push(leg);
    const arm = new THREE.Group(); arm.position.set(s * .46, 1.5, 0); body.add(arm); box(arm, .22, .62, .25, '#496e76', 0, -.28, 0); sphere(arm, .12, '#c5a27f', 0, -.61, 0); limbs.push(arm);
  });
  // A espada acompanha o movimento do braço do aventureiro.
  const sword = new THREE.Group(); sword.position.set(0, -.6, .12); sword.rotation.z = Math.PI; sword.rotation.x = .15; limbs[3].add(sword);
  box(sword, .11, .35, .11, '#6e4b35', 0, -.13, 0);
  box(sword, .38, .09, .13, '#c6a968', 0, -.3, 0);
  box(sword, .15, .8, .07, '#cbd8dc', 0, -.74, 0);
  const tip = mesh(sword, new THREE.ConeGeometry(.105, .22, 4), '#dce8e8', 0, -1.23, 0); tip.rotation.z = Math.PI;
  sphere(sword, .075, '#c6a968', 0, .08, 0);
  const ring = mesh(player, new THREE.TorusGeometry(.55, .025, 5, 36), '#a9d4ba', 0, .03, 0, true); ring.rotation.x = Math.PI / 2;
  const travelerLight = new THREE.PointLight('#c6e0d3', 2.4, 4); travelerLight.position.set(0, 1.4, 1); player.add(travelerLight);

  return { player, body, limbs, cape, sword };
}

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
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true }));
    sprite.userData.setLanguage = language => {
      const en = language === 'en-US';
      ctx.fillStyle = '#101b24'; ctx.fillRect(0, 0, 768, 224);
      ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.strokeRect(10, 10, 748, 204);
      ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.font = 'bold 49px sans-serif'; ctx.fillText(en ? (ENGLISH_VILLAGE_SIGNS[title] || title) : title, 384, 92);
      ctx.fillStyle = '#e6e0d2'; ctx.font = '32px sans-serif'; ctx.fillText(en ? (ENGLISH_VILLAGE_SIGNS[subtitle] || subtitle) : subtitle, 384, 159);
      tex.needsUpdate = true;
    };
    sprite.userData.setLanguage('pt-BR'); sprite.position.set(x, y, z); sprite.scale.set(4.8, 1.4, 1); p.add(sprite); return sprite;
  };
  const barrel = (p, x, z) => {
    cylinder(p, .4, .85, '#65503e', x, .5, z, 10);
    [.17, .75].forEach(y => cylinder(p, .415, .09, '#27343c', x, y, z, 10));
  };

  // Decorative figures belong to the buildings and have no conversation state.
  const performers = [];
  const person = (parent, x, z, coat, seated = false) => {
    const group = new THREE.Group(); group.position.set(x, 0, z); parent.add(group);
    const torso = new THREE.Group(); torso.position.y = seated ? .42 : .2; group.add(torso);
    box(torso,.65,.8,.4,coat,0,1.05,0); sphere(torso,.29,'#c9a789',0,1.75,0);
    [-1,1].forEach(side=>{
      sphere(torso,.028,'#14212b',side*.1,1.79,.27);
      box(torso,.12,.025,.04,'#514139',side*.11,1.88,.27);sphere(torso,.055,'#bd957e',side*.3,1.75,0);
      box(torso,.22,.55,.24,'#3a4148',side*.18,.38,seated?.2:0);
    });
    sphere(torso,.055,'#d3ad90',0,1.72,.3);box(torso,.13,.025,.035,'#805e56',0,1.62,.27);
    const arm = new THREE.Group();arm.position.set(.42,1.36,0);torso.add(arm);box(arm,.2,.55,.23,coat,0,-.25,0);sphere(arm,.11,'#c9a789',0,-.56,0);
    box(torso,.2,.55,.23,coat,-.42,1.08,0);
    return {group, torso, arm};
  };

  // Rectangular island, shoreline and a dock south of the portal.
  box(scene, 38, 1.5, 48, '#17232c', 0, -.9, -9);
  box(scene, 37.6, .22, 47.6, '#253b36', 0, -.06, -9);
  box(scene, 37, .12, 47, '#293b36', 0, .04, -9);
  // A connected plaza extends the eastern road beyond the original shore.
  box(scene,14,1.5,18,'#17232c',24,-.9,0);
  box(scene,14,.22,18,'#253b36',24,-.06,0);
  box(scene,14,.12,18,'#293b36',24,.04,0);
  const waterMaterial = new THREE.MeshStandardMaterial({ color:'#214c58', roughness:.55, metalness:.12 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(58, 42), waterMaterial);
  water.rotation.x = -Math.PI / 2; water.position.set(0, -.62, 10); water.name = 'Mar da doca'; scene.add(water);
  const groundBackground = new THREE.Mesh(new THREE.PlaneGeometry(210, 210), waterMaterial);
  groundBackground.rotation.x = -Math.PI / 2; groundBackground.position.y = -.66;
  groundBackground.name = 'Fundo da agua'; scene.add(groundBackground);
  // A flat panoramic image wraps the horizon; it never affects navigation.
  const horizonTexture = new THREE.TextureLoader().load(mountainHorizon);
  horizonTexture.colorSpace = THREE.SRGBColorSpace;
  horizonTexture.wrapS = THREE.RepeatWrapping;
  horizonTexture.repeat.y = .55;
  const alphaPixels = new Uint8Array(256 * 4);
  for (let y = 0; y < 256; y++) {
    const opacity = Math.round(255 * Math.min(1, Math.max(0, (1 - y / 255) * 4)));
    alphaPixels.set([opacity, opacity, opacity, 255], y * 4);
  }
  const horizonFade = new THREE.DataTexture(alphaPixels, 1, 256, THREE.RGBAFormat);
  horizonFade.magFilter = THREE.LinearFilter; horizonFade.minFilter = THREE.LinearFilter; horizonFade.needsUpdate = true;
  const backdrop = new THREE.Mesh(new THREE.CylinderGeometry(105, 105, 46, 48, 1, true), new THREE.MeshBasicMaterial({ map: horizonTexture, alphaMap: horizonFade, side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, color: '#ffffff' }));
  backdrop.name = 'Panorama de montanhas'; backdrop.position.y = 6; backdrop.renderOrder = -9; backdrop.frustumCulled = false; scene.add(backdrop);
  const dock=new THREE.Group();dock.rotation.y=-Math.PI/2;dock.position.z=-4;scene.add(dock);
  for(let x=18;x<=25;x+=.5) box(dock,.43,.18,3,'#806345',x,.18,0);
  [18.5,21.5,24.5].forEach(x=>[-1.3,1.3].forEach(z=>{cylinder(dock,.12,1.1,'#564737',x,-.28,z);sphere(dock,.14,'#bda477',x,.36,z);}));
  const boat=new THREE.Group();boat.position.set(25,-.31,3.6);dock.add(boat);
  const hull=mesh(boat,new THREE.CylinderGeometry(.85,.45,3.4,6,1,false,0,Math.PI),'#76513a',0,.25,0);hull.rotation.z=Math.PI/2;hull.rotation.y=Math.PI/2;
  box(boat,2.5,.18,1.2,'#876244',0,.45,0);box(boat,.22,.17,1.3,'#b58a59',-.6,.57,0);box(boat,.22,.17,1.3,'#b58a59',.6,.57,0);
  box(boat,.11,1.9,.11,'#b4956d',0,1.4,0);const sail=box(boat,.05,1.15,1.25,'#d9cdae',.03,1.65,0);sail.rotation.x=.12;
  // Group static stones into instances to reduce draw calls and shadow work.
  const stoneGroups = new Map();
  const addStone = (w, h, d, color, x, y, z, rotation) => {
    const key = [w, h, d, color].join(':');
    if (!stoneGroups.has(key)) stoneGroups.set(key, { w, h, d, color, transforms: [] });
    const transform = new THREE.Object3D(); transform.position.set(x, y, z); transform.rotation.y = rotation; transform.updateMatrix();
    stoneGroups.get(key).transforms.push(transform.matrix.clone());
  };
  for (let x=-18;x<=18;x++) for (const z of [-32.5,14.5]) { if (z>0 && Math.abs(x)<2) continue; addStone(1,.7,.7,'#33424b',x,.08,z,0); }
  for (let z=-31;z<=13;z++) for (const x of [-18.5,18.5]) {
    if (x > 0 && Math.abs(z) < 3) continue;
    addStone(1,.7,.7,'#2c3b43',x,.08,z,Math.PI/2);
  }
  for (let x = -17; x <= 17; x++) for (let z = -20; z <= 13; z++) {
    if ((Math.abs(x) <= 1 || Math.abs(z) <= 1 || (Math.abs(z - 9) < 1 && Math.abs(x) < 10)) && Math.hypot(x, z) > 1.8) {
      addStone(.88, .1, .86, (x + z) % 3 ? '#455056' : '#535c5e', x, .16, z, Math.sin(x * 4 + z) * .08);
    }
  }
  stoneGroups.forEach(({w, h, d, color, transforms}) => {
    const stones = new THREE.InstancedMesh(new THREE.BoxGeometry(w, h, d), material(color), transforms.length);
    transforms.forEach((matrix, i) => stones.setMatrixAt(i, matrix));
    stones.castShadow = true; stones.receiveShadow = true; stones.instanceMatrix.needsUpdate = true; stones.computeBoundingSphere(); scene.add(stones);
  });
  // Fountain with luminous water and central crystal.
  cylinder(scene, 1.65, .45, '#53616a', 0, .32, 0, 16);
  cylinder(scene, 1.4, .08, '#3b939e', 0, .59, 0, 32);
  cylinder(scene, .34, 1.3, '#647579', 0, 1.1, 0);
  const crystal = mesh(scene, new THREE.OctahedronGeometry(.55), '#77c8d5', 0, 2.2, 0, true);
  const wellLight = new THREE.PointLight('#73bfcf', 17, 8); wellLight.position.set(0, 2, 0); scene.add(wellLight);

  const buildings = [];
  const flames = [];
  const portal = new THREE.Group(); portal.position.set(PORTAL.x, 0, PORTAL.z); portal.rotation.y = Math.PI / 2; portal.userData.site = 4; scene.add(portal);
  cylinder(portal, 2.1, .25, '#4a5268', 0, .3, 0, 24);
  mesh(portal, new THREE.TorusGeometry(1.65, .2, 12, 40), '#86c9e7', 0, 2.25, 0, true);
  const portalSurface = new THREE.Mesh(new THREE.CircleGeometry(1.46, 40), new THREE.MeshBasicMaterial({ color: '#5b8fd5', transparent: true, opacity: .8, side: THREE.DoubleSide })); portalSurface.position.set(0, 2.25, 0); portal.add(portalSurface);
  label(portal, 'PORTAL', 'Playground', '#a8d9f0', 0, 5.1, 0);
  const portalLight = new THREE.PointLight('#78aaff', 14, 8); portalLight.position.set(0, 2, 1); portal.add(portalLight);
  // The castle spans the island, with four towers on each long facade.
  const castle = new THREE.Group(); castle.position.set(0, 0, -24); scene.add(castle);
  box(castle,35,9.5,12,'#59636d',0,4.85,0);
  box(castle,35.5,.45,12.5,'#3d4b57',0,9.75,0);
  for(let offset=-17;offset<=17;offset+=1.25){
    [-1,1].forEach(side=>box(castle,.7,1,.7,'#6d7780',offset,10.45,side*5.9));
  }
  for(let offset=-5;offset<=5;offset+=1.25){
    [-1,1].forEach(side=>box(castle,.7,1,.7,'#6d7780',side*17.3,10.45,offset));
  }
  const castleTowers = [-16.3,-5.4,5.4,16.3].flatMap(x=>[-1,1].map(depth=>{
    const z=depth*5.7, side=Math.sign(x);
    const tower=cylinder(castle,1.5,12,'#53616d',x,6,z,12);
    mesh(castle,new THREE.ConeGeometry(1.95,3.4,12),'#46546c',x,13.7,z);
    box(castle,.4,1.35,.12,'#d9ad68',x,7,z+depth*1.5,true);
    cylinder(castle,.07,2.2,'#9aa9aa',x,15.8,z);
    box(castle,.8,.5,.05,'#a14d51',x+side*.4,16.5,z);
    return tower;
  }));
  [-14,-11,-8,-2.4,2.4,8,11,14].forEach(x=>{
    box(castle,.45,1.3,.12,'#e4ba7a',x,6,6.03,true);
    box(castle,.45,1.3,.12,'#ddb77d',x,6,-6.04,true);
  });
  [-1,1].forEach(side=>box(castle,.12,1.3,.45,'#ddb77d',side*17.55,6,0,true));
  const castleDoor=box(castle,2.7,3.8,.18,'#322c2a',0,2.1,6.03);castleDoor.userData.site=5;
  const castleArch=mesh(castle,new THREE.TorusGeometry(1.37,.22,8,24,Math.PI),'#a99b7d',0,4,6.16);castleArch.rotation.z=0;
  [-1,1].forEach(side=>box(castle,.22,3.6,.25,'#a99b7d',side*1.32,2.2,6.15));
  // Two archers keep watch above the front battlements.
  const castleArchers = [-1, 1].map(side => {
    const archer = person(castle, side * 3.2, 4.8, '#536c54');
    archer.group.name = side < 0 ? 'Arqueiro esquerdo' : 'Arqueiro direito';
    archer.group.position.y = 10; archer.group.rotation.y = side * -.16;
    cylinder(archer.torso,.32,.13,'#566a52',0,2.04,0);
    mesh(archer.torso,new THREE.ConeGeometry(.33,.38,8),'#5c7358',0,2.28,0);
    box(archer.torso,.3,.65,.22,'#6f5039',-.32,1.3,-.25);
    for(let n=0;n<3;n++){const arrow=box(archer.torso,.035,.65,.035,'#cbb482',-.42+n*.09,1.72,-.25);arrow.rotation.z=-.12;}
    const bow=mesh(archer.torso,new THREE.TorusGeometry(.5,.035,6,24,Math.PI),'#9c7047',.63,1.12,.2);bow.rotation.z=-Math.PI/2;
    box(archer.torso,.025,1,.025,'#d4c8a1',.63,1.12,.2);
    performers.push({kind:'watch',torso:archer.torso,phase:side});
    return archer;
  });
  // Silent armored sentries stand beside the castle gate.
  const castleGuards = [-1, 1].map(side => {
    const guard = createAdventurer(castle, { box, sphere, mesh, cylinder }, { armored: true });
    guard.player.position.set(side * 2.1, .2, 6.7);
    box(guard.body,.79,.76,.49,'#768b91',0,1.2,0);
    box(guard.body,.12,.68,.51,'#b4c3c4',0,1.2,.01);
    mesh(guard.body,new THREE.SphereGeometry(.36,12,8,0,Math.PI*2,0,Math.PI*.48),'#74868a',0,1.94,-.02);
    [-1,1].forEach(side=>box(guard.body,.12,.3,.15,'#65787e',side*.31,1.85,.18));
    box(guard.body,.65,.1,.18,'#65787e',0,2.01,.2);
    [-1,1].forEach(s=>box(guard.body,.34,.22,.5,'#99a9aa',s*.49,1.55,0));
    box(guard.limbs[1],.48,.7,.13,'#5e6d7b',0,-.35,.25);
    return guard;
  });
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
    label(g, site.title, site.detail, site.color, 0, 7.2, 3.1);

    if (index === 0) {
      // Tavern: chimney, barrels, outdoor tables and a hanging mug sign.
      box(g, .7, 2.5, .7, '#5e6061', -1.5, 5.2, -.8);
      barrel(g, -3.4, 1.1); barrel(g, -3.5, -.2);
      cylinder(g, .85, .16, '#7b6047', 3.6, 1.1, 2.6); cylinder(g, .1, 1, '#423930', 3.6, .55, 2.6);
      [-1, 1].forEach(s => box(g, 1.2, .22, .45, '#64513e', 3.6, .55, 2.6 + s));
      box(g, 1.3, .13, .13, '#77654a', 2.6, 3.6, 2.6);
      const elder=person(g,3.6,1.55,'#6f5e4d',true);box(elder.torso,.46,.32,.16,'#c9c6b4',0,1.55,.24);sphere(elder.torso,.31,'#b9b7a8',0,1.95,-.05);
      cylinder(elder.arm,.14,.3,'#9e764d',0,-.64,.12);cylinder(elder.arm,.145,.04,'#e6c376',0,-.49,.12);performers.push({kind:'drink',arm:elder.arm,group:elder.group});
      cylinder(g, .32, .55, '#dfb46e', 3.1, 3.1, 2.6); const handle = mesh(g, new THREE.TorusGeometry(.23, .07, 6, 12), '#d9b168', 3.45, 3.1, 2.6); handle.rotation.y = 0;
    }
    if (index === 1) {
      // Library tower and open book above the entrance.
      cylinder(g, 1, 6.3, '#455464', 2.4, 3.35, -1.25, 12);
      mesh(g, new THREE.ConeGeometry(1.45, 2.2, 12), '#374e69', 2.4, 7.5, -1.25);
      const reader=person(g,-3.6,2.15,'#526d88');reader.group.rotation.y=.3;sphere(reader.torso,.29,'#594738',0,1.94,-.09);box(reader.torso,.12,.42,.18,'#594738',-.27,1.7,-.08);box(reader.torso,.12,.42,.18,'#594738',.27,1.7,-.08);
      [-1,1].forEach(side=>{const lens=mesh(reader.torso,new THREE.TorusGeometry(.105,.025,6,16),'#30383d',side*.13,1.8,.29);lens.rotation.y=0;});box(reader.torso,.5,.35,.1,'#e6d7b7',0,1.24,.45);box(reader.torso,.04,.36,.11,'#a98458',0,1.24,.46);reader.arm.rotation.x=-1;performers.push({kind:'read',torso:reader.torso});
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
      const smith=person(g,3.6,.1,'#62504a');box(smith.torso,.4,.2,.1,'#564137',0,1.59,.27);sphere(smith.torso,.28,'#443b36',0,1.96,-.06);box(smith.torso,.5,.55,.12,'#9a7956',0,1.02,.25);box(smith.arm,.1,.7,.1,'#9b794f',0,-.6,.12);box(smith.arm,.55,.24,.25,'#889698',0,-.95,.12);box(g,.12,.06,.9,'#c5d0d0',3.7,1.62,1.5);performers.push({kind:'forge',arm:smith.arm,group:smith.group});
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

  // A compact plaza is centered at the end of the eastern road.
  const market = new THREE.Group(); market.name = 'Mercado da vila'; scene.add(market);
  const plazaGeometry=new THREE.BoxGeometry(.92,.045,.92);const plazaMaterial=material('#65716b');const tiles=[];
  for(let x=18;x<=30;x++)for(let z=-8;z<=8;z++){const t=new THREE.Object3D();t.position.set(x,.12,z);t.rotation.y=Math.sin(x*3+z)*.04;t.updateMatrix();tiles.push(t.matrix.clone());}
  const paving=new THREE.InstancedMesh(plazaGeometry,plazaMaterial,tiles.length);tiles.forEach((matrix,i)=>paving.setMatrixAt(i,matrix));paving.instanceMatrix.needsUpdate=true;paving.receiveShadow=true;paving.computeBoundingSphere();market.add(paving);
  const stall=(z,colors)=>{
    const stand=new THREE.Group();stand.position.set(28,0,z);stand.rotation.y=-Math.PI/2;market.add(stand);
    box(stand,3.5,.2,1.65,'#79573d',0,1.1,0);box(stand,3.4,.72,.12,'#73513a',0,.68,-.69);
    [-1,1].forEach(side=>{box(stand,.16,2.9,.16,'#604632',side*1.55,1.5,-.62);box(stand,.16,2.9,.16,'#604632',side*1.55,1.5,.65);});
    for(let stripe=0;stripe<7;stripe++){const cloth=box(stand,.51,.12,1.95,colors[stripe%2],-1.5+stripe*.5,2.92,0);cloth.rotation.x=-.1;}
    return stand;
  };
  const produce=stall(-5.2,['#a45d51','#e1c998']);produce.userData.site=7;produce.name='Barraca da experiência';
  [-1,0,1].forEach((x,i)=>{box(produce,.8,.16,.65,'#94704e',x,1.27,0);for(let j=0;j<3;j++){const fruit=sphere(produce,.17,['#bb604f','#d6b25c','#7d9b65'][i],x+(j-1)*.21,1.47,.05);fruit.scale.y=.85;}});
  const goods=stall(0,['#6c8a76','#dfcca1']);goods.userData.site=8;goods.name='Barraca da formação';
  [-1,0,1].forEach((x,i)=>{if(i===0){cylinder(goods,.15,.42,'#83a99a',x,1.42,0,10);cylinder(goods,.08,.1,'#d7bc85',x,1.67,0,8);}else{const loaf=sphere(goods,.3,'#c5945a',x,1.38,0);loaf.scale.set(1.4,.65,.7);}});
  label(produce,'EXPERIÊNCIA','Toque para conhecer','#e8d4b4',0,3.9,0);
  label(goods,'FORMAÇÃO','Toque para conhecer','#d0e4c8',0,3.9,0);
  const marketStall=stall(5.2,['#617b91','#decba6']);marketStall.userData.site=6;marketStall.name='Vitrine de tecnologias';
  [-1,0,1].forEach((x,i)=>{const book=box(marketStall,.7,.5,.16,['#587e97','#98765c','#6e8a70'][i],x,1.46,0);book.rotation.x=-.2;box(marketStall,.45,.06,.17,'#dfd1ad',x,1.5,.09);});
  label(marketStall,'TECNOLOGIAS','Toque para conhecer','#c5d6cf',0,3.9,0);
  const marketVendors=[-5.2,0,5.2].map((z,i)=>{
    const vendor=person(market,29.1,z,['#956d51','#728674','#65798b'][i]);
    vendor.group.rotation.y=-Math.PI/2;sphere(vendor.torso,.28,['#59473a','#6d5642','#594b42'][i],0,1.9,-.08);
    vendor.group.name='Vendedor do mercado';performers.push({kind:'vendor',arm:vendor.arm,phase:i});return vendor;
  });
  // A small wagon and strings of pennants decorate the plaza edges.
  const wagon=new THREE.Group();wagon.position.set(22.5,0,-7.1);market.add(wagon);box(wagon,1.4,.28,2.2,'#76563c',0,.68,0);box(wagon,.12,.6,2.2,'#98714f',-.65,1,0);box(wagon,.12,.6,2.2,'#98714f',.65,1,0);
  [-1,1].forEach(side=>{const wheel=mesh(wagon,new THREE.TorusGeometry(.48,.09,7,18),'#493a2f',side*.78,.48,0);wheel.rotation.y=Math.PI/2;});box(wagon,.75,.65,.75,'#a18561',0,1.15,0);barrel(wagon,.35,.5);
  [-7.8,7.8].forEach(z=>{box(market,.08,3.5,.08,'#68513c',19,1.75,z);box(market,.08,3.5,.08,'#68513c',29,1.75,z);for(let x=20;x<=28;x+=2){box(market,1.8,.04,.04,'#b6a487',x,3.45,z);const flag=box(market,.4,.34,.05,x%4?'#c78d68':'#a9bd9e',x,3.26,z);flag.rotation.z=.08;}});
  // Pine forest, rocks, mushrooms and lanterns make the surroundings readable in the dark.
  for (let i = 0; i < 44; i++) {
    const a = i * 2.39996, r = 14.5 + (i % 5) * .7, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if ((x > 14 && Math.abs(z) < 9) || overlapsRoad(x, z, 1.3) || Math.hypot(x - PORTAL.x, z - PORTAL.z) < 4.5 || (z < -15.5) || Math.abs(x)>17 || z < -21.5 || z > 13.5 || (z>10 && Math.abs(x)<4)) continue;
    const tree = new THREE.Group(); tree.position.set(x, 0, z); scene.add(tree); const h = 2.6 + i % 4 * .55;
    cylinder(tree, .16, h, '#493c36', 0, h / 2, 0);
    for (let j = 0; j < 3; j++) mesh(tree, new THREE.ConeGeometry(1.2 - j * .23, 2.1, 7), ['#253f39', '#2d4a41', '#36574b'][j], 0, h * .6 + j * .75, 0);
    if (i % 3 === 0 && !overlapsRoad(x * .88, z * .88, .8) && Math.hypot(x * .88 - PORTAL.x, z * .88 - PORTAL.z) >= 3.5 && z*.88 >= -15.5) { const rock = mesh(scene, new THREE.DodecahedronGeometry(.45 + i % 2 * .3), '#4a555c', x * .88, .35, z * .88); rock.scale.y = .65; }
  }
  [[-2.8, -9], [2.8, -9], [-2.8, 11.3], [2.8, 11.3], [-11, 2.8], [11, 2.8]].forEach(([x, z]) => { cylinder(scene, .08, 2.6, '#39434b', x, 1.3, z); lamp(scene, x, 2.8, z); });
  const { player, body, limbs, cape } = createAdventurer(scene, { box, sphere, mesh, cylinder });
  player.position.set(0, .2, 19); player.rotation.y = Math.PI;

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
    addFaceDetails(torso, { box, sphere }, { headY: 1.81, skin: person.skin, brow: feminine ? '#523d35' : '#494039' });
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
  return { buildings, portal, castleDoor, backdrop, player, body, limbs, crystal, flames, fireflies, cape, npcs, performers, castleGuards, castleArchers, castleTowers, marketStall, marketVendors, marketFood: produce, marketPotions: goods };
}

export default function VillageScene({ language = 'pt-BR', keys, compassRef, paused, sceneHidden = false, onOpen, onNear, onStep, onTalk, onNearNpc, talkingNpc, zoom, resetKey, missionComplete, missionRound, onFirework, onCelebrate, reduceMotion = false, ambientPaused = false, weatherEffects = true, weatherMode = 'auto', onWeather, cameraTurn = 0 }) {
  const mount = useRef(null);
  const wake = useRef(null);
  const updateSigns = useRef(null);
  useEffect(() => { updateSigns.current?.(language); }, [language]);
  const live = useRef({ paused, sceneHidden, onOpen, onNear, onStep, onTalk, onNearNpc, talkingNpc, zoom, resetKey, missionComplete, missionRound, onFirework, onCelebrate, reduceMotion, ambientPaused, weatherEffects, weatherMode, onWeather, cameraTurn });
  live.current = { paused, sceneHidden, onOpen, onNear, onStep, onTalk, onNearNpc, talkingNpc, zoom, resetKey, missionComplete, missionRound, onFirework, onCelebrate, reduceMotion, ambientPaused, weatherEffects, weatherMode, onWeather, cameraTurn };
  const [error, setError] = useState(false);
  const wasSceneHidden = useRef(sceneHidden);
  useEffect(() => {
    if (!sceneHidden) wake.current?.(wasSceneHidden.current);
    wasSceneHidden.current = sceneHidden;
  }, [sceneHidden]);

  useEffect(() => {
    const container = mount.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); } catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, container.clientWidth < 800 ? 1.15 : 1.5));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-describedby', 'village-keyboard-help');
    renderer.domElement.setAttribute('aria-label', 'Cenário 3D: arraste para girar a câmera e use WASD para caminhar');
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0c131c'); scene.fog = new THREE.FogExp2('#0c131c', .009);
    const hemisphere = new THREE.HemisphereLight('#9fb9df', '#28382d', 1.3); scene.add(hemisphere);
    const moon = new THREE.DirectionalLight('#a9c6ef', 2.6); moon.position.set(-12, 22, 8); moon.castShadow = true;
    moon.shadow.mapSize.set(2048, 2048); Object.assign(moon.shadow.camera, { left: -23, right: 23, top: 23, bottom: -23, far: 70 }); moon.shadow.camera.updateProjectionMatrix(); moon.shadow.normalBias = .035; scene.add(moon);
    const world = createVillage(scene);
    updateSigns.current = next => { scene.traverse(object => object.userData.setLanguage?.(next)); renderer.domElement.setAttribute('aria-label', next === 'en-US' ? '3D scene: drag to rotate the camera and use WASD to walk' : 'Cenário 3D: arraste para girar a câmera e use WASD para caminhar'); };
    updateSigns.current(language);
    const dragon = createDragon(scene);
    const dayNight = createDayNight(scene, hemisphere, moon, world);
    const weather = createVillageWeather(scene);
    const fireworks = createMissionFireworks(scene, stage => live.current.onFirework?.(stage));
    let celebrated = false;
    let oldMissionRound = live.current.missionRound;
    let previousReducedMotion = live.current.reduceMotion;
    const walkingGraph = createWalkingGraph();
    let oldCameraTurn = live.current.cameraTurn;
    const verticalAxis = new THREE.Vector3(0, 1, 0);
    const portrait = container.clientWidth < 600;
    const camera = new THREE.PerspectiveCamera(44, 1, .1, 260); const initialOffset = new THREE.Vector3(0, 12, 16).multiplyScalar(portrait ? 1.25 : 1); camera.position.copy(world.player.position).add(initialOffset);
    const controls = new OrbitControls(camera, renderer.domElement); controls.target.set(0, 3.2, 11); controls.enableDamping = true; controls.dampingFactor = .07; controls.enablePan = false;
    controls.minDistance = 7; controls.maxDistance = 78; controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2 - .09; controls.update();
    const resize = () => { const { width, height } = container.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let start;
    const pointerdown = e => { renderer.domElement.focus({ preventScroll: true }); start = { x: e.clientX, y: e.clientY }; };
    const pointerup = e => {
      if (!start || live.current.paused || Math.hypot(start.x - e.clientX, start.y - e.clientY) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect(); pointer.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...world.buildings, world.portal, world.castleDoor, world.marketStall, world.marketFood, world.marketPotions, ...world.npcs.map(n => n.group)], true)[0]; if (!hit) return;
      let object = hit.object; while (object && object.userData.site === undefined && object.userData.npc === undefined) object = object.parent;
      if (object?.userData.npc !== undefined) live.current.onTalk?.(object.userData.npc);
      else if (object) live.current.onOpen(object.userData.site);
    };
    renderer.domElement.addEventListener('pointerdown', pointerdown); renderer.domElement.addEventListener('pointerup', pointerup);
    const lost = e => { e.preventDefault(); setError(true); }; renderer.domElement.addEventListener('webglcontextlost', lost);
    const down = e => { const k = e.key.toLowerCase(); if (!live.current.paused && !e.ctrlKey && !e.altKey && !e.metaKey && ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k) && !e.target.closest('button,a,input,audio')) { e.preventDefault(); keys.current.add(k); } };
    const up = e => keys.current.delete(e.key.toLowerCase()); const clear = () => keys.current.clear();
    renderer.domElement.addEventListener('keydown', down); renderer.domElement.addEventListener('blur', clear); window.addEventListener('keyup', up); window.addEventListener('blur', clear);
    const forward = new THREE.Vector3(), right = new THREE.Vector3(), movement = new THREE.Vector3(); const target = new THREE.Vector3(); const delta = new THREE.Vector3();
    let frame, previous = 0, clock = 0, environmentTime = 0, stepDistance = 0, portalContact = false, castleContact = false, oldNear = -2, oldNearNpc = -2, lastWeatherReport = -1, oldZoom = live.current.zoom, oldReset = live.current.resetKey;
    const draw = time => {
      if (document.hidden || live.current.sceneHidden) { frame = 0; previous = 0; return; }
      const reducedMotion = live.current.reduceMotion, ambientPaused = live.current.ambientPaused;
      const dt = Math.min((time - previous) / 1000 || 0, .04); previous = time; clock += dt;
      if (oldMissionRound !== live.current.missionRound) { oldMissionRound = live.current.missionRound; celebrated = false; fireworks.stop(); }
      if (live.current.missionComplete && !live.current.paused && !ambientPaused && !celebrated) {
        celebrated = true;
        fireworks.start(world.npcs.map(npc => npc.group.position), reducedMotion);
        live.current.onCelebrate?.();
      }
      fireworks.update(!live.current.paused && !ambientPaused && !document.hidden ? dt : 0);
      if (reducedMotion && !previousReducedMotion && fireworks.active) fireworks.stop();
      previousReducedMotion = reducedMotion;
      if (!live.current.paused && !document.hidden && !reducedMotion && !ambientPaused) environmentTime += dt;
      dayNight.update(environmentTime);
      const weatherState = weather.update(environmentTime, world.player.position, live.current.weatherEffects && !reducedMotion && !ambientPaused, live.current.weatherMode);
      if (clock - lastWeatherReport >= .4) { lastWeatherReport = clock; live.current.onWeather?.(!live.current.paused && weatherState.type === 'rain' ? weatherState.strength : 0); }
      dragon.update(environmentTime, ambientPaused || live.current.paused ? 0 : dt, reducedMotion);
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
          target.set(p.x, 1.1, p.z); delta.subVectors(target, controls.target).multiplyScalar(Math.min(1, dt * 2)); controls.target.add(delta); camera.position.add(delta);
        }
      }
      world.limbs.forEach((limb, i) => { limb.rotation.x = walking ? Math.sin(clock * 10) * .65 * (i < 2 ? 1 : -1) * (i % 2 ? -1 : 1) : THREE.MathUtils.damp(limb.rotation.x, 0, 14, dt); });
      world.body.position.y = walking && !reducedMotion ? Math.abs(Math.sin(clock * 10)) * .07 : 0;
      world.npcs.forEach((npc, index) => {
        const talking = live.current.talkingNpc === index;
        const moving = !live.current.paused && !talking && !fireworks.active && !reducedMotion && !ambientPaused && advanceVillager(npc, dt, walkingGraph);
        if (talking) { const p = world.player.position; npc.body.rotation.y = Math.atan2(p.x - npc.group.position.x, p.z - npc.group.position.z); }
        npc.limbs.forEach((joint, i) => { joint.rotation.x = moving ? Math.sin(clock * 6.5 + npc.phase) * .48 * ([1, -1, -1, 1][i]) : THREE.MathUtils.damp(joint.rotation.x, 0, 12, dt); });
        npc.body.position.y = moving ? Math.abs(Math.sin(clock * 6.5 + npc.phase)) * .045 : 0;
        if (fireworks.active && fireworks.elapsed < 1 && !reducedMotion) npc.limbs[3].rotation.x = -2.3;
      });
      if (!live.current.paused && !reducedMotion && !ambientPaused) world.performers.forEach(actor => {
        if (actor.kind === 'drink') actor.arm.rotation.x = -.35 - Math.max(0, Math.sin(clock * .7)) * 1.1;
        if (actor.kind === 'forge') actor.arm.rotation.x = -.5 - Math.abs(Math.sin(clock * 2.6)) * 1.25;
        if (actor.kind === 'read') actor.torso.rotation.x = .12 + Math.sin(clock * .6) * .04;
        if (actor.kind === 'watch') actor.torso.rotation.y = Math.sin(clock * .35 + actor.phase) * .12;
        if (actor.kind === 'vendor') actor.arm.rotation.x = -.25 - Math.max(0, Math.sin(clock * .8 + actor.phase)) * .7;
      });
      if (!reducedMotion && !ambientPaused) { world.crystal.rotation.y += dt * .45; world.crystal.position.y = 2.2 + Math.sin(clock * 1.4) * .1; world.cape.rotation.x = -.13 + Math.sin(clock * (walking ? 10 : 2)) * (walking ? .13 : .025); world.fireflies.rotation.y += dt * .012; world.flames.forEach(f => { f.scale.y = 1 + Math.sin(clock * 9) * .18; }); }
      const p = world.player.position;
      const touchingCastle = isCastleThreshold(p.x, p.z);
      if (!live.current.paused && touchingCastle && !castleContact) { castleContact = true; live.current.onOpen(5); }
      if (!touchingCastle) castleContact = false;
      const touchingPortal = Math.hypot(p.x - PORTAL.x, p.z - PORTAL.z) < 1.1;
      if (!live.current.paused && touchingPortal && !portalContact) { portalContact = true; live.current.onOpen(4); }
      if (!touchingPortal) portalContact = false;
      const near = nearbySite(p.x, p.z);
      if (near !== oldNear) { oldNear = near; live.current.onNear(near); }
      let closestNpc = -1, closestDistance = 2.7;
      world.npcs.forEach((npc, index) => { const d = Math.hypot(npc.group.position.x - p.x, npc.group.position.z - p.z); if (d < closestDistance) { closestNpc = index; closestDistance = d; } });
      if (closestNpc !== oldNearNpc) { oldNearNpc = closestNpc; live.current.onNearNpc?.(closestNpc); }
      if (live.current.cameraTurn !== oldCameraTurn) { camera.position.sub(controls.target).applyAxisAngle(verticalAxis, (live.current.cameraTurn - oldCameraTurn) * Math.PI / 6).add(controls.target); oldCameraTurn = live.current.cameraTurn; }
      if (live.current.zoom !== oldZoom) { camera.position.sub(controls.target).multiplyScalar(oldZoom / live.current.zoom).add(controls.target); oldZoom = live.current.zoom; }
      if (live.current.resetKey !== oldReset) { controls.target.set(p.x, 1.1, p.z); camera.position.set(p.x + 13, 15, p.z + 18); oldReset = live.current.resetKey; }
      controls.enabled = !live.current.paused; controls.enableDamping = !reducedMotion; controls.update(); if (compassRef?.current) compassRef.current.style.transform = `rotate(${-controls.getAzimuthalAngle()}rad)`; renderer.render(scene, camera); frame = requestAnimationFrame(draw);
    };
    const resume = (returning = false) => {
      if (returning && !live.current.sceneHidden) {
        if (isCastleThreshold(world.player.position.x, world.player.position.z)) { world.player.position.z = -16.3; castleContact = false; }
        renderer.domElement.focus({ preventScroll: true });
      }
      if (!frame && !document.hidden && !live.current.sceneHidden) { previous = 0; frame = requestAnimationFrame(draw); }
    };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; keys.current.clear(); } else resume(); };
    wake.current = resume; document.addEventListener('visibilitychange', visibility); resume();
    return () => {
      live.current.onWeather?.(0); updateSigns.current = null; wake.current = null; document.removeEventListener('visibilitychange', visibility); cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); clear();
      renderer.domElement.removeEventListener('keydown', down); renderer.domElement.removeEventListener('blur', clear); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear);
      renderer.domElement.removeEventListener('pointerdown', pointerdown); renderer.domElement.removeEventListener('pointerup', pointerup); renderer.domElement.removeEventListener('webglcontextlost', lost);
      scene.traverse(o => { if (o.isInstancedMesh) o.dispose(); o.geometry?.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose(); m.alphaMap?.dispose(); m.dispose(); }); });
      renderer.dispose(); renderer.domElement.remove();
    };
  // Language changes update sign textures without rebuilding the scene.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys, compassRef]);

  return <div className="webgl-scene" ref={mount}><p id="village-keyboard-help" className="sr-only">{language === 'en-US' ? 'Interactive scene. Use Tab or click to focus it. Use WASD or arrow keys to walk, E to enter a nearby building and F to talk to a nearby villager. Press Tab to leave the scene. All content is also available in reading mode and through the destination buttons.' : 'Cenário interativo. Use Tab para dar foco ao cenário ou clique nele. Com o cenário em foco, use WASD ou setas para caminhar, E para entrar em um edifício próximo e F para conversar com um morador próximo. Tab sai do cenário. Todo o conteúdo também está disponível pelo modo leitura e pelos botões de destinos.'}</p>{error && <div className="scene-error"><strong>{language === 'en-US' ? 'The 3D scene requires WebGL 2.' : 'O cenário 3D precisa de WebGL 2.'}</strong><p>{language === 'en-US' ? 'Read every story in reading mode or use the destinations below.' : 'Você pode acessar todas as histórias pelo modo leitura ou pelos destinos abaixo.'}</p></div>}</div>;
}
