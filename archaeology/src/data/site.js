/* Site-wide constants and the physical layout of Redstone Bluff.
   Everything that both the 3D scene and the text fallback need to agree on
   about "where things are" lives here. */

export const SITE = {
  half: 32,
  pitSize: 2.2,
  totalDays: 21,
  supervisorName: 'Dr. Elena Castillo, Field Director',
  siteName: 'Redstone Bluff',
  datum: { x: 0, z: 6, label: 'Site datum N0/E0' }
};

/* Named locations. `kind` maps to an interaction handler; `text` is the
   description used by the non-3D guided-access fallback. */
export const LOCATIONS = [
  { id: 'camp', kind: 'supervisor', x: 0, z: SITE.half - 6, label: 'Field Camp and Director',
    text: 'A shade canopy over a folding field desk. Dr. Castillo works through paperwork here between rounds of the site.' },
  { id: 'survey', kind: 'surveyZone', x: -15, z: -1, label: 'Surface Survey Transect',
    text: 'A roped transect of open ground sloping toward the bluff. Marked surface objects wait to be examined.' },
  { id: 'grid', kind: 'unitGrid', x: 1, z: 8, label: 'Excavation Grid',
    text: 'Staked grid squares laid out from the site datum. Candidate excavation units are pegged and labelled.' },
  { id: 'screen', kind: 'screen', x: 15, z: -3, label: 'Screening Station',
    text: 'A quarter-inch screen on a wooden frame beside a growing backdirt pile.' },
  { id: 'lab', kind: 'lab', x: 20, z: 3, label: 'Field Laboratory',
    text: 'Two folding tables under a canopy: hand lens, scale bar, Munsell book, drying racks, and labelled bags.' },
  { id: 'dating', kind: 'dating', x: 20, z: 9, label: 'Chronology Bench',
    text: 'A bench of sample containers, a stratigraphic profile drawing, and the laboratory report folder.' },
  { id: 'synthesis', kind: 'synthesis', x: -20, z: 9, label: 'Interpretation Table',
    text: 'A large table under a canopy where evidence cards are laid out and compared.' },
  { id: 'evidence', kind: 'evidence', x: -20, z: 2, label: 'Evidence Room',
    text: 'A records kiosk and pin board holding every record the investigation has produced so far.' }
];

export function locationById(id) {
  return LOCATIONS.find((l) => l.id === id) || null;
}

/* Candidate excavation units. `requires` gates a unit behind survey evidence
   the learner actually recorded. `placementQuality` drives the time cost and
   evidence yield of opening it. */
export const UNITS = {
  unitA: {
    id: 'unitA',
    x: -7,
    z: 9,
    grid: 'N4/W7',
    label: 'Unit A - Artifact Concentration',
    shortLabel: 'Unit A',
    hint: 'Centred on the densest surface scatter of flakes, sherds and fire-cracked rock recorded during survey.',
    rationale: 'A dense, varied surface scatter is the strongest single predictor of intact activity deposits below.',
    openCostDays: 4,
    placementQuality: 'strong',
    requires: [],
    theme: 'Everyday activity: food preparation, cooking, discard'
  },
  unitB: {
    id: 'unitB',
    x: 9,
    z: 11,
    grid: 'N6/E9',
    label: 'Unit B - Bluff-Edge Profile',
    shortLabel: 'Unit B',
    hint: 'Placed at the eroding bluff edge so the full soil sequence can be recorded before the river removes it.',
    rationale: 'A threatened profile is a defensible salvage priority and is the only place the deep sequence is reachable in three weeks.',
    openCostDays: 4,
    placementQuality: 'strong',
    requires: [],
    theme: 'Chronology and site formation: stratigraphy, buried horizons, disturbance'
  },
  unitC: {
    id: 'unitC',
    x: -14,
    z: 14,
    grid: 'N9/W14',
    label: 'Unit C - House Depression',
    shortLabel: 'Unit C',
    hint: 'Set across the edge of the shallow circular depression, cutting the stone alignment that borders it.',
    rationale: 'Sectioning the edge of a possible structure tests whether the depression is cultural without destroying its centre.',
    openCostDays: 5,
    placementQuality: 'strong',
    requires: ['sv_depression', 'sv_alignment'],
    requiresText: 'Available once the house depression and the stone alignment have both been recorded during survey.',
    theme: 'Structure and settlement: architecture, duration, household organisation'
  },
  unitD: {
    id: 'unitD',
    x: 18,
    z: -12,
    grid: 'S8/E18',
    label: 'Unit D - Open Ground (no recorded evidence)',
    shortLabel: 'Unit D',
    hint: 'Level, convenient ground near the access track. Nothing was recorded here during survey.',
    rationale: 'Convenience is not a research rationale. Nothing in the survey record points to deposits here.',
    openCostDays: 4,
    placementQuality: 'weak',
    requires: [],
    theme: 'Off-site: little or no cultural material'
  }
};

export const UNIT_ORDER = ['unitA', 'unitB', 'unitC', 'unitD'];

export function unitById(id) {
  return UNITS[id] || null;
}

/* Where each survey object sits on the ground, in site coordinates. */
export const SURVEY_POSITIONS = {
  sv_biface: [-19, -6],
  sv_debitage: [-16, -4],
  sv_sherd: [-13, -6],
  sv_fcr: [-17, 1],
  sv_groundstone: [-11, -2],
  sv_cobble: [-20, 2],
  sv_rootcast: [-13, 3],
  sv_stain: [-16, 5],
  sv_alignment: [-11, 6],
  sv_depression: [-14, 10],
  sv_can: [-9, 0],
  sv_shell: [-19, 7]
};

/* Concentration zones used by the survey comparison exercise. */
export const SURVEY_ZONES = [
  { id: 'zoneNorth', label: 'North transect (toward the bluff)', members: ['sv_biface', 'sv_debitage', 'sv_sherd', 'sv_fcr', 'sv_groundstone'] },
  { id: 'zoneWest', label: 'West transect (upslope)', members: ['sv_cobble', 'sv_rootcast', 'sv_stain', 'sv_shell'] },
  { id: 'zoneRise', label: 'Low rise (south-west corner)', members: ['sv_alignment', 'sv_depression'] },
  { id: 'zoneTrack', label: 'Access track margin', members: ['sv_can'] }
];
