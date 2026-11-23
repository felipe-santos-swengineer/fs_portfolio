import { render, screen, fireEvent } from '@testing-library/react';
import PirateDialogue from './PirateDialogue';
import dialogue from './ruinsPirate.json';
import { RUINS_PIRATE_VOICES } from '../audio/ruinsPirateVoices';

test('the shipwrecked pirate explains his situation and gives a clue', () => {
  const next=jest.fn(),speak=jest.fn(),close=jest.fn();
  const {rerender}=render(<PirateDialogue language="pt-BR" line={0} voiceEnabled onNext={next} onSpeak={speak} onClose={close}/>);
  expect(screen.getByText(dialogue['pt-BR'][0])).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Ouvir mensagem'}));expect(speak).toHaveBeenCalledWith(0);
  fireEvent.click(screen.getByRole('button',{name:/Outra mensagem/}));expect(next).toHaveBeenCalled();
  rerender(<PirateDialogue language="pt-BR" line={1} voiceEnabled={false} onNext={next} onClose={close}/>);
  expect(screen.getByText(dialogue['pt-BR'][1])).toBeTruthy();
  expect(screen.getByRole('button',{name:'Ouvir mensagem'}).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Encerrar conversa'}));expect(close).toHaveBeenCalled();
});

test('both languages have voice clips matching the pirate dialogue', () => {
  for(const locale of ['pt-BR','en-US']) {
    expect(RUINS_PIRATE_VOICES[locale].clips.map(clip=>clip.text)).toEqual(dialogue[locale]);
    expect(RUINS_PIRATE_VOICES[locale].clips.every(clip=>clip.src)).toBe(true);
  }
});
