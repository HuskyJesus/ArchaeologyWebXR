/* The heads-up display: station banner, project time, objective button,
   reticle, interaction prompt and minimap. */

import { byId, el, clear, replaceChildren, isTouchLikely } from '../core/dom.js';
import { SITE, LOCATIONS, UNITS, SURVEY_POSITIONS } from '../data/site.js';
import { SURVEY_ITEMS } from '../data/survey.js';
import { STATIONS } from '../data/text.js';
import { state } from '../core/state.js';
import { on, EVENTS } from '../core/events.js';
import { currentObjective, stationStatus, citableEvidence } from '../core/evidence.js';
import { player } from '../player/controller.js';
import { refreshEvidenceBoard } from '../scene/world.js';
import { runObjectiveAction, faceObjective } from './actions.js';
import { toast } from './toast.js';

let mapCanvas = null;
let mapCtx = null;
let lastPrompt = '';

export function initHUD() {
  mapCanvas = byId('miniMap');
  mapCtx = mapCanvas ? mapCanvas.getContext('2d') : null;

  byId('objectiveButton').addEventListener('click', runObjectiveAction);
  byId('faceObjectiveBtn').addEventListener('click', () => {
    const location = faceObjective();
    if (location) toast(`${location.label} is now ahead of you.`, 'info');
  });
  byId('turnLeftBtn').addEventListener('click', () => { player.yaw += Math.PI / 8; });
  byId('turnRightBtn').addEventListener('click', () => { player.yaw -= Math.PI / 8; });
  byId('mobileInteractBtn').addEventListener('click', () => {
    const event = new CustomEvent('rb:interact');
    window.dispatchEvent(event);
  });

  on(EVENTS.stateChanged, refreshHUD);
  on(EVENTS.daysChanged, refreshHUD);
  refreshHUD();

  if (isTouchLikely()) {
    byId('touchControls').style.display = 'block';
    byId('mobileInteractBtn').style.display = 'flex';
  }
}

export function refreshHUD() {
  const objective = currentObjective();
  const station = STATIONS.find((s) => s.number === objective.station);
  byId('stationBanner').textContent = station ? `Station ${station.number}: ${station.name}` : 'Investigation';
  byId('objectiveText').textContent = objective.label;
  byId('objectiveDetail').textContent = objective.detail;
  byId('objectiveButton').textContent = objective.label;

  byId('daysValue').textContent = state.daysOverrun
    ? `0 (${state.daysOverrun} over)`
    : String(state.daysRemaining);
  byId('daysBarFill').style.width = `${Math.round((state.daysRemaining / SITE.totalDays) * 100)}%`;
  byId('daysBarFill').classList.toggle('overrun', state.daysOverrun > 0);
  byId('evidenceValue').textContent = String(citableEvidence().length);

  const done = stationStatus().filter((s) => s.done).length;
  byId('stationsValue').textContent = `${done} of ${STATIONS.length}`;

  refreshEvidenceBoard(buildBoardLines());
}

function buildBoardLines() {
  const classified = Object.values(state.survey.records).filter((r) => r.classification).length;
  const complete = state.features.filter((f) => f.complete).length;
  const analysed = state.artifacts.filter((a) => a.analysis).length;
  return [
    `Investigator: ${state.studentName || 'unnamed'}`,
    state.daysOverrun
      ? `Project days: schedule exceeded by ${state.daysOverrun}`
      : `Project days remaining: ${state.daysRemaining} of ${SITE.totalDays}`,
    `Surface objects examined: ${classified} of ${SURVEY_ITEMS.length}`,
    `Positions recorded: ${state.survey.mapped.length}`,
    `Units opened: ${state.units.opened.length ? state.units.opened.join(', ') : 'none'}`,
    `Finds recovered: ${state.artifacts.length} (${analysed} analysed)`,
    `Finds lost or missed: ${state.missed.length}`,
    `Features recorded: ${complete} of ${state.features.length}`,
    `Dating samples: ${state.samples.length}`,
    `Professional decisions: ${Object.keys(state.ethics.decisions).length}`,
    state.report.submitted ? 'Final report: submitted' : 'Final report: outstanding'
  ];
}

export function setInteractionPrompt(target) {
  const prompt = byId('interactPrompt');
  const reticle = byId('reticle');
  const mobileBtn = byId('mobileInteractBtn');
  if (!target) {
    if (lastPrompt !== '') {
      prompt.style.display = 'none';
      reticle.classList.remove('active');
      if (isTouchLikely()) mobileBtn.classList.remove('active');
      lastPrompt = '';
    }
    return;
  }
  if (target.label !== lastPrompt) {
    lastPrompt = target.label;
    replaceChildren(prompt,
      el('span', { class: 'promptKey' }, 'E'),
      el('span', {}, target.label));
    prompt.style.display = isTouchLikely() ? 'none' : 'flex';
    reticle.classList.add('active');
    if (isTouchLikely()) mobileBtn.classList.add('active');
  }
}

/* ---------- minimap ---------- */

export function updateMiniMap() {
  if (!mapCtx) return;
  const w = mapCanvas.width;
  const h = mapCanvas.height;
  const span = SITE.half * 2;
  const pad = 10;
  const toX = (x) => pad + ((x + SITE.half) / span) * (w - pad * 2);
  const toY = (z) => pad + ((z + SITE.half) / span) * (h - pad * 2);

  mapCtx.clearRect(0, 0, w, h);
  mapCtx.fillStyle = '#8b8768';
  mapCtx.fillRect(0, 0, w, h);
  mapCtx.fillStyle = '#4e7b95';
  mapCtx.fillRect(0, 0, w, toY(-SITE.half + 4));
  mapCtx.fillStyle = '#9a5b39';
  mapCtx.fillRect(0, toY(-SITE.half + 4) - 5, w, 5);

  mapCtx.strokeStyle = 'rgba(224,179,78,0.9)';
  mapCtx.setLineDash([4, 3]);
  mapCtx.lineWidth = 1.5;
  mapCtx.strokeRect(toX(-22), toY(-9), toX(-7) - toX(-22), toY(12) - toY(-9));
  mapCtx.setLineDash([]);

  LOCATIONS.forEach((loc) => {
    mapCtx.fillStyle = '#efe6cf';
    mapCtx.fillRect(toX(loc.x) - 3, toY(loc.z) - 3, 6, 6);
  });

  Object.values(UNITS).forEach((unit) => {
    const opened = state.units.opened.includes(unit.id);
    mapCtx.fillStyle = opened ? '#6fa889' : 'rgba(240,237,226,0.35)';
    mapCtx.strokeStyle = '#2b241b';
    mapCtx.lineWidth = 1;
    mapCtx.fillRect(toX(unit.x) - 4, toY(unit.z) - 4, 8, 8);
    mapCtx.strokeRect(toX(unit.x) - 4, toY(unit.z) - 4, 8, 8);
  });

  state.survey.mapped.forEach((id) => {
    const pos = SURVEY_POSITIONS[id];
    if (!pos) return;
    mapCtx.fillStyle = '#e0b34e';
    mapCtx.beginPath();
    mapCtx.arc(toX(pos[0]), toY(pos[1]), 2.6, 0, Math.PI * 2);
    mapCtx.fill();
  });

  const objective = currentObjective();
  const target = LOCATIONS.find((l) => l.id === objective.locationId);
  if (target) {
    mapCtx.strokeStyle = '#ffd97a';
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.arc(toX(target.x), toY(target.z), 7, 0, Math.PI * 2);
    mapCtx.stroke();
  }

  mapCtx.save();
  mapCtx.translate(toX(player.position.x), toY(player.position.z));
  mapCtx.rotate(-player.yaw);
  mapCtx.fillStyle = '#f4eedd';
  mapCtx.strokeStyle = '#2b241b';
  mapCtx.lineWidth = 1.5;
  mapCtx.beginPath();
  mapCtx.moveTo(0, -7);
  mapCtx.lineTo(5, 6);
  mapCtx.lineTo(0, 3);
  mapCtx.lineTo(-5, 6);
  mapCtx.closePath();
  mapCtx.fill();
  mapCtx.stroke();
  mapCtx.restore();
}
