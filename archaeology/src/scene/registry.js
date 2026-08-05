/* Registries shared by the world builder, the player controller and the
   interaction system.

   Collision boxes are keyed by id so an individual box can be removed when
   the thing that owned it changes state. That is what stops an excavation
   unit from leaving a permanent invisible wall behind after it is opened. */

import * as THREE from 'three';

const collisionBoxes = new Map();
const interactives = [];
const teleportTargets = [];

export function addCollisionBox(id, x, z, width, depth) {
  collisionBoxes.set(id, {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });
}

export function removeCollisionBox(id) {
  collisionBoxes.delete(id);
}

export function isBlocked(x, z, radius = 0.35) {
  for (const box of collisionBoxes.values()) {
    if (x > box.minX - radius && x < box.maxX + radius && z > box.minZ - radius && z < box.maxZ + radius) return true;
  }
  return false;
}

export function isClearOf(x, z, margin = 0.8) {
  for (const box of collisionBoxes.values()) {
    if (x > box.minX - margin && x < box.maxX + margin && z > box.minZ - margin && z < box.maxZ + margin) return false;
  }
  return true;
}

/* ---------- interactive objects ---------- */

export function registerInteractive(object3d, kind, id, options = {}) {
  object3d.userData.interaction = {
    kind,
    id,
    range: options.range || 3.6,
    label: options.label || null
  };
  if (!interactives.includes(object3d)) interactives.push(object3d);
  return object3d;
}

export function unregisterInteractive(object3d) {
  const idx = interactives.indexOf(object3d);
  if (idx !== -1) interactives.splice(idx, 1);
  if (object3d.userData) delete object3d.userData.interaction;
}

export function interactiveList() {
  return interactives;
}

export function interactionMetaFor(object3d) {
  let node = object3d;
  while (node) {
    if (node.userData && node.userData.interaction) return { meta: node.userData.interaction, root: node };
    node = node.parent;
  }
  return null;
}

/* ---------- teleport targets (XR) ---------- */

export function addTeleportSurface(mesh) {
  if (!teleportTargets.includes(mesh)) teleportTargets.push(mesh);
}

export function teleportSurfaces() {
  return teleportTargets;
}

/* Blocked regions for teleportation: open pits, the river, props and
   anything outside the working area. Kept separate from the walking
   collision list because a teleport arc can legitimately cross a rope line
   but must never land in a trench. */
const teleportExclusions = new Map();

export function addTeleportExclusion(id, x, z, width, depth) {
  teleportExclusions.set(id, {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2
  });
}

export function removeTeleportExclusion(id) {
  teleportExclusions.delete(id);
}

export function isTeleportBlocked(x, z, halfExtent) {
  for (const box of teleportExclusions.values()) {
    if (x > box.minX - halfExtent && x < box.maxX + halfExtent
      && z > box.minZ - halfExtent && z < box.maxZ + halfExtent) return true;
  }
  return false;
}
