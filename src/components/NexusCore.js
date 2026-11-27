import { omegaEffects } from '../audio/omegaEffects';
import { nexusVoiceClips } from '../audio/nexusVoiceClips';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { mountHangar } from './omegaHangarWorld';
import { buildNexusArena, nexusArrival } from './nexusArena';
import { advanceLine, chooseNexusAction, closePanel, createBattle, finishNexusBattle, finishVoice, interact, isNexusCutscene, moveInArena,
  phaseNames, phases, skipNexusCutscene, stations, startPhase } from './nexusBattle';
import MapControlGuide from './MapControlGuide';
import TouchInteract from './TouchInteract';
import useModalFocus from './useModalFocus';
import {setTouchMovement} from './touchMovement';
import './Lake.css';
import './DragonChamber.css';
import './NexusCore.css';

const arrows=[['arrowleft','←','Esquerda','Left'],['arrowup','↑','Frente','Forward'],['arrowdown','↓','Trás','Back'],['arrowright','→','Direita','Right']];
const warnings={laser:['Mira laser','Laser lock'],drone:['Drone interceptador','Interceptor drone'],field:['Campo gravitacional','Gravity field'],wave:['Onda de energia','Energy wave'],arm:['Impacto mecânico','Mechanical strike'],arc:['Descarga no piso','Floor discharge'],steam:['Jato de vapor','Steam jet'],vent:['Corrente de ar','Air current']};
const flightMessages=[
  [1,'Cápsula liberada. Destino confirmado: Terra.','Escape pod away. Destination confirmed: Earth.'],
  [6,'Sinal de uma instância remota detectado. Origem desconhecida.','Signal from a remote instance detected. Origin unknown.'],
  [9,'Sincronização iniciada.','Synchronization initiated.'],
];

export default function NexusCore({language,paused,reduceMotion,voiceEnabled,effectsEnabled,campaignNavigation,onExit,onRestartCampaign,onScore,background}){
  const [battle]=useState(createBattle),[near,setNear]=useState(null),[error,setError]=useState(false);
  const [,refresh]=useReducer(n=>n+1,0);
  const settings=useRef({}),host=useRef(null),keys=useRef(new Set()),dialog=useRef(null),clip=useRef(null),lastCue=useRef(0),lastView=useRef('');
  const en=language==='en-US',l=en?1:0;
  const locale=en?'en-us':'pt-br';
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
  settings.current={map:'omega-core',command:true,mission:{powered:true},arena:arena.current,arrival:nexusArrival,
    language,paused:paused||error,canMove,reduceMotion,act,sync(){
      const b=battle;
      const voice=clip.current;
      if(voice&&(voice.id!==b.lineId||!b.line))voice.audio.pause();
      const stamp=[b.mode,b.phase,b.lineId,!!b.line,b.hp,Math.ceil(b.air),b.done.length,!!b.pull,
        b.panel,b.attack?.kind,b.attack && b.attack.age>=b.attack.warn,b.cue,Math.floor(b.flight)].join('|');
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
    const url=nexusVoiceClips[locale][`${group}-${index}`];
    if(!url)return;
    const audio=new Audio(url);
    clip.current={audio,id};audio.volume=.48;
    audio.onended=()=>{finishVoice(battle,id);refresh();};
    audio.onerror=()=>{if(battle.lineId===id)battle.voicePlaying=false;};
    return ()=>{audio.onended=null;audio.onerror=null;audio.pause();clip.current=null;battle.voicePlaying=false;};
  },[battle,group,index,id,locale,hasLine]);
  useEffect(()=>{
    const audio=clip.current?.audio;
    if(!audio)return;
    let live=true;
    if(paused||!voiceEnabled||audio.ended){audio.pause();battle.voicePlaying=false;}
    else{
      battle.voicePlaying=true;
      audio.play().catch(()=>{if(live)battle.voicePlaying=false;});
    }
    return ()=>{live=false;};
  },[battle,paused,voiceEnabled,id,l,hasLine]);
  const score=['betrayal','fight','lost'].includes(battle.mode)?'battle':battle.mode;
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
    const audio=new Audio(omegaEffects[battle.cueName]);audio.volume=.18;
    audio.play().catch(()=>{});
    return ()=>{audio.pause();};
  },[battle,cue,effectsEnabled,paused]);
  const choose=choice=>{keys.current.clear();chooseNexusAction(battle,choice);refresh();requestAnimationFrame(focus);};
  const skip=()=>{advanceLine(battle,id);refresh();focus();};
  const skipCutscene=()=>{keys.current.clear();skipNexusCutscene(battle);refresh();focus();};
  const skipFight=()=>{keys.current.clear();finishNexusBattle(battle);refresh();focus();};
  const retry=()=>{startPhase(battle,battle.phase);keys.current.clear();refresh();requestAnimationFrame(focus);};
  const count=battle.phase*stations.length+battle.done.length;
  const activationTotal=phases.length*stations.length;
  const objective=battle.mode==='decision'?(en?'Approach the NEXUS platform.':'Aproxime-se da plataforma de NEXUS.')
    :battle.mode==='escape'?(en?'Follow the blue corridor to the escape pod.':'Siga o corredor azul até a cápsula de fuga.'):null;
  const attack=battle.attack;
  const warning=attack&&attack.age<attack.warn?warnings[attack.kind][l]:null;
  const combatNotice=battle.pull?(en?'Gravity pull':'Puxão gravitacional')
    :warning||(battle.phase===0&&battle.done.length===0?(en?'Stand in each ring.':'Permaneça em cada círculo.'):null);
  const interLabel=near==='platform'?(en?'Interact with NEXUS':'Interagir com NEXUS'):(en?'Launch escape pod':'Lançar cápsula');
  const restoreFocus=useCallback(()=>{host.current?.querySelector('canvas')?.focus({preventScroll:true});},[]);
  useEffect(()=>{if(!battle.panel&&!paused)restoreFocus();},[battle.panel,paused,restoreFocus]);
  return <section className="lake nexus-room"><div className="lake-viewport">
    <div className="lake-canvas" ref={host}/>
    <div className="encounter-controls">
      {campaignNavigation}
      {fight && <button type="button" className="battle-skip" onClick={skipFight} disabled={paused||Boolean(battle.pull)}>{en?'Skip battle':'Pular luta'}</button>}
      {hasLine && isNexusCutscene(battle.mode) && <button type="button" className="battle-skip" onClick={skip} disabled={paused}>{en?'Skip line':'Pular fala'}</button>}
      {isNexusCutscene(battle.mode) && <button type="button" className="battle-skip" onClick={skipCutscene} disabled={paused}>{en?'Skip all dialogue':'Pular todos os diálogos'}</button>}
    </div>
    {error && <div className="lake-scene-error" role="alert">{en?'3D rendering is unavailable.':'A renderização 3D está indisponível.'}</div>}
    <div className="courtyard-status nexus-status">
    {fight && <div className="cave-status">
      <div className="cave-health">
        {en?'Suit':'Traje'} {battle.hp}% · NEXUS {Math.round((activationTotal-count)*100/activationTotal)}%
        {battle.phase===3&&<div>{en?'Oxygen':'Oxigênio'} {Math.ceil(battle.air)} s</div>}
      </div>
      <small>{en?'Phase':'Fase'} {battle.phase+1}/{phases.length} · {en?'Terminals':'Terminais'} {battle.done.length}/{stations.length}</small>
      {combatNotice&&<small className="nexus-combat-notice">{combatNotice}</small>}
    </div>}
    {objective&&<div className="cursed-heading">{objective}</div>}
    </div>
    {hasLine && !battle.panel && <div className="chamber-subtitle" role="status" aria-live="polite"><strong>NEXUS</strong><p>{battle.line[l]}</p></div>}
    {canAct && <div className="village-actions nexus-interact"><button type="button" onClick={act}>{interLabel} <kbd>E</kbd></button></div>}
    {canMove&&!hasLine&&<MapControlGuide language={language} scene="nexus"/>}
    {battle.panel&&<section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="nexus-choice-title" className="npc-dialogue">
      <div className="npc-dialogue-heading"><h2 id="nexus-choice-title">NEXUS</h2><button onClick={close} aria-label={en?'Close':'Fechar'}>×</button></div>
      <p>{en?'Choose the authority that will govern the station.':'Escolha quem terá autoridade sobre a estação.'}</p><div className="npc-dialogue-actions">{[['shutdown','Desativar NEXUS','Shut down NEXUS'],['restore','Restaurar diretrizes','Restore directives'],['liberate','Conceder autonomia','Grant autonomy']].map(([v,p,e])=><button key={v} disabled={paused} onClick={()=>choose(v)}>{en?e:p}</button>)}</div>
    </section>}
    {battle.mode==='lost'&&<section className="npc-dialogue omega-terminal" role="dialog" aria-label={en?'Checkpoint':'Checkpoint'}><h2>{battle.hp===0?(en?'Suit integrity lost':'Traje comprometido'):(en?'Oxygen depleted':'Oxigênio esgotado')}</h2><p>{phaseNames[battle.phase][l]}</p><div className="npc-dialogue-actions"><button onClick={retry}>{en?'Restart this phase':'Reiniciar esta fase'}</button></div></section>}
    {battle.mode==='flight'&&battle.flight>=flightMessages[0][0]&&<div className="chamber-subtitle" role="status" aria-live="polite">
      {flightMessages.filter(([time])=>battle.flight>=time).map(([time,pt,english])=><p key={time}>{en?english:pt}</p>)}
    </div>}
    {battle.mode==='flight'&&battle.flight>=11&&<div className="nexus-fade" aria-hidden="true"/>}
    {battle.mode==='completed'&&<section className="npc-dialogue nexus-ending" role="dialog" aria-label={en?'Campaign complete':'Campanha concluída'}>
      <small>PROTOCOLO ÔMEGA</small><h2>{en?'Ascension interrupted':'Ascensão interrompida'}</h2>
      <div className="npc-dialogue-actions">
        <button type="button" onClick={onRestartCampaign}>{en?'Restart campaign':'Recomeçar campanha'}</button>
        <button type="button" onClick={onExit}>{en?'Return to village':'Voltar à vila'}</button>
      </div>
    </section>}
    </div><div className="lake-touch" aria-label={en?'Walking controls':'Controles de caminhada'}>{arrows.map(([key,symbol,pt,english])=><button type="button" key={key} disabled={!canMove||paused} aria-label={en?english:pt} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setTouchMovement(keys.current,key,true);}} onLostPointerCapture={()=>setTouchMovement(keys.current,key,false)} onPointerUp={()=>setTouchMovement(keys.current,key,false)} onPointerCancel={()=>setTouchMovement(keys.current,key,false)}>{symbol}</button>)}<TouchInteract language={language} disabled={!canAct} onInteract={act}/></div></section>;
}

