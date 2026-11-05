/* =========================================================
   الفصل الأول — كمية الحركة: المفهوم والدفع
   ========================================================= */
(function () {
  'use strict';
  const App = window.App, M = App.M, P = App.physics;
  const { fmt, clamp, rad, deg, qs, qsa } = App.util;

  const head = (t, l = '', cls = '') =>
    `<div class="head-block rise" style="--i:0"><h2 class="h2 ${cls}">${t}</h2>${l ? `<p class="lede">${l}</p>` : ''}</div>`;
  const stage = (id, cls = 'tall', extra = '') =>
    `<div class="stage ${cls}" ${extra}><canvas id="${id}" aria-label="محاكاة تفاعلية"></canvas></div>`;
  const ro = (id, k, v = '—', u = '', cls = '') =>
    `<div class="readout ${cls}"><span class="readout-k">${k}</span><span class="readout-v" id="${id}">${v}${u ? `<small>&nbsp;${u}</small>` : ''}</span></div>`;

  /* =========================================================
     1 — الغلاف
     ========================================================= */
  App.addSlide({
    id: 'cover', chapter: 'الوحدة الأولى · الحركة والتحريك', title: 'الصدم والقذف', theme: 'night',
    html: `
      <div class="cover">
        <div class="cover-copy">
          <h1><span class="ln rise" style="--i:0">الصدم</span><span class="ln rise" style="--i:1">والقذف</span></h1>
          <p class="cover-lede rise" style="--i:2">كيف ينتقل الأثر بين جسمين، وكيف يرسم الجسم قوسه في الهواء؟ رحلة تبدأ بدفعة صغيرة وتنتهي عند أبعد مدى.</p>
          <div class="cover-actions rise" style="--i:3">
            <button class="btn btn--accent" data-jump="signs">ابدأ من اللافتتين
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
            </button>
            <button class="btn btn--ghost" data-open-overview>تصفّح الفهرس</button>
          </div>
          <p class="cover-foot rise" style="--i:4">مبني على كتاب «الصدم والقذف» — الصف الثاني الثانوي العلمي. كل شريحة فكرة واحدة، ومعها تجربة صغيرة.</p>
        </div>
        <div class="cover-live">
          <canvas id="coverCanvas" aria-label="مسار قذيفة تفاعلي: اسحب لتغيير زاوية القذف"></canvas>
          <div class="cover-readout">
            <div class="r"><span class="rk">زاوية القذف</span><span class="rv" id="coverAngle">45°</span></div>
            <div class="r"><span class="rk">المدى الأفقي</span><span class="rv" id="coverRange">32.4 m</span></div>
          </div>
          <p class="cover-hint">اسحب داخل الرسم لتغيير الزاوية</p>
        </div>
      </div>`,
    mount(root, ctx) {
      qsa('[data-jump]', root).forEach((b) => ctx.on(b, 'click', () => {
        const i = App.slides.findIndex((s) => s.id === b.dataset.jump);
        if (i >= 0) App.go(i);
      }));
      const ovBtn = root.querySelector('[data-open-overview]');
      if (ovBtn) ctx.on(ovBtn, 'click', () => document.getElementById('btnOverview').click());

      const cv = root.querySelector('#coverCanvas');
      const angleEl = root.querySelector('#coverAngle');
      const rangeEl = root.querySelector('#coverRange');
      const state = { angle: 45, dragging: false };
      const V0 = 18;

      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const pr = P.projectile(V0, state.angle, { g: 10 });
        const sc = Math.min(w / 46, h / 20);
        const ox = w * .055, oy = h * .84;
        const X = (x) => ox + x * sc, Y = (y) => oy - y * sc;

        // faint measuring grid
        for (let gx = 0; gx <= 40; gx += 5) {
          s.line(X(gx), Y(0), X(gx), Y(14), { color: th.ink, width: 1, alpha: .055, dash: [1, 6] });
        }
        for (let gy = 0; gy <= 15; gy += 5) {
          s.line(X(0), Y(gy), X(40), Y(gy), { color: th.ink, width: 1, alpha: .055, dash: [1, 6] });
        }
        // ground & launch point
        s.line(X(0), Y(0), Math.min(w - 8, X(42)), Y(0), { color: th.ink, width: 1.4, alpha: .3 });
        s.dot(X(0), Y(0), 3, { color: th.ink, alpha: .6 });

        // trajectory
        const N = 90;
        let d = '';
        for (let i = 0; i <= N; i++) {
          const tt = pr.tFlight * i / N;
          d += `${i ? 'L' : 'M'}${X(pr.x(tt)).toFixed(2)},${Y(Math.max(0, pr.y(tt))).toFixed(2)} `;
        }
        s.ctx.save();
        s.ctx.strokeStyle = th.ink; s.ctx.globalAlpha = .32; s.ctx.lineWidth = 1.4; s.ctx.setLineDash([3, 7]);
        s.ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const tt = pr.tFlight * i / N;
          const px = X(pr.x(tt)), py = Y(Math.max(0, pr.y(tt)));
          i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
        }
        s.ctx.stroke(); s.ctx.restore();

        // flying ball
        const cyc = 3.4;
        const u = ((t + 0.4) % cyc) / cyc;
        const bt = Math.min(pr.tFlight, u * pr.tFlight * 1.08);
        const bx = X(pr.x(bt)), by = Y(Math.max(0, pr.y(bt)));
        // trail
        s.ctx.save();
        s.ctx.strokeStyle = th.accent; s.ctx.lineWidth = 2.2; s.ctx.globalAlpha = .5;
        s.ctx.beginPath();
        for (let i = 0; i < 18; i++) {
          const tt = Math.max(0, bt - i * pr.tFlight / 55);
          const px = X(pr.x(tt)), py = Y(Math.max(0, pr.y(tt)));
          i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
        }
        s.ctx.stroke(); s.ctx.restore();
        if (bt < pr.tFlight) {
          s.dot(bx, by, 5.5, { color: th.accent });
          // velocity tangent
          const vx = pr.vx, vy = pr.vyAt(bt);
          const vl = Math.hypot(vx, vy) || 1;
          s.arrow(bx, by, bx + vx / vl * 34, by - vy / vl * 34, { color: th.ink, width: 1.6, head: 6, alpha: .85 });
        }
        // angle arc at launch
        const a = rad(state.angle);
        s.ctx.save();
        s.ctx.strokeStyle = th.ink; s.ctx.globalAlpha = .55; s.ctx.lineWidth = 1.2;
        s.ctx.beginPath(); s.ctx.arc(X(0), Y(0), 34, -a, 0); s.ctx.stroke();
        s.ctx.restore();
        s.label('θ', X(0) + 46 * Math.cos(-a / 2), Y(0) + 46 * Math.sin(-a / 2) + 1, { size: 12, color: th.ink, alpha: .8, dir: 'ltr' });
        // initial velocity
        s.arrow(X(0), Y(0), X(0) + Math.cos(a) * 62, Y(0) - Math.sin(a) * 62, { color: th.ink, width: 1.7, head: 7, alpha: .8 });
        s.label('v₀', X(0) + Math.cos(a) * 76, Y(0) - Math.sin(a) * 76, { size: 12, color: th.ink, alpha: .8, dir: 'ltr' });
        // peak
        const px = X(pr.range / 2), py = Y(pr.peak);
        s.line(px, Y(0), px, py, { color: th.ink, width: 1, alpha: .16, dash: [2, 6] });
        s.dot(px, py, 2.6, { color: th.ink, alpha: .45 });
        s.label('الذروة', px + 8, py - 14, { size: 11, color: th.muted, align: 'left' });

        // range marker
        const rx = X(pr.range);
        if (rx < w - 20) {
          s.line(rx, Y(0) - 6, rx, Y(0) + 6, { color: th.ink, width: 1.2, alpha: .4 });
          s.arrow(X(0) + 8, Y(0) + 26, rx - 8, Y(0) + 26, { color: th.ink, width: 1, head: 5, double: true, alpha: .35 });
        }
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      function setAngleFromEvent(e) {
        const r = cv.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const ox = r.width * .055, oy = r.height * .84;
        let a = deg(Math.atan2(oy - y, Math.max(1, x - ox)));
        a = clamp(a, 8, 82);
        state.angle = a;
        angleEl.textContent = Math.round(a) + '°';
        const pr = P.projectile(V0, a, { g: 10 });
        rangeEl.textContent = fmt(pr.range, 1) + ' m';
      }
      ctx.on(cv, 'pointerdown', (e) => { state.dragging = true; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); setAngleFromEvent(e); });
      ctx.on(cv, 'pointermove', (e) => { if (state.dragging) setAngleFromEvent(e); });
      ctx.on(cv, 'pointerup', () => { state.dragging = false; });
      ctx.on(cv, 'pointercancel', () => { state.dragging = false; });
      const pr0 = P.projectile(V0, 45, { g: 10 });
      rangeEl.textContent = fmt(pr0.range, 1) + ' m';
    }
  });

  /* =========================================================
     2 — خريطة الرحلة
     ========================================================= */
  App.addSlide({
    id: 'map', chapter: 'مدخل', title: 'فكرتان كبيرتان',
    html: `
      <div class="head-block rise" style="--i:0">
        <h2 class="h2">فكرتان، لا أكثر.</h2>
        <p class="lede">كل ما في هذه الرحلة يبنى على سؤالين: كيف ينتقل الأثر بين جسمين؟ وكيف يتحرك الجسم بعد أن يُقذف؟</p>
      </div>
      <div class="map-grid">
        <div class="map-block rise" style="--i:1">
          <h3>كميّة الحركة</h3>
          <p class="map-sub">للحركة «مقدار» يمكن قياسه ومقارنته وحفظه. عندما يتصادم جسمان، ما يتبادلانه هو هذا المقدار.</p>
          <div class="map-links">
            <button class="map-link" data-jump="signs"><span>لماذا تختلف سرعة الشاحنة عن السيارة؟</span></button>
            <button class="map-link" data-jump="newton2"><span>من أين تأتي العلاقة ΣF = ΔP/Δt؟</span></button>
            <button class="map-link" data-jump="recoil"><span>لماذا يرتد المدفع إلى الخلف؟</span></button>
            <button class="map-link" data-jump="elastic1d"><span>ما الذي يحدث في التصادم؟</span></button>
          </div>
        </div>
        <div class="map-block rise" style="--i:2">
          <h3>حركة القذائف</h3>
          <p class="map-sub">بعد أن يغادر الجسم اليد، تبقى له سرعة أفقية، وتشدّه الجاذبية إلى الأسفل. النتيجة قوس.</p>
          <div class="map-links">
            <button class="map-link" data-jump="projectile-def"><span>ما الذي يجعل الجسم «قذيفة»؟</span></button>
            <button class="map-link" data-jump="path-eq"><span>لماذا المسار قطع مكافئ؟</span></button>
            <button class="map-link" data-jump="projectile-lab"><span>كيف نصيب هدفاً على بعد معين؟</span></button>
            <button class="map-link" data-jump="max-range"><span>ما الزاوية التي تعطي أبعد مدى؟</span></button>
          </div>
        </div>
      </div>
      <p class="caption rise" style="--i:3;margin-top:clamp(24px,4vh,44px)">لا تحتاج إلى حفظ كل شيء دفعة واحدة. كل شريحة تشرح فكرة، ثم تعطيك شيئاً تغيّره بيدك لترى أثر التغيير.</p>`,
    mount(root, ctx) {
      qsa('[data-jump]', root).forEach((b) => ctx.on(b, 'click', () => {
        const i = App.slides.findIndex((s) => s.id === b.dataset.jump);
        if (i >= 0) App.go(i);
      }));
    }
  });

  /* =========================================================
     3 — فاصل الدرس الأول
     ========================================================= */
  App.addSlide({
    id: 'l1', chapter: 'الدرس الأول · كمية الحركة', title: 'الدرس الأول: كميّة الحركة', theme: 'night', className: 'divider',
    html: `
      <div class="divider-grid">
        <div>
          <div class="kicker rise" style="--i:0">الدرس الأول</div>
          <h2 class="rise" style="--i:1">كميّة<br>الحركة</h2>
          <p class="lede rise" style="--i:2">من مطرقة تهبط على مسمار، إلى مدفع يرتد، إلى سيارتين تتصادمان. فكرة واحدة تربطها كلها.</p>
        </div>
        <div class="divider-figure rise" style="--i:3">
          <div class="eq big" style="color:var(--cream);direction:ltr">${M.vec('P')} = ${M.sym('m', 'الكتلة مقدار قياسي: لا حامل ولا جهة لها، لذلك تُكتب بلا سهم.', 'لماذا m بلا سهم؟')}${M.vec('v')}</div>
        </div>
      </div>
      <div class="divider-num">P</div>`
  });

  /* =========================================================
     4 — لغز اللافتتين
     ========================================================= */
  App.addSlide({
    id: 'signs', chapter: 'الدرس الأول · كمية الحركة', title: 'لماذا 110 للسيارة و90 للشاحنة؟',
    html: `
      ${head('لماذا 110 للسيارة و90 للشاحنة؟', 'على الطريق نفسه، تُسمح للسيارة بسرعة أكبر. إذا كانت الشاحنة أبطأ، فلماذا قد تكون أصعب في التوقف؟')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">جرّب: غيّر كتلة الشاحنة وسرعتها</div>
            <div class="controls" id="signControls"></div>
            <div class="readouts mt-m">
              ${ro('carP', 'كمية حركة السيارة', '36,667', 'kg·m/s')}
              ${ro('truckP', 'كمية حركة الشاحنة', '', 'kg·m/s', 'readout--accent')}
            </div>
          </div>
          <div class="inline-q" id="signQ">
            <p class="inline-q-t">ما الذي يجعل الشاحنة أصعب في التوقف رغم أنها أبطأ؟</p>
            <div class="inline-q-opts">
              <button type="button" class="iq-opt" data-ok="1">كتلتها الأكبر</button>
              <button type="button" class="iq-opt" data-ok="0">سرعتها الأكبر</button>
              <button type="button" class="iq-opt" data-ok="0">حجمها الأكبر</button>
            </div>
            <div class="inline-q-fb" role="status"></div>
          </div>
        </div>
        <div class="stack">
          ${stage('signCanvas', 'mid')}
          <p class="caption">السيارة: <span class="ltr">1.2 t</span> وسرعتها <span class="ltr">110 km/h</span>. الشاحنة: كتلتها وسرعتها من المنزلقين. الأشرطة أسفل الرسم تقارن كمية الحركة، لا الحجم.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m: 20000, v: 90 };
      const cv = root.querySelector('#signCanvas');
      const truckP = root.querySelector('#truckP');
      const carP = root.querySelector('#carP');

      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const roadY = h * .46;
        // road
        s.rect(0, roadY - 10, w, h * .30, { color: th.ink, alpha: .055 });
        s.line(0, roadY - 10, w, roadY - 10, { color: th.ink, width: 1.3, alpha: .25 });
        s.line(0, roadY + h * .20, w, roadY + h * .20, { color: th.ink, width: 1.3, alpha: .25 });
        for (let x = 14; x < w; x += 46) s.line(x, roadY + h * .095, x + 22, roadY + h * .095, { color: th.ink, width: 2, alpha: .14 });
        // vehicles (schematic, side view)
        const carX = w * .30, truckX = w * .68;
        const bob = Math.sin(t * 1.1) * 2;
        // car
        s.ctx.save();
        s.ctx.strokeStyle = th.ink; s.ctx.lineWidth = 2.2; s.ctx.fillStyle = th.paper2;
        s.ctx.beginPath();
        if (s.ctx.roundRect) s.ctx.roundRect(carX - 42, roadY + 18 + bob, 84, 22, 3); else s.ctx.rect(carX - 42, roadY + 18 + bob, 84, 22);
        s.ctx.fill(); s.ctx.stroke();
        s.ctx.beginPath();
        if (s.ctx.roundRect) s.ctx.roundRect(carX - 24, roadY + 2 + bob, 40, 18, 4); else s.ctx.rect(carX - 24, roadY + 2 + bob, 40, 18);
        s.ctx.fill(); s.ctx.stroke();
        [carX - 26, carX + 26].forEach((x) => { s.ctx.beginPath(); s.ctx.arc(x, roadY + 42 + bob, 7, 0, Math.PI * 2); s.ctx.stroke(); });
        s.ctx.restore();
        s.label('سيارة', carX, roadY + 62 + bob, { size: 12, color: th.muted });
        // truck: size reflects mass
        const tScale = clamp(state.m / 20000, .7, 1.6);
        const tw = 92 * tScale, thh = 34 * clamp(tScale, .8, 1.3);
        s.ctx.save();
        s.ctx.strokeStyle = th.ink; s.ctx.lineWidth = 2.3; s.ctx.fillStyle = th.paper2;
        const by = roadY + 40 - thh + bob;
        if (s.ctx.roundRect) { s.ctx.beginPath(); s.ctx.roundRect(truckX - tw / 2, by + 10, tw, thh, 2); s.ctx.fill(); s.ctx.stroke(); } else { s.ctx.fillRect(truckX - tw / 2, by + 10, tw, thh); s.ctx.strokeRect(truckX - tw / 2, by + 10, tw, thh); }
        s.ctx.beginPath();
        s.ctx.rect(truckX - tw / 2, by - 12, tw * .34, 22);
        s.ctx.fill(); s.ctx.stroke();
        [truckX - tw * .3, truckX - tw * .08, truckX + tw * .22].forEach((x) => { s.ctx.beginPath(); s.ctx.arc(x, roadY + 50 + bob, 8, 0, Math.PI * 2); s.ctx.stroke(); });
        s.ctx.restore();
        s.label('شاحنة', truckX, roadY + 70 + bob, { size: 12, color: th.muted });

        // labels with units
        s.label('110 km/h', carX, roadY - 22, { size: 13, weight: 600, color: th.ink, dir: 'ltr' });
        s.label(Math.round(state.v) + ' km/h', truckX, roadY - 30, { size: 13, weight: 600, color: th.ink, dir: 'ltr' });
        s.label(`${fmt(state.m / 1000, 1)} t`, truckX, roadY - 12, { size: 11.5, color: th.muted, dir: 'ltr' });

        // momentum bars (RTL: labels right, values left, bars grow left from the right edge)
        const carV = 110 / 3.6, truckV = state.v / 3.6;
        const pCar = 1200 * carV, pTruck = state.m * truckV;
        const mx = Math.max(pCar, pTruck) * 1.05;
        const rowY = h - 92, barW = w - 40;
        const drawBar = (label, y, color, pct, valTxt) => {
          s.label(label, w - 8, y - 15, { size: 12, color: th.muted, align: 'right' });
          s.label(valTxt, 20, y - 15, { size: 11.5, color, align: 'left', dir: 'ltr', weight: 600 });
          s.rect(20, y, barW, 9, { color: th.ink, alpha: .10 });
          s.rect(w - 20 - barW * pct, y, barW * pct, 9, { color });
        };
        drawBar('كمية حركة السيارة', rowY, th.teal, pCar / mx, fmt(pCar, 0) + ' kg·m/s');
        drawBar('كمية حركة الشاحنة', rowY + 52, th.accent, pTruck / mx, fmt(pTruck, 0) + ' kg·m/s');
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      const host = root.querySelector('#signControls');
      const ms = App.slider(host, {
        label: 'كتلة الشاحنة', min: 5000, max: 40000, step: 1000, value: state.m, unit: '', dec: 0,
        format: (v) => fmt(v / 1000, 1) + ' t',
        onInput: (v) => { state.m = v; update(); }
      });
      const vs = App.slider(host, {
        label: 'سرعة الشاحنة', min: 50, max: 110, step: 1, value: state.v, unit: 'km/h', dec: 0,
        onInput: (v) => { state.v = v; update(); }
      });
      function update() {
        const pT = state.m * state.v / 3.6;
        const pC = 1200 * 110 / 3.6;
        truckP.innerHTML = fmt(pT, 0) + '<small>&nbsp;kg·m/s</small>';
        carP.innerHTML = fmt(pC, 0) + '<small>&nbsp;kg·m/s</small>';
      }
      update();

      const q = root.querySelector('#signQ');
      const fb = q.querySelector('.inline-q-fb');
      const opts = qsa('.iq-opt', q);
      opts.forEach((b) => ctx.on(b, 'click', () => {
        opts.forEach((x) => { x.disabled = true; x.classList.toggle('is-on', x === b); });
        const ok = b.dataset.ok === '1';
        q.classList.add(ok ? 'is-ok' : 'is-no');
        fb.textContent = ok
          ? 'صحيح. الكتلة هنا هي العامل الحاسم: 20 t عند 90 km/h تعطي كمية حركة أكبر بكثير من سيارة 1.2 t عند 110 km/h.'
          : 'ليست العامل الحاسم. الشاحنة أبطأ فعلاً، لكن كتلتها الكبيرة تجعل كمية حركتها أكبر، فتحتاج زمناً أطول أو قوة أكبر للتوقف.';
      }));
    }
  });

  /* =========================================================
     5 — نشاط المطرقة
     ========================================================= */
  App.addSlide({
    id: 'hammers', chapter: 'الدرس الأول · كمية الحركة', title: 'ماذا يحدد عمق الانغراس؟',
    html: `
      ${head('ماذا يحدد عمق الانغراس؟', 'مسماران متماثلان، مطرقتان. غيّر كتلة المطرقة الثانية أو ارتفاعها، ثم أفلتهما معاً.')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">المتغيّران</div>
            <div class="controls" id="hamControls"></div>
            <div class="btn-group mt-m">
              <button class="btn btn--sm" id="hamDrop">أفلت المطرقتين</button>
              <button class="btn btn--sm btn--ghost" id="hamPreset1">كتلتان مختلفتان</button>
              <button class="btn btn--sm btn--ghost" id="hamPreset2">ارتفاعان مختلفان</button>
            </div>
            <div class="readouts mt-l">
              ${ro('hamP1', 'كمية حركة الأولى', '2.2', 'kg·m/s')}
              ${ro('hamP2', 'كمية حركة الثانية', '—', 'kg·m/s', 'readout--accent')}
            </div>
          </div>
        </div>
        <div class="stack">
          ${stage('hamCanvas', 'tall')}
          <p class="caption">ارتفاع السقوط يحدد السرعة عند الاصطدام: ${M.m('v = √(2gh)')}. الكتلة تحدد «ثقل» الحركة. المسمار يحفظ أثر الجداء. ${App.term('لماذا m v وليس m v²؟', '<p>الانغراس الحقيقي يعتمد على الطاقة أيضاً (mv²/2) وعلى مقاومة الخشب. لكن في التصادمات، الكمية التي تتبادل وتحفظ هي mv، ولهذا تُعرَّف كمية الحركة بها. التجربة تُظهر أثر الكتلة والسرعة معاً، لا قانوناً كاملاً للانغراس.</p>', 'تمييز دقيق')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m2: 2, h2: 0.5, t0: 0, dropped: false };
      const p1El = root.querySelector('#hamP1');
      const p2El = root.querySelector('#hamP2');
      const A = { m: 1, h: 0.55 };
      const g = 10;

      const cv = root.querySelector('#hamCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const half = w / 2;
        s.line(half, 18, half, h - 18, { color: th.ink, width: 1, alpha: .14, dash: [4, 7] });

        const drawPanel = (cx, mass, height, isB) => {
          const woodY = h - 64;
          const boardW = Math.min(half * .62, 210);
          const boardX = cx - boardW / 2;
          const vImp = Math.sqrt(2 * g * height);
          const startY = woodY - 40 - height * 205;
          // wood block
          s.rect(boardX, woodY, boardW, 34, { color: th.ink, alpha: .10 });
          s.line(boardX, woodY, boardX + boardW, woodY, { color: th.ink, width: 2, alpha: .6 });
          for (let i = 1; i < 9; i++) {
            s.line(boardX + i * boardW / 9, woodY + 5, boardX + i * boardW / 9 - 5, woodY + 31, { color: th.ink, width: 1, alpha: .12 });
          }
          // surface reference line
          s.line(boardX + 6, woodY, boardX + boardW - 6, woodY, { color: th.accent, width: 1, alpha: .45, dash: [4, 5] });
          // ruler
          const rulerX = cx - boardW * .42;
          s.line(rulerX, startY, rulerX, woodY - 4, { color: th.ink, width: 1, alpha: .18, dash: [3, 6] });
          for (let m = 0; m <= height + .001; m += .1) {
            const yy = woodY - 4 - m * 205;
            const big = Math.abs(m * 10 - Math.round(m * 10)) < .001 && Math.round(m * 10) % 5 === 0;
            s.line(rulerX - (big ? 7 : 4), yy, rulerX, yy, { color: th.ink, width: 1, alpha: big ? .4 : .22 });
          }
          s.label('h', rulerX - 12, startY + 8, { size: 11, color: th.muted, dir: 'ltr' });
          s.label(fmt(height, 2) + ' m', rulerX - 22, (startY + woodY) / 2, { size: 10.5, color: th.muted, dir: 'ltr' });

          const elapsed = state.dropped ? Math.max(0, t - state.t0) : 0;
          const dropT = .52;
          const phi = clamp(elapsed / dropT, 0, 1);
          const y = startY + (woodY - 26 - startY) * phi * phi;
          const rot = -1.16 + phi * .12;
          const L = 76;
          const hx = cx, hy = y;
          const px = hx - Math.cos(rot) * L * .78, py = hy - Math.sin(rot) * L * .78;
          // ghost at the release point
          if (phi > 0.04) {
            s.ctx.save(); s.ctx.globalAlpha = .16;
            App.draw.hammer(s, cx - Math.cos(rot) * L * .78, startY - Math.sin(rot) * L * .78, rot, L, { color: th.ink });
            s.ctx.restore();
            s.line(cx, startY, cx, y - 4, { color: th.ink, width: 1, alpha: .2, dash: [3, 6] });
          }
          // impact ticks
          if (phi >= 1 && elapsed < dropT + .4) {
            const a = 1 - clamp((elapsed - dropT) / .4, 0, 1);
            for (let i = 0; i < 5; i++) {
              const ang = -Math.PI / 2 + (i - 2) * .34;
              s.line(hx + Math.cos(ang) * 9, hy + Math.sin(ang) * 9, hx + Math.cos(ang) * 24, hy + Math.sin(ang) * 24, { color: th.accent, width: 1.8, alpha: a });
            }
          }
          App.draw.hammer(s, px, py, rot, L, { color: th.ink });
          // nail + penetration
          const pen = phi >= 1 ? clamp(5 + mass * vImp * 1.15, 6, 30) * clamp((elapsed - dropT) / .25, 0, 1) : 4;
          const nailTop = woodY - 16 + pen;
          s.line(cx, nailTop, cx, nailTop + 30, { color: th.ink, width: 4.2, alpha: .9 });
          s.line(cx - 7, nailTop, cx + 7, nailTop, { color: th.ink, width: 3 });
          s.label('m', cx - 14, nailTop + 18, { size: 10.5, color: th.muted, dir: 'ltr' });
          // labels
          s.label(`${fmt(mass, 1)} kg`, cx, h - 40, { size: 12.5, weight: 600, color: isB ? th.accent : th.ink, dir: 'ltr' });
          s.label(`v = ${fmt(vImp, 1)} m/s`, cx, h - 24, { size: 10.5, color: th.muted, dir: 'ltr' });
          s.label(isB ? 'المطرقة الثانية' : 'المطرقة الأولى', cx, h - 8, { size: 10.5, color: th.muted });
        };
        drawPanel(half * .52, A.m, A.h, false);
        drawPanel(half * 1.48, state.m2, state.h2, true);
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      const host = root.querySelector('#hamControls');
      App.slider(host, {
        label: 'كتلة المطرقة الثانية', min: .5, max: 3, step: .1, value: state.m2, unit: 'kg', dec: 1,
        onInput: (v) => { state.m2 = v; drop(); update(); }
      });
      App.slider(host, {
        label: 'ارتفاع المطرقة الثانية', min: .25, max: 1.0, step: .05, value: state.h2, unit: 'm', dec: 2,
        onInput: (v) => { state.h2 = v; drop(); update(); }
      });

      function update() {
        const p1 = A.m * Math.sqrt(2 * g * A.h);
        const p2 = state.m2 * Math.sqrt(2 * g * state.h2);
        p1El.innerHTML = fmt(p1, 2) + '<small>&nbsp;kg·m/s</small>';
        p2El.innerHTML = fmt(p2, 2) + '<small>&nbsp;kg·m/s</small>';
      }
      function drop() {
        state.t0 = sim.t;
        state.dropped = true;
      }
      update();
      const btn = root.querySelector('#hamDrop');
      ctx.on(btn, 'click', () => { drop(); });
      ctx.on(root.querySelector('#hamPreset1'), 'click', () => {
        state.m2 = 2.5; state.h2 = A.h;
        const inputs = qsa('input', host);
        inputs[0].value = state.m2; inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = state.h2; inputs[1].dispatchEvent(new Event('input'));
        update();
      });
      ctx.on(root.querySelector('#hamPreset2'), 'click', () => {
        state.m2 = 1; state.h2 = 0.95;
        const inputs = qsa('input', host);
        inputs[0].value = state.m2; inputs[0].dispatchEvent(new Event('input'));
        inputs[1].value = state.h2; inputs[1].dispatchEvent(new Event('input'));
        update();
      });
      update();
      setTimeout(() => { if (ctx.alive()) drop(); }, 500);
    }
  });

  /* =========================================================
     6 — تعريف كمية الحركة
     ========================================================= */
  App.addSlide({
    id: 'momentum', chapter: 'الدرس الأول · كمية الحركة', title: 'كتلة تتحرك، ولها اتجاه',
    html: `
      ${head('كتلة تتحرك، ولها اتجاه.', 'لكل جسم يتحرك «كمية حركة»: جداء كتلته في شعاع سرعته. هذه هي الفكرة التي سنبني عليها كل شيء.')}
      <div class="split">
        <div class="stack">
          <div class="eq-panel">
            <div class="eq big">${M.vec('P')} = ${M.sym('m', 'الكتلة مقدار قياسي (scalar): عدد موجب بلا اتجاه. لذلك لا يوضع فوقها سهم.', 'لماذا m بلا سهم؟')} ${M.vec('v')}</div>
            <div class="eq-anatomy">
              <button type="button" class="ea-item" data-note="كمية الحركة شعاع: له حامل وجهة وشدة. وحدتها kg·m/s." data-note-title="لماذا السهم فوق P؟"><span class="ea-sym">${M.vec('P')}</span><small>كمية الحركة — شعاع</small></button>
              <button type="button" class="ea-item" data-note="الكتلة مقدار عددي موجب، لا حامل ولا جهة له، لذلك يُكتب بلا سهم." data-note-title="لماذا m بلا سهم؟"><span class="ea-sym">${M.m('m')}</span><small>الكتلة — مقدار</small></button>
              <button type="button" class="ea-item" data-note="السرعة شعاع مماسّ للمسار في لحظة الحركة، وجهته هي جهة الحركة." data-note-title="لماذا v شعاع؟"><span class="ea-sym">${M.vec('v')}</span><small>السرعة — شعاع</small></button>
            </div>
          </div>
          <div class="panel">
            <div class="panel-label">غيّر الكتلة والسرعة</div>
            <div class="controls" id="momControls"></div>
            <div class="row between mt-m">
              <div class="readouts">
                ${ro('momP', 'كمية الحركة', '10', 'kg·m/s', 'readout--accent')}
              </div>
              <div id="momDir"></div>
            </div>
          </div>
        </div>
        <div class="stack">
          ${stage('momCanvas', 'tall')}
          <p class="caption">السهم الأخضر هو السرعة، والسهم الأحمر هو كمية الحركة. لهما الاتجاه نفسه، ويختلف طولهما بمقدار الكتلة.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m: 2, v: 5, dir: 1 };
      const PEl = root.querySelector('#momP');
      let sim;
      const host = root.querySelector('#momControls');
      App.slider(host, {
        label: 'الكتلة', min: .5, max: 10, step: .1, value: state.m, unit: 'kg', dec: 1,
        onInput: (v) => { state.m = v; update(); }
      });
      App.slider(host, {
        label: 'السرعة', min: 0, max: 12, step: .1, value: state.v, unit: 'm/s', dec: 1,
        onInput: (v) => { state.v = v; update(); }
      });
      App.seg(root.querySelector('#momDir'), ['إلى اليمين', 'إلى اليسار'], (i) => { state.dir = i === 0 ? 1 : -1; update(); }, 0);

      const cv = root.querySelector('#momCanvas');
      sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const cy = h * .48;
        s.line(w * .06, cy + 48, w * .94, cy + 48, { color: th.ink, width: 1.4, alpha: .3 });
        for (let x = w * .06; x < w * .94; x += (w * .88) / 12) {
          s.line(x, cy + 45, x, cy + 51, { color: th.ink, width: 1, alpha: .2 });
        }
        const speed = state.v;
        const span = w * .62;
        let bx = w * .5;
        if (speed > 0) {
          const cyc = 4.2;
          const u = ((t * (0.18 + speed / 34)) % cyc) / cyc;
          bx = state.dir > 0 ? w * .18 + u * span : w * .82 - u * span;
        }
        const r = 11 + state.m * 1.35;
        App.draw.ball(s, bx, cy, Math.min(r, 22), { color: th.accent });
        s.label('m', bx, cy + 1, { size: 10.5, color: th.night ? '#111A1F' : '#F3EEE3', weight: 700, dir: 'ltr' });
        if (speed > 0) {
          const vLen = 22 + speed * 7;
          const pLen = 22 + state.m * speed * 7.2;
          const d = state.dir;
          s.arrow(bx, cy - r - 16, bx + d * vLen, cy - r - 16, { color: th.teal, width: 2, head: 7, label: 'v', size: 12 });
          s.arrow(bx, cy + r + 20, bx + d * pLen, cy + r + 20, { color: th.accent, width: 3, head: 9, label: 'P', size: 13.5 });
        }
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      function update() {
        PEl.innerHTML = fmt(state.m * state.v, 2) + '<small>&nbsp;kg·m/s</small>';
      }
      update();
    }
  });

  /* =========================================================
     7 — عناصر الشعاع
     ========================================================= */
  App.addSlide({
    id: 'vector-parts', chapter: 'الدرس الأول · كمية الحركة', title: 'لكل شعاع ثلاثة أسئلة',
    html: `
      ${head('لكل شعاع ثلاثة أسئلة.', 'أين حامله؟ إلى أين يشير؟ وكم طوله؟ اضغط على أي عنصر ليُضاء على الرسم.')}
      <div class="split">
        <div class="stack">
          <div class="anatomy" id="anatomy">
            <button type="button" data-k="0" aria-pressed="true"><span class="bar"></span><span><b>الحامل</b><small>الخط الذي يحمل الشعاع — هنا مماسّ المسار عند النقطة.</small></span></button>
            <button type="button" data-k="1" aria-pressed="false"><span class="bar"></span><span><b>الجهة</b><small>الطرف الذي يشير إليه السهم — جهة الحركة.</small></span></button>
            <button type="button" data-k="2" aria-pressed="false"><span class="bar"></span><span><b>الشدّة</b><small>طول السهم بمقياس مرسوم — مقدار ${M.m('P = m v')}.</small></span></button>
          </div>
          <div class="panel">
            <div class="controls" id="vecControls"></div>
          </div>
        </div>
        <div class="stack">
          ${stage('vecCanvas', 'tall')}
          <p class="caption">حرّك النقطة على المسار. لاحظ أن الحامل يدور مع المسار، بينما الطول يتغير بحسب السرعة. ${App.term('لماذا الحامل هو المماسّ؟', '<p>السرعة اللحظية لجسم على مسار منحنٍ تكون دائماً مماسّة للمسار في تلك اللحظة. لو قطع الخيط فجأة، لطار الجسم في اتجاه المماس، لا في اتجاه نصف القطر.</p>')} ${App.term('لماذا نرسم السهم بطول معيّن؟', '<p>طول السهم يمثل شدة الشعاع وفق مقياس ثابت. إذا تضاعفت السرعة، تضاعف طول سهمها. الاتجاه لا يتغير إلا إذا تغيّرت جهة الحركة.</p>')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { mode: 0, s: .35, pulse: 0 };
      const cv = root.querySelector('#vecCanvas');
      let sim;
      const path = (u, w, h) => ({
        x: w * .12 + u * w * .72,
        y: h * .70 - Math.sin(u * Math.PI) * h * .38
      });
      const tangent = (u, w, h) => {
        const e = .001;
        const a = path(Math.max(0, u - e), w, h), b = path(Math.min(1, u + e), w, h);
        const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
        return { x: dx / l, y: dy / l };
      };
      sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const p = path(state.s, w, h);
        const tg = tangent(state.s, w, h);
        // path
        s.ctx.save();
        s.ctx.strokeStyle = th.ink; s.ctx.globalAlpha = .4; s.ctx.lineWidth = 1.5; s.ctx.setLineDash([4, 7]);
        s.ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const q = path(i / 80, w, h);
          i ? s.ctx.lineTo(q.x, q.y) : s.ctx.moveTo(q.x, q.y);
        }
        s.ctx.stroke(); s.ctx.restore();
        // tangent (holder)
        const hl = Math.min(w, h) * .34;
        const holderOn = state.mode === 0;
        s.line(p.x - tg.x * hl, p.y - tg.y * hl, p.x + tg.x * hl, p.y + tg.y * hl, {
          color: holderOn ? th.accent : th.ink, width: holderOn ? 2.4 : 1.2, alpha: holderOn ? .95 : .35, dash: holderOn ? [] : [4, 6]
        });
        if (holderOn) {
          s.label('الحامل', p.x - tg.x * hl - 10, p.y - tg.y * hl - 12, { size: 12.5, color: th.accent, weight: 600 });
        }
        // velocity arrow
        const vlen = 70 + state.v * 9;
        const ax = p.x + tg.x * vlen, ay = p.y + tg.y * vlen;
        s.arrow(p.x, p.y, ax, ay, { color: state.mode === 1 ? th.accent : th.teal, width: state.mode === 1 ? 3.2 : 2.4, head: state.mode === 1 ? 13 : 9 });
        s.label('v', ax + tg.x * 16, ay + tg.y * 16, { size: 14, color: state.mode === 1 ? th.accent : th.teal, weight: 700, dir: 'ltr' });
        if (state.mode === 1) {
          s.ring(ax, ay, 14 + Math.sin(t * 4) * 3, { color: th.accent, width: 1.6, alpha: .7 });
          s.label('الجهة', ax + tg.x * 34, ay + tg.y * 34 + 18, { size: 12.5, color: th.accent, weight: 600 });
        }
        // magnitude brace
        if (state.mode === 2) {
          const nx = -tg.y, ny = tg.x;
          const off = 16;
          s.line(p.x + nx * off, p.y + ny * off, ax + nx * off, ay + ny * off, { color: th.accent, width: 1.3, alpha: .8 });
          s.arrow(p.x + nx * off, p.y + ny * off, ax + nx * off, ay + ny * off, { color: th.accent, width: 1, head: 5, double: true });
          s.label('الشدة', (p.x + ax) / 2 + nx * (off + 14), (p.y + ay) / 2 + ny * (off + 14), { size: 12.5, color: th.accent, weight: 600 });
        }
        s.dot(p.x, p.y, 6, { color: th.ink });
        s.label('نقطة مادّية', p.x, p.y + 24, { size: 11, color: th.muted });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      const host = root.querySelector('#vecControls');
      App.slider(host, {
        label: 'موضع النقطة على المسار', min: 0, max: 1, step: .01, value: state.s, unit: '', dec: 2,
        onInput: (v) => { state.s = v; }
      });
      App.slider(host, {
        label: 'شدة السرعة', min: 1, max: 10, step: .1, value: 4, unit: 'm/s', dec: 1,
        onInput: (v) => { state.v = v; }
      });
      state.v = 4;

      qsa('#anatomy button', root).forEach((b) => {
        ctx.on(b, 'click', () => {
          state.mode = +b.dataset.k;
          qsa('#anatomy button', root).forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        });
      });
    }
  });

  /* =========================================================
     8 — الوحدة
     ========================================================= */
  App.addSlide({
    id: 'units', chapter: 'الدرس الأول · كمية الحركة', title: 'وحدة واحدة تحفظها',
    html: `
      ${head('وحدة واحدة تحفظها.', 'لا تحفظ الحروف؛ اشتقّها من المعادلة نفسها. الكتلة بالكيلوغرام، والسرعة بالمتر لكل ثانية.')}
      <div class="split">
        <div class="stack">
          <div class="unit-machine" id="unitMachine">
            <div class="um-row">
              <span class="um-tile">kg</span><span class="um-op">×</span><span class="um-tile">m</span><span class="um-op">/</span><span class="um-tile">s</span>
            </div>
            <div class="um-eq">=</div>
            <div class="um-out"><span>kg·m/s</span></div>
            <button class="btn btn--sm" id="umRun">اشتقّ الوحدة</button>
          </div>
          <div class="panel">
            <div class="note-links">${App.term('هل N·s وحدة أخرى؟', '<p>لا، هي الوحدة نفسها بصيغة أخرى. من القانون الثاني: N = kg·m/s²، وبضربها في s نحصل على kg·m/s. لذلك وحدة الدفع N·s تساوي وحدة كمية الحركة تماماً.</p>', 'وحدة مكافئة')}${App.term('لماذا لا نقول kg·m/s²؟', '<p>kg·m/s² هي وحدة القوة (نيوتن). أضفنا قوة مضروبة في زمن، لا قوة فقط. لذلك يبقى الزمن في المقام مرة واحدة: kg·m/s.</p>', 'تمييز الوحدات')}</div>
          </div>
        </div>
        <div class="stack">
          <div class="quiz" id="unitQuiz"></div>
        </div>
      </div>`,
    mount(root, ctx) {
      const run = () => {
        const m = root.querySelector('#unitMachine');
        m.classList.remove('is-run');
        void m.offsetWidth;
        m.classList.add('is-run');
      };
      ctx.on(root.querySelector('#umRun'), 'click', run);
      setTimeout(run, 400);
      App.Quiz(root.querySelector('#unitQuiz'), {
        questions: [
          {
            q: 'ما وحدة كمية الحركة في الجملة الدولية؟',
            options: [
              { t: `${M.m('kg·m/s')}`, ok: true, why: 'من العلاقة P = m v: كيلوغرام × متر/ثانية. وهي نفس وحدة الدفع N·s.' },
              { t: `${M.m('kg·m/s²')}`, ok: false, why: 'هذه وحدة القوة (النيوتن)، لأنها كتلة × تسارع. كمية الحركة لا تحتوي على تسارع.' },
              { t: `${M.m('kg·m²/s²')}`, ok: false, why: 'هذه وحدة الطاقة (الجول). لاحظ أن الطاقة تحتوي على مربع السرعة، أما كمية الحركة فتحتوي على السرعة فقط.' },
              { t: `${M.m('kg/s')}`, ok: false, why: 'هذه وحدة معدل تدفق كتلي، وليست كمية حركة. اختلطت الكتلة مع الزمن فقط.' }
            ]
          },
          {
            q: 'جسم كتلته 4 kg يتحرك بسرعة 3 m/s. ما كمية حركته؟',
            options: [
              { t: `${M.m('12 kg·m/s')}`, ok: true, why: 'P = m v = 4 × 3 = 12 kg·m/s.' },
              { t: `${M.m('7 kg·m/s')}`, ok: false, why: 'هذه نتيجة جمع 4 + 3، والجمع لا يعطي وحدة كمية الحركة. القاعدة ضرب.' },
              { t: `${M.m('36 kg·m/s')}`, ok: false, why: 'هذه 4 × 3²، أي استخدمت مربع السرعة. مربع السرعة يظهر في الطاقة، لا في كمية الحركة.' },
              { t: `${M.m('1.33 kg·m/s')}`, ok: false, why: 'هذه 4 ÷ 3. كمية الحركة جداء وليست نسبة.' }
            ]
          }
        ]
      });
    }
  });

  /* ---------------- chapter 1 continues in ch2.js ---------------- */
})();
