/* Helpers that drive an investigation forward purely through the state and
   engine modules, so a whole playthrough can be asserted without any DOM. */

import {
  state, replaceState, createInitialState, prepareKit, toggleEquipment,
  recordSurveyClassification, recordSurveyPosition, recordConcentrationAnswer,
  setUnitRecommendation, openUnit, completeLevel, advanceStep, recordAnalysis,
  updateFeature, recordEthicsDecision, setDatingReliability, setDatingConclusion,
  setSynthesisSelection, setReportAnswer, setReportOpen, submitReport
} from '../src/core/state.js';
import { applyStepChoice, resolveLevel } from '../src/core/excavationEngine.js';
import { EQUIPMENT_ITEMS } from '../src/data/equipment.js';
import { SURVEY_ITEMS, CONCENTRATION_QUESTIONS } from '../src/data/survey.js';
import { levelsForUnit } from '../src/data/excavation.js';
import { ARTIFACTS } from '../src/data/artifacts.js';
import { FEATURES } from '../src/data/features.js';
import { ETHICS_SCENARIOS } from '../src/data/ethics.js';
import { SYNTHESIS_DOMAINS, evaluateStatement } from '../src/data/synthesis.js';
import { REPORT_QUESTIONS, REPORT_OPEN_FIELDS } from '../src/data/text.js';
import { evidenceTags, citableEvidence, applicableDatingQuestions, triggeredEthicsScenarios } from '../src/core/evidence.js';

export function reset(name = 'Test Investigator') {
  replaceState(createInitialState());
  state.studentName = name;
  return state;
}

export function takeFullKit() {
  EQUIPMENT_ITEMS.filter((i) => i.appropriate).forEach((i) => toggleEquipment(i.id));
  prepareKit();
}

export function takeMinimalKit() {
  ['trowel', 'shovel', 'buckets', 'pencils'].forEach((id) => toggleEquipment(id));
  prepareKit();
}

export function surveyEverythingWell() {
  SURVEY_ITEMS.forEach((item) => {
    recordSurveyClassification(item.id, item.truth, 'correct');
    recordSurveyPosition(item.id, 'instrument', 'precise');
  });
  CONCENTRATION_QUESTIONS.forEach((q) => {
    const correct = q.options.find((o) => o.correct);
    recordConcentrationAnswer(q.id, correct.id, true);
  });
}

export function surveyPoorly(count = 8) {
  SURVEY_ITEMS.slice(0, count).forEach((item) => {
    const wrong = item.truth === 'natural' ? 'artifact' : 'natural';
    recordSurveyClassification(item.id, wrong, 'incorrect');
    recordSurveyPosition(item.id, 'none', 'none');
  });
  CONCENTRATION_QUESTIONS.forEach((q) => {
    const wrong = q.options.find((o) => !o.correct);
    recordConcentrationAnswer(q.id, wrong.id, false);
  });
}

/* Chooses an option for every step of every level of a unit.
   `pick` is 'best' or 'worst'. */
export function excavateUnit(unitId, pick = 'best', costDays = 4) {
  setUnitRecommendation(unitId, 'strong');
  openUnit(unitId, costDays, `Opened ${unitId}`);
  const levels = levelsForUnit(unitId);
  levels.forEach((level, levelIndex) => {
    level.steps.forEach((step) => {
      const option = chooseOption(step, pick);
      applyStepChoice(unitId, levelIndex, step, option);
      advanceStep(unitId);
    });
    resolveLevel(unitId, levelIndex);
    completeLevel(unitId, levelIndex);
  });
}

export function chooseOption(step, pick) {
  const options = step.options;
  if (pick === 'best') {
    // Among the defensible options, take the most capable one, which is the
    // one demanding the most from the kit. That is what a strong-practice
    // playthrough with a complete kit would actually do.
    const correct = options.filter((o) => o.correct);
    if (!correct.length) return options[0];
    return correct.reduce((best, option) => (
      (option.requires || []).length > (best.requires || []).length ? option : best
    ), correct[0]);
  }
  return options.find((o) => !o.correct && !o.defensible) || options[options.length - 1];
}

/* Chooses the strongest option that the current kit can actually perform. */
export function excavateUnitWithinKit(unitId, hasCapabilityFn, costDays = 4) {
  setUnitRecommendation(unitId, 'strong');
  openUnit(unitId, costDays, `Opened ${unitId}`);
  levelsForUnit(unitId).forEach((level, levelIndex) => {
    level.steps.forEach((step) => {
      const usable = step.options.filter((o) => (o.requires || []).every(hasCapabilityFn));
      const option = usable.find((o) => o.correct) || usable[0] || step.options[step.options.length - 1];
      applyStepChoice(unitId, levelIndex, step, option);
      advanceStep(unitId);
    });
    resolveLevel(unitId, levelIndex);
    completeLevel(unitId, levelIndex);
  });
}

export function analyseAllFinds(quality = 'best') {
  state.artifacts.forEach((artifact) => {
    const def = ARTIFACTS[artifact.artifactId];
    if (!def) return;
    const answers = { confidence: 'probable' };
    Object.entries(def.fields).forEach(([fieldId, spec]) => {
      let chosen;
      if (quality === 'best') {
        chosen = spec.correct || (spec.options.find((o) => o.best) || spec.options[0]).id;
      } else {
        const bad = spec.options.find((o) => o.id !== spec.correct && !o.best && !o.defensible);
        chosen = (bad || spec.options[spec.options.length - 1]).id;
      }
      answers[fieldId] = spec.multi ? [chosen] : chosen;
    });
    recordAnalysis(artifact.uid, answers, {});
  });
}

export function completeAllFeatures(quality = 'best') {
  state.features.forEach((rec) => {
    const def = FEATURES[rec.featureId];
    if (!def) return;
    const observations = {};
    Object.entries(def.observations).forEach(([fieldId, field]) => {
      if (field.multi) {
        observations[fieldId] = quality === 'best'
          ? field.options.filter((o) => o.correct).map((o) => o.id)
          : field.options.filter((o) => !o.correct).map((o) => o.id);
      } else {
        observations[fieldId] = quality === 'best'
          ? field.correct
          : (field.options.find((o) => o.id !== field.correct) || field.options[0]).id;
      }
    });
    const best = def.interpretations.find((i) => i.verdict === 'best');
    const poor = def.interpretations.find((i) => i.verdict === 'poor') || def.interpretations[def.interpretations.length - 1];
    const primary = quality === 'best' ? best : poor;
    const alternative = def.interpretations.find((i) => i.id !== primary.id);
    updateFeature(rec.featureId, {
      observations,
      photographed: true,
      drawn: true,
      interpretation: primary.id,
      alternative: alternative.id,
      confidence: quality === 'best' ? 'probable' : 'strong',
      complete: true
    });
  });
}

export function completeChronology(quality = 'best') {
  state.samples.forEach((sample) => {
    const trustworthy = sample.quality === 'clean';
    const judgement = quality === 'best'
      ? (trustworthy ? 'reliable' : 'unreliable')
      : (trustworthy ? 'unreliable' : 'reliable');
    setDatingReliability(sample.key, judgement);
  });
  applicableDatingQuestions().forEach((question) => {
    if (question.kind === 'sampleReliability') return;
    const available = question.options.filter((o) => optionAllowed(o));
    if (question.multi) {
      const chosen = quality === 'best'
        ? available.filter((o) => o.verdict === 'best')
        : available.filter((o) => o.verdict === 'poor');
      setDatingConclusion(question.id, (chosen.length ? chosen : [available[0]]).map((o) => ({ optionId: o.id, verdict: o.verdict })));
      return;
    }
    const chosen = quality === 'best'
      ? (available.find((o) => o.verdict === 'best') || available[0])
      : (available.find((o) => o.verdict === 'poor') || available[available.length - 1]);
    setDatingConclusion(question.id, { optionId: chosen.id, verdict: chosen.verdict });
  });
}

function optionAllowed(option) {
  const req = option.requires;
  if (!req) return true;
  if (req.context && !state.samples.some((s) => s.key === req.context)) return false;
  if (req.contaminatedSample && !state.samples.some((s) => s.quality !== 'clean')) return false;
  if (req.historicArtifact && !state.artifacts.some((a) => ['ar_nail_cut', 'ar_glass'].includes(a.artifactId))) return false;
  return true;
}

export function completeSynthesis(quality = 'best') {
  const tags = evidenceTags();
  let recorded = 0;
  SYNTHESIS_DOMAINS.forEach((domain) => {
    domain.statements.forEach((statement) => {
      const support = evaluateStatement(statement, tags);
      if (quality === 'best' && support !== 'supported') return;
      if (quality === 'worst' && support === 'supported') return;
      setSynthesisSelection(domain.id, statement.id, {
        support,
        acknowledgedSpeculative: quality === 'best',
        atISO: new Date().toISOString()
      });
      recorded += 1;
    });
  });
  return recorded;
}

export function resolveAllEthics(soundness = 'sound') {
  triggeredEthicsScenarios().forEach((scenario) => {
    const choice = scenario.choices.find((c) => c.sound === soundness) || scenario.choices[0];
    recordEthicsDecision(scenario.id, choice.id, choice.sound);
  });
}

export function writeReport(quality = 'best') {
  const evidence = citableEvidence();
  REPORT_QUESTIONS.forEach((q) => {
    setReportAnswer(q.id, {
      claim: quality === 'best'
        ? `A worked answer to question ${q.number} based on the recovered evidence.`
        : 'x',
      evidence: quality === 'best' ? evidence.slice(0, Math.max(q.minEvidence, 2)).map((e) => e.id) : [],
      confidence: quality === 'best' ? 'probable' : null,
      reasoning: quality === 'best'
        ? 'The cited records were produced during this investigation, they are consistent with one another, and the conclusion follows from them without needing anything that was not recovered.'
        : 'x'
    });
  });
  REPORT_OPEN_FIELDS.forEach((f) => {
    setReportOpen(f.id, quality === 'best'
      ? 'Several contexts were never reached and one recovery method was not used, so parts of the assemblage are missing rather than absent.'
      : 'x');
  });
  if (quality === 'best') submitReport();
}

export { state };
