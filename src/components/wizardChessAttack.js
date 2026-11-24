import * as THREE from 'three';

const attackStyles = {
  p: { color: '#ffe5a6', duration: .72, impact: .53 },
  n: { color: '#e4be87', duration: .9, impact: .56 },
  r: { color: '#e6c59a', duration: 1.16, impact: .68 },
  b: { color: '#c899ff', duration: 1.05, impact: .57 },
  q: { color: '#ff80b3', duration: 1.02, impact: .64 },
  k: { color: '#ffe287', duration: .93, impact: .55 },
};

function heartGeometry() {
  const heart = new THREE.Shape();
  heart.moveTo(0, -.15);
  heart.bezierCurveTo(-.32, .06, -.13, .25, 0, .11);
  heart.bezierCurveTo(.13, .25, .32, .06, 0, -.15);
  return new THREE.ShapeGeometry(heart);
}

export function createWizardChessAttack(board, { box }) {
  const effects = new THREE.Group();
  effects.visible = false;
  board.add(effects);
  const material = new THREE.MeshBasicMaterial({ color: '#fff', side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const arc = new THREE.Mesh(new THREE.RingGeometry(.28, .42, 24, 1, 0, Math.PI * 1.3), material);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.34, .022, 7, 28), material);
  const heart = new THREE.Mesh(heartGeometry(), material);
  const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(.115, 1), new THREE.MeshStandardMaterial({ color: '#867064' }));
  const chair = new THREE.Group();
  const launcher = new THREE.Group();
  const arm = new THREE.Group();
  const wood = '#996843';
  box(chair, .27, .055, .24, wood, 0, .09, 0);
  box(chair, .27, .24, .055, wood, 0, .19, -.1);
  for (const x of [-.1, .1]) {
    for (const z of [-.084, .084]) box(chair, .045, .18, .045, wood, x, 0, z);
    box(launcher, .07, .19, .36, wood, x, .07, 0);
  }
  arm.position.y = .17;
  launcher.add(arm);
  box(arm, .07, .065, .43, wood, 0, 0, .07);
  box(arm, .14, .075, .14, '#bfa07b', 0, 0, .266);
  effects.add(arc, ring, heart, stone, chair, launcher);
  const direction = new THREE.Vector3();
  const origin = new THREE.Vector3();
  const contact = new THREE.Vector3();
  const adjacent = new THREE.Vector3();
  const lerp = THREE.MathUtils.lerp;
  const smooth = THREE.MathUtils.smoothstep;
  let active = null;

  function finish() {
    if (!active) return;
    const { attacker, defender, baseYaw, defenderOrigin, defenderPitch, complete } = active;
    active = null;
    effects.visible = false;
    attacker.rotation.y = baseYaw;
    attacker.userData.figure.rotation.x = 0;
    if (attacker.userData.sword) attacker.userData.sword.rotation.set(0, 0, -.12);
    if (defender) {
      defender.position.copy(defenderOrigin);
      defender.rotation.x = defenderPitch;
    }
    complete();
  }

  return {
    start(move, attacker, defender, target, onImpact, complete) {
      const style = attackStyles[move.piece];
      if (!attacker || !style) { complete(); return; }
      origin.copy(attacker.position);
      contact.copy(defender?.position || target);
      direction.subVectors(contact, origin).setY(0).normalize();
      adjacent.copy(contact).addScaledVector(direction, -.32);
      active = { move, style, attacker, defender, baseYaw: attacker.rotation.y, defenderOrigin: defender?.position.clone(),
        defenderPitch: defender?.rotation.x, onImpact, complete, elapsed: 0, hit: false };
    },
    animate(dt, reduced) {
      if (!active || dt <= 0) return;
      const { move, style, attacker, defender, defenderOrigin } = active;
      active.elapsed += dt;
      const progress = reduced ? 1 : Math.min(active.elapsed / style.duration, 1);
      const { impact } = style;
      if (!active.hit && progress >= impact) {
        active.hit = true;
        active.onImpact(move.piece);
      }
      if (progress === 1) { finish(); return; }

      const kind = move.piece;
      const ranged = kind === 'r' || kind === 'q' || kind === 'b';
      const attackMotion = Math.sin(Math.PI * smooth(progress, .18, impact + .14));
      const close = smooth(progress, 0, impact - .14);
      attacker.position.lerpVectors(origin, adjacent, ranged ? 0 : close);
      if (kind === 'n') attacker.position.y += attackMotion * .21;
      const facing = Math.atan2(direction.x, direction.z);
      attacker.rotation.y = facing + (kind === 'n' ? Math.PI : 0);
      attacker.userData.figure.rotation.x = attackMotion * ({ n: .77, k: -.23, p: .28, r: 0, q: .19, b: -.28 }[kind]);
      const reaction = smooth(progress, impact, 1);
      if (defender && reaction > 0) {
        defender.position.copy(defenderOrigin).addScaledVector(direction, reaction * .22);
        defender.position.y += (kind === 'b' ? .58 : .18) * Math.sin(reaction * Math.PI) - .58 * reaction;
        defender.rotation.x = reaction * 1.25;
      }

      effects.visible = true;
      for (const effect of effects.children) effect.visible = false;
      material.color.set(style.color);
      material.opacity = 1 - reaction * .85;
      const flight = smooth(progress, .22, impact);
      if (kind === 'p') {
        const swing = smooth(progress, .22, impact + .08);
        attacker.userData.sword.rotation.set(-1.25 * attackMotion, 0,
          -.12 + lerp(-.85, 1.35, swing) * attackMotion);
        arc.visible = progress > .27;
        arc.position.copy(adjacent).addScaledVector(direction, .16);
        arc.position.y += .43;
        arc.rotation.set(-Math.PI / 2, 0, progress * Math.PI * 2);
      } else if (kind === 'n' || kind === 'b') {
        ring.visible = progress > .27;
        ring.position.copy(contact);
        ring.position.y += kind === 'b' ? .18 + flight * .52 : .18;
        ring.rotation.set(Math.PI / 2, 0, progress * Math.PI);
        ring.scale.setScalar(kind === 'b' ? 1 + reaction *.8 : .45 + reaction * .7);
      } else if (kind === 'q') {
        heart.visible = progress > .22;
        heart.position.lerpVectors(origin, contact, flight);
        heart.position.y += .42 + Math.sin(Math.PI * flight) * .27;
        heart.rotation.set(-.7, 0, Math.sin(progress * 10) * .2);
        heart.scale.setScalar(.7 + flight * .75);
      } else if (kind === 'r') {
        launcher.visible = true;
        launcher.position.copy(origin);
        launcher.position.y += .72;
        launcher.rotation.y = facing;
        arm.rotation.x = lerp(.74, -1.1, smooth(progress, .14, .35));
        stone.visible = progress > .22;
        stone.position.lerpVectors(origin, contact, flight);
        stone.position.y += lerp(.91, .29, flight) + Math.sin(Math.PI * flight) * .95;
        stone.rotation.set(flight * 8, flight * 5, 0);
      } else {
        chair.visible = true;
        chair.position.copy(attacker.position).addScaledVector(direction, .22);
        chair.position.y += .35 + attackMotion * .3;
        chair.rotation.set(0, facing, 0);
        chair.rotateZ(lerp(-1.05, 1.1, smooth(progress, .2, impact)));
      }
    },
  };
}
