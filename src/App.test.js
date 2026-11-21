import { render, screen, fireEvent, within, act } from '@testing-library/react';
import App from './App';
import VillageAudio from './audio/VillageAudio';

jest.mock('./components/VillageScene', () => ({ __esModule: true, default: ({ onStep, onTalk, onOpen, zoom, missionRound, weatherMode }) => <div data-testid="village-canvas" data-weather={weatherMode} data-zoom={zoom} data-round={missionRound}><button onClick={() => onStep('stone')}>Simular passo</button><button onClick={() => onOpen(5)}>Simular entrada no castelo</button><button onClick={() => onOpen(4)}>Simular entrada no portal</button><button onClick={() => onOpen(6)}>Simular vitrine do mercado</button><button onClick={() => onOpen(7)}>Simular alimentos</button><button onClick={() => onOpen(8)}>Simular pocoes</button><button onClick={() => onTalk(0)}>Conversar com Bia</button></div> }));
jest.mock('./audio/VillageAudio', () => jest.fn());
jest.mock('./assets/audio/village-bards-tale.mp3', () => 'village-track.mp3');
jest.mock('./assets/audio/castle-kings-feast.mp3', () => 'castle-track.mp3');
jest.mock('./assets/audio/dungeon.wav', () => 'dungeon-track.wav');
jest.mock('./components/ThroneHall', () => ({ __esModule: true, default: ({ onExit }) => <button onClick={onExit}>Sair do salao de teste</button> }));
jest.mock('./components/Dungeon', () => ({ __esModule: true, default: ({ onExit }) => <button onClick={onExit}>Sair do calabouco de teste</button> }));

beforeEach(() => {
  localStorage.clear();
  VillageAudio.mockImplementation(() => ({ enable: jest.fn().mockResolvedValue(true), setChannels: jest.fn(), mute: jest.fn(), interact: jest.fn(), closeDoor: jest.fn(), step: jest.fn(), firework: jest.fn(), stopFireworks: jest.fn(), dispose: jest.fn() }));
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

test('concluir os quatro destinos substitui a missão por Recomeçar e reinicia o progresso', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Aproximar' }));
  const originalScene = screen.getByTestId('village-canvas');
  const zoom = originalScene.getAttribute('data-zoom');
  for (const section of ['Minha história', 'Sobre mim', 'Projetos', 'Contato']) {
    fireEvent.click(screen.getByRole('button', { name: `Entrar: ${section}` }));
    fireEvent.keyDown(document, { key: 'Escape' });
  }
  expect(screen.queryByText('SUA MISSÃO')).toBeNull();
  expect(screen.getByText('JORNADA CONCLUÍDA')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Recomeçar' }));
  expect(screen.getByText('SUA MISSÃO')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Recomeçar' })).toBeNull();
  expect(screen.queryAllByText(/EXPLORADO/)).toHaveLength(0);
  expect(screen.getByTestId('village-canvas')).toBe(originalScene);
  expect(originalScene.getAttribute('data-zoom')).toBe(zoom);
  expect(originalScene.getAttribute('data-round')).toBe('1');
  expect(engine().stopFireworks).toHaveBeenCalledTimes(1);
});

test('o castelo abre o salao e permite voltar sem registrar uma visita extra', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no castelo' }));
  const exit = await screen.findByRole('button', { name: 'Sair do salao de teste' });
  fireEvent.click(exit);
  expect(screen.queryByRole('button', { name: 'Sair do salao de teste' })).toBeNull();
  expect(screen.getByRole('progressbar', { name: 'Destinos explorados' }).getAttribute('aria-valuenow')).toBe('0');
});

test('a vitrine do mercado apresenta tecnologias sem alterar a missao', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular vitrine do mercado' }));
  const dialog = screen.getByRole('dialog', { name: 'Tecnologias' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Back-end e APIs' }));
  expect(within(dialog).getByRole('status').textContent).toMatch(/Node.js.*Laravel/);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('progressbar', { name: 'Destinos explorados' }).getAttribute('aria-valuenow')).toBe('0');
});

test('as outras barracas abrem experiências e formação', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular alimentos' }));
  let dialog = screen.getByRole('dialog', { name: 'Experiência profissional' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'FUNCAP' }));
  expect(within(dialog).getByRole('status').textContent).toMatch(/PostgreSQL/);
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Simular pocoes' }));
  dialog = screen.getByRole('dialog', { name: 'Formação e cursos' });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Engenharia de Software' }));
  expect(within(dialog).getByRole('status').textContent).toMatch(/Universidade Federal do Ceará/);
});


test('a musica acompanha a entrada e a saida do castelo', async () => {
  await start();
  const background = document.querySelector('audio[loop]');
  expect(background.getAttribute('src')).toBe('village-track.mp3');
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no castelo' }));
  expect(background.getAttribute('src')).toBe('castle-track.mp3');
  fireEvent.click(await screen.findByRole('button', { name: 'Sair do salao de teste' }));
  expect(background.getAttribute('src')).toBe('village-track.mp3');
});


test.each([
  ['Simular entrada no castelo', 'Sair do salao de teste'],
  ['Simular entrada no portal', 'Sair do calabouco de teste'],
])('modo leitura funciona em %s e permite retornar ao cenario', async (entrance, exit) => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: entrance }));
  expect(await screen.findByRole('button', { name: exit })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Modo leitura' }));
  expect(screen.getByRole('navigation', { name: 'Se\u00e7\u00f5es do portf\u00f3lio' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: exit })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Modo 3D' }));
  expect(screen.getByRole('button', { name: exit })).toBeTruthy();
});

test('configuracoes de acessibilidade permitem abrir leitura dentro do castelo', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no castelo' }));
  await screen.findByRole('button', { name: 'Sair do salao de teste' });
  fireEvent.click(screen.getByRole('button', { name: 'Abrir acessibilidade' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /^Modo leitura sem 3D/ }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('navigation', { name: 'Se\u00e7\u00f5es do portf\u00f3lio' })).toBeTruthy();
});


test('o menu do modo leitura pode ser recolhido e reaberto', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Modo leitura' }));
  const menu = within(screen.getByRole('navigation', { name: 'Se\u00e7\u00f5es do portf\u00f3lio' }));
  const collapse = menu.getByRole('button', { name: 'Recolher menu' });
  expect(collapse.getAttribute('aria-expanded')).toBe('true');
  expect(menu.getByRole('link', { name: 'Projetos' })).toBeTruthy();
  fireEvent.click(collapse);
  expect(menu.queryByRole('link', { name: 'Projetos' })).toBeNull();
  const expand = menu.getByRole('button', { name: 'Abrir menu' });
  expect(expand.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(expand);
  expect(menu.getByRole('link', { name: 'Projetos' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Modo 3D' })).toBeTruthy();
});


test('a troca de idioma persiste e apresenta conteudo e vozes em ingles', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'English (United States)' }));
  expect(localStorage.getItem('village-language')).toBe('en-US');
  expect(screen.getByRole('button', { name: 'English (United States)' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Portugu\u00eas (Brasil)' }).getAttribute('aria-pressed')).toBe('false');
  expect(document.documentElement.lang).toBe('en-US');
  fireEvent.click(screen.getByRole('button', { name: 'Reading mode' }));
  expect(screen.getByRole('navigation', { name: 'Portfolio sections' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'My story' })).toBeTruthy();
  expect(screen.getByText(/Felipe Santos, software engineer/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Portugu\u00eas (Brasil)' }));
  expect(document.documentElement.lang).toBe('pt-BR');
  expect(screen.getByRole('heading', { name: 'Minha hist\u00f3ria' })).toBeTruthy();
});


test.each([
  ['Simular entrada no castelo', 'Sair do salao de teste'],
  ['Simular entrada no portal', 'Sair do calabouco de teste'],
])('trocar o idioma durante %s preserva o cenario e o modo leitura', async (entry, exit) => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: entry }));
  expect(await screen.findByRole('button', { name: exit })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'English (United States)' }));
  expect(screen.getByRole('button', { name: exit })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Reading mode' }));
  expect(screen.getByRole('navigation', { name: 'Portfolio sections' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Modo 3D' }));
  expect(screen.getByRole('button', { name: exit })).toBeTruthy();
});


test('o controle alterna os climas e retorna ao ciclo automatico', async () => {
  await start();
  const scene = screen.getByTestId('village-canvas');
  for (const [current, next] of [['Autom\u00e1tico','clear'], ['Limpo','rain'], ['Chuva','snow'], ['Neve','auto']]) {
    fireEvent.click(screen.getByRole('button', { name: `Alterar clima: ${current}` }));
    expect(scene.getAttribute('data-weather')).toBe(next);
  }
});
