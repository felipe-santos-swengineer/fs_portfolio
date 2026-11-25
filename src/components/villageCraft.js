import * as THREE from 'three';

// Each building has its own batches so its facade can be cut away as one piece.
export function meadowTexture() {
  const size = 128, data = new Uint8Array(size * size * 4);
  for (let z = 0; z < size; z++) for (let x = 0; x < size; x++) {
    const a = x * Math.PI * 2 / size, b = z * Math.PI * 2 / size;
    const grain = Math.sin(x * 17 + z * 113) * 7;
    const field = 224 + 13 * Math.sin(3 * a + Math.cos(b)) + 8 * Math.cos(2 * b + a) + grain;
    data.set([field, field + 3, field - 8, 255], (z * size + x) * 4);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 6);
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createVillageCraft() {
  const shapes = {
    timber: new THREE.BoxGeometry(),
    tile: new THREE.CylinderGeometry(.5, .48, 1, 8),
    leaf: new THREE.IcosahedronGeometry(.5, 1),
  };
  const material = new THREE.MeshStandardMaterial({ roughness: .92 });
  const pose = new THREE.Object3D(), color = new THREE.Color();
  const batches = new Map();
  function put(shape, tint, x, y, z, w, h, d, roll = 0, yaw = 0) {
    pose.position.set(x, y, z);
    pose.rotation.set(0, yaw, roll, 'YXZ');
    pose.scale.set(w, h, d);
    pose.updateMatrix();
    if (!batches.has(shape)) batches.set(shape, []);
    batches.get(shape).push([tint, pose.matrix.clone()]);
  }
  function finish(parent) {
    for (const [shape, parts] of batches) {
      const batch = new THREE.InstancedMesh(shapes[shape], material, parts.length);
      parts.forEach(([tint, matrix], i) => {
        batch.setMatrixAt(i, matrix);
        batch.setColorAt(i, color.set(tint));
      });
      batch.receiveShadow = true;
      batch.raycast = () => {}; // Existing meshes own the click targets.
      parent.add(batch);
    }
    batches.clear();
  }
  function house(parent, index) {
    const wood = '#594331', lime = ['#e5d4b5','#d8d4bc','#cfb596','#ded1ad'][index];
    const slates = [
      ['#96583f','#a86547','#955e49'], ['#596975','#677982','#60717c'],
      ['#806650','#907359','#866b54'], ['#657869','#768573','#6c7e70'],
    ][index];
    for (const side of [-1, 1]) {
      for (let row = 0; row < 7; row++) {
        const x = side * (.21 + row * .412);
        for (let col = 0; col < 12; col++) {
          const z = -2.19 + col * .4;
          put('timber', slates[(row + col * col + index) % 3], x,
            6.13 - Math.abs(x) * 2.1 / 2.9, z, .59, .09, .39, -side * .627);
        }
      }
      // Plastered panels within the gables follow the slope of the rafters.
      for (let i = 0; i < 6; i++) {
        const u = side * (.21 + i * .42), height = 1.98 - Math.abs(u) * .72;
        for (const face of [-1, 1])
          put('timber', lime, u, 4 + height / 2, face * 2.42, .39, height, .08);
      }
      for (const face of [-1, 1]) {
        put('timber', wood, side * 1.44, 5.04, face * 2.47, 3.62, .17, .16, -side * .627);
        put('timber', wood, side * 1.24, 1.42, face * 2.07, .13, 1.65, .13, side * .75);
      }
      const x = side * 1.55;
      put('timber', '#885b41', x, 1.71, 2.28, 1.29, .29, .38);
      for (let j = 0; j < 8; j++) {
        const at = x - .52 + .15 * j, y = 1.91 + .06 * Math.sin(j * 8);
        put('leaf', '#526648', at, y, 2.3, .29, .28, .29);
        put('leaf', ['#bd775e','#e9c779','#a789a8','#dea38d'][index], at, y + .15,
          2.34, .14, .13, .15);
      }
      // Side elevations have recessed-looking panels, braces and a stone plinth.
      for (const z of [-1.23, 0, 1.23]) {
        put('timber', wood, side * 2.53, 2.33, z, .16, 2.35, .12);
        put('timber', wood, side * 2.54, 2.3, z + .37, .13, 1.83, .12, .43, Math.PI / 2);
      }
      for (let j = 0; j < 7; j++)
        put('timber', j % 3 ? '#999181' : '#867f70', side * 2.56, .66,
          -1.72 + j * .57, .2, .47, .54);
    }
    for (let j = 0; j < 13; j++)
      put('tile', slates[1], 0, 6.16, -2.25 + j * .375, .27, .19, .4);
    finish(parent);
  }

  function garden(scene) {
    for (let i = 0; i < 48; i++) {
      const a = i * Math.PI / 24;
      put('timber', i % 4 ? '#b1a089' : '#d0b483', 2.38 * Math.sin(a), .222,
        2.38 * Math.cos(a), .29, .025, .25, 0, a);
      if (!(i % 2)) put('tile', '#b5a082', 1.51 * Math.sin(a), .55,
        1.51 * Math.cos(a), .28, .11, .28);
    }
    for (const x of [-13, 13]) for (const z of [-10.8, 11.6]) {
      for (let j = 0; j < 42; j++) {
        const angle = j * 2.4, r = Math.sqrt(j / 42);
        const px = x + 1.9 * r * Math.cos(angle), pz = z + .83 * r * Math.sin(angle);
        put('leaf', j % 3 ? '#65805a' : '#768b55', px, .22, pz, .47, .31, .45);
        if (j % 3) put('leaf', j % 4 ? '#d9b178' : '#b98492', px, .39, pz, .17, .14, .17);
      }
    }
    finish(scene);
  }
  return { house, garden };
}
