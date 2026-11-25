import * as THREE from 'three';

const TAU = Math.PI * 2;

// Paint the stone once. All marks lie beneath combat telegraphs.
function arenaFloor(random) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1536;
  const ctx = canvas.getContext('2d');
  ctx.translate(768, 768);
  ctx.scale(12, 12);
  ctx.fillStyle = '#504641';
  ctx.fillRect(-64, -64, 128, 128);
  function wash(x, z, radius, color) {
    const gradient = ctx.createRadialGradient(x,z,0,x,z,radius);
    gradient.addColorStop(0,color);
    gradient.addColorStop(1,'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x-radius,z-radius,2*radius,2*radius);
  }
  for (let i=0; i<950; i++) {
    wash(random()*128-64,random()*128-64,1+random()*7,
      i%3 ? 'rgba(22,20,24,.26)' : 'rgba(153,132,109,.27)');
  }
  for (let i=0; i<25000; i++) {
    ctx.fillStyle = i%2 ? '#ead9c018' : '#100d151f';
    ctx.fillRect(random()*128-64,random()*128-64,random()*.28+.04,.09);
  }
  wash(0,-17,24,'#201b20');
  // Broken paving of the processional road, progressively buried in ash.
  for (let row=0; row<14; row++) {
    for (let column=0; column<4; column++) {
      const x=(column-2)*2.4+(row%2)*.8, z=49-row*1.8;
      ctx.fillStyle='rgba(173,152,127,'+((14-row)*.014+random()*.08)+')';
      ctx.beginPath();ctx.moveTo(x,z);ctx.lineTo(x+2.2,z+.08);
      ctx.lineTo(x+2.1,z+1.45);ctx.lineTo(x+.3,z+1.6);ctx.fill();
    }
  }
  for (let i=0; i<115; i++) {
    let x=random()*114-57,z=random()*114-57;
    const angle=random()*TAU;
    ctx.beginPath();ctx.moveTo(x,z);
    for(let j=0;j<7;j++){
      x+=Math.cos(angle)*(random()+.5)+(random()-.5)*1.3;
      z+=Math.sin(angle)*(random()+.5)+(random()-.5)*1.3;
      ctx.lineTo(x,z);
    }
    ctx.strokeStyle='#241e20a8';ctx.lineWidth=.06+random()*.08;ctx.stroke();
  }
  for(const [x,z,angle] of [[-3,36,.25],[5,23,-.5],[-11,2,-.75],[12,-13,.7],[-7,-28,2]]) {
    ctx.save();ctx.translate(x,z);ctx.rotate(angle);
    for(let j=-1;j<=1;j++){
      ctx.beginPath();ctx.moveTo(j*.46,0);ctx.quadraticCurveTo(j*.55+.5,2,j*.64+1,4.2);
      ctx.quadraticCurveTo(j*.54+.1,2,j*.46,0);ctx.fillStyle='#251d1d';ctx.fill();
    }
    ctx.restore();
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace;
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(128,128),
    new THREE.MeshStandardMaterial({map,roughness:.96}));
  floor.rotation.x=-Math.PI/2;
  floor.position.y=-.045;
  return floor;
}

export function createDragonLair(scene) {
  let seed=7941;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const previousBackground=scene.background, previousFog=scene.fog;
  const background=new THREE.Color('#262126'), fog=new THREE.FogExp2('#30272b',.009);
  scene.background=background;
  scene.fog=fog;
  const roots=[];
  const addToScene=object=>{scene.add(object);roots.push(object);return object;};
  addToScene(arenaFloor(random));
  addToScene(new THREE.HemisphereLight('#e2d9d2','#806451',1.65));
  for(const [color,power,x,y,z] of [
    ['#ffc58e',650,-9,15,-29],['#c6d4e0',820,7,20,0],['#e8aa77',150,-5,5,37]
  ]) {
    const light=new THREE.PointLight(color,power,85);
    light.position.set(x,y,z);addToScene(light);
  }

  const stone=new THREE.MeshStandardMaterial({color:'#61585a',flatShading:true});
  const masonry=new THREE.MeshStandardMaterial({color:'#84746a',flatShading:true});
  const bronze=new THREE.MeshStandardMaterial({color:'#92704a',metalness:.54,roughness:.56});
  const iron=new THREE.MeshStandardMaterial({color:'#544b4a',metalness:.46,roughness:.64});
  const gold=new THREE.MeshStandardMaterial({color:'#c8a96b',metalness:.62,roughness:.42});
  const ember=new THREE.MeshBasicMaterial({color:'#cb6439'});
  const rock=new THREE.IcosahedronGeometry(1,0), block=new THREE.BoxGeometry(1,1,1);
  const tooth=new THREE.ConeGeometry(1,1,7);
  const drum=new THREE.CylinderGeometry(.88,1,1,9);
  const coin=new THREE.CylinderGeometry(1,1,1,9);
  const sectors=[], matrix=new THREE.Object3D();
  function batch(parent,geometry,material,poses) {
    const mesh=new THREE.InstancedMesh(geometry,material,poses.length);
    poses.forEach(([x,y,z,w,h,d,rx=0,ry=0,rz=0],i)=>{
      matrix.position.set(x,y,z);matrix.rotation.set(rx,ry,rz);matrix.scale.set(w,h,d);
      matrix.updateMatrix();mesh.setMatrixAt(i,matrix.matrix);
    });
    parent.add(mesh);
  }
  // Each crag is a continuous, folded face with ledges and an overhanging lip.
  const cliffMaterial=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,side:THREE.DoubleSide});
  const count=18, divisions=5;
  function cliffPoint(k,level) {
    const a=k*TAU/(count*divisions);
    const fold=Math.sin(13*a)+.6*Math.cos(29*a);
    const r=[54.8,57,55.8,60,55.4,64][level]+fold;
    const crown=28-7*Math.sin(a)+4*Math.sin(5*a);
    const y=[-2,3+fold,7+fold,crown*.68,crown,crown+3][level];
    return [r*Math.cos(a),y,r*Math.sin(a)];
  }
  for(let i=0;i<count;i++){
    const group=new THREE.Group(), angle=(i+.5)*TAU/count;
    addToScene(group);sectors.push({group,nx:Math.cos(angle),nz:Math.sin(angle)});
    const positions=[],colors=[];
    for(let j=0;j<divisions;j++) for(let level=0;level<5;level++){
      const k=i*divisions+j;
      const a=cliffPoint(k,level),b=cliffPoint(k+1,level),
        c=cliffPoint(k+1,level+1),d=cliffPoint(k,level+1);
      for(const triangle of [[a,c,b],[a,d,c]]){
        const tint=new THREE.Color(['#514849','#645350','#38333b','#4c464e','#29272f'][level]);
        tint.multiplyScalar(.85+random()*.34);
        triangle.forEach(p=>{positions.push(...p);colors.push(tint.r,tint.g,tint.b);});
      }
    }
    const cliff=new THREE.BufferGeometry();
    cliff.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    cliff.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    cliff.computeVertexNormals();group.add(new THREE.Mesh(cliff,cliffMaterial));
    const shelf=[],pendants=[];
    for(let j=0;j<8;j++){
      const a=(i+random())*TAU/count,x=Math.cos(a),z=Math.sin(a);
      shelf.push([x*57,1,z*57,2+random()*3,2+random()*6,3,0,a,.16]);
      const top=cliffPoint(Math.round(a*count*divisions/TAU),4)[1];
      pendants.push([x*56,top-2,z*56,1+random(),6+random()*6,1.8,.1,a,Math.PI]);
    }
    batch(group,rock,stone,shelf);batch(group,tooth,stone,pendants);
  }

  function landmark(x,z){
    const group=new THREE.Group();group.position.set(x,0,z);addToScene(group);
    return group;
  }
  for(const side of [-1,1]){
    const gate=landmark(side*7,38);
    batch(gate,block,masonry,[[0,.45,0,3,.9,3],[0,1.6,0,2,1.4,2,0,.08],[.25,2.8,0,1.9,1,2,.09,0,side*.16]]);
    batch(gate,block,iron,[[side*.6,.42,-1.8,.17,.22,4,.1,side*.32],[side*1.3,.32,-2,.18,.2,3.6,.13,side*.32],[side*.9,.45,-2.4,1.8,.12,.18,0,side*.32]]);
    const hoard=landmark(side*32,-30);
    batch(hoard,rock,bronze,[[-2,.1,0,5,1.15,3,0,.4],[3,.1,-1,3,1,2.8,0,.7]]);
    const coins=[];
    for(const [cx,cz,w,h,d] of [[-2,0,5,1.15,3],[3,-1,3,1,2.8]]){
      for(let j=0;j<390;j++){
        const a=random()*TAU,r=Math.sqrt(random());
        coins.push([cx+w*r*Math.cos(a),.14+h*Math.sqrt(1-r*r),cz+d*r*Math.sin(a), .16,.055,.16,random()*.35,a,random()*.28]);
      }
    }
    batch(hoard,coin,gold,coins);
    batch(hoard,block,bronze,[[4,.55,2.5,2.2,1.1,1.3],[4,1.22,2.5,2.25,.32,1.34]]);
    batch(hoard,block,gold,[[3.35,.78,2.5,.14,1.38,1.38],[4.65,.78,2.5,.14,1.38,1.38]]);
    const ruin=landmark(side*19,-45);
    const courses=[];
    for(let j=0;j<(side<0?7:5);j++)
      courses.push([0,j*1.45+.72,0,2.1-j*.06,1.39,2,0,.07*j]);
    batch(ruin,drum,masonry,courses);
    const stones=[];
    for(let j=0;j<(side<0?5:3);j++){
      const a=j*.24;
      stones.push([-side*6*(1-Math.cos(a)),courses.length*1.45+6*Math.sin(a),0, 2,1.5,2.7,.03,0,side*a]);
    }
    batch(ruin,block,masonry,stones);
    batch(ruin,rock,stone,[[side*3,1,0,5,2.6,4],[side*5,3,-2,3,4,3]]);
    batch(ruin,rock,ember,[[side*3,.18,3,2.8,.16,.28,0,side*.45],[side*5.2,.13,2.2,1.1,.1,.17,0,-side*.24]]);
  }
  const ash=new THREE.BufferGeometry(), positions=[];
  for(let i=0;i<65;i++) positions.push((random()-.5)*46,random()*7,-30+random()*14);
  ash.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const sparks=new THREE.Points(ash,new THREE.PointsMaterial({size:.065,color:'#dc9d69',transparent:true,opacity:.62,depthWrite:false}));
  addToScene(sparks);
  let disposed=false;
  return {
    update(camera,time,reduced){
      for(const {group,nx,nz} of sectors)
        group.visible=camera.x*nx+camera.z*nz<46;
      sparks.position.y=reduced?0:Math.sin(time*.43)*.65;
      sparks.position.x=reduced?0:Math.sin(time*.22)*.45;
    },
    dispose(){
      if(disposed)return;
      disposed=true;
      const geometries=new Set(),materials=new Set(),textures=new Set();
      roots.forEach(root=>{
        scene.remove(root);
        root.traverse(object=>{
          if(object.isInstancedMesh)object.dispose();
          if(object.geometry)geometries.add(object.geometry);
          if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>{
            materials.add(material);
            if(material.map)textures.add(material.map);
          });
        });
      });
      geometries.forEach(geometry=>geometry.dispose());
      textures.forEach(texture=>texture.dispose());
      materials.forEach(material=>material.dispose());
      if(scene.background===background)scene.background=previousBackground;
      if(scene.fog===fog)scene.fog=previousFog;
    },
  };
}
