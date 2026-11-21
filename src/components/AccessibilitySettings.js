import { useEffect, useRef, useState } from 'react';
import { Accessibility, X } from 'lucide-react';
import useModalFocus from './useModalFocus';

export const DEFAULT_ACCESSIBILITY = { textSize: 'standard', highContrast: false, simpleFont: false, motion: 'system', pauseScene: false, weatherEffects: true, readingMode: false };
export function loadAccessibilitySettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('village-accessibility') || '{}'), result = { ...DEFAULT_ACCESSIBILITY };
    for (const key of ['highContrast', 'simpleFont', 'pauseScene', 'weatherEffects', 'readingMode']) if (typeof stored?.[key] === 'boolean') result[key] = stored[key];
    if (['standard', 'large', 'xlarge'].includes(stored?.textSize)) result.textSize = stored.textSize;
    if (['system', 'reduce'].includes(stored?.motion)) result.motion = stored.motion;
    return result;
  } catch { return { ...DEFAULT_ACCESSIBILITY }; }
}

export function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(() => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return;
    const update = () => setReduced(query.matches); update();
    query.addEventListener?.('change', update); return () => query.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

export default function AccessibilitySettings({ settings, onChange, onClose, language = 'pt-BR' }) {
  const en = language === 'en-US';
  const panel = useRef(null); useModalFocus(panel, onClose);
  const toggle = key => onChange({ ...settings, [key]: !settings[key] });
  return <div className="modal-backdrop audio-panel-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="audio-panel accessibility-panel" role="dialog" aria-modal="true" aria-labelledby="accessibility-title" tabIndex={-1} ref={panel}>
      <button className="close" onClick={onClose} aria-label={en ? 'Close accessibility settings' : 'Fechar acessibilidade'}><X size={22} /></button>
      <span className="eyebrow"><Accessibility size={18} /> {en ? 'VISIT SETTINGS' : 'AJUSTES PARA SUA VISITA'}</span><h2 id="accessibility-title">{en ? 'Accessibility' : 'Acessibilidade'}</h2>
      <p>{en ? 'Your preferences are saved in this browser.' : 'Suas preferências ficam salvas neste navegador.'}</p>
      <label className="accessibility-select">{en ? 'Text size' : 'Tamanho do texto'}<select value={settings.textSize} onChange={e => onChange({ ...settings, textSize: e.target.value })}><option value="standard">{en ? 'Standard' : 'Padrão'}</option><option value="large">{en ? 'Large' : 'Ampliado'}</option><option value="xlarge">{en ? 'Extra large' : 'Muito ampliado'}</option></select></label>
      <label className="audio-channel"><span>{en ? 'High contrast' : 'Alto contraste'}<small>{en ? 'Brighter text and more visible control borders.' : 'Texto claro e controles com bordas mais visíveis.'}</small></span><input type="checkbox" checked={settings.highContrast} onChange={() => toggle('highContrast')} /></label>
      <label className="audio-channel"><span>{en ? 'Simple font' : 'Fonte simples'}<small>{en ? 'Use a sans-serif font for headings too.' : 'Usa letras sem serifa também nos títulos.'}</small></span><input type="checkbox" checked={settings.simpleFont} onChange={() => toggle('simpleFont')} /></label>
      <label className="accessibility-select">{en ? 'Extra motion' : 'Movimentos extras'}<select value={settings.motion} onChange={e => onChange({ ...settings, motion: e.target.value })}><option value="system">{en ? 'Follow system settings' : 'Respeitar preferência do sistema'}</option><option value="reduce">{en ? 'Reduce motion' : 'Reduzir movimentos'}</option></select></label>
      <label className="audio-channel"><span>{en ? 'Pause scene animations' : 'Pausar animações do cenário'}<small>{en ? 'Pause villagers, dragon, sky and effects. You can still move and turn the camera.' : 'Interrompe moradores, dragão, céu e efeitos. Você ainda pode caminhar e girar a câmera.'}</small></span><input type="checkbox" checked={settings.pauseScene} onChange={() => toggle('pauseScene')} /></label>
      <label className="audio-channel"><span>{en ? 'Weather effects' : 'Efeitos climáticos'}<small>{en ? 'Show rain and snow in the village.' : 'Exibe chuva e neve na vila.'}</small></span><input type="checkbox" checked={settings.weatherEffects} onChange={() => toggle('weatherEffects')} /></label>
      <label className="audio-channel"><span>{en ? 'Reading mode without 3D' : 'Modo leitura sem 3D'}<small>{en ? 'Read all sections and villager messages.' : 'Acesse todas as seções e as mensagens dos moradores em texto.'}</small></span><input type="checkbox" checked={settings.readingMode} onChange={() => toggle('readingMode')} /></label>
      <p className="audio-panel-note">{en ? 'Use Tab and Shift + Tab to navigate, Enter to activate buttons and Escape to close windows. Audio has its own settings.' : 'Use Tab e Shift + Tab para navegar, Enter para ativar botões e Escape para fechar janelas. O áudio é opcional e tem seu próprio painel.'}</p>
      <button className="restore-accessibility" onClick={() => onChange({ ...DEFAULT_ACCESSIBILITY })}>{en ? 'Restore accessibility defaults' : 'Restaurar preferências de acessibilidade'}</button>
    </section>
  </div>;
}
