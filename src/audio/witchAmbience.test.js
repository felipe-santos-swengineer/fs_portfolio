import { nextWitchLaugh } from './witchAmbience';
import VillageAudio from './VillageAudio';

test('all four laughs can play without an immediate repeat', () => {
  expect([0,.25,.5,.75].map(n=>nextWitchLaugh(-1,()=>n))).toEqual([0,1,2,3]);
  for(let previous=0;previous<4;previous++)for(const n of [0,.34,.68,.99])expect(nextWitchLaugh(previous,()=>n)).not.toBe(previous);
});

test('ambient laughter is cancelled when effects are muted or the scene stops', async () => {
  jest.useFakeTimers();const engine=new VillageAudio(),sources=[];
  engine.enabled=true;engine.ready=jest.fn(()=>true);engine.master={};engine.context={state:'running',createBufferSource:()=>{const source={connect:jest.fn(),start:jest.fn(),stop:jest.fn(),disconnect:jest.fn()};sources.push(source);return source;},createGain:()=>({gain:{value:0},connect:jest.fn(),disconnect:jest.fn()})};
  engine.loadCastleSample=jest.fn().mockResolvedValue({duration:5});
  engine.startWitchAmbience();engine.startWitchAmbience();expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(3000);for(let i=0;i<12;i++)await Promise.resolve();
  expect(sources).toHaveLength(1);expect(sources[0].start).toHaveBeenCalled();
  engine.stopWitchAmbience();expect(sources[0].stop).toHaveBeenCalled();sources[0].onended();expect(jest.getTimerCount()).toBe(0);
  engine.setChannels({interactions:false});engine.startWitchAmbience();expect(jest.getTimerCount()).toBe(0);jest.useRealTimers();
});
