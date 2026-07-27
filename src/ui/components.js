/* Reusable panel building blocks shared by every station, so the same
   interaction pattern is written once and behaves identically everywhere. */

import { el, clear, replaceChildren } from '../core/dom.js';
import { announce } from './toast.js';

export const VERDICT_TONE = {
  correct: 'good',
  best: 'good',
  supported: 'good',
  defensible: 'warn',
  conditional: 'warn',
  partial: 'warn',
  incorrect: 'bad',
  poor: 'bad',
  unsupported: 'bad',
  overreach: 'bad'
};

export function sectionHeading(text, sub) {
  return el('div', { class: 'sectionHeading' },
    el('h3', {}, text),
    sub ? el('p', { class: 'sectionSub' }, sub) : null);
}

/* A list of exclusive choices that reveals feedback once one is taken.
   `onChoose` receives the chosen option. Returns a controller. */
export function choiceList(container, options, onChoose, config = {}) {
  const { lockAfterChoice = true, feedbackTarget = null, labelKey = 'text' } = config;
  clear(container);
  const feedbackEl = feedbackTarget || el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
  const buttons = [];
  let chosen = null;

  options.forEach((opt) => {
    const btn = el('button', { type: 'button', class: 'choiceBtn wide' }, opt[labelKey] || opt.label || opt.id);
    btn.addEventListener('click', () => {
      if (chosen && lockAfterChoice) return;
      chosen = opt;
      const tone = VERDICT_TONE[opt.verdictKey || (opt.correct ? 'correct' : (opt.defensible ? 'defensible' : 'incorrect'))] || 'warn';
      buttons.forEach((b) => {
        if (lockAfterChoice) b.disabled = true;
        b.classList.remove('chosen-good', 'chosen-warn', 'chosen-bad');
      });
      btn.classList.add(`chosen-${tone}`);
      btn.disabled = false;
      btn.setAttribute('aria-pressed', 'true');
      if (opt.feedback) {
        replaceChildren(feedbackEl, el('p', { class: `feedback feedback-${tone}` }, opt.feedback));
        announce(opt.feedback);
      }
      onChoose(opt, { feedbackEl, buttons });
    });
    buttons.push(btn);
    container.appendChild(btn);
  });

  if (!feedbackTarget) container.appendChild(feedbackEl);
  return { buttons, feedbackEl, get chosen() { return chosen; } };
}

/* A multi-select list with a confirm action. */
export function checkboxList(container, options, config = {}) {
  const { name = 'opt', initial = [] } = config;
  clear(container);
  const chosen = new Set(initial);
  options.forEach((opt) => {
    const input = el('input', { type: 'checkbox', value: opt.id, id: `${name}-${opt.id}` });
    input.checked = chosen.has(opt.id);
    input.addEventListener('change', () => {
      if (input.checked) chosen.add(opt.id);
      else chosen.delete(opt.id);
      if (typeof config.onChange === 'function') config.onChange([...chosen]);
    });
    const label = el('label', { class: 'checkRow', for: `${name}-${opt.id}` }, input, el('span', {}, opt.label || opt.text));
    container.appendChild(label);
  });
  return { get value() { return [...chosen]; } };
}

/* A single-select group rendered as buttons, used for confidence and for
   short option sets where radio semantics read better than a dropdown. */
export function optionGroup(container, options, config = {}) {
  const { initial = null, onChange = null, ariaLabel = null } = config;
  clear(container);
  if (ariaLabel) {
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', ariaLabel);
  }
  let current = initial;
  const buttons = options.map((opt) => {
    const btn = el('button', {
      type: 'button',
      class: 'choiceBtn small' + (opt.id === current ? ' active' : ''),
      'aria-pressed': String(opt.id === current)
    }, opt.label || opt.text);
    btn.addEventListener('click', () => {
      current = opt.id;
      buttons.forEach((b, i) => {
        const active = options[i].id === current;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      if (onChange) onChange(opt.id, opt);
    });
    container.appendChild(btn);
    return btn;
  });
  return {
    get value() { return current; },
    set(id) {
      current = id;
      buttons.forEach((b, i) => {
        const active = options[i].id === id;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
    }
  };
}

export function feedbackBox() {
  return el('div', { class: 'feedbackBox', role: 'status', 'aria-live': 'polite' });
}

export function showFeedback(node, message, tone = 'warn') {
  replaceChildren(node, el('p', { class: `feedback feedback-${tone}` }, message));
  announce(message);
}

export function errorText(message) {
  return el('div', { class: 'errorText', role: 'alert' }, message);
}

export function recordCard(title, lines, tone) {
  return el('div', { class: `recordCard${tone ? ` tone-${tone}` : ''}` },
    el('div', { class: 'recordCardTitle' }, title),
    ...lines.filter(Boolean).map((line) => el('div', { class: 'recordCardLine' }, line)));
}

export function emptyState(message) {
  return el('p', { class: 'emptyState' }, message);
}

export function fieldLabel(text, hint) {
  return el('div', { class: 'fieldLabel' },
    el('span', {}, text),
    hint ? el('span', { class: 'fieldHint' }, hint) : null);
}

export function actionRow(...buttons) {
  return el('div', { class: 'actionRow' }, ...buttons.filter(Boolean));
}

export function button(label, onClick, variant = 'primary') {
  return el('button', { type: 'button', class: `btn ${variant}`, onClick }, label);
}

export function progressLine(done, total, label) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return el('div', { class: 'progressLine' },
    el('div', { class: 'progressLabel' }, `${label}: ${done} of ${total}`),
    el('div', { class: 'progressTrack', role: 'progressbar', 'aria-valuenow': String(done), 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-label': label },
      el('div', { class: 'progressFill', style: { width: `${pct}%` } })));
}
