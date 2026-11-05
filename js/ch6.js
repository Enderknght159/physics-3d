/* =========================================================
   الفصل السادس — تطبيقات القذف والختام
   ========================================================= */
(function () {
  'use strict';
  const App = window.App, M = App.M, P = App.physics;
  const { fmt, clamp, rad, deg, qs, qsa } = App.util;

  const head = (t, l = '', cls = '') =>
    `<div class="head-block rise" style="--i:0"><h2 class="h2 ${cls}">${t}</h2>${l ? `<p class="lede">${l}</p>` : ''}</div>`;
  const stage = (id, cls = 'tall', extra = '') =>
    `<div class="stage ${cls}" ${extra}><canvas id="${id}" aria-label="محاكاة حركة"></canvas></div>`;
  const ro = (id, k, v = '—', u = '', cls = '') =>
    `<div class="readout ${cls}"><span class="readout-k">${k}</span><span class="readout-v" id="${id}">${v}${u ? `<small>&nbsp;${u}</small>` : ''}</span></div>`;
  const fig = (inner, vb = '0 0 520 300', label = '') =>
    `<figure class="svg-figure"><svg class="diagram" viewBox="${vb}" role="img" ${label ? `aria-label="${label}"` : ''}>${inner}</svg></figure>`;

  /* =========================================================
     المدى والذروة
     ========================================================= */
  App.addSlide({
    id: 'range-peak', chapter: 'الدرس الثاني · حركة القذائف', title: 'المدى والذروة والزمن',
    html: `
      ${head('ثلاثة أرقام تلخّص الرحلة.', 'من معادلات الحركة نحصل على المدى والذروة وزمن الطيران. كلها تعتمد على السرعة والزاوية.')}
      <div class="split">
        <div class="stack">
          <div id="rpPlot"></div>
          <div class="panel panel--tight">
            <div class="controls inline" id="rpControls"></div>
            <div class="readouts mt-s">
              ${ro('rpR', 'المدى', '', 'm')}
              ${ro('rpH', 'الذروة', '', 'm')}
              ${ro('rpT', 'زمن الطيران', '', 's')}
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="eq-panel">
            <div class="eq small">R = ${M.frac('v₀² sin 2θ', 'g')}</div>
            <div class="eq small">H = ${M.frac('v₀² sin²θ', '2g')}</div>
            <div class="eq small">T = ${M.frac('2v₀ sinθ', 'g')}</div>
          </div>
          <p class="caption">${App.term('لماذا يظهر sin 2θ في المدى؟', '<p>لأن زمن الطيران يتناسب مع sinθ، والسرعة الأفقية مع cosθ. حاصل ضربهما يعطي sinθ cosθ، أي نصف sin 2θ. لذلك يعتمد المدى على ضعف الزاوية.</p>', 'سبب الصيغة')} ${App.term('أين تكون الذروة أفقياً؟', '<p>في منتصف المدى عندما تكون نقطة الانطلاق والسقوط على الارتفاع نفسه. ذلك لأن الحركة الأفقية منتظمة.</p>', 'موضع الذروة')}</p>
          <div class="result-band" style="grid-template-columns:1fr">
            <div class="result-item"><span class="result-k">الزاوية التي تعطي أبعد مدى</span><strong>45°</strong><small>لأن sin 2θ أكبر ما يمكن عند 2θ = 90°، أي θ = 45°.</small></div>
          </div>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 20, theta: 45 };
      const plot = new App.Plot(root.querySelector('#rpPlot'), {
        width: 640, height: 300, pad: { l: 58, r: 28, t: 26, b: 48 },
        x: { min: 0, max: 90, step: 15, label: 'θ (°)' },
        y: { min: 0, max: 45, step: 5, label: 'R (m)' },
        ariaLabel: 'المدى بدلالة زاوية القذف'
      });
      const rEl = root.querySelector('#rpR'), hEl = root.querySelector('#rpH'), tEl = root.querySelector('#rpT');
      function render() {
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        plot.update({
          series: [{ fn: (th) => state.v0 * state.v0 * Math.sin(2 * rad(th)) / 10, color: 'accent', width: 3 }],
          markers: [{ x: state.theta, y: pr.range, label: fmt(pr.range, 1), color: 'accent', labelDy: -12, labelAnchor: 'middle' }],
          guides: [{ x: 45, color: 'var(--ink-3)', label: '45°' }]
        });
        rEl.innerHTML = fmt(pr.range, 1) + '<small>&nbsp;m</small>';
        hEl.innerHTML = fmt(pr.peak, 1) + '<small>&nbsp;m</small>';
        tEl.innerHTML = fmt(pr.tFlight, 2) + '<small>&nbsp;s</small>';
      }
      const host = root.querySelector('#rpControls');
      App.slider(host, { label: 'السرعة', min: 10, max: 30, step: 1, value: state.v0, unit: 'm/s', dec: 0, onInput: (v) => { state.v0 = v; render(); } });
      App.slider(host, { label: 'الزاوية', min: 5, max: 85, step: 1, value: state.theta, unit: '°', dec: 0, onInput: (v) => { state.theta = v; render(); } });
      render();
    }
  });

  /* =========================================================
     مسألة السفينة
     ========================================================= */
  App.addSlide({
    id: 'ship', chapter: 'الدرس الثاني · حركة القذائف', title: 'مسألة: ثلاث محاولات',
    html: `
      ${head('ثلاث محاولات، هدف واحد.', 'سفينة تطلق قذائف بسرعة <span class="ltr">180 m/s</span> بزوايا <span class="ltr">25°</span> و<span class="ltr">45°</span> و<span class="ltr">60°</span>. الهدف على مسافة أفقية محددة. أي محاولة تصيبه؟')}
      <div class="split">
        <div class="stack">
          ${stage('shipCanvas', 'tall')}
          <p class="caption">كل المسارات من السرعة نفسها. الزاوية تغيّر المدى والذروة وزمن الطيران. ${App.term('لماذا لا تصيب الزاوية 60° الهدف الأقرب؟', '<p>لأن مداها 2806 m، والهدف على 3240 m. الزاوية الأكبر تعطي ذروة أعلى لكن مدى أقصر (بعد 45°).</p>', 'المقارنة')}</p>
        </div>
        <div class="stack">
          <table class="dtable">
            <thead><tr><th>θ</th><th class="num">المدى</th><th class="num">الذروة</th><th class="num">الزمن</th></tr></thead>
            <tbody>
              <tr><td>25°</td><td class="num">2,479 m</td><td class="num">289 m</td><td class="num">15.2 s</td></tr>
              <tr class="is-on"><td>45°</td><td class="num">3,240 m</td><td class="num">810 m</td><td class="num">25.5 s</td></tr>
              <tr><td>60°</td><td class="num">2,806 m</td><td class="num">1,215 m</td><td class="num">31.2 s</td></tr>
            </tbody>
          </table>
          <div class="inline-q" id="shipQ">
            <p class="inline-q-t">أي زاوية تصيب هدفاً على 3240 m؟</p>
            <div class="inline-q-opts">
              <button class="iq-opt" data-ok="0">25°</button>
              <button class="iq-opt" data-ok="1">45°</button>
              <button class="iq-opt" data-ok="0">60°</button>
            </div>
            <div class="inline-q-fb" role="status"></div>
          </div>
          <p class="caption">${App.term('لماذا القيم في الكتاب مختلفة قليلاً؟', '<p>لأن الكتاب يستخدم قيماً مقربة للزمن (15 و26 و32 s). الحساب الدقيق ب‍ g = 10 يعطي 15.2 و25.5 و31.2 s. الفرق لا يغيّر الاستنتاج.</p>', 'التقريب')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const cv = root.querySelector('#shipCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const angles = [{ a: 25, c: th.teal }, { a: 45, c: th.accent }, { a: 60, c: th.ink }];
        const worldW = 3800, worldH = 1450;
        const sc = Math.min(w / worldW, h / worldH);
        const ox = 26, oy = h - 42;
        s.line(ox, oy, w - 10, oy, { color: th.ink, width: 1.3, alpha: .3 });
        // ships
        s.ctx.save();
        s.ctx.strokeStyle = th.ink; s.ctx.lineWidth = 2;
        s.ctx.beginPath(); s.ctx.moveTo(ox + 4, oy - 10); s.ctx.lineTo(ox + 54, oy - 10); s.ctx.lineTo(ox + 46, oy); s.ctx.lineTo(ox + 12, oy); s.ctx.closePath(); s.ctx.stroke();
        s.ctx.strokeRect(ox + 22, oy - 24, 18, 14);
        s.ctx.restore();
        s.label('السفينة', ox + 30, oy + 22, { size: 10.5, color: th.muted });
        // target
        const tx = ox + 3240 * sc;
        s.line(tx, oy - 10, tx, oy - 90, { color: th.accent, width: 1.2, dash: [4, 6] });
        s.label('الهدف', tx, oy - 100, { size: 10.5, color: th.accent });
        // paths
        angles.forEach(({ a, c }, idx) => {
          const pr = P.projectile(180, a, { g: 10 });
          s.ctx.save(); s.ctx.strokeStyle = c; s.ctx.globalAlpha = .9; s.ctx.lineWidth = 2; s.ctx.setLineDash(idx === 1 ? [] : [5, 6]);
          s.ctx.beginPath();
          for (let i = 0; i <= 120; i++) {
            const tt = pr.tFlight * i / 120;
            const px = ox + pr.x(tt) * sc, py = oy - pr.y(tt) * sc;
            i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
          }
          s.ctx.stroke(); s.ctx.restore();
          const endX = ox + pr.range * sc;
          s.label(a + '°', endX - (a === 45 ? 18 : 0), oy - (a === 45 ? 20 : 8), { size: 10, color: c, dir: 'ltr' });
        });
        // sea
        for (let x = ox; x < w - 8; x += 22) s.line(x, oy + 8, x + 10, oy + 8, { color: th.teal, width: 1, alpha: .25 });
        s.label('180 m/s', w * .5, 26, { size: 12, color: th.muted, dir: 'ltr' });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      const q = root.querySelector('#shipQ');
      const fb = q.querySelector('.inline-q-fb');
      qsa('.iq-opt', q).forEach((b) => ctx.on(b, 'click', () => {
        qsa('.iq-opt', q).forEach((x) => { x.disabled = true; x.classList.toggle('is-on', x === b); });
        const ok = b.dataset.ok === '1';
        q.classList.add(ok ? 'is-ok' : 'is-no');
        fb.textContent = ok ? 'صحيح. 45° تعطي المدى 3240 m، وهو المدى المطلوب.' : 'هذه الزاوية تعطي مدى مختلفاً: 25° نحو 2479 m، و60° نحو 2806 m.';
      }));
    }
  });

  /* =========================================================
     القذف الأفقي
     ========================================================= */
  App.addSlide({
    id: 'horizontal', chapter: 'الدرس الثاني · حركة القذائف', title: 'القذف الأفقي: السقوط والانطلاق معاً',
    html: `
      ${head('أفقياً، تسقط وتمضي في الوقت نفسه.', 'ثلاث كرات تغادر المنحدرات أفقياً في اللحظة نفسها. الارتفاعات مختلفة، والسرعة الأفقية تختلف.')}
      <div class="split">
        <div class="stack">
          ${stage('hzCanvas', 'tall')}
          <p class="caption">الارتفاع المشترك للحافة يحدد زمن السقوط؛ سرعة الانطلاق تحدد المدى.</p>
        </div>
        <div class="stack">
          <div class="eq-panel">
            <div class="eq">${M.m('x = v₀ t')} &nbsp;،&nbsp; ${M.m('y = ½gt²')}</div>
            <div class="eq">${M.m('t = √(2h/g)')}</div>
          </div>
          <div class="inline-q" id="hzQ">
            <p class="inline-q-t">أي كرة تبتعد أكثر عن الحافة؟</p>
            <div class="inline-q-opts">
              <button class="iq-opt" data-ok="0">الأولى (الأدنى)</button>
              <button class="iq-opt" data-ok="0">الثانية</button>
              <button class="iq-opt" data-ok="1">الثالثة (الأعلى)</button>
            </div>
            <div class="inline-q-fb" role="status"></div>
          </div>
          <p class="caption">${App.term('هل تصل الكرات معاً إلى الأرض؟', '<p>نعم، إذا كانت تنطلق من الارتفاع نفسه. زمن السقوط يعتمد على الارتفاع فقط، وليس على السرعة الأفقية. الحركتان مستقلتان.</p>', 'الاستقلال')} ${App.term('لماذا السرعة الأفقية أكبر للكرة الأعلى؟', '<p>لأنها تنزل من ارتفاع أكبر، فتكتسب طاقة حركية أكبر عند الحافة: v = √(2gh). الطاقة لا تعتمد على شكل المسار، بل على فرق الارتفاع.</p>', 'الطاقة')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const cv = root.querySelector('#hzCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const ground = h * .86, lip = h * .55;
        const xs = [w * .15, w * .4, w * .65];
        const tops = [h * .30, h * .22, h * .14];
        const q = (t % 4.4) / 4.4;
        App.draw.ground(s, ground, w * .04, w * .96, { gap: 22 });
        xs.forEach((x, i) => {
          const top = tops[i];
          const rng = w * .13 + (lip - top) * .45;
          const lipX = x + 55;
          // ramp band
          s.ctx.save();
          s.ctx.strokeStyle = th.ink; s.ctx.fillStyle = 'rgba(29,102,107,.10)'; s.ctx.lineWidth = 2;
          s.ctx.beginPath();
          s.ctx.moveTo(x - 70, top);
          s.ctx.bezierCurveTo(x - 30, top + 8, x + 15, lip - 8, lipX, lip);
          s.ctx.stroke();
          s.ctx.beginPath();
          s.ctx.moveTo(x - 70, top);
          s.ctx.bezierCurveTo(x - 30, top + 8, x + 15, lip - 8, lipX, lip);
          s.ctx.lineTo(lipX, ground);
          s.ctx.lineTo(x - 70, ground);
          s.ctx.closePath();
          s.ctx.globalAlpha = .08; s.ctx.fill(); s.ctx.restore();
          // supports
          s.line(x - 50, top + 12, x - 50, ground, { color: th.ink, width: 1.2, alpha: .18 });
          s.line(x + 30, lip + 3, x + 30, ground, { color: th.ink, width: 1.2, alpha: .18 });
          // height dim
          s.line(x - 78, top, x - 78, lip, { color: th.muted, width: 1, alpha: .4, dash: [4, 5] });
          s.line(x - 82, top, x - 74, top, { color: th.muted, width: 1, alpha: .4 });
          s.line(x - 82, lip, x - 74, lip, { color: th.muted, width: 1, alpha: .4 });
          s.label('h' + (i + 1), x - 90, (top + lip) / 2, { size: 10.5, color: th.muted, dir: 'ltr' });
          // dashed path
          s.ctx.save(); s.ctx.strokeStyle = th.ink; s.ctx.globalAlpha = .28; s.ctx.lineWidth = 1.2; s.ctx.setLineDash([4, 6]);
          s.ctx.beginPath();
          for (let k = 0; k <= 50; k++) {
            const u = k / 50;
            const px = lipX + rng * u, py = lip + (ground - lip) * u * u;
            k ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
          }
          s.ctx.stroke(); s.ctx.restore();
          // ball
          const u = clamp(q / .78, 0, 1);
          const bx = lipX + rng * u, by = lip + (ground - lip) * u * u;
          App.draw.ball(s, bx, by, 7, { color: i === 2 ? th.accent : th.ink, ring: false });
          // v0 arrow
          s.arrow(lipX + 8, lip - 14, lipX + 8 + 18 + rng * .12, lip - 14, { color: i === 2 ? th.accent : th.teal, width: 2, head: 6 });
          s.label('v₀', lipX + 26 + rng * .06, lip - 26, { size: 9.5, color: i === 2 ? th.accent : th.teal, dir: 'ltr' });
          // landing mark
          if (u > .98) s.line(lipX + rng, ground, lipX + rng, ground - 10, { color: th.ink, width: 1, alpha: .3 });
        });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      const q = root.querySelector('#hzQ');
      const fb = q.querySelector('.inline-q-fb');
      qsa('.iq-opt', q).forEach((b) => ctx.on(b, 'click', () => {
        qsa('.iq-opt', q).forEach((x) => { x.disabled = true; x.classList.toggle('is-on', x === b); });
        const ok = b.dataset.ok === '1';
        q.classList.add(ok ? 'is-ok' : 'is-no');
        fb.textContent = ok ? 'صحيح. الأعلى تصل إلى الحافة بسرعة أكبر، فتبتعد أكثر خلال زمن السقوط نفسه.' : 'زمن السقوط واحد للجميع (الارتفاع نفسه)، لكن السرعة الأفقية تختلف. الأعلى أسرع.';
      }));
    }
  });

  /* =========================================================
     القذف الشاقولي
     ========================================================= */
  App.addSlide({
    id: 'vertical', chapter: 'الدرس الثاني · حركة القذائف', title: 'القذف الشاقولي: صعود ثم سقوط',
    html: `
      ${head('إلى الأعلى، ثم إلى الأسفل.', 'القذف الشاقولي حالة خاصة: الزاوية 90°. لا مركبة أفقية، والحركة على محور واحد.')}
      <div class="split">
        <div class="stack">
          ${stage('vtCanvas', 'tall')}
          <p class="caption">سرعة الصعود تنقص حتى تنعدم عند الذروة، ثم تصبح سالبة عند الهبوط.</p>
        </div>
        <div class="stack">
          <div class="eq-panel">
            <div class="eq">${M.m('v = v₀ − gt')} &nbsp;،&nbsp; ${M.m('y = v₀t − ½gt²')}</div>
            <div class="eq">${M.m('H = v₀²/2g')} &nbsp;،&nbsp; ${M.m('tصعود = v₀/g')}</div>
          </div>
          <div class="panel panel--tight">
            <div class="controls" id="vtControls"></div>
            <div class="readouts mt-s">
              ${ro('vtH', 'أعلى ارتفاع', '', 'm')}
              ${ro('vtT', 'زمن الصعود', '', 's')}
              ${ro('vtV', 'سرعة العودة', '', 'm/s')}
            </div>
          </div>
          <p class="caption">${App.term('لماذا تعود السرعة بالقيمة نفسها؟', '<p>لأن الحركة متغيرة بانتظام، والطاقة تُحفظ. عند العودة إلى نقطة الانطلاق، تكون الطاقة الحركية مساوية لطاقتها الابتدائية، فتكون السرعة بالقيمة المطلقة نفسها، وبالاتجاه المعاكس.</p>', 'السرعة عند العودة')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 20 };
      const hEl = root.querySelector('#vtH'), tEl = root.querySelector('#vtT'), vEl = root.querySelector('#vtV');
      const cv = root.querySelector('#vtCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const ground = h * .84;
        const g = 10, v0 = state.v0;
        const T = 2 * v0 / g;
        const tNow = (t * .45) % (T * 1.1);
        const y = v0 * tNow - .5 * g * tNow * tNow;
        const yMax = v0 * v0 / (2 * g);
        const sc = (ground - h * .12) / Math.max(8, yMax);
        const axisX = w * .22;
        const bx = w * .34, by = ground - y * sc;
        s.line(axisX, ground, axisX, h * .1, { color: th.ink, width: 1.4, alpha: .5 });
        s.arrow(axisX, ground, axisX, h * .1, { color: th.ink, width: 1, head: 5, alpha: .3 });
        App.draw.ground(s, ground, w * .1, w * .95, { gap: 22 });
        // peak
        s.line(axisX - 10, ground - yMax * sc, bx + 40, ground - yMax * sc, { color: th.ink, width: 1, alpha: .2, dash: [3, 6] });
        s.label('الذروة', bx + 48, ground - yMax * sc - 10, { size: 10.5, color: th.muted, align: 'left' });
        s.dot(bx, by, 8, { color: th.accent });
        const v = v0 - g * tNow;
        const arrowLen = Math.min(80, Math.abs(v) * 3 + 12);
        if (Math.abs(v) > .2) s.arrow(bx + 18, by, bx + 18, by - Math.sign(v) * arrowLen, { color: th.teal, width: 2.2, head: 8 });
        s.label('v', bx + 34, by - Math.sign(v) * arrowLen / 2, { size: 11, color: th.teal, dir: 'ltr' });
        // v-t mini graph
        const gx0 = w * .58, gx1 = w * .94, gy0 = h * .76, gy1 = h * .2;
        s.line(gx0, (gy0 + gy1) / 2, gx1, (gy0 + gy1) / 2, { color: th.ink, width: 1.2, alpha: .4 });
        s.line(gx0, gy0, gx0, gy1, { color: th.ink, width: 1.2, alpha: .4 });
        s.line(gx0, (gy0 + gy1) / 2 - v0 * 2.2, gx0 + (gx1 - gx0) * .9, (gy0 + gy1) / 2 + v0 * 2.2, { color: th.accent, width: 2.8 });
        const mx = gx0 + (gx1 - gx0) * .9 * clamp(tNow / T, 0, 1);
        const my = (gy0 + gy1) / 2 - v * 2.2;
        s.ring(mx, my, 5, { color: th.accent, width: 2 });
        s.label('v', gx0 - 6, gy1, { size: 11, color: th.muted, dir: 'ltr', align: 'right' });
        s.label('t', gx1, (gy0 + gy1) / 2 + 16, { size: 11, color: th.muted, dir: 'ltr', align: 'right' });
        s.label(v > 0 ? 'صعود' : v < 0 ? 'هبوط' : 'ذروة', w * .5, 26, { size: 12, color: th.muted, weight: 600 });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const g = 10, v0 = state.v0;
        hEl.innerHTML = fmt(v0 * v0 / (2 * g), 1) + '<small>&nbsp;m</small>';
        tEl.innerHTML = fmt(v0 / g, 2) + '<small>&nbsp;s</small>';
        vEl.innerHTML = fmt(v0, 1) + '<small>&nbsp;m/s</small>';
      }
      App.slider(root.querySelector('#vtControls'), { label: 'السرعة الابتدائية', min: 8, max: 30, step: 1, value: state.v0, unit: 'm/s', dec: 0, onInput: (v) => { state.v0 = v; update(); } });
      update();
    }
  });


  /* =========================================================
     قراءة الخطوط البيانية
     ========================================================= */
  App.addSlide({
    id: 'graph-quiz', chapter: 'الدرس الثاني · حركة القذائف', title: 'اقرأ الخط البياني',
    html: `
      ${head('الخط البياني يحكي الحركة.', 'أربعة خطوط، أربع حركات. انظر إلى المحورين أولاً، ثم اسأل: هل الخط ثابت أم متغير؟')}
      <div class="split">
        <div class="stack">
          <div class="graph-grid">
            <div class="graph-card"><span class="graph-letter">أ</span><svg viewBox="0 0 120 100"><line x1="18" y1="82" x2="108" y2="82" stroke="var(--ink)" stroke-width="1.2"/><line x1="18" y1="82" x2="18" y2="10" stroke="var(--ink)" stroke-width="1.2"/><path d="M24 20 L78 78" fill="none" stroke="var(--accent)" stroke-width="2.6"/><text x="8" y="14" font-size="9" fill="var(--ink-3)">v</text><text x="104" y="95" font-size="9" fill="var(--ink-3)">t</text></svg></div>
            <div class="graph-card"><span class="graph-letter">ب</span><svg viewBox="0 0 120 100"><line x1="18" y1="82" x2="108" y2="82" stroke="var(--ink)" stroke-width="1.2"/><line x1="18" y1="82" x2="18" y2="10" stroke="var(--ink)" stroke-width="1.2"/><line x1="24" y1="34" x2="98" y2="34" stroke="var(--accent)" stroke-width="2.6"/><text x="8" y="14" font-size="9" fill="var(--ink-3)">v</text><text x="104" y="95" font-size="9" fill="var(--ink-3)">t</text></svg></div>
            <div class="graph-card"><span class="graph-letter">ج</span><svg viewBox="0 0 120 100"><line x1="18" y1="82" x2="108" y2="82" stroke="var(--ink)" stroke-width="1.2"/><line x1="18" y1="82" x2="18" y2="10" stroke="var(--ink)" stroke-width="1.2"/><path d="M24 72 Q60 8 96 72" fill="none" stroke="var(--accent)" stroke-width="2.6"/><text x="8" y="14" font-size="9" fill="var(--ink-3)">y</text><text x="104" y="95" font-size="9" fill="var(--ink-3)">t</text></svg></div>
            <div class="graph-card"><span class="graph-letter">د</span><svg viewBox="0 0 120 100"><line x1="18" y1="82" x2="108" y2="82" stroke="var(--ink)" stroke-width="1.2"/><line x1="18" y1="82" x2="18" y2="10" stroke="var(--ink)" stroke-width="1.2"/><line x1="24" y1="70" x2="98" y2="70" stroke="var(--accent)" stroke-width="2.6"/><text x="8" y="14" font-size="9" fill="var(--ink-3)">a</text><text x="104" y="95" font-size="9" fill="var(--ink-3)">t</text></svg></div>
          </div>
          <p class="caption">المحوران يحددان المقدار. الخط الأفقي = مقدار ثابت. الخط المائل = تغيّر منتظم. القوس = تغيّر غير منتظم.</p>
        </div>
        <div class="stack">
          <div class="quiz" id="gqQuiz"></div>
        </div>
      </div>`,
    mount(root, ctx) {
      App.Quiz(root.querySelector('#gqQuiz'), {
        questions: [
          {
            q: 'أي خط يمثل المركبة الأفقية للسرعة في القذف المائل؟',
            options: [
              { t: 'الخط ب: خط أفقي ثابت موجب.', ok: true, why: 'لا توجد قوة أفقية، لذلك vx ثابتة. الخط الأفقي عند قيمة موجبة هو التمثيل الصحيح.' },
              { t: 'الخط أ: خط مائل ينزل ويقطع المحور.', ok: false, why: 'هذا يمثل مركبة عمودية تتغيّر بانتظام، لا مركبة أفقية ثابتة.' },
              { t: 'الخط ج: قوس.', ok: false, why: 'القوس يمثل الموضع y بدلالة الزمن، لا السرعة.' },
              { t: 'الخط د: خط أفقي سالب.', ok: false, why: 'هذا يمثل تسارعاً ثابتاً سالباً، وليس سرعة أفقية.' }
            ]
          },
          {
            q: 'أي خط يمثل تسارع القذيفة في القذف المائل؟',
            options: [
              { t: 'الخط د: خط أفقي سالب.', ok: true, why: 'التسارع هو g إلى الأسفل، ثابت الشدة والاتجاه. على محور موجب نحو الأعلى يكون سالباً وثابتاً.' },
              { t: 'الخط أ: خط مائل.', ok: false, why: 'التسارع ثابت، لا يتغيّر مع الزمن. الخط المائل يعني تسارعاً متغيراً.' },
              { t: 'الخط ب: خط أفقي موجب.', ok: false, why: 'هذا تسارع موجب، والجاذبية تعمل إلى الأسفل.' },
              { t: 'الخط ج: قوس.', ok: false, why: 'القوس يصف الموضع، لا التسارع.' }
            ]
          },
          {
            q: 'أي خط يمثل المركبة العمودية للسرعة في القذف المائل؟',
            options: [
              { t: 'الخط أ: خط مائل ينزل ويقطع المحور.', ok: true, why: 'vy = v0 sinθ − gt: خط مستقيم ميوله −g، يبدأ موجباً ثم يصبح سالباً عند الهبوط.' },
              { t: 'الخط ب: خط أفقي ثابت.', ok: false, why: 'هذه المركبة الأفقية. المركبة العمودية تتغيّر بسبب الوزن.' },
              { t: 'الخط ج: قوس.', ok: false, why: 'القوس يمثل y(t)، وهو تكامل vy، لا vy نفسها.' },
              { t: 'الخط د: خط أفقي سالب.', ok: false, why: 'هذا التسارع، وليس السرعة.' }
            ]
          }
        ]
      });
    }
  });

  /* =========================================================
     كرة السلة
     ========================================================= */
  App.addSlide({
    id: 'basketball', chapter: 'الدرس الثاني · مسائل', title: 'مسألة: كرة السلة',
    html: `
      ${head('ما السرعة التي تُدخل الكرة؟', 'لاعب يرمي الكرة بزاوية <span class="ltr">45°</span> من ارتفاع <span class="ltr">2.05 m</span> إلى حلقة ارتفاعها <span class="ltr">3.05 m</span> على بعد <span class="ltr">6 m</span>. ما السرعة الابتدائية اللازمة؟')}
      <div class="split">
        <div class="stack">
          ${stage('bbCanvas', 'tall')}
          <div class="readouts">
            ${ro('bbV', 'السرعة اللازمة', '8.49', 'm/s', 'readout--accent')}
            ${ro('bbH', 'أعلى ارتفاع عن الأرض', '3.85', 'm')}
          </div>
        </div>
        <div class="stack">
          <div class="panel panel--tight">
            <div class="controls" id="bbControls"></div>
            <div class="row between mt-m">
              <button class="btn btn--sm" id="bbSolve">أظهر الحل</button>
              <div class="target-status" id="bbStatus">جرّب</div>
            </div>
          </div>
          <div class="steps" style="display:grid;gap:8px">
            <div class="step"><span class="step-k">1</span><div class="step-t">فرق الارتفاع: y = 3.05 − 2.05 = 1 m.</div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">معادلة المسار عند x = 6:
              <div class="eq">1 = 6 tan45 − ${M.frac('10 × 36', '2v₀² cos²45')}</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">ومنها: v₀ = 8.49 m/s، وأعلى ارتفاع 3.85 m.</div></div>
          </div>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 8.49 };
      const vEl = root.querySelector('#bbV'), hEl = root.querySelector('#bbH'), st = root.querySelector('#bbStatus');
      const cv = root.querySelector('#bbCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const pr = P.projectile(state.v0, 45, { h0: 2.05, g: 10 });
        App.projScene(s, { v0: state.v0, theta: 45, h0: 2.05, t: 0, target: { x: 6, y: 3.05 }, worldW: 9, worldH: 5.6, stats: false });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const pr = P.projectile(state.v0, 45, { h0: 2.05, g: 10 });
        vEl.innerHTML = fmt(state.v0, 2) + '<small>&nbsp;m/s</small>';
        hEl.innerHTML = fmt(pr.peak, 2) + '<small>&nbsp;m</small>';
        const tAt = 6 / pr.vx;
        const yAt = pr.y(tAt);
        const hit = Math.abs(yAt - 3.05) < .15;
        st.textContent = hit ? 'تدخل الحلقة' : yAt > 3.05 ? 'أعلى من الحلقة' : 'أقل من الحلقة';
        st.className = 'target-status ' + (hit ? 'ok' : 'no');
      }
      const sl = App.slider(root.querySelector('#bbControls'), {
        label: 'السرعة الابتدائية', min: 6, max: 12, step: .01, value: state.v0, unit: 'm/s', dec: 2,
        onInput: (v) => { state.v0 = v; update(); }
      });
      update();
      ctx.on(root.querySelector('#bbSolve'), 'click', () => { sl.set(8.49); });
    }
  });

  /* =========================================================
     المتزلج
     ========================================================= */
  App.addSlide({
    id: 'ski-jump', chapter: 'الدرس الثاني · مسائل', title: 'مسألة: قفزة المتزلج',
    html: `
      ${head('قفزة فوق منحدر.', 'متزلج يغادر النقطة O أفقياً بسرعة <span class="ltr">24 m/s</span>، ويلامس المنحدر المائل <span class="ltr">30°</span> عند A. احسب المسافة d وسرعته عند A.')}
      <div class="split">
        <div class="stack">
          ${stage('skiCanvas', 'tall')}
          <p class="caption">المسار قطع مكافئ، والمنحدر خط مستقيم. نقطة التقائهما هي A.</p>
        </div>
        <div class="stack">
          <div class="eq-panel">
            <div class="eq small">${M.m('x = 24t')} &nbsp;،&nbsp; ${M.m('y = 5t²')}</div>
            <div class="eq small">${M.m('y = x tan30°')}</div>
          </div>
          <div class="panel panel--tight mt-s">
            <div class="controls" id="skiControls"></div>
            <div class="readouts mt-s">
              ${ro('skiD', 'المسافة d', '', 'm', 'readout--accent')}
              ${ro('skiV', 'السرعة عند A', '', 'm/s')}
            </div>
          </div>
          <div class="steps" style="display:grid;gap:6px">
            <div class="step"><span class="step-k">1</span><div class="step-t">من التقاء المسار بالمنحدر: 5t² = 24t tan30 → t ≈ 2.77 s.</div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">x ≈ 66.5 m، y ≈ 38.4 m، ومنه d = x/cos30 ≈ 76.8 m.</div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">السرعة: vx = 24، vy = gt ≈ 27.7، إذن v ≈ 36.7 m/s.</div></div>
          </div>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 24 };
      const dEl = root.querySelector('#skiD'), vEl = root.querySelector('#skiV');
      const cv = root.querySelector('#skiCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const g = 10, a = rad(30);
        const res = P.landingOnSlope(state.v0, 30, { g });
        const worldW = res.x * 1.12, worldH = res.y * 1.15;
        const sc = Math.min((w - 100) / worldW, (h - 70) / worldH);
        const ox = 56, oy = 30;
        const X = (x) => ox + x * sc, Y = (y) => oy + y * sc;
        // slope
        s.ctx.save();
        s.ctx.fillStyle = 'rgba(29,102,107,.08)';
        s.ctx.beginPath(); s.ctx.moveTo(X(0), Y(0)); s.ctx.lineTo(X(res.x), Y(res.y)); s.ctx.lineTo(X(res.x), h); s.ctx.lineTo(X(0), h); s.ctx.closePath(); s.ctx.fill();
        s.ctx.restore();
        s.line(X(0), Y(0), X(res.x * 1.03), Y(res.y * 1.03), { color: th.ink, width: 2, alpha: .8 });
        // path
        s.ctx.save(); s.ctx.strokeStyle = th.accent; s.ctx.lineWidth = 2.6;
        s.ctx.beginPath();
        for (let i = 0; i <= 100; i++) {
          const tt = res.t * i / 100;
          const px = X(state.v0 * tt), py = Y(5 * tt * tt);
          i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
        }
        s.ctx.stroke(); s.ctx.restore();
        // points
        s.dot(X(0), Y(0), 4, { color: th.ink });
        s.label('O', X(0) - 10, Y(0) - 10, { size: 12, color: th.ink, dir: 'ltr' });
        s.dot(X(res.x), Y(res.y), 5, { color: th.accent });
        s.label('A', X(res.x) + 8, Y(res.y) + 4, { size: 12, color: th.accent, dir: 'ltr' });
        // d dimension
        const mx = X(res.x * .55), my = Y(res.y * .55);
        s.label('d', mx + 18, my, { size: 12, color: th.muted, dir: 'ltr' });
        // velocity at A
        const vx = state.v0, vy = g * res.t;
        const vl = Math.hypot(vx, vy);
        s.arrow(X(res.x), Y(res.y), X(res.x) + vx / vl * 50, Y(res.y) + vy / vl * 50, { color: th.teal, width: 2, head: 7 });
        s.label('v', X(res.x) + 58, Y(res.y) + 36, { size: 11, color: th.teal, dir: 'ltr' });
        s.label('30°', X(res.x * .16), Y(res.y * .16) + 14, { size: 10.5, color: th.muted, dir: 'ltr' });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const res = P.landingOnSlope(state.v0, 30, { g: 10 });
        dEl.innerHTML = fmt(res.d, 1) + '<small>&nbsp;m</small>';
        vEl.innerHTML = fmt(res.speed, 1) + '<small>&nbsp;m/s</small>';
      }
      App.slider(root.querySelector('#skiControls'), { label: 'السرعة الابتدائية', min: 15, max: 30, step: 1, value: state.v0, unit: 'm/s', dec: 0, onInput: (v) => { state.v0 = v; update(); } });
      update();
    }
  });

  /* =========================================================
     الكرة المطاطية
     ========================================================= */
  App.addSlide({
    id: 'rubber-ball', chapter: 'الدرس الثاني · مسائل', title: 'مسألة: كرة مطاطية',
    html: `
      ${head('كرة ترتد، لكن إلى ارتفاع أقل.', 'كرة كتلتها <span class="ltr">400 g</span> تسقط من <span class="ltr">405 cm</span> وترتد إلى <span class="ltr">180 cm</span>. احسب السرعتين، ثم حدّد نوع الصدم.')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="40" y1="30" x2="40" y2="250" stroke="var(--ink)" stroke-width="1" stroke-dasharray="4 6" opacity=".3"/>
            <line x1="120" y1="250" x2="480" y2="250" stroke="var(--accent)" stroke-width="6"/>
            <circle cx="120" cy="40" r="9" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>
            <circle cx="120" cy="70" r="9" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>
            <circle cx="120" cy="112" r="9" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>
            <circle cx="120" cy="168" r="9" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>
            <circle cx="120" cy="236" r="9" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>
            <circle cx="120" cy="140" r="7" fill="rgba(195,67,40,.2)" stroke="var(--accent)" stroke-width="2"/>
            <circle cx="120" cy="110" r="7" fill="rgba(195,67,40,.2)" stroke="var(--accent)" stroke-width="2"/>
            <line x1="300" y1="30" x2="300" y2="250" stroke="var(--teal)" stroke-width="1.4"/>
            <line x1="296" y1="30" x2="286" y2="30" stroke="var(--teal)" stroke-width="1"/>
            <line x1="296" y1="250" x2="286" y2="250" stroke="var(--teal)" stroke-width="1"/>
            <text x="312" y="145" font-size="12" fill="var(--teal)">405 cm</text>
            <line x1="180" y1="250" x2="180" y2="150" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="4 5" opacity=".5"/>
            <line x1="176" y1="150" x2="166" y2="150" stroke="var(--ink)" stroke-width="1" opacity=".5"/>
            <text x="190" y="185" font-size="12" fill="var(--ink-3)">180 cm</text>
          `, '0 0 520 300', 'كرة تسقط من 405 سم وترتد إلى 180 سم')}
          <p class="caption">الارتفاع بعد الارتداد أقل، إذن جزء من الطاقة الحركية فُقد.</p>
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:8px">
            <div class="step"><span class="step-k">1</span><div class="step-t">سرعة الاصطدام:
              <div class="eq">v = √(2 × 10 × 4.05) = 9 m/s</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">سرعة الارتداد:
              <div class="eq">v′ = √(2 × 10 × 1.80) = 6 m/s</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">نسبة الطاقة: (6/9)² = 4/9 ≈ 44%، أي أن أكثر من نصف الطاقة فُقد.</div></div>
          </div>
          <div class="inline-q" id="rbQ">
            <p class="inline-q-t">ما نوع الصدم بين الكرة والأرض؟</p>
            <div class="inline-q-opts">
              <button class="iq-opt" data-ok="0">مرن</button>
              <button class="iq-opt" data-ok="1">غير مرن (ليّن جزئياً)</button>
            </div>
            <div class="inline-q-fb" role="status"></div>
          </div>
          <p class="caption">${App.term('لماذا لا ترتد إلى الارتفاع نفسه؟', '<p>لأن التصادم مع الأرض غير مرن: جزء من الطاقة يتحول إلى حرارة وتشوّه. لو كان مرناً تماماً، لارتدت إلى الارتفاع نفسه (بإهمال الهواء).</p>', 'الارتداد')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const q = root.querySelector('#rbQ');
      const fb = q.querySelector('.inline-q-fb');
      qsa('.iq-opt', q).forEach((b) => ctx.on(b, 'click', () => {
        qsa('.iq-opt', q).forEach((x) => { x.disabled = true; x.classList.toggle('is-on', x === b); });
        const ok = b.dataset.ok === '1';
        q.classList.add(ok ? 'is-ok' : 'is-no');
        fb.textContent = ok ? 'صحيح. الطاقة الحركية بعد الارتداد أقل، لذلك الصدم غير مرن.' : 'لو كان مرناً، لبقيت الطاقة وارتدت إلى الارتفاع نفسه. الارتفاع الأقل دليل على الفقدان.';
      }));
    }
  });

  /* =========================================================
     الغطاس
     ========================================================= */
  App.addSlide({
    id: 'diver', chapter: 'الدرس الثاني · مسائل', title: 'مسألة: قفزة الغطاس',
    html: `
      ${head('قفزة إلى الأعلى، ثم إلى الماء.', 'منصة على ارتفاع <span class="ltr">3 m</span> تقذف غطاساً إلى الأعلى بسرعة <span class="ltr">7 m/s</span>. ما أعلى ارتفاع عن سطح الماء؟ وبأي سرعة يدخل الماء؟')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="40" y1="250" x2="490" y2="250" stroke="var(--teal)" stroke-width="3"/>
            <rect x="90" y="190" width="90" height="60" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4"/>
            <line x1="40" y1="190" x2="500" y2="190" stroke="var(--ink)" stroke-width="1" stroke-dasharray="4 5" opacity=".35"/>
            <path d="M150 180 C150 120 230 80 260 80 C290 80 330 120 330 190 L330 250" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-dasharray="5 6"/>
            <circle cx="260" cy="80" r="6" fill="var(--accent)"/>
            <text x="270" y="72" font-size="11" fill="var(--accent)">y2</text>
            <line x1="430" y1="190" x2="430" y2="250" stroke="var(--teal)" stroke-width="1.4"/>
            <line x1="426" y1="190" x2="416" y2="190" stroke="var(--teal)" stroke-width="1"/>
            <line x1="426" y1="250" x2="416" y2="250" stroke="var(--teal)" stroke-width="1"/>
            <text x="442" y="224" font-size="12" fill="var(--teal)">y1 = 3 m</text>
            <text x="130" y="175" font-size="11" fill="var(--ink-3)">v₀ = 7 m/s ↑</text>
            <text x="120" y="272" font-size="11" fill="var(--teal)">سطح الماء</text>
          `, '0 0 520 300', 'منصة غطس على ارتفاع 3 أمتار ومسار القفزة')}
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:8px">
            <div class="step"><span class="step-k">1</span><div class="step-t">عند أعلى نقطة تتوقف السرعة:
              <div class="eq">Hفوق المنصة = v₀²/(2g) = 49/20 = 2.45 m</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">إذن الارتفاع عن الماء:
              <div class="eq">y2 = 3 + 2.45 = 5.45 m</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">سرعة الدخول من الطاقة:
              <div class="eq">v² = v₀² + 2g × 3 = 49 + 60 = 109</div>
              <div class="eq">v ≈ 10.44 m/s</div>
            </div></div>
          </div>
          <div class="readouts">
            ${ro('diverH', 'أعلى ارتفاع عن الماء', '5.45', 'm')}
            ${ro('diverV', 'سرعة الدخول', '10.44', 'm/s', 'readout--accent')}
          </div>
        </div>
      </div>`,
    mount() {}
  });

  /* =========================================================
     المدفع على السفينة
     ========================================================= */
  App.addSlide({
    id: 'cannon-ship', chapter: 'الدرس الثاني · مسائل', title: 'مسألة: مدفع على سفينة',
    html: `
      ${head('مدفع، ارتداد، وسقوط في الماء.', 'مدفع كتلته <span class="ltr">3000 kg</span> يطلق قذيفة <span class="ltr">6 kg</span> بسرعة <span class="ltr">250 m/s</span> أفقياً من ارتفاع <span class="ltr">4 m</span>. احسب الارتداد والدفع والزمن والمدى.')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="20" y1="250" x2="500" y2="250" stroke="var(--accent)" stroke-width="4"/>
            <path d="M60 210 L170 210 L150 240 L80 240 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2"/>
            <rect x="100" y="190" width="40" height="20" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/>
            <path d="M140 200 L190 200 L190 212 L140 212 Z" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>
            <line x1="190" y1="206" x2="220" y2="206" stroke="var(--ink)" stroke-width="4"/>
            <path d="M220 206 Q330 206 430 250" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-dasharray="5 6"/>
            <text x="226" y="195" font-size="11" fill="var(--accent)">v₀ = 250 m/s</text>
            <line x1="330" y1="210" x2="330" y2="250" stroke="var(--teal)" stroke-width="1.4"/>
            <line x1="326" y1="210" x2="316" y2="210" stroke="var(--teal)" stroke-width="1"/>
            <text x="340" y="232" font-size="11" fill="var(--teal)">4 m</text>
            ${App.arrowSVG(80, 170, 50, 170, { color: 'ink', w: 2, head: 7, label: 'ارتداد' })}
            <text x="260" y="280" font-size="11" fill="var(--ink-3)">d</text>
            <line x1="190" y1="268" x2="430" y2="268" stroke="var(--ink)" stroke-width="1" stroke-dasharray="4 4" opacity=".4"/>
          `, '0 0 520 300', 'سفينة تطلق قذيفة أفقية وتسقط في الماء')}
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:7px">
            <div class="step"><span class="step-k">1</span><div class="step-t">الارتداد: ${M.m('0 = M v₂ + m v₁')} ⇒ ${M.m('v₂ = −0.5 m/s')}</div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">الدفع: ${M.m('ΔP = m v₁ = 1500 N·s')}</div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">السقوط: ${M.m('4 = 5t²')} ⇒ ${M.m('t = 0.894 s')}</div></div>
            <div class="step"><span class="step-k">4</span><div class="step-t">المدى: ${M.m('d = 250 × 0.894 = 223.6 m')}</div></div>
          </div>
          <div class="readouts">
            ${ro('csV', 'الارتداد', '0.5', 'm/s')}
            ${ro('csD', 'المدى', '223.6', 'm', 'readout--accent')}
          </div>
        </div>
      </div>`,
    mount() {}
  });

  /* =========================================================
     ضربة الجزاء
     ========================================================= */
  App.addSlide({
    id: 'penalty', chapter: 'الدرس الثاني · مسائل', title: 'مسألة: ضربة الجزاء',
    html: `
      ${head('هل تسكن الشبكة؟', 'كرة تُسدد بسرعة <span class="ltr">22 m/s</span> وزاوية <span class="ltr">20°</span> من <span class="ltr">12 m</span>، والمرمى ارتفاعه <span class="ltr">2.44 m</span>. أين تمر الكرة عند خط المرمى؟')}
      <div class="split">
        <div class="stack">
          ${stage('penCanvas', 'tall')}
          <div class="readouts">
            ${ro('penY', 'ارتفاع الكرة عند المرمى', '2.68', 'm', 'readout--accent')}
            ${ro('penH', 'ارتفاع العارضة', '2.44', 'm')}
          </div>
        </div>
        <div class="stack">
          <div class="panel panel--tight">
            <div class="controls" id="penControls"></div>
            <div class="row between mt-m">
              <div class="target-status" id="penStatus">فوق العارضة</div>
            </div>
          </div>
          <div class="steps" style="display:grid;gap:8px">
            <div class="step"><span class="step-k">1</span><div class="step-t">معادلة المسار عند x = 12:
              <div class="eq small">y = 12 tan20 − ${M.frac('10 × 144', '2 × 484 × cos²20')}</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">y ≈ 4.37 − 1.69 = 2.68 m، وهو أعلى من 2.44 m.</div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">إذن الكرة تمر فوق العارضة، ولا تسجل هدفاً.</div></div>
          </div>
          <p class="caption">${App.term('كيف كان يمكن التسجيل؟', '<p>بتقليل الزاوية أو السرعة قليلاً، أو بتسديد الكرة من زاوية مختلفة. المعادلة تسمح بتجربة ذلك: حرّك الزاوية وشاهد أين تمر عند خط المرمى.</p>', 'جرّب')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 22, theta: 20 };
      const yEl = root.querySelector('#penY'), st = root.querySelector('#penStatus');
      const cv = root.querySelector('#penCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme();
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        const scn = App.projScene(s, { v0: state.v0, theta: state.theta, t: pr.tFlight, target: { x: 12, y: 2.44, label: false }, worldW: 34, worldH: 8, stats: false });
        s.line(scn.X(12), scn.Y(0), scn.X(12), scn.Y(2.44), { color: th.ink, width: 2, alpha: .55 });
        s.line(scn.X(12) - 12, scn.Y(2.44), scn.X(12) + 12, scn.Y(2.44), { color: th.ink, width: 2, alpha: .55 });
        s.ctx.save(); s.ctx.strokeStyle = th.ink; s.ctx.globalAlpha = .15; s.ctx.lineWidth = 1;
        for (let i = 1; i < 5; i++) s.line(scn.X(12) - i * 8, scn.Y(0), scn.X(12) - i * 8, scn.Y(2.44), { color: th.ink, width: 1, alpha: .12 });
        s.ctx.restore();
        s.label('المرمى', scn.X(12) - 40, scn.Y(2.44) - 14, { size: 10, color: th.muted });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        const tAt = 12 / pr.vx;
        const yAt = pr.y(tAt);
        yEl.innerHTML = fmt(yAt, 2) + '<small>&nbsp;m</small>';
        const ok = tAt > 0 && yAt > 0 && yAt < 2.44;
        st.textContent = yAt > 2.44 ? 'فوق العارضة' : yAt > 0 ? 'هدف' : 'قصيرة';
        st.className = 'target-status ' + (ok ? 'ok' : 'no');
      }
      const host = root.querySelector('#penControls');
      App.slider(host, { label: 'السرعة', min: 16, max: 28, step: .5, value: state.v0, unit: 'm/s', dec: 1, onInput: (v) => { state.v0 = v; update(); } });
      App.slider(host, { label: 'الزاوية', min: 8, max: 35, step: 1, value: state.theta, unit: '°', dec: 0, onInput: (v) => { state.theta = v; update(); } });
      update();
    }
  });

  /* =========================================================
     أبعد مدى
     ========================================================= */
  App.addSlide({
    id: 'max-range', chapter: 'الدرس الثاني · مسائل', title: 'أبعد مدى ممكن',
    html: `
      ${head('أبعد مدى ممكن.', 'حرّك الزاوية وراقب المدى. ثم اسأل: لماذا تتوقف الزيادة عند قيمة واحدة؟')}
      <div class="split">
        <div class="stack">
          <div id="mrPlot"></div>
          <div class="panel panel--tight">
            <div class="controls inline" id="mrControls"></div>
            <div class="readouts mt-s">
              ${ro('mrR', 'المدى', '', 'm', 'readout--accent')}
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="eq-panel">
            <div class="eq">R = ${M.frac('v₀² sin 2θ', 'g')}</div>
            <div class="eq small">sin 2θ ≤ 1 ⇒ R ≤ v₀²/g</div>
          </div>
          <div class="result-band" style="grid-template-columns:1fr">
            <div class="result-item"><span class="result-k">الزاوية المثلى</span><strong>45°</strong><small>عندها 2θ = 90° و sin 2θ = 1. المدى الأقصى = v₀²/g.</small></div>
          </div>
          <div class="btn-group">
            <button class="btn btn--sm" id="mrSweep">امسح الزوايا</button>
            <button class="btn btn--sm btn--ghost" id="mrBest">إلى 45°</button>
          </div>
          <p class="caption">${App.term('لماذا ليست 90°؟', '<p>عند 90° كل السرعة عمودية، فلا توجد حركة أفقية، والمدى صفر. وعند 0° لا يوجد ارتفاع، والكرة تلامس الأرض فوراً. المدى يحتاج توازناً بين السرعة الأفقية وزمن الطيران.</p>', 'التوازن')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 20, theta: 45, sweeping: false, dir: 1 };
      const rEl = root.querySelector('#mrR');
      const plot = new App.Plot(root.querySelector('#mrPlot'), {
        width: 640, height: 320, pad: { l: 58, r: 28, t: 26, b: 48 },
        x: { min: 0, max: 90, step: 15, label: 'θ (°)' },
        y: { min: 0, max: 45, step: 5, label: 'R (m)' },
        ariaLabel: 'المدى بدلالة الزاوية'
      });
      function render() {
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        plot.update({
          series: [{ fn: (th) => state.v0 * state.v0 * Math.sin(2 * rad(th)) / 10, color: 'accent', width: 3 }],
          markers: [{ x: state.theta, y: pr.range, label: fmt(pr.range, 1) + ' m', color: 'accent', labelDy: -12, labelAnchor: 'middle' }],
          guides: [{ x: 45, color: 'var(--ink-3)', label: '45°' }]
        });
        rEl.innerHTML = fmt(pr.range, 1) + '<small>&nbsp;m</small>';
      }
      const sl = App.slider(root.querySelector('#mrControls'), {
        label: 'الزاوية', min: 5, max: 85, step: 1, value: state.theta, unit: '°', dec: 0,
        onInput: (v) => { state.theta = v; if (!state.sweeping) render(); }
      });
      ctx.on(root.querySelector('#mrBest'), 'click', () => { state.sweeping = false; state.theta = 45; sl.set(45); render(); });
      ctx.on(root.querySelector('#mrSweep'), 'click', () => {
        if (state.sweeping) { state.sweeping = false; return; }
        state.sweeping = true;
        const t0 = performance.now();
        const step = (ts) => {
          if (!ctx.alive() || !state.sweeping) return;
          const p = ((ts - t0) / 2600) % 1;
          state.theta = 5 + 80 * (0.5 - 0.5 * Math.cos(p * Math.PI * 2));
          sl.set(state.theta, true);
          render();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      render();
    }
  });

  /* =========================================================
     الزوايا المتتامة
     ========================================================= */
  App.addSlide({
    id: 'complementary', chapter: 'الدرس الثاني · مسائل', title: 'زاويتان، مدى واحد',
    html: `
      ${head('زاويتان، مدى واحد.', 'إذا كانت السرعة نفسها، فإن الزاويتين المتتامتين (θ و90°−θ) تعطيان المدى نفسه. لكن الرحلة تختلف.')}
      <div class="split">
        <div class="stack">
          ${stage('cpCanvas', 'tall')}
          <p class="caption">المدى نفسه، لكن إحداهما تذهب أعلى وتبقى في الهواء أطول.</p>
        </div>
        <div class="stack">
          <div class="eq-panel">
            <div class="eq small">R(θ) = ${M.frac('v₀² sin 2θ', 'g')} = R(90° − θ)</div>
          </div>
          <div class="panel panel--tight">
            <div class="controls" id="cpControls"></div>
            <div class="readouts mt-s">
              ${ro('cpR', 'المدى (مشترك)', '', 'm', 'readout--accent')}
              ${ro('cpH1', 'ذروة θ', '', 'm')}
              ${ro('cpH2', 'ذروة 90°−θ', '', 'm')}
            </div>
          </div>
          <p class="caption">${App.term('أي الكرتين تبقى أطول؟', '<p>الزاوية الأكبر: زمن الطيران يتناسب مع sinθ. لذلك تبقى الكرة الأعلى في الهواء أطول، وتصل إلى ذروة أعلى، بالمدى نفسه.</p>', 'زمن الطيران')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 20, theta: 30 };
      const cv = root.querySelector('#cpCanvas');
      const rEl = root.querySelector('#cpR'), h1El = root.querySelector('#cpH1'), h2El = root.querySelector('#cpH2');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const a = state.theta, b = 90 - state.theta;
        const p1 = P.projectile(state.v0, a, { g: 10 });
        const p2 = P.projectile(state.v0, b, { g: 10 });
        const worldW = p1.range * 1.15, worldH = Math.max(p1.peak, p2.peak) * 1.15;
        const sc = Math.min((w - 80) / worldW, (h - 70) / worldH);
        const ox = 52, oy = h - 40;
        s.line(ox, oy, w - 10, oy, { color: th.ink, width: 1.3, alpha: .3 });
        const draw = (pr, color, dash) => {
          s.ctx.save(); s.ctx.strokeStyle = color; s.ctx.lineWidth = 2.4; s.ctx.setLineDash(dash ? [5, 6] : []);
          s.ctx.beginPath();
          for (let i = 0; i <= 100; i++) {
            const tt = pr.tFlight * i / 100;
            const px = ox + pr.x(tt) * sc, py = oy - pr.y(tt) * sc;
            i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
          }
          s.ctx.stroke(); s.ctx.restore();
          s.dot(ox + pr.range * sc, oy, 4, { color });
          s.dot(ox + pr.range / 2 * sc, oy - pr.peak * sc, 3.5, { color });
          s.label(pr === p1 ? 'θ' : '90°−θ', ox + pr.range / 2 * sc, oy - pr.peak * sc - 12, { size: 10.5, color, weight: 600 });
        };
        draw(p1, th.accent, false);
        draw(p2, th.teal, true);
        s.label('R', ox + p1.range / 2 * sc, oy + 20, { size: 10.5, color: th.muted });
        s.arrow(ox, oy + 30, ox + p1.range * sc, oy + 30, { color: th.ink, width: 1, head: 5, double: true, alpha: .35 });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const p1 = P.projectile(state.v0, state.theta, { g: 10 });
        const p2 = P.projectile(state.v0, 90 - state.theta, { g: 10 });
        rEl.innerHTML = fmt(p1.range, 1) + '<small>&nbsp;m</small>';
        h1El.innerHTML = fmt(p1.peak, 1) + '<small>&nbsp;m</small>';
        h2El.innerHTML = fmt(p2.peak, 1) + '<small>&nbsp;m</small>';
      }
      App.slider(root.querySelector('#cpControls'), { label: 'الزاوية θ', min: 10, max: 80, step: 1, value: state.theta, unit: '°', dec: 0, onInput: (v) => { state.theta = v; update(); } });
      update();
    }
  });

  /* =========================================================
     الخاتمة
     ========================================================= */
  App.addSlide({
    id: 'final', chapter: 'الخاتمة', title: 'انتهت الرحلة', theme: 'night', className: 'divider',
    html: `
      <div class="divider-grid">
        <div>
          <div class="kicker rise" style="--i:0">الخاتمة</div>
          <h2 class="rise" style="--i:1">انتهت<br>الرحلة.</h2>
          <p class="lede rise" style="--i:2">بدأنا بدفعة، ثم تعلّمنا كيف تُحفظ، وكيف تتغيّر، وكيف ترسم قوسها. الفكرة نفسها تتكرر في كل مرة.</p>
          <div class="cover-actions rise" style="--i:3">
            <button class="btn" id="finReveal">اكشف الإجابة</button>
            <button class="btn btn--ghost" id="finRestart">من البداية</button>
          </div>
          <p class="cover-foot rise" style="--i:4">مبني على كتاب «الصدم والقذف» — الصف الثاني الثانوي العلمي. الصور والرسوم أُعيد رسمها لهذا التطبيق.</p>
        </div>
        <div class="divider-figure rise" style="--i:3">
          <div id="finChallenge" style="width:100%;text-align:center;direction:rtl">
            <p class="lede" style="margin:0 auto;color:var(--cream)">كرة تُقذف بسرعة <span class="ltr">20 m/s</span>. ما الزاوية التي تعطي أبعد مدى؟</p>
            <p id="finAnswer" style="font-family:var(--font-display);font-size:clamp(48px,8vw,110px);font-weight:700;color:var(--accent);line-height:1;margin-top:18px;opacity:0;transition:opacity .4s">45°</p>
            <p id="finWhy" class="caption" style="opacity:0;transition:opacity .4s;color:rgba(243,238,227,.6)">لأن R = v₀² sin2θ/g، وأكبر قيمة لـ sin2θ هي 1 عند 2θ = 90°.</p>
          </div>
        </div>
      </div>
`,
    mount(root, ctx) {
      ctx.on(root.querySelector('#finReveal'), 'click', () => {
        root.querySelector('#finAnswer').style.opacity = '1';
        root.querySelector('#finWhy').style.opacity = '1';
      });
      ctx.on(root.querySelector('#finRestart'), 'click', () => App.go(0));
    }
  });


})();
