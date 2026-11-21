import { render, screen, fireEvent } from '@testing-library/react';
import { MarketStall } from './MarketStalls';

test('a vitrine de tecnologias permite explorar diferentes áreas', () => {
  render(<MarketStall type="technologies" />);
  fireEvent.click(screen.getByRole('button', { name: 'Dados' }));
  expect(screen.getByRole('status').textContent).toMatch(/PostgreSQL.*MongoDB/);
  fireEvent.click(screen.getByRole('button', { name: 'Front-end' }));
  expect(screen.getByRole('status').textContent).toMatch(/React.js.*TypeScript/);
  expect(screen.getByRole('button', { name: 'Front-end' }).getAttribute('aria-pressed')).toBe('true');
});

test('a barraca de experiência mostra a trajetória selecionada', () => {
  render(<MarketStall type="experience" />);
  fireEvent.click(screen.getByRole('button', { name: 'TOTVS' }));
  expect(screen.getByRole('status').textContent).toMatch(/Protheus.*ADVPL/);
});

test('a barraca de formação distingue curso em andamento', () => {
  render(<MarketStall type="education" />);
  fireEvent.click(screen.getByRole('button', { name: 'Cursos' }));
  expect(screen.getByRole('status').textContent).toMatch(/UX Design da Google em andamento/);
});
