/* Survey objects in the world.

   Shapes are based on what each object actually looks like, never on whether
   it turns out to be evidence, so nothing is given away before the learner
   classifies it. A recorded object gains a small numbered tag rather than a
   colour change, which keeps the distinction between recorded and
   unrecorded readable without turning finds into collectibles. */

import * as THREE from 'three';
import { SURVEY_ITEMS } from '../data/survey.js';
import { SURVEY_POSITIONS } from '../data/site.js';
import { state } from '../core/state.js';
import { scene } from './renderer.js';
import { registerInteractive } from './registry.js';
import { signTexture } from './textures.js';
import { buildSurveyFlag } from './props.js';

const markers = new Map();

const STONE = 0x8c8b83;
const DARK_SOIL = 0x33291e;

function buildShape(item) {
  const group = new THREE.Group();
  const mat = (colour, roughness = 0.78, metalness = 0) => new THREE.MeshStandardMaterial({ color: colour, roughness, metalness });

  switch (item.shape) {
    case 'biface': {
      const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.14, 0), mat(STONE));
      mesh.scale.set(1.1, 0.32, 0.8);
      mesh.position.y = 0.06;
      group.add(mesh);
      break;
    }
    case 'debitage': {
      for (let i = 0; i < 9; i += 1) {
        const flake = new THREE.Mesh(new THREE.TetrahedronGeometry(0.05 + Math.random() * 0.04, 0), mat(0x8f8e86));
        flake.scale.set(1.2, 0.25, 1);
        flake.position.set((Math.random() - 0.5) * 1.1, 0.03, (Math.random() - 0.5) * 1.1);
        flake.rotation.y = Math.random() * Math.PI;
        group.add(flake);
      }
      break;
    }
    case 'sherd': {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.045, 16, 1, true, 0, Math.PI * 0.7), mat(0xa2643f));
      mesh.rotation.z = Math.PI / 2;
      mesh.rotation.y = 0.4;
      mesh.position.y = 0.05;
      group.add(mesh);
      break;
    }
    case 'fcr': {
      const stain = new THREE.Mesh(new THREE.CircleGeometry(0.66, 20), mat(0x4a3b2c, 1));
      stain.rotation.x = -Math.PI / 2;
      stain.position.y = 0.008;
      group.add(stain);
      for (let i = 0; i < 12; i += 1) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.07 + Math.random() * 0.04, 0), mat(0x96543f, 1));
        const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
        const r = 0.18 + Math.random() * 0.4;
        rock.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        group.add(rock);
      }
      break;
    }
    case 'groundstone': {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), mat(0x9d8f77));
      mesh.scale.set(1.15, 0.55, 0.9);
      mesh.position.y = 0.07;
      group.add(mesh);
      break;
    }
    case 'cobble': {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(0x928471));
      mesh.scale.set(1.2, 0.8, 1);
      mesh.position.y = 0.1;
      group.add(mesh);
      break;
    }
    case 'rootcast': {
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.2), mat(0x4a3f30, 1));
      streak.rotation.x = -Math.PI / 2;
      streak.rotation.z = 0.4;
      streak.position.y = 0.007;
      const branch = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.6), mat(0x4a3f30, 1));
      branch.rotation.x = -Math.PI / 2;
      branch.rotation.z = -0.6;
      branch.position.set(0.2, 0.007, 0.3);
      group.add(streak, branch);
      break;
    }
    case 'stain': {
      const stain = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), mat(DARK_SOIL, 1));
      stain.rotation.x = -Math.PI / 2;
      stain.position.y = 0.008;
      group.add(stain);
      for (let i = 0; i < 4; i += 1) {
        const bit = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.012, 0.03), mat(0xded6c2));
        bit.position.set((Math.random() - 0.5) * 0.45, 0.014, (Math.random() - 0.5) * 0.45);
        group.add(bit);
      }
      break;
    }
    case 'alignment': {
      for (let i = 0; i < 7; i += 1) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.24), mat(0xa29782, 0.9));
        const t = (i / 6) - 0.5;
        slab.position.set(t * 3.4, 0.045, Math.abs(t) * 0.9 - 0.2);
        slab.rotation.y = t * 0.35;
        group.add(slab);
      }
      break;
    }
    case 'depression': {
      const hollow = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), mat(0x5c6a3c, 1));
      hollow.rotation.x = -Math.PI / 2;
      hollow.position.y = 0.006;
      group.add(hollow);
      const rim = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.55, 32), new THREE.MeshStandardMaterial({ color: 0x74804d, roughness: 1, side: THREE.DoubleSide }));
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.01;
      group.add(rim);
      break;
    }
    case 'can': {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.13, 12), mat(0xb7bcbd, 0.45, 0.5));
      mesh.rotation.z = Math.PI / 2.4;
      mesh.scale.set(1, 1, 0.7);
      mesh.position.y = 0.05;
      group.add(mesh);
      break;
    }
    case 'shell': {
      for (let i = 0; i < 11; i += 1) {
        const valve = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(i % 4 === 0 ? 0x6b5a4c : 0xcdc3ad, 0.6));
        valve.rotation.x = Math.PI;
        valve.position.set((Math.random() - 0.5) * 1.4, 0.02, (Math.random() - 0.5) * 1.4);
        valve.rotation.y = Math.random() * Math.PI;
        group.add(valve);
      }
      break;
    }
    default: {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), mat(0x888888));
      mesh.position.y = 0.08;
      group.add(mesh);
    }
  }

  group.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}

export function buildSurveyMarkers() {
  SURVEY_ITEMS.forEach((item, index) => {
    const pos = SURVEY_POSITIONS[item.id];
    if (!pos) return;
    const group = new THREE.Group();
    group.add(buildShape(item));

    const flag = buildSurveyFlag(0.55, 0.1);
    group.add(flag);

    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.11),
      new THREE.MeshStandardMaterial({
        map: signTexture([`SO-${index + 1}`], { width: 240, height: 110, background: '#3c3327' }),
        roughness: 0.8,
        side: THREE.DoubleSide
      })
    );
    tag.position.set(0.55, 0.62, 0.12);
    tag.name = 'recordedTag';
    tag.visible = state.survey.mapped.includes(item.id);
    group.add(tag);

    group.position.set(pos[0], 0, pos[1]);
    scene.add(group);
    registerInteractive(group, 'survey', item.id, { label: `Examine surface object ${index + 1}`, range: 3.2 });
    markers.set(item.id, group);
  });
}

export function refreshSurveyMarkers() {
  markers.forEach((group, id) => {
    const tag = group.getObjectByName('recordedTag');
    if (tag) tag.visible = state.survey.mapped.includes(id);
  });
}

export function surveyMarkerPosition(id) {
  const group = markers.get(id);
  return group ? group.position : null;
}
