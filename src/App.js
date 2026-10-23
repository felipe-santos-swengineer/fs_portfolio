import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Compass, Volume2, VolumeX, BookOpen, ArrowUpRight, X, Footprints } from 'lucide-react';
import { projetos, textos, titulosTextos } from './content';
import VillageAudio from './audio/VillageAudio';
import AudioSettings, { loadAudioSettings } from './components/AudioSettings';
import VillagerSpeech from './audio/VillagerSpeech';
import { VILLAGER_VOICES } from './audio/villagerClips';
import { VILLAGERS } from './components/villagers';
import welcome from './assets/audio/bem_vindo_bill_voice.mp3';
import history from './assets/audio/inicio_bill_voice.mp3';
import motivation from './assets/audio/motivacao_bill_voice.mp3';
import projectsAudio from './assets/audio/projetos_bill_voice.mp3';
import music from './assets/audio/dndAdventure_NCS.mp3';
import './App.css';
const VillageScene = lazy(() => import('./components/VillageScene'));


const places = [
  { name: 'Taverna do início', section: 'Minha história', icon: '⚑', texts: [0, 1, 2], audio: [welcome, history, motivation] },
  { name: 'Biblioteca do saber', section: 'Sobre mim', icon: '✧', texts: [3, 4, 5] },
  { name: 'Oficina das criações', section: 'Projetos', icon: '⚒', texts: [6], audio: [projectsAudio] },
  { name: 'Correio da vila', section: 'Contato', icon: '✉', texts: [7] },
];

function Content({ index, narrationEnabled }) {
  const place = places[index];
  return <>
    {place.texts.map((n, i) => <section className="story" key={n}>
      <h3>{titulosTextos[n]}</h3>
      {place.audio?.[i] && <label className="narration">OUÇA A HISTÓRIA ORIGINAL<audio aria-label={`Narração: ${titulosTextos[n]}`} controls muted={!narrationEnabled} preload="none" src={place.audio[i]} onPlay={e => { if (!narrationEnabled) { e.target.pause(); return; } document.querySelectorAll('audio[data-narration]').forEach(a => { if (a !== e.target) a.pause(); }); }} data-narration /><small>{narrationEnabled ? 'A gravação original acompanha os temas desta seção; o texto foi revisado para esta edição.' : 'Narrações silenciadas. Você pode ativá-las nas configurações de áudio.'}</small></label>}
      {textos[n]?.split(/\n\s*\n/).map((p, j) => <p key={j}>{p.trim()}</p>)}
    </section>)}
    {index === 2 && projetos.map(p => <article className="project" key={p.id}><h3>{p.titulo}</h3><p>{p.descricao}</p><div className="gallery">{p.imagens.map((src, i) => <img src={src} alt={`${p.titulo} — tela ${i + 1}`} key={src} loading="lazy" />)}</div><a href={p.github || p.link} target="_blank" rel="noreferrer">{p.github ? 'Explorar no GitHub' : 'Visitar projeto'} <ArrowUpRight size={16} /></a></article>)}
    {index === 3 && <div className="contact-links"><a href="mailto:felipesantosswengineer@email.com">Enviar email ↗</a><a href="tel:+5588998378028">Ligar ↗</a><a href="https://www.linkedin.com/in/felipe-santos-rodrigues/" target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://www.instagram.com/felipe_santos_swengineer/" target="_blank" rel="noreferrer">Instagram ↗</a></div>}
  </>;
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [visited, setVisited] = useState([]);
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const sound = audioSettings.master;
  const [audioPanelOpen, setAudioPanelOpen] = useState(false);
  const preferences = useRef(audioSettings);
  const audioRevision = useRef(0);
  const closeAudioPanel = useCallback(() => setAudioPanelOpen(false), []);
  const [conversation, setConversation] = useState(null);
  const [nearNpc, setNearNpc] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [audioNotice, setAudioNotice] = useState('');
  const [reading, setReading] = useState(false);
  const [near, setNear] = useState(-1);
  const [resetKey, setResetKey] = useState(0);
  const [zoom, setZoom] = useState(1);
  const keys = useRef(new Set());
  const bg = useRef(null);
  const effects = useRef(null);
  const speech = useRef(null);
  if (!speech.current) speech.current = new VillagerSpeech();
  const visits = useRef(VILLAGERS.map(() => 0));
  const npcPanel = useRef(null);
  if (!effects.current) effects.current = new VillageAudio();
  const soundRequested = useRef(false);
  const dialog = useRef(null);
  const previousFocus = useRef(null);
  const open = i => { speech.current.stop(); setConversation(null); previousFocus.current = document.activeElement; keys.current.clear(); if (preferences.current.master && preferences.current.interactions) effects.current.interact(i); setSelected(i); setVisited(v => [...new Set([...v, i])]); };
  const close = () => { if (preferences.current.master && preferences.current.interactions) effects.current.closeDoor(); setSelected(null); previousFocus.current?.focus(); };
  const speakNpc = useCallback((index, line) => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(a => { if (!a.paused) a.pause(); });
    bg.current.volume = .025; setSpeaking(true); setVoiceNotice('');
    const person = VILLAGERS[index];
    speech.current.speak(person.lines[line], VILLAGER_VOICES[person.name], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice('Não foi possível reproduzir a fala. Tente ouvir novamente ou acompanhe a mensagem em texto.');
    });
  }, []);
  const talk = useCallback(index => {
    keys.current.clear();
    const line = visits.current[index]++ % VILLAGERS[index].lines.length;
    setConversation({ index, line }); setVoiceNotice('');
    if (soundRequested.current) speakNpc(index, line);
  }, [speakNpc]);
  const endConversation = () => { speech.current.stop(); setSpeaking(false); setConversation(null); };

  useEffect(() => { if (conversation) npcPanel.current?.focus(); }, [conversation]);
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape' && conversation && !audioPanelOpen) { speech.current.stop(); setSpeaking(false); setConversation(null); }
      if (!audioPanelOpen && e.key.toLowerCase() === 'f' && !e.repeat && nearNpc >= 0 && selected === null && !reading) { e.preventDefault(); talk(nearNpc); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [conversation, nearNpc, selected, reading, talk, audioPanelOpen]);

  useEffect(() => {
    const engine = effects.current;
    const background = bg.current;
    const voice = speech.current;
    const duck = e => { if (e.target.hasAttribute?.('data-narration') && (!preferences.current.master || !preferences.current.narration)) { if (!e.target.paused) e.target.pause(); return; } if (e.type === 'play' && e.target.hasAttribute?.('data-narration')) voice.stop(); background.volume = voice.playing || [...document.querySelectorAll('audio[data-narration]')].some(a => !a.paused && !a.ended) ? .025 : .09; };
    const hide = () => { if (document.hidden) voice.stop(); };
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('play', duck, true); document.addEventListener('pause', duck, true); document.addEventListener('ended', duck, true);
    return () => { soundRequested.current = false; audioRevision.current++; voice.stop(); engine.dispose(); if (!background.paused) background.pause(); document.removeEventListener('visibilitychange', hide); document.removeEventListener('play', duck, true); document.removeEventListener('pause', duck, true); document.removeEventListener('ended', duck, true); };
  }, []);


  useEffect(() => { const enter = e => { if (!audioPanelOpen && e.key.toLowerCase() === 'e' && !e.repeat && near >= 0 && selected === null && !reading) open(near); }; window.addEventListener('keydown', enter); return () => window.removeEventListener('keydown', enter); }, [near, selected, reading, audioPanelOpen]);
  useEffect(() => {
    if (selected === null || audioPanelOpen) return;
    dialog.current?.querySelector('button')?.focus();
    const handler = e => {
      if (e.key === 'Escape') { if (preferences.current.master && preferences.current.interactions) effects.current.closeDoor(); setSelected(null); previousFocus.current?.focus(); }
      if (e.key === 'Tab') { const items = dialog.current.querySelectorAll('button,a,audio'); const first = items[0], last = items[items.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler);
  }, [selected, audioPanelOpen]);
  const updateAudio = async next => {
    const revision = ++audioRevision.current;
    preferences.current = next; soundRequested.current = next.master; setAudioSettings(next); setAudioNotice('');
    try { localStorage.setItem('village-audio', JSON.stringify(next)); } catch { /* Private mode can block storage. */ }
    effects.current.setChannels({ steps: next.steps, interactions: next.interactions });
    if (!next.master || !next.voices) speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(a => { a.muted = !next.master || !next.narration; if (a.muted && !a.paused) a.pause(); });
    if (!next.master) { effects.current.mute(); bg.current.pause(); return; }
    if (!next.music) bg.current.pause();
    bg.current.volume = speech.current.playing || [...document.querySelectorAll('audio[data-narration]')].some(a => !a.paused && !a.ended) ? .025 : .09;
    const musicAttempt = next.music ? bg.current.play().then(() => true).catch(() => false) : Promise.resolve(true);
    const effectAttempt = next.steps || next.interactions ? effects.current.enable() : Promise.resolve(true);
    if (!next.steps && !next.interactions) effects.current.mute();
    const [effectsReady, musicReady] = await Promise.all([effectAttempt, musicAttempt]);
    if (revision !== audioRevision.current) { if (!preferences.current.master || (!preferences.current.steps && !preferences.current.interactions)) effects.current.mute(); if (!preferences.current.master || !preferences.current.music) bg.current.pause(); return; }
    if (!effectsReady || !musicReady) setAudioNotice('Alguns sons não puderam ser iniciados. Suas escolhas foram mantidas; tente ativar o som geral novamente.');
  };


  return <div className="app">
    <header><a className="brand" href="#portfolio" aria-label="Felipe Santos, início"><span className="brand-mark">F<span>.</span></span><span>FELIPE SANTOS<small>ENGENHEIRO DE SOFTWARE</small></span></a><div className="header-actions"><span className="edition">PORTFÓLIO 3D · VOL. 02</span><button onClick={() => { endConversation(); setReading(!reading); }}><BookOpen size={16} /><span>{reading ? 'Voltar à vila' : 'Modo leitura'}</span></button><button onClick={() => { keys.current.clear(); setAudioPanelOpen(true); }} aria-label="Configurações de áudio" aria-haspopup="dialog">{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>Áudio</span></button></div></header>
    <main id="portfolio">
      <div className="intro"><span className="eyebrow"><span /> FELIPE SANTOS · ENGENHARIA DE SOFTWARE</span><h1>Ideias ganham vida.<br />Histórias, <em>caminhos.</em></h1><p>Uma vila para conhecer quem sou e o que construo.<br /> Explore os projetos, descubra minha trajetória<br /> e encontre um ponto de partida para nossa conversa.</p><div className="intro-note"><Compass size={18} /><span>Arraste para olhar ao redor. Escolha uma porta para começar.</span></div></div>
      {reading ? <div className="reading-list">{places.map((p, i) => <section key={p.name}><span className="eyebrow">0{i + 1} · {p.name}</span><h2>{p.section}</h2><Content index={i} narrationEnabled={sound && audioSettings.narration} /></section>)}</div> : <>
        <div className="viewport" aria-label="Vilarejo tridimensional do portfólio">
          <Suspense fallback={<div className="scene-loading">Acendendo as lanternas da vila…</div>}><VillageScene keys={keys} paused={selected !== null || audioPanelOpen} onOpen={open} onNear={setNear} onStep={surface => { if (preferences.current.master && preferences.current.steps) effects.current.step(surface); }} onTalk={talk} onNearNpc={setNearNpc} talkingNpc={conversation?.index} zoom={zoom} resetKey={resetKey} /></Suspense>
          {conversation && <section className="npc-dialogue" aria-label={`Conversa com ${VILLAGERS[conversation.index].name}`} tabIndex={-1} ref={npcPanel}>
            <div className="npc-dialogue-heading"><span className="npc-avatar" style={{ background: VILLAGERS[conversation.index].color }}>{VILLAGERS[conversation.index].name[0]}</span><div><h2>{VILLAGERS[conversation.index].name}</h2><small>{VILLAGERS[conversation.index].role}</small></div><button onClick={endConversation} aria-label="Encerrar conversa"><X size={18} /></button></div>
            <p aria-live="polite">{VILLAGERS[conversation.index].lines[conversation.line]}</p>
            <div className="npc-dialogue-actions"><button disabled={!sound || !audioSettings.voices} onClick={() => { if (speaking) speech.current.stop(); else speakNpc(conversation.index, conversation.line); }}>{speaking ? 'Parar voz' : 'Ouvir mensagem'}</button><button onClick={() => talk(conversation.index)}>Outra mensagem ↗</button></div>
            <small className="npc-voice-note">{voiceNotice || (!sound || !audioSettings.voices ? 'Ative as vozes dos NPCs nas configurações de áudio.' : `Voz ${VILLAGER_VOICES[VILLAGERS[conversation.index].name].gender === 'female' ? 'feminina' : 'masculina'} · ${VILLAGER_VOICES[VILLAGERS[conversation.index].name].tone.toLowerCase()}`)}</small>
          </section>}
          <div className="scene-caption"><span className="live-dot" /> VILA DOS CRIADORES <small>NOITE TRANQUILA · CEARÁ</small></div>
          <div className="compass"><span>N</span><Compass size={34} strokeWidth={1} /></div>
          <div className="camera-tools"><button onClick={() => setResetKey(v => v + 1)}>Focar personagem</button><div className="zoom"><button onClick={() => setZoom(z => Math.min(2, z + .2))} aria-label="Aproximar">+</button><button onClick={() => setZoom(z => Math.max(.5, z - .2))} aria-label="Afastar">−</button></div></div>
        </div>
        <div className="quest"><span className="quest-icon"><Footprints size={20} /></span><div><small>SUA MISSÃO</small><p>Conhecer as histórias desta vila</p><div className="progress">{places.map((p, i) => <i key={p.name} className={visited.includes(i) ? 'done' : ''} />)}</div></div><strong>{visited.length}<span> / 4</span></strong></div>
        <nav className="destinations" aria-label="Destinos da vila">{places.map((p, i) => <button key={p.name} aria-label={`Entrar: ${p.section}`} onClick={() => open(i)}><span className="destination-icon">{p.icon}</span><span><small>0{i + 1} / {visited.includes(i) ? 'EXPLORADO' : p.name.split(' ')[0].toUpperCase()}</small><strong>{p.section}</strong></span><ArrowUpRight size={17} /></button>)}</nav>
        <div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ou setas para passear</span><span><kbd>E</kbd> para entrar · arraste para girar a câmera</span>{near >= 0 && <button onClick={() => open(near)}>Entrar: {places[near].name} ↗</button>}</div>
        <nav className="villagers-nav" aria-label="Moradores da vila"><span>UM OLÁ PELO CAMINHO</span>{VILLAGERS.map((p, i) => <button key={p.name} onClick={() => talk(i)} aria-label={`Conversar com ${p.name}`}><i style={{ background: p.color }} />{p.name}</button>)}{nearNpc >= 0 && <button className="npc-near" onClick={() => talk(nearNpc)}><kbd>F</kbd> Conversar com {VILLAGERS[nearNpc].name}</button>}</nav>
        <div className="touch-controls" aria-label="Controles de caminhada">{[['↑','w'],['←','a'],['↓','s'],['→','d']].map(([label, key]) => <button key={key} aria-label={`Caminhar ${label}`} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); keys.current.add(key); }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)}>{label}</button>)}</div>
      </>}
    </main>
    <footer><span>FEITO DE CÓDIGO, CAFÉ E UM POUCO DE MAGIA.</span><span>CEARÁ, BRASIL · EXPLORE NO SEU RITMO</span></footer>
    {selected !== null && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) close(); }}><article className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} ref={dialog}><button className="close" onClick={close} aria-label="Fechar seção"><X /></button><span className="eyebrow">0{selected + 1} · {places[selected].name}</span><button className="section-audio-button" onClick={() => setAudioPanelOpen(true)}>Configurar áudio</button><h2 id="dialog-title">{places[selected].section}</h2><Content index={selected} narrationEnabled={sound && audioSettings.narration} /></article></div>}
    {audioPanelOpen && <AudioSettings settings={audioSettings} onChange={updateAudio} onClose={closeAudioPanel} notice={audioNotice} />}
    <audio ref={bg} src={music} loop preload="none" />
  </div>;
}
