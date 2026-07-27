/* Station 2: Surveying the Site. */

import { byId, el, clear } from '../../core/dom.js';
import { SURVEY_ITEMS, SURVEY_CLASSES, RECORDING_METHODS, CONCENTRATION_QUESTIONS, surveyItemById } from '../../data/survey.js';
import { SURVEY_ZONES, UNITS, UNIT_ORDER } from '../../data/site.js';
import {
  state, recordSurveyClassification, recordSurveyPosition, recordConcentrationAnswer,
  setUnitRecommendation, hasCapability
} from '../../core/state.js';
import { record, recordOnce } from '../../core/telemetry.js';
import * as modal from '../modal.js';
import { toast, announce } from '../toast.js';
import { drawInspection } from '../inspectionArt.js';
import { button, actionRow, showFeedback, sectionHeading, emptyState, progressLine } from '../components.js';
import { offerRetrieval } from './equipment.js';

const PANEL = 'surveyOverlay';
let activeItem = null;

export function openSurveyItem(itemId) {
  const item = surveyItemById(itemId);
  if (!item) return;
  activeItem = item;
  modal.open({ id: PANEL, dismissible: true, initialFocus: '#surveyClassChoices button' });
  renderItem(item);
}

function renderItem(item) {
  const rec = state.survey.records[item.id];
  byId('surveyItemName').textContent = rec && rec.classification ? item.name : `Surface object: ${labelIndex(item.id)}`;
  drawInspection(byId('surveyInspectCanvas'), item);
  byId('surveyInspectCanvas').setAttribute('aria-label', `Field drawing of surface object ${labelIndex(item.id)}. ${item.detail}`);
  byId('surveyItemDesc').textContent = item.desc;

  const classHost = byId('surveyClassChoices');
  const feedback = byId('surveyFeedback');
  const recordHost = byId('surveyRecordSection');
  clear(feedback);
  clear(recordHost);
  clear(classHost);

  if (rec && rec.classification) {
    renderClassificationResult(item, rec, feedback);
    renderRecordingSection(item, rec, recordHost);
    return;
  }

  classHost.appendChild(el('p', { class: 'promptLine' }, 'Classify this object. What is it, and what kind of evidence is it?'));
  const classGroup = el('div', { class: 'choiceStack', role: 'group', 'aria-label': 'Classify this surface object' });
  SURVEY_CLASSES.forEach((cls) => {
    const btn = el('button', { type: 'button', class: 'choiceBtn wide' },
      el('span', { class: 'choiceMain' }, cls.label),
      el('span', { class: 'choiceHint' }, cls.hint));
    btn.addEventListener('click', () => classify(item, cls.id));
    classGroup.appendChild(btn);
  });
  classHost.appendChild(classGroup);
}

function classify(item, classification) {
  const verdict = classification === item.truth
    ? 'correct'
    : ((item.defensible || []).includes(classification) ? 'defensible' : 'incorrect');
  recordSurveyClassification(item.id, classification, verdict);
  record(item.id, 'classified', { classification, verdict, correct: verdict === 'correct', station: 2 });
  renderItem(item);
}

function renderClassificationResult(item, rec, feedback) {
  const classHost = byId('surveyClassChoices');
  clear(classHost);
  const cls = SURVEY_CLASSES.find((c) => c.id === rec.classification);
  const truth = SURVEY_CLASSES.find((c) => c.id === item.truth);
  const tone = rec.verdict === 'correct' ? 'good' : (rec.verdict === 'defensible' ? 'warn' : 'bad');
  classHost.appendChild(el('div', { class: 'resultLine' },
    el('strong', {}, `You recorded this as: ${cls ? cls.label : rec.classification}`)));
  if (rec.verdict !== 'correct') {
    classHost.appendChild(el('div', { class: 'resultLine subtle' },
      `Best supported classification: ${truth ? truth.label : item.truth}.`));
  }
  showFeedback(feedback, item.feedback[rec.classification] || '', tone);
}

function renderRecordingSection(item, rec, host) {
  host.appendChild(sectionHeading('Record its position',
    'An object you did not record cannot be cited later, however well you identified it.'));

  if (rec.recordQuality) {
    const method = RECORDING_METHODS.find((m) => m.id === rec.recordMethod);
    host.appendChild(el('div', { class: `recordCard tone-${rec.recordQuality === 'none' ? 'bad' : 'good'}` },
      el('div', { class: 'recordCardTitle' }, rec.recordQuality === 'none' ? 'Not recorded' : 'Recorded'),
      el('div', { class: 'recordCardLine' }, method ? method.label : rec.recordMethod),
      el('div', { class: 'recordCardLine' }, rec.recordQuality === 'none'
        ? 'This object is not on the site map and cannot be cited as evidence.'
        : `Added to the site map at ${rec.recordQuality} precision.`)));
    host.appendChild(actionRow(button('Continue survey', () => modal.close(PANEL), 'secondary')));
    return;
  }

  const choices = el('div', { class: 'choiceStack', role: 'group', 'aria-label': 'How will you record this object’s position on the site map?' });
  RECORDING_METHODS.forEach((method) => {
    const available = !method.requires || hasCapability(method.requires);
    const btn = el('button', { type: 'button', class: `choiceBtn wide${available ? '' : ' unavailable'}` },
      el('span', { class: 'choiceMain' }, method.label),
      el('span', { class: 'choiceHint' }, available ? method.blurb : `Not possible with your kit. ${method.blurb}`));
    btn.addEventListener('click', () => {
      if (!available) {
        const itemNeeded = method.requires === 'preciseProvenience' ? 'totalstation'
          : (method.requires === 'coarseProvenience' ? 'gps' : 'clipboard');
        offerRetrieval(itemNeeded, (fetched) => {
          if (fetched) applyRecording(item, method);
          else toast('Recorded without that instrument. Choose another method.', 'warn');
        });
        return;
      }
      applyRecording(item, method);
    });
    choices.appendChild(btn);
  });
  host.appendChild(choices);
}

function applyRecording(item, method) {
  recordSurveyPosition(item.id, method.id, method.quality);
  record(item.id, 'documented', { quality: method.quality, station: 2 });
  if (method.quality === 'none') {
    announce('Object left unrecorded. It will not appear on the site map.');
  } else {
    announce('Position recorded and added to the site map.');
  }
  renderItem(item);
  maybeOfferConcentration();
}

function labelIndex(id) {
  return `no. ${SURVEY_ITEMS.findIndex((i) => i.id === id) + 1} of ${SURVEY_ITEMS.length}`;
}

function maybeOfferConcentration() {
  const classified = Object.values(state.survey.records).filter((r) => r.classification).length;
  if (classified >= 8 && Object.keys(state.survey.concentration).length < CONCENTRATION_QUESTIONS.length) {
    toast('You have enough of the transect recorded to compare concentrations. Open the site map summary from the objective button.', 'info');
  }
}

/* ---------- concentration comparison and unit recommendation ---------- */

export function openSurveySummary() {
  modal.open({ id: 'surveySummaryOverlay', dismissible: true });
  renderSummary();
}

function renderSummary() {
  const host = byId('surveySummaryBody');
  clear(host);

  const classified = Object.values(state.survey.records).filter((r) => r.classification);
  host.appendChild(progressLine(classified.length, SURVEY_ITEMS.length, 'Surface objects examined'));
  host.appendChild(progressLine(state.survey.mapped.length, SURVEY_ITEMS.length, 'Positions recorded on the site map'));

  host.appendChild(sectionHeading('Recorded distribution', 'Only objects whose positions you recorded appear here.'));
  const zoneList = el('div', { class: 'recordList' });
  SURVEY_ZONES.forEach((zone) => {
    const mapped = zone.members.filter((id) => state.survey.mapped.includes(id));
    const cultural = mapped.filter((id) => {
      const rec = state.survey.records[id];
      return rec && (rec.classification === 'artifact' || rec.classification === 'featureIndicator');
    });
    zoneList.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, zone.label),
      el('span', { class: 'recordRowSide' }, `${mapped.length} recorded, ${cultural.length} cultural`)));
  });
  host.appendChild(zoneList);

  if (classified.length < 8) {
    host.appendChild(el('p', { class: 'emptyState' },
      `Examine at least ${8 - classified.length} more surface object${8 - classified.length === 1 ? '' : 's'} before comparing concentrations.`));
    return;
  }

  host.appendChild(sectionHeading('Comparing concentrations', null));
  CONCENTRATION_QUESTIONS.forEach((q) => host.appendChild(concentrationBlock(q)));

  if (Object.keys(state.survey.concentration).length >= CONCENTRATION_QUESTIONS.length) {
    host.appendChild(unitRecommendationBlock());
  }
}

function concentrationBlock(question) {
  const wrap = el('div', { class: 'questionBlock' }, el('p', { class: 'promptLine' }, question.prompt));
  const answered = state.survey.concentration[question.id];
  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  const choices = el('div', { class: 'choiceStack', role: 'group', 'aria-label': question.prompt });
  question.options.forEach((opt) => {
    const chosen = answered && answered.optionId === opt.id;
    const btn = el('button', {
      type: 'button',
      class: `choiceBtn wide${chosen ? (opt.correct ? ' chosen-good' : ' chosen-bad') : ''}`,
      disabled: !!answered
    }, opt.text);
    btn.addEventListener('click', () => {
      recordConcentrationAnswer(question.id, opt.id, opt.correct);
      record(`survey_${question.id}`, 'interpreted', { correct: opt.correct, station: 2 });
      renderSummary();
    });
    choices.appendChild(btn);
  });
  wrap.appendChild(choices);
  if (answered) {
    const opt = question.options.find((o) => o.id === answered.optionId);
    if (opt) showFeedback(feedback, opt.feedback, opt.correct ? 'good' : 'bad');
  }
  wrap.appendChild(feedback);
  return wrap;
}

function unitRecommendationBlock() {
  const wrap = el('div', { class: 'questionBlock' });
  wrap.appendChild(sectionHeading('Recommend an excavation unit',
    'Project time allows one unit to be opened now. Base the recommendation on what you recorded, not on what is convenient.'));

  if (state.survey.recommendation) {
    const unit = UNITS[state.survey.recommendation.unitId];
    wrap.appendChild(el('div', { class: 'recordCard tone-good' },
      el('div', { class: 'recordCardTitle' }, 'Recommendation filed'),
      el('div', { class: 'recordCardLine' }, unit ? unit.label : state.survey.recommendation.unitId),
      el('div', { class: 'recordCardLine' }, 'Go to the excavation grid to open it.')));
    return wrap;
  }

  const list = el('div', { class: 'choiceStack', role: 'group', 'aria-label': 'Recommend an excavation unit to open' });
  availableUnits().forEach(({ unit, unlocked, reason }) => {
    const btn = el('button', { type: 'button', class: `choiceBtn wide${unlocked ? '' : ' unavailable'}` },
      el('span', { class: 'choiceMain' }, unit.label),
      el('span', { class: 'choiceHint' }, unlocked ? unit.hint : reason));
    btn.addEventListener('click', () => {
      if (!unlocked) {
        toast(reason, 'warn');
        return;
      }
      setUnitRecommendation(unit.id, unit.placementQuality);
      recordOnce(`recommend:${unit.id}`, unit.id, 'interpreted', { station: 2, quality: unit.placementQuality });
      renderSummary();
      toast('Recommendation filed. Open the unit at the excavation grid.', 'info');
    });
    list.appendChild(btn);
  });
  wrap.appendChild(list);
  return wrap;
}

export function availableUnits() {
  return UNIT_ORDER.map((id) => {
    const unit = UNITS[id];
    const missing = (unit.requires || []).filter((req) => !state.survey.mapped.includes(req));
    return {
      unit,
      unlocked: missing.length === 0,
      reason: missing.length
        ? (unit.requiresText || 'Not supported by anything you have recorded yet.')
        : unit.hint
    };
  });
}

export function initSurvey() {
  byId('closeSurveyBtn').addEventListener('click', () => modal.close(PANEL));
  byId('closeSurveySummaryBtn').addEventListener('click', () => modal.close('surveySummaryOverlay'));
}

export function nextUnexaminedSurveyId() {
  const next = SURVEY_ITEMS.find((i) => {
    const rec = state.survey.records[i.id];
    return !rec || !rec.classification || !rec.recordQuality;
  });
  return next ? next.id : null;
}
