// Keep the moored hull clear of the dock even when the boat turns.
export const BOAT_MOORING = { x: 0, z: 9.5 };
export const BOARDING_DISTANCE = 3.2;

// Dock bounds match the 4 by 9 platform in the lake scene.
const DOCK = { minX: -2, maxX: 2, minZ: 13, maxZ: 22 };
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Test the boat's rotated footprint against the dock using separating axes.
export function dockLanding(x, z, heading) {
  const centerX = (DOCK.minX + DOCK.maxX) / 2;
  const centerZ = (DOCK.minZ + DOCK.maxZ) / 2;
  const dx = x - centerX, dz = z - centerZ;
  const cos = Math.cos(heading), sin = Math.sin(heading);
  const boatWidth = 1.8, boatLength = 2.97, dockWidth = 2, dockLength = 4.5;
  const axes = [[1, 0], [0, 1], [cos, -sin], [sin, cos]];
  for (const [ax, az] of axes) {
    const distance = Math.abs(dx * ax + dz * az);
    const dockRadius = dockWidth * Math.abs(ax) + dockLength * Math.abs(az);
    const boatRadius = boatWidth * Math.abs(ax * cos - az * sin) + boatLength * Math.abs(ax * sin + az * cos);
    if (distance > dockRadius + boatRadius) return null;
  }
  return { x: clamp(x, -1.25, 1.25), z: clamp(z, 14.5, 20.4) };
}
