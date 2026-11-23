import { DRAGON_SCENE_DURATION, dragonSceneLineAt } from './dragonScene';
import dialogue from './dragonDialogue.json';
import * as THREE from 'three';
import { createElderDragon } from './ElderDragon';
import { DRAGON_VOICES } from '../audio/dragonVoices';

test('the encounter wakes the dragon before speaking in the selected language', () => {
  expect(dragonSceneLineAt(0)).toBe(-1);
  expect(dragonSceneLineAt(5.9)).toBe(-1);
  expect(dragonSceneLineAt(6)).toBe(0);
  expect(dragonSceneLineAt(13)).toBe(1);
  expect(dragonSceneLineAt(20)).toBe(2);
  expect(DRAGON_SCENE_DURATION).toBeGreaterThan(27);
  expect(dialogue['pt-BR']).toHaveLength(3);
  expect(dialogue['en-US']).toHaveLength(3);
});


test('the Elder has articulated head, jaw, wings and local voices', () => {
  const scene=new THREE.Scene(),dragon=createElderDragon(scene);
  expect(scene.children).toContain(dragon.group);
  expect(dragon.head.parent).toBe(dragon.body);
  expect(dragon.jaw.parent).toBe(dragon.head);
  expect(dragon.wings).toHaveLength(2);
  expect(dragon.tail.length).toBeGreaterThan(3);
  for(const locale of ['pt-BR','en-US']) {
    expect(DRAGON_VOICES[locale].clips.map(c=>c.text)).toEqual(dialogue[locale]);
    expect(DRAGON_VOICES[locale].clips.every(c=>c.src.includes(locale==='en-US'?'finevoice':'elevenlabs'))).toBe(true);
  }
});
