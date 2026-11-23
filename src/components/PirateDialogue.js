import { forwardRef } from 'react';
import dialogue from './ruinsPirate.json';

const PirateDialogue=forwardRef(function PirateDialogue({language,line,speaking,voiceEnabled,voiceNotice,onSpeak,onStop,onNext,onClose},ref){
  const en=language==='en-US';
  return <section className="npc-dialogue ruins-pirate-dialogue" aria-label={en?'Conversation with Duarte':'Conversa com Duarte'} tabIndex={-1} ref={ref}>
    <div className="npc-dialogue-heading"><span className="npc-avatar" style={{background:'#765a48'}}>D</span><div><h2>Duarte</h2><small>{en?'Shipwrecked pirate':'Pirata náufrago'}</small></div><button onClick={onClose} aria-label={en?'End conversation':'Encerrar conversa'}>×</button></div>
    <p aria-live="polite">{dialogue[en?'en-US':'pt-BR'][line]}</p>
    <div className="npc-dialogue-actions"><button disabled={!voiceEnabled} onClick={()=>speaking?onStop?.():onSpeak?.(line)}>{speaking?(en?'Stop voice':'Parar voz'):(en?'Listen':'Ouvir mensagem')}</button><button onClick={onNext}>{en?'Next message':'Outra mensagem'} &#8599;</button></div>
    <small className="npc-voice-note">{voiceNotice || (!voiceEnabled?(en?'Enable NPC voices in audio settings.':'Ative as vozes dos NPCs nas configurações de áudio.'):(en?'American English voice':'Voz masculina · calma e acolhedora'))}</small>
  </section>;
});
export default PirateDialogue;
