import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { allowRunAndRotate } from './runAndRotate';
import { facePlayer } from './facePlayer';
import { X } from 'lucide-react';
import { addFaceDetails, createAdventurer } from './VillageScene';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import MapControlGuide from './MapControlGuide';
import dialogue from './templeDialogue.json';
import { createElderMonument } from './ElderMonument';
import './Lake.css';

const HOUSES = [[-18,-2],[-24,5],[-18,14],[-25,20],[-14,24],[18,-2],[24,5],[18,14],[25,20],[14,24],[-25,-21],[25,-21]];
const NAMES = ['Aruã', 'Jaci', 'Potira', 'Cauã', 'Tupã', 'Iara', 'Ubiratan', 'Araci', 'Apoena', 'Moema', 'Ceci', 'Tainá', 'Yara', 'Abaré'];
const PEOPLE = [
  {x:-4,z:9, route:[[-4,9],[-10,9],[-10,19],[-4,19]], pt:'Bem-vindo à nossa aldeia. O templo guarda histórias muito antigas.', en:'Welcome to our village. The temple holds ancient stories.'},
  {x:5,z:19, route:[[5,19],[10,19],[10,9],[5,9]], pt:'As estradas ligam nossas casas à praça e ao templo.', en:'The roads connect our homes to the square and the temple.'},
  {x:-10,z:-5, route:[[-10,-5],[-4,-5],[-4,9],[-10,9]], pt:'Cuidamos das pedras antigas para que suas histórias permaneçam vivas.', en:'We care for the old stones so their stories can live on.'},
  {x:10,z:9, guard:'spear', route:[[10,9],[10,-5],[4,-5],[4,9]], pt:'Pode explorar à vontade. A passagem para as ruínas fica ao sul.', en:'Explore freely. The passage to the ruins is to the south.'},
  {x:4,z:-10, guard:'bow', route:[[4,-10],[4,-5],[-4,-5],[-4,-10]], pt:'Há muitas gerações nossa comunidade vive perto deste templo.', en:'Our community has lived near this temple for generations.'},
  {x:-8,z:18, female:true, guard:'spear', route:[[-8,18],[-4,19],[-4,9],[-10,9]]},
  {x:8,z:18, route:[[8,18],[10,9],[4,9],[4,18]]},
  {x:-8,z:7, female:true, route:[[-8,7],[-10,-5],[-4,-5],[-4,7]]},
  {x:8,z:-5, guard:'bow', route:[[8,-5],[4,-5],[4,9],[10,9]]},
  {x:0,z:13, female:true, route:[[0,13],[0,8],[4,9],[4,17]]},
  {x:-3,z:15, child:true, female:true, route:[[-3,15],[-5,17],[-3,19],[-1,17]]},
  {x:3,z:14, child:true, route:[[3,14],[5,16],[3,18],[1,16]]},
  {x:-6,z:3, child:true, female:true, route:[[-6,3],[-9,3],[-9,7],[-6,7]]},
  {x:4.5,z:-15.3, elder:true, route:[[4.5,-15.3],[4.5,-15.3]]},
];

export default function TempleVillage({language, paused, reduceMotion, onExit,onSpeak,onStop,speaking,voiceEnabled,voiceNotice,onEnterCave,startNearCave=false}) {
  const mount=useRef(null), keys=useRef(new Set()), state=useRef({}), talkRef=useRef(null), signsRef=useRef([]), dialoguePanel=useRef(null), initialNearCave=useRef(startNearCave);
  state.current={...state.current,paused,reduceMotion,onExit,onEnterCave,language};
  const [near,setNear]=useState(-1), [nearExit,setNearExit]=useState(false), [nearCave,setNearCave]=useState(false), [talk,setTalk]=useState(null), [error,setError]=useState(false);
  const en=language==='en-US';
  useEffect(()=>{signsRef.current.forEach(sign=>sign(language));},[language]);
  useEffect(()=>{if(talk!==null)dialoguePanel.current?.focus();},[talk]);
  const close=()=>{onStop?.();talkRef.current=null;setTalk(null);mount.current?.querySelector('canvas')?.focus();};
  const interact=()=>{if(state.current.paused || talkRef.current!==null)return; if(state.current.nearExit){keys.current.clear();state.current.onExit();return;} if(state.current.nearCave){keys.current.clear();state.current.onEnterCave?.();return;} const i=state.current.near; if(i>=0){keys.current.clear();talkRef.current=i;setTalk(i);onSpeak?.(i);}};
  const actions=useRef({});actions.current={interact,close};
  useEffect(()=>{
    const el=mount.current;let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Ancient temple village / Aldeia do templo antigo');el.appendChild(renderer.domElement);renderer.domElement.focus();
    const scene=new THREE.Scene();scene.background=new THREE.Color('#172d2c');scene.fog=new THREE.Fog('#172d2c',32,85);
    scene.add(new THREE.HemisphereLight('#698580','#30392d',.8));const sun=new THREE.DirectionalLight('#9db7aa',.75);sun.position.set(-15,30,12);scene.add(sun);
    const camera=new THREE.PerspectiveCamera(48,1,.1,180);
    // A continuous painted horizon surrounds the playable area without affecting navigation.
    const skyCanvas=document.createElement('canvas');skyCanvas.width=2048;skyCanvas.height=512;
    const skyContext=skyCanvas.getContext('2d'),skyGradient=skyContext.createLinearGradient(0,0,0,512);
    skyGradient.addColorStop(0,'#101b27');skyGradient.addColorStop(.52,'#304640');skyGradient.addColorStop(1,'#697363');
    skyContext.fillStyle=skyGradient;skyContext.fillRect(0,0,2048,512);
    for(let i=0;i<80;i++){const x=(i*719)%2048,y=22+(i*113)%210;skyContext.fillStyle=i%5?'rgba(224,228,203,.28)':'rgba(244,226,184,.55)';skyContext.fillRect(x,y,i%5?1.5:2.5,i%5?1.5:2.5);}
    const moonGlow=skyContext.createRadialGradient(1580,100,5,1580,100,105);moonGlow.addColorStop(0,'rgba(225,221,184,.38)');moonGlow.addColorStop(1,'rgba(225,221,184,0)');skyContext.fillStyle=moonGlow;skyContext.fillRect(1475,0,210,210);skyContext.fillStyle='#c9cbb3';skyContext.beginPath();skyContext.arc(1580,100,20,0,Math.PI*2);skyContext.fill();
    const ridge=(base,height,color,phase)=>{skyContext.fillStyle=color;skyContext.beginPath();skyContext.moveTo(0,512);for(let x=0;x<=2048;x+=4){const a=x/2048*Math.PI*2;const y=base-height*(.5+.5*Math.sin(a*3+phase))-.35*height*Math.abs(Math.sin(a*7-phase));skyContext.lineTo(x,y);}skyContext.lineTo(2048,512);skyContext.closePath();skyContext.fill();};
    ridge(378,95,'#596b60',.3);ridge(420,82,'#3c554a',1.7);ridge(465,58,'#293f36',.9);
    const horizonTexture=new THREE.CanvasTexture(skyCanvas);horizonTexture.colorSpace=THREE.SRGBColorSpace;
    const horizon=new THREE.Mesh(new THREE.CylinderGeometry(82,82,85,64,1,true),new THREE.MeshBasicMaterial({map:horizonTexture,side:THREE.BackSide,depthWrite:false,fog:false}));horizon.position.y=20;horizon.renderOrder=-10;horizon.frustumCulled=false;scene.add(horizon);
    const add=(parent,geometry,color,x,y,z)=>{const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.93}));m.position.set(x,y,z);parent.add(m);return m;};
    const box=(p,w,h,d,c,x,y,z)=>add(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);
    const sphere=(p,r,c,x,y,z)=>add(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z);
    const cylinder=(p,r,h,c,x,y,z,segments=8)=>add(p,new THREE.CylinderGeometry(r,r,h,segments),c,x,y,z);
    const mesh=(p,g,c,x,y,z)=>add(p,g,c,x,y,z);
    const ground=add(scene,new THREE.PlaneGeometry(100,100),'#798b60',0,-.08,0);ground.rotation.x=-Math.PI/2;
    // Irregular curved paths leave clear plots for the houses and join the sacred precinct.
    const road=(points,width)=>{const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,.025,z))),vertices=[],indices=[],steps=100;
      for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),v=curve.getTangent(t),w=width*(1+.08*Math.sin(t*17));vertices.push(p.x-v.z*w/2,.025,p.z+v.x*w/2,p.x+v.z*w/2,.025,p.z-v.x*w/2);if(i<steps){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();scene.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#ad9067',roughness:1,side:THREE.DoubleSide})));
      for(let i=1;i<steps;i+=4){const p=curve.getPoint(i/steps),pebble=sphere(scene,.07+(i%3)*.025,'#c0a780',p.x+Math.sin(i*4)*width*.3,.055,p.z+Math.cos(i*3)*width*.3);pebble.scale.y=.25;}};
    road([[0,31],[-1,24],[1,17],[-1,9],[-5,5],[-5,-1],[-3,-7],[0,-17]],4);
    road([[0,9],[5,6],[5,0],[2,-6]],3.5);
    road([[-15,18],[-11,18],[-6,19],[0,17],[6,19],[11,18],[15,18]],3.2);
    road([[-15,6],[-10,8],[-5,9],[0,8],[6,10],[11,8],[15,6]],3.2);
    road([[-15,-7],[-10,-5],[-5,-6],[0,-7],[5,-5],[10,-6],[15,-8]],3.2);
    road([[-10,18],[-11,14],[-10,8],[-11,1],[-10,-5]],2.5);
    road([[10,18],[11,14],[10,8],[11,2],[10,-6]],2.5);
    // The old passage opens onto the road at the edge of the village.
    box(scene,2,5,2,'#777e69',-3.4,2.5,30.5);box(scene,2,5,2,'#777e69',3.4,2.5,30.5);
    box(scene,8.8,1.2,2.2,'#969981',0,5.4,30.5);box(scene,4.8,4.8,.25,'#26332e',0,2.4,31.3);
    // The temple is built into the face of the Elder's mountain.
    for(let i=0;i<11;i++){const x=(i-5)*3.4,rock=sphere(scene,3.5+(i%3)*.7,'#48564b',x,5+(i%3)*.7,-29);rock.scale.set(1.2,2.4,1.1);}
    // Broad steps and weathered stone columns mark the old temple at the end of the road.
    for(let i=0;i<4;i++)box(scene,16-i*1.1,.42,11-i*.7,['#918c73','#a49b80'][i%2],0,.21+i*.42,-22);
    box(scene,11,6,7,'#928b72',0,4.6,-23.1);box(scene,13,.65,8,'#b2a98e',0,7.8,-23.1);
    box(scene,11.5,.5,7.5,'#827d68',0,8.4,-23.1);
    box(scene,4.4,5.6,.18,'#101a19',0,4.1,-19.5);
    mesh(scene,new THREE.TorusGeometry(2.25,.25,8,30,Math.PI),'#b1a58a',0,4.75,-19.32);
    [-2.25,2.25].forEach(x=>box(scene,.45,3.5,.45,'#a79e84',x,2.98,-19.32));
    [-4.5,-2.8,2.8,4.5].forEach(x=>{cylinder(scene,.46,5.3,'#b1a990',x,4.25,-19.2,10);box(scene,1.15,.4,1.15,'#c3b99b',x,6.95,-19.2);});
    [-1,1].forEach(s=>{box(scene,2,2.8,1.1,'#787e67',s*8,1.4,-18);sphere(scene,.5,'#667d58',s*8,2.85,-18).scale.set(1.7,.4,1);});
    HOUSES.forEach(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=z<0?0:Math.PI;scene.add(g);
      const style=i%3;g.scale.set(style===1?.82:style===2?1.08:1,style===1?.84:1,style===2?.85:1);
      if(style===1){cylinder(g,2.15,2.8,'#b4a183',0,1.4,0,10);cylinder(g,2.3,.3,'#867964',0,.15,0,10);}else{box(g,5,3.3,4,style===2?'#a99577':'#b3a082',0,1.65,0);box(g,5.4,.35,4.4,'#867964',0,.18,0);}
      const roof=add(g,new THREE.ConeGeometry(style===1?2.8:4,style===2?1.7:2.5,style===1?10:4),i%2?'#796b50':'#8b7858',0,4.55,0);roof.rotation.y=style===1?0:Math.PI/4;
      box(g,1.1,2,.12,'#554b3c',0,1,2.06);[-1.6,1.6].forEach(a=>box(g,.65,.65,.13,'#4f5747',a,2,2.07));
      box(g,.25,3.3,.25,'#776b54',-2.35,1.65,2.08);box(g,.25,3.3,.25,'#776b54',2.35,1.65,2.08);
      box(g,4.5,.12,.14,'#665d4c',0,3.25,2.09);
      for(let j=-2;j<=2;j++)box(g,.07,1.3,.08,'#aa9771',j*.72,3.9,2.4-Math.abs(j)*.35);
      const step=box(g,1.6,.18,.8,'#a99a7d',0,.09,2.4);step.rotation.y=.02;
      if(i%3===0){box(g,1,.35,1,'#817e67',2.8,.18,1);box(g,.75,.35,.7,'#9b967b',3.1,.5,.9);}
    });
    // Remnants, vegetation and small domestic details give the settlement age.
    [[-10,-16],[11,-15],[-25,10],[26,9],[-9,24],[9,24]].forEach(([x,z],i)=>{cylinder(scene,.48,1.4+(i%3)*.5,'#99977f',x,.7+(i%3)*.25,z);box(scene,1.2,.3,1.2,'#aaa58b',x,1.45+(i%3)*.5,z);});
    for(let i=0;i<38;i++){const angle=i*2.4,r=32+(i%4)*2,x=Math.cos(angle)*r,z=Math.sin(angle)*r;const tree=new THREE.Group();tree.position.set(x,0,z);scene.add(tree);cylinder(tree,.32,3.2,'#705c45',0,1.6,0);for(let j=0;j<3;j++){const crown=sphere(tree,1.35+(j%2)*.3,['#557951','#66895a','#486e4b'][(i+j)%3],(j-1)*.9,3.5+j*.3,(j%2)*.55);crown.scale.set(1.2,1,1.1);}tree.rotation.y=i; }
    // Broken masonry, climbing moss and a small forecourt frame the temple.
    for(let i=0;i<9;i++){box(scene,.8,.28,.5,i%2?'#96947d':'#b0a88b',-5+i*1.25,.16,-15.7+(i%2)*.3);}
    [-1,1].forEach(side=>{for(let j=0;j<3;j++){const vine=sphere(scene,.3,'#6b8059',side*(5.3+j*.12),2.2+j*1.3,-19.45);vine.scale.set(.8,2,.4);}box(scene,1.4,.25,1.4,'#aaa58b',side*7,1.8,-16);});
    // The Elder's likeness dominates a central altar, visible from the village entrance.
    createElderMonument(scene,{box,sphere,cylinder,mesh});
    // Two smaller sanctuaries and separate ritual circles flank the main avenue.
    const sanctuaries=[[-22,-12],[22,-12]];
    sanctuaries.forEach(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
      cylinder(g,4,.35,'#97927c',0,.18,0,10);cylinder(g,3.4,.3,'#afa68a',0,.5,0,10);
      for(let j=0;j<6;j++){const a=j*Math.PI/3;const col=cylinder(g,.28,2.8,'#b1a98c',Math.cos(a)*2.6,1.9,Math.sin(a)*2.6,8);col.rotation.z=j===2&&i===0?.12:0;}
      const roof=add(g,new THREE.ConeGeometry(3.5,1.35,i===0?6:8),i===0?'#807f69':'#9b8b6d',0,3.9,0);roof.rotation.y=.3;
      cylinder(g,.65,.55,'#7e806b',0,.9,0,8);const flame=sphere(g,.22,'#e3ad66',0,1.35,0);flame.material.emissive=new THREE.Color('#bd7638');flame.material.emissiveIntensity=.7;
    });
    [[-20,26],[20,26]].forEach(([x,z],i)=>{const ring=mesh(scene,new THREE.TorusGeometry(2.5,.12,7,40),'#a59c80',x,.07,z);ring.rotation.x=Math.PI/2;
      for(let j=0;j<7;j++){const a=j*Math.PI*2/7;const stone=sphere(scene,.35,j%2?'#8e927b':'#b2a78b',x+Math.cos(a)*2.4,.25,z+Math.sin(a)*2.4);stone.scale.set(1,.65,1);}
      cylinder(scene,.7,.3,'#716e5b',x,.16,z,8);const ember=sphere(scene,.25,i?'#dfa85c':'#b8c69a',x,.45,z);ember.material.emissive=new THREE.Color(i?'#a75e26':'#63804a');ember.material.emissiveIntensity=.6;
    });
    // A timber palisade encloses the settlement while leaving the stone passage visible.
    const stake=(x,z)=>{const post=mesh(scene,new THREE.CylinderGeometry(.13,.2,3.4,6),'#5b4935',x,1.7,z);post.rotation.z=Math.sin(x*3+z)*.035;mesh(scene,new THREE.ConeGeometry(.16,.42,6),'#6c573d',x,3.6,z);};
    for(let n=-30;n<=30;n+=.9){stake(-31,n);stake(31,n);if(Math.abs(n)>5)stake(n,31);if(Math.abs(n)>8)stake(n,-29);}
    [-1,1].forEach(side=>{box(scene,.2,.22,60,'#756049',side*31,1.25,0);box(scene,22,.22,.2,'#756049',side*19,1.25,31);});
    // Towers stand against the perimeter, away from homes and paths.
    [[-29,-3],[29,-3]].forEach(([x,z],index)=>{const tower=new THREE.Group();tower.position.set(x,0,z);scene.add(tower);
      [-1,1].forEach(a=>[-1,1].forEach(b=>cylinder(tower,.16,6,'#69523b',a*1.15,3,b*1.15,7)));
      box(tower,3,.35,3,'#80674b',0,4.5,0);[-1,1].forEach(a=>{box(tower,.12,.85,2.8,'#725b42',a*1.3,5.1,0);box(tower,2.8,.85,.12,'#725b42',0,5.1,a*1.3);});
      const roof=mesh(tower,new THREE.ConeGeometry(2.45,1.6,4),'#67513b',0,7.3,0);roof.rotation.y=Math.PI/4;
      box(tower,.1,3,.1,'#ac9672',1.35,2,1.35);for(let j=0;j<5;j++)box(tower,.8,.09,.12,'#ac9672',1.35,1+j*.48,1.38);
      const flag=box(tower,1,.65,.06,index?'#a2674c':'#b38d55',0,6.2,1.32);flag.rotation.z=index?.1:-.1;
    });
    const fires=[];
    const fire=(x,z,camp=false)=>{const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
      if(camp){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const rock=sphere(group,.25,'#8e8b76',Math.cos(a)*.72,.14,Math.sin(a)*.72);rock.scale.y=.6;}for(let i=0;i<3;i++){const log=box(group,1.2,.16,.18,'#5a4130',0,.18,0);log.rotation.y=i*Math.PI/3;}}
      else{cylinder(group,.09,2.2,'#624930',0,1.1,0);cylinder(group,.2,.2,'#4a3b2c',0,2.2,0);}
      const flame=mesh(group,new THREE.ConeGeometry(camp?.32:.2,camp?.8:.55,7),'#ed9b48',0,camp?.58:2.55,0);flame.material.emissive=new THREE.Color('#d16524');flame.material.emissiveIntensity=1.4;
      const core=mesh(group,new THREE.ConeGeometry(camp?.16:.1,camp?.5:.32,7),'#ffdf8b',0,camp?.5:2.5,.04);core.material.emissive=new THREE.Color('#e8a64b');core.material.emissiveIntensity=1;
      const light=new THREE.PointLight('#ff9c50',camp?12:7,camp?11:8);light.position.set(0,camp?1:2.5,0);group.add(light);fires.push({flame,core,light,phase:x+z});};
    [[-5,24],[5,24],[-6,13],[6,13],[-6,0],[6,0],[-7,-13],[7,-13],[-26,-6],[26,-6]].forEach(([x,z])=>fire(x,z));
    [[-13,13],[13,13],[-20,26],[20,26]].forEach(([x,z])=>fire(x,z,true));
    // Quiet wolf companions have articulated legs and patrol small clear areas.
    const wolves=[[-13,11],[13,11],[-7,21]].map(([x,z],i)=>{const g=new THREE.Group();scene.add(g);g.position.set(x,.15,z);const coat=['#777b70','#8e8572','#555f58'][i];
      box(g,1.1,.5,.42,coat,0,.55,0);box(g,.4,.42,.38,coat,.65,.75,0);box(g,.3,.2,.28,'#9c9c8b',.93,.65,0);
      [-1,1].forEach(side=>{const ear=mesh(g,new THREE.ConeGeometry(.11,.3,4),coat,.68,1.05,side*.15);ear.rotation.z=.1; sphere(g,.035,'#1b2524',.85,.82,side*.19);});
      const legs=[];[-1,1].forEach(a=>[-1,1].forEach(b=>{const leg=new THREE.Group();leg.position.set(a*.4,.42,b*.14);g.add(leg);box(leg,.12,.45,.12,coat,0,-.2,0);legs.push(leg);}));
      const tail=box(g,.6,.14,.14,coat,-.78,.69,0);tail.rotation.z=-.35;return {group:g,legs,tail,x,z,phase:i*2};});
    const traveler=createAdventurer(scene,{box,sphere,mesh,cylinder}),player=traveler.player;player.position.set(0,0,initialNearCave.current?-14.5:25);
    // Residents have their own everyday clothes and articulated limbs; guards carry visible equipment.
    const residents=PEOPLE.map((p,i)=>{
      const group=new THREE.Group(),body=new THREE.Group();group.add(body);scene.add(group);group.position.set(p.x,0,p.z);
      const skin=['#a87454','#bd8964','#895d49','#a77958','#bf906e'][i%5], cloth=['#a36f51','#d0aa77','#798c68','#76684d','#8a7555','#9d735b','#688077'][i%7], female=p.female||i===1||i===2;
      box(body,.64,.8,.36,cloth,0,1.18,0);box(body,.7,.15,.4,'#594b3c',0,.86,0);
      sphere(body,.28,skin,0,1.83,0);sphere(body,.29,'#332e2a',0,1.97,-.06).scale.set(1,.65,1);
      [-1,1].forEach(side=>sphere(body,.035,'#1d2421',side*.1,1.84,.27));
      addFaceDetails(body,{box,sphere},{headY:1.83,skin,brow:'#49372d'});
      if(p.elder){sphere(body,.3,'#aaa99a',0,1.98,-.05).scale.set(1,.6,1);box(body,.34,.27,.1,'#b9b8aa',0,1.59,.24);cylinder(body,.045,1.7,'#6e5136',.59,.85,.18);}
      if(female){box(body,.55,.48,.18,'#332e2a',0,1.67,-.19);sphere(body,.13,'#332e2a',-.22,1.65,-.13);box(body,.72,.34,.43,cloth,0,.78,0);}
      box(body,.7,.07,.4,i%2?'#c29463':'#a05e49',0,1.33,.01);box(body,.14,.14,.43,'#dbc28b',0,1.12,.02);
      const legs=[],arms=[];[-1,1].forEach(side=>{const leg=new THREE.Group();leg.position.set(side*.18,.82,0);body.add(leg);box(leg,.23,.62,.25,'#5a5145',0,-.31,0);box(leg,.26,.14,.34,'#463d32',0,-.62,.05);legs.push(leg);
        const arm=new THREE.Group();arm.position.set(side*.43,1.48,0);body.add(arm);box(arm,.2,.55,.22,cloth,0,-.25,0);sphere(arm,.1,skin,0,-.56,0);arms.push(arm);});
      if(p.guard){box(body,.72,.5,.43,'#74664d',0,1.25,0);box(body,.68,.08,.45,'#c1a77a',0,1.35,0);
        if(p.guard==='spear'){cylinder(arms[1],.045,2.8,'#755538',.08,-.08,.08);const tip=mesh(arms[1],new THREE.ConeGeometry(.13,.45,4),'#b7b8a5',.08,1.55,.08);tip.rotation.y=Math.PI/4;}
        else{const bow=mesh(arms[1],new THREE.TorusGeometry(.68,.035,6,20,Math.PI),'#775236',.05,-.2,.05);bow.rotation.z=-Math.PI/2;box(arms[1],.025,1.36,.025,'#ded0aa',.05,-.2,.05);}}
      if(p.child)body.scale.setScalar(.66);
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sign.position.y=p.child?1.9:2.8;sign.scale.set(2.1,.66,1);group.add(sign);
      const drawSign=lang=>{ctx.clearRect(0,0,512,160);ctx.fillStyle='#1a2522';ctx.fillRect(4,4,504,152);ctx.strokeStyle='#c3a778';ctx.lineWidth=5;ctx.strokeRect(7,7,498,146);ctx.textAlign='center';ctx.fillStyle='#f6e9ca';ctx.font='bold 52px sans-serif';ctx.fillText(NAMES[i],256,67);ctx.fillStyle='#d3c8a8';ctx.font='30px sans-serif';ctx.fillText(lang==='en-US'?'E / F  TALK':'E / F  CONVERSAR',256,122);texture.needsUpdate=true;};
      drawSign(state.current.language);signsRef.current.push(drawSign);group.userData.residentIndex=i;
      if(!p.elder){const target=p.route[1];group.rotation.y=Math.atan2(target[0]-p.x,target[1]-p.z);}
      return {group,body,legs,arms,route:p.route,elder:p.elder,next:1,wait:!p.elder&&i%5===2?1.4:0,phase:i*1.7,texture};
    });
    camera.position.set(0,9,initialNearCave.current?-3.5:36);const orbit=allowRunAndRotate(new OrbitControls(camera,renderer.domElement));orbit.target.set(0,1,initialNearCave.current?-14.5:25);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=5;orbit.maxDistance=22;orbit.maxPolarAngle=Math.PI/2-.08;orbit.update();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const down=e=>{const k=e.key.toLowerCase();if(k==='escape'&&talkRef.current!==null){e.preventDefault();actions.current.close();return;}if(document.activeElement!==renderer.domElement||state.current.paused||talkRef.current!==null)return;if(k==='e'||k==='f'){e.preventDefault();actions.current.interact();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}};
    const up=e=>keys.current.delete(e.key.toLowerCase()),clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);renderer.domElement.addEventListener('blur',clear);
    const blocked=(x,z)=>Math.hypot(x,z-2)<3.55||(Math.abs(x)<8.5&&z< -16)||Math.abs(x)>29||z>29||z< -18||HOUSES.some(([hx,hz])=>Math.abs(x-hx)<3.5&&Math.abs(z-hz)<3)||[[-22,-12],[22,-12]].some(([sx,sz])=>Math.hypot(x-sx,z-sz)<4);
    let frame,last=performance.now(),time=0,previousNear=-1,previousExit=false,previousCave=false;
    const animate=now=>{frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
      if(!state.current.paused&&talkRef.current===null){time+=dt;const x=(keys.current.has('d')||keys.current.has('arrowright')?1:0)-(keys.current.has('a')||keys.current.has('arrowleft')?1:0),z=(keys.current.has('s')||keys.current.has('arrowdown')?1:0)-(keys.current.has('w')||keys.current.has('arrowup')?1:0);
        if(x||z){const dir=cameraRelativeDirection(camera,x,z),speed=keys.current.has('shift')?6.5:4,nx=player.position.x+dir.x*speed*dt,nz=player.position.z+dir.z*speed*dt;if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;player.rotation.y=Math.atan2(dir.x,dir.z);}
        let closest=-1,distance=3;residents.forEach((p,i)=>{const d=Math.hypot(p.group.position.x-player.position.x,p.group.position.z-player.position.z);if(d<distance){distance=d;closest=i;}});state.current.near=closest;const byExit=Math.abs(player.position.x)<3.5&&player.position.z>27;state.current.nearExit=byExit;const byCave=Math.abs(player.position.x)<3&&player.position.z< -15;state.current.nearCave=byCave;if(byCave!==previousCave){previousCave=byCave;setNearCave(byCave);}if(byExit!==previousExit){previousExit=byExit;setNearExit(byExit);}if(closest!==previousNear){previousNear=closest;setNear(closest);}
      }else clear();
      if(!state.current.paused&&talkRef.current===null&&!state.current.reduceMotion){
        const walking=keys.current.size>0;
        traveler.limbs.forEach((limb,i)=>{limb.rotation.x=walking?Math.sin(time*9+(i<2?0:Math.PI))*(i%2===0?.55:-.45):0;});
        traveler.body.position.y=walking?Math.abs(Math.sin(time*9))*.06:Math.sin(time*2)*.015;
        residents.forEach(npc=>{let moving=false;if(npc.elder){}else if(npc.wait>0)npc.wait-=dt;else{const target=npc.route[npc.next],dx=target[0]-npc.group.position.x,dz=target[1]-npc.group.position.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*.8);if(d>.001){npc.group.position.x+=dx/d*step;npc.group.position.z+=dz/d*step;npc.group.rotation.y=Math.atan2(dx,dz);moving=true;}if(d<=step+.001){npc.next=(npc.next+1)%npc.route.length;npc.wait=1.3+(npc.next%3)*.65;}}
          const swing=moving?Math.sin(time*7+npc.phase)*.55:0;npc.legs[0].rotation.x=swing;npc.legs[1].rotation.x=-swing;npc.arms[0].rotation.x=-swing*.7;npc.arms[1].rotation.x=npc.route&&moving?swing*.5:Math.sin(time*1.5+npc.phase)*.04;npc.body.position.y=moving?Math.abs(Math.sin(time*7+npc.phase))*.05:Math.sin(time*1.7+npc.phase)*.015;});
      }
      if(!state.current.paused){const elder=residents.find(npc=>npc.elder);if(elder)facePlayer(elder.group,player);}
      if(!state.current.paused&&!state.current.reduceMotion){fires.forEach(f=>{const flicker=1+Math.sin(time*8+f.phase)*.12;f.flame.scale.y=flicker;f.core.scale.y=1/flicker;f.light.intensity=(f.light.distance>8?12:7)*flicker;});wolves.forEach(w=>{const a=time*.3+w.phase;w.group.position.x=w.x+Math.sin(a)*1.1;w.group.position.z=w.z+Math.cos(a)*.7;w.group.rotation.y=Math.atan2(.7*Math.sin(a),1.1*Math.cos(a));w.legs.forEach((leg,i)=>{leg.rotation.z=Math.sin(time*4+w.phase+(i%3?Math.PI:0))*.28;});w.tail.rotation.y=Math.sin(time*2+w.phase)*.3;});}
      const target=new THREE.Vector3(player.position.x,1,player.position.z),shift=target.clone().sub(orbit.target);camera.position.add(shift);orbit.target.copy(target);orbit.enabled=!state.current.paused&&talkRef.current===null;orbit.enableDamping=!state.current.reduceMotion;orbit.update();renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);renderer.domElement.removeEventListener('blur',clear);clear();orbit.dispose();horizonTexture.dispose();signsRef.current=[];residents.forEach(npc=>npc.texture.dispose());scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();renderer.domElement.remove();};
  },[]);
  const press=(key,down)=>{if(paused||talkRef.current!==null)return;if(down)keys.current.add(key);else keys.current.delete(key);};
  return <section className="lake ancient-tunnel"><div className="lake-viewport"><div className="lake-canvas" ref={mount}/><button className="lake-exit" onClick={onExit}>{en?'Return to ruins':'Voltar às ruínas'}</button><MapControlGuide language={language} scene="temple"/>
    {error&&<p className="lake-scene-error">{en?'3D is unavailable in this browser.':'O 3D não está disponível neste navegador.'}</p>}
    {nearExit&&talk===null&&<button className="lake-portal-action" onClick={interact}>{en?'Enter passage to ruins':'Entrar na passagem para as ruínas'} <kbd>E</kbd></button>}
    {nearCave&&talk===null&&<button className="lake-portal-action" onClick={interact}>{en?'Enter the cave':'Entrar na caverna'} <kbd>E</kbd></button>}
    {!nearExit&&!nearCave&&near>=0&&talk===null&&<div className="village-actions"><button onClick={interact}>{en?'Talk to':'Conversar com'} {NAMES[near]} <kbd>F</kbd></button></div>}
    {talk!==null&&<section className="npc-dialogue" role="dialog" aria-labelledby="resident-title" tabIndex={-1} ref={dialoguePanel}>
      <div className="npc-dialogue-heading">
        <span className="npc-avatar" style={{background:talk===-2?'#657064':['#a36f51','#d0aa77','#798c68','#76684d','#8a7555','#9d735b','#688077'][talk%7]}} aria-hidden="true">{talk===-2?'*':NAMES[talk][0]}</span>
        <div><h2 id="resident-title">{talk===-2?(en?"The Elder's cave":'Caverna do Ancião'):NAMES[talk]}</h2><small>{talk===-2?(en?'Sealed passage':'Passagem selada'):PEOPLE[talk].elder?(en?'Village elder':'Ancião da aldeia'):PEOPLE[talk].child?(en?'Village child':'Criança da aldeia'):PEOPLE[talk].guard?(en?'Village guard':'Guarda da aldeia'):(en?'Village resident':'Morador da aldeia')}</small></div>
        <button onClick={close} aria-label={en?'End conversation':'Encerrar conversa'}><X size={18}/></button>
      </div>
      <p aria-live="polite">{talk===-2?(en?'Beyond the temple lies the sleeping place of the Elder. The passage is sealed.':'Além do templo repousa o Ancião. A passagem está selada.'):dialogue[en?'en-US':'pt-BR'][talk]}</p>
      {talk!==-2&&<><div className="npc-dialogue-actions"><button disabled={!voiceEnabled} onClick={()=>speaking?onStop?.():onSpeak?.(talk)}>{speaking?(en?'Stop voice':'Parar voz'):(en?'Listen':'Ouvir mensagem')}</button></div><small className="npc-voice-note">{voiceNotice||(!voiceEnabled?(en?'Enable NPC voices in audio settings.':'Ative as vozes dos NPCs nas configurações de áudio.'):(en?'Recorded voice':'Voz gravada'))}</small></>}
    </section>}
    </div><div className="lake-touch" aria-label={en?'Walking controls':'Controles de caminhada'}>{[['arrowleft',en?'Left':'Esquerda','←'],['arrowup',en?'Forward':'Frente','↑'],['arrowdown',en?'Back':'Trás','↓'],['arrowright',en?'Right':'Direita','→']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}</div></section>;
}

