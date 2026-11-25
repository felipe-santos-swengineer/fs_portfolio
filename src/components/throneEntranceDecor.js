import * as THREE from 'three';
import { buildChamberArchitecture } from './arcaneChamberArchitecture';
import { buildArcaneRitual, runeArc } from './arcaneChamberRitual';

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
  const gargoyles = [];
  const architecture = buildChamberArchitecture(scene, helpers);
  const stoneInk = new THREE.LineBasicMaterial({ color: '#c1ada0' });
  for (const panel of architecture.inscriptionPanels) {
    runeArc(panel, stoneInk, { count: 9, radius: .33, size: .16, plane: 'wall', z: .123 });
  }
  const ritual = buildArcaneRitual(scene, helpers, boardZ, doorZ);
  const obstacles = [...ritual.stones, ...architecture.columns];
  for (const side of [-1, 1]) {
    gargoyles.push(createGargoyle(scene, helpers, side * 5.25, -3.7));
    obstacles.push({ x: side * 5.25, z: -3.7, radius: 1.28 });
  }

  const updateMist = createFloorMist(scene);
  let motionTime = 0;
  return {
    updateArchitectureView: architecture.updateArchitectureView,
    blocks(x, z) {
      return obstacles.some(place => Math.hypot(x - place.x, z - place.z) < place.radius);
    },
    update(dt, { reduced, showMist, revealed, unlocked, chessView }) {
      if (!reduced) motionTime += dt;
      updateMist(reduced ? 0 : motionTime, showMist);
      for (const statue of gargoyles) statue.visible = !chessView;
      ritual.update(motionTime, revealed, unlocked, reduced, chessView);
    },
  };
}
