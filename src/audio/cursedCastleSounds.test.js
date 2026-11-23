import VillageAudio from './VillageAudio';

function setup() {
  const engine=new VillageAudio(),started=[];
  engine.context={ state:'running', currentTime:10, createBufferSource:()=>({connect:jest.fn(),start:jest.fn(),stop:jest.fn(),disconnect:jest.fn()}),createGain:()=>({gain:{value:0},connect:jest.fn(),disconnect:jest.fn()}) };
  engine.enabled=true;engine.master={};engine.loadCastleSample=jest.fn().mockResolvedValue({duration:1});
  engine.track=jest.fn((source,nodes,start,duration)=>{source.villageEffect=engine.effectType;engine.sources.add(source);started.push({source,start,duration});});
  return {engine,started};
}

test('the gate and staggered soldier voices use the effects channel', async () => {
  const {engine,started}=setup();await engine.cursedCastle('gate');
  expect(started).toHaveLength(5);
  expect(started.map(item=>item.start)).toEqual([10,10.72,10.25,10.65,11.05]);
  expect(engine.channel).toBe('interactions');
  engine.cursedCastle('stop');started.forEach(({source})=>expect(source.stop).toHaveBeenCalled());
});

test('muting effects before samples finish prevents late playback', async () => {
  const {engine,started}=setup();let resolve;
  const sample=new Promise(r=>{resolve=r;});engine.loadCastleSample=jest.fn(()=>sample);
  const pending=engine.cursedCastle('gate');engine.setChannels({interactions:false});
  resolve({duration:1});await pending;
  expect(started).toHaveLength(0);expect(engine.castleEffectRevision).toBeGreaterThan(1);
});
