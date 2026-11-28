# Créditos de áudio

As trilhas, os efeitos e as gravações são servidos com o portfólio. Os arquivos estão em [src/assets/audio](src/assets/audio). A licença indicada vale para cada recurso listado.

- [Trilhas sonoras](#trilhas-sonoras)
- [Efeitos sonoros](#efeitos-sonoros)
- [Vozes e narrações](#vozes-e-narrações)

## Trilhas sonoras

### Vila e salão do trono

| Uso | Faixa, autoria e fonte | Licença |
| --- | --- | --- |
| Vila | [The Bard's Tale, RandomMind](https://opengameart.org/content/medieval-the-bards-tale) | CC0 |
| Salão do trono de Felipe | [King's Feast, RandomMind](https://opengameart.org/content/medieval-kings-feast) | CC0 |

### Dragão Maligno e Castelo Amaldiçoado

| Uso | Faixa, autoria e fonte | Licença |
| --- | --- | --- |
| Aldeia do Templo Antigo | [Medieval 5 (medievalvillagesquare), Tozan](https://opengameart.org/content/medieval-5) | CC0 |
| Caverna do Ancião | [Battle Theme, Wolfgang_](https://opengameart.org/node/16611) | CC0 |
| Batalhas contra o dragão e o rei | [Epic Boss Battle, Juhani Junkala (SubspaceAudio)](https://opengameart.org/content/boss-battle-music). Convertida de WAV para Ogg Vorbis. | CC0 |
| Vitória sobre o dragão | [Treasure Hunter, TAD](https://opengameart.org/content/treasure-hunter) | CC0 |
| Arredores do Castelo | [Abandoned Castle Music (Loop), StarNinjas](https://opengameart.org/content/abandoned-castle-music-loop) | CC0 |
| Corredor do Infinito | [Dark Shrine Loop, qubodup](https://opengameart.org/content/dark-shrine-loop), remix de *Shrine*, de yd. | CC0 |
| Confronto com a bruxa | [Determined Pursuit, Emma_MA](https://opengameart.org/content/determined-pursuit-epic-orchestra-loop). Convertida de WAV para Ogg Vorbis. | CC0 |
| Xadrez de Bruxo | [Whispers in the Fog, Ruhinre](https://opengameart.org/content/whispers-in-the-fog). Ogg original reproduzido em loop. | CC0 1.0 |
| Vitória sobre o rei | [Medieval: Victory Theme, RandomMind](https://opengameart.org/content/medieval-victory-theme) | CC0 |

### Protocolo Ômega

| Uso | Faixa, autoria e fonte | Licença |
| --- | --- | --- |
| Hangar de chegada | [Lost in a bad place, congusbongus](https://opengameart.org/content/lost-in-a-bad-place-horror-ambience-loop). Loop de cordas e sinais distantes. | CC0 1.0 |
| Centro de Comando | [The Cogs, turtletooth](https://opengameart.org/content/the-cogs). Convertida para Ogg com redução de 7,4 dB. | CC0 1.0 |
| Confronto com NEXUS | [Hard Boss Battle 1, MintoDog](https://opengameart.org/content/hard-boss-battle-1). Ogg original reproduzido em loop. | CC0 1.0 |

O laboratório e o reator reaproveitam as trilhas do hangar e do Centro de Comando. [Texto legal da licença CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

## Efeitos sonoros

### Pergaminho da vila

Os três efeitos são trechos em mono de gravações de [rubberduck](https://opengameart.org/content/100-cc0-metal-and-wood-sfx), sob [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). A abertura e o fechamento começam em silêncio para sincronizar a batida de madeira com o fim do movimento.

| Uso | Arquivo local | Gravação original |
| --- | --- | --- |
| Abertura | [parchment-open.wav](src/assets/audio/effects/parchment-open.wav) | `wood_hit_01.ogg` |
| Fechamento | [parchment-close.wav](src/assets/audio/effects/parchment-close.wav) | `wood_hit_03.ogg` |
| Botões | [parchment-button.wav](src/assets/audio/effects/parchment-button.wav) | `wood_hit_05.ogg` |

### Campanhas

- **Portão do Castelo Amaldiçoado** — [Iron Door, themightyglider](https://opengameart.org/content/iron-door), CC0.
- **Gritos dos soldados** — [Male Grunt/Yelling sounds, HaelDB](https://opengameart.org/content/male-gruntyelling-sounds), CC0. Trechos convertidos de WAV para Ogg.
- **Xadrez de Bruxo** — Corte, coice, catapulta, arrebatamento, beijo e cadeirada. Sintetizados em [VillageAudio.js](src/audio/VillageAudio.js) para o projeto e disponibilizados sob [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).
- **Protocolo Ômega** — Contenção, scanner e confirmações dos consoles sintetizados para o projeto. Os efeitos de pressão e gravidade do Núcleo estão em [omega/nexus](src/assets/audio/effects/omega/nexus).

## Vozes e narrações

As gravações da vila e das campanhas de fantasia foram geradas com **Eleven Multilingual v2**. São 96 falas de 28 personagens, com 48 arquivos por idioma. Cada personagem usa a mesma voz em português brasileiro e inglês americano. O [manifesto](src/assets/audio/elevenlabs-manifest.json) identifica as vozes, os textos e os arquivos locais.

| Personagens | Vozes |
| --- | --- |
| Bia, Tom, Lia, Rui e Felipe | Alice, Charlie, Laura, Roger e Chris, respectivamente. |
| Marina e Duarte | Sarah e Callum. |
| Alden, Davi e Mara | George, Eric e Lily. |
| Aruã, Jaci, Potira, Cauã e Tupã | River, Brian, Lauren A, Harry e Adam. |
| Iara, Ubiratan, Araci, Apoena, Moema e Abaré | Crystal Erickson, Daniel, Emily E., Paul, Navira K e Bill. |
| Ceci, Cauê e Yara | Gudiya – Innocent Kid Narrator, Piku – Expressive Kid Character e Munni – Animated Kid Character. |
| Princesa Elara | Matilda nas duas campanhas. |
| Rei, bruxa e Dragão Ancião | Vozes personalizadas `cursed king`, `old witch` e `dragon`. |

As narrações do portfólio estão nas pastas [pt-br/narration](src/assets/audio/pt-br/narration) e [en-us/narration](src/assets/audio/en-us/narration).

### Protocolo Ômega

As transmissões da estação e de NEXUS usam **Britney – Calm and Calculative Villain**, também listada como **Brittney – Female Villain, Wicked and Deliciously Dark** (`esy0r39YPLQjOczyOib8`), com **Eleven Flash v2.5**. São 86 falas integradas em cada idioma.

| Setor | PT-BR | EN-US |
| --- | ---: | ---: |
| Hangar de chegada | 7 | 7 |
| Centro de Comando | 7 | 7 |
| Laboratório e reator | 7 | 7 |
| Núcleo NEXUS | 65 | 65 |

As gravações estão nas pastas [pt-br/omega](src/assets/audio/pt-br/omega) e [en-us/omega](src/assets/audio/en-us/omega), com os arquivos do Núcleo nas respectivas subpastas `nexus`.

- **PT-BR** — [Primeiro fluxo](https://elevenlabs.io/app/flows/2Dr5UOXQwxfVNSHgWreY) · [Fluxo final](https://elevenlabs.io/app/flows/REcv1w8unILSzc1uiziY).
- **EN-US** — [Primeiro fluxo](https://elevenlabs.io/app/flows/uvMOsrSr7xQFghsL5z8f) · [Lotes seguintes](https://elevenlabs.io/app/flows/zMaZ5dG1SHga7fkjUxJG) · [Fluxo final](https://elevenlabs.io/app/flows/nhmcVwOLrAD7ufBmHxSg).
