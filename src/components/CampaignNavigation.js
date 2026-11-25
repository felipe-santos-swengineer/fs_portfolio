import './Lake.css';

export default function CampaignNavigation({ language, onOpen, paused, hidden }) {
  const label = language === 'en-US' ? 'Open campaign portal' : 'Abrir portal da campanha';
  return <div className="campaign-navigation" hidden={hidden}>
    <button type="button" className="lake-exit" aria-label={label} title={label} aria-haspopup="dialog" disabled={paused} onClick={onOpen}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <ellipse cx="12" cy="11" rx="7.5" ry="9" /><ellipse cx="12" cy="11" rx="4" ry="6" /><path d="M4 22h16" />
      </svg>
    </button>
  </div>;
}
