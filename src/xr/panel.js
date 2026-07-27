/* World-space panel for immersive sessions.

   HTML overlays are invisible inside a headset, so the panel mirrors
   whichever modal is currently on top into a canvas texture on a plane in
   front of the learner. Controller rays hit the plane, the hit point is
   converted to a canvas coordinate, and pressing select dispatches a real
   click on the corresponding DOM control. That means the stations behave
   identically in and out of VR, because they are the same code.

   A second, smaller panel is attached to the left controller as a wrist
   menu for the notebook, evidence, objective and settings. */

import * as THREE from 'three';

const WIDTH_PX = 1100;
const HEIGHT_PX = 1400;
const PANEL_WIDTH = 1.1;
const PANEL_HEIGHT = PANEL_WIDTH * (HEIGHT_PX / WIDTH_PX);

const COLOURS = {
  paper: '#efe7d2',
  ink: '#2f2a22',
  soft: '#5f5645',
  rule: 'rgba(47,42,34,0.25)',
  accent: '#8a5a2b',
  accentText: '#fdf8ec',
  good: '#2f6b4f',
  warn: '#8a6b2a',
  bad: '#8c3a2b'
};

export class XRPanel {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH_PX;
    this.canvas.height = HEIGHT_PX;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;

    const geometry = new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT);
    const material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, toneMapped: false });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.name = 'xrPanel';
    this.mesh.visible = false;
    this.mesh.renderOrder = 10;

    this.regions = [];
    this.scrollOffset = 0;
    this.contentHeight = 0;
    this.hoverIndex = -1;
    this.sourceId = null;
    this.dirty = true;
  }

  get object3d() {
    return this.mesh;
  }

  setVisible(visible) {
    this.mesh.visible = visible;
  }

  /* Places the panel at a comfortable reading distance in front of the head,
     without following every small head movement. */
  placeInFrontOf(cameraObject, distance = 1.25) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraObject.quaternion);
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    const position = cameraObject.position.clone().add(forward.multiplyScalar(distance));
    position.y = cameraObject.position.y - 0.12;
    this.mesh.position.copy(position);
    this.mesh.lookAt(cameraObject.position.x, position.y, cameraObject.position.z);
  }

  scroll(amount) {
    const maxScroll = Math.max(0, this.contentHeight - HEIGHT_PX + 120);
    this.scrollOffset = Math.max(0, Math.min(maxScroll, this.scrollOffset + amount));
    this.dirty = true;
  }

  /* Converts a world-space intersection point into a canvas coordinate. */
  pointToCanvas(worldPoint) {
    const local = this.mesh.worldToLocal(worldPoint.clone());
    const u = (local.x + PANEL_WIDTH / 2) / PANEL_WIDTH;
    const v = 1 - (local.y + PANEL_HEIGHT / 2) / PANEL_HEIGHT;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    return { x: u * WIDTH_PX, y: v * HEIGHT_PX };
  }

  regionAt(worldPoint) {
    const point = this.pointToCanvas(worldPoint);
    if (!point) return -1;
    for (let i = 0; i < this.regions.length; i += 1) {
      const r = this.regions[i];
      if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return i;
    }
    return -1;
  }

  setHover(index) {
    if (this.hoverIndex === index) return;
    this.hoverIndex = index;
    this.dirty = true;
  }

  activate(index) {
    const region = this.regions[index];
    if (!region || !region.element) return false;
    region.element.click();
    this.dirty = true;
    return true;
  }

  /* Builds a drawable document from a DOM panel. Only visible, meaningful
     nodes are taken, and buttons keep a reference back to the element so a
     press in VR is a real press. */
  syncFrom(panelElement) {
    if (!panelElement) {
      this.setVisible(false);
      this.sourceId = null;
      return;
    }
    if (this.sourceId !== panelElement.id) {
      this.scrollOffset = 0;
      this.sourceId = panelElement.id;
    }
    this.document = readDocument(panelElement);
    this.dirty = true;
    this.setVisible(true);
  }

  refresh() {
    if (!this.dirty || !this.document) return;
    this.draw(this.document);
    this.dirty = false;
    this.texture.needsUpdate = true;
  }

  markDirty() {
    this.dirty = true;
  }

  draw(doc) {
    const ctx = this.ctx;
    ctx.fillStyle = COLOURS.paper;
    ctx.fillRect(0, 0, WIDTH_PX, HEIGHT_PX);
    ctx.strokeStyle = COLOURS.accent;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, WIDTH_PX - 10, HEIGHT_PX - 10);

    this.regions = [];
    const marginX = 54;
    const maxWidth = WIDTH_PX - marginX * 2;
    let y = 84 - this.scrollOffset;

    ctx.fillStyle = COLOURS.ink;
    ctx.textBaseline = 'top';
    ctx.font = '600 46px Georgia, serif';
    y = drawWrapped(ctx, doc.title || 'Redstone Bluff', marginX, y, maxWidth, 54);
    y += 12;
    ctx.strokeStyle = COLOURS.rule;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginX, y);
    ctx.lineTo(WIDTH_PX - marginX, y);
    ctx.stroke();
    y += 26;

    doc.blocks.forEach((block) => {
      if (block.type === 'heading') {
        ctx.fillStyle = COLOURS.accent;
        ctx.font = '600 34px Georgia, serif';
        y = drawWrapped(ctx, block.text, marginX, y, maxWidth, 42) + 12;
      } else if (block.type === 'text') {
        ctx.fillStyle = COLOURS.soft;
        ctx.font = '28px Georgia, serif';
        y = drawWrapped(ctx, block.text, marginX, y, maxWidth, 38) + 14;
      } else if (block.type === 'status') {
        ctx.fillStyle = block.tone === 'good' ? COLOURS.good : (block.tone === 'bad' ? COLOURS.bad : COLOURS.warn);
        ctx.font = '600 28px Georgia, serif';
        y = drawWrapped(ctx, block.text, marginX, y, maxWidth, 38) + 14;
      } else if (block.type === 'button') {
        const height = measureWrapped(ctx, block.text, maxWidth - 48, 34, '28px Georgia, serif') + 36;
        const index = this.regions.length;
        const hovered = this.hoverIndex === index;
        ctx.fillStyle = hovered ? COLOURS.accent : 'rgba(47,42,34,0.08)';
        roundRect(ctx, marginX, y, maxWidth, height, 12);
        ctx.fill();
        ctx.strokeStyle = block.disabled ? 'rgba(47,42,34,0.2)' : COLOURS.accent;
        ctx.lineWidth = 3;
        roundRect(ctx, marginX, y, maxWidth, height, 12);
        ctx.stroke();
        ctx.fillStyle = block.disabled ? 'rgba(47,42,34,0.35)' : (hovered ? COLOURS.accentText : COLOURS.ink);
        ctx.font = '28px Georgia, serif';
        drawWrapped(ctx, block.text, marginX + 24, y + 18, maxWidth - 48, 34);
        this.regions.push({ x: marginX, y, w: maxWidth, h: height, element: block.element });
        y += height + 14;
      }
    });

    this.contentHeight = y + this.scrollOffset;

    if (this.contentHeight > HEIGHT_PX) {
      const trackH = HEIGHT_PX - 120;
      const thumbH = Math.max(60, trackH * (HEIGHT_PX / this.contentHeight));
      const maxScroll = Math.max(1, this.contentHeight - HEIGHT_PX + 120);
      const thumbY = 60 + (this.scrollOffset / maxScroll) * (trackH - thumbH);
      ctx.fillStyle = 'rgba(47,42,34,0.12)';
      roundRect(ctx, WIDTH_PX - 34, 60, 14, trackH, 7);
      ctx.fill();
      ctx.fillStyle = COLOURS.accent;
      roundRect(ctx, WIDTH_PX - 34, thumbY, 14, thumbH, 7);
      ctx.fill();
      ctx.fillStyle = COLOURS.soft;
      ctx.font = '22px Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText('Push the thumbstick up or down to scroll', WIDTH_PX - 54, HEIGHT_PX - 44);
      ctx.textAlign = 'left';
    }
  }
}

function readDocument(panelElement) {
  const card = panelElement.querySelector('.panelCard') || panelElement;
  const titleEl = card.querySelector('h2');
  const doc = { title: titleEl ? titleEl.textContent.trim() : 'Redstone Bluff', blocks: [] };
  const seen = new Set();

  const walk = (node) => {
    if (!node || seen.has(node)) return;
    if (node.nodeType === Node.TEXT_NODE) return;
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.offsetParent === null && node !== card) return;
    const tag = node.tagName;

    if (tag === 'BUTTON') {
      seen.add(node);
      const text = node.textContent.trim();
      if (text) doc.blocks.push({ type: 'button', text, element: node, disabled: node.disabled });
      return;
    }
    if (tag === 'LABEL' && node.querySelector('input[type=checkbox]')) {
      seen.add(node);
      const input = node.querySelector('input[type=checkbox]');
      const text = `${input.checked ? '[x] ' : '[ ] '}${node.textContent.trim()}`;
      doc.blocks.push({ type: 'button', text, element: input, disabled: false });
      return;
    }
    if (tag === 'H2') {
      seen.add(node);
      return;
    }
    if (tag === 'H3' || tag === 'H4') {
      seen.add(node);
      const text = node.textContent.trim();
      if (text) doc.blocks.push({ type: 'heading', text });
      return;
    }
    if (tag === 'TEXTAREA' || tag === 'INPUT') {
      seen.add(node);
      doc.blocks.push({ type: 'text', text: 'Text entry is not available inside the headset. Remove the headset to write the report, or use the browser view.' });
      return;
    }
    if (node.classList && node.classList.contains('feedback')) {
      seen.add(node);
      const tone = node.classList.contains('feedback-good') ? 'good'
        : (node.classList.contains('feedback-bad') ? 'bad' : 'warn');
      doc.blocks.push({ type: 'status', text: node.textContent.trim(), tone });
      return;
    }
    if (['P', 'LI', 'SUMMARY'].includes(tag) || (node.classList && (node.classList.contains('recordCardLine') || node.classList.contains('recordCardTitle') || node.classList.contains('noticeBox') || node.classList.contains('promptLine') || node.classList.contains('promptDetail')))) {
      seen.add(node);
      const text = node.textContent.trim();
      if (text) doc.blocks.push({ type: 'text', text });
      return;
    }
    [...node.children].forEach(walk);
  };

  [...card.children].forEach(walk);
  if (!doc.blocks.length) doc.blocks.push({ type: 'text', text: 'This panel has no content to show.' });
  return doc;
}

function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = '';
  let cursorY = y;
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      if (cursorY > -lineHeight && cursorY < HEIGHT_PX) ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line && cursorY > -lineHeight && cursorY < HEIGHT_PX) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

function measureWrapped(ctx, text, maxWidth, lineHeight, font) {
  const previous = ctx.font;
  ctx.font = font;
  const words = String(text).split(/\s+/);
  let line = '';
  let lines = 1;
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines += 1;
      line = word;
    } else {
      line = candidate;
    }
  });
  ctx.font = previous;
  return lines * lineHeight;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ---------- wrist menu ---------- */

const WRIST_W = 512;
const WRIST_H = 320;

export class XRWristMenu {
  constructor(items) {
    this.items = items;
    this.canvas = document.createElement('canvas');
    this.canvas.width = WRIST_W;
    this.canvas.height = WRIST_H;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.19, 0.19 * (WRIST_H / WRIST_W)),
      new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, toneMapped: false })
    );
    this.mesh.position.set(0, 0.06, -0.09);
    this.mesh.rotation.set(-0.9, 0, 0);
    this.hoverIndex = -1;
    this.regions = [];
    this.draw();
  }

  get object3d() {
    return this.mesh;
  }

  regionAt(worldPoint) {
    const local = this.mesh.worldToLocal(worldPoint.clone());
    const size = new THREE.Vector2(0.19, 0.19 * (WRIST_H / WRIST_W));
    const u = (local.x + size.x / 2) / size.x;
    const v = 1 - (local.y + size.y / 2) / size.y;
    if (u < 0 || u > 1 || v < 0 || v > 1) return -1;
    const x = u * WRIST_W;
    const y = v * WRIST_H;
    for (let i = 0; i < this.regions.length; i += 1) {
      const r = this.regions[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }

  setHover(index) {
    if (this.hoverIndex === index) return;
    this.hoverIndex = index;
    this.draw();
  }

  activate(index) {
    const item = this.items[index];
    if (!item) return false;
    item.action();
    return true;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WRIST_W, WRIST_H);
    ctx.fillStyle = 'rgba(30,26,20,0.92)';
    roundRect(ctx, 0, 0, WRIST_W, WRIST_H, 22);
    ctx.fill();
    ctx.strokeStyle = COLOURS.accent;
    ctx.lineWidth = 5;
    roundRect(ctx, 3, 3, WRIST_W - 6, WRIST_H - 6, 20);
    ctx.stroke();

    this.regions = [];
    const rowH = (WRIST_H - 32) / this.items.length;
    ctx.textBaseline = 'middle';
    this.items.forEach((item, i) => {
      const y = 16 + i * rowH;
      const hovered = this.hoverIndex === i;
      ctx.fillStyle = hovered ? COLOURS.accent : 'rgba(255,255,255,0.06)';
      roundRect(ctx, 16, y + 3, WRIST_W - 32, rowH - 8, 10);
      ctx.fill();
      ctx.fillStyle = hovered ? COLOURS.accentText : '#f0ece0';
      ctx.font = '600 30px Georgia, serif';
      ctx.fillText(item.label, 38, y + rowH / 2);
      this.regions.push({ x: 16, y: y + 3, w: WRIST_W - 32, h: rowH - 8 });
    });
    this.texture.needsUpdate = true;
  }
}
