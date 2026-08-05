/* Station 5: Dating the Site.

   Every line of evidence shown here traces back to something the learner
   recovered. If no charcoal sample was collected there is no radiocarbon
   section; if no diagnostic artifact was analysed there is no typology
   section. The station says so explicitly rather than quietly showing less. */

import { byId, el, clear } from '../../core/dom.js';
import {
  RADIOCARBON_RESULTS, DATING_QUESTIONS, METHOD_CLASSIFICATION, radiocarbonFor
} from '../../data/dating.js';
import { state, setDatingReliability, setMethodSort, setDatingConclusion } from '../../core/state.js';
import { record } from '../../core/telemetry.js';
import { availableTypologyLines, availableStratigraphicLines, applicableDatingQuestions } from '../../core/evidence.js';
import * as modal from '../modal.js';
import { button, showFeedback, sectionHeading, emptyState } from '../components.js';

const PANEL = 'datingOverlay';

export function openDating() {
  modal.open({ id: PANEL, dismissible: true });
  render();
}

function render() {
  const host = byId('datingBody');
  clear(host);

  const samples = state.samples;
  const typology = availableTypologyLines();
  const strat = availableStratigraphicLines();

  if (!samples.length && !typology.length && !strat.length) {
    host.appendChild(emptyState('There is nothing on the bench. Dating evidence appears here once you have collected a sample, analysed a diagnostic artifact, or excavated enough of a unit to record its sequence.'));
    return;
  }

  host.appendChild(radiocarbonSection(samples));
  host.appendChild(typologySection(typology));
  host.appendChild(stratigraphySection(strat));
  host.appendChild(methodSection(samples, typology, strat));
  host.appendChild(conclusionSection());
}

function radiocarbonSection(samples) {
  const wrap = el('section', { class: 'stationSection' });
  wrap.appendChild(sectionHeading('Radiocarbon results',
    'Absolute dates. Each one is only as good as the sample and the context it came from.'));

  if (!samples.length) {
    wrap.appendChild(emptyState('No charcoal sample was collected, so there are no radiocarbon results. Every statement you make about age will have to rest on relative evidence.'));
    return wrap;
  }

  samples.forEach((sample) => {
    const result = radiocarbonFor(sample.key, sample.quality);
    if (!result) return;
    const judged = state.dating.reliability[sample.key];
    const card = el('div', { class: `recordCard tone-${result.reliable ? 'good' : 'warn'}` },
      el('div', { class: 'recordCardTitle' }, result.contextLabel),
      el('div', { class: 'recordCardLine' }, `${result.material}. ${result.bp}. ${result.calibrated}.`),
      el('div', { class: 'recordCardLine' }, `Field collection: ${sample.quality === 'clean' ? 'clean, labelled in the field' : 'handled with a used tool, labelled later'}. Context provenience: ${sample.provenience}.`),
      el('div', { class: 'recordCardLine' }, result.note));

    const question = el('div', { class: 'questionBlock' },
      el('p', { class: 'promptLine' }, 'Do you carry this result into the report as reliable?'));
    const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
    const choices = el('fieldset', { class: 'choiceRow choiceGroup' }, el('legend', { class: 'visuallyHidden' }, `${result.contextLabel}: carry this radiocarbon result into the report as reliable?`));
    [
      { id: 'reliable', label: 'Reliable' },
      { id: 'unreliable', label: 'Set aside as unreliable' }
    ].forEach((opt) => {
      const selected = judged === opt.id;
      const btn = el('button', {
        type: 'button',
        class: `choiceBtn small${selected ? ' active' : ''}`,
        'aria-pressed': String(selected)
      }, opt.label);
      btn.addEventListener('click', () => {
        setDatingReliability(sample.key, opt.id);
        const correct = (opt.id === 'reliable') === result.reliable;
        record(sample.key, 'dated', { station: 5, reliable: opt.id === 'reliable', correct });
        render();
      });
      choices.appendChild(btn);
    });
    question.appendChild(choices);
    if (judged) {
      const correct = (judged === 'reliable') === result.reliable;
      const message = correct
        ? (result.reliable
          ? 'Correct. Clean collection, a secure sealed context, and a result consistent with the other evidence.'
          : 'Correct. Setting a result aside is a decision, not a failure, and the reason belongs in the report alongside the number.')
        : (result.reliable
          ? 'This result is defensible. Discarding a sound date because it is inconvenient leaves the chronology weaker than the evidence allows.'
          : 'Carrying this one forward is risky. Contaminated or poorly recorded samples still return numbers, and a number that conflicts with everything else on the site is a warning rather than a discovery.');
      showFeedback(feedback, message, correct ? 'good' : 'bad');
    }
    question.appendChild(feedback);
    card.appendChild(question);
    wrap.appendChild(card);
  });

  const uncollected = Object.keys(RADIOCARBON_RESULTS).filter((key) => !samples.some((s) => s.key === key));
  if (uncollected.length) {
    wrap.appendChild(el('p', { class: 'emptyState' },
      `${uncollected.length} further dateable context${uncollected.length === 1 ? ' was' : 's were'} available on this site but produced no sample, either because they were not excavated or because no sample was taken.`));
  }
  return wrap;
}

function typologySection(lines) {
  const wrap = el('section', { class: 'stationSection' });
  wrap.appendChild(sectionHeading('Typological and stylistic evidence',
    'Relative dating. Broad ranges, but independent of the radiocarbon results.'));
  if (!lines.length) {
    wrap.appendChild(emptyState('No diagnostic artifact has been analysed yet. Analyse your finds in the laboratory and any diagnostic forms will appear here.'));
    return wrap;
  }
  lines.forEach((line) => {
    wrap.appendChild(el('div', { class: 'recordCard' },
      el('div', { class: 'recordCardTitle' }, line.label),
      el('div', { class: 'recordCardLine' }, `Estimated range: ${line.estimate}.`),
      el('div', { class: 'recordCardLine' }, line.note)));
  });
  return wrap;
}

function stratigraphySection(lines) {
  const wrap = el('section', { class: 'stationSection' });
  wrap.appendChild(sectionHeading('Stratigraphic relationships',
    'Relative dating. Order without dates, and often the strongest evidence you have.'));
  if (!lines.length) {
    wrap.appendChild(emptyState('No unit has been excavated far enough to record a sequence.'));
    return wrap;
  }
  lines.forEach((line) => {
    wrap.appendChild(el('div', { class: 'recordCard' },
      el('div', { class: 'recordCardTitle' }, line.label),
      el('div', { class: 'recordCardLine' }, line.statement),
      el('div', { class: 'recordCardLine' }, line.note)));
  });
  return wrap;
}

function methodSection(samples, typology, strat) {
  const wrap = el('section', { class: 'stationSection' });
  wrap.appendChild(sectionHeading('Absolute or relative?', METHOD_CLASSIFICATION.prompt));

  const lines = [
    ...samples.map((s) => ({ id: `c14:${s.key}`, label: `Radiocarbon result from ${s.key.replace('-L', ', level ')}`, method: 'absolute' })),
    ...typology.map((t) => ({ id: t.id, label: t.label, method: t.method })),
    ...strat.map((s) => ({ id: s.id, label: s.label, method: s.method }))
  ];

  lines.forEach((line) => {
    const answered = state.dating.methodSort[line.id];
    const rowFeedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
    const row = el('div', { class: 'questionBlock' }, el('p', { class: 'promptLine' }, line.label));
    const choices = el('fieldset', { class: 'choiceRow choiceGroup' }, el('legend', { class: 'visuallyHidden' }, `${line.label}: absolute or relative dating method?`));
    METHOD_CLASSIFICATION.options.forEach((opt) => {
      const selected = answered && answered.classification === opt.id;
      const btn = el('button', {
        type: 'button',
        class: `choiceBtn small${selected ? ' active' : ''}`,
        'aria-pressed': String(!!selected)
      }, opt.label);
      btn.addEventListener('click', () => {
        const correct = opt.id === line.method;
        setMethodSort(line.id, opt.id, correct);
        record(line.id, 'classified', { station: 5, answer: opt.id, correct });
        render();
      });
      choices.appendChild(btn);
    });
    row.appendChild(choices);
    if (answered) {
      const correct = answered.correct;
      const key = line.method === 'absolute'
        ? (correct ? 'absoluteCorrect' : 'absoluteWrong')
        : (correct ? 'relativeCorrect' : 'relativeWrong');
      showFeedback(rowFeedback, METHOD_CLASSIFICATION.feedback[key], correct ? 'good' : 'bad');
    }
    row.appendChild(rowFeedback);
    wrap.appendChild(row);
  });
  return wrap;
}

function conclusionSection() {
  const wrap = el('section', { class: 'stationSection' });
  wrap.appendChild(sectionHeading('Chronological conclusions',
    'Only questions your evidence can address are shown.'));

  const applicable = applicableDatingQuestions();
  if (!applicable.length) {
    wrap.appendChild(emptyState('You do not yet have enough dating evidence to draw a chronological conclusion.'));
    return wrap;
  }

  applicable.forEach((question) => {
    if (question.kind === 'sampleReliability') return; // handled in the radiocarbon section
    wrap.appendChild(conclusionBlock(question));
  });

  return wrap;
}

function conclusionBlock(question) {
  const wrap = el('div', { class: 'questionBlock' }, el('p', { class: 'promptLine' }, question.prompt));
  const stored = state.dating.conclusions[question.id];
  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  const choices = el('fieldset', { class: 'choiceStack choiceGroup' }, el('legend', { class: 'visuallyHidden' }, question.prompt));

  const options = question.options.filter((opt) => optionAvailable(opt));

  if (question.multi) {
    const chosen = new Set(Array.isArray(stored) ? stored.map((s) => s.optionId) : []);
    options.forEach((opt) => {
      const input = el('input', { type: 'checkbox', id: `dating-${question.id}-${opt.id}` });
      input.checked = chosen.has(opt.id);
      input.addEventListener('change', () => {
        if (input.checked) chosen.add(opt.id); else chosen.delete(opt.id);
        const payload = [...chosen].map((id) => {
          const o = question.options.find((x) => x.id === id);
          return { optionId: id, verdict: o ? o.verdict : 'poor' };
        });
        setDatingConclusion(question.id, payload);
        record(question.id, 'concluded', { station: 5, answer: [...chosen].join('|') });
        if (input.checked) showFeedback(feedback, opt.feedback, opt.verdict === 'best' ? 'good' : (opt.verdict === 'conditional' ? 'warn' : 'bad'));
      });
      choices.appendChild(el('label', { class: 'checkRow', for: `dating-${question.id}-${opt.id}` }, input, el('span', {}, opt.text)));
    });
  } else {
    options.forEach((opt) => {
      const selected = stored && stored.optionId === opt.id;
      const btn = el('button', {
        type: 'button',
        class: `choiceBtn wide${selected ? ' active' : ''}`,
        'aria-pressed': String(!!selected)
      }, opt.text);
      btn.addEventListener('click', () => {
        setDatingConclusion(question.id, { optionId: opt.id, verdict: opt.verdict });
        record(question.id, 'concluded', { station: 5, answer: opt.id, verdict: opt.verdict });
        render();
      });
      choices.appendChild(btn);
    });
    if (stored) {
      const opt = question.options.find((o) => o.id === stored.optionId);
      if (opt) showFeedback(feedback, opt.feedback, opt.verdict === 'best' ? 'good' : (opt.verdict === 'conditional' ? 'warn' : 'bad'));
    }
  }

  wrap.appendChild(choices);
  wrap.appendChild(feedback);
  return wrap;
}

/* Options that depend on evidence the learner does not have are hidden, so
   the station never offers a conclusion that could not be justified. */
function optionAvailable(option) {
  const req = option.requires;
  if (!req) return true;
  if (req.context && !state.samples.some((s) => s.key === req.context)) return false;
  if (req.contaminatedSample && !state.samples.some((s) => s.quality !== 'clean')) return false;
  if (req.historicArtifact && !state.artifacts.some((a) => ['ar_nail_cut', 'ar_glass'].includes(a.artifactId))) return false;
  return true;
}

export function initChronology() {
  byId('closeDatingBtn').addEventListener('click', () => modal.close(PANEL));
}
