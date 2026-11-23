import { forwardRef } from 'react';
import lakeGuide from './lakeGuide.json';

const LakeGuideDialogue = forwardRef(function LakeGuideDialogue({language, line, speaking, voiceEnabled, voiceNotice, onSpeak, onStop, onNext, onClose}, ref) {
  const en=language==='en-US';
  return <section className="npc-dialogue lake-guide-dialogue" aria-label={en ? 'Conversation with Marina' : 'Conversa com Marina'} tabIndex={-1} ref={ref}>
    <div className="npc-dialogue-heading"><span className="npc-avatar" style={{background:'#608679'}}>M</span><div><h2>Marina</h2><small>{en ? 'Lake keeper' : 'Guardiã do lago'}</small></div><button onClick={onClose} aria-label={en ? 'End conversation' : 'Encerrar conversa'}>×</button></div>
    <p aria-live="polite">{lakeGuide[en ? 'en-US' : 'pt-BR'][line]}</p>
    <div className="npc-dialogue-actions"><button disabled={!voiceEnabled} onClick={()=>speaking ? onStop?.() : onSpeak?.(line)}>{speaking ? (en ? 'Stop voice' : 'Parar voz') : (en ? 'Listen' : 'Ouvir mensagem')}</button><button onClick={onNext}>{en ? 'Next message' : 'Outra mensagem'} &#8599;</button></div>
    <small className="npc-voice-note">{voiceNotice || (!voiceEnabled ? (en ? 'Enable NPC voices in audio settings.' : 'Ative as vozes dos NPCs nas configurações de áudio.') : (en ? 'American English voice' : 'Voz feminina · calma e acolhedora'))}</small>
  </section>;
});
export default LakeGuideDialogue;
