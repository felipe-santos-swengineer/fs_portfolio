import * as THREE from 'three';

// An original, articulated interpretation of the village monument.
export function createElderDragon(scene) {
  const root=new THREE.Group(),body=new THREE.Group();root.add(body);scene.add(root);
  const scale=new THREE.MeshStandardMaterial({color:'#354c3e',roughness:.8,metalness:.12});
  const plate=new THREE.MeshStandardMaterial({color:'#70806a',roughness:.85});
  const dark=new THREE.MeshStandardMaterial({color:'#202d28',roughness:.9});
  const horn=new THREE.MeshStandardMaterial({color:'#c5b99a',roughness:.8});
  const web=new THREE.MeshStandardMaterial({color:'#583b3c',roughness:.9,side:THREE.DoubleSide,flatShading:true});
  const eye=new THREE.MeshStandardMaterial({color:'#f0ad54',emissive:'#aa3b17',emissiveIntensity:1.3});
  const add=(parent,geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
  const oval=(parent,r,mat,x,y,z,sx,sy,sz)=>{const m=add(parent,new THREE.IcosahedronGeometry(r,1),mat,x,y,z);m.scale.set(sx,sy,sz);return m;};
  const spike=(parent,r,h,mat,x,y,z)=>add(parent,new THREE.ConeGeometry(r,h,6),mat,x,y,z);
  oval(body,1,scale,0,1.15,0,.9,.9,1.55);oval(body,.72,plate,0,.95,.3,.75,.6,1.4);
  const neck=oval(body,.55,scale,0,1.65,.95,.78,1.35,.86);neck.rotation.x=-.35;
  for(let i=0;i<5;i++){const p=oval(body,.35,plate,0,1.1+i*.2,.75+i*.12,1,.3,.7);p.rotation.x=-.3;}
  const head=new THREE.Group();head.position.set(0,1.55,.9);body.add(head);
  oval(head,.55,scale,0,.38,.38,1.1,.85,1.3);oval(head,.42,scale,0,.18,.92,1.1,.56,1.4);
  const jaw=new THREE.Group();jaw.position.set(0,-.02,.42);head.add(jaw);oval(jaw,.39,plate,0,-.08,.45,1.1,.22,1.35);
  const eyeParts=[];
  [-1,1].forEach(side=>{
    const socket=oval(head,.18,dark,side*.42,.44,.52,.9,.65,.75);socket.rotation.z=side*.25;
    const eyeMesh=oval(head,.105,eye,side*.46,.45,.6,.8,.6,.6),pupil=oval(head,.045,dark,side*.49,.45,.66,.3,1,.3);eyeParts.push({mesh:eyeMesh,height:.6},{mesh:pupil,height:1});
    const brow=oval(head,.2,plate,side*.42,.58,.52,1.3,.35,.8);brow.rotation.z=side*.25;
    const h=spike(head,.16,1.1,horn,side*.34,1.05,.08);h.rotation.z=-side*.35;h.rotation.x=-.55;
    for(let j=0;j<3;j++){const h2=spike(head,.09,.5-j*.07,horn,side*(.48+j*.08),.38-j*.13,-.03-j*.08);h2.rotation.z=-side*1.15;}
    oval(head,.07,dark,side*.25,.25,1.42,1,.55,.5);
    for(let j=0;j<3;j++){const fang=spike(head,.055,.22,horn,side*(.2+j*.11),-.03,1.27-j*.16);fang.rotation.z=Math.PI;}
    for(let front=0;front<2;front++){const z=front?.8:-.9,joint=new THREE.Group();joint.position.set(side*.7,.85,z);body.add(joint);oval(joint,.32,scale,0,-.25,0,1,1.5,1);oval(joint,.3,scale,side*.04,-.62,.2,1,.55,1.5);for(let k=-1;k<=1;k++){const claw=spike(joint,.055,.28,horn,side*.04+k*.13,-.67,.52);claw.rotation.x=Math.PI/2;}}
    for(let row=0;row<4;row++)for(let j=0;j<3;j++){const p=oval(body,.17,(row+j)%2?scale:plate,side*(.57+j*.11),1.05+row*.19,.65-j*.42,.7,.5,.85);p.rotation.z=side*.45;}
  });
  for(let i=0;i<10;i++){const p=spike(body,.16-i*.006,.55-i*.025,plate,0,1.93-i*.055,.75-i*.24);p.rotation.x=-.38;}
  const tail=[];let parent=body;for(let i=0;i<7;i++){const joint=new THREE.Group();joint.position.set(0,i?0:1,i?-.38:-1.25);parent.add(joint);const part=add(joint,new THREE.ConeGeometry(.3*(1-i/8),.58,7),scale,0,0,-.23);part.rotation.x=-Math.PI/2;const ridge=spike(joint,.1*(1-i/9),.3,horn,0,.17,-.18);ridge.rotation.x=-.4;tail.push(joint);parent=joint;}
  const tip=spike(parent,.25,.6,plate,0,0,-.65);tip.rotation.x=-Math.PI/2;
  const wings=[-1,1].map(side=>{const pivot=new THREE.Group();pivot.position.set(side*.62,1.62,-.3);body.add(pivot);
    const points=[[0,0,0],[side*1.2,.3,-.45],[side*2.3,.48,-.8],[side*3.7,.35,-1.2],[side*3.2,.05,-.18],[side*2.65,-.18,.15],[side*2.4,-.42,.9],[side*1.7,-.42,.55],[side*1.2,-.55,1.1],[side*.5,-.2,.65]];
    const verts=[];for(let i=1;i<points.length-1;i++)verts.push(...points[0],...points[i],...points[i+1]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.computeVertexNormals();add(pivot,geo,web,0,0,0);
    [1,2,3,5,7,8].forEach(i=>{const end=new THREE.Vector3(...points[i]),rib=add(pivot,new THREE.CylinderGeometry(.025,.07,end.length(),6),scale,end.x/2,end.y/2,end.z/2);rib.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.normalize());});
    return {pivot,side};});
  return {group:root,body,head,jaw,wings,tail,eyes:eye,eyeParts};
}
