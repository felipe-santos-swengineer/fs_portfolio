import * as THREE from 'three';
import { createMissionFireworks } from './MissionFireworks';

test('os quatro NPCs lançam fogos que sobem, se espalham e terminam rapidamente', () => {
  const effect = createMissionFireworks(new THREE.Scene());
  const origins = [{ x: 2, y: .2, z: 4 }, { x: -4, y: .2, z: 1 }, { x: 3, y: .2, z: -8 }, { x: -2, y: .2, z: 9 }];
  effect.start(origins);
  const positions = effect.points.geometry.attributes.position.array;
  expect(effect.active).toBe(true);
  expect(positions[0]).toBe(2); expect(positions[2]).toBe(4);
  const firstHeight = positions[1]; effect.update(.4); expect(positions[1]).toBeGreaterThan(firstHeight);
  effect.update(.8); expect(positions[4]).toBeGreaterThan(5);
  expect([...positions].every(Number.isFinite)).toBe(true);
  expect(effect.points.geometry.drawRange.count).toBe(196);
  effect.update(3); expect(effect.active).toBe(false); expect(effect.points.visible).toBe(false);
});

test('movimento reduzido troca os lançamentos por uma celebração estática curta', () => {
  const effect = createMissionFireworks(new THREE.Scene());
  effect.start([{ x: 0, y: .2, z: 3 }], true);
  const initial = [...effect.points.geometry.attributes.position.array];
  effect.update(.5); expect([...effect.points.geometry.attributes.position.array]).toEqual(initial);
  effect.update(2); expect(effect.active).toBe(false);
});

test('os sons acompanham os quatro lançamentos e explosões sem se repetir durante uma pausa', () => {
  const sound = jest.fn(); const effect = createMissionFireworks(new THREE.Scene(), sound);
  const origin = { x: 0, y: .2, z: 0 };
  effect.start([origin, origin, origin, origin]);
  expect(sound).toHaveBeenCalledWith('launch', 0);
  effect.update(0); expect(sound).toHaveBeenCalledTimes(1);
  effect.update(.5); expect(sound.mock.calls.filter(([stage]) => stage === 'launch')).toHaveLength(4);
  effect.update(.7); expect(sound.mock.calls.filter(([stage]) => stage === 'burst')).toHaveLength(4);
  effect.update(0); expect(sound).toHaveBeenCalledTimes(8);
  effect.stop(); effect.update(1); expect(sound).toHaveBeenCalledTimes(8);
  expect(effect.points.visible).toBe(false);
  effect.start([origin]); expect(sound).toHaveBeenCalledTimes(9);
});
