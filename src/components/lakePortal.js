export const LAKE_PORTAL_Z = 34;
export const nearLakePortal = position => Math.hypot(position.x, position.z - LAKE_PORTAL_Z) < 3.6;
export const touchingLakePortal = position => Math.hypot(position.x, position.z - LAKE_PORTAL_Z) <= 2.1;
