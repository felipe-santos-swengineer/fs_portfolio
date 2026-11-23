export const LAKE_PORTAL_Z = 34;
export const nearLakePortal = (position, portal = {x:0,z:LAKE_PORTAL_Z}) => Math.hypot(position.x-portal.x, position.z-portal.z) < 3.6;
export const touchingLakePortal = (position, portal = {x:0,z:LAKE_PORTAL_Z}) => Math.hypot(position.x-portal.x, position.z-portal.z) <= 2.1;
