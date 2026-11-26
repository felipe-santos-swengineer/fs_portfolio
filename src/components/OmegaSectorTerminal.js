import SkipMinigame from './SkipMinigame';
import { useEffect, useRef, useState } from 'react';
import {coolantFlow,coolingPorts,events,freshProgress,lanesAtGates,records,sectorObjective,systems} from './omegaProgress';

const names={archive:['Arquivo restrito','Restricted archive'],cooling:['Reconstrução do fluxo','Coolant flow'],rings:['Sincronização dos anéis','Ring synchronization'],routing:['Distribuição dos pulsos','Pulse routing'],activate:['Ignição principal','Main ignition']};
const hints={archive:['Use o último registro para ordenar os três acontecimentos finais.','Use the last record to order the final three events.'],cooling:['Comece na seta esquerda e siga as conexões ciano.','Start at the left arrow and follow cyan connections.'],rings:['Cada toque avança 45°. Compare o ponto do anel com a marca vazada da mesma cor.','Each turn advances 45°. Match the solid and hollow markers of the same color.'],routing:['Cada chave troca duas pistas vizinhas. Siga os números da esquerda para a direita.','Each switch swaps neighboring lanes. Trace numbers from left to right.']};
export default function SectorTerminal({id,map,m,setMission,en,effectsEnabled,paused,onClose}){
  const l=Number(en),[notice,setNotice]=useState(''),[hint,setHint]=useState(false),sound=useRef(null);
  const field=(key,value)=>setMission(old=>({...old,[key]:typeof value==='function'?value(old[key]):value}));
  useEffect(()=>{if(paused||!effectsEnabled)sound.current?.pause();return ()=>sound.current?.pause();},[paused,effectsEnabled]);
  const cue=()=>{if(!paused&&effectsEnabled){sound.current?.pause();sound.current=new Audio(process.env.PUBLIC_URL+'/audio/omega/console-'+(map==='omega-lab'?'NAV':'ENG')+'.wav');sound.current.volume=.18;sound.current.play().catch(()=>{});}};
  const mutate=(key,fn)=>{setNotice('');field(key,fn);};
  if(id.startsWith('record')){
    const index=Number(id.slice(-1)),r=records[index];
    return <><h3>{'0'+(index+1)} · {r[l]}</h3><p>{r[2+l]}</p>
      {m.records.includes(index)?<p>{en?'Memory fragment recovered':'Fragmento de memória recuperado'} ✓</p>:<button onClick={()=>{field('records',list=>list.includes(index)?list:[...list,index]);cue();}}>{en?'Recover memory fragment':'Recuperar fragmento de memória'}</button>}</>;
  }
  const archive=id==='archive',done=archive?m.scientific:m.subsystems.includes(id);
  if(id==='activate')return <><h3>{names.activate[l]}</h3><p>{systems.map(key=>names[key][l]+' '+(m.subsystems.includes(key)?'✓':'—')).join(' · ')}</p>
    {m.powered?<p>{en?'Main power online. Engineering authorization granted.':'Energia principal ativa. Autorização de engenharia concedida.'}</p>:<button disabled={m.subsystems.length!==3} onClick={()=>{field('powered',true);cue();onClose();}}>{en?'Start reactor':'Ativar reator'}</button>}</>;
  if(done)return <><h3>{names[id][l]} ✓</h3><p>{archive?(en?'Confidential · The reset would erase an emergent identity. NEXUS triggered containment to survive. The crew manifest is still missing. Scientific authorization granted.':'Confidencial · A reinicialização apagaria uma identidade emergente. NEXUS acionou a contenção para sobreviver. O paradeiro da tripulação segue desconhecido. Autorização científica concedida.'):(en?'Subsystem online.':'Subsistema operacional.')}</p><p>{sectorObjective(map,m,en)}</p></>;
  if(archive&&m.records.length<4)return <p>{sectorObjective(map,m,en)}</p>;
  const flow=coolantFlow(m.cooling),frames=lanesAtGates(m.routing),colors=['#5adfff','#54e398','#ffc45d'];
  const rotate=(key,i,mod)=>mutate(key,list=>list.map((v,j)=>j===i?(v+1)%mod:v));
  const chronology=events.map((_,index)=>index);
  const completeArchive=()=>{
    setMission(current=>({...current,timeline:chronology,scientific:true}));
    cue();
  };
  const completePuzzle=()=>{
    if(archive){completeArchive();return;}
    cue();
    field('subsystems',s=>s.includes(id)?s:[...s,id]);
  };
  const validate=()=>{
    const ok=archive?m.timeline.join()===chronology.join():id==='cooling'?flow.valid:id==='rings'?m.rings.join()==='0,2,6':frames[3].join()==='1,2,0';
    if(!ok){setNotice(en?'Configuration incomplete. Check the highlighted path and reference.':'Configuração incompleta. Confira o trajeto e a referência.');return;}
    completePuzzle();
  };
  return <div className="omega-puzzle"><h3>{names[id][l]}</h3>
    {archive&&<><p>{en?'Select events in chronological order. Select an event in the timeline to remove it.':'Selecione os acontecimentos em ordem cronológica. Toque em um cartão da cronologia para removê-lo.'}</p>
    <ol>{m.timeline.map(i=><li key={i}><button onClick={()=>mutate('timeline',s=>s.filter(v=>v!==i))}>{events[i][l]}</button></li>)}</ol>
    <div className="npc-dialogue-actions">{[3,1,5,0,4,2].map(i=><button key={i} disabled={m.timeline.includes(i)} onClick={()=>mutate('timeline',s=>s.includes(i)?s:[...s,i])}>{events[i][l]}</button>)}</div>
    <details><summary>{en?'Read recovered records':'Consultar registros recuperados'}</summary>{records.map(r=><p key={r[0]}><strong>{r[l]}</strong> {r[2+l]}</p>)}</details></>}
    {id==='cooling'&&<><p>{en?'Rotate tiles to connect the left inlet to the right outlet on row 3.':'Gire as peças para ligar a entrada à esquerda à saída à direita na terceira linha.'}</p><div className="omega-pipes">{m.cooling.map((v,i)=>{
      const ports=coolingPorts(i,v);return <button key={i} onClick={()=>rotate('cooling',i,4)} aria-label={(en?'Tile ':'Peça ')+(i+1)+' · '+ports.map(p=>(en?['north','east','south','west']:['norte','leste','sul','oeste'])[p]).join(', ')} style={{color:flow.reached.has(i)?'cyan':'#b4c4cb'}}><svg viewBox="0 0 40 40" aria-hidden="true">{ports.map(p=><path key={p} d="M20 20V0" transform={'rotate('+p*90+' 20 20)'} stroke="currentColor" strokeWidth="6"/>)}{(i===10||i===14)&&<text x={i===10?0:28} y="12" fill="#ffcb65">→</text>}</svg></button>;
    })}</div></>}
    {id==='rings'&&<><p>{en?'Align the three markers with their hollow targets.':'Alinhe os três marcadores com seus alvos vazados.'}</p><svg viewBox="-54 -54 108 108" className="omega-ring-view" aria-hidden="true">{m.rings.map((v,i)=>{const r=46-i*13;return <g key={i} stroke={colors[i]} fill="none"><circle r={r}/><circle cy={-r} r="4" transform={'rotate('+[0,90,270][i]+')'}/><circle cy={-r} r="2.6" fill={colors[i]} transform={'rotate('+45*v+')'}/></g>;})}</svg><div className="npc-dialogue-actions">{m.rings.map((v,i)=><button key={i} onClick={()=>rotate('rings',i,8)}>{['△','○','⬡'][i]} {v*45}° / {[0,90,270][i]}° ↻</button>)}</div></>}
    {id==='routing'&&<><p>{en?'Route signals to receivers 2, 3, 1 from top to bottom. Each switch passes signals straight through or swaps adjacent lanes.':'Encaminhe os pulsos aos receptores 2, 3, 1 de cima para baixo. Cada chave mantém ou cruza duas pistas adjacentes.'}</p>
      <svg viewBox="0 0 220 78" className="omega-route-view" aria-hidden="true">{[0,1,2].map(n=><g key={n}><text x="1" y={17+n*24} fill={colors[n]}>{n+1}</text><polyline fill="none" stroke={colors[n]} strokeWidth="3" points={frames.map((f,i)=>(18+i*60)+','+(13+24*f.indexOf(n))).join(' ')}/><text x="205" y={17+n*24} fill={colors[[1,2,0][n]]}>{[2,3,1][n]}</text></g>)}</svg>
      <p>{en?'Output':'Saída'} · {frames[3].map(n=>n+1).join(' / ')}</p><div className="npc-dialogue-actions">{m.routing.map((v,i)=><button key={i} onClick={()=>rotate('routing',i,2)}>{i+1} · {v?'×':'⇉'}</button>)}</div></>}
    {hint&&<p>{hints[id][l]}</p>}{notice&&<p role="alert">{notice}</p>}
    <div className="npc-dialogue-actions omega-validation-actions"><button onClick={validate}>{en?'Validate':'Validar'}</button><button onClick={()=>{const key=archive?'timeline':id;mutate(key,freshProgress()[key]);}}>{en?'Reset puzzle':'Reiniciar desafio'}</button><button onClick={()=>setHint(!hint)}>{en?'Hint':'Dica'}</button></div>
    <SkipMinigame en={en} disabled={paused} onSkip={completePuzzle}/>
  </div>;
}
