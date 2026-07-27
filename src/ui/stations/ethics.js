/* Station 8: Ethical and professional decisions. */

import { byId, el, clear } from '../../core/dom.js';
import { ETHICS_SCENARIOS, JURISDICTION_NOTE, scenarioById } from '../../data/ethics.js';
import { state, recordEthicsDecision, markEthicsSeen } from '../../core/state.js';
import { record } from '../../core/telemetry.js';
import { triggeredEthicsScenarios } from '../../core/evidence.js';
import * as modal from '../modal.js';
import { button, actionRow, showFeedback, sectionHeading, emptyState } from '../components.js';

const PANEL = 'ethicsOverlay';
let activeScenarioId = null;

export function openEthics() {
  const pending = pendingScenario();
  if (pending) {
    openScenario(pending.id);
    return;
  }
  openEthicsLog();
}

export function pendingScenario() {
  return triggeredEthicsScenarios().find((s) => !state.ethics.decisions[s.id]) || null;
}

export function openScenario(scenarioId) {
  const scenario = scenarioById(scenarioId);
  if (!scenario) return;
  activeScenarioId = scenarioId;
  markEthicsSeen(scenarioId);
  const decided = !!state.ethics.decisions[scenarioId];
  modal.open({ id: PANEL, dismissible: decided });
  render();
}

function render() {
  const scenario = scenarioById(activeScenarioId);
  const host = byId('ethicsBody');
  clear(host);
  byId('ethicsTitle').textContent = scenario.title;

  String(scenario.situation).split('\n\n').forEach((p) => {
    host.appendChild(el('p', { class: 'promptDetail' }, p));
  });

  const decision = state.ethics.decisions[scenario.id];
  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  const choices = el('div', { class: 'choiceStack', role: 'group', 'aria-label': 'Choose the most professional response' });

  scenario.choices.forEach((choice) => {
    const selected = decision && decision.choiceId === choice.id;
    const btn = el('button', {
      type: 'button',
      class: `choiceBtn wide${selected ? (choice.sound === 'sound' ? ' chosen-good' : (choice.sound === 'partial' ? ' chosen-warn' : ' chosen-bad')) : ''}`,
      disabled: !!decision
    }, choice.text);
    btn.addEventListener('click', () => {
      const created = recordEthicsDecision(scenario.id, choice.id, choice.sound);
      if (created) {
        record(scenario.id, 'interpreted', { station: 8, answer: choice.id, soundness: choice.sound });
      }
      modal.setDismissible(PANEL, true);
      render();
    });
    choices.appendChild(btn);
  });

  host.appendChild(choices);

  if (decision) {
    const choice = scenario.choices.find((c) => c.id === decision.choiceId);
    if (choice) {
      showFeedback(feedback, choice.feedback,
        choice.sound === 'sound' ? 'good' : (choice.sound === 'partial' ? 'warn' : 'bad'));
    }
    host.appendChild(feedback);
    if (scenario.closingNote) {
      host.appendChild(el('div', { class: 'noticeBox' }, scenario.closingNote));
    }
  } else {
    host.appendChild(feedback);
  }

  host.appendChild(el('p', { class: 'jurisdictionNote' }, JURISDICTION_NOTE));

  const next = triggeredEthicsScenarios().find((s) => !state.ethics.decisions[s.id] && s.id !== scenario.id);
  host.appendChild(actionRow(
    decision && next ? button('Next situation', () => openScenario(next.id)) : null,
    decision ? button('View decision log', () => { modal.close(PANEL); openEthicsLog(); }, 'secondary') : null,
    decision ? button('Close', () => modal.close(PANEL), 'secondary') : null));
}

export function openEthicsLog() {
  modal.open({ id: 'ethicsLogOverlay', dismissible: true });
  const host = byId('ethicsLogBody');
  clear(host);

  const triggered = triggeredEthicsScenarios();
  if (!triggered.length) {
    host.appendChild(emptyState('No professional situations have arisen yet. They come up as the fieldwork progresses.'));
    return;
  }

  host.appendChild(sectionHeading('Decision log',
    'These decisions feed the professional practice part of your profile, not an artifact count.'));

  ETHICS_SCENARIOS.forEach((scenario) => {
    const isTriggered = triggered.some((t) => t.id === scenario.id);
    const decision = state.ethics.decisions[scenario.id];
    if (!isTriggered && !decision) return;
    const choice = decision && scenario.choices.find((c) => c.id === decision.choiceId);
    const tone = decision
      ? (decision.soundness === 'sound' ? 'good' : (decision.soundness === 'partial' ? 'warn' : 'bad'))
      : 'warn';
    const card = el('div', { class: `recordCard tone-${tone}` },
      el('div', { class: 'recordCardTitle' }, scenario.title),
      el('div', { class: 'recordCardLine' }, decision ? choice.text : 'Not yet resolved.'),
      actionRow(button(decision ? 'Review' : 'Resolve now', () => {
        modal.close('ethicsLogOverlay');
        openScenario(scenario.id);
      }, decision ? 'secondary' : 'primary')));
    host.appendChild(card);
  });

  host.appendChild(el('p', { class: 'jurisdictionNote' }, JURISDICTION_NOTE));
}

export function initEthics() {
  byId('closeEthicsBtn').addEventListener('click', () => modal.close(PANEL));
  byId('closeEthicsLogBtn').addEventListener('click', () => modal.close('ethicsLogOverlay'));
}
