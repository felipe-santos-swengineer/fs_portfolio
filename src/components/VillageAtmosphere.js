import * as THREE from 'three';
import { SITES } from './villageNavigation';

const TAU = Math.PI * 2;
const smooth = (a, b, value) => { const t = Math.max(0, Math.min(1, (value - a) / (b - a))); return t * t * (3 - 2 * t); };

export function daylightAt(seconds) {
  const phase = ((seconds / 180 + .85) % 1 + 1) % 1;
  const elevation = Math.sin(phase * TAU);
  return { phase, elevation, daylight: smooth(-.18, .45, elevation), twilight: 1 - smooth(.02, .38, Math.abs(elevation)), label: elevation < -.18 ? 'NOITE' : elevation < .32 ? (phase < .25 || phase > .75 ? 'AMANHECER' : 'ENTARDECER') : 'DIA' };
}

const orbit = t => ({ x: Math.cos(t * .2) * 12, y: 11.8 + Math.sin(t * .3) * 1.1, z: Math.sin(t * .2) * 11 });
const perches = [SITES[0], SITES[2], SITES[3]];
export function dragonPoseAt(seconds) {
  const cycle = Math.floor(seconds / 72), t = seconds % 72;
  const site = perches[cycle % perches.length];
  // Feet straddle the ridge; lower the root so they meet the sloped tiles.
  const perch = { x: site.x, y: 5.78, z: site.z + .55 };
  let position, fold = 0;
  if (t < 35 || t >= 63) position = orbit(seconds);
  else if (t < 43) {
    const start = orbit(cycle * 72 + 35), u = smooth(35, 43, t);
    position = { x: THREE.MathUtils.lerp(start.x, perch.x, u), y: THREE.MathUtils.lerp(start.y, perch.y, u) + Math.sin(u * Math.PI) * 1.5, z: THREE.MathUtils.lerp(start.z, perch.z, u) }; fold = u;
  } else if (t < 55) { position = perch; fold = 1; }
  else {
    const end = orbit(cycle * 72 + 63), u = smooth(55, 63, t);
    position = { x: THREE.MathUtils.lerp(perch.x, end.x, u), y: THREE.MathUtils.lerp(perch.y, end.y, u) + Math.sin(u * Math.PI) * 3, z: THREE.MathUtils.lerp(perch.z, end.z, u) }; fold = 1 - u;
  }
  return { ...position, fold, perched: t >= 43 && t < 55, site: perches.indexOf(site) };
}

export function createDragon(scene) {
  const group = new THREE.Group(); group.name = 'Dragão guardião da vila'; scene.add(group);
  const body = new THREE.Group(); group.add(body);
  const scales = new THREE.MeshStandardMaterial({ color: '#477c73', roughness: .72, metalness: .15 });
  const belly = new THREE.MeshStandardMaterial({ color: '#b6a477', roughness: .8 });
  const horn = new THREE.MeshStandardMaterial({ color: '#ded0ad', roughness: .7 });
  const membrane = new THREE.MeshStandardMaterial({ color: '#875567', side: THREE.DoubleSide, roughness: .85, flatShading: true });
  const eye = new THREE.MeshStandardMaterial({ color: '#f5c472', emissive: '#e5a341', emissiveIntensity: 1.2 });
  const add = (parent, geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const oval = (parent, radius, mat, x, y, z, sx, sy, sz) => { const m = add(parent, new THREE.IcosahedronGeometry(radius, 1), mat, x, y, z); m.scale.set(sx, sy, sz); return m; };
  oval(body, .72, scales, 0, 1.02, 0, .8, .85, 1.5);
  oval(body, .6, belly, 0, .85, .15, .66, .7, 1.2);
  const neck = oval(body, .4, scales, 0, 1.45, .78, .8, 1.35, .9); neck.rotation.x = -.38;
  oval(body, .42, scales, 0, 1.82, 1.12, 1, .85, 1.2);
  oval(body, .3, scales, 0, 1.65, 1.54, 1.1, .65, 1.35);
  oval(body, .25, belly, 0, 1.51, 1.49, 1, .3, 1.4);
  [-1, 1].forEach(side => {
    oval(body, .085, eye, side * .34, 1.91, 1.29, .65, 1, 1);
    const h = add(body, new THREE.ConeGeometry(.1, .55, 6), horn, side * .27, 2.2, .87); h.rotation.x = -.42; h.rotation.z = side * -.24;
    [-.55, .5].forEach(z => {
      oval(body, .23, scales, side * .42, .48, z, 1, 1.6, 1);
      oval(body, .22, scales, side * .46, .14, z + .13, 1, .5, 1.5);
      for (let i = 0; i < 3; i++) { const claw = add(body, new THREE.ConeGeometry(.035, .2, 5), horn, side * .46 + (i - 1) * .09, .1, z + .4); claw.rotation.x = Math.PI / 2; }
    });
  });
  for (let i = 0; i < 7; i++) add(body, new THREE.ConeGeometry(.12, .27, 4), horn, 0, 1.65 - i * .07, .55 - i * .26);
  const tail = []; let parent = body;
  for (let i = 0; i < 6; i++) {
    const joint = new THREE.Group(); joint.position.set(0, i ? 0 : .87, i ? -.4 : -.86); parent.add(joint);
    const section = add(joint, new THREE.ConeGeometry(.24 * (1 - i / 7), .6, 7), scales, 0, 0, -.25); section.rotation.x = -Math.PI / 2;
    tail.push(joint); parent = joint;
  }
  const wings = [-1, 1].map(side => {
    const pivot = new THREE.Group(); pivot.position.set(side * .4, 1.44, -.2); body.add(pivot);
    const vertices = new Float32Array([0, 0, 0, side * 1.2, .2, -.6, side * 3.1, .05, -1.1, side * 2.3, -.08, .2, side * 1.4, -.13, .65, side * .6, -.15, .65]);
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3)); geo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]); geo.computeVertexNormals(); add(pivot, geo, membrane, 0, 0, 0);
    for (const index of [1, 2, 3, 4]) {
      const end = new THREE.Vector3(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]);
      const bone = add(pivot, new THREE.CylinderGeometry(.035, .055, end.length(), 6), scales, end.x / 2, end.y / 2, end.z / 2); bone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.normalize());
    }
    return { pivot, side };
  });
  group.scale.setScalar(.9);
  return {
    group, wings, tail,
    update(seconds, dt, reducedMotion = false) {
      const pose = reducedMotion ? dragonPoseAt(46) : dragonPoseAt(seconds);
      const next = reducedMotion || pose.perched ? { x: pose.x + 1, z: pose.z } : dragonPoseAt(seconds + .05);
      group.position.set(pose.x, pose.y, pose.z);
      const yaw = Math.atan2(next.x - pose.x, next.z - pose.z);
      group.rotation.y += Math.atan2(Math.sin(yaw - group.rotation.y), Math.cos(yaw - group.rotation.y)) * Math.min(1, dt * 4);
      const flap = reducedMotion ? 0 : Math.sin(seconds * 5.2) * .4;
      wings.forEach(({ pivot, side }) => { pivot.rotation.z = side * (flap * (1 - pose.fold) + pose.fold * 1.25); pivot.rotation.y = side * pose.fold * .75; });
      tail.forEach((joint, i) => { joint.rotation.y = reducedMotion ? 0 : Math.sin(seconds * 2 - i * .55) * .12 * (1 - pose.fold * .7); });
      body.rotation.x = reducedMotion ? 0 : -.08 * (1 - pose.fold);
      return pose;
    },
  };
}

export function createDayNight(scene, hemisphere, keyLight, world) {
  const top = new THREE.Color(), horizon = new THREE.Color();
  const palette = { night: new THREE.Color('#0c1529'), day: new THREE.Color('#6e9fbc'), dusk: new THREE.Color('#c2827b'), dawn: new THREE.Color('#ddb18b'), mist: new THREE.Color('#9bb4bc'), skyLight: new THREE.Color('#d2e8f3'), ground: new THREE.Color('#69765a'), sunlight: new THREE.Color('#ffedcf') };
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { topColor: { value: top }, horizonColor: { value: horizon } },
    vertexShader: 'varying vec3 skyDirection; void main(){skyDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'uniform vec3 topColor; uniform vec3 horizonColor; varying vec3 skyDirection; void main(){float height=max(normalize(skyDirection).y,0.0); gl_FragColor=vec4(mix(horizonColor,topColor,pow(height,0.6)),1.0); #include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  });
  // Shader includes must begin on their own line for the WebGL preprocessor.
  skyMaterial.fragmentShader = skyMaterial.fragmentShader.replace('; #include', ';\n#include');
  const sky = new THREE.Mesh(new THREE.SphereGeometry(110, 24, 16), skyMaterial); sky.renderOrder = -10; scene.add(sky);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffdf9b', toneMapped: false })); scene.add(sun);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 10), new THREE.MeshBasicMaterial({ color: '#d3e0ed', toneMapped: false })); scene.add(moon);
  const starsGeo = new THREE.BufferGeometry(), starVertices = [];
  for (let i = 0; i < 250; i++) { const angle = i * 2.39996, y = .12 + (i % 31) / 36, r = Math.sqrt(1 - y * y); starVertices.push(Math.cos(angle) * r * 95, y * 95, Math.sin(angle) * r * 95); }
  starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: .2, color: '#d2e3ed', transparent: true, depthWrite: false, fog: false })); scene.add(stars);
  const lights = [], glow = new Set();
  scene.traverse(o => { if (o.isPointLight) lights.push([o, o.intensity]); if (o.material?.emissiveIntensity > 0) glow.add(o.material); });
  const sunDirection = new THREE.Vector3();
  return {
    sky, sun, moon, stars,
    update(seconds) {
      const state = daylightAt(seconds), day = state.daylight;
      top.copy(palette.night).lerp(palette.day, day);
      horizon.copy(palette.night).lerp(palette.mist, day).lerp(state.phase < .25 || state.phase > .75 ? palette.dawn : palette.dusk, state.twilight * .75);
      scene.background.copy(horizon); scene.fog.color.copy(horizon); scene.fog.density = THREE.MathUtils.lerp(.009, .006, day);
      hemisphere.color.set('#9fb9df').lerp(palette.skyLight, day); hemisphere.groundColor.set('#28382d').lerp(palette.ground, day); hemisphere.intensity = 1.15 + day * 1.5;
      keyLight.color.set('#a9c6ef').lerp(palette.sunlight, day); keyLight.intensity = 1.8 + day * 1.4;
      sunDirection.set(Math.cos(state.phase * TAU) * 65, state.elevation * 65, -36);
      sun.position.copy(sunDirection); moon.position.copy(sunDirection).multiplyScalar(-1); sun.visible = state.elevation > -.04; moon.visible = state.elevation < .04;
      keyLight.position.set(sunDirection.x * .4, 8 + Math.abs(state.elevation) * 24, sunDirection.z * .4);
      stars.material.opacity = (1 - day) * .85; stars.visible = day < .95;
      world.fireflies.material.opacity = (1 - day) * .65;
      lights.forEach(([light, intensity]) => { light.intensity = intensity * (1 - day * .85); });
      glow.forEach(material => { material.emissiveIntensity = THREE.MathUtils.lerp(1.7, .25, day); });
      return state;
    },
  };
}
