
import * as THREE from 'three';

// ==========================================
// PALETA DE CORES
// ==========================================

const COLORS = {
  forest: '#405B32',
  olive: '#687C43',
  darkOlive: '#2B3E25',
  leather: '#513421',
  lightLeather: '#79583A',
  darkLeather: '#39291F',
  linen: '#C5B597',
  bronze: '#9A7842',
  dark: '#292820',
  mask: '#252B29',
  skin: '#C5A27F',
  hair: '#3A2A20',
};

// ==========================================
// MAPEAMENTO DOS MEMBROS
// Não alterar os índices das animações.
// ==========================================

const LIMB_INDEX = {
  legs: [0, 2],
  arms: [1, 3],
};

// ==========================================
// MATERIAIS
// ==========================================

const FINISHES = {
  cloth: {
    roughness: .96,
    metalness: 0,
    emissive: .05,
    side: THREE.FrontSide,
  },

  clothDouble: {
    roughness: .96,
    metalness: 0,
    emissive: .05,
    side: THREE.DoubleSide,
  },

  leather: {
    roughness: .78,
    metalness: .02,
    emissive: .02,
    side: THREE.FrontSide,
  },

  metal: {
    roughness: .38,
    metalness: .8,
    emissive: .015,
    side: THREE.FrontSide,
  },

  skin: {
    roughness: .9,
    metalness: 0,
    emissive: 0,
    side: THREE.FrontSide,
  },
};

// ==========================================
// GEOMETRIA DA CAPA MEDIEVAL
// ==========================================

function createCapeGeometry(
  width = 1.02,
  height = .94,
  segmentsX = 48,
  segmentsY = 32
) {
  const geometry = new THREE.PlaneGeometry(
    width,
    height,
    segmentsX,
    segmentsY
  );

  const positions = geometry.attributes.position;
  const colors = [];

  const upperColor = new THREE.Color('#526A38');
  const middleColor = new THREE.Color('#405B32');
  const lowerColor = new THREE.Color('#293F25');
  const borderColor = new THREE.Color('#71824E');

  const vertexColor = new THREE.Color();

  for (let i = 0; i < positions.count; i++) {
    const originalX = positions.getX(i);
    const originalY = positions.getY(i);

    const u = originalX / (width / 2);
    const v = (height / 2 - originalY) / height;

    const edge = Math.abs(u);

    // Abertura gradual em direção à base.

    const spread =
      .76 + .24 * Math.pow(v, .7);

    // Dobras principais do tecido.

    const folds =
      Math.cos(u * Math.PI * 3.5 + v * .65) *
      (.014 + .035 * v);

    // Ondulações secundárias.

    const secondaryFolds =
      Math.sin(u * Math.PI * 7 - v * 1.5) *
      .009 * v;

    // Curvatura acompanhando as costas.

    const curvature =
      .16 * Math.pow(edge, 2) *
      (1 - .45 * v);

    // Caimento natural do tecido.

    const drape =
      -.24 * v -
      .065 * v * v;

    // Barra inferior arredondada.

    const hem =
      .065 *
      Math.pow(edge, 2) *
      Math.pow(v, 5);

    const hemWave =
      Math.sin(u * Math.PI * 4) *
      .012 *
      Math.pow(v, 8);

    const x =
      originalX * spread;

    const y =
      originalY +
      hem +
      hemWave -
      .045 * edge * (1 - v);

    const z =
      curvature +
      drape +
      folds +
      secondaryFolds;

    positions.setXYZ(i, x, y, z);

    // Gradiente de verde-floresta.

    if (v < .45) {
      vertexColor
        .copy(upperColor)
        .lerp(middleColor, v / .45);
    } else {
      vertexColor
        .copy(middleColor)
        .lerp(
          lowerColor,
          (v - .45) / .55
        );
    }

    // Sombreamento sutil das dobras.

    const foldShade =
      .94 +
      .06 *
      Math.cos(u * Math.PI * 3.5 + v * .65);

    vertexColor.multiplyScalar(foldShade);

    // Borda escura integrada ao tecido.

    const border = Math.max(
      THREE.MathUtils.smoothstep(
        edge, .94, 1
      ),
      THREE.MathUtils.smoothstep(
        v, .965, 1
      )
    );

    vertexColor.lerp(
      lowerColor,
      border * .65
    );

    // Faixa decorativa integrada à geometria.
    // Evita tubos e objetos soltos nas bordas.

    const sideTrim =
      THREE.MathUtils.smoothstep(
        edge, .89, .92
      ) *
      (
        1 -
        THREE.MathUtils.smoothstep(
          edge, .94, .97
        )
      );

    const bottomTrim =
      THREE.MathUtils.smoothstep(
        v, .92, .94
      ) *
      (
        1 -
        THREE.MathUtils.smoothstep(
          v, .96, .98
        )
      );

    const trim = Math.max(
      sideTrim,
      bottomTrim
    );

    vertexColor.lerp(
      borderColor,
      trim * .65
    );

    colors.push(
      vertexColor.r,
      vertexColor.g,
      vertexColor.b
    );
  }

  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(
      colors,
      3
    )
  );

  positions.needsUpdate = true;

  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  return geometry;
}

// ==========================================
// CONSTRUÇÃO DO PERSONAGEM
// ==========================================

export function dressForestAdventurer(
  body,
  limbs,
  { box, sphere }
) {
  const materials = new Map();

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  const material = (color, finish) => {
    const key = `${color}|${finish}`;

    if (!materials.has(key)) {
      const setting = FINISHES[finish];

      materials.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness: setting.roughness,
          metalness: setting.metalness,
          emissive: color,
          emissiveIntensity: setting.emissive,
          side: setting.side,
        })
      );
    }

    return materials.get(key);
  };

  const part = (
    parent,
    geometry,
    color,
    x,
    y,
    z,
    finish = 'cloth',
    options = {}
  ) => {
    const item = new THREE.Mesh(
      geometry,
      material(color, finish)
    );

    item.position.set(x, y, z);

    if (options.rotation) {
      item.rotation.set(...options.rotation);
    }

    if (options.scale) {
      item.scale.set(...options.scale);
    }

    item.castShadow =
      options.castShadow !== false;

    item.receiveShadow = true;

    parent.add(item);

    return item;
  };

  const panel = (
    parent,
    w,
    h,
    d,
    color,
    x,
    y,
    z,
    finish = 'cloth',
    options = {}
  ) => part(
    parent,
    new THREE.BoxGeometry(w, h, d),
    color,
    x, y, z,
    finish,
    options
  );

  const tube = (
    parent,
    top,
    bottom,
    height,
    color,
    x,
    y,
    z,
    finish = 'cloth',
    options = {}
  ) => part(
    parent,
    new THREE.CylinderGeometry(
      top,
      bottom,
      height,
      options.segments || 16,
      options.heightSegments || 1,
      Boolean(options.open),
      options.start ?? 0,
      options.length ?? Math.PI * 2
    ),
    color,
    x, y, z,
    finish,
    {
      ...options,
      castShadow:
        options.castShadow ?? top >= .03,
    }
  );

  const bead = (
    parent,
    radius,
    color,
    x,
    y,
    z,
    finish = 'skin',
    options = {}
  ) => part(
    parent,
    new THREE.SphereGeometry(
      radius,
      options.segments || 16,
      options.rings || 12,
      options.phiStart ?? 0,
      options.phiLength ?? Math.PI * 2,
      options.thetaStart ?? 0,
      options.thetaLength ?? Math.PI
    ),
    color,
    x, y, z,
    finish,
    {
      ...options,
      castShadow:
        options.castShadow ?? radius >= .03,
    }
  );

  const ring = (
    parent,
    radius,
    thickness,
    color,
    x,
    y,
    z,
    finish = 'metal',
    options = {}
  ) => part(
    parent,
    new THREE.TorusGeometry(
      radius,
      thickness,
      6,
      options.segments || 20,
      options.arc ?? Math.PI * 2
    ),
    color,
    x, y, z,
    finish,
    {
      ...options,
      castShadow:
        options.castShadow ?? thickness >= .025,
    }
  );

  // ========================================
  // CABEÇA
  // ========================================

  bead(
    body,
    .28,
    COLORS.skin,
    0, 1.82, 0,
    'skin',
    {
      segments: 24,
      rings: 18,
      scale: [.94, 1, .96],
    }
  );

  // Pescoço.

  tube(
    body,
    .115, .145, .22,
    COLORS.mask,
    0, 1.56, 0,
    'cloth',
    {
      segments: 20,
    }
  );

  // Cabelo discreto sob o capuz.

  bead(
    body,
    .275,
    COLORS.hair,
    0, 1.87, -.015,
    'cloth',
    {
      segments: 20,
      rings: 14,
      thetaLength: Math.PI * .44,
    }
  );

  // ========================================
  // ROSTO E OLHOS ORIGINAIS
  // Olhos pretos simples, sem íris ou pupilas.
  // ========================================

  const face = new THREE.Group();

  face.name = 'Detalhes do rosto';
  face.position.y = 1.82;

  body.add(face);

  [-1, 1].forEach(s => {
    // Sobrancelhas originais.

    box(
      face,
      .1,
      .022,
      .025,
      '#514139',
      s * .1,
      .28 * .43,
      .28 * .91
    );

    // Olhos pretos originais.

    sphere(
      face,
      .028,
      '#14212b',
      s * .1,
      .28 * .14,
      .28 * .93
    );
  });

  // ========================================
  // MÁSCARA FACIAL ESTILO KAKASHI
  // ========================================

  bead(
    body,
    .287,
    COLORS.mask,
    0, 1.82, .005,
    'clothDouble',
    {
      segments: 32,
      rings: 24,
      thetaStart: Math.PI * .46,
      thetaLength: Math.PI * .54,
      scale: [.97, 1.015, 1.02],
    }
  );

  // Volume discreto do nariz sob a máscara.

  bead(
    face,
    .052,
    COLORS.mask,
    0, -.015, .265,
    'cloth',
    {
      scale: [.72, .95, .65],
    }
  );

  // ========================================
  // CAPUZ MEDIEVAL
  // Geometria contínua, sem antenas.
  // ========================================

  const hoodGeometry =
    new THREE.SphereGeometry(
      1,
      40,
      28
    );

  const hp = hoodGeometry.attributes.position;
  const hi = hoodGeometry.index;

  const kept = [];

  // Abertura frontal do capuz.

  for (let i = 0; i < hi.count; i += 3) {
    const ids = [
      hi.getX(i),
      hi.getX(i + 1),
      hi.getX(i + 2),
    ];

    const y = ids.reduce(
      (sum, j) => sum + hp.getY(j), 0
    ) / 3;

    const z = ids.reduce(
      (sum, j) => sum + hp.getZ(j), 0
    ) / 3;

    const opening =
      z > .45 &&
      y > -.78 &&
      y < .55;

    if (!opening) {
      kept.push(...ids);
    }
  }

  hoodGeometry.setIndex(kept);

  // Deformação orgânica do tecido.

  for (let i = 0; i < hp.count; i++) {
    const x = hp.getX(i);
    const y = hp.getY(i);
    const z = hp.getZ(i);

    const peak = Math.pow(
      Math.max(0, y),
      4
    );

    const fold =
      1 +
      .012 *
      Math.cos(
        Math.atan2(x, z) * 6
      );

    hp.setXYZ(
      i,
      x * .35 * fold,
      y * .35 + peak * .065,
      z * .35 - peak * .085
    );
  }

  hp.needsUpdate = true;

  hoodGeometry.computeVertexNormals();
  hoodGeometry.computeBoundingBox();
  hoodGeometry.computeBoundingSphere();

  part(
    body,
    hoodGeometry,
    COLORS.forest,
    0, 1.86, -.025,
    'clothDouble'
  );

  // Gola integrada ao capuz.

  tube(
    body,
    .285, .365, .24,
    COLORS.forest,
    0, 1.53, -.035,
    'clothDouble',
    {
      segments: 24,
      open: true,
    }
  );

  // ========================================
  // TRONCO E TÚNICA
  // ========================================

  tube(
    body,
    .355, .31, .78,
    COLORS.olive,
    0, 1.13, 0,
    'cloth',
    {
      segments: 24,
      heightSegments: 4,
    }
  );

  // Peitoral.

  bead(
    body,
    .34,
    COLORS.olive,
    0, 1.39, 0,
    'cloth',
    {
      segments: 24,
      rings: 16,
      scale: [1.05, .48, .94],
    }
  );

  // Abdômen.

  bead(
    body,
    .31,
    COLORS.forest,
    0, .88, 0,
    'cloth',
    {
      scale: [1, .65, .92],
    }
  );

  // Dobras verticais da túnica.

  [-.22, -.075, .075, .22].forEach(
    (x, i) => {
      tube(
        body,
        .009, .012, .55,
        i % 2
          ? COLORS.forest
          : COLORS.darkOlive,
        x,
        1.14,
        Math.sqrt(.33 * .33 - x * x) + .012,
        'cloth',
        {
          segments: 6,
          castShadow: false,
        }
      );
    }
  );

  // ========================================
  // BARRA INFERIOR DA TÚNICA
  // ========================================

  const skirtGeometry =
    new THREE.CylinderGeometry(
      .315,
      .35,
      .24,
      32,
      5,
      true
    );

  const skirtPositions =
    skirtGeometry.attributes.position;

  for (
    let i = 0;
    i < skirtPositions.count;
    i++
  ) {
    const x = skirtPositions.getX(i);
    const y = skirtPositions.getY(i);
    const z = skirtPositions.getZ(i);

    const angle = Math.atan2(x, z);
    const fall = (.12 - y) / .24;

    const fold =
      1 +
      .035 * Math.cos(angle * 8) * fall;

    skirtPositions.setXYZ(
      i,
      x * fold,
      y + .012 * Math.cos(angle * 7) * fall,
      z * fold
    );
  }

  skirtPositions.needsUpdate = true;

  skirtGeometry.computeVertexNormals();
  skirtGeometry.computeBoundingBox();
  skirtGeometry.computeBoundingSphere();

  part(
    body,
    skirtGeometry,
    COLORS.forest,
    0, .76, 0,
    'clothDouble'
  );

  ring(
    body,
    .35,
    .012,
    COLORS.darkOlive,
    0, .645, 0,
    'cloth',
    {
      rotation: [Math.PI / 2, 0, 0],
      segments: 32,
    }
  );

  // ========================================
  // COLETE DE COURO
  // ========================================

  // Os pain?is laterais terminam antes das costas, onde a capa se apoia.
  [Math.PI * .29, Math.PI * 1.5].forEach(start => {
    tube(
      body,
      .385, .345, .62,
      COLORS.leather,
      0, 1.17, 0,
      'leather',
      {
        segments: 6,
        open: true,
        start,
        length: Math.PI * .21,
      }
    );
  });

  [-1, 1].forEach(s => {
    // Tiras frontais.

    panel(
      body,
      .075, .6, .05,
      COLORS.leather,
      s * .17, 1.18, .3,
      'leather',
      {
        rotation: [0, 0, s * .07],
      }
    );

    // Costuras laterais.

    panel(
      body,
      .012, .54, .012,
      COLORS.lightLeather,
      s * .225, 1.18, .3,
      'leather'
    );

    for (let i = 0; i < 8; i++) {
      panel(
        body,
        .023, .008, .009,
        COLORS.linen,
        s * .225,
        .94 + i * .065,
        .31,
        'cloth',
        {
          castShadow: false,
          rotation: [0, 0, s * .25],
        }
      );
    }

    // Fivelas.

    ring(
      body,
      .026,
      .008,
      COLORS.bronze,
      s * .17, 1.27, .34,
      'metal',
      {
        segments: 12,
      }
    );
  });

  // Fechamentos horizontais.

  [1.35, 1.16, .99].forEach(y => {
    panel(
      body,
      .25, .042, .025,
      COLORS.darkLeather,
      0, y, .365,
      'leather'
    );

    ring(
      body,
      .025,
      .007,
      COLORS.bronze,
      .06, y, .385,
      'metal',
      {
        segments: 12,
      }
    );
  });

  // ========================================
  // OMBROS
  // ========================================

  [-1, 1].forEach(s => {
    // Preenchimento dos ombros.

    bead(
      body,
      .17,
      COLORS.olive,
      s * .32, 1.45, 0,
      'cloth',
      {
        segments: 20,
        rings: 14,
        scale: [1.15, .9, 1],
      }
    );

    // Ombreiras de couro.

    bead(
      body,
      .18,
      COLORS.leather,
      s * .395, 1.5, 0,
      'leather',
      {
        segments: 20,
        rings: 12,
        scale: [1, .55, 1.08],
        thetaLength: Math.PI * .55,
      }
    );

    // Rebites.

    [-.06, .06].forEach(z => {
      bead(
        body,
        .015,
        COLORS.bronze,
        s * .42, 1.54, z,
        'metal',
        {
          segments: 8,
          rings: 6,
        }
      );
    });
  });

  // Gola de tecido.

  ring(
    body,
    .25,
    .025,
    COLORS.linen,
    0, 1.55, 0,
    'cloth',
    {
      rotation: [Math.PI / 2, 0, 0],
    }
  );

  // Broche frontal da capa.

  ring(
    body,
    .065,
    .014,
    COLORS.bronze,
    0, 1.53, .38,
    'metal',
    {
      segments: 20,
    }
  );

  bead(
    body,
    .035,
    COLORS.forest,
    0, 1.53, .39,
    'cloth',
    {
      segments: 12,
      rings: 8,
    }
  );

  // ========================================
  // BRAÇOS COMPLETOS
  // ========================================

  const buildArm = arm => {
    // Articulação visual do ombro.

    bead(
      arm,
      .135,
      COLORS.forest,
      0, -.025, 0,
      'cloth',
      {
        segments: 18,
        rings: 12,
        scale: [1, 1.05, 1],
      }
    );

    // Manga superior verde.

    tube(
      arm,
      .135, .112, .30,
      COLORS.olive,
      0, -.15, 0,
      'cloth',
      {
        segments: 18,
      }
    );

    // Manga inferior de linho.

    tube(
      arm,
      .113, .102, .27,
      COLORS.linen,
      0, -.365, 0,
      'cloth',
      {
        segments: 18,
      }
    );

    // Preenchimento do cotovelo.

    bead(
      arm,
      .113,
      COLORS.linen,
      0, -.29, 0,
      'cloth',
      {
        segments: 16,
        rings: 12,
        scale: [1, .85, 1],
      }
    );

    // Braçadeira de couro.

    tube(
      arm,
      .116, .108, .25,
      COLORS.leather,
      0, -.425, 0,
      'leather',
      {
        segments: 18,
      }
    );

    // Tiras da braçadeira.

    [-.32, -.53].forEach(y => {
      tube(
        arm,
        .12, .12, .025,
        COLORS.lightLeather,
        0, y, 0,
        'leather',
        {
          segments: 18,
        }
      );
    });

    // Costura frontal.

    panel(
      arm,
      .018, .19, .012,
      COLORS.darkLeather,
      0, -.425, .115,
      'leather'
    );

    // Rebites.

    [-1, 1].forEach(s => {
      bead(
        arm,
        .014,
        COLORS.bronze,
        s * .07, -.42, .095,
        'metal',
        {
          segments: 8,
          rings: 6,
        }
      );
    });

    // Punho.

    tube(
      arm,
      .092, .087, .10,
      COLORS.leather,
      0, -.545, .012,
      'leather',
      {
        segments: 16,
      }
    );

    // Mão.
    // Posição original preservada.

    bead(
      arm,
      .095,
      COLORS.leather,
      0, -.59, .03,
      'leather',
      {
        segments: 18,
        rings: 12,
        scale: [1, .9, .85],
      }
    );

    // Reforço da luva.

    bead(
      arm,
      .073,
      COLORS.darkLeather,
      0, -.58, .075,
      'leather',
      {
        scale: [1, .7, .35],
      }
    );

    // Ombreira articulada.

    bead(
      arm,
      .15,
      COLORS.leather,
      0, -.015, 0,
      'leather',
      {
        segments: 20,
        rings: 12,
        scale: [1.05, .65, 1.05],
        thetaLength: Math.PI * .65,
      }
    );
  };

  // Mapeamento corrigido dos braços.

  LIMB_INDEX.arms.forEach(index => {
    buildArm(limbs[index]);
  });

  // ========================================
  // QUADRIL
  // ========================================

  bead(
    body,
    .32,
    COLORS.dark,
    0, .73, 0,
    'cloth',
    {
      segments: 24,
      rings: 16,
      scale: [1, .48, .85],
    }
  );

  // ========================================
  // PERNAS COMPLETAS
  // ========================================

  const buildLeg = leg => {
    // Articulação visual do quadril.

    bead(
      leg,
      .15,
      COLORS.dark,
      0, -.035, 0,
      'cloth',
      {
        segments: 18,
        rings: 12,
        scale: [1, 1.1, 1],
      }
    );

    // Coxa.

    tube(
      leg,
      .15, .125, .34,
      COLORS.dark,
      0, -.18, 0,
      'cloth',
      {
        segments: 18,
      }
    );

    // Reforço de tecido.

    bead(
      leg,
      .13,
      COLORS.darkOlive,
      0, -.17, -.025,
      'cloth',
      {
        segments: 16,
        rings: 12,
        scale: [.95, 1.25, .8],
      }
    );

    // Joelho.

    bead(
      leg,
      .125,
      COLORS.dark,
      0, -.35, 0,
      'cloth',
      {
        segments: 18,
        rings: 12,
        scale: [1, .95, 1],
      }
    );

    // Parte inferior da perna.

    tube(
      leg,
      .125, .105, .30,
      COLORS.dark,
      0, -.47, 0,
      'cloth',
      {
        segments: 18,
      }
    );

    // Joelheira de couro.

    bead(
      leg,
      .12,
      COLORS.leather,
      0, -.37, .065,
      'leather',
      {
        segments: 18,
        rings: 12,
        scale: [1.05, .85, .6],
      }
    );

    // Rebites da joelheira.

    [-.045, .045].forEach(x => {
      bead(
        leg,
        .012,
        COLORS.bronze,
        x, -.37, .13,
        'metal',
        {
          segments: 8,
          rings: 6,
        }
      );
    });

    // ======================================
    // BOTAS MEDIEVAIS
    // ======================================

    // Cano alto.

    tube(
      leg,
      .135, .128, .30,
      COLORS.leather,
      0, -.535, 0,
      'leather',
      {
        segments: 20,
      }
    );

    // Borda superior.

    tube(
      leg,
      .146, .14, .055,
      COLORS.lightLeather,
      0, -.39, 0,
      'leather',
      {
        segments: 20,
      }
    );

    // Tiras de couro.

    [-.46, -.58].forEach(y => {
      tube(
        leg,
        .14, .14, .028,
        COLORS.darkLeather,
        0, y, 0,
        'leather',
        {
          segments: 18,
        }
      );
    });

    // Fivela.

    panel(
      leg,
      .065, .055, .025,
      COLORS.bronze,
      0, -.46, .145,
      'metal'
    );

    panel(
      leg,
      .037, .027, .028,
      COLORS.darkLeather,
      0, -.46, .157,
      'leather'
    );

    // Tornozelo.

    bead(
      leg,
      .13,
      COLORS.leather,
      0, -.635, .025,
      'leather',
      {
        segments: 18,
        rings: 12,
        scale: [1, .8, 1],
      }
    );

    // Corpo arredondado da bota.

    bead(
      leg,
      .21,
      COLORS.leather,
      0, -.68, .1,
      'leather',
      {
        segments: 24,
        rings: 16,
        scale: [.66, .38, 1],
      }
    );

    // Biqueira reforçada.

    bead(
      leg,
      .12,
      '#62432E',
      0, -.69, .24,
      'leather',
      {
        segments: 18,
        rings: 12,
        scale: [1.08, .48, .58],
      }
    );

  };

  // Mapeamento corrigido das pernas.

  LIMB_INDEX.legs.forEach(index => {
    buildLeg(limbs[index]);
  });

  // ========================================
  // CINTO PRINCIPAL
  // ========================================

  tube(
    body,
    .35, .35, .12,
    COLORS.leather,
    0, .87, 0,
    'leather',
    {
      segments: 24,
    }
  );

  // Bordas do cinto.

  [.81, .93].forEach(y => {
    tube(
      body,
      .356, .356, .018,
      COLORS.darkLeather,
      0, y, 0,
      'leather',
      {
        segments: 24,
      }
    );
  });

  // Fivela principal.

  panel(
    body,
    .14, .12, .04,
    COLORS.bronze,
    0, .87, .355,
    'metal'
  );

  panel(
    body,
    .08, .07, .045,
    COLORS.darkLeather,
    0, .87, .38,
    'leather'
  );

  panel(
    body,
    .085, .012, .015,
    COLORS.bronze,
    0, .87, .41,
    'metal'
  );

  // ========================================
  // BOLSAS LATERAIS
  // Apenas nas laterais do cinto.
  // Nenhum acessório nas costas.
  // ========================================

  [-1, 1].forEach(s => {
    bead(
      body,
      .105,
      COLORS.leather,
      s * .34, .79, .02,
      'leather',
      {
        segments: 18,
        rings: 12,
        scale: [.75, 1, .65],
        rotation: [0, 0, s * .08],
      }
    );

    panel(
      body,
      .15, .06, .13,
      COLORS.darkLeather,
      s * .34, .85, .02,
      'leather'
    );

    bead(
      body,
      .016,
      COLORS.bronze,
      s * .36, .83, .09,
      'metal',
      {
        segments: 8,
        rings: 6,
      }
    );
  });

  // ========================================
  // TALABARTE DIAGONAL FRONTAL
  // ========================================

  panel(
    body,
    .07, .9, .035,
    COLORS.leather,
    -.02, 1.18, .39,
    'leather',
    {
      rotation: [0, 0, -.55],
    }
  );

  [1.45, 1.2, .95].forEach(y => {
    bead(
      body,
      .015,
      COLORS.bronze,
      -.02 + .61 * (y - 1.18),
      y,
      .415,
      'metal',
      {
        segments: 8,
        rings: 6,
      }
    );
  });

  // ========================================
  // NOVA CAPA MEDIEVAL
  // Tecido contínuo com dobras naturais.
  // Sem objetos marrons nas costas.
  // ========================================

  const cape = new THREE.Group();

  // O tecido gira a partir da costura nos ombros.
  cape.position.set(0, 1.49, -.345);
  cape.rotation.x = .08;

  body.add(cape);

  // Material exclusivo da capa.

  const capeMaterial =
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      vertexColors: true,
      roughness: .97,
      metalness: 0,
      side: THREE.DoubleSide,
      emissive: '#263820',
      emissiveIntensity: .025,
    });

  // ========================================
  // TECIDO PRINCIPAL DA CAPA
  // ========================================

  const capeGeometry = createCapeGeometry(
    1.02,
    .94,
    48,
    32
  );

  const capeMesh = new THREE.Mesh(
    capeGeometry,
    capeMaterial
  );

  capeMesh.name = 'Tecido principal da capa';

  capeMesh.position.set(
    0,
    -.47,
    0
  );

  capeMesh.castShadow = true;
  capeMesh.receiveShadow = true;

  cape.add(capeMesh);

  // ========================================
  // MANTO SUPERIOR DOS OMBROS
  // Segunda camada de tecido verde.
  // ========================================

  const mantleGeometry = createCapeGeometry(
    1.08,
    .30,
    40,
    14
  );

  const mantle = new THREE.Mesh(
    mantleGeometry,
    capeMaterial
  );

  mantle.name = 'Manto superior da capa';

  mantle.position.set(
    0,
    -.12,
    -.015
  );

  mantle.castShadow = true;
  mantle.receiveShadow = true;

  cape.add(mantle);

  // ========================================
  // RETORNO ORIGINAL
  // Necessário para as animações existentes.
  // ========================================

  return cape;
}
