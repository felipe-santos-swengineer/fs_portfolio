import { render, screen, fireEvent, within, act } from '@testing-library/react';
import App from './App';
import VillageAudio from './audio/VillageAudio';

jest.mock('./components/VillageScene', () => ({ __esModule: true, default: ({ onTalk, onOpen, onNear, onNearNpc, zoom, missionRound, weatherMode, villageArrival }) => <div data-testid="village-canvas" data-village-arrival={villageArrival || ''} data-weather={weatherMode} data-zoom={zoom} data-round={missionRound}><button onClick={() => onOpen(5)}>Simular entrada no castelo</button><button onClick={() => onOpen(4)}>Simular entrada no portal</button><button onClick={() => onOpen(6)}>Simular vitrine do mercado</button><button onClick={() => onOpen(7)}>Simular alimentos</button><button onClick={() => onOpen(8)}>Simular pocoes</button><button onClick={() => onTalk(0)}>Conversar com Bia</button><button onClick={() => onNearNpc(0)}>Aproximar da Bia</button><button onClick={() => onNear(0)}>Aproximar da taverna</button></div> }));
jest.mock('./audio/VillageAudio', () => jest.fn());
jest.mock('./assets/audio/village-bards-tale.mp3', () => 'village-track.mp3');
jest.mock('./assets/audio/castle-kings-feast.mp3', () => 'castle-track.mp3');
jest.mock('./assets/audio/dungeon.wav', () => 'dungeon-track.wav');
jest.mock('./assets/audio/lake-ambient.wav', () => 'lake-track.wav');
jest.mock('./assets/audio/rapids-theme.wav', () => 'rapids-track.wav');
jest.mock('./assets/audio/cursed-castle.ogg', () => 'cursed-castle-track.ogg');
jest.mock('./assets/audio/witch-battle.ogg', () => 'witch-battle-track.ogg');
jest.mock('./components/ThroneHall', () => ({ __esModule: true, default: ({ onExit }) => <button onClick={onExit}>Sair do salao de teste</button> }));
jest.mock('./components/Lake', () => ({ __esModule: true, default: ({ onExit, onEnterRapids }) => <><button onClick={onExit}>Sair do lago de teste</button><button onClick={onEnterRapids}>Entrar nas corredeiras de teste</button></> }));
jest.mock('./components/Rapids', () => ({ __esModule: true, default: ({ onExit, onAdvance }) => <><button onClick={onExit}>Sair das corredeiras de teste</button><button onClick={onAdvance}>Avançar das corredeiras de teste</button></> }));
jest.mock('./components/Ruins', () => ({ __esModule: true, default: ({ onExit, onEnterTunnel }) => <><button onClick={onExit}>Sair das ruínas de teste</button><button onClick={onEnterTunnel}>Entrar no túnel de teste</button></> }));
jest.mock('./components/TempleVillage', () => ({ __esModule: true, default: ({ onExit, onEnterCave }) => <><button onClick={onExit}>Sair da aldeia de teste</button><button onClick={onEnterCave}>Entrar na caverna de teste</button></> }));
jest.mock('./components/DragonCave', () => ({ __esModule: true, default: ({ onExit, onEnterChamber, startAtChamber }) => <><button onClick={onExit}>Sair da caverna de teste</button><button onClick={onEnterChamber}>Entrar na câmara de teste</button><span data-testid="cave-arrival">{startAtChamber?'chamber':'entrance'}</span></> }));
jest.mock('./components/DragonChamber', () => ({ __esModule: true, default: ({ onExit }) => <button onClick={onExit}>Sair da câmara de teste</button> }));
jest.mock('./components/Dungeon', () => ({ __esModule: true, default: ({ onExit }) => <button onClick={onExit}>Sair do calabouco de teste</button> }));
jest.mock('./components/CursedCastle', () => ({ __esModule: true, default: ({ onExit,onEnterCastle,startNearGate }) => <><button onClick={onExit}>{'Sair do castelo amaldi\u00e7oado de teste'}</button><button onClick={onEnterCastle}>Entrar no interior de teste</button><span data-testid="castle-return">{String(startNearGate)}</span></> }));
jest.mock('./components/CursedCastleCourtyard', () => ({ __esModule: true, default: ({onExit,onEncounterChange,onAdvance,interior,throneUnlocked,onThroneUnlock}) => interior
  ? <><button onClick={onExit}>Voltar ao pátio de teste</button>
    <button onClick={onThroneUnlock}>Vencer xadrez de teste</button>
    <button disabled={!throneUnlocked || !onAdvance} onClick={onAdvance}>Entrar no trono de teste</button></>
  : <><button onClick={onExit}>Voltar aos arredores de teste</button><button onClick={() => onEncounterChange(true)}>Encerrar a cutscene da bruxa de teste</button><button onClick={onAdvance}>Usar saída após pegar a chave</button></> }));
jest.mock('./components/InfiniteCorridor', () => ({ __esModule: true, default: ({onExit,onAdvance}) => <><button onClick={onExit}>Voltar aos arredores do corredor de teste</button><button onClick={onAdvance}>Avançar para o interior de teste</button></> }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  VillageAudio.mockImplementation(() => ({ enable: jest.fn().mockResolvedValue(true), setChannels: jest.fn(), mute: jest.fn(), interact: jest.fn(), ruins: jest.fn(), closeDoor: jest.fn(), firework: jest.fn(), stopFireworks: jest.fn(), dispose: jest.fn() }));
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
  await configure(p => { fireEvent.click(p.getByRole('checkbox', { name: /^Música ambiente/ })); });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar: Projetos' })); expect(engine().interact).toHaveBeenCalledWith(2);
  fireEvent.keyDown(document, { key: 'Escape' });
  await configure(p => fireEvent.click(p.getByRole('checkbox', { name: /^Som geral/ })));
  await configure(p => {
    expect(p.getByRole('checkbox', { name: /^Música ambiente/ }).checked).toBe(false);
    expect(p.queryByRole('checkbox', { name: /^Passos/ })).toBeNull();
    expect(p.getByRole('checkbox', { name: /^Efeitos dos edifícios/ }).checked).toBe(true);
    fireEvent.click(p.getByRole('checkbox', { name: /^Som geral/ }));
  });
  expect(JSON.parse(localStorage.getItem('village-audio')).music).toBe(false);
});

test('desativar tudo bloqueia interações e novas narrações', async () => {
  await start(); await configure(p => fireEvent.click(p.getByRole('button', { name: 'Ativar tudo' })));
  await configure(p => fireEvent.click(p.getByRole('button', { name: 'Desativar tudo' })));
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
  ['Simular entrada no portal', 'Sair do lago de teste'],
])('modo leitura funciona em %s e permite retornar ao cenario', async (entrance, exit) => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: entrance }));
  if (entrance === 'Simular entrada no portal') fireEvent.click(screen.getByRole('button', { name: /Lago das Interfaces/ }));
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
  ['Simular entrada no portal', 'Sair do lago de teste'],
])('trocar o idioma durante %s preserva o cenario e o modo leitura', async (entry, exit) => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: entry }));
  if (entry === 'Simular entrada no portal') fireEvent.click(screen.getByRole('button', { name: /Lago das Interfaces/ }));
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

test('portal permite escolher ou cancelar antes de entrar no lago', async () => {
  await start();
  const portal = screen.getByRole('button', { name: 'Simular entrada no portal' });
  fireEvent.click(portal);
  expect(screen.getByRole('dialog', { name: 'Escolha um destino' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Sair do lago de teste' })).toBeNull();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: 'Escolha um destino' })).toBeNull();
  fireEvent.click(portal);
  fireEvent.click(screen.getByRole('button', { name: /Lago das Interfaces/ }));
  expect(await screen.findByRole('button', { name: 'Sair do lago de teste' })).toBeTruthy();
});


test.each([
  ['dungeon', 'Sair do calabouco de teste'],
  ['throne', 'Sair do salao de teste'],
  ['lake', 'Sair do lago de teste'],
])('restaura o mapa %s ao recarregar e registra o retorno para a vila', async (map, exit) => {
  sessionStorage.setItem('portfolio-map', map);
  await start();
  fireEvent.click(await screen.findByRole('button', { name: exit }));
  expect(sessionStorage.getItem('portfolio-map')).toBe('village');
  expect(screen.getByTestId('village-canvas')).toBeTruthy();
});

test('voltar do lago solicita chegada no portal da vila', async () => {
  sessionStorage.setItem('portfolio-map', 'lake');
  await start();
  fireEvent.click(await screen.findByRole('button', { name: 'Sair do lago de teste' }));
  expect(screen.getByTestId('village-canvas').getAttribute('data-village-arrival')).toBe('portal');
  expect(sessionStorage.getItem('portfolio-map')).toBe('village');
});

test('a entrada e a conversa usam botoes padronizados sem se sobrepor', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Aproximar da taverna' }));
  fireEvent.click(screen.getByRole('button', { name: 'Aproximar da Bia' }));
  const entrance=screen.getByRole('button', { name: /Entrar: Taverna.* E/i });
  const talk=screen.getByRole('button', { name: 'Conversar com Bia F' });
  expect(entrance.parentElement).toBe(talk.parentElement);
  fireEvent.click(entrance);
  expect(screen.getByRole('dialog', { name: /Minha hist/ })).toBeTruthy();
});

test('a vila mostra o botao padronizado ao aproximar de um morador', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Aproximar da Bia' }));
  const prompt=screen.getByRole('button', { name: 'Conversar com Bia F' });
  expect(prompt.className).toBe('villager-talk');
  fireEvent.click(prompt);
  expect(screen.queryByRole('button', { name: 'Conversar com Bia F' })).toBeNull();
  expect(screen.getByLabelText('Conversa com Bia')).toBeTruthy();
});

test('a versao exibe o commit abreviado e o identificador completo no titulo', async () => {
  const previous=process.env.REACT_APP_BUILD_VERSION;
  const commit='0123456789abcdef0123456789abcdef01234567';
  process.env.REACT_APP_BUILD_VERSION=commit;
  try {
    await start();
    expect(screen.getByTitle(commit).textContent).toContain('Commit 0123456789ab');
    expect(screen.getByTitle(commit).querySelector('svg.lucide-github')).toBeTruthy();
  } finally {
    if(previous===undefined) delete process.env.REACT_APP_BUILD_VERSION;
    else process.env.REACT_APP_BUILD_VERSION=previous;
  }
});

test('o portal exibe corretamente os caracteres acentuados', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  expect(screen.queryByRole('button', { name: /Calabou\u00e7o|Dungeon/ })).toBeNull();
  expect(screen.getByRole('button', { name: /Lago das Interfaces/ })).toBeTruthy();
  expect(screen.getByText('Des\u00e7a o desfiladeiro de barco')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Enseada das Ru\u00ednas Submersas/ })).toBeTruthy();
});

test('o tunel abre a partir das ruinas e retorna ao mesmo mapa', async () => {
  sessionStorage.setItem('portfolio-map','ruins');
  await start();
  fireEvent.click(await screen.findByRole('button', { name: 'Entrar no t\u00fanel de teste' }));
  expect(await screen.findByRole('button', { name: 'Sair da aldeia de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('temple');
  expect(screen.queryByRole('button', { name: 'Sair das ru\u00ednas de teste' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Sair da aldeia de teste' }));
  expect(screen.getByRole('button', { name: 'Sair das ru\u00ednas de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('ruins');
});

test('a sessao restaura o tunel com retorno para as ruinas', async () => {
  sessionStorage.setItem('portfolio-map','tunnel');
  await start();
  fireEvent.click(await screen.findByRole('button', { name: 'Sair da aldeia de teste' }));
  expect(await screen.findByRole('button', { name: 'Sair das ru\u00ednas de teste' })).toBeTruthy();
});

test('o portal abre as ruínas e permite retornar à vila', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  fireEvent.click(screen.getByRole('button', { name: /Enseada das Ruínas Submersas/ }));
  expect(await screen.findByRole('button', { name: 'Sair das ruínas de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('ruins');
  expect(document.querySelector('audio[loop]').getAttribute('src')).toBe('lake-track.wav');
  fireEvent.click(screen.getByRole('button', { name: 'Sair das ruínas de teste' }));
  expect(sessionStorage.getItem('portfolio-map')).toBe('village');
  expect(screen.getByTestId('village-canvas')).toBeTruthy();
});

test('avançar das corredeiras abre as ruínas e restaura o mapa após recarregar', async () => {
  sessionStorage.setItem('portfolio-map', 'rapids');
  const view = await act(async () => render(<App />));
  fireEvent.click(await screen.findByRole('button', { name: 'Avançar das corredeiras de teste' }));
  expect(await screen.findByRole('button', { name: 'Sair das ruínas de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('ruins');
  view.unmount();
  await start();
  expect(await screen.findByRole('button', { name: 'Sair das ruínas de teste' })).toBeTruthy();
});

test('o portal da vila abre as corredeiras diretamente', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  fireEvent.click(screen.getByRole('button', { name: /Corredeiras do Desfiladeiro/ }));
  expect(await screen.findByRole('button', { name: 'Sair das corredeiras de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('rapids');
  fireEvent.click(screen.getByRole('button', { name: 'Sair das corredeiras de teste' }));
  expect(await screen.findByRole('button', { name: 'Sair do lago de teste' })).toBeTruthy();
});

test('a gruta abre as corredeiras e permite voltar ao lago', async () => {
  sessionStorage.setItem('portfolio-map', 'lake');
  await start();
  fireEvent.click(await screen.findByRole('button', { name: 'Entrar nas corredeiras de teste' }));
  expect(await screen.findByRole('button', { name: 'Sair das corredeiras de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('rapids');
  expect(document.querySelector('audio[loop]').getAttribute('src')).toBe('rapids-track.wav');
  fireEvent.click(screen.getByRole('button', { name: 'Sair das corredeiras de teste' }));
  expect(document.querySelector('audio[loop]').getAttribute('src')).toBe('lake-track.wav');
  expect(await screen.findByRole('button', { name: 'Sair do lago de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('lake');
});

test('a musica acompanha a entrada e a saida do lago', async () => {
  await start();
  const background = document.querySelector('audio[loop]');
  expect(background.getAttribute('src')).toBe('village-track.mp3');
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  fireEvent.click(screen.getByRole('button', { name: /Lago das Interfaces/ }));
  expect(await screen.findByRole('button', { name: 'Sair do lago de teste' })).toBeTruthy();
  expect(background.getAttribute('src')).toBe('lake-track.wav');
  fireEvent.click(screen.getByRole('button', { name: 'Sair do lago de teste' }));
  expect(background.getAttribute('src')).toBe('village-track.mp3');
});

test('registra o mapa escolhido no portal para restaurar ao recarregar', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  fireEvent.click(screen.getByRole('button', { name: /Lago das Interfaces/ }));
  expect(await screen.findByRole('button', { name: 'Sair do lago de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('lake');
});


test('the portal reaches the cave and chamber and returns to the chamber entrance', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  fireEvent.click(screen.getByRole('button', { name: /Caverna do Anci\u00e3o/ }));
  expect(await screen.findByRole('button', {name:'Entrar na c\u00e2mara de teste'})).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('cave');
  fireEvent.click(screen.getByRole('button', {name:'Entrar na c\u00e2mara de teste'}));
  expect(await screen.findByRole('button', {name:'Sair da c\u00e2mara de teste'})).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('chamber');
  fireEvent.click(screen.getByRole('button', {name:'Sair da c\u00e2mara de teste'}));
  expect((await screen.findByTestId('cave-arrival')).textContent).toBe('chamber');
  expect(sessionStorage.getItem('portfolio-map')).toBe('cave');
});

test('the portal opens the dragon chamber directly', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', {name:'Simular entrada no portal'}));
  fireEvent.click(screen.getByRole('button', {name:/C\u00e2mara do Anci\u00e3o/}));
  expect(await screen.findByRole('button', {name:'Sair da c\u00e2mara de teste'})).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('chamber');
});


test('a campanha do castelo permite entrar, preservar o mapa e voltar ao portal', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  const campaign=screen.getByText('Campanha do Castelo Amaldi\u00e7oado');
  expect(campaign.parentElement.open).toBe(false);
  fireEvent.click(campaign);
  fireEvent.click(screen.getByRole('button', { name: /Arredores do Castelo/ }));
  expect(await screen.findByRole('button', { name: 'Sair do castelo amaldi\u00e7oado de teste' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle');
  fireEvent.click(screen.getByRole('button', { name: 'Sair do castelo amaldi\u00e7oado de teste' }));
  expect(screen.getByTestId('village-canvas').getAttribute('data-village-arrival')).toBe('portal');
  expect(sessionStorage.getItem('portfolio-map')).toBe('village');
});


test('o interior do castelo abre pelo portao e retorna com o portao aberto', async () => {
  await start();fireEvent.click(screen.getByRole('button',{name:'Simular entrada no portal'}));
  fireEvent.click(screen.getByText('Campanha do Castelo Amaldi\u00e7oado'));
  fireEvent.click(screen.getByRole('button',{name:/Arredores do Castelo/}));
  fireEvent.click(await screen.findByRole('button',{name:'Entrar no interior de teste'}));
  expect(await screen.findByRole('button',{name:'Avançar para o interior de teste'})).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-corridor');
  fireEvent.click(screen.getByRole('button',{name:'Avançar para o interior de teste'}));
  expect(await screen.findByRole('button',{name:'Voltar aos arredores de teste'})).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-courtyard');
  fireEvent.click(screen.getByRole('button',{name:'Voltar aos arredores de teste'}));
  expect((await screen.findByTestId('castle-return')).textContent).toBe('true');
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle');
});

test('a campanha abre o corredor do infinito como primeira sala interior', async () => {
  await start(); fireEvent.click(screen.getByRole('button',{name:'Simular entrada no portal'}));
  fireEvent.click(screen.getByText('Campanha do Castelo Amaldi\u00e7oado'));
  fireEvent.click(screen.getByRole('button',{name:/Corredor do Infinito/}));
  expect(await screen.findByRole('button',{name:'Avançar para o interior de teste'})).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-corridor');
  fireEvent.click(screen.getByRole('button',{name:'Voltar aos arredores do corredor de teste'}));
  expect((await screen.findByTestId('castle-return')).textContent).toBe('true');
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle');
});

test('o portal acessa o pátio diretamente e permite voltar aos arredores', async () => {
  await start();fireEvent.click(screen.getByRole('button',{name:'Simular entrada no portal'}));
  fireEvent.click(screen.getByText('Campanha do Castelo Amaldi\u00e7oado'));
  fireEvent.click(screen.getByRole('button',{name:/Pátio do Castelo/}));
  const exit = await screen.findByRole('button',{name:'Voltar aos arredores de teste'});
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-courtyard');
  const background = document.querySelector('audio[loop]');
  expect(background.getAttribute('src')).toBe('cursed-castle-track.ogg');
  fireEvent.click(screen.getByRole('button', {name:'Encerrar a cutscene da bruxa de teste'}));
  expect(background.getAttribute('src')).toBe('witch-battle-track.ogg');
  fireEvent.click(exit);
  expect((await screen.findByTestId('castle-return')).textContent).toBe('true');
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle');
  expect(background.getAttribute('src')).toBe('cursed-castle-track.ogg');
});


test('o portal abre a câmara e reinicia o encontro ao voltar ao pátio', async () => {
  await start();
  fireEvent.click(screen.getByRole('button', { name: 'Simular entrada no portal' }));
  const campaign = screen.getByText('Campanha do Castelo Amaldi\u00e7oado');
  expect(campaign.parentElement.open).toBe(false);
  fireEvent.click(campaign);
  fireEvent.click(screen.getByRole('button', { name: /^4\. C\u00e2mara do Guardi\u00e3o Arcano/ }));
  const back = await screen.findByRole('button', { name: 'Voltar ao p\u00e1tio de teste' });
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-throne-entrance');
  expect(screen.getByRole('button', { name: 'Entrar no trono de teste' }).disabled).toBe(true);
  fireEvent.click(back);
  expect(await screen.findByRole('button', { name: 'Usar saída após pegar a chave' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-courtyard');
});

test('a saída do pátio abre a entrada do trono e reinicia o encontro ao voltar', async () => {
  sessionStorage.setItem('portfolio-map', 'cursed-castle-courtyard');
  await start();
  fireEvent.click(await screen.findByRole('button', { name: 'Usar saída após pegar a chave' }));
  const back = await screen.findByRole('button', { name: 'Voltar ao pátio de teste' });
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-throne-entrance');
  fireEvent.click(back);
  expect(await screen.findByRole('button', { name: 'Usar saída após pegar a chave' })).toBeTruthy();
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-courtyard');
});

test('recarregar no interior restaura o sal?o e o retorno aos arredores', async () => {
  sessionStorage.setItem('portfolio-map','cursed-castle-interior');await start();
  fireEvent.click(await screen.findByRole('button',{name:'Voltar aos arredores de teste'}));
  expect((await screen.findByTestId('castle-return')).textContent).toBe('true');
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle');
});

test.each(['cursed-castle-vestibule', 'cursed-castle-throne'])('restaura %s com o trono bloqueado até vencer o xadrez', async map => {
  sessionStorage.setItem('portfolio-map', map);
  await start();
  const enter = await screen.findByRole('button', { name: 'Entrar no trono de teste' });
  expect(enter.disabled).toBe(true);
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-throne-entrance');
  fireEvent.click(screen.getByRole('button', { name: 'Vencer xadrez de teste' }));
  expect(enter.disabled).toBe(false);
  expect(sessionStorage.getItem('portfolio-map')).toBe('cursed-castle-throne-entrance');
  expect(screen.queryByRole('button', { name: 'Sair do salao de teste' })).toBeNull();
});
