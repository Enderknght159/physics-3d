/* =========================================================
   Widgets — physics, SVG helpers, canvas illustration kit
   ========================================================= */
(function () {
  'use strict';
  const App = window.App;
  const { clamp, lerp, rad, deg, fmt } = App.util;

  const g = 10;

  const physics = {
    g,
    ke: (m, v) => 0.5 * m * v * v,
    momentum: (m, v) => m * v,

    elastic1D(m1, v1, m2, v2) {
      const M = m1 + m2;
      return {
        v1: ((m1 - m2) * v1 + 2 * m2 * v2) / M,
        v2: ((m2 - m1) * v2 + 2 * m1 * v1) / M
      };
    },

    inelastic(m1, v1, m2, v2) {
      return { v: (m1 * v1 + m2 * v2) / (m1 + m2) };
    },

    restitution(e, m1, v1, m2, v2) {
      const M = m1 + m2;
      return {
        v1: ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / M,
        v2: ((m2 - e * m1) * v2 + (1 + e) * m1 * v1) / M
      };
    },

    projectile(v0, thetaDeg, opts = {}) {
      const h0 = opts.h0 || 0;
      const gg = opts.g || g;
      const th = rad(thetaDeg);
      const vx = v0 * Math.cos(th);
      const vy0 = v0 * Math.sin(th);
      const tPeak = vy0 / gg;
      const peak = h0 + vy0 * vy0 / (2 * gg);
      const disc = vy0 * vy0 + 2 * gg * h0;
      const tFlight = (vy0 + Math.sqrt(Math.max(0, disc))) / gg;
      const range = vx * tFlight;
      return {
        th, vx, vy0, tPeak, peak, tFlight, range, h0,
        x: (t) => vx * t,
        y: (t) => h0 + vy0 * t - 0.5 * gg * t * t,
        vxAt: () => vx,
        vyAt: (t) => vy0 - gg * t,
        vAt: (t) => Math.hypot(vx, vy0 - gg * t)
      };
    },

    pendulum(m, M, v, l) {
      const vp = m * v / (m + M);
      const h = vp * vp / (2 * g);
      const theta = Math.acos(clamp(1 - h / l, -1, 1));
      const vBack = (m + M) / m * Math.sqrt(2 * g * h);
      return { vp, h, theta, vBack, ratio: m / (m + M) };
    },

    landingOnSlope(v0, alphaDeg, opts = {}) {
      const a = rad(alphaDeg);
      const gg = opts.g || g;
      const t = 2 * v0 * Math.tan(a) / gg;
      const x = v0 * t;
      const y = 0.5 * gg * t * t;
      const d = x / Math.cos(a);
      const speed = Math.hypot(v0, gg * t);
      return { t, x, y, d, speed };
    },

    timeToFall(h, opts = {}) { return Math.sqrt(2 * h / (opts.g || g)); }
  };
  App.physics = physics;

  /* ---------------- segmented control ---------------- */
  App.seg = function (host, items, onChange, active = 0) {
    const h = App.util.qs(host);
    if (!h) return null;
    const wrap = document.createElement('div');
    wrap.className = 'seg';
    wrap.setAttribute('role', 'group');
    items.forEach((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = typeof it === 'string' ? it : it.label;
      b.setAttribute('aria-pressed', i === active ? 'true' : 'false');
      b.addEventListener('click', () => {
        Array.from(wrap.children).forEach((c, j) => c.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
        if (onChange) onChange(i, typeof it === 'string' ? it : it.value);
      });
      wrap.appendChild(b);
    });
    h.appendChild(wrap);
    return wrap;
  };

  /* ---------------- static SVG helpers ---------------- */
  function col(name) {
    return name === 'accent' ? 'var(--accent)'
      : name === 'teal' ? 'var(--teal)'
      : name === 'muted' ? 'var(--ink-3)'
      : name === 'paper' ? 'var(--paper)'
      : name === 'cream' ? 'var(--cream)'
      : 'var(--ink)';
  }
  App.col = col;

  App.arrowSVG = function (x1, y1, x2, y2, o = {}) {
    const c = col(o.color || 'accent');
    const w = o.w == null ? 2.4 : o.w;
    const head = o.head == null ? 9 : o.head;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const hx = x2 - ux * head, hy = y2 - uy * head;
    const bx = x2 - ux * head, by = y2 - uy * head;
    const p1x = bx - uy * head * .46, p1y = by + ux * head * .46;
    const p2x = bx + uy * head * .46, p2y = by - ux * head * .46;
    let label = '';
    if (o.label) {
      const lx = o.labelX != null ? o.labelX : (x1 + x2) / 2 + (o.lx || 0);
      const ly = o.labelY != null ? o.labelY : (y1 + y2) / 2 + (o.ly == null ? -12 : o.ly);
      label = `<text x="${lx}" y="${ly}" text-anchor="${o.labelAnchor || 'middle'}" class="d-label" fill="${c}">${o.label}</text>`;
    }
    const dash = o.dash ? ` stroke-dasharray="${o.dash === true ? '5 6' : o.dash}"` : '';
    return `<g>${o.double ? `<path d="M${x1},${y1} L${x1 + ux * head - uy * head * .46},${y1 + uy * head + ux * head * .46} L${x1 + ux * head + uy * head * .46},${y1 + uy * head - ux * head * .46} Z" fill="${c}"/>` : ''}
      <line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${c}" stroke-width="${w}" ${o.cap === false ? '' : 'stroke-linecap="round"'}${dash}/>
      <path d="M${x2},${y2} L${p1x},${p1y} L${p2x},${p2y} Z" fill="${c}"/>
      ${label}</g>`;
  };

  App.dimSVG = function (x1, y1, x2, y2, label, o = {}) {
    const c = col(o.color || 'muted');
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const nx = -uy, ny = ux;
    const tick = o.tick || 5;
    const midx = (x1 + x2) / 2 + nx * (o.off || 0);
    const midy = (y1 + y2) / 2 + ny * (o.off || 0);
    return `<g>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="1.2" stroke-dasharray="4 5"/>
      ${App.arrowSVG(x1, y1, x2, y2, { color: o.color || 'muted', w: 1.4, head: 6 })}
      ${App.arrowSVG(x2, y2, x1, y1, { color: o.color || 'muted', w: 1.4, head: 6 })}
      <line x1="${x1 - nx * tick}" y1="${y1 - ny * tick}" x2="${x1 + nx * tick}" y2="${y1 + ny * tick}" stroke="${c}" stroke-width="1.2"/>
      <line x1="${x2 - nx * tick}" y1="${y2 - ny * tick}" x2="${x2 + nx * tick}" y2="${y2 + ny * tick}" stroke="${c}" stroke-width="1.2"/>
      <text x="${midx + (o.labelDx || 0)}" y="${midy + (o.labelDy || -8)}" text-anchor="${o.anchor || 'middle'}" class="d-label" fill="${c}">${label}</text>
    </g>`;
  };

  App.svgText = function (x, y, text, o = {}) {
    return `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" class="d-label ${o.cls || ''}" fill="${o.color ? col(o.color) : 'var(--ink)'}" ${o.size ? `style="font-size:${o.size}px"` : ''} ${o.rtl ? 'direction="rtl"' : ''}>${text}</text>`;
  };

  /* ---------------- canvas illustration kit ---------------- */
  const draw = {};

  draw.ground = function (s, y, x0, x1, o = {}) {
    const th = s.theme();
    s.line(x0, y, x1, y, { color: o.color || th.ink, width: o.width || 2, alpha: o.alpha == null ? .55 : o.alpha });
    const n = o.hatch === false ? 0 : Math.floor((x1 - x0) / (o.gap || 18));
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (o.gap || 18) + 6;
      s.line(x, y + 2, x - 5, y + 8, { color: o.color || th.ink, width: 1, alpha: .22 });
    }
  };

  draw.person = function (s, x, y, size, o = {}) {
    const th = s.theme();
    const c = o.color || th.ink;
    const w = o.width || 2.4;
    const h = size;
    const headR = h * .13;
    const headY = y - h + headR;
    const shoulderY = y - h + headR * 2.25;
    const hipY = y - h * .42;
    s.ctx.save();
    s.ctx.strokeStyle = c; s.ctx.fillStyle = c; s.ctx.lineWidth = w; s.ctx.lineCap = 'round'; s.ctx.lineJoin = 'round';
    // head
    s.ctx.beginPath(); s.ctx.arc(x, headY, headR, 0, Math.PI * 2); s.ctx.stroke();
    // torso
    s.ctx.beginPath(); s.ctx.moveTo(x, shoulderY); s.ctx.lineTo(x + (o.lean || 0) * size, hipY); s.ctx.stroke();
    // arms
    const ax = x + (o.lean || 0) * size * .5;
    const arm = o.arm || 0;
    if (o.armsUp) {
      s.ctx.beginPath(); s.ctx.moveTo(x, shoulderY + h * .05); s.ctx.lineTo(x - h * .16, shoulderY - h * .12); s.ctx.stroke();
      s.ctx.beginPath(); s.ctx.moveTo(x, shoulderY + h * .05); s.ctx.lineTo(x + h * .16, shoulderY - h * .12); s.ctx.stroke();
    } else {
      s.ctx.beginPath(); s.ctx.moveTo(x, shoulderY + h * .04);
      s.ctx.lineTo(x - h * .13, shoulderY + h * .22 - arm * h * .12); s.ctx.lineTo(x - h * .12, shoulderY + h * .38 - arm * h * .2); s.ctx.stroke();
      s.ctx.beginPath(); s.ctx.moveTo(x, shoulderY + h * .04);
      s.ctx.lineTo(x + h * .13, shoulderY + h * .2 + arm * h * .12); s.ctx.lineTo(x + h * .12, shoulderY + h * .36 + arm * h * .2); s.ctx.stroke();
    }
    // legs
    const hipX = x + (o.lean || 0) * size;
    s.ctx.beginPath(); s.ctx.moveTo(hipX, hipY); s.ctx.lineTo(hipX - h * .11, y); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.moveTo(hipX, hipY); s.ctx.lineTo(hipX + h * .11, y); s.ctx.stroke();
    s.ctx.restore();
  };

  draw.cart = function (s, x, y, w, h = 22, o = {}) {
    const th = s.theme();
    const c = o.color || th.ink;
    s.ctx.save();
    s.ctx.strokeStyle = c; s.ctx.fillStyle = o.fill || 'transparent';
    s.ctx.lineWidth = o.width || 2.2;
    s.ctx.beginPath();
    if (s.ctx.roundRect) s.ctx.roundRect(x - w / 2, y - h, w, h, 2);
    else s.ctx.rect(x - w / 2, y - h, w, h);
    if (o.fill) s.ctx.fill();
    s.ctx.stroke();
    const r = o.wheel || 6;
    [x - w * .28, x + w * .28].forEach((wx) => {
      s.ctx.beginPath(); s.ctx.arc(wx, y + r * .55, r, 0, Math.PI * 2); s.ctx.stroke();
    });
    if (o.label) s.label(o.label, x, y - h / 2, { size: o.labelSize || 13, color: c, weight: 600 });
    s.ctx.restore();
  };

  draw.ball = function (s, x, y, r, o = {}) {
    const th = s.theme();
    const c = o.color || th.accent;
    s.ctx.save();
    s.ctx.fillStyle = c;
    s.ctx.beginPath(); s.ctx.arc(x, y, r, 0, Math.PI * 2); s.ctx.fill();
    if (o.ring !== false) {
      s.ctx.strokeStyle = o.ringColor || (th.night ? 'rgba(17,26,31,.35)' : 'rgba(243,238,227,.55)');
      s.ctx.lineWidth = 1.4;
      s.ctx.beginPath(); s.ctx.arc(x - r * .25, y - r * .25, r * .55, Math.PI * .9, Math.PI * 1.9); s.ctx.stroke();
    }
    s.ctx.restore();
  };

  draw.hammer = function (s, x, y, angle, size, o = {}) {
    const th = s.theme();
    const c = o.color || th.ink;
    s.ctx.save();
    s.ctx.translate(x, y);
    s.ctx.rotate(angle);
    s.ctx.strokeStyle = c; s.ctx.fillStyle = o.headFill || c; s.ctx.lineWidth = o.width || 3;
    s.ctx.lineCap = 'round';
    s.ctx.beginPath(); s.ctx.moveTo(0, 0); s.ctx.lineTo(size * .78, 0); s.ctx.stroke();
    s.ctx.fillRect(size * .7, -size * .07, size * .3, size * .15);
    s.ctx.strokeRect(size * .7, -size * .07, size * .3, size * .15);
    s.ctx.restore();
  };

  draw.pendulum = function (s, px, py, len, angle, o = {}) {
    const th = s.theme();
    const c = o.color || th.ink;
    const bx = px + Math.sin(angle) * len;
    const by = py + Math.cos(angle) * len;
    s.line(px, py, bx, by, { color: c, width: o.width || 1.8, alpha: .8 });
    s.dot(px, py, 3.5, { color: c });
    s.ctx.save();
    s.ctx.fillStyle = o.fill || (th.night ? '#2E3F47' : '#E7DECC');
    s.ctx.strokeStyle = c; s.ctx.lineWidth = o.boxW || 2.2;
    s.ctx.beginPath();
    s.ctx.rect(bx - 13, by - 8, 26, 22);
    s.ctx.fill(); s.ctx.stroke();
    s.ctx.restore();
    if (o.label) s.label(o.label, bx, by + 30, { size: 12, color: c });
    return { x: bx, y: by };
  };

  draw.cannon = function (s, x, y, sc, o = {}) {
    const th = s.theme();
    const c = o.color || th.ink;
    s.ctx.save();
    s.ctx.translate(x, y);
    s.ctx.scale(sc, sc);
    s.ctx.strokeStyle = c; s.ctx.fillStyle = o.fill || (th.night ? 'rgba(243,238,227,.06)' : 'rgba(20,26,30,.04)');
    s.ctx.lineWidth = 2.2 / sc;
    s.ctx.beginPath(); s.ctx.rect(-44, -20, 52, 20); s.ctx.fill(); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.rect(6, -32, 54, 16); s.ctx.fill(); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.arc(-30, 12, 12, 0, Math.PI * 2); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.arc(2, 12, 12, 0, Math.PI * 2); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.arc(-30, 12, 4, 0, Math.PI * 2); s.ctx.stroke();
    s.ctx.beginPath(); s.ctx.arc(2, 12, 4, 0, Math.PI * 2); s.ctx.stroke();
    s.ctx.restore();
  };

  draw.ship = function (s, x, y, w, o = {}) {
    const th = s.theme();
    const c = o.color || th.ink;
    s.ctx.save();
    s.ctx.strokeStyle = c; s.ctx.fillStyle = o.fill || 'rgba(20,26,30,.05)';
    s.ctx.lineWidth = o.width || 2;
    s.ctx.beginPath();
    s.ctx.moveTo(x - w / 2, y - 16);
    s.ctx.lineTo(x + w / 2, y - 16);
    s.ctx.lineTo(x + w * .38, y);
    s.ctx.lineTo(x - w * .38, y);
    s.ctx.closePath();
    s.ctx.fill(); s.ctx.stroke();
    s.ctx.strokeRect(x - w * .26, y - 40, w * .3, 24);
    s.ctx.beginPath(); s.ctx.moveTo(x + w * .24, y - 16); s.ctx.lineTo(x + w * .24, y - 44); s.ctx.stroke();
    s.ctx.restore();
  };
  App.draw = draw;

  /* threaded drawing of a horizontal axis with arrow */
  App.axisSVG = function (x1, y, x2, label, o = {}) {
    return `${App.arrowSVG(x1, y, x2, y, { color: o.color || 'muted', w: 1.4, head: 7 })}
      ${App.svgText(x2, y - 8, label, { anchor: 'end', color: 'muted', size: 12 })}`;
  };

  /* horizontal comparison bars drawn as SVG */
  App.barSVG = function (x, y, w, h, pct, o = {}) {
    const c = col(o.color || 'accent');
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--paper-3)"/>
      <rect x="${x + w * (1 - pct)}" y="${y}" width="${w * pct}" height="${h}" fill="${c}"/>`;
  };
})();
