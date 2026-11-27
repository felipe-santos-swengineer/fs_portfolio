import { nextWitchLaugh } from './witchAmbience';
import VillageAudio from './VillageAudio';
import witchIntroLaugh from '../assets/audio/effects/witch-dialogue/intro-laugh.mp3';
import witchLightningReaction from '../assets/audio/effects/witch-dialogue/lightning-reaction.mp3';

test('all four laughs can play without an immediate repeat', () => {
  expect([0,.25,.5,.75].map(n=>nextWitchLaugh(-1,()=>n))).toEqual([0,1,2,3]);
  for(let previous=0;previous<4;previous++)for(const n of [0,.34,.68,.99])expect(nextWitchLaugh(previous,()=>n)).not.toBe(previous);
});

test('ambient laughter is cancelled when effects are muted or the scene stops', async () => {
  jest.useFakeTimers();const engine=new VillageAudio(),sources=[];
  const gain = { value: 0, setValueAtTime: jest.fn(), linearRampToValueAtTime: jest.fn() };
  engine.enabled=true;engine.ready=jest.fn(()=>true);engine.master={};engine.context={state:'running',currentTime:0,createBufferSource:()=>{const source={connect:jest.fn(),start:jest.fn(),stop:jest.fn(),disconnect:jest.fn()};sources.push(source);return source;},createGain:()=>({gain,connect:jest.fn(),disconnect:jest.fn()})};
  engine.loadCastleSample=jest.fn().mockResolvedValue({duration:5});
  engine.startWitchAmbience();engine.startWitchAmbience();expect(jest.getTimerCount()).toBe(1);
  jest.advanceTimersByTime(3000);for(let i=0;i<12;i++)await Promise.resolve();
  expect(sources).toHaveLength(1);expect(sources[0].start).toHaveBeenCalled();
  engine.stopWitchAmbience();expect(sources[0].stop).toHaveBeenCalled();sources[0].onended();expect(jest.getTimerCount()).toBe(0);
  await engine.cursedCastle('witch-intro-laugh');
  expect(engine.loadCastleSample).toHaveBeenLastCalledWith(witchIntroLaugh);
  expect(sources).toHaveLength(2);
  expect(sources[1].start).toHaveBeenCalled();
  sources[1].onended();
  expect(jest.getTimerCount()).toBe(0);
  engine.dragon = jest.fn();
  for (let strike = 0; strike < 3; strike++) {
    const finished = jest.fn();
    await engine.cursedCastle('witch-lightning', finished);
    expect(engine.dragon).toHaveBeenLastCalledWith('impact');
    expect(engine.loadCastleSample).toHaveBeenLastCalledWith(witchLightningReaction);
    expect(sources[strike + 2].start).toHaveBeenCalledTimes(1);
    expect(sources[strike + 2].start).toHaveBeenCalledWith(0, 0, 3.4);
    expect(gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 3.4);
    expect(finished).not.toHaveBeenCalled();
    sources[strike + 2].onended();
    expect(finished).toHaveBeenCalledTimes(1);
  }
  const battleLaugh = jest.fn();
  await engine.cursedCastle('witch-battle-laugh', battleLaugh);
  jest.advanceTimersByTime(450);
  for(let i=0;i<12;i++)await Promise.resolve();
  expect(battleLaugh).toHaveBeenLastCalledWith(true);
  engine.stopWitchAmbience();
  expect(battleLaugh).toHaveBeenLastCalledWith(false);
  engine.setChannels({interactions:false});engine.startWitchAmbience();expect(jest.getTimerCount()).toBe(0);
  const muted = jest.fn();
  await engine.cursedCastle('witch-lightning', muted);
  expect(muted).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});
