export default function MapControlGuide({language, scene, aboard, purified}) {
  const en=language==='en-US';
  const titles={nexus:en?'NEXUS CORE':'NÚCLEO NEXUS',omegaCommand:en?'COMMAND CENTER':'CENTRO DE COMANDO',omegaHangar:en?'ARRIVAL HANGAR':'HANGAR DE CHEGADA',castleThrone:purified?(en?'PURIFIED THRONE ROOM':'SALA DO TRONO PURIFICADA'):(en?'EVIL THRONE ROOM':'SALA DO TRONO MALIGNO'),lake:en?'LAKE OF INTERFACES':'LAGO DAS INTERFACES',rapids:en?'CANYON RAPIDS':'CORREDEIRAS DO DESFILADEIRO',ruins:en?'SUNKEN RUINS COVE':'ENSEADA DAS RUÍNAS SUBMERSAS',tunnel:en?'ANCIENT TUNNEL':'TÚNEL ANTIGO',temple:en?'ANCIENT TEMPLE VILLAGE':'ALDEIA DO TEMPLO ANTIGO',corridor:en?'HALL OF INFINITY':'CORREDOR DO INFINITO'};
  return <div className="scene-guide map-control-guide" aria-label={en?'Game controls':'Controles do jogo'}>
    <div className="scene-caption"><span className="live-dot"/> {titles[scene]}</div>
    <div className="walk-hint">
      {scene==='tunnel' ? <span><kbd>W</kbd><kbd>S</kbd> {en?'only ↑ ↓ to row forward and back':'apenas ↑ ↓ para avançar e voltar'}</span> : scene==='rapids' ? <span><kbd>A</kbd><kbd>D</kbd> {en?'or left and right arrows to steer':'ou setas laterais para desviar'}</span> : <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> {en?'or arrow keys to move':'ou setas para se mover'}</span>}
      {scene!=='rapids'&&scene!=='tunnel'&&<span className="keyboard-guide"><kbd>Shift</kbd> {scene==='ruins'||(scene==='lake'&&aboard) ? (en?'to speed up':'para acelerar') : (en?'to run':'para correr')}</span>}
      {scene!=='rapids' && (scene!=='castleThrone' || purified) && <span className="keyboard-guide"><kbd>E</kbd> {en?'Interaction':'Interação'}</span>}
      {scene==='castleThrone'&&!purified&&<span className="keyboard-guide"><kbd>{en?'Space':'Espaço'}</kbd> {en?'to attack':'para atacar'}</span>}
      <span className="touch-guide">{scene==='nexus'?(en?'Use the arrows to move. Enter a ring to activate its terminal.':'Use as setas para se mover. Entre no círculo para ativar o terminal.'):(scene==='omegaHangar'||scene==='omegaCommand')?(en?'Hold the arrows to run. Tap Interact at the terminal.':'Segure as setas para correr. Toque em Interagir no terminal.'):scene==='tunnel'?(en?'Use only ↑ ↓ to row forward and back.':'Use apenas ↑ ↓ para avançar e voltar.'):scene==='rapids'?(en?'Use the arrows to steer':'Use as setas para desviar'):scene==='castleThrone'&&!purified?(en?'Use the arrows to move and tap Attack to strike.':'Use as setas para se mover e toque em Atacar para golpear.'):(en?'Use the arrows to move':'Use as setas para se mover')}</span>
    </div>
    {scene==='castleThrone'&&!purified&&<small>{en?'Leave the red area before impact.':'Saia da área vermelha antes do impacto.'}</small>}
    {scene==='lake'&&<small>{aboard?(en?'Explore the lake by boat.':'Explore o lago de barco.'):(en?'Walk along the dock to board.':'Caminhe pela doca para embarcar.')}</small>}
    {scene==='corridor'&&<small>{en?'The cloak hides you for 10 seconds and fails for 10.':'O manto esconde você por 10 segundos e falha por 10.'}</small>}
  </div>;
}
