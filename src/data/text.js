/* Narrative and framing copy, plus the definition of the eight stations and
   the final report questions. Kept in one place so wording can be revised
   without touching application logic. */

import { SITE } from './site.js';

export const STATIONS = [
  { number: 1, id: 'preparation', name: 'Preparing for the Field',
    objective: 'Build a field kit that can do the work this project needs.',
    location: 'camp' },
  { number: 2, id: 'survey', name: 'Surveying the Site',
    objective: 'Examine, classify and record what is visible on the surface, then recommend where to excavate.',
    location: 'survey' },
  { number: 3, id: 'excavation', name: 'Excavation',
    objective: 'Excavate your unit level by level, recording as you go.',
    location: 'grid' },
  { number: 4, id: 'laboratory', name: 'Artifact Identification Laboratory',
    objective: 'Analyse what you recovered, separating what you observed from what you infer.',
    location: 'lab' },
  { number: 5, id: 'chronology', name: 'Dating the Site',
    objective: 'Work out when the site was occupied, and which of your dating evidence can be trusted.',
    location: 'dating' },
  { number: 6, id: 'features', name: 'Feature Interpretation',
    objective: 'Record and interpret the features your excavation exposed.',
    location: 'grid' },
  { number: 7, id: 'synthesis', name: 'Reconstructing Daily Life',
    objective: 'Connect your evidence to what people actually did here.',
    location: 'synthesis' },
  { number: 8, id: 'ethics', name: 'Ethical Decisions',
    objective: 'Handle the professional situations the project puts in front of you.',
    location: 'camp' },
  { number: 9, id: 'report', name: 'Final Report',
    objective: 'Tell the story of Redstone Bluff, and justify every part of it.',
    location: 'evidence' }
];

export function stationByNumber(n) {
  return STATIONS.find((s) => s.number === n) || null;
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export const OPENING_BRIEFING = `Welcome to Redstone Bluff. I am ${SITE.supervisorName}.

Erosion along the Redstone River has cut into the terrace above us and exposed artifacts in the bluff face. The state office believes this may be an undocumented prehistoric settlement. A highway expansion gives us three weeks before construction begins on this ground.

Your job is not to collect artifacts. It is to reconstruct who lived here, when, and how, using evidence we can properly document before it is lost. Recording context is as important as finding things, and on a site like this it is more important, because context is the part that cannot be recovered later.

We will also be consulting with descendant communities as this work proceeds. That is a normal and essential part of professional practice here, not a formality at the end.

Start by building your field kit. What you take with you determines what you are able to do for the rest of the project.`;

export const ONBOARDING_STEPS = [
  { title: 'Look around', body: 'Drag with the mouse, use the left and right arrow keys, or click once to lock the cursor for free look.' },
  { title: 'Move', body: 'W and S, or up and down arrows, to move forward and back. A and D to step sideways.' },
  { title: 'Interact', body: 'Click a highlighted object, or press E, Enter or Space when its label appears.' },
  { title: 'Stay oriented', body: 'The objective button at the lower left always opens whatever you need to do next. Press R to face it.' }
];

export const REPORT_QUESTIONS = [
  {
    id: 'activities',
    number: 1,
    prompt: 'What activities took place at Redstone Bluff?',
    guidance: 'Draw on your artifact analysis, your features, and your synthesis conclusions. Name the activities you can support and say which evidence supports each.',
    minReasoning: 40,
    minEvidence: 2
  },
  {
    id: 'when',
    number: 2,
    prompt: 'When was the site occupied?',
    guidance: 'Distinguish absolute dates from relative evidence, and state the uncertainty attached to each. A range with a stated basis is stronger than a single year without one.',
    minReasoning: 40,
    minEvidence: 1
  },
  {
    id: 'multiple',
    number: 3,
    prompt: 'Was there more than one occupation?',
    guidance: 'If you argue for more than one, say what separates them: stratigraphy, artifact assemblages, dates, or a combination. If your evidence cannot settle it, say so and explain why.',
    minReasoning: 40,
    minEvidence: 1
  },
  {
    id: 'settlementType',
    number: 4,
    prompt: 'Was this a temporary camp, a seasonal site, or a longer-term settlement?',
    guidance: 'This is an inference from investment: refuse accumulation, storage, construction, heavy equipment, and seasonal indicators. Argue from what you recovered rather than from what sites like this usually are.',
    minReasoning: 40,
    minEvidence: 2
  }
];

export const REPORT_OPEN_FIELDS = [
  {
    id: 'uncertain',
    number: 5,
    prompt: 'What remains uncertain?',
    guidance: 'Name specific limits: contexts you did not reach, recovery methods you did not use, samples that failed, and areas of the site you never sampled.',
    minLength: 40
  },
  {
    id: 'nextSteps',
    number: 6,
    prompt: 'What should be investigated next, and why?',
    guidance: 'Recommend work that would test something you could not settle. Say what question each recommendation answers.',
    minLength: 40
  }
];

export const ASSESSMENT_DIMENSIONS = [
  { id: 'fieldPreparation', label: 'Field preparation' },
  { id: 'survey', label: 'Survey' },
  { id: 'excavation', label: 'Excavation' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'artifactAnalysis', label: 'Artifact analysis' },
  { id: 'chronology', label: 'Chronology' },
  { id: 'featureInterpretation', label: 'Feature interpretation' },
  { id: 'ethics', label: 'Ethics and professional practice' },
  { id: 'evidenceSynthesis', label: 'Evidence synthesis' }
];

export const HELP_TEXT = [
  'Move: W A S D, or the arrow keys.',
  'Look: drag the mouse, or click once to lock the cursor. Left and right arrows turn.',
  'Interact: press E, Enter or Space while an object is highlighted, or click it.',
  'Face the objective: press R.',
  'Open the objective task directly: the button at the lower left.',
  'Notebook: N. Evidence Room: V. Settings: comma. Report: P.',
  'Escape closes an optional panel, then releases the mouse cursor.',
  'On a touch screen, use the left stick to move, drag the right of the screen to look, and tap Interact.'
];
