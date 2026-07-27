/* The field notebook: the learner's own running record, as distinct from the
   Evidence Room, which holds the formal evidence. */

import { byId, el, clear } from '../core/dom.js';
import { OPENING_BRIEFING, STATIONS } from '../data/text.js';
import { CAPABILITY_LABELS, itemById, EQUIPMENT_ITEMS } from '../data/equipment.js';
import { SITE } from '../data/site.js';
import { state, capabilitiesHeld, daysUsed } from '../core/state.js';
import { stationStatus, currentObjective } from '../core/evidence.js';
import * as modal from './modal.js';
import { sectionHeading, emptyState } from './components.js';

const PANEL = 'notebookOverlay';
const TABS = [
  { id: 'objectives', label: 'Objectives' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'kit', label: 'Field kit' },
  { id: 'time', label: 'Time log' },
  { id: 'notes', label: 'Notes' }
];

let activeTab = 'objectives';

export function openNotebook(tab) {
  if (tab) activeTab = tab;
  modal.open({ id: PANEL, dismissible: true });
  render();
}

function render() {
  const tabHost = byId('notebookTabs');
  clear(tabHost);
  TABS.forEach((tab) => {
    const btn = el('button', {
      type: 'button',
      class: `tabBtn${tab.id === activeTab ? ' active' : ''}`,
      'aria-pressed': String(tab.id === activeTab)
    }, tab.label);
    btn.addEventListener('click', () => { activeTab = tab.id; render(); });
    tabHost.appendChild(btn);
  });

  const host = byId('notebookContent');
  clear(host);
  ({
    objectives: renderObjectives,
    briefing: renderBriefing,
    kit: renderKit,
    time: renderTime,
    notes: renderNotes
  }[activeTab])(host);
}

function renderObjectives(host) {
  const objective = currentObjective();
  host.appendChild(el('div', { class: 'recordCard tone-good' },
    el('div', { class: 'recordCardTitle' }, 'Next'),
    el('div', { class: 'recordCardLine' }, objective.label),
    el('div', { class: 'recordCardLine subtle' }, objective.detail)));

  host.appendChild(sectionHeading('Stations', 'The investigation runs through all of these. You can revisit any that are open.'));
  const list = el('div', { class: 'recordList' });
  stationStatus().forEach((row) => {
    const def = STATIONS.find((s) => s.number === row.number);
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' },
        el('strong', {}, `${row.number}. ${def ? def.name : row.id}`),
        el('br'),
        el('span', { class: 'subtle' }, row.done ? 'Complete' : (row.missing[0] || 'Not started'))),
      el('span', { class: `recordRowSide pill pill-${row.done ? 'good' : 'warn'}` }, row.done ? 'done' : 'open')));
  });
  host.appendChild(list);
}

function renderBriefing(host) {
  OPENING_BRIEFING.split('\n\n').forEach((p) => host.appendChild(el('p', {}, p)));
}

function renderKit(host) {
  if (!state.equipment.selected.length) {
    host.appendChild(emptyState('No kit prepared yet.'));
    return;
  }
  host.appendChild(sectionHeading('Carried', null));
  const list = el('div', { class: 'recordList' });
  state.equipment.selected.forEach((id) => {
    const item = itemById(id);
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, item ? item.label : id),
      state.equipment.retrieved.includes(id)
        ? el('span', { class: 'recordRowSide pill pill-warn' }, 'fetched mid-project')
        : null));
  });
  host.appendChild(list);

  const caps = [...capabilitiesHeld()].map((c) => CAPABILITY_LABELS[c]).filter(Boolean).sort();
  host.appendChild(sectionHeading('What this kit can do', null));
  host.appendChild(el('p', {}, caps.length ? caps.join(', ') + '.' : 'Nothing in particular.'));

  const missingCaps = Object.entries(CAPABILITY_LABELS)
    .filter(([cap]) => ![...capabilitiesHeld()].includes(cap))
    .map(([, label]) => label);
  if (missingCaps.length) {
    host.appendChild(sectionHeading('What it cannot do', 'Anything here can still be fetched from the equipment store at a cost in days.'));
    host.appendChild(el('p', { class: 'subtle' }, missingCaps.join(', ') + '.'));
  }

  const justifications = Object.entries(state.equipment.justifications);
  if (justifications.length) {
    host.appendChild(sectionHeading('Your kit reasoning', null));
    const jlist = el('div', { class: 'recordList' });
    justifications.forEach(([itemId, j]) => {
      const item = EQUIPMENT_ITEMS.find((i) => i.id === itemId);
      jlist.appendChild(el('div', { class: 'recordRow' },
        el('span', { class: 'recordRowMain' }, `${item ? item.label : itemId}: ${j.choiceId}`),
        el('span', { class: `recordRowSide pill pill-${j.correct ? 'good' : 'bad'}` }, j.correct ? 'sound' : 'review')));
    });
    host.appendChild(jlist);
  }
}

function renderTime(host) {
  host.appendChild(el('div', { class: `recordCard tone-${state.daysOverrun ? 'bad' : 'good'}` },
    el('div', { class: 'recordCardTitle' }, state.daysOverrun
      ? `Schedule exceeded by ${state.daysOverrun} day${state.daysOverrun === 1 ? '' : 's'}`
      : `${state.daysRemaining} of ${SITE.totalDays} project days remaining`),
    el('div', { class: 'recordCardLine' }, `${daysUsed()} spent so far.`)));
  if (!state.dayLog.length) {
    host.appendChild(emptyState('No time has been spent yet.'));
    return;
  }
  const list = el('div', { class: 'recordList' });
  [...state.dayLog].reverse().forEach((entry) => {
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, entry.reason),
      el('span', { class: 'recordRowSide' }, `${entry.days} day${entry.days === 1 ? '' : 's'}`)));
  });
  host.appendChild(list);
}

function renderNotes(host) {
  if (!state.notes.length) {
    host.appendChild(emptyState('No notes yet. Notes are written automatically as you work.'));
    return;
  }
  const list = el('div', { class: 'noteList' });
  [...state.notes].reverse().forEach((n) => list.appendChild(el('div', { class: 'noteLine' }, n.text)));
  host.appendChild(list);
}

export function initNotebook() {
  byId('closeNotebookBtn').addEventListener('click', () => modal.close(PANEL));
}
