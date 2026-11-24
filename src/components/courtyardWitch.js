import * as THREE from 'three';
import line1 from '../assets/audio/witch-dialogue/pt-BR/line-1.mp3';
import line2 from '../assets/audio/witch-dialogue/pt-BR/line-2.mp3';
import line3 from '../assets/audio/witch-dialogue/pt-BR/line-3.mp3';
import line4 from '../assets/audio/witch-dialogue/pt-BR/line-4.mp3';
import line5 from '../assets/audio/witch-dialogue/pt-BR/line-5.mp3';
import enLine1 from '../assets/audio/witch-dialogue/en-US/line-1.mp3';
import enLine2 from '../assets/audio/witch-dialogue/en-US/line-2.mp3';
import enLine3 from '../assets/audio/witch-dialogue/en-US/line-3.mp3';
import enLine4 from '../assets/audio/witch-dialogue/en-US/line-4.mp3';
import enLine5 from '../assets/audio/witch-dialogue/en-US/line-5.mp3';

export const WITCH_LAUGH_AT = 2;
export const WITCH_FLIGHT_END = 4.4;
export const WITCH_DIALOGUE_AT = 6;
const WITCH_LINE_SECONDS = 5.2;
export const witchDialogue = {
  'pt-BR': [
    'Sua jornada chegou ao fim, viajante.',
    'Eu ouvi seus passos do outro lado da pedra.',
    'Achou mesmo que o corredor era a pior parte?',
    'Escute a chuva. Ela vai abafar seus gritos.',
    'Eu mesma porei um fim em você.',
  ],
  'en-US': [
    'Your journey ends here, traveler.',
    'I heard your footsteps through the stone.',
    'Did you really think the corridor was the worst of it?',
    'Listen to the rain. It’ll drown out your screams.',
    'I’ll put an end to you myself.',
  ],
};
const voiceTracks = {
  'pt-BR': [line1, line2, line3, line4, line5],
  'en-US': [enLine1, enLine2, enLine3, enLine4, enLine5],
};
export const witchVoices = Object.fromEntries(Object.entries(voiceTracks).map(([locale, tracks]) => [
  locale, { clips: tracks.map((src, index) => ({ src, text: witchDialogue[locale][index] })) },
]));
export const WITCH_SCENE_END = WITCH_DIALOGUE_AT + witchDialogue['pt-BR'].length * WITCH_LINE_SECONDS;

export function witchLineAt(time) {
  if (time < WITCH_LAUGH_AT || time >= WITCH_SCENE_END) return -1;
  if (time < WITCH_DIALOGUE_AT) return -2;
  return Math.floor((time - WITCH_DIALOGUE_AT) / WITCH_LINE_SECONDS);
}

export function createCourtyardWitch(scene, { mesh, sphere, cylinder }) {
  const root = new THREE.Group();
  root.visible = false;
  scene.add(root);
  const robe = '#272033', trim = '#574064', skin = '#87976b', wood = '#67452d';
  const broom = cylinder(root, .075, 3.65, wood, 0, .06, -.35);
  broom.rotation.x = Math.PI / 2;
  const bristles = mesh(root, new THREE.CylinderGeometry(.15, .47, 1.06, 10), '#96774f', 0, .06, -1.9);
  bristles.rotation.x = Math.PI / 2;
  const binding = cylinder(root, .22, .17, '#c7a771', 0, .06, -1.57);
  binding.rotation.x = Math.PI / 2;
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    const straw = mesh(root, new THREE.ConeGeometry(.085, .63, 5), i % 2 ? '#ac8d64' : '#786044',
      Math.sin(angle) * .34, .06 + Math.cos(angle) * .34, -2.38);
    straw.rotation.x = -Math.PI / 2;
  }

  const body = mesh(root, new THREE.CylinderGeometry(.31, .58, 1.03, 9), robe, 0, .64, -.18);
  body.rotation.x = -.25;
  const cloak = mesh(root, new THREE.ConeGeometry(.68, 1.52, 8), trim, 0, .6, -.72);
  cloak.rotation.x = .9;
  const sleeveAxis = new THREE.Vector3(0, 1, 0);
  let castingArm, castingHand, castingShoulder, broomGrip, sleeveLength;
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Vector3(side * .27, .99, .07);
    const grip = new THREE.Vector3(side * .05, broom.position.y + .082, side < 0 ? .65 : .94);
    const sleeve = grip.clone().sub(shoulder);
    const midpoint = shoulder.clone().lerp(grip, .47);
    const arm = cylinder(root, .12, sleeve.length() * .92, robe, midpoint.x, midpoint.y, midpoint.z);
    arm.quaternion.setFromUnitVectors(sleeveAxis, sleeve.normalize());
    const hand = sphere(root, .13, skin, grip.x, grip.y, grip.z);
    hand.scale.set(.91, 1, 1.16);
    if (side === 1) {
      castingArm = arm;
      castingHand = hand;
      castingShoulder = shoulder;
      broomGrip = grip;
      sleeveLength = grip.distanceTo(shoulder);
    }
    const boot = sphere(root, .21, '#221c27', side * .38, -.14, -.21);
    boot.scale.set(.66, 1.4, 1.28);
  }

  const head = new THREE.Group();
  head.position.set(0, 1.38, .13);
  root.add(head);
  sphere(head, .39, '#4e4b54', 0, .01, -.09).scale.set(1.14, 1.18, .96);
  sphere(head, .31, skin, 0, 0, .085).scale.set(.94, 1.16, .9);
  sphere(head, .10, skin, 0, -.025, .34).scale.set(.8, 1.2, 1.75);
  sphere(head, .052, '#627348', .045, -.062, .47);
  for (const side of [-1, 1]) {
    const eye = sphere(head, .074, '#221a23', side * .13, .082, .329);
    eye.scale.set(1.3, .69, .52);
    sphere(head, .042, '#f0bc57', side * .13, .083, .37);
    const brow = cylinder(head, .027, .17, '#332734', side * .13, .143, .35);
    brow.rotation.z = side * -1.19;
    sphere(head, .11, '#55525a', side * .31, -.18, .03).scale.set(.65, 2.4, 1.15);
  }
  const mouth = sphere(head, .103, '#281822', 0, -.16, .323);
  mouth.scale.set(1.38, .36, .43);
  sphere(head, .034, '#ddc69a', .046, -.149, .359).scale.set(.7, .85, .5);
  const hat = cylinder(head, .66, .07, robe, 0, .32, 0);
  hat.rotation.z = -.12;
  const crown = mesh(head, new THREE.ConeGeometry(.39, .78, 10), robe, -.12, .68, 0);
  crown.rotation.z = .32;
  cylinder(head, .34, .11, trim, -.014, .43, 0).rotation.z = .18;

  const flask = new THREE.Group();
  const flaskBody = sphere(flask, .23, '#335945', 0, 0, 0);
  flaskBody.scale.y = 1.2;
  sphere(flask, .148, '#7dff28', 0, -.045, .137).scale.set(1, .75, .5);
  cylinder(flask, .082, .19, '#5aa953', 0, .245, 0);
  cylinder(flask, .105, .045, '#9ae957', 0, .35, 0);
  const spout = new THREE.Object3D();
  spout.position.y = .38;
  flask.add(spout);
  flask.visible = false;
  root.add(flask);

  const raise = new THREE.Vector3(.66, 1.63, .51);
  const throwDown = new THREE.Vector3(.54, .37, 1.08);
  const pouring = new THREE.Vector3(.77, .78, .56);
  const armDirection = new THREE.Vector3();
  function poseAttack(cast, pour) {
    const hand = castingHand.position;
    hand.copy(broomGrip);
    if (pour > 0) hand.lerp(pouring, pour);
    if (cast > 0 && cast < 1) {
      if (cast < .45) hand.lerp(raise, cast / .45);
      else if (cast < .72) hand.lerpVectors(raise, throwDown, (cast - .45) / .27);
      else hand.lerpVectors(throwDown, broomGrip, (cast - .72) / .28);
    }
    castingArm.position.copy(castingShoulder).lerp(hand, .47);
    armDirection.subVectors(hand, castingShoulder);
    castingArm.scale.y = armDirection.length() / sleeveLength;
    castingArm.quaternion.setFromUnitVectors(sleeveAxis, armDirection.normalize());
    flask.visible = pour > 0;
    flask.position.copy(hand).addScaledVector(sleeveAxis, .12);
    flask.rotation.z = -pour * 2.55;
  }

  return { root, head, mouth, cloak, poseAttack, castingHand, spout };
}
