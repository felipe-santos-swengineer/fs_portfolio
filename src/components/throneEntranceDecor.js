import * as THREE from 'three';
import { buildChamberArchitecture } from './arcaneChamberArchitecture';
import { buildArcaneRitual } from './arcaneChamberRitual';

function createGargoyle(scene, { mesh, box, cylinder, sphere }, x, z) {
  const statue = new THREE.Group();
  statue.position.set(x, 0, z);
  statue.rotation.y = Math.sign(x) * -.52;
  scene.add(statue);
  const rock = '#424853', edge = '#626477', shadow = '#30333e';
  box(statue, 2.25, .26, 1.85, edge, 0, .13, 0);
  box(statue, 1.92, .85, 1.56, shadow, 0, .65, 0);
  box(statue, 2.12, .16, 1.72, rock, 0, 1.15, 0);
  box(statue, .75, .34, .04, '#578786', 0, .67, .8);
  box(statue, .38, .25, .045, shadow, 0, .67, .825).rotation.z = Math.PI / 4;

  sphere(statue, .74, rock, 0, 1.9, -.08).scale.set(1, 1.18, .76);
  sphere(statue, .49, edge, 0, 2.61, .2).scale.set(1, 1.04, .96);
  box(statue, .67, .22, .38, shadow, 0, 2.38, .48);
  box(statue, .26, .17, .25, rock, 0, 2.53, .61);
  const wing = new THREE.Shape();
  wing.moveTo(0, 0);
  wing.lineTo(.2, .64);
  wing.lineTo(.72, 1.49);
  wing.lineTo(1.38, 1.94);
  wing.lineTo(1.7, 1.38);
  wing.lineTo(1.35, 1.28);
  wing.lineTo(1.32, .89);
  wing.lineTo(.92, .96);
  wing.lineTo(.75, .55);
  wing.lineTo(.49, .58);
  wing.closePath();

  for (const side of [-1, 1]) {
    const stoneWing = mesh(statue, new THREE.ExtrudeGeometry(wing, { depth: .13, bevelEnabled: false }),
      shadow, side * .3, 1.65, -.55);
    stoneWing.scale.x = side;
    stoneWing.rotation.y = side * -.32;
    box(statue, .11, .83, .15, edge, side * 1.09, 2.96, -.29).rotation.z = side * -.51;
    mesh(statue, new THREE.ConeGeometry(.145, .62, 5), rock, side * .31, 3.12, .14).rotation.z = side * -.37;
    box(statue, .2, .089, .07, '#a4e5ca', side * .21, 2.68, .61).rotation.z = side * .2;
    sphere(statue, .24, rock, side * .55, 1.52, .51).scale.z = 1.55;
    for (const toe of [-1, 0, 1]) {
      box(statue, .071, .09, .24, edge, side * .55 + toe * .105, 1.39, .76);
    }
  }
  const light = new THREE.PointLight('#73e2c2', 12, 5.5);
  light.position.set(0, 1.38, .98);
  statue.add(light);
  return statue;
}

function createSpider(scene, { mesh, sphere }, x, z, scale, phase) {
  const spider = new THREE.Group();
  spider.position.set(x, 0, z);
  spider.rotation.y = x > 0 ? -.94 : .92;
  spider.scale.setScalar(scale);
  scene.add(spider);
  const body = new THREE.Group();
  spider.add(body);
  sphere(body, .63, '#242431', 0, .7, -.51).scale.set(1.02, .88, 1.26);
  sphere(body, .36, '#42343f', 0, .58, .24).scale.set(1.17, .78, 1.04);
  sphere(body, .27, '#694554', 0, 1.19, -.58).scale.set(.63, .14, 1.18);
  const limbs = [];
  const segment = (parent, from, to, radius, color) => {
    const axis = new THREE.Vector3().subVectors(to, from);
    const middle = from.clone().addScaledVector(axis, .5);
    const shape = new THREE.CylinderGeometry(radius * .72, radius, axis.length(), 5);
    const leg = mesh(parent, shape, color, middle.x, middle.y, middle.z);
    leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Group();
      leg.position.set(side * .26, .62, .36 - i * .205);
      spider.add(leg);
      const sweep = (.9 - i * .6);
      const knee = new THREE.Vector3(side * .89, .57, sweep * .43);
      const foot = new THREE.Vector3(side * (1.42 + .18 * Math.sin(i)), -.59, sweep);
      segment(leg, new THREE.Vector3(), knee, .086, '#37303b');
      segment(leg, knee, foot, .064, '#282835');
      sphere(leg, .105, '#594251', knee.x, knee.y, knee.z);
      limbs.push({ leg, phase: phase + i * 1.27 + side });
    }
    for (let i = 0; i < 3; i++) {
      sphere(body, .046 - i * .007, '#ff8465', side * (.073 + i * .071), .66 - i * .028, .579 - i * .034);
    }
    const fang = mesh(body, new THREE.ConeGeometry(.06, .21, 5), '#c4b2a6', side * .12, .47, .605);
    fang.rotation.x = Math.PI;
  }
  return (time, reduced, chessView) => {
    spider.visible = !chessView;
    body.position.y = reduced ? 0 : Math.sin(time * 2 + phase) * .044;
    for (const limb of limbs) limb.leg.rotation.y = reduced ? 0 : Math.sin(time * 1.62 + limb.phase) * .044;
  };
}

function createFloorMist(scene) {
  const mist = new THREE.Group();
  scene.add(mist);
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { drift: { value: 0 } },
    vertexShader: `
      varying vec2 ground;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.);
        ground = world.xz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float drift;
      varying vec2 ground;
      void main() {
        vec2 p = ground;
        float bands = sin(p.x * .74 + sin(p.y * .53 - drift) * 2.1 + drift)
          + .63 * cos(p.y * .83 + p.x * .27 - drift * .74)
          + .35 * sin(p.x * 1.48 - p.y * .91 + drift * .49);
        float clouds = smoothstep(-.68, 1.43, bands);
        float aisles = mix(.38, 1., smoothstep(1.5, 6., abs(p.x)));
        float edges = (1. - smoothstep(10., 14., abs(p.x))) * (1. - smoothstep(16., 23., abs(p.y)));
        gl_FragColor = vec4(.41, .52, .56, clouds * aisles * edges * .25);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  for (const y of [.11, .28, .56]) {
    const layer = new THREE.Mesh(new THREE.PlaneGeometry(28, 46), material);
    layer.rotation.x = -Math.PI / 2;
    layer.position.y = y;
    mist.add(layer);
  }
  return (time, visible) => {
    mist.visible = visible;
    material.uniforms.drift.value = time * .44;
  };
}

export function furnishThroneEntrance(scene, helpers, boardZ, doorZ) {
  const { box, cylinder } = helpers;
  const obstacles = [];
  const gargoyles = [];
  const ceiling = box(scene, 36, .65, 48, '#242833', 0, 8, 0);
  buildChamberArchitecture(scene, helpers, ceiling);
  const ritual = buildArcaneRitual(scene, helpers, boardZ, doorZ);
  obstacles.push(...ritual.stones);
  for (let z = -19; z <= 15; z += 2.6) {
    box(scene, 4.9, .055, 2.42, '#373c48', 0, .02, z);
    for (const side of [-1, 1]) box(scene, .18, .075, 2.42, '#626572', side * 2.4, .038, z);
  }

  for (const side of [-1, 1]) {
    box(scene, .65, 7.7, 44, '#313642', side * 11.8, 3.85, 0);
    for (const z of [-16, -6, 4, 14]) {
      cylinder(scene, .67, 7.65, '#494e59', side * 9.5, 3.82, z);
      box(scene, 1.6, .38, 1.6, '#414653', side * 9.5, .2, z);
      box(scene, 1.5, .36, 1.5, '#505361', side * 9.5, 7.5, z);
      box(scene, .16, .75, .25, '#333041', side * 9.5, 3.03, z + .64);
      box(scene, .27, .37, .24, '#9cb8d3', side * 9.5, 3.55, z + .7);
      const light = new THREE.PointLight(side === 1 ? '#ac91ee' : '#87c6d5', 24, 12);
      light.position.set(side * 9.2, 3.5, z + 1.05);
      scene.add(light);
    }
    gargoyles.push(createGargoyle(scene, helpers, side * 5.25, -3.7));
    obstacles.push({ x: side * 5.25, z: -3.7, radius: 1.28 });
  }

  const spiders = [[-5.25, -9.2, 1.55, .4], [5.95, -12, 1.68, 2.1], [5.35, 2.4, 1.48, 3.6]]
    .map(([x, z, scale, phase]) => {
      obstacles.push({ x, z, radius: scale * .78 });
      return createSpider(scene, helpers, x, z, scale, phase);
    });
  const updateMist = createFloorMist(scene);
  let motionTime = 0;
  return {
    ceiling,
    blocks(x, z) {
      return obstacles.some(place => Math.hypot(x - place.x, z - place.z) < place.radius);
    },
    update(dt, { reduced, showMist, revealed, unlocked, chessView }) {
      if (!reduced) motionTime += dt;
      updateMist(reduced ? 0 : motionTime, showMist);
      for (const statue of gargoyles) statue.visible = !chessView;
      for (const pose of spiders) pose(motionTime, reduced, chessView);
      ritual.update(motionTime, revealed, unlocked, reduced, chessView);
    },
  };
}
