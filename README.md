# Felipe Santos · Portfólio

Portfólio de engenharia de software com duas formas de explorar minha trajetória, competências e projetos. A vila 3D oferece navegação, personagens e campanhas. O modo leitura apresenta o conteúdo profissional em uma página 2D, com acesso direto a projetos e contatos.

**[Visitar o portfólio](https://felipe-santos-swengineer.github.io/fs_portfolio/)**

## Versões

| Versão | O que encontrar | Documentação |
| --- | --- | --- |
| Vila 3D | Edifícios e barracas interativos, pergaminhos, diálogos com moradores e três campanhas. | [Guia da versão 3D](docs/portfolio/versao-3d.md) |
| Modo leitura (2D) | Apresentação, competências, linha do tempo, formação, projetos e contato. | [Guia da versão 2D](docs/portfolio/versao-2d.md) |

Use **Modo leitura** ou **Modo 3D** no cabeçalho para trocar de versão. As duas oferecem português e inglês, controles de áudio e preferências de acessibilidade. A vila 3D requer WebGL 2.

## Campanhas e áudio

As campanhas são acessadas pelo portal da vila. O menu de cada mapa oferece ações de navegação, reinício e retorno quando disponíveis.

- [Dragão Maligno](docs/campanhas/01-dragao-maligno.md)
- [Castelo Amaldiçoado](docs/campanhas/02-castelo-amaldicoado.md)
- [Protocolo Ômega](docs/campanhas/03-protocolo-omega.md)

Música, efeitos, vozes e narrações têm controles próprios. As gravações já fazem parte do repositório. [Créditos de áudio](MUSIC_CREDITS.md).

## Desenvolvimento

O projeto usa React 19, JavaScript, Create React App, Three.js para WebGL 2 e Web Audio API para efeitos. O workflow usa Node.js 20.

```sh
git clone https://github.com/felipe-santos-swengineer/fs_portfolio.git
cd fs_portfolio
npm ci
npm start
```

O servidor de desenvolvimento é disponibilizado em `http://localhost:3000`. Use `npm run build` para gerar a versão de produção em `build/`. Consulte [AGENTS.md](AGENTS.md) para as convenções e restrições de trabalho no projeto.

### Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| [docs/portfolio](docs/portfolio) | Guias das versões 3D e 2D. |
| [docs/campanhas](docs/campanhas) | Documentação das campanhas. |
| [src/App.js](src/App.js) | Navegação, estado e troca de modo. |
| [src/components](src/components) | Interfaces, cenas, controles e acessibilidade. |
| [src/content.js](src/content.js) e [src/content.en.json](src/content.en.json) | Textos e projetos em português e inglês. |
| [src/audio](src/audio) e [src/assets/audio](src/assets/audio) | Reprodução, efeitos e arquivos de áudio. |
| [scripts](scripts) | Utilitários de build e geração de vozes. |

## Publicação

O [workflow de verificação e publicação](.github/workflows/check.yml) gera o build em pushes e pull requests de `main`. Pushes para `main` também publicam no GitHub Pages. Em **Settings → Pages**, a origem é **GitHub Actions**. O caminho base `/fs_portfolio/` está definido em `package.json`.

O cabeçalho mostra o identificador abreviado do commit usado no build. O identificador completo aparece ao passar o cursor sobre a versão.

## Contato

[LinkedIn](https://www.linkedin.com/in/felipe-santos-rodrigues/) · [GitHub](https://github.com/felipe-santos-swengineer) · [E-mail](mailto:felipesantosswengineer@gmail.com)
