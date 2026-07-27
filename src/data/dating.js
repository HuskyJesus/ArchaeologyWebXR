/* Station 5 content: dating the site.

   No date appears here unless the learner actually recovered a sample or a
   diagnostic artifact and it reached the laboratory. Results are keyed by
   the context the sample came from, and each has a clean and a contaminated
   version. A contaminated sample still returns a number, which is the point:
   the learner has to decide whether to trust it. */

export const RADIOCARBON_RESULTS = {
  'unitA-L3': {
    contextLabel: 'Unit A, level 3, rock-ringed hearth fill',
    material: 'Wood charcoal',
    clean: {
      bp: '970 +/- 40 BP',
      calibrated: 'cal AD 1020 to 1160 (2 sigma)',
      centre: 1090,
      reliable: true,
      note: 'Sealed beneath an intact midden, collected clean and labelled in the field. A defensible date for the hearth and for the occupation surface it was cut from.'
    },
    contaminated: {
      bp: '340 +/- 130 BP',
      calibrated: 'cal AD 1440 to 1810 (2 sigma)',
      centre: 1620,
      reliable: false,
      note: 'The laboratory flags anomalous carbon and a very large error term. The result is centuries later than every other line of evidence from the same deposit, which is what contamination with modern carbon looks like.',
      failureReason: 'contamination'
    }
  },
  'unitB-L2': {
    contextLabel: 'Unit B, level 2, charcoal band within the sealed clay lens',
    material: 'Wood charcoal',
    clean: {
      bp: '620 +/- 40 BP',
      calibrated: 'cal AD 1290 to 1400 (2 sigma)',
      centre: 1345,
      reliable: true,
      note: 'The clay lens overlies the occupation horizon, so this date sets a limit rather than dating the occupation: people were here before AD 1290 to 1400, and this flood deposit sealed the site afterwards.'
    },
    contaminated: {
      bp: '1420 +/- 150 BP',
      calibrated: 'cal AD 380 to 880 (2 sigma)',
      centre: 630,
      reliable: false,
      note: 'The laboratory reports a poor yield and a large error. This result would make the sealing layer older than the occupation it seals, which is stratigraphically impossible and is itself the clearest sign the sample cannot be used.',
      failureReason: 'contamination'
    }
  },
  'unitB-L4': {
    contextLabel: 'Unit B, level 4, lower buried occupation horizon',
    material: 'Wood charcoal',
    clean: {
      bp: '3480 +/- 50 BP',
      calibrated: 'cal 1890 to 1690 BC (2 sigma)',
      centre: -1790,
      reliable: true,
      note: 'From the horizon that produced the stemmed point and no pottery, separated from the upper occupation by a sterile band. This is the oldest securely dated context on the site.'
    },
    contaminated: {
      bp: '2100 +/- 180 BP',
      calibrated: 'cal 380 BC to cal AD 130 (2 sigma)',
      centre: -120,
      reliable: false,
      note: 'A large error and a result that sits awkwardly between the two occupations evidenced by everything else. Handled with a soil-loaded tool and labelled from memory, it cannot be defended.',
      failureReason: 'contamination'
    }
  },
  'unitC-L3': {
    contextLabel: 'Unit C, level 3, interior hearth on the structure floor',
    material: 'Wood charcoal',
    clean: {
      bp: '1010 +/- 40 BP',
      calibrated: 'cal AD 980 to 1160 (2 sigma)',
      centre: 1070,
      reliable: true,
      note: 'From a hearth cut into the floor inside the post arc. It dates the use of the structure, not merely the presence of people on the terrace.'
    },
    contaminated: {
      bp: '760 +/- 140 BP',
      calibrated: 'cal AD 1050 to 1420 (2 sigma)',
      centre: 1235,
      reliable: false,
      note: 'The error term is wide enough to span most of the later occupation. It does not contradict the other evidence, but it is too imprecise to add anything to it.',
      failureReason: 'contamination'
    }
  }
};

/* Typological and stylistic evidence. `source` is the artifact id that must
   have been recovered and analysed for the line to appear. */
export const TYPOLOGY_LINES = [
  {
    id: 'ty_triangular',
    source: 'ar_point_triangular',
    method: 'relative',
    label: 'Small unnotched triangular point',
    estimate: 'about AD 900 to 1400',
    centre: 1150,
    note: 'Point typology is a relative method. It places the artifact within a form sequence rather than measuring elapsed time, and the form was in use for centuries.'
  },
  {
    id: 'ty_stemmed',
    source: 'ar_point_stemmed',
    method: 'relative',
    label: 'Large stemmed point with ground stem margins',
    estimate: 'about 3000 to 1000 BC',
    centre: -2000,
    note: 'A much older form, and a wide range. On its own it would only suggest an earlier component; combined with stratigraphy and a radiocarbon date it becomes an argument.'
  },
  {
    id: 'ty_cordmarked',
    source: 'ar_sherd_cordmarked',
    method: 'relative',
    label: 'Grit-tempered cord-marked pottery',
    estimate: 'about AD 800 to 1300',
    centre: 1050,
    note: 'Ceramic style is a relative method with regional calibration. The range overlaps the triangular point range, which is a genuine convergence rather than a coincidence.'
  },
  {
    id: 'ty_nail',
    source: 'ar_nail_cut',
    method: 'relative',
    label: 'Machine-cut nail',
    estimate: 'about 1800 to 1890',
    centre: 1845,
    note: 'A historic-period manufacturing date. It dates the disturbance that put it into the plough zone, not the deposit it was found in.'
  },
  {
    id: 'ty_glass',
    source: 'ar_glass',
    method: 'relative',
    label: 'Manganese-decolourised mould-blown glass',
    estimate: 'about 1880 to 1920',
    centre: 1900,
    note: 'Another historic manufacturing date, and consistent with the nail. Together they define a nineteenth to early twentieth century phase of activity on the terrace.'
  }
];

/* Stratigraphic relationships available per unit once its levels are dug. */
export const STRATIGRAPHIC_LINES = {
  unitA: {
    id: 'st_unitA',
    label: 'Unit A sequence',
    method: 'relative',
    statement: 'Plough zone over midden over occupation surface with hearth, cut by a storage pit, over sterile subsoil.',
    note: 'Superposition gives order without dates. The midden must be later than the surface beneath it, and the plough zone later than both.'
  },
  unitB: {
    id: 'st_unitB',
    label: 'Unit B sequence',
    method: 'relative',
    statement: 'Disturbed surface, then a sealed clay lens, then an upper occupation horizon, then a sterile band, then a lower occupation horizon, then subsoil.',
    note: 'The sterile band between two artifact-bearing horizons is the strongest stratigraphic evidence for separate occupations with a gap between them.'
  },
  unitC: {
    id: 'st_unitC',
    label: 'Unit C sequence',
    label2: 'Structure sequence',
    method: 'relative',
    statement: 'Root zone over structure fill, over a compacted floor cut by post stains and an interior hearth, over subsoil, with the stone alignment on a prepared surface at the depression edge.',
    note: 'The posts and hearth cut the floor, so all three belong to one structural episode rather than to unrelated events.'
  },
  unitD: {
    id: 'st_unitD',
    label: 'Unit D sequence',
    method: 'relative',
    statement: 'Compacted track margin over clean silt over subsoil. No cultural deposits.',
    note: 'A negative sequence still constrains site extent, but it contributes nothing to chronology.'
  }
};

export const METHOD_CLASSIFICATION = {
  prompt: 'Sort each line of evidence by what it actually provides.',
  options: [
    { id: 'absolute', label: 'Absolute: gives a date in years' },
    { id: 'relative', label: 'Relative: gives order or a broad range, not a measured age' }
  ],
  feedback: {
    absoluteCorrect: 'Correct. Radiocarbon measures elapsed time and returns a date with a stated error range.',
    relativeCorrect: 'Correct. This orders or brackets events without measuring elapsed time.',
    absoluteWrong: 'This does not measure elapsed time. It places evidence in a sequence or a style range, which is relative dating.',
    relativeWrong: 'Radiocarbon measures elapsed time directly and returns a calibrated date range, which makes it an absolute method.'
  }
};

/* Conclusion questions. `requires` lists what must exist in the evidence set
   for the question to be answerable; the station hides questions the
   learner has no basis to answer rather than inviting a guess. */
export const DATING_QUESTIONS = [
  {
    id: 'oldest',
    prompt: 'What is the oldest occupation your evidence supports?',
    requires: { anyReliableDate: true },
    options: [
      { id: 'archaic', text: 'A Late Archaic occupation in the second millennium BC',
        requires: { context: 'unitB-L4' },
        verdict: 'best',
        feedback: 'Correct where the lower Unit B horizon was excavated and dated. Three independent lines agree: a stemmed point form, a sterile band separating it from the later occupation, and a radiocarbon date near 1800 BC.' },
      { id: 'woodland', text: 'A Late Woodland occupation around AD 1000 to 1150', verdict: 'conditional',
        feedback: 'This is the oldest occupation supported if the deeper Unit B horizon was never reached. It is a correct statement of what your evidence supports, and the report should say plainly that older deposits may exist and were not sampled.' },
      { id: 'historic', text: 'A nineteenth-century occupation', verdict: 'poor',
        feedback: 'The historic material is intrusive in the upper levels. It postdates everything else on the site rather than preceding it.' },
      { id: 'unknown', text: 'The evidence does not support any statement about the oldest occupation', verdict: 'conditional',
        feedback: 'Defensible only if no reliable date and no diagnostic artifact was recovered. If a diagnostic point or a clean radiocarbon date exists, a bounded statement is better than silence.' }
    ]
  },
  {
    id: 'mostRecent',
    prompt: 'What is the most recent pre-contact occupation your evidence supports?',
    requires: { anyReliableDate: true },
    options: [
      { id: 'woodland', text: 'A Late Woodland occupation around AD 1000 to 1150', verdict: 'best',
        feedback: 'Correct. Radiocarbon from the hearth contexts, the triangular point form and the cord-marked pottery all converge on this range, and the clay lens above seals the site afterwards.' },
      { id: 'archaic', text: 'The Late Archaic component is the most recent', verdict: 'poor',
        feedback: 'The Archaic horizon lies beneath a sterile band and beneath the pottery-bearing levels. Superposition makes it the earlier of the two.' },
      { id: 'historic', text: 'The nineteenth-century material represents the most recent pre-contact occupation', verdict: 'poor',
        feedback: 'Historic material is not pre-contact. It belongs to a separate, later phase of land use and should be reported as such.' },
      { id: 'unknown', text: 'The evidence does not support a statement about the most recent occupation', verdict: 'conditional',
        feedback: 'Only defensible if no reliable date and no diagnostic material was recovered at all.' }
    ]
  },
  {
    id: 'multiple',
    prompt: 'Does the site represent more than one occupation?',
    requires: {},
    options: [
      { id: 'yesStrong', text: 'Yes, and the evidence is stratigraphic as well as typological',
        requires: { context: 'unitB-L4' },
        verdict: 'best',
        feedback: 'The strongest available answer where Unit B was taken to the lower horizon. A sterile band physically separates two artifact-bearing deposits, the artifact assemblages differ in kind rather than only in quantity, and the radiocarbon dates are roughly three thousand years apart.' },
      { id: 'yesTypological', text: 'Yes, but the evidence is typological and intrusive material only', verdict: 'conditional',
        feedback: 'A careful and correct answer if the deep horizon was not excavated. Historic material above prehistoric material demonstrates more than one period of use, but without the buried horizon there is no stratigraphic evidence for two pre-contact occupations.' },
      { id: 'no', text: 'No, all the evidence points to a single occupation', verdict: 'poor',
        feedback: 'Historic nails and glass alone establish activity in at least two periods. A single-occupation claim is difficult to sustain on any excavated unit here.' },
      { id: 'unknown', text: 'Cannot be determined', verdict: 'conditional',
        feedback: 'Reasonable only where very little was recovered. If any historic material was recorded, at least two periods of use are demonstrated.' }
    ]
  },
  {
    id: 'disagreement',
    prompt: 'Where your dating methods disagree, what best explains it?',
    requires: {},
    multi: true,
    options: [
      { id: 'contamination', text: 'A contaminated sample returned a result that conflicts with everything else',
        requires: { contaminatedSample: true },
        verdict: 'best',
        feedback: 'Correct, and this is the case for at least one of your samples. A contaminated result is not a competing date to be averaged in; it is a result to be set aside with the reason recorded.' },
      { id: 'typologyRange', text: 'Typological ranges are broad, so they overlap rather than pinpoint', verdict: 'best',
        feedback: 'Correct. A point form used for four hundred years cannot resolve a century. Typology and radiocarbon are not in conflict when a wide range contains a narrow date; they are agreeing at different resolutions.' },
      { id: 'intrusive', text: 'Intrusive historic material dates the disturbance rather than the deposit',
        requires: { historicArtifact: true },
        verdict: 'best',
        feedback: 'Correct. A nineteenth-century nail in a level with prehistoric pottery is evidence of mixing, not evidence that the pottery is nineteenth century.' },
      { id: 'oldWood', text: 'Charcoal from long-lived wood can be older than the fire that burned it', verdict: 'best',
        feedback: 'Correct, and a real limitation worth stating even when nothing appears wrong. Heartwood from an old tree can predate its burning by centuries, which is why short-lived material such as a maize kernel or nutshell makes a better sample.' },
      { id: 'labError', text: 'The laboratory made a mistake', verdict: 'poor',
        feedback: 'Possible but not the first explanation to reach for, and not one you can support. Sample handling, context and the old-wood problem account for the discrepancies here.' },
      { id: 'noDisagreement', text: 'The methods do not disagree in any meaningful way', verdict: 'conditional',
        feedback: 'This may be true of your evidence set, and if so it is worth saying explicitly. Convergence between independent methods is a result, not an absence of one.' }
    ]
  },
  {
    id: 'reliability',
    prompt: 'Which of your radiocarbon results would you carry into the final report as reliable?',
    requires: { anyDate: true },
    kind: 'sampleReliability'
  }
];

export function radiocarbonFor(contextKey, quality) {
  const entry = RADIOCARBON_RESULTS[contextKey];
  if (!entry) return null;
  const result = quality === 'clean' ? entry.clean : entry.contaminated;
  return { contextKey, contextLabel: entry.contextLabel, material: entry.material, quality, ...result };
}
