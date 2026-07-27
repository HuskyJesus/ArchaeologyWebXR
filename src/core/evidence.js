/* Derived views of the investigation: what evidence exists, what tags that
   evidence carries, which stations are complete, and what the learner should
   do next.

   Nothing here mutates state. Everything the Evidence Room, the synthesis
   workspace, the report and the assessment profile show is computed from
   these functions, so the report can never cite something the learner did
   not actually produce. */

import { state, levelsCompleted, computeLevelProvenience } from './state.js';
import { SURVEY_ITEMS, surveyItemById } from '../data/survey.js';
import { artifactById } from '../data/artifacts.js';
import { featureById } from '../data/features.js';
import { levelsForUnit, levelAt, potentialFinds } from '../data/excavation.js';
import { UNITS, unitById } from '../data/site.js';
import { radiocarbonFor, TYPOLOGY_LINES, STRATIGRAPHIC_LINES, DATING_QUESTIONS } from '../data/dating.js';
import { ETHICS_SCENARIOS } from '../data/ethics.js';
import { SYNTHESIS_DOMAINS, evaluateStatement } from '../data/synthesis.js';
import { REPORT_QUESTIONS, REPORT_OPEN_FIELDS } from '../data/text.js';

/* ---------- evidence index ---------- */

export function surveyEvidence() {
  const out = [];
  SURVEY_ITEMS.forEach((item) => {
    const rec = state.survey.records[item.id];
    if (!rec || !rec.classification) return;
    const recorded = rec.recordQuality && rec.recordQuality !== 'none';
    out.push({
      id: `sv:${item.id}`,
      category: 'survey',
      label: `Surface record: ${item.name}`,
      detail: recorded
        ? `Classified as ${rec.classification}, position recorded (${rec.recordQuality}).`
        : `Classified as ${rec.classification}, position not recorded.`,
      quality: recorded ? (rec.recordQuality === 'precise' ? 'good' : 'partial') : 'poor',
      citable: !!recorded,
      verdict: rec.verdict,
      tags: recorded && rec.verdict !== 'incorrect' ? item.tags : []
    });
  });
  return out;
}

export function artifactEvidence() {
  return state.artifacts.map((a) => {
    const def = artifactById(a.artifactId);
    const analysed = !!a.analysis;
    const tags = [...((def && def.tags) || [])];
    if (def && def.diagnostic && analysed) tags.push(def.diagnostic.period);
    return {
      id: `ar:${a.uid}`,
      uid: a.uid,
      category: 'artifact',
      label: def ? def.name : a.artifactId,
      detail: `${unitLabel(a.unit)}, level ${a.level}. Provenience: ${a.provenience}.${analysed ? ' Analysed.' : ' Not yet analysed.'}`,
      quality: a.provenience,
      citable: true,
      analysed,
      tags: a.provenience === 'poor' ? tags.filter((t) => t !== 'diagnostic') : tags
    };
  });
}

export function featureEvidence() {
  return state.features.map((f) => {
    const def = featureById(f.featureId);
    const complete = f.complete;
    return {
      id: `ft:${f.featureId}`,
      category: 'feature',
      label: def ? def.name : f.featureId,
      detail: `${unitLabel(f.unit)}, level ${f.level}. ${complete ? 'Record complete' : 'Record incomplete'}${f.interpretation ? `, interpreted as ${interpretationLabel(f)}` : ''}${f.confidence ? ` (${f.confidence} confidence)` : ''}.`,
      quality: complete && f.integrity === 'good' ? 'good' : (complete ? 'partial' : 'poor'),
      citable: complete,
      tags: complete && f.integrity === 'good' ? ((def && def.tags) || []) : []
    };
  });
}

function interpretationLabel(featureRec) {
  const def = featureById(featureRec.featureId);
  if (!def) return featureRec.interpretation;
  const found = def.interpretations.find((i) => i.id === featureRec.interpretation);
  return found ? found.label : featureRec.interpretation;
}

export function sampleEvidence() {
  return state.samples.map((s) => {
    const result = radiocarbonFor(s.key, s.quality);
    return {
      id: `sm:${s.key}`,
      category: 'sample',
      key: s.key,
      label: `Charcoal sample: ${result ? result.contextLabel : s.key}`,
      detail: s.quality === 'clean'
        ? 'Collected clean into a dedicated container and labelled in the field.'
        : 'Collected with a soil-loaded tool and labelled later. Contamination is likely.',
      quality: s.quality === 'clean' ? 'good' : 'poor',
      citable: true,
      tags: ['dating']
    };
  });
}

export function datingEvidence() {
  const out = [];
  state.samples.forEach((s) => {
    const result = radiocarbonFor(s.key, s.quality);
    if (!result) return;
    const judged = state.dating.reliability[s.key];
    out.push({
      id: `c14:${s.key}`,
      category: 'dating',
      key: s.key,
      label: `Radiocarbon: ${result.calibrated}`,
      detail: `${result.contextLabel}. ${result.bp}. ${result.note}`,
      quality: result.reliable ? 'good' : 'poor',
      citable: true,
      reliable: result.reliable,
      judged: judged || null,
      tags: result.reliable ? ['absoluteDate', 'dating'] : ['dating']
    });
  });
  availableTypologyLines().forEach((line) => {
    out.push({
      id: `ty:${line.id}`,
      category: 'dating',
      label: `Typology: ${line.label}, ${line.estimate}`,
      detail: line.note,
      quality: 'partial',
      citable: true,
      tags: ['relativeDate', line.id === 'ty_stemmed' ? 'archaic' : (line.id === 'ty_nail' || line.id === 'ty_glass' ? 'historic' : 'woodland')]
    });
  });
  availableStratigraphicLines().forEach((line) => {
    out.push({
      id: `st:${line.id}`,
      category: 'dating',
      label: `Stratigraphy: ${line.label}`,
      detail: `${line.statement} ${line.note}`,
      quality: 'good',
      citable: true,
      tags: ['stratigraphy', 'relativeDate']
    });
  });
  return out;
}

export function availableTypologyLines() {
  const recovered = new Set(state.artifacts.filter((a) => a.analysis).map((a) => a.artifactId));
  return TYPOLOGY_LINES.filter((l) => recovered.has(l.source));
}

export function availableStratigraphicLines() {
  return state.units.opened
    .filter((u) => levelsCompleted(u) >= 2)
    .map((u) => STRATIGRAPHIC_LINES[u])
    .filter(Boolean);
}

export function ethicsEvidence() {
  return Object.entries(state.ethics.decisions).map(([scenarioId, decision]) => {
    const scenario = ETHICS_SCENARIOS.find((s) => s.id === scenarioId);
    const choice = scenario && scenario.choices.find((c) => c.id === decision.choiceId);
    return {
      id: `eth:${scenarioId}`,
      category: 'ethics',
      label: scenario ? scenario.title : scenarioId,
      detail: choice ? choice.text : decision.choiceId,
      quality: decision.soundness === 'sound' ? 'good' : (decision.soundness === 'partial' ? 'partial' : 'poor'),
      citable: false,
      tags: []
    };
  });
}

export function missedEvidence() {
  const out = state.missed.map((m) => {
    const def = artifactById(m.artifactId);
    return {
      id: `ms:${m.key}`,
      category: 'missed',
      label: def ? def.name : m.artifactId,
      detail: `${unitLabel(m.unit)}, level ${m.level}. ${m.reason}`,
      quality: 'poor',
      citable: false,
      tags: []
    };
  });
  /* Units that were opened but stopped short leave potential finds unrecovered.
     These are reported as "not reached" rather than "missed through error". */
  state.units.opened.forEach((unitId) => {
    const done = levelsCompleted(unitId);
    const all = levelsForUnit(unitId);
    if (done >= all.length) return;
    const recovered = new Set(state.artifacts.filter((a) => a.unit === unitId).map((a) => a.artifactId));
    const missedIds = new Set(state.missed.filter((m) => m.unit === unitId).map((m) => m.artifactId));
    potentialFinds(unitId).forEach((artId) => {
      if (recovered.has(artId) || missedIds.has(artId)) return;
      const def = artifactById(artId);
      out.push({
        id: `nr:${unitId}:${artId}`,
        category: 'missed',
        label: def ? def.name : artId,
        detail: `${unitLabel(unitId)}: this unit was not excavated to the depth that would have produced it.`,
        quality: 'poor',
        citable: false,
        tags: []
      });
    });
  });
  return out;
}

export function unitEvidence() {
  return state.units.opened.map((unitId) => {
    const all = levelsForUnit(unitId);
    const done = levelsCompleted(unitId);
    const prog = state.units.progress[unitId] || {};
    const proveniences = Object.keys(prog.levels || {}).map((i) => computeLevelProvenience(unitId, Number(i)));
    const good = proveniences.filter((p) => p === 'good').length;
    return {
      id: `un:${unitId}`,
      category: 'unit',
      label: unitLabel(unitId),
      detail: `${done} of ${all.length} levels excavated. ${good} of ${proveniences.length || 0} levels documented to full provenience.${prog.contextLoss ? ` Context loss recorded in ${prog.contextLoss} decision${prog.contextLoss === 1 ? '' : 's'}.` : ''}`,
      quality: done >= all.length ? (prog.contextLoss ? 'partial' : 'good') : 'partial',
      citable: true,
      tags: []
    };
  });
}

export function allEvidence() {
  return [
    ...unitEvidence(),
    ...surveyEvidence(),
    ...artifactEvidence(),
    ...featureEvidence(),
    ...sampleEvidence(),
    ...datingEvidence(),
    ...ethicsEvidence(),
    ...missedEvidence()
  ];
}

export function citableEvidence() {
  return allEvidence().filter((e) => e.citable);
}

export function evidenceById(id) {
  return allEvidence().find((e) => e.id === id) || null;
}

/* The tag set that decides which synthesis conclusions are supported. */
export function evidenceTags() {
  const tags = new Set();
  [...surveyEvidence(), ...artifactEvidence(), ...featureEvidence(), ...sampleEvidence(), ...datingEvidence()]
    .filter((e) => e.citable)
    .forEach((e) => (e.tags || []).forEach((t) => tags.add(t)));
  return tags;
}

export function unitLabel(unitId) {
  const u = unitById(unitId);
  return u ? u.label : unitId;
}

/* ---------- station gating ---------- */

export function surveyComplete() {
  return Object.values(state.survey.records).filter((r) => r.classification).length >= SURVEY_ITEMS.length;
}

export function surveyReadyForPlacement() {
  const classified = Object.values(state.survey.records).filter((r) => r.classification).length;
  const concentrationDone = Object.keys(state.survey.concentration).length >= 2;
  return classified >= 8 && concentrationDone;
}

export function unitsFullyExcavated() {
  return state.units.opened.filter((u) => (state.units.progress[u] || {}).complete);
}

export function excavationComplete() {
  return unitsFullyExcavated().length >= 1;
}

export function laboratoryComplete() {
  if (!state.artifacts.length) return false;
  return state.artifacts.every((a) => a.analysis);
}

export function chronologyComplete() {
  // The sample reliability question is answered per sample in the radiocarbon
  // section rather than as a single stored conclusion, so it is checked
  // against the samples themselves.
  const applicable = applicableDatingQuestions().filter((q) => q.kind !== 'sampleReliability');
  if (!applicable.length) return false;
  const conclusionsDone = applicable.every((q) => state.dating.conclusions[q.id] !== undefined);
  const samplesJudged = state.samples.every((s) => !!state.dating.reliability[s.key]);
  return conclusionsDone && samplesJudged;
}

export function applicableDatingQuestions() {
  const samples = state.samples;
  const hasAnyDate = samples.length > 0;
  const hasReliable = samples.some((s) => {
    const r = radiocarbonFor(s.key, s.quality);
    return r && r.reliable;
  });
  return DATING_QUESTIONS.filter((q) => {
    const req = q.requires || {};
    if (req.anyDate && !hasAnyDate) return false;
    if (req.anyReliableDate && !hasReliable && availableTypologyLines().length === 0) return false;
    return true;
  });
}

export function exposedFeatures() {
  return state.features;
}

export function featuresComplete() {
  if (!state.features.length) return true; // a unit path may legitimately expose none
  return state.features.every((f) => f.complete);
}

export function synthesisComplete() {
  const domainsWithSelection = Object.keys(state.synthesis.selections)
    .filter((d) => Object.keys(state.synthesis.selections[d] || {}).length > 0);
  return domainsWithSelection.length >= 4;
}

export function triggeredEthicsScenarios() {
  const levels = state.units.opened.reduce((sum, u) => sum + levelsCompleted(u), 0);
  return ETHICS_SCENARIOS.filter((s) => levels >= (s.trigger.minLevelsCompleted || 0));
}

export function ethicsComplete() {
  const triggered = triggeredEthicsScenarios();
  return triggered.length > 0 && triggered.every((s) => state.ethics.decisions[s.id]);
}

export function stationStatus() {
  const rows = [];
  rows.push({
    number: 1, id: 'preparation', done: state.equipment.prepared,
    missing: state.equipment.prepared ? [] : ['prepare the field kit']
  });
  rows.push({
    number: 2, id: 'survey', done: surveyReadyForPlacement() && !!state.survey.recommendation,
    missing: [
      Object.values(state.survey.records).filter((r) => r.classification).length < 8
        ? `classify at least 8 surface objects (${Object.values(state.survey.records).filter((r) => r.classification).length} of ${SURVEY_ITEMS.length} done)` : null,
      Object.keys(state.survey.concentration).length < 2 ? 'answer the concentration comparison' : null,
      !state.survey.recommendation ? 'recommend an excavation unit' : null
    ].filter(Boolean)
  });
  rows.push({
    number: 3, id: 'excavation', done: excavationComplete(),
    missing: excavationComplete() ? [] : [
      !state.units.opened.length ? 'open an excavation unit' : `finish excavating ${unitLabel(state.units.active || state.units.opened[0])}`
    ]
  });
  rows.push({
    number: 4, id: 'laboratory', done: laboratoryComplete(),
    missing: laboratoryComplete() ? [] : [
      !state.artifacts.length ? 'recover material to analyse' : `analyse the remaining finds (${state.artifacts.filter((a) => a.analysis).length} of ${state.artifacts.length} done)`
    ]
  });
  rows.push({
    number: 5, id: 'chronology', done: chronologyComplete(),
    missing: chronologyComplete() ? [] : ['complete the chronology assessment at the chronology bench']
  });
  rows.push({
    number: 6, id: 'features', done: featuresComplete() && state.features.length > 0,
    missing: state.features.length === 0
      ? ['expose a feature (your unit path may not produce one)']
      : (featuresComplete() ? [] : [`finish the feature records (${state.features.filter((f) => f.complete).length} of ${state.features.length} done)`])
  });
  rows.push({
    number: 7, id: 'synthesis', done: synthesisComplete(),
    missing: synthesisComplete() ? [] : ['record conclusions in at least four areas at the interpretation table']
  });
  rows.push({
    number: 8, id: 'ethics', done: ethicsComplete(),
    missing: ethicsComplete() ? [] : [`resolve the outstanding professional decisions (${Object.keys(state.ethics.decisions).length} of ${triggeredEthicsScenarios().length} done)`]
  });
  rows.push({
    number: 9, id: 'report', done: state.report.submitted,
    missing: state.report.submitted ? [] : ['submit the final report']
  });
  return rows;
}

/* Requirements that must be met before the final report can be submitted.
   Station 6 is not hard-required, because a unit path may legitimately
   expose no features; if features were exposed, their records must be
   complete. */
export function reportRequirements() {
  const missing = [];
  if (!state.equipment.prepared) missing.push('prepare the field kit');
  if (!surveyReadyForPlacement()) missing.push('complete enough of the surface survey to justify a unit placement');
  if (!state.survey.recommendation) missing.push('recommend an excavation unit');
  if (!excavationComplete()) missing.push('finish excavating at least one unit');
  if (state.artifacts.length && !laboratoryComplete()) missing.push('analyse every recovered find in the laboratory');
  if (state.features.length && !featuresComplete()) missing.push('complete every feature record');
  if (!chronologyComplete()) missing.push('complete the chronology assessment');
  if (!synthesisComplete()) missing.push('record conclusions in at least four areas at the interpretation table');
  if (!ethicsComplete()) missing.push('resolve every professional decision raised on site');
  return missing;
}

export function reportAnswerStatus() {
  const problems = [];
  REPORT_QUESTIONS.forEach((q) => {
    const a = state.report.answers[q.id];
    if (!a || !a.claim || !a.claim.trim()) { problems.push(`Question ${q.number}: enter a conclusion.`); return; }
    if (!a.evidence || a.evidence.length < q.minEvidence) {
      problems.push(`Question ${q.number}: cite at least ${q.minEvidence} piece${q.minEvidence === 1 ? '' : 's'} of evidence.`);
      return;
    }
    if (!a.confidence) { problems.push(`Question ${q.number}: choose a confidence level.`); return; }
    if (!a.reasoning || a.reasoning.trim().length < q.minReasoning) {
      problems.push(`Question ${q.number}: explain how the evidence supports the conclusion (at least ${q.minReasoning} characters).`);
    }
  });
  REPORT_OPEN_FIELDS.forEach((f) => {
    const v = state.report.open[f.id];
    if (!v || v.trim().length < f.minLength) {
      problems.push(`Question ${f.number}: ${f.prompt} (at least ${f.minLength} characters).`);
    }
  });
  return problems;
}

/* ---------- objective ---------- */

export function currentObjective() {
  if (!state.equipment.prepared) {
    return { station: 1, locationId: 'camp', action: 'openEquipment', label: 'Build your field kit', detail: 'What you take determines what you can do later.' };
  }
  if (!surveyReadyForPlacement()) {
    return { station: 2, locationId: 'survey', action: 'guideSurvey', label: 'Survey the surface', detail: `Examine and record the marked objects across the transect (${Object.values(state.survey.records).filter((r) => r.classification).length} of ${SURVEY_ITEMS.length} classified).` };
  }
  if (!state.survey.recommendation) {
    return { station: 2, locationId: 'grid', action: 'openUnitChoice', label: 'Recommend an excavation unit', detail: 'Justify the placement from what you recorded.' };
  }
  if (!state.units.opened.length) {
    return { station: 3, locationId: 'grid', action: 'openUnitChoice', label: 'Open your excavation unit', detail: 'Committing to a unit costs project days.' };
  }
  if (!excavationComplete()) {
    const unitId = state.units.active || state.units.opened[0];
    return { station: 3, locationId: 'grid', action: 'openExcavation', label: `Excavate ${unitLabel(unitId)}`, detail: `Level ${levelsCompleted(unitId) + 1} of ${levelsForUnit(unitId).length}.` };
  }
  if (state.features.length && !featuresComplete()) {
    return { station: 6, locationId: 'grid', action: 'openFeatures', label: 'Finish your feature records', detail: 'A feature record without observations cannot support an interpretation.' };
  }
  if (state.artifacts.length && !laboratoryComplete()) {
    return { station: 4, locationId: 'lab', action: 'openLab', label: 'Analyse your finds', detail: `${state.artifacts.filter((a) => a.analysis).length} of ${state.artifacts.length} analysed.` };
  }
  if (!chronologyComplete()) {
    return { station: 5, locationId: 'dating', action: 'openDating', label: 'Work out the chronology', detail: 'Decide which of your dating evidence can be trusted.' };
  }
  if (!ethicsComplete()) {
    return { station: 8, locationId: 'camp', action: 'openEthics', label: 'Resolve outstanding professional decisions', detail: 'The field director is waiting on you.' };
  }
  if (!synthesisComplete()) {
    return { station: 7, locationId: 'synthesis', action: 'openSynthesis', label: 'Reconstruct daily life', detail: 'Connect your evidence to what people did here.' };
  }
  if (!state.report.submitted) {
    return { station: 9, locationId: 'evidence', action: 'openReport', label: 'Write the final report', detail: 'Every conclusion needs cited evidence and reasoning.' };
  }
  return { station: 9, locationId: 'evidence', action: 'openResults', label: 'Review your investigation report', detail: 'The investigation is complete.' };
}

/* ---------- synthesis support ---------- */

export function synthesisSupport() {
  const tags = evidenceTags();
  return SYNTHESIS_DOMAINS.map((domain) => ({
    domain,
    statements: domain.statements.map((st) => ({
      statement: st,
      support: evaluateStatement(st, tags)
    }))
  }));
}
