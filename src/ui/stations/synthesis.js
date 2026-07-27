/* Station 7: Reconstructing Daily Life.

   Statements are marked supported or speculative against the learner's own
   evidence, at the moment of selection. A speculative statement can still be
   recorded, but only after the learner acknowledges that it runs ahead of
   the evidence, and it is carried into the report labelled that way. */

import { byId, el, clear } from '../../core/dom.js';
import { SYNTHESIS_DOMAINS, evaluateStatement } from '../../data/synthesis.js';
import { state, setSynthesisSelection } from '../../core/state.js';
import { record } from '../../core/telemetry.js';
import { evidenceTags, citableEvidence } from '../../core/evidence.js';
import * as modal from '../modal.js';
import { toast } from '../toast.js';
import { button, actionRow, sectionHeading, emptyState } from '../components.js';

const PANEL = 'synthesisOverlay';

export function openSynthesis() {
  modal.open({ id: PANEL, dismissible: true });
  render();
}

function render() {
  const host = byId('synthesisBody');
  clear(host);

  const tags = evidenceTags();
  const evidence = citableEvidence();

  host.appendChild(el('p', { class: 'promptDetail' },
    'Lay your evidence out and decide what it will carry. A statement marked supported can be defended from what you recovered. A statement marked speculative cannot, and saying so is part of the work.'));

  if (!evidence.length) {
    host.appendChild(emptyState('There is nothing on the table yet. Recover, record and analyse material first.'));
    return;
  }

  host.appendChild(evidenceStrip(evidence));

  SYNTHESIS_DOMAINS.forEach((domain) => {
    host.appendChild(domainBlock(domain, tags));
  });
}

function evidenceStrip(evidence) {
  const wrap = el('details', { class: 'evidenceStrip' });
  wrap.appendChild(el('summary', {}, `Evidence available to you (${evidence.length})`));
  const list = el('div', { class: 'recordList' });
  evidence.forEach((e) => {
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, e.label),
      el('span', { class: `recordRowSide pill pill-${e.quality === 'good' ? 'good' : (e.quality === 'partial' ? 'warn' : 'bad')}` }, e.category)));
  });
  wrap.appendChild(list);
  return wrap;
}

function domainBlock(domain, tags) {
  const wrap = el('section', { class: 'stationSection' });
  wrap.appendChild(sectionHeading(domain.label, domain.question));
  const selections = state.synthesis.selections[domain.id] || {};

  domain.statements.forEach((statement) => {
    const support = evaluateStatement(statement, tags);
    const chosen = !!selections[statement.id];
    const tone = support === 'supported' ? 'good' : (support === 'overreach' ? 'bad' : 'warn');
    const label = support === 'supported' ? 'Supported by your evidence'
      : (support === 'overreach' ? 'Runs beyond the evidence' : 'Not supported by your evidence');

    const row = el('div', { class: `statementRow${chosen ? ' chosen' : ''}` },
      el('div', { class: 'statementMain' },
        el('div', { class: 'statementText' }, statement.text),
        el('div', { class: 'statementMeta' },
          el('span', { class: `pill pill-${tone}` }, label),
          el('span', { class: 'statementRationale' }, statement.rationale))),
      el('div', { class: 'statementAction' },
        button(chosen ? 'Remove' : 'Record this', () => toggle(domain, statement, support), chosen ? 'secondary' : 'primary')));
    wrap.appendChild(row);
  });

  return wrap;
}

function toggle(domain, statement, support) {
  const selections = state.synthesis.selections[domain.id] || {};
  if (selections[statement.id]) {
    setSynthesisSelection(domain.id, statement.id, null);
    render();
    return;
  }
  if (support === 'supported') {
    setSynthesisSelection(domain.id, statement.id, { support, acknowledgedSpeculative: false, atISO: new Date().toISOString() });
    record(statement.id, 'concluded', { station: 7, support });
    render();
    return;
  }
  confirmSpeculative(domain, statement, support);
}

function confirmSpeculative(domain, statement, support) {
  const host = byId('speculativeBody');
  clear(host);
  host.appendChild(el('p', {}, statement.text));
  host.appendChild(el('div', { class: 'noticeBox' },
    support === 'overreach'
      ? `This conclusion runs beyond what any evidence recovered on this project can carry. ${statement.rationale}`
      : `Your evidence does not support this. ${statement.rationale}`));
  host.appendChild(el('p', {},
    'You can still record it, but it will be carried into the report as speculative, and the assessment profile will show whether you acknowledged that.'));
  host.appendChild(actionRow(
    button('Record it and label it speculative', () => {
      setSynthesisSelection(domain.id, statement.id, { support, acknowledgedSpeculative: true, atISO: new Date().toISOString() });
      record(statement.id, 'concluded', { station: 7, support, reason: 'acknowledged speculative' });
      modal.close('speculativeOverlay');
      render();
      toast('Recorded as speculative.', 'warn');
    }),
    button('Record it without qualification', () => {
      setSynthesisSelection(domain.id, statement.id, { support, acknowledgedSpeculative: false, atISO: new Date().toISOString() });
      record(statement.id, 'concluded', { station: 7, support, reason: 'unqualified' });
      modal.close('speculativeOverlay');
      render();
    }, 'secondary'),
    button('Leave it out', () => {
      modal.close('speculativeOverlay');
    }, 'secondary')));
  modal.open({ id: 'speculativeOverlay', dismissible: true });
}

export function initSynthesis() {
  byId('closeSynthesisBtn').addEventListener('click', () => modal.close(PANEL));
  byId('closeSpeculativeBtn').addEventListener('click', () => modal.close('speculativeOverlay'));
}
