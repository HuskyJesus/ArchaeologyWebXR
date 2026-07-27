/* The excavation rules, separated from the panel that draws them.

   Everything here is a pure function of the state plus the level scripts,
   which is what makes the unit paths, the recovery rules and the duplicate
   protection directly testable. */

import {
  state, levelRecord, recordExcavationDecision, computeLevelProvenience,
  addArtifact, addMissed, addSample, addFeature
} from './state.js';
import { levelAt } from '../data/excavation.js';

/* Applies one decision to a level record. Returns the recorded entry, or the
   existing entry if this step was already answered, which is what stops a
   repeated click or a reload from applying an effect twice. */
export function applyStepChoice(unitId, levelIndex, step, option) {
  const record = levelRecord(unitId, levelIndex);
  if (!record) return null;
  const already = record.decisions.find((d) => d.stepId === step.id);
  if (already) return already;

  const entry = recordExcavationDecision(unitId, levelIndex, step, option);
  const effects = option.effects || {};

  if (Array.isArray(effects.missFinds) && effects.missFinds.length) {
    record.lost = [...new Set([...(record.lost || []), ...effects.missFinds])];
  }
  if (effects.sample) record.sampleQuality = effects.sample.quality;
  if (step.kind === 'feature' && step.featureId) {
    record.featureId = step.featureId;
    record.featureIntegrity = effects.featureIntegrity || 'good';
  }
  return entry;
}

/* Grants finds, losses, samples and features for a level. Every grant is
   keyed, so calling this twice for the same level cannot produce duplicates. */
export function resolveLevel(unitId, levelIndex) {
  const level = levelAt(unitId, levelIndex);
  const record = levelRecord(unitId, levelIndex);
  const outcome = { provenience: 'poor', recovered: [], lost: [], sample: null, feature: null };
  if (!level || !record) return outcome;

  const provenience = computeLevelProvenience(unitId, levelIndex);
  outcome.provenience = provenience;
  const doc = record.doc || {};
  const lost = new Set(record.lost || []);

  (level.finds || []).forEach((find) => {
    if (find.requires === 'sample') {
      resolveSampleFind(unitId, level, record, provenience, doc, find, outcome);
      return;
    }
    const availability = findAvailability(find, doc, lost);
    if (availability.available) {
      const added = addArtifact({
        artifactId: find.artifact,
        unit: unitId,
        level: level.level,
        provenience,
        recoveredBy: recoveryMethod(find),
        photographed: !!doc.photographed
      });
      if (added) outcome.recovered.push(added);
    } else {
      const missed = addMissed({
        artifactId: find.artifact,
        unit: unitId,
        level: level.level,
        reason: availability.reason
      });
      if (missed) outcome.lost.push(missed);
    }
  });

  if (level.feature) {
    const added = addFeature(level.feature, unitId, levelIndex, record.featureIntegrity || 'good');
    outcome.feature = added || state.features.find((f) => f.featureId === level.feature) || null;
  }

  return outcome;
}

function resolveSampleFind(unitId, level, record, provenience, doc, find, outcome) {
  if (record.sampleQuality) {
    const added = addSample({
      unit: unitId,
      level: level.level,
      quality: record.sampleQuality,
      material: 'charcoal',
      provenience
    });
    outcome.sample = added || state.samples.find((s) => s.key === `${unitId}-L${level.level}`) || null;
    const artifact = addArtifact({
      artifactId: 'ar_charcoal_sample',
      unit: unitId,
      level: level.level,
      provenience,
      recoveredBy: 'sample',
      photographed: !!doc.photographed
    });
    if (artifact) outcome.recovered.push(artifact);
    return;
  }
  const missed = addMissed({
    artifactId: find.artifact,
    unit: unitId,
    level: level.level,
    reason: 'No sample was collected from this context, so it can never be dated.'
  });
  if (missed) outcome.lost.push(missed);
}

export function findAvailability(find, doc, lostSet) {
  if (lostSet && lostSet.has(find.artifact)) {
    return { available: false, reason: 'Destroyed or discarded by the removal method chosen for this level.' };
  }
  if (find.requires === 'screen' && !doc.screened) {
    return { available: false, reason: 'Too small to see in the unit floor. It was only recoverable on the screen.' };
  }
  if (find.requires === 'flotation' && !doc.floated) {
    return { available: false, reason: 'Only recoverable by flotation. No soil sample was taken from this level.' };
  }
  return { available: true, reason: '' };
}

function recoveryMethod(find) {
  if (find.requires === 'screen') return 'screen';
  if (find.requires === 'flotation') return 'flotation';
  return 'excavation';
}
