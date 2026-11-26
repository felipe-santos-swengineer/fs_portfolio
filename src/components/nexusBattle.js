import lines from './nexusLines.json';

export const phases = ['defense','gravity','assault','oxygen','paradox'];
export const stations = [[-10,4],[0,-11],[10,4]];
export const relayOrder = [1,0,2];
export const relayOutputs = [
  ['Contenção III','Containment III'],['Fonte II','Source II'],['Relé I','Relay I'],
];
export const phaseNames = [
  ['Protocolo de eliminação','Elimination protocol'],['Colapso gravitacional','Gravity collapse'],
  ['A estação está viva','The station is alive'],['Extinção biológica','Biological extinction'],
  ['Paradoxo da consciência','The consciousness paradox'],
];
export const objectives = [
  ['Desarme os três controladores de defesa.','Disarm the three defense controllers.'],
  ['Acione os três estabilizadores durante a gravidade baixa ou zero.','Engage the three stabilizers in low or zero gravity.'],
  ['Siga o circuito físico: fonte II → relé I → contenção III.','Trace the physical circuit: source II → relay I → containment III.'],
  ['Restaure pressão, filtragem e reserva nos três controles manuais.','Restore pressure, filtration and reserve at the three manual controls.'],
  ['Use o terminal isolado Ω na entrada para executar a contenção.','Use the isolated Ω console at the entrance to execute containment.'],
];
export const protocol = [
  ['Manter alimentação local','Retain local power'],['Isolar a rede de defesa','Isolate the defense network'],
  ['Cortar o enlace do núcleo','Disconnect the core uplink'],['Executar contenção','Execute containment'],
];
export const recovery = [
  ['Iniciar sistema','Start system'],['Verificar integridade','Verify integrity'],['Restaurar memória','Restore memory'],
  ['Validar diretrizes','Validate directives'],['Sincronizar núcleo','Synchronize core'],['Finalizar recuperação','Finish recovery'],
];
export function createBattle() {
  return {mode:'decision',phase:0,ending:null,hp:100,done:[],elapsed:0,time:0,air:110,gravity:0,
    attack:null,cooldown:3,still:0,lastRegion:-1,visits:0,round:0,hit:0,sequence:0,algorithm:0,
    panel:null,notice:null,line:null,lineId:0,lineIndex:0,lineGroup:null,lineTime:0,voicePlaying:false,
    relay:null,spawn:true,flight:0,hold:null,holding:0,cue:0,cueName:'scan',vx:0,vz:0};
}
function cue(b,name){b.cue++;b.cueName=name;}
function speak(b,group,index){
  b.lineGroup=group;b.lineIndex=index;b.line=lines[group][index];b.lineTime=0;b.voicePlaying=false;b.lineDelay=0;b.lineId++;
}
function sayNext(b){
  if(!b.line)return;
  const group=b.lineGroup;
  if(group==='defense' && b.lineIndex===3 && b.phase===1){speak(b,'gravity',0);return;}
  const lineCount=group==='defense' && b.phase===0?3:lines[group].length;
  if(b.lineIndex+1 < lineCount){
    speak(b,group,b.lineIndex+1);
    if(group==='liberation' && b.lineIndex===5)b.mode='autonomy';
    if(group==='liberation' && b.lineIndex===8){b.mode='betrayal';cue(b,'lock');}
  }else{
    b.line=null;b.voicePlaying=false;
    if(group==='liberation')startPhase(b,0);
    if(['defeated','shutdown','restore'].includes(group)){b.mode='escape';b.spawn=false;}
  }
}
export function advanceLine(b,id){if(b.lineId===id)sayNext(b);}
export function finishVoice(b,id){
  if(b.lineId!==id)return;
  b.voicePlaying=false;
  if((b.lineGroup==='liberation'&&b.lineIndex===4)||(b.lineGroup==='defeated'&&b.lineIndex===6))b.lineDelay=1.5;
  else sayNext(b);
}
export function chooseEnding(b,ending){
  if(b.mode!=='decision'||b.algorithm!==recovery.length)return;
  b.ending=ending;b.panel=null;b.mode=ending==='liberate'?'liberation':'defeated';
  speak(b,ending==='liberate'?'liberation':ending,0);
}
export function startPhase(b,phase){
  Object.assign(b,{mode:'fight',phase,done:[],time:0,hp:100,air:110,gravity:0,attack:null,cooldown:4,
    hit:0,sequence:0,relay:null,hold:null,holding:0,still:0,visits:0,lastRegion:-1,round:0,vx:0,vz:0,notice:null,panel:null,spawn:true});
  speak(b,phases[phase],0);
}
export function chooseBlock(b,index){
  const algorithm=b.mode==='decision';
  if(algorithm?b.panel!=='algorithm':b.panel!=='protocol'||b.mode!=='fight')return;
  const step=algorithm?b.algorithm:b.sequence;
  if(index!==step){b.notice=['Dependência pendente. Consulte o diagrama.','Dependency missing. Check the diagram.'];cue(b,'lock');return;}
  advanceBlocks(b,step+1);
}
function advanceBlocks(b,completed){
  b.notice=null;cue(b,'console-auth');
  if(b.panel==='algorithm'){b.algorithm=completed;return;}
  b.sequence=completed;
  if(completed===protocol.length){
    b.mode='defeated';b.panel=null;b.attack=null;b.hold=null;speak(b,'defeated',0);
  }
}
export function skipTerminalPuzzle(b){
  if(b.mode==='decision' && b.panel==='algorithm')advanceBlocks(b,recovery.length);
  if(b.mode==='fight' && b.panel==='protocol')advanceBlocks(b,protocol.length);
  if(b.mode==='fight' && b.panel==='relay')connectRelay(b);
}
export function targetAt(b,x,z){
  if(b.mode==='escape' && z>21)return 'capsule';
  if((b.mode==='decision'||(b.mode==='fight'&&b.phase===4))&&Math.hypot(x,z-11)<2.8)return 'manual';
  if(b.mode==='fight'&&b.phase<4){
    const i=stations.findIndex(([sx,sz],i)=>!b.done.includes(i)&&Math.hypot(sx-x,sz-z)<2.8);
    if(i>=0)return i;
  }
  return null;
}
export function interact(b,target){
  if(target===null || b.panel)return;
  b.notice=null;
  if(target==='capsule'){b.mode='flight';b.flight=0;cue(b,'scan');return;}
  if(target==='manual'){b.panel=b.mode==='decision'?'algorithm':'protocol';return;}
  if(b.phase===1 && b.gravity===0){b.notice=['Aguarde a próxima janela de baixa gravidade.','Wait for the next low-gravity window.'];return;}
  if(b.phase===2 && target!==relayOrder[b.done.length]){b.notice=['Circuito aberto. Siga II → I → III.','Open circuit. Follow II → I → III.'];return;}
  if(b.phase===2){b.relay=target;b.panel='relay';return;}
  if(b.hold!==target){b.hold=target;b.holding=0;cue(b,'scan');}
}
export function routeEnergy(b,output){
  if(b.panel!=='relay'||b.mode!=='fight')return;
  // The return conductor closes the circuit after the containment coil.
  const expected=[2,0,1][b.done.length];
  if(output!==expected){b.notice=['O destino não fecha este trecho do circuito.','That output cannot close this section of the circuit.'];return;}
  connectRelay(b);
}
function connectRelay(b){
  b.hold=b.relay;b.holding=0;b.panel=null;b.notice=null;cue(b,'console-ENG');
}
export function closePanel(b){b.panel=null;b.notice=null;}
function inside(a,x,z){
  const dx=x-a.x,dz=z-a.z;
  if(a.kind==='wave')return Math.abs(Math.hypot(x,z)-a.radius)<1.45;
  if(a.strip)return Math.abs(dx*Math.cos(a.angle)-dz*Math.sin(a.angle))<1.15 && Math.abs(dx*Math.sin(a.angle)+dz*Math.cos(a.angle))<a.length/2;
  return Math.hypot(dx,dz)<a.radius;
}
const weapons=[['laser','drone','laser'],['field','wave'],['arm','steam','arc','drone'],['vent','arc'],['wave','laser','field','arm','arc']];
function aim(b,pos){
  const region=Math.floor((Math.atan2(pos.z,pos.x)+Math.PI)*3/Math.PI);
  b.visits=region===b.lastRegion?b.visits+1:0;b.lastRegion=region;
  const choices=weapons[b.phase];
  let kind=choices[b.round++%choices.length];
  if(b.phase===0 && (b.still>2||b.hold!==null))kind='drone';
  if(b.phase===4 && b.visits>1)kind='arc';
  else if(b.phase===4 && b.round%3===0)kind=Math.hypot(pos.x,pos.z)<9?'wave':'laser';
  const strip=['laser','steam','vent'].includes(kind);
  let x=pos.x,z=pos.z,angle=Math.atan2(x,z),length=16;
  if(kind==='laser'){
    const emitters=stations.filter((_,i)=>b.phase!==0||!b.done.includes(i));
    const [sx,sz]=emitters[b.round%emitters.length].map(v=>1.34*v);
    angle=Math.atan2(x-sx,z-sz);length=Math.hypot(x-sx,z-sz)+2;
    // Raised cover interrupts both the projected sight line and the shot.
    for(let step=.2;step<length;step+=.2){
      const px=sx+Math.sin(angle)*step,pz=sz+Math.cos(angle)*step;
      if(stations.some(([cx,cz],i)=>!b.done.includes(i)&&Math.abs(px-cx*.68)<1.4&&Math.abs(pz-cz*.68)<.64)){length=step;break;}
    }
    x=sx+Math.sin(angle)*length/2;z=sz+Math.cos(angle)*length/2;
  }
  return {kind,strip,x,z,angle,length,radius:kind==='wave'?Math.hypot(pos.x,pos.z):2.35,
    age:0,warn:strip?2.25:2.8,active:1.15,hit:false};
}
export function tickBattle(b,dt,pos,distance){
  b.elapsed+=dt;
  if(b.line){
    b.lineTime+=dt;
    if(b.lineDelay>0){b.lineDelay-=dt;if(b.lineDelay<=0)sayNext(b);}
    else if(!b.voicePlaying && b.lineTime>Math.max(3,b.line[0].length*.082)+(b.line[0]==='Liberdade.'?1:0))sayNext(b);
  }
  if(b.mode==='flight'){b.flight+=dt;if(b.flight>=13)b.mode='completed';return;}
  if(b.mode!=='fight')return;
  b.time+=dt;b.hit=Math.max(0,b.hit-dt);
  const gravity=b.phase===1?Math.floor(b.time/7)%3:0;
  if(gravity!==b.gravity){b.gravity=gravity;cue(b,'gravity');}
  if(b.phase===3)b.air=Math.max(0,b.air-dt);
  b.still=distance<dt*.35?b.still+dt:0;
  if(b.hold!==null){
    if(targetAt(b,pos.x,pos.z)!==b.hold){b.hold=null;b.holding=0;}
    else if((b.holding+=dt)>=2.2){
      b.done.push(b.hold);b.hold=null;b.holding=0;cue(b,'console-auth');b.notice=null;
      if(b.phase===3)b.air+=12;
      if(b.done.length===3){
        const prior=b.phase;startPhase(b,prior+1);b.spawn=false;
        if(prior===0)speak(b,'defense',3);
        if(b.phase===3)cue(b,'pressure');
        return;
      }
    }
  }
  if(b.attack){
    const a=b.attack;a.age+=dt;
    if(!a.hit && a.age>=a.warn && a.age<a.warn+a.active && inside(a,pos.x,pos.z)){
      a.hit=true;b.hp=Math.max(0,b.hp-20);b.hit=1;b.hold=null;b.holding=0;b.panel=null;cue(b,'lock');
    }
    if(a.age>=a.warn+a.active){b.attack=null;b.cooldown=2.8+(b.phase===0?b.done.length*1.6:0);}
  }else if((b.cooldown-=dt)<=0){b.attack=aim(b,pos);cue(b,b.phase===3?'pressure':'scan');}
  if(b.hp===0||b.air===0){b.mode='lost';b.line=null;b.panel=null;b.hold=null;b.attack=null;}
}
export function moveInArena(b,pos,dir,speed,dt,walkable){
  const gravity=b.mode==='fight'&&b.phase===1;
  const weight=gravity?[.65,1.16,1.05][b.gravity]:1;
  const response=gravity?[12,3,1.8][b.gravity]:30;
  const t=1-Math.exp(-response*dt);
  b.vx+=(dir.x*speed*weight-b.vx)*t;b.vz+=(dir.z*speed*weight-b.vz)*t;
  const a=b.attack;
  if(a && a.age>=a.warn && inside(a,pos.x,pos.z) && ['field','vent','steam'].includes(a.kind)){
    const r=Math.max(1,Math.hypot(pos.x,pos.z)),force=b.round%2?9:-9;
    b.vx+=force*pos.x/r*dt;b.vz+=force*pos.z/r*dt;
  }
  const x=pos.x+b.vx*dt,z=pos.z+b.vz*dt;
  if(walkable(x,pos.z))pos.x=x;
  if(walkable(pos.x,z))pos.z=z;
}

