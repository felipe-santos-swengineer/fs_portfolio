export const dungeonPortalLabel = language => language === 'en-US' ? 'RETURN TO VILLAGE' : 'RETORNO \u00c0 VILA';
export const caveReturnPortalLabel = language => language === 'en-US' ? 'RETURN TO THE COVE' : 'RETORNO \u00c0 ENSEADA';

export const ENGLISH_GAMES = [
  ['Lost crystals', 'Collect the crystals in two rounds before time runs out.'],
  ['Rune trail', 'Touch the four runes in the indicated order.'],
  ['Escape the shadows', 'Collect four lights before time runs out and avoid the shadows.'],
  ['Orb hunt', 'Chase four moving orbs before time runs out.'],
  ['Creature arena', 'Defeat four creatures with your sword before time runs out.'],
];
const messages = {
  'Explore o corredor e aproxime-se de uma cela.': 'Explore the corridor and approach a cell.',
  'Atravesse uma porta para iniciar um desafio.': 'Walk through a door to start a challenge.',
  'Arena concluída! Atravesse a porta para voltar ao pátio.': 'Arena complete! Walk through the door to return to the courtyard.',
  'Um soldado retornou ao pátio.': 'A soldier returned to the courtyard.',
  'Você caiu! Retornando ao pátio...': 'You fell! Returning to the courtyard...',
  'Você retornou ao pátio com a vida restaurada.': 'You returned to the courtyard with full health.',
  'O tempo acabou. Volte ao corredor ou recomece o desafio.': 'Time is up. Return to the corridor or restart the challenge.',
  'Todas as runas ativadas! Desafio concluído.': 'All runes activated! Challenge complete.',
  'Rodada 2! Colete os cristais novamente antes do tempo acabar.': 'Round 2! Collect the crystals again before time runs out.',
  'Desafio concluído! Atravesse a porta para voltar ao corredor.': 'Challenge complete! Walk through the door to return to the corridor.',
  'Uma sombra alcançou você. Tente novamente!': 'A shadow caught you. Try again!',
  'Não foi possível abrir o cenário 3D neste navegador.': 'The 3D scene could not be opened in this browser.',
};
const colors = { dourada: 'gold', azul: 'blue', rosa: 'pink', verde: 'green' };
const englishColors = text => text.replace(/dourada|azul|rosa|verde/g, color => colors[color]);
export function translateDungeonMessage(text, language, games) {
  if (language !== 'en-US') return text;
  const game = games.findIndex(item => item.help === text);
  if (game >= 0) return ENGLISH_GAMES[game][1];
  if (messages[text]) return messages[text];
  let match;
  if ((match = text.match(/^(\d+) de 4 criaturas derrotadas\.$/))) return `${match[1]} of 4 creatures defeated.`;
  if ((match = text.match(/^Criaturas derrotadas no pátio: (\d+)\.$/))) return `Creatures defeated in the courtyard: ${match[1]}.`;
  if ((match = text.match(/^Onda (\d+) se aproxima!$/))) return `Wave ${match[1]} is approaching!`;
  if ((match = text.match(/^Sequência: (.+)\. Comece pela (.+)\.$/))) return `Sequence: ${englishColors(match[1])}. Start with ${englishColors(match[2])}.`;
  if ((match = text.match(/^Sequência incorreta\. Comece pela (.+): (.+)\.$/))) return `Incorrect sequence. Start with ${englishColors(match[1])}: ${englishColors(match[2])}.`;
  if ((match = text.match(/^Runa correta \((\d)\/4\)\. Próxima: (.+)\.$/))) return `Correct rune (${match[1]}/4). Next: ${englishColors(match[2])}.`;
  if ((match = text.match(/^(\d+) de 4 coletados\. Tempo restante: (\d+)s\.$/))) return `${match[1]} of 4 collected. Time left: ${match[2]}s.`;
  return text;
}
