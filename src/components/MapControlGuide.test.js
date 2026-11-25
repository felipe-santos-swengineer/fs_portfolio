import { render, screen } from '@testing-library/react';
import MapControlGuide from './MapControlGuide';

test.each([
  ['lake', false, 'pt-BR', 'para correr'],
  ['lake', true, 'pt-BR', 'para acelerar'],
  ['ruins', false, 'en-US', 'to speed up'],
  ['temple', false, 'en-US', 'to run'],
  ['corridor', false, 'pt-BR', 'para correr'],
])('shows the Shift action for %s (aboard: %s) in %s', (scene, aboard, language, action) => {
  render(<MapControlGuide scene={scene} aboard={aboard} language={language} />);
  expect(screen.getByText('Shift').parentElement.textContent).toContain(action);
});

test.each(['rapids', 'tunnel'])('omits Shift from the %s tutorial in %s', (scene, language) => {
  render(<MapControlGuide scene={scene} language={language} />);
  expect(screen.queryByText('Shift')).toBeNull();
});

test.each([
  ['pt-BR', 'apenas ↑ ↓ para avançar e voltar', 'Use apenas ↑ ↓ para avançar e voltar.'],
  ['en-US', 'only ↑ ↓ to row forward and back', 'Use only ↑ ↓ to row forward and back.'],
])('describes the tunnel boat controls in %s', (language, rowText, touchText) => {
  render(<MapControlGuide scene="tunnel" language={language} />);
  expect(screen.getByText('W').parentElement.textContent).toContain(rowText);
  expect(screen.queryByText('A')).toBeNull();
  expect(screen.queryByText('D')).toBeNull();
  expect(screen.getByText(touchText)).toBeTruthy();
});

test.each([
  ['pt-BR', 'SALA DO TRONO PURIFICADA', 'Saia da área vermelha antes do impacto.'],
  ['en-US', 'PURIFIED THRONE ROOM', 'Leave the red area before impact.'],
])('renames the purified throne and hides the impact hint in %s', (language, title, hint) => {
  render(<MapControlGuide scene="castleThrone" language={language} purified />);
  expect(screen.getByText(title)).toBeTruthy();
  expect(screen.queryByText(hint)).toBeNull();
});
