import * as THREE from 'three';

// Command coordinates are local to the hub. Its airlock threshold coincides with z=-36 in the hangar.
export const commandOffset = -60;
export const stations = [
  { id:'NAV', x:-11, z:-5, color:'#49daed' }, { id:'COM', x:11, z:-5, color:'#b08dea' },
  { id:'ENG', x:11, z:7, color:'#efae54' }, { id:'SEC', x:-11, z:7, color:'#62c99f' },
];

export function commandFloor(x,z) {
  const radius=Math.hypot(x,z);
  const dais=THREE.MathUtils.clamp((6-radius)*.65,0,1);
  const bridge=Math.abs(x)<6.5 ? THREE.MathUtils.clamp((-8-z)*.55,0,2.5) : 0;
  return Math.max(dais,bridge);
}

export function buildCommandCenter(root, { box, cylinder, sphere }, preview=false) {
  const steel='#384e60', trim='#7cced7', dark='#192c3c', white='#cedde1';
  const walls=[];
  function wall(w,h,d,x,y,z) {
    const piece=box(root,w,h,d,steel,x,y,z);
    walls.push({piece,local:new THREE.Box3(new THREE.Vector3(x-w/2,y-h/2,z-d/2),new THREE.Vector3(x+w/2,y+h/2,z+d/2)).expandByScalar(.32)});
  }
  // The ribbed pressure sleeve has the same deck height, width and lights on both sides of the scene handoff.
  const sleeveEnd=preview?24:28;
  box(root,7,.32,sleeveEnd-17,dark,0,-.16,(sleeveEnd+17)/2);
  wall(.38,5,12,-3.54,2.5,22);wall(.38,5,12,3.54,2.5,22);
  wall(7.4,.28,12,0,5.12,22);
  if(!preview)wall(7.4,5,.35,0,2.5,28);
  for(let z=17;z<=27;z+=2) {
    for(const side of [-1,1]){
      box(root,.12,.09,1.65,trim,side*3.28,1,z);
      box(root,.15,.025,1.4,'#d9ab5c',side*2.45,.012,z);
    }
    box(root,6.5,.035,.05,steel,0,.02,z);
  }
  box(root,34,.4,34,steel,0,-.2,0);
  for(const side of [-1,1]){
    if(side<0)wall(.55,7,34,-17,3.5,0);
    else for(const z of [-9.5,9.5])wall(.55,7,15,17,3.5,z);
    wall(5.5,6,.4,side*6.25,3,17);
    wall(4,6,.4,side*15,3,17);
    for(let z=-15;z<=15;z+=5){
      box(root,.3,.08,3,trim,side*15,.04,z);
      box(root,.38,6,.46,dark,side*16.5,3,z);
    }
  }
  // Circular ramp to the strategy table and a straight ramp to the commander's bridge.
  const ramp=new THREE.Mesh(new THREE.CylinderGeometry(4.46,6,1,48),new THREE.MeshStandardMaterial({color:dark,metalness:.45,roughness:.48}));
  ramp.position.y=.5;root.add(ramp);
  for(let i=0;i<20;i++){
    const z=-8-(i+.5)*.25, h=commandFloor(0,z);
    box(root,13,h,.25,steel,0,h/2,z);
  }
  box(root,13,2.5,4,dark,0,1.25,-15);
  for(const x of [-6.35,6.35])box(root,.09,.1,4,trim,x,3.45,-15);
  box(root,2.4,1,.9,steel,0,3,-14.6);
  box(root,2.2,.8,.17,trim,0,3.8,-14.9);
  // Fixed command seat, facing the console from the window side.
  const seatZ = -16;
  cylinder(root,.49,.12,steel,0,2.56,seatZ,12);
  cylinder(root,.23,.36,dark,0,2.8,seatZ,12);
  box(root,.95,.16,.84,steel,0,3.04,seatZ);
  box(root,.79,.13,.7,dark,0,3.17,seatZ+.04);
  const back = box(root,.86,.91,.16,steel,0,3.58,seatZ-.37);
  back.rotation.x = -.12;
  const cushion = box(root,.68,.68,.12,dark,0,3.57,seatZ-.26);
  cushion.rotation.x = back.rotation.x;
  for (const side of [-1,1]) {
    box(root,.1,.31,.28,steel,side*.45,3.23,seatZ-.05);
    box(root,.14,.09,.58,dark,side*.45,3.42,seatZ);
  }
  for(const x of [-16,-12,-8,-4,0,4,8,12,16])box(root,.22,9,.4,steel,x,4.5,-17);
  box(root,34,.55,.7,steel,0,9,-17);
  wall(34,1,.6,0,.5,-17);
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(33,8),new THREE.MeshPhysicalMaterial({color:'#a5e6ff',roughness:.14,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide}));
  glass.position.set(0,4.8,-17);root.add(glass);
  const planet=sphere(root,11,'#648eae',-8,8,-41);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(11.2,40,24),new THREE.MeshBasicMaterial({color:'#80cbef',side:THREE.BackSide,transparent:true,opacity:.28}));
  atmosphere.position.copy(planet.position);root.add(atmosphere);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(14,.38,8,80),new THREE.MeshStandardMaterial({color:'#a8bfce'}));
  ring.rotation.set(1.22,.3,-.24);ring.position.copy(planet.position);root.add(ring);
  const stars=[];
  for(let i=0;i<210;i++)stars.push(Math.sin(i*17)*50,7+Math.cos(i*3.7)*25,-57-i%8);
  const sky=new THREE.BufferGeometry();sky.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  root.add(new THREE.Points(sky,new THREE.PointsMaterial({color:white,size:.09})));
  cylinder(root,2.6,.48,steel,0,1.24,0,32);cylinder(root,1.85,.85,dark,0,1.8,0,32);
  cylinder(root,2.35,.16,trim,0,2.29,0,32);
  const hologram=new THREE.Group();hologram.position.y=3.46;root.add(hologram);
  const nodes=[[0,0,1.25],[0,0,0],[-1.15,.25,-.35],[1.15,.25,-.35],[0,.5,-1.1],[0,.65,-1.8]];
  const sectorMeshes=nodes.map(([x,y,z],i)=>{
    const module=new THREE.Mesh(new THREE.IcosahedronGeometry(i===1?.5:.32,0),new THREE.MeshBasicMaterial({color:[0x59ca94,0x52e5ef,0xfa6262,0xfa6262,0xb080ff,0x647483][i],wireframe:true}));
    module.position.set(x,y,z);hologram.add(module);return module;
  });
  const paths=[[0,1],[1,2],[1,3],[2,4],[3,4],[4,5]].flatMap(([a,b])=>[...nodes[a],...nodes[b]]);
  const links=new THREE.BufferGeometry();links.setAttribute('position',new THREE.Float32BufferAttribute(paths,3));
  hologram.add(new THREE.LineSegments(links,new THREE.LineBasicMaterial({color:trim})));
  function label(text,x,y,z,rotationY=0) {
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#122332';ctx.fillRect(0,0,256,64);ctx.fillStyle='#e5f4f7';ctx.font='bold 46px monospace';ctx.textAlign='center';ctx.fillText(text,128,49);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.55),new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}));
    sign.rotation.y=rotationY;
    sign.position.set(x,y,z);root.add(sign);
  }
  label('Ω / 02',0,4.8,-15.1);
  const panels=stations.map(({id,x,z,color})=>{
    box(root,3.2,1.2,1.7,dark,x,.6,z);
    const panel=box(root,2.9,1.05,.17,color,x,1.7,z-.55); panel.rotation.x=-.18;
    label(id,x,2.6,z);
    for(let j=0;j<7;j++){
      const px=x-1+j/3;
      const height=id==='COM'?.23+.2*Math.cos(j):id==='ENG'?.1+j*.065:.08;
      box(root,.15,height,.045,dark,px,1.65+(id==='NAV'?Math.sin(j)*.3:0),z-.42);
    }
    return box(root,.9,.09,.14,steel,x,1.23,z+.68);
  });
  const panelOn=sectorMeshes[0].material.clone();
  panelOn.wireframe=false;
  // A fixed status LED also owns this shared material during scene cleanup.
  box(root,.16,.1,.1,trim,0,2.4,2.2).material=panelOn;
  const gateways=[-1,1].map(side=>{
    const x=side*11,z=16;
    label(side<0?'LAB':'ENG',x,4.5,z-.45,Math.PI);
    box(root,4.2,.4,6,steel,x,-.2,19.5);
    wall(4.4,4,.4,x,2,22.4);
    for(const edge of [-1,1]){
      wall(.28,4,6.2,x+edge*2.16,2,19.3);
      box(root,.18,3.85,.5,white,x+edge*2.05,1.925,z);
    }
    const leaves=[-1,1].map(s=>box(root,2,3.7,.36,steel,x+s,1.85,z-.4));
    const lamp=box(root,4,.16,.22,'#ee5959',x,4,z-.46);
    return {x,leaves,lamp};
  });
  const coreLeaves=[-1,1].map(side=>box(root,.45,4,2,steel,17,2,side));
  box(root,5,.4,4.6,steel,19,-.2,0);
  for(const z of [-2.3,2.3])wall(5,4,.35,19,2,z);
  wall(.4,4,4.6,21.5,2,0);
  label('NEXUS',16,4.4,0);
  let coreDoor=0;
  const ray=new THREE.Ray(),point=new THREE.Vector3(),targetLocal=new THREE.Vector3();
  let opening=0;
  return {
    floor:commandFloor,
    target(x,z) {
      if(x>17.5&&coreDoor>=.99)return 'coreAccess';
      if(z>17.4&&opening>=.99&&Math.abs(Math.abs(x)-11)<1.65)return x<0?'omega-lab':'omega-reactor';
      if(Math.hypot(x,z)<4.5)return 'table';
      if(Math.hypot(x,z+14.6)<2.8)return 'bridge';
      return stations.find(s=>Math.hypot(x-s.x,z-s.z)<3)?.id || false;
    },
    canWalk(x,z,h) {
      if(x>=16.4)return x<20.9&&Math.abs(z)<1.6&&coreDoor>=.99;
      const sectorAisle=Math.abs(Math.abs(x)-11)<1.65;
      if(z>16.7)return (z<27.4 && Math.abs(x)<2.95) || (sectorAisle && opening>=.99 && z<21.9);
      return Math.abs(x)<16.4 && z> -16.4 && Math.abs(commandFloor(x,z)-h)<.28 &&
        Math.hypot(x,z)>2.82 && !stations.some(s=>Math.abs(x-s.x)<2 && Math.abs(z-s.z)<1.18) &&
        !(Math.abs(x)<1.55 && Math.abs(z+14.6)<.9) &&
        !(Math.abs(x)<.82 && Math.abs(z-seatZ)<.78) && !(Math.abs(Math.abs(x)-11)<2.35 && z>15.1 && (!sectorAisle || opening<.99));
    },
    update(dt,reduced,mission) {
      hologram.visible=!!mission?.table;
      if(!reduced && hologram.visible)hologram.rotation.y+=dt*.17;
      const restored=!!mission?.authorized;
      opening=Math.min(1,opening+(restored?dt:0));
      gateways.forEach(({x,leaves,lamp})=>{
        leaves.forEach((leaf,i)=>{leaf.position.x=x+(i?1:-1)*(1+opening*1.7);});
        lamp.material.color.set(restored?'#58d48a':'#ee5959');
      });
      panels.forEach((p,i)=>{p.material=mission?.fragments.includes(stations[i].id)?panelOn:p.material;});
      const unlocked=restored&&mission.scientific&&mission.powered;
      coreDoor=Math.min(1,coreDoor+(unlocked?dt:0));
      coreLeaves.forEach((leaf,i)=>{leaf.position.z=(i?1:-1)*(1+coreDoor*1.9);});
      sectorMeshes[4].material.color.set(unlocked?'#58d48a':'#b080ff');
      for(const i of [2,3])sectorMeshes[i].material.color.set((i===2?mission?.scientific:mission?.powered)?'#58d48a':restored?'#52e5ef':'#fa6262');
    },
    cutaway(eye,target) {
      ray.origin.copy(eye).sub(root.position);
      targetLocal.copy(target).sub(root.position);
      ray.direction.subVectors(targetLocal,ray.origin).normalize();
      const limit=ray.origin.distanceToSquared(targetLocal);
      walls.forEach(({piece,local})=>{piece.visible=!(local.containsPoint(ray.origin)||(ray.intersectBox(local,point)&&ray.origin.distanceToSquared(point)<limit));});
    }
  };
}
