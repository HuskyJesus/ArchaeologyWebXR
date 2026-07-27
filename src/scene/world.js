/* The site itself: ground, river, bluff, boundaries, paths, station
   structures and vegetation. Every interactive station object is registered
   here so the interaction system and the XR controllers use the same list. */

import * as THREE from 'three';
import { SITE, LOCATIONS, UNITS, SURVEY_POSITIONS } from '../data/site.js';
import { scene, onQualityChange, currentQuality } from './renderer.js';
import { groundTexture, pathTexture, waterTexture, strataTexture, bumpTexture } from './textures.js';
import {
  addCollisionBox, registerInteractive, addTeleportSurface, addTeleportExclusion, isClearOf
} from './registry.js';
import {
  buildCanopy, buildTable, buildSign, buildScreenStation, buildToolRack, buildSampleTray,
  buildDatum, buildGridStake, buildTree, buildBush, buildFieldWorker, buildBucket, MATERIALS
} from './props.js';

export const worldRefs = {
  ground: null,
  river: null,
  riverMaterial: null,
  supervisor: null,
  grass: null,
  trees: [],
  bushes: [],
  evidenceBoard: null,
  labCards: []
};

const HALF = SITE.half;
const PIT = SITE.pitSize;

export function buildWorld() {
  buildGround();
  buildRiverAndBluff();
  buildBoundary();
  buildPaths();
  buildSurveyZone();
  buildGrid();
  buildStations();
  buildHighway();
  buildVegetation();
  onQualityChange(applyVegetationQuality);
  applyVegetationQuality(currentQuality());
}

/* ---------- terrain ---------- */

function buildGround() {
  const shape = new THREE.Shape();
  shape.moveTo(-HALF, -HALF);
  shape.lineTo(HALF, -HALF);
  shape.lineTo(HALF, HALF);
  shape.lineTo(-HALF, HALF);
  shape.lineTo(-HALF, -HALF);
  Object.values(UNITS).forEach((unit) => {
    const hole = new THREE.Path();
    const h = PIT / 2;
    hole.moveTo(unit.x - h, unit.z - h);
    hole.lineTo(unit.x + h, unit.z - h);
    hole.lineTo(unit.x + h, unit.z + h);
    hole.lineTo(unit.x - h, unit.z + h);
    hole.lineTo(unit.x - h, unit.z - h);
    shape.holes.push(hole);
  });
  const geo = new THREE.ShapeGeometry(shape, 2);
  // ShapeGeometry hands back UVs in world units (metres), so the scale below
  // is "one texture tile per eight metres" rather than a repeat count.
  const TEXTURE_TILE_METRES = 8;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, uv.getX(i) / TEXTURE_TILE_METRES, uv.getY(i) / TEXTURE_TILE_METRES);
  }
  const bump = bumpTexture(256, 0.05);
  bump.repeat.set(3, 3);
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    map: groundTexture(), bumpMap: bump, bumpScale: 0.035, roughness: 1
  }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  worldRefs.ground = ground;
  addTeleportSurface(ground);
}

function buildRiverAndBluff() {
  const riverGeo = new THREE.PlaneGeometry(HALF * 2.6, 12, 30, 6);
  const pos = riverGeo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    if (pos.getY(i) > 3.2) {
      pos.setY(i, pos.getY(i) + (Math.random() - 0.3) * 1.2);
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.6);
    }
  }
  pos.needsUpdate = true;
  riverGeo.computeVertexNormals();
  const riverMat = new THREE.MeshStandardMaterial({
    map: waterTexture(), roughness: 0.22, metalness: 0.18, transparent: true, opacity: 0.92
  });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, -3.1, -HALF - 6);
  scene.add(river);
  worldRefs.river = river;
  worldRefs.riverMaterial = riverMat;
  addTeleportExclusion('river', 0, -HALF - 6, HALF * 2.6, 14);

  const bluffGeo = new THREE.PlaneGeometry(HALF * 2.2, 3.4, 36, 6);
  const bpos = bluffGeo.attributes.position;
  for (let i = 0; i < bpos.count; i += 1) {
    const y = bpos.getY(i);
    const erosion = (1 - (y + 1.7) / 3.4) * 0.4;
    bpos.setZ(i, bpos.getZ(i) + (Math.random() - 0.5) * 0.32 * (0.4 + erosion));
  }
  bpos.needsUpdate = true;
  bluffGeo.computeVertexNormals();
  const bluff = new THREE.Mesh(bluffGeo, new THREE.MeshStandardMaterial({
    map: strataTexture({ sterileBand: true, seed: 3 }), roughness: 0.95
  }));
  bluff.position.set(0, -1.5, -HALF + 0.5);
  bluff.receiveShadow = true;
  bluff.castShadow = true;
  scene.add(bluff);

  // talus and exposed roots on the eroding face
  const talusMat = new THREE.MeshStandardMaterial({ color: 0x7a6448, roughness: 1 });
  for (let i = 0; i < 10; i += 1) {
    const talus = new THREE.Mesh(new THREE.ConeGeometry(0.32 + Math.random() * 0.28, 0.3 + Math.random() * 0.22, 8), talusMat);
    talus.position.set(-HALF + 6 + i * 5.4 + (Math.random() - 0.5) * 2, -2.9, -HALF + 1.2 + (Math.random() - 0.5) * 0.6);
    talus.castShadow = true;
    scene.add(talus);
  }
  const rootMat = new THREE.MeshStandardMaterial({ color: 0x5a4a30, roughness: 0.9 });
  for (let i = 0; i < 7; i += 1) {
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.036, 0.75, 6), rootMat);
    root.position.set(-HALF + 8 + i * 6.4, -1.4 + Math.random() * 0.9, -HALF + 0.7);
    root.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    root.rotation.y = (Math.random() - 0.5) * 0.6;
    scene.add(root);
  }

  // safety barrier along the bluff edge
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xd94141, roughness: 0.6 });
  const tapeMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  const tapePoints = [];
  for (let x = -HALF + 2; x < HALF - 2; x += 3) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1, 6), barrierMat);
    post.position.set(x, 0.5, -HALF + 3);
    post.castShadow = true;
    scene.add(post);
    tapePoints.push(new THREE.Vector3(x, 0.9, -HALF + 3));
  }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(tapePoints), tapeMat));
  addCollisionBox('bluffBarrier', 0, -HALF + 3, HALF * 2 - 4, 0.4);
  addTeleportExclusion('bluffEdge', 0, -HALF + 1.5, HALF * 2, 4);
}

function buildBoundary() {
  const postMat = new THREE.MeshStandardMaterial({ color: 0x7a5a36, roughness: 0.9 });
  const ropeMat = new THREE.LineBasicMaterial({ color: 0xe2c27d });
  const addPost = (x, z) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.68, 6), postMat);
    post.position.set(x, 0.34, z);
    post.castShadow = true;
    scene.add(post);
  };
  for (let x = -HALF + 1; x <= HALF - 1; x += 3) {
    if (Math.abs(x) < 3) continue;
    addPost(x, HALF - 1);
  }
  for (let z = -HALF + 4; z <= HALF - 1; z += 3) {
    addPost(-HALF + 1, z);
    addPost(HALF - 1, z);
  }
  const rope = (a, b) => scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), ropeMat
  ));
  rope([-HALF + 1, 0.54, -HALF + 4], [-HALF + 1, 0.54, HALF - 1]);
  rope([HALF - 1, 0.54, -HALF + 4], [HALF - 1, 0.54, HALF - 1]);
  rope([-HALF + 1, 0.54, HALF - 1], [-3, 0.54, HALF - 1]);
  rope([3, 0.54, HALF - 1], [HALF - 1, 0.54, HALF - 1]);
}

/* Worn paths connecting the stations, so routes across the site read
   physically rather than only on the minimap. */
function buildPaths() {
  const mat = new THREE.MeshStandardMaterial({ map: pathTexture(), roughness: 1, transparent: true, opacity: 0.92 });
  const segments = [
    ['camp', 'grid'], ['grid', 'survey'], ['grid', 'screen'], ['screen', 'lab'],
    ['lab', 'dating'], ['grid', 'evidence'], ['evidence', 'synthesis']
  ];
  segments.forEach(([fromId, toId]) => {
    const from = LOCATIONS.find((l) => l.id === fromId);
    const to = LOCATIONS.find((l) => l.id === toId);
    if (!from || !to) return;
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const length = Math.hypot(dx, dz);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, length), mat);
    plane.rotation.x = -Math.PI / 2;
    plane.rotation.z = -Math.atan2(dx, dz);
    plane.position.set((from.x + to.x) / 2, 0.012, (from.z + to.z) / 2);
    plane.receiveShadow = true;
    scene.add(plane);
  });
}

function buildSurveyZone() {
  const minX = -22;
  const maxX = -7;
  const minZ = -9;
  const maxZ = 12;
  const mat = new THREE.MeshStandardMaterial({ color: 0xe0b34e, roughness: 0.75 });
  [[minX, minZ], [maxX, minZ], [maxX, maxZ], [minX, maxZ]].forEach(([x, z]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.9, 6), mat);
    post.position.set(x, 0.45, z);
    post.castShadow = true;
    scene.add(post);
  });
  const lineMat = new THREE.LineBasicMaterial({ color: 0xe0b34e });
  const pts = [[minX, 0.6, minZ], [maxX, 0.6, minZ], [maxX, 0.6, maxZ], [minX, 0.6, maxZ], [minX, 0.6, minZ]]
    .map((p) => new THREE.Vector3(...p));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));

  // transect tape lines
  const tapeMat = new THREE.LineBasicMaterial({ color: 0xd8d0b8 });
  for (let z = minZ + 5; z < maxZ; z += 5) {
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(minX, 0.3, z), new THREE.Vector3(maxX, 0.3, z)
    ]), tapeMat));
  }
  scene.add(buildSign(-14.5, -10.5, ['SURFACE SURVEY', 'Transect 1, 15 by 21 m'], { rotationY: Math.PI }));
}

function buildGrid() {
  scene.add(buildDatum(SITE.datum.x, SITE.datum.z));
  const stakeMat = new THREE.LineBasicMaterial({ color: 0xf0ede2 });
  for (let x = -18; x <= 20; x += 4) {
    for (let z = 2; z <= 18; z += 4) {
      if (!isClearOf(x, z, 0.6)) continue;
      scene.add(buildGridStake(x, z));
    }
  }
  const line = (a, b) => scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), stakeMat
  ));
  for (let z = 2; z <= 18; z += 4) line([-18, 0.4, z], [20, 0.4, z]);
  for (let x = -18; x <= 20; x += 4) line([x, 0.4, 2], [x, 0.4, 18]);
  scene.add(buildSign(2, 1.5, ['EXCAVATION GRID', 'Referenced to site datum N0/E0'], { rotationY: Math.PI }));
}

/* ---------- station structures ---------- */

function station(id) {
  return LOCATIONS.find((l) => l.id === id);
}

function buildStations() {
  buildCamp();
  buildScreeningStation();
  buildLaboratory();
  buildChronologyBench();
  buildInterpretationTable();
  buildEvidenceRoom();
}

function buildCamp() {
  const loc = station('camp');
  const desk = buildTable(loc.x, loc.z, { width: 1.6, depth: 0.8, rotationY: 0 });
  scene.add(desk);
  addCollisionBox('campDesk', loc.x, loc.z, 1.9, 1.2);
  registerInteractive(desk, 'supervisor', null, { label: `Speak to ${SITE.supervisorName}`, range: 3.4 });
  scene.add(buildCanopy(loc.x, loc.z - 0.3, 0xd8cba0, { width: 4, depth: 3.2, height: 2.3 }));
  scene.add(buildToolRack(loc.x - 2.2, loc.z, Math.PI / 2));
  scene.add(buildBucket(loc.x + 1.4, loc.z + 0.6));
  scene.add(buildSampleTray(loc.x - 0.4, 0.79, loc.z));

  const worker = buildFieldWorker(loc.x + 1.1, loc.z - 0.2, -Math.PI / 2);
  scene.add(worker);
  worldRefs.supervisor = { group: worker, baseRotation: -Math.PI / 2 };

  scene.add(buildSign(0, HALF - 2.5, ['REDSTONE BLUFF', 'Archaeological Investigation'], { rotationY: Math.PI }));
  scene.add(buildSign(-6.5, HALF - 2.5, ['THREE-WEEK PROJECT', 'Highway construction pending'], { rotationY: Math.PI * 0.85 }));
  scene.add(buildSign(6.5, HALF - 2.5, ['EROSION THREAT ZONE', 'River bluff to the north'], { rotationY: -Math.PI * 0.85 }));
}

function buildScreeningStation() {
  const loc = station('screen');
  const group = buildScreenStation(loc.x, loc.z, -Math.PI / 4);
  scene.add(group);
  addCollisionBox('screenStation', loc.x, loc.z, 1.8, 1.4);
  registerInteractive(group, 'screen', null, { label: 'Screening station', range: 3.2 });
  scene.add(buildSign(loc.x, loc.z - 2, ['SCREENING STATION', 'Quarter-inch mesh'], { rotationY: Math.PI }));
}

function buildLaboratory() {
  const loc = station('lab');
  const table = buildTable(loc.x, loc.z, { width: 1.9, depth: 0.9, rotationY: Math.PI / 2 });
  scene.add(table);
  addCollisionBox('labTable', loc.x, loc.z, 1.4, 2.2);
  registerInteractive(table, 'lab', null, { label: 'Field laboratory', range: 3.4 });
  scene.add(buildCanopy(loc.x, loc.z, 0x8a9aa8, { width: 4, depth: 3.4, height: 2.25, rotationY: Math.PI / 2 }));

  const bench = buildTable(loc.x + 1.5, loc.z, { width: 1.4, depth: 0.7, height: 0.68, rotationY: Math.PI / 2 });
  scene.add(bench);
  addCollisionBox('labBench', loc.x + 1.5, loc.z, 1.0, 1.7);
  scene.add(buildSampleTray(loc.x + 1.5, 0.71, loc.z - 0.3));

  // hand lens, scale bar, colour book, camera on the main table
  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 18), MATERIALS.metal());
  lensRing.position.set(loc.x - 0.05, 0.8, loc.z + 0.5);
  lensRing.rotation.x = Math.PI / 2;
  const scaleBar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 0.22), new THREE.MeshStandardMaterial({ color: 0xd94141, roughness: 0.6 }));
  scaleBar.position.set(loc.x - 0.05, 0.795, loc.z + 0.1);
  const colourBook = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.22), MATERIALS.paper());
  colourBook.position.set(loc.x + 0.02, 0.8, loc.z - 0.3);
  const cameraBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.14), new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.5 }));
  cameraBody.position.set(loc.x - 0.02, 0.82, loc.z - 0.62);
  scene.add(lensRing, scaleBar, colourBook, cameraBody);
  scene.add(buildSign(loc.x - 2.4, loc.z, ['FIELD LABORATORY', 'Cleaning, sorting, analysis'], { rotationY: -Math.PI / 2 }));
  worldRefs.labTable = loc;
}

function buildChronologyBench() {
  const loc = station('dating');
  const bench = buildTable(loc.x, loc.z, { width: 1.7, depth: 0.8, rotationY: Math.PI / 2 });
  scene.add(bench);
  addCollisionBox('datingBench', loc.x, loc.z, 1.3, 2.0);
  registerInteractive(bench, 'dating', null, { label: 'Chronology bench', range: 3.4 });
  scene.add(buildCanopy(loc.x, loc.z, 0xa8b09a, { width: 3.6, depth: 3, height: 2.2, rotationY: Math.PI / 2 }));

  // sample jars and a profile drawing board
  const jarMat = new THREE.MeshStandardMaterial({ color: 0xd8e0d8, roughness: 0.28, transparent: true, opacity: 0.72 });
  for (let i = 0; i < 5; i += 1) {
    const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 12), jarMat);
    jar.position.set(loc.x - 0.1, 0.81, loc.z - 0.5 + i * 0.24);
    scene.add(jar);
  }
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.85),
    new THREE.MeshStandardMaterial({ map: strataTexture({ charcoalLens: true, seed: 7 }), roughness: 0.9, side: THREE.DoubleSide })
  );
  board.position.set(loc.x + 0.75, 1.35, loc.z);
  board.rotation.y = -Math.PI / 2;
  scene.add(board);
  scene.add(buildSign(loc.x - 2.2, loc.z, ['CHRONOLOGY BENCH', 'Samples, profiles, dates'], { rotationY: -Math.PI / 2 }));
}

function buildInterpretationTable() {
  const loc = station('synthesis');
  const table = buildTable(loc.x, loc.z, { width: 2.2, depth: 1.2, rotationY: 0 });
  scene.add(table);
  addCollisionBox('synthesisTable', loc.x, loc.z, 2.5, 1.6);
  registerInteractive(table, 'synthesis', null, { label: 'Interpretation table', range: 3.6 });
  scene.add(buildCanopy(loc.x, loc.z, 0xc0b090, { width: 4.2, depth: 3.2, height: 2.3 }));

  for (let i = 0; i < 8; i += 1) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.16), MATERIALS.paper());
    card.rotation.x = -Math.PI / 2;
    card.rotation.z = (Math.random() - 0.5) * 0.5;
    card.position.set(loc.x - 0.8 + (i % 4) * 0.5, 0.795, loc.z - 0.25 + Math.floor(i / 4) * 0.4);
    scene.add(card);
  }
  scene.add(buildSign(loc.x, loc.z - 2.2, ['INTERPRETATION TABLE', 'Evidence to conclusions'], { rotationY: Math.PI }));
}

function buildEvidenceRoom() {
  const loc = station('evidence');
  const kiosk = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.15, 0.55), new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.82 }));
  kiosk.position.set(loc.x, 0.58, loc.z);
  kiosk.castShadow = true;
  kiosk.receiveShadow = true;
  scene.add(kiosk);
  addCollisionBox('evidenceKiosk', loc.x, loc.z, 1.3, 0.9);
  registerInteractive(kiosk, 'evidence', null, { label: 'Evidence Room', range: 3.4 });
  scene.add(buildCanopy(loc.x, loc.z, 0xb8825a, { width: 4, depth: 3.2, height: 2.25, rotationY: Math.PI / 2 }));

  const boxMat = new THREE.MeshStandardMaterial({ color: 0x8a6b48, roughness: 0.86 });
  [0, 1, 2].forEach((i) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.26), boxMat);
    box.position.set(loc.x - 0.85, 0.1 + i * 0.21, loc.z - 0.2);
    box.castShadow = true;
    scene.add(box);
  });

  const standMat = MATERIALS.wood();
  [-0.66, 0.66].forEach((offset) => {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.6, 6), standMat);
    stand.position.set(loc.x + offset, 0.8, loc.z - 0.5);
    scene.add(stand);
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.9), new THREE.MeshStandardMaterial({ color: 0xefe9d8, roughness: 0.9 }));
  board.position.set(loc.x, 1.4, loc.z - 0.5);
  board.castShadow = true;
  scene.add(board);
  worldRefs.evidenceBoard = board;

  scene.add(buildSign(loc.x + 2.4, loc.z, ['EVIDENCE ROOM', 'All records, all limits'], { rotationY: Math.PI / 2 }));
}

/* ---------- development pressure ---------- */

function buildHighway() {
  const z = HALF + 8;
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0xc9a876, roughness: 0.72 });
  for (let x = -16; x <= 16; x += 3.5) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.2, 6), fenceMat);
    post.position.set(x, 0.6, z);
    scene.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(32.5, 0.07, 0.07), fenceMat);
  rail.position.set(0, 0.95, z);
  const rail2 = rail.clone();
  rail2.position.y = 0.55;
  scene.add(rail, rail2);

  const road = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 20), new THREE.MeshStandardMaterial({ map: pathTexture(), roughness: 1 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(11, 0.01, z + 3);
  scene.add(road);

  const machMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.62 });
  const excavator = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 2), machMat);
  base.position.y = 0.65;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.95), machMat);
  cab.position.set(0, 1.22, -0.25);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 1.7), machMat);
  boom.position.set(0, 1.36, 0.95);
  boom.rotation.x = -0.5;
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.2), machMat);
  stick.position.set(0, 0.78, 1.8);
  stick.rotation.x = 0.62;
  const tracks = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.32, 2.2), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 }));
  tracks.position.y = 0.16;
  excavator.add(base, cab, boom, stick, tracks);
  excavator.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  excavator.position.set(11, 0, z + 6);
  excavator.rotation.y = 0.35;
  scene.add(excavator);

  scene.add(buildSign(0, z - 1.6, ['HIGHWAY EXPANSION', 'Right of way, construction pending'], { rotationY: Math.PI }));
}

/* ---------- vegetation ---------- */

const GRASS_MAX = 620;

function buildVegetation() {
  const geo = new THREE.ConeGeometry(0.13, 0.26, 5);
  geo.translate(0, 0.13, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x687d3f, roughness: 1, flatShading: true });
  const grass = new THREE.InstancedMesh(geo, mat, GRASS_MAX);
  const dummy = new THREE.Object3D();
  let placed = 0;
  for (let attempt = 0; attempt < GRASS_MAX * 5 && placed < GRASS_MAX; attempt += 1) {
    const x = (Math.random() - 0.5) * HALF * 2;
    const z = (Math.random() - 0.5) * HALF * 2;
    if (!isClearOf(x, z, 1)) continue;
    if (nearSurveyObject(x, z, 1.6)) continue;
    if (nearUnit(x, z, PIT + 1.4)) continue;
    const scale = 0.7 + Math.random() * 0.8;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.set(scale * (0.8 + Math.random() * 0.4), scale, scale * (0.8 + Math.random() * 0.4));
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    placed += 1;
  }
  grass.count = placed;
  grass.instanceMatrix.needsUpdate = true;
  grass.receiveShadow = true;
  // Grass tufts are excluded from occlusion tests: they are knee-high and
  // would otherwise make low survey objects impossible to select from a
  // standing eye height without any real gain in physical plausibility.
  grass.userData.noOcclusion = true;
  scene.add(grass);
  worldRefs.grass = grass;
  worldRefs.grassPlaced = placed;

  for (let i = 0; i < 18; i += 1) {
    const spot = findClearSpot(HALF * 0.6, HALF * 0.96, 1.4);
    if (spot) {
      const tree = buildTree(spot.x, spot.z, 0.85 + Math.random() * 0.55);
      scene.add(tree);
      worldRefs.trees.push(tree);
      addCollisionBox(`tree-${i}`, spot.x, spot.z, 0.5, 0.5);
    }
  }
  for (let i = 0; i < 26; i += 1) {
    const spot = findClearSpot(HALF * 0.4, HALF * 0.92, 1.0);
    if (spot) {
      const bush = buildBush(spot.x, spot.z, 0.7 + Math.random() * 0.6);
      scene.add(bush);
      worldRefs.bushes.push(bush);
    }
  }

  const rockGeo = new THREE.DodecahedronGeometry(0.15, 0);
  const rockMesh = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 0.95 }), 44);
  let rocks = 0;
  for (let i = 0; i < 44; i += 1) {
    const spot = findClearSpot(4, HALF * 0.98, 0.7);
    if (!spot) continue;
    const s = 0.6 + Math.random() * 0.85;
    dummy.position.set(spot.x, 0.05 * s, spot.z);
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    rockMesh.setMatrixAt(rocks, dummy.matrix);
    rocks += 1;
  }
  rockMesh.count = rocks;
  rockMesh.instanceMatrix.needsUpdate = true;
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  scene.add(rockMesh);
}

function nearSurveyObject(x, z, distance) {
  return Object.values(SURVEY_POSITIONS).some(([sx, sz]) => Math.hypot(x - sx, z - sz) < distance);
}

function nearUnit(x, z, distance) {
  return Object.values(UNITS).some((u) => Math.abs(x - u.x) < distance && Math.abs(z - u.z) < distance);
}

function findClearSpot(minRadius, maxRadius, margin) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(x) > HALF - 1.5 || Math.abs(z) > HALF - 1.5) continue;
    if (!isClearOf(x, z, margin)) continue;
    if (nearSurveyObject(x, z, 2)) continue;
    if (nearUnit(x, z, PIT + 2)) continue;
    return { x, z };
  }
  return null;
}

function applyVegetationQuality(preset) {
  if (worldRefs.grass) {
    worldRefs.grass.count = Math.min(preset.grassCount, worldRefs.grassPlaced || 0);
    worldRefs.grass.instanceMatrix.needsUpdate = true;
  }
  const treeLimit = Math.round(worldRefs.trees.length * preset.vegetation);
  worldRefs.trees.forEach((t, i) => { t.visible = i < treeLimit; });
  const bushLimit = Math.round(worldRefs.bushes.length * preset.vegetation);
  worldRefs.bushes.forEach((b, i) => { b.visible = i < bushLimit; });
}

/* ---------- evidence board ---------- */

export function refreshEvidenceBoard(lines) {
  const board = worldRefs.evidenceBoard;
  if (!board) return;
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#efe9d8';
  ctx.fillRect(0, 0, 540, 360);
  ctx.strokeStyle = 'rgba(58,49,38,0.5)';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 528, 348);
  ctx.fillStyle = '#3a3126';
  ctx.font = '600 24px Georgia, serif';
  ctx.fillText('Redstone Bluff evidence board', 22, 44);
  ctx.font = '16px Georgia, serif';
  let y = 84;
  lines.slice(0, 11).forEach((line) => {
    ctx.fillText(line, 22, y);
    y += 25;
  });
  if (board.material.map) board.material.map.dispose();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  board.material.map = tex;
  board.material.needsUpdate = true;
}
