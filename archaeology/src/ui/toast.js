/* Transient status messages, announced to screen readers through a single
   persistent live region rather than by inserting a new one each time. */

import { byId, el } from '../core/dom.js';
import { emit, EVENTS } from '../core/events.js';

let container = null;
let liveRegion = null;

function ensure() {
  if (container) return;
  container = byId('toastStack');
  liveRegion = byId('liveRegion');
}

export function toast(message, tone = 'info', durationMs = 4200) {
  ensure();
  if (!container) return;
  const node = el('div', { class: `toast toast-${tone}` }, message);
  container.appendChild(node);
  if (liveRegion) liveRegion.textContent = message;
  emit(EVENTS.toast, { message, tone });
  const remove = () => {
    node.classList.add('toast-out');
    setTimeout(() => node.remove(), 400);
  };
  setTimeout(remove, durationMs);
}

/* For feedback that must be read out but should not steal focus or clutter
   the screen, for example a correct/incorrect result already visible in the
   panel. */
export function announce(message) {
  ensure();
  if (liveRegion) liveRegion.textContent = message;
}
