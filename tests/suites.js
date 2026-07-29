/* The test suites. Everything here exercises pure logic: state transitions,
   day costs, station gating, evidence availability, unit-specific paths,
   duplicate protection, save migration, report requirements, the assessment
   profile, and interaction targeting that does not depend on XR. */

import { suite } from './harness.js';
import * as sim from './simulate.js';
import {
  state, createInitialState, replaceState, STATE_VERSION, awardOnce, hasAwarded,
  spendDays, spendDaysOnce, daysUsed, toggleEquipment, prepareKit, hasCapability,
  openUnit, addArtifact, addFeature, addSample, addMissed, recordSurveyClassification,
  recordSurveyPosition, retrieveEquipment, computeLevelProvenience, levelRecord,
  completeLevel, recordEthicsDecision, setStation
} from '../src/core/state.js';
import { migrate, normalise } from '../src/core/save.js';
import { applyStepChoice, resolveLevel, findAvailability } from '../src/core/excavationEngine.js';
import {
  citableEvidence, evidenceTags, reportRequirements, reportAnswerStatus,
  stationStatus, currentObjective, surveyReadyForPlacement, excavationComplete,
  laboratoryComplete, chronologyComplete, featuresComplete, synthesisComplete,
  ethicsComplete, triggeredEthicsScenarios, availableTypologyLines, allEvidence
} from '../src/core/evidence.js';
import { assessmentProfile, BANDS, investigationSummary } from '../src/core/assessment.js';
import { toCSV, toXAPI, record, recordOnce, startSession } from '../src/core/telemetry.js';
import { resolveTarget, targetFromCamera, targetFromScreenPoint } from '../src/player/interaction.js';
import { levelsForUnit, potentialFinds, UNIT_LEVELS } from '../src/data/excavation.js';
import { SURVEY_ITEMS } from '../src/data/survey.js';
import { EQUIPMENT_ITEMS } from '../src/data/equipment.js';
import { ARTIFACTS, scoreAnalysisAnswer } from '../src/data/artifacts.js';
import { FEATURES } from '../src/data/features.js';
import { SYNTHESIS_DOMAINS, evaluateStatement } from '../src/data/synthesis.js';
import { RADIOCARBON_RESULTS, radiocarbonFor } from '../src/data/dating.js';
import { SITE, UNITS } from '../src/data/site.js';
import { isTeleportTargetValid } from '../src/xr/session.js';
import { addTeleportExclusion, addCollisionBox, removeCollisionBox, removeTeleportExclusion } from '../src/scene/registry.js';
import { createGateController } from '../src/ui/startGate.js';

/* ------------------------------------------------------------------ */

suite('State: initial shape and day accounting', (t) => {
  sim.reset();
  t.test('starts with the full project schedule', () => {
    t.equal(state.daysRemaining, SITE.totalDays);
    t.equal(daysUsed(), 0);
  });
  t.test('spending days reduces the remaining schedule and logs it', () => {
    spendDays('Test cost', 3);
    t.equal(state.daysRemaining, SITE.totalDays - 3);
    t.equal(state.dayLog.length, 1);
    t.equal(daysUsed(), 3);
  });
  t.test('days cannot go below zero', () => {
    spendDays('Huge cost', 999);
    t.equal(state.daysRemaining, 0);
  });
  t.test('a zero or negative cost changes nothing', () => {
    sim.reset();
    spendDays('No cost', 0);
    t.equal(state.daysRemaining, SITE.totalDays);
    t.equal(state.dayLog.length, 0);
  });
});

suite('State: duplicate protection', (t) => {
  sim.reset();
  t.test('awardOnce runs a keyed effect exactly once', () => {
    let count = 0;
    awardOnce('k1', () => { count += 1; });
    awardOnce('k1', () => { count += 1; });
    t.equal(count, 1);
    t.assert(hasAwarded('k1'));
  });
  t.test('spendDaysOnce cannot charge the same cost twice', () => {
    const before = state.daysRemaining;
    spendDaysOnce('unitOpen:test', 'Opened a unit', 4);
    spendDaysOnce('unitOpen:test', 'Opened a unit', 4);
    t.equal(state.daysRemaining, before - 4);
  });
  t.test('artifacts cannot be granted twice for the same context', () => {
    const first = addArtifact({ artifactId: 'ar_sherd_cordmarked', unit: 'unitA', level: 2, provenience: 'good' });
    const second = addArtifact({ artifactId: 'ar_sherd_cordmarked', unit: 'unitA', level: 2, provenience: 'good' });
    t.assert(first !== null, 'first grant should succeed');
    t.equal(second, null, 'second grant should be refused');
    t.equal(state.artifacts.length, 1);
  });
  t.test('features, samples and misses are all keyed', () => {
    t.assert(addFeature('ft_hearth', 'unitA', 2, 'good') !== null);
    t.equal(addFeature('ft_hearth', 'unitA', 2, 'good'), null);
    t.assert(addSample({ unit: 'unitA', level: 3, quality: 'clean' }) !== null);
    t.equal(addSample({ unit: 'unitA', level: 3, quality: 'clean' }), null);
    t.assert(addMissed({ artifactId: 'ar_shell_bead', unit: 'unitA', level: 2, reason: 'x' }) !== null);
    t.equal(addMissed({ artifactId: 'ar_shell_bead', unit: 'unitA', level: 2, reason: 'x' }), null);
  });
  t.test('resolving the same level twice does not duplicate finds', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    const before = state.artifacts.length;
    resolveLevel('unitA', 1);
    resolveLevel('unitA', 1);
    t.equal(state.artifacts.length, before);
  });
});

suite('Equipment: capabilities and consequences', (t) => {
  sim.reset();
  t.test('an empty kit grants no capabilities', () => {
    t.equal(hasCapability('screening'), false);
    t.equal(hasCapability('photograph'), false);
  });
  t.test('taking an item grants its capability', () => {
    toggleEquipment('screen');
    t.equal(hasCapability('screening'), true);
    toggleEquipment('screen');
    t.equal(hasCapability('screening'), false);
  });
  t.test('retrieving an item mid-project costs a day and is recorded', () => {
    sim.reset();
    prepareKit();
    const before = state.daysRemaining;
    retrieveEquipment('camera', 1);
    t.equal(state.daysRemaining, before - 1);
    t.includes(state.equipment.retrieved, 'camera');
    t.equal(hasCapability('photograph'), true);
  });
  t.test('retrieving something already carried does nothing', () => {
    const before = state.daysRemaining;
    t.equal(retrieveEquipment('camera', 1), false);
    t.equal(state.daysRemaining, before);
  });
});

suite('Survey: recording controls whether evidence can be cited', (t) => {
  sim.reset();
  sim.takeFullKit();
  t.test('an unrecorded classification is not citable', () => {
    recordSurveyClassification('sv_biface', 'artifact', 'correct');
    recordSurveyPosition('sv_biface', 'none', 'none');
    const record = citableEvidence().find((e) => e.id === 'sv:sv_biface');
    t.equal(record, undefined, 'unrecorded finds must not be citable');
  });
  t.test('a recorded classification is citable and carries its tags', () => {
    recordSurveyPosition('sv_biface', 'instrument', 'precise');
    const record = citableEvidence().find((e) => e.id === 'sv:sv_biface');
    t.assert(record, 'recorded finds should be citable');
    t.includes([...evidenceTags()], 'lithic');
  });
  t.test('an incorrectly classified find contributes no tags', () => {
    sim.reset();
    recordSurveyClassification('sv_cobble', 'artifact', 'incorrect');
    recordSurveyPosition('sv_cobble', 'instrument', 'precise');
    const tags = [...evidenceTags()];
    t.equal(tags.length, 0);
  });
  t.test('unit C stays locked until the depression and alignment are recorded', () => {
    sim.reset();
    t.equal(UNITS.unitC.requires.every((r) => state.survey.mapped.includes(r)), false);
    recordSurveyClassification('sv_depression', 'featureIndicator', 'correct');
    recordSurveyPosition('sv_depression', 'instrument', 'precise');
    t.equal(UNITS.unitC.requires.every((r) => state.survey.mapped.includes(r)), false);
    recordSurveyClassification('sv_alignment', 'featureIndicator', 'correct');
    recordSurveyPosition('sv_alignment', 'instrument', 'precise');
    t.equal(UNITS.unitC.requires.every((r) => state.survey.mapped.includes(r)), true);
  });
});

suite('Excavation: recovery rules', (t) => {
  t.test('screen-only finds are lost without screening', () => {
    const doc = { screened: false, floated: false };
    const result = findAvailability({ artifact: 'ar_shell_bead', requires: 'screen' }, doc, new Set());
    t.equal(result.available, false);
  });
  t.test('screen-only finds are recovered with screening', () => {
    const result = findAvailability({ artifact: 'ar_shell_bead', requires: 'screen' }, { screened: true }, new Set());
    t.equal(result.available, true);
  });
  t.test('flotation-only finds need a flotation sample', () => {
    t.equal(findAvailability({ artifact: 'ar_charred_plant', requires: 'flotation' }, { screened: true }, new Set()).available, false);
    t.equal(findAvailability({ artifact: 'ar_charred_plant', requires: 'flotation' }, { screened: true, floated: true }, new Set()).available, true);
  });
  t.test('a find destroyed by the removal method stays lost even if screened', () => {
    const lost = new Set(['ar_point_triangular']);
    t.equal(findAvailability({ artifact: 'ar_point_triangular' }, { screened: true, floated: true }, lost).available, false);
  });

  t.test('a strong Unit A pass recovers the screen and flotation material', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    const ids = state.artifacts.map((a) => a.artifactId);
    t.includes(ids, 'ar_shell_bead');
    t.includes(ids, 'ar_charred_plant');
    t.includes(ids, 'ar_sherd_cordmarked');
    t.equal(state.missed.length, 0);
  });

  t.test('a poor Unit A pass loses the small and light material', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'worst');
    const ids = state.artifacts.map((a) => a.artifactId);
    t.notIncludes(ids, 'ar_shell_bead');
    t.notIncludes(ids, 'ar_charred_plant');
    t.assert(state.missed.length > 0, 'poor practice should produce recorded losses');
  });

  t.test('provenience reflects the documentation actually done', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    t.equal(computeLevelProvenience('unitA', 1), 'good');
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'worst');
    t.equal(computeLevelProvenience('unitA', 1), 'poor');
  });

  t.test('a level with no depth step is not penalised for lacking one', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    const level1 = levelsForUnit('unitA')[0];
    t.equal(level1.steps.some((s) => s.kind === 'record'), false, 'level 1 has no depth step');
    t.equal(computeLevelProvenience('unitA', 0), 'good');
  });
});

suite('Excavation: unit paths differ but agree', (t) => {
  t.test('each unit offers a distinct assemblage', () => {
    const a = potentialFinds('unitA');
    const b = potentialFinds('unitB');
    const c = potentialFinds('unitC');
    t.includes(a, 'ar_shell_bead');
    t.notIncludes(b, 'ar_shell_bead');
    t.includes(b, 'ar_point_stemmed');
    t.notIncludes(a, 'ar_point_stemmed');
    t.includes(c, 'ar_bone_awl');
    t.notIncludes(a, 'ar_bone_awl');
  });
  t.test('the shared later occupation appears in more than one unit', () => {
    t.includes(potentialFinds('unitA'), 'ar_sherd_cordmarked');
    t.includes(potentialFinds('unitB'), 'ar_sherd_cordmarked');
  });
  t.test('Unit D is genuinely negative', () => {
    t.equal(potentialFinds('unitD').length, 0);
  });
  t.test('only Unit B reaches the deep buried horizon', () => {
    const deepContexts = Object.keys(RADIOCARBON_RESULTS).filter((k) => k === 'unitB-L4');
    t.equal(deepContexts.length, 1);
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitB', 'best');
    t.assert(state.samples.some((s) => s.key === 'unitB-L4'), 'the deep sample should be collected');
    t.includes([...evidenceTags()], 'archaic');
  });
  t.test('the Unit A path never produces the Archaic component', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    sim.analyseAllFinds('best');
    t.notIncludes([...evidenceTags()], 'archaic');
  });
});

suite('Dating: results depend on the sample actually collected', (t) => {
  t.test('a kit without clean containers can only produce a contaminated sample', () => {
    sim.reset();
    sim.takeMinimalKit();
    sim.surveyEverythingWell();
    sim.excavateUnitWithinKit('unitA', hasCapability);
    const sample = state.samples.find((s) => s.key === 'unitA-L3');
    t.assert(sample, 'the learner can still scoop charcoal without proper containers');
    t.equal(sample.quality, 'contaminated');
    t.equal(radiocarbonFor(sample.key, sample.quality).reliable, false);
  });
  t.test('a level that is never excavated produces no dating evidence at all', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitD', 'best');
    t.equal(state.samples.length, 0);
    t.equal(availableTypologyLines().length, 0);
  });
  t.test('a clean sample yields a reliable date, a contaminated one does not', () => {
    const clean = radiocarbonFor('unitA-L3', 'clean');
    const dirty = radiocarbonFor('unitA-L3', 'contaminated');
    t.equal(clean.reliable, true);
    t.equal(dirty.reliable, false);
    t.assert(dirty.calibrated !== clean.calibrated);
  });
  t.test('typology lines only appear once the artifact is analysed', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitB', 'best');
    t.equal(availableTypologyLines().length, 0, 'no analysis, no typology');
    sim.analyseAllFinds('best');
    t.assert(availableTypologyLines().length > 0);
  });
});

suite('Gating: stations unlock in a defensible order', (t) => {
  t.test('nothing is complete at the start', () => {
    sim.reset();
    const rows = stationStatus();
    t.equal(rows.filter((r) => r.done).length, 0);
    t.equal(currentObjective().action, 'openEquipment');
  });
  t.test('the survey gate needs coverage and the concentration questions', () => {
    sim.reset();
    sim.takeFullKit();
    t.equal(surveyReadyForPlacement(), false);
    sim.surveyEverythingWell();
    t.equal(surveyReadyForPlacement(), true);
  });
  t.test('the report is blocked until every station is finished', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    t.assert(reportRequirements().length > 0);
    sim.excavateUnit('unitA', 'best');
    t.equal(excavationComplete(), true);
    t.assert(reportRequirements().length > 0, 'the laboratory is still outstanding');
    sim.analyseAllFinds('best');
    t.equal(laboratoryComplete(), true);
    sim.completeAllFeatures('best');
    t.equal(featuresComplete(), true);
    sim.completeChronology('best');
    t.equal(chronologyComplete(), true);
    sim.completeSynthesis('best');
    t.equal(synthesisComplete(), true);
    sim.resolveAllEthics('sound');
    t.equal(ethicsComplete(), true);
    t.deepEqual(reportRequirements(), [], 'all requirements should now be met');
  });
  t.test('the objective always names something that can be done', () => {
    sim.reset();
    const seen = new Set();
    const guard = 40;
    let steps = 0;
    const advance = [
      () => { sim.takeFullKit(); },
      () => { sim.surveyEverythingWell(); },
      () => { sim.excavateUnit('unitA', 'best'); },
      () => { sim.completeAllFeatures('best'); },
      () => { sim.analyseAllFinds('best'); },
      () => { sim.completeChronology('best'); },
      () => { sim.resolveAllEthics('sound'); },
      () => { sim.completeSynthesis('best'); },
      () => { sim.writeReport('best'); }
    ];
    advance.forEach((fn) => {
      const objective = currentObjective();
      t.assert(objective && objective.action, 'an objective must always exist');
      seen.add(objective.action);
      fn();
      steps += 1;
      t.assert(steps < guard);
    });
    t.assert(seen.size >= 7, 'the objective should move through the stations');
  });
});

suite('Schedule: the three weeks are a real constraint', (t) => {
  t.test('a strong single-unit investigation fits inside the schedule', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    sim.analyseAllFinds('best');
    sim.completeAllFeatures('best');
    sim.completeChronology('best');
    sim.completeSynthesis('best');
    sim.resolveAllEthics('sound');
    sim.writeReport('best');
    t.equal(state.daysOverrun, 0, `the schedule should hold, ${daysUsed()} days used`);
    t.assert(daysUsed() > 12, 'the work should cost most of the schedule');
    t.assert(state.daysRemaining >= 0);
  });
  t.test('opening a second unit after a full first one exceeds the schedule', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    sim.excavateUnit('unitB', 'best');
    t.assert(state.daysRemaining === 0 || state.daysOverrun > 0,
      'two full units cannot both fit in three weeks');
  });
  t.test('overrunning the schedule does not block the investigation', () => {
    sim.reset();
    sim.takeFullKit();
    spendDays('A very expensive mistake', 40);
    t.equal(state.daysRemaining, 0);
    t.assert(state.daysOverrun > 0);
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    sim.analyseAllFinds('best');
    sim.completeAllFeatures('best');
    sim.completeChronology('best');
    sim.completeSynthesis('best');
    sim.resolveAllEthics('sound');
    sim.writeReport('best');
    t.equal(state.report.submitted, true, 'an overrun must never be a dead end');
    t.deepEqual(reportAnswerStatus(), []);
  });
  t.test('a wasted unit costs time that a later unit cannot recover', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitD', 'best');
    const afterWaste = state.daysRemaining;
    t.assert(afterWaste < SITE.totalDays - 6, 'an off-site unit still consumes the schedule');
    t.equal(state.artifacts.length, 0);
  });
});

suite('Synthesis: support is decided by the evidence set', (t) => {
  t.test('a maize-dependent economy is never supported', () => {
    const statement = SYNTHESIS_DOMAINS.find((d) => d.id === 'agriculture').statements.find((s) => s.id === 'ag_farming');
    t.equal(evaluateStatement(statement, new Set(['agriculture', 'botanical', 'structure', 'midden'])), 'overreach');
  });
  t.test('a broad diet needs two independent food classes', () => {
    const statement = SYNTHESIS_DOMAINS.find((d) => d.id === 'diet').statements.find((s) => s.id === 'diet_broad');
    t.equal(evaluateStatement(statement, new Set(['diet', 'bone'])), 'unsupported');
    t.equal(evaluateStatement(statement, new Set(['diet', 'bone', 'shell'])), 'supported');
  });
  t.test('absence statements are supported only when the evidence really is absent', () => {
    const statement = SYNTHESIS_DOMAINS.find((d) => d.id === 'seasonality').statements.find((s) => s.id === 'seas_unknown');
    t.equal(evaluateStatement(statement, new Set()), 'supported');
    t.equal(evaluateStatement(statement, new Set(['botanical'])), 'unsupported');
  });
  t.test('a Unit B only investigation cannot support the structure conclusions', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitB', 'best');
    sim.analyseAllFinds('best');
    sim.completeAllFeatures('best');
    const tags = evidenceTags();
    const statement = SYNTHESIS_DOMAINS.find((d) => d.id === 'organisation').statements.find((s) => s.id === 'org_household');
    t.equal(evaluateStatement(statement, tags), 'unsupported');
  });
  t.test('a Unit C investigation does support the structure conclusions', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitC', 'best', 5);
    sim.analyseAllFinds('best');
    sim.completeAllFeatures('best');
    const statement = SYNTHESIS_DOMAINS.find((d) => d.id === 'organisation').statements.find((s) => s.id === 'org_household');
    t.equal(evaluateStatement(statement, evidenceTags()), 'supported');
  });
});

suite('Report: requirements and citation integrity', (t) => {
  t.test('an empty report reports every problem', () => {
    sim.reset();
    const problems = reportAnswerStatus();
    t.assert(problems.length >= 6);
  });
  t.test('a claim without evidence is rejected', () => {
    sim.reset();
    sim.writeReport('worst');
    const problems = reportAnswerStatus();
    t.assert(problems.some((p) => p.includes('cite at least')));
  });
  t.test('a complete report passes', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    sim.analyseAllFinds('best');
    sim.completeAllFeatures('best');
    sim.completeChronology('best');
    sim.completeSynthesis('best');
    sim.resolveAllEthics('sound');
    sim.writeReport('best');
    t.deepEqual(reportAnswerStatus(), []);
    t.equal(state.report.submitted, true);
  });
  t.test('every cited evidence id resolves to something that exists', () => {
    const available = new Set(allEvidence().map((e) => e.id));
    Object.values(state.report.answers).forEach((answer) => {
      (answer.evidence || []).forEach((id) => {
        t.assert(available.has(id), `cited evidence ${id} must exist in the record`);
      });
    });
  });
});

suite('Assessment: the profile reflects practice', (t) => {
  t.test('a strong playthrough scores well across the dimensions', () => {
    sim.reset();
    sim.takeFullKit();
    sim.surveyEverythingWell();
    sim.excavateUnit('unitA', 'best');
    sim.analyseAllFinds('best');
    sim.completeAllFeatures('best');
    sim.completeChronology('best');
    sim.completeSynthesis('best');
    sim.resolveAllEthics('sound');
    sim.writeReport('best');
    const profile = assessmentProfile();
    t.equal(profile.length, 9);
    const weak = profile.filter((p) => p.band === BANDS.review);
    t.equal(weak.length, 0, `no dimension should need review: ${weak.map((w) => w.label).join(', ')}`);
  });
  t.test('a poor playthrough is marked down', () => {
    sim.reset();
    sim.takeMinimalKit();
    toggleEquipment('chainsaw');
    toggleEquipment('metaldetector');
    sim.surveyPoorly();
    sim.excavateUnit('unitA', 'worst');
    sim.analyseAllFinds('worst');
    sim.completeAllFeatures('worst');
    sim.completeChronology('worst');
    sim.resolveAllEthics('unsound');
    const profile = assessmentProfile();
    const weak = profile.filter((p) => p.band === BANDS.review || p.band === BANDS.notAttempted);
    t.assert(weak.length >= 4, 'poor practice should show clearly in the profile');
    const ethics = profile.find((p) => p.id === 'ethics');
    t.equal(ethics.band, BANDS.review);
  });
  t.test('a dimension never attempted is reported as such, not as a failure', () => {
    sim.reset();
    const profile = assessmentProfile();
    t.equal(profile.find((p) => p.id === 'chronology').band, BANDS.notAttempted);
    t.equal(profile.find((p) => p.id === 'featureInterpretation').band, BANDS.notAttempted);
  });
  t.test('the summary counts only what exists', () => {
    sim.reset();
    const summary = investigationSummary();
    t.equal(summary.artifacts, 0);
    t.equal(summary.features, 0);
    t.equal(summary.reportSubmitted, false);
  });
});

suite('Save: versioning and migration', (t) => {
  t.test('a current save round-trips unchanged', () => {
    sim.reset();
    sim.takeFullKit();
    const snapshot = JSON.parse(JSON.stringify(state));
    const migrated = migrate(snapshot);
    t.equal(migrated.version, STATE_VERSION);
    t.equal(migrated.equipment.selected.length, state.equipment.selected.length);
  });
  t.test('a version 1 save from the original prototype migrates forward', () => {
    const legacy = {
      studentName: 'Prototype Student',
      daysRemaining: 12,
      equipment: { selected: ['trowel', 'camera'], justifications: { gloves: { correct: true } } },
      survey: { flagged: [{ id: 'sv1', calledEvidence: true, correct: true }, { id: 'sv2', calledEvidence: false, correct: true }] },
      chosenUnit: 'unitA',
      excavation: { levelsCompleted: 2 },
      artifacts: [{ id: 'sherd1', name: 'Pottery Sherd', provenience: 'good' }],
      features: [],
      ethics: { decisions: [{ scenario: 'visitor_collecting', sound: true }] },
      notes: ['a note from the old build'],
      finalInterpretation: { claims: [{ claim: 'An old claim', confidence: 'probable', reasoning: 'Old reasoning' }], limitations: 'Old limitations' }
    };
    const migrated = migrate(legacy);
    t.assert(migrated, 'the migration must produce a state');
    t.equal(migrated.version, STATE_VERSION);
    t.equal(migrated.studentName, 'Prototype Student');
    t.equal(migrated.daysRemaining, 12);
    t.includes(migrated.units.opened, 'unitA');
    t.assert(migrated.survey.records.sv_debitage, 'legacy survey ids map to current ids');
    t.assert(migrated.artifacts.some((a) => a.artifactId === 'ar_sherd_cordmarked'));
    t.assert(migrated.ethics.decisions.eth_visitor, 'the legacy ethics decision is carried across');
    t.equal(migrated.report.answers.activities.claim, 'An old claim');
    t.equal(migrated.legacy, undefined, 'the legacy scratch space is removed');
  });
  t.test('a save from a newer build is refused rather than corrupted', () => {
    t.equal(migrate({ version: STATE_VERSION + 5 }), null);
  });
  t.test('a partial save is normalised rather than crashing', () => {
    const partial = normalise({ version: STATE_VERSION, studentName: 'Partial' });
    t.equal(partial.daysRemaining, SITE.totalDays);
    t.assert(Array.isArray(partial.artifacts));
    t.assert(partial.settings.xr.snapAngle > 0);
  });
  t.test('awarded keys survive a save round trip, so rewards cannot repeat', () => {
    sim.reset();
    awardOnce('unitOpen:unitA', () => spendDays('Opened Unit A', 4));
    const snapshot = JSON.parse(JSON.stringify(state));
    const restored = migrate(snapshot);
    replaceState(restored);
    const before = state.daysRemaining;
    awardOnce('unitOpen:unitA', () => spendDays('Opened Unit A', 4));
    t.equal(state.daysRemaining, before, 'a resumed save must not re-charge the cost');
  });
});

suite('Telemetry: export shape', (t) => {
  t.test('CSV export has a header and one row per event', () => {
    sim.reset();
    startSession('CSV Student');
    record('unitA', 'selected', { station: 3 });
    const csv = toCSV();
    const lines = csv.split('\n');
    t.includes(lines[0], 'object_id');
    t.equal(lines.length, state.telemetry.length + 1);
  });
  t.test('xAPI export is valid JSON with verbs and an actor', () => {
    const parsed = JSON.parse(toXAPI());
    t.assert(Array.isArray(parsed));
    t.assert(parsed.length > 0);
    t.equal(parsed[0].actor.name, 'CSV Student');
    t.assert(parsed[0].verb.id.startsWith('http'));
  });
  t.test('a milestone event is recorded only once', () => {
    const before = state.telemetry.length;
    recordOnce('milestone-test', 'unitA', 'completed', {});
    recordOnce('milestone-test', 'unitA', 'completed', {});
    t.equal(state.telemetry.length, before + 1);
  });
});

suite('Interaction targeting, independent of XR', (t) => {
  t.test('an unopened unit resolves as a candidate, an opened one does not', () => {
    sim.reset();
    const meta = { kind: 'unitPlug', id: 'unitA', range: 3.6 };
    t.assert(resolveTarget(meta) !== null);
    openUnit('unitA', 4, 'Opened');
    t.equal(resolveTarget(meta), null, 'a stale plug must not stay interactive');
  });
  t.test('a pit only resolves once its unit is open', () => {
    sim.reset();
    const meta = { kind: 'pit', id: 'unitB', range: 3.8 };
    t.equal(resolveTarget(meta), null);
    openUnit('unitB', 4, 'Opened');
    t.assert(resolveTarget(meta) !== null);
  });
  t.test('station targets always resolve with a label', () => {
    ['supervisor', 'lab', 'dating', 'synthesis', 'evidence', 'screen'].forEach((kind) => {
      const resolved = resolveTarget({ kind, id: null, range: 3 });
      t.assert(resolved && resolved.label, `${kind} should resolve`);
    });
  });
  t.test('an unknown kind resolves to nothing', () => {
    t.equal(resolveTarget({ kind: 'nonsense', id: null }), null);
  });
});

suite('XR: teleport validity is enforced without a headset', (t) => {
  t.test('a point outside the site is refused', () => {
    t.equal(isTeleportTargetValid(SITE.half + 5, 0), false);
    t.equal(isTeleportTargetValid(0, -(SITE.half + 5)), false);
  });
  t.test('open ground inside the site is accepted', () => {
    removeCollisionBox('test-block');
    removeTeleportExclusion('test-exclude');
    t.equal(isTeleportTargetValid(4, 4), true);
  });
  t.test('an excluded region such as an open pit is refused', () => {
    addTeleportExclusion('test-exclude', 4, 4, 2, 2);
    t.equal(isTeleportTargetValid(4, 4), false);
    removeTeleportExclusion('test-exclude');
  });
  t.test('a solid obstacle is refused', () => {
    addCollisionBox('test-block', -6, -6, 2, 2);
    t.equal(isTeleportTargetValid(-6, -6), false);
    removeCollisionBox('test-block');
    t.equal(isTeleportTargetValid(-6, -6), true);
  });
});

suite('Content integrity', (t) => {
  t.test('every excavation find refers to a real artifact', () => {
    Object.keys(UNIT_LEVELS).forEach((unitId) => {
      UNIT_LEVELS[unitId].forEach((level) => {
        (level.finds || []).forEach((find) => {
          t.assert(ARTIFACTS[find.artifact], `${unitId} level ${level.level} references ${find.artifact}`);
        });
      });
    });
  });
  t.test('every level feature refers to a real feature definition', () => {
    Object.keys(UNIT_LEVELS).forEach((unitId) => {
      UNIT_LEVELS[unitId].forEach((level) => {
        if (level.feature) t.assert(FEATURES[level.feature], `${unitId} level ${level.level} references ${level.feature}`);
      });
    });
  });
  t.test('every level offers at least one option per step', () => {
    Object.keys(UNIT_LEVELS).forEach((unitId) => {
      UNIT_LEVELS[unitId].forEach((level) => {
        level.steps.forEach((step) => {
          t.assert(step.options && step.options.length >= 2, `${unitId} level ${level.level} step ${step.id}`);
          t.assert(step.options.some((o) => o.correct), `${unitId} level ${level.level} step ${step.id} needs a defensible option`);
        });
      });
    });
  });
  t.test('every sample context has a laboratory result on both quality paths', () => {
    Object.keys(UNIT_LEVELS).forEach((unitId) => {
      UNIT_LEVELS[unitId].forEach((level) => {
        const wantsSample = (level.finds || []).some((f) => f.requires === 'sample');
        if (!wantsSample) return;
        const key = `${unitId}-L${level.level}`;
        t.assert(RADIOCARBON_RESULTS[key], `missing radiocarbon entry for ${key}`);
        t.assert(RADIOCARBON_RESULTS[key].clean && RADIOCARBON_RESULTS[key].contaminated, `${key} needs both paths`);
      });
    });
  });
  t.test('every level that offers a sample also offers a way to collect one', () => {
    Object.keys(UNIT_LEVELS).forEach((unitId) => {
      UNIT_LEVELS[unitId].forEach((level) => {
        const wantsSample = (level.finds || []).some((f) => f.requires === 'sample');
        if (!wantsSample) return;
        t.assert(level.steps.some((s) => s.kind === 'sample'), `${unitId} level ${level.level} has no sampling step`);
      });
    });
  });
  t.test('every artifact scores its own correct answers as correct', () => {
    Object.values(ARTIFACTS).forEach((def) => {
      Object.entries(def.fields).forEach(([fieldId, spec]) => {
        if (!spec.correct) return;
        const { verdict } = scoreAnalysisAnswer(def.id, fieldId, spec.correct);
        t.equal(verdict, 'correct', `${def.id}.${fieldId}`);
      });
    });
  });
  t.test('every feature has a best interpretation and at least one alternative', () => {
    Object.values(FEATURES).forEach((def) => {
      t.assert(def.interpretations.some((i) => i.verdict === 'best'), `${def.id} needs a best reading`);
      t.assert(def.interpretations.length >= 3, `${def.id} needs alternatives`);
    });
  });
  t.test('every survey item has feedback for every classification', () => {
    SURVEY_ITEMS.forEach((item) => {
      ['artifact', 'featureIndicator', 'modern', 'natural'].forEach((cls) => {
        t.assert(item.feedback[cls], `${item.id} is missing feedback for ${cls}`);
      });
    });
  });
  t.test('user-facing content uses plain hyphens only', () => {
    const offenders = [];
    const scan = (label, value) => {
      if (typeof value === 'string') {
        if (/[–—]/.test(value)) offenders.push(label);
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([k, v]) => scan(`${label}.${k}`, v));
      }
    };
    scan('artifacts', ARTIFACTS);
    scan('features', FEATURES);
    scan('survey', SURVEY_ITEMS);
    scan('equipment', EQUIPMENT_ITEMS);
    scan('synthesis', SYNTHESIS_DOMAINS);
    t.deepEqual(offenders, []);
  });
});

/* ------------------------------------------------------------------ */
/* Start-gate button routing. Guards against the class of bug where a start
   button stores a deferred action that another button (historically Resume)
   later executes. Each button must perform only its own action. The controller
   is exercised with spy effects so the exact routing can be asserted without a
   DOM. `log` records the side effects in order; `pending` exposes the stored
   action. */

function makeGate(hasSaveInitial) {
  const log = [];
  let saved = !!hasSaveInitial;
  const ctrl = createGateController({
    hasSave: () => saved,
    startInMode: (mode) => log.push(`start:${mode}`),
    resume: () => log.push('resume'),
    openSettings: () => log.push('settings'),
    openConfirm: () => log.push('openConfirm'),
    closeConfirm: () => log.push('closeConfirm')
  });
  return { ctrl, log, setSaved: (v) => { saved = !!v; } };
}

/* Mirrors the real UI wiring: closing the confirm dialog (Cancel, Escape, the
   persistent close control, or any programmatic close) calls dismiss(). */
function closeConfirmDialog(g) {
  g.ctrl.dismiss();
}

suite('Start gate: each button performs only its own action', (t) => {
  t.test('1. Start 3D with no save starts a 3D investigation immediately', () => {
    const g = makeGate(false);
    g.ctrl.requestStart('3d');
    t.deepEqual(g.log, ['start:3d']);
    t.equal(g.ctrl.pending, null);
  });

  t.test('2. Guided mode with no save starts a guided investigation immediately', () => {
    const g = makeGate(false);
    g.ctrl.requestStart('guided');
    t.deepEqual(g.log, ['start:guided']);
    t.equal(g.ctrl.pending, null);
  });

  t.test('3. Settings opens immediately and is not blocked by an existing save', () => {
    const g = makeGate(true);
    g.ctrl.openSettings();
    t.deepEqual(g.log, ['settings']);
    t.equal(g.ctrl.pending, null, 'settings must not queue a start action');
  });

  t.test('4. Resume with a save resumes only the saved session', () => {
    const g = makeGate(true);
    g.ctrl.resume();
    t.deepEqual(g.log, ['resume']);
    t.equal(g.ctrl.pending, null);
  });

  t.test('5. Start 3D, cancel the confirmation, then Resume: resumes, 3D never starts', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('3d');
    t.deepEqual(g.log, ['openConfirm']);
    t.deepEqual(g.ctrl.pending, { mode: '3d' });
    closeConfirmDialog(g);
    t.equal(g.ctrl.pending, null, 'cancelling clears the pending start');
    g.ctrl.resume();
    t.deepEqual(g.log, ['openConfirm', 'resume']);
    t.notIncludes(g.log, 'start:3d', 'Resume must not inherit the start action');
  });

  t.test('6. Guided, cancel, then Settings: only Settings opens', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('guided');
    closeConfirmDialog(g);
    g.ctrl.openSettings();
    t.notIncludes(g.log, 'start:guided');
    t.deepEqual(g.log, ['openConfirm', 'settings']);
  });

  t.test('7. Settings, close it, then Resume: resumes', () => {
    const g = makeGate(true);
    g.ctrl.openSettings();
    // closing settings is unrelated to the confirm dialog and touches no pending
    g.ctrl.resume();
    t.deepEqual(g.log, ['settings', 'resume']);
    t.notIncludes(g.log, 'start:3d');
    t.notIncludes(g.log, 'start:guided');
  });

  t.test('8. Start 3D and confirm replacement: a fresh 3D investigation starts', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('3d');
    g.ctrl.confirm();
    t.deepEqual(g.log, ['openConfirm', 'closeConfirm', 'start:3d']);
    t.equal(g.ctrl.pending, null);
  });

  t.test('9. Guided and confirm replacement: a fresh guided investigation starts', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('guided');
    g.ctrl.confirm();
    t.deepEqual(g.log, ['openConfirm', 'closeConfirm', 'start:guided']);
    t.equal(g.ctrl.pending, null);
  });

  t.test('10a. Alternating buttons never executes a previous action', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('3d'); closeConfirmDialog(g);
    g.ctrl.requestStart('guided'); closeConfirmDialog(g);
    g.ctrl.resume();
    g.ctrl.openSettings();
    g.ctrl.requestStart('3d'); closeConfirmDialog(g);
    // Not one start ever ran, because every request was cancelled.
    t.notIncludes(g.log, 'start:3d');
    t.notIncludes(g.log, 'start:guided');
    t.equal(g.ctrl.pending, null);
    t.deepEqual(g.log.filter((e) => e === 'resume' || e === 'settings'), ['resume', 'settings']);
  });

  t.test('10b. A newer request replaces the older one; confirm runs only the latest', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('3d');
    g.ctrl.requestStart('guided'); // supersedes the 3D request without confirming it
    g.ctrl.confirm();
    t.notIncludes(g.log, 'start:3d');
    t.includes(g.log, 'start:guided');
  });

  t.test('10c. Resume never executes a still-pending start (defensive)', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('3d'); // pending set, dialog "open"
    g.ctrl.resume();           // resume must ignore the pending start entirely
    t.notIncludes(g.log, 'start:3d');
    t.includes(g.log, 'resume');
  });

  t.test('confirm is idempotent: a second confirm cannot start twice', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('3d');
    g.ctrl.confirm();
    g.ctrl.confirm();
    t.equal(g.log.filter((e) => e === 'start:3d').length, 1);
  });

  t.test('confirm after cancel does nothing', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('guided');
    closeConfirmDialog(g);
    g.ctrl.confirm();
    t.notIncludes(g.log, 'start:guided');
  });

  t.test('12. A fresh controller (page reload) carries no pending action', () => {
    const g = makeGate(true);
    g.ctrl.requestStart('3d'); // set a pending action, then simulate a reload
    const reloaded = makeGate(true);
    t.equal(reloaded.ctrl.pending, null, 'pending is in-memory only and does not survive a reload');
  });
});

/* ------------------------------------------------------------------ */
/* World targeting before any 3D scene exists. The global keyboard shortcuts
   (E, Enter, Space) and the touch Interact event call these on every press,
   including at the start gate and in guided mode where no camera was ever
   created, so they must return null rather than throw. */

suite('Interaction: world targeting is inert without a 3D scene', (t) => {
  t.test('targetFromCamera returns null when no renderer/camera exists', () => {
    t.equal(targetFromCamera(), null);
  });
  t.test('targetFromScreenPoint returns null when no renderer/camera exists', () => {
    t.equal(targetFromScreenPoint(100, 100), null);
  });
});
