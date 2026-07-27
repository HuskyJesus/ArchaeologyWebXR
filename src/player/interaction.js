/* Interaction: what the learner is looking at, whether it is close enough
   and unobstructed, and what happens when they act on it.

   Targeting is a genuine ray cast against the whole scene, so an object
   behind a canopy leg, a spoil heap or the ground surface cannot be
   activated through it. Grass tufts are the single documented exception,
   because excluding them keeps low survey objects selectable from standing
   eye height. */

import * as THREE from 'three';
import { camera, scene, renderer } from '../scene/renderer.js';
import { interactionMetaFor } from '../scene/registry.js';
import { state, unitProgress } from '../core/state.js';
import { SITE, unitById } from '../data/site.js';
import { surveyItemById } from '../data/survey.js';

const raycaster = new THREE.Raycaster();
const centre = new THREE.Vector2(0, 0);

let highlighted = null;

/* Returns { kind, id, meta, object, distance } or null. */
export function targetFromRay(origin, direction, maxDistance = 8) {
  raycaster.set(origin, direction);
  raycaster.far = maxDistance;
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const hit of hits) {
    if (!hit.object.visible) continue;
    if (hit.object.userData && hit.object.userData.noOcclusion) continue;
    if (hit.object.type === 'Line' || hit.object.type === 'LineSegments') continue;
    const found = interactionMetaFor(hit.object);
    if (!found) return null; // something solid and non-interactive is in the way
    if (hit.distance > found.meta.range) return null; // in view but out of reach
    const resolved = resolveTarget(found.meta);
    if (!resolved) return null;
    return { ...resolved, object: found.root, hitObject: hit.object, distance: hit.distance };
  }
  return null;
}

export function targetFromCamera() {
  raycaster.setFromCamera(centre, camera);
  return targetFromRay(raycaster.ray.origin, raycaster.ray.direction, 8);
}

export function targetFromScreenPoint(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  const point = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(point, camera);
  return targetFromRay(raycaster.ray.origin, raycaster.ray.direction, 8);
}

/* Turns a registry entry into something a station handler can act on, or
   null if the entry is no longer valid. This is what stops a stale mesh from
   re-triggering an activity that has moved on. */
export function resolveTarget(meta) {
  switch (meta.kind) {
    case 'survey': {
      const item = surveyItemById(meta.id);
      if (!item) return null;
      return { kind: 'survey', id: meta.id, meta, label: surveyLabel(meta.id) };
    }
    case 'unitPlug': {
      if (state.units.opened.includes(meta.id)) return null;
      const unit = unitById(meta.id);
      return { kind: 'unitPlug', id: meta.id, meta, label: `Consider ${unit ? unit.label : meta.id}` };
    }
    case 'pit': {
      if (!state.units.opened.includes(meta.id)) return null;
      const unit = unitById(meta.id);
      const progress = unitProgress(meta.id);
      const done = progress && progress.complete;
      return {
        kind: 'pit',
        id: meta.id,
        meta,
        label: done ? `${unit ? unit.shortLabel : meta.id}: review this unit` : `Excavate ${unit ? unit.shortLabel : meta.id}`
      };
    }
    case 'supervisor':
      return { kind: 'supervisor', id: null, meta, label: `Speak to ${SITE.supervisorName}` };
    case 'screen':
      return { kind: 'screen', id: null, meta, label: 'Screening station' };
    case 'lab':
      return { kind: 'lab', id: null, meta, label: 'Field laboratory' };
    case 'dating':
      return { kind: 'dating', id: null, meta, label: 'Chronology bench' };
    case 'synthesis':
      return { kind: 'synthesis', id: null, meta, label: 'Interpretation table' };
    case 'evidence':
      return { kind: 'evidence', id: null, meta, label: 'Evidence Room' };
    default:
      return null;
  }
}

function surveyLabel(id) {
  const rec = state.survey.records[id];
  const item = surveyItemById(id);
  if (rec && rec.classification) {
    return `${item.name}: ${rec.recordQuality && rec.recordQuality !== 'none' ? 'recorded' : 'not recorded'}`;
  }
  return 'Examine this surface object';
}

/* A restrained emissive tint on whatever is under the reticle. Deliberately
   subtle: enough to confirm the target, not enough to make the site look
   like a collection of pickups. */
export function setHighlight(object) {
  if (highlighted === object) return;
  if (highlighted) applyEmissive(highlighted, false);
  highlighted = object;
  if (highlighted) applyEmissive(highlighted, true);
}

function applyEmissive(root, on) {
  root.traverse((node) => {
    if (!node.isMesh || !node.material || !node.material.emissive) return;
    if (Array.isArray(node.material)) return;
    if (on) {
      if (node.userData.baseEmissive === undefined) {
        node.userData.baseEmissive = node.material.emissive.getHex();
        node.userData.baseEmissiveIntensity = node.material.emissiveIntensity;
      }
      node.material.emissive.setHex(0xc98a4a);
      node.material.emissiveIntensity = 0.28;
    } else if (node.userData.baseEmissive !== undefined) {
      node.material.emissive.setHex(node.userData.baseEmissive);
      node.material.emissiveIntensity = node.userData.baseEmissiveIntensity;
    }
  });
}
