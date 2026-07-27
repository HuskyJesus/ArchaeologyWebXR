/* DOM helpers.

   Everything that puts learner-entered text on screen goes through `text()`
   or `el()` with a string child, both of which use textContent. There is no
   helper here that accepts raw HTML from a caller, which is deliberate: the
   previous build interpolated learner input into innerHTML in several
   places. Static markup is still built with innerHTML in a few internal
   renderers, but never with learner input in it. */

const cache = new Map();

/* Cached lookup by id. Elements in this project are created once in the HTML
   shell and never replaced, so caching is safe and avoids repeated queries
   in the render loop. */
export function byId(id) {
  if (cache.has(id)) return cache.get(id);
  const node = document.getElementById(id);
  if (node) cache.set(id, node);
  return node;
}

export function clearElementCache() {
  cache.clear();
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

/* el('div', {class:'x', onClick:fn}, 'text', childNode, [more, children]) */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === false) return;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'html') node.innerHTML = value; // static markup only
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  });
  appendChildren(node, children);
  return node;
}

function appendChildren(node, children) {
  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.appendChild(typeof child === 'object' && child.nodeType ? child : document.createTextNode(String(child)));
  });
}

export function clear(node) {
  if (!node) return node;
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function setText(node, value) {
  if (node) node.textContent = value === null || value === undefined ? '' : String(value);
  return node;
}

export function replaceChildren(node, ...children) {
  clear(node);
  appendChildren(node, children);
  return node;
}

export function show(node, visible = true) {
  if (node) node.style.display = visible ? '' : 'none';
  return node;
}

/* Buttons that behave as a mutually exclusive group, with aria-pressed kept
   in sync. Returns a setter so the caller can change selection later. */
export function radioGroup(container, options, onChange, initial = null) {
  clear(container);
  let current = initial;
  const buttons = options.map((opt) => {
    const btn = el('button', {
      type: 'button',
      class: 'choiceBtn' + (opt.id === current ? ' active' : ''),
      'aria-pressed': String(opt.id === current)
    }, opt.label);
    btn.addEventListener('click', () => {
      current = opt.id;
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      onChange(opt.id, opt);
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

export function pill(label, tone = 'warn') {
  return el('span', { class: `pill pill-${tone}` }, label);
}

export function row(leftContent, rightContent) {
  return el('div', { class: 'recordRow' },
    el('span', { class: 'recordRowMain' }, leftContent),
    rightContent ? el('span', { class: 'recordRowSide' }, rightContent) : null);
}

export function heading(level, textValue) {
  return el(`h${level}`, {}, textValue);
}

export function para(textValue, cls) {
  return el('p', cls ? { class: cls } : {}, textValue);
}

/* Escapes a string for safe inclusion in a CSV cell. */
export function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

export function isTouchLikely() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
}
