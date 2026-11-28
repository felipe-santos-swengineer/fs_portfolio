# Portfólio 2D · Modo leitura

O **Modo leitura** é a versão editorial do portfólio, voltada à consulta rápida por recrutadores, empresas e visitantes. Use o botão no cabeçalho para entrar e **Modo 3D** para voltar à [vila interativa](versao-3d.md). A página 2D funciona sem depender de WebGL.

## Seções

| Seção | Conteúdo |
| --- | --- |
| Sobre mim | A curiosidade que move a jornada, formação, habilidades e interesses. |
| Tecnologias | Competências de front-end, back-end e APIs, dados, qualidade, ferramentas, agentes e IA local. |
| Experiência profissional | Linha do tempo com instituições, cargos, períodos e atividades. |
| Formação e cursos | Graduação, curso técnico e programas de formação complementar. |
| Projetos | Grade com descrições, contexto, tecnologias, galerias e links disponíveis. |
| Contato | Acesso direto a e-mail, telefone, LinkedIn e Instagram. |

A apresentação inicial concentra os atalhos para projetos, contato, GitHub e LinkedIn. Na navegação, a seção atual é sinalizada conforme a rolagem. Em telas menores, o menu de seções pode ser aberto e recolhido. As narrações disponíveis em **Sobre mim** e **Projetos** podem ser reproduzidas pelos controles de áudio de cada seção.

## Idioma e acessibilidade

O cabeçalho permite alternar entre português brasileiro e inglês americano, acessar os controles de áudio e ajustar tamanho do texto, contraste, fonte e movimento. A navegação funciona por teclado, com foco visível e link para pular ao conteúdo. A paleta compartilha o fundo azul-escuro, os detalhes verdes e os destaques dourados da versão 3D.

## Implementação

- [ReadingPortfolio.js](../../src/components/ReadingPortfolio.js) monta a apresentação, a navegação e a estrutura editorial.
- [ReadingPortfolio.css](../../src/components/ReadingPortfolio.css) define o layout responsivo e a apresentação das seções.
- [EditorialQualifications.js](../../src/components/EditorialQualifications.js) exibe competências e formação com os dados das [barracas](../../src/components/MarketStalls.js).
- [content.js](../../src/content.js) e [content.en.json](../../src/content.en.json) reúnem o conteúdo compartilhado com a vila.
