/* Guided-access mode.

   Used when WebGL is unavailable, and offered deliberately to anyone who
   prefers it. Every station in this mode is the same station the 3D mode
   opens: the panels, the decisions, the consequences and the report are
   identical. What is replaced is only the navigation, which becomes a list
   of places rather than a walk across the site. */

import { byId, el, clear } from '../core/dom.js';
import { LOCATIONS, UNITS } from '../data/site.js';
import { SURVEY_ITEMS } from '../data/survey.js';
import { STATIONS } from '../data/text.js';
import { state } from '../core/state.js';
import { on, EVENTS } from '../core/events.js';
import { currentObjective, stationStatus, citableEvidence } from '../core/evidence.js';
import * as modal from './modal.js';
import { activateTarget, runObjectiveAction } from './actions.js';
import { openSurveyItem, openSurveySummary } from './stations/survey.js';
import { openFeatureList } from './stations/features.js';
import { openNotebook } from './notebook.js';
import { openSettings } from './settings.js';
import { openEvidenceRoom } from './stations/evidenceRoom.js';
import { button, actionRow, sectionHeading, progressLine } from './components.js';

let active = false;

export function isFallbackActive() {
  return active;
}

export function startFallback(reason) {
  active = true;
  document.body.classList.add('fallbackMode');
  const shell = byId('fallbackShell');
  shell.style.display = 'block';
  byId('hud').style.display = 'none';
  byId('touchControls').style.display = 'none';
  byId('reticle').style.display = 'none';
  byId('interactPrompt').style.display = 'none';
  const reasonEl = byId('fallbackReason');
  if (reasonEl) reasonEl.textContent = reason;

  byId('fallbackNotebookBtn').addEventListener('click', () => openNotebook());
  byId('fallbackEvidenceBtn').addEventListener('click', () => openEvidenceRoom());
  byId('fallbackSettingsBtn').addEventListener('click', () => openSettings());
  byId('fallbackObjectiveBtn').addEventListener('click', () => runObjectiveAction());

  on(EVENTS.stateChanged, render);
  render();
}

function render() {
  if (!active) return;
  const host = byId('fallbackBody');
  clear(host);

  const objective = currentObjective();
  const station = STATIONS.find((s) => s.number === objective.station);
  host.appendChild(el('div', { class: 'recordCard tone-good' },
    el('div', { class: 'recordCardTitle' }, station ? `Station ${station.number}: ${station.name}` : 'Investigation'),
    el('div', { class: 'recordCardLine' }, objective.label),
    el('div', { class: 'recordCardLine subtle' }, objective.detail),
    actionRow(button(objective.label, runObjectiveAction))));

  host.appendChild(el('div', { class: 'fallbackStats' },
    el('div', {}, `Project days remaining: ${state.daysRemaining}`),
    el('div', {}, `Evidence records: ${citableEvidence().length}`),
    el('div', {}, `Stations complete: ${stationStatus().filter((s) => s.done).length} of ${STATIONS.length}`)));

  host.appendChild(sectionHeading('Places on the site', 'Choose where to work. Everything here is the same activity the walkable version opens.'));
  const list = el('div', { class: 'recordList' });
  LOCATIONS.forEach((loc) => {
    const card = el('div', { class: 'recordCard' },
      el('div', { class: 'recordCardTitle' }, loc.label),
      el('div', { class: 'recordCardLine subtle' }, loc.text));
    card.appendChild(actionRow(...locationActions(loc)));
    list.appendChild(card);
  });
  host.appendChild(list);
}

function locationActions(loc) {
  switch (loc.kind) {
    case 'supervisor':
      return [button('Go to the field camp', () => activateTarget({ kind: 'supervisor' }))];
    case 'surveyZone':
      return [
        button('Walk the transect', openSurveyList),
        button('Site map and unit recommendation', openSurveySummary, 'secondary')
      ];
    case 'unitGrid':
      return [
        button('Excavation units', () => activateTarget({ kind: state.units.opened.length ? 'pit' : 'unitPlug', id: state.units.active || state.units.opened[0] || 'unitA' })),
        state.features.length ? button('Feature records', openFeatureList, 'secondary') : null
      ].filter(Boolean);
    case 'screen':
      return [button('Screening station', () => activateTarget({ kind: 'screen' }), 'secondary')];
    case 'lab':
      return [button('Field laboratory', () => activateTarget({ kind: 'lab' }))];
    case 'dating':
      return [button('Chronology bench', () => activateTarget({ kind: 'dating' }))];
    case 'synthesis':
      return [button('Interpretation table', () => activateTarget({ kind: 'synthesis' }))];
    case 'evidence':
      return [button('Evidence Room', () => activateTarget({ kind: 'evidence' }))];
    default:
      return [];
  }
}

function openSurveyList() {
  const host = byId('fallbackListBody');
  clear(host);
  const classified = Object.values(state.survey.records).filter((r) => r.classification).length;
  host.appendChild(progressLine(classified, SURVEY_ITEMS.length, 'Surface objects examined'));
  SURVEY_ITEMS.forEach((item, index) => {
    const rec = state.survey.records[item.id];
    const status = !rec || !rec.classification
      ? 'Not examined'
      : (rec.recordQuality && rec.recordQuality !== 'none' ? 'Examined and recorded' : 'Examined, not recorded');
    const tone = !rec || !rec.classification ? 'warn' : (rec.recordQuality && rec.recordQuality !== 'none' ? 'good' : 'bad');
    host.appendChild(el('div', { class: `recordCard tone-${tone}` },
      el('div', { class: 'recordCardTitle' }, `Surface object ${index + 1}`),
      el('div', { class: 'recordCardLine subtle' }, status),
      actionRow(button(rec && rec.classification ? 'Review' : 'Examine', () => {
        openSurveyItem(item.id);
      }))));
  });
  modal.open({ id: 'fallbackListOverlay', dismissible: true });
}

export function initFallbackControls() {
  const closeBtn = byId('closeFallbackListBtn');
  if (closeBtn) closeBtn.addEventListener('click', () => modal.close('fallbackListOverlay'));
}
