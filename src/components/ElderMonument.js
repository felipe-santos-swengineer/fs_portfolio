import * as THREE from 'three';

// The monument establishes a silhouette that can be reused for the future encounter:
// swept horns, a crown of dorsal spines, four limbs and deeply notched wings.
export function createElderMonument(scene, {box, sphere, cylinder, mesh}) {
  const root=new THREE.Group();root.position.set(0,0,2);scene.add(root);
  const stone='#666b5e',light='#939583',dark='#39463f',edge='#b8ad8e',scar='#313b35';
  cylinder(root,3.25,.45,dark,0,.23,0,12);cylinder(root,2.85,.3,light,0,.6,0,12);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const block=box(root,1.3,.36,.16,i%2?stone:dark,Math.sin(a)*3.13,.26,Math.cos(a)*3.13);block.rotation.y=a;}
  const glow=new THREE.PointLight('#e78c45',4,9);glow.position.set(0,4.9,2.2);root.add(glow);
  const ring=mesh(root,new THREE.TorusGeometry(2.45,.06,6,48),edge,0,.78,0);ring.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const rune=box(root,.16,.035,.45,'#c1ad80',Math.sin(a)*2.45,.8,Math.cos(a)*2.45);rune.rotation.y=a;}
  const dragon=new THREE.Group();dragon.position.y=.8;root.add(dragon);
  const mass=(r,c,x,y,z,sx,sy,sz)=>{const m=sphere(dragon,r,c,x,y,z);m.scale.set(sx,sy,sz);return m;};
  mass(1,stone,0,2.1,0,1.25,1.35,1.6);mass(.8,light,0,2.2,.95,1.05,1.2,.65);
  // Neck and face lean over the offerings, with a long snout and inset eyes.
  mass(.85,stone,0,3.35,.65,.8,1.5,.85);mass(.75,stone,0,4.65,1.15,1, .8,1.25);
  mass(.62,light,0,4.35,1.9,1,.55,1.2);
  // A deep mouth, uneven fangs and a plated jaw give the stone face a predatory profile.
  mass(.65,scar,0,4.04,1.88,.95,.24,1.02);mass(.6,stone,0,3.91,1.85,.95,.24,1.1);
  for(let j=0;j<4;j++)[-1,1].forEach(side=>{const tooth=mesh(dragon,new THREE.ConeGeometry(.075,.24+(j%2)*.07,5),edge,side*(.17+j*.105),4.07,2.37-j*.11);tooth.rotation.z=Math.PI;});
  [-1,1].forEach(side=>{mass(.1,scar,side*.32,4.51,2.43,1,.55,.6);const ridge=box(dragon,.17,.15,.85,dark,side*.45,4.55,2.02);ridge.rotation.y=side*.2;});
  // Overlapping breastplates and carved seams distinguish the statue from smooth rock.
  for(let j=0;j<5;j++){const plate=mass(.6,j%2?light:stone,0,1.48+j*.43,1.08-j*.02,1.18-j*.07,.42,.46);plate.rotation.x=-.12;box(dragon,.8-j*.08,.045,.05,dark,0,1.37+j*.43,1.35-j*.025);}
  for(let row=0;row<5;row++)[-1,1].forEach(side=>{for(let j=0;j<3;j++){const scale=mass(.18,(row+j)%2?light:dark,side*(.65+j*.18),1.5+row*.37,.72-j*.22,.8,.65,.38);scale.rotation.z=side*.4;}});
  [-1,1].forEach(side=>{
    mass(.2,scar,side*.55,4.77,1.66,1,.72,.55);const eye=mass(.12,'#edaa56',side*.56,4.78,1.74,1,.48,.5);eye.material.emissive=new THREE.Color('#b24c1e');eye.material.emissiveIntensity=1.1;mass(.045,'#1d2420',side*.56,4.79,1.8,.35,1.1,.45);
    const brow=box(dragon,.55,.18,.24,dark,side*.5,4.95,1.6);brow.rotation.z=side*.22;
    const horn=mesh(dragon,new THREE.ConeGeometry(.24,1.55,7),light,side*.65,5.48,.85);horn.rotation.z=-side*.55;horn.rotation.x=-.45;
    const horn2=mesh(dragon,new THREE.ConeGeometry(.15,.85,6),edge,side*.86,5.03,.5);horn2.rotation.z=-side*.95;
    for(let j=0;j<3;j++){const hornlet=mesh(dragon,new THREE.ConeGeometry(.12,.62-j*.1,6),light,side*(.72+j*.16),4.62-j*.18,.7-j*.15);hornlet.rotation.z=-side*(1+j*.12);hornlet.rotation.x=-.4;}
    mass(.5,dark,side*1.02,2.15,-.15,1.25,1.05,1);mass(.48,stone,side*.95,1.35,.45,1,1.1,1);mass(.42,stone,side*1.05,.53,1.15,1,.55,1.3);
    for(let j=0;j<3;j++){const armor=mass(.22,light,side*(1.02+j*.07),1.83-j*.3,.65,1,.55,.55);armor.rotation.z=side*.3;}
    mass(.42,dark,side*.95,1.1,-1.05,1.1,1,1);mass(.38,stone,side*1.08,.48,-.95,1.1,.6,1.2);
    for(let j=-1;j<=1;j++){const rear=mesh(dragon,new THREE.ConeGeometry(.08,.25,5),edge,side*1.08+j*.15,.4,-.57);rear.rotation.x=Math.PI/2;}
    for(let j=-1;j<=1;j++){const claw=mesh(dragon,new THREE.ConeGeometry(.1,.35,5),edge,side*1.05+j*.2,.48,1.58);claw.rotation.x=Math.PI/2;}
    // Carved wing membrane and raised finger bones form a distinct angular silhouette.
    const points=[[side*.8,3.1,-.35],[side*2.05,4.7,-.65],[side*4.8,4.65,-1.15],[side*3.35,3.35,-.9],[side*4.25,2.25,-1.3],[side*2.6,2.75,-.95],[side*2.45,1.55,-1.25],[side*.9,1.9,-.6]];
    const geometry=new THREE.BufferGeometry(),v=[];for(let j=1;j<points.length-1;j++)v.push(...points[0],...points[j],...points[j+1]);geometry.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geometry.computeVertexNormals();
    mesh(dragon,geometry,dark,0,0,0).material.side=THREE.DoubleSide;
    const rib=(a,b)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),dir=end.clone().sub(start),bone=mesh(dragon,new THREE.CylinderGeometry(.07,.12,dir.length(),6),light,...start.clone().add(end).multiplyScalar(.5).toArray());bone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());};
    [2,4,6].forEach(j=>rib(points[0],points[j]));rib(points[0],points[1]);rib(points[1],points[2]);
    [2,4,6].forEach(j=>{const p=points[j],talon=mesh(dragon,new THREE.ConeGeometry(.13,.55,6),edge,p[0],p[1]-.2,p[2]);talon.rotation.z=side*.55;});
    for(let j=0;j<3;j++){const crack=box(dragon,.035,.6,.025,scar,side*(2.15+j*.43),3.25-j*.22,-.77-j*.1);crack.rotation.z=side*(.55+j*.15);}
  });
  for(let i=0;i<9;i++){const spike=mesh(dragon,new THREE.ConeGeometry(.26-i*.015,.85-i*.065,6),i%2?light:edge,0,3.65-i*.24,-.48-i*.31);spike.rotation.x=-.5;}
  for(let i=0;i<7;i++){const t=i/6,x=-Math.sin(t*2.1)*2.1,z=-1.3-t*1.65;mass(.52*(1-t*.65),stone,x,.55+t*.18,z,1,.7,1.2);}
  for(let i=0;i<5;i++){const t=i/5,spike=mesh(dragon,new THREE.ConeGeometry(.12,.4-t*.2,5),edge,-Math.sin(t*2.1)*2.1,.98,-1.3-t*1.65);spike.rotation.z=.35;}
  const tailTip=mesh(dragon,new THREE.ConeGeometry(.33,.9,5),light,-2.0,.75,-3.15);tailTip.rotation.z=-1.2;
  return root;
}
