import * as THREE from 'three';

export const WITCH_LIVES = 3;
export const WITCH_LIGHTNING_HITS = 3;
const WAVES_PER_STRIKE = 3;
export const WITCH_WAVES = WITCH_LIGHTNING_HITS * WAVES_PER_STRIKE;
const CELL_SIZE = 4;
const COLUMNS = 9;
const POISON_WARNING = 1.4;
const POISON_INTERVAL = .16;
const POISON_COUNT = 15;
const POISON_RADIUS = 1.65;
const POISON_LIFETIME = .95;
const POISON_FALL = .24;
const POISON_TRAVEL = (POISON_COUNT - 1) * POISON_INTERVAL;
const GROUND_CAST = .42;
const timings = {
  warning: 4.5, shock: 2.4, recovery: 1.25, ascent: 1.2, strike: .65, spin: 5,
  groundCast: GROUND_CAST, descent: 1.2, fall: 1.45,
  poisonWarning: POISON_WARNING, poison: POISON_TRAVEL + POISON_FALL + POISON_LIFETIME,
};
const cells = Array.from({ length: COLUMNS * 12 }, (_, index) => ({
  index,
  x: (index % COLUMNS) * CELL_SIZE - 16,
  z: Math.floor(index / COLUMNS) * CELL_SIZE - 22,
}));

function safeCells(position, wave) {
  const distance = cell => Math.hypot(position.x - cell.x, position.z - cell.z);
  // Always offer a reachable refuge, including when the player is at a wall.
  const near = cells.filter(cell => Math.abs(cell.x) <= 12 && Math.abs(cell.z) <= 18
    && distance(cell) >= 5 && distance(cell) <= 11);
  const ahead = near.filter(cell => cell.z <= position.z - 2);
  const reachable = ahead.length ? ahead : near;
  reachable.sort((a, b) => Math.abs(a.x - position.x) - Math.abs(b.x - position.x));
  const first = reachable[(wave - 1) % Math.min(2, reachable.length)];
  const others = cells.filter(cell => Math.abs(cell.x) <= 12 && Math.abs(cell.z) <= 18
    && Math.hypot(cell.x - first.x, cell.z - first.z) >= 9);
  const second = others[wave * 13 % others.length];
  const third = others.find(cell => Math.hypot(cell.x - second.x, cell.z - second.z) >= 9);
  return [first, second, third];
}

export function isWitchRefuge(safe, position) {
  return safe.some(cell => Math.abs(position.x - cell.x) <= CELL_SIZE / 2
    && Math.abs(position.z - cell.z) <= CELL_SIZE / 2);
}

export function createWitchBattle(position, random = Math.random) {
  const poisonWaves = [2 + Math.floor(random() * 2), 4 + Math.floor(random() * 3), 7 + Math.floor(random() * 3)];
  return {
    phase: 'warning', wave: 1, lives: WITCH_LIVES, strikes: 0, remaining: timings.warning,
    safe: safeCells(position, 1), hit: false, reactionPending: false, poisonWaves, poison: null,
  };
}

export function witchGroundCastProgress(battle) {
  if (battle.phase === 'groundCast') return .45 * (1 - battle.remaining / GROUND_CAST);
  if (battle.phase === 'shock') return Math.min(1, .45 + (timings.shock - battle.remaining) / .55);
  return 0;
}

export function witchLightningProgress(battle) {
  if (battle.phase === 'strike' || battle.phase === 'spin') return 1;
  if (battle.phase === 'ascent') return 1 - battle.remaining / timings.ascent;
  if (battle.phase === 'descent') return battle.remaining / timings.descent;
  if (battle.phase === 'fall') return battle.remaining / timings.fall;
  return 0;
}

function createPoisonSweep(position, across, direction, pass, hit = false) {
  const edge = across ? 16 : 21;
  const lane = THREE.MathUtils.clamp(across ? position.z : position.x, across ? -21 : -16, across ? 21 : 16);
  return {
    elapsed: 0,
    across, direction, pass, hit,
    drops: Array.from({ length: POISON_COUNT }, (_, index) => {
      const along = direction * THREE.MathUtils.lerp(-edge, edge, index / (POISON_COUNT - 1));
      return { x: across ? along : lane, z: across ? lane : along, at: POISON_FALL + index * POISON_INTERVAL };
    }),
  };
}

function startWitchWave(battle, position) {
  battle.wave++;
  battle.safe = safeCells(position, battle.wave);
  battle.hit = false;
  battle.poison = null;
  if (battle.poisonWaves.includes(battle.wave)) {
    const across = battle.poisonWaves.indexOf(battle.wave) !== 1;
    const direction = (across ? position.x : position.z) < 0 ? -1 : 1;
    battle.poison = createPoisonSweep(position, across, direction, 1);
    return 'poisonWarning';
  }
  return 'warning';
}

export function witchPoisonProgress(battle) {
  return battle.phase === 'poisonWarning'
    ? 1 - battle.remaining / POISON_WARNING
    : Math.min(1, battle.poison.elapsed / POISON_TRAVEL);
}

export function advanceWitchBattle(battle, dt, position) {
  if (!timings[battle.phase]) return;
  battle.remaining -= dt;
  if (battle.phase === 'poison') {
    const sweep = battle.poison;
    const previous = sweep.elapsed;
    sweep.elapsed += dt;
    if (!sweep.hit && sweep.drops.some(drop => drop.at <= sweep.elapsed
      && drop.at + POISON_LIFETIME > previous
      && Math.hypot(position.x - drop.x, position.z - drop.z) <= POISON_RADIUS)) {
      sweep.hit = true;
      battle.lives--;
      if (!battle.lives) {
        battle.phase = 'lost';
        return;
      }
    }
  }
  if (battle.phase === 'spin' && !battle.reactionPending) battle.remaining = 0;
  if (battle.remaining <= 0) {
    if (battle.phase === 'warning') battle.phase = 'groundCast';
    else if (battle.phase === 'groundCast') battle.phase = 'shock';
    else if (battle.phase === 'shock') battle.phase = battle.wave % WAVES_PER_STRIKE === 0 ? 'ascent' : 'recovery';
    else if (battle.phase === 'ascent') {
      battle.phase = 'strike';
      battle.strikes++;
    } else if (battle.phase === 'strike' && battle.reactionPending) battle.phase = 'spin';
    else if (battle.phase === 'strike' || battle.phase === 'spin') battle.phase = battle.strikes === WITCH_LIGHTNING_HITS ? 'fall' : 'descent';
    else if (battle.phase === 'fall') battle.phase = 'won';
    else if (battle.phase === 'poisonWarning') battle.phase = 'poison';
    else if (battle.phase === 'poison' && battle.poison.pass === 1) {
      const { across, direction, hit } = battle.poison;
      battle.phase = 'poisonWarning';
      battle.poison = createPoisonSweep(position, across, -direction, 2, hit);
    } else if (battle.phase === 'poison') {
      battle.phase = 'warning';
      battle.safe = safeCells(position, battle.wave);
      battle.poison = null;
    } else battle.phase = startWitchWave(battle, position);
    battle.remaining = timings[battle.phase] ?? 0;
  }
  if (battle.phase === 'shock' && !battle.hit && !isWitchRefuge(battle.safe, position)) {
    battle.hit = true;
    battle.lives--;
    if (!battle.lives) battle.phase = 'lost';
  }
}

export function createWitchPoison(scene) {
  const trail = new THREE.Group();
  trail.visible = false;
  const geometry = new THREE.CircleGeometry(POISON_RADIUS, 24);
  geometry.rotateX(-Math.PI / 2);
  const pool = new THREE.MeshBasicMaterial({ color: '#e31524', transparent: true, opacity: .72, depthWrite: false });
  const outlineGeometry = new THREE.RingGeometry(POISON_RADIUS - .07, POISON_RADIUS, 24);
  outlineGeometry.rotateX(-Math.PI / 2);
  const outline = new THREE.MeshBasicMaterial({ color: '#ff7062', transparent: true, opacity: .94, depthWrite: false });
  const splashGeometry = new THREE.SphereGeometry(.22, 8, 6);
  const splashMaterial = new THREE.MeshBasicMaterial({ color: '#7dff28' });
  const markers = Array.from({ length: POISON_COUNT }, () => {
    const marker = new THREE.Group();
    const surface = new THREE.Mesh(geometry, pool);
    surface.renderOrder = 3;
    const ring = new THREE.Mesh(outlineGeometry, outline);
    ring.renderOrder = 4;
    ring.position.y = .004;
    const splash = new THREE.Mesh(splashGeometry, splashMaterial);
    marker.add(surface, ring, splash);
    trail.add(marker);
    const spill = new THREE.Mesh(splashGeometry, splashMaterial);
    spill.position.y = .012;
    spill.scale.set(2.1, .08, 1.45);
    marker.add(spill);
    return { marker, surface, ring, splash, spill, origin: new THREE.Vector3() };
  });
  scene.add(trail);
  return (battle, spout, reduced) => {
    const warning = battle.phase === 'poisonWarning';
    trail.visible = warning || battle.phase === 'poison';
    if (!trail.visible) return;
    markers.forEach(({ marker, surface, ring, splash, spill, origin }, index) => {
      const drop = battle.poison.drops[index];
      const age = battle.poison.elapsed - drop.at;
      marker.position.set(drop.x, .045, drop.z);
      const active = !warning && age >= 0 && age < POISON_LIFETIME;
      const falling = !warning && age >= -POISON_FALL && age < 0;
      if (falling && !splash.visible) origin.copy(spout).sub(marker.position);
      const progress = THREE.MathUtils.clamp(1 + age / POISON_FALL, 0, 1);
      splash.position.copy(origin).multiplyScalar(1 - progress);
      splash.scale.set(.75, reduced ? 1 : 2 + progress, .75);
      splash.visible = falling;
      marker.visible = warning || active || splash.visible;
      surface.visible = active;
      ring.visible = warning || active;
      spill.visible = active;
    });
  };
}

export function createWitchBattleFloor(scene) {
  const floor = new THREE.Group();
  floor.visible = false;
  scene.add(floor);
  const tile = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
  tile.rotateX(-Math.PI / 2);
  const refuges = Array.from({ length: 3 }, () => new THREE.Vector2());
  const waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      refuges: { value: refuges },
      time: { value: 0 },
      fogColor: { value: scene.fog?.color ?? new THREE.Color('#505b65') },
      fogDensity: { value: scene.fog?.density ?? 0 },
    },
    vertexShader: `
      varying vec2 ground;
      varying float distanceToCamera;
      void main() {
        ground = (modelMatrix * vec4(position, 1.0)).xz;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        distanceToCamera = -view.z;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform vec2 refuges[3];
      uniform float time;
      uniform vec3 fogColor;
      uniform float fogDensity;
      varying vec2 ground;
      varying float distanceToCamera;
      void main() {
        for (int i = 0; i < 3; i++) {
          vec2 delta = abs(ground - refuges[i]);
          if (max(delta.x, delta.y) <= ${(CELL_SIZE / 2).toFixed(1)}) discard;
        }
        float ripple = sin(ground.y * 5.4 + sin(ground.x * 0.85 + ground.y * 0.32) * 2.4 + time * 2.0);
        float reflection = sin(ground.x * 2.0 - ground.y * 0.7 - time * 1.6);
        float shine = smoothstep(0.82, 1.0, ripple) * smoothstep(-0.45, 0.85, reflection);
        vec3 color = mix(vec3(0.035, 0.12, 0.17), vec3(0.16, 0.31, 0.39), shine);
        float fog = 1.0 - exp(-pow(fogDensity * distanceToCamera, 2.0));
        gl_FragColor = vec4(mix(color, fogColor, fog), 0.68 + shine * 0.16);
        #include <colorspace_fragment>
      }
    `,
  });
  const waterGeometry = new THREE.PlaneGeometry(35.6, 47.6);
  waterGeometry.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.position.y = .014;
  floor.add(water);
  const chargeMaterial = new THREE.MeshBasicMaterial({ color: '#313de9', transparent: true, opacity: .52, depthWrite: false });
  const charged = new THREE.InstancedMesh(tile, chargeMaterial, cells.length);
  const arcMaterial = new THREE.MeshBasicMaterial({ color: '#c3efff', transparent: true, opacity: .88, depthWrite: false });
  const zigzag = [[-1, 0], [-.52, .16], [-.28, -.18], [.11, .21], [.46, -.09], [1, .05]];
  const ribbon = new THREE.Shape();
  zigzag.forEach(([x, y], i) => { if (i === 0) ribbon.moveTo(x, y); else ribbon.lineTo(x, y); });
  [...zigzag].reverse().forEach(([x, y]) => ribbon.lineTo(x, y - .065));
  ribbon.closePath();
  const arcGeometry = new THREE.ShapeGeometry(ribbon);
  arcGeometry.rotateX(-Math.PI / 2);
  const arcs = new THREE.InstancedMesh(arcGeometry, arcMaterial, cells.length * 4);
  charged.renderOrder = 1;
  arcs.renderOrder = 2;
  charged.frustumCulled = arcs.frustumCulled = false;
  floor.add(charged, arcs);

  const pads = Array.from({ length: 3 }, () => {
    const pad = new THREE.Group();
    const surface = new THREE.Mesh(tile, new THREE.MeshBasicMaterial({ color: '#1fc26e', transparent: true, opacity: .54, depthWrite: false }));
    surface.position.y = .025;
    pad.add(surface);
    const edge = new THREE.MeshBasicMaterial({ color: '#afffbd' });
    for (const side of [-1, 1]) {
      const horizontal = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, .035, .075), edge);
      horizontal.position.set(0, .04, side * CELL_SIZE / 2);
      const vertical = new THREE.Mesh(new THREE.BoxGeometry(.075, .035, CELL_SIZE), edge);
      vertical.position.set(side * CELL_SIZE / 2, .04, 0);
      pad.add(horizontal, vertical);
    }
    floor.add(pad);
    return pad;
  });

  const transform = new THREE.Matrix4(), arc = new THREE.Object3D();
  function update(battle) {
    floor.visible = battle.phase !== 'won' && battle.phase !== 'lost';
    charged.visible = arcs.visible = battle.phase === 'shock';
    if (!floor.visible) return;
    const safeIndices = new Set(battle.safe.map(cell => cell.index));
    pads.forEach((pad, index) => {
      const { x, z } = battle.safe[index];
      pad.position.set(x, 0, z);
      refuges[index].set(x, z);
    });
    let tileIndex = 0, arcIndex = 0;
    for (const cell of cells) {
      if (safeIndices.has(cell.index)) continue;
      charged.setMatrixAt(tileIndex++, transform.makeTranslation(cell.x, .02, cell.z));
      for (let i = 0; i < 4; i++) {
        arc.position.set(cell.x + (i % 2 ? .9 : -.9), .068, cell.z + (i > 1 ? .9 : -.9));
        arc.scale.set(.62 + ((cell.index + i) % 4) * .07, 1, .85 + i * .15);
        arc.rotation.y = cell.index + i;
        arc.updateMatrix();
        arcs.setMatrixAt(arcIndex++, arc.matrix);
      }
    }
    charged.count = tileIndex;
    arcs.count = arcIndex;
    charged.instanceMatrix.needsUpdate = arcs.instanceMatrix.needsUpdate = true;
  }
  function animate(time, reduced) {
    waterMaterial.uniforms.time.value = reduced ? 0 : time;
    arcMaterial.opacity = reduced ? .88 : .76 + Math.sin(time * 6) * .12;
  }
  return { update, animate };
}

export function createWitchLightning(scene) {
  const bolt = new THREE.Group();
  bolt.visible = false;
  const material = new THREE.MeshBasicMaterial({ color: '#d1f5ff', fog: false });
  const points = [[0, 1, 0], [.75, 2.6, .2], [-.35, 4.5, -.28], [.7, 6.7, 0], [.05, 9, .35], [1.2, 13, .1]]
    .map(point => new THREE.Vector3(...point));
  const up = new THREE.Vector3(0, 1, 0);
  points.slice(1).forEach((point, index) => {
    const start = points[index], direction = point.clone().sub(start);
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(.09, .13, direction.length(), 5), material);
    segment.position.copy(start).lerp(point, .5);
    segment.quaternion.setFromUnitVectors(up, direction.normalize());
    bolt.add(segment);
  });
  const light = new THREE.PointLight('#8bd6ff', 55, 12);
  light.position.y = 1;
  bolt.add(light);
  scene.add(bolt);
  return bolt;
}

export function createWitchGroundLightning(scene) {
  const bolt = createWitchLightning(scene);
  const localStart = new THREE.Vector3(0, 1, 0);
  const localDirection = new THREE.Vector3(1.2, 12, .1);
  const length = localDirection.length();
  localDirection.normalize();
  const direction = new THREE.Vector3();
  const offset = new THREE.Vector3();
  return (visible, hand, impact) => {
    bolt.visible = visible;
    if (!visible) return;
    direction.subVectors(hand, impact);
    const scale = direction.length() / length;
    bolt.quaternion.setFromUnitVectors(localDirection, direction.normalize());
    bolt.scale.setScalar(scale);
    offset.copy(localStart).multiplyScalar(scale).applyQuaternion(bolt.quaternion);
    bolt.position.copy(impact).sub(offset);
  };
}

export function createWitchShockFlash(player, witch) {
  const white = new THREE.MeshBasicMaterial({ color: '#fff' });
  const blue = new THREE.MeshBasicMaterial({ color: '#56aaff' });
  const duration = .8;

  function attach(character) {
    const meshes = [];
    character.traverse(object => {
      if (object.isMesh) meshes.push({ object, original: object.material });
    });
    let remaining = 0;
    let applied = null;
    function apply(material) {
      if (applied === material) return;
      applied = material;
      for (const { object, original } of meshes) object.material = material ?? original;
    }
    return {
      trigger() { remaining = duration; },
      update(dt, reduced) {
        if (remaining <= 0) return;
        const whitePhase = Math.floor((duration - remaining) / .2) % 2 === 0;
        apply(!reduced && whitePhase ? white : blue);
        remaining = Math.max(0, remaining - dt);
        if (remaining === 0) apply(null);
      },
      reset() {
        remaining = 0;
        apply(null);
      },
    };
  }

  const playerFlash = attach(player);
  const witchFlash = attach(witch);
  function reset() {
    playerFlash.reset();
    witchFlash.reset();
  }
  return {
    player: playerFlash.trigger,
    witch: witchFlash.trigger,
    update(dt, reduced) {
      playerFlash.update(dt, reduced);
      witchFlash.update(dt, reduced);
    },
    reset,
    dispose() {
      reset();
      white.dispose();
      blue.dispose();
    },
  };
}
