/* Close-inspection drawings for survey objects.

   These are schematic field-illustration style renderings, not photographs.
   Each one draws only the attributes the learner is being asked to reason
   from, at a consistent scale with a scale bar, so the drawing is genuinely
   part of the evidence rather than decoration. */

const INK = '#3a3126';
const PAPER_TOP = '#efe7d2';
const PAPER_BOTTOM = '#cfc2a4';

export function drawInspection(canvas, item) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, PAPER_TOP);
  grad.addColorStop(1, PAPER_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(40,32,22,0.10)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.76, w * 0.26, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(w / 2, h * 0.46);
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  const painter = PAINTERS[item.shape] || PAINTERS.cobble;
  painter(ctx);
  ctx.restore();

  ctx.fillStyle = INK;
  ctx.font = '600 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(item.name, 16, 24);
  ctx.font = '13px Georgia, serif';
  wrapText(ctx, item.detail || '', 16, 44, w - 32, 16, 2);

  drawScaleBar(ctx, w, h);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(/\s+/);
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i += 1) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      lines += 1;
      line = words[i];
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}

function drawScaleBar(ctx, w, h) {
  const barW = 120;
  const x = w - barW - 18;
  const y = h - 26;
  ctx.fillStyle = INK;
  ctx.fillRect(x, y, barW, 9);
  ctx.fillStyle = '#f2ecdc';
  ctx.fillRect(x, y, barW / 2, 9);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, barW, 9);
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = INK;
  ctx.fillText('10 cm', x - 8, y + 9);
  ctx.textAlign = 'left';
}

function fillPath(ctx, colour, path) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  path();
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function hatch(ctx, lines, width = 1.6) {
  ctx.save();
  ctx.lineWidth = width;
  lines.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  ctx.restore();
}

const PAINTERS = {
  biface(ctx) {
    fillPath(ctx, '#8c8b83', () => {
      ctx.moveTo(0, -95);
      ctx.quadraticCurveTo(52, -30, 44, 60);
      ctx.lineTo(-44, 62);
      ctx.quadraticCurveTo(-52, -30, 0, -95);
    });
    hatch(ctx, [
      [-30, -60, -6, -18], [0, -70, 14, -20], [26, -50, 8, -8],
      [-34, 10, -10, 40], [30, 8, 8, 38], [-2, 0, 2, 44]
    ]);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-44, 62);
    ctx.lineTo(44, 60);
    ctx.stroke();
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('snapped', 0, 80);
  },
  debitage(ctx) {
    const flakes = [
      [-105, -30, 42], [-40, -55, 34], [25, -40, 46], [90, -18, 28],
      [-80, 30, 30], [-14, 26, 38], [52, 34, 26], [104, 26, 18],
      [-46, 66, 20], [16, 70, 16], [70, 66, 14]
    ];
    flakes.forEach(([fx, fy, size], i) => {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(i * 0.7);
      fillPath(ctx, i % 3 === 0 ? '#9a9890' : '#87857d', () => {
        ctx.moveTo(0, -size * 0.6);
        ctx.lineTo(size * 0.55, -size * 0.1);
        ctx.lineTo(size * 0.2, size * 0.6);
        ctx.lineTo(-size * 0.5, size * 0.25);
      });
      ctx.restore();
    });
  },
  sherd(ctx) {
    fillPath(ctx, '#a2643f', () => {
      ctx.arc(0, 96, 130, Math.PI * 1.18, Math.PI * 1.82);
      ctx.lineTo(66, -6);
      ctx.arc(0, 96, 78, Math.PI * 1.79, Math.PI * 1.21, true);
    });
    const marks = [];
    for (let x = -74; x <= 74; x += 13) marks.push([x, -46, x + 12, 6]);
    hatch(ctx, marks, 2.2);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('cord impressions', 0, 42);
  },
  fcr(ctx) {
    const rocks = [[-92, -10, 34], [-30, -34, 40], [34, -22, 36], [86, 6, 30], [-54, 44, 32], [18, 48, 34], [74, 52, 24]];
    rocks.forEach(([rx, ry, size], i) => {
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(i * 1.1);
      fillPath(ctx, i % 2 ? '#8d5240' : '#a35f45', () => {
        ctx.moveTo(-size * 0.8, size * 0.1);
        ctx.lineTo(-size * 0.4, -size * 0.7);
        ctx.lineTo(size * 0.4, -size * 0.75);
        ctx.lineTo(size * 0.85, -size * 0.05);
        ctx.lineTo(size * 0.35, size * 0.7);
        ctx.lineTo(-size * 0.5, size * 0.65);
      });
      hatch(ctx, [[-size * 0.3, -size * 0.4, size * 0.1, size * 0.4], [size * 0.1, -size * 0.5, size * 0.3, size * 0.3]], 1.2);
      ctx.restore();
    });
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('reddened and crazed, over dark soil', 0, 92);
  },
  groundstone(ctx) {
    fillPath(ctx, '#9d8f77', () => {
      ctx.moveTo(-96, 10);
      ctx.quadraticCurveTo(-80, -66, 6, -66);
      ctx.quadraticCurveTo(88, -62, 96, 6);
      ctx.lineTo(92, 44);
      ctx.lineTo(-92, 46);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-90, 20, 180, 24);
    ctx.strokeRect(-90, 20, 180, 24);
    const striae = [];
    for (let x = -84; x <= 84; x += 11) striae.push([x, 25, x + 4, 40]);
    hatch(ctx, striae, 1.1);
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('worn, polished face with striations', 0, 70);
  },
  cobble(ctx) {
    fillPath(ctx, '#928471', () => {
      ctx.ellipse(0, 0, 104, 68, -0.12, 0, Math.PI * 2);
    });
    ctx.strokeStyle = 'rgba(58,49,38,0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 104 - i * 22, 68 - i * 16, -0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = INK;
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('evenly rounded on all surfaces', 0, 92);
  },
  rootcast(ctx) {
    ctx.strokeStyle = '#4a3f30';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-110, -40);
    ctx.quadraticCurveTo(-20, -10, 30, 20);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.quadraticCurveTo(64, 34, 96, 24);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.quadraticCurveTo(54, 52, 76, 74);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-42, -22);
    ctx.quadraticCurveTo(-30, 16, -14, 46);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('branching, tapering, diffuse edges', 0, 96);
  },
  stain(ctx) {
    fillPath(ctx, '#332a20', () => {
      ctx.ellipse(0, 0, 96, 74, 0.08, 0, Math.PI * 2);
    });
    ctx.fillStyle = '#111';
    [[-40, -22], [12, -34], [46, 8], [-18, 30], [30, 40], [-56, 14]].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#ddd6c2';
    [[-8, -6, 16, 7], [24, 20, 13, 6]].forEach(([bx, by, bw, bh]) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(0.4);
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    });
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('sharp edge, charcoal and bone within', 0, 98);
  },
  alignment(ctx) {
    const slabs = [[-124, 24], [-84, 12], [-42, 4], [0, 0], [42, 2], [84, 10], [122, 24]];
    slabs.forEach(([sx, sy], i) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate((i - 3) * 0.05);
      fillPath(ctx, '#a29782', () => {
        ctx.moveTo(-20, -16);
        ctx.lineTo(20, -18);
        ctx.lineTo(22, 16);
        ctx.lineTo(-19, 17);
      });
      ctx.restore();
    });
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = 'rgba(58,49,38,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-140, 34);
    ctx.quadraticCurveTo(0, -6, 140, 34);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = INK;
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('consistent orientation, curving across the slope', 0, 76);
  },
  depression(ctx) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-150, -20);
    ctx.lineTo(-90, -20);
    ctx.bezierCurveTo(-40, 34, 40, 34, 90, -20);
    ctx.lineTo(150, -20);
    ctx.stroke();
    ctx.fillStyle = 'rgba(74,90,50,0.4)';
    ctx.beginPath();
    ctx.moveTo(-90, -20);
    ctx.bezierCurveTo(-40, 34, 40, 34, 90, -20);
    ctx.closePath();
    ctx.fill();
    for (let x = -84; x <= 84; x += 12) {
      const depth = Math.cos((x / 90) * (Math.PI / 2)) * 30;
      ctx.beginPath();
      ctx.moveTo(x, -20 + depth);
      ctx.lineTo(x + 2, -20 + depth - 14);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('shallow saucer profile, denser vegetation inside', 0, 68);
    ctx.fillText('section through the hollow', 0, -60);
  },
  can(ctx) {
    fillPath(ctx, '#b7bcbd', () => {
      ctx.moveTo(-92, -46);
      ctx.quadraticCurveTo(0, -74, 92, -32);
      ctx.lineTo(76, 52);
      ctx.quadraticCurveTo(0, 80, -80, 46);
    });
    ctx.fillStyle = '#8d4f3c';
    ctx.fillRect(-74, -8, 148, 18);
    ctx.strokeRect(-74, -8, 148, 18);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-88, -30);
    ctx.quadraticCurveTo(0, -56, 88, -18);
    ctx.stroke();
    ctx.lineWidth = 3.5;
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('rolled seam, printed lettering', 0, 96);
  },
  shell(ctx) {
    const valves = [[-96, -22, 1.0], [-34, -40, 0.85], [26, -26, 1.05], [86, -8, 0.8], [-64, 28, 0.9], [-2, 34, 1.0], [58, 40, 0.85]];
    valves.forEach(([vx, vy, s], i) => {
      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(i * 0.9);
      ctx.scale(s, s);
      fillPath(ctx, i === 2 || i === 5 ? '#6b5a4c' : '#cdc3ad', () => {
        ctx.ellipse(0, 0, 34, 20, 0, 0, Math.PI * 2);
      });
      ctx.lineWidth = 1;
      for (let r = 8; r < 32; r += 7) {
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.58, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.lineWidth = 3.5;
      ctx.restore();
    });
    ctx.fillStyle = '#e2ddd0';
    [[-20, 62], [30, 66], [4, 74]].forEach(([bx, by]) => {
      ctx.save();
      ctx.translate(bx, by);
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    });
    ctx.lineWidth = 3.5;
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.fillText('two valves burnt, fish bone between', 0, 96);
  }
};
