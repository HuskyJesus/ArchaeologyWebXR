/* Application bootstrap: the start gate, the session, the render loop, and
   the keyboard shortcuts that make the whole investigation operable without
   a mouse. */

import * as THREE from 'three';
import { byId, el, clear, prefersReducedMotion } from './core/dom.js';
import { state, setSetting, addNote } from './core/state.js';
import { hasSave, loadSave, saveSummary, enableAutosave, flushSave, loadSettings, clearSave, canPersist } from './core/save.js';
import { startSession, resumeSession, record, recordOnce } from './core/telemetry.js';
import { on, EVENTS } from './core/events.js';
import { OPENING_BRIEFING, ONBOARDING_STEPS, HELP_TEXT, STATIONS } from './data/text.js';
import { SITE } from './data/site.js';

import { initRenderer, webglAvailable, scene, camera, renderer } from './scene/renderer.js';
import { buildWorld, worldRefs } from './scene/world.js';
import { buildUnitMarkers, refreshAllUnitVisuals } from './scene/units.js';
import { buildSurveyMarkers, refreshSurveyMarkers } from './scene/surveyMarkers.js';
import { initAmbience } from './scene/ambience.js';

import { initPlayer, updatePlayer, player, applyToCamera } from './player/controller.js';
import { targetFromCamera, targetFromScreenPoint, setHighlight } from './player/interaction.js';

import * as modal from './ui/modal.js';
import { toast } from './ui/toast.js';
import { initBriefing, showBriefing } from './ui/briefing.js';
import { initHUD, refreshHUD, setInteractionPrompt, updateMiniMap } from './ui/hud.js';
import { activateTarget, runObjectiveAction, faceObjective } from './ui/actions.js';
import { initEquipment, openEquipment } from './ui/stations/equipment.js';
import { initSurvey } from './ui/stations/survey.js';
import { initExcavation } from './ui/stations/excavation.js';
import { initLaboratory } from './ui/stations/laboratory.js';
import { initChronology } from './ui/stations/chronology.js';
import { initFeatures } from './ui/stations/features.js';
import { initSynthesis } from './ui/stations/synthesis.js';
import { initEthics, pendingScenario } from './ui/stations/ethics.js';
import { initEvidenceRoom, openEvidenceRoom } from './ui/stations/evidenceRoom.js';
import { initReport, showResults } from './ui/stations/report.js';
import { initNotebook, openNotebook } from './ui/notebook.js';
import { initSettings, openSettings, applyInterfaceSettings } from './ui/settings.js';
import { startFallback, initFallbackControls, isFallbackActive } from './ui/fallback.js';

import { initXR, isPresenting, updateXR, invalidateXRPanel, probeXRSupport } from './xr/session.js';

let lastFrame = performance.now();
let running = false;
let ethicsPromptCooldown = 0;

boot();

function boot() {
  applyStoredSettings();
  initBriefing();
  initEquipment();
  initSurvey();
  initExcavation();
  initLaboratory();
  initChronology();
  initFeatures();
  initSynthesis();
  initEthics();
  initEvidenceRoom();
  initReport();
  initNotebook();
  initSettings();
  initFallbackControls();
  buildHelpPanel();
  wireGate();
  wireShortcuts();
  on(EVENTS.settingsChanged, applyInterfaceSettings);
  on(EVENTS.stateChanged, onStateChanged);
  exposeDebugHook();
  // Report headset availability on the start gate. The XR rig itself is only
  // built once a session starts (see initXR), because it needs the renderer.
  probeXRSupport().catch(() => {});
  byId('loading').classList.add('hidden');
}

/* Instructor and technical hook, deliberately opt-in through a query
   parameter so it is not part of the student-facing surface. It exposes the
   live investigation state and the same action dispatcher the interface
   uses, which is what the automated interface checks drive. */
function exposeDebugHook() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') !== '1') return;
  window.RedstoneBluff = {
    // A getter, because loading a save replaces the state object.
    get state() { return state; },
    actions: { activateTarget, runObjectiveAction },
    open: {
      equipment: openEquipment,
      notebook: openNotebook,
      evidence: openEvidenceRoom,
      settings: openSettings,
      results: showResults
    },
    modal
  };
  console.info('[Redstone Bluff] debug hook attached at window.RedstoneBluff');
}

function applyStoredSettings() {
  const stored = loadSettings();
  if (stored) {
    Object.entries(stored).forEach(([key, value]) => {
      if (key === 'xr' && value && typeof value === 'object') {
        Object.entries(value).forEach(([xk, xv]) => setSetting(`xr.${xk}`, xv));
      } else {
        setSetting(key, value);
      }
    });
  }
  if (prefersReducedMotion()) setSetting('reducedMotion', true);
  applyInterfaceSettings();
}

/* ---------- start gate ---------- */

function wireGate() {
  const gate = byId('startGate');
  const nameInput = byId('studentName');
  const resumeCard = byId('resumeCard');

  if (!canPersist) {
    byId('storageNote').textContent = 'This browser is blocking local storage, so your work cannot be saved between visits. Export the CSV and the report before you close the tab.';
  }

  const summary = hasSave() ? saveSummary() : null;
  if (summary && !summary.corrupt) {
    const station = STATIONS.find((s) => s.number === summary.station);
    resumeCard.style.display = 'block';
    clear(byId('resumeDetail'));
    byId('resumeDetail').appendChild(el('div', {},
      `${summary.studentName}, ${station ? station.name : `station ${summary.station}`}, ${summary.daysRemaining} of ${SITE.totalDays} project days left.`));
    byId('resumeDetail').appendChild(el('div', { class: 'subtle' },
      `${summary.artifacts} finds and ${summary.features} features recorded. Last worked on ${new Date(summary.updatedISO).toLocaleString()}.`));
    byId('resumeBtn').addEventListener('click', () => {
      const loaded = loadSave();
      if (!loaded) {
        toast('That saved investigation could not be read. Starting a new one.', 'warn');
        beginSession(nameInput.value.trim() || 'Student', false);
        return;
      }
      beginSession(loaded.studentName || 'Student', true);
    });
  } else if (summary && summary.corrupt) {
    resumeCard.style.display = 'block';
    byId('resumeDetail').textContent = 'A saved investigation exists but could not be read. Starting a new one will replace it.';
    byId('resumeBtn').disabled = true;
  }

  byId('startBtn').addEventListener('click', () => {
    if (hasSave()) {
      confirmDiscard(() => {
        clearSave();
        beginSession(nameInput.value.trim() || 'Student', false);
      });
      return;
    }
    beginSession(nameInput.value.trim() || 'Student', false);
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') byId('startBtn').click();
  });

  byId('gateSettingsBtn').addEventListener('click', openSettings);
  byId('gateFallbackBtn').addEventListener('click', () => {
    byId('startGate').style.display = 'none';
    beginFallbackSession(nameInput.value.trim() || 'Student', 'You chose guided access mode. Every activity is available here.');
  });
}

function confirmDiscard(onConfirm) {
  const host = byId('confirmBody');
  clear(host);
  host.appendChild(el('p', {}, 'There is already a saved investigation in this browser. Starting a new one permanently discards it.'));
  const actions = el('div', { class: 'actionRow' });
  const yes = el('button', { type: 'button', class: 'btn primary' }, 'Discard it and start again');
  yes.addEventListener('click', () => {
    modal.close('confirmOverlay');
    onConfirm();
  });
  const no = el('button', { type: 'button', class: 'btn secondary' }, 'Keep it');
  no.addEventListener('click', () => modal.close('confirmOverlay'));
  actions.appendChild(yes);
  actions.appendChild(no);
  host.appendChild(actions);
  modal.open({ id: 'confirmOverlay', dismissible: true });
}

function beginSession(name, resumed) {
  byId('startGate').style.display = 'none';

  const ok = initRenderer(document.body);
  if (!ok || !webglAvailable) {
    beginFallbackSession(name, 'This device could not start WebGL, so the investigation is running in guided access mode. Nothing in the learning activities is missing.');
    return;
  }

  state.studentName = name;
  buildWorld();
  buildUnitMarkers();
  buildSurveyMarkers();
  refreshAllUnitVisuals();
  initPlayer(onCanvasSelect);
  initHUD();
  initAmbience();
  enableAutosave();
  applyToCamera();

  byId('hud').style.display = 'flex';
  byId('reticle').style.display = 'block';
  byId('sceneChrome').style.display = 'block';

  initXR().catch(() => {});

  if (resumed) {
    resumeSession();
    record('session', 'resumed', { station: state.progress.station });
    toast('Investigation resumed.', 'info');
    startLoop();
    refreshHUD();
    showBriefing('Back on site', resumeMessage());
  } else {
    startSession(name);
    addNote(`Investigation started by ${name}.`);
    startLoop();
    refreshHUD();
    showBriefing('Field briefing', OPENING_BRIEFING, () => {
      if (!state.progress.onboarded) showOnboarding();
      else openEquipment();
    });
  }
}

function beginFallbackSession(name, reason) {
  state.studentName = name;
  enableAutosave();
  startFallback(reason);
  if (hasSave()) resumeSession(); else startSession(name);
  showBriefing('Field briefing', OPENING_BRIEFING, () => {
    if (!state.equipment.prepared) openEquipment();
  });
}

function resumeMessage() {
  const lines = [`Welcome back, ${state.studentName}.`];
  lines.push(`You have ${state.daysRemaining} of ${SITE.totalDays} project days left.`);
  const station = STATIONS.find((s) => s.number === state.progress.station);
  if (station) lines.push(`You were working on station ${station.number}, ${station.name}.`);
  lines.push('Nothing has been re-awarded and no time has been re-charged. Pick up exactly where you stopped.');
  return lines.join('\n\n');
}

/* ---------- onboarding ---------- */

function showOnboarding() {
  const host = byId('onboardingSteps');
  clear(host);
  ONBOARDING_STEPS.forEach((step, index) => {
    host.appendChild(el('div', { class: 'stepItem' },
      el('div', { class: 'stepNumber' }, String(index + 1)),
      el('div', {},
        el('strong', {}, step.title),
        el('p', {}, step.body))));
  });
  modal.open({ id: 'onboardingOverlay', dismissible: false, initialFocus: '#onboardingContinueBtn' });
  byId('onboardingContinueBtn').onclick = () => {
    state.progress.onboarded = true;
    modal.close('onboardingOverlay');
    openEquipment();
  };
}

function buildHelpPanel() {
  const host = byId('helpBody');
  clear(host);
  const list = el('ul', { class: 'helpList' });
  HELP_TEXT.forEach((line) => list.appendChild(el('li', {}, line)));
  host.appendChild(list);
  byId('helpBtn').addEventListener('click', () => modal.open({ id: 'helpOverlay', dismissible: true }));
  byId('closeHelpBtn').addEventListener('click', () => modal.close('helpOverlay'));
}

/* ---------- input wiring ---------- */

function onCanvasSelect(clientX, clientY) {
  if (modal.anyOpen()) return false;
  const target = targetFromScreenPoint(clientX, clientY);
  if (!target) return false;
  return activateTarget(target);
}

function wireShortcuts() {
  window.addEventListener('rb:interact', () => {
    if (modal.anyOpen()) return;
    const target = targetFromCamera();
    if (target) activateTarget(target);
  });

  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;
    if (modal.anyOpen()) return;
    switch (e.code) {
      case 'KeyE':
      case 'Enter':
      case 'Space': {
        const target = targetFromCamera();
        if (target) {
          e.preventDefault();
          activateTarget(target);
        }
        break;
      }
      case 'KeyR':
        e.preventDefault();
        faceObjective();
        break;
      case 'KeyN':
        e.preventDefault();
        openNotebook();
        break;
      case 'KeyV':
        e.preventDefault();
        openEvidenceRoom();
        break;
      case 'KeyP':
        e.preventDefault();
        showResults();
        break;
      case 'Comma':
        e.preventDefault();
        openSettings();
        break;
      case 'Slash':
        if (e.shiftKey) {
          e.preventDefault();
          modal.open({ id: 'helpOverlay', dismissible: true });
        }
        break;
      case 'KeyO':
        e.preventDefault();
        runObjectiveAction();
        break;
      case 'Escape':
        if (document.pointerLockElement) document.exitPointerLock();
        break;
      default:
        break;
    }
  });

  byId('notebookBtn').addEventListener('click', () => openNotebook());
  byId('evidenceBtn').addEventListener('click', () => openEvidenceRoom());
  byId('settingsBtn').addEventListener('click', openSettings);
  byId('reportBtn').addEventListener('click', showResults);
  window.addEventListener('pagehide', flushSave);
}

function isTypingTarget(node) {
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
}

/* ---------- reactions to state changes ---------- */

function onStateChanged() {
  if (isFallbackActive()) return;
  refreshSurveyMarkers();
  if (isPresenting()) invalidateXRPanel();
}

/* Raises a professional decision when one becomes due, without interrupting
   an activity that is already open. */
function maybeRaiseEthics(dt) {
  ethicsPromptCooldown -= dt;
  if (ethicsPromptCooldown > 0) return;
  if (modal.anyOpen()) return;
  const scenario = pendingScenario();
  if (!scenario) return;
  if (state.ethics.seen.includes(scenario.id)) return;
  ethicsPromptCooldown = 30;
  toast(`${SITE.supervisorName} needs a decision from you: ${scenario.title}. Open it from the field camp or the objective button.`, 'warn', 6500);
  recordOnce(`ethicsRaised:${scenario.id}`, scenario.id, 'opened', { station: 8 });
  state.ethics.seen.push(scenario.id);
}

/* ---------- render loop ---------- */

function startLoop() {
  if (running) return;
  running = true;
  lastFrame = performance.now();
  renderer.setAnimationLoop(frame);
}

function frame() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;

  if (isPresenting()) {
    updateXR(dt);
  } else {
    updatePlayer(dt);
    const target = modal.anyOpen() ? null : targetFromCamera();
    setInteractionPrompt(target);
    setHighlight(target ? target.object : null);
    updateMiniMap();
  }

  maybeRaiseEthics(dt);
  animateWorld(now, dt);
  renderer.render(scene, camera);
}

function animateWorld(now, dt) {
  const reduced = state.settings.reducedMotion || prefersReducedMotion();
  if (worldRefs.riverMaterial && worldRefs.riverMaterial.map && !reduced) {
    worldRefs.riverMaterial.map.offset.x = (now / 9000) % 1;
    worldRefs.riverMaterial.map.offset.y = (now / 15000) % 1;
  }
  const supervisor = worldRefs.supervisor;
  if (supervisor && !reduced) {
    const t = now / 1000;
    supervisor.group.position.y = Math.sin(t * 1.3) * 0.008;
    const dx = player.position.x - supervisor.group.position.x;
    const dz = player.position.z - supervisor.group.position.z;
    const distance = Math.hypot(dx, dz);
    let targetRotation = supervisor.baseRotation + Math.sin(t * 0.3) * 0.08;
    if (distance < 6) targetRotation = Math.atan2(-dx, -dz);
    let delta = targetRotation - supervisor.group.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    supervisor.group.rotation.y += delta * Math.min(1, dt * 2.5);
  }
}
