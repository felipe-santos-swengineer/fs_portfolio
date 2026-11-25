import * as THREE from 'three';

// A single painted pavement keeps the joints and inlays below every combat overlay.
function gardenPavement() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1280;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#353936';
  ctx.fillRect(0, 0, 1024, 1280);
  const slabs = ['#60605e', '#626361', '#5a5d5c', '#636461', '#595c59'];
  let seed = 91;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let row = 0; row < 40; row++) {
    for (let col = -1; col < 16; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 32;
      ctx.fillStyle = slabs[Math.floor(random() * slabs.length)];
      ctx.fillRect(x + 1, y + 1, 62, 30);
      if (random() < .22) {
        ctx.strokeStyle = '#474d48';
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 19, y + 12);
        ctx.lineTo(x + 16, y + 17);
        ctx.lineTo(x + 32, y + 26);
        ctx.stroke();
      }
    }
  }
  ctx.translate(512, 665);
  ctx.fillStyle = '#847e70';
  for (const x of [-70, -65, 64, 69]) ctx.fillRect(x, 195, 2, 470);
  // Broken brass tesserae surround a weathered eight-petal royal rosette.
  for (let i = 0; i < 64; i++) {
    ctx.save();
    ctx.rotate(i * Math.PI / 32);
    ctx.fillStyle = i % 7 ? '#827b6c' : '#535951';
    ctx.fillRect(-7, -209, 14, 4);
    ctx.fillRect(-2, -200, 4, i % 4 ? 5 : 12);
    ctx.restore();
  }
  ctx.strokeStyle = '#777569';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(-47, -88, 0, -163);
    ctx.quadraticCurveTo(47, -88, 0, -18);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCourtyardGarden(scene, completed) {
  const pavement = gardenPavement();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 64),
    new THREE.MeshStandardMaterial({ map: pavement, roughness: .76 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.005;
  scene.add(floor);

  const stone = '#57534e', trim = '#777670', iron = '#242730', bark = '#392e37';
  const gold = '#a68a56', foliage = '#354439', violet = '#65526d';
  const shapes = {
    block: new THREE.BoxGeometry(), shaft: new THREE.CylinderGeometry(.49, .5, 1, 10),
    bowl: new THREE.CylinderGeometry(.5, .32, 1, 20),
    spike: new THREE.ConeGeometry(.5, 1, 8), rock: new THREE.IcosahedronGeometry(.5, 0),
  };
  const batches = new Map(), transform = new THREE.Object3D();
  function place(shape, color, x, y, z, w, h, d, tilt = 0, yaw = 0) {
    transform.position.set(x, y, z);
    transform.rotation.set(0, yaw, tilt, 'YXZ');
    transform.scale.set(w, h, d);
    transform.updateMatrix();
    if (!batches.has(shape)) batches.set(shape, []);
    batches.get(shape).push([transform.matrix.clone(), color]);
  }
  // The real camera is clamped inside +/-17.45 by +/-23.45. Keep the entire
  // volume of every upright prop outside that rectangle, including its crown.
  function arcade(x, z, yaw, ruined) {
    const part = (shape, color, u, y, depth, w, h, d, tilt = 0) =>
      place(shape, color, x + u * Math.cos(yaw) + depth * Math.sin(yaw), y,
        z - u * Math.sin(yaw) + depth * Math.cos(yaw), w, h, d, tilt, yaw);
    part('block', '#383b42', 0, 2.7, -1, 5.9, 5.4, .9);
    part('block', trim, 0, .45, 0, 5.9, .3, 1.3);
    for (const side of [-1, 1]) {
      const u = side * 2.69;
      part('block', stone, u, 1, .2, .95, 2, 1.35);
      part('shaft', stone, u, 3.6, .25, .72, 4, .72);
      part('bowl', trim, u, 5.48, .25, 1.05, .45, 1.05);
      if (ruined && side === 1) continue;
      // Each half of the pointed arch is a course of tapered-inward voussoirs.
      for (let i = 0; i < 8; i++) {
        const t = (i + .5) / 8;
        part('block', i % 3 ? stone : trim, side * 2.69 * (1 - t * t),
          5.65 + t * 3.45, .24, .47, Math.hypot(3.45, 5.38 * t) / 8 + .025,
          .78, side * Math.atan(5.38 * t / 3.45));
      }
      part('spike', iron, u, 6.7, -.44, .85, 2.5, .85);
      for (let i = 0; i < 3; i++)
        part('block', ['#554552', '#524356', '#47465a'][i], side * (.38 + i * .68),
          4.9, -.46, .58, 4.8 - i * .7, .09);
    }
  }
  for (let i = -3; i <= 3; i++) arcade(i * 6, -29, 0, i === -2);
  for (const side of [-1, 1]) {
    for (let i = -3; i <= 2; i++) arcade(side * 24, i * 6, -side * Math.PI / 2, i === 1);
    place('shaft', stone, side * 15, 6, -32, 4.7, 12, 4.7);
    place('spike', iron, side * 15, 15, -32, 5.5, 6.5, 5.5);
    // Low fragments frame the entrance in the foreground.
    for (let i = 0; i < 8; i++)
      place('block', stone, side * (4 + i * 2), .33, 25.5, 1.93, .66, 1.2);

    for (let i = 0; i < 3; i++) {
      const x = side * 20.9, z = -16 + i * 13 + side * 2;
      place('block', '#494942', x, .23, z, 3.6, .46, 7.4);
      place('rock', foliage, x, .48, z, 3.3, .8, 7);
      for (let j = 0; j < 18; j++) {
        const a = j * 2.4;
        place('rock', j % 4 ? foliage : '#643947', x + 1.2 * Math.sin(a),
          .61 + .2 * Math.cos(a), z + 3 * Math.cos(a * 1.7), .48, .56, .54);
      }
      for (const branch of [-1, 1]) {
        const lean = branch * .45;
        place('shaft', bark, x, 1.9, z, .62, 3.4, .65, .15);
        place('shaft', bark, x - branch * .49, 4, z, .36, 2.8, .38, lean);
        place('spike', bark, x - branch * 1.43, 5.9, z, .29, 2.1, .3, lean * 1.3);
        place('spike', bark, x - branch * .35, 5.6, z + .23, .23, 1.9, .22, -lean);
      }
    }
  }
  // The ruined fountain still carries the effigy of a crowned sovereign.
  const fx = -11, fz = -25.9;
  place('shaft', stone, fx, .25, fz, 4.2, .5, 4.2);
  place('bowl', trim, fx, .78, fz, 4.4, .7, 4.4);
  place('shaft', '#364449', fx, 1.14, fz, 3.97, .035, 3.97);
  place('shaft', stone, fx, 1.65, fz, 1.1, 1, 1.1);
  place('spike', trim, fx, 2.85, fz, 1.55, 2.3, 1.3);
  place('rock', trim, fx, 3.85, fz, .72, .88, .68);
  place('bowl', gold, fx, 4.19, fz, .74, .26, .72);
  for (let i = 0; i < 6; i++)
    place('spike', gold, fx + .28 * Math.cos(i), 4.39, fz + .28 * Math.sin(i), .13, .29, .13);

  const az = -25.8;
  for (const x of [6.5, 9.5]) place('shaft', stone, x, .76, az, .85, 1.5, .85);
  place('block', trim, 8, 1.58, az, 4.5, .38, 1.6);
  place('block', '#57343e', 8, 1.87, az, 1, .18, .72, 0, .23);
  for (let i = 0; i < 5; i++) {
    const x = 6.25 + i * .24, h = .34 + (i % 3) * .14;
    place('shaft', iron, x, 1.77 + h / 2, az, .15, h, .15);
    place('spike', '#dfb57e', x, 1.84 + h, az, .09, .21, .09);
  }
  for (let i = 0; i < 4; i++)
    place('rock', violet, 9 + i * .22, 2.08, az, .32, .6 + .18 * i, .36, -.21 * i);

  const material = new THREE.MeshStandardMaterial({ roughness: .84 });
  const tint = new THREE.Color();
  for (const [shape, instances] of batches) {
    const mesh = new THREE.InstancedMesh(shapes[shape], material, instances.length);
    instances.forEach(([matrix, color], index) => {
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, tint.set(color));
    });
    scene.add(mesh);
  }
  const glow = new THREE.PointLight('#aa86cd', completed ? 0 : 11, 12);
  glow.position.set(8, 3.1, az);
  scene.add(glow);
  return {
    update(dt, phase, reduced, time) {
      const spent = completed || phase === 'won';
      const intensity = spent ? 0 : phase && phase !== 'lost' ? 17 : 11;
      const flicker = reduced || spent ? 0 : .6 * Math.sin(time * 1.5);
      glow.intensity = THREE.MathUtils.lerp(glow.intensity, intensity + flicker, 1 - Math.exp(-dt));
    },
    dispose() { pavement.dispose(); },
  };
}
