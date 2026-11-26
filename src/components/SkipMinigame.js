export default function SkipMinigame({en,disabled,onSkip}) {
  return <div className="npc-dialogue-actions omega-skip-actions">
    <button type="button" disabled={disabled} onClick={onSkip}>{en?'Skip minigame':'Pular minigame'}</button>
  </div>;
}
