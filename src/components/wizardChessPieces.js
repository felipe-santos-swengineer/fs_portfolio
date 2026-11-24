import * as THREE from 'three';
import { addFaceDetails } from './addFaceDetails';

const standby = {
  k: { rate: 1.5, rise: .017, sway: .045 },
  q: { rate: 2, rise: .022, sway: .06 },
  b: { rate: 1.2, rise: .016, sway: .065 },
  n: { rate: 3, rise: .031, sway: .085 },
  r: { rate: 1.1, rise: .009, sway: .045 },
  p: { rate: 2.4, rise: .017, sway: .07 },
};

export function createWizardPiece(piece, { box, cylinder, sphere, mesh }) {
  const root = new THREE.Group();
  const zombie = piece.color === 'b';
  const skin = zombie ? '#88a577' : '#dcb58e';
  const cloth = zombie ? '#4c3857' : '#345e80';
  const trim = zombie ? '#895f51' : '#f5cf79';
  const armor = zombie ? '#4b5a53' : '#a9c1cf';
  const dark = zombie ? '#253428' : '#3b281e';
  const eye = zombie ? '#ecfba1' : '#263141';
  const kind = piece.type;
  cylinder(root, .225, .07, zombie ? '#433347' : '#caa166', 0, .04, 0, 12);

  const figure = new THREE.Group();
  root.add(figure);
  root.userData.figure = figure;
  const { rate, rise, sway } = standby[kind];
  const lean = zombie ? .12 : 0;
  root.userData.pose = (time, selected, reduced) => {
    const pulse = reduced ? 0 : Math.sin(time * rate * (zombie ? .8 : 1));
    const emphasis = selected ? 1.8 : 1;
    figure.position.y = pulse * rise * emphasis;
    figure.rotation.x = pulse * sway * emphasis;
    figure.rotation.z = lean + pulse * sway * (zombie ? .8 : .3);
  };
  root.userData.pose(0, false, true);
  if (kind === 'n') {
    // The mounted knight has a long muzzle, ears, mane and a rider.
    box(figure, .23, .17, .39, dark, 0, .29, 0);
    for (const x of [-.08, .08]) for (const z of [-.13, .13]) {
      box(figure, .055, .22, .06, dark, x, .18, z);
    }
    box(figure, .13, .24, .14, dark, 0, .42, .15).rotation.x = .27;
    box(figure, .14, .13, .19, zombie ? skin : dark, 0, .51, .21);
    for (const x of [-.052, .052]) {
      box(figure, .035, .09, .045, dark, x, .6, .15);
      box(figure, .018, .032, .025, eye, x * 1.4, .535, .244);
    }
    cylinder(figure, .11, .25, armor, 0, .54, -.06);
    const riderHead = new THREE.Group();
    riderHead.position.set(0, .755, -.06);
    riderHead.scale.setScalar(.4);
    figure.add(riderHead);
    sphere(riderHead, .28, skin, 0, 0, 0);
    addFaceDetails(riderHead, { box, sphere }, {
      headY: 0, skin, brow: dark, mouthDepth: .264, eyes: !zombie,
    });
    if (zombie) {
      for (const x of [-.1, .1]) sphere(riderHead, .04, eye, x, .042, .27);
      box(riderHead, .028, .097, .026, '#546b52', -.153, -.079, .228).rotation.z = -.28;
    }
    box(riderHead, .51, .13, .47, armor, 0, .235, -.045);
    box(riderHead, .44, .13, .39, cloth, 0, .335, -.068);
    box(figure, .034, .36, .035, trim, -.16, .64, .02).rotation.z = -.2;
    return root;
  }

  if (kind === 'r') {
    // A tower guard is framed by a crenellated stone battlement.
    const stone = zombie ? '#657667' : '#ab9d86';
    cylinder(figure, .185, .41, stone, 0, .275, 0);
    box(figure, .39, .12, .35, armor, 0, .49, 0);
    for (const x of [-.15, .15]) for (const z of [-.13, .13]) {
      box(figure, .08, .11, .08, stone, x, .59, z);
    }
    box(figure, .145, .22, .025, cloth, 0, .34, .184);
    box(figure, .04, .16, .035, trim, 0, .36, .201);
    sphere(figure, .095, skin, 0, .64, .028);
    box(figure, .19, .065, .17, armor, 0, .72, .02);
    for (const x of [-.04, .04]) box(figure, .029, .024, .019, eye, x, .655, .116);
    return root;
  }

  const pawn = kind === 'p';
  const royal = kind === 'k' || kind === 'q';
  const shoulder = pawn ? .35 : .46;
  const head = shoulder + .18;
  const garment = kind === 'q' ? (zombie ? '#754059' : '#9a4265')
    : kind === 'b' ? (zombie ? '#736b49' : '#e5ddc2') : cloth;
  for (const x of [-.065, .065]) box(figure, .09, .17, .12, dark, x, .155, 0);
  mesh(figure, new THREE.CylinderGeometry(.115, royal || kind === 'b' ? .175 : .108, shoulder - .16, 8),
    garment, 0, (shoulder + .16) / 2, 0);
  box(figure, .225, .08, .145, pawn ? armor : garment, 0, shoulder, 0);
  for (const x of [-.145, .145]) {
    box(figure, .07, .19, .085, garment, x, shoulder - .05, zombie ? .04 : 0).rotation.x = zombie ? -.7 : 0;
    box(figure, .067, .067, .07, skin, x, shoulder - .141, zombie ? .103 : 0);
  }
  if (royal) box(figure, .265, .26, .045, garment, 0, shoulder - .1, -.09).rotation.x = -.18;
  sphere(figure, .109, skin, 0, head, 0);
  for (const x of [-.041, .041]) box(figure, .028, .024, .02, eye, x, head + .019, .1);
  box(figure, zombie ? .071 : .047, .022, .018, dark, 0, head - .04, .097);
  if (zombie) {
    box(figure, .035, .052, .018, '#516e58', -.061, head - .04, .081).rotation.z = -.4;
    box(figure, .077, .035, .025, '#665349', .057, shoulder - .101, .101).rotation.z = -.5;
  }
  if (royal) {
    cylinder(figure, .12, .052, trim, 0, head + .082, 0);
    for (let point = 0; point < 5; point++) {
      const angle = point * Math.PI * 2 / 5;
      mesh(figure, new THREE.ConeGeometry(.038, kind === 'q' ? .112 : .074, 4), trim,
        Math.sin(angle) * .098, head + .149, Math.cos(angle) * .098);
    }
    if (kind === 'k') {
      box(figure, .037, .144, .038, trim, 0, head + .165, 0);
      box(figure, .106, .034, .038, trim, 0, head + .181, 0);
      box(figure, .039, .44, .045, trim, -.163, .405, .087).rotation.z = -.15;
    }
  } else if (kind === 'b') {
    mesh(figure, new THREE.ConeGeometry(.111, .21, 6), garment, 0, head + .165, 0);
    box(figure, .024, .14, .03, trim, 0, head + .114, .078);
    box(figure, .034, .5, .034, trim, -.169, .425, .08);
    mesh(figure, new THREE.TorusGeometry(.056, .015, 6, 14), trim, -.169, .701, .08);
  } else {
    sphere(figure, .114, armor, 0, head + .05, -.018).scale.y = .72;
    box(figure, .118, .135, .055, cloth, .155, .3, .093);
    const sword = new THREE.Group();
    sword.position.set(-.164, .24, .09);
    figure.add(sword);
    box(sword, .034, .32, .04, armor, 0, .15, 0);
    box(sword, .104, .026, .053, trim, 0, .032, 0);
    box(sword, .044, .079, .042, dark, 0, -.021, 0);
    sword.rotation.z = -.12;
    root.userData.sword = sword;
  }
  return root;
}
