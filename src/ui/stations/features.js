/* Station 6: Feature Interpretation.

   Observations are recorded before an interpretation can be chosen, and a
   record is only complete once an interpretation, a confidence and an
   explicit alternative reading are all present. */

import { byId, el, clear } from '../../core/dom.js';
import { FEATURES, featureById } from '../../data/features.js';
import { CONFIDENCE_LEVELS } from '../../data/artifacts.js';
import { state, featureRecord, updateFeature, hasCapability } from '../../core/state.js';
import { record } from '../../core/telemetry.js';
import * as modal from '../modal.js';
import { toast } from '../toast.js';
import { button, actionRow, showFeedback, sectionHeading, optionGroup, emptyState } from '../components.js';
import { offerRetrieval } from './equipment.js';

const PANEL = 'featureOverlay';
const LIST_PANEL = 'featureListOverlay';

let onDoneCallback = null;

export function openFeatureList() {
  modal.open({ id: LIST_PANEL, dismissible: true });
  renderList();
}

function renderList() {
  const host = byId('featureListBody');
  clear(host);
  if (!state.features.length) {
    host.appendChild(emptyState('No features have been exposed yet. Features appear as your excavation reaches the levels that contain them.'));
    return;
  }
  state.features.forEach((rec) => {
    const def = featureById(rec.featureId);
    const card = el('div', { class: `recordCard tone-${rec.complete ? 'good' : 'warn'}` },
      el('div', { class: 'recordCardTitle' }, def ? def.name : rec.featureId),
      el('div', { class: 'recordCardLine' }, `${rec.unit}, level ${rec.level}. Record ${rec.complete ? 'complete' : 'incomplete'}.`),
      rec.integrity !== 'good' ? el('div', { class: 'recordCardLine' }, 'Damaged during excavation. Some observations are no longer possible.') : null,
      actionRow(button(rec.complete ? 'Review record' : 'Complete record', () => {
        modal.close(LIST_PANEL);
        openFeatureRecord(rec.featureId, () => openFeatureList());
      })));
    host.appendChild(card);
  });
}

export function openFeatureRecord(featureId, onDone) {
  const def = featureById(featureId);
  if (!def) return;
  if (!featureRecord(featureId)) return;
  onDoneCallback = onDone || null;
  modal.open({ id: PANEL, dismissible: true });
  render(featureId);
}

function render(featureId) {
  const def = featureById(featureId);
  const rec = featureRecord(featureId);
  const host = byId('featureBody');
  clear(host);

  byId('featureTitle').textContent = def.name;
  host.appendChild(el('p', { class: 'promptDetail' }, def.description));
  if (rec.integrity !== 'good') {
    host.appendChild(el('div', { class: 'noticeBox' },
      'This feature was excavated through before it was recorded. You can still describe what survives, but the record will carry that limitation.'));
  }

  host.appendChild(sectionHeading('Observations', 'Describe what is there before deciding what it means.'));
  Object.entries(def.observations).forEach(([fieldId, field]) => {
    host.appendChild(observationBlock(featureId, fieldId, field));
  });

  host.appendChild(sectionHeading('Documentation', null));
  host.appendChild(documentationBlock(featureId, def));

  host.appendChild(sectionHeading('Interpretation', 'Choose the reading your observations support.'));
  const interpretationHost = el('div', { id: 'featureInterpretationHost' });
  interpretationHost.appendChild(interpretationBlock(featureId, def));
  host.appendChild(interpretationHost);

  host.appendChild(statusBlock(featureId, def));
}

/* Refreshes only the parts that depend on how much has been recorded, so a
   single answer does not rebuild the whole panel and throw away the reading
   position. */
function refreshDependentSections(featureId) {
  const def = featureById(featureId);
  const host = document.getElementById('featureInterpretationHost');
  if (host) {
    clear(host);
    host.appendChild(interpretationBlock(featureId, def));
  }
  refreshStatus(featureId);
}

function observationBlock(featureId, fieldId, field) {
  const rec = featureRecord(featureId);
  const wrap = el('div', { class: 'questionBlock' }, el('p', { class: 'promptLine' }, field.prompt));
  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  const choices = el('div', { class: 'choiceStack' });
  const current = rec.observations[fieldId];

  if (field.multi) {
    const chosen = new Set(Array.isArray(current) ? current : []);
    field.options.forEach((opt) => {
      const input = el('input', { type: 'checkbox', id: `${featureId}-${fieldId}-${opt.id}` });
      input.checked = chosen.has(opt.id);
      input.addEventListener('change', () => {
        if (input.checked) chosen.add(opt.id); else chosen.delete(opt.id);
        const next = { ...rec.observations, [fieldId]: [...chosen] };
        updateFeature(featureId, { observations: next });
        if (input.checked && !opt.correct && field.feedback && field.feedback[opt.id]) {
          showFeedback(feedback, field.feedback[opt.id], 'bad');
        } else {
          clear(feedback);
        }
        refreshDependentSections(featureId);
      });
      choices.appendChild(el('label', { class: 'checkRow', for: `${featureId}-${fieldId}-${opt.id}` }, input, el('span', {}, opt.label)));
    });
  } else {
    field.options.forEach((opt) => {
      const missing = (opt.requires || []).filter((cap) => !hasCapability(cap));
      const selected = current === opt.id;
      const btn = el('button', {
        type: 'button',
        class: `choiceBtn wide${selected ? ' active' : ''}${missing.length ? ' unavailable' : ''}`,
        'aria-pressed': String(selected)
      }, opt.label);
      btn.addEventListener('click', () => {
        if (missing.length) {
          offerRetrieval('munsell', (fetched) => { if (fetched) render(featureId); });
          return;
        }
        const next = { ...rec.observations, [fieldId]: opt.id };
        updateFeature(featureId, { observations: next });
        record(featureId, 'observed', { station: 6, field: fieldId, answer: opt.id, correct: field.correct === opt.id });
        const tone = field.correct === opt.id ? 'good' : 'bad';
        if (field.feedback && field.feedback[opt.id]) showFeedback(feedback, field.feedback[opt.id], tone);
        [...choices.children].forEach((child) => {
          const active = child === btn;
          child.classList.toggle('active', active);
          child.setAttribute('aria-pressed', String(active));
        });
        refreshDependentSections(featureId);
      });
      choices.appendChild(btn);
    });
    if (current && field.feedback && field.feedback[current]) {
      showFeedback(feedback, field.feedback[current], field.correct === current ? 'good' : 'bad');
    }
  }

  wrap.appendChild(choices);
  wrap.appendChild(feedback);
  return wrap;
}

function documentationBlock(featureId, def) {
  const rec = featureRecord(featureId);
  const wrap = el('div', { class: 'questionBlock' });
  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });

  const photoBtn = el('button', {
    type: 'button',
    class: `choiceBtn wide${rec.photographed ? ' active' : ''}`,
    'aria-pressed': String(rec.photographed)
  }, 'Photograph the feature with a scale and north arrow');
  photoBtn.addEventListener('click', () => {
    if (!hasCapability('photograph')) {
      offerRetrieval('camera', (fetched) => { if (fetched) render(featureId); });
      return;
    }
    updateFeature(featureId, { photographed: true });
    record(featureId, 'photographed', { station: 6 });
    if (!hasCapability('photoScale')) {
      showFeedback(feedback, 'Photographed, but without a scale or north arrow in frame nobody can measure or orient the image afterwards.', 'warn');
    } else {
      showFeedback(feedback, 'Photographed with a scale and north arrow. The image is measurable and orientable.', 'good');
    }
    photoBtn.classList.add('active');
    photoBtn.setAttribute('aria-pressed', 'true');
    refreshDependentSections(featureId);
  });

  const drawBtn = el('button', {
    type: 'button',
    class: `choiceBtn wide${rec.drawn ? ' active' : ''}`,
    'aria-pressed': String(rec.drawn)
  }, 'Draw the feature in plan and section at scale');
  drawBtn.addEventListener('click', () => {
    if (!hasCapability('forms')) {
      offerRetrieval('clipboard', (fetched) => { if (fetched) render(featureId); });
      return;
    }
    updateFeature(featureId, { drawn: true });
    record(featureId, 'documented', { station: 6, field: 'drawing' });
    showFeedback(feedback, 'Drawn. A scaled drawing shows what the photograph cannot: the interpreted edges, the fill sequence, and the relationships you judged in the field.', 'good');
    drawBtn.classList.add('active');
    drawBtn.setAttribute('aria-pressed', 'true');
    refreshDependentSections(featureId);
  });

  wrap.appendChild(photoBtn);
  wrap.appendChild(drawBtn);
  wrap.appendChild(feedback);
  return wrap;
}

function interpretationBlock(featureId, def) {
  const rec = featureRecord(featureId);
  const wrap = el('div', { class: 'questionBlock' });
  const observationCount = Object.keys(def.observations)
    .filter((fieldId) => {
      const value = (rec.observations || {})[fieldId];
      return value !== undefined && !(Array.isArray(value) && !value.length);
    }).length;
  const required = Object.keys(def.observations).length;

  if (observationCount < required) {
    wrap.appendChild(el('div', { class: 'noticeBox' },
      `Complete all ${required} observations first (${observationCount} recorded). An interpretation is only as good as the description behind it.`));
    return wrap;
  }

  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  const primary = el('div', { class: 'choiceStack' });
  wrap.appendChild(el('p', { class: 'promptLine' }, 'Primary interpretation'));
  def.interpretations.forEach((interp) => {
    const selected = rec.interpretation === interp.id;
    const btn = el('button', {
      type: 'button',
      class: `choiceBtn wide${selected ? ' active' : ''}`,
      'aria-pressed': String(selected)
    }, interp.label);
    btn.addEventListener('click', () => {
      updateFeature(featureId, { interpretation: interp.id });
      record(featureId, 'interpreted', { station: 6, answer: interp.id, verdict: interp.verdict });
      refreshDependentSections(featureId);
    });
    primary.appendChild(btn);
  });
  wrap.appendChild(primary);
  if (rec.interpretation) {
    const interp = def.interpretations.find((i) => i.id === rec.interpretation);
    if (interp) showFeedback(feedback, interp.feedback, interp.verdict === 'best' ? 'good' : (interp.verdict === 'defensible' ? 'warn' : 'bad'));
  }
  wrap.appendChild(feedback);

  if (rec.interpretation) {
    wrap.appendChild(el('p', { class: 'promptLine' }, 'Alternative interpretation you cannot yet rule out'));
    const altHost = el('div', { class: 'choiceStack' });
    def.interpretations.filter((i) => i.id !== rec.interpretation).forEach((interp) => {
      const selected = rec.alternative === interp.id;
      const btn = el('button', {
        type: 'button',
        class: `choiceBtn wide small${selected ? ' active' : ''}`,
        'aria-pressed': String(selected)
      }, interp.label);
      btn.addEventListener('click', () => {
        updateFeature(featureId, { alternative: interp.id });
        record(featureId, 'interpreted', { station: 6, field: 'alternative', answer: interp.id });
        refreshDependentSections(featureId);
      });
      altHost.appendChild(btn);
    });
    wrap.appendChild(altHost);

    wrap.appendChild(el('p', { class: 'promptLine' }, 'Confidence in the primary interpretation'));
    const confHost = el('div', { class: 'choiceRow' });
    optionGroup(confHost, CONFIDENCE_LEVELS, {
      initial: rec.confidence,
      ariaLabel: 'Confidence in the primary interpretation',
      onChange: (id) => {
        updateFeature(featureId, { confidence: id });
        record(featureId, 'interpreted', { station: 6, confidence: id });
        refreshStatus(featureId);
      }
    });
    wrap.appendChild(confHost);
  }

  return wrap;
}

function completeness(featureId) {
  const def = featureById(featureId);
  const rec = featureRecord(featureId);
  const missing = [];
  Object.keys(def.observations).forEach((fieldId) => {
    const v = rec.observations[fieldId];
    if (v === undefined || (Array.isArray(v) && !v.length)) missing.push(`record the ${def.observations[fieldId].prompt.toLowerCase()}`);
  });
  if (!rec.photographed && !rec.drawn) missing.push('photograph or draw the feature');
  if (!rec.interpretation) missing.push('choose a primary interpretation');
  if (!rec.alternative) missing.push('name an alternative interpretation');
  if (!rec.confidence) missing.push('state your confidence');
  return missing;
}

function statusBlock(featureId, def) {
  const missing = completeness(featureId);
  const wrap = el('div', { class: 'questionBlock', id: 'featureStatusBlock' });
  if (missing.length) {
    wrap.appendChild(el('div', { class: 'noticeBox' }, `Still to do: ${missing.join('; ')}.`));
  } else {
    wrap.appendChild(el('div', { class: 'recordCard tone-good' },
      el('div', { class: 'recordCardTitle' }, 'Record complete'),
      el('div', { class: 'recordCardLine' }, 'This feature can now be cited as evidence and used in your synthesis.')));
  }
  wrap.appendChild(actionRow(
    button(missing.length ? 'Save and close' : 'File the record', () => {
      updateFeature(featureId, { complete: missing.length === 0 });
      if (!missing.length) {
        record(featureId, 'completed', { station: 6, documented: true });
        toast('Feature record filed.', 'info');
      } else {
        toast('Saved. The record is still incomplete.', 'warn');
      }
      modal.close(PANEL);
      const cb = onDoneCallback;
      onDoneCallback = null;
      if (cb) cb();
    }),
    button('Close', () => {
      modal.close(PANEL);
      const cb = onDoneCallback;
      onDoneCallback = null;
      if (cb) cb();
    }, 'secondary')));
  return wrap;
}

function refreshStatus(featureId) {
  // Queried directly rather than through the id cache: this node is created
  // and replaced on every render, so a cached reference would be stale.
  const existing = document.getElementById('featureStatusBlock');
  if (!existing || !existing.parentNode) return;
  const def = featureById(featureId);
  existing.parentNode.replaceChild(statusBlock(featureId, def), existing);
}

export function initFeatures() {
  byId('closeFeatureListBtn').addEventListener('click', () => modal.close(LIST_PANEL));
}

export function incompleteFeatureId() {
  const rec = state.features.find((f) => !f.complete);
  return rec ? rec.featureId : null;
}
