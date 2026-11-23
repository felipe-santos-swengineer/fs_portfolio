export default function MapControlGuide({language, scene, aboard}) {
  const en=language==='en-US';
  const titles={lake:en?'LAKE OF INTERFACES':'LAGO DAS INTERFACES',rapids:en?'CANYON RAPIDS':'CORREDEIRAS DO DESFILADEIRO',ruins:en?'SUNKEN RUINS COVE':'ENSEADA DAS RUÍNAS SUBMERSAS',tunnel:en?'ANCIENT TUNNEL':'TÚNEL ANTIGO',temple:en?'ANCIENT TEMPLE VILLAGE':'ALDEIA DO TEMPLO ANTIGO'};
  return <div className="scene-guide map-control-guide" aria-label={en?'Game controls':'Controles do jogo'}>
    <div className="scene-caption"><span className="live-dot"/> {titles[scene]}</div>
    <div className="walk-hint">
      {scene==='rapids' ? <span><kbd>A</kbd><kbd>D</kbd> {en?'or left and right arrows to steer':'ou setas laterais para desviar'}</span> : <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en?'or arrow keys to move':'ou setas para se mover'}{scene==='lake'&&<> <kbd>Shift</kbd> {en?'to move faster':'para ir mais rápido'}</>}</span>}
      {scene==='lake'&&<span className="keyboard-guide"><kbd>F</kbd> {en?'talk':'conversar'} <kbd>E</kbd> {en?'interact':'interagir'} {en?'drag to rotate the camera':'arraste para girar a câmera'}</span>}
      {scene==='tunnel'&&<span className="keyboard-guide"><kbd>E</kbd> {en?'examine':'examinar'} {en?'drag to rotate the camera':'arraste para girar a câmera'}</span>}
      {scene==='temple'&&<span className="keyboard-guide"><kbd>F</kbd> {en?'talk':'conversar'} <kbd>E</kbd> {en?'interact':'interagir'} {en?'drag to rotate the camera':'arraste para girar a câmera'}</span>}
      {scene==='ruins'&&<span className="keyboard-guide"><kbd>F</kbd> {en?'talk':'conversar'} <kbd>E</kbd> {en?'activate rune':'ativar runa'} {en?'drag to rotate the camera':'arraste para girar a câmera'}</span>}
      <span className="touch-guide">{scene==='rapids'?(en?'Use the arrows to steer':'Use as setas para desviar'):scene==='lake'?(en?'Use the arrows to move drag to rotate':'Use as setas para se mover arraste para girar'):scene==='tunnel'?(en?'Use arrows to steer drag to rotate':'Use as setas para navegar arraste para girar'):scene==='temple'?(en?'Use arrows to walk drag to rotate':'Use as setas para caminhar arraste para girar'):(en?'Use arrows to steer drag to rotate tap to activate runes':'Use as setas para navegar arraste para girar toque para ativar runas')}</span>
    </div>
    {scene==='lake'&&<small>{aboard?(en?'Explore the lake by boat.':'Explore o lago de barco.'):(en?'Walk along the dock to board.':'Caminhe pela doca para embarcar.')}</small>}
  </div>;
}
