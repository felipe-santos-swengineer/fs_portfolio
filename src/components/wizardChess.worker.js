/* global globalThis */
import { findChessMove } from './wizardChessEngine';

globalThis.onmessage = ({ data: { history, level } }) => {
  globalThis.postMessage(findChessMove(history, level));
};

