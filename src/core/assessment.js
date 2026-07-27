/* The multidimensional assessment profile.

   There is deliberately no single percentage. Each dimension returns a band
   and a short evidence-based explanation of why it landed there, so the
   profile can be read as feedback rather than as a score. */

import { state, levelsCompleted, computeLevelProvenience, daysUsed } from './state.js';
import { EQUIPMENT_ITEMS } from '../data/equipment.js';
import { SURVEY_ITEMS } from '../data/survey.js';
import { levelsForUnit } from '../data/excavation.js';
import { featureById } from '../data/features.js';
import { scoreAnalysisAnswer } from '../data/artifacts.js';
import { radiocarbonFor } from '../data/dating.js';
import { ETHICS_SOUNDNESS_SCORE } from '../data/ethics.js';
import { ASSESSMENT_DIMENSIONS } from '../data/text.js';
import { evidenceTags, triggeredEthicsScenarios, synthesisSupport, unitLabel } from './evidence.js';

export const BANDS = {
  strong: 'Strong',
  developing: 'Developing',
  review: 'Needs review',
  notAttempted: 'Not attempted'
};

function band(ratio, attempted = true) {
  if (!attempted) return BANDS.notAttempted;
  if (ratio >= 0.8) return BANDS.strong;
  if (ratio >= 0.5) return BANDS.developing;
  return BANDS.review;
}

function fieldPreparation() {
  const selected = new Set(state.equipment.selected);
  const appropriate = EQUIPMENT_ITEMS.filter((i) => i.appropriate);
  const chosenAppropriate = appropriate.filter((i) => selected.has(i.id)).length;
  const chosenInappropriate = EQUIPMENT_ITEMS.filter((i) => !i.appropriate && selected.has(i.id));
  const justifications = Object.values(state.equipment.justifications);
  const justCorrect = justifications.filter((j) => j.correct).length;
  const retrieved = state.equipment.retrieved.length;
  const ratio = Math.max(0, (chosenAppropriate / appropriate.length)
    - (chosenInappropriate.length * 0.12)
    - (retrieved * 0.05)
    + (justifications.length ? (justCorrect / justifications.length) * 0.1 : 0));
  const notes = [];
  notes.push(`${chosenAppropriate} of ${appropriate.length} appropriate items taken.`);
  if (chosenInappropriate.length) notes.push(`Items that did not belong on the project: ${chosenInappropriate.map((i) => i.label).join(', ')}.`);
  if (retrieved) notes.push(`${retrieved} item${retrieved === 1 ? '' : 's'} had to be fetched mid-project at a cost in days.`);
  if (justifications.length) notes.push(`${justCorrect} of ${justifications.length} kit justifications were sound.`);
  return { band: band(Math.min(1, ratio), state.equipment.prepared), detail: notes.join(' ') };
}

function survey() {
  const records = Object.values(state.survey.records).filter((r) => r.classification);
  if (!records.length) return { band: BANDS.notAttempted, detail: 'No surface objects were examined.' };
  const correct = records.filter((r) => r.verdict === 'correct').length;
  const defensible = records.filter((r) => r.verdict === 'defensible').length;
  const recorded = records.filter((r) => r.recordQuality && r.recordQuality !== 'none').length;
  const concentration = Object.values(state.survey.concentration);
  const concCorrect = concentration.filter((c) => c.correct).length;
  const classifyRatio = (correct + defensible * 0.5) / records.length;
  const coverageRatio = records.length / SURVEY_ITEMS.length;
  const recordRatio = recorded / records.length;
  const concRatio = concentration.length ? concCorrect / concentration.length : 0;
  const ratio = classifyRatio * 0.4 + coverageRatio * 0.2 + recordRatio * 0.25 + concRatio * 0.15;
  const notes = [
    `${records.length} of ${SURVEY_ITEMS.length} surface objects examined.`,
    `${correct} classified correctly${defensible ? `, ${defensible} defensibly` : ''}.`,
    `${recorded} positions recorded.`
  ];
  if (concentration.length) notes.push(`${concCorrect} of ${concentration.length} concentration questions answered correctly.`);
  if (recorded < records.length) notes.push('Objects examined but not recorded cannot be cited as evidence.');
  return { band: band(ratio), detail: notes.join(' ') };
}

function excavation() {
  const opened = state.units.opened;
  if (!opened.length) return { band: BANDS.notAttempted, detail: 'No excavation unit was opened.' };
  let decisions = 0;
  let good = 0;
  let contextLoss = 0;
  opened.forEach((unitId) => {
    const prog = state.units.progress[unitId] || { levels: {} };
    contextLoss += prog.contextLoss || 0;
    Object.values(prog.levels || {}).forEach((lvl) => {
      (lvl.decisions || []).forEach((d) => {
        decisions += 1;
        if (d.correct) good += 1;
        else if (d.defensible) good += 0.5;
      });
    });
  });
  const completion = opened.reduce((acc, u) => acc + (levelsCompleted(u) / Math.max(1, levelsForUnit(u).length)), 0) / opened.length;
  const decisionRatio = decisions ? good / decisions : 0;
  const placement = state.survey.recommendation
    && state.units.opened.includes(state.survey.recommendation.unitId) ? 1 : 0.6;
  const ratio = Math.max(0, decisionRatio * 0.5 + completion * 0.3 + placement * 0.2 - contextLoss * 0.08);
  const notes = [
    `${opened.map(unitLabel).join('; ')}.`,
    `${Math.round(decisionRatio * 100)} per cent of excavation decisions were sound or defensible.`,
    `${opened.reduce((a, u) => a + levelsCompleted(u), 0)} levels completed.`
  ];
  if (contextLoss) notes.push(`Context was lost in ${contextLoss} decision${contextLoss === 1 ? '' : 's'}.`);
  return { band: band(Math.min(1, ratio)), detail: notes.join(' ') };
}

function documentation() {
  const opened = state.units.opened;
  const proveniences = [];
  opened.forEach((unitId) => {
    const prog = state.units.progress[unitId] || { levels: {} };
    Object.keys(prog.levels || {}).forEach((idx) => {
      if (prog.levels[idx].complete) proveniences.push(computeLevelProvenience(unitId, Number(idx)));
    });
  });
  const artifactQuality = state.artifacts.map((a) => a.provenience);
  const all = [...proveniences, ...artifactQuality];
  if (!all.length) return { band: BANDS.notAttempted, detail: 'Nothing has been documented yet.' };
  const score = all.reduce((acc, q) => acc + (q === 'good' ? 1 : q === 'partial' ? 0.5 : 0), 0) / all.length;
  const surveyRecorded = Object.values(state.survey.records).filter((r) => r.recordQuality && r.recordQuality !== 'none').length;
  const notes = [
    `${proveniences.filter((p) => p === 'good').length} of ${proveniences.length} completed levels documented to full provenience.`,
    `${artifactQuality.filter((q) => q === 'good').length} of ${artifactQuality.length} finds carry full provenience.`,
    `${surveyRecorded} survey positions recorded.`
  ];
  return { band: band(score), detail: notes.join(' ') };
}

function artifactAnalysis() {
  const analysed = state.artifacts.filter((a) => a.analysis);
  if (!analysed.length) {
    return {
      band: state.artifacts.length ? BANDS.review : BANDS.notAttempted,
      detail: state.artifacts.length
        ? `${state.artifacts.length} finds were recovered but none were analysed.`
        : 'No finds were recovered.'
    };
  }
  let total = 0;
  let score = 0;
  analysed.forEach((a) => {
    Object.entries(a.analysis.answers || {}).forEach(([fieldId, answer]) => {
      if (fieldId === 'confidence') return;
      const answers = Array.isArray(answer) ? answer : [answer];
      answers.forEach((ans) => {
        const { verdict } = scoreAnalysisAnswer(a.artifactId, fieldId, ans);
        total += 1;
        if (verdict === 'correct') score += 1;
        else if (verdict === 'defensible') score += 0.6;
      });
    });
  });
  const coverage = analysed.length / state.artifacts.length;
  const ratio = total ? (score / total) * 0.75 + coverage * 0.25 : 0;
  return {
    band: band(ratio),
    detail: `${analysed.length} of ${state.artifacts.length} finds analysed. ${Math.round((total ? score / total : 0) * 100)} per cent of analytical judgements were sound or defensible.`
  };
}

function chronology() {
  const samples = state.samples;
  const conclusions = Object.keys(state.dating.conclusions).length;
  if (!samples.length && !conclusions) {
    return { band: BANDS.notAttempted, detail: 'No dating evidence was collected and no chronological conclusions were recorded.' };
  }
  const clean = samples.filter((s) => s.quality === 'clean').length;
  let reliabilityScore = 0;
  let reliabilityTotal = 0;
  samples.forEach((s) => {
    const result = radiocarbonFor(s.key, s.quality);
    if (!result) return;
    const judged = state.dating.reliability[s.key];
    if (!judged) return;
    reliabilityTotal += 1;
    const shouldTrust = result.reliable;
    if ((judged === 'reliable') === shouldTrust) reliabilityScore += 1;
  });
  const methodSort = Object.values(state.dating.methodSort);
  const methodCorrect = methodSort.filter((m) => m.correct).length;
  const conclusionScores = Object.values(state.dating.conclusions).map((c) => {
    if (Array.isArray(c)) {
      const good = c.filter((x) => x.verdict === 'best').length;
      const bad = c.filter((x) => x.verdict === 'poor').length;
      return Math.max(0, (good - bad) / Math.max(1, c.length));
    }
    return c && c.verdict === 'best' ? 1 : (c && c.verdict === 'conditional' ? 0.7 : 0);
  });
  const conclusionRatio = conclusionScores.length
    ? conclusionScores.reduce((a, b) => a + b, 0) / conclusionScores.length : 0;
  const sampleRatio = samples.length ? clean / samples.length : 0;
  const reliabilityRatio = reliabilityTotal ? reliabilityScore / reliabilityTotal : 0;
  const methodRatio = methodSort.length ? methodCorrect / methodSort.length : 0;
  const ratio = sampleRatio * 0.25 + reliabilityRatio * 0.25 + methodRatio * 0.2 + conclusionRatio * 0.3;
  const notes = [
    `${samples.length} dating sample${samples.length === 1 ? '' : 's'} collected, ${clean} of them uncontaminated.`,
    methodSort.length ? `${methodCorrect} of ${methodSort.length} methods correctly sorted as absolute or relative.` : null,
    `${conclusions} chronological conclusion${conclusions === 1 ? '' : 's'} recorded.`
  ].filter(Boolean);
  return { band: band(ratio, samples.length > 0 || conclusions > 0), detail: notes.join(' ') };
}

function featureInterpretation() {
  if (!state.features.length) {
    return { band: BANDS.notAttempted, detail: 'No features were exposed by the units excavated.' };
  }
  let observationScore = 0;
  let observationTotal = 0;
  let interpretationScore = 0;
  let alternatives = 0;
  state.features.forEach((f) => {
    const def = featureById(f.featureId);
    if (!def) return;
    Object.entries(f.observations || {}).forEach(([fieldId, value]) => {
      const field = def.observations[fieldId];
      if (!field) return;
      observationTotal += 1;
      if (field.multi) {
        const expected = new Set(field.options.filter((o) => o.correct).map((o) => o.id));
        const chosen = new Set(Array.isArray(value) ? value : []);
        const hits = [...expected].filter((id) => chosen.has(id)).length;
        const falsePositives = [...chosen].filter((id) => !expected.has(id)).length;
        observationScore += Math.max(0, (hits - falsePositives) / Math.max(1, expected.size));
      } else if (field.correct === value) {
        observationScore += 1;
      }
    });
    const interp = def.interpretations.find((i) => i.id === f.interpretation);
    if (interp) interpretationScore += interp.verdict === 'best' ? 1 : (interp.verdict === 'defensible' ? 0.6 : 0);
    if (f.alternative && f.alternative !== f.interpretation) alternatives += 1;
  });
  const completeRatio = state.features.filter((f) => f.complete).length / state.features.length;
  const obsRatio = observationTotal ? observationScore / observationTotal : 0;
  const interpRatio = interpretationScore / state.features.length;
  const altRatio = alternatives / state.features.length;
  const ratio = obsRatio * 0.3 + interpRatio * 0.35 + completeRatio * 0.2 + altRatio * 0.15;
  return {
    band: band(ratio),
    detail: `${state.features.filter((f) => f.complete).length} of ${state.features.length} feature records completed. ${Math.round(interpRatio * 100)} per cent of interpretations were well supported, and ${alternatives} named an alternative reading.`
  };
}

function ethics() {
  const triggered = triggeredEthicsScenarios();
  const decisions = Object.entries(state.ethics.decisions);
  if (!decisions.length) {
    return { band: BANDS.notAttempted, detail: 'No professional decisions have been resolved yet.' };
  }
  const score = decisions.reduce((acc, [, d]) => acc + (ETHICS_SOUNDNESS_SCORE[d.soundness] || 0), 0);
  const coverage = decisions.length / Math.max(1, triggered.length);
  const ratio = (score / decisions.length) * 0.75 + coverage * 0.25;
  const sound = decisions.filter(([, d]) => d.soundness === 'sound').length;
  const partial = decisions.filter(([, d]) => d.soundness === 'partial').length;
  return {
    band: band(ratio),
    detail: `${decisions.length} of ${triggered.length} situations resolved: ${sound} handled soundly, ${partial} partially, ${decisions.length - sound - partial} needing review.`
  };
}

function evidenceSynthesis() {
  const selections = [];
  Object.entries(state.synthesis.selections).forEach(([domainId, statements]) => {
    Object.entries(statements).forEach(([statementId, payload]) => selections.push({ domainId, statementId, ...payload }));
  });
  const answered = Object.keys(state.report.answers).length;
  if (!selections.length && !answered) {
    return { band: BANDS.notAttempted, detail: 'No synthesis conclusions or report answers have been recorded.' };
  }
  const supported = selections.filter((s) => s.support === 'supported').length;
  const speculative = selections.filter((s) => s.support !== 'supported').length;
  const flaggedSpeculative = selections.filter((s) => s.support !== 'supported' && s.acknowledgedSpeculative).length;
  const domains = new Set(selections.map((s) => s.domainId)).size;
  const reportAnswers = Object.values(state.report.answers);
  const cited = reportAnswers.filter((a) => a.evidence && a.evidence.length).length;
  const reasoned = reportAnswers.filter((a) => a.reasoning && a.reasoning.trim().length >= 40).length;
  const supportRatio = selections.length ? (supported + flaggedSpeculative * 0.5) / selections.length : 0;
  const domainRatio = Math.min(1, domains / 6);
  const reportRatio = reportAnswers.length ? (cited / reportAnswers.length) * 0.5 + (reasoned / reportAnswers.length) * 0.5 : 0;
  const ratio = supportRatio * 0.4 + domainRatio * 0.2 + reportRatio * 0.4;
  const notes = [
    `${selections.length} conclusions recorded across ${domains} area${domains === 1 ? '' : 's'}, ${supported} of them fully supported by the recovered evidence.`,
    speculative ? `${speculative} were recorded as speculative${flaggedSpeculative ? `, ${flaggedSpeculative} with the limitation acknowledged` : ''}.` : null,
    reportAnswers.length ? `${cited} of ${reportAnswers.length} report conclusions cite evidence and ${reasoned} give substantive reasoning.` : 'The final report has not been submitted.'
  ].filter(Boolean);
  return { band: band(ratio), detail: notes.join(' ') };
}

const CALCULATORS = {
  fieldPreparation,
  survey,
  excavation,
  documentation,
  artifactAnalysis,
  chronology,
  featureInterpretation,
  ethics,
  evidenceSynthesis
};

export function assessmentProfile() {
  return ASSESSMENT_DIMENSIONS.map((dim) => {
    const result = CALCULATORS[dim.id]();
    return { id: dim.id, label: dim.label, band: result.band, detail: result.detail };
  });
}

export function investigationSummary() {
  const tags = evidenceTags();
  const support = synthesisSupport();
  const supportedAvailable = support.reduce((acc, d) => acc + d.statements.filter((s) => s.support === 'supported').length, 0);
  return {
    studentName: state.studentName || 'Unnamed investigator',
    daysUsed: daysUsed(),
    daysRemaining: state.daysRemaining,
    daysOverrun: state.daysOverrun || 0,
    unitsOpened: state.units.opened.length,
    artifacts: state.artifacts.length,
    artifactsAnalysed: state.artifacts.filter((a) => a.analysis).length,
    features: state.features.length,
    featuresComplete: state.features.filter((f) => f.complete).length,
    samples: state.samples.length,
    missed: state.missed.length,
    ethicsResolved: Object.keys(state.ethics.decisions).length,
    evidenceTagCount: tags.size,
    supportedConclusionsAvailable: supportedAvailable,
    reportSubmitted: state.report.submitted
  };
}
