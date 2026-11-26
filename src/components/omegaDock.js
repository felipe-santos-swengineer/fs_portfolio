import * as T from 'three';
import { suitRack, SUIT_EQUIPPED } from './omegaSuit';

const deck = '#425565', iron = '#25323d', edge = '#83939a', amber = '#f0a32a';
const cyan = '#75e7ff', signal = '#ff5744';
export const consolePosition = { x: 12, z: -13.6 };

const stairHalfWidth = 2.5; // Centred on the decontamination doorway at x = 0.

export function deckHeight(x, z) {
  if (Math.abs(x) <= stairHalfWidth && z < -16 && z >= -22) return (z + 22) * 3.5 / 6;
  if (x >= 9 && x <= 15 && z <= 0 && z >= -10) return -z * .35;
  if (x >= -14 && x <= 17 && z < -10 && z >= -16) return 3.5;
  return 0;
}

const berth = { x: -7, z: 26, halfWidth: 6, height: 8, end: 40 };
const berthApproach = berth.z - 1;

export function canWalk(x, z, fromHeight, doorOpen, exitOpen) {
  if (Math.abs(x) > 20 || z >= berthApproach || z < -42) return false;
  if (x > suitRack.x - .55 && Math.abs(z-suitRack.z)<.85) return false;
  if (z < -35 && (!exitOpen || Math.abs(x) > 2.45)) return false;
  if (z < -22 && Math.abs(x) > 2.8) return false;
  if (!doorOpen && Math.abs(z + 22) < .95 && Math.abs(x) < 3.6) return false;
  if (Math.abs(deckHeight(x,z) - fromHeight) > .23) return false;
  const blocked = [[-7,8,5.6,8],[-16,0,3,4],[15,11,4,6],[12,-13.6,1.5,.6],[16,-15,1,1]];
  return blocked.every(([cx,cz,w,d]) => Math.abs(x-cx)>w || Math.abs(z-cz)>d);
}

export function buildDock(scene, language) {
  const translatedSigns = [];
  const batches = new Map(), unit = new T.BoxGeometry(), tube = new T.CylinderGeometry(1,1,1,12);
  const dummy = new T.Object3D(), mats = new Map();
  function material(color) {
    if (!mats.has(color)) {
      const glowing = [cyan,signal,'#a3ffb0','#ffe095'].includes(color);
      mats.set(color,new T.MeshStandardMaterial({color,metalness:glowing ? .12 : .5,roughness:glowing ? .28 : .57,
        emissive:glowing?color:0,emissiveIntensity:glowing ? .75 : 0}));
    }
    return mats.get(color);
  }
  const wallMatrices = new Set();
  function stamp(geometry,color,x,y,z,w,h,d,rx=0,ry=0,rz=0) {
    const key = geometry.uuid + color;
    if (!batches.has(key)) batches.set(key,{geometry,color,matrices:[]});
    dummy.position.set(x,y,z); dummy.scale.set(w,h,d); dummy.rotation.set(rx,ry,rz); dummy.updateMatrix();
    const matrix = dummy.matrix.clone();
    batches.get(key).matrices.push(matrix);
    return matrix;
  }
  const box = (...args) => stamp(unit,...args);
  const wall = (...args) => wallMatrices.add(box(...args));
  function beam(a,b,width,color,round=false) {
    const start=new T.Vector3(...a), end=new T.Vector3(...b), delta=end.clone().sub(start);
    const mid=start.addScaledVector(delta,.5);
    const rotation=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize()));
    stamp(round?tube:unit,color,mid.x,mid.y,mid.z,width,delta.length(),width,rotation.x,rotation.y,rotation.z);
  }
  function mesh(geo,mat,x,y,z) {
    const object=new T.Mesh(geo,mat); object.position.set(x,y,z); scene.add(object); return object;
  }
  function sign(words,x,y,z,width,height) {
    const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=160;
    const ctx=canvas.getContext('2d');
    const map=new T.CanvasTexture(canvas); map.colorSpace=T.SRGBColorSpace;
    function draw(locale) {
      const label = typeof words === 'string' ? words : words[locale];
      ctx.fillStyle='#12232c'; ctx.fillRect(0,0,1024,160);
      ctx.fillStyle='#abf0ff'; ctx.font='bold 76px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(label,512,82,984);
      map.needsUpdate = true;
    }
    draw(language);
    if (typeof words !== 'string') translatedSigns.push(draw);
    return mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,side:T.DoubleSide}),x,y,z);
  }
  // Service joints and recessed lights break the deck into replaceable plates.
  for(let x=-20;x<=20;x+=4) for(let z=-22;z<=26;z+=4) {
    box(deck,x,-.18,z,3.96,.34,3.96);
    box(iron,x+1.55,.007,z+1.6,.55,.014,.08);
  }
  for(const side of [-1,1]) for(let z=-21;z<=27;z+=6) {
    const x=side*21;
    wall(iron,x,8,z,.7,16,5.95); box(deck,x-side*.46,6.5,z,.5,13,.8);
    beam([x,12,z],[side*16,18,z],.65,edge);
    box(iron,0,18,z,42,.55,.6);
    for(let n=-16;n<17;n+=4) beam([n,18,z],[n+2,19.5,z],.21,edge);
    box(deck,0,19.5,z,42,.32,.42);
    box(cyan,x-side*.85,7,z,.1,.22,3.7);
    beam([x-side*.9,9,z-3],[x-side*.9,9,z+3],.35,iron,true);
  }
  // Window looking past the command bulkhead, with a luminous planetary limb.
  for(const x of [-21,-14,-7,0,7,14,21]) box(edge,x,11,-23,.32,14,.65);
  box(deck,0,17.8,-23,43,.6,1); box(deck,0,5.2,-23,43,.6,1);
  const glass = new T.MeshPhysicalMaterial({color:'#9bdbff',transparent:true,opacity:.065,depthWrite:false,roughness:.17,side:T.DoubleSide});
  mesh(new T.PlaneGeometry(42,12),glass,0,11.5,-23.1);
  const planetMat = new T.MeshStandardMaterial({color:'#6189a5',roughness:1,emissive:'#203a54'});
  const planet=mesh(new T.SphereGeometry(15,48,32),planetMat,-9,13,-58);
  // Cloud belts are painted once on a repeating equirectangular map.
  const clouds=document.createElement('canvas'); clouds.width=512; clouds.height=256;
  const painter=clouds.getContext('2d');
  for(let y=0;y<256;y++){
    const wave=Math.sin(y*.19+Math.sin(y*.13)*1.9);
    painter.fillStyle='hsl('+(201+wave*8)+' 33% '+(51+wave*9)+'%)';
    painter.fillRect(0,y,512,1);
  }
  for(let i=0;i<150;i++){
    const x=(i*127)%512,y=(i*71)%256;
    painter.fillStyle='rgba(211,226,230,.17)';
    painter.beginPath();painter.ellipse(x,y,4+i%23,1+i%3,.03,0,Math.PI*2);painter.fill();
  }
  planetMat.map=new T.CanvasTexture(clouds); planetMat.map.colorSpace=T.SRGBColorSpace;
  const bands = new T.TorusGeometry(19,.8,6,96);
  const ring=mesh(bands,material('#93b6c9'),-9,13,-58); ring.rotation.set(1.22,.3,-.24);
  const atmosphere=mesh(new T.SphereGeometry(15.3,48,32),new T.MeshBasicMaterial({color:'#7fd8ff',side:T.BackSide,transparent:true,opacity:.4}),-9,13,-58);
  const stars=[];
  for(let i=1;i<=460;i++) stars.push(Math.sin(i*12.7)*92,Math.cos(i*3.7)*43,-75-i%16);
  const sky=new T.BufferGeometry(); sky.setAttribute('position',new T.Float32BufferAttribute(stars,3));
  scene.add(new T.Points(sky,new T.PointsMaterial({size:.12,color:'#d3eaff'})));
  // Eight-sided docking collar and chevron markings.
  stamp(tube,iron,-7,.02,8,8,.12,10);
  for(let i=0;i<32;i++) {
    const a=i*Math.PI/16, x=-7+7.2*Math.cos(a), z=8+8.9*Math.sin(a);
    box(i%4===0?cyan:amber,x,.1,z,.24,.04,.9,0,-a,0);
  }
  sign('OMEGA-03',-7,.75,16,5,1.1);
  // Lofted hull sections establish a broad cargo stern and tapered flight deck.
  const verts=[], idx=[];
  const sections=[[-7,.25,.3],[-4,1.7,1],[0,2.5,1.5],[5,2.2,1.2],[6,1.6,.8]];
  sections.forEach(([z,w,h],i)=>{
    [[-1,-.45],[-.8,.65],[-.43,1],[.43,1],[.8,.65],[1,-.45],[.64,-1],[-.64,-1]].forEach(([a,b])=>verts.push(w*a,h*b,z));
    if(i) for(let j=0;j<8;j++){const k=i*8+j,l=i*8+(j+1)%8;idx.push(k-8,k,l,l,l-8,k-8);}
  });
  for(let j=1;j<7;j++) idx.push(0,j,j+1,32,33+j,32+j);
  const hull=new T.BufferGeometry(); hull.setAttribute('position',new T.Float32BufferAttribute(verts,3)); hull.setIndex(idx); hull.computeVertexNormals();
  const skin=material('#adbbc4'); skin.side=T.DoubleSide; mesh(hull,skin,-7,2.6,8);
  box('#153946',-7,3.42,4.9,2.4,.33,2.3,-.21);
  for(const s of [-1,1]){
    box(deck,-7+s*3,2.35,10,3.8,.36,3.4,0,-s*.48,s*.08);
    stamp(tube,iron,-7+s*2.1,2.7,12.6,.86,3.6,.86,Math.PI/2);
    stamp(tube,cyan,-7+s*2.1,2.7,14.42,.56,.08,.56,Math.PI/2);
    for(const z of [5,12]){
      beam([-7+s,2,z],[-7+s*1.9,.4,z+.4],.18,edge,true);
      box(iron,-7+s*1.9,.26,z+.4,1,.25,1.2);
    }
    box(s===1?signal:cyan,-7+s*4.8,2.3,10.2,.25,.18,.4);
    for(let z=7;z<=12;z++) box(deck,-7+s*2.35,2.8,z,.12,.6,.08);
  }
  box(iron,-4.8,1.85,8,.23,1.9,1.7); box(edge,-3.7,.94,8,3,.14,1.6,0,0,-.54);
  sign('SV / 2187',-7,2.5,14.05,2.3,.6);
  // Service benches and folding arm.
  box(deck,-16,1.1,0,5,.28,5);
  for(const x of [-18,-14]) for(const z of [-2,2]) box(iron,x,.55,z,.3,1.1,.3);
  for(let i=0;i<6;i++) box(i%2?edge:amber,-17+i*.52,1.3,.3,.15,.12,.65,0,i*.5);
  stamp(tube,iron,-16,1.6,-1,1,.7,1);
  beam([-16,1.9,-1],[-17,4,-1],.5,amber); beam([-17,4,-1],[-15,4.7,-1],.32,edge);
  beam([-15,4.7,-1],[-14.8,3.9,-1],.19,iron);
  // Overhead crane, trolley and a suspended lifting head.
  for(const x of [-12,12]) box(iron,x,14,1,.55,.65,41);
  box(amber,0,13.6,5,25,.8,1.4); box(deck,-4,12.9,5,2.3,.8,2);
  beam([-4,13,5],[-4,7.2,5],.07,iron,true); box(amber,-4,7.2,5,1.7,.45,.6);
  for(let i=0;i<8;i++){
    const x=13+(i%2)*3.4,z=7+Math.floor(i/2)*2.6,h=1.6+(i%3)*.55;
    box(iron,x,.17,z,3,.3,2.4); box(i%3?deck:'#805f48',x,.33+h/2,z,2.85,h,2.2);
    for(const side of [-1,1]) box(edge,x+side,.33+h/2,z+1.11,.15,h,.06);
    sign('C-'+(312+i),x,.95,z+1.15,1,.32);
  }
  // Stairs and open-grid gallery lead to the glazed control booth.
  for(let i=0;i<20;i++) box(deck,12,i*.175,-i*.5,6,.18,.52);
  const treadDepth = 6 / 14;
  for (let i = 0; i < 14; i++) {
    const z = -16 - (i + .5) * treadDepth;
    box(deck, 0, deckHeight(0, z) - .1, z, 2 * stairHalfWidth, .2, treadDepth);
  }
  for (const x of [-stairHalfWidth, stairHalfWidth]) beam([x,4.5,-16],[x,1,-22],.08,edge,true);
  for(let x=-14;x<=17;x+=.5) box(deck,x,3.39,-13,.43,.22,6);
  function landingRail(x1,z1,x2,z2) {
    beam([x1,4.5,z1],[x2,4.5,z2],.09,edge,true);
    const spans = Math.ceil(Math.hypot(x2-x1,z2-z1)/2);
    // The next segment or stair shares the corner post.
    for (let i=0;i<spans;i++) {
      const t=i/spans;
      box(edge,x1+(x2-x1)*t,3.95,z1+(z2-z1)*t,.08,1.1,.08);
    }
  }
  landingRail(-stairHalfWidth,-16,-14,-16);
  landingRail(-14,-16,-14,-10);
  landingRail(-14,-10,9,-10);
  landingRail(15,-10,17,-10);
  landingRail(17,-10,17,-16);
  landingRail(17,-16,stairHalfWidth,-16);
  for (const [x,z] of [[9,-10],[stairHalfWidth,-16]]) box(edge,x,3.95,z,.08,1.1,.08);
  for(const x of [9,15]) beam([x,1,0],[x,4.5,-10],.09,edge,true);
  box(deck,12,7,-14,8,.3,5); for(const x of [8,16]) box(edge,x,5.3,-15,.2,3.5,.2);
  mesh(new T.PlaneGeometry(8,2.5),glass,12,5.5,-15.2);
  box(iron,12,4.3,-13.6,2.8,1.5,.9); const monitor=mesh(new T.BoxGeometry(2.2,.8,.16),new T.MeshStandardMaterial({color:cyan,emissive:cyan}),12,5.35,-13.8);
  sign({'pt-BR':'Ω / CONTROLE','en-US':'Ω / CONTROL'},12,5.4,-13.7,1.9,.45);
  box(deck,15.6,4.15,-14.3,.7,.18,.72,0,.6);box(deck,15.9,4.55,-14.6,.6,.8,.16,0,.6);
  sign({'pt-BR':'CONTROLE / 01','en-US':'CONTROL / 01'},12,6.65,-12,4,.64);
  // Paired pressure leaves and the sealed scanner gallery beyond.
  for(const s of [-1,1]){
    wall(deck,s*12.5,2.5,-22,18,5,.8);
    box(edge,s*3.65,2.6,-22,1,5.2,1.6);
    beam([s*3.8,.5,-21.2],[s*3.8,4.6,-21.2],.22,iron,true);
    for(let z=-24;z>=-36;z-=3){
      wall(deck,s*3.45,1.75,z,.45,3.5,3);
      box(cyan,s*3.15,2.6,z,.12,.12,2);
      box(edge,s*3.25,3,z,.3,6,.45);
    }
  }
  box(deck,0,-.16,-29,7,.32,15);
  box(deck,0,5.15,-36,7,.5,.7);
  sign({'pt-BR':'SETOR 01 / COMANDO','en-US':'SECTOR 01 / COMMAND'},0,5.35,-21.6,6,.9);
  sign({'pt-BR':'COMANDO / 02','en-US':'COMMAND / 02'},0,5.1,-35.6,4,.7);
  const doors=[-1,1].map(s=>mesh(new T.BoxGeometry(3.3,4.8,.7),material(deck),s*1.65,2.4,-22));
  box(iron,3.14,1.35,suitRack.z,.16,2.5,1.36);
  box(edge,2.91,.19,suitRack.z,.62,.13,1.36);
  for (const side of [-1,1]) box(cyan,3.01,1.37,suitRack.z+side*.64,.08,2.35,.045);
  const rackLabel=sign('OMEGA EX-07',3.01,2.43,suitRack.z,.95,.18);
  rackLabel.rotation.y=-Math.PI/2;
  const exitDoors=[-1,1].map(side=>mesh(new T.BoxGeometry(3.5,4.9,.7),material(deck),side*1.75,2.45,-36));
  // Rear bulkhead surrounds the throat of the transfer bay. Its centre is open.
  const { x: bayX, z: sill, halfWidth, height, end } = berth;
  const left = bayX - halfWidth, right = bayX + halfWidth;
  wall(deck,(-21+left)/2,8,sill,left+21,16,.7);
  wall(deck,(right+21)/2,8,sill,21-right,16,.7);
  wall(iron,bayX,12,sill,2*halfWidth,8,1.4);
  box(deck,bayX,-.18,(28+end)/2,2*halfWidth,.34,end-28);
  box(deck,bayX,height+.2,(sill+end)/2,2*halfWidth,.4,end-sill);
  for (const side of [-1,1]) {
    const jamb = bayX + side*(halfWidth+.2);
    wall(deck,jamb,height/2,(sill+end)/2,.4,height,end-sill);
    for (let z=sill; z<end; z+=3) {
      box(edge,jamb-side*.22,height/2,z,.18,height,.28);
      box(cyan,jamb-side*.36,1.1,z+1,.08,.14,1.6);
      box(amber,jamb-side*.8,.02,z+1,.18,.03,1.8);
    }
  }
  wall(iron,bayX,height/2,end,2*halfWidth,height,.4);
  sign({'pt-BR':'DOCA 03','en-US':'DOCK 03'},bayX,4,end-.24,4,.9).rotation.y=Math.PI;
  const landingShutter=new T.Group();
  scene.add(landingShutter);
  landingShutter.position.set(bayX,height,sill);
  const panelHeight=height/8;
  for(let row=0;row<8;row++){
    const plate=new T.Mesh(unit,material(row%2 ? deck : iron));
    plate.position.y=(row+.5)*panelHeight;
    plate.scale.set(2*halfWidth,panelHeight-.025,.5);
    landingShutter.add(plate);
  }
  const indicator=mesh(new T.BoxGeometry(5,.14,.2),new T.MeshBasicMaterial({color:signal}),0,4.9,-21.5);
  const fan=new T.Group(); scene.add(fan); fan.position.set(-15,6,-21.4);
  for(let i=0;i<5;i++){
    const blade=new T.Mesh(new T.BoxGeometry(.38,2.2,.18),material(edge));
    blade.rotation.z=i*Math.PI/5; fan.add(blade);
  }
  const mist=[];
  for(let i=0;i<90;i++) mist.push(Math.sin(i*2.1)*2,1+Math.cos(i*3)*.7,-29+Math.sin(i)*5);
  const steamGeo=new T.BufferGeometry(); steamGeo.setAttribute('position',new T.Float32BufferAttribute(mist,3));
  const steam=new T.Points(steamGeo,new T.PointsMaterial({color:'#bcdeeb',size:.11,transparent:true,opacity:.35,depthWrite:false}));scene.add(steam);
  const wallPieces = [];
  batches.forEach(({geometry,color,matrices})=>{
    const group=new T.InstancedMesh(geometry,material(color),matrices.length);
    geometry.computeBoundingBox();
    matrices.forEach((matrix, index) => {
      group.setMatrixAt(index, matrix);
      if (wallMatrices.has(matrix)) {
        const bounds = geometry.boundingBox.clone().applyMatrix4(matrix);
        wallPieces.push({ group, index, matrix, bounds: bounds.expandByScalar(.35), hidden: false });
      }
    });
    group.computeBoundingSphere();
    scene.add(group);
  });
  const sight = new T.Ray(), hit = new T.Vector3();
  const hiddenMatrix = new T.Matrix4().makeScale(0,0,0);
  function updateVisibility(eye, target) {
    sight.origin.copy(eye);
    sight.direction.subVectors(target, eye).normalize();
    const distanceSq = eye.distanceToSquared(target);
    function blocksView(bounds) {
      return bounds.containsPoint(eye) ||
        (sight.intersectBox(bounds, hit) !== null && eye.distanceToSquared(hit) < distanceSq);
    }
    for (const piece of wallPieces) {
      const hidden = blocksView(piece.bounds);
      if (piece.hidden === hidden) continue;
      piece.hidden = hidden;
      piece.group.setMatrixAt(piece.index, hidden ? hiddenMatrix : piece.matrix);
      piece.group.instanceMatrix.needsUpdate = true;
    }

  }
  let clock=0, opening=0, exitOpening=0, lockdown=0;
  return {
    updateVisibility,
    setCommandView(active) { planet.visible = ring.visible = atmosphere.visible = !active; },
    setLanguage(locale) {
      if (locale === language) return;
      language = locale;
      translatedSigns.forEach(draw => draw(locale));
    },
    get open(){return opening>=.99;},
    get exitOpen(){return exitOpening>=.99;},
    update(dt,phase,reduced){
      clock+=dt;
      if(phase>=2) lockdown=Math.min(1,lockdown+dt*.42);
      const releaseDoor = phase === 5;
      opening = T.MathUtils.clamp(opening + (releaseDoor ? 1 : -1) * dt * .4, 0, 1);
      if (phase >= SUIT_EQUIPPED) exitOpening = Math.min(1,exitOpening + dt*.4);
      exitDoors.forEach((door,i)=>{door.position.x=(i?1:-1)*(1.75+exitOpening*3.5);});
      landingShutter.position.y=height*(1-lockdown*lockdown*(3-2*lockdown));
      doors.forEach((door,i)=>{door.position.x=(i?1:-1)*(1.65+opening*3.2);});
      indicator.material.color.set(releaseDoor && opening>=.99?'#82ffb0':opening>0 || releaseDoor?'#ffc252':signal);
      if(!reduced){fan.rotation.z+=dt*.7;ring.rotation.z+=dt*.002;planet.rotation.y+=dt*.013;steam.position.y=Math.sin(clock*.8)*.25;}
      monitor.material.emissiveIntensity=phase===1 && !reduced ? .48+.3*Math.sin(clock*7) : .48;
      material(signal).emissiveIntensity=phase>=2 && !reduced ? .65+.3*Math.sin(clock*2) : .65;
      return lockdown;
    }
  };
}
