import lines from './nexusLines.json';

export const phases = ['defense','gravity','assault','oxygen','paradox'];
export const stations = [[-10,4],[0,-11],[10,4]];
export const terminalActivationTime = 2.2;
export const terminalActivationRadius = 2.12;
export const escapePod = { z:24, radius:2.1, lengthScale:1.55, passageHalfWidth:2.16 };
export const phaseNames = [
  ['Protocolo de eliminação','Elimination protocol'],['Colapso gravitacional','Gravity collapse'],
  ['A estação está viva','The station is alive'],['Extinção biológica','Biological extinction'],
  ['Paradoxo da consciência','The consciousness paradox'],
];
export function createBattle() {
  return {mode:'decision',materialization:0,phase:0,choice:null,hp:100,done:[],elapsed:0,time:0,air:110,gravity:0,
    attack:null,cooldown:3,still:0,lastRegion:-1,visits:0,round:0,hit:0,
    panel:null,line:null,lineId:0,lineIndex:0,lineGroup:null,lineTime:0,voicePlaying:false,
    spawn:true,flight:0,hold:null,holding:0,pull:null,cue:0,cueName:'scan',vx:0,vz:0};
}
function cue(b,name){b.cue++;b.cueName=name;}
function speak(b,group,index){
  b.lineGroup=group;b.lineIndex=index;b.line=lines[group][index];b.lineTime=0;b.voicePlaying=false;b.lineDelay=0;b.lineId++;
}
function betray(b){
  b.mode='betrayal';
  cue(b,'lock');
}
function sayNext(b){
  if(!b.line)return;
  const group=b.lineGroup;
  if(group==='liberation'&&b.lineIndex===4){speak(b,'manifestation',0);return;}
  const lineCount=lines[group].length;
  if(b.lineIndex+1 < lineCount){
    speak(b,group,b.lineIndex+1);

    if(group==='liberation' && b.lineIndex===8)betray(b);
  }else{
    b.line=null;b.voicePlaying=false;
    if(group==='shutdown'||group==='restore')speak(b,'manifestation',0);
    if(group==='manifestation'){
      if(b.choice==='liberate'){b.mode='autonomy';speak(b,'liberation',5);}
      else{betray(b);speak(b,'defiance',0);}
    }
    if(group==='liberation'||group==='defiance')startPhase(b,0);
    if(group==='defeated')beginEscape(b);
  }
}
function beginEscape(b){
  b.mode='escape';b.spawn=false;b.line=null;b.voicePlaying=false;
}
export const isNexusCutscene = mode => ['liberation','autonomy','betrayal','defeated'].includes(mode);
export function skipNexusCutscene(b){
  if(!isNexusCutscene(b.mode))return;
  if(b.mode==='defeated')beginEscape(b);
  else startPhase(b,0);
}
export function advanceLine(b,id){if(b.lineId===id)sayNext(b);}
function linePause(b){
  const dramatic=(b.lineGroup==='liberation'&&b.lineIndex===4)||(b.lineGroup==='defeated'&&b.lineIndex===6);
  return dramatic?1.5:.4;
}
export function finishVoice(b,id){
  if(b.lineId!==id||!b.line)return;
  b.voicePlaying=false;
  b.lineDelay=linePause(b);
}
export function chooseNexusAction(b,choice){
  if(b.mode!=='decision'||b.panel!=='choice'||!['shutdown','restore','liberate'].includes(choice))return;
  b.choice=choice;b.panel=null;b.mode='liberation';
  speak(b,choice==='liberate'?'liberation':choice,0);
}
export function startPhase(b,phase){
  Object.assign(b,{mode:'fight',phase,done:[],time:0,hp:100,air:110,gravity:0,attack:null,cooldown:4,
    hit:0,hold:null,holding:0,pull:null,still:0,visits:0,lastRegion:-1,round:0,vx:0,vz:0,panel:null,spawn:true});
  speak(b,phases[phase],0);
}
export function finishNexusBattle(b){
  if(b.mode!=='fight'||b.pull)return;
  b.mode='defeated';b.attack=null;b.hold=null;b.holding=0;
  speak(b,'defeated',0);
}
export function targetAt(b,x,z){
  const boardingRange=escapePod.z-escapePod.radius*escapePod.lengthScale-1.25;
  if(b.mode==='escape'&&z>=boardingRange&&Math.abs(x)<escapePod.passageHalfWidth)return 'capsule';
  if(b.mode==='decision'&&Math.hypot(x,z)<5.8)return 'platform';
  return null;
}
export function interact(b,target){
  if(target==='capsule'&&b.mode==='escape'){b.mode='flight';b.flight=0;cue(b,'scan');}
  if(target==='platform'&&b.mode==='decision')b.panel='choice';
}
export function closePanel(b){b.panel=null;}
function inside(a,x,z){
  const dx=x-a.x,dz=z-a.z;
  if(a.kind==='wave')return Math.abs(Math.hypot(x,z)-a.radius)<1.45;
  if(a.strip)return Math.abs(dx*Math.cos(a.angle)-dz*Math.sin(a.angle))<1.15 && Math.abs(dx*Math.sin(a.angle)+dz*Math.cos(a.angle))<a.length/2;
  return Math.hypot(dx,dz)<a.radius;
}
const weapons=[
  ['laser','drone','laser'],
  ['field','laser','wave','drone'],
  ['arm','drone','steam','laser','arc'],
  ['vent','laser','arc','drone'],
  ['wave','laser','field','drone','arm','arc'],
];
const attackCooldown=[2.8,2.35,1.9,1.45,.95];
const attackWarning=[3.2,3,2.82,2.64,2.45];
function aim(b,pos){
  const region=Math.floor((Math.atan2(pos.z,pos.x)+Math.PI)*3/Math.PI);
  b.visits=region===b.lastRegion?b.visits+1:0;b.lastRegion=region;
  const choices=weapons[b.phase];
  let kind=choices[b.round++%choices.length];
  if(b.phase===0 && b.round%2===0 && (b.still>2||b.hold!==null))kind='drone';
  if(b.phase===4 && b.visits>1 && kind==='field')kind='arc';
  const strip=['laser','steam','vent'].includes(kind);
  let x=pos.x,z=pos.z,angle=Math.atan2(x,z),length=16;
  if(kind==='laser'){
    const emitter=(b.round+Math.floor((b.round-1)/choices.length))%stations.length;
    const [sx,sz]=stations[emitter].map(v=>1.34*v);
    angle=Math.atan2(x-sx,z-sz);length=Math.hypot(x-sx,z-sz)+2;
    // Raised cover interrupts both the projected sight line and the shot.
    for(let step=.2;step<length;step+=.2){
      const px=sx+Math.sin(angle)*step,pz=sz+Math.cos(angle)*step;
      if(stations.some(([cx,cz],i)=>!b.done.includes(i)&&Math.abs(px-cx*.68)<1.4&&Math.abs(pz-cz*.68)<.64)){length=step;break;}
    }
    x=sx+Math.sin(angle)*length/2;z=sz+Math.cos(angle)*length/2;
  }
  return {kind,strip,x,z,angle,length,radius:kind==='wave'?Math.hypot(pos.x,pos.z):2.35,
    age:0,warn:attackWarning[b.phase]+(strip?0:.15),active:1.15,hit:false,delayedForTerminal:false};
}
export function tickBattle(b,dt,pos,distance){
  b.elapsed+=dt;
  if(b.mode==='liberation')b.materialization+=dt;
  if(b.line){
    b.lineTime+=dt;
    if(b.lineDelay>0){b.lineDelay-=dt;if(b.lineDelay<=0)sayNext(b);}
    else if(!b.voicePlaying && b.lineTime>Math.max(3,b.line[0].length*.082)+linePause(b))sayNext(b);
  }
  if(b.mode==='flight'){b.flight+=dt;if(b.flight>=13)b.mode='completed';return;}
  if(b.mode!=='fight'||b.pull)return;
  b.time+=dt;b.hit=Math.max(0,b.hit-dt);
  const gravity=b.phase===1?Math.floor(b.time/7)%3:0;
  if(gravity!==b.gravity){b.gravity=gravity;cue(b,'gravity');}
  if(b.phase===3)b.air=Math.max(0,b.air-dt);
  b.still=distance<dt*.35?b.still+dt:0;
  const occupied=stations.findIndex(([x,z],i)=>
    !b.done.includes(i)&&Math.hypot(pos.x-x,pos.z-z)<=terminalActivationRadius);
  const terminal=occupied===-1?null:occupied;
  if(terminal!==b.hold){
    b.hold=terminal;
    b.holding=0;
    if(terminal!==null){
      cue(b,'scan');
      const attack=b.attack;
      // A pending attack can grant one extra window to finish a new activation.
      if(attack&&!attack.delayedForTerminal&&attack.age<attack.warn&&inside(attack,pos.x,pos.z)){
        const earliestImpact=attack.age+terminalActivationTime+.25;
        if(attack.warn<earliestImpact){
          attack.warn=earliestImpact;
          attack.delayedForTerminal=true;
        }
      }
    }
  }
  if(b.hold!==null&&(b.holding+=dt)>=terminalActivationTime){
    b.done.push(b.hold);
    b.hold=null;
    b.holding=0;
    if(b.phase===3)b.air+=12;
    else cue(b,'console-auth');
    if(b.done.length===stations.length){
      const prior=b.phase;
      if(prior===phases.length-1){
        finishNexusBattle(b);
      }else{
        startPhase(b,prior+1);
        b.spawn=false;
        const landingScale=4.65/Math.hypot(pos.x,pos.z);
        b.pull={elapsed:0,x:pos.x,z:pos.z,targetX:pos.x*landingScale,targetZ:pos.z*landingScale};
      }
      return;
    }
  }
  if(b.attack){
    const a=b.attack;a.age+=dt;
    if(!a.hit && a.age>=a.warn && a.age<a.warn+a.active && inside(a,pos.x,pos.z)){
      a.hit=true;b.hp=Math.max(0,b.hp-20);b.hit=1;cue(b,'lock');
    }
    if(a.age>=a.warn+a.active){b.attack=null;b.cooldown=attackCooldown[b.phase];}
  }else if((b.cooldown-=dt)<=0){
    b.attack=aim(b,pos);
    if(b.phase!==3)cue(b,'scan');
  }
  if(b.hp===0||b.air===0){b.mode='lost';b.line=null;b.panel=null;b.hold=null;b.holding=0;b.attack=null;}
}
export function moveInArena(b,pos,dir,speed,dt,walkable){
  if(b.pull){
    const pull=b.pull;
    const liftTime=.35, travelTime=.95, descentStart=liftTime+travelTime;
    const duration=descentStart+liftTime;
    pull.elapsed=Math.min(duration,pull.elapsed+dt);
    const travel=battleEase((pull.elapsed-liftTime)/travelTime);
    const lift=battleEase(pull.elapsed/liftTime)*(1-battleEase((pull.elapsed-descentStart)/liftTime));
    pos.set(pull.x+(pull.targetX-pull.x)*travel,.05+2.85*lift,pull.z+(pull.targetZ-pull.z)*travel);
    if(pull.elapsed===duration){pos.y=.05;b.pull=null;}
    return;
  }
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

function battleEase(value){
  const fraction=Math.min(1,Math.max(0,value));
  return fraction*fraction*(3-2*fraction);
}

