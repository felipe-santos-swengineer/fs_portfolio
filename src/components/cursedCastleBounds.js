export const CURSED_CASTLE_BOUNDS = Object.freeze({ minX:-37, maxX:37, minZ:-15, maxZ:35 });

export function insideCursedCastleBounds(x, z) {
  const b=CURSED_CASTLE_BOUNDS;
  return x>b.minX && x<b.maxX && z>b.minZ && z<b.maxZ;
}

// Backdrop covers the whole playable area, including the castle facade.
export const CURSED_CASTLE_BACKDROP = Object.freeze({ minX:-38, maxX:38, minZ:-30, maxZ:40 });
export function insideCursedCastleBackdrop(x, z, margin=0) {
  const b=CURSED_CASTLE_BACKDROP;
  return x-margin>=b.minX && x+margin<=b.maxX && z-margin>=b.minZ && z+margin<=b.maxZ;
}
