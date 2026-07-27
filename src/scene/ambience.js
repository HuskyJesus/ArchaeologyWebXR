/* Site ambience, synthesised rather than loaded, so the project stays a
   static site with no audio assets.

   The sound carries no information that is not also available as text: it is
   wind across the terrace, the river below the bluff, and occasional
   machinery from the highway corridor. The settings panel states this, and
   the mute control is honoured immediately. */

import { state } from '../core/state.js';
import { on, EVENTS } from '../core/events.js';

let context = null;
let master = null;
let started = false;

export const AMBIENCE_DESCRIPTION =
  'Ambient sound: steady wind across the open terrace, moving water from the river below the bluff, and intermittent machinery from the highway corridor to the south.';

export function initAmbience() {
  on(EVENTS.settingsChanged, applyMute);
  const start = () => {
    startAmbience();
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
  };
  window.addEventListener('pointerdown', start, { once: false });
  window.addEventListener('keydown', start, { once: false });
}

export function startAmbience() {
  if (started) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    context = new AudioContextClass();
  } catch (err) {
    return;
  }
  started = true;

  master = context.createGain();
  master.gain.value = state.settings.muted ? 0 : 0.16;
  master.connect(context.destination);

  master.connect(context.destination);
  addWind();
  addRiver();
  addMachinery();
}

function noiseBuffer(seconds = 4) {
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

function addWind() {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer(6);
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const gain = context.createGain();
  gain.gain.value = 0.6;
  const lfo = context.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = context.createGain();
  lfoGain.gain.value = 0.28;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start();
  lfo.start();
}

function addRiver() {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer(5);
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1400;
  filter.Q.value = 0.6;
  const gain = context.createGain();
  gain.gain.value = 0.22;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start();
}

function addMachinery() {
  const oscillator = context.createOscillator();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 62;
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 160;
  const gain = context.createGain();
  gain.gain.value = 0;
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  oscillator.start();

  // Occasional distant working sound rather than a constant drone.
  const schedule = () => {
    if (!context) return;
    const now = context.currentTime;
    const delay = 22 + Math.random() * 40;
    gain.gain.setValueAtTime(0, now + delay);
    gain.gain.linearRampToValueAtTime(0.08, now + delay + 1.5);
    gain.gain.linearRampToValueAtTime(0, now + delay + 6);
    setTimeout(schedule, (delay + 7) * 1000);
  };
  schedule();
}

function applyMute() {
  if (!master || !context) return;
  const target = state.settings.muted ? 0 : 0.16;
  master.gain.setTargetAtTime(target, context.currentTime, 0.2);
  if (!state.settings.muted && context.state === 'suspended') context.resume();
}
