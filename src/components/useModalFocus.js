import { useEffect, useRef } from 'react';

export default function useModalFocus(panel, onClose, active = true) {
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    if (!active || !panel.current) return;
    const previous = document.activeElement, root = panel.current;
    const items = () => [...root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),audio[controls],[tabindex="0"]')].filter(el => !el.closest('[hidden],[inert]'));
    const first = () => (items()[0] || root).focus();
    first();
    const keyboard = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current(); }
      if (e.key === 'Tab') {
        const list = items();
        if (!list.length) { e.preventDefault(); root.focus(); }
        else if (e.shiftKey && document.activeElement === list[0]) { e.preventDefault(); list[list.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === list[list.length - 1]) { e.preventDefault(); list[0].focus(); }
      }
    };
    const keepFocus = e => { if (!root.contains(e.target)) first(); };
    document.addEventListener('keydown', keyboard); document.addEventListener('focusin', keepFocus);
    const oldOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', keyboard); document.removeEventListener('focusin', keepFocus); document.body.style.overflow = oldOverflow;
      if (previous?.isConnected && !previous.closest('[inert]')) previous.focus();
    };
  }, [panel, active]);
}
