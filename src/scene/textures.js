/* Canvas-generated textures. Everything is procedural so the project stays a
   dependency-free static site with no binary assets to lose. Results are
   cached because several of these are used by many meshes. */

import * as THREE from 'three';

const cache = new Map();

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function toTexture(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cached(key, build) {
  if (cache.has(key)) return cache.get(key);
  const value = build();
  cache.set(key, value);
  return value;
}

export function groundTexture() {
  return cached('ground', () => {
    const { canvas, ctx } = makeCanvas(1024, 1024);
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#6f7b45');
    grad.addColorStop(0.42, '#8a7a4f');
    grad.addColorStop(1, '#a0653f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 140; i += 1) {
      ctx.fillStyle = `rgba(${80 + Math.random() * 70},${55 + Math.random() * 50},${30 + Math.random() * 35},${0.05 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * 1024, Math.random() * 1024, 25 + Math.random() * 95, 15 + Math.random() * 55, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 900; i += 1) {
      ctx.fillStyle = `rgba(40,35,20,${Math.random() * 0.12})`;
      ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2 + Math.random() * 5, 1 + Math.random() * 3);
    }
    return toTexture(canvas, 1, 1);
  });
}

export function pathTexture() {
  return cached('path', () => {
    const { canvas, ctx } = makeCanvas(256, 256);
    ctx.fillStyle = '#9c8a63';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 400; i += 1) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 60},${100 + Math.random() * 50},${70 + Math.random() * 40},${0.2 + Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
    return toTexture(canvas, 1, 8);
  });
}

export function bumpTexture(size = 256, grain = 0.05) {
  return cached(`bump-${size}-${grain}`, () => {
    const { canvas, ctx } = makeCanvas(size, size);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < size * size * grain; i += 1) {
      const v = Math.random() * 70 + 30;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  });
}

export function waterTexture() {
  return cached('water', () => {
    const { canvas, ctx } = makeCanvas(256, 256);
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#4a7a98');
    grad.addColorStop(0.35, '#2e5570');
    grad.addColorStop(0.65, '#2e5570');
    grad.addColorStop(1, '#5a8ba8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 240; i += 1) {
      ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      ctx.lineTo(Math.random() * 256, Math.random() * 256);
      ctx.stroke();
    }
    return toTexture(canvas, 6, 3);
  });
}

/* Stratigraphic profile texture. `levels` controls how many bands are drawn
   as excavated, so a unit wall genuinely deepens as work proceeds. */
export function strataTexture(options = {}) {
  const { charcoalLens = false, sterileBand = false, seed = 0 } = options;
  const key = `strata-${charcoalLens}-${sterileBand}-${seed}`;
  return cached(key, () => {
    const W = 512;
    const H = 512;
    const { canvas, ctx } = makeCanvas(W, H);
    const bands = [
      { colour: '#7b6547', h: 0.16 },
      { colour: '#2c241d', h: 0.18 },
      { colour: '#8a5b3a', h: 0.2 },
      { colour: '#a8874f', h: 0.22 },
      { colour: '#c2ae7c', h: 0.24 }
    ];
    let y = 0;
    bands.forEach((band, bi) => {
      const bandH = band.h * H;
      ctx.fillStyle = band.colour;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 12) {
        ctx.lineTo(x, y + Math.sin(x * 0.04 + bi + seed) * 6 + (Math.random() - 0.5) * 3);
      }
      ctx.lineTo(W, y + bandH);
      ctx.lineTo(0, y + bandH);
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 160; i += 1) {
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`;
        ctx.fillRect(Math.random() * W, y + Math.random() * bandH, 5 + Math.random() * 9, 2 + Math.random() * 3);
      }
      for (let i = 0; i < 6; i += 1) {
        ctx.fillStyle = 'rgba(130,128,120,0.45)';
        ctx.beginPath();
        ctx.ellipse(Math.random() * W, y + Math.random() * bandH, 3 + Math.random() * 6, 2 + Math.random() * 4, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      y += bandH;
    });
    if (charcoalLens) {
      ctx.fillStyle = 'rgba(18,14,10,0.75)';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.35, W * 0.34, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (sterileBand) {
      ctx.fillStyle = 'rgba(212,196,150,0.85)';
      ctx.fillRect(0, H * 0.62, W, 22);
    }
    return toTexture(canvas, 1, 1);
  });
}

export function meshScreenTexture() {
  return cached('meshScreen', () => {
    const { canvas, ctx } = makeCanvas(128, 128);
    ctx.clearRect(0, 0, 128, 128);
    ctx.strokeStyle = 'rgba(70,70,70,0.9)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 128; i += 9) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/* Field-journal styled sign. Not cached, because every sign differs. */
export function signTexture(lines, options = {}) {
  const { width = 560, height = 200, background = '#6b5637', accent = '#d8c9a4' } = options;
  const { canvas, ctx } = makeCanvas(width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.fillStyle = '#f4eedd';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = height / (lines.length + 1);
  lines.forEach((line, i) => {
    ctx.font = i === 0
      ? `600 ${Math.round(height * 0.19)}px Georgia, serif`
      : `${Math.round(height * 0.12)}px Georgia, serif`;
    ctx.fillText(line, width / 2, lineH * (i + 1));
  });
  return toTexture(canvas, 1, 1);
}

export function skyTexture() {
  return cached('sky', () => {
    const w = 1024;
    const h = 512;
    const { canvas, ctx } = makeCanvas(w, h);
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#5f8fc6');
    grad.addColorStop(0.55, '#accdd9');
    grad.addColorStop(0.78, '#dcd0a0');
    grad.addColorStop(1, '#c0ac7a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    const sun = ctx.createRadialGradient(w * 0.7, h * 0.48, 0, w * 0.7, h * 0.48, 150);
    sun.addColorStop(0, 'rgba(255,250,225,0.95)');
    sun.addColorStop(1, 'rgba(255,250,225,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.48, 150, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 14; i += 1) {
      ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, h * (0.15 + Math.random() * 0.3), 60 + Math.random() * 140, 16 + Math.random() * 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

/* Generic label plate used for world-space station labels and XR panels. */
export function panelTexture(draw, width = 1024, height = 640) {
  const { canvas, ctx } = makeCanvas(width, height);
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { texture: tex, canvas, ctx };
}

export function disposeAll() {
  cache.forEach((tex) => {
    if (tex && typeof tex.dispose === 'function') tex.dispose();
  });
  cache.clear();
}
