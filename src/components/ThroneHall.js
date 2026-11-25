import TouchInteract from './TouchInteract';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { allowRunAndRotate } from './runAndRotate';
import { createAdventurer, addFaceDetails } from './VillageScene';
import { advanceFootsteps, isThroneExit } from './villageNavigation';
import { FELIPE_LINES } from '../audio/felipeVoice';
import english from '../content.en.json';
import { guardBowAtDistance } from './guardBow';
import './ThroneHall.css';

export default function ThroneHall({ language = 'pt-BR', keys, onExit, onStep, onSpeak, onStop, speaking, voiceEnabled, voiceNotice, paused, reduceMotion }) {
  const mount = useRef(null);
  const live = useRef({ onExit, onStep, paused, reduceMotion });
  live.current = { onExit, onStep, paused, reduceMotion };
  const [error, setError] = useState(false);
  const [nearFelipe, setNearFelipe] = useState(false);
  const [dialogue, setDialogue] = useState(null);
  const dialogueRef = useRef(null); const talkRef = useRef(null); const closeRef = useRef(null);
  talkRef.current = () => { keys.current.clear(); const line = dialogueRef.current === null ? 0 : (dialogueRef.current + 1) % FELIPE_LINES.length; dialogueRef.current = line; setDialogue(line); onSpeak?.(line); };
  const closeDialogue = () => { dialogueRef.current = null; setDialogue(null); onStop?.(); };
  closeRef.current = closeDialogue;
  useEffect(() => {
    const container = mount.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { setError(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, container.clientWidth < 800 ? 1.15 : 1.5));
    renderer.domElement.tabIndex = 0;
    renderer.domElement.setAttribute('aria-label', 'Sal\u00e3o do trono tridimensional. Use WASD ou setas para caminhar.');
    container.appendChild(renderer.domElement);
    renderer.domElement.focus({ preventScroll: true });
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#101722'); scene.fog = new THREE.Fog('#101722', 25, 57);
    scene.add(new THREE.HemisphereLight('#b7c9d9', '#594232', 1.55));
    const sun = new THREE.DirectionalLight('#f4d5a6', 1.8); sun.position.set(-4, 16, 12); scene.add(sun);
    const materials = new Map();
    const material = (color, glow = false) => { const key = color + glow; if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .82, ...(glow ? { emissive: color, emissiveIntensity: 1.1 } : {}) })); return materials.get(key); };
    const mesh = (parent, geometry, color, x, y, z, glow = false) => { const item = new THREE.Mesh(geometry, material(color, glow)); item.position.set(x,y,z); parent.add(item); return item; };
    const box = (p,w,h,d,c,x,y,z,g) => mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z,g);
    const sphere = (p,r,c,x,y,z,g) => mesh(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z,g);
    const cylinder = (p,r,h,c,x,y,z,segments=8) => mesh(p,new THREE.CylinderGeometry(r,r,h,segments),c,x,y,z);
    // A nave with a raised dais, stone courses and a long red carpet.
    box(scene,20,.5,30,'#4a4b50',0,-.25,0);
    box(scene,.5,9,30,'#4c5058',-10,4.5,0); box(scene,.5,9,30,'#4c5058',10,4.5,0);
    box(scene,20,9,.5,'#4c5058',0,4.5,-15);
    for(let x=-9;x<=9;x+=2) for(let z=-14;z<=14;z+=2) box(scene,1.92,.035,1.92,(x+z)%4?'#5c5d61':'#535459',x,.02,z);
    box(scene,4.1,.07,24,'#812e38',0,.09,-1); [-2,2].forEach(x=>box(scene,.09,.08,24,'#c8a56f',x,.1,-1));
    for(let i=0;i<3;i++) box(scene,8-i*.45,.27,1.0,'#777678',0,.15+i*.27,-10.5-i*.75);
    box(scene,7,.8,4.5,'#777678',0,.4,-13);
    // Throne: carved arms, high back, cushion and a gold crest.
    box(scene,2.8,.45,2.1,'#5a3e31',0,1.13,-13);box(scene,2.5,.15,1.8,'#a34049',0,1.43,-12.95);
    box(scene,2.7,3.5,.45,'#684839',0,2.9,-13.85);box(scene,2.12,2.65,.13,'#a43f4a',0,3.05,-13.58);
    [-1,1].forEach(side=>{box(scene,.35,1.35,2,'#765740',side*1.25,1.95,-13);sphere(scene,.2,'#d1b178',side*1.25,2.7,-12.15);});
    const crest=mesh(scene,new THREE.OctahedronGeometry(.38),'#e1c17c',0,4.75,-13.5,true);crest.scale.set(1,1.2,.4);
    // Felipe works on a laptop from the throne, with coffee at his side.
    const felipe=new THREE.Group();felipe.position.set(0,1.52,-13.15);scene.add(felipe);
    box(felipe,.72,.86,.42,'#405c68',0,.92,0);box(felipe,.76,.12,.46,'#8a6b49',0,.56,0);
    sphere(felipe,.3,'#efd0b3',0,1.62,0);
    addFaceDetails(felipe,{box,sphere},{headY:1.62,skin:'#efd0b3',radius:.3,brow:'#a88452'});
    const hair=mesh(felipe,new THREE.SphereGeometry(.31,16,10,0,Math.PI*2,0,Math.PI*.46),'#c7a05d',0,1.67,0);hair.scale.set(1.02,.9,1.02);
    box(felipe,.46,.33,.1,'#b99559',0,1.55,-.25);
    [-1,1].forEach(side=>{const lock=box(felipe,.09,.3,.12,'#c7a05d',side*.265,1.57,-.08);lock.rotation.z=side*-.08;sphere(felipe,.028,'#14212b',side*.1,1.66,.28);const lens=mesh(felipe,new THREE.TorusGeometry(.09,.018,6,16),'#37424b',side*.11,1.67,.3);lens.scale.y=.85;box(felipe,.25,.25,.75,'#303b48',side*.22,.23,.35);box(felipe,.28,.18,.34,'#514639',side*.22,.12,.73);});
    const fringe=box(felipe,.31,.08,.1,'#d0ad70',-.1,1.86,.22);fringe.rotation.z=-.12;
    box(felipe,.05,.025,.025,'#37424b',0,1.67,.31);
    const typingArms=[-1,1].map(side=>{const arm=new THREE.Group();arm.position.set(side*.43,1.15,0);felipe.add(arm);box(arm,.2,.52,.22,'#405c68',0,-.18,.14);sphere(arm,.11,'#efd0b3',0,-.38,.35);arm.rotation.x=-.65;return arm;});
    const laptop=new THREE.Group();laptop.position.set(0,.55,.43);felipe.add(laptop);
    box(laptop,1.02,.08,.7,'#353f4b',0,0,0);
    box(laptop,.82,.015,.42,'#202a34',0,.047,-.03);
    for(let row=0;row<3;row++)for(let col=0;col<7;col++)box(laptop,.075,.012,.06,'#70808a',-.3+col*.1,.059,-.17+row*.11);
    const lid=new THREE.Group();lid.position.set(0,.04,.33);lid.rotation.x=.18;laptop.add(lid);
    box(lid,1.02,.69,.07,'#343e49',0,.345,0);
    box(lid,.85,.51,.018,'#507180',0,.35,-.045,true);
    for(let row=0;row<3;row++)box(lid,.45-row*.07,.025,.012,['#bad2bd','#d7bd85','#a8c7d5'][row],-.08,.2+row*.12,-.057,true);
    box(scene,.85,.14,.85,'#7a583f',1.95,1.58,-12.7);box(scene,.15,.9,.15,'#614734',1.95,1.1,-12.7);
    cylinder(scene,.16,.3,'#e6dcc6',1.95,1.8,-12.7,12);cylinder(scene,.13,.02,'#5f3d2d',1.95,1.96,-12.7,12);const cupHandle=mesh(scene,new THREE.TorusGeometry(.1,.025,6,12),'#e6dcc6',2.12,1.82,-12.7);cupHandle.rotation.y=Math.PI/2;
    const nameCanvas=document.createElement('canvas');nameCanvas.width=512;nameCanvas.height=128;const nameCtx=nameCanvas.getContext('2d');nameCtx.fillStyle='#17212c';nameCtx.fillRect(0,0,512,128);nameCtx.strokeStyle='#c4a673';nameCtx.lineWidth=5;nameCtx.strokeRect(4,4,504,120);nameCtx.fillStyle='#f3dfb3';nameCtx.textAlign='center';nameCtx.font='bold 39px sans-serif';nameCtx.fillText('Felipe Santos',256,78);const nameTexture=new THREE.CanvasTexture(nameCanvas);nameTexture.colorSpace=THREE.SRGBColorSpace;const nameLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:nameTexture,transparent:true}));nameLabel.position.set(0,4.4,-12.9);nameLabel.scale.set(3.7,.92,1);scene.add(nameLabel);
    // Heraldic banners, pillars, braziers, tables and suits of armor.
    const flames=[];
    [-1,1].forEach(side=>{
      for(const z of [-9,-3,3,9]) { cylinder(scene,.4,7,'#85817c',side*7.8,3.5,z,12);cylinder(scene,.63,.25,'#aaa096',side*7.8,.15,z,12);cylinder(scene,.6,.25,'#aaa096',side*7.8,6.9,z,12); }
      for(const z of [-7,1,9]) { box(scene,.12,2.7,1.6,'#803743',side*9.7,5,z);box(scene,.17,.12,1.9,'#c2a46e',side*9.62,6.45,z);sphere(scene,.23,'#d2b777',side*9.55,5,z,true); }
      for(const z of [-11,6]) { cylinder(scene,.45,.8,'#554c46',side*5.5,.4,z,10);const fire=mesh(scene,new THREE.ConeGeometry(.36,.9,8),'#ff9c49',side*5.5,1.2,z,true);flames.push(fire);const glow=new THREE.PointLight('#ffac5b',12,9);glow.position.set(side*5.5,2,z);scene.add(glow); }
      box(scene,2.5,.18,1.1,'#74583f',side*8,.85,12);[-.8,.8].forEach(dx=>box(scene,.15,.8,.15,'#514337',side*8+dx,.4,12));
      cylinder(scene,.2,.45,'#c8a66e',side*8,1.15,12);box(scene,.6,.1,.45,'#cbb893',side*8+.6,.99,12);
    });
    // Framed technology emblems give the royal hall a developer's identity.
    const plaqueMaterials=[];
    const plaques=[['JS','#e9c861'],['PY','#8eb7cc'],['</>','#d4b48e'],['IA','#a3d2bd'],['TS','#86acd1'],['SQL','#c2a4d1'],['PHP','#a8a7d0'],['GIT','#df9b7e']];
    plaques.forEach(([symbol,color],index)=>{
      const side=index<4?-1:1,z=[-11,-3,5,13][index%4];
      const frame=new THREE.Group();frame.position.set(side*9.67,3.9,z);frame.rotation.y=side<0?Math.PI/2:-Math.PI/2;scene.add(frame);
      box(frame,1.55,1.55,.16,'#a68a61',0,0,0);box(frame,1.38,1.38,.08,'#272f38',0,0,.12);
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#27323b';ctx.fillRect(0,0,256,256);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(15,15,226,226);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${symbol.length>2?72:96}px sans-serif`;ctx.fillText(symbol,128,132);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const plaqueMaterial=new THREE.MeshBasicMaterial({map:texture});plaqueMaterials.push(plaqueMaterial);const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),plaqueMaterial);plaque.position.z=.17;frame.add(plaque);
    });
    // Guards are scenery: they stand watch without dialogs or combat.
    const guards=[];
    for(const z of [-7,-2,3,8]) for(const side of [-1,1]) {
      const guard=createAdventurer(scene,{box,sphere,mesh,cylinder},{armored:true});guard.player.position.set(side*3.1,.2,z);guard.player.rotation.y=side<0?Math.PI/2:-Math.PI/2;
      box(guard.body,.79,.76,.49,'#768b91',0,1.2,0);box(guard.body,.12,.68,.51,'#b4c3c4',0,1.2,.01);mesh(guard.body,new THREE.SphereGeometry(.36,12,8,0,Math.PI*2,0,Math.PI*.48),'#74868a',0,1.94,-.02);
      [-1,1].forEach(side=>box(guard.body,.12,.3,.15,'#65787e',side*.31,1.85,.18));box(guard.body,.65,.1,.18,'#65787e',0,2.01,.2);[-1,1].forEach(s=>box(guard.body,.34,.22,.5,'#99a9aa',s*.49,1.55,0));box(guard.limbs[1],.48,.7,.13,'#5e6d7b',0,-.35,.25);
      guards.push(guard);
    }
    // The entrance stays visibly identifiable from inside.
    box(scene,4.2,5,.35,'#3e302b',0,2.5,14.7);[-1,1].forEach(side=>{box(scene,.16,4.6,.12,'#b49461',side*1.8,2.4,14.47);sphere(scene,.11,'#d2b777',side*.25,2,14.4);});
    const { player, body, limbs } = createAdventurer(scene,{box,sphere,mesh,cylinder});player.position.set(0,.2,10);player.rotation.y=Math.PI;
    const camera=new THREE.PerspectiveCamera(44,1,.1,120);camera.position.set(0,9,20);
    const controls=allowRunAndRotate(new OrbitControls(camera,renderer.domElement));controls.target.set(0,1.5,4);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=6;controls.maxDistance=27;controls.maxPolarAngle=Math.PI/2-.12;controls.update();
    const resize=()=>{const {width,height}=container.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
    const down=e=>{const k=e.key.toLowerCase();if(k==='f'&&!e.repeat&&!live.current.paused && Math.hypot(player.position.x,player.position.z+13.15)<4.2){e.preventDefault();talkRef.current?.();return;}if(!live.current.paused && !e.ctrlKey && !e.metaKey && !e.altKey && ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){if(k!=='shift')e.preventDefault();keys.current.add(k);}};
    const up=e=>keys.current.delete(e.key.toLowerCase());const clear=()=>keys.current.clear();const escape=e=>{if(e.key==='Escape' && !live.current.paused && dialogueRef.current!==null){e.preventDefault();closeRef.current?.();}};window.addEventListener('keydown',escape);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null;
    const pointerDown=e=>{pointerStart={x:e.clientX,y:e.clientY};};
    const pointerUp=e=>{if(live.current.paused || !pointerStart || Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);if(raycaster.intersectObject(felipe,true).length)talkRef.current?.();};
    renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
    renderer.domElement.addEventListener('keydown',down);renderer.domElement.addEventListener('blur',clear);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
    const forward=new THREE.Vector3(),right=new THREE.Vector3(),movement=new THREE.Vector3(),delta=new THREE.Vector3();let frame=0,previous=0,clock=0,steps=0,wasNear=false;
    const draw=time=>{
      if(document.hidden){frame=0;previous=0;return;}
      const dt=Math.min((time-previous)/1000||0,.04);previous=time;if(!live.current.paused)clock+=dt;
      const k=keys.current,mx=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('arrowleft')),mz=Number(k.has('w')||k.has('arrowup'))-Number(k.has('s')||k.has('arrowdown'));let walking=false;
      if(!live.current.paused && (mx||mz)){
        camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();movement.copy(forward).multiplyScalar(mz).addScaledVector(right,mx).normalize().multiplyScalar(dt*4.2*(k.has('shift')?1.8:1));
        const p=player.position,oldX=p.x,oldZ=p.z;p.x=THREE.MathUtils.clamp(p.x+movement.x,-9.1,9.1);p.z=THREE.MathUtils.clamp(p.z+movement.z,-10.1,13.7);
        const distance=Math.hypot(p.x-oldX,p.z-oldZ);walking=distance>.001;const next=advanceFootsteps(steps,distance);steps=next.distance;if(next.steps)live.current.onStep?.();
        if(walking){const yaw=Math.atan2(movement.x,movement.z);player.rotation.y+=Math.atan2(Math.sin(yaw-player.rotation.y),Math.cos(yaw-player.rotation.y))*Math.min(1,dt*14);delta.set(p.x-controls.target.x,1.5-controls.target.y,p.z-controls.target.z).multiplyScalar(Math.min(1,dt*2));controls.target.add(delta);camera.position.add(delta);}
        if(isThroneExit(p.x,p.z)){live.current.onExit();return;}
      }
      if(!live.current.paused) guards.forEach(guard=>{
        const distance=Math.hypot(player.position.x-guard.player.position.x,player.position.z-guard.player.position.z);
        const target=live.current.reduceMotion?0:guardBowAtDistance(distance);
        guard.body.rotation.x=live.current.reduceMotion?0:THREE.MathUtils.damp(guard.body.rotation.x,target,4,dt);
      });
      const isNear=Math.hypot(player.position.x,player.position.z+13.15)<4.2;
      if(isNear!==wasNear){wasNear=isNear;setNearFelipe(isNear);}
      limbs.forEach((limb,i)=>{limb.rotation.x=walking&&!live.current.reduceMotion?Math.sin(clock*10)*.65*(i<2?1:-1)*(i%2?-1:1):THREE.MathUtils.damp(limb.rotation.x,0,14,dt);});
      body.position.y=walking&&!live.current.reduceMotion?Math.abs(Math.sin(clock*10))*.07:0;
      if(!live.current.paused&&!live.current.reduceMotion)typingArms.forEach((arm,i)=>{arm.rotation.x=-.65+Math.sin(clock*4+i*Math.PI)*.08;});
      if(!live.current.paused&&!live.current.reduceMotion)flames.forEach((flame,i)=>{flame.scale.y=.9+Math.sin(clock*7+i)*.12;});
      controls.enabled=!live.current.paused;controls.enableDamping=!live.current.reduceMotion;controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(draw);
    };
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;clear();}else if(!frame){previous=0;frame=requestAnimationFrame(draw);}};
    document.addEventListener('visibilitychange',visibility);if(!document.hidden)frame=requestAnimationFrame(draw);
    return ()=>{document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(frame);observer.disconnect();controls.dispose();clear();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('keydown',down);renderer.domElement.removeEventListener('blur',clear);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);window.removeEventListener('keydown',escape);scene.traverse(o=>{o.geometry?.dispose();if(o.isSprite){o.material.map?.dispose();o.material.dispose();}});materials.forEach(m=>m.dispose());plaqueMaterials.forEach(m=>{m.map.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();};
  },[keys]);
  useEffect(() => { mount.current?.querySelector('canvas')?.setAttribute('aria-label', language === 'en-US' ? '3D throne room. Use WASD or arrow keys to walk.' : 'Sal\u00e3o do trono tridimensional. Use WASD ou setas para caminhar.'); }, [language]);
  return <div className="throne-hall"><h1 className="sr-only">{language === 'en-US' ? 'Throne room' : 'Salão do trono'}</h1><div className="throne-viewport viewport"><div className="throne-canvas" ref={mount}/>{error && <div className="scene-error">{language === 'en-US' ? 'Could not open the 3D throne room in this browser.' : 'Não foi possível abrir o salão 3D neste navegador.'}</div>}<div className="scene-guide throne-guide"><div className="scene-caption"><span className="live-dot"/> {language === 'en-US' ? 'THRONE ROOM' : 'SALÃO DO TRONO'}</div><div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {language === 'en-US' ? 'or arrow keys to walk' : 'ou setas para caminhar'} {' '}<kbd>Shift</kbd> {language === 'en-US' ? 'to run' : 'para correr'}</span><span className="keyboard-guide">{language === 'en-US' ? 'Drag to turn the camera' : 'Arraste para girar a câmera'}</span><span className="touch-guide">{language === 'en-US' ? 'Use the arrows to walk drag to turn' : 'Use as setas para caminhar arraste para girar'}</span></div><small>{language === 'en-US' ? 'Return through the door to the village.' : 'Retorne pela porta para voltar à vila.'}</small></div>{nearFelipe && dialogue===null && <button className="felipe-talk" onClick={()=>talkRef.current?.()}>{language === 'en-US' ? 'Talk to Felipe' : 'Conversar com Felipe'} <kbd>F</kbd></button>}{dialogue!==null && <section className="npc-dialogue felipe-dialogue" aria-label={language === 'en-US' ? 'Conversation with Felipe Santos' : 'Conversa com Felipe Santos'}><div className="npc-dialogue-heading"><span className="npc-avatar">F</span><div><h2>Felipe Santos</h2><small>{language === 'en-US' ? 'Software engineer' : 'Engenheiro de software'}</small></div><button onClick={closeDialogue} aria-label={language === 'en-US' ? 'End conversation' : 'Encerrar conversa'}>&#215;</button></div><p aria-live="polite">{language === 'en-US' ? english.felipe[dialogue] : FELIPE_LINES[dialogue]}</p><div className="npc-dialogue-actions"><button disabled={!voiceEnabled} onClick={()=>speaking?onStop?.():onSpeak?.(dialogue)}>{speaking ? (language === 'en-US' ? 'Stop voice' : 'Parar voz') : (language === 'en-US' ? 'Listen' : 'Ouvir mensagem')}</button><button onClick={()=>talkRef.current?.()}>{language === 'en-US' ? 'Next message' : 'Outra mensagem'} &#8599;</button></div><small className="npc-voice-note">{voiceNotice || (!voiceEnabled ? (language === 'en-US' ? 'Enable voices in audio settings.' : 'Ative as vozes nas configura\u00e7\u00f5es de \u00e1udio.') : (language === 'en-US' ? 'American English voice' : 'Voz em portugu\u00eas'))}</small></section>}<button className="throne-exit" onClick={onExit}>{language === 'en-US' ? 'Back to the village' : 'Voltar à vila'}</button></div><div className="throne-touch" role="group" aria-label={language === 'en-US' ? 'Walking controls' : 'Controles de caminhada'}>{[['\u2191','w','para frente'],['\u2190','a','para a esquerda'],['\u2193','s','para tr\u00e1s'],['\u2192','d','para a direita']].map(([label,key,direction])=><button key={key} aria-label={language === 'en-US' ? ({w:'Walk forward',a:'Walk left',s:'Walk backward',d:'Walk right'}[key]) : `Caminhar ${direction}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)} onBlur={()=>keys.current.delete(key)}>{label}</button>)}<TouchInteract language={language} onInteract={() => talkRef.current?.()} disabled={paused || !nearFelipe || dialogue !== null} /></div></div>;
}
