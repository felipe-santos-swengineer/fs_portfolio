import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const suitRack = { x: 2.85, z: -30 };
export const SUIT_READY = 7;
export const SUIT_EQUIPPED = 8;

// Rigid sections are batched per joint. The four pivots use the adventurer's gait order.
export function createOmegaSuit() {
  const root = new T.Group(), limbs = [];
  const surface = (color, metalness, roughness) => new T.MeshStandardMaterial({ color, metalness, roughness });
  const ceramic = surface('#dce3e8', .38, .38), graphite = surface('#151b23', .12, .86);
  const metal = surface('#697580', .75, .35), rubber = surface('#080c12', .02, .92);
  const orange = surface('#ff8c32', .25, .55), visor = surface('#112432', .78, .15);
  const glow = new T.MeshStandardMaterial({ color:'#a5f5ff', emissive:'#00d9ff', emissiveIntensity:.8 });
  const batches = new Map();
  function part(parent, geometry, material, x,y,z, w=1,h=1,d=1, tilt=0) {
    geometry.scale(w,h,d); geometry.rotateZ(tilt); geometry.translate(x,y,z);
    if (!batches.has(parent)) batches.set(parent,new Map());
    const group=batches.get(parent);
    if (!group.has(material)) group.set(material,[]);
    group.get(material).push(geometry);
  }
  // Radius/height profiles make tapered shells with a bevel at each end.
  function shell(parent, profile, mat, x,y,z, depth=1, start=0, arc=Math.PI*2) {
    part(parent,new T.LatheGeometry(profile.map(([r,v])=>new T.Vector2(r,v)),20,start,arc),mat,x,y,z,1,1,depth);
  }
  function plate(parent, mat, x,y,z, w,h,d, tilt=0) {
    const shape=new T.Shape(), cut=Math.min(w,h)*.18;
    shape.moveTo(-w/2+cut,-h/2); shape.lineTo(w/2-cut,-h/2); shape.lineTo(w/2,-h/2+cut);
    shape.lineTo(w/2,h/2-cut); shape.lineTo(w/2-cut,h/2); shape.lineTo(-w/2+cut,h/2);
    shape.lineTo(-w/2,h/2-cut); shape.lineTo(-w/2,-h/2+cut); shape.closePath();
    const g=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:1});
    g.translate(0,0,-d/2); part(parent,g,mat,x,y,z,1,1,1,tilt);
  }
  shell(root,[[.16,-.29],[.22,-.22],[.23,-.07],[.32,.19],[.27,.28],[.15,.31]],graphite,0,1.18,0,.68);
  for(const side of [-1,1]){
    plate(root,ceramic,side*.145,1.37,.126,.27,.225,.13,-side*.1);
    plate(root,metal,side*.21,1.13,0,.09,.24,.22,-side*.12);
  }
  for(let i=0;i<3;i++) plate(root,i===0?metal:ceramic,0,1+i*.071,.144,.3+i*.025,.052,.045);
  shell(root,[[.195,0],[.222,.018],[.222,.085],[.2,.095]],metal,0,.9,0,.8);
  shell(root,[[.124,0],[.16,.015],[.16,.1],[.13,.11]],rubber,0,1.46,0,.93);
  shell(root,[[.11,0],[.188,.055],[.222,.16],[.217,.29],[.17,.35],[.08,.38],[0,.385]],ceramic,0,1.54,0,.92);
  shell(root,[[.195,.075],[.231,.14],[.232,.24],[.22,.27]],visor,0,1.54,.005,.99,-1.57,3.14);
  shell(root,[[.233,.229],[.233,.241]],glow,0,1.54,.008,1,-1.44,2.88);
  for(const s of [-1,1]){
    plate(root,metal,s*.202,1.69,-.035,.056,.14,.13);
    plate(root,orange,s*.21,1.66,-.027,.058,.026,.11);
  }
  // Backpack, recessed dorsal telemetry strip and twin oxygen bottles.
  plate(root,metal,0,1.23,-.202,.36,.49,.17);
  for(const s of [-1,1]){
    shell(root,[[.04,0],[.067,.045],[.067,.32],[.043,.37]],ceramic,s*.174,1.03,-.213);
    for(const y of [1.09,1.31]) shell(root,[[.069,0],[.069,.028]],metal,s*.174,y,-.213);
  }
  plate(root,rubber,0,1.24,-.303,.24,.34,.04);
  for(let i=0;i<5;i++){
    plate(root,glow,0,1.12+i*.051,-.333,.046,.029,.018);
    for(const s of [-1,1]) plate(root,metal,s*.076,1.12+i*.051,-.33,.056,.014,.015);
  }
  for(const s of [-1,1]){
    const leg=new T.Group(), arm=new T.Group();
    leg.position.set(s*.137,.91,0); arm.position.set(s*.313,1.43,0);
    root.add(leg,arm); limbs.push(leg,arm);
    shell(leg,[[.077,-.76],[.09,-.64],[.072,-.4],[.116,-.19],[.107,-.015]],graphite,0,0,0,.98);
    plate(leg,ceramic,0,-.19,.063,.16,.25,.082);
    plate(leg,metal,0,-.397,.068,.146,.115,.076);
    plate(leg,ceramic,0,-.59,.056,.126,.21,.07);
    plate(leg,rubber,0,-.83,.046,.19,.135,.3);
    plate(leg,metal,0,-.774,.095,.174,.09,.22);
    plate(leg,glow,s*.065,-.763,.21,.022,.019,.012);
    shell(arm,[[.063,-.51],[.075,-.38],[.058,-.27],[.082,-.12],[.089,0]],graphite,0,0,0);
    shell(arm,[[.096,-.13],[.113,-.08],[.102,.015],[.064,.045]],ceramic,0,0,0);
    plate(arm,ceramic,s*.035,-.355,.025,.105,.16,.116);
    plate(arm,rubber,0,-.53,.016,.118,.123,.104);
    plate(arm,orange,0,-.453,.02,.12,.026,.115);
    if(s===-1){
      plate(arm,metal,0,-.374,.102,.12,.145,.04);
      plate(arm,glow,0,-.366,.128,.086,.085,.012);
    }
  }
  const label=document.createElement('canvas'); label.width=384; label.height=96;
  const ctx=label.getContext('2d');ctx.fillStyle='#18232c';ctx.fillRect(0,0,384,96);
  ctx.fillStyle='#ff943f';ctx.fillRect(8,13,10,70);ctx.fillStyle='#e9f2f6';ctx.font='bold 44px monospace';ctx.fillText('OMEGA EX-07',30,63);
  const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;
  part(root,new T.PlaneGeometry(.24,.06),new T.MeshBasicMaterial({map}),0,1.365,.209);
  plate(root,glow,.18,1.414,.207,.046,.016,.012);
  plate(root,metal,.15,1.795,.16,.068,.069,.074);
  plate(root,glow,.15,1.795,.203,.047,.042,.01);
  const lamp=new T.SpotLight('#c1efff',0,9,.38,.6);
  lamp.position.set(.15,1.795,.22);lamp.target.position.set(.15,.9,6);
  root.add(lamp,lamp.target);
  batches.forEach((materials,parent)=>materials.forEach((parts,mat)=>{
    const triangles=parts.map(g=>g.index?g.toNonIndexed():g);
    const geometry=mergeGeometries(triangles);
    parent.add(new T.Mesh(geometry,mat));
    new Set([...parts,...triangles]).forEach(g=>g.dispose());
  }));
  return {root,limbs,update(equipped,processing,dt,reduced){
    glow.emissive.set(processing?'#9ddcff':equipped?'#00d9ff':'#ffad47');
    lamp.intensity=T.MathUtils.lerp(lamp.intensity,equipped?3:0,reduced?1:1-Math.exp(-dt*6));
  }};
}
