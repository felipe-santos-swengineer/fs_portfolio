// OrbitControls normally changes Shift + left drag into panning. These maps
// disable panning and reserve Shift for running, so keep left drag rotating.
export function allowRunAndRotate(controls) {
  const onMouseDown = controls._onMouseDown;
  controls._onMouseDown = event => {
    if (!controls.enablePan && event.button === 0 && event.shiftKey && !event.ctrlKey && !event.metaKey) {
      onMouseDown({ button: event.button, clientX: event.clientX, clientY: event.clientY, shiftKey: false, ctrlKey: false, metaKey: false });
    } else {
      onMouseDown(event);
    }
  };
  return controls;
}
