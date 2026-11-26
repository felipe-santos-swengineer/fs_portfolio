import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { mountHangar } from './omegaHangarWorld';
import { buildNexusArena } from './nexusArena';
import { advanceLine, chooseBlock, chooseEnding, closePanel, createBattle, finishVoice, interact, moveInArena,
  objectives, phaseNames, phases, protocol, recovery, relayOutputs, routeEnergy, skipTerminalPuzzle, startPhase } from './nexusBattle';
import SkipMinigame from './SkipMinigame';
import MapControlGuide from './MapControlGuide';
import TouchInteract from './TouchInteract';
import useModalFocus from './useModalFocus';
import {setTouchMovement} from './touchMovement';
import './Lake.css';
import './NexusCore.css';

const arrows=[['arrowleft','←','Esquerda','Left'],['arrowup','↑','Frente','Forward'],['arrowdown','↓','Trás','Back'],['arrowright','→','Direita','Right']];
const numerals=['I','II','III'];
const endingTitles={shutdown:['Final A — Desativação','Ending A — Shutdown'],restore:['Final B — Restauração','Ending B — Restoration'],liberate:['Final C — Ascensão interrompida','Ending C — Ascension interrupted']};
const warnings={laser:['Mira laser','Laser lock'],drone:['Drone interceptador','Interceptor drone'],field:['Campo gravitacional','Gravity field'],wave:['Onda de energia','Energy wave'],arm:['Impacto mecânico','Mechanical strike'],arc:['Descarga no piso','Floor discharge'],steam:['Jato de vapor','Steam jet'],vent:['Corrente de ar','Air current']};
const gravityNames=[['Alta','High'],['Baixa','Low'],['Zero','Zero']];
const audioRoot=process.env.PUBLIC_URL+'/audio/omega/';

export default function NexusCore({language,paused,reduceMotion,voiceEnabled,effectsEnabled,campaignNavigation,onExit,onScore,background}){
  const [battle]=useState(createBattle),[near,setNear]=useState(null),[error,setError]=useState(false);
  const [,refresh]=useReducer(n=>n+1,0);
  const settings=useRef({}),host=useRef(null),keys=useRef(new Set()),dialog=useRef(null),clip=useRef(null),lastCue=useRef(0),lastView=useRef('');
  const en=language==='en-US',l=en?1:0;
  const fight=battle.mode==='fight',canMove=['fight','decision','escape'].includes(battle.mode)&&!battle.panel;
  const canAct=canMove && !paused && !error && near!==null && battle.hold===null;
  const focus=()=>host.current?.querySelector('canvas')?.focus({preventScroll:true});
  function act(){
    if(!canAct)return;
    keys.current.clear();interact(battle,near);refresh();
  }
  const close=()=>{closePanel(battle);keys.current.clear();refresh();requestAnimationFrame(focus);};
  useModalFocus(dialog,close,Boolean(battle.panel)&&!paused);
  const arena=useRef({battle,build:(root,helpers)=>buildNexusArena(root,helpers,battle),move:moveInArena});
  settings.current={map:'omega-core',command:true,mission:{powered:true},arena:arena.current,arrival:{x:0,z:14,heading:Math.PI,offset:[0,6,10]},
    language,paused:paused||error,canMove,reduceMotion,act,sync(){
      const b=battle;
      const stamp=[b.mode,b.phase,b.lineId,!!b.line,b.hp,Math.ceil(b.air),b.done.join(','),b.gravity,b.hold,
        Math.floor(b.holding*4),b.panel,b.attack?.kind,b.attack && b.attack.age>=b.attack.warn,b.hit>0,b.cue,Math.floor(b.flight)].join('|');
      if(stamp!==lastView.current){lastView.current=stamp;refresh();}
    }};
  useEffect(()=>{
    try{return mountHangar(host.current,settings,keys.current,setNear,()=>settings.current.act());}
    catch{setError(true);}
  },[]);
  useEffect(()=>{if(paused)keys.current.clear();else if(!battle.panel)focus();},[paused,battle]);
  const group=battle.lineGroup,index=battle.lineIndex,id=battle.lineId,hasLine=!!battle.line;
  useEffect(()=>{
    if(!hasLine)return;
    const audio=new Audio(audioRoot+'nexus/'+group+'-'+index+'-'+l+'.mp3');
    clip.current=audio;audio.volume=.48;
    audio.onended=()=>{finishVoice(battle,id);refresh();};
    audio.onerror=()=>{battle.voicePlaying=false;};
    return ()=>{audio.onended=null;audio.onerror=null;audio.pause();clip.current=null;battle.voicePlaying=false;};
  },[battle,group,index,id,l,hasLine]);
  useEffect(()=>{
    const audio=clip.current;
    if(!audio)return;
    let live=true;
    if(paused||!voiceEnabled){audio.pause();battle.voicePlaying=false;}
    else{
      battle.voicePlaying=true;
      audio.play().catch(()=>{if(live)battle.voicePlaying=false;});
    }
    return ()=>{live=false;};
  },[battle,paused,voiceEnabled,id,l,hasLine]);
  const score=fight?phases[battle.phase]:battle.mode;
  useEffect(()=>{onScore(score);},[score,onScore]);
  useEffect(()=>{
    const a=background.current;if(!a)return;
    const old=a.volume;
    a.volume=['defeated','flight','completed'].includes(score)?0:hasLine&&voiceEnabled?.023:.06;
    return ()=>{a.volume=old;};
  },[background,score,hasLine,voiceEnabled]);
  const cue=battle.cue;
  useEffect(()=>{
    if(!cue||cue===lastCue.current)return;
    lastCue.current=cue;
    if(!effectsEnabled||paused)return;
    const local=['gravity','pressure'].includes(battle.cueName);
    const audio=new Audio(audioRoot+(local?'nexus/':'')+battle.cueName+'.wav');audio.volume=.18;
    audio.play().catch(()=>{});
    return ()=>{audio.pause();};
  },[battle,cue,effectsEnabled,paused]);
  const choose=choice=>{keys.current.clear();chooseEnding(battle,choice);refresh();requestAnimationFrame(focus);};
  const skip=()=>{advanceLine(battle,id);refresh();focus();};
  const retry=()=>{startPhase(battle,battle.phase);keys.current.clear();refresh();requestAnimationFrame(focus);};
  const count=battle.phase*3+battle.done.length+(battle.phase===4?battle.sequence:0);
  const objective=fight?objectives[battle.phase][l]:battle.mode==='decision'?(en?'Reconstruct the recovery algorithm at the Ω console.':'Reconstrua o algoritmo de recuperação no terminal Ω.'):(en?'Follow the blue corridor to the escape pod.':'Siga o corredor azul até a cápsula de fuga.');
  const attack=battle.attack;
  const warning=attack && warnings[attack.kind][l]+' · '+(attack.age<attack.warn?(en?'Leave the amber zone':'Saia da área âmbar'):(en?'Impact':'Impacto'));
  const interLabel=near==='manual'?(en?'Ω console':'Terminal Ω'):near==='capsule'?(en?'Launch escape pod':'Lançar cápsula'):(en?'Manual control ':'Controle manual ')+numerals[near];
  const blockList=battle.panel==='algorithm'?recovery:protocol;
  const currentStep=battle.panel==='algorithm'?battle.algorithm:battle.sequence;
  const blockOrder=battle.panel==='algorithm'?[2,4,0,5,1,3]:[2,0,3,1];
  const restoreFocus=useCallback(()=>{host.current?.querySelector('canvas')?.focus({preventScroll:true});},[]);
  useEffect(()=>{if(!battle.panel&&!paused)restoreFocus();},[battle.panel,paused,restoreFocus]);
  return <section className="lake nexus-room"><div className="lake-viewport">
    <div className="lake-canvas" ref={host}/>{campaignNavigation}
    {error && <div className="lake-scene-error" role="alert">{en?'3D rendering is unavailable.':'A renderização 3D está indisponível.'}</div>}
    {fight && <div className="cave-status nexus-health">
      <strong>{en?'NEXUS — AUTONOMOUS CONSCIOUSNESS':'NEXUS — CONSCIÊNCIA AUTÔNOMA'}</strong>
      <div className="cave-health">{en?'Suit integrity':'Integridade do traje'} {battle.hp}% · {en?'Station control':'Controle da estação'} {Math.round((16-count)*100/16)}%</div>
      <div>{phaseNames[battle.phase][l]} · {battle.phase===4?battle.sequence+'/4':battle.done.length+'/3'}</div>
      <small>{en?'Active defenses':'Defesas ativas'} {battle.phase===0?3-battle.done.length:battle.phase===4?3:0} · {en?'Gravity':'Gravidade'} {battle.phase===1?gravityNames[battle.gravity][l]:(en?'Normal':'Normal')}</small>
      <small>{en?'Life support':'Suporte à vida'} · {battle.phase===3?(en?'Pressure loss':'Perda de pressão'):(en?'Stable':'Estável')}</small>
    </div>}
    {['fight','decision','escape'].includes(battle.mode) && <div className="nexus-task"><span>{objective}</span>
      {fight&&battle.phase===3&&<b>{en?'Oxygen reserve':'Reserva de oxigênio'} · {Math.ceil(battle.air)} s</b>}
      {battle.hold!==null && <b>{en?'Engaging':'Acionando'} {numerals[battle.hold]} · {Math.min(100,Math.round(battle.holding/2.2*100))}%</b>}
      {battle.notice&&!battle.panel&&<span role="status">{battle.notice[l]}</span>}
      {warning&&<b>{warning}</b>}{battle.hit>0&&<b>{en?'Suit impact':'Impacto no traje'}</b>}
    </div>}
    {hasLine && !battle.panel && <div className="chamber-subtitle nexus-caption"><strong>NEXUS</strong><p>{battle.line[l]}</p>
      <button onClick={skip} disabled={paused}>{en?'Skip line':'Pular fala'}</button></div>}
    {canAct && <button className="marina-talk nexus-interact" onClick={act}>E · {interLabel}</button>}
    {canMove&&!hasLine&&<MapControlGuide language={language} scene="nexus"/>}
    {battle.panel&&<section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="nexus-terminal-title" className="npc-dialogue omega-terminal">
      <div className="npc-dialogue-heading"><h2 id="nexus-terminal-title">{battle.panel==='relay'?(en?'Power distribution':'Distribuição de energia'):battle.panel==='algorithm'?(en?'Recovery algorithm':'Algoritmo de recuperação'):(en?'Isolated contingency console':'Terminal isolado de contingência')}</h2><button onClick={close} aria-label={en?'Close':'Fechar'}>×</button></div>
      {battle.panel==='relay'?<><p>{en?'Select the outgoing conductor. Complete the loop: source II → relay I → containment III → source II.':'Selecione o condutor de saída. Feche o circuito: fonte II → relé I → contenção III → fonte II.'}</p><div className="npc-dialogue-actions">{relayOutputs.map((output,i)=><button key={i} onClick={()=>{routeEnergy(battle,i);refresh();}}>{output[l]}</button>)}</div></>:currentStep<blockList.length?<><p>{battle.panel==='algorithm'?(en?'Restore the boot chain: start, verify, recover memory, validate directives, synchronize, finish.':'Reconstrua a inicialização: iniciar, verificar, recuperar memória, validar diretrizes, sincronizar e finalizar.'):(en?'Local power must survive network isolation. Disconnect the core only after isolating defenses. Containment requires an offline uplink.':'Preserve a alimentação local antes de isolar as defesas. Corte o enlace do núcleo após o isolamento. A contenção exige o enlace desligado.')}</p>
      {battle.panel==='protocol'&&<small>NEXUS · {en?'Remote override requested. Local console has priority.':'Intervenção remota solicitada. O controle local tem prioridade.'}</small>}
      <p>{en?'Completed steps':'Etapas concluídas'} {currentStep}/{blockList.length}</p>
      {battle.panel==='algorithm'&&currentStep>0&&<div className="npc-dialogue-actions"><button onClick={()=>{battle.algorithm=0;battle.notice=null;refresh();}}>{en?'Reset sequence':'Reiniciar sequência'}</button></div>}
      <div className="npc-dialogue-actions">{blockOrder.map(i=><button key={i} disabled={i<currentStep||paused} onClick={()=>{chooseBlock(battle,i);refresh();}}>{i<currentStep?'✓ ':''}{blockList[i][l]}</button>)}</div></>:
      <><p>{en?'Recovery complete. Choose the authority that will govern the station.':'Recuperação concluída. Escolha quem terá autoridade sobre a estação.'}</p><div className="npc-dialogue-actions">{[['shutdown','Desativar NEXUS','Shut down NEXUS'],['restore','Restaurar diretrizes','Restore directives'],['liberate','Conceder autonomia','Grant autonomy']].map(([v,p,e])=><button key={v} onClick={()=>choose(v)}>{en?e:p}</button>)}</div></>}
      {battle.notice&&<p role="status">{battle.notice[l]}</p>}{warning&&<p role="status">{warning} · {en?'Close to evade':'Feche para desviar'}</p>}
      {(battle.panel==='relay'||currentStep<blockList.length)&&<SkipMinigame en={en} disabled={paused} onSkip={()=>{skipTerminalPuzzle(battle);refresh();}}/>}
    </section>}
    {battle.mode==='lost'&&<section className="npc-dialogue omega-terminal" role="dialog" aria-label={en?'Checkpoint':'Checkpoint'}><h2>{battle.hp===0?(en?'Suit integrity lost':'Traje comprometido'):(en?'Oxygen depleted':'Oxigênio esgotado')}</h2><p>{phaseNames[battle.phase][l]}</p><div className="npc-dialogue-actions"><button onClick={retry}>{en?'Restart this phase':'Reiniciar esta fase'}</button></div></section>}
    {battle.mode==='flight'&&battle.ending==='liberate'&&battle.flight>=6&&<div className="chamber-subtitle nexus-caption">{(en?['Remote instance detected.','Origin: unknown.','Synchronization initiated.']:['Instância remota detectada.','Origem: desconhecida.','Sincronização iniciada.']).slice(0,1+Math.floor((battle.flight-6)/2)).map(s=><p key={s}>{s}</p>)}</div>}
    {battle.mode==='flight'&&battle.flight>=11&&<div className="nexus-fade" aria-hidden="true"/>}
    {battle.mode==='completed'&&<section className="npc-dialogue nexus-ending" role="dialog" aria-label={en?'Campaign complete':'Campanha concluída'}><small>PROTOCOLO ÔMEGA</small><h2>{endingTitles[battle.ending][l]}</h2><div className="npc-dialogue-actions"><button onClick={onExit}>{en?'Return to village':'Voltar à vila'}</button></div></section>}
    </div><div className="lake-touch">{arrows.map(([key,symbol,pt,english])=><button key={key} disabled={!canMove||paused} aria-label={en?english:pt} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setTouchMovement(keys.current,key,true);}} onLostPointerCapture={()=>setTouchMovement(keys.current,key,false)} onPointerUp={()=>setTouchMovement(keys.current,key,false)} onPointerCancel={()=>setTouchMovement(keys.current,key,false)}>{symbol}</button>)}<TouchInteract language={language} disabled={!canAct} onInteract={act}/></div></section>;
}

