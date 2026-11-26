# Campanha II — Castelo Amaldiçoado

A campanha acompanha a aproximação à fortaleza, a travessia de um corredor que gira e os confrontos que dão acesso ao trono. Suas cinco salas estão disponíveis no portal da vila.

| Ordem | Mapa | O que acontece |
|---|---|---|
| 1 | Arredores do Castelo | O jogador explora o exterior e alcança a entrada da fortaleza. |
| 2 | Corredor do Infinito | O manto alterna visibilidade e invisibilidade. O jogador precisa lidar com as sombras, a sanidade e os giros da sala até alcançar a saída. |
| 3 | Pátio do Castelo | A luta contra a bruxa acontece sob chuva e neblina. A chave deixada após a vitória abre o caminho seguinte. |
| 4 | Entrada da Sala do Trono Maligno | O selo da porta e o desafio de xadrez controlam o acesso à sala do rei. |
| 5 | Sala do Trono Maligno | A apresentação do rei precede a batalha. Após a vitória, o salão se transforma e a princesa Elara oferece o retorno à vila ou uma nova luta. |

## Navegação e implementação

O menu compartilhado permite trocar de sala e reiniciar o encontro atual. O [corredor](../../src/components/InfiniteCorridor.js) controla manto e giros. O [componente do pátio](../../src/components/CursedCastleCourtyard.js) também monta a entrada do trono em modo interior. A [sala do trono](../../src/components/CastleThrone.js) controla o rei, o resultado da luta e a conversa final.
