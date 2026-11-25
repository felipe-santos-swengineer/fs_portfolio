export function poseAdventurerStride(limbs, time, moving, reducedMotion) {
  const stride = moving && !reducedMotion ? Math.sin(time * 9) : 0;
  limbs.forEach((limb, index) => {
    limb.rotation.x = stride * (index % 2 === 0 ? .5 : -.45) * (index < 2 ? 1 : -1);
  });
}

export function poseAdventurerSword(sword, remaining, reducedMotion) {
  const progress = 1 - remaining / .45;
  sword.rotation.x = remaining > 0 && !reducedMotion
    ? .15 + 1.45 * Math.sin(progress * Math.PI)
    : .15;
}
