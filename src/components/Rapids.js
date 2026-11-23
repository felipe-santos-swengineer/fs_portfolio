import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createAdventurer } from './VillageScene';
import { createLakeBoat } from './lakeBoat';
import { createRapidsCourse, rapidsCollision, RAPIDS_DISTANCE, RAPIDS_LIVES, RAPIDS_SPEED } from './rapidsCourse';
import './Lake.css';
import './Rapids.css';
import MapControlGuide from './MapControlGuide';

export default function Rapids({ language, paused, reduceMotion, onExit, onAdvance }) {
  const mount=useRef(null), held=useRef(new Set()), current=useRef({ paused, reduceMotion });
  current.current={paused,reduceMotion};
  const [run,setRun]=useState(0), [status,setStatus]=useState('ready'), [lives,setLives]=useState(RAPIDS_LIVES), [progress,setProgress]=useState(0), [error,setError]=useState(false);
  const phase=useRef('ready');
  const en=language==='en-US';
  useEffect(()=>{
    const el=mount.current;
    let renderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true}); } catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
    renderer.domElement.tabIndex=0; renderer.domElement.setAttribute('aria-label','Rapids / Corredeiras'); el.appendChild(renderer.domElement);
    const scene=new THREE.Scene(); scene.background=new THREE.Color('#a8ceca'); scene.fog=new THREE.Fog('#a8ceca',40,95);
    scene.add(new THREE.HemisphereLight('#e4f3e7','#4a5643',2));
    const sun=new THREE.DirectionalLight('#fff2d3',2); sun.position.set(-8,18,12); scene.add(sun);
    const camera=new THREE.PerspectiveCamera(48,1,.1,120); camera.position.set(0,11,19); camera.lookAt(0,0,-13);
    const add=(parent,geo,color,x,y,z)=>{const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);parent.add(m);return m;};
    // A continuous sloping river and fixed landmarks let the boat travel through the world.
    const slope=.055, riverY=z=>(z-5)*slope;
    const riverCenter=5-RAPIDS_DISTANCE/2;
    const water=add(scene,new THREE.PlaneGeometry(18,RAPIDS_DISTANCE+100),'#4f9ca1',0,riverY(riverCenter),riverCenter);
    water.rotation.x=-Math.PI/2-Math.atan(slope);
    for(let i=0;i<Math.ceil((RAPIDS_DISTANCE+90)/8);i++) {
      const group=new THREE.Group(); group.position.z=21-i*8; group.position.y=riverY(group.position.z); scene.add(group);
      [-1,1].forEach(side=>{
        // Overlapping angular cliff sections form a continuous canyon wall.
        const height=7+(i%4)*.65;
        const outline=new THREE.Shape(); outline.moveTo(0,-1); outline.lineTo(8,-1); outline.lineTo(8,height+1.5);
        outline.lineTo(5.5,height+1+(i%3)*.3); outline.lineTo(3.1,height+.25); outline.lineTo(1.3,height-.65);
        outline.lineTo(.7,height-2.2); outline.lineTo(0,1.4); outline.closePath();
        const geometry=new THREE.ExtrudeGeometry(outline,{depth:8.5,bevelEnabled:false});
        const cliff=add(group,geometry,i%3===0?'#76847a':i%3===1?'#6d7b71':'#65766d',side*9,0,-4.25);
        cliff.scale.x=side; cliff.material.flatShading=true;
        const ledge=add(group,new THREE.IcosahedronGeometry(1,0),'#859083',side*9.35,2.7+(i%3)*.8,-1.5);
        ledge.scale.set(.65,.5,1.25); ledge.rotation.y=i*.8;
        if(i%3!==1) {const shrub=add(group,new THREE.IcosahedronGeometry(.65,1),'#668760',side*9.5,3.5+(i%3)*.8,-1.5); shrub.scale.set(1.1,.7,1);}
        if((i+(side===1?1:0))%4===0) {
          // Pines on the rim and hanging vegetation make each bank easier to read.
          const treeX=side*(11.1+(i%2)*1.3), treeZ=(i%3-1)*1.5;
          add(group,new THREE.CylinderGeometry(.16,.25,2.2,6),'#66523e',treeX,height+1.2,treeZ);
          const crown=add(group,new THREE.ConeGeometry(1.25,3.3,7),'#416d53',treeX,height+3.5,treeZ); crown.rotation.y=i*.4;
          const top=add(group,new THREE.ConeGeometry(.9,2.3,7),'#507b59',treeX,height+4.5,treeZ); top.rotation.y=.2;
        }
        if((i+(side===1?2:0))%5===0) {
          for(let vine=0;vine<3;vine++) {
            const hanging=add(group,new THREE.CylinderGeometry(.025,.04,1.5+vine*.35,5),'#668b5c',side*9.06,height-1.4-vine*.15,-2+vine*.55);
            hanging.rotation.z=side*(vine-1)*.08;
          }
        }
        if((i+(side===1?7:0))%13===4) {
          // Irregular streams follow the cliff instead of a rectangular sheet.
          const shape=new THREE.Shape(); shape.moveTo(-.22,5.8);
          shape.bezierCurveTo(-.38,4.5,-.1,3.4,-.28,2.3);
          shape.bezierCurveTo(-.34,1.4,-.48,.6,-.52,0);
          shape.lineTo(.48,0); shape.bezierCurveTo(.34,1.1,.21,2,.3,2.8);
          shape.bezierCurveTo(.43,3.9,.15,5,.22,5.8); shape.closePath();
          const cascade=add(group,new THREE.ShapeGeometry(shape),'#a8d8d0',side*9.05,.08,.2);
          cascade.rotation.y=side*Math.PI/2; cascade.material.transparent=true; cascade.material.opacity=.78;
          cascade.material.depthWrite=false; cascade.material.side=THREE.DoubleSide;
          const pool=add(group,new THREE.RingGeometry(.55,.7,20),'#d4eee4',side*8.8,.06,.2);
          pool.rotation.x=-Math.PI/2; pool.scale.set(.8,.7,1); pool.material.transparent=true; pool.material.opacity=.55;
        }
      });
      const foam=add(group,new THREE.BoxGeometry(3,.025,.08),'#c3e8db',(i%3-1)*4,.04,-3); foam.rotation.y=.2;
      if(i%3===0) {
        const wave=add(group,new THREE.TorusGeometry(1.2,.045,5,18,Math.PI),'#d5eee4',(i%5-2)*2,.07,1);
        wave.rotation.x=-Math.PI/2; wave.rotation.z=(i%2)*.3;
      }
      if(i===12 || i===34) {
        // High crossings provide fixed landmarks without obstructing the boat or sail.
        [-1,1].forEach(side=>{
          // Stone abutments rise from the canyon walls to meet the deck.
          const foundation=add(group,new THREE.BoxGeometry(1.8,10.4,3.1),'#69766d',side*9.7,5.1,0);
          foundation.rotation.z=side*.025;
          [-1,1].forEach(edge=>add(group,new THREE.BoxGeometry(.32,10.6,.32),'#604a35',side*9.15,5.25,edge*1.02));
          add(group,new THREE.BoxGeometry(2.2,.28,3.3),'#899489',side*9.7,10.35,0);
        });
        add(group,new THREE.BoxGeometry(21,.35,2.2),'#826342',0,10.5,0);
        for(let plank=-9;plank<=9;plank+=1.5) add(group,new THREE.BoxGeometry(.06,.04,2.1),'#5b4833',plank,10.7,0);
        [-1,1].forEach(edge=>{
          add(group,new THREE.BoxGeometry(21,.12,.12),'#6d5038',0,11.5,edge*.95);
          for(let post=-9;post<=9;post+=3) add(group,new THREE.BoxGeometry(.13,1,.13),'#6d5038',post,11,edge*.95);
        });
      }
    }
    const boat=createLakeBoat(add); scene.add(boat); boat.position.set(0,0,5);
    const mesh=(parent,geometry,color,x,y,z)=>add(parent,geometry,color,x,y,z);
    const box=(parent,w,h,d,color,x,y,z)=>add(parent,new THREE.BoxGeometry(w,h,d),color,x,y,z);
    const sphere=(parent,r,color,x,y,z)=>add(parent,new THREE.IcosahedronGeometry(r,1),color,x,y,z);
    const cylinder=(parent,r,h,color,x,y,z,segments=8)=>add(parent,new THREE.CylinderGeometry(r,r,h,segments),color,x,y,z);
    const {player}=createAdventurer(boat,{box,sphere,mesh,cylinder}); player.position.set(0,1,.55); player.rotation.y=Math.PI;
    const boatMaterials=new Map();
    boat.traverse(object=>{
      const materials=Array.isArray(object.material)?object.material:[object.material];
      materials.forEach(material=>{
        if(material?.emissive && !boatMaterials.has(material)) boatMaterials.set(material,{color:material.emissive.clone(),intensity:material.emissiveIntensity});
      });
    });
    const showDamage=active=>boatMaterials.forEach((original,material)=>{
      material.emissive.copy(active ? damageColor : original.color);
      material.emissiveIntensity=active ? .9 : original.intensity;
    });
    const damageColor=new THREE.Color('#ff2222');

    const obstacles=createRapidsCourse().map(item=>{
      const group=new THREE.Group(); scene.add(group); group.position.x=item.x;
      if(item.type==='rock') {
        const geometry=new THREE.IcosahedronGeometry(1.45,0), vertices=geometry.attributes.position;
        for(let v=0;v<vertices.count;v++) {
          const x=vertices.getX(v), y=vertices.getY(v), z=vertices.getZ(v);
          const uneven=1+.14*Math.sin(x*3.1+z*2.3)+.08*Math.cos(y*4.2-z);
          vertices.setXYZ(v,x*uneven,y*uneven,z*uneven);
        }
        geometry.computeVertexNormals();
        const rock=add(group,geometry,'#727e76',0,.55,0); rock.scale.set(1.05,.75,1.12); rock.rotation.y=.42; rock.material.flatShading=true;
        const smaller=add(group,new THREE.IcosahedronGeometry(.5,0),'#899489',.9,.17,.5); smaller.scale.set(1,.55,.8);
      }
      else if(item.type==='log') {
        const log=add(group,new THREE.CylinderGeometry(.4,.5,3.5,9),'#76543a',0,.35,0); log.rotation.z=Math.PI/2;
        const branch=add(group,new THREE.CylinderGeometry(.13,.2,.8,7),'#76543a',.5,.7,0); branch.rotation.z=-.55;
      } else {
        group.rotation.y=Math.PI; // Face upstream, toward the approaching boat.
        const body=add(group,new THREE.SphereGeometry(1,14,10),'#516e4a',0,.38,.1); body.scale.set(.77,.43,1.35);
        const neck=add(group,new THREE.SphereGeometry(1,12,8),'#5c7951',0,.37,-1.02); neck.scale.set(.6,.31,.75);
        const jaw=add(group,new THREE.SphereGeometry(1,12,8),'#66845a',0,.3,-1.73); jaw.scale.set(.46,.2,.77);
        [-1,1].forEach(side=>{
          const eyeRidge=add(group,new THREE.SphereGeometry(.19,10,8),'#5c7951',side*.37,.62,-1.18); eyeRidge.scale.set(1,.8,1.25);
          add(group,new THREE.SphereGeometry(.09,10,8),'#e0c46d',side*.39,.71,-1.22);
          add(group,new THREE.SphereGeometry(.038,8,6),'#202a1e',side*.4,.76,-1.25);
          add(group,new THREE.SphereGeometry(.045,7,5),'#253828',side*.23,.47,-2.28);
          [-.55,.85].forEach(z=>{const leg=add(group,new THREE.SphereGeometry(.35,9,7),'#506f49',side*.7,.2,z);leg.scale.set(1.15,.35,.6);leg.rotation.y=side*.45;});
        });
        for(let j=0;j<7;j++) {const ridge=add(group,new THREE.ConeGeometry(.16,.25,4),'#3f6040',0,.74-Math.abs(j-2)*.035,-.8+j*.4); ridge.rotation.y=Math.PI/4;}
        const tail=add(group,new THREE.ConeGeometry(.47,1.75,9),'#516e4a',0,.27,1.87); tail.rotation.x=Math.PI/2;
        const tailTip=add(group,new THREE.ConeGeometry(.22,.8,8),'#516e4a',.16,.22,3.02); tailTip.rotation.x=Math.PI/2; tailTip.rotation.z=-.12;
      }
      group.position.z=5-item.distance; group.position.y=riverY(group.position.z);
      return {...item,group,hit:false};
    });
    let distance=0, remaining=RAPIDS_LIVES, invulnerable=0, damageFlash=0, frame, last=performance.now(), lastPercent=-1;
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const down=e=>{if(document.activeElement!==renderer.domElement||current.current.paused)return;const key=e.key.toLowerCase();if(['a','d','arrowleft','arrowright'].includes(key)){e.preventDefault();held.current.add(key);}};
    const up=e=>held.current.delete(e.key.toLowerCase());
    const clear=()=>held.current.clear();
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    const animate=now=>{
      frame=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;
      if(phase.current==='playing'&&!current.current.paused) {
        distance=Math.min(RAPIDS_DISTANCE,distance+RAPIDS_SPEED*dt);
        const direction=(held.current.has('d')||held.current.has('arrowright')?1:0)-(held.current.has('a')||held.current.has('arrowleft')?1:0);
        boat.position.x=THREE.MathUtils.clamp(boat.position.x+direction*7*dt,-6.8,6.8);
        boat.rotation.z=current.current.reduceMotion?0:-direction*.1;
        boat.position.z=5-distance;
        boat.position.y=riverY(boat.position.z)+(current.current.reduceMotion?0:Math.sin(distance*.8)*.06);
        invulnerable=Math.max(0,invulnerable-dt);
        obstacles.forEach(item=>{
          if(!item.hit && invulnerable<=0 && rapidsCollision(boat.position.x,item,distance)) {
            item.hit=true; remaining--; invulnerable=1.2; damageFlash=current.current.reduceMotion ? .25 : .75; setLives(remaining);
            if(remaining<=0){phase.current='lost';setStatus('lost');clear();}
          }
        });
        const percent=Math.floor(distance/RAPIDS_DISTANCE*100); if(percent!==lastPercent){lastPercent=percent;setProgress(percent);}
        if(distance>=RAPIDS_DISTANCE&&phase.current==='playing'){phase.current='won';setStatus('won');clear();}
      } else if(current.current.paused) clear();
      if(!current.current.paused && damageFlash>0) {
        showDamage(current.current.reduceMotion || Math.floor(damageFlash*4)%2===0);
        damageFlash=Math.max(0,damageFlash-dt);
        if(damageFlash===0) showDamage(false);
      }
      camera.position.set(boat.position.x*.3,boat.position.y+11,boat.position.z+14);
      camera.lookAt(boat.position.x*.2,riverY(boat.position.z-18)+1,boat.position.z-18);
      renderer.render(scene,camera);
    };frame=requestAnimationFrame(animate);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);clear();scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();renderer.domElement.remove();};
  },[run]); // Language and accessibility settings are read by the UI or refs.
  const start=()=>{phase.current='playing';setStatus('playing');mount.current?.querySelector('canvas')?.focus();};
  const retry=()=>{held.current.clear();phase.current='ready';setStatus('ready');setLives(RAPIDS_LIVES);setProgress(0);setRun(value=>value+1);};
  const press=(key,down)=>{if(paused||phase.current!=='playing')return; if(down)held.current.add(key);else held.current.delete(key);};
  return <section className="lake rapids"><div className="lake-viewport"><div className="lake-canvas" ref={mount}/>
    <button className="rapids-skip" onClick={onAdvance}>{en?'Skip to ruins':'Pular para as ruínas'}</button><button className="lake-exit" onClick={onExit}>{en?'Return to lake':'Voltar ao lago'}</button>
    <MapControlGuide language={language} scene="rapids"/>
    <div className="rapids-hud"><span>{en?'Lives':'Vidas'}: {lives}</span><span>{en?'Descent':'Descida'}: {progress}%</span></div>
    {status!=='playing'&&<div className="rapids-overlay"><div className="rapids-card"><h2>{en?'Canyon Rapids':'Corredeiras do Desfiladeiro'}</h2>
      <p>{error?(en?'3D is unavailable in this browser.':'O 3D não está disponível neste navegador.'):status==='ready'?(en?'The boat moves downstream on its own. Steer left and right to avoid rocks, logs and crocodiles.':'O barco desce sozinho. Mova-se para a esquerda e para a direita para desviar de pedras, troncos e crocodilos.'):status==='won'?(en?'You made it through the canyon!':'Você atravessou o desfiladeiro!'):(en?'The boat took too many hits. Try again!':'O barco sofreu muitas colisões. Tente novamente!')}</p>
      {!error&&(status==='ready'?<button onClick={start}>{en?'Start descent':'Começar descida'}</button>:<button onClick={retry}>{en?'Play again':'Jogar novamente'}</button>)}{status==='won'&&<button onClick={onAdvance}>{en?'Continue to ruins':'Avançar para as ruínas'}</button>}
    </div></div>}
    </div><div className="lake-touch" aria-label={en?'Steering controls':'Controles de direção'}>{[['arrowleft',en?'Left':'Esquerda','←'],['arrowright',en?'Right':'Direita','→']].map(([key,label,symbol])=><button key={key} type="button" aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}} onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)} onLostPointerCapture={()=>press(key,false)}>{symbol}</button>)}</div></section>;
}
