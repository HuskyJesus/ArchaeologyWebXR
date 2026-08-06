/* Final mission: the investigation report, the assessment profile, and the
   exports. Every conclusion must cite evidence the learner actually
   produced and must carry reasoning. */

import { byId, el, clear } from '../../core/dom.js';
import { SITE } from '../../data/site.js';
import { REPORT_QUESTIONS, REPORT_OPEN_FIELDS } from '../../data/text.js';
import { CONFIDENCE_LEVELS } from '../../data/artifacts.js';
import { state, setReportAnswer, setReportOpen, submitReport, daysUsed } from '../../core/state.js';
import { citableEvidence, reportRequirements, reportAnswerStatus, evidenceById } from '../../core/evidence.js';
import { assessmentProfile, investigationSummary, BANDS } from '../../core/assessment.js';
import { record, recordOnce, toCSV, toXAPI, timeOnTaskMs, formatDuration, events } from '../../core/telemetry.js';
import * as modal from '../modal.js';
import { toast } from '../toast.js';
import { button, actionRow, sectionHeading, emptyState, optionGroup } from '../components.js';

const PANEL = 'reportOverlay';
const RESULTS_PANEL = 'resultsOverlay';

export function openReport() {
  const missing = reportRequirements();
  if (missing.length) {
    toast(`Before the final report: ${missing[0]}.`, 'warn');
    return;
  }
  modal.open({ id: PANEL, dismissible: true });
  render();
}

function render() {
  const host = byId('reportBody');
  clear(host);

  const evidence = citableEvidence();
  host.appendChild(el('p', { class: 'promptDetail' },
    'Answer each question with a conclusion, the evidence that supports it, your confidence, and your reasoning. The evidence list holds only what this investigation actually produced.'));

  REPORT_QUESTIONS.forEach((q) => host.appendChild(questionBlock(q, evidence)));
  REPORT_OPEN_FIELDS.forEach((f) => host.appendChild(openFieldBlock(f)));

  host.appendChild(el('div', { id: 'reportErrors' }));
  host.appendChild(actionRow(
    button('Submit the report', onSubmit),
    button('Save and close', () => { modal.close(PANEL); toast('Draft saved.', 'info'); }, 'secondary')));
}

function questionBlock(q, evidence) {
  const stored = state.report.answers[q.id] || { claim: '', evidence: [], confidence: null, reasoning: '' };
  const wrap = el('section', { class: 'stationSection reportQuestion' });
  wrap.appendChild(sectionHeading(`${q.number}. ${q.prompt}`, q.guidance));

  const claim = el('textarea', {
    class: 'textInput',
    id: `report-claim-${q.id}`,
    rows: '3',
    placeholder: 'Your conclusion, stated plainly.'
  });
  claim.value = stored.claim || '';
  claim.addEventListener('input', () => save(q.id, { claim: claim.value }));
  wrap.appendChild(el('label', { class: 'fieldLabel', for: `report-claim-${q.id}` }, 'Conclusion'));
  wrap.appendChild(claim);

  if (!evidence.length) {
    wrap.appendChild(el('div', { class: 'fieldLabel' }, `Evidence cited (at least ${q.minEvidence})`));
    wrap.appendChild(emptyState('No citable evidence exists.'));
  } else {
    const chosen = new Set(stored.evidence || []);
    const list = el('fieldset', { class: 'evidencePicker choiceGroup' },
      el('legend', { class: 'fieldLabel' }, `Evidence cited (at least ${q.minEvidence})`));
    evidence.forEach((e) => {
      const input = el('input', { type: 'checkbox', id: `report-${q.id}-${e.id}` });
      input.checked = chosen.has(e.id);
      input.addEventListener('change', () => {
        if (input.checked) chosen.add(e.id); else chosen.delete(e.id);
        save(q.id, { evidence: [...chosen] });
      });
      list.appendChild(el('label', { class: 'checkRow', for: `report-${q.id}-${e.id}` },
        input,
        el('span', {},
          el('span', { class: 'evidencePickLabel' }, e.label),
          el('span', { class: `pill pill-${e.quality === 'good' ? 'good' : (e.quality === 'partial' ? 'warn' : 'bad')}` }, e.quality))));
    });
    wrap.appendChild(list);
  }

  wrap.appendChild(el('div', { class: 'fieldLabel' }, 'Confidence'));
  const confHost = el('div', { class: 'choiceRow' });
  optionGroup(confHost, CONFIDENCE_LEVELS, {
    initial: stored.confidence,
    ariaLabel: `Confidence for question ${q.number}`,
    onChange: (id) => save(q.id, { confidence: id })
  });
  wrap.appendChild(confHost);

  const reasoning = el('textarea', {
    class: 'textInput',
    id: `report-reasoning-${q.id}`,
    rows: '4',
    placeholder: 'How does the evidence you cited support the conclusion? What would change your mind?'
  });
  reasoning.value = stored.reasoning || '';
  reasoning.addEventListener('input', () => save(q.id, { reasoning: reasoning.value }));
  wrap.appendChild(el('label', { class: 'fieldLabel', for: `report-reasoning-${q.id}` }, 'Reasoning'));
  wrap.appendChild(reasoning);

  return wrap;
}

function save(questionId, patch) {
  const existing = state.report.answers[questionId] || { claim: '', evidence: [], confidence: null, reasoning: '' };
  setReportAnswer(questionId, { ...existing, ...patch });
}

function openFieldBlock(f) {
  const wrap = el('section', { class: 'stationSection reportQuestion' });
  wrap.appendChild(sectionHeading(`${f.number}. ${f.prompt}`, f.guidance));
  const area = el('textarea', { class: 'textInput', id: `report-open-${f.id}`, rows: '4' });
  area.value = state.report.open[f.id] || '';
  area.addEventListener('input', () => setReportOpen(f.id, area.value));
  wrap.appendChild(el('label', { class: 'fieldLabel', for: `report-open-${f.id}` }, 'Your response'));
  wrap.appendChild(area);
  return wrap;
}

function onSubmit() {
  const problems = reportAnswerStatus();
  const errorHost = document.getElementById('reportErrors');
  clear(errorHost);
  if (problems.length) {
    errorHost.setAttribute('tabindex', '-1');
    errorHost.appendChild(el('div', { class: 'errorText', role: 'alert' },
      el('h3', {}, 'The report is not ready to submit'),
      el('p', {}, 'Please resolve the following, then submit again. Nothing you have written has been cleared.'),
      el('ul', {}, ...problems.map((p) => el('li', {}, p)))));
    // Move focus to the error summary so a keyboard or screen-reader user is
    // taken straight to what needs fixing (SC 3.3.1, 2.4.3).
    errorHost.focus();
    return;
  }
  submitReport();
  const answers = Object.values(state.report.answers);
  recordOnce('reportSubmitted', 'final_report', 'completed', {
    station: 9,
    claimCount: answers.length,
    evidenceCount: answers.reduce((a, x) => a + (x.evidence || []).length, 0)
  });
  modal.close(PANEL);
  showResults();
}

/* ---------- results ---------- */

export function showResults() {
  modal.open({ id: RESULTS_PANEL, dismissible: true });
  renderResults();
}

function renderResults() {
  const host = byId('resultsBody');
  clear(host);
  const summary = investigationSummary();
  const profile = assessmentProfile();

  host.appendChild(el('div', { class: `statusBanner ${state.report.submitted ? 'good' : 'warn'}` },
    state.report.submitted ? 'Investigation complete' : 'Investigation in progress'));

  const stats = el('div', { class: 'statGrid' });
  [
    [state.daysOverrun ? `${SITE.totalDays} + ${state.daysOverrun} over` : `${summary.daysUsed} of ${SITE.totalDays}`, 'Project days used'],
    [String(summary.unitsOpened), 'Units opened'],
    [`${summary.artifactsAnalysed} of ${summary.artifacts}`, 'Finds analysed'],
    [`${summary.featuresComplete} of ${summary.features}`, 'Feature records complete'],
    [String(summary.samples), 'Dating samples'],
    [String(summary.missed), 'Finds lost or missed'],
    [String(summary.ethicsResolved), 'Professional decisions'],
    [formatDuration(timeOnTaskMs()), 'Time on task']
  ].forEach(([value, label]) => {
    stats.appendChild(el('div', { class: 'statBox' },
      el('div', { class: 'statValue' }, value),
      el('div', { class: 'statLabel' }, label)));
  });
  host.appendChild(stats);

  host.appendChild(sectionHeading('Performance profile',
    'Nine dimensions, each judged against what you did rather than against a single total.'));
  const profileList = el('div', { class: 'recordList' });
  profile.forEach((dim) => {
    const tone = dim.band === BANDS.strong ? 'good'
      : (dim.band === BANDS.developing ? 'warn'
        : (dim.band === BANDS.notAttempted ? 'neutral' : 'bad'));
    profileList.appendChild(el('div', { class: `recordCard tone-${tone}` },
      el('div', { class: 'recordCardTitle' },
        el('span', {}, dim.label),
        el('span', { class: `pill pill-${tone}` }, dim.band)),
      el('div', { class: 'recordCardLine' }, dim.detail)));
  });
  host.appendChild(profileList);

  host.appendChild(sectionHeading('Written report', null));
  // tabindex makes the scrollable text keyboard-reachable (SC 2.1.1).
  const pre = el('pre', { class: 'reportText', id: 'reportTextBox', tabindex: '0', role: 'region', 'aria-label': 'Full written report text' });
  pre.textContent = buildReportText();
  host.appendChild(pre);
}

export function buildReportText() {
  const summary = investigationSummary();
  const profile = assessmentProfile();
  const lines = [];
  lines.push(`${SITE.siteName} Archaeological Investigation`);
  lines.push(`Investigator: ${state.studentName || 'Unnamed investigator'}`);
  lines.push(`Report generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Project days used: ${daysUsed()} of ${SITE.totalDays}`);
  if (state.daysOverrun) {
    lines.push(`Schedule exceeded by ${state.daysOverrun} day${state.daysOverrun === 1 ? '' : 's'}. Work continued past the point at which construction was due to begin, which would not have been possible on the real project.`);
  }
  lines.push(`Units opened: ${state.units.opened.join(', ') || 'none'}`);
  lines.push(`Finds recovered: ${summary.artifacts} (${summary.artifactsAnalysed} analysed)`);
  lines.push(`Finds lost or never recovered: ${summary.missed}`);
  lines.push(`Features recorded: ${summary.featuresComplete} complete of ${summary.features} exposed`);
  lines.push(`Dating samples: ${summary.samples}`);
  lines.push(`Professional decisions resolved: ${summary.ethicsResolved}`);
  lines.push('');

  lines.push('CONCLUSIONS');
  REPORT_QUESTIONS.forEach((q) => {
    const a = state.report.answers[q.id];
    lines.push('');
    lines.push(`${q.number}. ${q.prompt}`);
    if (!a || !a.claim) {
      lines.push('   Not answered.');
      return;
    }
    lines.push(`   Conclusion: ${a.claim.trim()}`);
    lines.push(`   Confidence: ${a.confidence || 'not stated'}`);
    const cited = (a.evidence || []).map((id) => {
      const e = evidenceById(id);
      return e ? `${e.label} [${e.quality} quality]` : id;
    });
    lines.push(`   Evidence cited: ${cited.length ? cited.join('; ') : 'none'}`);
    lines.push(`   Reasoning: ${(a.reasoning || '').trim() || 'none given'}`);
  });

  REPORT_OPEN_FIELDS.forEach((f) => {
    lines.push('');
    lines.push(`${f.number}. ${f.prompt}`);
    lines.push(`   ${(state.report.open[f.id] || '').trim() || 'Not answered.'}`);
  });

  const selections = [];
  Object.entries(state.synthesis.selections).forEach(([domainId, statements]) => {
    Object.entries(statements).forEach(([statementId, payload]) => selections.push({ domainId, statementId, ...payload }));
  });
  if (selections.length) {
    lines.push('');
    lines.push('SYNTHESIS CONCLUSIONS');
    selections.forEach((s) => {
      lines.push(`   [${s.support === 'supported' ? 'supported' : (s.acknowledgedSpeculative ? 'speculative, acknowledged' : 'speculative, not acknowledged')}] ${s.domainId}: ${s.statementId}`);
    });
  }

  lines.push('');
  lines.push('PERFORMANCE PROFILE');
  profile.forEach((dim) => {
    lines.push(`   ${dim.label}: ${dim.band}`);
    lines.push(`      ${dim.detail}`);
  });

  return lines.join('\n');
}

/* ---------- readable HTML report ----------
   A single self-contained web page an instructor can open, print, or upload
   straight into an LMS such as Canvas. Same content as the plain-text report
   plus the full activity timeline, formatted for reading rather than parsing. */

function escHTML(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function eventDetail(e) {
  return Object.keys(e)
    .filter((k) => !['objectId', 'verb', 'atISO', 'elapsedMs', 'kind', 'name'].includes(k))
    .map((k) => `${k}: ${Array.isArray(e[k]) ? e[k].join(', ') : e[k]}`)
    .join('; ');
}

export function buildReportHTML() {
  const summary = investigationSummary();
  const profile = assessmentProfile();
  const bandTone = (b) => (b === BANDS.strong ? '#2e7d32'
    : (b === BANDS.developing ? '#9a6b00'
      : (b === BANDS.notAttempted ? '#666666' : '#b3452f')));
  const h = [];
  h.push('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">');
  h.push(`<title>${escHTML(SITE.siteName)} report - ${escHTML(state.studentName || 'Unnamed investigator')}</title>`);
  h.push('<style>');
  h.push('body{font-family:Georgia,"Times New Roman",serif;max-width:52rem;margin:2rem auto;padding:0 1rem;color:#26221b;line-height:1.55;}');
  h.push('h1{font-size:1.6rem;border-bottom:3px solid #c08a4a;padding-bottom:.4rem;}h2{font-size:1.15rem;margin-top:2rem;border-bottom:1px solid #ddd2b6;padding-bottom:.2rem;}');
  h.push('table{border-collapse:collapse;width:100%;margin:.6rem 0;font-size:.92rem;}th,td{border:1px solid #d8cfae;padding:.35rem .6rem;text-align:left;vertical-align:top;}th{background:#f3ecd8;}');
  h.push('.meta{color:#5f5645;font-size:.9rem;}.band{font-weight:bold;}');
  h.push('.q{margin:1.1rem 0;padding:.75rem .9rem;background:#faf6ea;border:1px solid #e4dabb;border-radius:6px;}');
  h.push('.q h3{margin:.1rem 0 .4rem;font-size:1rem;}.q .lbl{font-weight:bold;color:#5f5645;}');
  h.push('.timeline td:first-child{white-space:nowrap;font-variant-numeric:tabular-nums;}');
  h.push('@media print{body{margin:.5rem auto;} .q{break-inside:avoid;}}');
  h.push('</style></head><body>');

  h.push(`<h1>${escHTML(SITE.siteName)} Archaeological Investigation</h1>`);
  h.push(`<p class="meta">Investigator: <strong>${escHTML(state.studentName || 'Unnamed investigator')}</strong><br>`);
  h.push(`Report generated: ${escHTML(new Date().toLocaleString())}<br>`);
  h.push(`Time on task: ${escHTML(formatDuration(timeOnTaskMs()))}</p>`);

  h.push('<h2>Investigation summary</h2><table>');
  const overrun = state.daysOverrun ? ` (schedule exceeded by ${state.daysOverrun})` : '';
  [
    ['Project days used', `${daysUsed()} of ${SITE.totalDays}${overrun}`],
    ['Units opened', state.units.opened.join(', ') || 'none'],
    ['Finds recovered', `${summary.artifacts} (${summary.artifactsAnalysed} analysed)`],
    ['Finds lost or never recovered', String(summary.missed)],
    ['Features recorded', `${summary.featuresComplete} complete of ${summary.features} exposed`],
    ['Dating samples', String(summary.samples)],
    ['Professional decisions resolved', String(summary.ethicsResolved)]
  ].forEach(([k, v]) => h.push(`<tr><th>${escHTML(k)}</th><td>${escHTML(v)}</td></tr>`));
  h.push('</table>');

  h.push('<h2>Performance profile</h2><table>');
  h.push('<tr><th>Dimension</th><th>Band</th><th>Detail</th></tr>');
  profile.forEach((dim) => {
    h.push(`<tr><td>${escHTML(dim.label)}</td><td class="band" style="color:${bandTone(dim.band)}">${escHTML(dim.band)}</td><td>${escHTML(dim.detail)}</td></tr>`);
  });
  h.push('</table>');

  h.push('<h2>Conclusions</h2>');
  REPORT_QUESTIONS.forEach((q) => {
    const a = state.report.answers[q.id];
    h.push('<div class="q">');
    h.push(`<h3>${q.number}. ${escHTML(q.prompt)}</h3>`);
    if (!a || !a.claim) {
      h.push('<p>Not answered.</p></div>');
      return;
    }
    const cited = (a.evidence || []).map((id) => {
      const e = evidenceById(id);
      return e ? `${e.label} [${e.quality} quality]` : id;
    });
    h.push(`<p><span class="lbl">Conclusion:</span> ${escHTML(a.claim.trim())}</p>`);
    h.push(`<p><span class="lbl">Confidence:</span> ${escHTML(a.confidence || 'not stated')}</p>`);
    h.push(`<p><span class="lbl">Evidence cited:</span> ${cited.length ? escHTML(cited.join('; ')) : 'none'}</p>`);
    h.push(`<p><span class="lbl">Reasoning:</span> ${escHTML((a.reasoning || '').trim() || 'none given')}</p>`);
    h.push('</div>');
  });
  REPORT_OPEN_FIELDS.forEach((f) => {
    h.push('<div class="q">');
    h.push(`<h3>${f.number}. ${escHTML(f.prompt)}</h3>`);
    h.push(`<p>${escHTML((state.report.open[f.id] || '').trim() || 'Not answered.')}</p>`);
    h.push('</div>');
  });

  const selections = [];
  Object.entries(state.synthesis.selections).forEach(([domainId, statements]) => {
    Object.entries(statements).forEach(([statementId, payload]) => selections.push({ domainId, statementId, ...payload }));
  });
  if (selections.length) {
    h.push('<h2>Synthesis conclusions</h2><table>');
    h.push('<tr><th>Domain</th><th>Statement</th><th>Standing</th></tr>');
    selections.forEach((s) => {
      const standing = s.support === 'supported' ? 'supported'
        : (s.acknowledgedSpeculative ? 'speculative, acknowledged' : 'speculative, not acknowledged');
      h.push(`<tr><td>${escHTML(s.domainId)}</td><td>${escHTML(s.statementId)}</td><td>${escHTML(standing)}</td></tr>`);
    });
    h.push('</table>');
  }

  h.push('<h2>Activity timeline</h2>');
  h.push('<p class="meta">Every recorded action in the order it happened, with time elapsed since the session began.</p>');
  h.push('<table class="timeline"><tr><th>Time</th><th>Action</th><th>What</th><th>Detail</th></tr>');
  events().forEach((e) => {
    h.push(`<tr><td>${escHTML(formatDuration(e.elapsedMs || 0))}</td><td>${escHTML(e.verb)}</td><td>${escHTML(e.name || e.objectId)}</td><td>${escHTML(eventDetail(e))}</td></tr>`);
  });
  h.push('</table>');

  h.push('</body></html>');
  return h.join('\n');
}

function download(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeName() {
  return (state.studentName || 'student').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

async function copy(text, label) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      toast(`${label} copied to the clipboard.`, 'info');
      return;
    }
  } catch (e) { /* fall through to the manual path */ }
  const box = byId('copyFallbackText');
  box.value = text;
  modal.open({ id: 'copyFallbackOverlay', dismissible: true, initialFocus: '#copyFallbackText' });
  box.select();
}

export function initReport() {
  byId('closeReportBtn').addEventListener('click', () => modal.close(PANEL));
  byId('closeResultsBtn').addEventListener('click', () => modal.close(RESULTS_PANEL));
  byId('downloadCsvBtn').addEventListener('click', () => {
    download(`redstone-bluff-${safeName()}.csv`, toCSV(), 'text/csv;charset=utf-8;');
    record('export_csv', 'completed', { station: 9 });
  });
  byId('downloadReportBtn').addEventListener('click', () => {
    download(`redstone-bluff-report-${safeName()}.txt`, buildReportText(), 'text/plain;charset=utf-8;');
    record('export_report', 'completed', { station: 9 });
  });
  byId('downloadHtmlBtn').addEventListener('click', () => {
    download(`redstone-bluff-report-${safeName()}.html`, buildReportHTML(), 'text/html;charset=utf-8;');
    record('export_report_html', 'completed', { station: 9 });
  });
  byId('copyReportBtn').addEventListener('click', () => copy(buildReportText(), 'Report'));
  byId('copyXapiBtn').addEventListener('click', () => copy(toXAPI(), 'xAPI statements'));
  byId('closeCopyFallbackBtn').addEventListener('click', () => modal.close('copyFallbackOverlay'));
}
