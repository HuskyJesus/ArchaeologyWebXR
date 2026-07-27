/* Excavation units in the scene: staked candidate squares before they are
   opened, and progressively deeper trenches with visible strata once they
   are. The visual depth is driven by the number of levels actually
   completed, so the trench is a readout of real progress. */

import * as THREE from 'three';
import { SITE, UNITS } from '../data/site.js';
import { levelsForUnit } from '../data/excavation.js';
import { state, levelsCompleted } from '../core/state.js';
import { scene } from './renderer.js';
import {
  addCollisionBox, removeCollisionBox, registerInteractive, unregisterInteractive,
  addTeleportExclusion, findInteractiveById
} from './registry.js';
import { strataTexture, signTexture, groundTexture } from './textures.js';
import { MATERIALS, buildBucket } from './props.js';

const PIT = SITE.pitSize;
const LEVEL_DEPTH = 0.19;

const plugs = new Map();
const pits = new Map();

export function buildUnitMarkers() {
  Object.values(UNITS).forEach((unit) => {
    if (state.units.opened.includes(unit.id)) {
      buildPit(unit);
    } else {
      buildPlug(unit);
    }
  });
}

function buildPlug(unit) {
  const group = new THREE.Group();
  const plug = new THREE.Mesh(
    new THREE.PlaneGeometry(PIT, PIT),
    new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 })
  );
  plug.rotation.x = -Math.PI / 2;
  plug.position.y = 0.004;
  plug.receiveShadow = true;
  group.add(plug);

  const stakeMat = MATERIALS.darkWood();
  const half = PIT / 2 + 0.12;
  const stringPoints = [];
  [[-half, -half], [half, -half], [half, half], [-half, half]].forEach(([x, z]) => {
    const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.44, 6), stakeMat);
    stake.position.set(x, 0.22, z);
    stake.castShadow = true;
    group.add(stake);
    stringPoints.push(new THREE.Vector3(x, 0.42, z));
  });
  stringPoints.push(stringPoints[0].clone());
  group.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(stringPoints),
    new THREE.LineBasicMaterial({ color: 0xf0ede2 })
  ));

  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.32),
    new THREE.MeshStandardMaterial({
      map: signTexture([unit.shortLabel, unit.grid], { width: 400, height: 160, background: '#4a3c2c' }),
      roughness: 0.8,
      side: THREE.DoubleSide
    })
  );
  board.position.set(0, 0.92, half + 0.35);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.95, 6), stakeMat);
  post.position.set(0, 0.47, half + 0.35);
  group.add(board, post);

  group.position.set(unit.x, 0, unit.z);
  scene.add(group);
  addCollisionBox(`plug-${unit.id}`, unit.x, unit.z, PIT + 0.4, PIT + 0.4);
  addTeleportExclusion(`plug-${unit.id}`, unit.x, unit.z, PIT + 0.4, PIT + 0.4);
  registerInteractive(group, 'unitPlug', unit.id, { label: `Consider ${unit.label}`, range: 3.6 });
  plugs.set(unit.id, group);
}

function removePlug(unitId) {
  const group = plugs.get(unitId);
  if (!group) return;
  unregisterInteractive(group);
  scene.remove(group);
  disposeGroup(group);
  plugs.delete(unitId);
  removeCollisionBox(`plug-${unitId}`);
}

function disposeGroup(group) {
  group.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      materials.forEach((m) => {
        if (m.map && m.map.dispose && m.map.userData && m.map.userData.shared !== true) m.map.dispose();
        m.dispose();
      });
    }
  });
}

function buildPit(unit) {
  removePlug(unit.id);
  const existing = pits.get(unit.id);
  if (existing) {
    scene.remove(existing.group);
    unregisterInteractive(existing.group);
    disposeGroup(existing.group);
    pits.delete(unit.id);
  }

  const group = new THREE.Group();
  const levels = levelsForUnit(unit.id);
  const done = Math.max(1, levelsCompleted(unit.id));
  const depth = Math.max(0.28, done * LEVEL_DEPTH + 0.12);
  const inner = PIT - 0.12;

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(inner, 0.05, inner),
    new THREE.MeshStandardMaterial({ color: 0x6f5836, roughness: 1 })
  );
  floor.position.y = -depth;
  floor.receiveShadow = true;
  group.add(floor);

  const wallOptions = {
    unitA: { seed: 1 },
    unitB: { charcoalLens: true, sterileBand: true, seed: 2 },
    unitC: { seed: 4 },
    unitD: { seed: 5 }
  }[unit.id] || {};

  const wallMat = new THREE.MeshStandardMaterial({ map: strataTexture(wallOptions), roughness: 0.95 });
  const sideMat = new THREE.MeshStandardMaterial({ map: strataTexture({ seed: wallOptions.seed + 10 }), roughness: 1 });

  const back = new THREE.Mesh(new THREE.PlaneGeometry(inner, depth), wallMat);
  back.position.set(0, -depth / 2, -inner / 2);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(inner, depth), sideMat.clone());
  front.rotation.y = Math.PI;
  front.position.set(0, -depth / 2, inner / 2);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(inner, depth), sideMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-inner / 2, -depth / 2, 0);
  const right = left.clone();
  right.rotation.y = -Math.PI / 2;
  right.position.x = inner / 2;
  [back, front, left, right].forEach((w) => { w.receiveShadow = true; });
  group.add(back, front, left, right);

  // rim boards and level tags
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xb98d55, roughness: 0.72 });
  const rimLong = new THREE.BoxGeometry(PIT + 0.18, 0.06, 0.1);
  const rimSide = new THREE.BoxGeometry(0.1, 0.06, PIT + 0.18);
  const rimBack = new THREE.Mesh(rimLong, rimMat);
  rimBack.position.set(0, 0.03, -PIT / 2 - 0.05);
  const rimFront = rimBack.clone();
  rimFront.position.z = PIT / 2 + 0.05;
  const rimLeft = new THREE.Mesh(rimSide, rimMat);
  rimLeft.position.set(-PIT / 2 - 0.05, 0.03, 0);
  const rimRight = rimLeft.clone();
  rimRight.position.x = PIT / 2 + 0.05;
  group.add(rimBack, rimFront, rimLeft, rimRight);

  // level tags pinned on the visible wall, one per completed level
  for (let i = 0; i < done && i < levels.length; i += 1) {
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.09),
      new THREE.MeshStandardMaterial({
        map: signTexture([`L${levels[i].level}  ${levels[i].soil.munsell}`], { width: 340, height: 90, background: '#2f2a22' }),
        roughness: 0.8,
        side: THREE.DoubleSide
      })
    );
    tag.position.set(-inner / 2 + 0.26, -(i + 0.5) * LEVEL_DEPTH - 0.06, -inner / 2 + 0.012);
    group.add(tag);
  }

  // spoil heap and buckets grow with the excavation
  const spoil = new THREE.Mesh(new THREE.ConeGeometry(0.55 + done * 0.08, 0.34 + done * 0.07, 12), MATERIALS.soil());
  spoil.position.set(PIT / 2 + 1.0, (0.34 + done * 0.07) / 2, -PIT / 2 - 0.3);
  spoil.castShadow = true;
  spoil.receiveShadow = true;
  group.add(spoil);
  group.add(buildBucket(PIT / 2 + 0.55, PIT / 2 + 0.3));

  // exposed finds and features on the floor of the current level
  const discoveries = buildDiscoveries(unit.id, done, depth);
  if (discoveries) group.add(discoveries);

  group.position.set(unit.x, 0, unit.z);
  scene.add(group);
  registerInteractive(group, 'pit', unit.id, { label: `Excavate ${unit.shortLabel}`, range: 3.8 });
  addCollisionBox(`pit-${unit.id}-n`, unit.x, unit.z - PIT / 2, PIT + 0.4, 0.2);
  addCollisionBox(`pit-${unit.id}-s`, unit.x, unit.z + PIT / 2, PIT + 0.4, 0.2);
  addCollisionBox(`pit-${unit.id}-w`, unit.x - PIT / 2, unit.z, 0.2, PIT + 0.4);
  addCollisionBox(`pit-${unit.id}-e`, unit.x + PIT / 2, unit.z, 0.2, PIT + 0.4);
  addTeleportExclusion(`pit-${unit.id}`, unit.x, unit.z, PIT + 0.6, PIT + 0.6);
  pits.set(unit.id, { group, depth });
}

function buildDiscoveries(unitId, done, depth) {
  const group = new THREE.Group();
  group.position.y = -depth + 0.03;
  const features = state.features.filter((f) => f.unit === unitId && f.level <= done);
  const artifacts = state.artifacts.filter((a) => a.unit === unitId && a.level <= done);

  features.forEach((f) => {
    if (f.featureId === 'ft_hearth' || f.featureId === 'ft_interiorhearth') {
      const stain = new THREE.Mesh(
        new THREE.CircleGeometry(f.featureId === 'ft_hearth' ? 0.32 : 0.2, 20),
        new THREE.MeshStandardMaterial({ color: 0x2f2019, roughness: 1, side: THREE.DoubleSide })
      );
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(-0.25, 0.01, -0.2);
      group.add(stain);
      if (f.featureId === 'ft_hearth') {
        for (let i = 0; i < 8; i += 1) {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07, 0), new THREE.MeshStandardMaterial({ color: 0x8d5240, roughness: 1 }));
          const a = (i / 8) * Math.PI * 2;
          rock.position.set(-0.25 + Math.cos(a) * 0.34, 0.05, -0.2 + Math.sin(a) * 0.34);
          group.add(rock);
        }
      }
    }
    if (f.featureId === 'ft_storagepit') {
      const stain = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshStandardMaterial({ color: 0x2a221a, roughness: 1, side: THREE.DoubleSide }));
      stain.rotation.x = -Math.PI / 2;
      stain.position.set(0.25, 0.008, 0.25);
      group.add(stain);
    }
    if (f.featureId === 'ft_postmolds') {
      for (let i = 0; i < 5; i += 1) {
        const mold = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshStandardMaterial({ color: 0x241d16, roughness: 1, side: THREE.DoubleSide }));
        mold.rotation.x = -Math.PI / 2;
        const a = -0.7 + i * 0.35;
        mold.position.set(Math.cos(a) * 0.75, 0.008, Math.sin(a) * 0.75);
        group.add(mold);
      }
    }
    if (f.featureId === 'ft_alignment') {
      for (let i = 0; i < 4; i += 1) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.22), new THREE.MeshStandardMaterial({ color: 0xa29782, roughness: 0.9 }));
        slab.position.set(-0.6 + i * 0.42, 0.04, -0.5 + i * 0.06);
        group.add(slab);
      }
    }
    if (f.featureId === 'ft_naturalstain') {
      const stain = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshStandardMaterial({ color: 0x3a2f22, roughness: 1, side: THREE.DoubleSide }));
      stain.rotation.x = -Math.PI / 2;
      stain.scale.set(1.4, 0.8, 1);
      stain.position.set(0.2, 0.008, -0.3);
      group.add(stain);
    }
    if (f.featureId === 'ft_midden') {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(PIT - 0.2, PIT - 0.2), new THREE.MeshStandardMaterial({ color: 0x241d15, roughness: 1, side: THREE.DoubleSide }));
      sheet.rotation.x = -Math.PI / 2;
      sheet.position.y = 0.006;
      group.add(sheet);
    }
  });

  artifacts.slice(0, 6).forEach((a, i) => {
    const colour = a.artifactId.includes('sherd') ? 0xa2643f
      : (a.artifactId.includes('point') ? 0x8c8b83
        : (a.artifactId.includes('bone') ? 0xd8cfb8 : 0x7f7c72));
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.02, 0.06),
      new THREE.MeshStandardMaterial({ color: colour, roughness: 0.8 })
    );
    mesh.rotation.y = i * 0.9;
    mesh.position.set(-0.6 + (i % 3) * 0.45, 0.02, 0.4 - Math.floor(i / 3) * 0.45);
    group.add(mesh);
  });

  return group.children.length ? group : null;
}

/* Rebuilds a unit's visual after any state change that affects it. */
export function refreshUnitVisual(unitId) {
  if (!scene) return; // text-only fallback: there is no 3D scene to update
  const unit = UNITS[unitId];
  if (!unit) return;
  if (!state.units.opened.includes(unitId)) return;
  buildPit(unit);
}

export function refreshAllUnitVisuals() {
  state.units.opened.forEach(refreshUnitVisual);
}

export function unitPitDepth(unitId) {
  const entry = pits.get(unitId);
  return entry ? entry.depth : 0;
}
