/* The briefing panel: a blocking message from the field director, used for
   the opening briefing and for consequential feedback between stations. */

import { byId, el, replaceChildren } from '../core/dom.js';
import * as modal from './modal.js';

let pendingContinue = null;

export function showBriefing(title, body, onContinue) {
  byId('briefingTitle').textContent = title;
  const bodyEl = byId('briefingBody');
  replaceChildren(bodyEl, ...String(body).split('\n\n').map((p) => el('p', {}, p)));
  pendingContinue = onContinue || null;
  modal.open({ id: 'briefingOverlay', dismissible: false, initialFocus: '#briefingContinueBtn' });
}

export function initBriefing() {
  byId('briefingContinueBtn').addEventListener('click', () => {
    const next = pendingContinue;
    pendingContinue = null;
    modal.close('briefingOverlay');
    if (next) next();
  });
}
