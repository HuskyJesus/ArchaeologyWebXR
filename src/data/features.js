/* Station 6 content: feature interpretation.

   A feature record is built from observations first (shape, dimensions,
   soil colour, contents, relationship to surrounding layers) and only then
   an interpretation, a confidence, and a stated alternative. The alternative
   is required, because a feature interpretation that cannot name what else
   it might be is not an interpretation.

   Some observation fields need a capability from the field kit. Without the
   Munsell book the learner can still describe colour informally, but the
   record is weaker and says so. */

export const FEATURE_RECORD_FIELDS = ['shape', 'dimensions', 'soilColour', 'contents', 'relationship'];

export const FEATURES = {
  ft_hearth: {
    id: 'ft_hearth',
    name: 'Rock-ringed fire feature',
    unit: 'unitA',
    level: 3,
    tags: ['hearth', 'cooking', 'fcr', 'dating'],
    description: 'A roughly circular patch of reddened, ash-filled soil about 60 cm across, ringed by angular fire-cracked sandstone. Charcoal is abundant in the fill. The feature continues into the north wall of the unit.',
    observations: {
      shape: {
        prompt: 'Plan shape',
        options: [
          { id: 'circular', label: 'Circular to sub-circular, with a defined edge' },
          { id: 'linear', label: 'Linear' },
          { id: 'irregular', label: 'Irregular with diffuse edges' },
          { id: 'rectangular', label: 'Rectangular' }
        ],
        correct: 'circular',
        feedback: {
          circular: 'Correct. A defined circular outline is the first thing that separates this from a diffuse burnt patch.',
          linear: 'The rock ring closes on itself rather than running in a line.',
          irregular: 'The edge can be traced continuously, which is the opposite of diffuse.',
          rectangular: 'No straight sides or corners are present.'
        }
      },
      dimensions: {
        prompt: 'Dimensions',
        options: [
          { id: 'd60', label: 'About 60 cm across, 12 cm deep, extending into the north wall' },
          { id: 'd20', label: 'About 20 cm across, 5 cm deep' },
          { id: 'd200', label: 'About 200 cm across, 40 cm deep' },
          { id: 'unmeasured', label: 'Not measured' }
        ],
        correct: 'd60',
        feedback: {
          d60: 'Correct, and noting that it continues into the wall is as important as the measurement itself. Part of this feature was never excavated.',
          d20: 'Too small. Check the measurement against the rock ring, not the ash patch alone.',
          d200: 'Too large by a wide margin.',
          unmeasured: 'Dimensions are what allow this feature to be compared with the interior hearth and with hearths from other sites. Without them the record is not usable.'
        }
      },
      soilColour: {
        prompt: 'Fill colour',
        requiresCapability: 'soilColour',
        options: [
          { id: 'munsell', label: '5YR 4/6 yellowish red fill with 10YR 2/1 black ash lenses', requires: ['soilColour'] },
          { id: 'informal', label: 'Reddish soil with black patches (described by eye)' },
          { id: 'none', label: 'Not recorded' }
        ],
        correct: 'munsell',
        feedback: {
          munsell: 'Correct. A standard notation means another archaeologist reads the same colour you saw, in different light, years later.',
          informal: 'An informal description is still a record and is better than nothing, but "reddish" is not repeatable and cannot be compared between recorders.',
          none: 'Soil colour is one of the few attributes of a feature that survives only in the record.'
        }
      },
      contents: {
        prompt: 'Contents (select all that are present)',
        multi: true,
        options: [
          { id: 'fcr', label: 'Fire-cracked rock', correct: true },
          { id: 'charcoal', label: 'Charcoal', correct: true },
          { id: 'ash', label: 'Ash and reddened soil', correct: true },
          { id: 'burntBone', label: 'Small calcined bone fragments', correct: true },
          { id: 'pottery', label: 'Complete pottery vessels', correct: false },
          { id: 'metal', label: 'Metal objects', correct: false }
        ],
        feedback: {
          pottery: 'No complete vessels are present. Only the sherds from the level above, which are a different context.',
          metal: 'No metal is present in this sealed feature. The nail came from the plough zone.'
        }
      },
      relationship: {
        prompt: 'Relationship to the surrounding layers',
        options: [
          { id: 'cutFromL3', label: 'Cut into the level 3 surface and sealed by the midden above it' },
          { id: 'cutFromSurface', label: 'Cut from the modern ground surface' },
          { id: 'sitsOnSubsoil', label: 'Lying on sterile subsoil, unsealed' },
          { id: 'unclear', label: 'Relationship not determinable' }
        ],
        correct: 'cutFromL3',
        feedback: {
          cutFromL3: 'Correct, and this is the single most valuable observation in the record. Being sealed by an intact midden means both the feature and its charcoal are secure in time.',
          cutFromSurface: 'A feature cut from the surface would show in the plough zone. This one does not appear until level 3.',
          sitsOnSubsoil: 'Subsoil is another 40 cm below this.',
          unclear: 'The relationship is visible in the section and determines whether any date from this feature can be trusted. It is worth the time to establish it.'
        }
      }
    },
    interpretations: [
      { id: 'hearth', label: 'A hearth: an in-place fire feature used for cooking or heating', verdict: 'best',
        feedback: 'The best supported reading. Reddened soil in place, an ash fill, a deliberate rock ring, and charcoal throughout. The reddening in particular shows the fire burned here rather than the debris being dumped here.' },
      { id: 'dump', label: 'A dump of hearth cleanings from a fire that burned elsewhere', verdict: 'defensible',
        feedback: 'A genuinely important alternative and a common situation. What argues against it here is the in-place reddening of the underlying soil, which only forms where the fire actually burned, and the deliberate ring of rock.' },
      { id: 'roastingPit', label: 'A roasting pit or earth oven', verdict: 'defensible',
        feedback: 'Reasonable given the fire-cracked rock, and hard to separate from a surface hearth on this evidence. An earth oven is usually deeper with a distinct basin profile. At 12 cm this is shallow for one.' },
      { id: 'natural', label: 'A natural burnt patch, such as a tree stump burn', verdict: 'poor',
        feedback: 'A stump burn is irregular, follows root channels, and has no rock ring. The deliberate arrangement of fire-cracked rock is not something a natural fire produces.' },
      { id: 'storage', label: 'A storage pit', verdict: 'poor',
        feedback: 'Storage pits are deep, steep-sided, and do not have reddened bases or rock rings. Compare this with the feature in level 4 to see the difference.' }
    ]
  },

  ft_storagepit: {
    id: 'ft_storagepit',
    name: 'Deep bell-shaped pit',
    unit: 'unitA',
    level: 4,
    tags: ['pit', 'storage', 'duration', 'plantProcessing'],
    description: 'A dark circular stain about one metre across cutting the level 4 surface. In section it is steep-sided and slightly wider at the base than the mouth, 65 cm deep, with three distinct fill layers.',
    observations: {
      shape: {
        prompt: 'Profile shape',
        options: [
          { id: 'bell', label: 'Bell-shaped: steep-sided, wider at the base than the mouth' },
          { id: 'basin', label: 'Shallow basin' },
          { id: 'vshape', label: 'V-shaped' },
          { id: 'irregular', label: 'Irregular' }
        ],
        correct: 'bell',
        feedback: {
          bell: 'Correct, and this is the diagnostic observation. An undercut profile takes deliberate effort to dig and is very hard to explain naturally.',
          basin: 'At 65 cm deep with near-vertical sides this is not a basin.',
          vshape: 'The sides are near-vertical and the base is flat and undercut.',
          irregular: 'The outline is regular enough to plan as a circle.'
        }
      },
      dimensions: {
        prompt: 'Dimensions',
        options: [
          { id: 'd100', label: '100 cm mouth diameter, 118 cm at the base, 65 cm deep' },
          { id: 'd40', label: '40 cm across, 15 cm deep' },
          { id: 'd300', label: '300 cm across, 150 cm deep' },
          { id: 'unmeasured', label: 'Not measured' }
        ],
        correct: 'd100',
        feedback: {
          d100: 'Correct, and recording both the mouth and base diameters is what documents the undercut. Volume can be estimated from these figures.',
          d40: 'Too small; that is closer to a post stain.',
          d300: 'Far larger than the excavated outline.',
          unmeasured: 'Capacity is central to any storage argument, and capacity comes from dimensions.'
        }
      },
      soilColour: {
        prompt: 'Fill colour',
        requiresCapability: 'soilColour',
        options: [
          { id: 'munsell', label: 'Upper 10YR 3/2, middle 10YR 2/1 charcoal-rich, basal 10YR 4/3', requires: ['soilColour'] },
          { id: 'informal', label: 'Dark fill with a darker band in the middle (described by eye)' },
          { id: 'none', label: 'Not recorded' }
        ],
        correct: 'munsell',
        feedback: {
          munsell: 'Correct, and recording each fill separately is the point. Three colours means three depositional events.',
          informal: 'The layering is noticed, which matters most. Standard notation would let someone else compare these fills with pit fills elsewhere.',
          none: 'The fill sequence is the record of how the pit went out of use.'
        }
      },
      contents: {
        prompt: 'Contents (select all that are present)',
        multi: true,
        options: [
          { id: 'charredPlant', label: 'Charred nutshell and maize fragments', correct: true },
          { id: 'groundstone', label: 'Broken ground stone', correct: true },
          { id: 'bone', label: 'Animal bone', correct: true },
          { id: 'charcoal', label: 'Charcoal', correct: true },
          { id: 'humanRemains', label: 'Human remains', correct: false },
          { id: 'metal', label: 'Metal objects', correct: false }
        ],
        feedback: {
          humanRemains: 'No human remains are present in this feature. Were any suspected, excavation would stop immediately and the site protocol would apply.',
          metal: 'No metal. This context is sealed well below the plough zone.'
        }
      },
      relationship: {
        prompt: 'Relationship to the surrounding layers',
        options: [
          { id: 'cutFromL4', label: 'Cut from the level 4 surface, through it into subsoil, and sealed by level 3 above' },
          { id: 'cutFromSurface', label: 'Cut from the modern surface' },
          { id: 'predatesL4', label: 'Sealed by level 4, therefore earlier than it' },
          { id: 'unclear', label: 'Not determinable' }
        ],
        correct: 'cutFromL4',
        feedback: {
          cutFromL4: 'Correct. Knowing which surface a pit was dug from is what ties it to a specific occupation rather than leaving it floating in the sequence.',
          cutFromSurface: 'It does not appear in any level above 4.',
          predatesL4: 'It cuts level 4 rather than being sealed by it, so it is later than level 4 rather than earlier.',
          unclear: 'This is determinable in section, and without it the pit cannot be assigned to an occupation.'
        }
      }
    },
    interpretations: [
      { id: 'storage', label: 'A storage pit, later filled with refuse', verdict: 'best',
        feedback: 'The best supported reading. An undercut bell profile maximises volume for a given mouth and is a well-known storage form. The layered fill shows it was backfilled with domestic refuse after it stopped being used for storage, which is the normal life history of such a pit.' },
      { id: 'refusePit', label: 'A pit dug specifically for refuse disposal', verdict: 'defensible',
        feedback: 'The fill certainly is refuse, so this is not unreasonable. What argues against it is the effort: nobody undercuts the sides of a rubbish hole. The shape suggests the pit was built for something else first.' },
      { id: 'processing', label: 'A processing or roasting pit', verdict: 'defensible',
        feedback: 'Worth considering, but there is no in-place burning: no reddened walls or base, no ash lens against the sides. The charcoal in the middle fill arrived with the refuse.' },
      { id: 'posthole', label: 'A very large post hole', verdict: 'poor',
        feedback: 'A post hole retains a post pipe or packing stones and does not undercut. At one metre across and undercut, this held no post.' },
      { id: 'natural', label: 'A natural hollow such as a tree throw', verdict: 'poor',
        feedback: 'Tree throws are irregular, asymmetric and paired with a mound. A symmetrical undercut cylinder is not produced by a falling tree.' }
    ]
  },

  ft_midden: {
    id: 'ft_midden',
    name: 'Midden deposit',
    unit: 'unitA',
    level: 2,
    tags: ['midden', 'diet', 'duration', 'discard'],
    description: 'A black, greasy silt loam deposit 14 cm thick extending across the whole unit and beyond it in every direction, packed with bone, shell, charcoal and artifacts, sealed beneath the plough zone.',
    observations: {
      shape: {
        prompt: 'Plan and extent',
        options: [
          { id: 'sheet', label: 'A continuous sheet deposit extending beyond the unit in all directions' },
          { id: 'circular', label: 'A bounded circular deposit within the unit' },
          { id: 'linear', label: 'A linear band' },
          { id: 'lens', label: 'A small isolated lens' }
        ],
        correct: 'sheet',
        feedback: {
          sheet: 'Correct, and the fact that it has no edge within the unit is itself the observation. Its true extent is unknown and should be stated as unknown.',
          circular: 'No edge to the deposit is present in any of the four walls.',
          linear: 'It is present in all four walls, not in a band.',
          lens: 'It is 14 cm thick across two metres and continues past the unit in every direction.'
        }
      },
      dimensions: {
        prompt: 'Dimensions',
        options: [
          { id: 'thickness', label: '14 cm thick, extent beyond the 2 m unit unknown' },
          { id: 'bounded', label: '80 cm across, 14 cm thick' },
          { id: 'thin', label: '2 cm thick' },
          { id: 'unmeasured', label: 'Not measured' }
        ],
        correct: 'thickness',
        feedback: {
          thickness: 'Correct, including the honest statement that the extent is unknown. Recording what you did not establish is part of the record.',
          bounded: 'No boundary was reached.',
          thin: 'Considerably thicker than that.',
          unmeasured: 'Thickness is the main measure of how much material accumulated, which speaks directly to duration.'
        }
      },
      soilColour: {
        prompt: 'Deposit colour',
        requiresCapability: 'soilColour',
        options: [
          { id: 'munsell', label: '10YR 2/1 black, greasy silt loam', requires: ['soilColour'] },
          { id: 'informal', label: 'Very dark, greasy soil (described by eye)' },
          { id: 'none', label: 'Not recorded' }
        ],
        correct: 'munsell',
        feedback: {
          munsell: 'Correct. The blackness comes from accumulated organic matter and charcoal, and that is precisely what distinguishes a midden from ordinary dark topsoil.',
          informal: 'The greasy texture is a good observation. Standard colour notation would make it comparable.',
          none: 'Colour and texture together are what identify this deposit as a midden.'
        }
      },
      contents: {
        prompt: 'Contents (select all that are present)',
        multi: true,
        options: [
          { id: 'bone', label: 'Animal bone, including fish', correct: true },
          { id: 'shell', label: 'Freshwater mussel shell', correct: true },
          { id: 'pottery', label: 'Pottery sherds', correct: true },
          { id: 'charcoal', label: 'Charcoal and ash', correct: true },
          { id: 'ornament', label: 'Small ornaments such as beads', correct: true },
          { id: 'buildingMaterial', label: 'Structural building material', correct: false }
        ],
        feedback: {
          buildingMaterial: 'No structural material is present here. The building evidence is in Unit C.'
        }
      },
      relationship: {
        prompt: 'Relationship to the surrounding layers',
        options: [
          { id: 'sealedBelow', label: 'Sealed directly beneath the plough zone and overlying the level 3 occupation surface' },
          { id: 'cutsSubsoil', label: 'Cut into sterile subsoil' },
          { id: 'aboveModern', label: 'Overlying modern material' },
          { id: 'unclear', label: 'Not determinable' }
        ],
        correct: 'sealedBelow',
        feedback: {
          sealedBelow: 'Correct. Sealed and intact, and directly above the occupation surface that produced it.',
          cutsSubsoil: 'It is a deposit lying on a surface, not a cut into subsoil.',
          aboveModern: 'Nothing modern lies beneath it.',
          unclear: 'The sequence is clear in the section and matters for everything built on this deposit.'
        }
      }
    },
    interpretations: [
      { id: 'midden', label: 'A midden: accumulated domestic refuse from sustained occupation', verdict: 'best',
        feedback: 'The best supported reading. Thickness, organic content, and a broad mix of food waste and broken domestic equipment across a large area. This is what accumulates where people live for a while, not where they stop briefly.' },
      { id: 'singleDump', label: 'A single large dumping episode', verdict: 'defensible',
        feedback: 'Worth testing, and the way to test it is to look for internal layering. A single dump tends to show one depositional unit; a midden built up over time usually shows lenses. Fourteen centimetres of homogeneous deposit is more consistent with gradual accumulation.' },
      { id: 'buriedTopsoil', label: 'A buried natural topsoil horizon', verdict: 'poor',
        feedback: 'Buried topsoil is dark, but it does not contain pottery, worked bone, beads and butchered animal bone.' },
      { id: 'floorDeposit', label: 'An occupation floor inside a structure', verdict: 'poor',
        feedback: 'A floor is compacted and thin, with material lying on it. This is a thick, loose, organic accumulation with material throughout.' }
    ]
  },

  ft_postmolds: {
    id: 'ft_postmolds',
    name: 'Arc of post stains',
    unit: 'unitC',
    level: 2,
    tags: ['postmold', 'architecture', 'structure', 'duration'],
    description: 'Five dark circular stains, each about 15 cm across, spaced at roughly 90 cm intervals on a gentle arc, cut into a compacted surface and following the curve of the depression edge.',
    observations: {
      shape: {
        prompt: 'Plan arrangement',
        options: [
          { id: 'arc', label: 'A regular arc of evenly spaced circular stains' },
          { id: 'random', label: 'A random scatter of stains' },
          { id: 'straightLine', label: 'A straight line' },
          { id: 'cluster', label: 'A tight cluster' }
        ],
        correct: 'arc',
        feedback: {
          arc: 'Correct, and regularity is the whole argument. Roots and animal burrows do not space themselves evenly on a curve.',
          random: 'The spacing varies by less than 10 cm across five stains.',
          straightLine: 'The line curves consistently, following the depression edge.',
          cluster: 'They are spread across nearly four metres.'
        }
      },
      dimensions: {
        prompt: 'Dimensions',
        options: [
          { id: 'd15', label: '15 cm diameter each, 30 to 40 cm deep, spaced about 90 cm apart' },
          { id: 'd60', label: '60 cm diameter each, 10 cm deep' },
          { id: 'd5', label: '5 cm diameter, 5 cm deep' },
          { id: 'unmeasured', label: 'Not measured' }
        ],
        correct: 'd15',
        feedback: {
          d15: 'Correct. Diameter indicates post size, depth indicates how much load it carried, and spacing indicates wall construction. All three are structural evidence.',
          d60: 'That would be a pit rather than a post.',
          d5: 'Too small to have held a structural post.',
          unmeasured: 'Without depth and spacing there is no way to argue for a substantial building rather than a light screen.'
        }
      },
      soilColour: {
        prompt: 'Stain colour against the surrounding matrix',
        requiresCapability: 'soilColour',
        options: [
          { id: 'munsell', label: 'Stains 10YR 2/2 against a 10YR 4/4 matrix', requires: ['soilColour'] },
          { id: 'informal', label: 'Dark stains against lighter soil (described by eye)' },
          { id: 'none', label: 'Not recorded' }
        ],
        correct: 'munsell',
        feedback: {
          munsell: 'Correct. Recording both the stain and the matrix is what documents the contrast that made the stains visible at all.',
          informal: 'The contrast is noted, which is the important part. Standard notation makes it repeatable.',
          none: 'The colour contrast is the only reason these features are visible, and it disappears once they are excavated.'
        }
      },
      contents: {
        prompt: 'Contents (select all that are present)',
        multi: true,
        options: [
          { id: 'darkFill', label: 'Dark organic fill, softer than the surrounding matrix', correct: true },
          { id: 'charcoalFlecks', label: 'Charcoal flecks', correct: true },
          { id: 'packing', label: 'Small packing stones around the shaft edge', correct: true },
          { id: 'artifacts', label: 'Large artifacts', correct: false },
          { id: 'bone', label: 'Articulated animal bone', correct: false }
        ],
        feedback: {
          artifacts: 'Post fills rarely contain large objects, and none are present here.',
          bone: 'No articulated bone is present.'
        }
      },
      relationship: {
        prompt: 'Relationship to the surrounding layers',
        options: [
          { id: 'cutFloor', label: 'Cut into the compacted floor surface, sealed by the structure fill above' },
          { id: 'cutSurface', label: 'Cut from the modern surface' },
          { id: 'belowSubsoil', label: 'Sealed beneath sterile subsoil' },
          { id: 'unclear', label: 'Not determinable' }
        ],
        correct: 'cutFloor',
        feedback: {
          cutFloor: 'Correct, and this ties the posts to the floor rather than to some later or earlier event. Posts and floor belong to the same structure.',
          cutSurface: 'They do not appear until the fill is removed.',
          belowSubsoil: 'They cut into subsoil at their bases but are not sealed by it.',
          unclear: 'The relationship between the posts and the floor is the structural argument.'
        }
      }
    },
    interpretations: [
      { id: 'wallPosts', label: 'Wall posts from a circular or oval structure', verdict: 'best',
        feedback: 'The best supported reading, and it is supported by three independent things: the regular spacing, the arc that matches the depression edge, and the posts cutting a prepared floor. Any one alone would be weak. Together they are strong.' },
      { id: 'drying', label: 'A drying rack, screen or windbreak rather than a roofed building', verdict: 'defensible',
        feedback: 'A genuinely important alternative, and one that a single unit cannot fully exclude. Post depth of 30 to 40 cm suggests more load than a light rack, and the associated floor and interior hearth push toward a roofed structure, but the sample is one section across the edge.' },
      { id: 'fence', label: 'A fence or palisade line', verdict: 'defensible',
        feedback: 'Reasonable on the posts alone. What argues against it is the curve matching the depression and the interior floor with a hearth on it. A fence does not enclose a prepared floor with a fire on it.' },
      { id: 'natural', label: 'Root casts or animal burrows', verdict: 'poor',
        feedback: 'Roots branch and taper irregularly and are not evenly spaced. Burrows run laterally. Neither produces five vertical shafts of equal diameter at equal intervals.' }
    ]
  },

  ft_interiorhearth: {
    id: 'ft_interiorhearth',
    name: 'Interior hearth basin',
    unit: 'unitC',
    level: 3,
    tags: ['hearth', 'architecture', 'household', 'seasonality'],
    description: 'A shallow basin of reddened soil and ash about 35 cm across, without a rock ring, sitting on the compacted floor inside the line of post stains.',
    observations: {
      shape: {
        prompt: 'Profile shape',
        options: [
          { id: 'shallowBasin', label: 'Shallow saucer-shaped basin with reddened base' },
          { id: 'deepPit', label: 'Deep steep-sided pit' },
          { id: 'flat', label: 'Flat, no depression at all' },
          { id: 'irregular', label: 'Irregular' }
        ],
        correct: 'shallowBasin',
        feedback: {
          shallowBasin: 'Correct. A shallow basin with a reddened base is a fire that burned in place, repeatedly, in a controlled spot.',
          deepPit: 'At 8 cm deep this is not a pit.',
          flat: 'There is a clear shallow basin cut into the floor.',
          irregular: 'The outline is regular and clearly defined against the floor.'
        }
      },
      dimensions: {
        prompt: 'Dimensions',
        options: [
          { id: 'd35', label: 'About 35 cm across, 8 cm deep' },
          { id: 'd60', label: 'About 60 cm across, 12 cm deep' },
          { id: 'd150', label: 'About 150 cm across' },
          { id: 'unmeasured', label: 'Not measured' }
        ],
        correct: 'd35',
        feedback: {
          d35: 'Correct, and the comparison matters. This is roughly half the diameter of the outdoor hearth in Unit A, which is what you would expect of a fire inside a building.',
          d60: 'That is the Unit A hearth. This one is smaller.',
          d150: 'Far larger than the excavated outline.',
          unmeasured: 'Size is what allows this to be compared with the outdoor hearth, and that comparison is the interpretation.'
        }
      },
      soilColour: {
        prompt: 'Fill colour',
        requiresCapability: 'soilColour',
        options: [
          { id: 'munsell', label: '5YR 4/4 reddish brown base with 10YR 2/1 ash fill', requires: ['soilColour'] },
          { id: 'informal', label: 'Reddened base with grey ash (described by eye)' },
          { id: 'none', label: 'Not recorded' }
        ],
        correct: 'munsell',
        feedback: {
          munsell: 'Correct. The reddened base is the evidence of in-place burning, so recording it precisely matters.',
          informal: 'The key observation, in-place reddening, is captured. Standard notation would strengthen it.',
          none: 'Without a record of the reddened base there is no evidence the fire burned here rather than being dumped here.'
        }
      },
      contents: {
        prompt: 'Contents (select all that are present)',
        multi: true,
        options: [
          { id: 'ash', label: 'Ash and charcoal', correct: true },
          { id: 'burntBone', label: 'Small burnt bone fragments', correct: true },
          { id: 'charredSeeds', label: 'Charred nutshell fragments', correct: true },
          { id: 'fcrRing', label: 'A ring of fire-cracked rock', correct: false },
          { id: 'pottery', label: 'A complete vessel', correct: false }
        ],
        feedback: {
          fcrRing: 'There is no rock ring here, and its absence is a real difference from the Unit A hearth rather than an oversight.',
          pottery: 'No complete vessel is present.'
        }
      },
      relationship: {
        prompt: 'Relationship to the surrounding layers',
        options: [
          { id: 'onFloor', label: 'Cut into the floor surface, inside the arc of post stains' },
          { id: 'outsidePosts', label: 'Outside the post arc, on the exterior surface' },
          { id: 'belowFloor', label: 'Sealed beneath the floor, therefore earlier than it' },
          { id: 'unclear', label: 'Not determinable' }
        ],
        correct: 'onFloor',
        feedback: {
          onFloor: 'Correct, and this single relationship is what makes it an interior hearth rather than just a small fire. The spatial association with the posts is the evidence.',
          outsidePosts: 'It sits within the arc, not outside it.',
          belowFloor: 'It is cut from the floor surface, so it belongs with the structure rather than predating it.',
          unclear: 'The relationship to the post arc is the interpretation. Without it this is only a small burnt patch.'
        }
      }
    },
    interpretations: [
      { id: 'interiorHearth', label: 'An interior hearth within a domestic structure', verdict: 'best',
        feedback: 'The best supported reading. In-place reddening, a controlled size, no rock ring needed indoors, and a position inside the post arc on a prepared floor. Together these indicate a household fire inside a building.' },
      { id: 'cookingPit', label: 'A small cooking or roasting pit', verdict: 'defensible',
        feedback: 'Not unreasonable, and the two overlap. What separates them is depth and rock: roasting features are deeper and usually rock-filled. This is shallow and rock-free.' },
      { id: 'burnedFloor', label: 'A burned patch from the structure burning down', verdict: 'defensible',
        feedback: 'Worth testing, and the test is extent. A structure fire reddens a broad area and leaves burnt structural debris. This is bounded at 35 cm with a cut basin and no burnt daub or timber.' },
      { id: 'natural', label: 'A natural burnt patch', verdict: 'poor',
        feedback: 'A deliberately cut basin on a prepared floor inside a post arc is not natural.' }
    ]
  },

  ft_alignment: {
    id: 'ft_alignment',
    name: 'Stone alignment',
    unit: 'unitC',
    level: 1,
    tags: ['alignment', 'architecture', 'structure'],
    description: 'Nine flat sandstone slabs set end to end in a gently curving line about four metres long, flat faces upward, sitting on a deliberately levelled surface along the edge of the depression.',
    observations: {
      shape: {
        prompt: 'Plan arrangement',
        options: [
          { id: 'curvedLine', label: 'A single curving line of slabs, following the depression edge' },
          { id: 'straight', label: 'A straight line across the slope' },
          { id: 'scatter', label: 'An unstructured scatter' },
          { id: 'pile', label: 'A heap' }
        ],
        correct: 'curvedLine',
        feedback: {
          curvedLine: 'Correct, and the curve matching the depression edge is what links the two features into one structure.',
          straight: 'The line curves consistently rather than running straight.',
          scatter: 'The slabs are placed end to end with consistent orientation.',
          pile: 'They form a single course, not a heap.'
        }
      },
      dimensions: {
        prompt: 'Dimensions',
        options: [
          { id: 'd400', label: 'About 4 m long, single course, slabs 30 to 50 cm across' },
          { id: 'd100', label: 'About 1 m long' },
          { id: 'd1000', label: 'About 10 m long, three courses high' },
          { id: 'unmeasured', label: 'Not measured' }
        ],
        correct: 'd400',
        feedback: {
          d400: 'Correct, and noting that it is a single course matters. This is a footing or kerb, not a standing wall.',
          d100: 'The exposed line is considerably longer.',
          d1000: 'Only about four metres are present, in one course.',
          unmeasured: 'Length and course count are what separate a footing from a wall.'
        }
      },
      soilColour: {
        prompt: 'Soil beneath and around the slabs',
        requiresCapability: 'soilColour',
        options: [
          { id: 'munsell', label: 'Levelled 10YR 4/3 surface beneath the slabs, 10YR 3/3 fill around them', requires: ['soilColour'] },
          { id: 'informal', label: 'A flat surface under the stones, darker soil around them (described by eye)' },
          { id: 'none', label: 'Not recorded' }
        ],
        correct: 'munsell',
        feedback: {
          munsell: 'Correct, and the levelled surface beneath the slabs is decisive. Someone prepared the ground before setting them.',
          informal: 'The prepared surface is noticed, which is the crucial observation.',
          none: 'The ground preparation beneath the stones is the strongest evidence that they were placed rather than fallen.'
        }
      },
      contents: {
        prompt: 'Associated material (select all that are present)',
        multi: true,
        options: [
          { id: 'levelledSurface', label: 'A deliberately levelled bedding surface', correct: true },
          { id: 'consistentOrientation', label: 'Consistent flat-face-upward orientation', correct: true },
          { id: 'chinking', label: 'Small stones packed between the slabs', correct: true },
          { id: 'mortar', label: 'Mortar', correct: false },
          { id: 'cutStone', label: 'Dressed or cut stone', correct: false }
        ],
        feedback: {
          mortar: 'No mortar is present, which is consistent with a pre-contact dry-laid footing rather than historic construction.',
          cutStone: 'The slabs are naturally bedded sandstone, selected but not dressed.'
        }
      },
      relationship: {
        prompt: 'Relationship to the surrounding layers and features',
        options: [
          { id: 'bordersDepression', label: 'Sitting on a prepared surface, bordering the depression, sealed by the root zone' },
          { id: 'cutsFloor', label: 'Cutting through the structure floor, therefore later than it' },
          { id: 'belowSubsoil', label: 'Beneath sterile subsoil' },
          { id: 'unclear', label: 'Not determinable' }
        ],
        correct: 'bordersDepression',
        feedback: {
          bordersDepression: 'Correct. Contemporary with the structure and bordering it, which makes it part of the building rather than a later addition.',
          cutsFloor: 'The slabs sit above the floor level and do not cut it.',
          belowSubsoil: 'They lie well above subsoil.',
          unclear: 'This relationship determines whether the alignment belongs to the structure at all.'
        }
      }
    },
    interpretations: [
      { id: 'footing', label: 'A stone footing or kerb bordering the structure', verdict: 'best',
        feedback: 'The best supported reading. A prepared bedding surface, consistent orientation, chinking stones, and a curve that matches the structure edge. All four indicate deliberate construction.' },
      { id: 'retaining', label: 'A retaining or revetment line holding back the slope', verdict: 'defensible',
        feedback: 'Genuinely plausible on a terrace edge, and a single course would be low for it but not impossible. What favours the footing reading is the association with the post arc and the floor inside.' },
      { id: 'clearance', label: 'A field clearance line from historic cultivation', verdict: 'defensible',
        feedback: 'A sensible thing to rule out, and clearance lines are common. Against it: clearance stone is heaped and randomly oriented, not laid in a single course on a prepared surface, and there is no historic material associated.' },
      { id: 'natural', label: 'A natural stone line from slope movement or bedrock outcrop', verdict: 'poor',
        feedback: 'Slope movement aligns stones down the fall line and does not level the ground beneath them or pack chinking between them.' }
    ]
  },

  ft_naturalstain: {
    id: 'ft_naturalstain',
    name: 'Irregular dark stain',
    unit: 'unitB',
    level: 4,
    tags: ['natural', 'siteFormation'],
    description: 'An irregular dark stain in the unit floor, roughly 50 by 30 cm, with diffuse edges, tapering branches running out from it, and a paired lighter mound of mixed soil on one side.',
    observations: {
      shape: {
        prompt: 'Plan and profile shape',
        options: [
          { id: 'irregularBranching', label: 'Irregular with diffuse edges and tapering branches, paired with a mound of mixed soil' },
          { id: 'circularSharp', label: 'Circular with a sharp edge' },
          { id: 'rectangular', label: 'Rectangular' },
          { id: 'bell', label: 'Bell-shaped in profile' }
        ],
        correct: 'irregularBranching',
        feedback: {
          irregularBranching: 'Correct, and every element of that description points away from a cultural feature. Recording it accurately is what allows the interpretation to be defended.',
          circularSharp: 'The edges cannot be traced continuously anywhere around it.',
          rectangular: 'No straight edges are present.',
          bell: 'The profile is shallow and irregular, with no undercut.'
        }
      },
      dimensions: {
        prompt: 'Dimensions',
        options: [
          { id: 'd50', label: 'About 50 by 30 cm, 10 cm deep, with an adjacent mound' },
          { id: 'd100', label: 'About 100 cm across, 65 cm deep' },
          { id: 'd15', label: 'About 15 cm across' },
          { id: 'unmeasured', label: 'Not measured' }
        ],
        correct: 'd50',
        feedback: {
          d50: 'Correct, and the adjacent mound is the observation that clinches it. A tree throw leaves a hollow and a mound together.',
          d100: 'That is the Unit A storage pit.',
          d15: 'Larger than a post stain.',
          unmeasured: 'A feature interpreted as natural still needs a full record, so that the conclusion can be checked.'
        }
      },
      soilColour: {
        prompt: 'Fill colour',
        requiresCapability: 'soilColour',
        options: [
          { id: 'munsell', label: '10YR 3/3 fill grading diffusely into a 10YR 5/4 matrix, no sharp boundary', requires: ['soilColour'] },
          { id: 'informal', label: 'Darker soil fading gradually into the surrounding soil (described by eye)' },
          { id: 'none', label: 'Not recorded' }
        ],
        correct: 'munsell',
        feedback: {
          munsell: 'Correct, and the word that matters is diffuse. Cultural fills usually have a boundary you can put a trowel tip on.',
          informal: 'The gradual boundary is the key observation and it has been captured.',
          none: 'A negative determination needs evidence just as much as a positive one.'
        }
      },
      contents: {
        prompt: 'Contents (select all that are present)',
        multi: true,
        options: [
          { id: 'mixedSoil', label: 'Mixed subsoil and topsoil, unsorted', correct: true },
          { id: 'rootTraces', label: 'Fine root traces running through it', correct: true },
          { id: 'noCharcoal', label: 'No charcoal', correct: true },
          { id: 'artifacts', label: 'Artifacts within the fill', correct: false },
          { id: 'ash', label: 'Ash', correct: false }
        ],
        feedback: {
          artifacts: 'No artifacts occur within this fill, which is a meaningful absence given that the surrounding horizon contains them.',
          ash: 'There is no ash and no burning.'
        }
      },
      relationship: {
        prompt: 'Relationship to the surrounding layers',
        options: [
          { id: 'cutsThrough', label: 'Cuts through several layers at once with no consistent origin surface, mixing them' },
          { id: 'cutFromOne', label: 'Cut cleanly from a single identifiable surface' },
          { id: 'sealed', label: 'Sealed by an intact layer above' },
          { id: 'unclear', label: 'Not determinable' }
        ],
        correct: 'cutsThrough',
        feedback: {
          cutsThrough: 'Correct, and this is the decisive observation. Cultural features are dug from a surface. This disturbance has no origin surface and mixes layers indiscriminately.',
          cutFromOne: 'No single origin surface can be identified.',
          sealed: 'The layers above it are disturbed rather than intact.',
          unclear: 'This is determinable in section and is what distinguishes disturbance from a feature.'
        }
      }
    },
    interpretations: [
      { id: 'treeThrow', label: 'A natural tree throw: root disturbance rather than a cultural feature', verdict: 'best',
        feedback: 'The best supported reading, and recognising it is as much a skill as identifying a hearth. Diffuse edges, tapering branches, a paired mound, mixed unsorted fill, no charcoal and no artifacts, and no origin surface. Recording it properly prevents a later reader from mistaking it for a pit.' },
      { id: 'animalBurrow', label: 'An animal burrow', verdict: 'defensible',
        feedback: 'Another natural process worth considering, and the record supports natural disturbance either way. Burrows tend to run laterally with a more consistent diameter; the paired mound points to a tree throw specifically.' },
      { id: 'pit', label: 'A shallow cultural pit', verdict: 'poor',
        feedback: 'A pit is cut from a surface, has a traceable edge, and usually contains something. None of those are true here, and calling this cultural would put a false feature into the site record.' },
      { id: 'hearth', label: 'A hearth', verdict: 'poor',
        feedback: 'There is no ash, no charcoal and no reddening. Nothing burned here.' }
    ]
  }
};

export function featureById(id) {
  return FEATURES[id] || null;
}

export function featuresForUnit(unitId) {
  return Object.values(FEATURES).filter((f) => f.unit === unitId);
}

export function interpretationVerdict(featureId, interpretationId) {
  const f = FEATURES[featureId];
  if (!f) return null;
  return f.interpretations.find((i) => i.id === interpretationId) || null;
}
