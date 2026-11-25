import { fireEvent, render, screen } from '@testing-library/react';
import InfiniteCorridor from './InfiniteCorridor';

jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({ OrbitControls: jest.fn() }));
jest.mock('three/examples/jsm/utils/BufferGeometryUtils.js', () => ({ mergeGeometries: jest.fn() }));

const originalGetContext = HTMLCanvasElement.prototype.getContext;
let webglError;
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
  webglError = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  webglError.mockRestore();
});

function renderRoom(language = 'pt-BR', props = {}) {
  return render(<InfiniteCorridor language={language} paused={false} reduceMotion={false} onExit={() => {}} onAdvance={() => {}} onSound={() => {}} {...props} />);
}

test.each([
  ['pt-BR', 'Pular para a próxima sala'],
  ['en-US', 'Skip to next room'],
])('permite avançar direto da entrada em %s', (language, label) => {
  const onAdvance = jest.fn();
  renderRoom(language, { onAdvance });
  const skip = screen.getByRole('button', { name: label });
  fireEvent.click(skip);
  fireEvent.click(skip);
  expect(onAdvance).toHaveBeenCalledTimes(1);
});

test('desabilita o botão de pular durante a pausa', () => {
  const onAdvance = jest.fn();
  renderRoom('pt-BR', { onAdvance, paused: true });
  const skip = screen.getByRole('button', { name: 'Pular para a próxima sala' });
  expect(skip.disabled).toBe(true);
  fireEvent.click(skip);
  expect(onAdvance).not.toHaveBeenCalled();
});

test.each([
  ['pt-BR', 'Controles do jogo', 'CORREDOR DO INFINITO', 'Estado do manto', 'Giros 0/4'],
  ['en-US', 'Game controls', 'HALL OF INFINITY', 'Cloak status', 'Turns 0/4'],
])('a entrada come?a sem o aviso de bloqueio em %s', (language, controls, title, cloak, turns) => {
  renderRoom(language);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByLabelText(controls).textContent).toContain(title);
  expect(screen.getByLabelText(cloak).textContent).toContain(turns);
});

test('sem WebGL o erro é informado e o guia não anuncia ataques', () => {
  renderRoom();
  expect(screen.getByText('O 3D não está disponível neste navegador.')).toBeTruthy();
  const guide = screen.getByLabelText('Controles do jogo').textContent;
  expect(guide).toContain('interagir');
  expect(guide).not.toMatch(/atacar|revidar/i);
});
