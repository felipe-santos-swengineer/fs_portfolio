import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { HiMenuAlt2 } from 'react-icons/hi';
import { FaMapMarkedAlt, FaPlay, FaStop } from 'react-icons/fa';
import temaAudio from './assets/audio/dndAdventure_NCS.mp3';
import bemVindoAudio from './assets/audio/bem_vindo_bill_voice.mp3';
import inicioAudio from './assets/audio/inicio_bill_voice.mp3';
import motivacaoAudio from './assets/audio/motivacao_bill_voice.mp3';
import projetosAudio from './assets/audio/projetos_bill_voice.mp3';
import MapaVertical from './components/MapaVertical';
import Aventureiro from './assets/images/warrior_climb.gif';
import Escolaridade from './assets/images/escolaridade.png';
import Habilidades from './assets/images/habilidades.png';
import Interesses from './assets/images/interesses.png';
import Luta from './assets/images/fight.gif';
import Magelvl0 from './assets/images/lvl0.png';
import Magelvl1 from './assets/images/lvl1.png';
import Magelvl2 from './assets/images/lvl2.png';
import Magelvl3 from './assets/images/lvl3.png';
import SliderProjeto from "./components/SliderProjeto";
import Talkdoor1 from './assets/images/talkdoor1.png';
import Talkdoor2 from './assets/images/talkdoor2.png';
import Talkdoor3 from './assets/images/talkdoor3.png';
import Talkdoor4 from './assets/images/talkdoor4.png';
import Talkdoor5 from './assets/images/talkdoor5.png';
import Talkdoor6 from './assets/images/talkdoor6.png';
import Vitrine1 from './assets/images/vitrine1.png';
import Vitrine2 from './assets/images/vitrine2.png';
import Vitrine3 from './assets/images/vitrine3.png';
import Vitrine4 from './assets/images/vitrine4.png';
import Vitrine5 from './assets/images/vitrine5.png';
import Tetris1 from './assets/images/tetris1.png';
import Tetris2 from './assets/images/tetris2.png';
import Tetris3 from './assets/images/tetris3.png';
import Ldc0 from './assets/images/ldc0.png';
import Ldc1 from './assets/images/ldc1.png';
import Ldc2 from './assets/images/ldc2.png';
import Ldc3 from './assets/images/ldc3.png';

import "./App.css";

export default function App() {

  //pop-up inicial para ativar som
  const [showPopup, setShowPopup] = useState(true);

  //drawer lateral de configuracao
  const [isExpanded, setIsExpanded] = useState(false);

  //drawer sobre
  const [selecionado, setSelecionado] = useState(0);
  const titulos = [
    'Escolaridade',
    'Experiência e Habilidades',
    'Personalidade e Interesses'
  ];

  const imagens = [
    `url(${Escolaridade})`,
    `url(${Habilidades})`,
    `url(${Interesses})`
  ];

  //array de audios
  const audioRef = useRef(null);
  const audioRef2 = useRef(null);
  const audioRef3 = useRef(null);
  const audioRef4 = useRef(null);
  const audioRef5 = useRef(null);

  //array de booleanos que define se um audio esta tocando ou nao
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isPlaying3, setIsPlaying3] = useState(false);
  const [isPlaying4, setIsPlaying4] = useState(false);
  const [isPlaying5, setIsPlaying5] = useState(false);

  //referencias do mapa
  const mapaRef = useRef(null);
  const inicioRef = useRef(null);
  const sobreRef = useRef(null);
  const projetosRef = useRef(null);
  const contatoRef = useRef(null);

  //iniciar som de background
  const handleEnableSound = () => {
    audioRef.current.volume = 0.2;
    audioRef.current.play().then(() => {
      setShowPopup(false);
    }).catch(err => {
      //console.error("Erro ao iniciar som:", err);
      setShowPopup(false);
    });
  };

  //funcao para rolar a tela na secao do mapa
  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  //reseta e desliga todos os audios da narracao
  const reiniciarAudios = () => {
    audioRef2.current.pause();
    audioRef3.current.pause();
    audioRef4.current.pause();
    audioRef5.current.pause();
    audioRef2.current.currentTime = 0;
    audioRef3.current.currentTime = 0;
    audioRef4.current.currentTime = 0;
    audioRef5.current.currentTime = 0;
    setIsPlaying2(false);
    setIsPlaying3(false);
    setIsPlaying4(false);
    setIsPlaying5(false);
  }

  //audio de bem vindo
  const toggleAudio2 = () => {
    reiniciarAudios();
    if (isPlaying2) {
      reiniciarAudios();
    } else {
      audioRef2.current.volume = 0.3;
      audioRef2.current.play();
    }
    setIsPlaying2(!isPlaying2);
  };

  //audio do inicio
  const toggleAudio3 = () => {
    reiniciarAudios();
    if (isPlaying3) {
      reiniciarAudios();
    }
    else {
      audioRef3.current.volume = 0.3;
      audioRef3.current.play();
    }
    setIsPlaying3(!isPlaying3);
  };

  //audio da motivacao
  const toggleAudio4 = () => {
    reiniciarAudios();
    if (isPlaying4) {
      reiniciarAudios();
    }
    else {
      audioRef4.current.volume = 0.3;
      audioRef4.current.play();
    }
    setIsPlaying4(!isPlaying4);
  };

  //audio da motivacao
  const toggleAudio5 = () => {
    reiniciarAudios();
    if (isPlaying5) {
      reiniciarAudios();
    }
    else {
      audioRef5.current.volume = 0.3;
      audioRef5.current.play();
    }
    setIsPlaying5(!isPlaying5);
  };

  //evolucao do personagem
  const refChar = useRef(null);
  const { scrollYProgress } = useScroll({
    target: refChar,
    offset: ["start end", "end start"],
  });

  // Transforma o progresso (0 a 1) em nível 0 a 100
  const levelProgress = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Armazena o nível como número para exibir normalmente
  const [level, setLevel] = useState(0);

  // Atualiza o estado toda vez que o valor animado muda
  useMotionValueEvent(levelProgress, "change", (latest) => {
    setLevel(Math.floor(latest));
  });

  // Transforma o nível (0–100) em um efeito visual de brilho
  const boxShadow = useTransform(levelProgress, [0, 100], [
    "0 0 0px #00ffff",
    "0 0 40px #00ffff",
  ]);

  //seleciona o nivel do mago
  function getMageSprite(level) {
    if (level < 25) return Magelvl0;
    if (level < 50) return Magelvl1;
    if (level < 75) return Magelvl2;
    return Magelvl3;
  }

  //projetos

  const projetos = [
    {
      id: 1,
      titulo: "Talkdoor",
      descricao: `Este projeto foi uma rede social 📱 
      desenvolvida durante o TCC 🎓, voltada para o ambiente 
      universitário 🏫, com o objetivo de conectar estudantes 👩‍🎓👨‍🎓, 
      professores e pesquisadores em torno de interesses acadêmicos 📚. 
      A plataforma permitia compartilhar conteúdos como artigos 📄, eventos 📅, 
      discussões de disciplinas 💬, projetos de pesquisa 🔍 e oportunidades acadêmicas 🎯. 
      Focada em colaboração 🤝 e troca de conhecimento 🧠, a rede fortalecia a comunidade 
      interna da universidade e incentiva o engajamento intelectual, fazendo uso de algoritmos que
      priorizavam conteúdo baseado no perfil do usuário, assim como facebook e instagram 🚀.`,
      imagens: [
        Talkdoor1,
        Talkdoor2,
        Talkdoor3,
        Talkdoor4,
        Talkdoor5,
        Talkdoor6
      ],
      github: "https://github.com/felipe-santos-swengineer/tcc-front.git",
    },
    {
      id: 2,
      titulo: "Vitrine Funcap",
      descricao: `A Vitrine Funcap é uma plataforma online criada pela Funcap
      (Fundação Cearense de Apoio ao Desenvolvimento Científico e Tecnológico) para 
      divulgar e conectar projetos de pesquisa 🔬, inovação 💡 e empreendedorismo 🚀 
      desenvolvidos no Ceará com potenciais parceiros, investidores e a sociedade em geral.
      O site apresenta uma vitrine virtual 🖥️ de iniciativas financiadas pela fundação, 
      destacando seus impactos 🌍, soluções tecnológicas 🧠 e oportunidades de aplicação no mercado 💼.
      É um espaço que promove a visibilidade 👁️ dos resultados da ciência 
      cearense e facilita o contato 🤝 entre pesquisadores e o setor produtivo.`,
      imagens: [
        Vitrine1,
        Vitrine2,
        Vitrine3,
        Vitrine4,
        Vitrine5
      ],
      link: "https://vitrinefuncap.com"
    },
    {
      id: 3,
      titulo: "Tetris para 2 jogadores",
      descricao: `Desafie um amigo em uma partida de Tetris duelo 1 contra 1! ⚔️
      Monte suas peças rapidamente, complete linhas e envie obstáculos para o adversário.
      Mostre quem é o mestre do bloco nesse jogo cheio de estratégia, velocidade e competição! ⏱️🔥
      Prepare-se para muita emoção, reflexos e diversão sem parar ao som de uma batalha de Naruto! 🚀👾`,
      imagens: [
        Tetris1,
        Tetris2,
        Tetris3
      ],
      github: "https://github.com/felipe-santos-swengineer/Tetris_2_players_duel"
    },
    {
      id: 4,
      titulo: "Chronos-UFC",
      descricao: `O sistema foi desenvolvido para facilitar e organizar o processo de 
      registro das horas complementares dos alunos da Universidade Federal do Ceará 🏫.
      Os alunos cadastram suas atividades complementares diretamente na plataforma 💻, 
      anexando documentos comprobatórios e informando a carga horária realizada ⏱️.
      Os professores (ou coordenadores responsáveis) acessam o sistema para avaliar a 
      validade das atividades 📄, aprovando ou solicitando ajustes com comentários.
      📊 O sistema também permite o acompanhamento do progresso por categoria, 
      ajudando o aluno a visualizar o que ainda precisa ser cumprido para se formar com tudo em dia 🎯.`,
      imagens: [
        Ldc0,
        Ldc1,
        Ldc2,
        Ldc3
      ],
      github: "https://github.com/felipe-santos-swengineer/client-ldc"
    },
  ];

  return (
    <div ref={refChar}>
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Bem-vindo!</h2>
            <button onClick={handleEnableSound}>Iniciar a exploração!</button>
          </div>
        </div>
      )}
      {!showPopup && (
        <div className="mapa-wrapper">
          <motion.div
            className={`toggle-button ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            whileTap={{ scale: 0.9 }}
          >
            <HiMenuAlt2 size={24} color="#00ffff" />
          </motion.div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="mapa-content"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 240 }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 20 }}
              >
                <FaMapMarkedAlt onClick={() => scrollToSection(mapaRef)} size={24} color="#00ffff" style={{ cursor: 'pointer' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      {!showPopup && (
        <div className="mapa-wrapper2">
          <motion.div
            className={`toggle-button2`}
            whileTap={{ scale: 0.9 }}
          ><motion.div
            style={{ color: "white" }}
          >
              Nivel {level}
              <motion.div
                className="aura-wrapper"
                style={{
                  boxShadow,
                  border: "1px solid white",
                  backgroundColor: "#000",
                }}
              >
                <img
                  width='80px'
                  height='150px'
                  src={getMageSprite(level)}
                  alt="Personagem"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}
      <div className="container-basic">
        <div className="container-content">
          <div className="divDialogMain">~Introdução~</div>
          <div className="divDialog">
            <div className="textDialog">
              Bem-vindo(a) ao Portfólio de Felipe Santos! 🗡️<br /> <br />
              Prepare-se para uma jornada diferente: <br />
              Navegue pelo meu mundo através do mapa abaixo e escolha para onde deseja ir.
              Cada região revela um pouco mais sobre mim, meus projetos e minhas habilidades.<br /> <br />
              Clique em uma área do mapa para começar sua aventura! 🗺️
            </div>
            <button
              onClick={toggleAudio2}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                padding: '12px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '20px',
                transition: 'background 0.3s',
              }}
              title={isPlaying2 ? 'Parar música' : 'Tocar música'}
            >
              {isPlaying2 ? <FaStop style={{ color: 'red', fontSize: '50px' }} /> : <FaPlay style={{ color: 'green', opacity: 0.5, fontSize: '50px' }} />}
            </button>
          </div>
          <div ref={mapaRef} className="divMapa">
            <MapaVertical
              onIrParaInicio={() => scrollToSection(inicioRef)}
              onIrParaSobre={() => scrollToSection(sobreRef)}
              onIrParaProjetos={() => scrollToSection(projetosRef)}
              onIrParaContato={() => scrollToSection(contatoRef)}
            />
          </div>
          <div ref={inicioRef} className="divDialogMain">~Início~</div>
          <section id="inicio">
            <div className="divDialog">
              <div className="textDialog">
                ~Parte 1~
                <br /><br />
                ⚔️ Em tempos de vastas planícies digitais, onde cada desenvolvedor ergue seus castelos de código e design, eu escolhi um caminho diferente.
                Não foi em um salão de espelhos modernos que minha ideia nasceu, mas sim ao redor de uma fogueira imaginária, onde contos ganham vida e aventuras são escritas com paixão e propósito.
                <br /><br />
                Assim como heróis embarcam em jornadas para descobrir quem são e do que são capazes, eu também trilho minha estrada como desenvolvedor — enfrentando bugs como feras, aprendendo magias novas em forma de linguagens, e construindo ferramentas como espadas afiadas.
                <br /><br />
                Criar um portfólio no estilo RPG não foi apenas uma escolha estética. Foi um chamado. Uma forma de unir tudo que me inspira: o encantamento das histórias, a lógica do código e a busca constante por evolução.
                <br /><br />
                Neste mundo que criei, cada seção é uma vila, um santuário ou um campo de batalha. Cada projeto é uma relíquia da minha jornada. E você, visitante, é mais que um espectador — é um aventureiro convidado a explorar.
                <br /><br />
                Que esta terra digital conte minha história não apenas com palavras, mas com alma.✨
              </div>
              <button
                onClick={toggleAudio3}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '12px',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '20px',
                  transition: 'background 0.3s',
                }}
                title={isPlaying3 ? 'Parar música' : 'Tocar música'}
              >
                {isPlaying3 ? <FaStop style={{ color: 'red', fontSize: '50px' }} /> : <FaPlay style={{ color: 'green', opacity: 0.5, fontSize: '50px' }} />}            </button>
            </div>
          </section>
          <section className="container-animated-warrior" style={{ marginTop: '20px' }}>
            <div class="corda">
              <img src={Aventureiro} class="guerreiro" alt='guerreiro'/>
            </div>
            <div className="divDialog" >
              <div className="textDialog">
                ~Parte 2~
                <br /><br />
                🧙‍♂️ Desde cedo, sempre fui fascinado pelo que acontece “por trás da cortina” dos sites, aplicativos e jogos que uso diariamente ✨.
                <br /><br />
                A curiosidade de entender como aquelas interfaces ganhavam vida, como cada clique resultava em uma ação e como mundos inteiros podiam ser criados dentro de telas digitais 🏰🗡️
                me motivou a mergulhar no universo da tecnologia da informação 💻⚔️.
                <br /><br />
                Queria descobrir o que realmente acontece nos bastidores — as linhas de código, as estruturas, os algoritmos que dão forma àquilo que parece mágico para o usuário final 🧩📜.
                <br /><br />
                Essa vontade de desvendar esses mistérios e construir minhas próprias experiências digitais foi o que me impulsionou a seguir pelo caminho da TI, buscando transformar a curiosidade em conhecimento e a paixão em resultados concretos 🎯🔥.
              </div>
              <button
                onClick={toggleAudio4}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '12px',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '20px',
                  transition: 'background 0.3s',
                }}
                title={isPlaying4 ? 'Parar música' : 'Tocar música'}
              >
                {isPlaying4 ? <FaStop style={{ color: 'red', fontSize: '50px' }} /> : <FaPlay style={{ color: 'green', opacity: 0.5, fontSize: '50px' }} />}
              </button>
            </div>
          </section>
          <div ref={sobreRef} className="divDialogMain">~Sobre~</div>
          <section style={{ width: '100%' }}>
            <div className="divDialog" style={{ display: 'flex', flexDirection: 'column' }}>
              <div class="seletor-container-sobre">
                {imagens.map((bg, i) => (
                  <div
                    key={i}
                    className={`imagens-sobre ${selecionado === i ? 'selecionado' : 'nao-selecionado'}`}
                    style={{ backgroundImage: bg }}
                    onClick={() => setSelecionado(i)}
                  >
                    <div className="texto-imagem">
                      <p>{titulos[i]}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div class="descricao-sobre" id="descricao">
                {selecionado === 0 ?
                  <div>
                    🧙 Em uma pequena cidade do sertão cearense, um jovem guerreiro do conhecimento iniciou sua jornada em 2018. Por meio do portal místico conhecido como SISU, e enfrentando as forças da ampla concorrência, conquistou seu ingresso na lendária Universidade Federal do Ceará — campus Russas.
                    <br /><br />
                    📘 Durante anos de intensos estudos e batalhas contra códigos indomáveis, este aventureiro alcançou o bacharelado em Engenharia de Software — dominando magias de requisitos, forjando estruturas de dados e decifrando runas de programação.
                    <br /><br />
                    ⚔️ Ao final da formação, atravessou os portões da academia direto para os campos de batalha do mercado, onde passou a aplicar suas habilidades como um verdadeiro herói digital. Hoje, segue aprimorando sua técnica, pronto para enfrentar os maiores bugs e monstros de produção.
                  </div>
                  : ''
                }
                {selecionado === 1 ?
                  <div class="ficha-rpg">
                    <h3>🧭 Experiências</h3>
                    <ul>
                      <li>⚔️ <strong>Desenvolvedor Full-Stack</strong> — Participou de campanhas em projetos reais, entregando interfaces responsivas e interativas.</li>
                      <ul>
                        <li>🏢 Empresa: UFC</li>
                        <li>⏳ Duração: 04/2021 até 01/2022</li>
                        <li>📜 Resumo: Projeto para auxiliar alunos de cursos de graduação na
                          etapa de entrega das atividades complementares, através do desenvolvimento
                          de uma aplicação web para gestão das horas complementares.</li>
                      </ul>
                      <hr />
                      <li>🏰 <strong>Estagiário em Desenvolvimento Web</strong> — Aliou-se a uma guilda de programadores para manter sistemas e implementar novas funcionalidades.</li>
                      <ul>
                        <li>🏢 Empresa: Núcleo de soluções de Software UFC</li>
                        <li>⏳ Duração: 05/2021 até 09/2021</li>
                        <li>📜 Resumo: Garantir a excelência no desenvolvimento de software,
                          contribuindo para a formação profissional e crescimento tecnológico no Vale do Jaguaribe.
                          As atividades do estágio foram focadas no sistema Darwin, módulo responsável pela gestão de seleções e
                          competições, que tem sido utilizado para selecionar bolsistas para os programas disponibilizados
                          para o Campus da UFC em Russas, como PIBI, PAIP e PID.</li>
                      </ul>
                      <hr />
                      <li>🧪 <strong>Estagiário em Desenvolvimento Web</strong> — Manteve e desenvolveu novas soluções em ERP corporativo de uma guilda renomada.</li>
                      <ul>
                        <li>🏢 Empresa: TOTVS</li>
                        <li>⏳ Duração: 06/2022 até 05/2023</li>
                        <li>📜 Resumo: Desenvolvimento e manutenção do software ERP Protheus, trabalhando na linguagem Advpl ou em novas aplicações
                          com Javascript (react/node).</li>
                      </ul>
                      <hr />
                      <li>🧪 <strong>Desenvolvedor Front-End</strong> — Criou soluções digitais para promover a inovação pública, empresarial e científica.</li>
                      <ul>
                        <li>🏢 Empresa: Funcap</li>
                        <li>⏳ Duração: 08/2021 até 04/2025</li>
                        <li>📜 Resumo: Projeto para criar uma vitrine digital para exibição de dados
                          anuais da inovação pública e empresarial da Funcap, sendo feita sua primeira versão
                          com Javascript (react/node) e posteriormente alterada para php (laravel) após mudança na diretoria da organização.</li>
                      </ul>
                    </ul>

                    <h3>🔮 Habilidades</h3>
                    <ul>
                      <li>🧙‍♂️ <strong>Magias Front-End:</strong> HTML5, CSS3, JavaScript, React.js, laravel, Tailwind, entre outros.</li>
                      <li>🛠️ <strong>Ferramentas do Arsenal:</strong> Git, GitHub, VSCode, APIs REST.</li>
                      <li>🔍 <strong>Perícias Especiais:</strong> Criação de UIs responsivas, experiências visuais imersivas, performance otimizada.</li>
                      <li>📦 <strong>Inventário Adicional:</strong> Conhecimento em back-end (Node.js, php), versionamento, e resolução de bugs malditos.</li>
                    </ul>
                  </div>
                  : ''
                }
                {selecionado === 2 ?
                  <div>
                    <h3>Personalidade</h3>
                    <br />
                    Classe : Estrategista Criativo
                    <br /><br />
                    Atributos Dominantes: Curiosidade +4, Resiliência +3, Pensamento Analítico +5
                    <br /><br />
                    Traço de Personalidade: Sempre pronto para aprender uma nova habilidade ou aceitar uma missão desafiadora. Gosto de explorar ideias fora da rota principal e encontrar soluções que surpreendam até os NPCs mais experientes.
                    <br /><br />
                    <h3>Interesses</h3>
                    <br />
                    🔧 Tecnologia & Desenvolvimento: Especialista em React, com afinidade por criar interfaces envolventes e experiências interativas. Gosto de construir sistemas modulares, como se estivesse montando um inventário eficiente para longas jornadas.
                    <br /><br />
                    🎨 Design & Narrativa Visual: Fascinado por contar histórias através da estética. Acredito que cada detalhe visual carrega lore — desde a tipografia até a paleta de cores.
                    <br /><br />
                    🕹️ Games & RPGs: RPGs moldaram minha visão de mundo: colaboração, estratégia, progressão e liberdade criativa. São mais que um hobby — são uma linguagem.
                    <br /><br />
                    📚 Exploração Intelectual: Leio, estudo, pesquiso. Curto aprender frameworks, teorias de design, arquitetura de sistemas ou mesmo filosofia — tudo pode virar XP para a próxima missão.
                  </div>
                  :
                  ''
                }
              </div>
            </div>
          </section>
          <div ref={projetosRef} className="divDialogMain">~Projetos~</div>
          <img
            src={Luta}
            alt="combate"
            style={{ width: '100%', height: '450px' }}
          />
          <section className="container-animated-warrior">
            <div className="divDialog" >
              <div className="textDialog">
                Ao longo da minha jornada como desenvolvedor⚔️, enfrentei desafios dignos de um verdadeiro aventureiro digital.
                Cada projeto aqui é uma missão concluída 🧾 — com planejamento estratégico🧠,
                batalhas contra bugs épicos🐉 e a criação de soluções encantadas✨.
                <br /><br />
                Nesta seção, você encontrará relíquias do meu progresso📜: sistemas interativos🔧,
                interfaces mágicas🧙‍♂️, componentes reutilizáveis🧩 e códigos otimizados⚙️. Cada linha
                escrita é como uma escolha em combate entre performance⚡, acessibilidade🧿 e experiência do usuário💡.
                <br /><br />
                Prepare sua ficha🎲, equipe suas habilidades💼 e explore meus projetos.
                Quem sabe não encontramos uma nova quest para embarcar juntos? 🗺️
              </div>
              <button
                onClick={toggleAudio5}
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  padding: '12px',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: '20px',
                  transition: 'background 0.3s',
                }}
                title={isPlaying5 ? 'Parar música' : 'Tocar música'}
              >
                {isPlaying5 ? <FaStop style={{ color: 'red', fontSize: '50px' }} /> : <FaPlay style={{ color: 'green', opacity: 0.5, fontSize: '50px' }} />}
              </button>
            </div>
          </section>
          <div className="divDialog">
            <div className="lista-projetos">
              {projetos.map((projeto, index) => {
                const ordem = index % 2 === 0 ? 'normal' : 'invertido';
                return (
                  <div key={projeto.id} className={`projeto-linha ${ordem}`}>
                    <SliderProjeto imagens={projeto.imagens} />
                    <div className="projeto-texto">
                      <h3>{projeto.titulo}</h3>
                      <p>{projeto.descricao}</p>

                      <div className="projeto-botoes">
                        {projeto.github && (
                          <a
                            href={projeto.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="botao"
                          >
                            Ver no GitHub
                          </a>
                        )}
                        {projeto.link && (
                          <a
                            href={projeto.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="botao"
                          >
                            Ver Publicação
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <a href="https://github.com/felipe-santos-swengineer?tab=repositories" target="_blank" class="ver-mais-btn"  rel="noreferrer">
                <div>Ver mais</div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" >
                  <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-4.147-4.146a.5.5 0 1 1 .708-.708l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
                </svg>
              </a>
            </div>
          </div>
          <div ref={contatoRef} className="divDialogMain">~Contato~</div>
          <div className="divDialog" >
            <div className="textDialog">
              <table class="tabela-contato">
                <tbody>
                  <tr>
                    <td>📧 Email</td>
                    <td>felipesantosswengineer@email.com</td>
                  </tr>
                  <tr>
                    <td>📞 Telefone</td>
                    <td>(88) 99837-8028</td>
                  </tr>
                  <tr>
                    <td>💼 LinkedIn</td>
                    <td><a href="https://www.linkedin.com/in/felipe-santos-rodrigues/" target="_blank"  rel="noreferrer">linkedin.com/in/felipesantos</a></td>
                  </tr>
                  <tr>
                    <td>📸 Instagram</td>
                    <td><a href="https://www.instagram.com/felipe_santos_swengineer/" target="_blank"  rel="noreferrer">@felipe_santos_swengineer</a></td>
                  </tr>
                </tbody>
              </table>
              <br></br>
              <div>
                🛡️⚔️ Obrigado, bravo aventureiro! ⚔️🛡️
                <br></br>
                <br></br>
                Sua jornada por estas terras chegou a uma pausa, mas as portas estarão sempre abertas para você voltar!
                Que a sorte dos dados esteja ao seu favor 🍀, e que suas quests futuras sejam épicas! 🗡️✨
                <br></br>
                <br></br>
                Volte sempre para novas aventuras e desafios — a guilda agradece sua visita! Se deseja rever, use a função lateral para voltar ao  mapa.🏰🎉
              </div>
            </div>
          </div>
        </div >
      </div >
      <audio ref={audioRef} loop>
        <source src={temaAudio} type="audio/mpeg" />
      </audio>
      <audio ref={audioRef2} onEnded={() => setIsPlaying2(false)}>
        <source src={bemVindoAudio} type="audio/mpeg" />
      </audio>
      <audio ref={audioRef3} onEnded={() => setIsPlaying3(false)}>
        <source src={inicioAudio} type="audio/mpeg" />
      </audio>
      <audio ref={audioRef4} onEnded={() => setIsPlaying4(false)}>
        <source src={motivacaoAudio} type="audio/mpeg" />
      </audio>
      <audio ref={audioRef5} onEnded={() => setIsPlaying5(false)}>
        <source src={projetosAudio} type="audio/mpeg" />
      </audio>
    </div >
  );
}
