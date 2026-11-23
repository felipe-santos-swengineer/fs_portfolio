import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createAdventurer, addFaceDetails } from './VillageScene';
import { advanceFootsteps } from './villageNavigation';
import { batchStaticBoxes } from './dungeonRendering';
import { advanceRuneSequence } from './runeSequence';
import { ENGLISH_GAMES, translateDungeonMessage, dungeonPortalLabel } from './dungeonI18n';
import { isDungeonPortalTap } from './dungeonPortalTap';
import './Dungeon.css';

const games = [
  { name: 'Cristais perdidos', help: 'Colete os cristais em duas rodadas antes que o tempo acabe.', color: '#65d6ef' },
  { name: 'Trilha r\u00fanica', help: 'Toque nas quatro runas na sequ\u00eancia indicada.', color: '#eac575' },
  { name: 'Fuja das sombras', help: 'Colete as quatro luzes antes do tempo acabar e evite as sombras.', color: '#e39acb' },
  { name: 'Caça aos orbes', help: 'Persiga os quatro orbes móveis antes do tempo acabar.', color: '#a9e788' },
  { name: 'Arena das criaturas', help: 'Derrote quatro criaturas com a espada antes do tempo acabar.', color: '#ef9e75' },
];
const targets = [[-2,-3],[2,-3],[-2,2],[2,2]];

export default function Dungeon({ language = 'pt-BR', keys, onExit, onSound, onStep, paused, reduceMotion }) {
  const en = language === 'en-US';
  const updateSigns = useRef(null);
  useEffect(() => { updateSigns.current?.(language); }, [language]);
  const mount = useRef(null); const state = useRef({ paused, reduceMotion }); state.current = { paused, reduceMotion, onExit, onSound, onStep, language };
  const [game, setGame] = useState(-1); const gameRef = useRef(-1); const [message, setMessage] = useState('Explore o corredor e aproxime-se de uma cela.');
  const nearRef = useRef(-1); const reset = useRef(null); const attackRef = useRef(null); const [score, setScore] = useState(0); const [wave, setWave] = useState(1); const [health, setHealth] = useState(10); const [recoveringHealth, setRecoveringHealth] = useState(false); const [hitCount, setHitCount] = useState(0);
  const select = useCallback(index => { gameRef.current = index; setGame(index); state.current.onSound?.('start'); keys.current.clear(); reset.current?.(index); if (index !== 1) setMessage(games[index].help); }, [keys]);
  const leaveGame = useCallback(() => { gameRef.current = -1; setGame(-1); keys.current.clear(); reset.current?.(-1); setMessage('Atravesse uma porta para iniciar um desafio.'); }, [keys]);
  useEffect(() => {
    const container = mount.current; let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch { setMessage('N\u00e3o foi poss\u00edvel abrir o cen\u00e1rio 3D neste navegador.'); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, container.clientWidth < 800 ? 1.15 : 1.5)); renderer.domElement.tabIndex = 0; renderer.domElement.setAttribute('aria-label', 'Calabou\u00e7o 3D. Use WASD ou setas para caminhar.'); container.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#10121b'); scene.fog = new THREE.Fog('#10121b', 25, 60);
    scene.add(new THREE.HemisphereLight('#a6bbd8', '#302219', 1.6)); const light = new THREE.DirectionalLight('#ddc5a1', 2); light.position.set(3, 16, 9); scene.add(light);
    const material = (color, glow = false) => new THREE.MeshStandardMaterial({ color, roughness: .8, ...(glow ? { emissive: color, emissiveIntensity: .8 } : {}) });
    const mesh = (parent, geometry, color, x, y, z, glow = false) => { const m = new THREE.Mesh(geometry, material(color, glow)); m.position.set(x,y,z); parent.add(m); return m; };
    const box = (p,w,h,d,c,x,y,z,g) => mesh(p,new THREE.BoxGeometry(w,h,d),c,x,y,z,g);
    const sphere = (p,r,c,x,y,z,g) => mesh(p,new THREE.IcosahedronGeometry(r,1),c,x,y,z,g);
    const cylinder = (p,r,h,c,x,y,z) => mesh(p,new THREE.CylinderGeometry(r,r,h,8),c,x,y,z);
    box(scene,98,.5,30,'#55565a',0,-.25,-3); box(scene,98,6,.6,'#45454c',0,3,-18); box(scene,.6,6,30,'#45454c',-49,3,-3); box(scene,.6,6,30,'#45454c',49,3,-3);
    for (let x=-48; x<=48; x+=2) for (let z=-17; z<=11; z+=2) box(scene,1.92,.04,1.92,(x+z)%4 ? '#5c5d60':'#505155',x,.02,z);
    [-28,-14,0,14,28].forEach((x,i) => { box(scene,14,.3,14,'#373c45',x,.04,-9); for (const side of [-1,1]) box(scene,.35,3.4,14,'#64666b',x+side*7,1.7,-9); for(let k=-5;k<=5;k+=1.5) { if(Math.abs(k)>1) box(scene,.12,3,.12,'#252b32',x+k,1.5,-2); } box(scene,14,.3,.4,'#787477',x,3.2,-2); const gem=sphere(scene,.3,games[i].color,x,3.7,-2,true); gem.scale.y=1.6; const torch=new THREE.PointLight(games[i].color,12,9); torch.position.set(x,3,-2); scene.add(torch); });
    // Celas fechadas nas extremidades, com prisioneiros apenas cenográficos.
    const prisoners=[];
    [-42,42].forEach((x,i)=>{
      box(scene,14,.3,14,'#34383f',x,.04,-9);
      for(const side of [-1,1]) box(scene,.35,3.4,14,'#64666b',x+side*7,1.7,-9);
      box(scene,14,.3,.4,'#787477',x,3.2,-2);
      for(let k=-6;k<=6;k+=1) box(scene,.13,3,.13,'#252b32',x+k,1.5,-2);
      const prisoner=new THREE.Group();prisoner.position.set(x,.2,-8);scene.add(prisoner);
      const torso=new THREE.Group();prisoner.add(torso);
      box(torso,.78,.92,.48,i?'#675949':'#66504a',0,1.12,0);
      box(torso,.84,.16,.52,'#8b795f',0,.9,0);box(torso,.14,.19,.55,'#bea777',0,.9,.02);
      sphere(torso,.32,'#ba987e',0,1.88,0);box(torso,.45,.35,.17,i?'#a88b68':'#76503b',0,1.68,.26);addFaceDetails(torso,{box,sphere},{headY:1.88,skin:'#ba987e',radius:.32,eyes:true,mouthDepth:.36});
      cylinder(torso,.35,.14,'#707c80',0,2.12,0);const helmet=mesh(torso,new THREE.SphereGeometry(.34,12,8,0,Math.PI*2,0,Math.PI/2),'#859498',0,2.15,0);helmet.scale.y=.75;
      [-1,1].forEach(side=>{const horn=mesh(torso,new THREE.ConeGeometry(.11,.4,7),'#d3c09a',side*.38,2.18,0);horn.rotation.z=side*-.55;box(torso,.25,.65,.26,'#6f6057',side*.48,1.12,0);sphere(torso,.11,'#ba987e',side*.48,.76,0);});
      const legs=[-1,1].map(side=>{const leg=new THREE.Group();leg.position.set(side*.22,.8,0);torso.add(leg);box(leg,.25,.55,.26,'#4a4b4a',0,-.28,0);box(leg,.29,.16,.39,'#514138',0,-.59,.05);return leg;});
      const speechCanvas=document.createElement('canvas');speechCanvas.width=768;speechCanvas.height=240;const speechCtx=speechCanvas.getContext('2d');const speechTexture=new THREE.CanvasTexture(speechCanvas);speechTexture.colorSpace=THREE.SRGBColorSpace;
      const bubble=new THREE.Sprite(new THREE.SpriteMaterial({map:speechTexture,transparent:true,depthTest:false,depthWrite:false}));bubble.position.set(0,3.6,0);bubble.scale.set(5.3,1.65,1);bubble.renderOrder=5;prisoner.add(bubble);
      const phrases=i===0?['N\u00e3o sei h\u00e1 quanto tempo estou aqui.','Sinto falta do vento do mar.','Ser\u00e1 que algu\u00e9m vir\u00e1 nos buscar?']:['Que escuro, tenho medo.','Ouvi passos no corredor...','Espero ver a luz do sol outra vez.'];
      const drawSpeech=index=>{const englishPhrases=i===0?['I do not know how long I have been here.','I miss the sea breeze.','Will anyone come for us?']:['It is so dark. I am afraid.','I heard footsteps in the corridor...','I hope to see the sun again.'];const text=state.current.language==='en-US'?englishPhrases[index]:phrases[index];speechCtx.clearRect(0,0,768,240);speechCtx.fillStyle='#f4ead3';speechCtx.strokeStyle='#9a7e5e';speechCtx.lineWidth=5;speechCtx.beginPath();speechCtx.roundRect(10,10,748,188,22);speechCtx.fill();speechCtx.stroke();speechCtx.beginPath();speechCtx.moveTo(354,196);speechCtx.lineTo(386,229);speechCtx.lineTo(413,196);speechCtx.fill();speechCtx.fillStyle='#27313a';speechCtx.textAlign='center';speechCtx.font='bold 35px sans-serif';const words=text.split(' ');let line='',lines=[];words.forEach(word=>{const next=line?line+' '+word:word;if(speechCtx.measureText(next).width>675){lines.push(line);line=word;}else line=next;});lines.push(line);lines.forEach((value,n)=>speechCtx.fillText(value,384,lines.length===1?115:92+n*48));speechTexture.needsUpdate=true;};
      drawSpeech(0);prisoners.push({prisoner,torso,legs,center:x,phase:i*Math.PI,drawSpeech,lastPhrase:0});
      box(scene,2.5,.3,1,'#51463e',x+3,.55,-14.7);
    });
    games.forEach((game,i)=>{ const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=128; const ctx=canvas.getContext('2d'); const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace; const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:texture})); sign.userData.setLanguage=lang=>{ctx.fillStyle='#201d20';ctx.fillRect(0,0,512,128);ctx.strokeStyle=game.color;ctx.lineWidth=5;ctx.strokeRect(4,4,504,120);ctx.fillStyle='#f4e3c2';ctx.textAlign='center';ctx.font='bold 34px sans-serif';ctx.fillText(lang==='en-US'?ENGLISH_GAMES[i][0]:game.name,256,78);texture.needsUpdate=true;}; sign.userData.setLanguage(state.current.language);sign.position.set(i*14-28,4.6,-1.9);sign.scale.set(5,1.25,1);scene.add(sign); });
    updateSigns.current=lang=>scene.traverse(object=>object.userData.setLanguage?.(lang));
    // Alvenaria, tochas, correntes e mobiliário do castelo.
    for (let row=0; row<5; row++) for (let x=-48; x<49; x+=2) {
      const brick=box(scene,1.9,.82,.18,(row+x)%4?'#57555a':'#49484e',x+(row%2),.55+row,-17.65); brick.rotation.z=(x%3)*.005;
    }
    for (const side of [-1,1]) for (let row=0;row<5;row++) for(let z=-17;z<12;z+=2) { const brick=box(scene,1.9,.82,.18,(row+z)%4?'#57555a':'#49484e',side*48.65,.55+row,z+(row%2)); brick.rotation.y=Math.PI/2; }
    const flames=[];
    [-22,-16,-10,-4,2,8,14,20].forEach((x,i)=>{
      box(scene,.18,1,.2,'#503a2e',x,2.35,-17.2);
      const flame=mesh(scene,new THREE.ConeGeometry(.28,.8,8),'#ff9d42',x,3.12,-17.1,true); flames.push(flame);
      if (i % 2 === 0) { const glow=new THREE.PointLight('#ff9b45',12,12); glow.position.set(x,3,-16.4); scene.add(glow); }
    });
    batchStaticBoxes(scene);
    const spawnPortals=[-46,46].map(x=>{ const gate=new THREE.Group();gate.position.set(x,0,8);gate.rotation.y=x<0?Math.PI/2:-Math.PI/2;scene.add(gate);cylinder(gate,1.5,.2,'#5e4446',0,.15,0);mesh(gate,new THREE.TorusGeometry(1.25,.18,12,32),'#ef5d52',0,1.8,0,true);const surface=new THREE.Mesh(new THREE.CircleGeometry(1.08,32),new THREE.MeshBasicMaterial({color:'#ad202a',side:THREE.DoubleSide,transparent:true,opacity:.8}));surface.position.set(0,1.8,0);gate.add(surface);const glow=new THREE.PointLight('#ef4540',15,8);glow.position.set(0,2,0);gate.add(glow);return gate;});
    const returnPortal = new THREE.Group(); returnPortal.position.set(0,0,9.8); scene.add(returnPortal);
    cylinder(returnPortal,1.9,.2,'#666876',0,.15,0);
    mesh(returnPortal,new THREE.TorusGeometry(1.45,.18,12,40),'#8ecce4',0,2.0,0,true);
    const portalSurface = new THREE.Mesh(new THREE.CircleGeometry(1.26,40),new THREE.MeshBasicMaterial({color:'#6a9de2',transparent:true,opacity:.8,side:THREE.DoubleSide})); portalSurface.position.set(0,2,0); returnPortal.add(portalSurface);
    const portalGlow = new THREE.PointLight('#84bfff',15,8); portalGlow.position.set(0,2,0); returnPortal.add(portalGlow);
    const portalLabel=document.createElement('canvas'); portalLabel.width=512; portalLabel.height=128;
    const portalCtx=portalLabel.getContext('2d');
    const portalTexture=new THREE.CanvasTexture(portalLabel); portalTexture.colorSpace=THREE.SRGBColorSpace;
    const portalSign=new THREE.Sprite(new THREE.SpriteMaterial({map:portalTexture}));
    portalSign.userData.setLanguage=lang=>{
      portalCtx.fillStyle='#201d20'; portalCtx.fillRect(0,0,512,128); portalCtx.strokeStyle='#8ecce4';
      portalCtx.lineWidth=5; portalCtx.strokeRect(4,4,504,120); portalCtx.fillStyle='#f4e3c2';
      portalCtx.textAlign='center'; portalCtx.font='bold 34px sans-serif'; portalCtx.fillText(dungeonPortalLabel(lang),256,78);
      portalTexture.needsUpdate=true;
    };
    portalSign.userData.setLanguage(state.current.language); portalSign.position.set(0,4.4,9.8); portalSign.scale.set(5,1.25,1); scene.add(portalSign);
    const { player, body, limbs, sword } = createAdventurer(scene,{box,sphere,mesh,cylinder}); player.position.set(0,.2,8);
    const objects = []; for (let i=0;i<4;i++) { const gem=mesh(scene,new THREE.OctahedronGeometry(.5),['#eac575','#65d6ef','#e39acb','#8fe4a4'][i],0,.7,0,true); objects.push(gem); }
    const soldiers=[-1,1].map(side=>{
      const guard=createAdventurer(scene,{box,sphere,mesh,cylinder},{armored:true});guard.player.position.set(side*6,.2,4);
      box(guard.body,.79,.76,.49,'#768b91',0,1.2,0);box(guard.body,.12,.68,.51,'#b4c3c4',0,1.2,.01);
      mesh(guard.body,new THREE.SphereGeometry(.36,12,8,0,Math.PI*2,0,Math.PI*.48),'#74868a',0,1.94,-.02);[-1,1].forEach(side=>box(guard.body,.12,.3,.15,'#65787e',side*.31,1.85,.18));box(guard.body,.65,.1,.18,'#65787e',0,2.01,.2);
      box(guard.body,.18,.2,.2,'#a9b6b3',0,2.28,0);
      [-1,1].forEach(side=>{box(guard.body,.34,.22,.5,'#99a9aa',side*.49,1.55,0);box(guard.limbs[side<0?0:2],.29,.45,.29,'#65777e',0,-.3,0);box(guard.limbs[side<0?1:3],.28,.38,.29,'#87989c',0,-.3,0);});
      const shield=box(guard.limbs[1],.48,.7,.13,'#5e6d7b',0,-.35,.25);shield.rotation.z=.12;
      return {...guard,target:null,home:side*6,lastStrike:-10,hp:5,respawnAt:0,deathAt:0};
    });
    const shadows = [0,1].map(() => sphere(scene,.65,'#723d79',0,.7,0,true));
    // Criaturas surgem no pátio e também na cela da arena.
    const monsters=[]; let defeated=0, lastAttack=-10, attackUntil=0, nextSpawn=5, arenaHits=0, waveNumber=1, waveSpawned=0;
    const spawnMonster=(x,z,arena=false,boss=false)=>{
      const group=new THREE.Group();group.position.set(x,.15,z); const type=arena?1:Math.floor(Math.random()*3); const color=boss?'#a74355':['#82a65b','#9b75ac','#c28b50'][type]; const size=boss?1.5:[.7,.85,.65][type];
      const creature=sphere(group,size,color,0,size,0);creature.scale.set(1,.85,.9);
      [-1,1].forEach(side=>{sphere(group,.11*size/.7,'#f8e9ad',side*.3*size/.7,size*1.25,size*.75,true);sphere(group,.05*size/.7,'#25252c',side*.3*size/.7,size*1.25,size*.87);box(group,.18*size/.7,.3*size/.7,.2*size/.7,'#596546',side*size*.55,.15,0);if(type===1||boss){const horn=mesh(group,new THREE.ConeGeometry(.15*size/.7,.55*size/.7,6),'#ded1a2',side*size*.55,size*1.75,0);horn.rotation.z=side*.3;}});
      [-1,1].forEach(side=>{const brow=box(group,.22*size/.7,.045*size/.7,.06*size/.7,'#425048',side*.3*size/.7,size*1.45,size*.76);brow.rotation.z=side*-.15;});
      sphere(group,.08*size/.7,'#536458',0,size*.96,size*.88);
      box(group,.34*size/.7,.06*size/.7,.04*size/.7,'#3b3434',0,size*.7,size*.85);
      const hp=boss?8:arena?1:[1,2,3][type];let bar=null,fill=null;
      if(boss){const barGroup=new THREE.Group();barGroup.position.y=size*2.3;box(barGroup,2.4,.22,.07,'#302b31',0,0,0);fill=box(barGroup,2.2,.14,.08,'#db534d',0,0,.05);bar=barGroup;group.add(bar);}
      scene.add(group);monsters.push({group,arena,phase:Math.random()*6,hp,maxHp:hp,fill,boss,lastStrike:-10,speed:boss?.52:[.85,.62,.48][type]});
    };
    const removeMonster=index=>{const [m]=monsters.splice(index,1);scene.remove(m.group);m.group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});};
    const attack=()=>{if(state.current.paused || playerRecovering || clock-lastAttack<.6 || (gameRef.current===4 && !active))return;lastAttack=clock;attackUntil=clock+.45;state.current.onSound?.('attack');let kills=0;for(let i=monsters.length-1;i>=0;i--){const m=monsters[i];if(m.arena!==(gameRef.current===4)||(gameRef.current>=0&&gameRef.current!==4))continue;const dx=m.group.position.x-player.position.x,dz=m.group.position.z-player.position.z,distance=Math.hypot(dx,dz);const facing=(Math.sin(player.rotation.y)*dx+Math.cos(player.rotation.y)*dz)/Math.max(distance,.001);if(distance<2.8&&facing>-.15){m.hp--;if(m.fill){m.fill.scale.x=m.hp/m.maxHp;m.fill.position.x=-1.1*(1-m.hp/m.maxHp);}if(m.hp<=0){removeMonster(i);state.current.onSound?.('defeat');kills++;if(m.arena)arenaHits++;else defeated++;}else state.current.onSound?.('collect');}}if(kills){setScore(defeated);if(gameRef.current===4){if(arenaHits>=4){active=false;state.current.onSound?.('win');setMessage('Arena concluída! Atravesse a porta para voltar ao pátio.');}else setMessage(`${arenaHits} de 4 criaturas derrotadas.`);}else setMessage(`Criaturas derrotadas no pátio: ${defeated}.`);}};
    attackRef.current=attack;
    const camera = new THREE.PerspectiveCamera(45,1,.1,100); camera.position.set(0,18,24); const controls = new OrbitControls(camera,renderer.domElement); controls.target.set(0,1.1,0); controls.enablePan=false; controls.enableDamping=true; controls.dampingFactor=.07; controls.maxPolarAngle=Math.PI/2-.15; controls.minDistance=7; controls.maxDistance=38; controls.update();
    const resize=()=>{ const w=container.clientWidth,h=container.clientHeight; renderer.setSize(w,h); camera.aspect=w/Math.max(h,1); camera.updateProjectionMatrix(); }; const observer=new ResizeObserver(resize); observer.observe(container); resize();
    let count=0, active=false, touching=-1, round=1, started=0, sequence=[], clock=0, playerHealth=10, playerHitAt=-10, lastHeal=0, playerRecovering=false, deathAt=0, wasRegenerating=false;
    const colors=['dourada','azul','rosa','verde'];
    const shuffle=()=>[0,1,2,3].sort(()=>Math.random()-.5);
    const setup = index => { for(let i=monsters.length-1;i>=0;i--)if(monsters[i].arena)removeMonster(i); arenaHits=0; if(index===4){ [[-2,-8],[2,-8],[-2,-4],[2,-4]].forEach(([x,z])=>spawnMonster(28+x*1.5,z-3,true)); } count=0; round=1; sequence=shuffle(); active=index>=0; touching=-1; started=clock; player.position.set(index<0?player.position.x:index*14-28,.2,index<0?-0.4:-3); objects.forEach((o,i)=>{o.visible=index>=0 && index!==4; o.position.set(index*14-28+targets[i][0]*1.8,.75,targets[i][1]*1.7-9);}); shadows.forEach(o=>{o.visible=index===2;}); camera.position.set(player.position.x,15,player.position.z+19); controls.target.set(player.position.x,1.1,player.position.z); if(index===1) setMessage(`Sequ\u00eancia: ${sequence.map(n=>colors[n]).join(', ')}. Comece pela ${colors[sequence[0]]}.`); };

    reset.current=setup; setup(-1);
    const down=e=>{if(!state.current.paused && ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(e.key.toLowerCase())) {if(e.key.toLowerCase()!=='shift')e.preventDefault();keys.current.add(e.key.toLowerCase());} if((e.key===' ' || e.key.toLowerCase()==='j') && !e.repeat){e.preventDefault();attack();} if(e.key.toLowerCase()==='e' && gameRef.current<0 && nearRef.current>=0) {e.preventDefault(); select(nearRef.current);} }; const up=e=>keys.current.delete(e.key.toLowerCase()); const clear=()=>keys.current.clear(); renderer.domElement.addEventListener('keydown',down); renderer.domElement.addEventListener('blur',clear); window.addEventListener('keyup',up); window.addEventListener('blur',clear);
    let portalPointer=null, exitRequested=false;
    const exitDungeon=()=>{if(exitRequested)return;exitRequested=true;clear();state.current.onExit();};
    const portalRaycaster=new THREE.Raycaster(),portalPointerPosition=new THREE.Vector2();
    const pointerDown=e=>{if(e.isPrimary && e.button===0)portalPointer={id:e.pointerId,x:e.clientX,y:e.clientY};};
    const pointerUp=e=>{
      const start=portalPointer;portalPointer=null;
      if(!isDungeonPortalTap(start,e,state.current.paused,gameRef.current>=0))return;
      const bounds=renderer.domElement.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
      portalPointerPosition.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);
      portalRaycaster.setFromCamera(portalPointerPosition,camera);
      if(portalRaycaster.intersectObjects([returnPortal,portalSign],true).length)exitDungeon();
    };
    const pointerCancel=()=>{portalPointer=null;};
    renderer.domElement.addEventListener('pointerdown',pointerDown);
    renderer.domElement.addEventListener('pointerup',pointerUp);
    renderer.domElement.addEventListener('pointercancel',pointerCancel);
    const forward=new THREE.Vector3(),right=new THREE.Vector3(),move=new THREE.Vector3(), delta=new THREE.Vector3(); let frame, previous=0, stepDistance=0;
    const draw=time=>{ if(document.hidden){frame=0;previous=0;return;} const dt=Math.min((time-previous)/1000||0,.04); previous=time; if(!state.current.paused) clock+=dt; const k=keys.current; const mx=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('arrowleft')), mz=Number(k.has('w')||k.has('arrowup'))-Number(k.has('s')||k.has('arrowdown')); let walking=false; const p=player.position; const current=gameRef.current;
      if(!state.current.paused && !playerRecovering && (mx||mz)) { camera.getWorldDirection(forward); forward.y=0; forward.normalize(); right.crossVectors(forward,camera.up).normalize(); move.copy(forward).multiplyScalar(mz).addScaledVector(right,mx).normalize().multiplyScalar(dt*4.2*(k.has('shift')?1.8:1)); const oldX=p.x, oldZ=p.z; const minX=current<0?-48:current*14-33.5,maxX=current<0?48:current*14-22.5; p.x=THREE.MathUtils.clamp(p.x+move.x,minX,maxX); p.z=THREE.MathUtils.clamp(p.z+move.z,current<0?-1.75:-15.5,current<0?10:-1.5); const displacement=Math.hypot(p.x-oldX,p.z-oldZ); walking=displacement>.001; const footsteps=advanceFootsteps(stepDistance,displacement);stepDistance=footsteps.distance;if(footsteps.steps)state.current.onStep?.(); if(walking){const yaw=Math.atan2(move.x,move.z); player.rotation.y+=Math.atan2(Math.sin(yaw-player.rotation.y),Math.cos(yaw-player.rotation.y))*Math.min(1,dt*14); delta.set(p.x-controls.target.x,1.1-controls.target.y,p.z-controls.target.z).multiplyScalar(Math.min(1,dt*2)); camera.position.add(delta); controls.target.add(delta);} }
      if(!state.current.paused && current<0){const courtyard=monsters.filter(m=>!m.arena).length;if(waveSpawned>=5 && courtyard===0){waveNumber++;waveSpawned=0;setWave(waveNumber);setMessage(`Onda ${waveNumber} se aproxima!`);nextSpawn=clock+3;}if(clock>=nextSpawn && waveSpawned<5 && courtyard<5){const gate=spawnPortals[waveSpawned%2];const x=gate.position.x+(gate.position.x<0?1:-1),z=gate.position.z-1;if(Math.hypot(x-p.x,z-p.z)>2){spawnMonster(x,z,false,waveNumber%3===0 && waveSpawned===4);waveSpawned++;}nextSpawn=clock+2.5;}}
      soldiers.forEach((guard,index)=>{
        if(!state.current.paused && guard.hp<=0 && clock>=guard.respawnAt){guard.hp=5;guard.target=null;guard.player.position.set(guard.home,.2,4);guard.body.rotation.z=0;setMessage('Um soldado retornou ao pátio.');}
        guard.player.visible=current<0 && (guard.hp>0 || clock-guard.deathAt<1.5);
        if(guard.hp<=0){guard.body.rotation.z=state.current.reduceMotion?Math.PI/2:Math.min(1,(clock-guard.deathAt)/.7)*Math.PI/2;return;}
        if(state.current.paused || current>=0)return;
        if(guard.target && (!monsters.includes(guard.target) || Math.abs(guard.target.group.position.x)>42 || (guard.home<0 ? guard.target.group.position.x>=0 : guard.target.group.position.x<0))) guard.target=null;
        if(!guard.target) guard.target=monsters.filter(m=>!m.arena && Math.abs(m.group.position.x)<=42 && (guard.home<0 ? m.group.position.x<0 : m.group.position.x>=0) && !soldiers.some(other=>other!==guard && other.target===m)).sort((a,b)=>guard.player.position.distanceTo(a.group.position)-guard.player.position.distanceTo(b.group.position))[0] || null;
        if(guard.target){const target=guard.target.group.position;const dx=target.x-guard.player.position.x,dz=target.z-guard.player.position.z,d=Math.hypot(dx,dz);guard.player.rotation.y=Math.atan2(dx,dz);if(d>1.7){guard.player.position.x+=dx/d*dt*2.5;guard.player.position.z+=dz/d*dt*2.5; guard.player.position.x=THREE.MathUtils.clamp(guard.player.position.x,-42,42);}guard.limbs.forEach((limb,i)=>{limb.rotation.x=d>1.7&&!state.current.reduceMotion?Math.sin(clock*8)*(i%2?.35:-.35):0;});if(d<=1.9 && clock-guard.lastStrike>=1.1){guard.lastStrike=clock;const m=guard.target;m.hp-=m.maxHp/4;if(m.fill){m.fill.scale.x=Math.max(0,m.hp/m.maxHp);m.fill.position.x=-1.1*(1-Math.max(0,m.hp/m.maxHp));}if(m.hp<=0){const monsterIndex=monsters.indexOf(m);if(monsterIndex>=0){removeMonster(monsterIndex);defeated++;setScore(defeated);}guard.target=null;}}const swing=Math.max(0,1-(clock-guard.lastStrike)/.4);guard.sword.rotation.x=state.current.reduceMotion?.15:.15+Math.sin((1-swing)*Math.PI)*1.2;}
        else {const dx=guard.home-guard.player.position.x,dz=4-guard.player.position.z,d=Math.hypot(dx,dz);if(d>.1){guard.player.position.x+=dx/d*Math.min(d,dt*1.5);guard.player.position.z+=dz/d*Math.min(d,dt*1.5);guard.player.rotation.y=Math.atan2(dx,dz);}guard.limbs.forEach((limb,i)=>{limb.rotation.x=d>.1&&!state.current.reduceMotion?Math.sin(clock*8)*(i%2?.35:-.35):0;});guard.sword.rotation.x=.15;}
      });
      const regenerating=!playerRecovering && playerHealth<10 && clock-playerHitAt>=5;
      if(regenerating!==wasRegenerating){wasRegenerating=regenerating;setRecoveringHealth(regenerating);}
      if(!state.current.paused && regenerating && clock-lastHeal>=3){playerHealth++;lastHeal=clock;setHealth(playerHealth);}
      monsters.forEach(m=>{
        const relevant=m.arena?current===4:current<0;m.group.visible=relevant;
        if(state.current.paused || !relevant)return;
        const defender=!m.arena && soldiers.find(guard=>guard.hp>0 && guard.target===m);
        const destination=defender?defender.player.position:p;
        const dx=destination.x-m.group.position.x,dz=destination.z-m.group.position.z,d=Math.hypot(dx,dz);
        if(d>1.1){m.group.position.x+=dx/d*dt*(m.arena?1.1:m.speed);m.group.position.z+=dz/d*dt*(m.arena?1.1:m.speed);}
        else if(clock-m.lastStrike>=1.6){
          m.lastStrike=clock;if(!defender)state.current.onSound?.('monsterAttack');
          if(defender){defender.hp--;if(defender.hp<=0){defender.target=null;defender.deathAt=clock;defender.respawnAt=clock+15;}}
          else if(clock-playerHitAt>=1.2 && !playerRecovering){playerHealth=Math.max(0,playerHealth-1);playerHitAt=clock;lastHeal=clock;setHealth(playerHealth);setHitCount(n=>n+1);state.current.onSound?.('wrong');if(playerHealth===0){playerRecovering=true;deathAt=clock;keys.current.clear();setMessage('Voc\u00ea caiu! Retornando ao p\u00e1tio...');}}
        }
        m.group.rotation.y=Math.atan2(dx,dz);if(m.fill)m.fill.parent.quaternion.copy(m.group.quaternion).invert().multiply(camera.quaternion);
        m.group.position.y=.15+(state.current.reduceMotion?0:Math.abs(Math.sin(clock*4+m.phase))*.16);
        const strike=state.current.reduceMotion?0:Math.max(0,1-(clock-m.lastStrike)/.35);m.group.scale.z=1+strike*.35;
      });
      if(playerRecovering){body.rotation.z=state.current.reduceMotion?Math.PI/2:Math.min(1,(clock-deathAt)/.7)*Math.PI/2;if(clock-deathAt>=1.5){playerRecovering=false;body.rotation.z=0;playerHealth=10;setHealth(10);playerHitAt=clock+2;lastHeal=clock;gameRef.current=-1;setGame(-1);keys.current.clear();player.position.x=0;setup(-1);setMessage('Voc\u00ea retornou ao p\u00e1tio com a vida restaurada.');}controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(draw);return;}

      limbs.forEach((limb,i)=>{limb.rotation.x=walking&&!state.current.reduceMotion?Math.sin(clock*10)*.65*(i<2?1:-1)*(i%2?-1:1):THREE.MathUtils.damp(limb.rotation.x,0,14,dt);}); if(clock<attackUntil && !state.current.reduceMotion){const progress=1-(attackUntil-clock)/.45;sword.rotation.x=.15+1.45*Math.sin(progress*Math.PI);}else sword.rotation.x=.15; body.position.y=walking&&!state.current.reduceMotion?Math.abs(Math.sin(clock*10))*.06:0;
      if (!state.current.paused && current<0 && Math.hypot(p.x,p.z-9.8)<1.15) { exitDungeon(); return; }
      if (!state.current.paused && current<0 && walking) { let n=-1; [-28,-14,0,14,28].forEach((x,i)=>{if(Math.abs(p.x-x)<1.1 && p.z < -1.35)n=i;}); nearRef.current=n; if(n>=0) select(n); }
      if (!state.current.paused && current>=0) { if (p.z > -2.15) { leaveGame(); frame=requestAnimationFrame(draw); return; } }
      prisoners.forEach((person,i)=>{
        const speechIndex=Math.floor((clock+i*3)/8)%3;if(speechIndex!==person.lastPhrase || person.lastLanguage!==state.current.language){person.lastPhrase=speechIndex;person.lastLanguage=state.current.language;person.drawSpeech(speechIndex);}
        if(state.current.paused || document.hidden || state.current.reduceMotion)return;
        const phase=clock*.55+person.phase;person.prisoner.position.x=person.center+Math.sin(phase)*3.5;person.prisoner.rotation.y=Math.cos(phase)>=0?Math.PI/2:-Math.PI/2;
        person.legs.forEach((leg,n)=>{leg.rotation.x=Math.sin(clock*5+person.phase)*(n?-0.4:0.4);});person.torso.position.y=Math.abs(Math.sin(clock*5+person.phase))*.04;
      });
      flames.forEach((f,i)=>{if(!state.current.reduceMotion) f.scale.y=.8+Math.sin(clock*7+i)*.18;});
      if(current>=0 && active && !state.current.paused){
        if(current!==1 && clock-started > 45) { active=false; state.current.onSound?.('wrong'); setMessage('O tempo acabou. Volte ao corredor ou recomece o desafio.'); }
        objects.forEach((o,i)=>{ if(!active || !o.visible)return; if(current===3){o.position.x=14+targets[i][0]*1.8+Math.sin(clock*1.4+i)*.8;o.position.z=targets[i][1]*1.7-9+Math.cos(clock*1.2+i)*.7;} o.rotation.y+=dt; if(Math.hypot(p.x-o.position.x,p.z-o.position.z)<.85 && touching!==i){
          touching=i; state.current.onSound?.('collect');
          if(current===1) {
            const result=advanceRuneSequence(sequence,count,i);count=result.progress;
            if(result.outcome==='wrong'){state.current.onSound?.('wrong');setMessage(`Sequ\u00eancia incorreta. Comece pela ${colors[sequence[0]]}: ${sequence.map(n=>colors[n]).join(', ')}.`);}
            else if(result.outcome==='complete'){active=false;state.current.onSound?.('win');setMessage('Todas as runas ativadas! Desafio conclu\u00eddo.');}
            else setMessage(`Runa correta (${count}/4). Pr\u00f3xima: ${colors[sequence[count]]}.`);

          } else { o.visible=false; count++; if(count===4) { if(current===0 && round===1){round=2;count=0; const shuffled=shuffle(); objects.forEach((gem,j)=>{gem.visible=true;gem.position.set(-28+targets[shuffled[j]][0]*1.8,.75,targets[shuffled[j]][1]*1.7-9);});setMessage('Rodada 2! Colete os cristais novamente antes do tempo acabar.');} else {active=false; state.current.onSound?.('win'); setMessage('Desafio conclu\u00eddo! Atravesse a porta para voltar ao corredor.');} } else setMessage(`${count} de 4 coletados. Tempo restante: ${Math.max(0,Math.ceil(45-(clock-started)))}s.`); }
        }}); if(!objects.some(o=>o.visible && Math.hypot(p.x-o.position.x,p.z-o.position.z)<1))touching=-1;
        if(current===2 && active){ shadows.forEach((o,i)=>{o.position.set(Math.sin(clock*(i?1.3:1))*4,.7,-9+Math.cos(clock*(i?1:1.4))*2.5); if(Math.hypot(p.x-o.position.x,p.z-o.position.z)<1){setup(2);state.current.onSound?.('wrong');setMessage('Uma sombra alcan\u00e7ou voc\u00ea. Tente novamente!');}}); }
      }
      controls.enabled=!state.current.paused; controls.update(); renderer.render(scene,camera); frame=requestAnimationFrame(draw);
    };
    const visibility = () => { if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;keys.current.clear();} else if(!frame){previous=0;frame=requestAnimationFrame(draw);} };
    document.addEventListener('visibilitychange',visibility);
    if(!document.hidden)frame=requestAnimationFrame(draw);
    return ()=>{document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(frame);observer.disconnect();controls.dispose();clear();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',pointerCancel);renderer.domElement.removeEventListener('keydown',down);renderer.domElement.removeEventListener('blur',clear);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.map?.dispose();m.dispose();});});renderer.dispose();renderer.domElement.remove();updateSigns.current=null;reset.current=null;attackRef.current=null;};
  }, [keys, select, leaveGame]);
  useEffect(() => { mount.current?.querySelector('canvas')?.setAttribute('aria-label', language === 'en-US' ? '3D dungeon. Use WASD or arrow keys to walk.' : 'Calabou\u00e7o 3D. Use WASD ou setas para caminhar.'); }, [language]);
  return <div className="dungeon"><h1 className="sr-only">{en ? 'Challenge dungeon' : 'Calabouço dos desafios'}</h1><div className="dungeon-view viewport"><div ref={mount} className="dungeon-canvas" /><div className="scene-guide dungeon-guide"><div className="scene-caption"><span className="live-dot" /> {en ? 'CHALLENGE DUNGEON' : 'CALABOUÇO DOS DESAFIOS'}</div><div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en ? 'or arrow keys to walk' : 'ou setas para caminhar'}</span><span className="keyboard-guide"><kbd>J</kbd> {en ? 'or' : 'ou'} <kbd>{en ? 'Space' : 'Espaço'}</kbd> {en ? 'to attack · drag to turn' : 'atacar · arraste para girar'}</span><span className="touch-guide">{en ? 'Use the arrows to walk · drag to turn' : 'Use as setas para caminhar · arraste para girar'}</span></div><div className="dungeon-guide-note">{en ? 'Walk through a door to play or use the portal to return to the village.' : 'Atravesse uma porta para jogar ou use o portal para voltar à vila.'}</div></div><div className="dungeon-status" role="status">{game>=0 && <strong>{en ? ENGLISH_GAMES[game][0] : games[game].name}: </strong>}{translateDungeonMessage(message, language, games)}</div><div className="quest dungeon-quest"><span className="quest-icon">&#9876;</span><div><small>{en ? 'DUNGEON COURTYARD' : 'PÁTIO DO CALABOUÇO'}</small><p>{en ? 'Wave' : 'Onda'} {wave} · {en ? 'Creatures defeated' : 'Criaturas derrotadas'}: {score}</p></div></div><div key={hitCount} className={`dungeon-health ${hitCount ? "health-hit" : ""} ${recoveringHealth ? "health-regenerating" : ""}`} role="status" aria-label={`${en ? "Health" : "Vida"}: ${health} ${en ? "of" : "de"} 10${recoveringHealth ? (en ? ", regenerating" : ", regenerando") : ""}`}><strong>{en ? "HEALTH" : "VIDA"}</strong><span className="health-bar" aria-hidden="true"><span className="health-fill" style={{width:`${health * 10}%`}} /></span><b>{health}/10</b></div></div>{game>=0 && <div className="dungeon-actions destinations"><button onClick={()=>select(game)}>{en ? 'Restart challenge' : 'Recomeçar desafio'}</button><button onClick={leaveGame}>{en ? 'Back to corridor' : 'Voltar ao corredor'}</button></div>}<div className="dungeon-touch" role="group" aria-label={en ? 'Walking controls' : 'Controles de caminhada'}>{[['\u2191','w'],['\u2190','a'],['\u2193','s'],['\u2192','d']].map(([label,key])=><button key={key} aria-label={`${en ? 'Walk' : 'Caminhar'} ${key}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);keys.current.add(key);}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)} onBlur={()=>keys.current.delete(key)}>{label}</button>)}<button className="dungeon-touch-attack" onClick={()=>attackRef.current?.()} disabled={game>=0 && game!==4} aria-label={en ? 'Attack with sword' : 'Atacar com espada'}>⚔ {en ? 'Attack' : 'Atacar'}</button></div></div>;
}
