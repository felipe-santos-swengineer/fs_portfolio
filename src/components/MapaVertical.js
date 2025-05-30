import { useState, useEffect } from "react";
import { useInView } from 'react-intersection-observer';
import Inicio from "../assets/svg/inicio.svg";
import Sobre from "../assets/svg/sobre.svg";
import Projetos from "../assets/svg/projetos.svg";
import Contato from "../assets/svg/contato.svg";
import "../styles/MapaVertical.css";


export default function MapaVertical({ onIrParaInicio, onIrParaSobre, onIrParaProjetos, onIrParaContato }) {

  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setAnimar(true);
    }, 1000); // Pequeno delay opcional
  }, []);

  return (
    <div className="bg_map">
      <div className={`mapa-container ${animar ? "animado" : ""}`}>
        <div className="titulo_mapa">Mapa <br/>do<br/> portfólio</div>
        <div className="mapa-estrutura esquerda">
          <img src={Inicio} alt="Início" onClick={onIrParaInicio}/>
          <div className="divDialog">
            <div className="textDialogMapa">
              Início
            </div>
          </div>
        </div>
        <svg className="conector">
          <line x1="20" y1="0" x2="80" y2="100" />
        </svg>
        <div className="mapa-estrutura direita">
          <img src={Sobre} alt="Sobre" onClick={onIrParaSobre}/>
          <div className="divDialog">
            <div className="textDialogMapa">
              Sobre
            </div>
          </div>
        </div>
        <svg className="conector">
          <line x1="80" y1="0" x2="20" y2="100" />
        </svg>

        <div className="mapa-estrutura esquerda">
          <img src={Projetos} alt="Projetos" onClick={onIrParaProjetos}/>
          <div className="divDialog">
            <div className="textDialogMapa">
              Projetos
            </div>
          </div>
        </div>

        <svg className="conector">
          <line x1="20" y1="0" x2="80" y2="100" />
        </svg>

        <div className="mapa-estrutura direita">
          <img src={Contato} alt="Contato" onClick={onIrParaContato}/>
          <div className="divDialog">
            <div className="textDialogMapa">
              Contato
            </div>
          </div>
        </div>
      </div>
    </div>
  );


}