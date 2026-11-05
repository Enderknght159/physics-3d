/* =========================================================
   Core — deck engine, math, plots, canvas sims, quizzes
   ========================================================= */
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.slides = [];
  App.byId = {};

  /* ---------------- small utils ---------------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const fmt = (n, d = 1) => {
    if (!isFinite(n)) return '—';
    const a = Math.abs(n);
    let s;
    if (a >= 1000) s = n.toLocaleString('en-US', { maximumFractionDigits: d === 0 ? 0 : 1 });
    else s = (Math.round(n * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);
    if (s.indexOf('.') > -1) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  };
  const rad = (deg) => deg * Math.PI / 180;
  const deg = (r) => r * 180 / Math.PI;
  const qs = (sel, root = document) => (typeof sel === 'string' ? root.querySelector(sel) : sel);
  const qsa = (sel, root = document) => Array.from((typeof sel === 'string' ? root.querySelectorAll(sel) : sel));

  App.util = { clamp, lerp, inv, esc, fmt, rad, deg, qs, qsa };
  const M = {
    m: (x) => `<span class="m">${x}</span>`,
    vec: (x) => `<span class="vec">${x}</span>`,
    frac: (a, b) => `<span class="frac"><span class="num">${a}</span><span class="den">${b}</span></span>`,
    sqrt: (x) => `<span class="sqrt"><span class="rad">√</span><span class="in">${x}</span></span>`,
    sub: (a, b) => `${a}<span class="sub">${b}</span>`,
    sup: (a, b) => `${a}<span class="sup">${b}</span>`,
    sym: (x, note, title = 'تفصيل') =>
      `<button type="button" class="sym" data-note="${esc(note)}" data-note-title="${esc(title)}">${x}</button>`,
    eq: (inner, label = '') =>
      `<div class="eq">${inner}</div>${label ? `<span class="eq-label">${label}</span>` : ''}`,
    times: '×',
    dot: '·',
    D: 'Δ'
  };
  M.v0 = `${M.vec('v')}<span class="sub">0</span>`;
  M.vx = `${M.vec('v')}<span class="sub">x</span>`;
  M.vy = `${M.vec('v')}<span class="sub">y</span>`;
  M.Pi = `${M.vec('P')}<span class="sub">i</span>`;
  M.Pf = `${M.vec('P')}<span class="sub">f</span>`;
  M.cn = (v) => `cos ${v}`;
  M.sn = (v) => `sin ${v}`;
  App.M = M;

  App.term = (text, note, title = 'تفصيل') =>
    `<button type="button" class="term" data-note="${esc(note)}" data-note-title="${esc(title)}">${text}</button>`;
  /* ---------------- tooltip / notes ---------------- */
  const tip = document.getElementById('tip');
  const tipBody = document.getElementById('tipBody');
  const tipKicker = document.getElementById('tipKicker');
  const tipClose = document.getElementById('tipClose');
  let tipTrigger = null;
  let hoverTimer = null;
  let closeTimer = null;

  function closeTip() {
    clearTimeout(hoverTimer); clearTimeout(closeTimer);
    if (!tip.classList.contains('is-open')) return;
    tip.classList.remove('is-open');
    tip.setAttribute('aria-hidden', 'true');
    if (tipTrigger) tipTrigger.setAttribute('aria-expanded', 'false');
    tipTrigger = null;
  }

  function openTip(trigger) {
    clearTimeout(hoverTimer); clearTimeout(closeTimer);
    if (tipTrigger === trigger && tip.classList.contains('is-open')) return;
    if (tipTrigger) tipTrigger.setAttribute('aria-expanded', 'false');
    tipTrigger = trigger;
    tipBody.innerHTML = trigger.dataset.note || '';
    tipKicker.textContent = trigger.dataset.noteTitle || 'شرح';
    trigger.setAttribute('aria-expanded', 'true');
    tip.classList.add('is-open');
    tip.setAttribute('aria-hidden', 'false');
    positionTip(trigger);
  }

  function positionTip(trigger) {
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    tip.style.left = '0px'; tip.style.top = '0px';
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = clamp(x, 12, vw - tw - 12);
    const below = r.bottom + 12;
    let y, pos;
    if (below + th < vh - 10) { y = below; pos = 'bottom'; }
    else if (r.top - th - 12 > 10) { y = r.top - th - 12; pos = 'top'; }
    else { y = clamp(r.top + r.height / 2 - th / 2, 10, vh - th - 10); pos = 'side'; }
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.dataset.pos = pos;
    if (pos !== 'side') {
      tip.style.setProperty('--arrow-x', clamp(r.left + r.width / 2 - x, 20, tw - 20) + 'px');
    }
  }

  tipClose.addEventListener('click', closeTip);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-note]');
    if (t) {
      e.preventDefault();
      openTip(t);
      return;
    }
    if (!e.target.closest('#tip')) closeTip();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTip(); });
  document.addEventListener('pointerover', (e) => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const t = e.target.closest('[data-note]');
    if (t && t !== tipTrigger) {
      clearTimeout(hoverTimer);
      clearTimeout(closeTimer);
      hoverTimer = setTimeout(() => openTip(t), 170);
    }
  });
  document.addEventListener('pointerout', (e) => {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const t = e.target.closest('[data-note]');
    if (!t) return;
    clearTimeout(hoverTimer);
    closeTimer = setTimeout(() => {
      if (!tip.matches(':hover')) closeTip();
    }, 260);
  });
  document.addEventListener('focusin', (e) => {
    const t = e.target.closest('[data-note]');
    if (t) openTip(t);
  });
  document.addEventListener('focusout', (e) => {
    const t = e.target.closest('[data-note]');
    if (t && tipTrigger === t) setTimeout(() => { if (!tip.matches(':hover')) closeTip(); }, 120);
  });
  window.addEventListener('scroll', () => closeTip(), true);
  window.addEventListener('resize', () => closeTip());

  /* ---------------- sliders ---------------- */
  let sliderSeq = 0;
  App.slider = function (host, opts) {
    const h = qs(host);
    if (!h) return null;
    const id = opts.id || ('sl' + (++sliderSeq));
    const dec = opts.dec == null ? 1 : opts.dec;
    const unit = opts.unit == null ? '' : opts.unit;
    const min = opts.min == null ? 0 : opts.min;
    const max = opts.max == null ? 1 : opts.max;
    const step = opts.step == null ? 0.1 : opts.step;
    const value = opts.value == null ? min : opts.value;
    const format = opts.format || ((v) => fmt(v, dec));
    const el = document.createElement('div');
    el.className = 'control';
    el.innerHTML = `
      <div class="control-head">
        <label class="control-label" for="${id}">${opts.label}</label>
        <span class="control-val"><b></b>${unit ? ` <span class="control-unit">${unit}</span>` : ''}</span>
      </div>
      <div class="slider">
        <div class="slider-rail"><span></span></div>
        <input class="range" type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
      </div>`;
    h.appendChild(el);
    const input = el.querySelector('input');
    const valEl = el.querySelector('.control-val b');
    const fill = el.querySelector('.slider-rail > span');
    let current = clamp(parseFloat(value), min, max);
    function paint() {
      const p = (current - min) / (max - min);
      fill.style.width = (p * 100) + '%';
      valEl.textContent = format(current);
      input.value = current;
      input.setAttribute('aria-valuetext', format(current) + (unit ? ' ' + unit : ''));
    }
    input.addEventListener('input', () => {
      current = parseFloat(input.value);
      paint();
      if (opts.onInput) opts.onInput(current, el);
    });
    paint();
    return {
      el, input,
      get value() { return current; },
      set(v, silent) {
        current = clamp(v, min, max);
        paint();
        if (!silent && opts.onInput) opts.onInput(current, el);
      }
    };
  };

  App.button = function (label, cls = 'btn btn--sm') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.innerHTML = label;
    return b;
  };

  /* ---------------- quiz ---------------- */
  App.Quiz = function (host, config) {
    const h = qs(host);
    if (!h) return null;
    const questions = config.questions || [config];
    let qi = 0, score = 0, answered = 0;
    const shell = document.createElement('div');
    shell.className = 'quiz';
    h.appendChild(shell);
    const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];

    function render() {
      const q = questions[qi];
      shell.innerHTML = `
        <div class="quiz-q" id="qq${qi}">${q.q}</div>
        <div class="options" role="group" aria-labelledby="qq${qi}">
          ${q.options.map((o, i) => `
            <button type="button" class="opt" data-i="${i}" aria-pressed="false">
              <span class="key">${letters[i] || i + 1}</span>
              <span class="txt">${o.t}</span>
            </button>`).join('')}
        </div>
        <div class="feedback" id="fb${qi}" role="status"></div>
        <div class="quiz-foot">
          <span class="quiz-progress">${questions.length > 1 ? `سؤال ${qi + 1} من ${questions.length}` : 'اختر إجابة'}</span>
          <button type="button" class="btn btn--sm quiz-next" hidden></button>
        </div>`;
      const opts = qsa('.opt', shell);
      const fb = shell.querySelector('.feedback');
      const next = shell.querySelector('.quiz-next');
      opts.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const i = +btn.dataset.i;
          const opt = q.options[i];
          opts.forEach((b, j) => {
            b.disabled = true;
            b.setAttribute('aria-pressed', 'false');
            if (q.options[j].ok) b.classList.add('is-correct');
            else if (j === i) b.classList.add('is-wrong');
            else b.classList.add('dim');
          });
          if (opt.ok) score++;
          answered++;
          fb.className = 'feedback is-open ' + (opt.ok ? 'ok' : 'no');
          fb.innerHTML = `<span class="fb-title">${opt.ok ? 'إجابة صحيحة.' : 'ليست الإجابة الدقيقة.'}</span>${opt.why || q.explain || ''}`;
          next.hidden = false;
          if (qi < questions.length - 1) {
            next.textContent = 'السؤال التالي';
            next.className = 'btn btn--sm quiz-next';
          } else {
            next.textContent = 'أعد المحاولة';
            next.className = 'btn btn--sm btn--ghost quiz-next';
          }
          if (config.onAnswer) config.onAnswer(opt.ok, qi, opt);
        });
      });
      next.addEventListener('click', () => {
        if (qi < questions.length - 1) { qi++; render(); }
        else {
          qi = 0; score = 0; answered = 0; render();
          if (config.onReset) config.onReset();
        }
      });
    }
    render();
    return { el: shell, get score() { return score; } };
  };

  /* ---------------- formula deck ---------------- */
  App.formulaDeck = function (root) {
    qsa('.fcard', root).forEach((card) => {
      const open = card.querySelector('.fcard-open');
      if (!open) return;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fcard-close')) { card.classList.remove('is-open'); return; }
        qsa('.fcard', root).forEach((c) => c !== card && c.classList.remove('is-open'));
        card.classList.toggle('is-open');
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-expanded', 'false');
      const obs = new MutationObserver(() => card.setAttribute('aria-expanded', card.classList.contains('is-open') ? 'true' : 'false'));
      obs.observe(card, { attributes: true, attributeFilter: ['class'] });
    });
  };

  /* ---------------- reveal solutions ---------------- */
  App.bindReveals = function (root) {
    qsa('[data-reveal]', root).forEach((box) => {
      const steps = qsa('[data-step]', box);
      const btn = box.querySelector('[data-reveal-btn]');
      if (!btn) return;
      const locked = box.dataset.reveal !== 'open';
      if (locked) steps.forEach((s) => { s.style.opacity = '0'; s.style.transform = 'translateY(8px)'; s.style.pointerEvents = 'none'; });
      let shown = locked ? 0 : steps.length;
      btn.textContent = locked ? (box.dataset.revealLabel || 'اكشف الخطوات') : 'الخطوات ظاهرة';
      if (!locked) btn.hidden = true;
      btn.addEventListener('click', () => {
        if (shown >= steps.length) return;
        const s = steps[shown++];
        s.style.transition = 'opacity .45s ease, transform .45s ease';
        s.style.opacity = '1';
        s.style.transform = 'none';
        s.style.pointerEvents = 'auto';
        if (shown >= steps.length) { btn.textContent = 'اكتمل الحل'; btn.disabled = true; }
        else btn.textContent = `اكشف الخطوة التالية (${shown}/${steps.length})`;
      });
      if (locked) btn.textContent = `اكشف الخطوات (${steps.length})`;
    });
  };

  /* ---------------- canvas sim ---------------- */
  class Sim {
    constructor(canvas, draw, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.drawFn = draw;
      this.opts = opts;
      this.running = false;
      this.t = 0;
      this.last = 0;
      this.w = 1; this.h = 1; this.dpr = 1;
      this._raf = 0;
      this._onFrame = this._onFrame.bind(this);
      this._onResize = this._onResize.bind(this);
      this.ro = new ResizeObserver(this._onResize);
      this.ro.observe(canvas.parentElement || canvas);
      this._onResize();
    }
    css(name, fb) {
      const v = getComputedStyle(this.canvas).getPropertyValue(name).trim();
      return v || fb;
    }
    theme() {
      const night = this.opts.night != null ? this.opts.night : !!this.canvas.closest('.slide--night,.stage--dark');
      return {
        ink: this.css('color', night ? '#F3EEE3' : '#141A1E'),
        accent: this.css('--accent', '#C34328'),
        accent2: night ? '#E4674C' : this.css('--accent', '#C34328'),
        teal: night ? '#79B4B4' : this.css('--teal', '#1D666B'),
        muted: night ? 'rgba(243,238,227,.55)' : this.css('--ink-3', '#707876'),
        faint: night ? 'rgba(243,238,227,.22)' : 'rgba(20,26,30,.16)',
        paper: night ? '#182329' : this.css('--paper-2', '#EAE3D4'),
        paper2: night ? '#223038' : this.css('--paper-3', '#DED4BF'),
        night
      };
    }
    _onResize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      if (w === this.w && h === this.h && dpr === this.dpr) { this.paint(); return; }
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.paint();
    }
    paint() {
      if (!this.w || !this.h) return;
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.drawFn(this, this.t, 0);
      this.ctx.restore();
    }
    start() {
      if (this.running) return;
      this.running = true;
      this.last = 0;
      this._raf = requestAnimationFrame(this._onFrame);
    }
    stop() {
      this.running = false;
      cancelAnimationFrame(this._raf);
    }
    reset(t = 0) { this.t = t; this.paint(); }
    _onFrame(ts) {
      if (!this.running) return;
      if (!this.last) this.last = ts;
      let dt = (ts - this.last) / 1000;
      this.last = ts;
      dt = Math.min(dt, 0.05);
      this.t += dt;
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.drawFn(this, this.t, dt);
      this.ctx.restore();
      this._raf = requestAnimationFrame(this._onFrame);
    }
    /* drawing helpers (CSS px) */
    line(x1, y1, x2, y2, o = {}) {
      const c = this.ctx;
      c.save();
      c.strokeStyle = o.color || this.theme().ink;
      c.lineWidth = o.width == null ? 1.6 : o.width;
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      c.lineCap = o.cap || 'round';
      if (o.dash) c.setLineDash(o.dash);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.restore();
    }
    arrow(x1, y1, x2, y2, o = {}) {
      const c = this.ctx;
      const th = this.theme();
      const color = o.color || th.accent;
      const width = o.width == null ? 2.2 : o.width;
      const head = o.head == null ? 9 : o.head;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 1) return;
      const ux = dx / len, uy = dy / len;
      const hx = x2 - ux * head * .9, hy = y2 - uy * head * .9;
      c.save();
      c.strokeStyle = color; c.fillStyle = color;
      c.lineWidth = width; c.lineCap = 'round';
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      if (o.dash) c.setLineDash(o.dash);
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(hx, hy); c.stroke();
      c.setLineDash([]);
      c.beginPath();
      c.moveTo(x2, y2);
      c.lineTo(x2 - ux * head - uy * head * .48, y2 - uy * head + ux * head * .48);
      c.lineTo(x2 - ux * head + uy * head * .48, y2 - uy * head - ux * head * .48);
      c.closePath(); c.fill();
      if (o.double) {
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x1 + ux * head - uy * head * .48, y1 + uy * head + ux * head * .48);
        c.lineTo(x1 + ux * head + uy * head * .48, y1 + uy * head - ux * head * .48);
        c.closePath(); c.fill();
      }
      c.restore();
      if (o.label) {
        const mx = o.labelAt === 'start' ? x1 + ux * 18 : o.labelAt === 'end' ? x2 - ux * 20 : (x1 + x2) / 2;
        const my = o.labelAt === 'start' ? y1 + uy * 18 : o.labelAt === 'end' ? y2 - uy * 20 : (y1 + y2) / 2;
        this.label(o.label, mx + (o.lx || 0), my + (o.ly == null ? -14 : o.ly), {
          color, size: o.size || 13.5, weight: 600, align: o.align || 'center',
          bg: this.theme().paper, bgPad: 3
        });
      }
    }
    dot(x, y, r, o = {}) {
      const c = this.ctx;
      c.save();
      c.fillStyle = o.color || this.theme().accent;
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.sw || 2; c.stroke(); }
      c.restore();
    }
    ring(x, y, r, o = {}) {
      const c = this.ctx;
      c.save();
      c.strokeStyle = o.color || this.theme().accent;
      c.lineWidth = o.width == null ? 2 : o.width;
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      if (o.dash) c.setLineDash(o.dash);
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
      c.restore();
    }
    rect(x, y, w, h, o = {}) {
      const c = this.ctx;
      c.save();
      c.fillStyle = o.color || this.theme().ink;
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      c.fillRect(x, y, w, h);
      c.restore();
    }
    label(text, x, y, o = {}) {
      const c = this.ctx;
      const size = o.size || 13;
      const weight = o.weight || 500;
      if (o.dir === 'ltr') text = '\u202A' + text + '\u202C';
      c.save();
      c.font = `${weight} ${size}px 'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif`;
      c.textAlign = o.align || 'center';
      c.textBaseline = o.baseline || 'middle';
      c.direction = o.dir || 'rtl';
      const color = o.color || this.theme().ink;
      if (o.bg) {
        const w = c.measureText(text).width;
        const pad = o.bgPad == null ? 3 : o.bgPad;
        let bx = x - w / 2;
        if (c.textAlign === 'left') bx = x - pad;
        if (c.textAlign === 'right') bx = x - w - pad;
        c.fillStyle = o.bg;
        c.globalAlpha = o.alpha == null ? 1 : o.alpha;
        c.fillRect(bx - pad, y - size * .62, w + pad * 2, size * 1.24);
      }
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      c.fillStyle = color;
      c.fillText(text, x, y + 1);
      c.restore();
    }
    font(size, weight = 500) {
      return `${weight} ${size}px 'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif`;
    }
    fit(text, maxW, base = 13) {
      const c = this.ctx;
      let s = base;
      while (s > 9) {
        c.font = this.font(s, 500);
        if (c.measureText(text).width <= maxW) return s;
        s -= .5;
      }
      return 9;
    }
  }
  App.Sim = Sim;

  /* ---------------- SVG plot ---------------- */
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs = {}) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }
  function niceStep(range, target = 5) {
    const raw = range / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    let step;
    if (n < 1.5) step = 1; else if (n < 3.2) step = 2; else if (n < 7.5) step = 5; else step = 10;
    return step * mag;
  }

  class Plot {
    constructor(host, cfg) {
      this.host = qs(host);
      this.cfg = Object.assign({
        width: 640, height: 380, pad: { l: 56, r: 26, t: 26, b: 48 },
        x: { min: 0, max: 10, label: '' }, y: { min: 0, max: 10, label: '' },
        series: [], areas: [], guides: [], markers: [], bands: []
      }, cfg);
      this.svg = svgEl('svg', {
        class: 'diagram plot',
        viewBox: `0 0 ${this.cfg.width} ${this.cfg.height}`,
        preserveAspectRatio: 'xMidYMid meet',
        role: 'img'
      });
      this.svg.style.width = '100%';
      this.svg.style.height = 'auto';
      this.svg.style.direction = 'ltr';
      this.host.appendChild(this.svg);
      if (this.cfg.ariaLabel) this.svg.setAttribute('aria-label', this.cfg.ariaLabel);
      this.render();
    }
    update(partial = {}) {
      Object.assign(this.cfg, partial);
      this.render();
    }
    sx(x) {
      const { x: xr, width, pad } = this.cfg;
      return pad.l + (x - xr.min) / (xr.max - xr.min) * (width - pad.l - pad.r);
    }
    sy(y) {
      const { y: yr, height, pad } = this.cfg;
      return height - pad.b - (y - yr.min) / (yr.max - yr.min) * (height - pad.t - pad.b);
    }
    render() {
      const { width: W, height: H, pad, x: xr, y: yr, series, areas, guides, markers } = this.cfg;
      const svg = this.svg;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const x0 = this.sx(xr.min), x1 = this.sx(xr.max);
      const y0 = this.sy(yr.min), y1 = this.sy(yr.max);
      const g = svgEl('g');
      svg.appendChild(g);

      const xstep = xr.step || niceStep(xr.max - xr.min, 5);
      const ystep = yr.step || niceStep(yr.max - yr.min, 5);
      const xticks = [];
      for (let v = Math.ceil(xr.min / xstep) * xstep; v <= xr.max + 1e-9; v += xstep) xticks.push(+v.toFixed(8));
      const yticks = [];
      for (let v = Math.ceil(yr.min / ystep) * ystep; v <= yr.max + 1e-9; v += ystep) yticks.push(+v.toFixed(8));

      // bands
      (this.cfg.bands || []).forEach((b) => {
        const bx = this.sx(b.xmin), bw = this.sx(b.xmax) - bx;
        g.appendChild(svgEl('rect', { x: bx, y: y1, width: bw, height: y0 - y1, fill: b.color || 'var(--accent)', 'fill-opacity': b.alpha == null ? .06 : b.alpha }));
      });

      // grid
      xticks.forEach((v) => {
        g.appendChild(svgEl('line', { x1: this.sx(v), y1, x2: this.sx(v), y2: y1, stroke: 'var(--line)', 'stroke-width': 1, 'stroke-dasharray': '1 5' }));
      });
      yticks.forEach((v) => {
        g.appendChild(svgEl('line', { x1: x0, y1: this.sy(v), x2: x1, y2: this.sy(v), stroke: 'var(--line)', 'stroke-width': 1, 'stroke-dasharray': '1 5' }));
      });

      // areas
      (areas || []).forEach((a) => {
        const pts = [];
        const n = a.samples || 120;
        for (let i = 0; i <= n; i++) {
          const x = lerp(a.xmin, a.xmax, i / n);
          pts.push([this.sx(x), this.sy(clamp(a.fn(x), yr.min, yr.max))]);
        }
        const baseY = this.sy(a.base == null ? 0 : a.base);
        const d = `M ${this.sx(a.xmin)} ${baseY} ` + pts.map(p => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ') + ` L ${this.sx(a.xmax)} ${baseY} Z`;
        g.appendChild(svgEl('path', { d, fill: a.color || 'var(--accent)', 'fill-opacity': a.alpha == null ? .12 : a.alpha, stroke: 'none' }));
      });

      // axes
      const xAxisY = (yr.min <= 0 && yr.max >= 0) ? this.sy(0) : y0;
      const yAxisX = (xr.min <= 0 && xr.max >= 0) ? this.sx(0) : x0;
      g.appendChild(svgEl('line', { x1: x0, y1: xAxisY, x2: x1, y2: xAxisY, stroke: 'var(--ink)', 'stroke-width': 1.4 }));
      g.appendChild(svgEl('line', { x1: yAxisX, y1: y0, x2: yAxisX, y2: y1, stroke: 'var(--ink)', 'stroke-width': 1.4 }));
      // arrowheads
      g.appendChild(svgEl('path', { d: `M ${x1 - 7} ${xAxisY - 4.5} L ${x1} ${xAxisY} L ${x1 - 7} ${xAxisY + 4.5}`, fill: 'var(--ink)' }));
      g.appendChild(svgEl('path', { d: `M ${yAxisX - 4.5} ${y1 + 7} L ${yAxisX} ${y1} L ${yAxisX + 4.5} ${y1 + 7}`, fill: 'var(--ink)' }));

      // ticks + labels
      const fmtTick = (v) => {
        if (Math.abs(v) < 1e-9) return '0';
        if (Math.abs(v) >= 1000) return fmt(v, 0);
        return String(+v.toFixed(2));
      };
      xticks.forEach((v) => {
        if (Math.abs(v) < 1e-9) return;
        const sx = this.sx(v);
        g.appendChild(svgEl('line', { x1: sx, y1: xAxisY - 3, x2: sx, y2: xAxisY + 3, stroke: 'var(--ink)', 'stroke-width': 1 }));
        const t = svgEl('text', { x: sx, y: xAxisY + 16, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--ink-3)', 'font-family': "'IBM Plex Sans Arabic',sans-serif" });
        t.textContent = fmtTick(v);
        g.appendChild(t);
      });
      yticks.forEach((v) => {
        if (Math.abs(v) < 1e-9) return;
        const sy = this.sy(v);
        g.appendChild(svgEl('line', { x1: yAxisX - 3, y1: sy, x2: yAxisX + 3, y2: sy, stroke: 'var(--ink)', 'stroke-width': 1 }));
        const t = svgEl('text', { x: yAxisX - 8, y: sy + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--ink-3)', 'font-family': "'IBM Plex Sans Arabic',sans-serif" });
        t.textContent = fmtTick(v);
        g.appendChild(t);
      });
      const xl = svgEl('text', { x: x1, y: H - 6, 'text-anchor': 'end', 'font-size': 12.5, fill: 'var(--ink-2)', 'font-family': "'IBM Plex Sans Arabic',sans-serif" });
      xl.textContent = xr.label; g.appendChild(xl);
      const yl = svgEl('text', { x: x0 + 2, y: pad.t + 2, 'text-anchor': 'start', 'font-size': 12.5, fill: 'var(--ink-2)', 'font-family': "'IBM Plex Sans Arabic',sans-serif" });
      yl.textContent = yr.label; g.appendChild(yl);

      // guides
      (guides || []).forEach((gd) => {
        if (gd.x != null) {
          const sx = this.sx(gd.x);
          g.appendChild(svgEl('line', { x1: sx, y1: y0, x2: sx, y2: y1, stroke: gd.color || 'var(--ink-3)', 'stroke-width': gd.width || 1.4, 'stroke-dasharray': gd.dash === false ? '' : '5 6' }));
          if (gd.label) {
            const t = svgEl('text', { x: sx + 5, y: gd.labelY || (y1 + 14), 'font-size': 11.5, fill: gd.color || 'var(--ink-3)', 'font-family': "'IBM Plex Sans Arabic',sans-serif", 'text-anchor': 'start' });
            t.textContent = gd.label; g.appendChild(t);
          }
        }
        if (gd.y != null) {
          const sy = this.sy(gd.y);
          g.appendChild(svgEl('line', { x1: x0, y1: sy, x2: x1, y2: sy, stroke: gd.color || 'var(--ink-3)', 'stroke-width': gd.width || 1.4, 'stroke-dasharray': gd.dash === false ? '' : '5 6' }));
          if (gd.label) {
            const t = svgEl('text', { x: x0 + 6, y: sy - 6, 'font-size': 11.5, fill: gd.color || 'var(--ink-3)', 'font-family': "'IBM Plex Sans Arabic',sans-serif", 'text-anchor': 'start' });
            t.textContent = gd.label; g.appendChild(t);
          }
        }
      });

      // series
      (series || []).forEach((s) => {
        let pts = [];
        if (s.fn) {
          const xmin = s.xmin == null ? xr.min : s.xmin;
          const xmax = s.xmax == null ? xr.max : s.xmax;
          const n = s.samples || 200;
          for (let i = 0; i <= n; i++) {
            const x = lerp(xmin, xmax, i / n);
            const y = s.fn(x);
            if (isFinite(y) && y >= yr.min - .5 && y <= yr.max + .5) pts.push([this.sx(x), this.sy(clamp(y, yr.min, yr.max))]);
          }
        } else if (s.points) {
          pts = s.points.map(([x, y]) => [this.sx(x), this.sy(y)]);
        }
        if (!pts.length) return;
        const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
        g.appendChild(svgEl('path', {
          d, fill: 'none',
          stroke: s.color === 'accent' ? 'var(--accent)' : s.color === 'teal' ? 'var(--teal)' : (s.color || 'var(--ink)'),
          'stroke-width': s.width || 2.4,
          'stroke-dasharray': s.dash ? '6 6' : '',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          opacity: s.alpha == null ? 1 : s.alpha
        }));
      });

      // markers
      (markers || []).forEach((m) => {
        const sx = this.sx(m.x), sy = this.sy(m.y);
        const color = m.color === 'teal' ? 'var(--teal)' : m.color === 'ink' ? 'var(--ink)' : 'var(--accent)';
        if (m.style === 'ring') {
          g.appendChild(svgEl('circle', { cx: sx, cy: sy, r: m.r || 5, fill: 'var(--paper)', stroke: color, 'stroke-width': 2.2 }));
        } else {
          g.appendChild(svgEl('circle', { cx: sx, cy: sy, r: m.r || 4.2, fill: color }));
        }
        if (m.label) {
          const anchor = m.labelAnchor || 'start';
          const tx = m.labelX != null ? m.labelX : sx + (m.labelDx != null ? m.labelDx : (anchor === 'end' ? -9 : anchor === 'middle' ? 0 : 9));
          const t = svgEl('text', {
            x: tx, y: m.labelY != null ? m.labelY : sy + (m.labelDy != null ? m.labelDy : -10),
            'text-anchor': anchor, 'font-size': m.labelSize || 12,
            fill: color, 'font-family': "'IBM Plex Sans Arabic',sans-serif", 'font-weight': 600,
            direction: 'rtl'
          });
          t.textContent = m.label; g.appendChild(t);
        }
      });
    }
  }
  App.Plot = Plot;

  /* ---------------- context & engine ---------------- */
  function makeCtx(root) {
    const cleanups = [];
    let alive = true;
    const ctx = {
      root, alive: () => alive,
      on(target, ev, fn, opts) {
        const el = typeof target === 'string' ? qs(target, root) : target;
        if (!el) return () => {};
        el.addEventListener(ev, fn, opts);
        cleanups.push(() => el.removeEventListener(ev, fn, opts));
        return () => el.removeEventListener(ev, fn, opts);
      },
      onDestroy(fn) { cleanups.push(fn); },
      raf(fn) {
        let id = 0;
        const loop = (ts) => {
          if (!alive) return;
          fn(ts);
          id = requestAnimationFrame(loop);
        };
        id = requestAnimationFrame(loop);
        cleanups.push(() => cancelAnimationFrame(id));
      },
      timer(fn, ms) {
        const id = setInterval(() => { if (alive) fn(); }, ms);
        cleanups.push(() => clearInterval(id));
        return id;
      },
      destroy() {
        alive = false;
        cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* noop */ } });
      }
    };
    return ctx;
  }

  App.addSlide = function (slide) {
    if (App.byId[slide.id]) console.warn('duplicate slide', slide.id);
    App.byId[slide.id] = slide;
    App.slides.push(slide);
  };

  const engine = {
    index: 0,
    ctx: null,
    els: [],
    ready: false
  };
  App.engine = engine;

  App.start = function () {
    const deck = document.getElementById('deck');
    engine.els = App.slides.map((s, i) => {
      const sec = document.createElement('section');
      sec.className = 'slide ' + (s.theme === 'night' ? 'slide--night ' : '') + (s.wide ? 'slide--wide ' : '') + (s.className || '');
      sec.id = 's-' + s.id;
      sec.dataset.id = s.id;
      sec.dataset.index = i;
      sec.setAttribute('aria-label', s.title);
      sec.innerHTML = `<div class="slide-inner">${s.html || ''}</div>`;
      deck.appendChild(sec);
      return sec;
    });
    // overview
    buildOverview();
    // controls
    document.getElementById('prev').addEventListener('click', () => go(engine.index - 1));
    document.getElementById('next').addEventListener('click', () => go(engine.index + 1));
    document.getElementById('btnOverview').addEventListener('click', openOverview);
    document.getElementById('btnCloseOverview').addEventListener('click', () => document.getElementById('overview').close());
    document.getElementById('btnFull').addEventListener('click', toggleFull);
    const ov = document.getElementById('overview');
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.close(); });
    deck.addEventListener('scroll', updateScrollHint, { passive: true });
    window.addEventListener('resize', updateScrollHint);
    document.addEventListener('keydown', onKey);
    setupSwipe(deck);
    window.addEventListener('hashchange', () => {
      const id = location.hash.replace(/^#\/?/, '');
      const i = App.slides.findIndex((s) => s.id === id);
      if (i >= 0 && i !== engine.index) go(i);
    });
    // deep link
    let startId = location.hash.replace(/^#\/?/, '');
    let start = 0;
    if (startId) {
      const i = App.slides.findIndex((s) => s.id === startId);
      if (i >= 0) start = i;
    }
    engine.ready = true;
    go(start, true);
  };

  function buildOverview() {
    const body = document.getElementById('overviewBody');
    body.innerHTML = '';
    let current = null, wrap = null, list = null;
    App.slides.forEach((s, i) => {
      if (s.chapter !== current) {
        current = s.chapter;
        wrap = document.createElement('div');
        wrap.className = 'ov-chapter';
        wrap.innerHTML = `<h3>${s.chapter}</h3>`;
        list = document.createElement('div');
        list.className = 'ov-list';
        wrap.appendChild(list);
        body.appendChild(wrap);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ov-item';
      b.dataset.go = i;
      b.innerHTML = `<span class="dot"></span><span>${s.title}</span>`;
      b.addEventListener('click', () => {
        document.getElementById('overview').close();
        go(i);
      });
      list.appendChild(b);
    });
  }

  function openOverview() {
    const ov = document.getElementById('overview');
    qsa('.ov-item', ov).forEach((b) => b.classList.toggle('is-current', +b.dataset.go === engine.index));
    if (typeof ov.showModal === 'function') ov.showModal();
    else ov.setAttribute('open', '');
  }

  function go(i, initial) {
    if (!engine.ready) return;
    i = clamp(i, 0, App.slides.length - 1);
    const s = App.slides[i];
    if (!initial && i === engine.index) return;
    const deck = document.getElementById('deck');
    deck.scrollTop = 0;
    closeTip();
    // cleanup
    if (engine.ctx) { engine.ctx.destroy(); engine.ctx = null; }
    engine.els.forEach((el, j) => {
      el.classList.toggle('is-active', j === i);
      if (j !== i) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden');
    });
    engine.index = i;
    deck.scrollTop = 0;
    const app = document.getElementById('app');
    app.classList.toggle('night', s.theme === 'night');
    document.getElementById('chapterMark').textContent = s.chapter || '';
    document.getElementById('navTitle').textContent = s.title || '';
    document.getElementById('progressFill').style.width = ((i / (App.slides.length - 1)) * 100) + '%';
    document.getElementById('prev').disabled = i === 0;
    document.getElementById('next').disabled = i === App.slides.length - 1;
    if (location.hash !== '#/' + s.id) {
      try { history.replaceState(null, '', '#/' + s.id); } catch (e) { location.hash = '#/' + s.id; }
    }
    const root = engine.els[i];
    const ctx = engine.ctx = makeCtx(root);
    App.bindReveals(root);
    App.formulaDeck(root);
    if (s.mount) {
      try { s.mount(root, ctx); } catch (e) { console.error('mount ' + s.id, e); }
    }
    const live = document.getElementById('live');
    live.textContent = s.title + ' — ' + (s.chapter || '');
    updateScrollHint();
    // avoid focusing the deck on initial load (keeps keyboard scrolling natural)
    if (!initial) {
      const heading = root.querySelector('h1,h2');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
    // start sims that opted in
    qsa('canvas[data-autoplay]', root).forEach((c) => {
      if (c.__sim) c.__sim.start();
    });
  }
  App.go = go;
  App.next = () => go(engine.index + 1);
  App.prev = () => go(engine.index - 1);

  function onKey(e) {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (e.key === 'Escape') {
      const ov = document.getElementById('overview');
      if (ov.open) { ov.close(); return; }
      closeTip(); return;
    }
    if (typing) return;
    if (document.getElementById('overview').open) return;
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Spacebar') {
      if (tag === 'button' && (k === ' ' || k === 'Spacebar')) return;
      e.preventDefault(); App.next();
    } else if (k === 'ArrowRight' || k === 'ArrowUp' || k === 'PageUp') {
      e.preventDefault(); App.prev();
    } else if (k === 'Home') { e.preventDefault(); go(0); }
    else if (k === 'End') { e.preventDefault(); go(App.slides.length - 1); }
    else if (k === 'o' || k === 'O' || k === 'و') { e.preventDefault(); openOverview(); }
    else if (k === 'f' || k === 'F' || k === 'ب') { e.preventDefault(); toggleFull(); }
  }

  function toggleFull() {
    const d = document;
    if (!d.fullscreenElement) {
      (d.documentElement.requestFullscreen || function () {}).call(d.documentElement).catch(() => {});
    } else {
      d.exitFullscreen && d.exitFullscreen();
    }
  }

  function updateScrollHint() {
    const deck = document.getElementById('deck');
    const hint = document.getElementById('swipeHint');
    if (!deck || !hint) return;
    const more = deck.scrollHeight - deck.clientHeight - deck.scrollTop > 40;
    hint.classList.toggle('is-visible', more);
  }

  function setupSwipe(deck) {
    let sx = 0, sy = 0, st = 0, active = false;
    deck.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      if (e.target.closest('input,textarea,select,button,canvas,[data-noswipe]')) { active = false; return; }
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY; st = Date.now(); active = true;
    }, { passive: true });
    deck.addEventListener('touchend', (e) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      const dt = Date.now() - st;
      if (dt > 700) return;
      if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        if (dx < 0) App.next(); else App.prev();
      }
    }, { passive: true });
  }
})();
