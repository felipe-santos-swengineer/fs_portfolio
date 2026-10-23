# Felipe Santos .Dev — Portfólio 3D

Um portfólio interativo em forma de vilarejo: explore o cenário com um personagem 3D e visite os edifícios para conhecer minha trajetória, habilidades, projetos e canais de contato. A experiência combina uma interface escura, câmera livre para rotação, textos e áudios, com uma alternativa de leitura sem o cenário 3D.

**[Visitar o portfólio](https://felipe-santos-swengineer.github.io/fs_portfolio/)**

## Explore a vila

| Destino | Conteúdo |
| --- | --- |
| Taverna | Apresentação, história e motivação |
| Biblioteca | Formação, experiências, habilidades e interesses |
| Oficina | Projetos, galerias de imagens e links |
| Correio | Contato e redes profissionais |

- Personagem articulado, obstáculos e câmera com rotação e zoom.
- Quatro moradores passeando pela vila, com diálogos em texto e gravações de vozes distintas.
- Dragão que sobrevoa o cenário e pousa nos telhados, com transição gradual entre dia e noite.
- Missão de visitar os quatro destinos, com uma breve celebração de fogos ao concluir.
- Painel de áudio com controle geral e ajustes independentes de música, passos, efeitos, vozes e narrações.
- Layout adaptado para celular, com controles de movimento na tela.

O botão **Recomeçar** reinicia o progresso da missão e a celebração, preservando a posição do personagem, dos moradores e da câmera.

## Controles

| Ação | Controle |
| --- | --- |
| Caminhar | WASD ou setas, com o cenário em foco |
| Rotacionar a câmera | Arrastar com o mouse ou um dedo; botões de rotação |
| Aproximar ou afastar | Roda do mouse, gesto de pinça ou botões de zoom |
| Abrir um edifício | Clicar nele ou pressionar E perto da entrada |
| Conversar com um morador | Clicar nele ou pressionar F quando estiver próximo |
| Fechar uma janela | Escape ou botão de fechar |
| Centralizar a câmera | Botão Focar personagem |

No celular, use os botões direcionais. As seções também podem ser abertas pelos atalhos da interface, sem precisar caminhar. Os atalhos do jogo só capturam teclas enquanto o cenário está em foco; Tab permite sair dele.

## Acessibilidade e áudio

O painel **Acessibilidade** oferece tamanho de texto, alto contraste, fonte simples, redução de movimentos, pausa das animações e modo leitura sem 3D. A interface inclui navegação por teclado, foco visível, link para pular ao conteúdo e gerenciamento de foco nas janelas. As preferências são salvas no navegador, e a redução de movimentos do sistema é respeitada.

O modo leitura permite acessar todas as seções e os diálogos dos moradores sem depender de WebGL. A experiência 3D requer um navegador com WebGL 2; o desempenho varia conforme o dispositivo.

O som geral começa desligado a cada visita. No painel **Áudio**, é possível ativar ou silenciar tudo ou escolher cada categoria individualmente. As narrações originais foram preservadas; as falas dos moradores são arquivos locais, sem consulta a serviços de voz durante a visita.

## Tecnologias

- React 19 e JavaScript, com Create React App.
- Three.js para a cena WebGL 2 e os controles de câmera.
- CSS para a interface responsiva e os ajustes de acessibilidade.
- Web Audio API para efeitos sonoros e arquivos de áudio para música e vozes.
- Jest, React Testing Library e axe-core para verificações automatizadas.
- GitHub Pages para hospedagem, com publicação via `gh-pages`.

## Executar localmente

Instale Node.js e npm. Depois:

```sh
git clone https://github.com/felipe-santos-swengineer/fs_portfolio.git
cd fs_portfolio
npm ci
npm start
```

Abra `http://localhost:3000`.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm start` | Iniciar o servidor de desenvolvimento |
| `npm test -- --watchAll=false --runInBand` | Executar a suíte de testes uma vez |
| `npm run build` | Gerar a versão de produção em `build/` |
| `npm run deploy` | Gerar o build e publicá-lo na branch `gh-pages` |
| `npm run generate:npc-voices` | Regenerar as gravações dos moradores |

A geração de vozes é uma ferramenta de desenvolvimento: exige internet e envia os textos ao serviço de síntese da Microsoft por meio de `msedge-tts`. As gravações já estão incluídas no projeto; esse comando não é necessário para executar ou publicar o site.

As verificações de acessibilidade automatizadas não substituem a avaliação visual e os testes com leitores de tela reais.

## Publicar no GitHub Pages

Com acesso de escrita ao repositório e autenticação Git configurada:

```sh
npm run deploy
```

O script `predeploy` executa o build antes da publicação. No repositório, em **Settings → Pages**, configure a origem como **Deploy from a branch**, selecionando **gh-pages** e **/ (root)**.

A URL base já está definida em `package.json` para `/fs_portfolio/`. Após publicar, aguarde o processamento do GitHub Pages. Se a versão anterior continuar aparecendo, atualize a página com Ctrl + F5.

O deploy publica os arquivos compilados. Para salvar o código-fonte, faça também commit e push das alterações na branch `main`; apenas enviar um commit para `main` não executa o deploy neste projeto.

## Organização do código

```text
public/                         HTML e arquivos públicos
scripts/generate-villager-voices.cjs
src/
  assets/                       Imagens, música, narrações e vozes
  audio/                        Reprodução e síntese de efeitos sonoros
  components/
    VillageScene.js             Cena 3D, personagens e interações
    VillageAtmosphere.js        Dragão e ciclo do céu
    MissionFireworks.js         Celebração da missão
    AccessibilitySettings.js    Preferências de acessibilidade
    AudioSettings.js            Preferências de áudio
    villageNavigation.js        Destinos e regras de movimentação
    villagers.js                Moradores, diálogos e rotas
  App.js                        Interface e estado da experiência
  content.js                    Textos e projetos do portfólio
  OriginalPortfolio.js          Componente original preservado como referência
```

Consulte [VILAREJO.md](VILAREJO.md) para detalhes do cenário, áudio, controles e comportamento dos recursos.

## Contato

**Felipe Santos**

[E-mail](mailto:felipesantosswengineer@gmail.com) · [LinkedIn](https://www.linkedin.com/in/felipe-santos-rodrigues/)
