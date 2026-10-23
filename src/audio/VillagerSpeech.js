// Neural performances are generated ahead of time, then served as local MP3s.
// Never fall back to an arbitrary system voice or distort pitch/playback speed.
export default class VillagerSpeech {
  constructor() { this.audio = null; this.finish = null; }
  supported() { return typeof window.Audio === 'function'; }
  get playing() { return Boolean(this.audio); }

  speak(text, profile, onDone = () => {}) {
    this.stop();
    const clip = profile?.clips?.find(entry => entry.text === text);
    if (!this.supported() || !clip?.src) { onDone(false); return false; }
    const audio = new window.Audio(clip.src);
    audio.preload = 'auto'; audio.volume = .85;
    this.audio = audio; this.finish = onDone;
    const done = success => {
      if (this.audio !== audio) return;
      audio.onended = null; audio.onerror = null;
      this.audio = null; this.finish = null; onDone(success);
    };
    audio.onended = () => done(true); audio.onerror = () => done(false);
    try { audio.play().catch(() => done(false)); return true; } catch { done(false); return false; }
  }

  stop() {
    const audio = this.audio;
    if (!audio) return;
    audio.onended = null; audio.onerror = null;
    this.audio = null;
    const finish = this.finish; this.finish = null;
    audio.pause(); finish?.(true);
  }
}
