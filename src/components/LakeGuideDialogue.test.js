import { render, screen, fireEvent } from '@testing-library/react';
import LakeGuideDialogue from './LakeGuideDialogue';
import { LAKE_GUIDE_VOICES } from '../audio/lakeGuideVoices';
import dialogue from './lakeGuide.json';

test('the guide uses the village dialogue controls and alternates messages', () => {
  const speak=jest.fn(), next=jest.fn(), close=jest.fn();
  const {rerender}=render(<LakeGuideDialogue language="pt-BR" line={0} voiceEnabled onSpeak={speak} onNext={next} onClose={close}/>);
  expect(screen.getByText(dialogue['pt-BR'][0])).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Ouvir mensagem'})); expect(speak).toHaveBeenCalledWith(0);
  fireEvent.click(screen.getByRole('button',{name:/Outra mensagem/})); expect(next).toHaveBeenCalled();
  rerender(<LakeGuideDialogue language="pt-BR" line={1} voiceEnabled={false} onNext={next} onClose={close}/>);
  expect(screen.getByText(dialogue['pt-BR'][1])).toBeTruthy();
  expect(screen.getByRole('button',{name:'Ouvir mensagem'}).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Encerrar conversa'})); expect(close).toHaveBeenCalled();
});

test('each message has a matching recording in both languages', () => {
  for(const locale of ['pt-BR','en-US']) {
    expect(LAKE_GUIDE_VOICES[locale].clips.map(clip=>clip.text)).toEqual(dialogue[locale]);
    expect(LAKE_GUIDE_VOICES[locale].clips.every(clip=>clip.src)).toBe(true);
  }
});
