/* Renderer, camera, scene and lighting, plus the quality presets.

   `applyQuality` is the single place a quality setting takes effect, and it
   is genuinely re-callable at any point during a session. */

import * as THREE from 'three';
import { state } from '../core/state.js';
import { on, EVENTS } from '../core/events.js';
import { skyTexture } from './textures.js';

export const QUALITY_PRESETS = {
  low: { shadows: false, shadowMapSize: 512, pixelRatioCap: 1, grassCount: 0, vegetation: 0.35, ambientDetail: false },
  standard: { shadows: true, shadowMapSize: 1536, pixelRatioCap: 1.5, grassCount: 260, vegetation: 0.75, ambientDetail: true },
  high: { shadows: true, shadowMapSize: 2560, pixelRatioCap: 2, grassCount: 620, vegetation: 1, ambientDetail: true }
};

export let scene = null;
export let camera = null;
export let renderer = null;
export let sun = null;
export let hemi = null;
export let webglAvailable = true;

const qualityListeners = [];

export function onQualityChange(fn) {
  qualityListeners.push(fn);
}

export function initRenderer(container) {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no context');
  } catch (err) {
    webglAvailable = false;
    return false;
  }

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fbdd6);
  scene.fog = new THREE.Fog(0xc3cfa0, 40, 190);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 1.65, 26);

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.id = 'sceneCanvas';
  /* The canvas is a visual enhancement, not the only way to act. Describe it
     for assistive technology and point to the equivalent controls, rather than
     hiding it entirely, so a screen-reader user understands what the visual
     view is and how to reach the same actions without it. */
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label',
    'Three-dimensional view of the Redstone Bluff excavation site. This is a visual enhancement. Every object, activity, decision and piece of evidence is also available from the on-screen tools, the Current objective button, the field notebook, and Guided Accessible Mode.');
  (container || document.body).appendChild(renderer.domElement);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(250, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false })
  );
  dome.renderOrder = -1;
  scene.add(dome);

  sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
  sun.position.set(-26, 34, 14);
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  hemi = new THREE.HemisphereLight(0xd8e8f0, 0x6b5a3a, 1.15);
  scene.add(hemi);

  window.addEventListener('resize', onResize);
  on(EVENTS.settingsChanged, () => applyQuality(state.settings.quality));
  applyQuality(state.settings.quality);
  return true;
}

export function onResize() {
  if (!renderer || !camera) return;
  // During an immersive session the XR system owns the camera and framebuffer;
  // resizing the desktop canvas or touching the projection would fight it.
  if (renderer.xr && renderer.xr.isPresenting) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function applyQuality(name) {
  const preset = QUALITY_PRESETS[name] || QUALITY_PRESETS.standard;
  if (!renderer) return preset;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatioCap));
  renderer.shadowMap.enabled = preset.shadows;
  if (sun) {
    sun.castShadow = preset.shadows;
    sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
    if (sun.shadow.map) {
      sun.shadow.map.dispose();
      sun.shadow.map = null;
    }
  }
  qualityListeners.forEach((fn) => {
    try { fn(preset, name); } catch (e) { console.error('[renderer] quality listener failed', e); }
  });
  return preset;
}

export function currentQuality() {
  return QUALITY_PRESETS[state.settings.quality] || QUALITY_PRESETS.standard;
}
