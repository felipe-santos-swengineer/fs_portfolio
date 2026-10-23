import { useRef } from 'react';
import useModalFocus from './useModalFocus';
import { X, Volume2 } from 'lucide-react';

export const AUDIO_CHANNELS = [
  ['music', 'Música ambiente', 'A trilha que acompanha a exploração.'],
  ['steps', 'Passos', 'Passos na pedra e na grama.'],
  ['interactions', 'Efeitos dos edifícios e fogos', 'Portas, páginas, forja, sino e fogos da missão.'],
  ['voices', 'Vozes dos NPCs', 'As conversas faladas com os moradores.'],
  ['narration', 'Narrações das seções', 'As gravações da história e dos projetos.'],
];

export const DEFAULT_AUDIO = { master: false, music: true, steps: true, interactions: true, voices: true, narration: true };
export function loadAudioSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('village-audio') || '{}');
    return Object.fromEntries(Object.entries(DEFAULT_AUDIO).map(([key, value]) => [key, key === 'master' ? false : typeof stored?.[key] === 'boolean' ? stored[key] : value]));
  } catch { return { ...DEFAULT_AUDIO }; }
}

export default function AudioSettings({ settings, onChange, onClose, notice }) {
  const panel = useRef(null);
  useModalFocus(panel, onClose);
  return <div className="modal-backdrop audio-panel-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="audio-panel" role="dialog" aria-modal="true" aria-labelledby="audio-title" ref={panel}>
      <button className="close" aria-label="Fechar configurações de áudio" onClick={onClose}><X size={21} /></button>
      <span className="eyebrow"><Volume2 size={15} /> DO SEU JEITO</span><h2 id="audio-title">Sons da vila</h2>
      <p>Escolha o que quer ouvir durante a sua visita.</p>
      <label className="audio-master"><span>Som geral<small>Silencia tudo sem mudar suas escolhas.</small></span><input type="checkbox" checked={settings.master} onChange={e => onChange({ ...settings, master: e.target.checked })} /></label>
      <div className="audio-bulk"><button onClick={() => onChange(Object.fromEntries(Object.keys(DEFAULT_AUDIO).map(key => [key, true])))}>Ativar tudo</button><button onClick={() => onChange(Object.fromEntries(Object.keys(DEFAULT_AUDIO).map(key => [key, false])))}>Desativar tudo</button></div>
      <fieldset><legend>Categorias de áudio</legend>{AUDIO_CHANNELS.map(([key, label, description]) => <label className="audio-channel" key={key}><span>{label}<small>{description}</small></span><input type="checkbox" checked={settings[key]} onChange={e => onChange({ ...settings, [key]: e.target.checked })} /></label>)}</fieldset>
      <p className="audio-panel-note">{!settings.master ? 'Som geral desligado. Você pode preparar suas escolhas e ativá-lo quando quiser.' : 'As mudanças são aplicadas na hora. Narrações começam pelos controles de cada seção.'}</p>
      {notice && <p className="audio-panel-notice" role="status">{notice}</p>}
    </section>
  </div>;
}
