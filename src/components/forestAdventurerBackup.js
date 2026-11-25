import * as THREE from 'three';

// Aparência do protagonista: capuz, tecidos e couro em camadas sobre a mesma
// estrutura articular usada por todas as cenas. Nenhum pivô é alterado aqui.
const COLORS = {
  forest: '#344C2C',
  olive: '#59683A',
  darkOlive: '#2b3e25',
  leather: '#513421',
  linen: '#C5B597',
  bronze: '#9A7842',
  dark: '#292820',
  mask: '#2f3a33',
  skin: '#c5a27f',
  hair: '#3a2a20',
};

const FINISHES = {
  cloth: { roughness: .96, metalness: 0, emissive: .05, side: THREE.FrontSide },
  clothDouble: { roughness: .96, metalness: 0, emissive: .05, side: THREE.DoubleSide },
  leather: { roughness: .78, metalness: .02, emissive: .02, side: THREE.FrontSide },
  metal: { roughness: .38, metalness: .8, emissive: .015, side: THREE.FrontSide },
  skin: { roughness: .9, metalness: 0, emissive: 0, side: THREE.FrontSide },
};

function drapedCloth(width, height, segments = 10, sweep = 0, fold = .045) {
  const geometry = new THREE.PlaneGeometry(width, height, segments, 6);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const fall = (height / 2 - positions.getY(i)) / height;
    positions.setX(i, x * (.8 + .2 * fall) + sweep * fall * fall);
    positions.setZ(i, -.03 - fold * Math.cos(x * 9) * fall - .02 * fall);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function dressForestAdventurer(body, limbs, { box, sphere }) {
  // Materiais locais: cada aventureiro compartilha acabamentos entre peças e
  // o cleanup da cena libera o material uma única vez.
  const materials = new Map();
  const material = (color, finish) => {
    const key = `${color}|${finish}`;
    if (!materials.has(key)) {
      const setting = FINISHES[finish];
      materials.set(key, new THREE.MeshStandardMaterial({
        color,
        roughness: setting.roughness,
        metalness: setting.metalness,
        emissive: color,
        emissiveIntensity: setting.emissive,
        side: setting.side,
      }));
    }
    return materials.get(key);
  };
  const part = (parent, geometry, color, x, y, z, finish = 'cloth', options = {}) => {
    const item = new THREE.Mesh(geometry, material(color, finish));
    item.position.set(x, y, z);
    if (options.rotation) item.rotation.set(...options.rotation);
    if (options.scale) item.scale.set(...options.scale);
    item.castShadow = options.castShadow !== false;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  };
  const panel = (parent, w, h, d, color, x, y, z, finish = 'cloth', options) =>
    part(parent, new THREE.BoxGeometry(w, h, d), color, x, y, z, finish, options);
  const tube = (parent, top, bottom, height, color, x, y, z, finish = 'cloth', options = {}) =>
    part(parent, new THREE.CylinderGeometry(top, bottom, height, options.segments || 10, 1,
      Boolean(options.open), options.start || 0, options.length || Math.PI * 2),
    color, x, y, z, finish, { ...options, castShadow: options.castShadow ?? top >= .03 });
  const bead = (parent, radius, color, x, y, z, finish = 'skin', options = {}) =>
    part(parent, new THREE.SphereGeometry(radius, options.segments || 10, options.rings || 8,
      options.phiStart || 0, options.phiLength || Math.PI * 2,
      options.thetaStart || 0, options.thetaLength || Math.PI),
    color, x, y, z, finish, { ...options, castShadow: options.castShadow ?? radius >= .03 });
  const ring = (parent, radius, thickness, color, x, y, z, finish = 'metal', options = {}) =>
    part(parent, new THREE.TorusGeometry(radius, thickness, 6, options.segments || 20, options.arc || Math.PI * 2),
      color, x, y, z, finish, { ...options, castShadow: options.castShadow ?? thickness >= .025 });

  // Cabeça: olhos expostos e máscara de tecido cobrindo nariz e boca.
  bead(body, .28, COLORS.skin, 0, 1.82, 0, 'skin', { segments: 14, rings: 10 });
  bead(body, .288, COLORS.hair, 0, 1.87, -.02, 'cloth', { segments: 12, rings: 8, thetaLength: Math.PI * .52 });
  [-1, 1].forEach(s => bead(body, .062, COLORS.hair, s * .2, 1.77, .07, 'cloth', { scale: [.7, 1.35, .7] }));
  // Só sobrancelhas e olhos: nariz e boca ficam escondidos sob a máscara.
  const face = new THREE.Group();
  face.name = 'Detalhes do rosto';
  face.position.y = 1.82;
  body.add(face);
  [-1, 1].forEach(s => {
    box(face, .1, .022, .025, '#514139', s * .1, .28 * .43, .28 * .91);
    sphere(face, .028, '#14212b', s * .1, .28 * .14, .28 * .93);
  });
  bead(body, .295, COLORS.mask, 0, 1.82, 0, 'clothDouble', {
    segments: 18, rings: 10, phiStart: Math.PI * .23, phiLength: Math.PI * .54,
    thetaStart: Math.PI * .48, thetaLength: Math.PI * .35,
  });
  // Capuz natural: cúpula fechada, laterais abertas no rosto e borda macia.
  bead(body, .36, COLORS.forest, 0, 1.86, -.035, 'clothDouble', { segments: 18, rings: 10, thetaLength: Math.PI * .46 });
  bead(body, .365, COLORS.forest, 0, 1.86, -.035, 'clothDouble', {
    segments: 18, rings: 10, phiStart: Math.PI * .69, phiLength: Math.PI * 1.62,
    thetaStart: Math.PI * .4, thetaLength: Math.PI * .38,
  });
  bead(body, .345, COLORS.darkOlive, 0, 1.858, -.03, 'clothDouble', {
    segments: 14, rings: 8, phiStart: Math.PI * .69, phiLength: Math.PI * 1.62,
    thetaStart: Math.PI * .4, thetaLength: Math.PI * .36,
  });
  part(body, new THREE.ConeGeometry(.17, .3, 12), COLORS.forest, 0, 2.16, -.09, 'cloth', { rotation: [-.3, 0, 0] });
  bead(body, .045, COLORS.forest, 0, 2.303, -.134, 'cloth', { segments: 8, rings: 6 });
  tube(body, .3, .4, .26, COLORS.forest, 0, 1.53, -.05, 'clothDouble', { segments: 12, open: true });

  // Túnica, dobras e barra recortada.
  tube(body, .355, .31, .78, COLORS.olive, 0, 1.13, 0, 'cloth', { segments: 14 });
  [-.22, -.075, .075, .22].forEach((x, i) => tube(body, .012, .012, .6,
    i % 2 ? COLORS.forest : COLORS.dark, x, 1.14, Math.sqrt(.33 * .33 - x * x) + .012, 'cloth', { segments: 5 }));
  tube(body, .315, .35, .2, COLORS.forest, 0, .76, 0, 'clothDouble', { segments: 14, open: true });
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;
    part(body, new THREE.ConeGeometry(.055, .16, 4), COLORS.forest,
      .3 * Math.sin(angle), .64, .3 * Math.cos(angle), 'cloth', { rotation: [Math.PI, 0, 0] });
  }

  // Colete de couro aberto à frente, com tiras, costuras e fivelas.
  tube(body, .385, .345, .62, COLORS.leather, 0, 1.17, 0, 'leather', {
    segments: 14, open: true, start: Math.PI * .29, length: Math.PI * 1.42,
  });
  [-1, 1].forEach(s => {
    panel(body, .075, .6, .05, COLORS.leather, s * .17, 1.18, .3, 'leather', { rotation: [0, 0, s * .07] });
    panel(body, .012, .54, .012, COLORS.linen, s * .225, 1.18, .3, 'cloth');
    ring(body, .026, .008, COLORS.bronze, s * .17, 1.27, .34, 'metal', { segments: 12 });
  });
  [-1, 1].forEach(s => {
    bead(body, .18, COLORS.leather, s * .395, 1.5, 0, 'leather', { scale: [1, .55, 1.08], thetaLength: Math.PI * .55 });
    bead(body, .018, COLORS.bronze, s * .42, 1.53, .04, 'metal', { segments: 6, rings: 4 });
  });
  ring(body, .25, .035, COLORS.linen, 0, 1.55, 0, 'cloth', { rotation: [Math.PI / 2, 0, 0] });
  ring(body, .075, .018, COLORS.bronze, 0, 1.53, .38, 'metal', { segments: 16 });
  bead(body, .03, COLORS.forest, 0, 1.53, .39, 'cloth', { segments: 8, rings: 6 });

  // Braços construídos por uma única função: os dois lados são idênticos.
  const buildArm = arm => {
    tube(arm, .12, .095, .48, COLORS.linen, 0, -.26, 0, 'cloth');
    tube(arm, .108, .112, .055, COLORS.linen, 0, -.5, 0, 'cloth');
    tube(arm, .1, .1, .1, COLORS.linen, 0, -.54, 0, 'cloth');
    tube(arm, .105, .115, .24, COLORS.leather, 0, -.39, 0, 'leather');
    [-.29, -.49].forEach(y => tube(arm, .12, .12, .022, COLORS.bronze, 0, y, 0, 'metal'));
    [-1, 1].forEach(s => bead(arm, .016, COLORS.bronze, s * .1, -.39, .045, 'metal', { segments: 6, rings: 4 }));
    bead(arm, .095, COLORS.leather, 0, -.59, .03, 'leather', { scale: [1, .9, .85] });
    bead(arm, .14, COLORS.leather, 0, 0, 0, 'leather', { scale: [1.05, .55, 1.05], thetaLength: Math.PI * .55 });
  };
  [2, 3].forEach(index => buildArm(limbs[index]));

  // Pernas construídas pela mesma função; biqueira e solado nos dois pés.
  const buildLeg = leg => {
    tube(leg, .14, .105, .62, COLORS.dark, 0, -.3, 0, 'cloth');
    bead(leg, .115, COLORS.leather, 0, -.46, .025, 'leather', { scale: [1.1, .7, .6] });
    [-.04, .04].forEach(x => bead(leg, .014, COLORS.bronze, x, -.46, .08, 'metal', { segments: 6, rings: 4 }));
    tube(leg, .125, .135, .28, COLORS.leather, 0, -.53, 0, 'leather');
    [-.46, -.58].forEach(y => tube(leg, .14, .14, .022, COLORS.bronze, 0, y, 0, 'metal'));
    panel(leg, .09, .07, .03, COLORS.bronze, 0, -.46, .14, 'metal');
    panel(leg, .28, .16, .42, COLORS.leather, 0, -.68, .1, 'leather');
    panel(leg, .29, .035, .44, COLORS.dark, 0, -.765, .1, 'leather');
    bead(leg, .12, COLORS.linen, 0, -.68, .26, 'cloth', { scale: [1.1, .55, .55] });
    panel(leg, .28, .02, .04, COLORS.bronze, 0, -.62, .29, 'metal');
  };
  [0, 1].forEach(index => buildLeg(limbs[index]));

  // Cinto largo, fivela, bolsas e talabarte diagonal discreto.
  tube(body, .35, .35, .12, COLORS.leather, 0, .87, 0, 'leather', { segments: 14 });
  [.8, .94].forEach(y => tube(body, .355, .355, .018, COLORS.bronze, 0, y, 0, 'metal', { segments: 14 }));
  panel(body, .14, .12, .04, COLORS.bronze, 0, .87, .355, 'metal');
  panel(body, .08, .07, .045, COLORS.dark, 0, .87, .38, 'leather');
  [-1, 1].forEach(s => {
    panel(body, .14, .18, .12, COLORS.leather, s * .35, .77, .02, 'leather', { rotation: [0, 0, s * .08] });
    panel(body, .15, .06, .13, COLORS.darkOlive, s * .35, .85, .02, 'cloth');
    bead(body, .016, COLORS.bronze, s * .4, .83, .08, 'metal', { segments: 6, rings: 4 });
  });
  panel(body, .07, 1, .035, COLORS.leather, -.02, 1.18, .35, 'leather', { rotation: [0, 0, -.55] });
  [1.45, 1.2, .95].forEach(y => bead(body, .017, COLORS.bronze, -.02 + .52 * (y - 1.18), y, .38, 'metal', { segments: 6, rings: 4 }));

  // Capa em camadas: forro, tecido principal, sobreposição nos ombros,
  // bordo de couro e pontas desgastadas. O pivô é o mesmo da cena.
  const cape = new THREE.Group();
  cape.position.set(0, 1.1, -.29);
  cape.rotation.x = -.13;
  body.add(cape);
  part(cape, drapedCloth(.86, .72, 12, 0, .055), COLORS.darkOlive, 0, -.04, -.03, 'clothDouble');
  part(cape, drapedCloth(.86, .72, 12, 0, .06), COLORS.forest, 0, 0, -.1, 'clothDouble');
  part(cape, drapedCloth(1, .3, 12, 0, .04), COLORS.olive, 0, .21, -.06, 'clothDouble');
  part(cape, drapedCloth(.8, .08, 12, 0, .05), COLORS.leather, 0, -.36, -.13, 'clothDouble');
  [-.36, -.19, -.02, .16, .33].forEach((x, i) => part(cape, new THREE.ConeGeometry(.05, .1 + (i % 2) * .06, 4),
    COLORS.forest, x, -.4 - (i % 2) * .03, -.13, 'cloth', { rotation: [Math.PI, 0, 0] }));
  [-1, 1].forEach(s => {
    tube(cape, .022, .022, .68, COLORS.leather, s * .37 - .04, -.04, -.04, 'leather', { segments: 6, rotation: [0, 0, s * .06] });
    bead(cape, .018, COLORS.bronze, s * .36 - .04, .22, -.03, 'metal', { segments: 6, rings: 4 });
    panel(cape, .04, .44, .035, COLORS.leather, s * .26, .21, .07, 'leather', { rotation: [0, 0, s * .2] });
  });

  // Volume extra nas costas, simétrico e abaixo da capa.
  tube(body, .105, .105, .42, COLORS.leather, 0, 1.28, -.42, 'leather', {
    segments: 8, rotation: [Math.PI / 2, 0, 0],
  });
  [-1, 1].forEach(s => panel(body, .18, .2, .12, COLORS.leather, s * .26, .9, -.34, 'leather'));

  return cape;
}
