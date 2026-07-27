/* Station 4 content: the artifact catalogue and its analysis framework.

   Every object a learner can recover is defined once here. Excavation levels
   and survey records reference these ids; the laboratory reads the same
   definitions. Nothing appears in the laboratory that was not actually
   recovered.

   Analysis deliberately separates observation from interpretation:
   material and object class are observable; function, period, age and
   activity are inferences with better and worse answers, and several have
   more than one defensible response. */

export const ANALYSIS_FIELDS = [
  { id: 'material', label: 'Material', kind: 'observation',
    prompt: 'What is it made of?' },
  { id: 'objectClass', label: 'Object class', kind: 'observation',
    prompt: 'What class of object is this?' },
  { id: 'function', label: 'Possible function', kind: 'interpretation',
    prompt: 'What was it most likely used for?' },
  { id: 'period', label: 'Period', kind: 'interpretation',
    prompt: 'Is this prehistoric, historic, modern, or not determinable?' },
  { id: 'age', label: 'Approximate age', kind: 'interpretation',
    prompt: 'What age range does the evidence actually support?' },
  { id: 'activity', label: 'Activity indicated', kind: 'interpretation',
    prompt: 'What activity at the site does this point to?' },
  { id: 'confidence', label: 'Confidence', kind: 'meta',
    prompt: 'How confident are you in this analysis?' }
];

export const CONFIDENCE_LEVELS = [
  { id: 'strong', label: 'Strong' },
  { id: 'probable', label: 'Probable' },
  { id: 'tentative', label: 'Tentative' },
  { id: 'insufficient', label: 'Insufficient evidence' }
];

/* Shared option sets, defined once and reused across the catalogue. */
const MATERIALS = {
  chert: { id: 'chert', label: 'Chert or flint (cryptocrystalline stone)' },
  sandstone: { id: 'sandstone', label: 'Sandstone' },
  granite: { id: 'granite', label: 'Coarse igneous stone' },
  firedClay: { id: 'firedClay', label: 'Fired clay' },
  bone: { id: 'bone', label: 'Bone' },
  shell: { id: 'shell', label: 'Shell' },
  charcoal: { id: 'charcoal', label: 'Charred wood' },
  iron: { id: 'iron', label: 'Iron' },
  glass: { id: 'glass', label: 'Glass' },
  unknownStone: { id: 'unknownStone', label: 'Stone, type not determinable in the field' }
};

const PERIODS = {
  prehistoric: { id: 'prehistoric', label: 'Prehistoric' },
  historic: { id: 'historic', label: 'Historic' },
  modern: { id: 'modern', label: 'Modern' },
  uncertain: { id: 'uncertain', label: 'Not determinable from this object alone' }
};

function opts(list) { return list; }

export const ARTIFACTS = {
  ar_point_triangular: {
    id: 'ar_point_triangular',
    name: 'Small triangular projectile point',
    className: 'Projectile point',
    tags: ['lithic', 'hunting', 'diagnostic', 'woodland'],
    description: 'A thin, finely worked triangular point of grey chert, about 2.5 cm long, with straight edges, a straight base and no notches or stem.',
    observation: 'Bifacially flaked, isosceles triangle, straight unnotched base, thin cross-section, length 24 mm.',
    diagnostic: { period: 'lateWoodland', label: 'Small unnotched triangular point', range: 'about AD 900 to 1400' },
    fields: {
      material: { options: opts([MATERIALS.chert, MATERIALS.sandstone, MATERIALS.granite, MATERIALS.unknownStone]), correct: 'chert',
        feedback: {
          chert: 'Correct. The glassy fracture, fine flake scars and translucency at thin edges are all cryptocrystalline stone.',
          sandstone: 'Sandstone is granular and will not hold an edge like this or fracture conchoidally.',
          granite: 'Coarse igneous stone cannot be pressure flaked to this thinness.',
          unknownStone: 'Understandable caution, but the conchoidal fracture and fine flake scars are enough to identify this as a cryptocrystalline stone in the field.'
        } },
      objectClass: { options: opts([
        { id: 'point', label: 'Projectile point' },
        { id: 'scraper', label: 'Scraper' },
        { id: 'debitage', label: 'Debitage (waste flake)' },
        { id: 'blank', label: 'Unfinished biface or blank' }]), correct: 'point',
        feedback: {
          point: 'Correct. Bifacial thinning, symmetry and a hafting-appropriate base identify a finished point.',
          scraper: 'Scrapers carry steep unifacial retouch on a working edge and are not thinned to symmetry.',
          debitage: 'Debitage is waste, not shaped to a symmetrical outline with a prepared base.',
          blank: 'A blank is thicker, asymmetrical and lacks the finished edge regularity present here.'
        } },
      function: { options: opts([
        { id: 'arrow', label: 'Tipped an arrow', best: true },
        { id: 'spear', label: 'Tipped a thrusting spear', defensible: true },
        { id: 'knife', label: 'Hafted cutting tool', defensible: true },
        { id: 'ornament', label: 'Ornament or non-functional object' }]),
        feedback: {
          arrow: 'The strongest reading. At this size and weight the point is well below what a dart or spear tip requires, and small triangular points are the standard bow-and-arrow form in this region.',
          spear: 'Not unreasonable in principle, but a thrusting spear tip needs far more mass. The size argues against it.',
          knife: 'Some points were reused as cutting tools, and edge damage can show it. Worth stating as a secondary possibility rather than the primary function.',
          ornament: 'Nothing here suggests an ornament: no perforation, no suspension wear, and a functional edge.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct. Flaked stone projectile technology at this site belongs to the pre-contact occupation.',
          historic: 'Nothing associates this form with the historic period here.',
          modern: 'Modern reproductions exist, but this came from an intact excavated context, not the surface.',
          uncertain: 'The form is diagnostic enough to be confident about period, even if the calendar date needs other evidence.'
        } },
      age: { options: opts([
        { id: 'lateWoodland', label: 'Roughly AD 900 to 1400', best: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC' },
        { id: 'paleo', label: 'Older than 8000 BC' },
        { id: 'noBasis', label: 'No basis for an age estimate from this object', defensible: true }]),
        feedback: {
          lateWoodland: 'Correct, and it is a typological estimate rather than a date. Small unnotched triangular points appear with the bow in this region after about AD 900.',
          archaic: 'Archaic points in this region are larger and are notched or stemmed for dart hafting.',
          paleo: 'Far too recent in form. Early points are lanceolate and often fluted.',
          noBasis: 'Cautious, and caution is usually right. But projectile point form is one of the few genuinely diagnostic attributes available, so an estimate with a stated basis is better than silence here.'
        } },
      activity: { options: opts([
        { id: 'hunting', label: 'Hunting', best: true },
        { id: 'toolProduction', label: 'Tool production', defensible: true },
        { id: 'plantProcessing', label: 'Plant processing' },
        { id: 'trade', label: 'Trade or exchange' }]),
        feedback: {
          hunting: 'The direct reading. A finished, used point in a domestic deposit is hunting equipment brought back to camp.',
          toolProduction: 'Defensible if resharpening flakes occur with it. On its own a finished tool speaks more to use than to manufacture.',
          plantProcessing: 'Nothing about a projectile point points to plant processing.',
          trade: 'Only arguable if the raw material is non-local, which cannot be established in the field.'
        } }
    }
  },

  ar_point_stemmed: {
    id: 'ar_point_stemmed',
    name: 'Large stemmed projectile point',
    className: 'Projectile point',
    tags: ['lithic', 'hunting', 'diagnostic', 'archaic'],
    description: 'A thick, broad point of mottled brown chert about 6 cm long, with a contracting stem and heavy grinding along the stem edges.',
    observation: 'Bifacially flaked, broad blade, contracting stem, ground stem margins, thick cross-section, length 61 mm.',
    diagnostic: { period: 'lateArchaic', label: 'Large stemmed point with ground stem', range: 'about 3000 to 1000 BC' },
    fields: {
      material: { options: opts([MATERIALS.chert, MATERIALS.sandstone, MATERIALS.granite, MATERIALS.unknownStone]), correct: 'chert',
        feedback: {
          chert: 'Correct, though a different and more mottled source than the triangular point. Raw material difference between levels is itself worth noting.',
          sandstone: 'Sandstone will not flake to this shape.',
          granite: 'Too coarse to hold these flake scars.',
          unknownStone: 'The fracture and flake scars are diagnostic enough to call it cryptocrystalline.'
        } },
      objectClass: { options: opts([
        { id: 'point', label: 'Projectile point' },
        { id: 'preform', label: 'Preform' },
        { id: 'drill', label: 'Drill' },
        { id: 'core', label: 'Core' }]), correct: 'point',
        feedback: {
          point: 'Correct. A deliberately shaped stem with ground margins is a hafting element on a finished point.',
          preform: 'A preform would not have a finished stem with grinding.',
          drill: 'Drills have a narrow, thick, often rotated bit. This has a broad blade.',
          core: 'A core is a source of flakes, not a shaped bifacial tool.'
        } },
      function: { options: opts([
        { id: 'dart', label: 'Tipped a spear or atlatl dart', best: true },
        { id: 'arrow', label: 'Tipped an arrow' },
        { id: 'knife', label: 'Hafted knife', defensible: true },
        { id: 'ornament', label: 'Ornament' }]),
        feedback: {
          dart: 'The strongest reading. Mass and stem width fit a dart or spear rather than an arrow.',
          arrow: 'Far too heavy. An arrow tip of this weight would destabilise the shaft.',
          knife: 'Reasonable as a secondary function, particularly if one edge shows heavier wear than the other.',
          ornament: 'A hafted, resharpened working edge argues against ornament.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct.',
          historic: 'No association with historic material.',
          modern: 'Recovered from a sealed buried horizon, not the surface.',
          uncertain: 'The technology is unambiguous even if the calendar date is not.'
        } },
      age: { options: opts([
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 900 to 1400' },
        { id: 'contact', label: 'After AD 1600' },
        { id: 'noBasis', label: 'No basis for an age estimate from this object', defensible: true }]),
        feedback: {
          archaic: 'Correct as a typological estimate. Large stemmed points with ground stem margins are an Archaic form in this region, and the ground margins are a strong supporting detail.',
          lateWoodland: 'That is the triangular point range. This form predates it by thousands of years.',
          contact: 'No contact-period association exists for this form.',
          noBasis: 'Cautious. Point typology is genuinely diagnostic, so an estimate with a stated basis is better than none, provided the estimate is presented as typological.'
        } },
      activity: { options: opts([
        { id: 'hunting', label: 'Hunting', best: true },
        { id: 'earlierOccupation', label: 'An earlier occupation of the same ground', best: true },
        { id: 'plantProcessing', label: 'Plant processing' },
        { id: 'potteryUse', label: 'Pottery use' }]),
        feedback: {
          hunting: 'Correct at the activity level.',
          earlierOccupation: 'Also correct, and the more important point. Found in a buried horizon below the pottery-bearing levels, this is evidence of a separate, earlier occupation rather than a stray object.',
          plantProcessing: 'Not indicated.',
          potteryUse: 'This form predates pottery in the region.'
        } }
    }
  },

  ar_sherd_cordmarked: {
    id: 'ar_sherd_cordmarked',
    name: 'Cord-marked pottery sherd',
    className: 'Pottery sherd',
    tags: ['ceramic', 'potteryUse', 'diagnostic', 'woodland', 'cooking'],
    description: 'A body sherd about 6 cm across with close parallel cord impressions on the exterior, a smoothed interior, and crushed rock temper visible in the break.',
    observation: 'Grit-tempered, cord-marked exterior, smoothed interior, dark reduced core, wall thickness 7 mm, sooting on the exterior.',
    diagnostic: { period: 'lateWoodland', label: 'Grit-tempered cord-marked ware', range: 'about AD 800 to 1300' },
    fields: {
      material: { options: opts([MATERIALS.firedClay, MATERIALS.sandstone, MATERIALS.glass, MATERIALS.unknownStone]), correct: 'firedClay',
        feedback: {
          firedClay: 'Correct. A fired clay body with added temper and a reduced core.',
          sandstone: 'The temper is crushed rock, but the body around it is fired clay.',
          glass: 'No vitrification, no glaze, no conchoidal fracture.',
          unknownStone: 'This is a manufactured ceramic, not stone.'
        } },
      objectClass: { options: opts([
        { id: 'bodySherd', label: 'Vessel body sherd' },
        { id: 'rimSherd', label: 'Vessel rim sherd' },
        { id: 'dauB', label: 'Fired structural daub' },
        { id: 'figurine', label: 'Figurine fragment' }]), correct: 'bodySherd',
        feedback: {
          bodySherd: 'Correct. Even curvature with no thickened or finished edge is a body sherd.',
          rimSherd: 'A rim would show a finished lip and a change in profile. This has neither.',
          dauB: 'Daub carries impressions of wood or cane on one face and is not deliberately surface-treated.',
          figurine: 'No modelling, no solid mass, and a consistent vessel wall thickness.'
        } },
      function: { options: opts([
        { id: 'cooking', label: 'Cooking vessel', best: true },
        { id: 'storage', label: 'Storage vessel', defensible: true },
        { id: 'serving', label: 'Serving vessel', defensible: true },
        { id: 'ritual', label: 'Ritual or non-utilitarian vessel' }]),
        feedback: {
          cooking: 'The best supported reading, because of the sooting on the exterior. That is direct use evidence rather than a guess about vessel shape.',
          storage: 'Plausible for a cord-marked jar in general, but the sooting on this sherd points to heating.',
          serving: 'Possible for the vessel class, but again the sooting is the evidence actually present.',
          ritual: 'Nothing distinguishes this from ordinary domestic ware.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct. Hand-built, grit-tempered, cord-marked ware is a pre-contact tradition here.',
          historic: 'Historic ceramics on this landscape are wheel-thrown and glazed.',
          modern: 'No modern manufacture indicators at all.',
          uncertain: 'Manufacture technique is clear enough to assign period confidently.'
        } },
      age: { options: opts([
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300', best: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC' },
        { id: 'historic', label: 'After AD 1700' },
        { id: 'noBasis', label: 'No basis for an age estimate from this object', defensible: true }]),
        feedback: {
          lateWoodland: 'Correct as a stylistic estimate. Pottery style is a relative dating tool, so this range should be presented as typological and cross-checked against the radiocarbon evidence.',
          archaic: 'Pottery does not appear in this region until well after the Archaic.',
          historic: 'Wrong technology for that period.',
          noBasis: 'Defensible caution, but ceramic style is one of the standard relative dating tools and this ware is recognisable.'
        } },
      activity: { options: opts([
        { id: 'potteryUse', label: 'Pottery use and food preparation', best: true },
        { id: 'duration', label: 'Occupation long enough to make and use heavy containers', best: true },
        { id: 'hunting', label: 'Hunting' },
        { id: 'trade', label: 'Long-distance trade' }]),
        feedback: {
          potteryUse: 'Correct, and the sooting ties it specifically to cooking.',
          duration: 'A strong inference. Heavy, breakable containers are associated with occupations that stay put rather than move frequently, which speaks to settlement duration.',
          hunting: 'Not indicated by ceramics.',
          trade: 'Locally available temper and a regional style argue against long-distance movement.'
        } }
    }
  },

  ar_debitage: {
    id: 'ar_debitage',
    name: 'Lithic debitage (flake assemblage)',
    className: 'Lithic debitage',
    tags: ['lithic', 'toolProduction'],
    description: 'Forty-three pieces of chipped stone waste from a single level, ranging from thinning flakes down to pressure chips, mostly of the same grey chert.',
    observation: 'Wide size range, many with intact platforms and bulbs, high proportion of small pressure chips, one raw material dominant.',
    fields: {
      material: { options: opts([MATERIALS.chert, MATERIALS.sandstone, MATERIALS.granite, MATERIALS.unknownStone]), correct: 'chert',
        feedback: {
          chert: 'Correct, and the dominance of one material matters: it suggests a single reduction episode rather than accumulated background scatter.',
          sandstone: 'Sandstone does not produce platforms and bulbs.',
          granite: 'Too coarse for controlled flaking.',
          unknownStone: 'Field identification to cryptocrystalline is reliable here.'
        } },
      objectClass: { options: opts([
        { id: 'debitage', label: 'Debitage (manufacturing waste)' },
        { id: 'tools', label: 'A set of finished tools' },
        { id: 'natural', label: 'Naturally shattered stone' },
        { id: 'cores', label: 'Cores' }]), correct: 'debitage',
        feedback: {
          debitage: 'Correct. Waste, not tools, and that is exactly why it is informative.',
          tools: 'None of these pieces carry retouch or a shaped outline.',
          natural: 'Platforms and bulbs of percussion are not natural.',
          cores: 'A core is the block flakes come off. These are the flakes.'
        } },
      function: { options: opts([
        { id: 'byproduct', label: 'By-product of making and resharpening stone tools', best: true },
        { id: 'expedientTools', label: 'Expedient cutting flakes used as tools', defensible: true },
        { id: 'discarded', label: 'Discarded broken tools' },
        { id: 'none', label: 'No function; incidental material' }]),
        feedback: {
          byproduct: 'Correct. The high proportion of small pressure chips points specifically to late-stage shaping and resharpening rather than initial core reduction.',
          expedientTools: 'Genuinely possible, and edge-wear analysis in a laboratory could test it. Worth recording as a question rather than a conclusion.',
          discarded: 'These are unretouched flakes, not broken tools.',
          none: 'Debitage is one of the most informative categories on a site, precisely because it cannot be curated or carried away easily.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct for this site, on the strength of context rather than the flakes themselves.',
          historic: 'Flaked stone is not a historic-period technology here.',
          modern: 'No modern indicators.',
          uncertain: 'Reasonable in isolation, but the excavated context resolves it.'
        } },
      age: { options: opts([
        { id: 'noBasis', label: 'No independent age; it dates only by its context', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300', defensible: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC' },
        { id: 'modern', label: 'Recent' }]),
        feedback: {
          noBasis: 'Correct, and this is the important lesson. Debitage is not diagnostic. It takes its date from the level it came from, which is why level control matters.',
          lateWoodland: 'Only if the level it came from is dated. State it as inherited from context, not read from the flakes.',
          archaic: 'Same problem, and inconsistent with the level this material came from.',
          modern: 'Nothing supports this.'
        } },
      activity: { options: opts([
        { id: 'toolProduction', label: 'On-site stone tool production and maintenance', best: true },
        { id: 'duration', label: 'Repeated or sustained presence rather than a single brief stop', defensible: true },
        { id: 'trade', label: 'Trade' },
        { id: 'plantProcessing', label: 'Plant processing' }]),
        feedback: {
          toolProduction: 'Correct, and specifically maintenance rather than primary reduction, given the size distribution.',
          duration: 'A fair secondary inference from the quantity, though quantity alone can also reflect one intensive episode.',
          trade: 'Not supported without raw material sourcing.',
          plantProcessing: 'Not indicated.'
        } }
    }
  },

  ar_groundstone_mano: {
    id: 'ar_groundstone_mano',
    name: 'Ground stone mano fragment',
    className: 'Ground stone',
    tags: ['groundstone', 'plantProcessing', 'diet'],
    description: 'Half of a loaf-shaped sandstone cobble, roughly 12 cm across the break, with one face worn flat and polished and fine parallel striations across it.',
    observation: 'One face worn flat with a sheen, unidirectional striations, hand-sized, broken across the short axis.',
    fields: {
      material: { options: opts([MATERIALS.sandstone, MATERIALS.chert, MATERIALS.firedClay, MATERIALS.unknownStone]), correct: 'sandstone',
        feedback: {
          sandstone: 'Correct, and the choice of a coarse, abrasive stone is functional rather than incidental.',
          chert: 'Chert is far too fine and brittle for a grinding surface.',
          firedClay: 'This is unmodified natural stone, shaped only by use.',
          unknownStone: 'The granular texture and bedding are recognisable as sandstone in the field.'
        } },
      objectClass: { options: opts([
        { id: 'mano', label: 'Mano or handstone (upper grinding stone)' },
        { id: 'metate', label: 'Metate or milling slab (lower grinding stone)' },
        { id: 'hammerstone', label: 'Hammerstone' },
        { id: 'abrader', label: 'Abrader' }]), correct: 'mano',
        feedback: {
          mano: 'Correct. Hand-sized with a single worn face is the upper stone of a pair.',
          metate: 'A lower slab is larger, heavier and usually develops a concave basin rather than a convex worn face.',
          hammerstone: 'A hammerstone shows battering and crushing, not polish and striations.',
          abrader: 'Abraders carry grooves from shaping other objects rather than a broad flat wear face.'
        } },
      function: { options: opts([
        { id: 'plantProcessing', label: 'Grinding plant foods such as seeds or nuts', best: true },
        { id: 'pigment', label: 'Grinding pigment or mineral', defensible: true },
        { id: 'hideWork', label: 'Hide working' },
        { id: 'sharpening', label: 'Sharpening stone tools' }]),
        feedback: {
          plantProcessing: 'The best supported reading, especially alongside charred plant remains from the same deposit.',
          pigment: 'A real alternative, and residue analysis could test it. Say so rather than asserting food processing outright.',
          hideWork: 'Hide working leaves different wear and usually uses different tools.',
          sharpening: 'Sharpening produces grooves and facets, not a broad flat polished face.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct on context.',
          historic: 'No historic association.',
          modern: 'No modern indicators.',
          uncertain: 'Fair in isolation; context resolves it.'
        } },
      age: { options: opts([
        { id: 'noBasis', label: 'No independent age; it dates by its context', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300', defensible: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC', defensible: true },
        { id: 'modern', label: 'Recent' }]),
        feedback: {
          noBasis: 'Correct. Ground stone technology spans thousands of years and is not diagnostic on its own.',
          lateWoodland: 'Only as an inheritance from the dated level, and it should be stated that way.',
          archaic: 'Equally possible for the artifact class in general, which is exactly why context has to carry the date.',
          modern: 'Not supported.'
        } },
      activity: { options: opts([
        { id: 'plantProcessing', label: 'Plant food processing', best: true },
        { id: 'duration', label: 'Occupation long enough to justify heavy, immobile equipment', defensible: true },
        { id: 'hunting', label: 'Hunting' },
        { id: 'toolProduction', label: 'Stone tool production' }]),
        feedback: {
          plantProcessing: 'Correct.',
          duration: 'A reasonable secondary inference. Heavy grinding equipment is usually left in place and argues against brief, highly mobile stops.',
          hunting: 'Not indicated.',
          toolProduction: 'This is a tool, but its wear comes from processing rather than from making other tools.'
        } }
    }
  },

  ar_bone_awl: {
    id: 'ar_bone_awl',
    name: 'Bone awl',
    className: 'Bone tool',
    tags: ['bone', 'toolProduction', 'craft'],
    description: 'A splinter of large mammal long bone about 9 cm long, ground to a smooth rounded point at one end and polished along the shaft.',
    observation: 'Deliberate grinding to a point, high polish on the working end, snapped and shaped from a long bone shaft splinter.',
    fields: {
      material: { options: opts([MATERIALS.bone, MATERIALS.shell, MATERIALS.unknownStone, MATERIALS.sandstone]), correct: 'bone',
        feedback: {
          bone: 'Correct. Cortical structure and marrow cavity are visible on the broken end.',
          shell: 'Shell is layered and nacreous, with different fracture behaviour.',
          unknownStone: 'This is organic, with visible cortical bone structure.',
          sandstone: 'Not stone at all.'
        } },
      objectClass: { options: opts([
        { id: 'awl', label: 'Awl or perforator' },
        { id: 'foodWaste', label: 'Food waste bone' },
        { id: 'needle', label: 'Eyed needle' },
        { id: 'ornament', label: 'Bone ornament' }]), correct: 'awl',
        feedback: {
          awl: 'Correct. A deliberately ground point with use polish is a perforating tool.',
          foodWaste: 'Food waste bone is broken and sometimes burnt, but not ground to a polished point.',
          needle: 'A needle would have an eye. There is none.',
          ornament: 'No perforation for suspension and no decorative modification.'
        } },
      function: { options: opts([
        { id: 'hideBasketry', label: 'Piercing hide, or working basketry and matting', best: true },
        { id: 'weaving', label: 'Textile or cordage production', defensible: true },
        { id: 'hunting', label: 'Hunting weapon' },
        { id: 'cooking', label: 'Cooking implement' }]),
        feedback: {
          hideBasketry: 'The best supported reading. The polish pattern is consistent with repeatedly piercing a soft, slightly abrasive material.',
          weaving: 'A closely related and defensible alternative. Field observation cannot separate the two; use-wear analysis could.',
          hunting: 'Too blunt and too fragile to serve as a weapon tip.',
          cooking: 'Nothing about the wear or form suggests it.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct on context and technology.',
          historic: 'No historic association in this deposit.',
          modern: 'Recovered from a sealed context.',
          uncertain: 'Context resolves it.'
        } },
      age: { options: opts([
        { id: 'noBasis', label: 'No independent age; it dates by its context', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300', defensible: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC' },
        { id: 'modern', label: 'Recent' }]),
        feedback: {
          noBasis: 'Correct. Bone tools of this kind are not chronologically diagnostic. It is also directly dateable material if a sample were submitted.',
          lateWoodland: 'Acceptable only as inherited from the dated level, and worth flagging that the object itself could be dated directly.',
          archaic: 'Inconsistent with the level it came from.',
          modern: 'Not supported.'
        } },
      activity: { options: opts([
        { id: 'craft', label: 'Craft production: hide, basketry or cordage work', best: true },
        { id: 'household', label: 'Household activity carried out inside a structure', defensible: true },
        { id: 'hunting', label: 'Hunting' },
        { id: 'trade', label: 'Trade' }]),
        feedback: {
          craft: 'Correct.',
          household: 'A fair inference given where this one was found, but it depends on the structure interpretation holding up.',
          hunting: 'Indirect at best.',
          trade: 'Not indicated.'
        } }
    }
  },

  ar_animal_bone: {
    id: 'ar_animal_bone',
    name: 'Animal bone (faunal sample)',
    className: 'Animal bone',
    tags: ['bone', 'diet', 'hunting', 'fishing'],
    description: 'A bag of fragmentary bone from one level: several deer limb shaft fragments with cut marks, a deer mandible fragment, numerous fish vertebrae, and small burnt fragments.',
    observation: 'Deer elements with cut marks and spiral fractures, fish vertebrae in quantity, some calcined fragments, high fragmentation overall.',
    fields: {
      material: { options: opts([MATERIALS.bone, MATERIALS.shell, MATERIALS.charcoal, MATERIALS.unknownStone]), correct: 'bone',
        feedback: {
          bone: 'Correct, and worth separating by taxon in the laboratory rather than treating it as one category.',
          shell: 'Shell is a separate category and is present elsewhere on this site.',
          charcoal: 'Burnt bone is calcined and retains bone structure; it is not charcoal.',
          unknownStone: 'This is organic material.'
        } },
      objectClass: { options: opts([
        { id: 'faunal', label: 'Faunal remains (food and butchery waste)' },
        { id: 'tools', label: 'Bone tools' },
        { id: 'natural', label: 'Natural animal death assemblage' },
        { id: 'burial', label: 'Human remains' }]), correct: 'faunal',
        feedback: {
          faunal: 'Correct. Cut marks, spiral fracture and burning are processing signatures.',
          tools: 'One awl was recovered separately. This material is unmodified beyond butchery.',
          natural: 'Cut marks and burning rule out a natural death assemblage.',
          burial: 'These are non-human elements: deer limb and mandible, and fish vertebrae. If any material in an assemblage were suspected to be human, work stops and the site protocol applies rather than the analysis continuing.'
        } },
      function: { options: opts([
        { id: 'food', label: 'Food remains', best: true },
        { id: 'rawMaterial', label: 'Raw material for tool making', defensible: true },
        { id: 'ritual', label: 'Ritual deposit' },
        { id: 'none', label: 'No cultural significance' }]),
        feedback: {
          food: 'Correct. Cut marks, marrow fracture and burning are the direct evidence.',
          rawMaterial: 'Also true in part, given the bone awl from the same site. Both readings can be recorded together.',
          ritual: 'Nothing about this scattered, fragmented domestic waste suggests deliberate ritual deposition.',
          none: 'Faunal remains carry most of what can be said about diet and season here.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct on context.',
          historic: 'No domestic livestock elements are present.',
          modern: 'No modern indicators.',
          uncertain: 'Context resolves it.'
        } },
      age: { options: opts([
        { id: 'directDate', label: 'Directly dateable by radiocarbon if a sample is submitted', best: true },
        { id: 'noBasis', label: 'No independent age; it dates by its context', defensible: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300' },
        { id: 'modern', label: 'Recent' }]),
        feedback: {
          directDate: 'The best answer. Bone with surviving collagen is directly dateable, which makes this material more than just context-dependent.',
          noBasis: 'True as far as it goes, but it undersells the material. Bone can be dated directly.',
          lateWoodland: 'Only inherited from the level. Say so if you use it.',
          modern: 'Not supported.'
        } },
      activity: { options: opts([
        { id: 'hunting', label: 'Hunting large game', best: true },
        { id: 'fishing', label: 'Fishing', best: true },
        { id: 'cooking', label: 'Cooking and food preparation', best: true },
        { id: 'trade', label: 'Trade' }]),
        feedback: {
          hunting: 'Correct. Deer dominate the identifiable large mammal component.',
          fishing: 'Correct, and important. The quantity of fish vertebrae only survives because the deposit was screened, and it points to river resources.',
          cooking: 'Correct. Burning and marrow fracture are preparation evidence.',
          trade: 'Local river and woodland species. Nothing indicates exchange.'
        },
        multi: true }
    }
  },

  ar_shell_bead: {
    id: 'ar_shell_bead',
    name: 'Shell bead',
    className: 'Shell bead',
    tags: ['shell', 'ornament', 'trade', 'craft'],
    description: 'A small disc of shell, 7 mm across, ground round at the edges and drilled through the centre. Slight wear around the perforation.',
    observation: 'Ground circular outline, biconical drilled perforation, wear polish around the hole, marine shell rather than local freshwater mussel.',
    fields: {
      material: { options: opts([MATERIALS.shell, MATERIALS.bone, MATERIALS.firedClay, MATERIALS.unknownStone]), correct: 'shell',
        feedback: {
          shell: 'Correct, and the species matters: this is marine shell, not the local freshwater mussel found elsewhere on the site.',
          bone: 'Bone lacks the layered nacreous structure visible at the edge.',
          firedClay: 'No temper, no firing, and a natural layered structure.',
          unknownStone: 'This is organic.'
        } },
      objectClass: { options: opts([
        { id: 'bead', label: 'Bead or ornament' },
        { id: 'debris', label: 'Shell working debris' },
        { id: 'foodWaste', label: 'Food waste shell' },
        { id: 'tool', label: 'Shell tool' }]), correct: 'bead',
        feedback: {
          bead: 'Correct. Ground to shape and deliberately perforated.',
          debris: 'Working debris is irregular and unperforated.',
          foodWaste: 'Food shell is broken, not ground round and drilled.',
          tool: 'No working edge and no use wear other than around the perforation.'
        } },
      function: { options: opts([
        { id: 'ornament', label: 'Personal ornament, strung or sewn', best: true },
        { id: 'exchange', label: 'Item of exchange or social value', defensible: true },
        { id: 'utilitarian', label: 'Utilitarian fastener' },
        { id: 'gaming', label: 'Gaming piece' }]),
        feedback: {
          ornament: 'The direct reading. Wear around the perforation shows it was strung and worn.',
          exchange: 'A strong secondary reading given the non-local raw material, though it depends on the species identification holding up in the laboratory.',
          utilitarian: 'Too small and too finely finished for a fastener.',
          gaming: 'Perforation and stringing wear argue against it.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct on context.',
          historic: 'Historic trade beads here are glass, not ground shell.',
          modern: 'No modern indicators.',
          uncertain: 'Context resolves it.'
        } },
      age: { options: opts([
        { id: 'noBasis', label: 'No independent age; it dates by its context', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300', defensible: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC' },
        { id: 'modern', label: 'Recent' }]),
        feedback: {
          noBasis: 'Correct. Shell disc beads have a long history and are not diagnostic on their own.',
          lateWoodland: 'Acceptable only as inherited from the dated level.',
          archaic: 'Inconsistent with the level.',
          modern: 'Not supported.'
        } },
      activity: { options: opts([
        { id: 'trade', label: 'Exchange with distant regions', best: true },
        { id: 'craft', label: 'Ornament production or use', best: true },
        { id: 'hunting', label: 'Hunting' },
        { id: 'plantProcessing', label: 'Plant processing' }]),
        feedback: {
          trade: 'The strongest claim this object supports, because the raw material does not occur locally. This is the only artifact on the site that speaks directly to long-distance connections.',
          craft: 'Correct, and it says something about who lived here rather than only what they ate.',
          hunting: 'Not indicated.',
          plantProcessing: 'Not indicated.'
        },
        multi: true }
    }
  },

  ar_fcr: {
    id: 'ar_fcr',
    name: 'Fire-cracked rock sample',
    className: 'Fire-cracked rock',
    tags: ['fcr', 'cooking'],
    description: 'A retained sample of angular, reddened and crazed sandstone fragments from a single level, weighed and counted in the field.',
    observation: 'Angular fracture, heat reddening, crazed surfaces, no rounding, weighed at 3.4 kg for the level.',
    fields: {
      material: { options: opts([MATERIALS.sandstone, MATERIALS.chert, MATERIALS.firedClay, MATERIALS.unknownStone]), correct: 'sandstone',
        feedback: {
          sandstone: 'Correct, and the local availability of sandstone explains why it was chosen for heating.',
          chert: 'Chert shatters unpredictably under heat and was not used this way.',
          firedClay: 'This is natural stone that was heated, not a manufactured ceramic.',
          unknownStone: 'The granular bedded texture is identifiable in the field.'
        } },
      objectClass: { options: opts([
        { id: 'fcr', label: 'Fire-cracked rock' },
        { id: 'debitage', label: 'Debitage' },
        { id: 'groundstone', label: 'Ground stone' },
        { id: 'natural', label: 'Naturally shattered stone' }]), correct: 'fcr',
        feedback: {
          fcr: 'Correct. Reddening plus crazing plus angular fracture is a heating signature.',
          debitage: 'No platforms, no bulbs, no controlled fracture.',
          groundstone: 'No worn or polished faces.',
          natural: 'Frost shattering does not redden stone or craze its surface.'
        } },
      function: { options: opts([
        { id: 'heating', label: 'Heated stone used in cooking, boiling or roasting', best: true },
        { id: 'hearthLining', label: 'Hearth construction or lining', defensible: true },
        { id: 'toolStone', label: 'Raw material for tools' },
        { id: 'none', label: 'No function' }]),
        feedback: {
          heating: 'The best reading. Repeated heating and rapid cooling produces exactly this damage, and stone boiling is the classic mechanism.',
          hearthLining: 'Also defensible, and the two are not exclusive. Association with a hearth feature would strengthen it.',
          toolStone: 'Sandstone was used for grinding stones, but heat-damaged fragments are not raw material.',
          none: 'Fire-cracked rock is one of the most reliable indicators of cooking activity and is worth quantifying rather than discarding.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct on context.',
          historic: 'Not associated with historic material here.',
          modern: 'The excavated sample came from a sealed context.',
          uncertain: 'Fair in isolation; context resolves it.'
        } },
      age: { options: opts([
        { id: 'noBasis', label: 'No independent age; it dates by its context', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300', defensible: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC', defensible: true },
        { id: 'modern', label: 'Recent' }]),
        feedback: {
          noBasis: 'Correct. Heated rock is produced across the entire span of human occupation here.',
          lateWoodland: 'Only inherited from the level.',
          archaic: 'Equally possible in general, which is the point.',
          modern: 'Not supported for the excavated sample.'
        } },
      activity: { options: opts([
        { id: 'cooking', label: 'Cooking and food preparation', best: true },
        { id: 'duration', label: 'Repeated use of the same spot over time', defensible: true },
        { id: 'hunting', label: 'Hunting' },
        { id: 'trade', label: 'Trade' }]),
        feedback: {
          cooking: 'Correct.',
          duration: 'Reasonable if the quantity is high and it is concentrated, as it is here.',
          hunting: 'Indirect at best.',
          trade: 'Not indicated.'
        } }
    }
  },

  ar_nail_cut: {
    id: 'ar_nail_cut',
    name: 'Cut iron nail',
    className: 'Historic nail',
    tags: ['historic', 'intrusive', 'diagnostic'],
    description: 'A heavily corroded iron nail about 6 cm long, rectangular in cross-section and tapering on two sides only, with a hand-finished head.',
    observation: 'Rectangular shank tapering on two sides, machine-cut rather than drawn wire, hand-finished head, heavy corrosion.',
    diagnostic: { period: 'historic', label: 'Machine-cut nail', range: 'about 1800 to 1890' },
    fields: {
      material: { options: opts([MATERIALS.iron, MATERIALS.glass, MATERIALS.bone, MATERIALS.unknownStone]), correct: 'iron',
        feedback: {
          iron: 'Correct. The corrosion product and magnetism identify ferrous metal.',
          glass: 'Not glass.',
          bone: 'Not organic.',
          unknownStone: 'This is metal.'
        } },
      objectClass: { options: opts([
        { id: 'cutNail', label: 'Machine-cut nail' },
        { id: 'wireNail', label: 'Wire nail' },
        { id: 'wroughtNail', label: 'Hand-wrought nail' },
        { id: 'unidentified', label: 'Unidentifiable metal fragment' }]), correct: 'cutNail',
        feedback: {
          cutNail: 'Correct, and this is the diagnostic detail. Rectangular in section, tapering on two sides only.',
          wireNail: 'Wire nails are round in section and appear after about 1890.',
          wroughtNail: 'Hand-wrought nails taper on all four sides and have irregular hammered heads.',
          unidentified: 'Enough of the shank and head survive to classify it, and the classification carries a date.'
        } },
      function: { options: opts([
        { id: 'construction', label: 'Fastener from construction or a wooden structure', best: true },
        { id: 'fencing', label: 'Fencing or agricultural use', defensible: true },
        { id: 'tool', label: 'Tool' },
        { id: 'ornament', label: 'Ornament' }]),
        feedback: {
          construction: 'The direct reading for a cut nail.',
          fencing: 'Defensible on a rural terrace with a documented farmstead nearby. Either way it is historic-period activity, not part of the occupation under study.',
          tool: 'A nail is a fastener.',
          ornament: 'No.'
        } },
      period: { options: opts([PERIODS.historic, PERIODS.prehistoric, PERIODS.modern, PERIODS.uncertain]), correct: 'historic',
        feedback: {
          historic: 'Correct, and this is the point of the object. It is intrusive in a prehistoric deposit.',
          prehistoric: 'Machine-cut iron nails are a nineteenth-century industrial product.',
          modern: 'Modern nails are drawn wire and round in section.',
          uncertain: 'The manufacturing method is diagnostic enough to be confident.'
        } },
      age: { options: opts([
        { id: 'nineteenth', label: 'About 1800 to 1890', best: true },
        { id: 'twentieth', label: 'After 1890' },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300' },
        { id: 'noBasis', label: 'No basis for an estimate' }]),
        feedback: {
          nineteenth: 'Correct. Machine-cut nails have a well-defined manufacturing window, which makes them one of the more useful historic-period date markers.',
          twentieth: 'That is the wire nail era. This is cut.',
          lateWoodland: 'Wrong by roughly a thousand years, and confusing this object with the prehistoric assemblage is exactly the error to avoid.',
          noBasis: 'There is a firm basis here: manufacturing technique.'
        } },
      activity: { options: opts([
        { id: 'historicDisturbance', label: 'Later historic activity that disturbed the deposit', best: true },
        { id: 'siteFormation', label: 'Evidence about how the upper levels were mixed', best: true },
        { id: 'hunting', label: 'Hunting' },
        { id: 'potteryUse', label: 'Pottery use' }]),
        feedback: {
          historicDisturbance: 'Correct. The nail dates the disturbance, not the deposit it was found in.',
          siteFormation: 'Correct, and this is why intrusive material is recorded rather than discarded. It defines how far down mixing reaches.',
          hunting: 'No.',
          potteryUse: 'No.'
        },
        multi: true }
    }
  },

  ar_glass: {
    id: 'ar_glass',
    name: 'Glass fragment',
    className: 'Glass fragment',
    tags: ['historic', 'intrusive'],
    description: 'A curved fragment of thick, slightly purple-tinted bottle glass with visible bubbles and a faint mould seam.',
    observation: 'Mould seam, solarised purple tint, bubbles in the metal, thick curved body.',
    diagnostic: { period: 'historic', label: 'Manganese-decolourised mould-blown glass', range: 'about 1880 to 1920' },
    fields: {
      material: { options: opts([MATERIALS.glass, MATERIALS.firedClay, MATERIALS.chert, MATERIALS.unknownStone]), correct: 'glass',
        feedback: {
          glass: 'Correct.',
          firedClay: 'Vitrified and transparent, not a fired clay body.',
          chert: 'Chert is natural and does not carry mould seams.',
          unknownStone: 'This is manufactured glass.'
        } },
      objectClass: { options: opts([
        { id: 'bottleGlass', label: 'Bottle or container glass' },
        { id: 'windowGlass', label: 'Window glass' },
        { id: 'tableware', label: 'Tableware' },
        { id: 'tool', label: 'Glass used as a tool' }]), correct: 'bottleGlass',
        feedback: {
          bottleGlass: 'Correct. Curvature and thickness fit a container rather than a pane.',
          windowGlass: 'Window glass is flat and thinner.',
          tableware: 'No decoration, foot or rim, and the metal is coarse.',
          tool: 'No deliberate flaking or use-wear on any edge.'
        } },
      function: { options: opts([
        { id: 'container', label: 'Container for a liquid product', best: true },
        { id: 'discard', label: 'Refuse from later use of the terrace', best: true },
        { id: 'ritual', label: 'Deliberate deposit' },
        { id: 'tool', label: 'Cutting tool' }]),
        feedback: {
          container: 'Correct.',
          discard: 'Also correct, and more useful. This tells you the terrace was being used and littered long after the prehistoric occupation.',
          ritual: 'Nothing supports that.',
          tool: 'No modification.'
        },
        multi: true },
      period: { options: opts([PERIODS.historic, PERIODS.modern, PERIODS.prehistoric, PERIODS.uncertain]), correct: 'historic',
        feedback: {
          historic: 'Correct. The solarised tint comes from manganese decolouriser used before about 1920.',
          modern: 'Modern glass is not manganese-decolourised and does not solarise.',
          prehistoric: 'Glass is not part of the prehistoric technology here.',
          uncertain: 'The tint and mould seam together give a defensible period assignment.'
        } },
      age: { options: opts([
        { id: 'turnOfCentury', label: 'About 1880 to 1920', best: true },
        { id: 'modern', label: 'After 1950' },
        { id: 'earlyHistoric', label: 'About 1700 to 1800' },
        { id: 'noBasis', label: 'No basis for an estimate', defensible: true }]),
        feedback: {
          turnOfCentury: 'Correct, on the combination of mould seam and manganese solarisation.',
          modern: 'Later glass is clear or green and lacks the purple tint.',
          earlyHistoric: 'Free-blown glass of that period has no mould seam.',
          noBasis: 'More cautious than necessary. Two independent manufacturing attributes point the same way.'
        } },
      activity: { options: opts([
        { id: 'historicDisturbance', label: 'Later historic activity on the terrace', best: true },
        { id: 'siteFormation', label: 'Evidence for how deep modern and historic mixing extends', best: true },
        { id: 'trade', label: 'Prehistoric trade' },
        { id: 'cooking', label: 'Prehistoric cooking' }]),
        feedback: {
          historicDisturbance: 'Correct.',
          siteFormation: 'Correct, and worth recording precisely for that reason.',
          trade: 'This object has nothing to do with the prehistoric occupation.',
          cooking: 'No.'
        },
        multi: true }
    }
  },

  ar_charred_plant: {
    id: 'ar_charred_plant',
    name: 'Charred plant remains (flotation sample)',
    className: 'Charred botanical sample',
    tags: ['botanical', 'diet', 'plantProcessing', 'agriculture', 'seasonality'],
    description: 'Light fraction from a ten-litre flotation sample: charred hickory and walnut shell fragments, a small number of charred maize kernel fragments, and several charred seeds of weedy annuals.',
    observation: 'Nutshell dominant by count, maize present but scarce, weedy annual seeds present, all charred rather than desiccated.',
    fields: {
      material: { options: opts([MATERIALS.charcoal, MATERIALS.bone, MATERIALS.shell, MATERIALS.firedClay]), correct: 'charcoal',
        feedback: {
          charcoal: 'Correct. Charring is what allowed any of this to survive at all.',
          bone: 'Bone is present in this deposit but is a separate category.',
          shell: 'Shell is present elsewhere and is separate.',
          firedClay: 'Not ceramic.'
        } },
      objectClass: { options: opts([
        { id: 'botanical', label: 'Charred botanical remains' },
        { id: 'charcoalFuel', label: 'Wood charcoal only' },
        { id: 'residue', label: 'Vessel residue' },
        { id: 'natural', label: 'Naturally deposited plant material' }]), correct: 'botanical',
        feedback: {
          botanical: 'Correct, and the mixture of nutshell, cultigen and weed seeds is what makes it informative.',
          charcoalFuel: 'Wood charcoal is present too, but the identifiable food remains are the point.',
          residue: 'Residue analysis is a different technique applied to vessel interiors.',
          natural: 'Uncharred plant material does not survive in this soil. Charring implies proximity to fire, which usually means human activity.'
        } },
      function: { options: opts([
        { id: 'food', label: 'Food remains', best: true },
        { id: 'fuel', label: 'Fuel or incidental burning', defensible: true },
        { id: 'ritual', label: 'Ritual offering' },
        { id: 'none', label: 'No cultural significance' }]),
        feedback: {
          food: 'The best supported reading for the nutshell and maize.',
          fuel: 'Genuinely defensible for the weedy annual seeds, which can arrive as part of fuel, bedding or dung rather than as food. Worth separating in the record.',
          ritual: 'Nothing supports that.',
          none: 'This is the only direct evidence of plant food on the site.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.historic, PERIODS.modern, PERIODS.uncertain]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct on context, and the sample is directly dateable.',
          historic: 'No historic association in a sealed level.',
          modern: 'Modern rootlets are excluded during sorting.',
          uncertain: 'Context and direct dating both resolve it.'
        } },
      age: { options: opts([
        { id: 'directDate', label: 'Directly dateable by radiocarbon', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300', defensible: true },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC' },
        { id: 'noBasis', label: 'No basis for an estimate' }]),
        feedback: {
          directDate: 'The best answer. Short-lived plant material such as a maize kernel is the ideal radiocarbon sample because it avoids the old-wood problem.',
          lateWoodland: 'Acceptable as inherited from context, but the sample can do better than inherit a date.',
          archaic: 'Maize does not belong to that period in this region.',
          noBasis: 'There is a very good basis: direct dating.'
        } },
      activity: { options: opts([
        { id: 'plantProcessing', label: 'Gathering and processing wild plant foods', best: true },
        { id: 'agriculture', label: 'Some maize cultivation or access to maize', best: true },
        { id: 'seasonality', label: 'Autumn occupation, on the nutshell', best: true },
        { id: 'trade', label: 'Long-distance trade' }]),
        feedback: {
          plantProcessing: 'Correct, and nutshell dominance says wild resources still mattered.',
          agriculture: 'Correct but requires care. Maize is present and scarce. That supports access to and some use of maize, not a maize-dependent farming economy.',
          seasonality: 'Correct as a supported inference. Nut harvest is an autumn event, so this deposit includes autumn occupation. It does not by itself rule out other seasons.',
          trade: 'Not supported by botanical material alone.'
        },
        multi: true }
    }
  },

  ar_charcoal_sample: {
    id: 'ar_charcoal_sample',
    name: 'Charcoal sample',
    className: 'Charcoal sample',
    tags: ['charcoal', 'dating'],
    description: 'A charcoal sample lifted from a sealed context, bagged for radiocarbon submission.',
    observation: 'Charred wood fragments, collected from a defined context, with a recorded depth and unit position.',
    labOnly: true,
    fields: {
      material: { options: opts([MATERIALS.charcoal, MATERIALS.bone, MATERIALS.firedClay, MATERIALS.unknownStone]), correct: 'charcoal',
        feedback: {
          charcoal: 'Correct.',
          bone: 'Not bone.',
          firedClay: 'Not ceramic.',
          unknownStone: 'Not stone.'
        } },
      objectClass: { options: opts([
        { id: 'datingSample', label: 'Radiocarbon sample' },
        { id: 'artifact', label: 'Artifact' },
        { id: 'feature', label: 'Feature' },
        { id: 'debris', label: 'Incidental debris' }]), correct: 'datingSample',
        feedback: {
          datingSample: 'Correct. Its value is chronological rather than typological.',
          artifact: 'It was not made or modified.',
          feature: 'It came from a feature but is not itself one.',
          debris: 'Treating charcoal as debris throws away the only absolute dating opportunity on the site.'
        } },
      function: { options: opts([
        { id: 'dating', label: 'Provides an absolute date for its context', best: true },
        { id: 'fuelEvidence', label: 'Evidence of fuel selection and wood availability', defensible: true },
        { id: 'none', label: 'No analytical value' },
        { id: 'diet', label: 'Direct evidence of diet' }]),
        feedback: {
          dating: 'Correct, provided the sample is clean and its context is secure.',
          fuelEvidence: 'A genuine secondary use. Species identification of charcoal says something about the surrounding woodland and about fuel choice.',
          none: 'This is the most chronologically valuable material recovered.',
          diet: 'Wood charcoal is fuel. Charred food remains are a different sample type.'
        } },
      period: { options: opts([PERIODS.prehistoric, PERIODS.uncertain, PERIODS.historic, PERIODS.modern]), correct: 'prehistoric',
        feedback: {
          prehistoric: 'Correct if the context is secure, which is exactly what the collection method determines.',
          uncertain: 'Reasonable if the sample was contaminated or its context was not properly recorded.',
          historic: 'Not for a sample from a sealed prehistoric feature.',
          modern: 'Only a concern if the sample was contaminated during collection.'
        } },
      age: { options: opts([
        { id: 'awaitingResult', label: 'Awaiting the laboratory result', best: true },
        { id: 'lateWoodland', label: 'Roughly AD 800 to 1300' },
        { id: 'archaic', label: 'Roughly 3000 to 1000 BC' },
        { id: 'noBasis', label: 'No basis for an estimate' }]),
        feedback: {
          awaitingResult: 'Correct. Assigning an age to a sample before the result arrives defeats the purpose of submitting it.',
          lateWoodland: 'Do not pre-empt the result. Take the estimate to the chronology bench instead.',
          archaic: 'Same problem.',
          noBasis: 'There will be a very firm basis once the result returns.'
        } },
      activity: { options: opts([
        { id: 'chronology', label: 'Establishing when this context formed', best: true },
        { id: 'cooking', label: 'Burning associated with cooking or heating', defensible: true },
        { id: 'hunting', label: 'Hunting' },
        { id: 'trade', label: 'Trade' }]),
        feedback: {
          chronology: 'Correct.',
          fuelEvidence: 'Reasonable.',
          cooking: 'Defensible if the sample came from a hearth, which ties the date to a specific human activity rather than to soil in general.',
          hunting: 'No.',
          trade: 'No.'
        } }
    }
  }
};

export const ARTIFACT_IDS = Object.keys(ARTIFACTS);

export function artifactById(id) {
  return ARTIFACTS[id] || null;
}

/* Field-level answer scoring shared by the laboratory UI and the tests. */
export function scoreAnalysisAnswer(artifactId, fieldId, answerId) {
  const art = ARTIFACTS[artifactId];
  if (!art || !art.fields[fieldId]) return { verdict: 'unknown', feedback: '' };
  const field = art.fields[fieldId];
  const option = (field.options || []).find((o) => o.id === answerId);
  const feedback = (field.feedback && field.feedback[answerId]) || '';
  if (!option) return { verdict: 'unknown', feedback };
  if (field.correct) {
    if (field.correct === answerId) return { verdict: 'correct', feedback };
    return { verdict: option.defensible ? 'defensible' : 'incorrect', feedback };
  }
  if (option.best) return { verdict: 'correct', feedback };
  if (option.defensible) return { verdict: 'defensible', feedback };
  return { verdict: 'incorrect', feedback };
}
