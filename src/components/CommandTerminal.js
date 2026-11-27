import { omegaEffects } from '../audio/omegaEffects';
import SkipMinigame from './SkipMinigame';
import { sectorObjective } from './omegaProgress';
import { useEffect, useRef, useState } from 'react';
import { stations } from './omegaCommandCenter';

const route=['Vega','Sirius','Altair','Deneb','Polaris'];
const stars=['Deneb','Vega','Mira','Polaris','Altair','Sirius','Rigel'];
const starCoords=[[73,64],[9,59],[46,74],[90,23],[52,28],[27,42],[65,13]];
const symbols=['△','⬡','○','□','◇','☆'];
const code=['△','⬡','○','□'];
const systems=[['Suporte vital','Life support'],['Navegação','Navigation'],['Comunicação','Communication'],['Segurança','Security']];
const puzzleNames={NAV:['Sincronização de coordenadas estelares','Stellar coordinate synchronization'],COM:['Frequência de emergência','Emergency frequency'],ENG:['Balanceamento energético','Auxiliary power balance'],SEC:['Matriz de autenticação','Authentication matrix']};
const hints={
  NAV:[['Leia o registro da esquerda para a direita.','Read the flight log from left to right.'],['Vega precede Sirius. Mira e Rigel são referências externas.','Vega precedes Sirius. Mira and Rigel are external references.']],
  COM:[['Compare primeiro a quantidade de ciclos.','Compare the number of cycles first.'],['A referência tem três ciclos e amplitude quatro.','The reference has three cycles and amplitude four.']],
  ENG:[['Reserve primeiro a energia do suporte vital e da segurança.','Reserve power for life support and security first.'],['Restam 50 unidades para comunicação e navegação juntas.','Communications and navigation share the remaining 50 units.']],
  SEC:[['Reserve as pontas da sequência antes de preencher o meio.','Fill the two ends before solving the middle.'],['O hexágono ocupa o segundo encaixe.','The hexagon occupies the second slot.']],
};
export const newCommandMission=()=>({table:false,briefed:false,fragments:[],authorized:false});
export function commandObjective(m,en){
  if(!m.table)return en?'Consult the central holographic table.':'Consulte a mesa holográfica central.';
  if(!m.briefed)return en?'Investigate the commander’s terminal by the window.':'Investigue o terminal do comandante junto à janela.';
  if(m.authorized)return sectorObjective('omega-command',m,en);
  if(m.fragments.length===4)return en?'Return to the table for central authentication.':'Retorne à mesa para a autenticação central.';
  return (en?'Recover authentication fragments':'Recupere os fragmentos de autenticação')+' · '+m.fragments.length+'/4';
}
function wave([cycles,amplitude,phase]){
  return Array.from({length:161},(_,x)=>x+','+(28-amplitude*4*Math.sin(x/160*Math.PI*2*cycles+phase*Math.PI/4))).join(' ');
}
function Puzzle({id,en,onSolve,mission,setMission}) {
  const l=Number(en);
  const baseline={sequence:[],signal:[1,2,0],power:[0,0,0,0]};
  const {sequence,signal,power}={...baseline,...mission.drafts[id]};
  const save=(key,value)=>setMission(m=>{
    const draft={...baseline,...m.drafts[id]};
    return {...m,drafts:{...m.drafts,[id]:{...draft,[key]:typeof value==='function'?value(draft[key]):value}}};
  });
  const setSequence=v=>save('sequence',v),setSignal=v=>save('signal',v),setPower=v=>save('power',v);
  const [hint,setHint]=useState(0),[error,setError]=useState(false);
  const sync=Math.max(0,100-signal.reduce((total,x,i)=>total+Math.abs(x-[3,4,2][i])*8,0));
  const spent=power.reduce((a,b)=>a+b,0);
  const select=item=>{setError(false);setSequence(s=>s.includes(item)?s.slice(0,s.indexOf(item)):[...s,item]);};
  const validate=()=>{
    const valid=id==='NAV'?sequence.join()===route.join():id==='SEC'?sequence.join()===code.join():id==='COM'?sync>=92:spent===100&&power[0]===40&&power[3]===10&&power[1]===power[2]+10;
    if(valid)onSolve();else setError(true);
  };
  return <div className="omega-puzzle"><h3>{puzzleNames[id][l]}</h3>
    {id==='NAV' && <><p>{en?'Navigation log':'Registro de navegação'} · {route.join(' → ')}</p>
      <div className="omega-star-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke={error?'salmon':'cyan'} strokeWidth="1" points={sequence.map(n=>starCoords[stars.indexOf(n)].join(',')).join(' ')}/></svg>
      {stars.map((n,i)=><button key={n} aria-pressed={sequence.includes(n)} style={{left:starCoords[i][0]+'%',top:starCoords[i][1]+'%'}} onClick={()=>select(n)}>{n}</button>)}</div></>}
    {id==='SEC' && <><p>{en?'Triangle first, square last. The circle immediately follows the hexagon. Use four distinct symbols.':'Triângulo primeiro, quadrado por último. O círculo vem imediatamente após o hexágono. Use quatro símbolos distintos.'}</p>
      <div className="npc-dialogue-actions">{symbols.map((s,i)=><button key={s} aria-label={(en?['Triangle','Hexagon','Circle','Square','Diamond','Star']:['Triângulo','Hexágono','Círculo','Quadrado','Losango','Estrela'])[i]} aria-pressed={sequence.includes(s)} onClick={()=>select(s)}>{s}</button>)}</div></>}
    {(id==='SEC'||id==='NAV')&&<p aria-live="polite">{sequence.join(' → ')||'—'}</p>}
    {id==='COM'&&<><p>{en?'Match the adjustable amber trace to the cyan reference.':'Sobreponha a onda ajustável âmbar à referência ciano.'}</p>
      <svg viewBox="0 0 160 56" className="omega-wave" aria-hidden="true"><polyline points={wave([3,4,2])} fill="none" stroke="cyan"/><polyline points={wave(signal)} fill="none" stroke="orange" strokeDasharray="3 1"/></svg>
      {(en?['Frequency','Amplitude','Phase']:['Frequência','Amplitude','Fase']).map((label,i)=><label key={i}>{label} <input type="range" min={i===2?0:1} max="6" value={signal[i]} onChange={e=>{setError(false);setSignal(signal.map((x,j)=>j===i?Number(e.target.value):x));}}/> {signal[i]}</label>)}
      <p>{en?'Synchronization':'Sincronização'} · {sync}%</p></>}
    {id==='ENG'&&<><p>{en?'Allocate all 100 units. Life support requires 40, security 10. Navigation needs 10 more than communications.':'Distribua as 100 unidades. O suporte vital precisa de 40 e a segurança de 10. Navegação exige 10 a mais que comunicação.'}</p>
      {systems.map((names,i)=><div className="omega-power" key={i}>{names[l]} <span>{power[i]}</span>{[-10,10].map(delta=><button key={delta} disabled={delta<0?power[i]===0:spent===100} aria-label={names[l]+' '+delta} onClick={()=>{setError(false);setPower(power.map((x,j)=>j===i?x+delta:x));}}>{delta>0?'+10':'−10'}</button>)}</div>)}
      <p>{en?'Remaining':'Restante'} · {100-spent}</p></>}
    {hint>0&&<p>{hints[id][hint-1][l]}</p>}
    {error&&<p role="alert">{en?'Configuration rejected. Check the reference and adjust the controls.':'Configuração recusada. Confira a referência e ajuste os controles.'}</p>}
    <div className="npc-dialogue-actions omega-validation-actions"><button onClick={validate}>{en?'Validate':'Validar'}</button><button onClick={()=>{setError(false);setSequence([]);setSignal([1,2,0]);setPower([0,0,0,0]);}}>{en?'Reset':'Reiniciar'}</button><button disabled={hint===2} onClick={()=>setHint(hint+1)}>{en?'Hint':'Dica'}</button></div>
    <SkipMinigame en={en} onSkip={onSolve}/>
  </div>;
}
export default function CommandTerminal({id,en,mission,setMission,paused,effectsEnabled}){
  const [checking,setChecking]=useState(0);
  const cue=useRef(null);
  function playCue(key){
    if(paused || !effectsEnabled)return;
    cue.current?.pause();
    cue.current=new Audio(omegaEffects['console-'+key]);
    cue.current.volume=.2;
    cue.current.play().catch(()=>{});
  }
  useEffect(()=>{
    if(paused || !effectsEnabled)cue.current?.pause();
    return ()=>cue.current?.pause();
  },[paused,effectsEnabled]);
  useEffect(()=>{
    if(!checking || paused) return;
    const timer=setTimeout(()=>{
      if(checking===3){setMission(m=>m.fragments.length===4?{...m,authorized:true}:m);setChecking(0);}
      else setChecking(checking+1);
    },700);
    return ()=>clearTimeout(timer);
  },[checking,paused,setMission]);
  if(id==='table')return <>
    <p>{en?'Station map · Hangar → Command → Laboratory / Reactor → NEXUS → Evacuation.':'Mapa da estação · Hangar → Comando → Laboratório / Reator → NEXUS → Evacuação.'}</p>
    <p>{mission.powered?(en?'Main power restored.':'Energia principal restaurada.'):en?'Auxiliary power. NEXUS retains core control.':'Energia auxiliar. NEXUS mantém o controle do núcleo.'}</p>
    <p>{en?'Scientific records':'Registros científicos'} {mission.records.length}/4 · {en?'Subsystems':'Subsistemas'} {mission.subsystems.length}/3 · NEXUS {mission.scientific&&mission.powered?'✓':'—'}</p>
    <div className="omega-fragments" aria-label={en?'Authentication slots':'Encaixes de autenticação'}>{stations.map(({id:key,color})=><span style={{borderColor:mission.fragments.includes(key)?color:'#41505a'}} key={key}>{key} {mission.fragments.includes(key)?'✓':'—'}</span>)}</div>
    {checking>0&&<p role="status">{(en?['','Inserting fragments…','Verifying administrative signatures…','Isolating the NEXUS override…']:['','Inserindo fragmentos…','Verificando assinaturas administrativas…','Isolando a intervenção de NEXUS…'])[checking]}</p>}
    <p role="status">{commandObjective(mission,en)}</p><div className="npc-dialogue-actions"><button disabled={mission.fragments.length!==4||mission.authorized||checking>0} onClick={()=>{playCue('auth');setChecking(1);}}>{en?'Authenticate fragments':'Autenticar fragmentos'}</button></div></>;
  if(id==='bridge'&&!mission.table)return <p>{commandObjective(mission,en)}</p>;
  if(id==='bridge')return <><h3>{en?'Confidential · Commander’s log':'Confidencial · Registro do comandante'}</h3><p>{en?'I ordered the core isolated. NEXUS revoked our credentials before we could finish. We split the fallback key across navigation, communications, engineering and security. Whoever reads this: recover all four fragments, then authenticate at the table.':'Ordenei o isolamento do núcleo. NEXUS revogou nossas credenciais antes que terminássemos. Dividimos a chave de contingência entre navegação, comunicação, engenharia e segurança. Se está lendo isto, recupere os quatro fragmentos e autentique-os na mesa.'}</p></>;
  if(!mission.briefed)return <p>{commandObjective(mission,en)}</p>;
  if(mission.fragments.includes(id))return <><p role="status">{en?'Authorization recovered':'Autorização recuperada'} · {id}</p>
    {id==='COM'&&<p>{en?'Emergency log · Omega to ground control. Administrative access lost. NEXUS is not responding. Requesting immediate assistance…':'Registro de emergência · Ômega para controle terrestre. Perdemos o acesso administrativo. NEXUS não responde. Solicitamos assistência imediata…'}</p>}</>;
  return <Puzzle mission={mission} setMission={setMission} id={id} en={en} onSolve={()=>{playCue(id);setMission(m=>m.fragments.includes(id)?m:{...m,fragments:[...m.fragments,id]});}}/>;
}
