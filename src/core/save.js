/* Local save, resume and migration.

   The save is a single JSON blob in localStorage. `migrate` walks a saved
   blob forward one version at a time, so a save written by an older build
   keeps working rather than being silently discarded. Every migration is a
   pure function and is covered by the test suite.

   `awarded` travels with the save, which is what prevents a reload from
   re-granting artifacts, day costs or telemetry milestones. */

import { createInitialState, STATE_VERSION, state, replaceState } from './state.js';
import { on, EVENTS } from './events.js';

export const STORAGE_KEY = 'redstoneBluff.investigation';
export const SETTINGS_KEY = 'redstoneBluff.settings';

/* ---------- migrations ---------- */

/* v1 is the shape produced by the original single-file prototype. It is
   handled so that a learner mid-way through that build is not stranded. */
function migrate1to2(old) {
  const next = createInitialState();
  next.version = 2;
  next.studentName = old.studentName || '';
  next.daysRemaining = typeof old.daysRemaining === 'number' ? old.daysRemaining : next.daysRemaining;
  next.equipment.selected = Array.isArray(old.equipment && old.equipment.selected) ? [...old.equipment.selected] : [];
  next.equipment.justifications = (old.equipment && old.equipment.justifications) || {};
  next.equipment.prepared = !!(old.equipment && old.equipment.selected && old.equipment.selected.length);
  (Array.isArray(old.notes) ? old.notes : []).forEach((n) => {
    next.notes.push({ text: typeof n === 'string' ? n : String(n && n.text ? n.text : n), atISO: next.createdISO });
  });
  next.legacy = {
    surveyFlagged: (old.survey && old.survey.flagged) || [],
    chosenUnit: old.chosenUnit || null,
    excavation: old.excavation || null,
    artifacts: old.artifacts || [],
    features: old.features || [],
    ethics: (old.ethics && old.ethics.decisions) || [],
    finalInterpretation: old.finalInterpretation || null
  };
  return next;
}

function migrate2to3(old) {
  const next = { ...old, version: 3 };
  next.units = next.units || { opened: [], active: null, progress: {} };
  const legacy = next.legacy || {};
  if (legacy.chosenUnit && !next.units.opened.includes(legacy.chosenUnit)) {
    next.units.opened.push(legacy.chosenUnit);
    next.units.active = legacy.chosenUnit;
    next.units.progress[legacy.chosenUnit] = {
      levelIndex: (legacy.excavation && legacy.excavation.levelsCompleted) || 0,
      stepIndex: 0,
      complete: false,
      levels: {},
      contextLoss: 0
    };
  }
  next.survey = next.survey || { records: {}, concentration: {}, recommendation: null, mapped: [] };
  (legacy.surveyFlagged || []).forEach((f) => {
    const mappedId = LEGACY_SURVEY_IDS[f.id] || null;
    if (!mappedId) return;
    next.survey.records[mappedId] = {
      id: mappedId,
      classification: f.calledEvidence ? 'artifact' : 'natural',
      verdict: f.correct ? 'correct' : 'incorrect',
      recordMethod: 'sketch',
      recordQuality: 'sketch'
    };
    if (!next.survey.mapped.includes(mappedId)) next.survey.mapped.push(mappedId);
  });
  next.artifacts = Array.isArray(next.artifacts) ? next.artifacts : [];
  (legacy.artifacts || []).forEach((a) => {
    const mappedId = LEGACY_ARTIFACT_IDS[a.id];
    if (!mappedId) return;
    const unit = legacy.chosenUnit || 'unitA';
    const uid = `${unit}-L2-${mappedId}`;
    if (next.artifacts.some((x) => x.uid === uid)) return;
    next.artifacts.push({
      uid,
      artifactId: mappedId,
      unit,
      level: 2,
      provenience: a.provenience === 'good' ? 'good' : 'poor',
      recoveredBy: 'excavation',
      photographed: a.provenience === 'good',
      analysis: null,
      analysisVersion: 0
    });
  });
  return next;
}

function migrate3to4(old) {
  const next = { ...old, version: 4 };
  next.samples = Array.isArray(next.samples) ? next.samples : [];
  next.dating = next.dating || { reliability: {}, methodSort: {}, conclusions: {} };
  next.synthesis = next.synthesis || { selections: {} };
  next.report = next.report || { answers: {}, open: {}, submitted: false, submittedISO: null };
  const legacy = next.legacy || {};
  if (legacy.finalInterpretation && Array.isArray(legacy.finalInterpretation.claims) && legacy.finalInterpretation.claims.length) {
    const first = legacy.finalInterpretation.claims[0];
    next.report.answers.activities = {
      claim: first.claim || '',
      evidence: [],
      confidence: first.confidence || 'tentative',
      reasoning: first.reasoning || '',
      migratedFromLegacy: true
    };
    next.report.open.uncertain = legacy.finalInterpretation.limitations || '';
  }
  next.ethics = next.ethics && next.ethics.decisions ? next.ethics : { decisions: {}, seen: [] };
  (legacy.ethics || []).forEach((d) => {
    if (d && d.scenario === 'visitor_collecting' && !next.ethics.decisions.eth_visitor) {
      next.ethics.decisions.eth_visitor = {
        choiceId: d.sound ? 'documentAndRefer' : 'recordThenGive',
        soundness: d.sound ? 'sound' : 'partial',
        atISO: next.createdISO,
        migratedFromLegacy: true
      };
    }
  });
  delete next.legacy;
  return next;
}

const LEGACY_SURVEY_IDS = {
  sv1: 'sv_debitage',
  sv2: 'sv_cobble',
  sv3: 'sv_sherd',
  sv4: 'sv_fcr',
  sv5: 'sv_can'
};

const LEGACY_ARTIFACT_IDS = {
  sherd1: 'ar_sherd_cordmarked',
  intrusive1: 'ar_nail_cut'
};

const MIGRATIONS = {
  1: migrate1to2,
  2: migrate2to3,
  3: migrate3to4
};

export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  let working = raw;
  let version = Number(working.version) || 1;
  let guard = 0;
  while (version < STATE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return null;
    working = step(working);
    version = Number(working.version);
    guard += 1;
    if (guard > 20) return null;
  }
  if (version > STATE_VERSION) return null; // save from a newer build
  return normalise(working);
}

/* Fills in anything a migration or a hand-edited save might be missing, so a
   partially shaped object cannot crash the application on load. */
export function normalise(obj) {
  const base = createInitialState();
  const out = { ...base, ...obj };
  out.version = STATE_VERSION;
  out.settings = { ...base.settings, ...(obj.settings || {}) };
  out.settings.xr = { ...base.settings.xr, ...((obj.settings || {}).xr || {}) };
  out.progress = { ...base.progress, ...(obj.progress || {}) };
  out.equipment = { ...base.equipment, ...(obj.equipment || {}) };
  out.survey = { ...base.survey, ...(obj.survey || {}) };
  out.units = { ...base.units, ...(obj.units || {}) };
  out.dating = { ...base.dating, ...(obj.dating || {}) };
  out.synthesis = { ...base.synthesis, ...(obj.synthesis || {}) };
  out.ethics = { ...base.ethics, ...(obj.ethics || {}) };
  out.report = { ...base.report, ...(obj.report || {}) };
  ['artifacts', 'missed', 'samples', 'features', 'notes', 'awarded', 'telemetry', 'dayLog'].forEach((k) => {
    if (!Array.isArray(out[k])) out[k] = [];
  });
  if (typeof out.daysRemaining !== 'number' || Number.isNaN(out.daysRemaining)) out.daysRemaining = base.daysRemaining;
  return out;
}

/* ---------- storage ---------- */

function storageAvailable() {
  try {
    const probe = '__rb_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch (e) {
    return false;
  }
}

export const canPersist = storageAvailable();

export function hasSave() {
  if (!canPersist) return false;
  return !!window.localStorage.getItem(STORAGE_KEY);
}

export function readRaw() {
  if (!canPersist) return null;
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.warn('[save] could not parse saved investigation', e);
    return null;
  }
}

export function saveNow() {
  if (!canPersist) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('[save] could not write investigation', e);
    return false;
  }
}

export function loadSave() {
  const raw = readRaw();
  if (!raw) return null;
  const migrated = migrate(raw);
  if (!migrated) return null;
  replaceState(migrated);
  return migrated;
}

export function clearSave() {
  if (!canPersist) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function saveSummary() {
  const raw = readRaw();
  if (!raw) return null;
  const migrated = migrate(raw);
  if (!migrated) return { corrupt: true };
  return {
    studentName: migrated.studentName || 'Unnamed investigator',
    station: (migrated.progress && migrated.progress.station) || 1,
    daysRemaining: migrated.daysRemaining,
    updatedISO: migrated.updatedISO,
    artifacts: migrated.artifacts.length,
    features: migrated.features.length
  };
}

/* Settings are also mirrored outside the investigation save, so that a
   learner starting a new investigation keeps their accessibility and comfort
   preferences. */
export function saveSettings(settings) {
  if (!canPersist) return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) { /* non-fatal */ }
}

export function loadSettings() {
  if (!canPersist) return null;
  try {
    const text = window.localStorage.getItem(SETTINGS_KEY);
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return null;
  }
}

/* ---------- autosave ---------- */

let pending = null;
let enabled = false;

export function enableAutosave() {
  if (enabled) return;
  enabled = true;
  on(EVENTS.stateChanged, scheduleSave);
  on(EVENTS.settingsChanged, (settings) => {
    saveSettings(settings);
    scheduleSave();
  });
  window.addEventListener('pagehide', flushSave);
  window.addEventListener('beforeunload', flushSave);
}

function scheduleSave() {
  if (!enabled) return;
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    saveNow();
  }, 400);
}

export function flushSave() {
  if (pending) {
    clearTimeout(pending);
    pending = null;
  }
  if (enabled) saveNow();
}
