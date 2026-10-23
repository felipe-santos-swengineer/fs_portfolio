import { render, screen, fireEvent, act, within } from '@testing-library/react';
import axe from 'axe-core';
import App from './App';
import { loadAccessibilitySettings, DEFAULT_ACCESSIBILITY } from './components/AccessibilitySettings';

jest.mock('./components/VillageScene', () => ({ __esModule: true, default: ({ reduceMotion, ambientPaused, paused }) => <div data-testid="scene" data-reduced={reduceMotion} data-ambient-paused={ambientPaused} data-paused={paused} /> }));
beforeEach(() => localStorage.clear());

test('o painel ajusta leitura, contraste e movimento, preserva preferências e devolve o foco', async () => {
  await act(async () => { render(<App />); });
  const trigger = screen.getByRole('button', { name: 'Abrir acessibilidade' }); trigger.focus(); fireEvent.click(trigger);
  const panel = within(screen.getByRole('dialog', { name: 'Acessibilidade' }));
  expect(document.activeElement).toBe(panel.getByRole('button', { name: 'Fechar acessibilidade' }));
  fireEvent.change(panel.getByLabelText('Tamanho do texto'), { target: { value: 'xlarge' } });
  fireEvent.click(panel.getByRole('checkbox', { name: /^Alto contraste/ }));
  fireEvent.click(panel.getByRole('checkbox', { name: /^Fonte simples/ }));
  fireEvent.change(panel.getByLabelText('Movimentos extras'), { target: { value: 'reduce' } });
  fireEvent.click(panel.getByRole('checkbox', { name: /^Pausar animações/ }));
  fireEvent.keyDown(document.activeElement, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(panel.getByRole('button', { name: 'Restaurar preferências de acessibilidade' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(trigger);
  expect(document.querySelector('.app').classList.contains('high-contrast')).toBe(true);
  expect(document.querySelector('.app').classList.contains('text-xlarge')).toBe(true);
  expect(screen.getByTestId('scene').getAttribute('data-reduced')).toBe('true');
  expect(screen.getByTestId('scene').getAttribute('data-ambient-paused')).toBe('true');
  expect(screen.getByTestId('scene').getAttribute('data-paused')).toBe('false');
  expect(loadAccessibilitySettings().simpleFont).toBe(true);
});

test('o link de pulo dá foco ao conteúdo e o modo leitura inclui todos os moradores', async () => {
  await act(async () => { render(<App />); });
  fireEvent.click(screen.getByRole('link', { name: 'Pular para o conteúdo' }));
  expect(document.activeElement).toBe(screen.getByRole('main'));
  fireEvent.click(screen.getByRole('button', { name: 'Abrir acessibilidade' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /^Modo leitura sem 3D/ }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByTestId('scene')).toBeNull();
  expect(screen.getByRole('navigation', { name: 'Seções do portfólio' })).toBeTruthy();
  for (const name of ['Bia', 'Tom', 'Lia', 'Rui']) expect(screen.getByText(new RegExp(`^${name} ·`))).toBeTruthy();
  fireEvent.click(screen.getByText(/^Bia ·/));
  expect(screen.getByText(/Que bom receber você por aqui!/)).toBeTruthy();
});

test('preferências inválidas não quebram a página', () => {
  localStorage.setItem('village-accessibility', '{invalid'); expect(loadAccessibilitySettings()).toEqual(DEFAULT_ACCESSIBILITY);
  localStorage.setItem('village-accessibility', JSON.stringify({ textSize: 'gigante', highContrast: 'sim', motion: 'flash' })); expect(loadAccessibilitySettings()).toEqual(DEFAULT_ACCESSIBILITY);
});

test('auditoria estrutural de acessibilidade na vila, painel, seção e modo leitura', async () => {
  const { container } = await act(async () => render(<App />));
  // jsdom cannot calculate rendered contrast; visual contrast needs browser QA.
  const audit = async () => {
    const result = await axe.run(container, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
  };
  await audit();
  fireEvent.click(screen.getByRole('button', { name: 'Abrir acessibilidade' })); await audit();
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar: Projetos' })); await audit();
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Modo leitura' })); await audit();
}, 20000);
