"""Generate an original, seamless atmospheric loop for the Elder's village."""
from pathlib import Path
import wave
import numpy as np

rate=24000
duration=48
size=rate*duration
t=np.arange(size,dtype=np.float64)/rate
rng=np.random.default_rng(27)
signal=np.zeros(size,dtype=np.float64)
# Every oscillator completes an integer number of cycles over the loop.
def tone(f):
    return np.sin(2*np.pi*(round(f*duration)/duration)*t)
# A slow drone and dissonant, breathing upper harmonics.
signal += .13*tone(55)*(0.72+0.28*np.cos(2*np.pi*t/24))
signal += .045*tone(82.5)*(0.65+0.35*np.cos(2*np.pi*t/16+.5))
signal += .025*tone(111)*(0.55+0.45*np.cos(2*np.pi*t/12+1))
signal += .02*tone(164.81)*(0.5+0.5*np.cos(2*np.pi*t/24+2))
# Slow bells with long decays; wrapping their envelopes makes the loop continuous.
for start,freq in [(2,220),(9,261.63),(17,196),(27,233.08),(35,174.61),(42,196)]:
    elapsed=(t-start)%duration
    env=np.exp(-elapsed/2.7)*(1-np.exp(-elapsed*7))
    signal += .095*env*(tone(freq)+.24*tone(freq*2.01)+.08*tone(freq*3.02))
# Soft periodic noise is filtered in the frequency domain to sound like distant wind.
noise=rng.normal(size=size)
freqs=np.fft.rfftfreq(size,1/rate)
noise=np.fft.irfft(np.fft.rfft(noise)*np.exp(-(freqs/180)**2),n=size)
noise/=max(np.max(np.abs(noise)),1e-9)
signal += .025*noise*(.55+.45*np.cos(2*np.pi*t/16+.8))
signal=np.tanh(signal*1.3)*.8
pcm=np.asarray(np.clip(signal,-1,1)*32767,dtype='<i2')
out=Path('src/assets/audio/music/temple-mystery.wav');out.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(out),'wb') as f:
    f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(pcm.tobytes())
print(f'{out}: {duration}s, {rate}Hz')
