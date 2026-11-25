import { isRunning, setTouchMovement } from './touchMovement';
import TouchInteract from './TouchInteract';
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
import { createTempleVillageScenery, createTempleCutaway } from './templeVillageScenery';
import { sceneFrameDelta } from './sceneFrameDelta';

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

export default function TempleVillage({ campaignNavigation,language, paused, reduceMotion, onExit,onSpeak,onStop,speaking,voiceEnabled,voiceNotice,onEnterCave,startNearCave=false}) {
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
    const scene=new THREE.Scene();
    scene.background=new THREE.Color('#111827');
    scene.fog=new THREE.FogExp2('#1a2032',.015);
    scene.add(new THREE.HemisphereLight('#a7b5d9','#655469',1.34));
    const camera=new THREE.PerspectiveCamera(48,1,.1,180);
    const add=(parent,geometry,color,x,y,z)=>{const m=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.93}));m.position.set(x,y,z);parent.add(m);return m;};
    const box=(p,w,h,d,c,x,y,z)=>add(p,new THREE.BoxGeometry(w,h,d),c,x,y,z);
    const sphere=(p,r,c,x,y,z)=>add(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z);
    const cylinder=(p,r,h,c,x,y,z,segments=8)=>add(p,new THREE.CylinderGeometry(r,r,h,segments),c,x,y,z);
    const mesh=(p,g,c,x,y,z)=>add(p,g,c,x,y,z);
    const scenery=createTempleVillageScenery(scene,HOUSES);
    const monument=createElderMonument(scene,{box,sphere,cylinder,mesh});
    monument.scale.set(.68,.49,.88);
    scenery.occluders.push(monument);
    const cutaway=createTempleCutaway(scenery.occluders);
    const fires=[];
    const fire=(x,z,camp=false)=>{const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
      if(camp){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const rock=sphere(group,.25,'#8e8b76',Math.cos(a)*.72,.14,Math.sin(a)*.72);rock.scale.y=.6;}for(let i=0;i<3;i++){const log=box(group,1.2,.16,.18,'#5a4130',0,.18,0);log.rotation.y=i*Math.PI/3;}}
      else{cylinder(group,.09,2.2,'#624930',0,1.1,0);cylinder(group,.2,.2,'#4a3b2c',0,2.2,0);}
      const flame=mesh(group,new THREE.ConeGeometry(camp?.32:.2,camp?.8:.55,7),'#ed9b48',0,camp?.58:2.55,0);flame.material.emissive=new THREE.Color('#d16524');flame.material.emissiveIntensity=1.4;
      const core=mesh(group,new THREE.ConeGeometry(camp?.16:.1,camp?.5:.32,7),'#ffdf8b',0,camp?.5:2.5,.04);core.material.emissive=new THREE.Color('#e8a64b');core.material.emissiveIntensity=1;
      const bright=camp&&Math.abs(x)===13;
      const light=bright?new THREE.PointLight('#ffad62',26,16):null;
      if(light){light.position.set(0,1.5,0);group.add(light);}
      fires.push({flame,core,light,phase:x+z});};
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
    camera.position.set(0,initialNearCave.current?9:6.6,initialNearCave.current?-3.5:40);const orbit=allowRunAndRotate(new OrbitControls(camera,renderer.domElement));orbit.target.set(0,1,initialNearCave.current?-14.5:25);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=5;orbit.maxDistance=22;orbit.maxPolarAngle=Math.PI/2-.08;orbit.update();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const down=e=>{const k=e.key.toLowerCase();if(k==='escape'&&talkRef.current!==null){e.preventDefault();actions.current.close();return;}if(document.activeElement!==renderer.domElement||state.current.paused||talkRef.current!==null)return;if(k==='e'||k==='f'){e.preventDefault();actions.current.interact();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}};
    const up=e=>keys.current.delete(e.key.toLowerCase()),clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);renderer.domElement.addEventListener('blur',clear);
    const blocked=(x,z)=>Math.hypot(x,z-2)<3.55||(Math.abs(x)<8.5&&z< -16)||Math.abs(x)>29||z>29||z< -18||HOUSES.some(([hx,hz])=>Math.abs(x-hx)<3.5&&Math.abs(z-hz)<3)||[[-22,-12],[22,-12]].some(([sx,sz])=>Math.hypot(x-sx,z-sz)<4);
    const target=new THREE.Vector3(), shift=new THREE.Vector3(), interactionFocus=new THREE.Vector3();
    const residentFocusOffset=new THREE.Vector3(0,1.5,0);
    let frame,last=performance.now(),time=0,sceneryTime=0,previousNear=-1,previousExit=false,previousCave=false;
    const animate=now=>{frame=requestAnimationFrame(animate);const dt=sceneFrameDelta(now,last);last=now;
      if(!state.current.paused&&talkRef.current===null){time+=dt;const x=(keys.current.has('d')||keys.current.has('arrowright')?1:0)-(keys.current.has('a')||keys.current.has('arrowleft')?1:0),z=(keys.current.has('s')||keys.current.has('arrowdown')?1:0)-(keys.current.has('w')||keys.current.has('arrowup')?1:0);
        if(x||z){const dir=cameraRelativeDirection(camera,x,z),speed=isRunning(keys.current)?6.5:4,nx=player.position.x+dir.x*speed*dt,nz=player.position.z+dir.z*speed*dt;if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;player.rotation.y=Math.atan2(dir.x,dir.z);}
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
      if(!state.current.paused&&!state.current.reduceMotion){fires.forEach(f=>{const flicker=1+Math.sin(time*8+f.phase)*.12;f.flame.scale.y=flicker;f.core.scale.y=1/flicker;if(f.light)f.light.intensity=26*flicker;});wolves.forEach(w=>{const a=time*.3+w.phase;w.group.position.x=w.x+Math.sin(a)*1.1;w.group.position.z=w.z+Math.cos(a)*.7;w.group.rotation.y=Math.atan2(.7*Math.sin(a),1.1*Math.cos(a));w.legs.forEach((leg,i)=>{leg.rotation.z=Math.sin(time*4+w.phase+(i%3?Math.PI:0))*.28;});w.tail.rotation.y=Math.sin(time*2+w.phase)*.3;});}
      const {paused,reduceMotion}=state.current;
      if(!paused&&talkRef.current===null&&!reduceMotion&&dt>0){
        sceneryTime+=dt;
        scenery.update(sceneryTime);
      }
      target.set(player.position.x,1,player.position.z);
      shift.copy(target).sub(orbit.target);
      camera.position.add(shift);
      orbit.target.copy(target);
      orbit.enabled=!paused&&talkRef.current===null;
      orbit.enableDamping=!reduceMotion;
      orbit.update();
      const resident=residents[talkRef.current ?? previousNear];
      let focus=null;
      if(previousExit)focus=interactionFocus.set(0,2.1,30.1);
      else if(previousCave)focus=interactionFocus.set(0,2.4,-20.6);
      else if(resident)focus=interactionFocus.copy(resident.group.position).add(residentFocusOffset);
      cutaway.update(camera,player,focus,paused?0:dt,reduceMotion);
      renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return ()=>{
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('keydown',down);
      window.removeEventListener('keyup',up);
      window.removeEventListener('blur',clear);
      renderer.domElement.removeEventListener('blur',clear);
      clear();
      orbit.dispose();
      signsRef.current=[];
      residents.forEach(npc=>npc.texture.dispose());
      const geometries=new Set(), materials=cutaway.originalMaterials;
      scene.traverse(object=>{
        if(object.isInstancedMesh)object.dispose();
        if(object.geometry)geometries.add(object.geometry);
        if(Array.isArray(object.material))object.material.forEach(material=>materials.add(material));
        else if(object.material)materials.add(object.material);
      });
      geometries.forEach(geometry=>geometry.dispose());
      materials.forEach(material=>material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  },[]);
  const press=(key,down)=>{if(paused||talkRef.current!==null)return;setTouchMovement(keys.current, key, down);};
  return <section className="lake ancient-tunnel"><div className="lake-viewport"><div className="lake-canvas" ref={mount}/>{campaignNavigation ?? <button className="lake-exit" onClick={onExit}>{en?'Return to ruins':'Voltar às ruínas'}</button>}<MapControlGuide language={language} scene="temple"/>
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
    </div><div className="lake-touch" aria-label={en?'Walking controls':'Controles de caminhada'}>{[['arrowleft',en?'Left':'Esquerda','←'],['arrowup',en?'Forward':'Frente','↑'],['arrowdown',en?'Back':'Trás','↓'],['arrowright',en?'Right':'Direita','→']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}<TouchInteract language={language} onInteract={interact} disabled={paused || talk !== null || !(near >= 0 || nearExit || nearCave)} /></div></section>;
}

