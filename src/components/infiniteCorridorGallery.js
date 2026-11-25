import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SEGMENT_LENGTH } from './infiniteCorridorLogic';

// Painted surfaces repeat at the bay boundary. All visits share the same artwork.
function paintedSurface(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  paint(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function polygon(ctx, color, points) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.fill();
}

function paintPavement(c) {
  c.fillStyle = '#282629';
  c.fillRect(0, 0, 576, 896);
  for (let row = 0; row < 16; row++) {
    for (let col = -1; col < 7; col++) {
      const x = col * 96 + (row % 2) * 48, y = row * 56;
      const shade = ['#565250', '#49474b', '#514e50', '#5a5553'][Math.abs(col * 3 + row * 7) % 4];
      polygon(c, shade, [[x+3,y+2],[x+93,y+2],[x+94,y+49],[x+88,y+54],[x+2,y+54]]);
      polygon(c, '#3e3a3b', [[x+19,y+2],[x+31,y+17],[x+25,y+22],[x+44,y+39],[x+28,y+22],[x+34,y+17]]);
    }
  }
  c.fillStyle = '#63282c';
  c.fillRect(186, 0, 204, 896);
  for (const x of [191, 199, 376, 384]) {
    c.fillStyle = '#97784d';
    c.fillRect(x, 0, 2, 896);
  }
  for (let y = 28; y < 896; y += 56) {
    for (const x of [206, 370]) polygon(c, '#a38453', [[x,y-8],[x+3,y],[x,y+8],[x-3,y]]);
    if ((y-28)%224 === 112) {
      polygon(c, '#8a6651', [[288,y-27],[306,y],[288,y+27],[270,y]]);
      polygon(c, '#58272b', [[288,y-19],[300,y],[288,y+19],[276,y]]);
      polygon(c, '#a08058', [[280,y-5],[286,y],[288,y-9],[291,y],[297,y-5],[294,y+6],[282,y+6]]);
    }
  }
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = i % 3 ? '#201a2018' : '#c4b9a520';
    c.fillRect(Math.random()*576, Math.random()*896, Math.random()*8+1, 1);
  }
  for (const [x,y,d] of [[186,152,1],[390,604,-1],[186,796,1]]) {
    polygon(c, '#4a4748', [[x,y],[x+23*d,y+8],[x+6*d,y+7],[x+12*d,y+15],[x,y+11]]);
  }
}

function paintPortrait(c) {
  const light = c.createRadialGradient(53,65,3,64,86,115);
  light.addColorStop(0,'#706052'); light.addColorStop(1,'#1b191e');
  c.fillStyle = light; c.fillRect(0,0,128,176);
  polygon(c,'#29232a',[[4,176],[19,122],[46,104],[39,74],[46,44],[73,36],[86,57],[83,98],[108,117],[126,176]]);
  polygon(c,'#816658',[[48,58],[72,51],[79,65],[72,89],[61,97],[51,84]]);
  polygon(c,'#483b39',[[65,55],[77,52],[80,69],[72,89],[61,97],[67,77]]);
  polygon(c,'#a28757',[[43,57],[36,29],[51,40],[57,21],[66,37],[80,23],[78,48]]);
  polygon(c,'#6c4545',[[48,100],[63,118],[78,98],[96,109],[80,172],[28,176]]);
  polygon(c,'#aa9063',[[47,103],[63,121],[81,101],[64,127]]);
  c.fillStyle='#b4a48a'; c.fillRect(54,68,4,1);
  polygon(c,'#352e2d',[[97,0],[84,37],[89,43],[77,72],[87,43],[82,37]]);
  for(let i=0;i<900;i++) {
    c.fillStyle='#ccae821c'; c.fillRect(Math.random()*128,Math.random()*176,1,2);
  }
}

export function createCorridorGallery() {
  const floorMap = paintedSurface(576,896,paintPavement);
  const portraitMap = paintedSurface(128,176,paintPortrait);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9,SEGMENT_LENGTH),
    new THREE.MeshStandardMaterial({map:floorMap, roughness:.78}));
  floor.rotation.x = -Math.PI/2;
  floor.position.y = .073;

  // Build one inward-facing gallery in local coordinates. +Z faces the aisle.
  const parts = [];
  const stone = '#57534e', ash = '#71695e', iron = '#302d32', brass = '#a68a56';
  function carve(geometry, color, x,y,z, sx=1,sy=1,sz=1, angle=0) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    g.scale(sx,sy,sz); g.rotateZ(angle); g.translate(x,y,z);
    g.deleteAttribute('uv');
    const rgb = new THREE.Color(color);
    const colors = new Float32Array(g.attributes.position.count*3);
    for(let i=0;i<colors.length;i+=3) rgb.toArray(colors,i);
    g.setAttribute('color',new THREE.BufferAttribute(colors,3)); parts.push(g);
  }
  const block = (x,y,z,w,h,d,color,angle=0) => carve(new THREE.BoxGeometry(w,h,d),color,x,y,z,1,1,1,angle);
  const shaft = (x,y,z,top,bottom,h,color) => carve(new THREE.CylinderGeometry(top,bottom,h,8),color,x,y,z);
  function arch(x,y,z,r,rise,thickness,depth,color) {
    const s = new THREE.Shape();
    s.moveTo(-r,0); s.quadraticCurveTo(-r,rise*.54,0,rise);
    s.quadraticCurveTo(r,rise*.54,r,0); s.lineTo(r-thickness,0);
    s.quadraticCurveTo(r-thickness,rise*.49,0,rise-thickness*1.3);
    s.quadraticCurveTo(-r+thickness,rise*.49,-r+thickness,0); s.closePath();
    carve(new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:8}),color,x,y,z);
  }
  block(0,3.55,-.25,14,7.1,.5,'#39373d');
  for(let row=0;row<10;row++) {
    for(let col=-1;col<7;col++) {
      const left=Math.max(-7,-7+col*2+row%2), right=Math.min(7,-5+col*2+row%2);
      if(right>left) block((left+right)/2,row*.7+.35,0,right-left-.022,.677,.07,
        ['#484549','#504b4b','#49464a'][Math.abs(row+col)%3]);
    }
  }
  for(const y of [.24,1.02,5.96,6.95]) block(0,y,.09,14,.13,.22,stone);
  for(const x of [-3.5,3.5]) {
    for(const dx of [-.22,0,.22]) shaft(x+dx,2.93,.23,.16,.19,5.4,stone);
    shaft(x,.3,.23,.41,.48,.48,ash);
    shaft(x,5.68,.23,.52,.27,.45,ash);
    shaft(x,5.95,.23,.52,.5,.13,stone);
    // Transverse ribs spring above the highest corridor camera position.
    for(let i=0;i<12;i++) {
      const t=i/12, u=(i+1)/12;
      const z=.24+4.16*t*t, endZ=.24+4.16*u*u;
      const y=6+2.25*t, endY=6+2.25*u;
      const rib=new THREE.BoxGeometry(.29,Math.hypot(endZ-z,endY-y)+.012,.32);
      rib.rotateX(Math.atan2(endZ-z,endY-y));
      carve(rib,i%4===0?ash:stone,x,(y+endY)/2,(z+endZ)/2);
    }
  }
  // Blind door, barred lancets and a seated effigy occupy successive recesses.
  for(const x of [-5.25,-1.75,1.75,5.25]) {
    block(x,2.98,.085,2.12,3.76,.09,'#25232a');
    arch(x,4.78,.11,1.14,1.43,.15,.14,ash);
    for(const dx of [-1.06,1.06]) block(x+dx,2.96,.18,.16,3.68,.15,stone);
    block(x,1.13,.19,2.36,.16,.24,ash);
  }
  for(let i=-3;i<=3;i++) block(-5.25+i*.25,2.87,.16,.23,3.35,.09,'#49372f');
  for(const y of [1.78,3.87]) {
    block(-5.25,y,.23,1.84,.14,.07,iron);
    for(const dx of [-.73,0,.73]) shaft(-5.25+dx,y,.275,.036,.036,.065,brass);
  }
  for(const dx of [-.66,0,.66]) {
    block(1.75+dx,3.08,.18,.066,3.7,.08,iron);
    arch(1.75+dx,4.42,.17,.33,.64,.055,.08,ash);
  }
  block(1.75,3,.18,2,.07,.07,iron);
  shaft(5.25,1.46,.34,.48,.55,.54,ash);
  carve(new THREE.CylinderGeometry(.26,.49,1.38,9),stone,5.25,2.42,.32,1,1,.74);
  carve(new THREE.IcosahedronGeometry(.36,1),ash,5.25,3.31,.33,.91,1.28,.84);
  carve(new THREE.IcosahedronGeometry(.23,1),'#39353a',5.25,3.3,.52,.8,1,.43);
  block(5.25,2.46,.58,.075,1.02,.08,iron);
  block(5.25,2.77,.58,.51,.07,.08,brass);
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(1.45,2),
    new THREE.MeshStandardMaterial({map:portraitMap, roughness:.88}));
  portrait.position.set(-1.75,3.15,.21);
  for(const dx of [-.78,.78]) block(-1.75+dx,3.15,.23,.12,2.24,.13,brass);
  for(const y of [2.09,4.21]) block(-1.75,y,.23,1.66,.12,.13,brass);

  for(const dx of [-.21,0,.21]) {
    const y=2.4-Math.abs(dx);
    block(.1+dx,y,.34,.085,.36,.085,'#c4b9a5');
    carve(new THREE.OctahedronGeometry(.078),'#ffbf76',.1+dx,y+.24,.34,.68,1.52,.68);
  }
  block(.1,2.02,.25,.65,.08,.35,brass);
  const shell = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({vertexColors:true,roughness:.87}));
  parts.forEach(g=>g.dispose());
  const template = new THREE.Group(); template.add(shell,portrait);
  const dustGeometry = new THREE.BufferGeometry();
  const motes = [];
  for (let i = 0; i < 26; i++) {
    motes.push((Math.random()-.5)*7.8, .4+Math.random()*4.6, (Math.random()-.5)*13);
  }
  dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(motes,3));
  const dust = new THREE.Points(dustGeometry,new THREE.PointsMaterial({
    color:'#c4b9a5',size:.025,transparent:true,opacity:.38,depthWrite:false,
  }));
  const resources = [shell,portrait,floor,dust];
  for(const item of resources) item.userData.galleryShared=true;
  return {
    add(group,index,registerWall) {
      const driftingDust = dust.clone();
      group.add(floor.clone(), driftingDust);
      for(const side of [-1,1]) {
        const wall=template.clone();
        wall.position.x=side*4.4; wall.rotation.y=-side*Math.PI/2;
        group.add(wall); registerWall(wall,new THREE.Vector3(0,0,-1),index);
      }
      return driftingDust;
    },
    dispose() {
      resources.forEach(item=>{item.geometry.dispose(); item.material.dispose();});
      floorMap.dispose(); portraitMap.dispose();
    },
  };
}
