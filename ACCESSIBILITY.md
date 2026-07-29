# Accessibility Report — Redstone Bluff Archaeological Investigation

_Last updated: 2026-07-29 (final functional/accessibility regression review)_

## Accessibility target

This project is **designed and tested to conform to WCAG 2.2 Level AA**, and every
applicable **WCAG 2.1 Level AA** success criterion was reviewed for ADA Title II
purposes. Conformance was verified through automated tooling, code inspection,
and manual keyboard/zoom/reflow/text‑spacing testing in a Chromium‑based browser.

**This is not a claim of full ADA/WCAG certification.** Some criteria depend on
assistive technology and hardware that were not available in the build
environment (a running screen reader, a forced‑colors operating system, a
physical VR headset). Those items are listed under _Remaining limitations_ with
their current mitigation. Use the phrasing:

> "Designed and tested to conform to WCAG 2.2 Level AA, with the limitations
> documented in the accessibility report."

## Core principle: an equivalent non‑3D investigation

A learner can complete the **entire** investigation — the same learning
objectives, decisions, evidence, feedback, progress, assessment, and final
report — **without a mouse, touch, a 3D scene, WebGL, WebXR, spatial audio,
color perception, precise timing, or drag gestures.**

This is delivered by **Guided Accessible Mode**, a full DOM/keyboard/screen‑reader
experience that shares the **same investigation state, educational content,
scoring logic, save data, evidence system, and final report** as the 3D view.
It is not a reduced quiz — it opens the identical station panels the 3D mode
opens.

- Offered explicitly on the start screen: **"Explore in 3D"** and
  **"Use Guided Accessible Mode."**
- Toggleable at any time in **Settings → Accessibility → Guided Accessible Mode**;
  switching **preserves all progress** (both modes read one shared state object).
- Selected **automatically** when WebGL is unavailable, but **not restricted** to
  that case.
- Spatial information is provided as text: structured location lists, a
  "Map as a location list" with compass bearings/distances from the site datum,
  ordered stratigraphic profiles as text, per‑level excavation records, and
  evidence lists/tables.

WebXR and the 3D scene are **progressive enhancements** and are never required.

## Automated tools used

| Tool | Version | Scope | Result |
|---|---|---|---|
| axe‑core | 4.10.2 | WCAG 2.0/2.1/2.2 A & AA rulesets | 0 violations across gate, guided station panel, report form, results panel, and 3D HUD after fixes (1 violation found and fixed). 1 `color-contrast` result was returned as *incomplete* (14 nodes over semi‑transparent/canvas backgrounds axe cannot compute) and was verified manually — see below. |
| Custom contrast script | — | Every text/UI color pair in `styles/main.css` (relative‑luminance formula, rgba flattened over real backdrops) | Failing pairs identified and fixed; recomputed to pass. |
| DOM integrity check | — | Duplicate IDs, single `main`, orphan `label[for]`, empty buttons, broken `aria-labelledby`/`describedby`, landmark counts | All clean: 0 duplicate IDs, 1 `main`, 0 orphan labels, 0 empty buttons, 0 broken ARIA refs. |
| Project logic test suite | — | `tests/index.html` (109 tests: state, day costs, gating, evidence, migration, assessment, telemetry, start‑gate routing, inert world‑targeting, plus DOM‑level suites that click real rendered controls and pin the gate/dialog stacking order in the stylesheet) | 109/109 passing. |

_Lighthouse and the Nu HTML validator were not run in this environment. Their
checks are substantially covered by axe‑core (accessibility) and the DOM
integrity script (structure/uniqueness). Running them is a recommended
next step — see "Recommended next actions."_

## Manual tests performed (in a Chromium‑based browser)

1. **Keyboard only** — Tab/Shift+Tab order, Enter/Space activation, Escape to
   close optional dialogs, focus trapping inside modals, and focus restoration
   to the opener on close. Verified across notebook, evidence, settings, report,
   and results panels.
2. **Full guided (non‑3D) playthrough** — completed the whole investigation
   through Guided Accessible Mode without touching the canvas: equipment →
   survey → unit choice → excavation → lab → dating → features → synthesis →
   ethics → Evidence Room → report submission → results. Reached the final
   report with no console errors.
3. **Live mode switching** — toggled 3D ↔ Guided mid‑investigation; station,
   days remaining, and all recorded evidence were preserved each way.
4. **Report validation path** — submitting an incomplete report shows a text
   error summary (`role="alert"`), moves focus to it, and **does not clear**
   any entered answers.
5. **200% zoom** and **320 CSS‑px reflow** — no horizontal scrolling; panels
   stay within the viewport.
6. **Text‑spacing override** (line‑height 1.5, letter 0.12em, word 0.16em,
   paragraph 2em) — no clipping or overflow.
7. **Contrast** — measured, not estimated (see automated tools).
8. **WebGL failure fallback** — WebGL‑unavailable path routes to Guided
   Accessible Mode automatically.
9. **Save / resume / new / reset** — resume restores the exact state and mode
   without re‑charging days or re‑awarding rewards; starting a new
   investigation over a save requires explicit confirmation.
10. **Guided/3D parity (2026‑07‑29)** — a strong playthrough and a
   poor‑decision playthrough were each executed in both modes with identical
   choices (the equipment station driven through the real panel in each mode,
   the remainder through the shared simulation helpers). Evidence identifiers,
   day logs, assessment bands, and investigation summaries were byte‑identical
   between modes in both scenarios, and the poor‑decision path still permitted
   report submission.
11. **Start‑gate regression matrix (2026‑07‑29)** — direct start (both modes),
   direct Settings, direct Resume, cancel‑then‑resume, Escape‑dismiss,
   repeated alternation, Enter/Space activation, preference changes before
   start/resume, and reload‑after‑cancel. No pending action ever leaked to
   another button and none survived a reload.
12. **Corrupt and legacy saves (2026‑07‑29)** — unparseable saves are reported
   at the gate with Resume disabled; version‑1 saves migrate; future‑version
   saves are rejected without crashing.

### Not performed in this environment (do not assume covered)

- A **running screen reader** (VoiceOver, NVDA, JAWS, Orca, TalkBack). Screen‑reader
  *semantics* were verified with axe‑core and DOM inspection, but no AT was run.
- A **forced‑colors / Windows High Contrast** operating system. Author CSS for
  `forced-colors: active` was added but not verified on such an OS.
- A **physical VR headset**. XR comfort settings and controls were implemented
  and code‑reviewed but not run on hardware.
- Full **screen‑magnifier** and **voice‑control** software passes.

## Issues found and fixed

| # | Criterion | Issue | Fix |
|---|---|---|---|
| 1 | 2.4.7 / 2.4.11 Focus Appearance | The `:focus-visible` outline used `--accent`, which is invisible on the accent‑colored primary/VR/active‑tab buttons (1.0:1). | Two‑tone focus ring: a dark inner outline + a light outer halo, so focus is visible on light, dark, and accent surfaces. |
| 2 | 1.4.3 Contrast | `.pill-bad` (3.72:1) and `.pill-good` (4.33:1) small labels failed. | Pills given a solid dark background with bright text (≥8.8:1) plus a colored border (non‑color cue). |
| 3 | 1.4.11 Non‑text Contrast | Input/control borders (`--panel-border`, 1.68:1) too faint to bound text fields. | New `--control-border` (≥3:1) on inputs, textareas, choice buttons, item cards, tabs, and icon buttons. |
| 4 | 1.1.1 / 4.1.2 Canvas | The WebGL canvas was `aria-hidden`; the minimap and Evidence‑Room map/profile canvases lacked text equivalents. | Canvas now `role="img"` with a description pointing to the equivalent controls; Evidence Room adds a text "Map as a location list" (bearings/distances) and text stratigraphic profiles; minimap labeled as decorative with a pointer to the text equivalents. |
| 5 | 1.3.1 / 4.1.2 Grouping | Choice sets across stations were bare button groups with no programmatic name. | Each question's choices wrapped in `role="group"` with the prompt as the accessible name (survey, excavation, laboratory, chronology, features, ethics, equipment, report). |
| 6 | 3.3.2 Labels | The report open‑response textarea and the copy‑to‑clipboard textarea had no programmatic label. | Added associated `<label for>` / `aria-label`. |
| 7 | 3.3.1 / 2.4.3 Errors | On failed report submit, focus did not reliably land on the error summary. | `#reportErrors` made focusable and focused; summary is an `role="alert"` with a heading, guidance ("nothing has been cleared"), and a list. |
| 8 | 4.1.3 Status Messages | "Still to record/do" completeness notices were not announced. | Given `role="status" aria-live="polite"`. |
| 9 | 2.1.1 Keyboard | The scrollable report text (`<pre>`) and the notes list were not keyboard‑scrollable. | Added `tabindex="0"` and an accessible name (axe `scrollable-region-focusable`). |
| 10 | 1.3.6 / 1.3.1 Landmarks | The 3D shell had no landmarks. | Added `region`/`nav` landmarks to the HUD, scene chrome, and gate; one `main` for the guided experience; the guided header buttons became a labeled `nav`. |
| 11 | 1.4.12 / 1.4.10 | No very‑narrow reflow rules; no explicit text‑spacing safety. | Added a 320 px reflow breakpoint and defensive `overflow-wrap` on copy. |
| 12 | 1.4.13 / forced‑colors | No Windows High Contrast support. | Added a `@media (forced-colors: active)` block preserving borders/state cues. |
| 13 | 2.3.3 Motion | Reduced‑motion only covered a subset. | Reduced‑motion now also disables pseudo‑element animation, caps iteration counts, and forces `scroll-behavior: auto`; honors both the OS preference and the in‑app setting. |
| 14 | 3.2.6 Consistent Help | Guided mode lacked a "Controls and help" affordance. | Added a Controls/help button to the guided header; help text now documents keyboard, touch, guided‑mode, and XR controls. |
| 15 | 2.1.1 Keyboard | Pressing Enter or Space with focus on a start‑gate or guided‑mode button threw an uncaught error: the global shortcut handler raycast from the 3D camera, which does not exist before a 3D session. The same raycast could also steal Enter/Space from a focused control in 3D mode and, after a 3D→guided switch, activate world objects from behind the guided page. | `targetFromCamera`/`targetFromScreenPoint` are now inert (return null) without a camera; the world‑interact shortcut is skipped in guided mode and never fires while an interactive control has keyboard focus. Covered by two new regression tests. |
| 16 | 3.3.7 / settings persistence | Accessibility preferences changed at the start gate (for example larger text or high contrast) were silently reverted by Resume, because loading the save replaced `state.settings` with the older copy stored inside it and never re‑applied the preferences mirror or refreshed the interface CSS. | Resume now re‑applies the stored preferences mirror after loading the save and refreshes the interface, so the learner's latest accessibility choices always win. Verified live: text scale 1.3 and high contrast set at the gate survive Resume, and the investigation still restores exactly (station, days, records). |
| 17 | Robustness (corrupt saves) | A saved investigation that was not even parseable JSON produced no resume card and no explanation; the learner was still asked to "discard the saved investigation" when starting fresh. | Unparseable saves are now treated like unmigratable ones: the gate explains the save could not be read and disables Resume. Starting fresh works normally. |
| 18 | 2.4.7 / visual presentation of dialogs | Every dialog opened from the start screen — the discard confirmation, Settings, and help — rendered BEHIND the opaque start gate (`.gate` had z‑index 90; `.panelOverlay` 80; toasts 70), so buttons appeared to do nothing. Focus even moved into the invisible dialog, leaving keyboard users typing into a panel they could not see. Clicking Resume hid the gate and revealed the stale dialog, which read as "Resume ran the other button's action." | The gate now sits at z‑index 60, below both the panel overlays and the toast stack, so start‑screen dialogs and status toasts paint on top of it. Verified with rendered hit‑testing (`document.elementFromPoint` at the dialog centre) and a screenshot, plus a stylesheet regression test that pins panelOverlay > gate and toastStack > gate. `beginSession` additionally closes any dialog left open at the gate. |

## Remaining issues / unmet‑until‑verified criteria

For each, WCAG SC · affected interface · user impact · mitigation · next action · priority.

1. **1.4.1/1.3.1 (via screen reader) — Screen‑reader validation** · whole app ·
   Users relying on AT may hit a nuance not caught by static analysis · Semantics
   verified with axe‑core + DOM inspection; reading order checked · **Run a full
   pass with VoiceOver and NVDA** · High.
2. **4.1.2 — Tab widgets** (`Evidence Room`, `Notebook`) · screen‑reader users ·
   Tabs are implemented as labeled toggle buttons with `aria-pressed`
   (keyboard‑operable, named) rather than the ARIA `tablist`/`tab`/`tabpanel`
   pattern with arrow‑key traversal · Functional and operable today ·
   **Upgrade to the full ARIA Tabs pattern** · Medium.
3. **1.4.11 — color‑contrast (axe incomplete, 14 nodes)** · assorted text over
   semi‑transparent tints/canvas · axe could not compute these automatically ·
   Palette measured manually and adjusted to pass · **Re‑confirm with a manual
   sampler on final colors** · Low.
4. **1.4.13 — forced‑colors** · Windows High Contrast users · Rules added but not
   verified on a forced‑colors OS · **Verify on Windows High Contrast** · Medium.
5. **2.5.x / VR — WebXR** · headset users · Comfort features implemented, not
   hardware‑tested · See _WebXR limitations_ · Medium (XR is optional).
6. **4.1.3 — time‑cost announcements** · screen‑reader users · Day costs are
   written to the notebook and shown in the HUD/guided stats; not every
   individual day charge is spoken aloud · The three‑week budget is a
   resource system, never a real‑time timer, so there is no time pressure ·
   **Consider a concise live announcement when days are spent** · Low.

## WebXR‑specific accessibility (and limitations)

Implemented (code‑reviewed, **not** hardware‑tested):

- XR is **never required**; the desktop and guided experiences are complete
  without it, and entering/leaving XR does not disturb them.
- **Snap turning** (30/45/90°, configurable) and **teleport locomotion** are the
  defaults; **smooth locomotion is off by default** and opt‑in, with a comfort
  vignette.
- **Seated play** is supported: teleport + snap turn need no room‑scale walking;
  no rapid head movement is required.
- A **left‑wrist menu** exposes objective, notebook, evidence, and settings, so
  information is not gated behind spatial placement, and modal panels are mirrored
  into a comfortable world‑space surface.
- Controller instructions are provided as **visible text** in the Controls panel.
- Feedback is textual/visual; controller vibration is not used as the only cue.

Limitations:

- Not validated on a physical headset in this environment. Comfort tuning,
  panel readability at distance, and controller‑ray ergonomics should be checked
  on device.
- WebXR availability and behavior vary by browser/headset; on browsers without
  WebXR the "Enter VR" control stays hidden and the investigation is unaffected.

## Non‑3D equivalent access — summary

Guided Accessible Mode covers, with equivalent depth and the same scoring:
field‑equipment preparation, site survey, evidence classification, unit
selection, excavation decisions, provenience/documentation decisions, artifact
analysis, dating analysis, feature interpretation, daily‑life reconstruction,
ethics scenarios, Evidence Room review, claim‑evidence‑reasoning interpretation,
limitations/future‑work responses, and the final report with CSV / report / xAPI
export. All learning outcomes in the original proposal are supported in both
modes.

## Known third‑party limitations

- **Three.js** renders the optional 3D scene. Its `<canvas>` output is not itself
  screen‑reader navigable; equivalent access is provided by the DOM UI and
  Guided Accessible Mode, and the canvas carries a descriptive `role="img"` name.
- **WebXR Device API** support and comfort depend on the user's browser and
  headset; the app degrades gracefully when it is absent.
- No analytics, fonts, or scripts are loaded from third parties at runtime; the
  site is fully static and self‑contained (the automated axe‑core check above
  was injected only during testing, not shipped).

## How to report an accessibility problem

If you encounter an accessibility barrier in this project, please open an issue
on the project repository
(<https://github.com/HuskyJesus/ArchaeologyWebXR/issues>) describing:

- the page/mode (3D or Guided Accessible Mode) and the activity,
- your browser, operating system, and any assistive technology and version,
- what you expected and what happened.

We aim to acknowledge reports and propose a remediation or workaround. Where a
fix cannot be made immediately, the issue and its interim mitigation will be
recorded in this document.

## Recommended next actions (prioritized)

1. Full screen‑reader pass (VoiceOver + NVDA). _High._
2. Verify forced‑colors on Windows High Contrast. _Medium._
3. On‑device WebXR comfort/readability check. _Medium._
4. Upgrade Evidence Room / Notebook tabs to the ARIA Tabs pattern. _Medium._
5. Run Lighthouse and the Nu HTML validator in CI. _Low._
