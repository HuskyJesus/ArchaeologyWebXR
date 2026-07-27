/* The single dispatcher between "the learner acted on something" and "a
   station opens". Both the 3D interaction system, the XR controllers, the
   objective button and the text-only fallback route through here, so the
   three modes cannot drift apart. */

import { state, hasCapability } from '../core/state.js';
import { currentObjective, surveyReadyForPlacement } from '../core/evidence.js';
import { toast } from './toast.js';
import { openEquipment } from './stations/equipment.js';
import { openSurveyItem, openSurveySummary, nextUnexaminedSurveyId } from './stations/survey.js';
import { openUnitChoice, openExcavation, activeUnitId } from './stations/excavation.js';
import { openLab } from './stations/laboratory.js';
import { openDating } from './stations/chronology.js';
import { openFeatureList, openFeatureRecord, incompleteFeatureId } from './stations/features.js';
import { openSynthesis } from './stations/synthesis.js';
import { openEthics, pendingScenario, openEthicsLog } from './stations/ethics.js';
import { openEvidenceRoom } from './stations/evidenceRoom.js';
import { openReport, showResults } from './stations/report.js';
import { faceTowards } from '../player/controller.js';
import { surveyMarkerPosition } from '../scene/surveyMarkers.js';
import { LOCATIONS, locationById } from '../data/site.js';

export function activateTarget(target) {
  if (!target) return false;
  switch (target.kind) {
    case 'survey':
      openSurveyItem(target.id);
      return true;
    case 'unitPlug':
      openUnitChoice();
      return true;
    case 'pit':
      openExcavation();
      return true;
    case 'supervisor':
      openSupervisor();
      return true;
    case 'screen':
      openScreening();
      return true;
    case 'lab':
      openLab();
      return true;
    case 'dating':
      openDating();
      return true;
    case 'synthesis':
      openSynthesis();
      return true;
    case 'evidence':
      openEvidenceRoom();
      return true;
    default:
      return false;
  }
}

function openSupervisor() {
  if (!state.equipment.prepared) {
    openEquipment();
    return;
  }
  const pending = pendingScenario();
  if (pending) {
    openEthics();
    return;
  }
  openEthicsLog();
}

function openScreening() {
  if (!hasCapability('screening')) {
    toast('There is no screen set up here. Screening is part of your kit, and the decision to screen is made while excavating a level.', 'warn');
    return;
  }
  toast('Backdirt from the open unit is screened here. The decision to screen a level is made in the unit itself.', 'info');
}

/* Runs whatever the objective button says, from anywhere on the site. */
export function runObjectiveAction() {
  const objective = currentObjective();
  switch (objective.action) {
    case 'openEquipment':
      openEquipment();
      return;
    case 'guideSurvey': {
      const nextId = nextUnexaminedSurveyId();
      if (!nextId) {
        openSurveySummary();
        return;
      }
      const position = surveyMarkerPosition(nextId);
      if (position) {
        faceTowards(position.x, position.z);
        toast('The next unexamined surface object is now ahead of you.', 'info');
      }
      if (surveyReadyForPlacement()) openSurveySummary();
      return;
    }
    case 'openUnitChoice':
      if (!state.survey.recommendation) openSurveySummary();
      else openUnitChoice();
      return;
    case 'openExcavation':
      openExcavation();
      return;
    case 'openFeatures': {
      const featureId = incompleteFeatureId();
      if (featureId) openFeatureRecord(featureId, () => openFeatureList());
      else openFeatureList();
      return;
    }
    case 'openLab':
      openLab();
      return;
    case 'openDating':
      openDating();
      return;
    case 'openEthics':
      openEthics();
      return;
    case 'openSynthesis':
      openSynthesis();
      return;
    case 'openReport':
      openReport();
      return;
    case 'openResults':
      showResults();
      return;
    default:
      openEvidenceRoom();
  }
}

/* Turns the player toward the station the current objective needs. */
export function faceObjective() {
  const objective = currentObjective();
  if (objective.action === 'guideSurvey') {
    const nextId = nextUnexaminedSurveyId();
    const position = nextId ? surveyMarkerPosition(nextId) : null;
    if (position) {
      faceTowards(position.x, position.z);
      return locationById('survey');
    }
  }
  if (objective.action === 'openExcavation' || objective.action === 'openUnitChoice') {
    const unitId = activeUnitId();
    if (unitId) {
      const unit = LOCATIONS.find((l) => l.id === 'grid');
      faceTowards(unit.x, unit.z);
      return unit;
    }
  }
  const location = locationById(objective.locationId) || locationById('camp');
  faceTowards(location.x, location.z);
  return location;
}
