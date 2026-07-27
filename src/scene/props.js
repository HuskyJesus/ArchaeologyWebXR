/* Reusable scene props: the field furniture that makes the site read as a
   working excavation rather than a set of primitives. */

import * as THREE from 'three';
import { signTexture, meshScreenTexture, bumpTexture } from './textures.js';

export const MATERIALS = {
  wood: () => new THREE.MeshStandardMaterial({ color: 0x8a6b42, roughness: 0.86 }),
  darkWood: () => new THREE.MeshStandardMaterial({ color: 0x6b5334, roughness: 0.9 }),
  metal: () => new THREE.MeshStandardMaterial({ color: 0x939aa2, roughness: 0.42, metalness: 0.6 }),
  canvasCloth: (colour) => new THREE.MeshStandardMaterial({ color: colour, roughness: 0.78, side: THREE.DoubleSide }),
  paper: () => new THREE.MeshStandardMaterial({ color: 0xe8e2d0, roughness: 0.8 }),
  plastic: (colour) => new THREE.MeshStandardMaterial({ color: colour, roughness: 0.55 }),
  soil: () => new THREE.MeshStandardMaterial({ color: 0x7f6a49, roughness: 1 })
};

export function buildCanopy(x, z, colour, options = {}) {
  const { width = 3.4, depth = 2.9, height = 2.2, rotationY = 0 } = options;
  const group = new THREE.Group();
  const legGeo = new THREE.CylinderGeometry(0.04, 0.04, height, 8);
  const legMat = MATERIALS.metal();
  const hw = width / 2 - 0.15;
  const hd = depth / 2 - 0.15;
  [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, legMat);
    leg.position.set(lx, height / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  });
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(width, depth, 6, 4), MATERIALS.canvasCloth(colour));
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = height + 0.06;
  // A shallow ridge along the centre line, so the fabric reads as a pitched
  // shade rather than a flat card.
  const pos = roof.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setZ(i, pos.getZ(i) - (1 - Math.abs(pos.getX(i)) / (width / 2)) * 0.22);
  }
  pos.needsUpdate = true;
  roof.geometry.computeVertexNormals();
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xd8d0b8 });
  [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([lx, lz]) => {
    const pts = [new THREE.Vector3(lx, height * 0.78, lz), new THREE.Vector3(lx + Math.sign(lx) * 0.5, 0.05, lz + Math.sign(lz) * 0.5)];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  });
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  return group;
}

export function buildTable(x, z, options = {}) {
  const { width = 1.7, depth = 0.85, height = 0.76, rotationY = 0 } = options;
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), MATERIALS.wood());
  top.position.y = height;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);
  const legGeo = new THREE.CylinderGeometry(0.03, 0.03, height, 8);
  const hw = width / 2 - 0.09;
  const hd = depth / 2 - 0.09;
  [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeo, MATERIALS.metal());
    leg.position.set(lx, height / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  });
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  return group;
}

export function buildSign(x, z, lines, options = {}) {
  const { rotationY = 0, width = 1.6, height = 0.58, postHeight = 1.35, background } = options;
  const group = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: signTexture(lines, background ? { background } : {}), roughness: 0.8, side: THREE.DoubleSide })
  );
  board.position.y = postHeight;
  board.castShadow = true;
  group.add(board);
  [-width / 2 + 0.12, width / 2 - 0.12].forEach((offset) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, postHeight + 0.1, 8), MATERIALS.darkWood());
    post.position.set(offset, (postHeight + 0.1) / 2 - 0.2, 0);
    post.castShadow = true;
    group.add(post);
  });
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  return group;
}

export function buildScreenStation(x, z, rotationY = 0) {
  const group = new THREE.Group();
  const frameMat = MATERIALS.wood();
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.08), frameMat);
  top.position.set(0, 1.08, -0.34);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.08), frameMat);
  bottom.position.set(0, 0.56, 0.24);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.68),
    new THREE.MeshStandardMaterial({ map: meshScreenTexture(), transparent: true, side: THREE.DoubleSide, roughness: 0.6 })
  );
  mesh.position.set(0, 0.82, -0.05);
  mesh.rotation.x = -1.05;
  const legGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.6, 8);
  const legL = new THREE.Mesh(legGeo, frameMat);
  legL.position.set(-0.44, 0.3, 0.1);
  legL.rotation.z = 0.16;
  const legR = legL.clone();
  legR.position.x = 0.44;
  legR.rotation.z = -0.16;
  group.add(top, bottom, mesh, legL, legR);

  const pile = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.42, 12), MATERIALS.soil());
  pile.position.set(1.05, 0.2, 0.34);
  pile.castShadow = true;
  pile.receiveShadow = true;
  group.add(pile);

  [[-0.75, 0.5], [-0.95, 0.15]].forEach(([bx, bz]) => {
    group.add(buildBucket(bx, bz));
  });

  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  return group;
}

export function buildBucket(x, z, colour = 0x8a8478) {
  const bucket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.12, 0.26, 14, 1, true),
    new THREE.MeshStandardMaterial({ color: colour, roughness: 0.6, side: THREE.DoubleSide })
  );
  bucket.position.set(x, 0.13, z);
  const base = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), new THREE.MeshStandardMaterial({ color: colour, roughness: 0.7 }));
  base.rotation.x = -Math.PI / 2;
  base.position.set(x, 0.005, z);
  const group = new THREE.Group();
  group.add(bucket, base);
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}

export function buildToolRack(x, z, rotationY = 0) {
  const group = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.05), MATERIALS.darkWood());
  board.position.y = 0.95;
  group.add(board);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), MATERIALS.darkWood());
  legs.position.set(-0.5, 0.6, 0);
  const legs2 = legs.clone();
  legs2.position.x = 0.5;
  group.add(legs, legs2);

  // trowels hanging on the board
  for (let i = 0; i < 4; i += 1) {
    const blade = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 4), MATERIALS.metal());
    blade.rotation.x = Math.PI;
    blade.position.set(-0.36 + i * 0.24, 0.86, 0.045);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.1, 8), MATERIALS.wood());
    handle.position.set(-0.36 + i * 0.24, 1.0, 0.045);
    group.add(blade, handle);
  }
  // brushes
  for (let i = 0; i < 3; i += 1) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6), MATERIALS.wood());
    shaft.position.set(-0.3 + i * 0.3, 1.16, 0.045);
    group.add(shaft);
  }
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  return group;
}

export function buildSampleTray(x, y, z) {
  const group = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.3), MATERIALS.plastic(0xd8d3c4));
  tray.position.y = y;
  group.add(tray);
  for (let i = 0; i < 6; i += 1) {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.03, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e0, roughness: 0.5, transparent: true, opacity: 0.82 })
    );
    bag.position.set(-0.15 + (i % 3) * 0.15, y + 0.03, -0.07 + Math.floor(i / 3) * 0.14);
    group.add(bag);
  }
  group.position.set(x, 0, z);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return group;
}

export function buildDatum(x, z) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0xd94141, roughness: 0.6 }));
  post.position.y = 0.55;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), MATERIALS.metal());
  cap.position.y = 1.13;
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16),
    new THREE.MeshStandardMaterial({ map: signTexture(['DATUM N0/E0'], { width: 420, height: 160, background: '#2f2a22' }), roughness: 0.7, side: THREE.DoubleSide }));
  plate.position.set(0, 0.86, 0.07);
  group.add(post, cap, plate);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.position.set(x, 0, z);
  return group;
}

export function buildSurveyFlag(x, z, colour = 0xe0b34e) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.8, 6), new THREE.MeshStandardMaterial({ color: 0xe8d9b0, roughness: 0.8 }));
  pole.position.y = 0.4;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.16), new THREE.MeshStandardMaterial({ color: colour, side: THREE.DoubleSide, roughness: 0.7 }));
  flag.position.set(0.13, 0.7, 0);
  group.add(pole, flag);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.position.set(x, 0, z);
  return group;
}

export function buildGridStake(x, z) {
  const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.42, 6), MATERIALS.darkWood());
  stake.position.set(x, 0.21, z);
  stake.castShadow = true;
  return stake;
}

export function buildTree(x, z, scale = 1) {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.92 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * scale, 0.18 * scale, 2 * scale, 8), trunkMat);
  trunk.position.y = scale;
  group.add(trunk);
  for (let i = 0; i < 4; i += 1) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.03 * scale, 0.05 * scale, 0.8 * scale, 6), trunkMat);
    const angle = (i / 4) * Math.PI * 2;
    branch.position.set(Math.cos(angle) * 0.28 * scale, 1.62 * scale, Math.sin(angle) * 0.28 * scale);
    branch.rotation.z = Math.cos(angle) * -0.8;
    branch.rotation.x = Math.sin(angle) * 0.8;
    group.add(branch);
  }
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0x4c5c33, roughness: 1, flatShading: true });
  [[0, 2.5, 0, 0.68], [0.48, 2.28, 0.2, 0.5], [-0.45, 2.32, -0.22, 0.52], [0.14, 2.82, -0.24, 0.48], [-0.12, 2.56, 0.45, 0.46]]
    .forEach(([cx, cy, cz, cr]) => {
      const cluster = new THREE.Mesh(new THREE.IcosahedronGeometry(cr * scale, 0), canopyMat);
      cluster.position.set(cx * scale, cy * scale, cz * scale);
      cluster.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(cluster);
    });
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  group.position.set(x, 0, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  return group;
}

export function buildBush(x, z, scale = 1) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x566b3a, roughness: 1, flatShading: true });
  const count = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i += 1) {
    const r = (0.18 + Math.random() * 0.12) * scale;
    const cluster = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat);
    cluster.position.set((Math.random() - 0.5) * 0.34 * scale, r * 0.85, (Math.random() - 0.5) * 0.34 * scale);
    cluster.castShadow = true;
    cluster.receiveShadow = true;
    group.add(cluster);
  }
  group.position.set(x, 0, z);
  return group;
}

export function buildFieldWorker(x, z, rotationY = 0, options = {}) {
  const { shirt = 0x6b7a4a, trousers = 0x5a5240, hat = 0xc9b483 } = options;
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xcf9c72, roughness: 0.78 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.82 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: trousers, roughness: 0.86 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x2a2016, roughness: 0.7 });

  [-0.09, 0.09].forEach((offset) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.82, 10), trouserMat);
    leg.position.set(offset, 0.43, 0);
    group.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.25), bootMat);
    boot.position.set(offset, 0.05, 0.03);
    group.add(boot);
  });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.2, 0.62, 12), shirtMat);
  torso.position.y = 1.16;
  group.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.1, 8), skinMat);
  neck.position.y = 1.49;
  group.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 14), skinMat);
  head.position.y = 1.64;
  head.scale.set(0.95, 1.05, 0.92);
  group.add(head);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 16), new THREE.MeshStandardMaterial({ color: hat, roughness: 0.82 }));
  brim.position.y = 1.76;
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.13, 12), new THREE.MeshStandardMaterial({ color: hat, roughness: 0.82 }));
  crown.position.y = 1.83;
  group.add(brim, crown);

  const armGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.44, 10);
  [-1, 1].forEach((side) => {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(armGeo, shirtMat);
    upper.position.y = -0.15;
    upper.scale.y = 0.62;
    const fore = new THREE.Mesh(armGeo, skinMat);
    fore.position.y = -0.4;
    fore.rotation.x = -0.6;
    fore.scale.y = 0.55;
    arm.add(upper, fore);
    arm.position.set(side * 0.27, 1.43, 0);
    arm.rotation.z = -side * 0.16;
    group.add(arm);
  });

  const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.25, 0.02), MATERIALS.paper());
  clipboard.position.set(0.26, 1.16, -0.22);
  clipboard.rotation.x = -0.32;
  group.add(clipboard);

  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  return group;
}
