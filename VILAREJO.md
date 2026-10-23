# Portfólio: vilarejo 3D

A vila é renderizada em WebGL 2 com Three.js, câmera em perspectiva e geometria tridimensional. A interface usa uma paleta escura; o cenário noturno combina luar, sombras, lanternas, água luminosa e vaga-lumes.

- **Taverna:** barris, mesa, bancos, chaminé e caneca identificam a seção de introdução, história e motivação, com as três narrações originais.
- **Biblioteca:** torre, livro aberto e estante com livros identificam escolaridade, experiências, habilidades e interesses.
- **Oficina:** forja acesa, bigorna e martelo identificam os quatro projetos originais, 18 imagens, links e narração.
- **Correio:** envelope, caixa postal, bandeira e encomendas identificam os textos e canais de contato originais.

## Controles

- Arraste com o mouse ou um dedo para rotacionar a câmera em torno da vila.
- Use a roda do mouse ou o gesto de pinça para aproximar e afastar. Há também botões de zoom.
- Use WASD ou as setas para caminhar com o personagem 3D. A direção acompanha a orientação da câmera. No celular, use os botões de direção.
- O personagem possui braços e pernas articulados, balanço durante a caminhada, capa e mochila. Casas, fonte e limites da vila bloqueiam a passagem.
- Perto de uma entrada, pressione E. Clicar nos edifícios ou nos atalhos inferiores também abre as seções.
- Use **Focar personagem** para reposicionar a câmera sobre o viajante.
- Escape fecha a seção aberta. Os controles do cenário ficam suspensos enquanto ela está aberta.

## Conteúdo e acessibilidade

### Moradores da vila

Quatro NPCs articulados passeiam com destinos aleatórios e pequenas pausas: Bia, guardiã da biblioteca; Tom, artesão; Lia, mensageira; e Rui, anfitrião da taverna. As rotas são calculadas em uma malha que respeita as casas, a fonte e os limites transitáveis.

Clique em um morador, pressione **F** quando estiver próximo ou use os atalhos de nomes abaixo da vila. O morador selecionado para de caminhar e se volta ao visitante durante a conversa. Cada um possui duas mensagens de agradecimento, alternadas a cada interação. **Outra mensagem** troca o diálogo; Escape ou o botão de fechar encerra a conversa.

Com os sons da vila ativados, a mensagem é reproduzida por um MP3 local gerado previamente com voz neural. O texto exibido é o mesmo usado na geração. Cada personagem tem uma voz própria, sem mudanças artificiais de pitch ou velocidade na reprodução:

| Morador | Voz | Identidade |
| --- | --- | --- |
| Bia | Francisca Neural | Feminina, calma e acolhedora |
| Tom | Antonio Neural | Masculina, firme e descontraída |
| Lia | Thalita Multilingual Neural | Feminina, leve e animada |
| Rui | Brian Multilingual Neural | Masculina, grave e acolhedora, falando português |

As oito gravações e o manifesto com os textos, vozes e parâmetros estão em `src/assets/audio/villagers`. O site não consulta serviços de voz em tempo de execução e não depende das vozes instaladas no dispositivo. Se um arquivo não puder ser reproduzido, a mensagem continua em texto com a opção de tentar novamente; não há retorno automático à voz robótica do navegador.

Os botões **Ouvir mensagem** e **Parar voz** controlam a reprodução. Desativar o som, iniciar uma narração, abrir uma seção, fechar a conversa, entrar no modo leitura ou ocultar a aba interrompe a fala. A música fica mais baixa durante a conversa.

Para regenerar as falas após editar os diálogos, execute `npm run generate:npc-voices`. Esse comando de desenvolvimento usa `msedge-tts`, precisa de internet e envia os textos ao serviço de síntese da Microsoft. Os perfis estão em `scripts/generate-villager-voices.cjs`. Após gerar, rode os testes: eles verificam se os textos dos áudios continuam correspondendo aos diálogos e se as quatro vozes são distintas.

Os textos foram revisados para apresentar a trajetória e os projetos com mais clareza, mantendo os fatos, datas, imagens e links existentes. As gravações originais foram preservadas e identificadas como histórias da edição anterior, pois não são uma leitura literal dos novos textos. As narrações têm controles nativos; iniciar uma pausa as outras e reduz o volume da música de fundo.

### Configurações de áudio

O botão **Áudio** no cabeçalho abre o painel único de configurações. Uma seção aberta também oferece **Configurar áudio**, que leva ao mesmo painel.

- **Som geral** silencia todas as fontes, inclusive vozes e narrações, sem apagar as escolhas individuais.
- **Ativar tudo** habilita o som geral e as cinco categorias.
- **Desativar tudo** desliga o som geral e todas as categorias.
- Música ambiente, passos, efeitos dos edifícios, vozes dos NPCs e narrações das seções têm controles independentes. As categorias podem ser preparadas mesmo com o som geral desligado.

Desligar uma categoria interrompe imediatamente o áudio correspondente, sem afetar as demais. Narrações silenciadas não podem continuar tocando pelos controles nativos; reativá-las permite iniciá-las manualmente. O controle geral não inicia narrações nem conversas sozinho. As preferências de categorias são salvas no navegador, mas o som geral começa desligado em cada nova visita, evitando reprodução automática.

Os efeitos são sintetizados localmente com Web Audio: passos diferentes na pedra e na grama, trinco e acorde na taverna, páginas e notas na biblioteca, batidas de bigorna na oficina e sino no correio. Fechar uma seção também tem um efeito discreto. Os passos acompanham a distância percorrida: não são disparados ao ficar parado ou pressionar contra uma parede.

O modo leitura oferece todo o conteúdo sem depender de WebGL. Se o navegador não oferecer WebGL 2, a interface informa como acessar o conteúdo pelos atalhos. A preferência de movimento reduzido desativa os efeitos ambientais contínuos.

O cenário é carregado em um módulo separado. A resolução do canvas é limitada para reduzir o custo em telas de alta densidade, e geometrias, materiais, texturas, listeners e controles são liberados ao sair da vila.

## Desenvolvimento

```sh
npm install
npm start
npm test -- --watchAll=false --runInBand
npm run build
```

`src/components/VillageScene.js` constrói a cena e implementa os controles. `villageNavigation.js` define as posições e regras de navegação. `src/content.js` mantém os textos e projetos; `src/OriginalPortfolio.js` guarda o componente original como referência. Os assets permanecem em `src/assets`.

O destino configurado continua sendo GitHub Pages, em `/fs_portfolio/`. Nenhuma publicação é realizada automaticamente.
