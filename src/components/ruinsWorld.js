export const SHRINES=[{x:-17,z:5},{x:16,z:-6},{x:-14,z:-20}];
export const SHIPWRECK={x:-7,z:23};
export const COLUMNS=[[-27,-10],[25,8],[25,-22],[-23,20],[7,15],[-4,-13]];

// The visual shoreline and navigation collision use the same irregular polygon.
export const SHORE_POINTS=56;
export const BOAT_SHORE_CLEARANCE=3.1;
export function shorePoint(i) {
  const a=i*Math.PI*2/SHORE_POINTS, radius=37.8+Math.sin(a*5)*1.3+Math.cos(a*9)*.55;
  return {x:Math.sin(a)*radius,z:Math.cos(a)*radius,height:5.3+(1+Math.sin(a*4+.6))*1.15+(1+Math.cos(a*7))*.35};
}
const shore=Array.from({length:SHORE_POINTS},(_,i)=>shorePoint(i));
export function insideRuinsShore(x,z,clearance=BOAT_SHORE_CLEARANCE) {
  let inside=false;
  for(let i=0,j=shore.length-1;i<shore.length;j=i++) {
    const a=shore[j],b=shore[i],dx=b.x-a.x,dz=b.z-a.z;
    const lengthSquared=dx*dx+dz*dz;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/lengthSquared));
    if(Math.hypot(x-(a.x+t*dx),z-(a.z+t*dz))<clearance)return false;
    if((a.z>z)!==(b.z>z) && x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }
  return inside;
}

export function ruinsObstacle(x,z) {
  if (!insideRuinsShore(x,z)) return 'stone';
  if (SHRINES.some(p=>Math.hypot(x-p.x,z-p.z)<4.5)) return 'stone';
  if (Math.hypot(x-SHIPWRECK.x,z-SHIPWRECK.z)<4.8) return 'wood';
  if (COLUMNS.some(([cx,cz])=>Math.hypot(x-cx,z-cz)<2.6)) return 'stone';
  if (z < -27 && (Math.abs(x)>3.3 || z < -28)) return 'stone';
  return null;
}
export function nearTempleEntrance(position, activated) {
  return activated.length===SHRINES.length && activated.every(Boolean) && Math.abs(position.x)<4.5 && position.z < -22 && position.z > -29;
}
