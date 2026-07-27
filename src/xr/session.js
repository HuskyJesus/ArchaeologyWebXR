/* WebXR: progressive enhancement only.

   Nothing here runs unless immersive VR is actually available. The browser
   experience is untouched when it is not, and is restored exactly when a
   session ends.

   Controls:
     trigger              select whatever the ray is pointing at
     right thumbstick up  aim a teleport, release to travel
     right thumbstick     left or right for snap turning
     left thumbstick      smooth movement, only when that comfort option is on
     left controller      wrist menu for objective, notebook, evidence, settings
*/

import * as THREE from 'three';
import { SITE } from '../data/site.js';
import { state, setSetting } from '../core/state.js';
import { emit, EVENTS } from '../core/events.js';
import { byId } from '../core/dom.js';
import { scene, camera, renderer } from '../scene/renderer.js';
import { isTeleportBlocked, isBlocked } from '../scene/registry.js';
import { player, applyToCamera } from '../player/controller.js';
import { targetFromRay, setHighlight } from '../player/interaction.js';
import { activateTarget, runObjectiveAction } from '../ui/actions.js';
import * as modal from '../ui/modal.js';
import { openNotebook } from '../ui/notebook.js';
import { openEvidenceRoom } from '../ui/stations/evidenceRoom.js';
import { openSettings } from '../ui/settings.js';
import { XRPanel, XRWristMenu } from './panel.js';

const RAY_LENGTH = 6;
const TELEPORT_MAX = 14;

let supported = false;
let presenting = false;
let dolly = null;
let panel = null;
let wristMenu = null;
let teleportMarker = null;
let vignette = null;
const controllers = [];
let currentSession = null;

const axisState = {
  snapReady: true,
  teleportAiming: false,
  teleportPoint: null,
  teleportValid: false,
  scrollCooldown: 0
};

export function isXRSupported() {
  return supported;
}

export function isPresenting() {
  return presenting;
}

export async function initXR() {
  const button = byId('enterVrBtn');
  const note = byId('xrNote');
  if (!navigator.xr || !window.isSecureContext) {
    if (note) note.textContent = 'Virtual reality needs a headset browser and a secure connection. The full investigation runs here without it.';
    return false;
  }
  try {
    supported = await navigator.xr.isSessionSupported('immersive-vr');
  } catch (err) {
    supported = false;
  }
  if (!supported) {
    if (note) note.textContent = 'No immersive VR device was detected. The full investigation runs here without one.';
    return false;
  }

  buildRig();
  button.style.display = 'inline-flex';
  if (note) note.textContent = 'An immersive VR device is available. The browser version stays fully usable either way.';
  button.addEventListener('click', toggleSession);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');
  return true;
}

function buildRig() {
  dolly = new THREE.Group();
  dolly.name = 'xrDolly';
  scene.add(dolly);
  dolly.add(camera);

  panel = new XRPanel();
  scene.add(panel.object3d);

  wristMenu = new XRWristMenu([
    { label: 'Current objective', action: () => runObjectiveAction() },
    { label: 'Field notebook', action: () => openNotebook() },
    { label: 'Evidence Room', action: () => openEvidenceRoom() },
    { label: 'Settings', action: () => openSettings() },
    { label: 'Leave VR', action: () => endSession() }
  ]);

  const ringGeo = new THREE.RingGeometry(0.24, 0.34, 32);
  ringGeo.rotateX(-Math.PI / 2);
  teleportMarker = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    color: 0x6fa889, transparent: true, opacity: 0.85, side: THREE.DoubleSide
  }));
  teleportMarker.visible = false;
  scene.add(teleportMarker);

  vignette = buildVignette();
  camera.add(vignette);

  for (let i = 0; i < 2; i += 1) {
    const controller = renderer.xr.getController(i);
    controller.userData.index = i;
    controller.userData.hand = null;
    controller.add(buildRay());
    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);
    controller.addEventListener('connected', (event) => {
      controller.userData.hand = event.data.handedness;
      controller.userData.inputSource = event.data;
      controller.visible = true;
      if (event.data.handedness === 'left') controller.add(wristMenu.object3d);
    });
    controller.addEventListener('disconnected', () => {
      controller.userData.hand = null;
      controller.userData.inputSource = null;
      controller.visible = false;
    });
    dolly.add(controller);
    controllers.push(controller);

    const grip = renderer.xr.getControllerGrip(i);
    grip.add(buildControllerBody());
    dolly.add(grip);
  }
}

function buildRay() {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)
  ]);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xf0ede2, transparent: true, opacity: 0.7 }));
  line.name = 'ray';
  line.scale.z = RAY_LENGTH;
  return line;
}

function buildControllerBody() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.026, 0.11, 12),
    new THREE.MeshStandardMaterial({ color: 0x2b2620, roughness: 0.6 })
  );
  body.rotation.x = -0.4;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.032, 0.006, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.5 })
  );
  ring.position.set(0, 0.05, -0.02);
  ring.rotation.x = Math.PI / 2 - 0.4;
  group.add(body, ring);
  return group;
}

function buildVignette() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.5),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false, opacity: 0 })
  );
  mesh.position.set(0, 0, -0.24);
  mesh.renderOrder = 20;
  return mesh;
}

/* ---------- session lifecycle ---------- */

async function toggleSession() {
  if (presenting) {
    await endSession();
  } else {
    await startSession();
  }
}

export async function startSession() {
  if (!supported || presenting) return;
  try {
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
    });
    await renderer.xr.setSession(session);
    currentSession = session;
    session.addEventListener('end', onSessionEnd);
    onSessionStart();
  } catch (err) {
    console.warn('[xr] could not start an immersive session', err);
    const note = byId('xrNote');
    if (note) note.textContent = 'The headset refused the session. The browser version is unaffected.';
  }
}

export async function endSession() {
  if (currentSession) {
    try {
      await currentSession.end();
    } catch (err) {
      onSessionEnd();
    }
  }
}

function onSessionStart() {
  presenting = true;
  player.frozen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  camera.position.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);
  dolly.position.set(player.position.x, 0, player.position.z);
  dolly.rotation.set(0, player.yaw + Math.PI, 0);
  byId('enterVrBtn').textContent = 'Leave VR';
  byId('hud').classList.add('xrActive');
  emit(EVENTS.xrSessionStart, {});
}

function onSessionEnd() {
  presenting = false;
  currentSession = null;
  player.frozen = false;
  player.position.x = dolly.position.x;
  player.position.z = dolly.position.z;
  player.yaw = dolly.rotation.y - Math.PI;
  dolly.position.set(0, 0, 0);
  dolly.rotation.set(0, 0, 0);
  camera.position.set(player.position.x, 1.65, player.position.z);
  applyToCamera();
  if (panel) panel.setVisible(false);
  if (teleportMarker) teleportMarker.visible = false;
  if (vignette) vignette.material.opacity = 0;
  const button = byId('enterVrBtn');
  if (button) button.textContent = 'Enter VR';
  byId('hud').classList.remove('xrActive');
  emit(EVENTS.xrSessionEnd, {});
}

/* ---------- per-frame update ---------- */

export function updateXR(dt) {
  if (!presenting) return;
  const topModal = modal.top();
  if (topModal) {
    if (panel.sourceId !== topModal.id || panel.needsResync) {
      panel.syncFrom(topModal.el);
      panel.needsResync = false;
      panel.placeInFrontOf(camera);
      const worldPos = new THREE.Vector3();
      camera.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      camera.getWorldQuaternion(worldQuat);
      placePanelWorld(worldPos, worldQuat);
    }
  } else if (panel.mesh.visible) {
    panel.setVisible(false);
    panel.sourceId = null;
  }

  handleAxes(dt);
  updateControllerTargets();
  panel.refresh();
}

/* Re-syncs the world panel after the DOM panel changes, for example when a
   choice reveals feedback. Called from the main loop on any state change. */
export function invalidateXRPanel() {
  if (!panel) return;
  const topModal = modal.top();
  if (!topModal) return;
  panel.syncFrom(topModal.el);
}

function placePanelWorld(position, quaternion) {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
  forward.y = 0;
  if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
  forward.normalize();
  const target = position.clone().add(forward.multiplyScalar(1.3));
  target.y = position.y - 0.15;
  panel.mesh.position.copy(target);
  panel.mesh.lookAt(position);
}

function handleAxes(dt) {
  const session = renderer.xr.getSession();
  if (!session) return;
  axisState.scrollCooldown = Math.max(0, axisState.scrollCooldown - dt);
  let smoothX = 0;
  let smoothY = 0;

  session.inputSources.forEach((source) => {
    if (!source.gamepad || !source.gamepad.axes) return;
    const axes = source.gamepad.axes;
    const x = axes.length > 2 ? axes[2] : axes[0];
    const y = axes.length > 3 ? axes[3] : axes[1];
    if (source.handedness === 'right') {
      handleSnapTurn(x);
      handleTeleportAim(y, source);
      if (panel.mesh.visible && Math.abs(y) > 0.7 && axisState.scrollCooldown === 0) {
        panel.scroll(y > 0 ? 260 : -260);
        axisState.scrollCooldown = 0.22;
      }
    } else if (source.handedness === 'left') {
      smoothX = x;
      smoothY = y;
    }
  });

  if (state.settings.xr.locomotion === 'smooth' && !panel.mesh.visible) {
    applySmoothLocomotion(smoothX, smoothY, dt);
  } else if (vignette) {
    vignette.material.opacity = Math.max(0, vignette.material.opacity - dt * 2);
  }
}

function handleSnapTurn(x) {
  const angle = (state.settings.xr.snapAngle || 30) * (Math.PI / 180);
  if (Math.abs(x) < 0.55) {
    axisState.snapReady = true;
    return;
  }
  if (!axisState.snapReady) return;
  axisState.snapReady = false;
  rotateAroundHead(x > 0 ? -angle : angle);
}

function rotateAroundHead(angle) {
  const head = new THREE.Vector3();
  camera.getWorldPosition(head);
  const pivot = new THREE.Vector3(head.x, 0, head.z);
  const offset = new THREE.Vector3().subVectors(dolly.position, pivot);
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  dolly.position.copy(pivot).add(offset);
  dolly.rotation.y += angle;
}

function handleTeleportAim(y, source) {
  if (state.settings.xr.locomotion !== 'teleport' && Math.abs(y) < 0.6) {
    teleportMarker.visible = false;
    axisState.teleportAiming = false;
    return;
  }
  const aiming = y < -0.6 && !panel.mesh.visible;
  if (aiming) {
    axisState.teleportAiming = true;
    const controller = controllers.find((c) => c.userData.hand === source.handedness);
    if (controller) updateTeleportMarker(controller);
  } else if (axisState.teleportAiming) {
    axisState.teleportAiming = false;
    if (axisState.teleportValid && axisState.teleportPoint) {
      moveDollyTo(axisState.teleportPoint.x, axisState.teleportPoint.z);
    }
    teleportMarker.visible = false;
  }
}

function updateTeleportMarker(controller) {
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3(0, 0, -1);
  controller.getWorldPosition(origin);
  const quaternion = new THREE.Quaternion();
  controller.getWorldQuaternion(quaternion);
  direction.applyQuaternion(quaternion);

  if (direction.y >= -0.05) {
    teleportMarker.visible = false;
    axisState.teleportValid = false;
    return;
  }
  const distance = -origin.y / direction.y;
  if (distance > TELEPORT_MAX) {
    teleportMarker.visible = false;
    axisState.teleportValid = false;
    return;
  }
  const point = origin.clone().add(direction.multiplyScalar(distance));
  const valid = isTeleportTargetValid(point.x, point.z);
  axisState.teleportPoint = point;
  axisState.teleportValid = valid;
  teleportMarker.visible = true;
  teleportMarker.position.set(point.x, 0.03, point.z);
  teleportMarker.material.color.setHex(valid ? 0x6fa889 : 0xc9614f);
}

export function isTeleportTargetValid(x, z) {
  const limit = SITE.half - 1.5;
  if (Math.abs(x) > limit || Math.abs(z) > limit) return false;
  if (isTeleportBlocked(x, z, 0.35)) return false;
  if (isBlocked(x, z, 0.35)) return false;
  return true;
}

function moveDollyTo(x, z) {
  const head = new THREE.Vector3();
  camera.getWorldPosition(head);
  const offsetX = dolly.position.x - head.x;
  const offsetZ = dolly.position.z - head.z;
  dolly.position.x = x + offsetX;
  dolly.position.z = z + offsetZ;
  syncPlayerFromDolly();
}

function applySmoothLocomotion(x, y, dt) {
  const magnitude = Math.hypot(x, y);
  if (magnitude < 0.15) {
    if (vignette) vignette.material.opacity = Math.max(0, vignette.material.opacity - dt * 2);
    return;
  }
  const quaternion = new THREE.Quaternion();
  camera.getWorldQuaternion(quaternion);
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
  right.y = 0;
  right.normalize();

  const speed = 2.2;
  const head = new THREE.Vector3();
  camera.getWorldPosition(head);
  const deltaX = (forward.x * -y + right.x * x) * speed * dt;
  const deltaZ = (forward.z * -y + right.z * x) * speed * dt;
  const nextX = head.x + deltaX;
  const nextZ = head.z + deltaZ;
  if (isTeleportTargetValid(nextX, head.z)) dolly.position.x += deltaX;
  if (isTeleportTargetValid(head.x, nextZ)) dolly.position.z += deltaZ;
  syncPlayerFromDolly();

  if (vignette && state.settings.xr.vignette) {
    vignette.material.opacity = Math.min(0.85, vignette.material.opacity + dt * 3);
  }
}

function syncPlayerFromDolly() {
  const head = new THREE.Vector3();
  camera.getWorldPosition(head);
  player.position.x = head.x;
  player.position.z = head.z;
}

/* ---------- controller targeting and selection ---------- */

function updateControllerTargets() {
  controllers.forEach((controller) => {
    if (!controller.userData.hand) return;
    const origin = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    controller.getWorldPosition(origin);
    controller.getWorldQuaternion(quaternion);
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);

    const ray = controller.getObjectByName('ray');
    let hitDistance = RAY_LENGTH;
    let hovering = false;

    if (panel.mesh.visible) {
      const point = intersectPlane(origin, direction, panel.mesh);
      if (point) {
        const index = panel.regionAt(point.point);
        panel.setHover(index);
        if (index !== -1) {
          hovering = true;
          hitDistance = point.distance;
          controller.userData.hoverPanel = index;
        } else {
          controller.userData.hoverPanel = -1;
        }
      } else {
        controller.userData.hoverPanel = -1;
      }
    } else {
      controller.userData.hoverPanel = -1;
    }

    if (!hovering && controller.userData.hand === 'right' && wristMenu) {
      const point = intersectPlane(origin, direction, wristMenu.mesh);
      if (point) {
        const index = wristMenu.regionAt(point.point);
        wristMenu.setHover(index);
        if (index !== -1) {
          hovering = true;
          hitDistance = point.distance;
          controller.userData.hoverWrist = index;
        } else {
          controller.userData.hoverWrist = -1;
        }
      } else {
        wristMenu.setHover(-1);
        controller.userData.hoverWrist = -1;
      }
    } else {
      controller.userData.hoverWrist = -1;
    }

    if (!hovering && !panel.mesh.visible) {
      const target = targetFromRay(origin, direction, RAY_LENGTH);
      controller.userData.worldTarget = target;
      if (target) {
        hovering = true;
        hitDistance = target.distance;
        setHighlight(target.object);
      } else if (controller.userData.hand === 'right') {
        setHighlight(null);
      }
    } else {
      controller.userData.worldTarget = null;
    }

    if (ray) {
      ray.scale.z = hitDistance;
      ray.material.color.setHex(hovering ? 0xffd97a : 0xf0ede2);
      ray.material.opacity = hovering ? 0.95 : 0.55;
    }
  });
}

function intersectPlane(origin, direction, mesh) {
  if (!mesh.visible) return null;
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()));
  const meshPosition = new THREE.Vector3();
  mesh.getWorldPosition(meshPosition);
  const denominator = normal.dot(direction);
  if (Math.abs(denominator) < 0.0001) return null;
  const distance = normal.dot(new THREE.Vector3().subVectors(meshPosition, origin)) / denominator;
  if (distance < 0 || distance > 8) return null;
  const point = origin.clone().add(direction.clone().multiplyScalar(distance));
  return { point, distance };
}

function onSelectStart(event) {
  const controller = event.target;
  if (controller.userData.hoverPanel !== undefined && controller.userData.hoverPanel !== -1) {
    panel.activate(controller.userData.hoverPanel);
    setTimeout(() => invalidateXRPanel(), 30);
    return;
  }
  if (controller.userData.hoverWrist !== undefined && controller.userData.hoverWrist !== -1) {
    wristMenu.activate(controller.userData.hoverWrist);
    setTimeout(() => invalidateXRPanel(), 30);
    return;
  }
  if (controller.userData.worldTarget) {
    activateTarget(controller.userData.worldTarget);
    setTimeout(() => invalidateXRPanel(), 30);
  }
}

function onSelectEnd() {
  // Selection is edge-triggered on press; nothing to release.
}

export function xrComfortSummary() {
  return {
    locomotion: state.settings.xr.locomotion,
    snapAngle: state.settings.xr.snapAngle,
    vignette: state.settings.xr.vignette
  };
}

export function setXRComfort(key, value) {
  setSetting(`xr.${key}`, value);
}
