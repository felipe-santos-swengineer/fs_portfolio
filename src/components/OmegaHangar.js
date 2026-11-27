import { useCallback, useEffect, useRef, useState } from 'react';
import { setTouchMovement } from './touchMovement';
import MapControlGuide from './MapControlGuide';
import TouchInteract from './TouchInteract';
import useModalFocus from './useModalFocus';
import { stations } from './omegaCommandCenter';
import CommandTerminal, { commandObjective } from './CommandTerminal';
import { SUIT_READY, SUIT_EQUIPPED } from './omegaSuit';
import { mountHangar } from './omegaHangarWorld';
import commandAnnouncements from './commandAnnouncements.json';
import {branchMaps,coreUnlocked,sectorObjective,systems,records,events} from './omegaProgress';
import OmegaSectorTerminal from './OmegaSectorTerminal';
import lines from './omegaSectorLines.json';
import announcements from './omegaAnnouncements.json';
import './DragonChamber.css';
import './Lake.css';

const audioRoot = process.env.PUBLIC_URL + '/audio/omega/';
const arrows = [['arrowleft','←','Esquerda','Left'], ['arrowup','↑','Frente','Forward'], ['arrowdown','↓','Trás','Back'], ['arrowright','→','Direita','Right']];
const objectives = [
  ['Desembarque e explore a plataforma OMEGA-03.', 'Disembark and explore pad OMEGA-03.'],
  ['Aguarde a resposta do centro de comando.', 'Await a response from command.'],
  ['Contenção em andamento.', 'Containment in progress.'],
  ['Transmissão recebida de NEXUS.', 'Incoming transmission from NEXUS.'],
  ['Investigue o terminal de controle do hangar. Suba a escada da cabine.', 'Investigate the hangar control terminal. Take the stairs to the booth.'],
  ['Dirija-se ao centro de comando. Atravesse a porta do setor 01.', 'Head to the command center through the Sector 01 door.'],
  ['Aguarde a descontaminação na câmara.', 'Wait in the chamber during decontamination.'],
  ['Vista o EX-07 no suporte iluminado da parede.', 'Equip the EX-07 from the illuminated wall rack.'],
  ['Atravesse a saída ao fundo da câmara para entrar no Centro de Comando.', 'Cross the far doorway to enter the Command Center.'],
];

export default function OmegaHangar({ map, mission, setMission, onTravel, arrival, onEnterCommand, language, paused, reduceMotion, campaignNavigation, voiceEnabled, effectsEnabled }) {
  const host = useRef(null), keys = useRef(new Set()), settings = useRef({});
  const command=map==='omega-command', branch=branchMaps.includes(map), hangar=!command&&!branch;
  const {phase,skipped:skippedPhase,nextLine}=mission;
  const [near,setNear]=useState(false),[error,setError]=useState(false);
  const change=useCallback((key,value)=>setMission(m=>({...m,[key]:typeof value==='function'?value(m[key]):value})),[setMission]);
  const setPhase=v=>change('phase',v), setSkippedPhase=v=>change('skipped',v);
  const setNextLine=useCallback(v=>change('nextLine',v),[change]);
  const [sectorLine,setSectorLine]=useState(null);
  const [terminal, setTerminal] = useState(false);
  const panel = useRef(null), voice = useRef(null);
  const en = language === 'en-US', locale = en ? 1 : 0;
  const title = branch ? (map==='omega-lab'?(en?'Experimental Laboratory':'Laboratório Experimental'):(en?'Reactor Room':'Sala do Reator')) : command ? (en?'Command Center':'Centro de Comando') : (en?'Arrival Hangar':'Hangar de chegada');
  const frozen = paused || terminal || error;
  const available = !frozen && near && (!hangar || phase >= 4);
  const collectingSuit = hangar && phase === SUIT_READY;
  const actionLabel = near==='coreAccess'?(en?'Enter the NEXUS core':'Entrar no núcleo NEXUS'):near==='return'?(en?'Return to Command':'Voltar ao Comando'):branchMaps.includes(near)?(near==='omega-lab'?(en?'Enter laboratory':'Entrar no laboratório'):(en?'Enter reactor room':'Entrar na sala do reator')):collectingSuit ? (en?'Equip EX-07':'Vestir EX-07') : (en?'Read terminal':'Consultar terminal');

  const latestLine = mission.authorized ? 6 : mission.fragments.length ? 1 + mission.fragments.length : Number(mission.table);
  const commandLine = command && nextLine <= latestLine ? nextLine : null;
  useEffect(()=>{
    if(paused || terminal || sectorLine) return;
    let key;
    if(branch && !mission.visited.includes(map))key=map==='omega-lab'?(mission.powered?'lab-powered':'lab-entry'):(mission.scientific?'reactor-informed':'reactor-entry');
    else if(map==='omega-lab' && mission.scientific)key='lab-reveal';
    else if(map==='omega-reactor' && mission.powered)key='reactor-online';
    else if(command && commandLine!==0 && coreUnlocked(mission))key='core-access';
    if(!key || mission.played.includes(key))return;
    setSectorLine(key);
    setMission(m=>({...m,played:[...new Set([...m.played,key])],visited:[...new Set([...m.visited,map])]}));
  },[map,branch,command,commandLine,mission,paused,terminal,sectorLine,setMission]);
  const transmission = sectorLine ? lines[sectorLine][locale] : command ? commandAnnouncements[commandLine]?.[locale] : hangar && skippedPhase !== phase && announcements[phase]?.[locale];
  // Keep each map's skip action scoped to its own minigames. In particular,
  // Command Center may fill only its authentication fragments; Engineering
  // and Laboratory progress must be earned or skipped from those maps.
  const canSkipMinigames = command
    ? mission.fragments.length < stations.length
    : map==='omega-reactor'
      ? !mission.powered
      : map==='omega-lab' && !mission.scientific;
  const skipMinigames = () => {
    if (frozen || !canSkipMinigames) return;
    keys.current.clear();
    if (map==='omega-lab') {
      setMission(current=>({...current, records:records.map((_,i)=>i), timeline:events.map((_,i)=>i), scientific:true}));
    } else if (map==='omega-reactor') {
      setMission(current=>({...current,subsystems:[...systems],powered:true}));
    } else {
      setMission(current=>({...current,table:true,briefed:true,fragments:stations.map(station=>station.id)}));
      setNextLine(stations.length + 1);
    }
    host.current?.querySelector('canvas')?.focus({preventScroll:true});
  };
  const finishTransmission = () => {
    if (!transmission) return;
    if (voice.current) {
      voice.current.onended = null;
      voice.current.pause();
    }
    if (sectorLine) setSectorLine(null);
    else if (command) setNextLine(line => Math.max(line,commandLine+1));
    else setSkippedPhase(phase);
  };
  const skipDialogue = () => {
    if (frozen || !transmission) return;
    keys.current.clear();
    finishTransmission();
    if (hangar && phase < 4) setPhase(4);
    else if (hangar && phase === 6) setPhase(SUIT_READY);
    host.current?.querySelector('canvas')?.focus({ preventScroll: true });
  };
  const close = () => {
    setTerminal(false);
    requestAnimationFrame(() => host.current?.querySelector('canvas')?.focus({ preventScroll: true }));
  };
  useModalFocus(panel, close, Boolean(terminal) && !paused);
  const act = () => {
    if (!available) return;
    keys.current.clear();
    if(near==='coreAccess'){onTravel('omega-core');return;}
    if(near==='return'){onTravel('omega-command',{x:map==='omega-lab'?-11:11,z:14,heading:Math.PI,offset:[0,6,10]});return;}
    if(branchMaps.includes(near)){onTravel(near);return;}
    if (collectingSuit) {
      setPhase(SUIT_EQUIPPED);
      setNear(false);
      host.current?.querySelector('canvas')?.focus({ preventScroll: true });
    } else {
      if(commandLine!==0)finishTransmission();
      setTerminal(hangar ? true : near);
      if(branch)setMission(m=>m.started.includes(near)?m:{...m,started:[...m.started,near]});
      if(command && near==='table' && !mission.table)setMission(m=>({...m,table:true}));
      if(command && near==='bridge' && mission.table && !mission.briefed){
        // Reading the commander's terminal also satisfies the queued instruction to visit it.
        setMission(m=>({...m,briefed:true,nextLine:m.nextLine===0?0:Math.max(m.nextLine,2)}));
      }
    }
  };
  settings.current = {
    language, branch, map, command, arrival, mission, onEnterCommand,
    paused: frozen, reduceMotion, phase, act,
    advance: expected => setPhase(current => current === expected ? current + 1 : current),
    speechBusy: () => voice.current && !voice.current.paused && !voice.current.ended,
  };
  useEffect(() => {
    try { return mountHangar(host.current, settings, keys.current, setNear, () => settings.current.act()); }
    catch { setError(true); }
  }, []);
  useEffect(() => { if (frozen) keys.current.clear(); }, [frozen]);
  useEffect(() => {
    if (error || !transmission) return;
    const prefix = command ? 'command-' : '';
    const number = command ? commandLine : phase;
    const clip = new Audio(audioRoot + (sectorLine ? sectorLine+(en?'-en.wav':'-pt.mp3') : prefix + (en ? 'en-' + number + '.wav' : 'pt-' + number + '.mp3')));
    clip.volume = .38;
    voice.current = clip;
    clip.onended = () => { if(sectorLine)setSectorLine(null); else if(command)setNextLine(n=>n===commandLine?n+1:n); };
    return () => { clip.onended = null; clip.pause(); voice.current = null; };
  }, [en, phase, transmission, error, command, commandLine,sectorLine,setNextLine]);
  useEffect(() => {
    const clip = voice.current;
    if (!clip) return;
    if (frozen || !voiceEnabled) clip.pause();
    else if (!clip.ended) clip.play().catch(() => {});
  }, [frozen, voiceEnabled, en, phase, commandLine,sectorLine]);
  useEffect(() => {
    if((commandLine===null && !sectorLine) || frozen) return;
    const timeout=setTimeout(()=>{
      if(voice.current && !voice.current.paused)return;
      if(sectorLine)setSectorLine(null);else setNextLine(n=>n===commandLine?n+1:n);
    },Math.max(4500,(transmission?.length || 0)*75));
    return ()=>clearTimeout(timeout);
  },[commandLine,transmission,frozen,voiceEnabled,sectorLine,setNextLine]);
  const effect = useRef(null);
  useEffect(() => {
    const name = hangar && {2:'lock',6:'scan'}[phase];
    effect.current = name ? new Audio(audioRoot+name+'.wav') : null;
    if (effect.current) effect.current.volume = .22;
    return () => { effect.current?.pause(); effect.current = null; };
  }, [phase,hangar]);
  useEffect(() => {
    const sound = effect.current;
    if (sound && effectsEnabled && !frozen && !sound.ended) sound.play().catch(() => {});
    else sound?.pause();
  }, [phase,effectsEnabled,frozen]);
  return <section className="lake">
    <div className="lake-viewport">
      <div className="lake-canvas" ref={host}/>
      <div className="encounter-controls">
        {campaignNavigation}
        {!terminal && hangar && <button type="button" className="battle-skip" disabled={paused} onClick={() => { keys.current.clear(); onEnterCommand(); }}>
          {en ? 'Skip to Command Center' : 'Ir direto ao Centro de Comando'}
        </button>}
        {!terminal && canSkipMinigames && <button type="button" className="battle-skip" disabled={paused || error} onClick={skipMinigames}>
          {en ? 'Skip all minigames' : 'Pular todos os minigames'}
        </button>}
        {transmission && !terminal && !error && <button type="button" className="battle-skip" disabled={paused} onClick={skipDialogue}>
          {en ? 'Skip dialogue' : 'Pular diálogos'}
        </button>}
      </div>
      <div className="cursed-heading omega-status"><strong>{title}</strong><div aria-live="polite">{branch || (command && (mission.authorized || coreUnlocked(mission))) ? sectorObjective(map,mission,en) : command ? commandObjective(mission,en) : objectives[phase][locale]}</div>
        <small>{en?'Administration':'Administração'} {mission.authorized?'✓':'—'} · {en?'Records':'Registros'} {mission.records.length}/4 · {en?'Subsystems':'Subsistemas'} {mission.subsystems.length}/3 · NEXUS {coreUnlocked(mission)?'✓':'—'}</small></div>
      {error ? <p className="lake-scene-error">{en ? '3D is unavailable in this browser.' : 'O 3D não está disponível neste navegador.'}</p> :
        <MapControlGuide language={language} scene={!hangar ? "omegaCommand" : "omegaHangar"}/>}
      {transmission && !terminal && !error && <div className="chamber-subtitle omega-caption" role="status"><strong>{!hangar || phase===3 ? 'NEXUS' : (en?'Station Ω':'Estação Ω')}</strong><p>{transmission}</p></div>}
      {available && <div className="village-actions"><button onClick={act}>{actionLabel} <kbd>E</kbd></button></div>}
      {terminal && <section className="npc-dialogue omega-terminal" role="dialog" aria-modal="true" aria-labelledby="omega-title" ref={panel} tabIndex={-1}>
        <div className="npc-dialogue-heading"><div><small>OMEGA-03</small><h2 id="omega-title">{!hangar ? title : (en?'Hangar control':'Controle do hangar')}</h2></div><button onClick={close} aria-label={en?'Close':'Fechar'}>×</button></div>
        {branch ? <OmegaSectorTerminal onClose={close} id={terminal} map={map} m={mission} setMission={setMission} en={en} effectsEnabled={effectsEnabled} paused={paused}/> : command ? <CommandTerminal effectsEnabled={effectsEnabled} paused={paused} id={terminal} en={en} mission={mission} setMission={setMission}/> : <><p>{en?'Station critical. Main power offline. Command is running on auxiliary power. External communications failed. Crew detected: 0.':'Estação em estado crítico. Energia principal indisponível. Centro de comando em energia auxiliar. Comunicação externa indisponível. Tripulantes detectados: 0.'}</p>
        <p>{en?'04:16 · Last shuttle departed empty. The distress call originated aboard the station.':'04:16 · A última nave saiu vazia. O pedido de socorro partiu da própria estação.'}</p>
        <p>{phase===4?(en?'NEXUS active. Exit sealed by containment.':'NEXUS ativo. Saída bloqueada pela contenção.'):(en?'Emergency release granted.':'Desbloqueio emergencial autorizado.')}</p>
        {phase===4 && <div className="npc-dialogue-actions"><button onClick={() => { setPhase(5); close(); }}>{en?'Authorize emergency release':'Autorizar desbloqueio emergencial'}</button></div>}
        </>}
      </section>}
    </div>
    <div className="lake-touch" aria-label={en ? 'Walking controls' : 'Controles de caminhada'}>{arrows.map(([key, symbol, pt, english]) =>
      <button key={key} disabled={frozen} aria-label={en ? english : pt}
        onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setTouchMovement(keys.current, key, true); }}
        onPointerCancel={() => setTouchMovement(keys.current, key, false)} onLostPointerCapture={() => setTouchMovement(keys.current, key, false)}
        onPointerUp={() => setTouchMovement(keys.current, key, false)}>{symbol}</button>)}
      <TouchInteract language={language} disabled={!available} onInteract={act}/>
    </div>
  </section>;
}
