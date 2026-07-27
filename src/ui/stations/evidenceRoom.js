/* The Evidence Room: the single place that holds everything the
   investigation has produced, and nothing it has not. */

import { byId, el, clear } from '../../core/dom.js';
import { SITE, SURVEY_POSITIONS, UNITS, LOCATIONS } from '../../data/site.js';
import { SURVEY_ITEMS } from '../../data/survey.js';
import { artifactById } from '../../data/artifacts.js';
import { featureById } from '../../data/features.js';
import { levelsForUnit } from '../../data/excavation.js';
import { state, levelsCompleted, computeLevelProvenience, daysUsed } from '../../core/state.js';
import {
  surveyEvidence, artifactEvidence, featureEvidence, datingEvidence, sampleEvidence,
  ethicsEvidence, missedEvidence, unitEvidence, reportRequirements, unitLabel
} from '../../core/evidence.js';
import * as modal from '../modal.js';
import { toast } from '../toast.js';
import { button, sectionHeading, emptyState, progressLine } from '../components.js';
import { openReport } from './report.js';

const PANEL = 'evidenceOverlay';

const TABS = [
  { id: 'map', label: 'Site map' },
  { id: 'survey', label: 'Survey' },
  { id: 'units', label: 'Units' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'features', label: 'Features' },
  { id: 'dating', label: 'Dating' },
  { id: 'ethics', label: 'Ethics' },
  { id: 'notes', label: 'Field notes' },
  { id: 'gaps', label: 'Gaps and limits' }
];

let activeTab = 'map';

export function openEvidenceRoom(tab) {
  if (tab) activeTab = tab;
  modal.open({ id: PANEL, dismissible: true });
  render();
}

function render() {
  const tabHost = byId('evidenceTabs');
  clear(tabHost);
  TABS.forEach((tab) => {
    const btn = el('button', {
      type: 'button',
      class: `tabBtn${tab.id === activeTab ? ' active' : ''}`,
      'aria-pressed': String(tab.id === activeTab)
    }, tab.label);
    btn.addEventListener('click', () => { activeTab = tab.id; render(); });
    tabHost.appendChild(btn);
  });

  const host = byId('evidenceContent');
  clear(host);
  (RENDERERS[activeTab] || (() => host.appendChild(emptyState('Nothing here yet.'))))(host);

  renderReadiness();
}

const RENDERERS = {
  map: renderMap,
  survey: renderSurvey,
  units: renderUnits,
  profiles: renderProfiles,
  artifacts: renderArtifacts,
  features: renderFeatures,
  dating: renderDating,
  ethics: renderEthics,
  notes: renderNotes,
  gaps: renderGaps
};

function renderMap(host) {
  host.appendChild(sectionHeading('Site map',
    'Only positions you actually recorded appear on this map. Objects you examined but did not record are listed beneath it.'));
  const canvas = el('canvas', { width: 640, height: 640, class: 'siteMapCanvas', 'aria-label': 'Site map showing recorded survey positions, excavation units and site landmarks' });
  host.appendChild(canvas);
  drawSiteMap(canvas);

  const unrecorded = SURVEY_ITEMS.filter((i) => {
    const rec = state.survey.records[i.id];
    return rec && rec.classification && !state.survey.mapped.includes(i.id);
  });
  if (unrecorded.length) {
    host.appendChild(el('div', { class: 'noticeBox' },
      `Examined but not recorded, and therefore absent from the map: ${unrecorded.map((i) => i.name).join(', ')}.`));
  }
  host.appendChild(el('p', { class: 'mapLegend' },
    'Filled squares: excavation units opened. Circles: recorded surface finds. Triangles: recorded in-place evidence. Crosses: recorded modern debris. The datum is marked at the centre of the grid.'));

  // Text equivalent of the map, so the same spatial information is available
  // without seeing the drawing (SC 1.1.1). Positions are given as compass
  // bearings and distances from the site datum.
  host.appendChild(sectionHeading('Map as a location list',
    'The same layout described in words, measured from the site datum. North is toward the river and eroding bluff.'));
  const list = el('ul', { class: 'mapTextList' });
  Object.values(UNITS).forEach((unit) => {
    const opened = state.units.opened.includes(unit.id);
    list.appendChild(el('li', {}, `${unit.label}: ${describeLocation(unit.x, unit.z)}. ${opened ? 'Opened for excavation.' : 'Staked but not opened.'}`));
  });
  const recorded = state.survey.mapped
    .map((id) => surveyItemFor(id))
    .filter(Boolean);
  list.appendChild(el('li', {},
    recorded.length
      ? `Recorded surface finds (${recorded.length}): ${recorded.map((i) => `${i.name} ${describeLocation(SURVEY_POSITIONS[i.id][0], SURVEY_POSITIONS[i.id][1])}`).join('; ')}.`
      : 'No surface finds have been recorded onto the map yet.'));
  LOCATIONS.filter((l) => ['camp', 'lab', 'evidence', 'synthesis', 'dating', 'screen'].includes(l.id))
    .forEach((loc) => list.appendChild(el('li', {}, `${loc.label}: ${describeLocation(loc.x, loc.z)}.`)));
  host.appendChild(list);
}

function surveyItemFor(id) {
  return SURVEY_ITEMS.find((i) => i.id === id) || null;
}

/* A plain-language bearing and distance from the site datum, used to give the
   maps and profiles a text equivalent. */
function describeLocation(x, z) {
  const dx = x - SITE.datum.x;
  const dz = z - SITE.datum.z;
  if (Math.hypot(dx, dz) < 2) return 'at the site datum';
  const ns = Math.abs(dz) < 2 ? '' : (dz < 0 ? 'north' : 'south');
  const ew = Math.abs(dx) < 2 ? '' : (dx < 0 ? 'west' : 'east');
  const dir = `${ns}${ns && ew ? '-' : ''}${ew}`;
  return `about ${Math.round(Math.hypot(dx, dz))} metres ${dir} of the datum`;
}

function drawSiteMap(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const span = SITE.half * 2;
  const pad = 28;
  const toX = (x) => pad + ((x + SITE.half) / span) * (w - pad * 2);
  const toY = (z) => pad + ((z + SITE.half) / span) * (h - pad * 2);

  ctx.fillStyle = '#e9e1cc';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(90,74,56,0.18)';
  ctx.lineWidth = 1;
  for (let g = -SITE.half; g <= SITE.half; g += 8) {
    ctx.beginPath(); ctx.moveTo(toX(g), pad); ctx.lineTo(toX(g), h - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toY(g)); ctx.lineTo(w - pad, toY(g)); ctx.stroke();
  }

  ctx.fillStyle = '#7fa2bb';
  ctx.fillRect(0, 0, w, toY(-SITE.half + 5));
  ctx.fillStyle = '#a8613d';
  ctx.fillRect(0, toY(-SITE.half + 5) - 10, w, 10);
  ctx.fillStyle = '#3a3126';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Redstone River and eroding bluff', 14, toY(-SITE.half + 5) - 16);

  ctx.strokeStyle = '#8a7a4a';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.strokeRect(toX(-21), toY(-9), toX(-8) - toX(-21), toY(12) - toY(-9));
  ctx.setLineDash([]);
  ctx.fillText('Survey transect', toX(-21) + 4, toY(-9) - 6);

  LOCATIONS.filter((l) => ['camp', 'lab', 'evidence', 'synthesis', 'dating', 'screen'].includes(l.id)).forEach((loc) => {
    ctx.fillStyle = '#5a4a38';
    ctx.fillRect(toX(loc.x) - 5, toY(loc.z) - 5, 10, 10);
    ctx.fillStyle = '#3a3126';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(loc.label.split(' ')[0], toX(loc.x) + 9, toY(loc.z) + 4);
  });

  // datum
  ctx.strokeStyle = '#3a3126';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toX(SITE.datum.x) - 8, toY(SITE.datum.z));
  ctx.lineTo(toX(SITE.datum.x) + 8, toY(SITE.datum.z));
  ctx.moveTo(toX(SITE.datum.x), toY(SITE.datum.z) - 8);
  ctx.lineTo(toX(SITE.datum.x), toY(SITE.datum.z) + 8);
  ctx.stroke();
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = '#3a3126';
  ctx.fillText(SITE.datum.label, toX(SITE.datum.x) + 10, toY(SITE.datum.z) - 8);

  Object.values(UNITS).forEach((unit) => {
    const opened = state.units.opened.includes(unit.id);
    ctx.strokeStyle = '#3a3126';
    ctx.lineWidth = 2;
    ctx.fillStyle = opened ? '#6b4f2e' : 'rgba(0,0,0,0)';
    const size = 16;
    ctx.fillRect(toX(unit.x) - size / 2, toY(unit.z) - size / 2, size, size);
    ctx.strokeRect(toX(unit.x) - size / 2, toY(unit.z) - size / 2, size, size);
    ctx.fillStyle = '#3a3126';
    ctx.font = '12px Georgia, serif';
    ctx.fillText(`${unit.shortLabel} (${unit.grid})`, toX(unit.x) + 12, toY(unit.z) + 4);
  });

  state.survey.mapped.forEach((id) => {
    const pos = SURVEY_POSITIONS[id];
    const rec = state.survey.records[id];
    if (!pos || !rec) return;
    const x = toX(pos[0]);
    const y = toY(pos[1]);
    ctx.strokeStyle = '#3a3126';
    ctx.lineWidth = 2;
    ctx.fillStyle = rec.recordQuality === 'precise' ? '#2f6b4f' : '#8a6b2a';
    if (rec.classification === 'featureIndicator') {
      ctx.beginPath();
      ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y + 6); ctx.lineTo(x - 7, y + 6);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (rec.classification === 'modern') {
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y + 6);
      ctx.moveTo(x + 6, y - 6); ctx.lineTo(x - 6, y + 6);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
  });

  ctx.fillStyle = '#3a3126';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('N', w - 34, 30);
  ctx.beginPath();
  ctx.moveTo(w - 28, 46); ctx.lineTo(w - 28, 66);
  ctx.moveTo(w - 28, 46); ctx.lineTo(w - 33, 54);
  ctx.moveTo(w - 28, 46); ctx.lineTo(w - 23, 54);
  ctx.stroke();
}

function renderSurvey(host) {
  const records = surveyEvidence();
  host.appendChild(progressLine(records.length, SURVEY_ITEMS.length, 'Surface objects examined'));
  if (!records.length) {
    host.appendChild(emptyState('No survey records yet.'));
    return;
  }
  const list = el('div', { class: 'recordList' });
  records.forEach((r) => {
    list.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, el('strong', {}, r.label), el('br'), el('span', { class: 'subtle' }, r.detail)),
      el('span', { class: `recordRowSide pill pill-${r.verdict === 'correct' ? 'good' : (r.verdict === 'defensible' ? 'warn' : 'bad')}` }, r.verdict)));
  });
  host.appendChild(list);
  Object.entries(state.survey.concentration).forEach(([qid, ans]) => {
    host.appendChild(el('div', { class: 'recordRow' },
      el('span', { class: 'recordRowMain' }, `Concentration question: ${qid}`),
      el('span', { class: `recordRowSide pill pill-${ans.correct ? 'good' : 'bad'}` }, ans.correct ? 'correct' : 'incorrect')));
  });
}

function renderUnits(host) {
  const units = unitEvidence();
  if (!units.length) {
    host.appendChild(emptyState('No excavation unit has been opened.'));
    return;
  }
  units.forEach((u) => {
    const unitId = u.id.replace('un:', '');
    const card = el('div', { class: `recordCard tone-${u.quality === 'good' ? 'good' : 'warn'}` },
      el('div', { class: 'recordCardTitle' }, u.label),
      el('div', { class: 'recordCardLine' }, u.detail));
    const prog = state.units.progress[unitId] || { levels: {} };
    Object.keys(prog.levels).sort((a, b) => Number(a) - Number(b)).forEach((idx) => {
      const level = levelsForUnit(unitId)[Number(idx)];
      const rec = prog.levels[idx];
      if (!level) return;
      card.appendChild(el('div', { class: 'recordCardLine subtle' },
        `Level ${level.level} (${level.depthLabel}): ${level.soil.name}. Provenience ${computeLevelProvenience(unitId, Number(idx))}. ${(rec.decisions || []).length} decisions recorded.`));
    });
    host.appendChild(card);
  });
}

function renderProfiles(host) {
  host.appendChild(sectionHeading('Stratigraphic profiles',
    'Drawn from the levels you actually excavated and recorded.'));
  if (!state.units.opened.length) {
    host.appendChild(emptyState('No unit has been excavated.'));
    return;
  }
  state.units.opened.forEach((unitId) => {
    const levels = levelsForUnit(unitId);
    const done = levelsCompleted(unitId);
    host.appendChild(el('h4', { class: 'profileTitle' }, unitLabel(unitId)));
    const canvas = el('canvas', { width: 560, height: 240, class: 'profileCanvas', 'aria-label': `Stratigraphic profile of ${unitLabel(unitId)}` });
    host.appendChild(canvas);
    drawProfile(canvas, unitId, levels, done);
    // Text equivalent of the drawn profile, surface downward (SC 1.1.1).
    host.appendChild(el('p', { class: 'subtle' }, 'Profile as text, from the surface downward:'));
    const strata = el('ol', { class: 'mapTextList' });
    levels.forEach((level, i) => {
      strata.appendChild(el('li', {},
        `Level ${level.level} (${level.depthLabel}): ${level.soil.name}.${i < done ? '' : ' Not excavated.'}`));
    });
    host.appendChild(strata);
    if (done < levels.length) {
      host.appendChild(el('p', { class: 'subtle' },
        `Only ${done} of ${levels.length} levels were excavated, so this profile is incomplete below that depth.`));
    }
  });
}

const PROFILE_COLOURS = ['#7b6547', '#2c241d', '#8a5b3a', '#a8874f', '#c2ae7c', '#d3c69b'];

function drawProfile(canvas, unitId, levels, done) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#efe7d2';
  ctx.fillRect(0, 0, w, h);
  const left = 130;
  const top = 20;
  const usableH = h - top - 26;
  const shown = Math.max(1, done);
  const bandH = usableH / Math.max(1, levels.length);

  levels.forEach((level, i) => {
    const y = top + i * bandH;
    const excavated = i < done;
    ctx.fillStyle = excavated ? PROFILE_COLOURS[i % PROFILE_COLOURS.length] : 'rgba(120,110,90,0.18)';
    ctx.beginPath();
    ctx.moveTo(left, y);
    for (let x = left; x <= w - 20; x += 12) {
      ctx.lineTo(x, y + Math.sin((x + i * 30) * 0.05) * 3);
    }
    ctx.lineTo(w - 20, y + bandH);
    ctx.lineTo(left, y + bandH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(58,49,38,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#3a3126';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText(`L${level.level} ${level.depthLabel.split(' below')[0]}`, left - 8, y + bandH / 2);
    ctx.textAlign = 'left';
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = excavated ? '#f3ecdb' : '#6b6353';
    ctx.fillText(excavated ? level.context : 'not excavated', left + 8, y + bandH / 2 + 4);
  });

  ctx.strokeStyle = '#3a3126';
  ctx.lineWidth = 2;
  ctx.strokeRect(left, top, w - 20 - left, usableH);
  ctx.fillStyle = '#3a3126';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('Depth below datum', 14, top - 6);
}

function renderArtifacts(host) {
  const items = artifactEvidence();
  if (!items.length) {
    host.appendChild(emptyState('Nothing has been recovered.'));
    return;
  }
  const list = el('div', { class: 'recordList' });
  items.forEach((a) => {
    const rec = state.artifacts.find((x) => x.uid === a.uid);
    const def = rec ? artifactById(rec.artifactId) : null;
    const lines = [a.detail];
    if (rec && rec.analysis) {
      const answers = rec.analysis.answers;
      lines.push(`Material: ${labelFor(def, 'material', answers.material)}. Class: ${labelFor(def, 'objectClass', answers.objectClass)}. Period: ${labelFor(def, 'period', answers.period)}. Confidence: ${answers.confidence}.`);
    }
    list.appendChild(el('div', { class: `recordCard tone-${a.quality === 'good' ? 'good' : (a.quality === 'partial' ? 'warn' : 'bad')}` },
      el('div', { class: 'recordCardTitle' }, a.label),
      ...lines.map((l) => el('div', { class: 'recordCardLine' }, l))));
  });
  host.appendChild(list);
}

function labelFor(def, fieldId, answerId) {
  if (!def || !answerId) return 'not recorded';
  const field = def.fields[fieldId];
  if (!field) return String(answerId);
  const ids = Array.isArray(answerId) ? answerId : [answerId];
  return ids.map((id) => {
    const opt = field.options.find((o) => o.id === id);
    return opt ? opt.label : id;
  }).join(', ');
}

function renderFeatures(host) {
  const items = featureEvidence();
  if (!items.length) {
    host.appendChild(emptyState('No features have been exposed.'));
    return;
  }
  items.forEach((f) => {
    const featureId = f.id.replace('ft:', '');
    const rec = state.features.find((x) => x.featureId === featureId);
    const def = featureById(featureId);
    const lines = [f.detail];
    if (rec) {
      Object.entries(rec.observations || {}).forEach(([fieldId, value]) => {
        const field = def.observations[fieldId];
        if (!field) return;
        const ids = Array.isArray(value) ? value : [value];
        const labels = ids.map((id) => {
          const opt = field.options.find((o) => o.id === id);
          return opt ? opt.label : id;
        });
        lines.push(`${field.prompt}: ${labels.join('; ')}`);
      });
      if (rec.alternative) {
        const alt = def.interpretations.find((i) => i.id === rec.alternative);
        lines.push(`Alternative considered: ${alt ? alt.label : rec.alternative}`);
      }
      lines.push(`${rec.photographed ? 'Photographed' : 'Not photographed'}. ${rec.drawn ? 'Drawn' : 'Not drawn'}.`);
    }
    host.appendChild(el('div', { class: `recordCard tone-${f.quality === 'good' ? 'good' : (f.quality === 'partial' ? 'warn' : 'bad')}` },
      el('div', { class: 'recordCardTitle' }, f.label),
      ...lines.map((l) => el('div', { class: 'recordCardLine' }, l))));
  });
}

function renderDating(host) {
  const samples = sampleEvidence();
  const dates = datingEvidence();
  if (!samples.length && !dates.length) {
    host.appendChild(emptyState('No dating evidence has been produced.'));
    return;
  }
  if (samples.length) {
    host.appendChild(sectionHeading('Samples collected', null));
    samples.forEach((s) => host.appendChild(el('div', { class: `recordCard tone-${s.quality === 'good' ? 'good' : 'bad'}` },
      el('div', { class: 'recordCardTitle' }, s.label),
      el('div', { class: 'recordCardLine' }, s.detail))));
  }
  host.appendChild(sectionHeading('Dating evidence', null));
  dates.forEach((d) => host.appendChild(el('div', { class: `recordCard tone-${d.quality === 'good' ? 'good' : 'warn'}` },
    el('div', { class: 'recordCardTitle' }, d.label),
    el('div', { class: 'recordCardLine' }, d.detail),
    d.judged ? el('div', { class: 'recordCardLine subtle' }, `You judged this ${d.judged}.`) : null)));

  const conclusions = Object.entries(state.dating.conclusions);
  if (conclusions.length) {
    host.appendChild(sectionHeading('Your chronological conclusions', null));
    conclusions.forEach(([qid, value]) => {
      const text = Array.isArray(value) ? value.map((v) => v.optionId).join(', ') : value.optionId;
      host.appendChild(el('div', { class: 'recordRow' },
        el('span', { class: 'recordRowMain' }, qid),
        el('span', { class: 'recordRowSide' }, text)));
    });
  }
}

function renderEthics(host) {
  const items = ethicsEvidence();
  if (!items.length) {
    host.appendChild(emptyState('No professional decisions recorded yet.'));
    return;
  }
  items.forEach((e) => host.appendChild(el('div', { class: `recordCard tone-${e.quality === 'good' ? 'good' : (e.quality === 'partial' ? 'warn' : 'bad')}` },
    el('div', { class: 'recordCardTitle' }, e.label),
    el('div', { class: 'recordCardLine' }, e.detail))));
}

function renderNotes(host) {
  if (!state.notes.length) {
    host.appendChild(emptyState('No notes yet.'));
    return;
  }
  const list = el('div', { class: 'noteList' });
  [...state.notes].reverse().forEach((n) => {
    list.appendChild(el('div', { class: 'noteLine' }, n.text));
  });
  host.appendChild(list);
}

function renderGaps(host) {
  host.appendChild(sectionHeading('What is missing, and why',
    'A report that does not state its limits overstates its conclusions.'));
  const missed = missedEvidence();
  if (missed.length) {
    const list = el('div', { class: 'recordList' });
    missed.forEach((m) => list.appendChild(el('div', { class: 'recordCard tone-bad' },
      el('div', { class: 'recordCardTitle' }, m.label),
      el('div', { class: 'recordCardLine' }, m.detail))));
    host.appendChild(list);
  } else {
    host.appendChild(el('p', {}, 'Nothing was lost through a recovery decision so far.'));
  }

  const unexamined = SURVEY_ITEMS.filter((i) => !state.survey.records[i.id]);
  if (unexamined.length) {
    host.appendChild(el('div', { class: 'noticeBox' },
      `${unexamined.length} surface object${unexamined.length === 1 ? ' was' : 's were'} never examined.`));
  }
  const unopened = Object.values(UNITS).filter((u) => !state.units.opened.includes(u.id));
  if (unopened.length) {
    host.appendChild(el('div', { class: 'noticeBox' },
      `Unexcavated candidate units: ${unopened.map((u) => u.shortLabel).join(', ')}. Anything they contain is unknown rather than absent.`));
  }
  host.appendChild(el('div', { class: 'noticeBox' },
    `${daysUsed()} of ${SITE.totalDays} project days used. Work stopped when the schedule ran out, not when the site was exhausted.`));
}

function renderReadiness() {
  const host = byId('evidenceReadiness');
  clear(host);
  const missing = reportRequirements();
  if (!missing.length) {
    host.appendChild(el('div', { class: 'readyLine ready' },
      'Every station is complete. You can write the final report.'));
  } else {
    host.appendChild(el('div', { class: 'readyLine' },
      `Before the final report: ${missing.join('; ')}.`));
  }
}

export function initEvidenceRoom() {
  byId('closeEvidenceBtn').addEventListener('click', () => modal.close(PANEL));
  byId('goToReportBtn').addEventListener('click', () => {
    const missing = reportRequirements();
    if (missing.length) {
      renderReadiness();
      toast(`Still outstanding: ${missing[0]}.`, 'warn');
      return;
    }
    modal.close(PANEL);
    openReport();
  });
}
