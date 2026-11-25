import { setTouchMovement } from './components/touchMovement';
import TouchInteract from './components/TouchInteract';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Compass, Volume2, VolumeX, BookOpen, ArrowUpRight, X, Footprints, Eye, EyeOff, RotateCcw, RotateCw, Accessibility, Github } from 'lucide-react';
import { projetos, textos, titulosTextos } from './content';
import VillageAudio from './audio/VillageAudio';
import AudioSettings, { loadAudioSettings } from './components/AudioSettings';
import AccessibilitySettings, { loadAccessibilitySettings, useSystemReducedMotion } from './components/AccessibilitySettings';
import useModalFocus from './components/useModalFocus';
import { MarketStall } from './components/MarketStalls';
import PortalArtwork from './components/PortalArtwork';
import CampaignNavigation from './components/CampaignNavigation';
import guardianChamberArtwork from './assets/guardian-chamber-portal.webp';
import VillagerSpeech from './audio/VillagerSpeech';
import { VILLAGER_VOICES } from './audio/villagerClips';
import { LAKE_GUIDE_VOICES } from './audio/lakeGuideVoices';
import lakeGuide from './components/lakeGuide.json';
import { TEMPLE_VOICES } from './audio/templeVoices';
import { CAVE_VOICES } from './audio/caveVoices';
import { DRAGON_VOICES } from './audio/dragonVoices';
import { PRINCESS_VOICES } from './audio/princessVoices';
import { KING_VOICES } from './audio/kingVoices';
import { CURSED_CASTLE_VOICES } from './audio/cursedCastleVoices';
import cursedCastleDialogue from './components/cursedCastleDialogue.json';
import princessDialogue from './components/princessDialogue.json';
import dragonDialogue from './components/dragonDialogue.json';
import caveDialogue from './components/caveDialogue.json';
import templeDialogue from './components/templeDialogue.json';
import { RUINS_PIRATE_VOICES } from './audio/ruinsPirateVoices';
import ruinsPirate from './components/ruinsPirate.json';
import { FELIPE_LINES, FELIPE_VOICE } from './audio/felipeVoice';
import { VILLAGERS } from './components/villagers';
import english from './content.en.json';
import { ENGLISH_VOICES, ENGLISH_FELIPE_VOICE, ENGLISH_NARRATION } from './audio/englishVoices';
import welcome from './assets/audio/bem_vindo_bill_voice.mp3';
import history from './assets/audio/inicio_bill_voice.mp3';
import motivation from './assets/audio/motivacao_bill_voice.mp3';
import projectsAudio from './assets/audio/projetos_bill_voice.mp3';
import villageMusic from './assets/audio/village-bards-tale.mp3';
import templeVillageMusic from './assets/audio/village-square.ogg';
import caveMusic from './assets/audio/cave-action.mp3';
import bossMusic from './assets/audio/dragon-boss.ogg';
import victoryMusic from './assets/audio/dragon-victory.mp3';
import cursedCastleMusic from './assets/audio/cursed-castle.ogg';
import corridorMusic from './assets/audio/infinite-corridor.ogg';
import witchBattleMusic from './assets/audio/witch-battle.ogg';
import wizardChessMusic from './assets/audio/whispers-in-the-fog.ogg';
import { musicScene } from './audio/musicScene';
import castleMusic from './assets/audio/castle-kings-feast.mp3';
import dungeonMusic from './assets/audio/dungeon.wav';
import lakeMusic from './assets/audio/lake-ambient.wav';
import templeMusic from './assets/audio/temple-mystery.wav';
import rapidsMusic from './assets/audio/rapids-theme.wav';
import './App.css';
const VillageScene = lazy(() => import('./components/VillageScene'));
const Dungeon = lazy(() => import('./components/Dungeon'));
const Lake = lazy(() => import('./components/Lake'));
const Rapids = lazy(() => import('./components/Rapids'));
const Ruins = lazy(() => import('./components/Ruins'));
const TempleVillage = lazy(() => import('./components/TempleVillage'));
const DragonCave = lazy(() => import('./components/DragonCave'));
const DragonChamber = lazy(() => import('./components/DragonChamber'));
const CastleThrone = lazy(() => import('./components/CastleThrone'));
const ThroneHall = lazy(() => import('./components/ThroneHall'));
const CursedCastle = lazy(() => import('./components/CursedCastle'));
const CursedCastleCourtyard = lazy(() => import('./components/CursedCastleCourtyard'));
const InfiniteCorridor = lazy(() => import('./components/InfiniteCorridor'));


const places = [
  { name: 'Taverna do início', section: 'Minha história', icon: '⚑', texts: [0, 1, 2], audio: [welcome, history, motivation] },
  { name: 'Biblioteca do saber', section: 'Sobre mim', icon: '✧', texts: [3, 4, 5] },
  { name: 'Oficina das criações', section: 'Projetos', icon: '⚒', texts: [6], audio: [projectsAudio] },
  { name: 'Correio da vila', section: 'Contato', icon: '✉', texts: [7] },
  { name: 'Portal do oeste', section: 'Playground', icon: '\u2726', texts: [] },
  { name: 'Castelo da vila', section: 'Sal\u00e3o do trono', icon: '\u265c', texts: [] },
  { name: 'Vitrine do mercado', section: 'Tecnologias', icon: '\u2692', texts: [] },
  { name: 'Barraca da experiência', section: 'Experiência profissional', icon: '\u25c6', texts: [] },
  { name: 'Barraca da formação', section: 'Formação e cursos', icon: '\u2727', texts: [] },
];

function LanguageFlags({ language, onChange }) {
  return <div className="language-flags" role="group" aria-label={language === 'en-US' ? 'Language' : 'Idioma'}>
    <button type="button" aria-label="Português (Brasil)" title="Português (Brasil)" aria-pressed={language === 'pt-BR'} onClick={() => onChange('pt-BR')}>
      <svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" fill="#009b3a"/><path d="M14 2 26 10 14 18 2 10Z" fill="#ffdf00"/><circle cx="14" cy="10" r="4.8" fill="#002776"/><path d="M9.4 9c3.2-.6 6.5.2 9 2" fill="none" stroke="#fff" strokeWidth="1.2"/></svg>
    </button>
    <button type="button" aria-label="English (United States)" title="English (United States)" aria-pressed={language === 'en-US'} onClick={() => onChange('en-US')}>
      <svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" fill="#fff"/>{[0,3,6,9,12,15,18].map(y => <rect key={y} y={y} width="28" height="1.5" fill="#b22234"/>)}<rect width="12" height="10.5" fill="#3c3b6e"/>{[2,5,8].map(x => [2,5,8].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r=".6" fill="#fff"/>))}</svg>
    </button>
  </div>;
}

const EN_PLACES = [
  ['The opening tavern', 'My story'], ['Library of knowledge', 'About me'],
  ['Workshop of creations', 'Projects'], ['Village post office', 'Contact'],
  ['Western portal', 'Playground'], ['Village castle', 'Throne room'],
  ['Market showcase', 'Technologies'], ['Experience stall', 'Work experience'], ['Education stall', 'Education and courses'],
].map(([name, section], i) => ({ ...places[i], name, section, audio: i === 0 ? ENGLISH_NARRATION.slice(0, 3) : i === 2 ? [ENGLISH_NARRATION[3]] : undefined }));

function Content({ index, narrationEnabled, language = 'pt-BR' }) {
  const en = language === 'en-US';
  const activePlaces = en ? EN_PLACES : places;
  const activeTexts = en ? english.textos : textos;
  const activeTitles = en ? english.titulosTextos : titulosTextos;
  const activeProjects = en ? projetos.map((p, i) => ({ ...p, ...english.projetos[i] })) : projetos;
  const place = activePlaces[index];
  if (index === 7) return <MarketStall key={language} language={language} type="experience" />;
  if (index === 8) return <MarketStall key={language} language={language} type="education" />;
  if (index === 6) return <MarketStall key={language} language={language} type="technologies" />;
  if (index === 5) return <p>{en ? 'Explore the castle throne room in 3D.' : 'O castelo abriga um salão do trono que pode ser explorado em 3D.'}</p>;
  if (index === 4) return <p>{en ? 'The portal leads to the lake, the ruins and the dragon island.' : 'O portal leva ao lago, às ruínas e à ilha do dragão.'}</p>;
  return <>
    {place.texts.map((n, i) => <section className="story" key={n}>
      <h3>{activeTitles[n]}</h3>
      {place.audio?.[i] && <label className="narration">{en ? 'LISTEN TO THE STORY' : 'OUÇA A HISTÓRIA ORIGINAL'}<audio aria-label={`${en ? 'Narration' : 'Narração'}: ${activeTitles[n]}`} controls muted={!narrationEnabled} preload="none" src={place.audio[i]} onPlay={e => { if (!narrationEnabled) { e.target.pause(); return; } document.querySelectorAll('audio[data-narration]').forEach(a => { if (a !== e.target) a.pause(); }); }} data-narration /><small>{narrationEnabled ? (en ? 'Listen to this section.' : 'A gravação original acompanha os temas desta seção; o texto foi revisado para esta edição.') : (en ? 'Narration is muted. Enable it in audio settings.' : 'Narrações silenciadas. Você pode ativá-las nas configurações de áudio.')}</small></label>}
      {activeTexts[n]?.split(/\n\s*\n/).map((p, j) => <p key={j}>{p.trim()}</p>)}
    </section>)}
    {index === 2 && activeProjects.map(p => <article className="project" key={p.id}><h3>{p.titulo}</h3><p>{p.descricao}</p><dl className="project-details"><div><dt>{en ? 'Context and role' : 'Contexto e atuação'}</dt><dd>{p.contexto}</dd></div><div><dt>{en ? 'Challenge' : 'Desafio'}</dt><dd>{p.desafio}</dd></div>{p.tecnologias && <div><dt>{en ? 'Technologies' : 'Tecnologias'}</dt><dd>{p.tecnologias}</dd></div>}</dl><div className="gallery" role="region" aria-label={`${en ? 'Images for project' : 'Imagens do projeto'} ${p.titulo}`} tabIndex={0}>{p.imagens.map((src, i) => <img src={src} alt={`${p.titulo} — ${en ? 'screen' : 'tela'} ${i + 1}`} key={src} loading="lazy" />)}</div><a href={p.github || p.link} aria-label={en ? `${p.github ? 'View code' : 'Visit website'} for ${p.titulo} (opens in a new tab)` : `${p.github ? 'Ver código' : 'Visitar site'} do projeto ${p.titulo} (abre em nova aba)`} target="_blank" rel="noreferrer">{p.github ? (en ? 'Explore on GitHub' : 'Explorar no GitHub') : (en ? 'Visit project' : 'Visitar projeto')} <ArrowUpRight size={16} /></a></article>)}
    {index === 3 && <div className="contact-links"><a href="mailto:felipesantosswengineer@email.com">{en ? 'Send email' : 'Enviar email'} ↗</a><a href="tel:+5588998378028">{en ? 'Call' : 'Ligar'} ↗</a><a href="https://www.linkedin.com/in/felipe-santos-rodrigues/" aria-label={en ? 'LinkedIn (opens in a new tab)' : 'LinkedIn (abre em nova aba)'} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href="https://www.instagram.com/felipe_santos_swengineer/" aria-label={en ? 'Instagram (opens in a new tab)' : 'Instagram (abre em nova aba)'} target="_blank" rel="noreferrer">Instagram ↗</a></div>}
  </>;
}

const dragonCampaign = ['lake', 'rapids', 'ruins', 'temple', 'cave', 'chamber'];
const castleCampaign = [
  'cursed-castle', 'cursed-castle-corridor', 'cursed-castle-courtyard',
  'cursed-castle-throne-entrance', 'cursed-castle-royal-arena',
];

export default function App() {
  const [language, setLanguage] = useState(() => { try { return localStorage.getItem('village-language') === 'en-US' ? 'en-US' : 'pt-BR'; } catch { return 'pt-BR'; } });
  const en = language === 'en-US';
  const commitId = process.env.REACT_APP_BUILD_VERSION;
  const displayedVersion = commitId && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(commitId) ? commitId.slice(0,12) : (en ? 'unavailable' : 'indisponível');
  const activePlaces = en ? EN_PLACES : places;
  const activeVillagers = en ? VILLAGERS.map((p, i) => ({ ...p, ...english.VILLAGERS[i] })) : VILLAGERS;
  const [selected, setSelected] = useState(null);
  const initialMap = useRef(null);
  if (initialMap.current === null) {
    try { const savedMap = sessionStorage.getItem('portfolio-map'); initialMap.current = savedMap === 'cursed-castle-interior' ? 'cursed-castle-courtyard' : ['cursed-castle-vestibule', 'cursed-castle-throne'].includes(savedMap) ? 'cursed-castle-throne-entrance' : savedMap || 'village'; }
    catch { initialMap.current = 'village'; }
  }
  const [inDungeon, setInDungeon] = useState(() => initialMap.current === 'dungeon');
  const [inCursedCastle, setInCursedCastle] = useState(() => initialMap.current === 'cursed-castle' || initialMap.current === 'cursed-castle-corridor' || initialMap.current === 'cursed-castle-courtyard' || initialMap.current === 'cursed-castle-throne-entrance' || initialMap.current === 'cursed-castle-royal-arena');
  const [inCorridor, setInCorridor] = useState(() => initialMap.current === 'cursed-castle-corridor');
  const [inCastleCourtyard, setInCastleCourtyard] = useState(() => initialMap.current === 'cursed-castle-courtyard');
  const [inRoyalArena, setInRoyalArena] = useState(() => initialMap.current === 'cursed-castle-royal-arena');
  const [kingBattle, setKingBattle] = useState(false);
  const [inThroneEntrance, setInThroneEntrance] = useState(() => initialMap.current === 'cursed-castle-throne-entrance');
  const [wizardChessOpen, setWizardChessOpen] = useState(false);
  const [throneUnlocked, setThroneUnlocked] = useState(false);
  useEffect(() => {
    if (!inThroneEntrance) setThroneUnlocked(false);
  }, [inThroneEntrance]);
  const [returnFromCastleCourtyard, setReturnFromCastleCourtyard] = useState(false);
  const [inLake, setInLake] = useState(() => initialMap.current === 'lake' || initialMap.current === 'rapids');
  const [inRapids, setInRapids] = useState(() => initialMap.current === 'rapids');
  const [inRuins, setInRuins] = useState(() => initialMap.current === 'ruins' || initialMap.current === 'tunnel' || initialMap.current === 'temple' || initialMap.current === 'cave' || initialMap.current === 'chamber');
  const [inTunnel, setInTunnel] = useState(() => initialMap.current === 'tunnel' || initialMap.current === 'temple' || initialMap.current === 'cave' || initialMap.current === 'chamber');
  const [templeReached, setTempleReached] = useState(() => initialMap.current === 'tunnel' || initialMap.current === 'temple' || initialMap.current === 'cave' || initialMap.current === 'chamber');
  const [inCave, setInCave] = useState(() => initialMap.current === 'cave' || initialMap.current === 'chamber');
  const [inChamber, setInChamber] = useState(() => initialMap.current === 'chamber');
  const [dragonBattle, setDragonBattle] = useState(false);
  const [witchEncounter, setWitchEncounter] = useState(false);
  const [dragonVictory, setDragonVictory] = useState(false);
  const [returnFromChamber, setReturnFromChamber] = useState(false);
  const [returnFromCave, setReturnFromCave] = useState(() => initialMap.current === 'cave' || initialMap.current === 'chamber');
  const [inThrone, setInThrone] = useState(() => initialMap.current === 'throne');
  useEffect(() => {
    try { sessionStorage.setItem('portfolio-map', inRoyalArena ? 'cursed-castle-royal-arena' : inCorridor ? 'cursed-castle-corridor' : inThroneEntrance ? 'cursed-castle-throne-entrance' : inCastleCourtyard ? 'cursed-castle-courtyard' : inCursedCastle ? 'cursed-castle' : inDungeon ? 'dungeon' : inChamber ? 'chamber' : inCave ? 'cave' : inTunnel ? 'temple' : inRuins ? 'ruins' : inRapids ? 'rapids' : inLake ? 'lake' : inThrone ? 'throne' : 'village'); }
    catch { /* The map still works when browser storage is unavailable. */ }
  }, [inDungeon, inLake, inThrone, inRapids, inRuins, inTunnel, inCave, inChamber, inCursedCastle, inCorridor, inCastleCourtyard, inThroneEntrance, inRoyalArena]);
  const [visited, setVisited] = useState([]);
  const [missionRound, setMissionRound] = useState(0);
  const celebrationDone = useRef(false);
  const missionComplete = visited.length === 4;
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings);
  const sound = audioSettings.master;
  const [audioPanelOpen, setAudioPanelOpen] = useState(false);
  const preferences = useRef(audioSettings);
  const audioRevision = useRef(0);
  const audioInitiated = useRef(false);
  const closeAudioPanel = useCallback(() => setAudioPanelOpen(false), []);
  const [conversation, setConversation] = useState(null);
  const [nearNpc, setNearNpc] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [audioNotice, setAudioNotice] = useState('');
  const [accessibility, setAccessibility] = useState(loadAccessibilitySettings);
  const reading = accessibility.readingMode;
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const closeAccessibility = useCallback(() => setAccessibilityOpen(false), []);
  const systemReducedMotion = useSystemReducedMotion();
  const reduceMotion = accessibility.motion === 'reduce' || systemReducedMotion;
  const [campaignMenuOpen, setCampaignMenuOpen] = useState(false);
  const campaignPanel = useRef(null);
  useModalFocus(campaignPanel, () => setCampaignMenuOpen(false), campaignMenuOpen);
  const anyPanelOpen = audioPanelOpen || accessibilityOpen || campaignMenuOpen;
  const [showIntro, setShowIntro] = useState(true);
  const [readingMenuOpen, setReadingMenuOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 800);
  const [near, setNear] = useState(-1);
  const [resetKey, setResetKey] = useState(0);
  const [villageArrival, setVillageArrival] = useState(null);
  const [weatherMode, setWeatherMode] = useState('auto');
  const weatherModes = ['auto', 'clear', 'rain', 'snow'];
  const weatherLabels = en ? ['Automatic', 'Clear', 'Rain', 'Snow'] : ['Automático', 'Limpo', 'Chuva', 'Neve'];
  const [zoom, setZoom] = useState(1);
  const [cameraTurn, setCameraTurn] = useState(0);
  const compassDial = useRef(null);
  const keys = useRef(new Set());
  const bg = useRef(null);
  const effects = useRef(null);
  const speech = useRef(null);
  const dragonDialogueActive = useRef(false);
  const setDragonDialogueActive = useCallback(active => {
    dragonDialogueActive.current = active;
    if (bg.current) bg.current.volume = active || speech.current?.playing || [...document.querySelectorAll('audio[data-narration]')].some(a => !a.paused && !a.ended) ? .025 : .09;
  }, []);
  if (!speech.current) speech.current = new VillagerSpeech();
  const visits = useRef(VILLAGERS.map(() => 0));
  const npcPanel = useRef(null);
  if (!effects.current) effects.current = new VillageAudio();
  const soundRequested = useRef(audioSettings.master);
  const dialog = useRef(null);
  const previousFocus = useRef(null);
  const open = i => { if (i === 5) { keys.current.clear(); setConversation(null); setNear(-1); setInThrone(true); return; } speech.current.stop(); setConversation(null); previousFocus.current = document.activeElement; keys.current.clear(); if (preferences.current.master && preferences.current.interactions) effects.current.interact(i); setSelected(i); if (i < 4) setVisited(v => [...new Set([...v, i])]); };
  const close = () => { if (preferences.current.master && preferences.current.interactions) effects.current.closeDoor(); setSelected(null); previousFocus.current?.focus(); };
  const speakNpc = useCallback((index, line) => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(a => { if (!a.paused) a.pause(); });
    bg.current.volume = .025; setSpeaking(true); setVoiceNotice('');
    const person = en ? { ...VILLAGERS[index], ...english.VILLAGERS[index] } : VILLAGERS[index];
    speech.current.speak(person.lines[line], en ? ENGLISH_VOICES[person.name] : VILLAGER_VOICES[person.name], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Try again or read the message.' : 'Não foi possível reproduzir a fala. Tente ouvir novamente ou acompanhe a mensagem em texto.');
    });
  }, [en]);
  const speakFelipe = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    speech.current.speak(en ? english.felipe[line] : FELIPE_LINES[line], en ? ENGLISH_FELIPE_VOICE : FELIPE_VOICE, success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the message.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe a mensagem em texto.');
    });
  }, [en]);
  const speakLakeGuide = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    speech.current.speak(lakeGuide[locale][line], LAKE_GUIDE_VOICES[locale], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the message.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe a mensagem em texto.');
    });
  }, [en]);
  const speakRuinsPirate = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    speech.current.speak(ruinsPirate[locale][line], RUINS_PIRATE_VOICES[locale], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the message.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe a mensagem em texto.');
    });
  }, [en]);
  const speakTempleResident = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    speech.current.speak(templeDialogue[locale][line], TEMPLE_VOICES[locale], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the message.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe a mensagem em texto.');
    });
  }, [en]);
  const speakCaveTraveler = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    speech.current.speak(caveDialogue[locale][line], CAVE_VOICES[locale], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the message.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe a mensagem em texto.');
    });
  }, [en]);
  const speakElder = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    speech.current.speak(dragonDialogue[locale][line], DRAGON_VOICES[locale], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = dragonDialogueActive.current ? .025 : .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the dialogue.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe o di\u00e1logo em texto.');
    });
  }, [en]);
  const speakWitch = useCallback((text, profile) => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    speech.current.speak(text, profile, () => {
      if (bg.current) bg.current.volume = .09;
    });
  }, []);
  const stopWitchVoice = useCallback(() => speech.current.stop(), []);
  const speakPrincess = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    speech.current.speak(princessDialogue[locale][line], PRINCESS_VOICES[locale], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the dialogue.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe o di\u00e1logo em texto.');
    });
  }, [en]);
  const speakKing = useCallback((line, onDone) => {
    if (!soundRequested.current || !preferences.current.voices) {
      onDone?.(false);
      return;
    }
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    const profile = KING_VOICES[locale];
    const clip = profile.clips[line];
    if (!clip) {
      setSpeaking(false);
      if (bg.current) bg.current.volume = .09;
      setVoiceNotice(en ? 'Could not play the voice. Please read the dialogue.' : 'Não foi possível reproduzir a fala. Acompanhe o diálogo em texto.');
      onDone?.(false);
      return;
    }
    speech.current.speak(clip.text, profile, success => {
      setSpeaking(false);
      if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the dialogue.' : 'Não foi possível reproduzir a fala. Acompanhe o diálogo em texto.');
      onDone?.(success);
    });
  }, [en]);
  const stopKingVoice = useCallback(() => speech.current.stop(), []);
  const speakCastleArchivist = useCallback(line => {
    if (!soundRequested.current || !preferences.current.voices) return;
    speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(audio => { if (!audio.paused) audio.pause(); });
    if (bg.current) bg.current.volume = .025;
    setSpeaking(true); setVoiceNotice('');
    const locale = en ? 'en-US' : 'pt-BR';
    speech.current.speak(cursedCastleDialogue[locale][line], CURSED_CASTLE_VOICES[locale], success => {
      setSpeaking(false); if (bg.current) bg.current.volume = .09;
      if (!success) setVoiceNotice(en ? 'Could not play the voice. Please read the dialogue.' : 'N\u00e3o foi poss\u00edvel reproduzir a fala. Acompanhe o di\u00e1logo em texto.');
    });
  }, [en]);
  const talk = useCallback(index => {
    keys.current.clear();
    const line = visits.current[index]++ % VILLAGERS[index].lines.length;
    setConversation({ index, line }); setVoiceNotice('');
    if (soundRequested.current) speakNpc(index, line);
  }, [speakNpc]);
  const endConversation = () => { speech.current.stop(); setSpeaking(false); setConversation(null); };
  const restartMission = () => {
    setVisited([]); effects.current.stopFireworks();
    celebrationDone.current = false;
    setMissionRound(round => round + 1);
  };

  useEffect(() => { if (conversation) npcPanel.current?.focus(); }, [conversation]);
  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape' && conversation && !anyPanelOpen) { speech.current.stop(); setSpeaking(false); setConversation(null); }
      if (!anyPanelOpen && !inDungeon && !inThrone && !inLake && !inRuins && !inCursedCastle && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName === 'CANVAS' && e.key.toLowerCase() === 'f' && !e.repeat && nearNpc >= 0 && selected === null && !reading) { e.preventDefault(); talk(nearNpc); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [conversation, nearNpc, selected, reading, talk, anyPanelOpen, inDungeon, inThrone, inLake, inRuins, inCursedCastle]);

  useEffect(() => {
    const engine = effects.current;
    const background = bg.current;
    const voice = speech.current;
    const revision = audioRevision;
    const duck = e => { if (e.target.hasAttribute?.('data-narration') && (!preferences.current.master || !preferences.current.narration)) { if (!e.target.paused) e.target.pause(); return; } if (e.type === 'play' && e.target.hasAttribute?.('data-narration')) voice.stop(); background.volume = dragonDialogueActive.current || voice.playing || [...document.querySelectorAll('audio[data-narration]')].some(a => !a.paused && !a.ended) ? .025 : .09; };
    const hide = () => { if (document.hidden) { voice.stop(); engine.stopWeather?.(); } };
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('play', duck, true); document.addEventListener('pause', duck, true); document.addEventListener('ended', duck, true);
    return () => { soundRequested.current = false; revision.current++; voice.stop(); engine.dispose(); if (!background.paused) background.pause(); document.removeEventListener('visibilitychange', hide); document.removeEventListener('play', duck, true); document.removeEventListener('pause', duck, true); document.removeEventListener('ended', duck, true); };
  }, []);


  useEffect(() => { const enter = e => { if (!anyPanelOpen && !e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName === 'CANVAS' && e.key.toLowerCase() === 'e' && !e.repeat && near >= 0 && selected === null && !reading) open(near); }; window.addEventListener('keydown', enter); return () => window.removeEventListener('keydown', enter); }, [near, selected, reading, anyPanelOpen]);
  useModalFocus(dialog, close, selected !== null && !anyPanelOpen);
  const updateAudio = async next => {
    audioInitiated.current = true;
    const revision = ++audioRevision.current;
    preferences.current = next; soundRequested.current = next.master; setAudioSettings(next); setAudioNotice('');
    try { localStorage.setItem('village-audio', JSON.stringify(next)); } catch { /* Private mode can block storage. */ }
    effects.current.setChannels({ interactions: next.interactions });
    if (!next.master || !next.voices) speech.current.stop();
    document.querySelectorAll('audio[data-narration]').forEach(a => { a.muted = !next.master || !next.narration; if (a.muted && !a.paused) a.pause(); });
    if (!next.master) { effects.current.mute(); bg.current.pause(); return; }
    if (!next.music) bg.current.pause();
    bg.current.volume = dragonDialogueActive.current || speech.current.playing || [...document.querySelectorAll('audio[data-narration]')].some(a => !a.paused && !a.ended) ? .025 : .09;
    const musicAttempt = next.music ? bg.current.play().then(() => true).catch(() => false) : Promise.resolve(true);
    const effectAttempt = next.interactions ? effects.current.enable() : Promise.resolve(true);
    if (!next.interactions) effects.current.mute();
    const [effectsReady, musicReady] = await Promise.all([effectAttempt, musicAttempt]);
    if (revision !== audioRevision.current) { if (!preferences.current.master || (!preferences.current.interactions)) effects.current.mute(); if (!preferences.current.master || !preferences.current.music) bg.current.pause(); return; }
    if (!effectsReady || !musicReady) setAudioNotice(en ? 'Some sounds could not be started. Your settings were kept; try enabling master audio again.' : 'Alguns sons não puderam ser iniciados. Suas escolhas foram mantidas; tente ativar o som geral novamente.');
  };

  useEffect(() => {
    const activate = event => {
      if (!event.isTrusted) return;
      window.removeEventListener('pointerdown', activate, true);
      window.removeEventListener('keydown', activate, true);
      if (preferences.current.master) updateAudio(preferences.current);
    };
    window.addEventListener('pointerdown', activate, true);
    window.addEventListener('keydown', activate, true);
    return () => { window.removeEventListener('pointerdown', activate, true); window.removeEventListener('keydown', activate, true); };
    // Audio is initialized only after the first browser interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const musicTracks = { village: villageMusic, templeVillage: templeVillageMusic, dungeon: dungeonMusic, castle: castleMusic, rapids: rapidsMusic, temple: templeMusic, lake: lakeMusic, cave: caveMusic, boss: bossMusic, kingBattle: bossMusic, victory: victoryMusic, cursedCastle: cursedCastleMusic, corridor: corridorMusic, witchBattle: witchBattleMusic, wizardChess: wizardChessMusic };
  const musicTrack = musicTracks[musicScene({ reading, wizardChessOpen: inThroneEntrance && wizardChessOpen, inCorridor, inCursedCastle, inRoyalArena, kingBattle, inCastleCourtyard, witchEncounter, inDungeon, inThrone, inRapids, inChamber, dragonBattle, dragonVictory, inCave, inTunnel, templeReached, inLake, inRuins })];

  useEffect(() => {
    const audio = bg.current;
    if (audio && audioInitiated.current && preferences.current.master && preferences.current.music) audio.play().catch(() => setAudioNotice(en ? 'Could not start the music. Try enabling it in audio settings.' : 'Não foi possível iniciar a música. Tente ativá-la nas configurações de áudio.'));
  }, [musicTrack, en]);

  useEffect(() => { if (inDungeon || inThrone || inLake || inRuins || inCursedCastle || reading) effects.current.stopWeather?.(); }, [inDungeon, inThrone, inLake, inRuins, inCursedCastle, reading]);

  const updateAccessibility = next => {
    keys.current.clear();
    if (next.readingMode !== accessibility.readingMode) endConversation();
    setAccessibility(next);
    try { localStorage.setItem('village-accessibility', JSON.stringify(next)); } catch { /* Storage may be unavailable. */ }
  };
  const changeLanguage = value => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); setAudioNotice(''); setLanguage(value); try { localStorage.setItem('village-language', value); } catch {} };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setReading = value => updateAccessibility({ ...accessibility, readingMode: value });
  const openAccessibility = () => { keys.current.clear(); setAudioPanelOpen(false); setAccessibilityOpen(true); };
  const campaignMap = inCursedCastle
    ? castleCampaign[inRoyalArena ? 4 : inThroneEntrance ? 3 : inCastleCourtyard ? 2 : inCorridor ? 1 : 0]
    : inChamber ? 'chamber' : inCave ? 'cave' : inTunnel ? 'temple' : inRuins ? 'ruins'
      : inRapids ? 'rapids' : inLake ? 'lake' : null;

  const [mapRun, setMapRun] = useState(0);
  const travelCampaign = destination => {
    if (selected !== null || audioPanelOpen || accessibilityOpen || reading || wizardChessOpen) return;
    setCampaignMenuOpen(false);
    setKingBattle(false);
    speech.current.stop();
    setSpeaking(false);
    setVoiceNotice('');
    keys.current.clear();

    const dragonStage = dragonCampaign.indexOf(destination);
    const castleStage = castleCampaign.indexOf(destination);
    const returnedFromChamber = destination === 'cave' && campaignMap === 'chamber';
    if (destination === campaignMap) {
      setThroneUnlocked(false);
      setMapRun(run => run + 1);
    }
    setInLake(dragonStage === 0 || dragonStage === 1);
    setInRapids(dragonStage === 1);
    setInRuins(dragonStage >= 2);
    setInTunnel(dragonStage >= 3);
    setInCave(dragonStage >= 4);
    setInChamber(dragonStage === 5);
    setTempleReached(dragonStage >= 3 || (destination === 'ruins' && campaignMap === 'temple'));
    setReturnFromCave(dragonStage >= 4 || (destination === 'temple' && campaignMap === 'cave'));
    setReturnFromChamber(returnedFromChamber);

    setInCursedCastle(castleStage >= 0);
    setInCorridor(castleStage === 1);
    setInCastleCourtyard(castleStage === 2);
    setInRoyalArena(castleStage === 4);
    setInThroneEntrance(castleStage === 3);
    setInThrone(false);
    setReturnFromCastleCourtyard(castleStage > 0 || (destination === 'cursed-castle' && campaignMap === 'cursed-castle-corridor'));

    if (destination === 'village') {
      setNear(-1);
      setNearNpc(-1);
      setVillageArrival('portal');
    }
  };

  const campaign = inCursedCastle ? castleCampaign : dragonCampaign;
  const stage = campaign.indexOf(campaignMap);
  const nextCampaign = campaign === dragonCampaign && stage === campaign.length - 1;
  const nextMap = nextCampaign ? castleCampaign[0] : campaign[stage + 1];
  const campaignNavigation = map => map === campaignMap ? (
    <CampaignNavigation language={language} paused={anyPanelOpen || reading} hidden={map !== 'rapids' && wizardChessOpen}
      onOpen={() => { keys.current.clear(); setCampaignMenuOpen(true); }} />
  ) : undefined;

  const [gameUiHidden, setGameUiHidden] = useState(false);
  const toggleGameUi = event => {
    keys.current.clear();
    setGameUiHidden(hidden => !hidden);
    if (!gameUiHidden && event.detail > 0) {
      const dialogs = document.querySelectorAll('#portfolio :is(.npc-dialogue, [role="dialog"])');
      if (Array.from(dialogs).some(dialog => dialog.getClientRects().length)) return;
      const canvases = document.querySelectorAll('#portfolio canvas[tabindex]');
      Array.from(canvases).find(canvas => canvas.getClientRects().length)?.focus({ preventScroll: true });
    }
  };
  const backgroundInert = selected !== null || anyPanelOpen;


  return <div className={`app${reading ? ' reading-mode' : ''} text-${accessibility.textSize}${accessibility.highContrast ? ' high-contrast' : ''}${accessibility.simpleFont ? ' simple-font' : ''}${reduceMotion ? ' reduce-motion' : ''}`}>
    <a className="skip-link" href="#portfolio" tabIndex={backgroundInert ? -1 : 0} aria-hidden={backgroundInert || undefined} onClick={e => { e.preventDefault(); document.getElementById('portfolio')?.focus(); }}>{en ? 'Skip to content' : 'Pular para o conteúdo'}</a>
    <div inert={backgroundInert || undefined} aria-hidden={backgroundInert || undefined}>
    <header><a className="brand" href="#portfolio" aria-label={en ? 'Felipe Santos, home' : 'Felipe Santos, início'}><span className="brand-mark">F<span>.</span></span><span>FELIPE SANTOS<small>{en ? 'SOFTWARE ENGINEER' : 'ENGENHEIRO DE SOFTWARE'}</small></span></a><div className="header-actions"><span className="edition" title={commitId || undefined}>{en ? '3D PORTFOLIO' : 'PORTFÓLIO 3D'} · <Github size={14} aria-hidden="true" /> <span className="sr-only">Commit </span>{displayedVersion}</span><LanguageFlags language={language} onChange={changeLanguage} /><button onClick={() => { endConversation(); setReading(!reading); }}><BookOpen size={16} /><span>{reading ? 'Modo 3D' : en ? 'Reading mode' : 'Modo leitura'}</span></button><button onClick={() => { keys.current.clear(); setAccessibilityOpen(false); setAudioPanelOpen(true); }} aria-label={en ? 'Audio settings' : 'Configurações de áudio'} aria-haspopup="dialog">{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}<span>{en ? 'Audio' : 'Áudio'}</span></button><div className="header-accessibility-actions"><button onClick={openAccessibility} aria-label={en ? 'Open accessibility settings' : 'Abrir acessibilidade'} aria-haspopup="dialog"><Accessibility size={18} /><span>{en ? 'Accessibility' : 'Acessibilidade'}</span></button>
      {!reading && <button type="button" className="game-ui-toggle" aria-pressed={gameUiHidden}
        aria-label={en ? 'Hide game overlays' : 'Ocultar sobreposi\u00e7\u00f5es do jogo'}
        title={gameUiHidden ? (en ? 'Show game overlays' : 'Mostrar sobreposi\u00e7\u00f5es do jogo') : (en ? 'Hide game overlays' : 'Ocultar sobreposi\u00e7\u00f5es do jogo')}
        onClick={toggleGameUi}>
        {gameUiHidden ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>}
      </div></div></header>
    <main id="portfolio" tabIndex={-1} className={[!showIntro && !reading && 'intro-collapsed', !reading && gameUiHidden && 'game-ui-hidden'].filter(Boolean).join(' ')}>
      <div key={mapRun} hidden={reading}>
      {inThrone && <Suspense fallback={<div className="scene-loading">{en ? 'Opening the castle...' : 'Abrindo o castelo...'}</div>}><ThroneHall language={language} keys={keys} onSpeak={speakFelipe} onStop={() => speech.current.stop()} speaking={speaking} voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={() => { speech.current.stop(); keys.current.clear(); setVillageArrival('castle'); setInThrone(false); }} /></Suspense>}
      {inLake && !inRapids && !reading && <Suspense fallback={<div className="scene-loading">{en ? 'Opening the lake...' : 'Abrindo o lago...'}</div>}><Lake campaignNavigation={campaignNavigation('lake')} language={language} onSpeak={speakLakeGuide} onStop={() => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); }} speaking={speaking} voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice} onEnterRapids={() => { keys.current.clear(); setInRapids(true); }} onSound={event => effects.current.lake(event)} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={() => { keys.current.clear(); setVillageArrival('portal'); setInLake(false); }} /></Suspense>}
      {inRapids && !reading && <Suspense fallback={<div className="scene-loading">{en ? 'Entering the rapids...' : 'Entrando nas corredeiras...'}</div>}><Rapids campaignNavigation={campaignNavigation('rapids')} onAdvance={() => { keys.current.clear(); setInRapids(false); setInLake(false); setInRuins(true); }} language={language} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={() => { keys.current.clear(); setInRapids(false); }} /></Suspense>}
      {inRuins && !inTunnel && !reading && <div><Suspense fallback={<div className="scene-loading">{en ? 'Opening the ruins...' : 'Abrindo as ruínas...'}</div>}><Ruins campaignNavigation={campaignNavigation('ruins')} startNearPassage={templeReached} language={language} onSound={event => effects.current.ruins?.(event)} onEnterTunnel={() => { speech.current.stop(); keys.current.clear(); setTempleReached(true); setInTunnel(true); }} onSpeak={speakRuinsPirate} onStop={() => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); }} speaking={speaking} voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={() => { keys.current.clear(); setTempleReached(false); setInRuins(false); }} /></Suspense></div>}
      {inTunnel && !inCave && !reading && <Suspense fallback={<div className="scene-loading">{en ? 'Entering the village...' : 'Entrando na aldeia...'}</div>}><TempleVillage campaignNavigation={campaignNavigation('temple')} startNearCave={returnFromCave} onEnterCave={() => { speech.current.stop(); setSpeaking(false); keys.current.clear(); setReturnFromCave(true); setReturnFromChamber(false); setInCave(true); }} onSpeak={speakTempleResident} onStop={() => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); }} speaking={speaking} voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice} language={language} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onSound={event => effects.current.ruins?.(event)} onExit={() => { speech.current.stop(); setSpeaking(false); keys.current.clear(); effects.current.ruins?.('passage'); setReturnFromCave(false); setInTunnel(false); }} /></Suspense>}
      {inCave && !inChamber && !reading && <Suspense fallback={<div className="scene-loading">{en ? 'Entering the cave...' : 'Entrando na caverna...'}</div>}><DragonCave campaignNavigation={campaignNavigation('cave')} startAtChamber={returnFromChamber} onEnterChamber={() => { speech.current.stop(); setSpeaking(false); keys.current.clear(); setInChamber(true); }} onSpeak={speakCaveTraveler} onStop={() => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); }} speaking={speaking} voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice} onSound={event => effects.current.cave(event)} language={language} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={() => { speech.current.stop(); setSpeaking(false); keys.current.clear(); setReturnFromChamber(false); setInCave(false); }}/></Suspense>}
      {inChamber && !reading && <Suspense fallback={<div className="scene-loading">{en ? 'Entering the chamber...' : 'Entrando na câmara...'}</div>}><DragonChamber campaignNavigation={campaignNavigation('chamber')} onPrincessSpeak={speakPrincess} speaking={speaking} onVictoryChange={setDragonVictory} onReturnVillage={() => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); keys.current.clear(); setInChamber(false); setInCave(false); setInTunnel(false); setInRuins(false); setVillageArrival('portal'); }} onDialogueChange={setDragonDialogueActive} onBattleChange={setDragonBattle} language={language} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onSpeak={speakElder} onStop={() => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); }} voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice} onSound={event => effects.current.dragon(event)} onExit={() => { speech.current.stop(); setSpeaking(false); setVoiceNotice(''); keys.current.clear(); setReturnFromChamber(true); setInChamber(false); }}/></Suspense>}
      {inCursedCastle && !inCorridor && !inCastleCourtyard && !inThroneEntrance && !inRoyalArena && !reading && <Suspense fallback={<div className="scene-loading">{en?'Approaching the cursed castle...':'Chegando ao castelo amaldi\u00e7oado...'}</div>}><CursedCastle campaignNavigation={campaignNavigation('cursed-castle')} startNearGate={returnFromCastleCourtyard} onEnterCastle={()=>{keys.current.clear();setReturnFromCastleCourtyard(true);setInCorridor(true);setInCastleCourtyard(false);}} onSound={event=>effects.current.cursedCastle?.(event)} weatherEffects={accessibility.weatherEffects} onWeather={strength=>effects.current.setWeather?.(strength)} onSpeak={speakCastleArchivist} onStop={()=>{speech.current.stop();setSpeaking(false);setVoiceNotice('');}} speaking={speaking} voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice} language={language} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={()=>{keys.current.clear();setInCursedCastle(false);setReturnFromCastleCourtyard(false);setVillageArrival('portal');}} /></Suspense>}
      {inCorridor && !reading && <Suspense fallback={<div className="scene-loading">{en?'Entering the hall of infinity...':'Entrando no corredor do infinito...'}</div>}><InfiniteCorridor campaignNavigation={campaignNavigation('cursed-castle-corridor')} language={language} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onSound={event=>{if(event==='monster')effects.current.dungeon?.('monsterAttack');else if(event==='cloak')effects.current.ruins?.('rune');else effects.current.cursedCastle?.(event);}} onExit={()=>{keys.current.clear();setReturnFromCastleCourtyard(true);setInCorridor(false);}} onAdvance={()=>{keys.current.clear();setInCorridor(false);setInCastleCourtyard(true);}} /></Suspense>}
      {inCastleCourtyard && !reading && <Suspense fallback={<div className="scene-loading">{en?'Entering the courtyard...':'Entrando no pátio...'}</div>}><CursedCastleCourtyard campaignNavigation={campaignNavigation('cursed-castle-courtyard')} onAdvance={()=>{keys.current.clear();setInCastleCourtyard(false);setInThroneEntrance(true);}} onEncounterChange={setWitchEncounter} language={language} onSpeak={speakWitch} onStopVoice={stopWitchVoice} voiceEnabled={sound && audioSettings.voices} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onSound={(event,onDone)=>effects.current.cursedCastle?.(event,onDone)} weatherEffects={accessibility.weatherEffects} onWeather={strength=>effects.current.setWeather?.(strength)} onExit={()=>{keys.current.clear();setReturnFromCastleCourtyard(true);setInCastleCourtyard(false);}} /></Suspense>}
      {inRoyalArena && !reading && <Suspense fallback={<div className="scene-loading">{en ? 'Entering the evil throne room…' : 'Entrando na sala do trono maligno…'}</div>}>
        <CastleThrone en={en} keys={keys} paused={anyPanelOpen || reading} reduceMotion={reduceMotion}
          voiceEnabled={sound && audioSettings.voices} voiceNotice={voiceNotice}
          onSpeak={speakKing} onStop={stopKingVoice}
          campaignNavigation={campaignNavigation(campaignMap)}
          onSound={event => effects.current.dungeon(event)} onBattleStart={() => setKingBattle(true)}
          onRestart={() => travelCampaign(campaignMap)}
          onReturn={() => travelCampaign('cursed-castle-throne-entrance')} /></Suspense>}
      {inThroneEntrance && !reading && <Suspense fallback={<div className="scene-loading">{en ? 'Approaching the evil throne room...' : 'Chegando à sala do trono maligno...'}</div>}><CursedCastleCourtyard campaignNavigation={campaignNavigation('cursed-castle-throne-entrance')} interior onAdvance={() => travelCampaign('cursed-castle-royal-arena')} weatherEffects={accessibility.weatherEffects} onChessOpenChange={setWizardChessOpen} onSound={event => effects.current.ruins?.(event)} onChessPieceFocus={piece => effects.current.chessPiece?.(piece)} onChessAttack={kind => effects.current.chessAttack?.(kind)} throneUnlocked={throneUnlocked} onThroneUnlock={() => setThroneUnlocked(true)}
        language={language} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={() => { keys.current.clear();setInThroneEntrance(false);setInCastleCourtyard(true); }} /></Suspense>}
      {inDungeon && <Suspense fallback={<div className="scene-loading">{en ? 'Opening the portal...' : 'Abrindo o portal...'}</div>}><Dungeon language={language} keys={keys} onSound={event => effects.current.dungeon(event)} paused={anyPanelOpen || reading} reduceMotion={reduceMotion} onExit={() => { keys.current.clear(); setInDungeon(false); }} /></Suspense>}
      </div>
      <div hidden={!reading && (inDungeon || inThrone || inLake || inRuins || inCursedCastle)}>
      <div className="intro">
        {!showIntro && !reading && <h1 className="sr-only">{en ? 'Felipe Santos portfolio' : 'Portfólio de Felipe Santos'}</h1>}
        {!reading && <button className="intro-toggle" aria-expanded={showIntro} aria-controls="intro-copy" onClick={() => setShowIntro(visible => !visible)}>{showIntro ? <EyeOff size={15} /> : <Eye size={15} />}{showIntro ? (en ? 'Hide text' : 'Ocultar texto') : (en ? 'Show text' : 'Mostrar texto')}</button>}
        <div id="intro-copy" hidden={!showIntro && !reading}><h1 className="sr-only">{en ? 'Felipe Santos portfolio' : 'Portfólio de Felipe Santos'}</h1><p>{reading ? (en ? 'Explore my background, skills, and projects in reading mode.' : 'Explore minha trajet\u00f3ria, habilidades e projetos no modo leitura.') : en ? 'For smooth navigation, the 3D experience requires a capable device. Use Reading mode for the text version.' : 'Para uma navega\u00e7\u00e3o fluida, a experi\u00eancia 3D precisa de um dispositivo com bom desempenho. Se o cen\u00e1rio estiver lento, use o Modo leitura no topo da p\u00e1gina para acessar a vers\u00e3o textual.'}</p>{!reading && <div className="intro-note"><Compass size={18} /><span>{en ? 'Drag to look around. Choose a door to begin.' : 'Arraste para olhar ao redor. Escolha uma porta para começar.'}</span></div>}</div>
      </div>
      {reading ? <div className="reading-list"><nav className="reading-navigation" aria-label={en ? 'Portfolio sections' : 'Seções do portfólio'}><button type="button" className="reading-nav-toggle" aria-expanded={readingMenuOpen} aria-controls="reading-menu-links" onClick={() => setReadingMenuOpen(open => !open)}>{readingMenuOpen ? (en ? 'Collapse menu' : 'Recolher menu') : (en ? 'Open menu' : 'Abrir menu')} <span aria-hidden="true">{readingMenuOpen ? '−' : '+'}</span></button><div id="reading-menu-links" className="reading-menu-links" hidden={!readingMenuOpen}><span className="reading-nav-title">{en ? 'Explore the portfolio' : 'Explore o portfólio'}</span>{activePlaces.map((p, i) => <a href={`#reading-section-${i}`} key={p.name}>{p.section}</a>)}<a href="#reading-villagers">{en ? 'Village residents' : 'Moradores da vila'}</a></div></nav>{activePlaces.map((p, i) => <section id={`reading-section-${i}`} tabIndex={-1} key={p.name}><span className="eyebrow">0{i + 1} · {p.name}</span><h2>{p.section}</h2><Content language={language} index={i} narrationEnabled={sound && audioSettings.narration} /></section>)}<section id="reading-villagers" tabIndex={-1}><h2>{en ? 'Village residents' : 'Moradores da vila'}</h2><p>{en ? 'Read the villagers’ greetings without exploring the 3D scene.' : 'Conheça as saudações dos moradores sem navegar pelo cenário.'}</p>{activeVillagers.map((person, i) => <details className="reading-villager" key={person.name}><summary>{person.name} · {person.role}</summary>{person.lines.map((line, j) => <div key={line}><p>{line}</p><button disabled={!sound || !audioSettings.voices} onClick={() => speakNpc(i, j)}>{en ? 'Listen to message' : 'Ouvir mensagem'} {j + 1} {en ? 'from' : 'de'} {person.name}</button></div>)}</details>)}{speaking && <button onClick={() => speech.current.stop()}>{en ? 'Stop voice' : 'Parar voz'}</button>}</section></div> : <>
        <div className="viewport" aria-label={en ? '3D portfolio village' : 'Vilarejo tridimensional do portfólio'}>
          <Suspense fallback={<div className="scene-loading">{en ? 'Lighting the village lanterns…' : 'Acendendo as lanternas da vila…'}</div>}><VillageScene language={language} weatherMode={weatherMode} weatherEffects={accessibility.weatherEffects} onWeather={strength => effects.current.setWeather?.(strength)} keys={keys} compassRef={compassDial} sceneHidden={inDungeon || inThrone || inLake || inRuins || inCursedCastle} paused={selected !== null || anyPanelOpen || inDungeon || inThrone || inLake || inRuins || inCursedCastle} reduceMotion={reduceMotion} ambientPaused={accessibility.pauseScene} cameraTurn={cameraTurn} onOpen={open} onNear={setNear} onTalk={talk} onNearNpc={setNearNpc} talkingNpc={conversation?.index} zoom={zoom} resetKey={resetKey} villageArrival={villageArrival} onVillageArrivalHandled={() => setVillageArrival(null)} missionRound={missionRound} missionComplete={missionComplete && !celebrationDone.current} onFirework={stage => { if (preferences.current.master && preferences.current.interactions) effects.current.firework(stage); }} onCelebrate={() => { celebrationDone.current = true; }} /></Suspense>
          {conversation && <section className="npc-dialogue" aria-label={`${en ? 'Conversation with' : 'Conversa com'} ${activeVillagers[conversation.index].name}`} tabIndex={-1} ref={npcPanel}>
            <div className="npc-dialogue-heading"><span className="npc-avatar" style={{ background: activeVillagers[conversation.index].color }}>{activeVillagers[conversation.index].name[0]}</span><div><h2>{activeVillagers[conversation.index].name}</h2><small>{activeVillagers[conversation.index].role}</small></div><button onClick={endConversation} aria-label={en ? 'End conversation' : 'Encerrar conversa'}><X size={18} /></button></div>
            <p aria-live="polite">{activeVillagers[conversation.index].lines[conversation.line]}</p>
            <div className="npc-dialogue-actions"><button disabled={!sound || !audioSettings.voices} onClick={() => { if (speaking) speech.current.stop(); else speakNpc(conversation.index, conversation.line); }}>{speaking ? (en ? 'Stop voice' : 'Parar voz') : (en ? 'Listen' : 'Ouvir mensagem')}</button><button onClick={() => talk(conversation.index)}>{en ? 'Next message' : 'Outra mensagem'} ↗</button></div>
            <small className="npc-voice-note">{voiceNotice || (!sound || !audioSettings.voices ? (en ? 'Enable NPC voices in audio settings.' : 'Ative as vozes dos NPCs nas configurações de áudio.') : (en ? 'American English voice' : `Voz ${VILLAGER_VOICES[activeVillagers[conversation.index].name].gender === 'female' ? 'feminina' : 'masculina'} · ${VILLAGER_VOICES[activeVillagers[conversation.index].name].tone.toLowerCase()}`))}</small>
          </section>}
          {!conversation && selected === null && (near >= 0 || nearNpc >= 0) && <div className="village-actions">
            {near >= 0 && <button className="village-enter" onClick={() => open(near)}>{en ? 'Enter' : 'Entrar'}: {activePlaces[near].name} <kbd>E</kbd></button>}
            {nearNpc >= 0 && <button className="villager-talk" onClick={() => talk(nearNpc)}>{en ? 'Talk to' : 'Conversar com'} {activeVillagers[nearNpc].name} <kbd>F</kbd></button>}
          </div>}
          <div className="scene-guide">
            <div className="scene-caption"><span className="live-dot" /> {en ? 'CREATORS VILLAGE' : 'VILA DOS CRIADORES'}</div>
            <div className="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en ? 'or arrow keys to walk' : 'ou setas para passear'} {' '}<kbd>Shift</kbd> {en ? 'to run' : 'para correr'}</span><span className="keyboard-guide"><kbd>E</kbd> {en ? 'enter' : 'entrar'} {' '}<kbd>F</kbd> {en ? 'talk  drag to turn' : 'conversar  arraste para girar'}</span><span className="touch-guide">{en ? 'Drag to turn  tap to interact' : 'Arraste para girar  toque para interagir'}</span></div>
          </div>
          <div className="compass" aria-label={en ? 'Compass: the arrow indicates camera direction' : 'Bússola: a seta indica a direção da câmera'}><span className="compass-north">N</span><div className="compass-face"><span className="compass-cardinal east">{en ? 'E' : 'L'}</span><span className="compass-cardinal south">S</span><span className="compass-cardinal west">{en ? 'W' : 'O'}</span><svg className="compass-needle" ref={compassDial} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L26 22 L20 19 L14 22 Z" fill="#e2b76c"/><path d="M20 37 L14 18 L20 21 L26 18 Z" fill="#849a9d"/><circle cx="20" cy="20" r="2.1" fill="#f1e4c7"/></svg></div></div>
          <div className="camera-tools"><button className="weather-control" type="button" disabled={!accessibility.weatherEffects || reduceMotion || accessibility.pauseScene} title={!accessibility.weatherEffects || reduceMotion || accessibility.pauseScene ? (en ? 'Enable weather and animation in accessibility settings.' : 'Ative o clima e as animações nas configurações de acessibilidade.') : undefined} onClick={() => setWeatherMode(mode => weatherModes[(weatherModes.indexOf(mode) + 1) % weatherModes.length])} aria-label={`${en ? 'Change weather' : 'Alterar clima'}: ${weatherLabels[weatherModes.indexOf(weatherMode)]}`}><span aria-hidden="true">&#9729;</span> {en ? 'Weather' : 'Clima'}: {weatherLabels[weatherModes.indexOf(weatherMode)]}</button><button onClick={() => setResetKey(v => v + 1)}>{en ? 'Focus character' : 'Focar personagem'}</button><div className="camera-rotation"><button onClick={() => setCameraTurn(v => v - 1)} aria-label={en ? 'Rotate camera left' : 'Girar câmera para a esquerda'}><RotateCcw size={18} /></button><button onClick={() => setCameraTurn(v => v + 1)} aria-label={en ? 'Rotate camera right' : 'Girar câmera para a direita'}><RotateCw size={18} /></button></div><div className="zoom"><button onClick={() => setZoom(z => Math.min(2, z + .2))} aria-label={en ? 'Zoom in' : 'Aproximar'}>+</button><button onClick={() => setZoom(z => Math.max(.5, z - .2))} aria-label={en ? 'Zoom out' : 'Afastar'}>−</button></div></div>
        </div>
        <div className="touch-controls" role="group" aria-label={en ? 'Walking controls' : 'Controles de caminhada'}>{[['↑','w','para frente'],['←','a','para a esquerda'],['↓','s','para trás'],['→','d','para a direita']].map(([label, key, direction]) => <button key={key} aria-label={en ? ({ w: 'Walk forward', a: 'Walk left', s: 'Walk backward', d: 'Walk right' }[key]) : `Caminhar ${direction}`} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setTouchMovement(keys.current, key, true); }} onPointerUp={() => setTouchMovement(keys.current, key, false)} onPointerCancel={() => setTouchMovement(keys.current, key, false)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setTouchMovement(keys.current, key, true); } }} onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setTouchMovement(keys.current, key, false); }} onBlur={() => setTouchMovement(keys.current, key, false)} onLostPointerCapture={() => setTouchMovement(keys.current, key, false)}>{label}</button>)}<TouchInteract language={language} onInteract={() => { if (nearNpc >= 0) talk(nearNpc); else if (near >= 0) open(near); }} disabled={anyPanelOpen || selected !== null || Boolean(conversation) || (nearNpc < 0 && near < 0)} /></div>
        {missionComplete ? <div className="quest quest-complete"><div><small>{en ? 'JOURNEY COMPLETE' : 'JORNADA CONCLUÍDA'}</small><p>{en ? 'Thank you for visiting the village!' : 'Obrigado por conhecer a vila!'}</p><button className="restart-mission" onClick={restartMission}><RotateCcw size={15} /> {en ? 'Restart' : 'Recomeçar'}</button></div></div> : <div className="quest"><span className="quest-icon"><Footprints size={20} /></span><div><small>{en ? 'YOUR QUEST' : 'SUA MISSÃO'}</small><p>{en ? 'Discover the stories of this village' : 'Conhecer as histórias desta vila'}</p><div className="progress" role="progressbar" aria-label={en ? 'Destinations explored' : 'Destinos explorados'} aria-valuemin={0} aria-valuemax={4} aria-valuenow={visited.length}>{activePlaces.slice(0, 4).map((p, i) => <i key={p.name} className={visited.includes(i) ? 'done' : ''} />)}</div></div><strong>{visited.length}<span> / 4</span></strong></div>}
        <nav className="destinations" aria-label={en ? 'Village destinations' : 'Destinos da vila'}>{activePlaces.slice(0, 4).map((p, i) => <button key={p.name} aria-label={`${en ? 'Enter' : 'Entrar'}: ${p.section}`} onClick={() => open(i)}><span className="destination-icon">{p.icon}</span><span><small>0{i + 1} / {visited.includes(i) ? (en ? 'EXPLORED' : 'EXPLORADO') : p.name.split(' ')[0].toUpperCase()}</small><strong>{p.section}</strong></span><ArrowUpRight size={17} /></button>)}</nav>
      </>}
      </div>
    </main>
    <p className="sr-only" role="status" aria-live="polite">{missionComplete ? (en ? 'Journey complete. You explored all four destinations. The Restart button is available.' : 'Jornada concluída. Você explorou os quatro destinos. O botão Recomeçar está disponível.') : (en ? `${visited.length} of 4 destinations explored.` : `${visited.length} de 4 destinos explorados.`)}</p>
    </div>
    {campaignMenuOpen && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setCampaignMenuOpen(false); }}>
      <section className="modal campaign-menu" role="dialog" aria-modal="true" aria-labelledby="campaign-title" ref={campaignPanel} tabIndex={-1}>
        <div className="modal-header"><h2 id="campaign-title">{en ? 'Choose a destination' : 'Escolha um destino'}</h2>
          <button className="close" onClick={() => setCampaignMenuOpen(false)} aria-label={en ? 'Close' : 'Fechar'}><X /></button></div>
        <button onClick={() => travelCampaign('village')}>{en ? 'Return to village' : 'Voltar para a vila'}</button>
        <button disabled={stage <= 0} onClick={() => travelCampaign(campaign[stage - 1])}>{en ? 'Previous map' : 'Voltar ao mapa anterior'}</button>
        <button onClick={() => travelCampaign(campaignMap)}>{en ? 'Restart current map' : 'Reiniciar mapa atual'}</button>
        <button disabled={!nextMap} onClick={() => travelCampaign(nextMap)}>{nextCampaign ? (en ? 'Next campaign' : 'Avançar para a próxima campanha') : (en ? 'Next map' : 'Avançar ao próximo mapa')}</button>
      </section>
    </div>}
    {selected !== null && <div className="modal-backdrop" inert={anyPanelOpen || undefined} aria-hidden={anyPanelOpen || undefined} onClick={e => { if (e.target === e.currentTarget) close(); }}><article className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} ref={dialog}><div className="modal-header"><span className="eyebrow">0{selected + 1} · {activePlaces[selected].name}</span><div className="modal-header-actions"><button className="close" onClick={close} aria-label={en ? 'Close section' : 'Fechar seção'}><X /></button><button className="section-audio-button" onClick={() => setAudioPanelOpen(true)}>{en ? 'Audio settings' : 'Configurar áudio'}</button><button className="section-audio-button" onClick={openAccessibility}>{en ? 'Accessibility' : 'Acessibilidade'}</button></div></div><h2 id="dialog-title">{selected === 4 ? (en ? 'Choose a destination' : 'Escolha um destino') : activePlaces[selected].section}</h2>{selected === 4 ? <div className="portal-destinations"><p>{en ? 'Where would you like to go?' : 'Para onde você deseja ir?'}</p><details className="portal-campaign"><summary>{en ? 'Evil Dragon Campaign' : 'Campanha do Dragão Maligno'}</summary><div className="portal-campaign-maps"><button type="button" onClick={() => { keys.current.clear(); setSelected(null); setNear(-1); setInLake(true); }}><PortalArtwork scene="lake" /><span className="portal-card-copy"><strong>1. {en ? 'Lake of Interfaces' : 'Lago das Interfaces'}</strong><span>{en ? 'Explore the lake by boat' : 'Explore o lago de barco'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button><button type="button" onClick={() => { keys.current.clear(); setSelected(null); setNear(-1); setInLake(true); setInRapids(true); }}><PortalArtwork scene="rapids" /><span className="portal-card-copy"><strong>2. {en ? 'Canyon Rapids' : 'Corredeiras do Desfiladeiro'}</strong><span>{en ? 'Steer through the canyon' : 'Desça o desfiladeiro de barco'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button><button type="button" onClick={() => { keys.current.clear(); setSelected(null); setNear(-1); setInRuins(true); }}><PortalArtwork scene="ruins" /><span className="portal-card-copy"><strong>3. {en ? 'Sunken Ruins Cove' : 'Enseada das Ruínas Submersas'}</strong><span>{en ? 'Explore the ancient cove' : 'Explore a enseada e suas ruínas'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button><button type="button" onClick={() => { keys.current.clear(); setSelected(null); setNear(-1); setInRuins(true); setTempleReached(true); setInTunnel(true); }}><PortalArtwork scene="temple" /><span className="portal-card-copy"><strong>4. {en ? 'Ancient Temple Village' : 'Aldeia do Templo Antigo'}</strong><span>{en ? 'Explore the village and its sanctuaries' : 'Explore a aldeia e seus santuários'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button><button type="button" onClick={() => { keys.current.clear(); setSelected(null); setNear(-1); setInRuins(true); setTempleReached(true); setInTunnel(true); setReturnFromCave(true); setReturnFromChamber(false); setInCave(true); setInChamber(false); }}><PortalArtwork scene="cave" /><span className="portal-card-copy"><strong>5. {en?'The Elder’s Cave':'Caverna do Ancião'}</strong><span>{en?'Explore the dangerous caverns':'Explore as cavernas perigosas'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button><button type="button" onClick={() => { keys.current.clear(); setSelected(null); setNear(-1); setInRuins(true); setTempleReached(true); setInTunnel(true); setReturnFromCave(true); setReturnFromChamber(false); setInCave(true); setInChamber(true); }}><PortalArtwork scene="chamber" /><span className="portal-card-copy"><strong>6. {en?'The Elder’s Chamber':'Câmara do Ancião'}</strong><span>{en?'Enter the dragon’s lair':'Entre no covil do dragão'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button></div></details><details className="portal-campaign"><summary>{en?'Cursed Castle Campaign':'Campanha do Castelo Amaldi\u00e7oado'}</summary><div className="portal-campaign-maps"><button type="button" onClick={()=>{keys.current.clear();setSelected(null);setNear(-1);setReturnFromCastleCourtyard(false);setInCursedCastle(true);setInCorridor(false);setInCastleCourtyard(false);}}><svg className="portal-card-image" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="600" height="250" fill="#202d39"/><circle cx="468" cy="45" r="24" fill="#c9d2c9"/><path d="M0 155 80 98l78 50 94-82 76 74 98-69 91 67 83-50v162H0Z" fill="#3b4b48"/><path d="M0 205q120-28 240-6t180 0 180 0v51H0Z" fill="#515b50"/><path d="M170 196V91h35V76h20v15h20v-15h20v15h70V76h20v15h20V76h20v15h35v105Z" fill="#717579"/><path d="M143 196V80h22V66h18v14h18V66h18v130Zm238 0V80h22V66h18v14h18V66h18v130Z" fill="#565f64"/><path d="M259 196v-41a41 41 0 0 1 82 0v41Z" fill="#24262d"/><path d="M268 195v-40m14 40v-52m14 52v-57m14 57v-57m14 57v-52m10 52v-40M263 170h74" stroke="#88857d" strokeWidth="3"/><path d="M258 250 281 196h38l23 54Z" fill="#8b8473"/><path d="m216 181 6-14 6 14m144 0 6-14 6 14" fill="#eca25b"/></svg><span className="portal-card-copy"><strong>1. {en?'Castle Outskirts':'Arredores do Castelo'}</strong><span>{en?'Approach the cursed fortress':'Aproxime-se da fortaleza amaldi\u00e7oada'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button><button type="button" onClick={()=>{keys.current.clear();setSelected(null);setNear(-1);setReturnFromCastleCourtyard(true);setInCursedCastle(true);setInCorridor(true);setInCastleCourtyard(false);}}><PortalArtwork scene="corridor" /><span className="portal-card-copy"><strong>2. {en?'Hall of Infinity':'Corredor do Infinito'}</strong><span>{en?'Survive the looping corridor':'Sobreviva ao corredor sem fim'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button><button type="button" onClick={()=>{keys.current.clear();setSelected(null);setNear(-1);setInCursedCastle(true);setReturnFromCastleCourtyard(true);setInCorridor(false);setInCastleCourtyard(true);}}><svg className="portal-card-image" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="600" height="250" fill="#596674"/><path d="M0 171 138 120h324l138 51v79H0Z" fill="#46565c"/><path d="M0 178V54l28 13V48l31 15v19l30 15V79l31 16v20l36 8v48Zm600 0V54l-28 13V48l-31 15v19l-30 15V79l-31 16v20l-36 8v48Z" fill="#37434e"/><path d="M156 171v-48h21v-13h27v13h26v-13h27v13h26v-13h27v13h26v-13h27v13h26v-13h27v13h28v48Z" fill="#485762"/><path d="M64 231h472M153 202h294M235 250l28-79m102 79-28-79" stroke="#66777e" strokeWidth="3"/><ellipse cx="345" cy="217" rx="67" ry="8" fill="#7b8e99"/><ellipse cx="196" cy="234" rx="35" ry="5" fill="#71838e"/><path d="M0 121q156 48 600-4v65q-300 31-600-4Z" fill="#a9b8bf" opacity=".28"/><path d="m74 22-14 30m84-8-14 30m88-54-14 30m84-2-14 30m97-60-14 30m86-7-14 30m86-56-14 30m90-10-14 30M125 140l-14 30m131-59-14 30m160-22-14 30m144-49-14 30" stroke="#b2c5d2" strokeWidth="2" opacity=".68"/></svg><span className="portal-card-copy"><strong>3. {en?'Castle Courtyard':'Pátio do Castelo'}</strong><span>{en?'Explore the courtyard in the rain and fog':'Explore o pátio sob chuva e neblina'}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button>
      <button type="button" onClick={() => {
        keys.current.clear();
        setSelected(null);
        setNear(-1);
        setInCursedCastle(true);
        setReturnFromCastleCourtyard(true);
        setInThroneEntrance(true);
      }}>
        <img className="portal-card-image" src={guardianChamberArtwork} alt="" width="600" height="250" />
        <span className="portal-card-copy">
          <strong>4. {en ? 'Arcane Guardian Chamber' : 'Câmara do Guardião Arcano'}</strong>
          <span>{en ? "Face the ancient seal in a game of wizard's chess" : 'Enfrente o selo antigo no xadrez de bruxo'}</span>
        </span>
        <ArrowUpRight size={20} aria-hidden="true" />
      </button><button type="button" onClick={() => {
        keys.current.clear(); setSelected(null); setNear(-1); setInCursedCastle(true); setInRoyalArena(true);
      }}>
        <svg className="portal-card-image" viewBox="0 0 600 250" aria-hidden="true"><rect width="600" height="250" fill="#211d31"/>
          <path d="M0 250 160 146h280l160 104Z" fill="#48424b"/><path d="m216 250 60-104h48l60 104Z" fill="#582536"/>
          <path d="M240 161h120v-12H240zm12-12h96v-10h-96z" fill="#92704a"/>
          <path d="M268 139V80l10 8V44l22 17 22-17v44l10-8v59Z" fill="#a68a56"/>
          <path d="M281 129V67l19 13 19-13v62Z" fill="#562539"/><path d="m300 75 8 15-8 13-8-13Z" fill="#ac83db"/>
        </svg><span className="portal-card-copy"><strong>5. {en ? 'Evil Throne Room' : 'Sala do Trono Maligno'}</strong>
          <span>{en ? 'Face the Castle Lord' : 'Enfrente o Senhor do Castelo'}</span></span><ArrowUpRight size={20} aria-hidden="true" />
      </button></div></details></div> : <Content language={language} index={selected} narrationEnabled={sound && audioSettings.narration} />}</article></div>}
    {accessibilityOpen && <AccessibilitySettings language={language} settings={accessibility} onChange={updateAccessibility} onClose={closeAccessibility} />}
    {audioPanelOpen && <AudioSettings language={language} settings={audioSettings} onChange={updateAudio} onClose={closeAudioPanel} notice={audioNotice} />}
    <audio ref={bg} src={musicTrack} loop preload="none" />
  </div>;
}
