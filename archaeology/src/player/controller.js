/* Player movement: keyboard, mouse look, and touch controls, with per-axis
   collision resolution so the learner slides along obstacles instead of
   sticking on their corners. */

import * as THREE from 'three';
import { SITE } from '../data/site.js';
import { state } from '../core/state.js';
import { prefersReducedMotion, isTouchLikely, byId } from '../core/dom.js';
import { camera, renderer } from '../scene/renderer.js';
import { isBlocked } from '../scene/registry.js';
import * as modal from '../ui/modal.js';

export const player = {
  position: new THREE.Vector3(0, 1.65, SITE.half - 12),
  yaw: Math.PI,
  pitch: 0,
  velocity: new THREE.Vector3(),
  bobTime: 0,
  frozen: false
};

const EYE_HEIGHT = 1.65;
const MAX_SPEED = 4.2;
const ACCEL = 18;
const DECEL = 14;
const PLAYER_RADIUS = 0.36;
const TURN_SPEED = 1.9;

const keys = Object.create(null);
let dragging = false;
let dragMoved = false;
let dragX = 0;
let dragY = 0;
let pointerLocked = false;

const touchMove = { active: false, x: 0, y: 0 };
const touchLook = { active: false, dx: 0, dy: 0 };

export function initPlayer(onPointerSelect) {
  document.addEventListener('keydown', (e) => {
    if (isTypingTarget(e.target)) return;
    keys[e.code] = true;
  });
  document.addEventListener('keyup', (e) => { keys[e.code] = false; });
  window.addEventListener('blur', () => { Object.keys(keys).forEach((k) => { keys[k] = false; }); });

  const canvas = renderer.domElement;
  canvas.addEventListener('mousedown', (e) => {
    if (modal.anyOpen() || player.frozen) return;
    dragging = true;
    dragMoved = false;
    dragX = e.clientX;
    dragY = e.clientY;
  });
  window.addEventListener('mousemove', (e) => {
    if (player.frozen) return;
    if (pointerLocked) {
      player.yaw -= e.movementX * 0.0022 * state.settings.sensitivity;
      player.pitch -= e.movementY * 0.0022 * state.settings.sensitivity;
    } else if (dragging) {
      const dx = e.clientX - dragX;
      const dy = e.clientY - dragY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      player.yaw -= dx * 0.004 * state.settings.sensitivity;
      player.pitch -= dy * 0.004 * state.settings.sensitivity;
      dragX = e.clientX;
      dragY = e.clientY;
    }
    clampPitch();
  });
  window.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    if (dragMoved || modal.anyOpen() || player.frozen) return;
    if (onPointerSelect) {
      const handled = onPointerSelect(e.clientX, e.clientY);
      if (handled) return;
    }
    if (!pointerLocked && !isTouchLikely()) {
      const request = renderer.domElement.requestPointerLock();
      if (request && typeof request.catch === 'function') request.catch(() => {});
    }
  });
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === renderer.domElement;
  });

  setupTouchControls();
}

function isTypingTarget(node) {
  if (!node) return false;
  const tag = node.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || node.isContentEditable;
}

function clampPitch() {
  player.pitch = Math.max(-1.15, Math.min(1.15, player.pitch));
}

export function updatePlayer(dt) {
  if (player.frozen) return;
  let forward = 0;
  let strafe = 0;
  const blocked = modal.anyOpen();
  if (!blocked) {
    if (keys.KeyW || keys.ArrowUp) forward += 1;
    if (keys.KeyS || keys.ArrowDown) forward -= 1;
    if (keys.KeyD) strafe += 1;
    if (keys.KeyA) strafe -= 1;
    if (keys.ArrowLeft) player.yaw += TURN_SPEED * dt;
    if (keys.ArrowRight) player.yaw -= TURN_SPEED * dt;
    if (touchMove.active) {
      strafe = touchMove.x;
      forward = -touchMove.y;
    }
  }

  const magnitude = Math.hypot(forward, strafe);
  let desiredX = 0;
  let desiredZ = 0;
  if (magnitude > 0.001) {
    const nf = forward / magnitude;
    const ns = strafe / magnitude;
    const fx = -Math.sin(player.yaw);
    const fz = -Math.cos(player.yaw);
    const rx = Math.cos(player.yaw);
    const rz = -Math.sin(player.yaw);
    desiredX = (fx * nf + rx * ns) * MAX_SPEED;
    desiredZ = (fz * nf + rz * ns) * MAX_SPEED;
  }

  const rate = (desiredX === 0 && desiredZ === 0) ? DECEL : ACCEL;
  player.velocity.x += (desiredX - player.velocity.x) * Math.min(1, rate * dt);
  player.velocity.z += (desiredZ - player.velocity.z) * Math.min(1, rate * dt);

  if (Math.hypot(player.velocity.x, player.velocity.z) > 0.02) {
    const resolved = resolveMovement(
      player.position.x + player.velocity.x * dt,
      player.position.z + player.velocity.z * dt
    );
    player.position.x = resolved.x;
    player.position.z = resolved.z;
    player.bobTime += dt * 8;
  }

  if (!blocked && touchLook.active) {
    player.yaw -= touchLook.dx * dt * 2.6 * state.settings.sensitivity;
    player.pitch -= touchLook.dy * dt * 2.6 * state.settings.sensitivity;
    clampPitch();
  }
  touchLook.dx = 0;
  touchLook.dy = 0;

  applyToCamera();
}

export function applyToCamera() {
  if (!camera) return; // text-only fallback runs without a 3D camera
  const reduced = state.settings.reducedMotion || prefersReducedMotion();
  const bob = (state.settings.cameraBob && !reduced) ? Math.sin(player.bobTime) * 0.03 : 0;
  camera.position.set(player.position.x, EYE_HEIGHT + bob, player.position.z);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
  camera.rotation.z = 0;
}

export function resolveMovement(nextX, nextZ) {
  const limit = SITE.half - 1.2;
  let x = player.position.x;
  let z = player.position.z;
  const clampedX = Math.max(-limit, Math.min(limit, nextX));
  const clampedZ = Math.max(-limit, Math.min(limit, nextZ));
  if (!isBlocked(clampedX, z, PLAYER_RADIUS)) x = clampedX;
  if (!isBlocked(x, clampedZ, PLAYER_RADIUS)) z = clampedZ;
  return { x, z };
}

export function faceTowards(x, z) {
  const dx = x - player.position.x;
  const dz = z - player.position.z;
  player.yaw = Math.atan2(-dx, -dz);
  player.pitch = 0;
  applyToCamera();
}

/* ---------- touch ---------- */

function setupTouchControls() {
  const joystick = byId('joystickBase');
  const stick = byId('joystickThumb');
  const lookZone = byId('lookZone');
  if (!joystick || !stick || !lookZone) return;

  let moveTouchId = null;
  let originX = 0;
  let originY = 0;
  const maxDistance = 42;

  joystick.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches[0];
    moveTouchId = touch.identifier;
    const rect = joystick.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
    touchMove.active = true;
    e.preventDefault();
  }, { passive: false });

  joystick.addEventListener('touchmove', (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== moveTouchId) continue;
      let dx = touch.clientX - originX;
      let dy = touch.clientY - originY;
      const distance = Math.hypot(dx, dy);
      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      touchMove.x = dx / maxDistance;
      touchMove.y = dy / maxDistance;
    }
    e.preventDefault();
  }, { passive: false });

  const endMove = (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== moveTouchId) continue;
      moveTouchId = null;
      touchMove.active = false;
      touchMove.x = 0;
      touchMove.y = 0;
      stick.style.transform = 'translate(0px, 0px)';
    }
  };
  joystick.addEventListener('touchend', endMove);
  joystick.addEventListener('touchcancel', endMove);

  let lookTouchId = null;
  let lastX = 0;
  let lastY = 0;
  lookZone.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches[0];
    lookTouchId = touch.identifier;
    lastX = touch.clientX;
    lastY = touch.clientY;
    touchLook.active = true;
  }, { passive: true });
  lookZone.addEventListener('touchmove', (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== lookTouchId) continue;
      touchLook.dx += (touch.clientX - lastX) * 4;
      touchLook.dy += (touch.clientY - lastY) * 4;
      lastX = touch.clientX;
      lastY = touch.clientY;
    }
  }, { passive: true });
  const endLook = (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== lookTouchId) continue;
      lookTouchId = null;
      touchLook.active = false;
    }
  };
  lookZone.addEventListener('touchend', endLook);
  lookZone.addEventListener('touchcancel', endLook);
}
