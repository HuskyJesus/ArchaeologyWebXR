/* Panel manager.

   One place controls every overlay: opening, focus trapping, focus
   restoration, the dismissible flag that stops Escape from skipping a
   required decision, and the stack ordering that lets a panel open on top of
   another and return correctly.

   Panels are also announced to the XR layer, which mirrors whichever panel
   is on top into a world-space surface so headset users get the same
   activities rather than an invisible HTML overlay. */

import { byId, qsa } from '../core/dom.js';
import { emit, EVENTS } from '../core/events.js';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const stack = [];

function focusablesIn(el) {
  return qsa(FOCUSABLE, el).filter((n) => n.offsetParent !== null || n === document.activeElement);
}

function onKeydown(event) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (event.key === 'Escape') {
    event.stopPropagation();
    if (top.dismissible) {
      event.preventDefault();
      close(top.id);
    }
    return;
  }
  if (event.key !== 'Tab') return;
  const items = focusablesIn(top.el);
  if (!items.length) {
    event.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  } else if (!top.el.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  }
}

export function open(options) {
  const opts = typeof options === 'string' ? { id: options } : options;
  const { id, dismissible = true, initialFocus = null, onClose = null, title = null } = opts;
  const el = byId(id);
  if (!el) {
    console.warn(`[modal] no element with id "${id}"`);
    return null;
  }
  const existing = stack.find((m) => m.id === id);
  if (existing) return existing;

  const previousFocus = document.activeElement;
  el.classList.add('open');
  el.setAttribute('aria-modal', 'true');
  if (!el.getAttribute('role')) el.setAttribute('role', 'dialog');
  if (!el.getAttribute('aria-labelledby')) {
    const headingEl = el.querySelector('h2, h3');
    if (headingEl) {
      if (!headingEl.id) headingEl.id = `${id}-heading`;
      el.setAttribute('aria-labelledby', headingEl.id);
    }
  }
  if (document.pointerLockElement) document.exitPointerLock();

  const entry = { id, el, dismissible, onClose, previousFocus, title };
  stack.push(entry);
  if (stack.length === 1) document.addEventListener('keydown', onKeydown, true);

  requestAnimationFrame(() => {
    const target = (initialFocus && el.querySelector(initialFocus)) || focusablesIn(el)[0] || el;
    if (target && typeof target.focus === 'function') target.focus();
  });

  emit(EVENTS.panelOpened, entry);
  return entry;
}

export function close(id) {
  const idx = stack.findIndex((m) => m.id === id);
  if (idx === -1) return false;
  const entry = stack[idx];
  entry.el.classList.remove('open');
  entry.el.removeAttribute('aria-modal');
  stack.splice(idx, 1);
  if (!stack.length) document.removeEventListener('keydown', onKeydown, true);
  if (entry.previousFocus && document.body.contains(entry.previousFocus) && typeof entry.previousFocus.focus === 'function') {
    entry.previousFocus.focus();
  }
  if (typeof entry.onClose === 'function') entry.onClose();
  emit(EVENTS.panelClosed, entry);
  if (stack.length) emit(EVENTS.panelOpened, stack[stack.length - 1]);
  return true;
}

export function closeTop() {
  const top = stack[stack.length - 1];
  if (top && top.dismissible) return close(top.id);
  return false;
}

export function closeAll() {
  [...stack].reverse().forEach((entry) => close(entry.id));
}

export function isOpen(id) {
  return stack.some((m) => m.id === id);
}

export function anyOpen() {
  return stack.length > 0;
}

export function top() {
  return stack[stack.length - 1] || null;
}

export function setDismissible(id, value) {
  const entry = stack.find((m) => m.id === id);
  if (entry) entry.dismissible = value;
}
