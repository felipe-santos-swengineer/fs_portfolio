import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenuAlt2 } from 'react-icons/hi';
import { FaMapMarkedAlt } from 'react-icons/fa';
import temaAudio from './assets/audio/dndAdventure_NCS.mp3';
import bemVindoAudio from './assets/audio/bem_vindo_bill_voice.mp3';
import inicioAudio from './assets/audio/inicio_bill_voice.mp3';
import motivacaoAudio from './assets/audio/motivacao_bill_voice.mp3';
import MapaVertical from './components/MapaVertical';
import Aventureiro from './assets/images/warrior_climb.gif';
import Escolaridade from './assets/images/escolaridade.png';
import Habilidades from './assets/images/habilidades.png';
import Interesses from './assets/images/interesses.png';
import { FaPlay, FaStop } from 'react-icons/fa';
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
  const textos = [
    `🧙 Em uma pequena cidade do sertão cearense, um jovem guerreiro do conhecimento iniciou sua jornada em 2018. Por meio do portal místico conhecido como SISU, e enfrentando as forças da ampla concorrência, conquistou seu ingresso na lendária Universidade Federal do Ceará — campus Russas.
📘 Durante anos de intensos estudos e batalhas contra códigos indomáveis, este aventureiro alcançou o bacharelado em Engenharia de Software — dominando magias de requisitos, forjando estruturas de dados e decifrando runas de programação.
⚔️ Ao final da formação, atravessou os portões da academia direto para os campos de batalha do mercado, onde passou a aplicar suas habilidades como um verdadeiro herói digital. Hoje, segue aprimorando sua técnica, pronto para enfrentar os maiores bugs e monstros de produção.`,
    'Texto sobre a segunda imagem',
    'Texto sobre a terceira imagem'
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

  //array de booleanos que define se um audio esta tocando ou nao
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isPlaying3, setIsPlaying3] = useState(false);
  const [isPlaying4, setIsPlaying4] = useState(false);

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
      console.error("Erro ao iniciar som:", err);
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
    audioRef2.current.currentTime = 0;
    audioRef3.current.currentTime = 0;
    audioRef4.current.currentTime = 0;
    setIsPlaying2(false);
    setIsPlaying3(false);
    setIsPlaying4(false);
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

  return (
    <div>
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
      <div className="container-basic">
        <div className="container-content">
          <div className="divDialogMain">~INTRODUÇÃO~</div>
          <div className="divDialog" style={{ marginTop: '20px' }}>
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
            <div className="divDialog" style={{ marginTop: '20px' }}>
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
              <img src={Aventureiro} class="guerreiro" />
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
            <div className="divDialog" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column' }}>
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
                      <li>⚔️ <strong>Bolsista desenvolvedor Full-Stack</strong> — Participou de campanhas em projetos reais, entregando interfaces responsivas e interativas.</li>
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
                      <li>🧪 <strong>Desenvolvimento Front-End</strong> — Criou soluções digitais para promover a inovação pública, empresarial e científica.</li>
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
                      <li>🧙‍♂️ <strong>Magias Front-End:</strong> HTML5, CSS3, JavaScript, React.js, Tailwind, animações com Framer Motion.</li>
                      <li>🛠️ <strong>Ferramentas do Arsenal:</strong> Git, GitHub, Figma, VSCode, Vite, APIs REST.</li>
                      <li>🔍 <strong>Perícias Especiais:</strong> Criação de UIs responsivas, experiências visuais imersivas, performance otimizada.</li>
                      <li>📦 <strong>Inventário Adicional:</strong> Conhecimento básico em back-end (Node.js), versionamento, e resolução de bugs malditos.</li>
                    </ul>
                  </div>
                  : ''
                }
              </div>
            </div>

          </section>

          <section ref={projetosRef} id="projetos">PROJETOS</section>
          <section ref={contatoRef} id="contato">CONTATO</section>
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
    </div >
  );
}
