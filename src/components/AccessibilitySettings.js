import { useEffect, useRef, useState } from 'react';
import { Accessibility, X } from 'lucide-react';
import useModalFocus from './useModalFocus';

export const DEFAULT_ACCESSIBILITY = { textSize: 'standard', highContrast: false, simpleFont: false, motion: 'system', pauseScene: false, readingMode: false };
export function loadAccessibilitySettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('village-accessibility') || '{}'), result = { ...DEFAULT_ACCESSIBILITY };
    for (const key of ['highContrast', 'simpleFont', 'pauseScene', 'readingMode']) if (typeof stored?.[key] === 'boolean') result[key] = stored[key];
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

export default function AccessibilitySettings({ settings, onChange, onClose }) {
  const panel = useRef(null); useModalFocus(panel, onClose);
  const toggle = key => onChange({ ...settings, [key]: !settings[key] });
  return <div className="modal-backdrop audio-panel-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="audio-panel accessibility-panel" role="dialog" aria-modal="true" aria-labelledby="accessibility-title" tabIndex={-1} ref={panel}>
      <button className="close" onClick={onClose} aria-label="Fechar acessibilidade"><X size={22} /></button>
      <span className="eyebrow"><Accessibility size={18} /> AJUSTES PARA SUA VISITA</span><h2 id="accessibility-title">Acessibilidade</h2>
      <p>Suas preferências ficam salvas neste navegador.</p>
      <label className="accessibility-select">Tamanho do texto<select value={settings.textSize} onChange={e => onChange({ ...settings, textSize: e.target.value })}><option value="standard">Padrão</option><option value="large">Ampliado</option><option value="xlarge">Muito ampliado</option></select></label>
      <label className="audio-channel"><span>Alto contraste<small>Texto claro e controles com bordas mais visíveis.</small></span><input type="checkbox" checked={settings.highContrast} onChange={() => toggle('highContrast')} /></label>
      <label className="audio-channel"><span>Fonte simples<small>Usa letras sem serifa também nos títulos.</small></span><input type="checkbox" checked={settings.simpleFont} onChange={() => toggle('simpleFont')} /></label>
      <label className="accessibility-select">Movimentos extras<select value={settings.motion} onChange={e => onChange({ ...settings, motion: e.target.value })}><option value="system">Respeitar preferência do sistema</option><option value="reduce">Reduzir movimentos</option></select></label>
      <label className="audio-channel"><span>Pausar animações do cenário<small>Interrompe moradores, dragão, céu e efeitos. Você ainda pode caminhar e girar a câmera.</small></span><input type="checkbox" checked={settings.pauseScene} onChange={() => toggle('pauseScene')} /></label>
      <label className="audio-channel"><span>Modo leitura sem 3D<small>Acesse todas as seções e as mensagens dos moradores em texto.</small></span><input type="checkbox" checked={settings.readingMode} onChange={() => toggle('readingMode')} /></label>
      <p className="audio-panel-note">Use Tab e Shift + Tab para navegar, Enter para ativar botões e Escape para fechar janelas. O áudio é opcional e tem seu próprio painel.</p>
      <button className="restore-accessibility" onClick={() => onChange({ ...DEFAULT_ACCESSIBILITY })}>Restaurar preferências de acessibilidade</button>
    </section>
  </div>;
}
