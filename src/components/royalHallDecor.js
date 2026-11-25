import * as THREE from 'three';

const ivory = '#d8c9b0', stone = '#aa9b87', bronze = '#97784d';
const gold = '#c8a96b', oak = '#59402e', blue = '#27487b';

function marbleFloor(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 960;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#908b81';
  ctx.fillRect(0, 0, 640, 960);
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 10; col++) {
      const x = col * 64, y = row * 64;
      ctx.fillStyle = ['#dbd4c5','#cec9bf','#e2d9c9','#d6d2c8'][(row * 3 + col * 7 + row * col) % 4];
      ctx.fillRect(x + 1, y + 1, 62, 62);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 1, y + 1, 62, 62);
      ctx.clip();
      for (let i = 0; i < 3; i++) {
        const offset = 27 * Math.sin(row * 3 + col + i * 1.8);
        ctx.strokeStyle = i ? '#beb9ae' : '#e9e3d7';
        ctx.lineWidth = i ? .7 : 1.9;
        ctx.beginPath();
        ctx.moveTo(x - 4, y + 23 + offset);
        ctx.bezierCurveTo(x + 33, y + offset, x + 29, y + 35 + offset, x + 67, y + 53 + offset);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  for (const x of [72, 568]) {
    ctx.fillStyle = '#80745f';
    ctx.fillRect(x - 6, 0, 12, 960);
    ctx.fillStyle = '#d8c59a';
    ctx.fillRect(x - 2, 0, 4, 960);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const surface = new THREE.MeshStandardMaterial({ map, roughness: .55 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 30), surface);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = .035;
  scene.add(floor);
  return () => { map.dispose(); surface.dispose(); };
}

export function furnishRoyalHall(scene) {
  const releaseFloor = marbleFloor(scene);
  const shapes = {
    block: new THREE.BoxGeometry(),
    column: new THREE.CylinderGeometry(.47, .5, 1, 12),
    capital: new THREE.CylinderGeometry(.5, .32, 1, 12),
    jewel: new THREE.OctahedronGeometry(.5),
    ring: new THREE.TorusGeometry(.5, .037, 7, 36),
  };
  const finish = new THREE.MeshStandardMaterial({ roughness: .79 });
  const glass = new THREE.MeshStandardMaterial({ roughness: .4, emissive: '#ab946e', emissiveIntensity: .22 });
  const transform = new THREE.Object3D(), tint = new THREE.Color(), batches = new Map();
  function part(shape, color, x, y, z, w, h, d, angle = 0, lit = false) {
    const key = shape + (lit ? '-glass' : '');
    if (!batches.has(key)) batches.set(key, { shape, lit, instances: [] });
    transform.position.set(x, y, z);
    transform.rotation.set(0, 0, angle);
    transform.scale.set(w, h, d);
    transform.updateMatrix();
    batches.get(key).instances.push([transform.matrix.clone(), color]);
  }
  function flush(parent) {
    for (const { shape, lit, instances } of batches.values()) {
      const batch = new THREE.InstancedMesh(shapes[shape], lit ? glass : finish, instances.length);
      instances.forEach(([matrix, color], i) => {
        batch.setMatrixAt(i, matrix);
        batch.setColorAt(i, tint.set(color));
      });
      parent.add(batch);
    }
    batches.clear();
  }
  function arch(radius, spring, depth) {
    for (let i = 0; i < 17; i++) {
      const a = (i + .5) * Math.PI / 17;
      part('block', i === 8 ? gold : ivory, radius * Math.cos(a), spring + radius * Math.sin(a),
        depth, radius * .19, i === 8 ? .42 : .29, .42, a - Math.PI / 2);
    }
  }
  // Woven lozenges repeat the throne crest along the edges of the runner.
  for (const side of [-1, 1]) {
    for (let z = -9.5; z < 11; z += .75) {
      part('jewel', '#b7a173', side * 1.79, .132, z, .21, .012, .42);
    }
    for (let i = 0; i < 3; i++) {
      part('block', bronze, side * (2.1 - i * .1), .292 + i * .27,
        -10.04 - i * .75, 3.78 - i * .23, .015, .075);
    }
    // Matching bronze candle trees flank the dais beyond the walking limit.
    const x = side * 4.55;
    part('capital', bronze, x, .23, -13, .87, .45, .87);
    part('column', bronze, x, 1.32, -13, .18, 1.85, .18);
    for (let arm = -1; arm <= 1; arm++) {
      const y = 2.34 - .3 * Math.abs(arm);
      if (arm) part('block', bronze, x + arm * .21, 1.88, -13, .1, .65, .1, -arm * .77);
      part('capital', gold, x + arm * .44, y, -13, .32, .19, .32);
      part('column', ivory, x + arm * .44, y + .26, -13, .18, .38, .18);
      part('jewel', '#efbd72', x + arm * .44, y + .54, -13, .12, .23, .12, 0, true);
    }
  }
  flush(scene);
  const sides = [];
  for (const sign of [-1, 1]) {
    const wall = new THREE.Group();
    scene.add(wall);
    sides.push(wall);
    for (let bay = 0; bay < 5; bay++) {
      const bayGroup = new THREE.Group();
      bayGroup.position.set(sign * 10, 0, -12 + bay * 6);
      bayGroup.rotation.y = -sign * Math.PI / 2;
      wall.add(bayGroup);
      part('block', stone, 0, 4.5, -.24, 6, 9, .48);
      part('block', oak, 0, 1, .06, 6, 2, .13);
      for (const y of [.22, 1.92, 8.8]) part('block', y > 2 ? ivory : bronze, 0, y, .15, 6, .16, .26);
      for (const u of [-2, 0, 2]) {
        part('block', '#70543f', u, 1.04, .18, 1.79, 1.35, .12);
        part('block', oak, u, 1.04, .26, 1.5, 1.08, .08);
      }
      for (const u of [-2.67, 2.67]) {
        part('block', ivory, u, .3, .32, .78, .6, .73);
        part('column', '#c0b29e', u, 2.94, .33, .53, 4.75, .58);
        part('capital', ivory, u, 5.43, .33, .82, .41, .8);
        part('column', bronze, u, 5.22, .33, .62, .09, .63);
      }
      arch(2.67, 5.54, .31);
      // The clerestory sits above the existing framed emblems.
      for (let pane = -3; pane <= 3; pane++) {
        const h = 1.08 + .84 * (1 - Math.abs(pane) / 3);
        part('block', ['#7298a6','#a89666','#657da2','#a69e86'][Math.abs(pane)],
          pane * .39, 5.67 + h / 2, .11, .36, h, .08, 0, true);
      }
      part('ring', bronze, 0, 6.53, .23, 1.07, 1.07, 1);
      part('jewel', gold, 0, 6.53, .25, .46, .7, .1);
      if (bay === 0 || bay === 4) {
        for (let shelf = 0; shelf < 2; shelf++) {
          const y = .5 + shelf * .69;
          part('block', oak, 0, y, .46, 3.3, .13, .74);
          for (let i = 0; i < 14; i++) {
            const h = .39 + .14 * Math.sin(i + shelf) ** 2, x = -1.42 + i * .21;
            part('block', ['#5d3540',blue,'#68705a','#79533a'][(i + bay + shelf) % 4],
              x, y + .07 + h / 2, .52, .18, h, .43);
            part('block', gold, x, y + .19, .74, .15, .028, .015);
          }
        }
      }
      flush(bayGroup);
    }
  }
  function endWall(z, entrance) {
    const g = new THREE.Group();
    g.position.z = z;
    g.rotation.y = entrance ? Math.PI : 0;
    scene.add(g);
    part('block', stone, 0, 4.48, -.31, 20, 8.96, .48);
    part('block', ivory, 0, 8.83, 0, 20, .35, .48);
    for (const sign of [-1, 1]) {
      const x = sign * 3.15;
      part('column', ivory, x, 2.62, .32, .81, 5.24, .81);
      part('capital', gold, x, 5.27, .32, 1.05, .42, 1.05);
      part('block', blue, sign * 6, 4.55, .14, 2.32, 5.8, .14);
      for (const offset of [-.98,.98]) part('block', gold, sign * 6 + offset, 4.55, .24, .06, 5.65, .06);
      part('jewel', gold, sign * 6, 4.64, .27, 1.14, 1.8, .12);
      part('block', bronze, sign * 6, 7.54, .19, 2.86, .15, .24);
    }
    arch(3.15, 5.38, .34);
    flush(g);
    return g;
  }
  const back = endWall(-15, false), entry = endWall(15, true);
  return {
    sides, entry,
    update(camera) {
      sides[0].visible = camera.position.x > -9.15;
      sides[1].visible = camera.position.x < 9.15;
      back.visible = camera.position.z > -14.1;
      entry.visible = camera.position.z < 14.1;
    },
    dispose() { releaseFloor(); finish.dispose(); glass.dispose(); },
  };
}
