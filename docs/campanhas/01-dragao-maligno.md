# Campanha I — Dragão Maligno

A viagem começa de barco no Lago das Interfaces e termina na Câmara do Ancião. O portal da vila permite entrar diretamente em cada uma das sete salas.

| Ordem | Mapa | O que acontece |
|---|---|---|
| 1 | Lago das Interfaces | Marina orienta o jogador. O barco leva à entrada das corredeiras, e o portal em terra dá acesso à vila inicial. |
| 2 | Corredeiras do Desfiladeiro | O jogador conduz o barco durante a descida. A tela de resultado permite prosseguir após a chegada. |
| 3 | Enseada das Ruínas Submersas | Três runas distribuídas pelas ilhas abrem o portão para a passagem. |
| 4 | Passagem Antiga | O percurso de barco atravessa regiões subterrâneas entre a enseada e a aldeia. |
| 5 | Aldeia do Templo Antigo | Moradores e guardas oferecem diálogos. A aldeia dá acesso à caverna. |
| 6 | Caverna do Ancião | A exploração a pé combina combate, vida do jogador e acesso à câmara. |
| 7 | Câmara do Ancião | O confronto com o dragão termina com a celebração e a conversa com a princesa. |

## Navegação e implementação

O menu do portal permite reiniciar a sala, voltar à vila ou navegar entre destinos. A posição de chegada pode mudar ao refazer o caminho. A ordem da campanha e a montagem das cenas estão em [App.js](../../src/App.js). O percurso subterrâneo está em [AncientTunnel.js](../../src/components/AncientTunnel.js), e o encontro final em [DragonChamber.js](../../src/components/DragonChamber.js).
