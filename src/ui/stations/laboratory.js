/* Station 4: Artifact Identification Laboratory.

   Only material the learner actually recovered appears here. Analysis is
   split into observation fields and interpretation fields, and an analysis
   can be revised at any time, which matters once the chronology station
   changes what a learner thinks a level means. */

import { byId, el, clear } from '../../core/dom.js';
import { ARTIFACTS, ANALYSIS_FIELDS, CONFIDENCE_LEVELS, artifactById, scoreAnalysisAnswer } from '../../data/artifacts.js';
import { state, artifactByUid, recordAnalysis } from '../../core/state.js';
import { record } from '../../core/telemetry.js';
import { unitLabel } from '../../core/evidence.js';
import * as modal from '../modal.js';
import { toast } from '../toast.js';
import { button, actionRow, showFeedback, sectionHeading, optionGroup, emptyState, progressLine } from '../components.js';

const LIST_PANEL = 'labOverlay';
const ITEM_PANEL = 'labItemOverlay';

let activeUid = null;
let draft = {};

export function openLab() {
  modal.open({ id: LIST_PANEL, dismissible: true });
  renderList();
}

function renderList() {
  const host = byId('labBody');
  clear(host);

  if (!state.artifacts.length) {
    host.appendChild(emptyState('Nothing has reached the laboratory yet. Material appears here once it has been recovered and bagged during excavation.'));
    return;
  }

  const analysed = state.artifacts.filter((a) => a.analysis).length;
  host.appendChild(progressLine(analysed, state.artifacts.length, 'Finds analysed'));

  const byUnit = new Map();
  state.artifacts.forEach((a) => {
    if (!byUnit.has(a.unit)) byUnit.set(a.unit, []);
    byUnit.get(a.unit).push(a);
  });

  byUnit.forEach((items, unitId) => {
    host.appendChild(sectionHeading(unitLabel(unitId), null));
    const list = el('div', { class: 'recordList' });
    items.sort((a, b) => a.level - b.level).forEach((a) => {
      const def = artifactById(a.artifactId);
      const tone = a.analysis ? 'good' : 'warn';
      const card = el('div', { class: `recordCard tone-${tone}` },
        el('div', { class: 'recordCardTitle' }, def ? def.name : a.artifactId),
        el('div', { class: 'recordCardLine' }, `Level ${a.level}. Recovered by ${a.recoveredBy}. Provenience: ${a.provenience}.`),
        a.provenience === 'poor'
          ? el('div', { class: 'recordCardLine warnLine' }, 'Provenience is incomplete, so this find can support identification but carries little weight in an argument about context.')
          : null,
        a.analysis ? el('div', { class: 'recordCardLine' }, analysisSummary(a)) : null,
        actionRow(button(a.analysis ? 'Revise analysis' : 'Analyse', () => openItem(a.uid))));
      list.appendChild(card);
    });
    host.appendChild(list);
  });

  if (state.missed.length) {
    host.appendChild(sectionHeading('Not recovered', 'Recorded here so the gaps in the assemblage are visible rather than invisible.'));
    const missedList = el('div', { class: 'recordList' });
    state.missed.forEach((m) => {
      const def = artifactById(m.artifactId);
      missedList.appendChild(el('div', { class: 'recordRow' },
        el('span', { class: 'recordRowMain' }, `${def ? def.name : m.artifactId} (${unitLabel(m.unit)}, level ${m.level})`),
        el('span', { class: 'recordRowSide pill pill-bad' }, 'absent')));
    });
    host.appendChild(missedList);
  }
}

function analysisSummary(a) {
  const def = artifactById(a.artifactId);
  if (!def || !a.analysis) return '';
  const answers = a.analysis.answers || {};
  const period = optionLabel(def, 'period', answers.period);
  const cls = optionLabel(def, 'objectClass', answers.objectClass);
  return `Identified as ${cls || 'unclassified'}, ${period || 'period undetermined'}. Confidence: ${answers.confidence || 'not stated'}.`;
}

function optionLabel(def, fieldId, answerId) {
  const field = def.fields[fieldId];
  if (!field || !answerId) return null;
  const opt = field.options.find((o) => o.id === answerId);
  return opt ? opt.label : answerId;
}

function openItem(uid) {
  activeUid = uid;
  const artifact = artifactByUid(uid);
  if (!artifact) return;
  draft = artifact.analysis ? { ...artifact.analysis.answers } : {};
  modal.close(LIST_PANEL);
  modal.open({ id: ITEM_PANEL, dismissible: true });
  renderItem();
}

function renderItem() {
  const artifact = artifactByUid(activeUid);
  const def = artifactById(artifact.artifactId);
  const host = byId('labItemBody');
  clear(host);

  byId('labItemTitle').textContent = def.name;

  host.appendChild(el('div', { class: 'recordCard' },
    el('div', { class: 'recordCardTitle' }, 'Context'),
    el('div', { class: 'recordCardLine' }, `${unitLabel(artifact.unit)}, level ${artifact.level}. Recovered by ${artifact.recoveredBy}.`),
    el('div', { class: 'recordCardLine' }, `Provenience: ${artifact.provenience}.${artifact.photographed ? ' Photographed in place.' : ' Not photographed in place.'}`)));

  host.appendChild(sectionHeading('Description', 'What is in front of you.'));
  host.appendChild(el('p', { class: 'promptDetail' }, def.description));
  host.appendChild(el('div', { class: 'observationBox' },
    el('div', { class: 'observationLabel' }, 'Recorded observations'),
    el('div', {}, def.observation)));

  ANALYSIS_FIELDS.forEach((field) => {
    if (field.id === 'confidence') return;
    const spec = def.fields[field.id];
    if (!spec) return;
    host.appendChild(fieldBlock(def, field, spec));
  });

  host.appendChild(sectionHeading('Confidence', 'How much weight should this analysis carry?'));
  const confHost = el('div', { class: 'choiceRow' });
  optionGroup(confHost, CONFIDENCE_LEVELS, {
    initial: draft.confidence || null,
    ariaLabel: 'Confidence in this analysis',
    onChange: (id) => { draft.confidence = id; renderStatus(); }
  });
  host.appendChild(confHost);

  host.appendChild(el('div', { id: 'labItemStatus' }));
  renderStatus();
}

function fieldBlock(def, field, spec) {
  const wrap = el('div', { class: 'questionBlock' });
  wrap.appendChild(el('p', { class: 'promptLine' },
    el('span', { class: `fieldKind fieldKind-${field.kind}` }, field.kind === 'observation' ? 'Observation' : 'Interpretation'),
    ` ${field.prompt}`));

  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  const choices = el('div', { class: 'choiceStack' });
  const multi = !!spec.multi;
  const current = draft[field.id];

  spec.options.forEach((opt) => {
    const selected = multi
      ? Array.isArray(current) && current.includes(opt.id)
      : current === opt.id;
    const btn = el('button', {
      type: 'button',
      class: `choiceBtn wide${selected ? ' active' : ''}`,
      'aria-pressed': String(selected)
    }, opt.label);
    btn.addEventListener('click', () => {
      if (multi) {
        const set = new Set(Array.isArray(draft[field.id]) ? draft[field.id] : []);
        if (set.has(opt.id)) set.delete(opt.id); else set.add(opt.id);
        draft[field.id] = [...set];
      } else {
        draft[field.id] = opt.id;
      }
      const { verdict, feedback: text } = scoreAnalysisAnswer(def.id, field.id, opt.id);
      if (text) showFeedback(feedback, text, verdict === 'correct' ? 'good' : (verdict === 'defensible' ? 'warn' : 'bad'));
      renderItem();
    });
    choices.appendChild(btn);
  });

  wrap.appendChild(choices);
  if (multi) wrap.appendChild(el('p', { class: 'fieldHint' }, 'More than one answer can be right here. Select every one you can support.'));

  const shown = multi ? (Array.isArray(current) ? current[current.length - 1] : null) : current;
  if (shown) {
    const { verdict, feedback: text } = scoreAnalysisAnswer(def.id, field.id, shown);
    if (text) showFeedback(feedback, text, verdict === 'correct' ? 'good' : (verdict === 'defensible' ? 'warn' : 'bad'));
  }
  wrap.appendChild(feedback);
  return wrap;
}

function missingFields() {
  const artifact = artifactByUid(activeUid);
  const def = artifactById(artifact.artifactId);
  const missing = [];
  ANALYSIS_FIELDS.forEach((field) => {
    if (field.id === 'confidence') {
      if (!draft.confidence) missing.push('confidence');
      return;
    }
    if (!def.fields[field.id]) return;
    const v = draft[field.id];
    if (v === undefined || (Array.isArray(v) && !v.length)) missing.push(field.label.toLowerCase());
  });
  return missing;
}

function renderStatus() {
  const host = document.getElementById('labItemStatus');
  if (!host) return;
  clear(host);
  const missing = missingFields();
  if (missing.length) {
    host.appendChild(el('div', { class: 'noticeBox' }, `Still to record: ${missing.join(', ')}.`));
  }
  host.appendChild(actionRow(
    button('File this analysis', () => save(missing), missing.length ? 'secondary' : 'primary'),
    button('Back to the laboratory', () => {
      modal.close(ITEM_PANEL);
      openLab();
    }, 'secondary')));
}

function save(missing) {
  if (missing.length) {
    toast(`Complete the analysis first: ${missing.join(', ')}.`, 'warn');
    return;
  }
  const artifact = artifactByUid(activeUid);
  const def = artifactById(artifact.artifactId);
  const verdicts = {};
  Object.entries(draft).forEach(([fieldId, value]) => {
    if (fieldId === 'confidence') return;
    const answers = Array.isArray(value) ? value : [value];
    verdicts[fieldId] = answers.map((a) => scoreAnalysisAnswer(def.id, fieldId, a).verdict);
  });
  const revision = artifact.analysis ? 'revised' : 'first';
  recordAnalysis(activeUid, { ...draft }, verdicts);
  record(artifact.artifactId, 'analysed', {
    station: 4,
    unit: artifact.unit,
    level: artifact.level,
    confidence: draft.confidence,
    reason: revision
  });
  toast(revision === 'revised' ? 'Analysis revised. The earlier version is kept in the notebook.' : 'Analysis filed.', 'info');
  modal.close(ITEM_PANEL);
  openLab();
}

export function initLaboratory() {
  byId('closeLabBtn').addEventListener('click', () => modal.close(LIST_PANEL));
  byId('closeLabItemBtn').addEventListener('click', () => {
    modal.close(ITEM_PANEL);
    openLab();
  });
}
