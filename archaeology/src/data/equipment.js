/* Station 1 content: the field kit.

   Items are grouped into believable kit sections rather than one flat grid.
   `capability` is the important field: it is what later stations actually
   check. Nothing here is decorative - if an item grants a capability, some
   later decision reads that capability and behaves differently without it.

   `justify` marks the small number of genuinely ambiguous or consequential
   choices that deserve an explanation prompt. Everything else is judged by
   its consequences downstream, not by an immediate quiz. */

export const KIT_SECTIONS = [
  { id: 'excavating', label: 'Excavating', blurb: 'What actually moves soil, and how finely.' },
  { id: 'measuring', label: 'Measuring and mapping', blurb: 'How depth, position and elevation get recorded.' },
  { id: 'recording', label: 'Recording', blurb: 'How observations leave the field as a usable record.' },
  { id: 'recovery', label: 'Recovery and storage', blurb: 'How material is caught, contained and labelled.' },
  { id: 'safety', label: 'Safety and site support', blurb: 'Keeping the crew and the deposit intact.' },
  { id: 'clothing', label: 'Clothing and personal gear', blurb: 'What the crew wears. A site beside live construction has dress rules.' },
  { id: 'staged', label: 'Also loaded on the truck', blurb: 'Items someone added to the trailer. Not all of them belong on this project.' }
];

export const EQUIPMENT_ITEMS = [
  // Excavating
  { id: 'trowel', label: 'Pointing trowel', section: 'excavating', appropriate: true, capability: 'fineExcavation',
    note: 'The primary excavation tool for controlled removal.' },
  { id: 'shovel', label: 'Flat shovel', section: 'excavating', appropriate: true, capability: 'bulkRemoval',
    note: 'Appropriate for shovel-skimming disturbed plough zone and for moving backdirt.' },
  { id: 'brush', label: 'Brushes', section: 'excavating', appropriate: true, capability: 'cleaning',
    note: 'Cleans feature surfaces before photography.' },
  { id: 'pick', label: 'Wooden and dental picks', section: 'excavating', appropriate: true, capability: 'delicateExcavation',
    note: 'For fragile material such as bone and charcoal.' },

  // Measuring and mapping
  { id: 'tape', label: 'Measuring tapes', section: 'measuring', appropriate: true, capability: 'measure',
    note: 'Horizontal control within the unit.' },
  { id: 'linelevel', label: 'Line level and string', section: 'measuring', appropriate: true, capability: 'depth',
    note: 'Depth below datum, level by level.' },
  { id: 'plumbbob', label: 'Plumb bob', section: 'measuring', appropriate: true, capability: 'depth',
    note: 'Transfers a point vertically for accurate in-unit position.' },
  { id: 'totalstation', label: 'Total station', section: 'measuring', appropriate: true, capability: 'preciseProvenience',
    justify: true,
    note: 'Sub-centimetre three-dimensional coordinates for finds, features and the site grid.' },
  { id: 'gps', label: 'Handheld GPS unit', section: 'measuring', appropriate: true, capability: 'coarseProvenience',
    note: 'Site-level and survey-level positions, accurate to a few metres.' },
  { id: 'compass', label: 'Compass', section: 'measuring', appropriate: true, capability: 'orientation',
    note: 'Orientation for maps, profiles and photographs.' },

  // Recording
  { id: 'camera', label: 'Camera', section: 'recording', appropriate: true, capability: 'photograph',
    note: 'Photographic record of features and finds in place.' },
  { id: 'scale', label: 'Photo scale and north arrow', section: 'recording', appropriate: true, capability: 'photoScale',
    note: 'Makes a photograph measurable and orientable.' },
  { id: 'munsell', label: 'Munsell soil colour book', section: 'recording', appropriate: true, capability: 'soilColour',
    note: 'Standard, repeatable soil colour description.' },
  { id: 'clipboard', label: 'Clipboard, forms and graph paper', section: 'recording', appropriate: true, capability: 'forms',
    note: 'Level records, feature forms, profile drawings.' },
  { id: 'pencils', label: 'Pencils and permanent field notebook', section: 'recording', appropriate: true, capability: 'notes',
    note: 'Notes that survive rain and time.' },

  // Recovery and storage
  { id: 'screen', label: 'Quarter-inch screens', section: 'recovery', appropriate: true, capability: 'screening',
    note: 'Recovers small material the eye misses in the unit.' },
  { id: 'finescreen', label: 'Fine mesh and flotation bucket', section: 'recovery', appropriate: true, capability: 'flotation',
    justify: true,
    note: 'Recovers charred seeds, small bone and beads from soil samples.' },
  { id: 'buckets', label: 'Buckets', section: 'recovery', appropriate: true, capability: 'bulkRemoval',
    note: 'Moves soil from unit to screen without losing track of which level it came from.' },
  { id: 'bags', label: 'Artifact bags and tags', section: 'recovery', appropriate: true, capability: 'bagging',
    note: 'Keeps each level and context separate and identified.' },
  { id: 'foil', label: 'Foil and clean sample containers', section: 'recovery', appropriate: true, capability: 'sampling',
    justify: true,
    note: 'Uncontaminated collection of charcoal and soil samples.' },

  // Safety and site support
  { id: 'gloves', label: 'Gloves', section: 'safety', appropriate: true, capability: 'handling',
    justify: true,
    note: 'Safe handling of faunal remains and unknown material.' },
  { id: 'firstaid', label: 'First-aid kit', section: 'safety', appropriate: true, capability: 'safety',
    note: 'Standard crew requirement.' },
  { id: 'shoring', label: 'Shoring boards and stakes', section: 'safety', appropriate: true, capability: 'shoring',
    note: 'Stabilises an undercut or deep profile wall.' },
  { id: 'tarp', label: 'Tarps and site cover', section: 'safety', appropriate: true, capability: 'cover',
    note: 'Protects open units and exposed features overnight and in rain.' },

  // Clothing and personal gear
  { id: 'boots', label: 'Sturdy work boots', section: 'clothing', appropriate: true, capability: 'footwear',
    justify: true,
    note: 'Ankle support and toe protection on broken ground, spoil heaps and open units.' },
  { id: 'sunhat', label: 'Wide-brim hat and sunscreen', section: 'clothing', appropriate: true, capability: 'sunProtection',
    note: 'Three weeks of exposed bluff-top fieldwork, most of it in full sun.' },
  { id: 'hivis', label: 'High-visibility vest', section: 'clothing', appropriate: true, capability: 'visibility',
    note: 'Required whenever the crew works near the highway corridor and its construction traffic.' },
  { id: 'raingear', label: 'Rain jacket and spare layers', section: 'clothing', appropriate: true, capability: 'weather',
    note: 'Field days do not stop for drizzle, and a soaked crew makes poor records.' },

  // Staged on the truck: the inappropriate set
  { id: 'sandals', label: 'Sandals', section: 'staged', appropriate: false, justify: true },
  { id: 'chainsaw', label: 'Chainsaw', section: 'staged', appropriate: false, justify: true },
  { id: 'leafblower', label: 'Leaf blower', section: 'staged', appropriate: false },
  { id: 'pressurewasher', label: 'Pressure washer', section: 'staged', appropriate: false },
  { id: 'rake', label: 'Garden rake', section: 'staged', appropriate: false },
  { id: 'metaldetector', label: 'Metal detector (no permit on file)', section: 'staged', appropriate: false, justify: true },
  { id: 'marker', label: 'Permanent marker for writing on finds', section: 'staged', appropriate: false, justify: true }
];

/* Capabilities that later stations query. Kept as a list so the kit summary
   can be generated rather than hand-maintained. */
export const CAPABILITY_LABELS = {
  fineExcavation: 'controlled trowel excavation',
  bulkRemoval: 'bulk soil removal',
  cleaning: 'surface cleaning for photography',
  delicateExcavation: 'delicate exposure of fragile material',
  measure: 'in-unit measurement',
  depth: 'depth below datum',
  preciseProvenience: 'precise three-dimensional provenience',
  coarseProvenience: 'approximate mapped position',
  orientation: 'orientation and north reference',
  photograph: 'photography',
  photoScale: 'scaled, oriented photographs',
  soilColour: 'standard soil colour description',
  forms: 'level and feature forms',
  notes: 'written field notes',
  screening: 'quarter-inch screening',
  flotation: 'flotation and fine-mesh recovery',
  bagging: 'bagging and tagging by context',
  sampling: 'uncontaminated sample collection',
  handling: 'safe handling of remains',
  safety: 'crew safety',
  shoring: 'wall stabilisation',
  cover: 'overnight protection of open contexts',
  footwear: 'protected footwear for broken ground',
  sunProtection: 'sun protection for long field days',
  visibility: 'high visibility near construction traffic',
  weather: 'weather protection for the crew'
};

export const EQUIPMENT_JUSTIFY = {
  totalstation: {
    prompt: 'The total station is slow to set up and the project has three weeks. Why take it?',
    choices: [
      { text: 'It records find and feature positions in three dimensions against the site datum, so provenience survives the excavation',
        correct: true,
        feedback: 'Yes. Once soil is removed the only thing left is the record. Instrument-recorded coordinates let a later analyst place every point find back into the site.' },
      { text: 'It measures artifact size more accurately than a tape', correct: false,
        feedback: 'Object measurement is a laboratory task. The instrument exists to fix position in space, not to measure objects.' },
      { text: 'It is required to obtain a radiocarbon date', correct: false,
        feedback: 'Radiocarbon depends on the sample and its context, not on the survey instrument. Precise provenience strengthens the interpretation of a date but does not produce one.' }
    ]
  },
  finescreen: {
    prompt: 'Flotation equipment adds weight and processing time. When does it earn its place?',
    choices: [
      { text: 'When questions about diet and plant use matter, because charred seeds and small bone will not survive a quarter-inch screen',
        correct: true,
        feedback: 'Correct. Subsistence evidence is mostly invisible at quarter-inch. Without flotation, an argument about plant food rests on nothing recovered.' },
      { text: 'It is only useful on underwater sites', correct: false,
        feedback: 'Flotation is a standard terrestrial recovery method for light organic material. Water is the medium, not the site type.' },
      { text: 'It replaces quarter-inch screening entirely', correct: false,
        feedback: 'They recover different fractions. Flotation processes selected soil samples; quarter-inch screening handles bulk excavated soil.' }
    ]
  },
  foil: {
    prompt: 'Why do charcoal samples need dedicated clean containers rather than an ordinary artifact bag?',
    choices: [
      { text: 'Modern carbon from handling, tools or a used bag can contaminate the sample and shift or invalidate the radiocarbon result',
        correct: true,
        feedback: 'Exactly. A contaminated sample may still return a number, and that number can be wrong in a way nobody can detect afterwards.' },
      { text: 'Charcoal is fragile and would be crushed in a bag', correct: false,
        feedback: 'Fragility matters, but the controlling reason is contamination. A crushed but clean sample still dates correctly.' },
      { text: 'Laboratories charge less for foil-wrapped samples', correct: false,
        feedback: 'Cost is not the issue. Sample integrity is.' }
    ]
  },
  gloves: {
    prompt: 'When do gloves matter most on this project?',
    choices: [
      { text: 'Handling faunal bone or any unidentified organic material, where both crew safety and later analysis are at stake',
        correct: true,
        feedback: 'Right. Gloves protect the handler, and they keep skin oils and modern residues off material that may later be sampled.' },
      { text: 'Only when the weather is cold', correct: false,
        feedback: 'Comfort is not why gloves are in a field kit.' },
      { text: 'To improve grip when pulling artifacts out of the soil', correct: false,
        feedback: 'Artifacts should be exposed and lifted carefully, not pulled. Grip is not the reason.' }
    ]
  },
  boots: {
    prompt: 'Why do work boots matter on this particular project?',
    choices: [
      { text: 'The site is uneven, eroding ground beside active construction: crushed toes and turned ankles end field seasons',
        correct: true,
        feedback: 'Right. Site safety rules exist because a single foot injury takes a crew member out for the season, and near plant machinery protective footwear is usually mandatory.' },
      { text: 'They make it easier to push a shovel in with your foot', correct: false,
        feedback: 'They do help with that, but comfort of digging is not why footwear is a rule. Protection is.' },
      { text: 'They keep your feet warm in the morning', correct: false,
        feedback: 'Warmth is incidental. The reason boots are required is protection on broken ground and around machinery.' }
    ]
  },
  sandals: {
    prompt: 'Why do the sandals stay on the truck?',
    choices: [
      { text: 'Open footwear around sharp tools, spoil heaps and construction traffic is a safety violation on any professional crew',
        correct: true,
        feedback: 'Correct. Most permits and contractors require closed protective footwear on site, and a crew chief will send unprotected feet home.' },
      { text: 'They wear out too quickly in the field', correct: false,
        feedback: 'Durability is not the issue. Safety is.' },
      { text: 'They look unprofessional in site photographs', correct: false,
        feedback: 'Appearance is not the issue. Open footwear is a safety violation near tools and machinery.' }
    ]
  },
  chainsaw: {
    prompt: 'Why does this not belong in an excavation kit?',
    choices: [
      { text: 'Nothing in controlled excavation calls for that much uncontrolled force near fragile deposits',
        correct: true,
        feedback: 'Correct. Vegetation clearance on a site is done by hand or by a separate, supervised operation well away from open contexts.' },
      { text: 'It is too loud for a quiet site', correct: false,
        feedback: 'Noise is not the concern. Risk to the deposit is.' },
      { text: 'It needs a licence', correct: false,
        feedback: 'Licensing is not the core issue. It is simply the wrong tool for every task on this project.' }
    ]
  },
  metaldetector: {
    prompt: 'What is the actual problem with taking this one?',
    choices: [
      { text: 'Using a detector on an archaeological site without authorisation, a research design and a recording protocol can breach permits and law, and produces finds with no context',
        correct: true,
        feedback: 'Correct. Detector survey is a legitimate method when it is permitted, designed and recorded. Used casually it strips provenience and can be unlawful.' },
      { text: 'Metal detectors never find anything useful', correct: false,
        feedback: 'They can be very useful in a properly designed survey. Authorisation and recording are the issue.' },
      { text: 'It would only find modern debris', correct: false,
        feedback: 'Modern debris is itself recordable data. The problem is permission and method.' }
    ]
  },
  marker: {
    prompt: 'Why is writing catalogue numbers directly onto finds with a permanent marker a problem?',
    choices: [
      { text: 'It permanently alters the object and bypasses proper labelling by bag and tag, or by reversible archival methods when direct labelling is genuinely needed',
        correct: true,
        feedback: 'Correct. Direct labelling, where used at all, is done in a laboratory with reversible materials and never over a diagnostic or sampleable surface.' },
      { text: 'The ink is not durable enough', correct: false,
        feedback: 'Durability is not the concern. Irreversibility is.' },
      { text: 'It takes too long in the field', correct: false,
        feedback: 'Speed is not the concern. Permanently marking a find is a conservation problem regardless of how quickly it is done.' }
    ]
  }
};

/* Items a learner can go back and fetch mid-project, at a cost in days. */
export const RETRIEVAL_COST_DAYS = 1;

export function itemById(id) {
  return EQUIPMENT_ITEMS.find((i) => i.id === id) || null;
}

export function itemsGrantingCapability(cap) {
  return EQUIPMENT_ITEMS.filter((i) => i.capability === cap);
}
