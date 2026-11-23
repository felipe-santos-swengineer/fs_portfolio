// A short primary-pointer gesture is a click; dragging keeps control of the camera.
export function isDungeonPortalTap(start, event, paused, activeGame) {
  return Boolean(start && !paused && !activeGame && start.id===event.pointerId && Math.hypot(event.clientX-start.x,event.clientY-start.y)<=6);
}
