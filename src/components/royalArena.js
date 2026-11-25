import * as THREE from 'three';
import { pointedOutline } from './arcaneChamberArchitecture';

// Bake the stationary masonry into batches while keeping the actors articulated.
export function buildRoyalArena(scene) {
  const cube = new THREE.BoxGeometry();
  const column = new THREE.CylinderGeometry(1, 1, 1, 8);
  const shard = new THREE.OctahedronGeometry(1);
  const gold = '#a68a56', stone = '#44404a', iron = '#27272a', wine = '#681f35';
  const materials = new Map();
  const batches = new Map();
  const walls = [];
  let parent = scene;
  const lancet = new THREE.Shape([new THREE.Vector2(-1,0), ...pointedOutline(1,2.4,3.65), new THREE.Vector2(1,0)]);
  const glass = new THREE.ExtrudeGeometry(lancet,{depth:.1,bevelEnabled:false});
  const arch = new THREE.Shape([...pointedOutline(1.22,2.4,3.92),...pointedOutline(1,2.4,3.65).reverse()]);
  const moulding = new THREE.ExtrudeGeometry(arch,{depth:.28,bevelEnabled:false});
  const heraldry = new THREE.Shape([new THREE.Vector2(-.52,.68),new THREE.Vector2(.52,.68),
    new THREE.Vector2(.44,-.12),new THREE.Vector2(0,-.6),new THREE.Vector2(-.44,-.12)]);
  const shield = new THREE.ExtrudeGeometry(heraldry,{depth:.12,bevelEnabled:false});
  const transform = new THREE.Object3D();
  function material(color, glow = false) {
    const key = color + glow;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
      color, roughness: .78, metalness: color === gold ? .55 : .15,
      emissive: glow ? color : 0, emissiveIntensity: .8,
    }));
    return materials.get(key);
  }
  function piece(shape, color, x, y, z, w, h, d, tilt = 0, glow = false) {
    const mat = glow || color===gold ? material(color,glow) : material('#ffffff');
    const key = shape.uuid + mat.uuid + parent.uuid;
    if (!batches.has(key)) batches.set(key, { shape, mat, parent, matrices: [], colors: [] });
    transform.position.set(x, y, z);
    transform.scale.set(w, h, d);
    transform.rotation.set(0, 0, tilt);
    transform.updateMatrix();
    const batch=batches.get(key);
    batch.matrices.push(transform.matrix.clone());
    batch.colors.push(mat.color.getHex()===0xffffff ? color : '#ffffff');
  }
  const slab = (...args) => piece(cube, ...args);
  slab(iron, 0, -.45, 0, 29, .7, 37);
  for (let row = 0; row < 12; row++) for (let col = 0; col < 8; col++) {
    slab(['#625e60','#696564','#635f61'][(row*7+col*5)%3], (col-3.5)*3.5, -.085, (row-5.5)*3, 3.47,.16,2.97);
  }
  slab('#382631',0,.01,1,4,.024,33);
  // Each elevation has its own batches so the near wall can be cut away as one piece.
  function elevation(x,z,yaw,halfWidth,bays) {
    parent=new THREE.Group();
    parent.position.set(x,0,z); parent.rotation.y=yaw; scene.add(parent);
    walls.push(parent);
    const stones=['#565353','#625e59','#6b655f','#5c5959'];
    const count=Math.round(halfWidth);
    const width=halfWidth*2/count;
    slab('#353338',0,3.9,-.39,halfWidth*2,7.8,.68);
    for(let row=0;row<13;row++) for(let i=0;i<count;i++) {
      const start=-halfWidth+i*width, stagger=row%2*width*.4;
      const left=start+stagger, right=Math.min(halfWidth,left+width);
      if(i===0 && stagger) slab(stones[row%4],start+stagger/2,.31+row*.6,0,stagger-.035,.566,.2);
      slab(stones[(row*3+i*7+row*i)%4],(left+right)/2,.31+row*.6,0,right-left-.035,.566,.2);
    }
    for(const y of [.36,1.02,6.88,7.7]) slab('#78716a',0,y,.14,halfWidth*2,.14,.38);
    for(const [i,u] of bays.entries()) {
      // Deep lancets, leaded glass, engaged shafts and springing ribs.
      piece(glass,'#292a37',u,2,.16,1.46,1.21,1);
      piece(glass,i%2?'#4a485e':'#49525d',u,2.25,.31,1.13,1.05,1);
      piece(moulding,'#8a8077',u,2,.35,1.45,1.21,1);
      for(const side of [-1,1]) {
        piece(column,'#726d6a',u+side*1.59,2.36,.45,.19,4.72,.2);
        slab('#93877c',u+side*1.59,4.85,.46,.64,.24,.67);
        slab('#928477',u+side*1.59,.36,.46,.72,.54,.8);
        slab('#49434d',u+side*.44,3.85,.49,.065,3.15,.1);
      }
      slab('#78716a',u,1.97,.36,3.55,.21,.85);
      slab('#534b50',u,3.64,.5,2.2,.085,.08);
      if(i%2===0) {
        // Crowned funerary effigies sit entirely outside the fighting floor.
        slab('#403e43',u,.53,.95,1.75,1.06,1.46);
        slab('#7b736d',u,1.12,.95,1.94,.18,1.63);
        piece(column,'#635f62',u,1.81,.96,.41,1.27,.31);
        piece(shard,'#898082',u,2.62,1,.33,.39,.31);
        piece(column,gold,u,2.87,.97,.34,.13,.32);
        piece(shield,'#716963',u,1.94,1.28,.75,.82,1);
      } else {
        slab('#8d7453',u,5.68,.65,2.32,.12,.17);
        for(let strip=0;strip<5;strip++) {
          const h=2.48-(strip*3%4)*.18;
          slab('#692c38',u+(strip-2)*.37,5.58-h/2,.64,.37,h,.1);
        }
        piece(shield,gold,u,4.83,.75,.65,.73,1);
      }
    }
    parent=scene;
  }
  elevation(0,-18.3,0,14.3,[-10,-5,0,5,10]);
  elevation(-14.2,0,Math.PI/2,18,[-14,-7,0,7,14]);
  elevation(14.2,0,-Math.PI/2,18,[-14,-7,0,7,14]);
  elevation(0,18.3,Math.PI,14.3,[-10,-5,5,10]);
  for(const side of [-1,1]) {
    slab('#887350',side*2,.034,1,.065,.018,33);
    for(let i=0;i<15;i++) {
      slab('#61464a',side*1.78,.035,15-i*2.1,.18,.012,.18,0);
    }
    for(const z of [-14,-5,6,14]) {
      const x=side*12.95;
      piece(column,stone,x,.27,z,.64,.54,.64);
      piece(column,'#544a47',x,1,z,.24,1.1,.24);
      piece(column,gold,x,1.57,z,.52,.28,.52);
      piece(shard,'#df9c61',x,1.92,z,.29,.48,.28,0,true);
    }
    for(let i=0;i<10;i++) {
      const z=-16+i*.62, x=side*(2.5+i*.83);
      slab('#534458',x,.045,z,1.1,.026,.09);
      slab('#534458',x+side*.48,.046,z+.29,.08,.028,.67);
      if(i%3===0) piece(shard,'#55445d',x,.52,z,.36,.95,.39,side*.28);
    }
  }
  // The vault is visible from inside; its shell and ribs lift together for overhead views.
  const vault=new THREE.Group(); scene.add(vault);
  parent=vault;
  const profile=pointedOutline(14.2,7.7,12.8);
  const gable=new THREE.ShapeGeometry(new THREE.Shape(profile));
  const gableStone=material('#514f52');
  for(const index of [0,3]) {
    const end=new THREE.Mesh(gable,gableStone);
    end.position.z=.16;
    walls[index].add(end);
  }
  const ceiling=new THREE.MeshStandardMaterial({color:'#535058',roughness:.96,side:THREE.DoubleSide});
  const vertices=[];
  for(let i=1;i<profile.length;i++) {
    const a=profile[i-1], b=profile[i];
    vertices.push(a.x,a.y,-18.4,b.x,b.y,-18.4,b.x,b.y,18.4,
      a.x,a.y,-18.4,b.x,b.y,18.4,a.x,a.y,18.4);
    for(const z of [-17.8,-9,0,9,17.8]) {
      slab('#746e6c',(a.x+b.x)/2,(a.y+b.y)/2-.12,z,
        a.distanceTo(b)+.025,.23,.34,Math.atan2(b.y-a.y,b.x-a.x));
    }
  }
  const vaultGeometry=new THREE.BufferGeometry();
  vaultGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  vaultGeometry.computeVertexNormals(); vault.add(new THREE.Mesh(vaultGeometry,ceiling));
  parent=scene;
  // Chips and short branching joints give the large paving stones a visible grain.
  for(let i=0;i<104;i++) {
    const x=Math.sin(i*78.23)*13.4, z=Math.sin(i*13.7)*17;
    if(Math.abs(x)<2.15) continue;
    slab('#585356',x,.011,z,.32+(i%4)*.13,.012,.032);
    slab('#585356',x+.13,.013,z+.08,.034,.012,.19);
  }
  for(let i=0;i<4;i++) slab(stone,0,.17+i*.33,-14.1-i*.48,9-i*.55,.34,4-i*.3);
  slab(iron,0,2,-15.6,3.8,1.3,2.4);
  slab(wine,0,2.72,-15.45,3.3,.22,2.1);
  slab(stone,0,5,-16.6,3.8,5.3,.65);
  slab(wine,0,5,-16.18,2.8,4.7,.22);
  for(const side of [-1,1]) {
    slab(gold,side*1.78,3.15,-15.6,.34,1.55,2.35);
    piece(shard,gold,side*1.8,6.95,-16.45,.33,1.65,.32,-side*.18);
  }
  piece(shard,'#785991',0,7.42,-16.1,.45,.76,.24,0,true);
  piece(shield,gold,0,5.75,-15.96,1.45,1.4,1);
  piece(shield,'#40343c',0,5.75,-15.8,1.17,1.13,1);
  for(const x of [-.34,0,.34]) piece(shard,gold,x,5.92,-15.62,.12,.32,.07);
  for(const {shape,mat,parent,matrices,colors} of batches.values()) {
    const batch=new THREE.InstancedMesh(shape,mat,matrices.length);
    const tint=new THREE.Color();
    matrices.forEach((matrix,index)=>{
      batch.setMatrixAt(index,matrix);
      batch.setColorAt(index,tint.set(colors[index]));
    });
    parent.add(batch);
  }
  const mesh=(parent,geometry,color,x,y,z,glow=false)=>{
    const item=new THREE.Mesh(geometry,material(color,glow));
    item.position.set(x,y,z); parent.add(item); return item;
  };
  const box=(parent,w,h,d,color,x,y,z,glow=false)=>{
    const item=mesh(parent,cube,color,x,y,z,glow); item.scale.set(w,h,d); return item;
  };
  const round=new THREE.IcosahedronGeometry(1,1);
  const sphere=(parent,r,color,x,y,z,glow=false)=>{
    const item=mesh(parent,round,color,x,y,z,glow); item.scale.setScalar(r); return item;
  };
  const cylinder=(parent,r,h,color,x,y,z)=>{
    const item=mesh(parent,column,color,x,y,z); item.scale.set(r,h,r); return item;
  };
  const localCamera=new THREE.Vector3();
  function updateView(position) {
    const span=Math.min(1,Math.abs(position.x)/14.2);
    vault.visible=position.y<12.8-5.1*Math.sqrt(span)-.45;
    for(const wall of walls) {
      wall.worldToLocal(localCamera.copy(position));
      wall.visible=localCamera.z>1.65;
    }
  }
  return {box,mesh,sphere,cylinder,updateView};
}

export function createCastleLord(scene,{box,mesh,cylinder,sphere}) {
  const king=new THREE.Group(); scene.add(king);
  const gold='#a68a56', armor='#383648';
  for(const s of [-1,1]) {
    box(king,.64,1.4,.83,armor,s*.45,.72,0);
    sphere(king,.64,gold,s*1.05,2.91,0);
    box(king,.48,1,.56,armor,s*1.1,2.3,0);
    sphere(king,.095,'#cd9aff',s*.18,3.84,.49,true);
  }
  box(king,1.65,1.65,1,armor,0,2.18,0);
  box(king,.17,1.3,.13,gold,0,2.26,.52);
  sphere(king,.28,'#9358d0',0,2.7,.59,true);
  box(king,.83,.85,.82,'#726776',0,3.8,0);
  for(const side of [-1,1]) {
    box(king,.29,.075,.17,'#4b444b',side*.2,3.96,.43).rotation.z=side*.17;
    box(king,.29,.21,.26,'#73676a',side*.27,3.57,.34);
    box(king,.36,.26,.38,gold,side*1.1,2.16,.08);
  }
  box(king,.19,.24,.24,'#8c7980',0,3.72,.48);
  box(king,1.48,.14,1.04,'#8d7453',0,1.64,0);
  cylinder(king,.57,.29,gold,0,4.22,0);
  for(let i=0;i<7;i++) {
    const a=i*Math.PI*2/7;
    mesh(king,new THREE.ConeGeometry(.15,i===2?.18:.57,4),gold,.47*Math.sin(a),4.52,.47*Math.cos(a));
  }
  for(let i=-2;i<=2;i++) {
    const h=2.85-Math.abs(i%2)*.38;
    box(king,.44,h,.18,'#721e38',i*.42,3.05-h/2,-.57).rotation.z=i*.065;
  }
  const weapon=new THREE.Group(); king.add(weapon); weapon.position.set(1.13,2,.3);
  box(weapon,.16,.85,.17,gold,0,.13,0);
  box(weapon,.91,.13,.24,gold,0,.57,0);
  const blade=mesh(weapon,new THREE.OctahedronGeometry(1),'#a7a0c4',0,1.93,0);
  blade.scale.set(.29,1.45,.12);
  weapon.rotation.z=-.46;
  king.position.z=-10;
  return {king,weapon};
}
