import { render, screen } from '@testing-library/react';
import MapControlGuide from './MapControlGuide';

test.each([
  ['lake', false, 'pt-BR', 'para correr'],
  ['lake', true, 'pt-BR', 'para acelerar'],
  ['ruins', false, 'en-US', 'to speed up'],
  ['tunnel', false, 'pt-BR', 'para acelerar'],
  ['temple', false, 'en-US', 'to run'],
  ['corridor', false, 'pt-BR', 'para correr'],
])('shows the Shift action for %s (aboard: %s) in %s', (scene, aboard, language, action) => {
  render(<MapControlGuide scene={scene} aboard={aboard} language={language} />);
  expect(screen.getByText('Shift').parentElement.textContent).toContain(action);
});

test.each(['pt-BR', 'en-US'])('omits Shift from the rapids tutorial in %s', language => {
  render(<MapControlGuide scene="rapids" language={language} />);
  expect(screen.queryByText('Shift')).toBeNull();
});
