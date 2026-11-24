import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import './WizardChess.css';

const glyphs = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const levels = ['easy', 'medium', 'hard'];
const labels = {
  en: {
    title: "Wizard’s Chess", levels: ['Easy', 'Medium', 'Hard'], close: 'Return to the entrance', skip: 'Skip match',
    intro: 'Choose a difficulty and win with the human pieces to break the seal.',
    levelDetails: ['The opponent looks a few moves ahead.', 'The opponent looks for tactics after captures.', 'The opponent searches deeper for combinations.'],
    capture: 'Capture in progress…', thinking: 'Black is thinking…', turn: 'White to move', check: 'Your king is in check.',
    done: 'Checkmate. The ancient seal is broken!', lost: 'Black won. The seal holds.',
    draw: 'Draw. The seal holds.', retry: 'Choose difficulty again', promotion: 'Promote pawn',
    error: 'Black could not move.', resume: 'Retry computer move',
    white: 'Human', black: 'Undead', empty: 'empty',
    keyboard: 'Accessible board', view: '3D board', retryShort: 'Change level', resetView: 'Reset view',
    orbit: 'Drag to orbit. Scroll or pinch to zoom.', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    controls: 'Select a human piece, then a highlighted square.',
    pieces: { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' },
  },
  pt: {
    title: 'Xadrez de Bruxo', levels: ['Fácil', 'Médio', 'Difícil'], close: 'Voltar à entrada', skip: 'Pular partida',
    intro: 'Escolha a dificuldade e vença com as peças humanas para quebrar o selo.',
    levelDetails: ['O adversário calcula poucos lances à frente.', 'O adversário avalia táticas após capturas.', 'O adversário busca combinações mais adiante.'],
    capture: 'Captura em andamento…', thinking: 'As pretas estão pensando…', turn: 'Vez das brancas', check: 'Seu rei está em xeque.',
    done: 'Xeque-mate. O selo antigo foi quebrado!', lost: 'As pretas venceram. O selo permanece.',
    draw: 'Empate. O selo permanece.', retry: 'Escolher dificuldade novamente', promotion: 'Promover peão',
    error: 'As pretas não conseguiram jogar.', resume: 'Tentar jogada do computador novamente',
    white: 'Humano', black: 'Zumbi', empty: 'vazia',
    keyboard: 'Tabuleiro acessível', view: 'Tabuleiro 3D', retryShort: 'Trocar nível', resetView: 'Restaurar visão',
    orbit: 'Arraste para girar. Use a roda do mouse ou a pinça para aproximar.', zoomIn: 'Aproximar', zoomOut: 'Afastar',
    controls: 'Selecione uma peça humana e depois uma casa destacada.',
    pieces: { k: 'rei', q: 'dama', r: 'torre', b: 'bispo', n: 'cavalo', p: 'peão' },
  },
};

export default function WizardChess({ en, open, paused, onClose, onBoard, onWin, onSkip, interaction, has3D, onPieceFocus, onResetView, onZoom, capturePending }) {
  const copy = labels[en ? 'en' : 'pt'];
  const game = useRef(null);
  const heading = useRef(null);
  const panel = useRef(null);
  const hudHeight = useRef(0);
  const squares = useRef([]);
  const [level, setLevel] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const [cursor, setCursor] = useState(52);
  const [accessible, setAccessible] = useState(false);
  const [failed, setFailed] = useState(false);
  const position = game.current;
  const checked = position?.inCheck();
  const mate = position?.isCheckmate();
  const won = mate && position.turn() === 'b';
  const ended = mate || position?.isDraw();
  const thinking = level && !ended && position.turn() === 'b';

  useEffect(() => {
    if (open && !paused) heading.current?.focus();
  }, [open, paused, level]);

  useEffect(() => {
    if (!thinking || !open || paused || failed || capturePending) return;
    let worker;
    const fail = () => setFailed(true);
    try {
      worker = new Worker(new URL('./wizardChess.worker.js', import.meta.url));
      worker.onmessage = ({ data }) => {
        if (!data) { fail(); return; }
        let move;
        try {
          move = game.current.move(data);
        } catch {
          fail();
          return;
        }
        onBoard({ position: game.current.board(), move });
        setHistory([...history, data]);
      };
      worker.onerror = fail;
      worker.postMessage({ history, level });
    } catch {
      fail();
    }
    return () => worker?.terminate();
  }, [thinking, open, paused, failed, history, level, onBoard, capturePending]);

  const start = difficulty => {
    game.current = new Chess();
    onBoard({ position: game.current.board() });
    setLevel(difficulty);
    setHistory([]);
    setSelected(null);
    setPromotion(null);
    setFailed(false);
    setCursor(52);
  };

  const play = move => {
    const played = game.current.move(move);
    setHistory([...history, move]);
    setSelected(null);
    setPromotion(null);
    onBoard({ position: game.current.board(), move: played });
    if (game.current.isCheckmate()) onWin();
  };

  const board = position?.board();
  const options = selected && position?.get(selected)?.color === 'w' && !ended && !thinking && !capturePending ? position.moves({ square: selected, verbose: true }) : [];
  const targets = new Set(options.map(move => move.to));
  const choose = (square, piece) => {
    if (!open || paused || !level || thinking || ended || promotion || capturePending) return;
    if (targets.has(square)) {
      const move = { from: selected, to: square };
      if (options.some(option => option.to === square && option.promotion)) setPromotion(move);
      else play(move);
    } else {
      const next = piece && square !== selected ? square : null;
      setSelected(next);
      if (next) onPieceFocus?.(piece);
    }
  };

  const show3D = open && !paused && has3D && Boolean(level) && !accessible;
  useEffect(() => {
    if (!show3D || !panel.current) return;
    const element = panel.current;
    hudHeight.current = element.offsetHeight;
    const observer = new ResizeObserver(() => { hudHeight.current = element.offsetHeight; });
    observer.observe(element);
    return () => observer.disconnect();
  }, [show3D]);

  interaction.current = {
    show3D, selected, targets, onClose, hudHeight,
    pick: square => choose(square, position?.get(square)),
  };

  if (!open || paused) return null;

  const moveFocus = (event, index) => {
    const row = Math.floor(index / 8), file = index % 8;
    const next = {
      ArrowUp: Math.max(0, row - 1) * 8 + file,
      ArrowDown: Math.min(7, row + 1) * 8 + file,
      ArrowLeft: row * 8 + Math.max(0, file - 1),
      ArrowRight: row * 8 + Math.min(7, file + 1),
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setCursor(next);
    squares.current[next]?.focus();
  };

  return <div className={`wizard-chess-overlay${show3D ? ' wizard-chess-in-scene' : ''}`}>
    <section ref={panel} className={level ? "wizard-chess" : "wizard-chess wizard-chess-level-picker"} role="dialog" aria-labelledby="wizard-chess-title"
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
      <div className="wizard-chess-heading">
        <h2 id="wizard-chess-title" tabIndex={-1} ref={heading}>{copy.title}</h2>
        <button type="button" aria-label={copy.close} onClick={onClose}>×</button>
      </div>
      {!level ? <>
        <p>{copy.intro}</p>
        <div className="wizard-chess-levels">
          {levels.map((difficulty, index) => <button type="button" key={difficulty}
            aria-labelledby={`chess-level-${difficulty}`} aria-describedby={`chess-level-info-${difficulty}`}
            onClick={() => start(difficulty)}>
            <strong id={`chess-level-${difficulty}`}>{copy.levels[index]}</strong>
            <span id={`chess-level-info-${difficulty}`}>{copy.levelDetails[index]}</span>
          </button>)}
        </div>
        <button type="button" className="wizard-chess-skip" onClick={onSkip}>{copy.skip}</button>
      </> : <>
        <p role="status">{capturePending ? copy.capture : won ? copy.done : mate ? copy.lost : ended ? copy.draw
          : failed ? copy.error : thinking ? copy.thinking : checked ? copy.check : copy.turn}</p>
        {show3D && <div className="wizard-chess-zoom">
          <button type="button" aria-label={copy.zoomOut} onClick={() => onZoom(1 / 1.22)}>−</button>
          <button type="button" aria-label={copy.zoomIn} onClick={() => onZoom(1.22)}>+</button>
        </div>}
        {show3D && <small>{copy.controls} {copy.orbit}</small>}
        {!show3D && <div className="wizard-chess-board" role="group" aria-label={copy.title}>
          {board.flat().map((piece, index) => {
            const row = Math.floor(index / 8), file = index % 8;
            const square = 'abcdefgh'[file] + (8 - row);
            return <button type="button" key={square} ref={node => { squares.current[index] = node; }}
              tabIndex={!promotion && index === cursor ? 0 : -1}
              aria-label={`${square}, ${piece ? `${copy.pieces[piece.type]} (${piece.color === 'w' ? copy.white : copy.black})` : copy.empty}`}
              aria-pressed={selected === square} data-target={targets.has(square)}
              data-dark={(row + file) % 2 === 1} data-piece={piece?.color}
              onFocus={() => setCursor(index)} onKeyDown={event => moveFocus(event, index)}
              onClick={() => choose(square, piece)}>
              {piece && <span aria-hidden="true">{glyphs[piece.type]}</span>}
              {(file === 0 || row === 7) && <small aria-hidden="true">{file === 0 && 8 - row}{row === 7 && 'abcdefgh'[file]}</small>}
            </button>;
          })}
        </div>}
        {promotion && <div className="wizard-chess-actions" role="group" aria-label={copy.promotion}>
          {['q', 'r', 'b', 'n'].map((piece, index) => <button type="button" key={piece}
            autoFocus={index === 0} onClick={() => { play({ ...promotion, promotion: piece }); squares.current[cursor]?.focus(); }}>
            {copy.pieces[piece]}
          </button>)}
        </div>}
        {failed && <button type="button" onClick={() => setFailed(false)}>{copy.resume}</button>}
        <div className="wizard-chess-actions">
          {!won && <button type="button" className="wizard-chess-skip" onClick={onSkip}>{copy.skip}</button>}
          {!won && <button type="button" disabled={capturePending} onClick={() => setLevel(null)}>{show3D ? copy.retryShort : copy.retry}</button>}
          {show3D && <button type="button" onClick={onResetView}>{copy.resetView}</button>}
          {has3D && <button type="button" onClick={() => setAccessible(value => !value)}>
            {show3D ? copy.keyboard : copy.view}
          </button>}
        </div>
        {won && <button type="button" onClick={onClose}>{copy.close}</button>}
      </>}
    </section>
  </div>;
}
