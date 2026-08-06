/* Telemetry: an xAPI-shaped event stream plus CSV export.

   Events are stored inside the investigation state, so they survive a reload
   and the exported record covers the whole investigation rather than the
   current page visit. Milestone events are recorded through `recordOnce`,
   which is backed by the same idempotency list used for rewards, so a
   resumed session cannot duplicate them. */

import { state, awardOnce, hasAwarded } from './state.js';
import { csvCell } from './dom.js';
import { on, EVENTS } from './events.js';
import { STATIONS } from '../data/text.js';

const VERB_IRIS = {
  selected: 'http://id.tincanapi.com/verb/selected',
  observed: 'http://activitystrea.ms/schema/1.0/observe',
  measured: 'http://id.tincanapi.com/verb/measured',
  photographed: 'http://id.tincanapi.com/verb/captured-photo',
  classified: 'http://id.tincanapi.com/verb/categorized',
  interpreted: 'http://adlnet.gov/expapi/verbs/responded',
  documented: 'http://id.tincanapi.com/verb/recorded',
  analysed: 'http://adlnet.gov/expapi/verbs/answered',
  dated: 'http://id.tincanapi.com/verb/estimated',
  concluded: 'http://adlnet.gov/expapi/verbs/asserted',
  completed: 'http://adlnet.gov/expapi/verbs/completed',
  opened: 'http://id.tincanapi.com/verb/viewed',
  resumed: 'http://adlnet.gov/expapi/verbs/resumed'
};

const EXTENSION_KEYS = [
  'correct', 'verdict', 'provenience', 'confidence', 'documented', 'soundness', 'included',
  'classification', 'quality', 'unit', 'level', 'station', 'support', 'reliable', 'days',
  'field', 'answer', 'claimCount', 'evidenceCount', 'reason', 'kind', 'name'
];

let sessionStartMs = null;

export function startSession(name) {
  if (name) state.studentName = name;
  sessionStartMs = performance.now();
  record('session', 'opened', { station: state.progress.station });
}

export function resumeSession() {
  sessionStartMs = performance.now();
  record('session', 'resumed', { station: state.progress.station });
}

export function record(objectId, verb, extra = {}) {
  const evt = { objectId, verb, ...extra };
  evt.atISO = new Date().toISOString();
  evt.elapsedMs = sessionStartMs === null ? 0 : Math.round(performance.now() - sessionStartMs);
  state.telemetry.push(evt);
  if (state.telemetry.length > 3000) state.telemetry.splice(0, state.telemetry.length - 3000);
  return evt;
}

/* Milestone events that must never appear twice, even across reloads. */
export function recordOnce(key, objectId, verb, extra = {}) {
  let recorded = false;
  awardOnce(`telemetry:${key}`, () => {
    record(objectId, verb, extra);
    recorded = true;
  });
  return recorded;
}

export function alreadyRecorded(key) {
  return hasAwarded(`telemetry:${key}`);
}

export function events() {
  return state.telemetry;
}

/* ---------- interaction timeline ----------
   Beyond graded decisions, the record captures the ORDER in which the learner
   moved through the investigation: every panel they opened, every station
   they reached, and VR entry and exit. Together with the per-event elapsed
   time this makes the exported record a full activity timeline rather than a
   list of completed things.

   panelOpened re-fires for the panel underneath when one closes (the XR
   mirror needs that), so opens are de-duplicated against the set of panels
   currently open. */
const openPanelIds = new Set();

on(EVENTS.panelOpened, (entry) => {
  if (!entry || !entry.id || openPanelIds.has(entry.id)) return;
  openPanelIds.add(entry.id);
  record(entry.id, 'opened', { kind: 'panel' });
});

on(EVENTS.panelClosed, (entry) => {
  if (entry && entry.id) openPanelIds.delete(entry.id);
});

let lastRecordedStation = null;
on(EVENTS.stationChanged, (n) => {
  if (n === lastRecordedStation) return;
  lastRecordedStation = n;
  const s = STATIONS.find((x) => x.number === n);
  record(`station_${n}`, 'opened', { kind: 'station', station: n, name: s ? s.name : String(n) });
});

on(EVENTS.xrSessionStart, () => record('vr_session', 'opened', { kind: 'mode' }));
on(EVENTS.xrSessionEnd, () => record('vr_session', 'completed', { kind: 'mode' }));

export function timeOnTaskMs() {
  if (!state.telemetry.length) return 0;
  const first = state.telemetry[0];
  const last = state.telemetry[state.telemetry.length - 1];
  const firstMs = Date.parse(first.atISO);
  const lastMs = Date.parse(last.atISO);
  if (Number.isNaN(firstMs) || Number.isNaN(lastMs)) return 0;
  return Math.max(0, lastMs - firstMs);
}

export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function toCSV() {
  const header = ['object_id', 'verb', 'detail', 'elapsed_ms', 'timestamp_iso'];
  const lines = [header.map(csvCell).join(',')];
  state.telemetry.forEach((e) => {
    const detail = Object.keys(e)
      .filter((k) => !['objectId', 'verb', 'atISO', 'elapsedMs'].includes(k))
      .map((k) => `${k}=${formatValue(e[k])}`)
      .join('; ');
    lines.push([e.objectId, e.verb, detail, e.elapsedMs, e.atISO].map(csvCell).join(','));
  });
  return `﻿${lines.join('\n')}`;
}

function formatValue(v) {
  if (Array.isArray(v)) return v.join('|');
  if (v && typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function toXAPI() {
  const actor = { objectType: 'Agent', name: state.studentName || 'Student' };
  const statements = state.telemetry
    .filter((e) => e.objectId !== 'session')
    .map((e) => {
      const verbId = VERB_IRIS[e.verb] || `https://redstonebluff.example/verbs/${e.verb}`;
      const extensions = {};
      EXTENSION_KEYS.forEach((k) => {
        if (e[k] !== undefined) extensions[`https://redstonebluff.example/ext/${k}`] = e[k];
      });
      const stmt = {
        actor,
        verb: { id: verbId, display: { 'en-US': e.verb } },
        object: {
          objectType: 'Activity',
          id: `https://redstonebluff.example/object/${encodeURIComponent(e.objectId)}`,
          definition: {
            name: { 'en-US': e.objectId },
            description: { 'en-US': `Redstone Bluff investigation: ${e.verb} ${e.objectId}` }
          }
        },
        timestamp: e.atISO
      };
      const hasResult = e.correct !== undefined || Object.keys(extensions).length > 0;
      if (hasResult) {
        stmt.result = {};
        if (e.correct !== undefined) stmt.result.success = !!e.correct;
        if (Object.keys(extensions).length) stmt.result.extensions = extensions;
      }
      return stmt;
    });
  return JSON.stringify(statements, null, 2);
}
