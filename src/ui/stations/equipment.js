/* Station 1: Preparing for the Field. */

import { byId, el, clear, replaceChildren } from '../../core/dom.js';
import { KIT_SECTIONS, EQUIPMENT_ITEMS, EQUIPMENT_JUSTIFY, CAPABILITY_LABELS, RETRIEVAL_COST_DAYS, itemById } from '../../data/equipment.js';
import { SITE } from '../../data/site.js';
import { state, toggleEquipment, recordJustification, prepareKit, retrieveEquipment } from '../../core/state.js';
import { record, recordOnce } from '../../core/telemetry.js';
import * as modal from '../modal.js';
import { toast } from '../toast.js';
import { button, actionRow, showFeedback } from '../components.js';
import { showBriefing } from '../briefing.js';

const PANEL = 'equipmentOverlay';

export function openEquipment() {
  modal.open({ id: PANEL, dismissible: state.equipment.prepared, initialFocus: '.itemCard' });
  render();
}

function render() {
  const host = byId('equipmentSections');
  clear(host);

  KIT_SECTIONS.forEach((section) => {
    const items = EQUIPMENT_ITEMS.filter((i) => i.section === section.id);
    if (!items.length) return;
    const wrap = el('section', { class: 'kitSection' },
      el('h3', {}, section.label),
      el('p', { class: 'sectionSub' }, section.blurb));
    const grid = el('div', { class: 'itemGrid' });
    items.forEach((item) => grid.appendChild(itemCard(item)));
    wrap.appendChild(grid);
    host.appendChild(wrap);
  });

  renderSummary();
}

function itemCard(item) {
  const selected = state.equipment.selected.includes(item.id);
  const card = el('button', {
    type: 'button',
    class: `itemCard${selected ? ' selected' : ''}`,
    'aria-pressed': String(selected)
  },
  el('span', { class: 'itemCardLabel' }, item.label),
  item.note ? el('span', { class: 'itemCardNote' }, item.note) : null,
  item.justify ? el('span', { class: 'itemCardTag' }, 'Explain your choice') : null);

  card.addEventListener('click', () => {
    const nowSelected = toggleEquipment(item.id);
    card.classList.toggle('selected', nowSelected);
    card.setAttribute('aria-pressed', String(nowSelected));
    record(item.id, 'selected', { included: nowSelected, station: 1 });
    if (nowSelected && item.justify && EQUIPMENT_JUSTIFY[item.id]) showJustification(item);
    else if (!nowSelected) clear(byId('equipmentJustify'));
    renderSummary();
  });
  return card;
}

function showJustification(item) {
  const box = byId('equipmentJustify');
  const data = EQUIPMENT_JUSTIFY[item.id];
  clear(box);
  box.appendChild(el('div', { class: 'justifyPrompt' }, `${item.label}: ${data.prompt}`));
  const choices = el('div', { class: 'choiceStack' });
  const feedback = el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  data.choices.forEach((choice) => {
    const btn = el('button', { type: 'button', class: 'choiceBtn wide' }, choice.text);
    btn.addEventListener('click', () => {
      choices.querySelectorAll('button').forEach((b) => b.classList.remove('chosen-good', 'chosen-bad'));
      btn.classList.add(choice.correct ? 'chosen-good' : 'chosen-bad');
      recordJustification(item.id, choice.text, choice.correct);
      record(item.id, 'classified', { correct: choice.correct, station: 1 });
      showFeedback(feedback, choice.feedback, choice.correct ? 'good' : 'bad');
    });
    choices.appendChild(btn);
  });
  box.appendChild(choices);
  box.appendChild(feedback);
  box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function renderSummary() {
  const summary = byId('equipmentSummary');
  const caps = new Set();
  state.equipment.selected.forEach((id) => {
    const item = itemById(id);
    if (item && item.capability) caps.add(item.capability);
  });
  const capList = [...caps].map((c) => CAPABILITY_LABELS[c]).filter(Boolean).sort();
  replaceChildren(summary,
    el('div', { class: 'kitSummaryTitle' }, `Kit: ${state.equipment.selected.length} item${state.equipment.selected.length === 1 ? '' : 's'}`),
    capList.length
      ? el('div', { class: 'kitSummaryBody' }, `This kit can do: ${capList.join(', ')}.`)
      : el('div', { class: 'kitSummaryBody' }, 'Nothing selected yet. The kit determines what you can do for the rest of the project.'));
}

export function initEquipment() {
  byId('prepareKitBtn').addEventListener('click', onPrepare);
  byId('closeEquipmentBtn').addEventListener('click', () => {
    if (!state.equipment.prepared) {
      toast('You need a kit before leaving the vehicle. Select what you are taking, then prepare the kit.', 'warn');
      return;
    }
    modal.close(PANEL);
  });
}

function onPrepare() {
  const selected = new Set(state.equipment.selected);
  if (!selected.size) {
    toast('Select at least the tools you intend to work with.', 'warn');
    return;
  }
  const appropriate = EQUIPMENT_ITEMS.filter((i) => i.appropriate);
  const missing = appropriate.filter((i) => !selected.has(i.id));
  const wrong = EQUIPMENT_ITEMS.filter((i) => !i.appropriate && selected.has(i.id));

  const wasPrepared = state.equipment.prepared;
  prepareKit();
  recordOnce('kitPrepared', 'equipment_kit', 'completed', {
    station: 1,
    included: state.equipment.selected.length,
    reason: `${missing.length} appropriate items left behind, ${wrong.length} inappropriate items taken`
  });

  modal.close(PANEL);
  if (wasPrepared) {
    toast('Kit updated.', 'info');
    return;
  }

  const lines = [];
  if (!missing.length && !wrong.length) {
    lines.push('That is a complete kit. Everything this project needs, and nothing that does not belong on it.');
  } else {
    if (wrong.length) {
      lines.push(`Leave these behind: ${wrong.map((i) => i.label).join(', ')}. None of them have a place on a controlled excavation, and one or two of them could cause real damage.`);
    }
    if (missing.length) {
      lines.push(`You are going out without: ${missing.map((i) => i.label).join(', ')}.`);
      lines.push(`I am not going to stop you. You will find out what each of those is for when you need it and it is not in the bag. You can send someone back for anything you have forgotten, but it costs the project ${RETRIEVAL_COST_DAYS} day each time.`);
    }
  }
  lines.push('Head down to the survey transect when you are ready.');
  showBriefing(`${SITE.supervisorName}`, lines.join('\n\n'));
}

/* Offered by any station that needs a capability the learner does not have.
   Returns true if the item was fetched. */
export function offerRetrieval(itemId, onDone) {
  const item = itemById(itemId);
  if (!item) return false;
  if (state.equipment.selected.includes(itemId)) return true;
  const host = byId('retrievalOverlayBody');
  clear(host);
  host.appendChild(el('p', {}, `Your kit does not include the ${item.label.toLowerCase()}. ${item.note || ''}`));
  host.appendChild(el('p', {}, `Someone can drive back to the equipment store and fetch it, which costs the project ${RETRIEVAL_COST_DAYS} day. You can also carry on without it and record a weaker result.`));
  const actions = actionRow(
    button(`Fetch the ${item.label.toLowerCase()} (${RETRIEVAL_COST_DAYS} day)`, () => {
      retrieveEquipment(itemId, RETRIEVAL_COST_DAYS);
      record(itemId, 'selected', { included: true, reason: 'retrieved mid-project', days: RETRIEVAL_COST_DAYS });
      modal.close('retrievalOverlay');
      toast(`${item.label} retrieved. ${RETRIEVAL_COST_DAYS} project day spent.`, 'info');
      if (onDone) onDone(true);
    }),
    button('Carry on without it', () => {
      modal.close('retrievalOverlay');
      if (onDone) onDone(false);
    }, 'secondary'));
  host.appendChild(actions);
  modal.open({ id: 'retrievalOverlay', dismissible: false });
  return false;
}
