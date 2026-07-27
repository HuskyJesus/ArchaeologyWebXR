/* Station 7 content: reconstructing daily life.

   Each domain offers several statements of different strength. A statement
   is only "supported" if the learner's own evidence set carries the tags it
   requires. Statements can still be selected without that support, but they
   are recorded and reported as speculative, and the workspace says so at the
   moment of selection rather than hiding it until the report. */

export const SYNTHESIS_DOMAINS = [
  {
    id: 'diet',
    label: 'Diet',
    question: 'What did people at Redstone Bluff eat?',
    statements: [
      { id: 'diet_broad', text: 'A broad-spectrum diet combining hunted game, river resources and gathered plant foods',
        requires: { all: ['diet'], any: ['bone', 'shell', 'botanical'], minAny: 2 },
        rationale: 'Needs at least two independent classes of food evidence. One class alone shows a food source, not a diet.' },
      { id: 'diet_meat', text: 'Large game made a significant contribution to the diet',
        requires: { all: ['bone'] },
        rationale: 'Rests on butchered large mammal bone.' },
      { id: 'diet_plant', text: 'Gathered plant foods, particularly nuts, were a regular part of the diet',
        requires: { all: ['botanical'] },
        rationale: 'Rests on charred nutshell recovered by flotation.' },
      { id: 'diet_maize', text: 'Maize was the staple food of the occupation',
        requires: { all: ['agriculture', 'botanical'], forbid: true },
        overreach: true,
        rationale: 'Maize is present but scarce in the flotation sample, and nutshell dominates. Presence is not dominance. This statement outruns the evidence even when maize was recovered.' }
    ]
  },
  {
    id: 'hunting',
    label: 'Hunting',
    question: 'What can be said about hunting?',
    statements: [
      { id: 'hunt_deer', text: 'Deer were hunted and butchered on site',
        requires: { all: ['bone', 'hunting'] },
        rationale: 'Needs both hunting equipment and butchered large mammal bone.' },
      { id: 'hunt_technology', text: 'Hunting technology changed between the earlier and later occupations',
        requires: { all: ['archaic', 'woodland'] },
        rationale: 'Needs diagnostic projectile points from both components.' },
      { id: 'hunt_specialised', text: 'The site was a specialised hunting camp used only for that purpose',
        requires: { forbid: true },
        overreach: true,
        rationale: 'Pottery, grinding equipment, storage and structural evidence all point away from a single-purpose hunting station.' }
    ]
  },
  {
    id: 'fishing',
    label: 'Fishing and river use',
    question: 'Were river resources used?',
    statements: [
      { id: 'fish_yes', text: 'River resources including fish and freshwater mussel were exploited',
        requires: { any: ['fishing', 'shell'], minAny: 1 },
        rationale: 'Rests on fish bone from screened deposits or on the shell deposit.' },
      { id: 'fish_screening', text: 'The scale of fish use can only be estimated because recovery depended on screening',
        requires: { all: ['fishing'] },
        rationale: 'An honest statement about method: fish bone is a recovery-dependent category.' },
      { id: 'fish_primary', text: 'Fishing was the primary subsistence activity',
        requires: { forbid: true },
        overreach: true,
        rationale: 'Nothing quantifies the relative contribution of fish against game and plants. Presence does not establish primacy.' }
    ]
  },
  {
    id: 'plantProcessing',
    label: 'Plant processing',
    question: 'How were plant foods processed?',
    statements: [
      { id: 'plant_grinding', text: 'Plant foods were processed with grinding equipment on site',
        requires: { all: ['groundstone'] },
        rationale: 'Rests on ground stone with use-wear.' },
      { id: 'plant_roasting', text: 'Plant foods were heated or roasted, on the evidence of charred remains in fire features',
        requires: { all: ['botanical', 'hearth'] },
        rationale: 'Needs charred plant material and a fire feature to associate it with.' },
      { id: 'plant_storage', text: 'Plant foods were stored on site in prepared pits',
        requires: { all: ['storage'] },
        rationale: 'Rests on a recorded storage feature.' }
    ]
  },
  {
    id: 'agriculture',
    label: 'Agriculture',
    question: 'Is there evidence for cultivation?',
    statements: [
      { id: 'ag_present', text: 'Maize was present and in some use, but the evidence does not establish how much cultivation took place',
        requires: { all: ['agriculture'] },
        rationale: 'The defensible reading: a small number of charred maize fragments among dominant wild plant remains.' },
      { id: 'ag_supplement', text: 'Cultivated plants supplemented a diet still largely based on wild resources',
        requires: { all: ['agriculture', 'botanical'] },
        rationale: 'Needs both the cultigen and the wild plant assemblage that outweighs it.' },
      { id: 'ag_farming', text: 'The occupation was an agricultural settlement dependent on maize farming',
        requires: { forbid: true },
        overreach: true,
        rationale: 'Requires field systems, storage scaled to a harvest, quantities of maize, and ideally isotopic evidence. None of that is present.' },
      { id: 'ag_none', text: 'No evidence of cultivation was recovered',
        requires: { absent: ['agriculture'] },
        rationale: 'A valid and important conclusion if no flotation sample was processed. It should be stated as a limit of recovery rather than as a demonstrated absence.' }
    ]
  },
  {
    id: 'toolProduction',
    label: 'Tool production',
    question: 'Were tools made or maintained here?',
    statements: [
      { id: 'tool_maintenance', text: 'Stone tools were resharpened and maintained on site',
        requires: { all: ['toolProduction'] },
        rationale: 'Rests on debitage dominated by small late-stage flakes.' },
      { id: 'tool_bone', text: 'Bone was worked into tools on site',
        requires: { all: ['craft'] },
        rationale: 'Rests on a finished bone tool.' },
      { id: 'tool_quarry', text: 'The site functioned as a stone tool production centre supplying other settlements',
        requires: { forbid: true },
        overreach: true,
        rationale: 'Would require primary reduction debris in quantity, cores, and a raw material source. The assemblage is maintenance debris.' }
    ]
  },
  {
    id: 'potteryUse',
    label: 'Pottery use',
    question: 'How was pottery used?',
    statements: [
      { id: 'pot_cooking', text: 'Ceramic vessels were used for cooking',
        requires: { all: ['ceramic', 'cooking'] },
        rationale: 'Rests on sooted sherds, ideally with an associated fire feature.' },
      { id: 'pot_present', text: 'Pottery was in use during the later occupation but not the earlier one',
        requires: { all: ['ceramic', 'archaic'] },
        rationale: 'Needs both ceramics in the upper deposits and a pre-ceramic horizon recorded below.' }
    ]
  },
  {
    id: 'trade',
    label: 'Trade and contact',
    question: 'Is there evidence of contact beyond the local area?',
    statements: [
      { id: 'trade_shell', text: 'At least one object came from outside the local area, indicating exchange or long-distance contact',
        requires: { all: ['trade'] },
        rationale: 'Rests on the marine shell bead, whose raw material does not occur locally.' },
      { id: 'trade_limited', text: 'Evidence for exchange is limited to a single object class and cannot indicate its scale',
        requires: { all: ['trade'] },
        rationale: 'An honest qualification of a single-object argument.' },
      { id: 'trade_network', text: 'The settlement was a node in a regional trade network',
        requires: { forbid: true },
        overreach: true,
        rationale: 'One bead does not make a network. That claim would need quantities of non-local material across several classes.' }
    ]
  },
  {
    id: 'duration',
    label: 'Settlement duration',
    question: 'How long was the site occupied at any one time?',
    statements: [
      { id: 'dur_substantial', text: 'The later occupation was substantial rather than brief, on the evidence of accumulated refuse, storage and construction',
        requires: { any: ['midden', 'storage', 'structure'], minAny: 2 },
        rationale: 'Needs at least two of: a midden deposit, a storage feature, structural evidence.' },
      { id: 'dur_repeated', text: 'The terrace was reoccupied at widely separated times rather than continuously',
        requires: { all: ['archaic', 'woodland'] },
        rationale: 'Needs evidence of both components, ideally separated stratigraphically.' },
      { id: 'dur_brief', text: 'The site was a brief overnight stop',
        requires: { forbid: true },
        overreach: true,
        rationale: 'Contradicted by any of: a thick midden, storage pits, heavy grinding equipment, or a built structure.' }
    ]
  },
  {
    id: 'seasonality',
    label: 'Seasonality',
    question: 'What seasons are represented?',
    statements: [
      { id: 'seas_autumn', text: 'Autumn occupation is indicated by charred nutshell',
        requires: { all: ['botanical'] },
        rationale: 'Nut harvest is an autumn event, so charred nutshell places people here in autumn.' },
      { id: 'seas_multi', text: 'The evidence indicates occupation across more than one season, though the full range is not established',
        requires: { all: ['botanical'], any: ['structure', 'storage', 'fishing'], minAny: 1 },
        rationale: 'Needs a seasonal indicator plus evidence of investment that a single-season stop would not justify.' },
      { id: 'seas_yearRound', text: 'The site was occupied year round',
        requires: { forbid: true },
        overreach: true,
        rationale: 'Year-round occupation needs seasonal indicators from every season: fish growth increments, migratory bird bone, seasonal plant species. Autumn evidence alone cannot show it.' },
      { id: 'seas_unknown', text: 'Season of occupation could not be determined from the recovered evidence',
        requires: { absent: ['botanical'] },
        rationale: 'A correct and useful conclusion where no flotation sample was processed.' }
    ]
  },
  {
    id: 'organisation',
    label: 'Household and community organisation',
    question: 'What can be said about how people organised themselves here?',
    statements: [
      { id: 'org_household', text: 'At least one built structure housed household activity, including cooking and craft work',
        requires: { all: ['structure'], any: ['hearth', 'craft'], minAny: 1 },
        rationale: 'Needs structural evidence plus activity evidence from inside it.' },
      { id: 'org_indoorOutdoor', text: 'Activity was divided between indoor and outdoor areas',
        requires: { all: ['structure', 'hearth', 'midden'] },
        rationale: 'Needs an interior hearth, an exterior feature or midden, and the structure that separates them.' },
      { id: 'org_village', text: 'The site was a permanent village of many households',
        requires: { forbid: true },
        overreach: true,
        rationale: 'One partially exposed structure cannot establish settlement size. That would need a much wider excavation or geophysical survey.' },
      { id: 'org_unknown', text: 'The excavated sample is too small to say anything about community organisation',
        requires: { absent: ['structure'] },
        rationale: 'The correct conclusion where no structural evidence was recovered, and a legitimate finding rather than a failure.' }
    ]
  }
];

export function domainById(id) {
  return SYNTHESIS_DOMAINS.find((d) => d.id === id) || null;
}

export function statementById(id) {
  for (const d of SYNTHESIS_DOMAINS) {
    const s = d.statements.find((st) => st.id === id);
    if (s) return { domain: d, statement: s };
  }
  return null;
}

/* Pure support test. `tags` is the set of evidence tags the learner has
   actually generated. Returns 'supported', 'unsupported' or 'overreach'. */
export function evaluateStatement(statement, tags) {
  const req = statement.requires || {};
  if (req.forbid) return 'overreach';
  if (req.absent) {
    const anyPresent = req.absent.some((t) => tags.has(t));
    return anyPresent ? 'unsupported' : 'supported';
  }
  if (req.all && !req.all.every((t) => tags.has(t))) return 'unsupported';
  if (req.any) {
    const hits = req.any.filter((t) => tags.has(t)).length;
    if (hits < (req.minAny || 1)) return 'unsupported';
  }
  return 'supported';
}
