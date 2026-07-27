/* Reusable panel building blocks shared by every station, so the same
   interaction pattern is written once and behaves identically everywhere. */

import { el, clear, replaceChildren } from '../core/dom.js';
import { announce } from './toast.js';

export function sectionHeading(text, sub) {
  return el('div', { class: 'sectionHeading' },
    el('h3', {}, text),
    sub ? el('p', { class: 'sectionSub' }, sub) : null);
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

export function showFeedback(node, message, tone = 'warn') {
  replaceChildren(node, el('p', { class: `feedback feedback-${tone}` }, message));
  announce(message);
}

export function emptyState(message) {
  return el('p', { class: 'emptyState' }, message);
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
