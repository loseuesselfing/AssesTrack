// Entry point: wires the app together and starts it.
import * as actions from './actions.js';
import { boot, closeModal, closePanel, closeSettings, refresh } from './actions.js';
import { S } from './state.js';
import { render } from './render.js';

// The views build HTML strings with inline onclick/onsubmit handlers,
// so the actions (plus S and render) must be reachable as globals.
Object.assign(window, actions, { S, render });

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (S.privacy) { S.privacy = false; render(); }
  else if (S.settings) closeSettings();
  else if (S.modal) closeModal();
  else if (S.panel) closePanel();
});

// Shared data: check for other people's changes every 45 seconds, and whenever the tab comes back into view.
setInterval(refresh, 45000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
window.addEventListener('focus', refresh);

render();
boot();
