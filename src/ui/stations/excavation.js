/* Station 3: Excavation.

   The engine walks the level scripts in src/data/excavation.js. Every
   decision writes into the level record, and the level record is what
   determines provenience, which finds are recovered, which are lost, and
   whether a dating sample is usable. */

import { byId, el, clear } from '../../core/dom.js';
import { unitById } from '../../data/site.js';
import { levelsForUnit } from '../../data/excavation.js';
import { artifactById } from '../../data/artifacts.js';
import { featureById } from '../../data/features.js';
import {
  state, openUnit, setActiveUnit, unitProgress,
  advanceStep, completeLevel, levelsCompleted, computeLevelProvenience, hasCapability
} from '../../core/state.js';
import { applyStepChoice, resolveLevel } from '../../core/excavationEngine.js';
import { record, recordOnce } from '../../core/telemetry.js';
import * as modal from '../modal.js';
import { toast } from '../toast.js';
import { showBriefing } from '../briefing.js';
import { button, actionRow, showFeedback, sectionHeading, progressLine, emptyState } from '../components.js';
import { availableUnits } from './survey.js';
import { offerRetrieval } from './equipment.js';
import { openFeatureRecord } from './features.js';
import { refreshUnitVisual } from '../../scene/units.js';

const PANEL = 'excavationOverlay';
const CHOICE_PANEL = 'unitChoiceOverlay';

/* Capability an option needs before it can be taken at all. */
const CAPABILITY_ITEM = {
  photograph: 'camera',
  photoScale: 'scale',
  screening: 'screen',
  flotation: 'finescreen',
  sampling: 'foil',
  soilColour: 'munsell',
  preciseProvenience: 'totalstation',
  depth: 'linelevel',
  measure: 'tape',
  bagging: 'bags',
  shoring: 'shoring'
};

/* ---------- unit choice ---------- */

export function openUnitChoice() {
  modal.open({ id: CHOICE_PANEL, dismissible: true });
  renderUnitChoice();
}

function renderUnitChoice() {
  const host = byId('unitChoiceList');
  clear(host);

  const recommended = state.survey.recommendation ? state.survey.recommendation.unitId : null;
  if (!recommended) {
    host.appendChild(emptyState('File a unit recommendation from the survey summary before opening ground.'));
    return;
  }

  const opened = state.units.opened;
  if (opened.length) {
    host.appendChild(sectionHeading('Open units', null));
    opened.forEach((unitId) => {
      const unit = unitById(unitId);
      const prog = unitProgress(unitId) || {};
      const done = levelsCompleted(unitId);
      const total = levelsForUnit(unitId).length;
      const row = el('div', { class: 'recordCard tone-good' },
        el('div', { class: 'recordCardTitle' }, unit.label),
        el('div', { class: 'recordCardLine' }, `${done} of ${total} levels excavated.`));
      if (!prog.complete) {
        row.appendChild(actionRow(button('Continue excavating', () => {
          setActiveUnit(unitId);
          modal.close(CHOICE_PANEL);
          openExcavation();
        })));
      }
      host.appendChild(row);
    });
  }

  const canOpenAnother = opened.length === 0
    || (opened.every((u) => (unitProgress(u) || {}).complete) && state.daysRemaining >= 6);

  host.appendChild(sectionHeading(opened.length ? 'Open a further unit' : 'Choose where to open ground',
    opened.length
      ? (canOpenAnother
        ? 'There are enough days left to open one more unit. A second unit samples a different part of the site and produces different, compatible evidence.'
        : 'There is not enough time left to open another unit, or the current unit is unfinished.')
      : 'Opening a unit commits project days. The placement you file is the one you should defend in the report.'));

  availableUnits().forEach(({ unit, unlocked, reason }) => {
    if (opened.includes(unit.id)) return;
    const isRecommended = unit.id === recommended;
    const weak = unit.placementQuality === 'weak';
    const card = el('div', { class: `recordCard${isRecommended ? ' tone-good' : ''}` },
      el('div', { class: 'recordCardTitle' }, unit.label + (isRecommended ? ' (your recommendation)' : '')),
      el('div', { class: 'recordCardLine' }, unlocked ? unit.hint : reason),
      el('div', { class: 'recordCardLine subtle' }, unit.theme));
    if (unlocked && canOpenAnother) {
      const extra = isRecommended ? 0 : 1;
      const cost = unit.openCostDays + extra;
      card.appendChild(actionRow(button(
        `Open this unit (${cost} project days)`,
        () => commitUnit(unit, cost, isRecommended, weak)
      , isRecommended ? 'primary' : 'secondary')));
      if (!isRecommended) {
        card.appendChild(el('div', { class: 'recordCardLine subtle' },
          'Opening a unit other than the one you recommended costs an extra day of re-staking, and the report will note the difference.'));
      }
    }
    host.appendChild(card);
  });
}

function commitUnit(unit, cost, isRecommended, weak) {
  openUnit(unit.id, cost, `Opened ${unit.label}`);
  recordOnce(`unitOpen:${unit.id}`, unit.id, 'selected', { station: 3, quality: unit.placementQuality, days: cost });
  refreshUnitVisual(unit.id);
  modal.close(CHOICE_PANEL);

  const lines = [`${unit.label} is open and staked out from the datum.`];
  if (!isRecommended) {
    lines.push('This is not the unit you recommended. That is allowed, and sometimes it is right, but the report needs to say why the recommendation was set aside.');
  }
  if (weak) {
    lines.push('Nothing in your survey record points to deposits here. If two levels come up empty, the professional response is to record the negative result properly and move the remaining effort somewhere the evidence supports.');
  }
  lines.push('Work down one level at a time, and record before you remove.');
  showBriefing(unit.label, lines.join('\n\n'), () => openExcavation());
}

/* ---------- excavation ---------- */

export function openExcavation() {
  const unitId = activeUnitId();
  if (!unitId) {
    openUnitChoice();
    return;
  }
  setActiveUnit(unitId);
  modal.open({ id: PANEL, dismissible: true });
  renderLevel();
}

export function activeUnitId() {
  if (state.units.active && !(unitProgress(state.units.active) || {}).complete) return state.units.active;
  const unfinished = state.units.opened.find((u) => !(unitProgress(u) || {}).complete);
  return unfinished || state.units.active || state.units.opened[0] || null;
}

function renderLevel() {
  const unitId = activeUnitId();
  const unit = unitById(unitId);
  const prog = unitProgress(unitId);
  const levels = levelsForUnit(unitId);
  const host = byId('excavationBody');
  clear(host);

  byId('excavationTitle').textContent = `Excavating ${unit.label}`;

  if (!prog || prog.complete || prog.levelIndex >= levels.length) {
    renderUnitComplete(host, unitId);
    return;
  }

  const levelIndex = prog.levelIndex;
  const level = levels[levelIndex];

  host.appendChild(progressLine(levelIndex, levels.length, 'Levels completed'));
  host.appendChild(el('div', { class: 'levelHeader' },
    el('h3', {}, `Level ${level.level}: ${level.depthLabel}`),
    el('div', { class: 'levelMeta' },
      el('span', {}, `Soil: ${level.soil.name}`),
      el('span', {}, hasCapability('soilColour') ? `Munsell ${level.soil.munsell}` : 'Munsell notation unavailable without the colour book'),
      el('span', {}, level.context))));
  host.appendChild(el('p', { class: 'levelNarrative' }, level.narrative));

  const stepIndex = Math.min(prog.stepIndex, level.steps.length);
  if (stepIndex >= level.steps.length) {
    renderLevelSummary(host, unitId, levelIndex, level);
    return;
  }

  const step = level.steps[stepIndex];
  host.appendChild(el('div', { class: 'stepCounter' }, `Decision ${stepIndex + 1} of ${level.steps.length}`));
  host.appendChild(el('p', { class: 'promptLine' }, step.prompt));
  if (step.detail) host.appendChild(el('p', { class: 'promptDetail' }, step.detail));

  const choices = el('div', { class: 'choiceStack', role: 'group', 'aria-label': step.prompt });
  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });

  step.options.forEach((option) => {
    const missing = (option.requires || []).filter((cap) => !hasCapability(cap));
    const btn = el('button', { type: 'button', class: `choiceBtn wide${missing.length ? ' unavailable' : ''}` },
      el('span', { class: 'choiceMain' }, option.text),
      missing.length ? el('span', { class: 'choiceHint' }, `Your kit cannot do this: ${missing.join(', ')}.`) : null);
    btn.addEventListener('click', () => {
      if (missing.length) {
        const needed = CAPABILITY_ITEM[missing[0]];
        offerRetrieval(needed, (fetched) => {
          if (fetched) renderLevel();
          else toast('Choose an option your kit can actually carry out.', 'warn');
        });
        return;
      }
      applyOption(unitId, levelIndex, level, step, option, choices, feedback);
    });
    choices.appendChild(btn);
  });

  host.appendChild(choices);
  host.appendChild(feedback);
}

function applyOption(unitId, levelIndex, level, step, option, choicesEl, feedbackEl) {
  applyStepChoice(unitId, levelIndex, step, option);

  record(`${unitId}-L${level.level}-${step.id}`, stepVerb(step.kind), {
    station: 3,
    unit: unitId,
    level: level.level,
    answer: option.id,
    correct: !!option.correct
  });

  choicesEl.querySelectorAll('button').forEach((b) => { b.disabled = true; });
  const tone = option.correct ? 'good' : (option.defensible ? 'warn' : 'bad');
  showFeedback(feedbackEl, option.feedback, tone);

  const next = button('Continue', () => {
    advanceStep(unitId);
    renderLevel();
  });
  feedbackEl.appendChild(actionRow(next));
  requestAnimationFrame(() => next.focus());
}

function stepVerb(kind) {
  if (kind === 'photo') return 'photographed';
  if (kind === 'record') return 'measured';
  if (kind === 'soil' || kind === 'observe') return 'observed';
  if (kind === 'feature') return 'interpreted';
  return 'documented';
}

function renderLevelSummary(host, unitId, levelIndex, level) {
  const outcome = resolveLevel(unitId, levelIndex);
  outcome.recovered.forEach((entry) => {
    recordOnce(`find:${entry.uid}`, entry.artifactId, 'documented', {
      station: 3, unit: unitId, level: entry.level, provenience: entry.provenience
    });
  });

  host.appendChild(sectionHeading(`Level ${level.level} closed`, `Provenience recorded for this level: ${outcome.provenience}.`));

  const list = el('div', { class: 'recordList' });
  if (!outcome.recovered.length && !outcome.lost.length && !outcome.sample) {
    list.appendChild(emptyState(level.sterile
      ? 'Nothing was recovered, which is the expected result at this depth.'
      : 'Nothing was recovered from this level.'));
  }
  outcome.recovered.forEach((entry) => {
    const def = artifactById(entry.artifactId);
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, def ? def.name : entry.artifactId),
      el('span', { class: `recordRowSide pill pill-${entry.provenience === 'good' ? 'good' : (entry.provenience === 'partial' ? 'warn' : 'bad')}` }, `${entry.provenience} provenience`)));
  });
  outcome.lost.forEach((entry) => {
    const def = artifactById(entry.artifactId);
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, `${def ? def.name : entry.artifactId} (not recovered)`),
      el('span', { class: 'recordRowSide pill pill-bad' }, 'lost')));
  });
  if (outcome.sample) {
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, 'Charcoal sample collected'),
      el('span', { class: `recordRowSide pill pill-${outcome.sample.quality === 'clean' ? 'good' : 'bad'}` }, outcome.sample.quality)));
  }
  host.appendChild(list);

  if (outcome.feature) {
    const def = featureById(outcome.feature.featureId);
    host.appendChild(el('div', { class: 'recordCard tone-warn' },
      el('div', { class: 'recordCardTitle' }, `Feature exposed: ${def ? def.name : outcome.feature.featureId}`),
      el('div', { class: 'recordCardLine' }, outcome.feature.integrity === 'good'
        ? 'It is intact and waiting for a full record.'
        : 'It was damaged during excavation. What can still be recorded should be.'),
      actionRow(button('Record this feature now', () => {
        modal.close(PANEL);
        openFeatureRecord(outcome.feature.featureId, () => openExcavation());
      }))));
  }

  const levels = levelsForUnit(unitId);
  const isLast = levelIndex + 1 >= levels.length;
  host.appendChild(actionRow(
    button(isLast ? 'Close the unit' : `Open level ${level.level + 1}`, () => {
      completeLevel(unitId, levelIndex);
      refreshUnitVisual(unitId);
      if (isLast) {
        modal.close(PANEL);
        onUnitComplete(unitId);
      } else {
        renderLevel();
      }
    }),
    button('Step away for now', () => {
      completeLevel(unitId, levelIndex);
      refreshUnitVisual(unitId);
      modal.close(PANEL);
    }, 'secondary')));
}


function renderUnitComplete(host, unitId) {
  const unit = unitById(unitId);
  const levels = levelsForUnit(unitId);
  host.appendChild(sectionHeading(`${unit.label} is closed`,
    `All ${levels.length} levels excavated and the unit recorded.`));
  const proveniences = Object.keys((unitProgress(unitId) || {}).levels || {})
    .map((idx) => computeLevelProvenience(unitId, Number(idx)));
  host.appendChild(el('p', {},
    `${proveniences.filter((p) => p === 'good').length} of ${proveniences.length} levels were documented to full provenience.`));
  host.appendChild(actionRow(
    button('Open another unit', () => { modal.close(PANEL); openUnitChoice(); }, 'secondary'),
    button('Close', () => modal.close(PANEL), 'secondary')));
}

function onUnitComplete(unitId) {
  const unit = unitById(unitId);
  recordOnce(`unitComplete:${unitId}`, unitId, 'completed', { station: 3 });
  const lines = [`${unit.label} is finished and backfilled.`];
  const artifacts = state.artifacts.filter((a) => a.unit === unitId);
  const features = state.features.filter((f) => f.unit === unitId);
  lines.push(`${artifacts.length} find${artifacts.length === 1 ? '' : 's'} recovered and ${features.length} feature${features.length === 1 ? '' : 's'} exposed.`);
  if (state.features.some((f) => f.unit === unitId && !f.complete)) {
    lines.push('At least one feature record is still incomplete. Finish it before the interpretation stage, because an interpretation without observations behind it is only an opinion.');
  }
  lines.push('Take the finds to the field laboratory next. Nothing can be analysed until it gets there.');
  if (state.daysRemaining >= 6) {
    lines.push(`There are ${state.daysRemaining} project days left. That is enough to open a second unit if you want a different part of the site story.`);
  }
  showBriefing('Unit closed', lines.join('\n\n'));
}

export function initExcavation() {
  byId('closeExcavationBtn').addEventListener('click', () => modal.close(PANEL));
  byId('closeUnitChoiceBtn').addEventListener('click', () => modal.close(CHOICE_PANEL));
}
