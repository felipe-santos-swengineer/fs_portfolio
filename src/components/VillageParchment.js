import { useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import './VillageParchment.css';

const OPEN_DURATION = 900;
const CLOSE_DURATION = 680;
const rollStages = [
  { offset: 0, fold: 50, curl: 1.36, easing: 'cubic-bezier(.21, .64, .24, 1)' },
  { offset: .83, fold: 0, curl: 1 },
  { offset: .93, fold: .4, curl: 1.003 },
  { offset: 1, fold: 0, curl: 1 },
];
const paperFrames = rollStages.map(({ fold, offset, easing }) => ({
  offset, easing, clipPath: `inset(${fold}% -4px)`,
}));
const rollerFrames = direction => rollStages.map(({ fold, curl, offset, easing }) => ({
  offset, easing, transform: `translateY(${direction * fold}%) scaleY(${curl})`,
}));
const topFrames = rollerFrames(1);
const bottomFrames = rollerFrames(-1);

export default function VillageParchment({
  panel, caption, controls, closeLabel, suspended, closing, reduceMotion,
  onClose, onClosed, onControl, children,
}) {
  const paper = useRef(null);
  const topRoll = useRef(null);
  const bottomRoll = useRef(null);
  const elapsed = useRef(reduceMotion ? OPEN_DURATION : 0);
  const [unrolled, setUnrolled] = useState(reduceMotion);

  useLayoutEffect(() => {
    const target = closing ? 0 : OPEN_DURATION;
    if (reduceMotion || !paper.current.animate || elapsed.current === target) {
      elapsed.current = target;
      if (closing) onClosed();
      else setUnrolled(true);
      return;
    }
    const direction = closing ? -OPEN_DURATION / CLOSE_DURATION : 1;
    const animations = [
      [paper.current, paperFrames],
      [topRoll.current, topFrames],
      [bottomRoll.current, bottomFrames],
    ].map(([element, frames]) => {
      const animation = element.animate(frames, { duration: OPEN_DURATION, fill: 'both' });
      animation.playbackRate = direction;
      animation.currentTime = elapsed.current;
      return animation;
    });
    const [paperAnimation] = animations;
    let disposed = false;
    paperAnimation.finished.then(() => {
      if (disposed) return;
      elapsed.current = target;
      if (closing) onClosed();
      else {
        setUnrolled(true);
        animations.forEach(animation => animation.cancel());
      }
    }).catch(() => { /* The animation was interrupted or the dialog unmounted. */ });
    return () => {
      disposed = true;
      elapsed.current = paperAnimation.currentTime ?? elapsed.current;
      animations.forEach(animation => animation.cancel());
    };
  }, [closing, onClosed, reduceMotion]);

  return (
    <div className="modal-backdrop parchment-backdrop" inert={suspended || undefined}
      aria-hidden={suspended || undefined} data-closing={closing || undefined}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <article className="village-parchment" ref={panel} tabIndex={-1}
        role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="parchment-window" ref={paper}
          data-unrolled={(unrolled && !closing) || undefined} inert={closing || undefined}
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
        <div className="parchment-roll-track parchment-roll-track-top" aria-hidden="true" ref={topRoll}>
          <div className="parchment-roll parchment-roll-top"><i /></div>
        </div>
        <div className="parchment-roll-track parchment-roll-track-bottom" aria-hidden="true" ref={bottomRoll}>
          <div className="parchment-roll parchment-roll-bottom"><i /></div>
        </div>
      </article>
    </div>
  );
}
