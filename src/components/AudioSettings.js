import { useRef } from 'react';
import useModalFocus from './useModalFocus';
import { X, Volume2 } from 'lucide-react';

export const AUDIO_CHANNELS = [
  ['music', 'Música ambiente', 'A trilha que acompanha a exploração.'],
  ['interactions', 'Efeitos dos edifícios e fogos', 'Portas, páginas, forja, sino e fogos da missão.'],
  ['voices', 'Vozes dos NPCs', 'As conversas faladas com os moradores.'],
  ['narration', 'Narrações das seções', 'As gravações da história e dos projetos.'],
];

export const DEFAULT_AUDIO = { master: true, music: true, interactions: true, voices: true, narration: true };
export function loadAudioSettings() {
  return { ...DEFAULT_AUDIO };
}

export default function AudioSettings({ settings, onChange, onClose, notice, language = 'pt-BR' }) {
  const en = language === 'en-US';
  const channels = en ? [['music','Background music','The soundtrack during exploration.'],['interactions','Building and fireworks effects','Doors, pages, forge, bells and fireworks.'],['voices','NPC voices','Spoken conversations with villagers.'],['narration','Section narrations','Recordings of the story and projects.']] : AUDIO_CHANNELS;
  const panel = useRef(null);
  useModalFocus(panel, onClose);
  return <div className="modal-backdrop audio-panel-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="audio-panel" role="dialog" aria-modal="true" aria-labelledby="audio-title" ref={panel}>
      <button className="close" aria-label={en ? 'Close audio settings' : 'Fechar configurações de áudio'} onClick={onClose}><X size={21} /></button>
      <span className="eyebrow"><Volume2 size={15} /> {en ? 'YOUR EXPERIENCE' : 'DO SEU JEITO'}</span><h2 id="audio-title">{en ? 'Village sounds' : 'Sons da vila'}</h2>
      <p>{en ? 'Choose what to hear during your visit.' : 'Escolha o que quer ouvir durante a sua visita.'}</p>
      <label className="audio-master"><span>{en ? 'Master audio' : 'Som geral'}<small>{en ? 'Mute everything without changing your choices.' : 'Silencia tudo sem mudar suas escolhas.'}</small></span><input type="checkbox" checked={settings.master} onChange={e => onChange({ ...settings, master: e.target.checked })} /></label>
      <div className="audio-bulk"><button onClick={() => onChange(Object.fromEntries(Object.keys(DEFAULT_AUDIO).map(key => [key, true])))}>{en ? 'Enable all' : 'Ativar tudo'}</button><button onClick={() => onChange(Object.fromEntries(Object.keys(DEFAULT_AUDIO).map(key => [key, false])))}>{en ? 'Disable all' : 'Desativar tudo'}</button></div>
      <fieldset><legend>{en ? 'Audio categories' : 'Categorias de áudio'}</legend>{channels.map(([key, label, description]) => <label className="audio-channel" key={key}><span>{label}<small>{description}</small></span><input type="checkbox" checked={settings[key]} onChange={e => onChange({ ...settings, [key]: e.target.checked })} /></label>)}</fieldset>
      <p className="audio-panel-note">{!settings.master ? (en ? 'Master audio is off. You can enable it whenever you like.' : 'Som geral desligado. Você pode preparar suas escolhas e ativá-lo quando quiser.') : (en ? 'Changes apply immediately. Start narrations using the controls in each section.' : 'As mudanças são aplicadas na hora. Narrações começam pelos controles de cada seção.')}</p>
      {notice && <p className="audio-panel-notice" role="status">{notice}</p>}
    </section>
  </div>;
}
