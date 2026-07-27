/* Station 2 content: surface survey.

   Each object is inspected, classified, and then recorded (or not). The
   classification vocabulary deliberately separates portable artifacts from
   in-place evidence, because that distinction is what makes the later
   feature station meaningful.

   `defensible` lists answers that are wrong as a first choice but are not
   unreasonable given what is visible on the surface. They score between
   correct and incorrect and produce their own feedback. */

export const SURVEY_CLASSES = [
  { id: 'artifact', label: 'Portable artifact', hint: 'A made or modified object that can be lifted and catalogued.' },
  { id: 'featureIndicator', label: 'In-place evidence (possible feature)', hint: 'Something whose meaning depends on staying where it is: a stain, an alignment, a concentration, a depression.' },
  { id: 'modern', label: 'Modern debris', hint: 'Recent material. Still worth recording, but not part of the occupation under study.' },
  { id: 'natural', label: 'Natural, not cultural', hint: 'Formed by the river, roots, weather or animals rather than by people.' }
];

export const RECORDING_METHODS = [
  { id: 'instrument', label: 'Shoot the position with the total station', requires: 'preciseProvenience', quality: 'precise',
    blurb: 'Three-dimensional coordinates tied to the site datum.' },
  { id: 'gps', label: 'Take a GPS position and a compass bearing', requires: 'coarseProvenience', quality: 'approximate',
    blurb: 'Good to a few metres. Adequate for distribution, not for point provenience.' },
  { id: 'sketch', label: 'Sketch it onto the transect map with tape offsets', requires: 'forms', quality: 'sketch',
    blurb: 'Slower and less precise, but a real record.' },
  { id: 'none', label: 'Note it mentally and move on', requires: null, quality: 'none',
    blurb: 'No record leaves the field.' }
];

export const SURVEY_ITEMS = [
  {
    id: 'sv_biface',
    name: 'Chipped stone biface fragment',
    shape: 'biface',
    truth: 'artifact',
    tags: ['lithic', 'toolProduction', 'hunting'],
    desc: 'A flat, roughly leaf-shaped piece of grey stone about six centimetres long, broken across one end. Both faces carry overlapping shallow scars, and one edge is finely and evenly chipped along its whole length.',
    detail: 'Overlapping flake scars on both faces, regular edge retouch, a clean snap across the tip.',
    feedback: {
      artifact: 'Correct. Flaking on both faces in overlapping series, plus regular edge retouch, is deliberate shaping. Nothing in a river bed produces that pattern.',
      featureIndicator: 'This is a portable object rather than in-place evidence. It can be lifted and catalogued without destroying what makes it informative, which is the test for an artifact rather than a feature.',
      modern: 'Nothing here is machine-made. The fracture mechanics are conchoidal stone working, not manufacture.',
      natural: 'Natural breakage does not produce overlapping bifacial flake scars with regular edge retouch. This is a made tool.'
    }
  },
  {
    id: 'sv_debitage',
    name: 'Scatter of chipped stone flakes',
    shape: 'debitage',
    truth: 'artifact',
    tags: ['lithic', 'toolProduction', 'concentration'],
    desc: 'Eleven small pieces of the same grey stone lie within about two metres of each other. Several are thin and sharp with a flat striking platform at one end; a few are little more than chips.',
    detail: 'Striking platforms, bulbs of percussion, a size range from thin flakes down to pressure chips.',
    feedback: {
      artifact: 'Correct. Platforms and bulbs of percussion mark these as struck flakes, and a size range this wide in one spot is the signature of tool making rather than transport.',
      featureIndicator: 'A defensible instinct: the concentration itself is meaningful. Record the individual flakes as artifacts and note the concentration in the transect record so both survive.',
      modern: 'There is no modern manufacture here. This is worked stone.',
      natural: 'Water-broken stone does not leave flat platforms and bulbs of percussion, and it does not sort into a single raw material in one small patch.'
    },
    defensible: ['featureIndicator']
  },
  {
    id: 'sv_sherd',
    name: 'Cord-marked pottery sherd',
    shape: 'sherd',
    truth: 'artifact',
    tags: ['ceramic', 'potteryUse', 'woodland'],
    desc: 'A curved fragment of fired clay about five centimetres across. The outer surface carries close, parallel impressions running at a slight diagonal; the inner surface is smoothed. The break edges show a dark core.',
    detail: 'Curvature consistent with a vessel wall, cord impressions on the exterior, a reduced dark core from firing.',
    feedback: {
      artifact: 'Correct. Curvature, a fired and cored fabric, and cord impressions on the exterior are all manufacture. This is a vessel fragment.',
      featureIndicator: 'A sherd is portable. Lifting it costs nothing interpretively as long as its position is recorded first.',
      modern: 'Modern ceramics on this landscape are wheel-thrown or moulded and usually glazed. This is hand-built and surface-treated with cord.',
      natural: 'Fired clay with regular cord impressions does not occur naturally.'
    }
  },
  {
    id: 'sv_fcr',
    name: 'Fire-cracked rock concentration',
    shape: 'fcr',
    truth: 'featureIndicator',
    tags: ['fcr', 'cooking', 'concentration'],
    desc: 'About twenty angular rock fragments, many reddened and finely crazed, lie in a rough circle a little over a metre across. The soil between them is noticeably darker than the surrounding ground.',
    detail: 'Heat reddening and crazing on multiple fragments, angular breakage, a bounded circular distribution over darkened soil.',
    feedback: {
      featureIndicator: 'Correct. Individually these are just burnt rocks. Their arrangement over a dark soil patch is the evidence, and that arrangement only exists while they stay where they are.',
      artifact: 'Fire-cracked rock is cultural material, so this is not a wrong instinct. But bagging the rocks and walking away destroys the pattern, which is the informative part. Record it in place.',
      modern: 'A recent camp fire is worth considering. Here the crazing is heavy, the fragments are weathered, and the darkened soil extends below the surface, which points to something older and repeatedly used.',
      natural: 'Frost and fire both crack rock, but frost-shattered rock is not reddened and does not concentrate in a bounded circle over stained soil.'
    },
    defensible: ['artifact']
  },
  {
    id: 'sv_groundstone',
    name: 'Ground stone fragment',
    shape: 'groundstone',
    truth: 'artifact',
    tags: ['groundstone', 'plantProcessing'],
    desc: 'A dense, coarse-grained stone fragment about the size of a palm. One surface is noticeably flatter and smoother than the rest, with a faint sheen and very fine parallel striations.',
    detail: 'One face worn flat and polished, fine unidirectional striations, a fresh break on the opposite side.',
    feedback: {
      artifact: 'Correct. A single flattened, polished face with fine parallel striations is use-wear from grinding, not weathering.',
      featureIndicator: 'This is a portable tool fragment rather than in-place evidence.',
      modern: 'There is no evidence of machine shaping, and the wear runs in one direction across a single face.',
      natural: 'River wear rounds a stone all over. Wear confined to one flat face, with parallel striations, comes from use.'
    }
  },
  {
    id: 'sv_cobble',
    name: 'Rounded river cobble',
    shape: 'cobble',
    truth: 'natural',
    tags: [],
    desc: 'A smooth, evenly rounded stone about the size of a fist. Several similar stones lie within a few metres. The surface is uniformly worn on every side with no flat faces, scars or edges.',
    detail: 'Uniform rounding on all surfaces, no flake scars, no polished facet, no edge damage.',
    feedback: {
      natural: 'Correct. Even rounding on every surface with no modification is river transport. Leaving it, and saying why, is a real recording decision.',
      artifact: 'Look for a reason to call it modified. There is no flake scar, no worn facet, no edge. Without one, this is a stone.',
      featureIndicator: 'A single cobble among similar cobbles on a river terrace is not a pattern.',
      modern: 'Nothing about it is recent in any meaningful sense.'
    }
  },
  {
    id: 'sv_rootcast',
    name: 'Irregular dark soil streak',
    shape: 'rootcast',
    truth: 'natural',
    tags: [],
    desc: 'A narrow, branching dark line in the soil surface, roughly two centimetres wide, tapering and forking downslope. There is no charcoal, no burnt soil, and the edges are diffuse.',
    detail: 'Branching and tapering form, diffuse edges, no charcoal, no inclusions, no bounded shape.',
    feedback: {
      natural: 'Correct. Branching, tapering and diffuse is what a decayed root leaves behind. Cultural stains tend to have a bounded shape and contents.',
      featureIndicator: 'A reasonable thing to check, and worth a line in the notes. But a cultural stain normally has a definable edge and something inside it. This has neither.',
      artifact: 'A soil stain is not portable.',
      modern: 'Nothing indicates recent disturbance.'
    },
    defensible: ['featureIndicator']
  },
  {
    id: 'sv_stain',
    name: 'Dark circular soil discolouration',
    shape: 'stain',
    truth: 'featureIndicator',
    tags: ['stain', 'pit', 'concentration'],
    desc: 'A roughly circular patch of very dark soil about seventy centimetres across, with a fairly sharp edge against the lighter surrounding ground. Small charcoal flecks and two bone fragments are visible at the surface.',
    detail: 'Bounded circular outline, sharp edge, charcoal flecks and bone within it, colour clearly distinct from the matrix.',
    feedback: {
      featureIndicator: 'Correct. A bounded shape, a sharp edge, and contents that differ from the surrounding soil is the classic surface signature of a filled pit.',
      natural: 'Compare it with the root streak nearby. This one has an edge you can trace all the way round and contains charcoal and bone. That combination is not a decay stain.',
      artifact: 'The stain cannot be lifted. The charcoal and bone inside it can, but only after the outline is recorded.',
      modern: 'Recent disturbance usually shows loose fill, mixed modern debris and a disturbed surface. None of that is present.'
    }
  },
  {
    id: 'sv_alignment',
    name: 'Linear stone alignment',
    shape: 'alignment',
    truth: 'featureIndicator',
    tags: ['alignment', 'architecture', 'structure'],
    desc: 'Nine flat slabs of the local sandstone lie end to end in a line about four metres long, curving slightly. Most sit with their flattest face upward and their long axes aligned. The line runs across, not down, the slope.',
    detail: 'Consistent orientation, flat faces set upward, a curve rather than a straight fall line, running across the slope.',
    feedback: {
      featureIndicator: 'Correct. Stones do not sort themselves by orientation, sit flat face up, and curve across a slope. This is placement.',
      natural: 'Slope movement produces stones aligned down the fall line and randomly oriented. This runs across the slope with consistent orientation.',
      artifact: 'The individual slabs are unmodified. The arrangement is the evidence, and it disappears the moment they are collected.',
      modern: 'There is no mortar, no cut stone and no modern debris associated with it.'
    }
  },
  {
    id: 'sv_depression',
    name: 'Shallow circular depression',
    shape: 'depression',
    truth: 'featureIndicator',
    tags: ['depression', 'architecture', 'structure', 'duration'],
    desc: 'A saucer-shaped hollow roughly five metres across and perhaps thirty centimetres deep, on an otherwise level rise. The grass inside it grows noticeably darker and denser than outside. The stone alignment runs along one edge.',
    detail: 'Regular circular plan, shallow saucer profile, darker vegetation inside, on level ground rather than a drainage line, bordered by the alignment.',
    feedback: {
      featureIndicator: 'Correct. A regular circular hollow on level ground with richer vegetation inside is a strong candidate for a filled structure basin. Its relationship to the alignment matters as much as the hollow itself.',
      natural: 'A tree throw is irregular and paired with a mound; a sink or wallow follows drainage. This is regular, on level ground, and bordered by placed stone.',
      artifact: 'A five-metre depression is not a portable object.',
      modern: 'There is no recent disturbance, no spoil, and mature turf across the whole hollow.'
    }
  },
  {
    id: 'sv_can',
    name: 'Crushed aluminium can fragment',
    shape: 'can',
    truth: 'modern',
    tags: ['modern'],
    desc: 'A thin, partly crushed metal fragment lying at the edge of the access track. Traces of printed lettering and a machine-rolled seam are still visible.',
    detail: 'Rolled seam, printed lettering, uniform thin-gauge sheet metal.',
    feedback: {
      modern: 'Correct, and worth a line in the record rather than a shrug. Modern debris on the track margin helps define how much of the surface has been disturbed recently.',
      artifact: 'It is technically a made object, and calling it that is not absurd. But separating recent material from the occupation under study is exactly what the survey record is for.',
      natural: 'Rolled seams and printed lettering are manufacture.',
      featureIndicator: 'A single piece of track-side litter is not a pattern.'
    },
    defensible: ['artifact']
  },
  {
    id: 'sv_shell',
    name: 'Freshwater mussel shell scatter',
    shape: 'shell',
    truth: 'featureIndicator',
    tags: ['shell', 'diet', 'fishing', 'concentration'],
    desc: 'A dense patch of freshwater mussel shell, perhaps two metres across, sitting forty metres from and eight metres above the present river. Many valves are broken along one margin; a few are burnt. Fish bone is visible between them.',
    detail: 'Dense bounded patch well above and away from the water, broken valve margins, some burning, associated fish bone.',
    feedback: {
      featureIndicator: 'Correct. Shell this far above the river, concentrated, burnt in places and mixed with fish bone, is discarded food waste rather than a natural bed. The concentration is the evidence.',
      natural: 'A natural shell bed sits in or beside the water and is not burnt or mixed with fish bone. This is eight metres above the river.',
      artifact: 'Individual shells can be bagged, and a sample should be. But the deposit itself is what carries the dietary argument.',
      modern: 'Nothing here indicates recent deposition, and the deposit is turfed over.'
    },
    defensible: ['artifact']
  }
];

export const SURVEY_ITEM_IDS = SURVEY_ITEMS.map((i) => i.id);

export function surveyItemById(id) {
  return SURVEY_ITEMS.find((i) => i.id === id) || null;
}

/* Concentration comparison exercise, unlocked once most of the transect has
   been inspected. */
export const CONCENTRATION_QUESTIONS = [
  {
    id: 'densest',
    prompt: 'Which part of the transect holds the densest concentration of cultural material?',
    options: [
      { id: 'zoneNorth', text: 'North transect, toward the bluff', correct: true,
        feedback: 'Correct. Five separate classes of cultural material, including a fire-cracked rock concentration, cluster there. Density plus variety is the strongest surface signal on this site.' },
      { id: 'zoneWest', text: 'West transect, upslope', correct: false,
        feedback: 'Most of what is up there is natural: a river cobble and a root stain. The shell deposit is genuine, but it stands alone rather than in a dense cluster.' },
      { id: 'zoneRise', text: 'Low rise, south-west corner', correct: false,
        feedback: 'The rise carries the most structurally interesting evidence, but not the densest artifact scatter. Those are different arguments.' },
      { id: 'zoneTrack', text: 'Access track margin', correct: false,
        feedback: 'The only thing recorded there is modern. That is useful for defining disturbance, not for locating the occupation.' }
    ]
  },
  {
    id: 'structure',
    prompt: 'Which part of the transect gives the best evidence that people built something here rather than only passing through?',
    options: [
      { id: 'zoneRise', text: 'Low rise, south-west corner', correct: true,
        feedback: 'Correct. A regular circular depression bordered by a deliberate stone alignment is architectural evidence. Artifacts tell you activity happened; this tells you something was constructed.' },
      { id: 'zoneNorth', text: 'North transect, toward the bluff', correct: false,
        feedback: 'Dense discard indicates sustained activity, but discard alone does not demonstrate construction.' },
      { id: 'zoneWest', text: 'West transect, upslope', correct: false,
        feedback: 'The shell deposit speaks to diet, not to architecture.' },
      { id: 'zoneTrack', text: 'Access track margin', correct: false,
        feedback: 'Modern debris says nothing about the occupation.' }
    ]
  }
];
