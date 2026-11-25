export default function TouchInteract({ language, scene, onInteract, disabled }) {
  const interact = () => {
    if (onInteract) {
      onInteract();
      return;
    }
    const canvas = scene.current?.querySelector('canvas');
    if (!canvas) return;
    canvas.focus({ preventScroll: true });
    // A nearby NPC consumes F. Otherwise let the scene handle E.
    for (const key of ['f', 'e']) {
      const options = { key, code: 'Key' + key.toUpperCase(), bubbles: true, cancelable: true };
      const handled = !canvas.dispatchEvent(new KeyboardEvent('keydown', options));
      canvas.dispatchEvent(new KeyboardEvent('keyup', options));
      if (handled) break;
    }
  };
  return <button type="button" className="touch-interact" onClick={interact} disabled={disabled}>
    {language === 'en-US' ? 'Interact' : 'Interagir'}
  </button>;
}
