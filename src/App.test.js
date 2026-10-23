import { render, screen, fireEvent, within, act } from '@testing-library/react';
import App from './App';
import VillageAudio from './audio/VillageAudio';

jest.mock('./components/VillageScene', () => ({ __esModule: true, default: ({ onStep }) => <div data-testid="village-canvas"><button onClick={() => onStep('stone')}>Simular passo</button></div> }));
jest.mock('./audio/VillageAudio', () => jest.fn());

beforeEach(() => {
  localStorage.clear();
  VillageAudio.mockImplementation(() => ({ enable: jest.fn().mockResolvedValue(true), setChannels: jest.fn(), mute: jest.fn(), interact: jest.fn(), closeDoor: jest.fn(), step: jest.fn(), dispose: jest.fn() }));
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

async function start() { await act(async () => { render(<App />); }); }
function engine() { return VillageAudio.mock.results[VillageAudio.mock.results.length - 1].value; }
async function configure(action) {
  fireEvent.click(screen.getByRole('button', { name: 'Configurações de áudio' }));
  const panel = screen.getByRole('dialog', { name: 'Sons da vila' });
  await act(async () => { action(within(panel)); });
  fireEvent.click(within(panel).getByRole('button', { name: 'Fechar configurações de áudio' }));
}

test('os edifícios abrem as seções, registram a visita e fecham com Escape', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar: Sobre mim' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('heading', { name: 'Sobre mim' })).toBeTruthy();
  expect(dialog.textContent).toContain('Universidade Federal do Ceará');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('button', { name: 'Entrar: Sobre mim' }).textContent).toContain('EXPLORADO');
});

test('a oficina preserva os quatro projetos e suas imagens', async () => {
  await start(); fireEvent.click(screen.getByRole('button', { name: 'Entrar: Projetos' }));
  const dialog = screen.getByRole('dialog');
  for (const name of ['Talkdoor', 'Vitrine Funcap', 'Tetris para 2 jogadores', 'Chronos-UFC']) expect(within(dialog).getByRole('heading', { name })).toBeTruthy();
  expect(within(dialog).getAllByRole('img')).toHaveLength(18);
  expect(dialog.querySelectorAll('audio')).toHaveLength(1);
});

test('o modo leitura oferece todas as seções e quatro narrações sem caminhar', async () => {
  await start(); fireEvent.click(screen.getByRole('button', { name: 'Modo leitura' }));
  expect(screen.queryByLabelText('Vilarejo tridimensional do portfólio')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Contato' })).toBeTruthy();
  expect(document.querySelectorAll('audio[data-narration]')).toHaveLength(4);
  expect(screen.getByRole('link', { name: 'Enviar email ↗' }).getAttribute('href')).toBe('mailto:felipesantosswengineer@email.com');
});

test('as categorias são independentes e o controle geral preserva as escolhas', async () => {
  await start();
  await configure(p => fireEvent.click(p.getByRole('button', { name: 'Ativar tudo' })));
  await configure(p => { fireEvent.click(p.getByRole('checkbox', { name: /^Música ambiente/ })); fireEvent.click(p.getByRole('checkbox', { name: /^Passos/ })); });
  fireEvent.click(screen.getByRole('button', { name: 'Simular passo' })); expect(engine().step).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar: Projetos' })); expect(engine().interact).toHaveBeenCalledWith(2);
  fireEvent.keyDown(document, { key: 'Escape' });
  await configure(p => fireEvent.click(p.getByRole('checkbox', { name: /^Som geral/ })));
  await configure(p => {
    expect(p.getByRole('checkbox', { name: /^Música ambiente/ }).checked).toBe(false);
    expect(p.getByRole('checkbox', { name: /^Passos/ }).checked).toBe(false);
    expect(p.getByRole('checkbox', { name: /^Efeitos dos edifícios/ }).checked).toBe(true);
    fireEvent.click(p.getByRole('checkbox', { name: /^Som geral/ }));
  });
  expect(JSON.parse(localStorage.getItem('village-audio')).steps).toBe(false);
});

test('desativar tudo bloqueia passos, interações e novas narrações', async () => {
  await start(); await configure(p => fireEvent.click(p.getByRole('button', { name: 'Ativar tudo' })));
  await configure(p => fireEvent.click(p.getByRole('button', { name: 'Desativar tudo' })));
  fireEvent.click(screen.getByRole('button', { name: 'Simular passo' })); expect(engine().step).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar: Minha história' })); expect(engine().interact).not.toHaveBeenCalled();
  const narration = document.querySelector('audio[data-narration]');
  expect(narration.muted).toBe(true);
  fireEvent.play(narration); expect(narration.pause).toHaveBeenCalled();
});

test('o painel pode ser aberto dentro de uma seção para interromper sua narração', async () => {
  await start(); await configure(p => fireEvent.click(p.getByRole('button', { name: 'Ativar tudo' })));
  fireEvent.click(screen.getByRole('button', { name: 'Entrar: Projetos' }));
  const narration = document.querySelector('audio[data-narration]');
  Object.defineProperty(narration, 'paused', { configurable: true, value: false });
  fireEvent.click(screen.getByRole('button', { name: 'Configurar áudio' }));
  const panel = within(screen.getByRole('dialog', { name: 'Sons da vila' }));
  await act(async () => { fireEvent.click(panel.getByRole('checkbox', { name: /^Narrações das seções/ })); });
  expect(narration.muted).toBe(true); expect(narration.pause).toHaveBeenCalled();
  fireEvent.keyDown(panel.getByRole('button', { name: 'Fechar configurações de áudio' }), { key: 'Escape' });
  expect(screen.getByRole('dialog', { name: 'Projetos' })).toBeTruthy();
});

test('desligar as vozes interrompe o NPC sem desligar os outros canais', async () => {
  const previousAudio = window.Audio; const clips = [];
  window.Audio = jest.fn().mockImplementation(src => { const clip = { src, play: jest.fn().mockResolvedValue(), pause: jest.fn() }; clips.push(clip); return clip; });
  try {
    await start(); await configure(p => fireEvent.click(p.getByRole('button', { name: 'Ativar tudo' })));
    fireEvent.click(screen.getByRole('button', { name: 'Conversar com Bia' }));
    expect(clips[0].play).toHaveBeenCalledTimes(1);
    await configure(p => fireEvent.click(p.getByRole('checkbox', { name: /^Vozes dos NPCs/ })));
    expect(clips[0].pause).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Ouvir mensagem' }).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Simular passo' })); expect(engine().step).toHaveBeenCalledWith('stone');
  } finally { window.Audio = previousAudio; }
});
