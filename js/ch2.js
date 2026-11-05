/* =========================================================
   الفصل الثاني — الدفع، العزلة، والتطبيقات
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
     كمية حركة جملة
     ========================================================= */
  App.addSlide({
    id: 'system', chapter: 'الدرس الأول · كمية الحركة', title: 'الجملة: نجمع الأشعة، لا الأشياء',
    html: `
      ${head('الجملة: نجمع الأشعة، لا الأشياء.', 'ثلاث كتل تتحرك على خط واحد. بعضها إلى اليمين وبعضها إلى اليسار. اجمع كمية حركة كل واحدة… ثم انظر إلى المجموع.')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">طريقة الحركة</div>
            <div id="sysMode"></div>
            <div class="controls mt-m" id="sysControls"></div>
            <div class="readouts mt-m">
              ${ro('sysTotal', 'كمية حركة الجملة', '2', 'kg·m/s', 'readout--accent')}
              ${ro('sysSum', 'مجموع الكتل', '6', 'kg')}
            </div>
          </div>
          <div class="eq-panel">
            <div class="eq">${M.vec('P')} = ${M.vec('P')}<span class="sub">1</span> + ${M.vec('P')}<span class="sub">2</span> + ${M.vec('P')}<span class="sub">3</span></div>
            <div class="math-note">في الحركة الانسحابية (جسم صلب) تتساوى السرعات، فيصبح ${M.m('P = (Σm) v')}.</div>
          </div>
        </div>
        <div class="stack">
          ${stage('sysCanvas', 'mid')}
          <p class="caption">الكتل: 1 kg و2 kg و3 kg. في الوضع المستقل تختلف سرعاتها؛ وفي الوضع المتماسك تتحرك كلها بالسرعة نفسها. ${App.term('لماذا نجمع الأشعة لا الأطوال؟', '<p>لأن كمية الحركة شعاع. إذا تحرك جسمان في اتجاهين متعاكسين، فإن كميتي حركتهما تلغيان بعضهما جزئياً. الجمع العددي يتجاهل الاتجاه ويعطي نتيجة خاطئة.</p>', 'اتجاه الجمع')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const masses = [1, 2, 3];
      const indep = [3, -2, 1];
      const state = { mode: 'ind', vRigid: 2, k: 0.0001 };
      const totalEl = root.querySelector('#sysTotal');
      const sumEl = root.querySelector('#sysSum');

      const cv = root.querySelector('#sysCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const ground = h * .62;
        const gap = w * .24;
        const xs = [w * .24, w * .5, w * .76];
        const vs = state.mode === 'rigid' ? [state.vRigid, state.vRigid, state.vRigid] : indep;
        const ps = masses.map((m, i) => m * vs[i]);
        const total = ps.reduce((a, b) => a + b, 0);
        // line
        s.line(w * .08, ground + 48, w * .92, ground + 48, { color: th.ink, width: 1.3, alpha: .25 });
        for (let x = w * .08; x < w * .92; x += (w * .84) / 14) s.line(x, ground + 45, x, ground + 51, { color: th.ink, width: 1, alpha: .18 });
        // moving bodies
        xs.forEach((x, i) => {
          const drift = state.mode === 'rigid' ? 0 : Math.sin(t * .7 + i) * 3;
          const cy = ground - 3;
          App.draw.ball(s, x + drift, cy - 15, 15, { color: i === 2 ? th.accent : th.ink, ring: false });
          s.label(String(masses[i]), x + drift, cy - 14, { size: 11, color: th.night ? '#111A1F' : '#F3EEE3', weight: 700, dir: 'ltr' });
          s.label('kg', x + drift, cy + 8, { size: 9.5, color: th.muted });
          // velocity arrow
          const v = vs[i];
          const len = v === 0 ? 0 : 28 + Math.abs(v) * 15;
          if (v !== 0) {
            s.arrow(x + drift, cy - 46, x + drift + Math.sign(v) * len, cy - 46, { color: th.teal, width: 2, head: 7 });
            s.label((v > 0 ? '+' : '') + v + ' m/s', x + drift + Math.sign(v) * len / 2, cy - 60, { size: 10.5, color: th.teal, dir: 'ltr' });
          } else {
            s.label('0', x + drift, cy - 52, { size: 10.5, color: th.muted, dir: 'ltr' });
          }
          // momentum arrow below
          const plen = 12 + Math.abs(ps[i]) * 13;
          if (ps[i] !== 0) {
            s.arrow(x + drift, ground + 20, x + drift + Math.sign(ps[i]) * plen, ground + 20, { color: th.accent, width: 2.6, head: 8 });
            s.label(fmt(ps[i], 0), x + drift + Math.sign(ps[i]) * plen / 2, ground + 34, { size: 10.5, color: th.accent, dir: 'ltr' });
          }
        });
        // total
        const center = w * .5;
        if (Math.abs(total) < .01) {
          s.label('المجموع = 0', center, h - 22, { size: 14, color: th.accent, weight: 700 });
        } else {
          const tl = 20 + Math.abs(total) * 12;
          s.arrow(center - Math.sign(total) * tl / 2, h - 16, center + Math.sign(total) * tl / 2, h - 16, { color: th.accent, width: 3, head: 9 });
          s.label('المجموع = ' + fmt(total, 0) + ' kg·m/s', center, h - 36, { size: 12.5, color: th.accent, dir: 'ltr', weight: 600 });
        }
        // equal-velocity hint
        if (state.mode === 'rigid') {
          s.label('كل النقاط بالسرعة نفسها', w * .5, ground - 116, { size: 11, color: th.muted });
        }
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      const paints = [];
      App.seg(root.querySelector('#sysMode'), ['نقاط مستقلة', 'جسم صلب'], (i) => {
        state.mode = i === 0 ? 'ind' : 'rigid';
        sync();
      }, 0);
      const host = root.querySelector('#sysControls');
      const vSlider = App.slider(host, {
        label: 'سرعة الجسم الصلب', min: 0, max: 4, step: .1, value: state.vRigid, unit: 'm/s', dec: 1,
        onInput: (v) => { state.vRigid = v; sync(); }
      });
      function sync() {
        const vs = state.mode === 'rigid' ? [state.vRigid, state.vRigid, state.vRigid] : indep;
        const total = masses.reduce((a, m, i) => a + m * vs[i], 0);
        totalEl.innerHTML = fmt(total, 1) + '<small>&nbsp;kg·m/s</small>';
        sumEl.innerHTML = fmt(6, 0) + '<small>&nbsp;kg</small>';
        if (vSlider) {
          vSlider.input.disabled = state.mode !== 'rigid';
          vSlider.el.style.opacity = state.mode === 'rigid' ? '1' : '.4';
        }
      }
      sync();
      // note panel uses terms; no extra binding
    }
  });

  /* =========================================================
     تغيّر كمية الحركة وشعاع الدفع
     ========================================================= */
  App.addSlide({
    id: 'impulse', chapter: 'الدرس الأول · كمية الحركة', title: 'الدفع: قوة تعمل زمناً',
    html: `
      ${head('الدفع: قوة تعمل زمناً.', 'قوة صغيرة لزمن طويل قد تصنع التغيّر نفسه الذي تصنعه قوة كبيرة لزمن قصير. المساحة هي المفتاح.')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">جرّب القوة والزمن</div>
            <div class="controls" id="impControls"></div>
            <div class="readouts mt-m">
              ${ro('impDP', 'شعاع الدفع', '20', 'N·s', 'readout--accent')}
              ${ro('impV', 'سرعة عربة 2 kg', '10', 'm/s')}
            </div>
          </div>
          <div class="eq-panel">
            <div class="eq">${M.D}${M.vec('P')} = (Σ${M.vec('F')}) ${M.D}t</div>
            <div class="math-note">الدفع = المساحة تحت منحنى القوة–الزمن. كلما طال الزمن، كبر الأثر عند القوة نفسها.</div>
          </div>
        </div>
        <div class="stack">
          <div id="impPlot"></div>
          <p class="caption">القوة ثابتة هنا، لذلك المساحة مستطيل. ${App.term('لماذا المساحة؟', '<p>الدفع هو تراكم القوة خلال الزمن. عندما تكون القوة ثابتة، يكون التراكم مساحة المستطيل: القوة × الزمن. ولو تغيّرت القوة، نقسّم الزمن إلى فترات صغيرة ونجمع المساحات — أي نكامل.</p>', 'معنى المساحة')} ${App.term('لماذا نستخدم Δt لا t؟', '<p>لأن الأثر يعتمد على مدة تأثير القوة، لا على اللحظة المطلقة. إذا بدأت الدفع عند الثانية 5 أو 10، فالمهم هو كم دام الدفع.</p>', 'الزمن المؤثر')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { F: 10, dt: 2, m: 2 };
      const dpEl = root.querySelector('#impDP');
      const vEl = root.querySelector('#impV');
      const plot = new App.Plot(root.querySelector('#impPlot'), {
        width: 640, height: 380, pad: { l: 58, r: 28, t: 26, b: 48 },
        x: { min: 0, max: 4, step: 1, label: 't (s)' },
        y: { min: 0, max: 25, step: 5, label: 'F (N)' },
        ariaLabel: 'العلاقة بين القوة والزمن، والمساحة تمثل الدفع'
      });
      function render() {
        const F = state.F, dt = state.dt;
        plot.update({
          areas: [{ fn: () => F, xmin: 0, xmax: dt, color: 'var(--accent)', alpha: .16 }],
          series: [{ points: [[0, 0], [0, F], [dt, F], [dt, 0]], color: 'accent', width: 2.8 }],
          guides: [{ x: dt, label: 'Δt = ' + fmt(dt, 1) + ' s', color: 'var(--ink-3)' }],
          markers: [{ x: dt / 2, y: F, label: 'المساحة = ΔP', color: 'accent', labelDy: -14, labelAnchor: 'middle', style: 'ring' }]
        });
        const dp = F * dt;
        dpEl.innerHTML = fmt(dp, 1) + '<small>&nbsp;N·s</small>';
        vEl.innerHTML = fmt(dp / state.m, 2) + '<small>&nbsp;m/s</small>';
      }
      const host = root.querySelector('#impControls');
      App.slider(host, {
        label: 'القوة', min: 2, max: 20, step: .5, value: state.F, unit: 'N', dec: 1,
        onInput: (v) => { state.F = v; render(); }
      });
      App.slider(host, {
        label: 'مدة التأثير', min: .5, max: 4, step: .1, value: state.dt, unit: 's', dec: 1,
        onInput: (v) => { state.dt = v; render(); }
      });
      render();
      ctx.onDestroy(() => {});
    }
  });

  /* =========================================================
     من F = ma إلى F = ΔP/Δt
     ========================================================= */
  App.addSlide({
    id: 'newton2', chapter: 'الدرس الأول · كمية الحركة', title: 'من F = ma إلى F = ΔP/Δt',
    html: `
      ${head('قانون واحد، بثلاث صور.', 'لا نحتاج قانوناً جديداً. نعيد ترتيب القانون الثاني، وكل خطوة لها سبب واضح.')}
      <div class="split">
        <div class="stack">
          <p class="body">نيوتن قال إن القوة تصنع تسارعاً. وإذا كان التسارع هو تغيّر السرعة في الزمن، فيمكننا أن ننظر إلى الأثر بطريقة أعمق: القوة هي معدل تغيّر كمية الحركة.</p>
          <div class="note-links">
            ${App.term('لماذا نستخدم التسارع المتوسط؟', '<p>إذا كانت القوة ثابتة، فالتسارع ثابت والعلاقة دقيقة. وإذا تغيّرت القوة، فإن Δv/Δt يعطينا التسارع المتوسط، وبالتالي القوة المتوسطة خلال الفترة.</p>', 'التسارع المتوسط')}
            ${App.term('ما الذي يعنيه «معدل التغيّر»؟', '<p>يعني: كم تتغيّر كمية الحركة في كل ثانية. إذا تغيّرت 20 kg·m/s خلال 4 s، فالمعدل 5 kg·m/s لكل ثانية، أي 5 N.</p>', 'معدل التغيّر')}
          </div>
          <div class="panel mt-m">
            <div class="panel-label">تحقّق سريع</div>
            <div class="controls" id="n2Controls"></div>
            <div class="readouts mt-m">
              ${ro('n2DP', 'التغيّر في كمية الحركة', '10', 'N·s', 'readout--accent')}
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="derivation">
            <div class="step" data-step>
              <span class="step-k">1</span>
              <div class="step-t">نبدأ من القانون الثاني: القوة المحصلة تساوي الكتلة في التسارع.
                <div class="eq">Σ${M.vec('F')} = ${M.m('m')}${M.vec('a')}</div>
              </div>
            </div>
            <div class="step" data-step>
              <span class="step-k">2</span>
              <div class="step-t">نستبدل التسارع بتغيّر السرعة على الزمن.
                <div class="eq">Σ${M.vec('F')} = ${M.m('m')} ${M.frac(M.D + M.vec('v'), M.D + 't')}</div>
              </div>
            </div>
            <div class="step" data-step>
              <span class="step-k">3</span>
              <div class="step-t">الكتلة ثابتة، لذلك يمكن إدخالها داخل التغيّر: ${App.term('لماذا؟', '<p>لأن m ثابتة: Δ(mv) = m Δv. أما إذا تغيّرت الكتلة — كما في صاروخ يحرق وقوداً — فإن إدخال m داخل Δ لا يصح، وتبقى الصيغة العامة ΣF = ΔP/Δt صالحة.</p>', 'ثبات الكتلة')}
                <div class="eq">Σ${M.vec('F')} = ${M.frac(M.D + '(' + M.m('m') + M.vec('v') + ')', M.D + 't')}</div>
              </div>
            </div>
            <div class="step" data-step>
              <span class="step-k">4</span>
              <div class="step-t">وبتعريف كمية الحركة، نحصل على الصورة النهائية.
                <div class="eq">Σ${M.vec('F')} = ${M.frac(M.D + M.vec('P'), M.D + 't')}</div>
              </div>
            </div>
          </div>
          <p class="caption">${App.term('لماذا هذه الصورة أهم؟', '<p>لأنها تربط القوة بالتغيّر في كمية الحركة مباشرة، وتصلح حتى عندما تتغير كتلة النظام. وهي الأساس الذي يفسّر الدفع والارتداد والتصادم.</p>', 'أهمية الصورة')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { F: 10, dt: 1 };
      const el = root.querySelector('#n2DP');
      const host = root.querySelector('#n2Controls');
      App.slider(host, {
        label: 'القوة المحصلة', min: 2, max: 20, step: .5, value: state.F, unit: 'N', dec: 1,
        onInput: (v) => { state.F = v; update(); }
      });
      App.slider(host, {
        label: 'مدة التأثير', min: .2, max: 3, step: .1, value: state.dt, unit: 's', dec: 1,
        onInput: (v) => { state.dt = v; update(); }
      });
      function update() {
        el.innerHTML = fmt(state.F * state.dt, 1) + '<small>&nbsp;N·s</small>';
      }
      update();
    }
  });

  /* =========================================================
     الجملة المعزولة — الشخص والكرة
     ========================================================= */
  App.addSlide({
    id: 'isolated', chapter: 'الدرس الأول · كمية الحركة', title: 'ارمِ الكرة، يتحرك اللوح',
    html: `
      ${head('ارمِ الكرة، يتحرك اللوح.', 'شخص واقف على لوح بعجلات. يرمي كرة إلى اليسار. قبل الرمي كان المجموع صفراً… فماذا يحدث بعده؟')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">الكتل والرمية</div>
            <div class="controls" id="isoControls"></div>
            <div class="btn-group mt-m">
              <button class="btn btn--sm" id="isoThrow">ارمِ الكرة</button>
              <button class="btn btn--sm btn--ghost" id="isoReset">أعد</button>
            </div>
            <div class="readouts mt-m">
              ${ro('isoP', 'مجموع كمية الحركة', '0', 'kg·m/s')}
            </div>
          </div>
          <div class="note-links">
            ${App.term('ما معنى «بحكم المعزولة»؟', '<p>الجملة ليست معزولة تماماً: الثقل والعمودي يؤثران، لكنهما متعاكسان ومحصلتهما صفر. لذلك يمكن التعامل معها كأنها معزولة. القوى الداخلية بين الشخص والكرة لا تغيّر المجموع.</p>', 'العزلة')}
            ${App.term('لماذا يتحرك الشخص رغم أن الكرة هي التي رُميت؟', '<p>لأن الشخص دفع الكرة، والكرة دفعته بقوة مساوية ومعاكسة (نيوتن الثالث). مجموع كميتي الحركة يبقى صفراً، لكن كل جسم يتحرك في اتجاه.</p>', 'الفعل ورد الفعل')}
          </div>
        </div>
        <div class="stack">
          ${stage('isoCanvas', 'tall')}
          <p class="caption">الرسم يبالغ في إزاحة الشخص لتوضيح الحركة. القيم الحقيقية محسوبة في اللوحة الجانبية: ${M.m('P = 0')} قبل وبعد.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m1: 60, m2: 4, u: 6, thrown: false, t0: 0 };
      const pEl = root.querySelector('#isoP');
      const cv = root.querySelector('#isoCanvas');

      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const ground = h * .72;
        const M = state.m1 + state.m2;
        const vp = state.u * state.m2 / M;
        const vb = -state.u * state.m1 / M;
        const elapsed = state.thrown ? Math.min(3, t - state.t0) : 0;
        const px0 = w * .52;
        const scale = 46;
        const personX = px0 + vp * elapsed * scale;
        const ballX = px0 - 34 + vb * elapsed * scale;
        // ground
        App.draw.ground(s, ground, w * .05, w * .95, { gap: 22 });
        // board
        const bx = personX - 48;
        s.ctx.save();
        s.ctx.fillStyle = th.paper2; s.ctx.strokeStyle = th.ink; s.ctx.lineWidth = 2.2;
        if (s.ctx.roundRect) { s.ctx.beginPath(); s.ctx.roundRect(bx, ground - 12, 96, 9, 3); s.ctx.fill(); s.ctx.stroke(); }
        else { s.ctx.fillRect(bx, ground - 12, 96, 9); s.ctx.strokeRect(bx, ground - 12, 96, 9); }
        [-30, 30].forEach((dx) => { s.ctx.beginPath(); s.ctx.arc(personX + dx, ground + 2, 5.5, 0, Math.PI * 2); s.ctx.stroke(); });
        s.ctx.restore();
        // person
        App.draw.person(s, personX, ground - 12, 112, { lean: state.thrown ? .04 : 0 });
        // ball
        const heldY = ground - 82;
        const by = state.thrown ? heldY - Math.sin(Math.min(elapsed * 1.4, 1) * Math.PI) * 24 : heldY;
        const bxBall = state.thrown ? ballX : personX - 30;
        // throwing arm
        s.line(personX - 4, ground - 88, personX - 24, heldY, { color: th.ink, width: 2.2, alpha: .85 });
        App.draw.ball(s, bxBall, by, 8.5, { color: th.accent });
        s.label('m₂', bxBall, by - 16, { size: 11, color: th.accent, dir: 'ltr' });
        s.label(state.thrown ? 'المجموع يبقى صفراً' : 'قبل الرمي: المجموع صفر', w * .5, 28, { size: 12.5, color: th.muted, weight: 600 });
        // labels
        s.label('m₁ = ' + state.m1 + ' kg', personX, ground + 24, { size: 10.5, color: th.muted, dir: 'ltr' });
        // momentum arrows
        if (state.thrown) {
          const pBall = state.m2 * Math.abs(vb);
          const plen = 26 + pBall * 2.2;
          const y1 = heldY - 46;
          s.arrow(bxBall, y1, bxBall - Math.min(plen, w * .28), y1, { color: th.accent, width: 2.8, head: 9 });
          s.label('P₂', bxBall - Math.min(plen, w * .28) / 2, y1 - 14, { size: 12, color: th.accent, weight: 700, dir: 'ltr' });
          const y2 = ground - 128;
          s.arrow(personX, y2, personX + Math.min(plen, w * .2), y2, { color: th.teal, width: 2.8, head: 9 });
          s.label('P₁', personX + Math.min(plen, w * .2) / 2, y2 - 14, { size: 12, color: th.teal, weight: 700, dir: 'ltr' });
          s.label('المجموع = 0', w * .5, h - 22, { size: 13, color: th.muted, weight: 600 });
        } else {
          s.label('الجملة ساكنة: P = 0', w * .5, h - 22, { size: 13, color: th.muted, weight: 600, dir: 'rtl' });
        }
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      const host = root.querySelector('#isoControls');
      App.slider(host, {
        label: 'كتلة الشخص', min: 40, max: 100, step: 1, value: state.m1, unit: 'kg', dec: 0,
        onInput: (v) => { state.m1 = v; reset(); }
      });
      App.slider(host, {
        label: 'كتلة الكرة', min: 1, max: 10, step: .5, value: state.m2, unit: 'kg', dec: 1,
        onInput: (v) => { state.m2 = v; reset(); }
      });
      App.slider(host, {
        label: 'سرعة الرمي (بالنسبة للشخص)', min: 2, max: 10, step: .1, value: state.u, unit: 'm/s', dec: 1,
        onInput: (v) => { state.u = v; reset(); }
      });
      function reset() {
        state.thrown = false;
        pEl.innerHTML = '0<small>&nbsp;kg·m/s</small>';
      }
      ctx.on(root.querySelector('#isoThrow'), 'click', () => {
        state.thrown = true; state.t0 = sim.t;
        pEl.innerHTML = '0<small>&nbsp;kg·m/s</small>';
      });
      ctx.on(root.querySelector('#isoReset'), 'click', reset);
      reset();
    }
  });

  /* =========================================================
     المصونية — برهان وتمثيل
     ========================================================= */
  App.addSlide({
    id: 'conservation', chapter: 'الدرس الأول · كمية الحركة', title: 'إذا انعدمت المحصلة، بقي P ثابتاً',
    html: `
      ${head('إذا انعدمت المحصلة، بقي P ثابتاً.', 'المحصلة صفر تعني أن لا شيء يغيّر كمية الحركة من الخارج. غيّر القوة الخارجية وراقب ميل الخط.')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">حالة الجملة</div>
            <div id="conMode" style="margin-bottom:16px"></div>
            <div class="controls" id="conControls"></div>
            <div class="readouts mt-m">
              ${ro('conPi', 'P الابتدائية', '6', 'kg·m/s')}
              ${ro('conPf', 'P النهائية', '6', 'kg·m/s', 'readout--accent')}
            </div>
          </div>
          <div class="eq-panel">
            <div class="eq">${M.vec('P')}<span class="sub">f</span> = ${M.vec('P')}<span class="sub">i</span></div>
          </div>
        </div>
        <div class="stack">
          <div id="conPlot"></div>
          <p class="caption">${App.term('ما القوى الداخلية؟', '<p>القوى التي تؤثر بها أجزاء الجملة في بعضها. في الانفجار أو التصادم، تظهر قوى داخلية كبيرة، لكنها تأتي في أزواج متساوية ومتعاكسة، فلا تغيّر مجموع P.</p>', 'القوى الداخلية')} ${App.term('لماذا يكفي أن تكون المحصلة صفراً؟', '<p>لأن القانون الثاني بصيغة كمية الحركة: ΣF = ΔP/Δt. إذا كانت المحصلة صفراً، فإن معدل تغيّر كمية الحركة صفر، أي أن P لا يتغير بمرور الزمن.</p>', 'البرهان')}</p>
        </div>
      </div>
      <div class="chain mt-m" aria-label="خطوات البرهان">
        <div class="chain-step"><span class="chain-k">∑F = 0</span><small>جملة معزولة أو محصلتها معدومة</small></div>
        <div class="chain-step"><span class="chain-k">${M.frac('ΔP', 'Δt')} = 0</span><small>معدل التغير صفر</small></div>
        <div class="chain-step"><span class="chain-k">ΔP = 0</span><small>لا تغيّر في كمية الحركة</small></div>
        <div class="chain-step"><span class="chain-k">${M.vec('P')}<span class="sub">f</span> = ${M.vec('P')}<span class="sub">i</span></span><small>الشعاع ثابت حاملاً وجهة وشدة</small></div>
      </div>`,
    mount(root, ctx) {
      const state = { F: 0, P0: 6, m: 2 };
      const piEl = root.querySelector('#conPi');
      const pfEl = root.querySelector('#conPf');
      const plot = new App.Plot(root.querySelector('#conPlot'), {
        width: 640, height: 330, pad: { l: 58, r: 28, t: 26, b: 48 },
        x: { min: 0, max: 5, step: 1, label: 't (s)' },
        y: { min: 0, max: 30, step: 5, label: 'P (kg·m/s)' },
        ariaLabel: 'تغير كمية الحركة مع الزمن عند وجود قوة خارجية أو انعدامها'
      });
      function render() {
        const F = state.F, P0 = state.P0;
        plot.update({
          series: [
            { fn: (t) => P0 + F * t, color: F === 0 ? 'accent' : 'teal', width: 3 }
          ],
          guides: [{ y: P0, color: 'var(--ink-3)', label: 'P₀' }],
          markers: [{ x: 5, y: P0 + F * 5, label: fmt(P0 + F * 5, 1), color: F === 0 ? 'accent' : 'teal', labelAnchor: 'end' }]
        });
        piEl.innerHTML = fmt(P0, 1) + '<small>&nbsp;kg·m/s</small>';
        pfEl.innerHTML = fmt(P0 + F * 5, 1) + '<small>&nbsp;kg·m/s</small>';
      }
      App.seg(root.querySelector('#conMode'), ['معزولة (F = 0)', 'قوة خارجية (2 N)'], (i) => {
        state.F = i === 0 ? 0 : 2;
        render();
      }, 0);
      const host = root.querySelector('#conControls');
      App.slider(host, {
        label: 'كمية الحركة الابتدائية', min: 0, max: 12, step: .5, value: state.P0, unit: 'kg·m/s', dec: 1,
        onInput: (v) => { state.P0 = v; render(); }
      });
      render();
    }
  });

  /* =========================================================
     ارتداد سلاح ناري
     ========================================================= */
  App.addSlide({
    id: 'recoil', chapter: 'الدرس الأول · كمية الحركة', title: 'لماذا يرتد المدفع؟',
    html: `
      ${head('لماذا يرتد المدفع؟', 'قبل الإطلاق: كل شيء ساكن. بعده: قذيفة إلى اليمين ومدفع إلى اليسار. المجموع بقي صفراً.')}
      <div class="split">
        <div class="stack">
          <div class="eq-panel">
            <div class="eq">${M.m('0')} = ${M.m('m')}${M.vec('v')}<span class="sub">1</span> + ${M.m('M')}${M.vec('v')}<span class="sub">2</span></div>
            <div class="eq">${M.vec('v')}<span class="sub">2</span> = − ${M.frac(M.m('m'), M.m('M'))} ${M.vec('v')}<span class="sub">1</span></div>
          </div>
          <div class="note-links">
            ${App.term('ماذا تعني الإشارة السالبة؟', '<p>تعني أن سرعة المدفع في الاتجاه المعاكس للقذيفة، وليست «سرعة أقل». الإشارة تصف الاتجاه بالنسبة للمحور الموجب الذي اخترناه.</p>', 'الإشارة')}
            ${App.term('لماذا يتحرك المدفع أبطأ بكثير؟', '<p>لأن كتلته أكبر. للحفاظ على المجموع صفراً، يجب أن تكون سرعته أصغر بالنسبة نفسها: m/M. كمية حركته تساوي كمية حركة القذيفة في الشدة وتعارضها في الاتجاه.</p>', 'توزيع السرعة')}
          </div>
          <div class="readouts">
            ${ro('recV1', 'سرعة القذيفة', '250', 'm/s')}
            ${ro('recV2', 'سرعة الارتداد', '0.5', 'm/s', 'readout--accent')}
          </div>
          <div class="btn-group">
            <button class="btn btn--sm" id="recFire">أطلق</button>
            <button class="btn btn--sm btn--ghost" id="recReset">أعد</button>
          </div>
        </div>
        <div class="stack">
          ${stage('recCanvas', 'mid')}
          <div class="controls inline" id="recControls"></div>
          <p class="caption">${App.term('لماذا لا نرى المدفع يتحرك كثيراً؟', '<p>لأن كتلته كبيرة جداً مقارنة بالقذيفة. سرعته 0.5 m/s فقط في المثال، لكن كمية حركته تساوي كمية حركة القذيفة. الرسم يبالغ في إزاحة المدفع.</p>', 'الرسم التخطيطي')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m: 6, M: 3000, v1: 250, fired: false, t0: 0 };
      const v1El = root.querySelector('#recV1');
      const v2El = root.querySelector('#recV2');
      const cv = root.querySelector('#recCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const ground = h * .76;
        const v2 = -state.m * state.v1 / state.M;
        const elapsed = state.fired ? Math.min(2.4, t - state.t0) : 0;
        const rec = state.fired ? Math.min(16, Math.abs(v2) * elapsed * 12) : 0;
        const cx = w * .34 - rec;
        App.draw.ground(s, ground, w * .06, w * .94, { gap: 20 });
        // cannon (translate so the muzzle points right)
        s.ctx.save();
        s.ctx.translate(cx, ground - 30);
        App.draw.cannon(s, 0, 0, 1.05, { color: th.ink });
        s.ctx.restore();
        // projectile
        const bx = cx + 66 + (state.fired ? Math.min(1, elapsed / 1.4) * (w * .62) : 0);
        if (state.fired && elapsed < 1.45) App.draw.ball(s, bx, ground - 62, 6, { color: th.accent, ring: false });
        // arrows for momentum
        if (state.fired) {
          const plen = Math.min(150, w * .2);
          s.arrow(cx + 92, ground - 116, cx + 92 + plen, ground - 116, { color: th.accent, width: 3, head: 10 });
          s.label('P₁', cx + 92 + plen / 2, ground - 132, { size: 12, color: th.accent, weight: 700, dir: 'ltr' });
          s.arrow(cx - 24, ground - 116, cx - 24 - plen, ground - 116, { color: th.teal, width: 3, head: 10 });
          s.label('P₂', cx - 24 - plen / 2, ground - 132, { size: 12, color: th.teal, weight: 700, dir: 'ltr' });
          s.label('|P₁| = |P₂|', w * .5, 32, { size: 13, color: th.muted, weight: 600, dir: 'ltr' });
        } else {
          s.label('قبل الإطلاق: المجموع صفر', w * .5, 32, { size: 13, color: th.muted, weight: 600 });
        }
        s.label('v₁ = ' + fmt(state.v1, 0) + ' m/s', w * .72, ground + 26, { size: 11, color: th.accent, dir: 'ltr' });
        s.label('v₂ = ' + fmt(v2, 2) + ' m/s', w * .22, ground + 26, { size: 11, color: th.teal, dir: 'ltr' });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      function update() {
        const v2 = -state.m * state.v1 / state.M;
        v1El.innerHTML = fmt(state.v1, 0) + '<small>&nbsp;m/s</small>';
        v2El.innerHTML = fmt(Math.abs(v2), 2) + '<small>&nbsp;m/s</small>';
      }
      const host = root.querySelector('#recControls');
      App.slider(host, {
        label: 'كتلة القذيفة', min: 1, max: 20, step: 1, value: state.m, unit: 'kg', dec: 0,
        onInput: (v) => { state.m = v; state.fired = false; update(); }
      });
      App.slider(host, {
        label: 'كتلة المدفع', min: 300, max: 5000, step: 100, value: state.M, unit: 'kg', dec: 0,
        onInput: (v) => { state.M = v; state.fired = false; update(); }
      });
      App.slider(host, {
        label: 'سرعة القذيفة', min: 50, max: 300, step: 5, value: state.v1, unit: 'm/s', dec: 0,
        onInput: (v) => { state.v1 = v; state.fired = false; update(); }
      });
      update();
      ctx.on(root.querySelector('#recFire'), 'click', () => { state.fired = true; state.t0 = sim.t; });
      ctx.on(root.querySelector('#recReset'), 'click', () => { state.fired = false; });
    }
  });

  /* =========================================================
     الوسادة الهوائية — نفس الدفع، زمن أطول
     ========================================================= */
  App.addSlide({
    id: 'airbag', chapter: 'الدرس الأول · كمية الحركة', title: 'نفس الدفع، زمن أطول، قوة أقل',
    html: `
      ${head('نفس الدفع، زمن أطول، قوة أقل.', 'عند التصادم، كمية الحركة التي يجب أن تتوقف هي نفسها. لكن توزيعها على زمن أطول يقلّل القوة.')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">زمن التوقف</div>
            <div class="controls" id="airControls"></div>
            <div class="readouts mt-m">
              ${ro('airFr', 'قوة التوقف الصلب', '200', 'kN', 'readout--accent')}
              ${ro('airFa', 'قوة الوسادة', '24', 'kN', 'readout--teal')}
            </div>
          </div>
          <p class="body">الوسادة والهيكل القابل للانطواء لا يقلّلان كمية الحركة؛ إنهما يطيلان زمن التوقف. القوة المتوسطة ${
            App.term('تصبح أصغر', '<p>من العلاقة F = ΔP/Δt: البسط ثابت، والمقام يكبر، فتقل القوة. المساحة تحت منحنى القوة–الزمن تبقى نفسها لأنها تساوي ΔP.</p>', 'العلاقة')} لأن المقام أكبر.</p>
          <p class="caption">${App.term('أين تذهب الطاقة؟', '<p>جزء من الطاقة الحركية يتحول إلى تشوّه دائم وحرارة وصوت. الوسادة والهيكل المصممان للانطواء يوزّعان هذا التحول على مسافة وزمن أطول.</p>', 'الطاقة')}</p>
        </div>
        <div class="stack">
          <div id="airPlot"></div>
          <p class="caption">المستطيلان لهما المساحة نفسها (نفس ΔP). الأحمر: توقف صلب سريع. الأخضر: توقف ممتد.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const dP = 12000; // N.s
      const state = { dt: 0.5, rigid: 0.06 };
      const frEl = root.querySelector('#airFr');
      const faEl = root.querySelector('#airFa');
      const plot = new App.Plot(root.querySelector('#airPlot'), {
        width: 640, height: 380, pad: { l: 64, r: 28, t: 26, b: 48 },
        x: { min: 0, max: .9, step: .1, label: 't (s)' },
        y: { min: 0, max: 260, step: 50, label: 'F (kN)' },
        ariaLabel: 'مقارنة قوة التوقف في حالة صلبة وحالة ممتدة'
      });
      function render() {
        const dt = state.dt;
        const Fa = dP / dt / 1000, Fr = dP / state.rigid / 1000;
        plot.update({
          areas: [
            { fn: () => Fr, xmin: 0, xmax: state.rigid, color: 'var(--accent)', alpha: .22 },
            { fn: () => Fa, xmin: 0, xmax: dt, color: 'var(--teal)', alpha: .16 }
          ],
          series: [
            { points: [[0, 0], [0, Fr], [state.rigid, Fr], [state.rigid, 0]], color: 'accent', width: 2.4 },
            { points: [[0, 0], [0, Fa], [dt, Fa], [dt, 0]], color: 'teal', width: 2.4 }
          ],
          markers: [
            { x: state.rigid / 2, y: Fr, label: 'بدون وسادة', color: 'accent', labelDy: -12, labelAnchor: 'middle' },
            { x: dt / 2, y: Fa, label: 'مع وسادة', color: 'teal', labelDy: -12, labelAnchor: 'middle' }
          ]
        });
        frEl.innerHTML = fmt(Fr, 0) + '<small>&nbsp;kN</small>';
        faEl.innerHTML = fmt(Fa, 1) + '<small>&nbsp;kN</small>';
      }
      const host = root.querySelector('#airControls');
      App.slider(host, {
        label: 'زمن التوقف مع الوسادة', min: .06, max: .8, step: .02, value: state.dt, unit: 's', dec: 2,
        onInput: (v) => { state.dt = v; render(); }
      });
      render();
    }
  });

})();
