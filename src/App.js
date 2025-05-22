// src/App.jsx
import { useState, useRef, useEffect } from "react";
import temaAudio from './assets/audio/dndAdventure_NCS.mp3';
import bemVindoAudio from './assets/audio/bem_vindo_bill_voice.mp3';
import inicioAudio from './assets/audio/inicio_bill_voice.mp3';
import motivacaoAudio from './assets/audio/motivacao_bill_voice.mp3';
import MapaVertical from './components/MapaVertical';
import Aventureiro from './assets/images/aventureiro.gif';
import { MdHeadset, MdHeadsetOff } from 'react-icons/md';
import "./App.css";

export default function App() {
  const [interacao, setInteracao] = useState(0);

  const audioRef = useRef(null);
  const audioRef2 = useRef(null);
  const audioRef3 = useRef(null);
  const audioRef4 = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isPlaying3, setIsPlaying3] = useState(false);
  const [isPlaying4, setIsPlaying4] = useState(false);

  const inicioRef = useRef(null);
  const sobreRef = useRef(null);
  const projetosRef = useRef(null);
  const contatoRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const reiniciarAudios = () => {
    audioRef2.current.pause();
    audioRef3.current.pause();
    audioRef4.current.pause();
    audioRef2.current.currentTime = 0;
    audioRef3.current.currentTime = 0;
    audioRef4.current.currentTime = 0;
  }

  //audio de bem vindo
  const toggleAudio = () => {
    if (audioRef.current) {
      reiniciarAudios();
      if (isPlaying) {
        audioRef.current.pause();
        audioRef2.current.pause();
        reiniciarAudios();
      } else {
        audioRef.current.volume = 0.2;
        audioRef.current.play();
        audioRef2.current.volume = 0.3;
        audioRef2.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  //audio do inicio
  const toggleAudio2 = () => {
    if (audioRef.current) {
      reiniciarAudios();
      if (isPlaying) {
        audioRef.current.pause();
        audioRef3.current.pause();

      }
      else {
        audioRef.current.volume = 0.2;
        audioRef.current.play();
        audioRef3.current.volume = 0.3;
        audioRef3.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  //audio da motivacao
  const toggleAudio3 = () => {
    if (audioRef.current) {
      reiniciarAudios();
      if (isPlaying) {
        audioRef.current.pause();
        audioRef4.current.pause();

      }
      else {
        audioRef.current.volume = 0.2;
        audioRef.current.play();
        audioRef4.current.volume = 0.3;
        audioRef4.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleAudio2_On = () => {
    if (audioRef.current && audioRef3.current) {
      reiniciarAudios();
      if (audioRef.current.paused) {
        audioRef.current.volume = 0.2;
        audioRef.current.play();
      }
      if (audioRef3.current.paused) {
        audioRef3.current.volume = 0.3;
        audioRef3.current.play();
      }
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    //inicio
    const audio3 = audioRef3.current;

    //quando inicio parar a narracao, chama o proximo
    audio3.addEventListener("ended", toggleAudio3_On);

    return () => {
      audio3.addEventListener("ended", toggleAudio3_On);
    };
  }, []);

  const toggleAudio3_On = () => {
    if (audioRef.current && audioRef4.current) {
      reiniciarAudios();
      if (audioRef.current.paused) {
        audioRef.current.volume = 0.2;
        audioRef.current.play();
      }
      if (audioRef4.current.paused) {
        audioRef4.current.volume = 0.3;
        audioRef4.current.play();
      }
      setIsPlaying(true);
    }
  };


  return (
    <div>
      <div className="container-basic">
        <div className="divDialog" style={{ marginTop: '20px' }}>
          <div className="textDialog">
            ~INTRODUÇÃO~
              <br /><br />
            Bem-vindo(a) ao Portfólio de Felipe Santos! 🗡️<br /> <br />
            Prepare-se para uma jornada diferente: <br />
            Navegue pelo meu mundo através do mapa abaixo e escolha para onde deseja ir.
            Cada região revela um pouco mais sobre mim, meus projetos e minhas habilidades.<br /> <br />
            Clique em uma área do mapa para começar sua aventura! 🗺️
          </div>
          <button
            onClick={toggleAudio}
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
            title={isPlaying ? 'Parar música' : 'Tocar música'}
          >
            {isPlaying ? <MdHeadset style={{ color: 'blue', fontSize: '50px' }} /> : <MdHeadsetOff style={{ color: 'red', opacity: 0.5, fontSize: '50px' }} />}
          </button>
        </div>

        <MapaVertical
          onIrParaInicio={() => {
            scrollToSection(inicioRef);
            toggleAudio2_On(true);
          }}
          onIrParaSobre={() => {
            scrollToSection(sobreRef);
            toggleAudio3_On(true);
          }}
          onIrParaProjetos={() => scrollToSection(projetosRef)}
          onIrParaContato={() => scrollToSection(contatoRef)}
        />
        <section ref={inicioRef} id="sobre">
          <div className="divDialog" style={{ marginTop: '20px' }}>
            <div className="textDialog">
              ~INÍCIO PT1~
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
              title={isPlaying ? 'Parar música' : 'Tocar música'}
            >
              {isPlaying ? <MdHeadset style={{ color: 'blue', fontSize: '50px' }} /> : <MdHeadsetOff style={{ color: 'red', opacity: 0.5, fontSize: '50px' }} />}
            </button>
          </div>
        </section>
        <section ref={sobreRef} id="sobre" className="containerRow" style={{ marginTop: '20px' }}>
          <div className="gif-fixo">
            <img src={Aventureiro} alt="Guerreiro animado" className="gif-fixo" />
          </div>
          <div className="divDialog" >
            <div className="textDialog">
              ~INÍCIO PT2~
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
              title={isPlaying ? 'Parar música' : 'Tocar música'}
            >
              {isPlaying ? <MdHeadset style={{ color: 'blue', fontSize: '50px' }} /> : <MdHeadsetOff style={{ color: 'red', opacity: 0.5, fontSize: '50px' }} />}
            </button>
          </div>
        </section>
        <section ref={projetosRef} id="projetos">PROJETOS</section>
        <section ref={contatoRef} id="contato">CONTATO</section>
      </div >
      <audio ref={audioRef} loop>
        <source src={temaAudio} type="audio/mpeg" />
      </audio>
      <audio ref={audioRef2}>
        <source src={bemVindoAudio} type="audio/mpeg" />
      </audio>
      <audio ref={audioRef3}>
        <source src={inicioAudio} type="audio/mpeg" />
      </audio>
      <audio ref={audioRef4}>
        <source src={motivacaoAudio} type="audio/mpeg" />
      </audio>
      <div>
        {interacao}
        {interacao === 0 ?
          <div></div>
          :
          <></>
        }
      </div>

    </div >
  );
}
