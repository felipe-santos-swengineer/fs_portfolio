import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import './VillageParchment.css';

export default function VillageParchment({
  panel, caption, controls, closeLabel, suspended, closing, reduceMotion,
  onClose, onClosed, onControl, children,
}) {
  const progress = useMotionValue(reduceMotion ? 1 : 0);
  const [unrolled, setUnrolled] = useState(reduceMotion);
  const fold = useTransform(progress, value => `${Math.max(0, (1 - value) * 50)}%`);
  const curl = useTransform(progress, value => 1.36 - value * .36);
  const shadow = useTransform(progress, value => .48 - value * .27);

  useEffect(() => {
    const target = closing ? 0 : 1;
    if (reduceMotion) {
      progress.set(target);
      if (closing) onClosed();
      else setUnrolled(true);
      return;
    }
    const openingFromRest = !closing && progress.get() === 0;
    const playback = animate(progress, openingFromRest ? [0, 1, .992, 1] : target, {
      duration: closing ? .68 : .9,
      ease: closing ? [.55, .06, .74, .46] : [.21, .64, .24, 1],
      onComplete: closing ? onClosed : () => setUnrolled(true),
      ...(openingFromRest ? { times: [0, .83, .93, 1] } : {}),
    });
    return () => playback.stop();
  }, [closing, onClosed, progress, reduceMotion]);

  return (
    <div className="modal-backdrop parchment-backdrop" inert={suspended || undefined}
      aria-hidden={suspended || undefined} data-closing={closing || undefined}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.article className="village-parchment" ref={panel} tabIndex={-1}
        role="dialog" aria-modal="true" aria-labelledby="dialog-title"
        style={{ '--parchment-fold': fold, '--parchment-curl': curl, '--parchment-shadow': shadow }}>
        <div className="parchment-window" data-unrolled={(unrolled && !closing) || undefined} inert={closing || undefined}
          onClickCapture={event => {
            if (event.target.closest('button:not([disabled]), summary, a[href], audio[controls]')) onControl();
          }}>
          <div className="parchment-paper">
            <div className="parchment-header">
              <span className="eyebrow">{caption}</span>
              <div className="parchment-actions">
                <button type="button" className="parchment-seal" onClick={onClose} aria-label={closeLabel}>
                  <X size={23} aria-hidden="true" />
                </button>
                {controls}
              </div>
            </div>
            <div className="parchment-scroll" tabIndex={0}>
              {children}
            </div>
          </div>
        </div>
        <div className="parchment-roll parchment-roll-top" aria-hidden="true"><i /></div>
        <div className="parchment-roll parchment-roll-bottom" aria-hidden="true"><i /></div>
      </motion.article>
    </div>
  );
}
