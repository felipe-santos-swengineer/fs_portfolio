# Convenções da experiência 3D

Estas regras se aplicam a novos mapas e a alterações nos mapas existentes. Siga-as automaticamente, sem pedir que o usuário repita os padrões. Instruções específicas do usuário têm prioridade sobre estas convenções.

## Referências e reaproveitamento

- Antes de criar um elemento recorrente, examine a referência indicada abaixo e mantenha consistentes aparência, escala, interface e comportamento. Prefira reaproveitar ou extrair componentes e funções compartilhados; evite implementar uma variante incompatível em cada mapa.
- Os mapas existentes podem ter diferenças históricas: a referência indicada aqui é o padrão para novas implementações. Não altere outros mapas fora do escopo solicitado apenas para uniformizá-los.
- Preserve português e inglês, controles de teclado e toque, configurações de acessibilidade e áudio, pausa, limpeza de recursos e navegação de volta. Não introduza recursos que anunciem funcionalidades ainda não implementadas.

## Portal de retorno à vila

- O portal do lago é a referência obrigatória para todo portal de retorno à vila: veja `src/components/Lake.js`, `src/components/lakePortal.js` e `src/components/dungeonPortalTap.js`. Reproduza fielmente o modelo, cores, proporções, iluminação, placa, interface e comportamento, salvo instrução explícita diferente.
- Mantenha o retorno por contato com o portal, por interação de proximidade com a tecla indicada e por clique/toque no próprio portal, conforme o lago. O retorno deve funcionar em teclado, mouse e toque, limpar as teclas pressionadas e evitar disparos duplicados. Preserve o destino e o posicionamento de retorno à vila definidos pelo fluxo existente.
- Mostre a placa e os textos nos dois idiomas. Não substitua o contato pelo portal por um botão de tela ou atalho isolado; um botão adicional pode coexistir quando solicitado ou necessário para acessibilidade.

## Interface das campanhas e botão de portal

- Use um único botão com ícone de portal no canto superior direito para a navegação entre mapas. Reaproveite `src/components/CampaignNavigation.js` e o modal em `src/App.js`. O modal permite voltar à vila, voltar ao mapa anterior, reiniciar o mapa atual e avançar ao próximo mapa ou campanha. Desabilite as opções sem destino. Ao abrir, pause a cena e limpe as teclas pressionadas. Permita fechar com Escape.
- Organize os painéis de status à esquerda em uma coluna, com o topo alinhado ao botão de portal e margens laterais simétricas. Use o espaçamento e os estilos compartilhados de `src/components/Lake.css`. Reserve espaço para textos em português e inglês e deixe os painéis crescerem sem sobreposição, inclusive no celular.
- Use o controle global **Ocultar UI** para esconder o botão de portal e os painéis opcionais. Mantenha disponíveis o controle de reexibir a UI, os diálogos ativos e as ações necessárias para continuar o jogo. Nas corredeiras, com a UI ligada, o portal permanece visível na abertura, durante a descida e no resultado. Sua visibilidade depende apenas desse controle.
- Mantenha a vida do jogador visível e atualizada sempre que o mapa usar esse indicador, inclusive durante a exploração da Caverna do Ancião com **Ocultar UI** ativado. Em lutas contra chefes, inclusive contra a bruxa e o dragão, mantenha também a vida restante do chefe visível e atualizada. Aplique a ocultação aos detalhes opcionais, como objetivos, informações de checkpoint e fases do combate.
- Na luta contra o dragão, o golpe final encerra a exibição do painel de vidas do jogador e do chefe. Mantenha o painel oculto durante a animação de morte e a celebração.
- Ao voltar ou avançar entre mapas, reinicie o estado de jogo do destino. Portas e selos começam fechados, mecanismos voltam à posição inicial e chefes derrotados reaparecem com a vida completa. Trate o ponto de chegada separadamente do progresso da visita anterior.

## NPCs cenográficos e balões de diálogo

- Para NPCs que apenas comentam o ambiente sem abrir uma conversa, siga os balões acima da cabeça dos prisioneiros em `src/components/Dungeon.js` e dos moradores em `src/components/dragonAftermath.js`: formato, cores, escala, legibilidade, posicionamento e texto localizado em português e inglês.
- Alterne as falas ao longo do tempo quando houver mais de uma, sem interromper a navegação. Respeite pausa e movimento reduzido nas animações do personagem. Balões são texto visual; não anuncie nem adicione voz gravada para eles sem que isso seja necessário ao pedido.
- Use os personagens e proporções de `src/components/VillageScene.js` e `addFaceDetails` como referência visual. Evite modelos que destoem dos moradores já existentes.

## NPCs interativos

- Siga o padrão dos moradores da vila inicial e da Marina no lago: personagem proporcional ao estilo do jogo, placa legível acima da cabeça com nome e indicação de interação, indicação de proximidade, interação por teclado e alternativa acessível para mouse e toque.
- Use a estrutura visual `.npc-dialogue`, `.npc-dialogue-heading` e `.npc-dialogue-actions` existente em `src/App.css` e os componentes de diálogo já usados no projeto. O diálogo deve apresentar nome, papel e fala; permitir avançar quando houver mais de uma fala, ouvir/parar a voz e fechar; suportar Escape e retornar o foco ao cenário.
- Forneça falas correspondentes em português e inglês e áudio local correspondente nos dois idiomas, seguindo `src/audio/VillagerSpeech.js` e os perfis de vozes existentes. Respeite som geral, canal de vozes, pausa, troca de idioma e falhas de reprodução; mantenha o texto disponível mesmo sem áudio e atenue a música durante a fala conforme o mecanismo existente.
- NPCs que apresentam o mapa ao jogador formam um tipo específico de NPC interativo: eles se orientam continuamente para o jogador. Para esse comportamento, use `src/components/facePlayer.js`, inclusive quando o jogador ou o personagem estiver dentro de outro objeto transformado. Preserve as demais animações e a opção de movimento reduzido.
- Não aplique esse giro automaticamente a todos os NPCs interativos. Outros personagens podem patrulhar, caminhar ou manter a orientação própria de sua cena; só altere esse comportamento quando o papel de guia ou uma instrução específica exigir.

## Tutoriais e controles

- Em telas menores, coloque as setas de movimento imediatamente abaixo da área jogável, antes de missões, destinos e ações de desafio. Agrupe os botões na ordem **setas**, **Interagir**, **Atacar**, conforme as ações disponíveis no mapa. Permita a quebra de linha quando faltar espaço.
- Nos mapas que usam F ou E, use `src/components/TouchInteract.js` para oferecer **Interagir** junto às setas. Cada toque deve executar uma única ação de contexto, seguindo as condições do teclado. Mantenha o botão visível e desabilitado, com aparência esmaecida, enquanto não houver um alvo próximo com uma ação disponível. Reavalie a disponibilidade ao se afastar, concluir a ação, abrir um diálogo ou pausar.
- Para o ataque de toque, siga o botão da caverna e reutilize `src/components/TouchAttack.js`, com o mesmo estilo e os rótulos em português e inglês. Posicione **Atacar** após **Interagir**. Na câmara do dragão, exiba o botão durante o combate e desabilite-o quando o jogo estiver pausado.

- Use `src/components/MapControlGuide.js` e os guias `.scene-guide` existentes como referência. Mostre apenas comandos que o mapa realmente oferece, com versões adequadas para teclado e toque e textos nos dois idiomas.
- Separe as instruções com espaço, sem bolinhas ou pontos de interrogação decorativos. Preserve a legibilidade em celular e os nomes acessíveis dos botões.
- Em mapas que permitem correr com Shift, permita girar a câmera enquanto Shift está pressionado; use `src/components/runAndRotate.js` com os controles de órbita quando aplicável. Evite que teclas fiquem presas ao perder foco, pausar ou sair.

## Áudio e campanhas

- Em todos os mapas, mantenha os passos silenciosos ao caminhar ou correr. Esta regra vale para o jogador e os NPCs, em qualquer superfície.

- Integre música e efeitos aos controles de áudio existentes, sem reprodução independente que ignore as preferências. Para músicas e efeitos externos, use recursos CC0 quando disponíveis e registre autor, licença e fonte em `MUSIC_CREDITS.md` ou no arquivo de créditos apropriado.
- No menu do portal, mantenha campanhas agrupadas e recolhidas inicialmente; numere as salas na ordem da campanha. As imagens devem ser coerentes com o estilo e com a expectativa do jogo, evitando arte realista que sugira visuais que o mapa não possui.

## Verificação

- Teste os fluxos alterados, incluindo contato e retorno de portais, proximidade e encerramento de diálogo, áudio e controles relevantes. Verifique renderização e interação nos tamanhos de tela pertinentes quando houver acesso ao navegador. Se a verificação visual ou auditiva não for possível, informe essa limitação ao concluir.
- Execute os testes relevantes e a compilação quando a alteração atingir código de produção. Para animações, evite intervalos de quadro negativos e respeite movimento reduzido; consulte `src/components/sceneFrameDelta.js`.

## Restrições de execução e validação

- Para reduzir o tempo de execução e o consumo de recursos:
- NÃO execute Playwright.
- NÃO execute testes E2E.
- NÃO utilize automação de navegador.
- NÃO capture screenshots.
- NÃO inicie o servidor de desenvolvimento.
- NÃO execute testes automatizados.
- NÃO instale ferramentas de validação.
- NÃO realize ciclos repetitivos de verificação.
- NÃO execute processos de monitoramento contínuo.
- A validação visual e funcional será realizada manualmente por mim.
