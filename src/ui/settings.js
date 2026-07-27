/* Settings, comfort and accessibility controls, and save management. */

import { byId, el, clear, prefersReducedMotion } from '../core/dom.js';
import { state, setSetting, resetState } from '../core/state.js';
import { clearSave, flushSave, saveSettings } from '../core/save.js';
import { emit, EVENTS } from '../core/events.js';
import * as modal from './modal.js';
import { toast } from './toast.js';
import { button, actionRow, sectionHeading, optionGroup } from './components.js';

const PANEL = 'settingsOverlay';

export function openSettings() {
  modal.open({ id: PANEL, dismissible: true });
  render();
}

function render() {
  const host = byId('settingsBody');
  clear(host);

  host.appendChild(sectionHeading('Accessibility',
    'Saved in this browser and applied every visit. Your operating-system reduced-motion preference is respected automatically.'));
  host.appendChild(toggle('Guided Accessible Mode (no 3D graphics; full keyboard and screen-reader support)',
    state.settings.guidedMode, (v) => setSetting('guidedMode', v)));
  host.appendChild(el('p', { class: 'subtle' },
    'Guided Accessible Mode and the 3D view share the same investigation, so switching keeps all of your progress. The reduced motion, high contrast, camera and text-size options below apply to whichever mode you use.'));
  host.appendChild(actionRow(
    button('Reset accessibility preferences', resetAccessibility, 'secondary')));

  host.appendChild(sectionHeading('Display', null));
  host.appendChild(segment('Visual quality', [
    { id: 'low', label: 'Low' },
    { id: 'standard', label: 'Standard' },
    { id: 'high', label: 'High' }
  ], state.settings.quality, (id) => setSetting('quality', id)));

  host.appendChild(slider('Interface text size', 'textScale', 0.85, 1.5, 0.05, state.settings.textScale,
    (v) => `${Math.round(v * 100)} per cent`));

  host.appendChild(toggle('High contrast text and panels', state.settings.highContrast, (v) => setSetting('highContrast', v)));

  host.appendChild(sectionHeading('Movement and comfort', null));
  host.appendChild(slider('Look sensitivity', 'sensitivity', 0.4, 2, 0.05, state.settings.sensitivity,
    (v) => `${v.toFixed(2)} times`));
  host.appendChild(toggle('Camera bob while walking', state.settings.cameraBob, (v) => setSetting('cameraBob', v)));
  host.appendChild(toggle('Reduce motion (stops idle animation, water movement and pulsing)',
    state.settings.reducedMotion, (v) => setSetting('reducedMotion', v)));
  if (prefersReducedMotion()) {
    host.appendChild(el('p', { class: 'subtle' }, 'Your system already requests reduced motion, and that setting is being honoured.'));
  }

  host.appendChild(sectionHeading('Sound', null));
  host.appendChild(toggle('Mute site ambience', state.settings.muted, (v) => setSetting('muted', v)));
  host.appendChild(el('p', { class: 'subtle' },
    'Site ambience is wind, the river, and distant machinery. It carries no information, and a text equivalent is given in the notebook, so muting it loses nothing.'));

  host.appendChild(sectionHeading('Virtual reality comfort', 'These apply inside an immersive session.'));
  host.appendChild(segment('Locomotion', [
    { id: 'teleport', label: 'Teleport only' },
    { id: 'smooth', label: 'Smooth movement' }
  ], state.settings.xr.locomotion, (id) => setSetting('xr.locomotion', id)));
  host.appendChild(segment('Snap turn angle', [
    { id: '30', label: '30 degrees' },
    { id: '45', label: '45 degrees' },
    { id: '90', label: '90 degrees' }
  ], String(state.settings.xr.snapAngle), (id) => setSetting('xr.snapAngle', Number(id))));
  host.appendChild(toggle('Movement vignette during smooth movement', state.settings.xr.vignette, (v) => setSetting('xr.vignette', v)));

  host.appendChild(sectionHeading('Investigation', null));
  host.appendChild(actionRow(
    button('Start a new investigation', confirmReset, 'secondary')));
  host.appendChild(el('p', { class: 'subtle' },
    'Your work saves automatically to this browser. Starting a new investigation discards it.'));

  host.appendChild(el('details', { class: 'devTools' },
    el('summary', {}, 'Technical tools'),
    el('p', { class: 'subtle' }, 'For instructors and technical staff. Clearing local data removes the saved investigation and the stored preferences from this browser without reloading a new session.'),
    actionRow(button('Clear all local data', hardReset, 'secondary'))));
}

function segment(label, options, current, onChange) {
  const wrap = el('div', { class: 'settingRow' }, el('div', { class: 'fieldLabel' }, label));
  const host = el('div', { class: 'choiceRow' });
  optionGroup(host, options, {
    initial: current,
    ariaLabel: label,
    onChange: (id) => {
      onChange(id);
      saveSettings(state.settings);
    }
  });
  wrap.appendChild(host);
  return wrap;
}

function slider(label, path, min, max, step, current, format) {
  const id = `setting-${path.replace(/\./g, '-')}`;
  const wrap = el('div', { class: 'settingRow' });
  const valueEl = el('span', { class: 'settingValue' }, format(current));
  wrap.appendChild(el('label', { class: 'fieldLabel', for: id }, label));
  const input = el('input', {
    type: 'range', id, min: String(min), max: String(max), step: String(step), value: String(current)
  });
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    valueEl.textContent = format(v);
    setSetting(path, v);
    saveSettings(state.settings);
  });
  wrap.appendChild(el('div', { class: 'sliderRow' }, input, valueEl));
  return wrap;
}

function toggle(label, current, onChange) {
  const id = `toggle-${label.replace(/[^a-z]+/gi, '-').toLowerCase()}`;
  const input = el('input', { type: 'checkbox', id });
  input.checked = !!current;
  input.addEventListener('change', () => {
    onChange(input.checked);
    saveSettings(state.settings);
  });
  return el('label', { class: 'checkRow settingRow', for: id }, input, el('span', {}, label));
}

function confirmReset() {
  const host = byId('confirmBody');
  clear(host);
  host.appendChild(el('p', {},
    'Starting a new investigation permanently discards the saved one, including every record, decision and note.'));
  host.appendChild(el('p', {}, 'Export the CSV and the report first if you need them.'));
  host.appendChild(actionRow(
    button('Discard and start again', () => {
      clearSave();
      resetState();
      window.location.reload();
    }),
    button('Keep my investigation', () => modal.close('confirmOverlay'), 'secondary')));
  modal.open({ id: 'confirmOverlay', dismissible: true });
}

/* Returns the accessibility and comfort preferences to their defaults while
   still honouring the operating-system reduced-motion request. Does not touch
   the investigation itself. */
function resetAccessibility() {
  setSetting('textScale', 1);
  setSetting('highContrast', false);
  setSetting('cameraBob', true);
  setSetting('reducedMotion', prefersReducedMotion());
  setSetting('guidedMode', false);
  setSetting('quality', 'standard');
  saveSettings(state.settings);
  applyInterfaceSettings();
  render();
  toast('Accessibility preferences reset to their defaults.', 'info');
}

function hardReset() {
  clearSave();
  try {
    window.localStorage.removeItem('redstoneBluff.settings');
  } catch (e) { /* storage may be unavailable */ }
  toast('Local data cleared. Reload to start fresh.', 'info');
}

export function initSettings() {
  byId('closeSettingsBtn').addEventListener('click', () => {
    flushSave();
    modal.close(PANEL);
  });
  byId('closeConfirmBtn').addEventListener('click', () => modal.close('confirmOverlay'));
  applyInterfaceSettings();
  emit(EVENTS.settingsChanged, state.settings);
}

/* Applied at start-up and whenever settings change. */
export function applyInterfaceSettings() {
  const root = document.documentElement;
  root.style.setProperty('--text-scale', String(state.settings.textScale || 1));
  root.classList.toggle('high-contrast', !!state.settings.highContrast);
  root.classList.toggle('reduced-motion', !!state.settings.reducedMotion || prefersReducedMotion());
}
