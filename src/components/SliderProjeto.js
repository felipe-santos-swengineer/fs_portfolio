import { useState } from "react";
import "../styles/SliderProjeto.css";

export default function SliderProjeto({ imagens }) {
  const [indice, setIndice] = useState(0);

  const proximo = () => {
    setIndice((indice + 1) % imagens.length);
  };

  const anterior = () => {
    setIndice((indice - 1 + imagens.length) % imagens.length);
  };

  return (
    <div className="slider-container">
      <img src={imagens[indice]} alt={`Slide ${indice + 1}`} className="slider-img" />
      {imagens.length > 1 && (
        <div className="slider-controles">
          <button onClick={anterior}>&lt;</button>
          <button onClick={proximo}>&gt;</button>
        </div>
      )}
    </div>
  );
}