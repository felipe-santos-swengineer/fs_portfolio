import { ENGLISH_GAMES, translateDungeonMessage, dungeonPortalLabel } from './dungeonI18n';
import { ENGLISH_VILLAGE_SIGNS } from './villageNavigation';

const games = [{ help: 'Colete os cristais.' }];

test('traduz mensagens dos jogos e preserva valores dinamicos', () => {
  expect(translateDungeonMessage('Colete os cristais.', 'en-US', games)).toBe(ENGLISH_GAMES[0][1]);
  expect(translateDungeonMessage('Onda 3 se aproxima!', 'en-US', games)).toBe('Wave 3 is approaching!');
  expect(translateDungeonMessage('2 de 4 coletados. Tempo restante: 17s.', 'en-US', games)).toBe('2 of 4 collected. Time left: 17s.');
  expect(translateDungeonMessage('Sequ\u00eancia: dourada, azul. Comece pela dourada.', 'en-US', games)).toBe('Sequence: gold, blue. Start with gold.');
  expect(translateDungeonMessage('Onda 3 se aproxima!', 'pt-BR', games)).toBe('Onda 3 se aproxima!');
});

test('as placas principais da vila possuem versoes em ingles', () => {
  expect(ENGLISH_VILLAGE_SIGNS.TAVERNA).toBe('TAVERN');
  expect(ENGLISH_VILLAGE_SIGNS.BIBLIOTECA).toBe('LIBRARY');
  expect(ENGLISH_VILLAGE_SIGNS['Toque para conhecer']).toBe('Tap to explore');
});

test('a placa do portal acompanha o idioma selecionado', () => {
  expect(dungeonPortalLabel('pt-BR')).toBe('RETORNO \u00c0 VILA');
  expect(dungeonPortalLabel('en-US')).toBe('RETURN TO VILLAGE');
});
