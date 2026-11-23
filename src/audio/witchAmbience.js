export function nextWitchLaugh(previous, random=Math.random) {
  if (previous<0 || previous>3) return Math.min(3, Math.floor(random()*4));
  const pick=Math.min(2, Math.floor(random()*3));
  return pick>=previous ? pick+1 : pick;
}
