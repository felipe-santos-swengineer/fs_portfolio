import { allowRunAndRotate } from './runAndRotate';

test('keeps Shift-drag as rotation when panning is disabled', () => {
  const onMouseDown = jest.fn();
  const controls = allowRunAndRotate({ enablePan: false, _onMouseDown: onMouseDown });
  controls._onMouseDown({ button: 0, shiftKey: true, ctrlKey: false, metaKey: false, clientX: 20, clientY: 40 });
  expect(onMouseDown).toHaveBeenCalledWith(expect.objectContaining({ button: 0, shiftKey: false, clientX: 20, clientY: 40 }));
});

test('leaves other gestures and controls with panning untouched', () => {
  const onMouseDown = jest.fn();
  const controls = allowRunAndRotate({ enablePan: false, _onMouseDown: onMouseDown });
  const rightDrag = { button: 2, shiftKey: true };
  controls._onMouseDown(rightDrag);
  controls.enablePan = true;
  const panDrag = { button: 0, shiftKey: true };
  controls._onMouseDown(panDrag);
  expect(onMouseDown.mock.calls).toEqual([[rightDrag], [panDrag]]);
});
