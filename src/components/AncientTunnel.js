import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createAdventurer } from './VillageScene';
import { createLakeBoat } from './lakeBoat';
import { cameraRelativeDirection } from './cameraRelativeDirection';
import MapControlGuide from './MapControlGuide';
import './Lake.css';
import './AncientTunnel.css';

export default function AncientTunnel({language,paused,reduceMotion,onExit,onSound}) {
  const mount=useRef(null),keys=useRef(new Set()),settings=useRef(null),messageRef=useRef(false),nearRef=useRef(false);
  settings.current={paused,reduceMotion,onSound};
  const [near,setNear]=useState(false),[message,setMessage]=useState(false),[error,setError]=useState(false);
  const en=language==='en-US';
  const examine=()=>{if(settings.current.paused || !nearRef.current)return;keys.current.clear();messageRef.current=true;setMessage(true);settings.current.onSound?.('passage');};
  const closeMessage=()=>{messageRef.current=false;setMessage(false);mount.current?.querySelector('canvas')?.focus({preventScroll:true});};
  const actions=useRef({examine,closeMessage});actions.current={examine,closeMessage};
  useEffect(()=>{
    const el=mount.current;let renderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true});}catch{setError(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.domElement.tabIndex=0;
    renderer.domElement.setAttribute('aria-label','Ancient tunnel / Tunel antigo');el.appendChild(renderer.domElement);renderer.domElement.focus({preventScroll:true});
    const scene=new THREE.Scene();scene.background=new THREE.Color('#0d1719');scene.fog=new THREE.Fog('#0d1719',12,46);
    scene.add(new THREE.HemisphereLight('#566a62','#1b2420',.8));
    const camera=new THREE.PerspectiveCamera(50,1,.1,80);
    const add=(parent,geometry,color,x,y,z)=>{const object=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.9}));object.position.set(x,y,z);parent.add(object);return object;};
    const water=add(scene,new THREE.PlaneGeometry(12,54),'#284d4d',0,0,-16);water.rotation.x=-Math.PI/2;water.material.roughness=.35;
    add(scene,new THREE.BoxGeometry(16,1,54),'#273a35',0,-.8,-16);
    add(scene,new THREE.BoxGeometry(16,1.2,54),'#303c35',0,9,-16);
    [-1,1].forEach(side=>{
      add(scene,new THREE.BoxGeometry(3,9,54),'#39483f',side*7.2,4,-16);
      for(let i=0;i<9;i++){
        const z=5-i*5.5;
        const buttress=add(scene,new THREE.BoxGeometry(.85,7.5,1),'#4b584b',side*5.45,3.75,z);buttress.rotation.z=side*.035;
        add(scene,new THREE.BoxGeometry(1.15,.35,1.25),'#687564',side*5.45,7.6,z);
        if(i%2===0){
          const bracket=add(scene,new THREE.ConeGeometry(.15,.55,7),'#755b3c',side*5.05,4,z);bracket.rotation.z=side*.3;
          const flame=add(scene,new THREE.SphereGeometry(.16,8,6),'#e9b55f',side*4.95,4.35,z);flame.material.emissive=new THREE.Color('#c97d37');flame.material.emissiveIntensity=1;
          const lamp=new THREE.PointLight('#ffb866',9,10);lamp.position.set(side*4.8,4.35,z);scene.add(lamp);
        }
      }
    });
    for(let i=0;i<5;i++){const arch=add(scene,new THREE.BoxGeometry(11,.48,.6),'#626e5e',0,7.85,3-i*9);arch.rotation.z=(i%2?1:-1)*.015;}
    const door=new THREE.Group();door.position.set(0,0,-31);scene.add(door);
    add(door,new THREE.BoxGeometry(10,8,1),'#303a32',0,4,0);
    const outline=add(door,new THREE.TorusGeometry(2.1,.15,8,32,Math.PI),'#8b9b81',0,3.65,.58);outline.rotation.z=0;
    [-2.1,2.1].forEach(x=>add(door,new THREE.BoxGeometry(.3,3.65,.3),'#8b9b81',x,1.83,.58));
    const seal=add(door,new THREE.OctahedronGeometry(.32,0),'#8cb4a0',0,4,.65);seal.material.emissive=new THREE.Color('#397a68');seal.material.emissiveIntensity=.8;
    const boat=createLakeBoat(add);scene.add(boat);boat.position.set(0,0,4);
    const mesh=(parent,geometry,color,x,y,z)=>add(parent,geometry,color,x,y,z);
    const box=(parent,w,h,d,color,x,y,z)=>add(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);
    const sphere=(parent,r,color,x,y,z)=>add(parent,new THREE.IcosahedronGeometry(r,1),color,x,y,z);
    const cylinder=(parent,r,h,color,x,y,z,segments=8)=>add(parent,new THREE.CylinderGeometry(r,r,h,segments),color,x,y,z);
    const {player}=createAdventurer(boat,{box,sphere,mesh,cylinder});player.position.set(0,1,.55);player.rotation.y=Math.PI;
    camera.position.set(0,7,16);const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1,4);orbit.enablePan=false;orbit.enableDamping=true;orbit.minDistance=5;orbit.maxDistance=16;orbit.maxPolarAngle=Math.PI/2-.08;orbit.update();
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const down=e=>{const k=e.key.toLowerCase();if(k==='escape'&&messageRef.current&&!settings.current.paused){e.preventDefault();actions.current.closeMessage();return;}if(document.activeElement!==renderer.domElement||settings.current.paused||messageRef.current)return;if(k==='e'){e.preventDefault();actions.current.examine();return;}if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();keys.current.add(k);}};
    const up=e=>keys.current.delete(e.key.toLowerCase());const clear=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    let frame,last=performance.now(),time=0,nextImpact=0;
    const animate=now=>{
      frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
      if(!settings.current.paused&&!messageRef.current){
        time+=dt;const x=(keys.current.has('d')||keys.current.has('arrowright')?1:0)-(keys.current.has('a')||keys.current.has('arrowleft')?1:0),z=(keys.current.has('s')||keys.current.has('arrowdown')?1:0)-(keys.current.has('w')||keys.current.has('arrowup')?1:0);
        if(x||z){const direction=cameraRelativeDirection(camera,x,z),rawX=boat.position.x+direction.x*4*dt,rawZ=boat.position.z+direction.z*4*dt;
          const nx=THREE.MathUtils.clamp(rawX,-3.2,3.2),nz=THREE.MathUtils.clamp(rawZ,-26,6);
          if((nx!==rawX||nz!==rawZ)&&time>=nextImpact){settings.current.onSound?.('stone');nextImpact=time+.9;}
          boat.position.set(nx,boat.position.y,nz);boat.rotation.y=Math.atan2(-direction.x,-direction.z);
        }
        boat.position.y=settings.current.reduceMotion?0:Math.sin(time*1.4)*.04;
        const isNear=boat.position.z < -22;if(isNear!==nearRef.current){nearRef.current=isNear;setNear(isNear);}
      }else clear();
      if(!settings.current.reduceMotion)seal.rotation.y=time*.4;
      const target=new THREE.Vector3(boat.position.x,1,boat.position.z),shift=target.clone().sub(orbit.target);camera.position.add(shift);orbit.target.copy(target);orbit.enabled=!settings.current.paused&&!messageRef.current;orbit.enableDamping=!settings.current.reduceMotion;orbit.update();renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);clear();orbit.dispose();scene.traverse(object=>{object.geometry?.dispose();if(Array.isArray(object.material))object.material.forEach(m=>m.dispose());else object.material?.dispose();});renderer.dispose();renderer.domElement.remove();};
  },[]);
  const press=(key,down)=>{if(paused||messageRef.current)return;if(down)keys.current.add(key);else keys.current.delete(key);};
  return <section className="lake ancient-tunnel"><div className="lake-viewport"><div className="lake-canvas" ref={mount}/><button className="lake-exit" onClick={onExit}>{en?'Return to ruins':'Voltar às ruínas'}</button><MapControlGuide language={language} scene="tunnel"/>
    {error&&<p className="lake-scene-error">{en?'3D is unavailable in this browser.':'O 3D não está disponível neste navegador.'}</p>}
    {near&&!message&&<button className="lake-portal-action" onClick={examine}>{en?'Examine the entrance':'Examinar a entrada'} <kbd>E</kbd></button>}
    {message&&<section className="npc-dialogue ancient-tunnel-dialogue" role="dialog" aria-labelledby="tunnel-title"><h2 id="tunnel-title">{en?'Ancient temple':'Templo antigo'}</h2><p>{en?'The passage leads to an ancient temple. This area is still under construction.':'A passagem leva a um templo antigo. Esta área ainda está em construção.'}</p><button autoFocus onClick={closeMessage}>{en?'Continue exploring':'Continuar explorando'}</button></section>}
    </div><div className="lake-touch" aria-label={en?'Boat controls':'Controles do barco'}>{[['arrowleft',en?'Left':'Esquerda','←'],['arrowup',en?'Forward':'Frente','↑'],['arrowdown',en?'Back':'Trás','↓'],['arrowright',en?'Right':'Direita','→']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}</div></section>;
}
