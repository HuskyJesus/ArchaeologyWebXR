/* The investigation state, and every function that changes it.

   This module has no DOM dependency so it can be exercised directly by the
   test suite. UI modules read from `state` and call the mutators here; they
   never assign into `state` themselves.

   Duplicate protection: anything that grants a reward, an artifact, a
   telemetry milestone or a day cost goes through `awardOnce`, which records
   an idempotency key in `state.awarded`. Because `awarded` is saved with the
   rest of the state, reloading a save cannot re-grant anything. */

import { emit, EVENTS } from './events.js';
import { SITE } from '../data/site.js';
import { itemById } from '../data/equipment.js';
import { levelsForUnit, levelAt } from '../data/excavation.js';

export const STATE_VERSION = 4;

export function createInitialState() {
  return {
    version: STATE_VERSION,
    studentName: '',
    createdISO: new Date().toISOString(),
    updatedISO: new Date().toISOString(),
    settings: {
      quality: 'standard',
      sensitivity: 1,
      cameraBob: true,
      reducedMotion: false,
      textScale: 1,
      highContrast: false,
      muted: false,
      xr: { snapAngle: 30, locomotion: 'teleport', vignette: true }
    },
    progress: { onboarded: false, briefed: false, station: 1, visitedStations: [] },
    daysRemaining: SITE.totalDays,
    daysOverrun: 0,
    dayLog: [],
    equipment: { selected: [], justifications: {}, prepared: false, retrieved: [] },
    survey: { records: {}, concentration: {}, recommendation: null, mapped: [] },
    units: { opened: [], active: null, progress: {} },
    artifacts: [],
    missed: [],
    samples: [],
    features: [],
    dating: { reliability: {}, methodSort: {}, conclusions: {} },
    synthesis: { selections: {} },
    ethics: { decisions: {}, seen: [] },
    notes: [],
    report: { answers: {}, open: {}, submitted: false, submittedISO: null },
    awarded: [],
    telemetry: []
  };
}

export let state = createInitialState();

export function replaceState(next) {
  state = next;
  touch();
  emit(EVENTS.stateChanged, state);
  emit(EVENTS.evidenceChanged, state);
  emit(EVENTS.daysChanged, state.daysRemaining);
}

export function resetState() {
  replaceState(createInitialState());
}

function touch() {
  state.updatedISO = new Date().toISOString();
}

export function changed() {
  touch();
  emit(EVENTS.stateChanged, state);
}

/* ---------- idempotency ---------- */

export function hasAwarded(key) {
  return state.awarded.includes(key);
}

/* Runs `fn` at most once for a given key across the whole life of a save.
   Returns true if the work was performed this call. */
export function awardOnce(key, fn) {
  if (state.awarded.includes(key)) return false;
  state.awarded.push(key);
  if (typeof fn === 'function') fn();
  touch();
  return true;
}

/* ---------- time ---------- */

/* Running out of time does not block the investigation. Work past the
   construction deadline is recorded as an overrun instead, because a learner
   who mismanages the schedule should still be able to finish and see the
   consequence in the report rather than hitting a dead end. */
export function spendDays(reason, amount) {
  const days = Math.max(0, Number(amount) || 0);
  if (!days) return state.daysRemaining;
  const overrun = Math.max(0, days - state.daysRemaining);
  state.daysRemaining = Math.max(0, state.daysRemaining - days);
  if (overrun) state.daysOverrun += overrun;
  state.dayLog.push({ reason, days, remaining: state.daysRemaining, overrun, atISO: new Date().toISOString() });
  addNote(overrun
    ? `Time: ${reason}. ${days} project day${days === 1 ? '' : 's'} spent, ${overrun} of them past the construction deadline.`
    : `Time: ${reason}. ${days} project day${days === 1 ? '' : 's'} spent, ${state.daysRemaining} remaining.`);
  touch();
  emit(EVENTS.daysChanged, state.daysRemaining);
  emit(EVENTS.stateChanged, state);
  return state.daysRemaining;
}

export const PHASE_COSTS = {
  mobilisation: 1,
  survey: 2,
  levelExcavation: 1,
  laboratory: 2,
  chronology: 1,
  synthesis: 1
};

export function spendDaysOnce(key, reason, amount) {
  return awardOnce(key, () => spendDays(reason, amount));
}

export function daysUsed() {
  return SITE.totalDays - state.daysRemaining;
}

export function outOfTime() {
  return state.daysRemaining <= 0;
}

/* ---------- notes ---------- */

export function addNote(text) {
  state.notes.push({ text, atISO: new Date().toISOString() });
  if (state.notes.length > 400) state.notes.splice(0, state.notes.length - 400);
  touch();
}

/* ---------- equipment ---------- */

export function toggleEquipment(id) {
  const idx = state.equipment.selected.indexOf(id);
  if (idx === -1) state.equipment.selected.push(id);
  else state.equipment.selected.splice(idx, 1);
  changed();
  return idx === -1;
}

export function recordJustification(itemId, choiceId, correct) {
  state.equipment.justifications[itemId] = { choiceId, correct };
  changed();
}

export function prepareKit() {
  state.equipment.prepared = true;
  spendDaysOnce('phase:mobilisation', 'Loading the vehicle and travelling to site', PHASE_COSTS.mobilisation);
  setStation(2);
  changed();
}

export function retrieveEquipment(id, costDays) {
  if (state.equipment.selected.includes(id)) return false;
  state.equipment.selected.push(id);
  state.equipment.retrieved.push(id);
  spendDays(`Returned to the equipment store for the ${(itemById(id) || {}).label || id}`, costDays);
  changed();
  return true;
}

export function hasCapability(cap) {
  return state.equipment.selected.some((id) => {
    const item = itemById(id);
    return item && item.capability === cap;
  });
}

export function capabilitiesHeld() {
  const set = new Set();
  state.equipment.selected.forEach((id) => {
    const item = itemById(id);
    if (item && item.capability) set.add(item.capability);
  });
  return set;
}

/* ---------- survey ---------- */

export function recordSurveyClassification(itemId, classification, verdict) {
  const existing = state.survey.records[itemId] || {};
  state.survey.records[itemId] = {
    ...existing,
    id: itemId,
    classification,
    verdict,
    classifiedISO: new Date().toISOString()
  };
  changed();
}

export function recordSurveyPosition(itemId, methodId, quality) {
  const existing = state.survey.records[itemId];
  if (!existing) return;
  existing.recordMethod = methodId;
  existing.recordQuality = quality;
  if (quality !== 'none' && !state.survey.mapped.includes(itemId)) state.survey.mapped.push(itemId);
  changed();
}

export function surveyRecord(itemId) {
  return state.survey.records[itemId] || null;
}

export function surveyClassifiedCount() {
  return Object.values(state.survey.records).filter((r) => r.classification).length;
}

export function surveyMappedCount() {
  return state.survey.mapped.length;
}

export function recordConcentrationAnswer(questionId, optionId, correct) {
  state.survey.concentration[questionId] = { optionId, correct };
  changed();
}

export function setUnitRecommendation(unitId, rationaleId) {
  state.survey.recommendation = { unitId, rationaleId, atISO: new Date().toISOString() };
  spendDaysOnce('phase:survey', 'Walking, recording and mapping the survey transect', PHASE_COSTS.survey);
  setStation(3);
  changed();
}

/* ---------- units and excavation ---------- */

export function openUnit(unitId, costDays, reason) {
  if (state.units.opened.includes(unitId)) return false;
  state.units.opened.push(unitId);
  state.units.active = unitId;
  state.units.progress[unitId] = {
    levelIndex: 0,
    stepIndex: 0,
    complete: false,
    levels: {},
    contextLoss: 0
  };
  spendDays(reason || `Opened ${unitId}`, costDays);
  changed();
  return true;
}

export function setActiveUnit(unitId) {
  if (!state.units.opened.includes(unitId)) return false;
  state.units.active = unitId;
  changed();
  return true;
}

export function unitProgress(unitId) {
  return state.units.progress[unitId] || null;
}

export function levelRecord(unitId, levelIndex) {
  const prog = state.units.progress[unitId];
  if (!prog) return null;
  if (!prog.levels[levelIndex]) prog.levels[levelIndex] = { doc: {}, decisions: [], complete: false };
  return prog.levels[levelIndex];
}

export function recordExcavationDecision(unitId, levelIndex, step, option) {
  const rec = levelRecord(unitId, levelIndex);
  if (!rec) return null;
  const already = rec.decisions.find((d) => d.stepId === step.id);
  if (already) return already;
  const entry = {
    stepId: step.id,
    kind: step.kind,
    optionId: option.id,
    text: option.text,
    correct: !!option.correct,
    defensible: !!option.defensible
  };
  rec.decisions.push(entry);
  const fx = option.effects || {};
  if (fx.doc) Object.assign(rec.doc, fx.doc);
  if (fx.contextLoss) {
    rec.doc.contextLoss = true;
    state.units.progress[unitId].contextLoss += 1;
  }
  if (fx.featureIntegrity) rec.featureIntegrity = fx.featureIntegrity;
  if (fx.days) spendDays(`${unitId} level ${levelIndex + 1}: ${option.text}`, fx.days);
  changed();
  return entry;
}

export function advanceStep(unitId) {
  const prog = state.units.progress[unitId];
  if (!prog) return;
  prog.stepIndex += 1;
  changed();
}

export function completeLevel(unitId, levelIndex) {
  const prog = state.units.progress[unitId];
  if (!prog) return;
  const rec = levelRecord(unitId, levelIndex);
  if (!rec.complete) {
    spendDaysOnce(`phase:level:${unitId}:${levelIndex}`,
      `Excavating and recording ${unitId} level ${levelIndex + 1}`, PHASE_COSTS.levelExcavation);
  }
  rec.complete = true;
  prog.levelIndex = Math.max(prog.levelIndex, levelIndex + 1);
  prog.stepIndex = 0;
  if (prog.levelIndex >= levelsForUnit(unitId).length) prog.complete = true;
  changed();
}

export function levelsCompleted(unitId) {
  const prog = state.units.progress[unitId];
  if (!prog) return 0;
  return Object.values(prog.levels).filter((l) => l.complete).length;
}

export function totalLevelsCompleted() {
  return state.units.opened.reduce((sum, u) => sum + levelsCompleted(u), 0);
}

/* Documentation quality for one level, expressed relative to what that level
   actually offered. A level with no depth step is not penalised for the
   absence of a depth record. */
export function computeLevelProvenience(unitId, levelIndex) {
  const level = levelAt(unitId, levelIndex);
  const rec = levelRecord(unitId, levelIndex);
  if (!level || !rec) return 'poor';
  const doc = rec.doc || {};
  const available = [];
  level.steps.forEach((s) => {
    if (s.kind === 'photo') available.push('photo');
    else if (s.kind === 'record') available.push('measure');
    else if (s.kind === 'bag') available.push('bag');
    else if (s.kind === 'soil') available.push('soil');
  });
  if (!available.length) return 'partial';
  let score = 0;
  available.forEach((key) => {
    if (key === 'photo') score += doc.planned ? 1 : (doc.photographed ? 0.5 : 0);
    else if (key === 'measure') score += doc.measured === 'precise' ? 1 : (doc.measured === 'standard' ? 0.9 : 0);
    else if (key === 'bag') score += doc.bagged === 'context' ? 1 : (doc.bagged === 'level' ? 0.5 : 0);
    else if (key === 'soil') score += doc.soilRecorded ? 1 : 0;
  });
  let ratio = score / available.length;
  if (doc.contextLoss) ratio = Math.min(ratio, 0.4);
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.45) return 'partial';
  return 'poor';
}

/* ---------- artifacts and samples ---------- */

export function addArtifact(entry) {
  const uid = `${entry.unit}-L${entry.level}-${entry.artifactId}`;
  if (state.artifacts.some((a) => a.uid === uid)) return null;
  const record = {
    uid,
    artifactId: entry.artifactId,
    unit: entry.unit,
    level: entry.level,
    provenience: entry.provenience || 'poor',
    recoveredBy: entry.recoveredBy || 'excavation',
    photographed: !!entry.photographed,
    analysis: null,
    analysisVersion: 0
  };
  state.artifacts.push(record);
  changed();
  emit(EVENTS.evidenceChanged, state);
  return record;
}

export function addMissed(entry) {
  const key = `${entry.unit}-L${entry.level}-${entry.artifactId}`;
  if (state.missed.some((m) => m.key === key)) return null;
  const record = { key, ...entry };
  state.missed.push(record);
  changed();
  return record;
}

export function artifactByUid(uid) {
  return state.artifacts.find((a) => a.uid === uid) || null;
}

export function recordAnalysis(uid, answers, verdicts) {
  const art = artifactByUid(uid);
  if (!art) return null;
  spendDaysOnce('phase:laboratory', 'Cleaning, sorting and analysing the assemblage', PHASE_COSTS.laboratory);
  art.analysis = { answers, verdicts, atISO: new Date().toISOString() };
  art.analysisVersion += 1;
  changed();
  emit(EVENTS.evidenceChanged, state);
  return art;
}

export function analysedCount() {
  return state.artifacts.filter((a) => a.analysis).length;
}

export function addSample(entry) {
  const key = `${entry.unit}-L${entry.level}`;
  if (state.samples.some((s) => s.key === key)) return null;
  const record = { key, ...entry };
  state.samples.push(record);
  changed();
  emit(EVENTS.evidenceChanged, state);
  return record;
}

/* ---------- features ---------- */

export function addFeature(featureId, unitId, levelIndex, integrity) {
  if (state.features.some((f) => f.featureId === featureId)) return null;
  const record = {
    featureId,
    unit: unitId,
    level: levelIndex + 1,
    integrity: integrity || 'good',
    observations: {},
    interpretation: null,
    alternative: null,
    confidence: null,
    photographed: false,
    drawn: false,
    complete: false
  };
  state.features.push(record);
  changed();
  emit(EVENTS.evidenceChanged, state);
  return record;
}

export function featureRecord(featureId) {
  return state.features.find((f) => f.featureId === featureId) || null;
}

export function updateFeature(featureId, patch) {
  const rec = featureRecord(featureId);
  if (!rec) return null;
  Object.assign(rec, patch);
  changed();
  emit(EVENTS.evidenceChanged, state);
  return rec;
}

export function completedFeatureCount() {
  return state.features.filter((f) => f.complete).length;
}

/* ---------- dating ---------- */

export function setDatingReliability(contextKey, judgement) {
  state.dating.reliability[contextKey] = judgement;
  changed();
}

export function setMethodSort(lineId, classification, correct) {
  state.dating.methodSort[lineId] = { classification, correct };
  changed();
}

export function setDatingConclusion(questionId, value) {
  spendDaysOnce('phase:chronology', 'Submitting samples and working through the chronology', PHASE_COSTS.chronology);
  state.dating.conclusions[questionId] = value;
  changed();
  emit(EVENTS.evidenceChanged, state);
}

/* ---------- synthesis ---------- */

export function setSynthesisSelection(domainId, statementId, payload) {
  spendDaysOnce('phase:synthesis', 'Laying out the evidence and drawing conclusions', PHASE_COSTS.synthesis);
  if (!state.synthesis.selections[domainId]) state.synthesis.selections[domainId] = {};
  if (payload === null) delete state.synthesis.selections[domainId][statementId];
  else state.synthesis.selections[domainId][statementId] = payload;
  changed();
  emit(EVENTS.evidenceChanged, state);
}

export function synthesisSelections() {
  const out = [];
  Object.entries(state.synthesis.selections).forEach(([domainId, statements]) => {
    Object.entries(statements).forEach(([statementId, payload]) => {
      out.push({ domainId, statementId, ...payload });
    });
  });
  return out;
}

/* ---------- ethics ---------- */

export function markEthicsSeen(scenarioId) {
  if (!state.ethics.seen.includes(scenarioId)) {
    state.ethics.seen.push(scenarioId);
    changed();
  }
}

export function recordEthicsDecision(scenarioId, choiceId, soundness) {
  if (state.ethics.decisions[scenarioId]) return false;
  state.ethics.decisions[scenarioId] = { choiceId, soundness, atISO: new Date().toISOString() };
  changed();
  emit(EVENTS.evidenceChanged, state);
  return true;
}

export function ethicsResolvedCount() {
  return Object.keys(state.ethics.decisions).length;
}

/* ---------- report ---------- */

export function setReportAnswer(questionId, payload) {
  state.report.answers[questionId] = payload;
  changed();
}

export function setReportOpen(fieldId, value) {
  state.report.open[fieldId] = value;
  changed();
}

export function submitReport() {
  state.report.submitted = true;
  state.report.submittedISO = new Date().toISOString();
  setStation(9);
  changed();
}

/* ---------- progress ---------- */

export function setStation(n) {
  if (n > state.progress.station) state.progress.station = n;
  if (!state.progress.visitedStations.includes(n)) state.progress.visitedStations.push(n);
  emit(EVENTS.stationChanged, state.progress.station);
  touch();
}

export function setSetting(path, value) {
  const parts = path.split('.');
  let node = state.settings;
  for (let i = 0; i < parts.length - 1; i += 1) {
    if (!node[parts[i]]) node[parts[i]] = {};
    node = node[parts[i]];
  }
  node[parts[parts.length - 1]] = value;
  touch();
  emit(EVENTS.settingsChanged, state.settings);
}
