import * as THREE from 'three';

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
