# Portfólio 3D

A exploração começa na doca ao sul da vila. Caminhe até os edifícios ou use os atalhos abaixo do cenário para abrir as seções. O botão **Modo leitura**, no cabeçalho, leva à [versão 2D](versao-2d.md).

## Destinos da vila

| Destino | O que encontrar |
| --- | --- |
| Taverna do início | Apresentação, história e motivação, com narrações opcionais. |
| Biblioteca do saber | Formação, experiência profissional e habilidades. |
| Oficina das criações | Projetos, galerias e links para demonstrações ou repositórios disponíveis. |
| Correio da vila | E-mail, telefone, LinkedIn e Instagram. |
| Mercado a leste | Barracas de tecnologias, experiência profissional e formação e cursos. |
| Castelo da vila | Salão do trono e conversa com Felipe. |
| Portal a oeste | Acesso às três campanhas do Playground. |

As seções abertas na vila aparecem em pergaminhos. O selo, Escape e um clique fora do painel fecham a interface. Os controles de áudio e acessibilidade permanecem junto ao selo durante a rolagem. Os moradores da vila têm diálogos em texto e voz, e a missão de visitar quatro destinos termina com uma celebração. **Recomeçar** reinicia as visitas e a celebração.

## Controles

| Ação | Teclado, mouse e toque |
| --- | --- |
| Caminhar | WASD ou setas com o cenário em foco. No celular, use as setas abaixo do cenário. |
| Correr | Segure Shift enquanto caminha, nos mapas que oferecem corrida. |
| Girar e aproximar a câmera | Arraste com o mouse ou com um dedo. Use a roda, a pinça ou os botões de zoom para ajustar a distância. |
| Entrar ou conversar | Clique ou toque no alvo ou use a interação indicada quando estiver próximo. Na vila, use E ou **Interagir**. |
| Atacar | Use Espaço ou **Atacar** nos mapas que oferecem essa ação. |
| Voltar pelo portal | Atravesse o portal de retorno ou use o clique, toque ou a tecla de proximidade indicada pelo mapa. |
| Fechar uma janela | Escape ou o botão de fechar. |

A cena exige WebGL 2. No cabeçalho, é possível ajustar texto, contraste, fonte, movimento e áudio. As condições do clima podem ser alternadas pelos controles da vila. **Ocultar UI** recolhe os painéis opcionais, mantendo as ações essenciais. Os passos do jogador e dos NPCs são silenciosos. [Créditos de áudio](../../MUSIC_CREDITS.md).

## Campanhas

- [Dragão Maligno](../campanhas/01-dragao-maligno.md)
- [Castelo Amaldiçoado](../campanhas/02-castelo-amaldicoado.md)
- [Protocolo Ômega](../campanhas/03-protocolo-omega.md)

O portal da vila agrupa as campanhas em listas recolhíveis. Nos mapas, o menu do portal pausa a cena e oferece opções para voltar à vila, voltar ao mapa anterior, reiniciar ou seguir para o próximo destino quando disponível.

## Implementação

- [App.js](../../src/App.js) controla a troca de modo, a sessão e a navegação entre mapas.
- [VillageScene.js](../../src/components/VillageScene.js) monta a vila, os personagens e as interações em Three.js.
- [VillageParchment.js](../../src/components/VillageParchment.js) monta os painéis da vila com animação nativa de abertura e fechamento.
- [CampaignNavigation.js](../../src/components/CampaignNavigation.js) oferece o controle de navegação nas campanhas.
