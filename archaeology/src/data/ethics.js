/* Station 8 content: professional and ethical decisions.

   Every scenario carries the same caveat: the specific legal and procedural
   requirements depend on jurisdiction, land ownership, applicable law and
   the agency or institutional protocol in force. What is modelled here is
   general professional practice and the reasoning behind it, not one
   jurisdiction's statute presented as universal.

   The possible-human-remains scenario is deliberately written without
   discovery detail, without any reward, and without any way to "solve" it by
   examining anything. The correct response is to stop, secure, notify and
   follow the consultation and legal process, and the scenario ends there. */

export const JURISDICTION_NOTE =
  'Specific legal duties and notification procedures vary by jurisdiction, land ownership and permit conditions. The reasoning below reflects general professional practice; the exact procedure on a real project comes from the project protocol, the permit, and applicable law.';

export const ETHICS_SCENARIOS = [
  {
    id: 'eth_visitor',
    title: 'A visitor with a find',
    trigger: { minLevelsCompleted: 1 },
    situation:
      'A hiker stops at the fence line holding a complete stone projectile point. She says she picked it up from the eroding bluff face twenty minutes ago, she is pleased to have found it, and she asks whether she can keep it.',
    choices: [
      { id: 'documentAndRefer', sound: 'sound',
        text: 'Thank her, ask her to hand it over for recording, take her back to where she found it and record that location, explain why context matters, and refer the question of what happens to the find to the field director and the responsible land authority',
        feedback: 'The professional response. It recovers as much information as an unplanned surface find can still yield, treats the visitor as a collaborator rather than a suspect, and leaves the decision about the disposition of the find where it belongs, with the director and the landowner or agency, rather than settling it in a fence-line conversation.' },
      { id: 'recordThenGive', sound: 'partial',
        text: 'Thank her, record the find spot carefully, and then let her keep it since the location is now documented',
        feedback: 'The recording instinct is right and worth crediting. But documentation does not transfer ownership. Who may keep a find from a site under investigation is a legal and land-management question, and answering it on the spot exceeds a field archaeologist\'s authority.' },
      { id: 'confront', sound: 'unsound',
        text: 'Tell her she has broken the law and demand she hand it over immediately',
        feedback: 'This is likely to be both inaccurate and counterproductive. Surface collection by a member of the public may or may not be unlawful depending on land status, and treating a person who voluntarily reported a find as an offender discourages the next person from reporting anything at all.' },
      { id: 'ignore', sound: 'unsound',
        text: 'Tell her you are busy with the excavation and cannot deal with it',
        feedback: 'An unplanned discovery is still data. Walking away loses the find spot, the object, and the relationship with a member of the public who was trying to do the right thing.' }
    ],
    dimensions: { publicEngagement: true, stewardship: true }
  },

  {
    id: 'eth_construction',
    title: 'Pressure from the construction schedule',
    trigger: { minLevelsCompleted: 2 },
    situation:
      'The highway contractor\'s site manager arrives. Grading is scheduled to reach this section in four days rather than at the end of the three weeks. He asks the crew to finish up, says the paperwork can be completed later from memory and photographs, and points out that the project is already over budget.',
    choices: [
      { id: 'escalateAndPrioritise', sound: 'sound',
        text: 'Do not agree to anything on the spot. Notify the field director immediately so the schedule change is handled through the permit and the agreement with the developer, and in the meantime re-prioritise fieldwork so the most threatened and least recoverable records are completed first',
        feedback: 'The right response on both counts. A schedule change to a permitted mitigation project is a contractual and regulatory matter, not something a field archaeologist renegotiates at the trench edge. Meanwhile, triage is a legitimate professional skill: if time really is shorter, the profile record and the feature documentation are the things that cannot be reconstructed later.' },
      { id: 'triageOnly', sound: 'partial',
        text: 'Quietly speed up and prioritise the most important records, without raising it with the director',
        feedback: 'The triage judgement is sound, but handling it silently is not. If the schedule has genuinely changed, that affects the permit, the budget and the scope of what can be claimed in the report, and the director cannot manage what nobody has told them.' },
      { id: 'comply', sound: 'unsound',
        text: 'Agree, stop recording, and write up the remaining forms afterwards from memory and photographs',
        feedback: 'Records written from memory days later are not a substitute for field records, and everyone reading the report afterwards will be relying on them without knowing. This also concedes a change to the agreed scope without any authority to do so.' },
      { id: 'refuseFlatly', sound: 'partial',
        text: 'Refuse outright, tell him the machines are not coming anywhere near the site, and continue as planned',
        feedback: 'Protecting the deposit is right, and refusing to compromise the record is right. But a flat refusal delivered by field staff has no standing, may not be accurate, and turns a solvable scheduling conflict into a dispute. Escalate it to the people who hold the agreement.' }
    ],
    dimensions: { professionalConduct: true, stewardship: true }
  },

  {
    id: 'eth_consultation',
    title: 'A request for consultation',
    trigger: { minLevelsCompleted: 2 },
    situation:
      'A representative of a descendant community with ancestral ties to this area contacts the project. The community was not informed before fieldwork began. They ask to visit the site, to be told what has been found, and to be involved in decisions about how the material recovered is treated.',
    choices: [
      { id: 'engageFully', sound: 'sound',
        text: 'Pass the request to the director the same day, support arranging a site visit and a briefing on what has been found, and treat the community as a party to decisions about the treatment of the material rather than as an audience for them',
        feedback: 'The right response. Consultation is a professional obligation and, in many jurisdictions, a legal one. It works best when it is early, substantive and genuinely capable of changing decisions. Note also that the community was not informed beforehand, which is itself a failure in the project design worth recording rather than quietly passing over.' },
      { id: 'informOnly', sound: 'partial',
        text: 'Arrange a site visit and give them a summary of the findings, but keep decisions about the material within the project team',
        feedback: 'Better than silence, and a visit matters. But this is information sharing rather than consultation. Consultation means the community can affect what happens to the material, which is precisely the part this option withholds.' },
      { id: 'deferToEnd', sound: 'unsound',
        text: 'Explain that the excavation must be completed first and offer to consult once the analysis is finished',
        feedback: 'By the end of the project the decisions that consultation could have shaped have all been made. Deferring consultation until the results are final converts it into a formality.' },
      { id: 'decline', sound: 'unsound',
        text: 'Explain that the project holds the permit and the site is not open to visitors during fieldwork',
        feedback: 'A permit authorises the work; it does not settle who has a legitimate interest in the ancestors and material culture of their own community. Refusing on procedural grounds damages the relationship and, in many places, breaches the consultation requirements attached to the permit itself.' }
    ],
    dimensions: { consultation: true, professionalConduct: true }
  },

  {
    id: 'eth_location',
    title: 'The site location is posted publicly',
    trigger: { minLevelsCompleted: 3 },
    situation:
      'A crew member has posted photographs of the open units to a public account. The post includes precise coordinates and a caption describing the artifacts recovered. It has been shared widely overnight, and two people have already asked in the replies whether the site is open to visitors.',
    choices: [
      { id: 'removeAndPolicy', sound: 'sound',
        text: 'Ask for the post to be taken down immediately, notify the director and the landowner or agency so the site can be monitored, and establish a clear site policy on what may be shared publicly and at what level of precision',
        feedback: 'The right response, and the third part matters most. Precise locations invite looting, which is the single largest cause of destruction at unprotected sites. Outreach is valuable and should continue, but at a level of spatial precision that does not function as a map for collectors.' },
      { id: 'removeOnly', sound: 'partial',
        text: 'Ask for the post to be removed and leave it there',
        feedback: 'Necessary but not sufficient. The post has already been shared, so the location may already be circulating, and without a stated policy the same thing happens again next week with a different crew member.' },
      { id: 'leaveUp', sound: 'unsound',
        text: 'Leave it up; public interest in archaeology is good for the project',
        feedback: 'Public engagement genuinely is valuable, which is why the answer is to do it deliberately rather than to defend an accidental disclosure. Coordinates plus an artifact list is an invitation, and the site has no physical protection.' },
      { id: 'blame', sound: 'unsound',
        text: 'Dismiss the crew member from the project and say nothing further about it',
        feedback: 'This addresses one person and leaves the exposure, the landowner, and the absence of any policy exactly as they were. It also guarantees the next mistake goes unreported.' }
    ],
    dimensions: { stewardship: true, publicEngagement: true }
  },

  {
    id: 'eth_sensitive',
    title: 'Possible culturally sensitive material',
    trigger: { minLevelsCompleted: 3 },
    situation:
      'While cleaning the base of a level, a crew member uncovers material they believe may be human remains. Nothing has been lifted, and nobody is certain what it is.\n\nThis is the situation every field protocol exists for. It is not a discovery to be investigated further by the crew, and nothing about it is a research opportunity in this moment.',
    choices: [
      { id: 'stopSecureNotify', sound: 'sound',
        text: 'Stop work in that area immediately, leave everything exactly in place and cover it, secure and restrict access, and notify the field director at once so the required notifications to the appropriate authorities and to the descendant community can be made and the agreed protocol followed',
        feedback: 'This is the correct response. Work stops, nothing is disturbed or removed, the area is secured against both accidental damage and observation, and notification goes immediately to the project leadership so that the legal and consultation requirements that apply on this land can be initiated. What happens next is determined by that process, in consultation with the descendant community, and not by the excavation team\'s research interests.' },
      { id: 'excavateToConfirm', sound: 'unsound',
        text: 'Carefully excavate a little further to confirm whether the material is human before reporting anything',
        feedback: 'Do not do this. Continuing to excavate is the disturbance the protocol exists to prevent, and confirmation is not the field crew\'s decision to make. If there is any possibility that material is human, that possibility is itself the trigger to stop and notify. Reporting an uncertainty costs nothing; disturbing remains cannot be undone.' },
      { id: 'photographAndPost', sound: 'unsound',
        text: 'Photograph the material for the record and circulate the images to the wider team for an opinion',
        feedback: 'No. Images of possible human remains should not be created or circulated for identification, and doing so disregards the descendant community whose ancestors may be involved. The record of this moment is a written note of what was seen, when work stopped, and who was notified.' },
      { id: 'coverAndContinue', sound: 'unsound',
        text: 'Quietly cover it over, say nothing, and move the excavation to another part of the unit',
        feedback: 'Concealment is a serious professional and, in most jurisdictions, legal failure. It removes any possibility of consultation, leaves the material unprotected against later disturbance, and makes everyone else on the project complicit in a decision they were never told about.' }
    ],
    closingNote:
      'Work in this area remains stopped. The project continues elsewhere on site only if and as the responsible authorities and the descendant community agree, under the applicable protocol. Nothing further about this context appears in your records, and that is the correct outcome.',
    dimensions: { consultation: true, professionalConduct: true, stewardship: true },
    sensitive: true
  }
];

export function scenarioById(id) {
  return ETHICS_SCENARIOS.find((s) => s.id === id) || null;
}

export const ETHICS_SOUNDNESS_SCORE = { sound: 1, partial: 0.5, unsound: 0 };
