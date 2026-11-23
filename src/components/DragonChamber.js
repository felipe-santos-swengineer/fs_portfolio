import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createAdventurer } from './VillageScene';
import { createElderDragon } from './ElderDragon';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import dialogue from './dragonDialogue.json';
import { DRAGON_SCENE_DURATION, dragonSceneLineAt } from './dragonScene';
import './Lake.css';
import './DragonChamber.css';

export default function DragonChamber({language,paused,reduceMotion,onExit,onSpeak,onStop,onSound,onStep,voiceEnabled,voiceNotice}){
  const mount=useRef(null),keys=useRef(new Set()),state=useRef({}),modeRef=useRef('sleep'),skipRef=useRef(null),stopVoice=useRef(onStop);stopVoice.current=onStop;
  const [mode,setMode]=useState('sleep'),[line,setLine]=useState(-1),[error,setError]=useState(false);
  state.current={paused,reduceMotion,onSound,onStep};const en=language==='en-US';
  useEffect(()=>{if(paused){if(mode==='scene')stopVoice.current?.();return;}if(mode==='scene'&&line>=0)onSpeak?.(line);},[mode,line,onSpeak,paused]);
  useEffect(()=>()=>stopVoice.current?.(),[]);
  const skip=()=>{skipRef.current?.();onStop?.();};
  useEffect(()=>{
    const el=mount.current;let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.25));renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Dragon chamber / Camara do dragao');el.appendChild(renderer.domElement);renderer.domElement.focus({preventScroll:true});
    const scene=new THREE.Scene();scene.background=new THREE.Color('#171812');scene.fog=new THREE.Fog('#171812',55,150);scene.add(new THREE.HemisphereLight('#a59b78','#30271e',1.15));const sun=new THREE.DirectionalLight('#ffc47a',1.4);sun.position.set(-10,23,4);scene.add(sun);
    const camera=new THREE.PerspectiveCamera(48,1,.1,200);const mats=new Map();const material=c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c);};
    const add=(p,g,c,x,y,z)=>{const m=new THREE.Mesh(g,material(c));m.position.set(x,y,z);p.add(m);return m;};
    const box=(p,w,h,d,c,x,y,z)=>add(p,new THREE.BoxGeometry(w,h,d),c,x,y,z),sphere=(p,r,c,x,y,z)=>add(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z),cylinder=(p,r,h,c,x,y,z,n=8)=>add(p,new THREE.CylinderGeometry(r,r,h,n),c,x,y,z),mesh=(p,g,c,x,y,z)=>add(p,g,c,x,y,z);
    const floor=mesh(scene,new THREE.CircleGeometry(55,64),'#53483a',0,-.04,0);floor.rotation.x=-Math.PI/2;
    // Inward-facing surfaces reveal the arena when the camera moves outside the walls.
    const wallMaterial=new THREE.MeshStandardMaterial({color:'#3e493e',roughness:1,side:THREE.BackSide});
    const wall=new THREE.Mesh(new THREE.CylinderGeometry(55,55,27,64,1,true),wallMaterial);wall.position.y=12;scene.add(wall);
    const ceiling=mesh(scene,new THREE.CircleGeometry(55,64),'#343c33',0,25,0);ceiling.rotation.x=Math.PI/2;
    const wallRocks=[];
    for(let i=0;i<56;i++){const a=i*Math.PI*2/56,x=Math.cos(a)*54,z=Math.sin(a)*54,r=mesh(scene,new THREE.DodecahedronGeometry(4+(i%3)*.4,0),i%2?'#494a3d':'#3a4036',x,8,z);r.scale.set(1.1,2.5,1.1);r.rotation.y=a;const stal=mesh(scene,new THREE.ConeGeometry(1,3+(i%3),7),'#726c58',x*.94,21,z*.94);stal.rotation.z=Math.PI;wallRocks.push({rock:r,stal,nx:Math.cos(a),nz:Math.sin(a)});}
    // Separate heaps and scattered coins frame a broad, unobstructed fighting floor.
    const piles=Array.from({length:14},(_,i)=>{const a=i*Math.PI*2/14+.12,r=37+(i%3)*3;return {x:Math.cos(a)*r,z:Math.sin(a)*r,radius:3.4+(i%3)*.55,height:1.2+(i%3)*.28};});
    const moundMaterial=new THREE.MeshStandardMaterial({color:'#a7833f',metalness:.65,roughness:.48});
    piles.forEach(p=>{const mound=new THREE.Mesh(new THREE.CylinderGeometry(.12,p.radius,p.height,12),moundMaterial);mound.position.set(p.x,p.height/2,p.z);scene.add(mound);});
    const coinGeo=new THREE.CylinderGeometry(.14,.14,.045,7),coinMat=new THREE.MeshStandardMaterial({color:'#d8ab50',metalness:.7,roughness:.3});const coins=new THREE.InstancedMesh(coinGeo,coinMat,piles.length*100),dummy=new THREE.Object3D();
    piles.forEach((p,i)=>{for(let j=0;j<100;j++){const a=j*2.39996,r=Math.sqrt((j+.5)/100)*p.radius*.98;dummy.position.set(p.x+Math.cos(a)*r,.08+p.height*(1-r/p.radius),p.z+Math.sin(a)*r);dummy.rotation.set((j%5===0)?.25:0,a,0);dummy.scale.setScalar(.75+(j%4)*.13);dummy.updateMatrix();coins.setMatrixAt(i*100+j,dummy.matrix);}});coins.instanceMatrix.needsUpdate=true;scene.add(coins);
    for(let i=0;i<28;i++){const a=i*2.39996,r=38+(i%4)*2,x=Math.cos(a)*r,z=Math.sin(a)*r;const gem=mesh(scene,new THREE.OctahedronGeometry(.25+(i%3)*.1,0),['#b84251','#62b5a4','#899dda','#d4b95d'][i%4],x,.3,z);gem.rotation.set(i*.3,i,.2);}
    for(let i=0;i<12;i++){const a=i*2.7,r=37+(i%4)*2,x=Math.cos(a)*r,z=Math.sin(a)*r;const skull=new THREE.Group();skull.position.set(x,.12,z);skull.rotation.y=a;scene.add(skull);const head=sphere(skull,.38,'#c3bca5',0,.38,0);head.scale.set(1,.8,.9);[-1,1].forEach(side=>sphere(skull,.1,'#242a23',side*.15,.4,.31));box(skull,.42,.14,.3,'#a99f89',0,.17,.23);}
    [-1,1].forEach(side=>{const chest=new THREE.Group();chest.position.set(side*40,0,-18);scene.add(chest);box(chest,2,1.2,1.3,'#755538',0,.7,0);box(chest,2.1,.25,1.4,'#a68652',0,1.35,0);box(chest,.16,1.25,1.34,'#d5b674',0,.7,0);});
    const goldLight=new THREE.PointLight('#ffb35c',35,35);goldLight.position.set(0,7,-11);scene.add(goldLight);
    const dragon=createElderDragon(scene);dragon.group.scale.setScalar(6.4);dragon.group.position.set(0,0,-17);dragon.group.rotation.y=0;const dragonBody=dragon.body;
    const traveler=createAdventurer(scene,{box,sphere,mesh,cylinder}),player=traveler.player;player.position.set(0,0,39);player.rotation.y=Math.PI;
    camera.position.set(0,11,53);const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.2,39);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=7;orbit.maxDistance=32;orbit.maxPolarAngle=Math.PI/2-.07;orbit.update();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const clear=()=>keys.current.clear(),down=e=>{if(document.activeElement!==renderer.domElement||state.current.paused||modeRef.current==='scene')return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}},up=e=>keys.current.delete(e.key.toLowerCase());window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    let frame,last=performance.now(),time=0,sceneTime=0,spoken=-1,stepTimer=0;
    const finish=()=>{modeRef.current='ready';setMode('ready');setLine(-1);keys.current.clear();camera.position.set(player.position.x+8,11,player.position.z+15);orbit.target.set(player.position.x,1.2,player.position.z);orbit.update();renderer.domElement.focus({preventScroll:true});};skipRef.current=finish;
    const animate=now=>{frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
      if(!state.current.paused){time+=dt;
        if(modeRef.current!=='scene'){const x=Number(keys.current.has('d')||keys.current.has('arrowright'))-Number(keys.current.has('a')||keys.current.has('arrowleft')),z=Number(keys.current.has('s')||keys.current.has('arrowdown'))-Number(keys.current.has('w')||keys.current.has('arrowup'));
          if(x||z){const dir=cameraRelativeDirection(camera,x,z),speed=keys.current.has('shift')?6.5:4,nx=player.position.x+dir.x*speed*dt,nz=player.position.z+dir.z*speed*dt;if(Math.hypot(nx,nz)<52&&Math.hypot(nx,nz+17)>10){player.position.x=nx;player.position.z=nz;player.rotation.y=Math.atan2(dir.x,dir.z);stepTimer-=dt;if(stepTimer<=0){state.current.onStep?.();stepTimer=.45;}}}
          else stepTimer=0;
          traveler.limbs.forEach((limb,i)=>{limb.rotation.x=(x||z)&&!state.current.reduceMotion?Math.sin(time*9)*(i%2===0?.5:-.45)*(i<2?1:-1):0;});
          if(modeRef.current==='sleep'&&player.position.z<32){modeRef.current='scene';setMode('scene');keys.current.clear();sceneTime=0;spoken=-1;}
        }else{sceneTime+=dt;const next=dragonSceneLineAt(sceneTime);if(next!==spoken){spoken=next;setLine(next);if(next===0)state.current.onSound?.('anger');}if(sceneTime>=DRAGON_SCENE_DURATION)finish();}
      }else clear();
      const awakening=modeRef.current==='sleep'?0:modeRef.current==='ready'?1:THREE.MathUtils.smoothstep(sceneTime,0,6);
      const angry=modeRef.current==='scene'&&sceneTime>=6&&sceneTime<13;
      const threat=angry&&!state.current.reduceMotion?Math.sin(Math.min(1,(sceneTime-6)/1.5)*Math.PI/2):0;
      dragonBody.position.y=-.45*(1-awakening)+(state.current.reduceMotion?0:Math.sin(time*1.2)*.035);dragonBody.position.z=threat*.15;dragonBody.rotation.x=.16*(1-awakening)-threat*.1;
      dragon.eyes.emissiveIntensity=angry?2.4:1.3;
      dragon.head.rotation.x=-.35*(1-awakening)+(state.current.reduceMotion?0:(Math.sin(time*1.4)*.025+(modeRef.current==='scene'&&sceneTime>=6?Math.sin(time*5)*(angry?.075:.045):0))*awakening);
      dragon.wings.forEach(({pivot,side})=>{pivot.rotation.z=side*(1.05*(1-awakening)+.16*awakening-threat*.18);});
      dragon.jaw.rotation.x=state.current.reduceMotion?0:(modeRef.current==='scene'&&sceneTime>=6?.08+Math.abs(Math.sin(time*5))*.12:0);
      if(!state.current.reduceMotion)dragon.tail.forEach((joint,i)=>{joint.rotation.y=Math.sin(time*.8-i*.35)*.035*awakening;});
      if(modeRef.current==='scene'){
        const sceneCamera=sceneTime<7?new THREE.Vector3(19,15,10):new THREE.Vector3(12,13,5);const look=new THREE.Vector3(0,10,-7);
        if(state.current.reduceMotion){camera.position.copy(sceneCamera);orbit.target.copy(look);}else{camera.position.lerp(sceneCamera,Math.min(1,dt*.8));orbit.target.lerp(look,Math.min(1,dt));}
      }else{const target=new THREE.Vector3(player.position.x,1.2,player.position.z),shift=target.clone().sub(orbit.target);camera.position.add(shift);orbit.target.copy(target);}
      orbit.enabled=!state.current.paused&&modeRef.current!=='scene';orbit.enableDamping=!state.current.reduceMotion;orbit.update();wallRocks.forEach(({rock,stal,nx,nz})=>{const outside=camera.position.x*nx+camera.position.z*nz>49;rock.visible=!outside;stal.visible=!outside;});renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);skipRef.current=null;observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);clear();orbit.dispose();coins.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(![...mats.values()].includes(m))m.dispose();});});mats.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
  },[]);
  const press=(key,down)=>{if(paused||modeRef.current==='scene')return;if(down)keys.current.add(key);else keys.current.delete(key);};
  return <section className="lake dragon-chamber"><div className="lake-viewport"><div ref={mount} className="lake-canvas"/><button className="lake-exit" onClick={onExit}>{en?'Return to cave':'Voltar para a caverna'}</button>
    <div className="chamber-heading"><strong>{en?'THE ELDER\u2019S CHAMBER':'C\u00c2MARA DO ANCI\u00c3O'}</strong><small>{mode==='sleep'?(en?'The dragon sleeps. Tread carefully.':'O drag\u00e3o dorme. Avance com cuidado.'):mode==='ready'?(en?'The Elder awaits the coming battle.':'O Anci\u00e3o aguarda a batalha que vir\u00e1.'):(en?'The Elder awakens':'O Anci\u00e3o desperta')}</small></div>
    {mode==='scene'&&<><button className="chamber-skip" onClick={skip}>{en?'Skip scene':'Pular cena'}</button>{line>=0&&<div className="chamber-subtitle" role="status" aria-live="polite"><strong>{en?'THE ELDER':'O ANCI\u00c3O'}</strong><p>{dialogue[en?'en-US':'pt-BR'][line]}</p>{(!voiceEnabled||voiceNotice)&&<small>{voiceNotice|| (en?'Enable NPC voices in audio settings to hear the dialogue.':'Ative as vozes dos NPCs nas configura\u00e7\u00f5es de \u00e1udio para ouvir o di\u00e1logo.')}</small>}</div>}</>}
    {error&&<p className="lake-scene-error">{en?'3D is unavailable in this browser.':'O 3D n\u00e3o est\u00e1 dispon\u00edvel neste navegador.'}</p>}
    {mode!=='scene'&&<div className="scene-guide map-control-guide"><div className="scene-caption"><span className="live-dot"/> {en?'THE ELDER\u2019S CHAMBER':'C\u00c2MARA DO ANCI\u00c3O'}</div><div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en?'or arrows to walk':'ou setas para caminhar'} {'\u00b7'} <kbd>Shift</kbd> {en?'run':'correr'} {'\u00b7'} {en?'drag to rotate':'arraste para girar'}</span><span className="touch-guide">{en?'Use arrows to walk \u00b7 drag to rotate':'Use as setas para caminhar \u00b7 arraste para girar'}</span></div></div>}
    </div><div className="lake-touch" aria-label={en?'Walking controls':'Controles de caminhada'}>{[['arrowleft',en?'Left':'Esquerda','\u2190'],['arrowup',en?'Forward':'Frente','\u2191'],['arrowdown',en?'Back':'Tr\u00e1s','\u2193'],['arrowright',en?'Right':'Direita','\u2192']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} disabled={mode==='scene'} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}</div></section>;
}
