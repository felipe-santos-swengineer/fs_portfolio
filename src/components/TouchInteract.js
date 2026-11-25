export default function TouchInteract({ language, scene, onInteract, disabled }) {
  const interact = () => {
    if (onInteract) {
      onInteract();
      return;
    }
    const canvas = scene.current?.querySelector('canvas');
    if (!canvas) return;
    canvas.focus({ preventScroll: true });
    const options = { key: 'e', code: 'KeyE', bubbles: true, cancelable: true };
    canvas.dispatchEvent(new KeyboardEvent('keydown', options));
    canvas.dispatchEvent(new KeyboardEvent('keyup', options));
  };
  return <button type="button" className="touch-interact" onClick={interact} disabled={disabled}>
    {language === 'en-US' ? 'Interact' : 'Interagir'}
  </button>;
}
