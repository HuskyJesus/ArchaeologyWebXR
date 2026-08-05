/* Station 3 content: excavation, level by level.

   Each level is a short sequence of procedural decisions. The decisions are
   generated from a small set of step factories so the same idea is not
   re-typed for every level, while the wording stays specific to the context
   the learner is actually standing in.

   `effects` is the only channel by which a decision changes the world:
     days            days spent (or saved, if negative is ever used)
     doc             per-level documentation flags that determine provenience
     grantFinds      artifact ids recovered only because of this decision
     missFinds       artifact ids permanently lost because of this decision
     sample          a dating sample and its quality
     contextLoss     records that stratigraphic context was destroyed here
     featureIntegrity  condition a feature is left in
*/

import { UNIT_ORDER } from './site.js';

/* ---------- step factories ---------- */

function methodStep(ctx) {
  const disturbed = ctx.disturbed === true;
  return {
    id: 'method',
    kind: 'method',
    prompt: 'How will you remove this level?',
    detail: ctx.detail,
    options: [
      {
        id: 'trowel',
        text: 'Trowel the whole level in thin passes',
        correct: !disturbed,
        defensible: disturbed,
        feedback: disturbed
          ? 'Careful, and nothing is lost by it, but this level has already been mixed by ploughing. The time spent troweling a disturbed context is time not spent on the intact deposits below.'
          : 'Correct. Thin trowel passes let you see a colour or texture change at the moment it appears, which is the only way to catch a boundary before you have dug through it.',
        effects: disturbed ? { days: 1, doc: { method: 'trowel' } } : { doc: { method: 'trowel' } }
      },
      {
        id: 'skim',
        text: 'Shovel-skim in shallow passes, then trowel where anything changes',
        correct: disturbed,
        defensible: !disturbed,
        feedback: disturbed
          ? 'Correct. Shovel-skimming a plough zone in shallow, controlled passes is standard practice: the context is already mixed, so the priority is to reach intact deposits without wasting the project schedule.'
          : 'Defensible in a disturbed context, but not here. This level is intact, and a shovel takes off more than you can watch.',
        effects: disturbed ? { doc: { method: 'skim' } } : { doc: { method: 'skim' }, contextLoss: true }
      },
      {
        id: 'mattock',
        text: 'Take it out quickly with a mattock to save time',
        correct: false,
        feedback: 'This removes soil faster than anyone can observe it. Boundaries, small finds and feature edges all disappear at once, and none of it can be recovered afterwards.',
        effects: { doc: { method: 'mattock' }, contextLoss: true, missFinds: ctx.mattockMisses || [] }
      }
    ]
  };
}

function photoStep(ctx) {
  return {
    id: 'photo',
    kind: 'photo',
    prompt: 'Before anything is removed, what do you record?',
    detail: ctx.detail,
    requiresCapability: 'photograph',
    options: [
      {
        id: 'photoScaled',
        text: 'Photograph the level surface with a scale and north arrow, then draw the plan',
        correct: true,
        requires: ['photograph', 'photoScale'],
        feedback: 'Correct. A scaled, oriented photograph plus a plan drawing is a record another archaeologist can use without you standing next to it.',
        effects: { doc: { photographed: true, planned: true } }
      },
      {
        id: 'photoOnly',
        text: 'Take a quick photograph without a scale',
        correct: false,
        defensible: true,
        requires: ['photograph'],
        feedback: 'Better than nothing, and it preserves the general appearance. But without a scale or north arrow nobody can measure or orient anything in it later.',
        effects: { doc: { photographed: true } }
      },
      {
        id: 'noPhoto',
        text: 'Skip the photograph and start removing soil',
        correct: false,
        feedback: 'The level surface exists once. Removing it without a record means this stage of the unit is gone from the archive permanently.',
        effects: {}
      }
    ]
  };
}

function screenStep(ctx) {
  return {
    id: 'screen',
    kind: 'screen',
    prompt: 'What happens to the soil you remove?',
    detail: ctx.detail,
    requiresCapability: 'screening',
    options: [
      {
        id: 'screenAll',
        text: 'Screen all of it through quarter-inch mesh, bagged by level',
        correct: true,
        requires: ['screening'],
        feedback: 'Correct. Small material is invisible in the unit floor and only shows up on the screen.',
        effects: { doc: { screened: true } }
      },
      {
        id: 'flotation',
        text: 'Screen all of it, and take a ten-litre soil sample for flotation as well',
        correct: true,
        requires: ['screening', 'flotation'],
        feedback: 'The strongest option available. Quarter-inch mesh recovers artifacts; flotation recovers charred seeds and nutshell that would otherwise pass straight through.',
        effects: { doc: { screened: true, floated: true }, days: 1 }
      },
      {
        id: 'noScreen',
        text: 'Sort by eye in the unit and barrow the soil straight to the spoil heap',
        correct: false,
        feedback: 'Faster, and it costs you everything small: beads, fish bone, small debitage. Those categories will simply be absent from your assemblage, and absence is easy to mistake for evidence.',
        effects: { missFinds: ctx.screenMisses || [] }
      }
    ]
  };
}

function depthStep(ctx) {
  return {
    id: 'depth',
    kind: 'record',
    prompt: 'How is the position of this level and its finds recorded?',
    detail: ctx.detail,
    options: [
      {
        id: 'instrument',
        text: 'Shoot level opening and closing elevations and each point find with the total station',
        correct: true,
        requires: ['preciseProvenience'],
        feedback: 'Correct. Three-dimensional coordinates against the site datum survive the excavation and let anyone reconstruct the deposit.',
        effects: { doc: { measured: 'precise' } }
      },
      {
        id: 'lineLevel',
        text: 'Measure depth below datum with line level and tape, and record finds by level and quadrant',
        correct: true,
        defensible: true,
        requires: ['depth', 'measure'],
        feedback: 'A sound, entirely standard method. Slightly coarser than instrument survey, but a complete and usable record.',
        effects: { doc: { measured: 'standard' } }
      },
      {
        id: 'estimate',
        text: 'Estimate depth from the surface by eye and note it in the notebook',
        correct: false,
        feedback: 'An estimate from a sloping ground surface is not a depth below datum. Levels recorded this way cannot be reliably compared between units.',
        effects: { doc: { measured: 'estimated' } }
      }
    ]
  };
}

function baggingStep(ctx) {
  return {
    id: 'bag',
    kind: 'bag',
    prompt: 'How is the material from this level bagged?',
    detail: ctx.detail,
    options: [
      {
        id: 'byContext',
        text: 'Separate bags by level and by context, each tagged with unit, level, depth and date',
        correct: true,
        requires: ['bagging'],
        feedback: 'Correct. The bag and its tag are the artifact record. Once material from two contexts shares a bag, they cannot be separated again.',
        effects: { doc: { bagged: 'context' } }
      },
      {
        id: 'byLevel',
        text: 'One bag for the whole level, tagged with unit and level',
        correct: false,
        defensible: true,
        requires: ['bagging'],
        feedback: 'Acceptable for a uniform level, and it is what you have here for most of it. But material from inside a feature must never share a bag with material from around it.',
        effects: { doc: { bagged: 'level' } }
      },
      {
        id: 'oneBag',
        text: 'Everything from the unit so far into one bag; sort it at the laboratory',
        correct: false,
        feedback: 'Nothing can be sorted back into levels at the laboratory, because the information that would allow it was never written down. This collapses the whole unit into a single undifferentiated pile.',
        effects: { doc: { bagged: 'mixed' }, contextLoss: true }
      }
    ]
  };
}

function soilStep(ctx) {
  return {
    id: 'soil',
    kind: 'soil',
    prompt: ctx.prompt || 'The soil has changed. What do you do about it?',
    detail: ctx.detail,
    requiresCapability: 'soilColour',
    options: [
      {
        id: 'newLevel',
        text: 'Stop at the change, record the colour with the Munsell book, describe the texture, and open a new level at the boundary',
        correct: true,
        requires: ['soilColour'],
        feedback: ctx.correctFeedback || 'Correct. A soil change is usually a change in what was happening here. Following the natural boundary rather than an arbitrary ten centimetres keeps the deposits separate.',
        effects: { doc: { soilRecorded: true } }
      },
      {
        id: 'noteOnly',
        text: 'Note the change in the notebook but keep digging to the planned depth',
        correct: false,
        defensible: true,
        feedback: 'The observation is recorded, which is worth something. But continuing through the boundary mixes two deposits, and the note cannot separate them again afterwards.',
        effects: { doc: { soilRecorded: true }, contextLoss: true }
      },
      {
        id: 'ignore',
        text: 'Keep digging to the planned depth without recording it',
        correct: false,
        feedback: 'The boundary was the most informative thing in this level, and it is now both crossed and unrecorded.',
        effects: { contextLoss: true }
      }
    ]
  };
}

function charcoalStep(ctx) {
  return {
    id: 'sample',
    kind: 'sample',
    prompt: 'A charcoal concentration is exposed in a sealed context. How do you collect it?',
    detail: ctx.detail,
    requiresCapability: 'sampling',
    options: [
      {
        id: 'clean',
        text: 'Clean the trowel, lift the charcoal into foil and a clean container, and label it with unit, level, depth and context on the spot',
        correct: true,
        requires: ['sampling'],
        feedback: 'Correct. This is a submittable sample: clean handling, immediate labelling, and a context that can be defended when the date comes back.',
        effects: { sample: { quality: 'clean' }, doc: { sampled: true } }
      },
      {
        id: 'contaminated',
        text: 'Scoop it up with the trowel you have been using and bag it with the level material to label later',
        correct: false,
        feedback: 'The laboratory will still return a number. That is the danger. A sample handled with a soil-loaded tool and labelled from memory produces a date nobody can defend, and there is no way to tell afterwards that it is wrong.',
        effects: { sample: { quality: 'contaminated' }, doc: { sampled: true } }
      },
      {
        id: 'skip',
        text: 'Leave it. Charcoal is common and the project is short of days',
        correct: false,
        feedback: 'This is the only absolute dating opportunity this context will ever offer. Everything else on the site can only be dated relatively.',
        effects: {}
      }
    ]
  };
}

function intrusiveStep(ctx) {
  return {
    id: 'intrusive',
    kind: 'intrusive',
    prompt: ctx.prompt,
    detail: ctx.detail,
    options: [
      {
        id: 'recordIntrusive',
        text: 'Record it in place with its depth, bag it separately as intrusive, and note the disturbance in the level record',
        correct: true,
        feedback: 'Correct. Intrusive material dates the disturbance, not the deposit. Recording it precisely is how the depth of mixing gets defined.',
        effects: { doc: { intrusiveRecorded: true } }
      },
      {
        id: 'bagWithLevel',
        text: 'Bag it with the rest of the level material',
        correct: false,
        feedback: 'Now a nineteenth-century object shares a bag with a prehistoric assemblage, and the next person to open that bag has no way to know they do not belong together.',
        effects: { contextLoss: true }
      },
      {
        id: 'discard',
        text: 'Throw it on the spoil heap; it is not part of the occupation being studied',
        correct: false,
        feedback: 'Discarding it destroys the evidence for how deeply the deposit was disturbed, which is a genuine research question and not a nuisance.',
        effects: { contextLoss: true, missFinds: ctx.discardMisses || [] }
      }
    ]
  };
}

function stopStep(ctx) {
  return {
    id: 'stop',
    kind: 'stop',
    prompt: 'The soil below this level is clean, uniform and free of cultural material. What now?',
    detail: ctx.detail,
    options: [
      {
        id: 'stopAndRecord',
        text: 'Take the unit down one further sterile spit to confirm, draw and photograph the profile of all four walls, then close the unit',
        correct: true,
        feedback: 'Correct. One confirming spit guards against a false floor, and the profile drawing is the permanent record of the whole sequence you just removed.',
        effects: { days: 1, doc: { profileRecorded: true } }
      },
      {
        id: 'stopNow',
        text: 'Stop here and backfill; the schedule is tight',
        correct: false,
        defensible: true,
        feedback: 'Understandable under time pressure, and stopping at sterile soil is the right instinct. But closing without a profile record loses the stratigraphic sequence, which is often the most valuable thing a unit produces.',
        effects: {}
      },
      {
        id: 'keepDigging',
        text: 'Keep excavating well below sterile soil in case something is deeper',
        correct: false,
        feedback: 'Excavating sterile subsoil spends days that the project does not have, and on an eroding site those days matter. Sterile soil confirmed by one further spit is a defensible stopping point.',
        effects: { days: 3 }
      }
    ]
  };
}

function featureStep(ctx) {
  return {
    id: 'feature',
    kind: 'feature',
    prompt: ctx.prompt,
    detail: ctx.detail,
    featureId: ctx.featureId,
    options: [
      {
        id: 'recordFirst',
        text: 'Stop, define the edges, and record the feature fully before removing any of it',
        correct: true,
        feedback: 'Correct. A feature only exists as a relationship between soil, contents and surroundings, and that relationship is destroyed by excavation.',
        effects: { featureIntegrity: 'good' }
      },
      {
        id: 'digThrough',
        text: 'Excavate through it and record what is found',
        correct: false,
        feedback: 'The contents survive; the feature does not. Shape, depth, fill sequence and relationship to the surrounding layers are all gone, and those are what distinguish a storage pit from a hearth from a natural hollow.',
        effects: { featureIntegrity: 'damaged', contextLoss: true }
      }
    ]
  };
}

/* ---------- level scripts ---------- */

export const UNIT_LEVELS = {
  unitA: [
    {
      level: 1,
      depthLabel: '0 to 10 cm below datum',
      soil: { munsell: '10YR 3/2', name: 'very dark greyish brown silt loam' },
      context: 'Plough zone. Structure has been destroyed by cultivation, and material in it has been moved.',
      narrative: 'The first level comes up loose and uniform, with straight plough scars visible across the unit floor. Sherds, flakes and a corroded nail all turn up together, which cannot be their original relationship.',
      steps: [
        photoStep({ detail: 'The unit has been cleaned back to a flat surface and the grid string is in place.' }),
        methodStep({ disturbed: true, detail: 'Plough scars run the full width of the unit. Nothing in this level is in its original position.', mattockMisses: ['ar_glass'] }),
        screenStep({ detail: 'Even a disturbed level holds the assemblage; what is lost is where each piece came from.', screenMisses: ['ar_glass'] }),
        intrusiveStep({
          prompt: 'A corroded iron nail comes out of the screen alongside prehistoric pottery. What do you do with it?',
          detail: 'The nail is rectangular in section and tapers on two sides only.',
          discardMisses: ['ar_nail_cut', 'ar_glass']
        }),
        baggingStep({ detail: 'Mixed plough-zone material, plus one clearly intrusive historic object.' })
      ],
      finds: [
        { artifact: 'ar_nail_cut', requires: null },
        { artifact: 'ar_glass', requires: 'screen' }
      ],
      feature: null
    },
    {
      level: 2,
      depthLabel: '10 to 24 cm below datum',
      soil: { munsell: '10YR 2/1', name: 'black, greasy silt loam with abundant charcoal flecks' },
      context: 'Midden. Accumulated domestic refuse, undisturbed below the plough zone.',
      narrative: 'The soil changes abruptly: black, greasy, and full of bone, shell and charcoal. This is refuse that accumulated where people lived, and it has not been touched since.',
      steps: [
        soilStep({
          detail: 'The boundary between the brown plough zone and the black deposit below is sharp enough to trace with a trowel tip.',
          correctFeedback: 'Correct. That sharp boundary is the base of the plough zone, and everything below it is intact. Recording it defines the depth of disturbance for the whole site.'
        }),
        methodStep({ disturbed: false, detail: 'Intact refuse deposit, dense with fragile bone.', mattockMisses: ['ar_animal_bone', 'ar_shell_bead'] }),
        photoStep({ detail: 'The midden surface is cleaned and the change in colour is dramatic in plan.' }),
        screenStep({
          detail: 'Fish bone and beads in a midden are small. Nothing this size is found by eye in the unit floor.',
          screenMisses: ['ar_shell_bead']
        }),
        depthStep({ detail: 'The midden surface slopes, so a single depth figure will not describe it.' }),
        baggingStep({ detail: 'Dense faunal material, ceramics and one very small ornament.' })
      ],
      finds: [
        { artifact: 'ar_sherd_cordmarked', requires: null },
        { artifact: 'ar_animal_bone', requires: null },
        { artifact: 'ar_shell_bead', requires: 'screen' },
        { artifact: 'ar_charred_plant', requires: 'flotation' }
      ],
      feature: 'ft_midden'
    },
    {
      level: 3,
      depthLabel: '24 to 36 cm below datum',
      soil: { munsell: '7.5YR 4/4', name: 'brown silt loam with a reddened, ash-filled basin' },
      context: 'Occupation surface with a fire feature cut into it.',
      narrative: 'Below the midden the soil lightens, and a roughly circular patch of reddened, ash-filled soil ringed by fire-cracked rock appears against the unit wall.',
      steps: [
        featureStep({
          featureId: 'ft_hearth',
          prompt: 'A ring of fire-cracked rock around reddened, ash-filled soil is emerging. What do you do?',
          detail: 'The feature is about 60 cm across and continues into the north wall of the unit.'
        }),
        charcoalStep({ detail: 'The ash fill contains clean lumps of charcoal, sealed beneath the midden and well away from the plough zone.' }),
        photoStep({ detail: 'The hearth is cleaned, the fire-cracked rock ring is exposed in plan.' }),
        depthStep({ detail: 'The hearth base needs an elevation of its own, separate from the level.' }),
        baggingStep({ detail: 'Material from inside the hearth and material from the surrounding level are two different contexts.' })
      ],
      finds: [
        { artifact: 'ar_fcr', requires: null },
        { artifact: 'ar_charcoal_sample', requires: 'sample' }
      ],
      feature: 'ft_hearth'
    },
    {
      level: 4,
      depthLabel: '36 to 62 cm below datum',
      soil: { munsell: '10YR 3/3', name: 'dark brown loam, with a bell-shaped dark fill cutting the level' },
      context: 'Occupation surface cut by a deep pit.',
      narrative: 'A dark circular stain about a metre across cuts the level. Sectioned, it proves to be steep-sided and slightly wider at the base than the top, with distinct fill layers.',
      steps: [
        featureStep({
          featureId: 'ft_storagepit',
          prompt: 'A dark circular stain cuts the level surface. How do you proceed?',
          detail: 'Cleanly bounded, about one metre across, clearly cutting the surrounding deposit.'
        }),
        soilStep({
          prompt: 'The pit fill is layered, and the layers differ from each other. How do you excavate it?',
          detail: 'At least three distinct fills are visible in the section: a basal lens, a charcoal-rich band, and a homogeneous upper fill.',
          correctFeedback: 'Correct. Excavating a pit by its own fill layers rather than by arbitrary spits is what allows the sequence of its use and abandonment to be read.'
        }),
        photoStep({ detail: 'The half-sectioned pit shows its profile, which is the single most diagnostic view of it.' }),
        screenStep({ detail: 'Pit fills often hold the best-preserved material on a site.', screenMisses: ['ar_charred_plant'] }),
        baggingStep({ detail: 'Each fill layer is a separate context.' })
      ],
      finds: [
        { artifact: 'ar_groundstone_mano', requires: null },
        { artifact: 'ar_charred_plant', requires: 'flotation' }
      ],
      feature: 'ft_storagepit'
    },
    {
      level: 5,
      depthLabel: '62 to 74 cm below datum',
      soil: { munsell: '10YR 5/6', name: 'yellowish brown silty clay, clean and uniform' },
      context: 'Sterile subsoil.',
      narrative: 'The soil turns uniformly yellowish brown and clean. No charcoal, no bone, no artifacts, and no change in texture across the whole unit floor.',
      steps: [
        stopStep({ detail: 'Two spits have produced nothing. The unit walls show the full sequence from plough zone to subsoil.' })
      ],
      finds: [],
      feature: null,
      sterile: true
    }
  ],

  unitB: [
    {
      level: 1,
      depthLabel: '0 to 12 cm below datum',
      soil: { munsell: '10YR 4/3', name: 'brown silt loam, thin and disturbed' },
      context: 'Eroding bluff-edge surface. Thin, disturbed, and actively being lost to the river.',
      narrative: 'The unit sits a metre back from the bluff edge. The north wall is already undercut, and slumped soil lies on the beach three metres below.',
      steps: [
        {
          id: 'shoring',
          kind: 'safety',
          prompt: 'The wall nearest the river is undercut. What do you do before excavating?',
          detail: 'A vertical crack runs parallel to the bluff edge about 40 cm back from the face.',
          requiresCapability: 'shoring',
          options: [
            {
              id: 'shore',
              text: 'Stabilise and shore the undercut wall, then continue',
              correct: true,
              requires: ['shoring'],
              feedback: 'Correct, and it costs a day rather than the unit. A collapse would take both the crew and the stratigraphic sequence this unit exists to record.',
              effects: { days: 1, doc: { shored: true } }
            },
            {
              id: 'setBack',
              text: 'Move the unit one metre further back from the edge and re-stake it',
              correct: true,
              defensible: true,
              feedback: 'A sound alternative, and safer still. It costs a day of re-setting and puts the deepest deposits slightly further from the exposure, but the sequence is still recoverable.',
              effects: { days: 1, doc: { shored: true } }
            },
            {
              id: 'ignore',
              text: 'Work quickly and stay clear of that wall',
              correct: false,
              feedback: 'Excavation vibration on an undercut face is exactly what triggers a collapse. If that wall goes, the profile goes with it, and someone may be standing under it.',
              effects: { contextLoss: true }
            }
          ]
        },
        photoStep({ detail: 'The eroding face itself is part of the record and will not exist next season.' }),
        methodStep({ disturbed: true, detail: 'The upper level here is thin, root-disturbed and partly slumped.', mattockMisses: [] }),
        screenStep({ detail: 'Even a thin disturbed level is worth screening on an eroding site, because it may be all that survives.', screenMisses: [] }),
        baggingStep({ detail: 'Thin, mixed surface material.' })
      ],
      finds: [],
      feature: null
    },
    {
      level: 2,
      depthLabel: '12 to 30 cm below datum',
      soil: { munsell: '5YR 4/6', name: 'yellowish red silty clay lens with a discrete charcoal band' },
      context: 'A distinct clay lens, sealed, with a charcoal band running through it.',
      narrative: 'A sharply defined reddish clay lens appears, wedge-shaped in the profile, thickening toward the river. A thin charcoal band runs through the middle of it, uninterrupted for the full width of the unit.',
      steps: [
        soilStep({
          detail: 'The clay lens has an unambiguous upper and lower boundary in the profile.',
          correctFeedback: 'Correct. A sealed lens with clear boundaries is the best kind of context: anything inside it arrived at one time and has not been disturbed since.'
        }),
        charcoalStep({ detail: 'The charcoal band is sealed above and below by clay, well away from any root or modern disturbance.' }),
        photoStep({ detail: 'The profile view of the lens is more informative than the plan view.' }),
        depthStep({ detail: 'The lens changes thickness across the unit, so single-point depths will not describe it.' }),
        baggingStep({ detail: 'Lens material must be kept separate from the levels above and below it.' })
      ],
      finds: [
        { artifact: 'ar_charcoal_sample', requires: 'sample' }
      ],
      feature: null
    },
    {
      level: 3,
      depthLabel: '30 to 48 cm below datum',
      soil: { munsell: '10YR 3/2', name: 'very dark greyish brown loam with charcoal flecks' },
      context: 'Late occupation horizon, sealed beneath the clay lens.',
      narrative: 'Below the clay the soil darkens again and cultural material returns: cord-marked pottery, a small triangular point, and scattered fire-cracked rock. This deposit is sealed by the lens above it.',
      steps: [
        methodStep({ disturbed: false, detail: 'Intact sealed horizon.', mattockMisses: ['ar_point_triangular'] }),
        photoStep({ detail: 'The point is in place against the west wall, and can be photographed exactly where it lay.' }),
        depthStep({ detail: 'A diagnostic point in a sealed horizon is worth a precise position rather than a level attribution.' }),
        screenStep({ detail: 'Small debitage from resharpening will not be visible in the unit floor.', screenMisses: ['ar_debitage'] }),
        baggingStep({ detail: 'A sealed horizon assemblage, with one point find worth its own bag.' })
      ],
      finds: [
        { artifact: 'ar_point_triangular', requires: null },
        { artifact: 'ar_sherd_cordmarked', requires: null },
        { artifact: 'ar_debitage', requires: 'screen' }
      ],
      feature: null
    },
    {
      level: 4,
      depthLabel: '48 to 76 cm below datum',
      soil: { munsell: '10YR 5/4', name: 'yellowish brown silt, then a second dark band at 62 cm' },
      context: 'Culturally sterile band, then a second, deeper buried occupation horizon.',
      narrative: 'Twelve centimetres of clean silt separate the last level from something new: a second dark band, with a large stemmed point, heavy fire-cracked rock, and no pottery at all.',
      steps: [
        soilStep({
          prompt: 'A band of clean silt separates two dark, artifact-bearing layers. How do you handle it?',
          detail: 'The sterile band is continuous across the whole unit and roughly 12 cm thick.',
          correctFeedback: 'Correct. A sterile band between two occupation horizons is the clearest stratigraphic evidence there is for separate occupations with a gap between them. It has to be recorded as a context in its own right.'
        }),
        methodStep({ disturbed: false, detail: 'The lower horizon is intact and has never been ploughed.', mattockMisses: ['ar_point_stemmed'] }),
        photoStep({ detail: 'The profile now shows two dark bands separated by clean silt, which is the whole argument of this unit in one image.' }),
        charcoalStep({ detail: 'Charcoal is scattered through the lower dark band, sealed beneath twelve centimetres of clean silt. Nothing modern can have reached it.' }),
        depthStep({ detail: 'The relationship between the two horizons is the finding here, and it is a matter of measured elevations.' }),
        {
          id: 'noPottery',
          kind: 'observe',
          prompt: 'This lower horizon has produced no pottery at all, unlike the horizon above it. How do you treat that?',
          detail: 'Forty litres of soil screened from the lower horizon: stone, bone and fire-cracked rock, no ceramics.',
          options: [
            {
              id: 'recordAbsence',
              text: 'Record the absence explicitly in the level record, with the volume screened',
              correct: true,
              feedback: 'Correct. An absence is only evidence if you can show you looked. Recording the screened volume turns "no pottery" into a usable observation rather than a gap.',
              effects: { doc: { absenceRecorded: true } }
            },
            {
              id: 'assume',
              text: 'Assume the pottery simply has not appeared yet and say nothing',
              correct: false,
              defensible: true,
              feedback: 'Caution about arguing from absence is healthy. But saying nothing means nobody later can tell the difference between "no pottery here" and "nobody checked".',
              effects: {}
            },
            {
              id: 'conclude',
              text: 'Conclude immediately that this proves a pre-ceramic occupation',
              correct: false,
              feedback: 'The right direction, stated far too strongly on a single unit. Absence in one two-metre square is suggestive; combined with a diagnostic point form and a sterile separation it becomes an argument. State it that way.',
              effects: {}
            }
          ]
        },
        baggingStep({ detail: 'Two horizons and a sterile band between them: three contexts, not one level.' })
      ],
      finds: [
        { artifact: 'ar_point_stemmed', requires: null },
        { artifact: 'ar_fcr', requires: null },
        { artifact: 'ar_charcoal_sample', requires: 'sample', deep: true }
      ],
      feature: 'ft_naturalstain'
    },
    {
      level: 5,
      depthLabel: '76 to 90 cm below datum',
      soil: { munsell: '10YR 6/6', name: 'brownish yellow clay, clean and uniform' },
      context: 'Sterile subsoil.',
      narrative: 'Clean clay, no inclusions, no colour change. The profile above it now shows the full sequence: plough zone, clay lens, upper occupation, sterile band, lower occupation.',
      steps: [
        stopStep({ detail: 'The profile of this unit is the most important record the project will produce.' })
      ],
      finds: [],
      feature: null,
      sterile: true
    }
  ],

  unitC: [
    {
      level: 1,
      depthLabel: '0 to 14 cm below datum',
      soil: { munsell: '10YR 3/3', name: 'dark brown silt loam, root-disturbed' },
      context: 'Turf and root zone over the depression fill.',
      narrative: 'The unit crosses the edge of the depression, with the stone alignment running through its western half. The turf comes off to reveal that the alignment stones sit on a deliberately levelled surface.',
      steps: [
        photoStep({ detail: 'The alignment must be planned before any of it is lifted.' }),
        methodStep({ disturbed: true, detail: 'Turf and root zone. Nothing below it has been ploughed.', mattockMisses: [] }),
        {
          id: 'alignment',
          kind: 'observe',
          prompt: 'The stone alignment continues into the unit. How do you treat the stones themselves?',
          detail: 'Nine slabs, flat faces upward, sitting on a levelled surface.',
          options: [
            {
              id: 'planInPlace',
              text: 'Plan every stone at scale, record levels on each, and leave them in place',
              correct: true,
              feedback: 'Correct. The stones are individually unremarkable. Their positions relative to each other and to the depression are the entire evidence.',
              effects: { doc: { planned: true, alignmentRecorded: true } }
            },
            {
              id: 'liftSample',
              text: 'Lift two stones to check what is underneath, then replace them',
              correct: false,
              defensible: true,
              feedback: 'Checking what the stones sit on is a real research question, and lifting a small sample after planning is a defensible way to answer it. Doing it before planning would not be.',
              effects: { doc: { alignmentRecorded: true } }
            },
            {
              id: 'clear',
              text: 'Clear the stones off to reach the deposits below more quickly',
              correct: false,
              feedback: 'The alignment is the structural evidence. Removing it unplanned destroys the only thing that distinguishes this from a random stone scatter.',
              effects: { contextLoss: true, featureIntegrity: 'damaged' }
            }
          ]
        },
        screenStep({ detail: 'Turf and root zone still holds displaced material from the fill below.', screenMisses: [] }),
        baggingStep({ detail: 'Root zone material, kept separate from the structural deposits below.' })
      ],
      finds: [],
      feature: 'ft_alignment'
    },
    {
      level: 2,
      depthLabel: '14 to 30 cm below datum',
      soil: { munsell: '10YR 3/2', name: 'very dark greyish brown loam, compacted' },
      context: 'Structure fill over a compacted surface.',
      narrative: 'Beneath the root zone the fill becomes compacted and noticeably harder underfoot. Cleaning the surface reveals five dark circular stains, each about 15 cm across, arranged on an arc.',
      steps: [
        featureStep({
          featureId: 'ft_postmolds',
          prompt: 'Five small dark circular stains appear on an arc across the unit. What do you do?',
          detail: 'Each stain is about 15 cm across, evenly spaced at roughly 90 cm intervals, following the curve of the depression edge.'
        }),
        soilStep({
          prompt: 'The surface below the fill is noticeably harder and flatter than anything above it. How do you record it?',
          detail: 'A compacted, level surface extending across the unit, truncated at the depression edge.',
          correctFeedback: 'Correct. A prepared or trampled floor surface is a context in its own right, and the stains cut into it are what make the arc meaningful.'
        }),
        photoStep({ detail: 'The arc of stains only reads as an arc in plan, photographed from directly above.' }),
        depthStep({ detail: 'The spacing and the depth of each stain both matter for the structural argument.' }),
        baggingStep({ detail: 'Fill above the floor and the floor surface itself are different contexts.' })
      ],
      finds: [],
      feature: 'ft_postmolds'
    },
    {
      level: 3,
      depthLabel: '30 to 44 cm below datum',
      soil: { munsell: '7.5YR 3/2', name: 'dark brown loam with a reddened patch near the unit centre' },
      context: 'Occupation floor with an interior fire feature.',
      narrative: 'On the floor, inside the line of stains, sits a small basin of reddened soil and ash, less than half the size of an outdoor hearth. Around it lie a bone awl, a broken mano, and a scatter of small debitage.',
      steps: [
        featureStep({
          featureId: 'ft_interiorhearth',
          prompt: 'A small reddened basin sits on the floor, inside the line of post stains. What do you do?',
          detail: 'About 35 cm across, shallow, no surrounding rock ring, ash fill.'
        }),
        photoStep({ detail: 'The spatial relationship between the hearth, the post stains and the finds is the record.' }),
        charcoalStep({ detail: 'The hearth basin holds clean charcoal, sealed by the structure fill and cut into a floor that nothing later has disturbed.' }),
        depthStep({ detail: 'Objects lying on a floor surface deserve individual positions, not a level attribution.' }),
        screenStep({ detail: 'Craft debris on a house floor is small and easily missed.', screenMisses: ['ar_debitage'] }),
        baggingStep({ detail: 'Floor assemblage, hearth fill, and general level are three contexts.' })
      ],
      finds: [
        { artifact: 'ar_bone_awl', requires: null },
        { artifact: 'ar_groundstone_mano', requires: null },
        { artifact: 'ar_debitage', requires: 'screen' },
        { artifact: 'ar_charcoal_sample', requires: 'sample' },
        { artifact: 'ar_charred_plant', requires: 'flotation' }
      ],
      feature: 'ft_interiorhearth'
    },
    {
      level: 4,
      depthLabel: '44 to 58 cm below datum',
      soil: { munsell: '10YR 4/4', name: 'dark yellowish brown silt, thinning cultural material' },
      context: 'Construction level below the floor.',
      narrative: 'Below the floor the deposit thins quickly. The post stains continue as narrow shafts into the subsoil, and their bases are clear enough to measure.',
      steps: [
        depthStep({ detail: 'Post depth is the measurement that distinguishes a substantial building from a light shelter.' }),
        photoStep({ detail: 'The sectioned post stains show shaft profile and base, which cannot be seen in plan.' }),
        {
          id: 'postSection',
          kind: 'observe',
          prompt: 'How do you record the post stains themselves?',
          detail: 'Each stain continues 30 to 40 cm below the floor surface as a narrow shaft.',
          options: [
            {
              id: 'halfSection',
              text: 'Half-section each one, draw the profile, and record depth and diameter',
              correct: true,
              feedback: 'Correct. The profile shows whether the shaft was dug and packed or driven, and the depth indicates how much load the post carried.',
              effects: { doc: { planned: true, postsSectioned: true } }
            },
            {
              id: 'planOnly',
              text: 'Plan them in plan view only and leave them intact',
              correct: false,
              defensible: true,
              feedback: 'Conservative, and it preserves the feature for later work, which is a legitimate choice on a site that is not entirely threatened. Here the terrace is being lost to erosion, so leaving them unrecorded in section means they will never be recorded.',
              effects: { doc: { planned: true } }
            },
            {
              id: 'ignore',
              text: 'Note their positions and excavate straight through',
              correct: false,
              feedback: 'Depth and profile are the measurements that turn a set of stains into evidence for a built structure.',
              effects: { contextLoss: true, featureIntegrity: 'damaged' }
            }
          ]
        },
        baggingStep({ detail: 'Post fill is a separate context from the surrounding construction level.' })
      ],
      finds: [],
      feature: null
    },
    {
      level: 5,
      depthLabel: '58 to 70 cm below datum',
      soil: { munsell: '10YR 5/6', name: 'yellowish brown silty clay, clean' },
      context: 'Sterile subsoil.',
      narrative: 'Clean subsoil across the whole unit, cut only by the bases of the post shafts.',
      steps: [
        stopStep({ detail: 'The floor, the posts and the alignment are all recorded in plan and section.' })
      ],
      finds: [],
      feature: null,
      sterile: true
    }
  ],

  unitD: [
    {
      level: 1,
      depthLabel: '0 to 12 cm below datum',
      soil: { munsell: '10YR 4/3', name: 'brown silt loam, heavily compacted by vehicles' },
      context: 'Compacted track margin.',
      narrative: 'The soil here is compacted hard by vehicle traffic. Two pieces of modern plastic and a bottle cap come out of the first screen. Nothing else.',
      steps: [
        photoStep({ detail: 'A record of an empty unit is still a record, and a negative result is a real result.' }),
        methodStep({ disturbed: true, detail: 'Compacted, modern-disturbed ground.', mattockMisses: [] }),
        screenStep({ detail: 'Screening confirms the absence rather than assuming it.', screenMisses: [] }),
        baggingStep({ detail: 'Modern material, bagged and recorded as such.' })
      ],
      finds: [],
      feature: null
    },
    {
      level: 2,
      depthLabel: '12 to 26 cm below datum',
      soil: { munsell: '10YR 5/4', name: 'yellowish brown silt, no inclusions' },
      context: 'Clean silt. No cultural material.',
      narrative: 'The second level produces nothing at all. No charcoal, no bone, no stone. The unit is well outside the occupation.',
      steps: [
        methodStep({ disturbed: false, detail: 'Clean silt with no visible change.', mattockMisses: [] }),
        {
          id: 'reassess',
          kind: 'observe',
          prompt: 'Two levels have produced nothing. What is the right response?',
          detail: 'Eight project days have been spent on this unit so far.',
          options: [
            {
              id: 'recordAndClose',
              text: 'Take it one more level to confirm, record the negative result properly, close the unit, and put the remaining time into a unit supported by survey evidence',
              correct: true,
              feedback: 'Correct. A negative unit is genuine information about site extent, and recognising a placement error early is better practice than defending it. The lost days cannot be recovered, but the rest of the project can be.',
              effects: { doc: { negativeRecorded: true } }
            },
            {
              id: 'persist',
              text: 'Keep going deeper; something may still appear',
              correct: false,
              feedback: 'Nothing in the survey record ever pointed here. Continuing spends days the project does not have on a hypothesis with no support.',
              effects: { days: 3 }
            },
            {
              id: 'abandon',
              text: 'Backfill immediately and say nothing about it in the report',
              correct: false,
              feedback: 'Unreported negative results make a site look smaller than it is and mislead everyone who reads the report afterwards. Record it.',
              effects: { contextLoss: true }
            }
          ]
        },
        baggingStep({ detail: 'Nothing recovered. The level record still gets written.' })
      ],
      finds: [],
      feature: null
    },
    {
      level: 3,
      depthLabel: '26 to 38 cm below datum',
      soil: { munsell: '10YR 6/6', name: 'brownish yellow clay, clean' },
      context: 'Sterile subsoil.',
      narrative: 'Subsoil, clean and uniform. The unit is negative from top to bottom.',
      steps: [
        stopStep({ detail: 'A negative unit still needs a profile and a written record.' })
      ],
      finds: [],
      feature: null,
      sterile: true
    }
  ]
};

export function levelsForUnit(unitId) {
  return UNIT_LEVELS[unitId] || [];
}

export function levelCount(unitId) {
  return levelsForUnit(unitId).length;
}

export function levelAt(unitId, index) {
  return levelsForUnit(unitId)[index] || null;
}

/* All artifacts a unit can produce, ignoring learner decisions. Used by the
   evidence-availability tests and by the Evidence Room "what did you miss"
   summary. */
export function potentialFinds(unitId) {
  const out = [];
  levelsForUnit(unitId).forEach((lvl) => {
    (lvl.finds || []).forEach((f) => { if (!out.includes(f.artifact)) out.push(f.artifact); });
  });
  return out;
}

export function allPotentialFinds() {
  const out = [];
  UNIT_ORDER.forEach((u) => potentialFinds(u).forEach((a) => { if (!out.includes(a)) out.push(a); }));
  return out;
}
