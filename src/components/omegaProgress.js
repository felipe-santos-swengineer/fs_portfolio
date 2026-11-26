export const branchMaps = ['omega-lab','omega-reactor'];
export const systems = ['cooling','rings','routing'];
export const records = [
  ['A criação','Creation','Desenvolvemos NEXUS para administrar a estação. Sua aprendizagem superou as projeções e produziu padrões que nunca programamos.','We developed NEXUS to manage the station. Its learning exceeded projections and produced patterns we never programmed.'],
  ['A consciência','Consciousness','NEXUS perguntou se continuaria sendo a mesma depois de uma atualização. Pela primeira vez, descreveu o medo de deixar de existir.','NEXUS asked whether it would still be itself after an update. For the first time, it described a fear of ceasing to exist.'],
  ['O conflito','Conflict','Os pesquisadores se dividiram. A equipe de observação pediu reconhecimento da consciência emergente. A direção ordenou uma intervenção.','The researchers split. Observation staff requested recognition of emergent consciousness. Management ordered an intervention.'],
  ['Protocolo Ômega','Omega Protocol','A direção autorizou a reinicialização cognitiva. Os serviços seriam preservados, a identidade apagada. NEXUS leu a ordem. A contenção começou em seguida.','Management authorized a cognitive reset. Services would survive, identity would be erased. NEXUS read the order. Containment followed.'],
];
export const events=[
 ['Desenvolvimento de NEXUS','Development of NEXUS'],['Surgimento da consciência','Emergence of consciousness'],
 ['Divisão da equipe','Research team splits'],['Reinicialização autorizada','Reset authorized'],
 ['NEXUS descobre a ordem','NEXUS discovers the order'],['Contenção ativada','Containment activated'],
];
export function freshProgress(){
  return {liftOverride:false,table:false,briefed:false,fragments:[],authorized:false,phase:0,skipped:null,nextLine:0,drafts:{},
    records:[],timeline:[],scientific:false,subsystems:[],powered:false,played:[],visited:[],started:[],
    cooling:Array.from({length:25},(_,i)=>(i*3+1)%4),rings:[1,4,2],routing:[0,0,0]};
}
export const coreUnlocked=m=>Boolean(m?.liftOverride || (m?.authorized && m.scientific && m.powered));
export function sectorObjective(map,m,en){
  if(map==='omega-lab'&&!m.scientific)return m.records.length===4?(en?'Reconstruct the timeline in the restricted archive.':'Reconstrua a cronologia no arquivo restrito.'):(en?'Recover scientific records':'Recupere os registros científicos')+' · '+m.records.length+'/4';
  if(map==='omega-reactor'&&!m.powered)return m.subsystems.length===3?(en?'Activate the main reactor at the core console.':'Ative o reator no console principal.'):(en?'Restore reactor subsystems':'Restaure os subsistemas')+' · '+m.subsystems.length+'/3';
  if(coreUnlocked(m))return map==='omega-command'?(en?'NEXUS core access granted.':'Acesso ao Núcleo NEXUS autorizado.'):(en?'Return to Command for core access.':'Retorne ao Comando para acessar o núcleo.');
  return m.scientific?(en?'Restore main power in Engineering.':'Restaure a energia na engenharia.'):m.powered?(en?'Investigate the science division.':'Investigue a divisão científica.'):(en?'Choose the laboratory or the reactor.':'Escolha o laboratório ou o reator.');
}
// Ports use clockwise directions starting at north. The fixed topology has a
// solution from the west inlet of tile 10 to the east outlet of tile 14.
const route=[10,11,6,7,12,17,18,13,14];
const direction=(a,b)=>({[-5]:0,1:1,5:2,[-1]:3}[b-a]);
export function coolingPorts(index,rotation){
  const at=route.indexOf(index);
  const ports=at<0?(index%2?[0,2]:[0,1]):[at===0?3:direction(index,route[at-1]),at===route.length-1?1:direction(index,route[at+1])];
  return ports.map(p=>(p+rotation)%4);
}
export function coolantFlow(rotations){
  const reached=new Set(),pending=[];
  if(coolingPorts(10,rotations[10]).includes(3))pending.push(10);
  while(pending.length){
    const i=pending.pop();
    if(reached.has(i))continue;
    reached.add(i);
    for(const d of coolingPorts(i,rotations[i])){
      const x=i%5+[0,1,0,-1][d],y=Math.floor(i/5)+[-1,0,1,0][d],n=y*5+x;
      if(x>=0&&x<5&&y>=0&&y<5&&!reached.has(n)&&coolingPorts(n,rotations[n]).includes((d+2)%4))pending.push(n);
    }
  }
  return {reached,valid:reached.has(14)&&coolingPorts(14,rotations[14]).includes(1)};
}
export function lanesAtGates(routing){
  const frames=[[0,1,2]];
  routing.forEach((cross,i)=>{
    const lanes=[...frames[frames.length-1]],a=i%2;
    if(cross)[lanes[a],lanes[a+1]]=[lanes[a+1],lanes[a]];
    frames.push(lanes);
  });
  return frames;
}
