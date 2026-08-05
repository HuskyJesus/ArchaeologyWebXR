/* Reusable panel building blocks shared by every station, so the same
   interaction pattern is written once and behaves identically everywhere. */

import { el, clear, replaceChildren } from '../core/dom.js';
import { announce } from './toast.js';

export function sectionHeading(text, sub) {
  return el('div', { class: 'sectionHeading' },
    el('h3', {}, text),
    sub ? el('p', { class: 'sectionSub' }, sub) : null);
}

/* A single-select group built from native radio inputs, used for confidence
   and for short option sets. The radios are visually presented as buttons but
   keep their native semantics: screen readers announce "radio, N of M", and
   the arrow keys move the selection exactly as they do in any HTML form. */
let optionGroupSeq = 0;

export function optionGroup(container, options, config = {}) {
  const { initial = null, onChange = null, ariaLabel = null } = config;
  clear(container);
  optionGroupSeq += 1;
  const name = `optionGroup-${optionGroupSeq}`;

  const group = el('fieldset', { class: 'choiceGroup radioRow' },
    ariaLabel ? el('legend', { class: 'visuallyHidden' }, ariaLabel) : null);
  const inputs = options.map((opt) => {
    const input = el('input', { type: 'radio', name, value: opt.id });
    input.checked = opt.id === initial;
    input.addEventListener('change', () => {
      if (input.checked && onChange) onChange(opt.id, opt);
    });
    group.appendChild(el('label', { class: 'choiceBtn small radioChoice' },
      input, el('span', {}, opt.label || opt.text)));
    return input;
  });
  container.appendChild(group);

  return {
    get value() {
      const checked = inputs.find((i) => i.checked);
      return checked ? checked.value : null;
    },
    set(id) {
      inputs.forEach((i) => { i.checked = i.value === id; });
    }
  };
}

/* A tab strip following the standard tabs pattern: real tab semantics, a
   roving tabindex, and arrow-key movement with automatic activation. Home and
   End jump to the first and last tab. The caller re-renders on selection and
   passes focusActive=true when the change came from the keyboard, so focus
   follows the selected tab across the rebuild. */
export function tabStrip(strip, panel, tabs, activeId, onSelect, focusActive = false) {
  clear(strip);
  strip.setAttribute('role', 'tablist');
  const buttons = tabs.map((tab, index) => {
    const selected = tab.id === activeId;
    const btn = el('button', {
      type: 'button',
      id: `${strip.id}-tab-${tab.id}`,
      class: `tabBtn${selected ? ' active' : ''}`,
      role: 'tab',
      'aria-selected': String(selected),
      'aria-controls': panel.id,
      tabindex: selected ? '0' : '-1'
    }, tab.label);
    btn.addEventListener('click', () => onSelect(tab.id, false));
    btn.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      onSelect(tabs[next].id, true);
    });
    strip.appendChild(btn);
    return btn;
  });
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `${strip.id}-tab-${activeId}`);
  if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '0');
  if (focusActive) {
    const active = buttons.find((b) => b.getAttribute('aria-selected') === 'true');
    if (active) active.focus();
  }
  return buttons;
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
