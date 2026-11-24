import * as THREE from 'three';

const initialElevation = THREE.MathUtils.degToRad(63);
const radius = 6;
const boardWidth = 5.4;
const pieceHeight = 1.8;
const topMargin = .055;
const minCameraY = .25;
const maxCameraY = 7.55;
const minElevation = Math.asin((minCameraY - pieceHeight / 2) / radius);
// Keep a small angle from the vertical axis so the camera has a stable up direction.
const maxElevation = Math.asin(Math.min((maxCameraY - pieceHeight / 2) / radius, .9998));

export function createWizardChessCamera(boardZ) {
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 60);
  const target = new THREE.Vector3(0, pieceHeight / 2, boardZ);
  let yaw = 0;
  let elevation = initialElevation;
  let magnification = 1;

  return {
    camera,
    rotate(horizontal, vertical = 0) {
      yaw = (yaw + horizontal) % (Math.PI * 2);
      elevation = THREE.MathUtils.clamp(elevation + vertical, minElevation, maxElevation);
    },
    zoom(factor) {
      magnification = THREE.MathUtils.clamp(magnification * factor, .35, 5);
    },
    reset() {
      yaw = 0;
      elevation = initialElevation;
      magnification = 1;
    },
    view(aspect, hudFraction = .22) {
      const x = Math.sin(yaw), z = Math.cos(yaw);
      const horizontal = Math.cos(elevation), vertical = Math.sin(elevation);
      const span = boardWidth * (Math.abs(x) + Math.abs(z));
      const projectedHeight = span * Math.abs(vertical) + pieceHeight * horizontal;
      // Reserve room for the controls below the projected board.
      const bottomMargin = THREE.MathUtils.clamp(hudFraction, .22, .52);
      const height = Math.max(7.8, (span + .42) / aspect,
        projectedHeight / (1 - topMargin - bottomMargin));
      const viewHeight = height / magnification;
      const shift = (bottomMargin - topMargin) * viewHeight / 2;
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2 - shift;
      camera.bottom = -viewHeight / 2 - shift;
      camera.position.set(x * radius * horizontal, radius * vertical, z * radius * horizontal).add(target);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      return camera;
    },
  };
}
