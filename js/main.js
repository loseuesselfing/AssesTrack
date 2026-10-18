// Entry point: wires the app together and starts it.
import * as actions from './actions.js';
import { closeModal, closePanel } from './actions.js';
import { S } from './state.js';
import { render } from './render.js';

// The views build HTML strings with inline onclick/onsubmit handlers,
// so the actions (plus S and render) must be reachable as globals.
Object.assign(window, actions, { S, render });

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (S.privacy) { S.privacy = false; render(); }
  else if (S.modal) closeModal();
  else if (S.panel) closePanel();
});

render();
