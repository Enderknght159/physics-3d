/* =========================================================
   الفصل الثالث — التصادمات
   ========================================================= */
(function () {
  'use strict';
  const App = window.App, M = App.M, P = App.physics;
  const { fmt, clamp, rad, deg, qs, qsa, lerp } = App.util;

  const head = (t, l = '', cls = '') =>
    `<div class="head-block rise" style="--i:0"><h2 class="h2 ${cls}">${t}</h2>${l ? `<p class="lede">${l}</p>` : ''}</div>`;
  const stage = (id, cls = 'tall', extra = '') =>
    `<div class="stage ${cls}" ${extra}><canvas id="${id}" aria-label="محاكاة تصادم"></canvas></div>`;
  const ro = (id, k, v = '—', u = '', cls = '') =>
    `<div class="readout ${cls}"><span class="readout-k">${k}</span><span class="readout-v" id="${id}">${v}${u ? `<small>&nbsp;${u}</small>` : ''}</span></div>`;
  const meter = (id, label, cls = '') =>
    `<div class="meter-row"><span>${label}</span><span class="meter ${cls}"><span id="${id}" style="width:100%"></span></span><span class="mv" id="${id}V">—</span></div>`;

  /* shared: two carts on a line */
  function carts(s, o) {
    const th = s.theme();
    const ground = o.ground == null ? s.h * .62 : o.ground;
    const w1 = 58 + o.m1 * 5.5, w2 = 58 + o.m2 * 5.5;
    const h1 = 24, h2 = 24;
    // track
    s.line(s.w * .05, ground + 8, s.w * .95, ground + 8, { color: th.ink, width: 1.4, alpha: .3 });
    for (let x = s.w * .05; x < s.w * .95; x += (s.w * .9) / 18) s.line(x, ground + 5, x, ground + 11, { color: th.ink, width: 1, alpha: .16 });
    // cart 1
    App.draw.cart(s, o.x1, ground, w1, h1, { label: o.l1 || '', labelSize: 12, fill: o.fill1 || 'rgba(20,26,30,.045)', color: th.ink });
    // cart 2
    App.draw.cart(s, o.x2, ground, w2, h2, { label: o.l2 || '', labelSize: 12, fill: o.fill2 || 'rgba(195,67,40,.10)', color: o.c2 || th.accent });
    s.label('m₁', o.x1, ground - h1 - 20, { size: 11, color: th.muted, dir: 'ltr' });
    s.label('m₂', o.x2, ground - h2 - 20, { size: 11, color: th.muted, dir: 'ltr' });
    if (o.v1 != null && Math.abs(o.v1) > .01) {
      const len = Math.min(90, 22 + Math.abs(o.v1) * 12);
      s.arrow(o.x1, ground - h1 - 52, o.x1 + Math.sign(o.v1) * len, ground - h1 - 52, { color: th.teal, width: 2, head: 7 });
      s.label(fmt(o.v1, 1) + ' m/s', o.x1 + Math.sign(o.v1) * len / 2, ground - h1 - 66, { size: 10.5, color: th.teal, dir: 'ltr' });
    }
    if (o.v2 != null && Math.abs(o.v2) > .01) {
      const len = Math.min(90, 22 + Math.abs(o.v2) * 12);
      s.arrow(o.x2, ground - h2 - 52, o.x2 + Math.sign(o.v2) * len, ground - h2 - 52, { color: th.accent, width: 2, head: 7 });
      s.label(fmt(o.v2, 1) + ' m/s', o.x2 + Math.sign(o.v2) * len / 2, ground - h2 - 66, { size: 10.5, color: th.accent, dir: 'ltr' });
    }
    return { ground, w1, w2 };
  }

  /* =========================================================
     أنواع الصدم
     ========================================================= */
  App.addSlide({
    id: 'collision-types', chapter: 'الدرس الأول · التصادمات', title: 'بين المرن والليّن: أين تذهب الطاقة؟',
    html: `
      ${head('بين المرن والليّن: أين تذهب الطاقة؟', 'في كل تصادم دون قوى خارجية تبقى كمية الحركة. الطاقة الحركية وحدها قد تنقص. جرّب معامل الارتداد.')}
      <div class="split">
        <div class="stack">
          <div class="panel">
            <div class="panel-label">معامل الارتداد</div>
            <div class="controls" id="ctControls"></div>
            <div id="ctPresets" class="mt-s"></div>
            <div class="readouts mt-m">
              ${ro('ctP', 'كمية الحركة (قبل = بعد)', '8', 'kg·m/s')}
              ${ro('ctKe', 'الطاقة المتبقية', '100', '%', 'readout--accent')}
            </div>
            <div class="energy mt-m">
              <div class="meter-row"><span>حركية قبل</span><span class="meter"><span id="ctKeI" style="width:100%"></span></span><span class="mv" id="ctKeIV">—</span></div>
              <div class="meter-row"><span>حركية بعد</span><span class="meter"><span id="ctKeF" style="width:100%"></span></span><span class="mv" id="ctKeFV">—</span></div>
            </div>
          </div>
          <div class="note-links">
            ${App.term('لماذا تبقى كمية الحركة في كل الحالات؟', '<p>لأن القوى المتبادلة بين العربتين داخلية: متساوية ومتعاكسة. لا توجد قوة خارجية أفقية، لذلك مجموع P لا يتغير. الطاقة الحركية تتحول إلى حرارة وتشوّه، لكن كمية الحركة لا تتبدد بالطريقة نفسها.</p>', 'المحفوظ والمتبدد')}
          </div>
        </div>
        <div class="stack">
          ${stage('ctCanvas', 'tall')}
          <p class="caption">الطاقة المفقودة لا تختفي: تتحول إلى حرارة وتشوّه وصوت. في الحالة الليّنة تلتحم العربتان.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { e: 1 };
      const PEl = root.querySelector('#ctP');
      const keEl = root.querySelector('#ctKe');
      const keIV = root.querySelector('#ctKeIV');
      const keFV = root.querySelector('#ctKeFV');
      const keI = root.querySelector('#ctKeI');
      const keF = root.querySelector('#ctKeF');
      const m1 = 2, m2 = 3, v1 = 4, v2 = 0;
      const cv = root.querySelector('#ctCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const after = P.restitution(state.e, m1, v1, m2, v2);
        const cyc = 6.4;
        const p = (t % cyc) / cyc;
        let x1, x2, a1 = v1, a2 = v2, phase = 'before';
        if (p < .28) {
          x1 = lerp(w * .14, w * .42, p / .28); x2 = lerp(w * .86, w * .58, p / .28);
        } else if (p < .36) {
          x1 = w * .42; x2 = w * .58; a1 = 0; a2 = 0; phase = 'hit';
        } else if (p < .68) {
          const q = (p - .36) / .32;
          x1 = w * .42 + after.v1 * q * 14; x2 = w * .58 + after.v2 * q * 14;
          a1 = after.v1; a2 = after.v2; phase = 'after';
        } else {
          x1 = w * .42 + after.v1 * .32 * 14; x2 = w * .58 + after.v2 * .32 * 14;
          a1 = after.v1; a2 = after.v2; phase = 'after';
        }
        if (phase === 'hit') {
          s.label('لحظة الصدم', w * .5, h * .18, { size: 12, color: th.muted });
        }
        carts(s, { m1, m2, x1, x2, v1: a1, v2: a2, ground: h * .68 });
        // restitution visual
        s.label('e = ' + fmt(state.e, 2), w * .5, 26, { size: 13, color: th.muted, dir: 'ltr' });
        if (phase === 'after' && state.e < .02) {
          s.label('العربتان تتحركان معاً', w * .5, h - 26, { size: 12, color: th.accent, weight: 600 });
        }
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());

      const host = root.querySelector('#ctControls');
      App.slider(host, {
        label: 'معامل الارتداد e', min: 0, max: 1, step: .01, value: 1, unit: '', dec: 2,
        onInput: (v) => { state.e = v; update(); }
      });
      App.seg(root.querySelector('#ctPresets'), ['مرن تماماً', 'ليّن تماماً'], (i) => {
        state.e = i === 0 ? 1 : 0;
        const inp = root.querySelector('#ctControls input');
        if (inp) { inp.value = state.e; inp.dispatchEvent(new Event('input')); }
        update();
      }, 0);
      function update() {
        const after = P.restitution(state.e, m1, v1, m2, v2);
        const kei = P.ke(m1, v1) + P.ke(m2, v2);
        const kef = P.ke(m1, after.v1) + P.ke(m2, after.v2);
        const ratio = clamp(kef / kei, 0, 1);
        PEl.innerHTML = fmt(m1 * v1 + m2 * v2, 1) + '<small>&nbsp;kg·m/s</small>';
        keEl.innerHTML = fmt(ratio * 100, 0) + '<small>&nbsp;%</small>';
        keIV.textContent = fmt(kei, 1) + ' J';
        keFV.textContent = fmt(kef, 1) + ' J';
        keI.style.width = '100%';
        keF.style.width = (ratio * 100) + '%';
      }
      update();
    }
  });

  /* =========================================================
     الصدم المرن على مجرى مستقيم
     ========================================================= */
  App.addSlide({
    id: 'elastic1d', chapter: 'الدرس الأول · التصادمات', title: 'التصادم المرن على مجرى مستقيم',
    html: `
      ${head('معادلتان تسبقان أي حساب.', 'في التصادم المرن على سكة ملساء: كمية الحركة محفوظة، والطاقة الحركية محفوظة أيضاً. نكتبهما قبل أن نعوّض أي رقم.')}
      <div class="split">
        <div class="stack">
          <div class="eq-panel">
            <div class="eq small">${M.m('m')}<span class="sub">1</span>${M.vec('v')}<span class="sub">1</span> + ${M.m('m')}<span class="sub">2</span>${M.vec('v')}<span class="sub">2</span> = ${M.m('m')}<span class="sub">1</span>${M.vec('v')}<span class="sub">1</span>′ + ${M.m('m')}<span class="sub">2</span>${M.vec('v')}<span class="sub">2</span>′</div>
            <div class="eq-label">حفظ كمية الحركة (شعاعياً)</div>
            <div class="eq small" style="margin-top:10px">${M.frac('1','2')}${M.m('m')}<span class="sub">1</span>${M.m('v')}<span class="sub">1</span><span class="sup">2</span> + ${M.frac('1','2')}${M.m('m')}<span class="sub">2</span>${M.m('v')}<span class="sub">2</span><span class="sup">2</span> = ${M.frac('1','2')}${M.m('m')}<span class="sub">1</span>${M.m('v')}<span class="sub">1</span>′<span class="sup">2</span> + ${M.frac('1','2')}${M.m('m')}<span class="sub">2</span>${M.m('v')}<span class="sub">2</span>′<span class="sup">2</span></div>
            <div class="eq-label">حفظ الطاقة الحركية</div>
          </div>
          <div class="panel">
            <div class="panel-label">شغّل التصادم</div>
            <div class="row between">
              <button class="btn btn--sm" id="el1Play">صادم</button>
              <div class="readouts">
                ${ro('el1P', 'P قبل = بعد', '8', 'kg·m/s')}
                ${ro('el1K', 'الطاقة محفوظة', '100', '%')}
              </div>
            </div>
            <div class="energy mt-m">
              <div class="meter-row"><span>حركية قبل</span><span class="meter"><span id="el1Ki" style="width:100%"></span></span><span class="mv" id="el1KiV">16 J</span></div>
              <div class="meter-row"><span>حركية بعد</span><span class="meter meter--teal"><span id="el1Kf" style="width:100%"></span></span><span class="mv" id="el1KfV">16 J</span></div>
            </div>
          </div>
        </div>
        <div class="stack">
          ${stage('el1Canvas', 'tall')}
          <p class="caption">${App.term('لماذا نفصل المعادلتين؟', '<p>لأن كمية الحركة شعاع، والطاقة الحركية مقدار عددي. المعادلة الأولى تعطينا الاتجاهات، والثانية تعطينا الشدة. الجمع بينهما هو ما يحدد السرعتين بعد الصدم.</p>', 'لماذا معادلتان؟')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const m1 = 2, m2 = 6, v1 = 4, v2 = 0;
      const after = P.elastic1D(m1, v1, m2, v2);
      const cv = root.querySelector('#el1Canvas');
      let t0 = 0;
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const el = t - t0;
        const approach = 1.15;
        let x1, x2, a1 = v1, a2 = 0, phase = 'before';
        if (el < approach) {
          const q = clamp(el / approach, 0, 1);
          x1 = lerp(w * .14, w * .4, q); x2 = w * .78;
        } else if (el < approach + .25) {
          x1 = w * .4; x2 = w * .78; a1 = 0; a2 = 0; phase = 'hit';
        } else {
          const q = clamp((el - approach - .25) / 1.2, 0, 1);
          x1 = w * .4 + after.v1 * q * 16; x2 = w * .78 + after.v2 * q * 16; a1 = after.v1; a2 = after.v2; phase = 'after';
        }
        carts(s, { m1, m2, x1, x2, v1: a1, v2: a2, ground: h * .68 });
        s.label('m₁ = 2 kg', w * .4, h * .68 - 58, { size: 10.5, color: th.muted, dir: 'ltr' });
        s.label('m₂ = 6 kg', w * .78, h * .68 - 58, { size: 10.5, color: th.muted, dir: 'ltr' });
        if (phase === 'after') {
          s.label('بعد الصدم', w * .5, 30, { size: 12, color: th.muted });
          s.label('v₁′ = ' + fmt(after.v1, 1) + ' m/s', w * .5, h - 28, { size: 11.5, color: th.accent, dir: 'ltr' });
          s.label('v₂′ = ' + fmt(after.v2, 1) + ' m/s', w * .5, h - 12, { size: 11.5, color: th.accent, dir: 'ltr' });
        } else {
          s.label('قبل الصدم', w * .5, 30, { size: 12, color: th.muted });
        }
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      ctx.on(root.querySelector('#el1Play'), 'click', () => { t0 = sim.t; });
    }
  });

  /* =========================================================
     الحل المشترك — الصيغ
     ========================================================= */
  App.addSlide({
    id: 'elastic-formulas', chapter: 'الدرس الأول · التصادمات', title: 'الحل المشترك: معادلتان، سرعتان',
    html: `
      ${head('الحل المشترك: معادلتان، سرعتان.', 'بعد حل المعادلتين معاً تظهر سرعة كل جسم بعد الصدم. الأرقام تتغير، والصيغة تبقى.', 'wide')}
      <div class="split">
        <div class="stack">
          <div class="eq-panel">
            <div class="eq small">${M.m('v')}<span class="sub">1</span>′ = ${M.frac(`(${M.m('m')}<span class="sub">1</span> − ${M.m('m')}<span class="sub">2</span>)${M.m('v')}<span class="sub">1</span> + 2${M.m('m')}<span class="sub">2</span>${M.m('v')}<span class="sub">2</span>`, `${M.m('m')}<span class="sub">1</span> + ${M.m('m')}<span class="sub">2</span>`)}</div>
            <div class="eq small">${M.m('v')}<span class="sub">2</span>′ = ${M.frac(`(${M.m('m')}<span class="sub">2</span> − ${M.m('m')}<span class="sub">1</span>)${M.m('v')}<span class="sub">2</span> + 2${M.m('m')}<span class="sub">1</span>${M.m('v')}<span class="sub">1</span>`, `${M.m('m')}<span class="sub">1</span> + ${M.m('m')}<span class="sub">2</span>`)}</div>
          </div>
          <div class="panel panel--tight mt-m">
            <div class="panel-label">غيّر الكتلتين والسرعة</div>
            <div class="controls inline" id="efControls"></div>
            <div class="readouts mt-s">
              ${ro('efV1', 'v₁′', '', 'm/s', 'readout--accent')}
              ${ro('efV2', 'v₂′', '', 'm/s', 'readout--teal')}
            </div>
          </div>
        </div>
        <div class="stack">
          ${stage('efCanvas', 'tall')}
          <p class="caption">نبدأ بـ ${M.m('v₂ = 0')}. السهم الأخضر يمثل السرعة قبل الصدم، والبرتقالي بعدها. راقب ماذا يحدث عندما تتساوى الكتلتان. ${App.term('كيف اختفى v₂ من بعض الحدود؟', '<p>بعد جمع المعادلتين تظهر علاقة إضافية بين السرعات: v₁ − v₂ = −(v₁′ − v₂′). هذه العلاقة تعني أن سرعة الاقتراب تساوي سرعة التباعد في الصدم المرن، وتسمح بالوصول إلى الصيغتين.</p>', 'الحل الرياضي')} ${App.term('هل تصلح الصيغة عندما m₁ = m₂؟', '<p>نعم: يصبح البسط 0 في الأولى، فتتوقف الكرة الأولى، وتأخذ الثانية السرعة كاملة. هذا يظهر في تجربة السكة الهوائية وفي البلياردو.</p>', 'حالة خاصة')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m1: 2, m2: 6, v1: 4 };
      const v1El = root.querySelector('#efV1');
      const v2El = root.querySelector('#efV2');
      const cv = root.querySelector('#efCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const a = P.elastic1D(state.m1, state.v1, state.m2, 0);
        const cyc = 6;
        const p = (t % cyc) / cyc;
        let x1, x2, a1 = state.v1, a2 = 0, phase = 'before';
        if (p < .28) {
          x1 = lerp(w * .14, w * .42, p / .28); x2 = w * .78;
        } else if (p < .36) {
          x1 = w * .42; x2 = w * .78; a1 = 0; phase = 'hit';
        } else {
          const q = (p - .36) / .32;
          x1 = w * .42 + a.v1 * q * 13; x2 = w * .78 + a.v2 * q * 13; a1 = a.v1; a2 = a.v2; phase = 'after';
        }
        carts(s, { m1: state.m1, m2: state.m2, x1, x2, v1: a1, v2: a2, ground: h * .68 });
        s.label('قبل', w * .12, 28, { size: 11, color: th.muted });
        if (phase === 'after') s.label('بعد', w * .12, 28, { size: 11, color: th.accent, weight: 600 });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const a = P.elastic1D(state.m1, state.v1, state.m2, 0);
        v1El.innerHTML = fmt(a.v1, 2) + '<small>&nbsp;m/s</small>';
        v2El.innerHTML = fmt(a.v2, 2) + '<small>&nbsp;m/s</small>';
      }
      const host = root.querySelector('#efControls');
      App.slider(host, { label: 'm₁', min: .5, max: 8, step: .1, value: state.m1, unit: 'kg', dec: 1, onInput: (v) => { state.m1 = v; update(); } });
      App.slider(host, { label: 'm₂', min: .5, max: 8, step: .1, value: state.m2, unit: 'kg', dec: 1, onInput: (v) => { state.m2 = v; update(); } });
      App.slider(host, { label: 'v₁', min: 1, max: 8, step: .1, value: state.v1, unit: 'm/s', dec: 1, onInput: (v) => { state.v1 = v; update(); } });
      update();
    }
  });

  /* =========================================================
     تمرين (1)
     ========================================================= */
  App.addSlide({
    id: 'exercise1', chapter: 'الدرس الأول · التصادمات', title: 'تمرين: كرة خفيفة تصدم كرة ثقيلة',
    html: `
      ${head('تمرين: كرة خفيفة تصدم كرة ثقيلة.', 'كرة <span class="ltr">2 kg</span> سريعة تصدم كرة <span class="ltr">6 kg</span> ساكنة. احسب السرعتين بعد صدم مرن، وحدد جهة كل منهما.')}
      <div class="split">
        <div class="panel">
          <div class="panel-label">المعطيات</div>
          <div class="kv">
            <dt>الكتلة الأولى</dt><dd>${M.m('m₁ = 2 kg')}</dd>
            <dt>سرعتها الابتدائية</dt><dd>${M.m('v₁ = 4 m/s')}</dd>
            <dt>الكتلة الثانية</dt><dd>${M.m('m₂ = 6 kg')}</dd>
            <dt>سرعتها الابتدائية</dt><dd>${M.m('v₂ = 0')}</dd>
          </div>
          <div class="readouts mt-m">
            ${ro('ex1V1', 'v₁′', '—', 'm/s', 'readout--accent')}
            ${ro('ex1V2', 'v₂′', '—', 'm/s', 'readout--teal')}
          </div>
        </div>
        <div class="stack">
          ${stage('ex1Canvas', 'short')}
          <p class="caption">${App.term('لماذا ارتدت الكرة الأولى؟', '<p>لأنها أخف من الكرة الثانية. في الصدم المرن، الجسم الأخف الذي يصدم جسماً أثقل منه يرتد، بينما يستمر الأثقل في اتجاهه بسرعة أكبر.</p>', 'الأخف يرتد')}</p>
        </div>
      </div>
      <div class="solve-grid">
        <div class="step"><span class="step-k">1</span><div class="step-t">حفظ كمية الحركة بعد التعويض:
          <div class="eq">2 × 4 = 2v₁′ + 6v₂′</div>
        </div></div>
        <div class="step"><span class="step-k">2</span><div class="step-t">علاقة الصدم المرن (سرعة الاقتراب = سرعة التباعد):
          <div class="eq">v₂′ = v₁′ + 4</div>
        </div></div>
        <div class="step"><span class="step-k">3</span><div class="step-t">نعوّض ونحل:
          <div class="eq">8 = 2v₁′ + 6(v₁′ + 4) ⇒ v₁′ = −2</div>
        </div></div>
        <div class="step"><span class="step-k">4</span><div class="step-t">النتيجة: الأولى ترتد يساراً بسرعة <span class="ltr">2 m/s</span>، والثانية تتحرك يميناً بسرعة <span class="ltr">2 m/s</span>. الطاقة الحركية محفوظة: <span class="ltr">16 J</span> قبل وبعد.</div></div>
      </div>`,
    mount(root, ctx) {
      const m1 = 2, m2 = 6, v1 = 4;
      const a = P.elastic1D(m1, v1, m2, 0);
      const v1El = root.querySelector('#ex1V1');
      const v2El = root.querySelector('#ex1V2');
      v1El.innerHTML = fmt(a.v1, 1) + '<small>&nbsp;m/s</small>';
      v2El.innerHTML = fmt(a.v2, 1) + '<small>&nbsp;m/s</small>';
      const cv = root.querySelector('#ex1Canvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const cyc = 6;
        const p = (t % cyc) / cyc;
        let x1, x2, a1 = v1, a2 = 0;
        if (p < .3) { x1 = lerp(w * .14, w * .42, p / .3); x2 = w * .78; }
        else if (p < .38) { x1 = w * .42; x2 = w * .78; a1 = 0; }
        else {
          const q = (p - .38) / .3;
          x1 = w * .42 + a.v1 * q * 12; x2 = w * .78 + a.v2 * q * 12; a1 = a.v1; a2 = a.v2;
        }
        carts(s, { m1, m2, x1, x2, v1: a1, v2: a2, ground: h * .68 });
        s.label(p < .38 ? 'قبل الصدم' : 'بعد الصدم', w * .5, 28, { size: 12, color: th.muted });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
    }
  });

  /* =========================================================
     حالات الكتل
     ========================================================= */
  App.addSlide({
    id: 'mass-cases', chapter: 'الدرس الأول · التصادمات', title: 'ثلاث حالات، ثلاث نتائج',
    html: `
      ${head('ثلاث حالات، ثلاث نتائج.', 'الكتلة الثانية ساكنة دائماً. غيّر النسبة بين الكتلتين، وشاهد ما يفعله الجسم الأول بعد الصدم.')}
      <div class="split">
        <div class="stack">
          <div id="mcPresets"></div>
          <div class="panel mt-m">
            <div class="panel-label">النتيجة</div>
            <table class="dtable">
              <thead><tr><th>الحالة</th><th>الجسم الأول</th><th>الجسم الثاني</th></tr></thead>
              <tbody>
                <tr data-case="heavy"><td>m₁ &gt; m₂</td><td>يكمل إلى الأمام</td><td>ينطلق أسرع</td></tr>
                <tr data-case="equal"><td>m₁ = m₂</td><td>يتوقف</td><td>يأخذ السرعة كاملة</td></tr>
                <tr data-case="light"><td>m₁ &lt; m₂</td><td>يرتد</td><td>يتحرك ببطء إلى الأمام</td></tr>
              </tbody>
            </table>
            <div class="readouts mt-m">
              ${ro('mcV1', 'v₁′', '', 'm/s', 'readout--accent')}
              ${ro('mcV2', 'v₂′', '', 'm/s', 'readout--teal')}
            </div>
          </div>
          <p class="caption">${App.term('لماذا يتوقف الجسمان المتساويان ويتبادلان السرعة؟', '<p>لأن معادلتي الحفظ تعطيان: v₁′ = 0 و v₂′ = v₁. هذا يحدث عندما تكون الكتلتان متساويتين والثانية ساكنة. تظهر الظاهرة بوضوح في كرات البلياردو.</p>', 'تبادل السرعة')}</p>
        </div>
        <div class="stack">
          ${stage('mcCanvas', 'tall')}
          <p class="caption">السرعة الابتدائية للجسم الأول 4 m/s، والثاني ساكن.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const presets = {
        heavy: { m1: 5, m2: 2 },
        equal: { m1: 3, m2: 3 },
        light: { m1: 1, m2: 4 }
      };
      const state = { key: 'equal', ...presets.equal };
      const v1El = root.querySelector('#mcV1');
      const v2El = root.querySelector('#mcV2');
      const rows = qsa('tbody tr', root);
      const cv = root.querySelector('#mcCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const a = P.elastic1D(state.m1, 4, state.m2, 0);
        const cyc = 6;
        const p = (t % cyc) / cyc;
        let x1, x2, av1 = 4, av2 = 0;
        if (p < .3) { x1 = lerp(w * .14, w * .42, p / .3); x2 = w * .78; }
        else if (p < .38) { x1 = w * .42; x2 = w * .78; av1 = 0; }
        else {
          const q = (p - .38) / .3;
          x1 = w * .42 + a.v1 * q * 12; x2 = w * .78 + a.v2 * q * 12; av1 = a.v1; av2 = a.v2;
        }
        carts(s, { m1: state.m1, m2: state.m2, x1, x2, v1: av1, v2: av2, ground: h * .68 });
        s.label('v₁ = 4 m/s', w * .14, 30, { size: 11, color: th.teal, dir: 'ltr' });
        s.label('v₂ = 0', w * .86, 30, { size: 11, color: th.muted, dir: 'ltr' });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function apply(key) {
        state.key = key;
        Object.assign(state, presets[key]);
        const a = P.elastic1D(state.m1, 4, state.m2, 0);
        v1El.innerHTML = fmt(a.v1, 2) + '<small>&nbsp;m/s</small>';
        v2El.innerHTML = fmt(a.v2, 2) + '<small>&nbsp;m/s</small>';
        rows.forEach((r) => r.classList.toggle('is-on', r.dataset.case === key));
      }
      App.seg(root.querySelector('#mcPresets'), ['m₁ > m₂', 'm₁ = m₂', 'm₁ < m₂'], (i) => {
        apply(['heavy', 'equal', 'light'][i]);
      }, 1);
      rows.forEach((r) => ctx.on(r, 'click', () => apply(r.dataset.case)));
      apply('equal');
    }
  });


  /* =========================================================
     الصدم المرن في المستوي — البلياردو
     ========================================================= */
  App.addSlide({
    id: 'elastic2d', chapter: 'الدرس الأول · التصادمات', title: 'في المستوي: الزاوية تصنع الفرق',
    html: `
      ${head('في المستوي: الزاوية تصنع الفرق.', 'كرة بيضاء تصدم كرة مماثلة ساكنة. بعد الصدم، تخرج الكرتان في اتجاهين. ما العلاقة بينهما؟')}
      <div class="split">
        <div class="stack">
          <div class="panel panel--tight">
            <div class="panel-label">زاوية خروج الكرة الحمراء</div>
            <div class="controls" id="e2Controls"></div>
            <div class="readouts mt-s">
              ${ro('e2V1', 'سرعة البيضاء بعد الصدم', '', 'm/s', 'readout--accent')}
              ${ro('e2V2', 'سرعة الحمراء بعد الصدم', '', 'm/s', 'readout--teal')}
            </div>
          </div>
          <div class="eq-panel">
            <div class="eq small">${M.vec('v')}<span class="sub">1</span> = ${M.vec('v')}<span class="sub">1</span>′ + ${M.vec('v')}<span class="sub">2</span>′</div>
            <div class="eq small">${M.m('v')}<span class="sub">1</span><span class="sup">2</span> = ${M.m('v')}<span class="sub">1</span>′<span class="sup">2</span> + ${M.m('v')}<span class="sub">2</span>′<span class="sup">2</span></div>
            <div class="math-note">بتربيع الأولى ومقارنتها بالثانية: ${M.m('v₁′ · v₂′ = 0')}، أي أن السرعتين متعامدتان.</div>
          </div>
        </div>
        <div class="stack">
          ${stage('e2Canvas', 'tall')}
          <p class="caption">${App.term('لماذا 90° بالتحديد؟', '<p>لأن الكتلتين متساويتان: من حفظ كمية الحركة نحصل على v₁ = v₁′ + v₂′، ومن حفظ الطاقة على v₁² = v₁′² + v₂′². بتربيع العلاقة الأولى ومقارنتها بالثانية يبقى 2v₁′·v₂′ = 0، أي أن حاصل الضرب القياسي صفر، فالزاوية 90°.</p>', 'البرهان')} ${App.term('هل يحدث هذا دائماً؟', '<p>لا. هذه النتيجة خاصة بالصدم المرن المباشر بين كرتين متماثلتين، إحداهما ساكنة. لو اختلفت الكتلتان أو كان الصدم غير مرن، تغيّرت الزاوية.</p>', 'حدود النتيجة')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { theta: 45, v: 4 };
      const v1El = root.querySelector('#e2V1');
      const v2El = root.querySelector('#e2V2');
      const cv = root.querySelector('#e2Canvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const thd = rad(state.theta);
        const v1a = state.v * Math.sin(thd);
        const v2a = state.v * Math.cos(thd);
        // table
        const x0 = w * .07, x1 = w * .93, y0 = h * .16, y1 = h * .84;
        s.rect(x0, y0, x1 - x0, y1 - y0, { color: '#2C5149', alpha: 1 });
        // rails
        s.rect(x0 - 7, y0 - 7, x1 - x0 + 14, 7, { color: '#6E4D36', alpha: .9 });
        s.rect(x0 - 7, y1, x1 - x0 + 14, 7, { color: '#6E4D36', alpha: .9 });
        s.rect(x0 - 7, y0, 7, y1 - y0, { color: '#6E4D36', alpha: .9 });
        s.rect(x1, y0, 7, y1 - y0, { color: '#6E4D36', alpha: .9 });
        // pockets
        [[x0, y0], [x1, y0], [x0, y1], [x1, y1], [(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]].forEach(([px, py]) => {
          s.dot(px, py, 8, { color: '#111A1F' });
        });
        // markings
        s.line(x0 + 14, (y0 + y1) / 2, x1 - 14, (y0 + y1) / 2, { color: 'rgba(243,238,227,.12)', width: 1, dash: [6, 8] });
        s.dot(x0 + (x1 - x0) * .62, (y0 + y1) / 2, 2.4, { color: 'rgba(243,238,227,.28)' });
        const C = { x: x0 + (x1 - x0) * .48, y: (y0 + y1) / 2 };
        // incoming ball
        const startX = x0 + (x1 - x0) * .2;
        s.dot(startX, C.y, 8.5, { color: '#F3EEE3' });
        s.arrow(startX + 14, C.y, C.x - 18, C.y, { color: '#F3EEE3', width: 2, head: 7, alpha: .85 });
        s.label('v₁', (startX + C.x) / 2, C.y - 16, { size: 13, color: '#F3EEE3', dir: 'ltr' });
        // cue
        s.line(x0 + 12, C.y + 42, startX - 14, C.y + 4, { color: '#C9B48D', width: 4, alpha: .9 });
        // after arrows
        const k = 30;
        const whiteA = { x: C.x + Math.cos(Math.PI / 2 - thd) * (20 + v1a * k), y: C.y + Math.sin(Math.PI / 2 - thd) * (20 + v1a * k) };
        const redA = { x: C.x + Math.cos(thd) * (20 + v2a * k), y: C.y - Math.sin(thd) * (20 + v2a * k) };
        s.arrow(C.x, C.y, whiteA.x, whiteA.y, { color: '#F3EEE3', width: 2.6, head: 9 });
        s.arrow(C.x, C.y, redA.x, redA.y, { color: th.accent2 || '#E4674C', width: 2.8, head: 10 });
        s.dot(whiteA.x, whiteA.y, 8.5, { color: '#F3EEE3' });
        s.dot(redA.x, redA.y, 8.5, { color: '#C34328' });
        s.label('v₁′', whiteA.x + 18, whiteA.y + 14, { size: 12.5, color: '#F3EEE3', dir: 'ltr' });
        s.label('v₂′', redA.x + 8, redA.y - 14, { size: 12.5, color: '#E4674C', dir: 'ltr' });
        // angle arc
        s.ctx.save();
        s.ctx.strokeStyle = 'rgba(243,238,227,.7)'; s.ctx.lineWidth = 1.2;
        s.ctx.beginPath(); s.ctx.arc(C.x, C.y, 42, -thd, 0); s.ctx.stroke();
        s.ctx.restore();
        s.label('θ', C.x + 52, C.y - 14, { size: 12, color: '#F3EEE3', dir: 'ltr' });
        // right angle
        const r = 14;
        const a1 = Math.PI / 2 - thd, a2 = -thd;
        s.line(C.x + Math.cos(a1) * r, C.y + Math.sin(a1) * r, C.x + Math.cos(a1) * r + Math.cos(a2) * r, C.y + Math.sin(a1) * r + Math.sin(a2) * r, { color: 'rgba(243,238,227,.5)', width: 1 });
        s.line(C.x + Math.cos(a2) * r, C.y + Math.sin(a2) * r, C.x + Math.cos(a2) * r + Math.cos(a1) * r, C.y + Math.sin(a2) * r + Math.sin(a1) * r, { color: 'rgba(243,238,227,.5)', width: 1 });
        s.label('90°', C.x + 46, C.y + 44, { size: 11, color: 'rgba(243,238,227,.6)', dir: 'ltr' });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const thd = rad(state.theta);
        v1El.innerHTML = fmt(state.v * Math.sin(thd), 2) + '<small>&nbsp;m/s</small>';
        v2El.innerHTML = fmt(state.v * Math.cos(thd), 2) + '<small>&nbsp;m/s</small>';
      }
      App.slider(root.querySelector('#e2Controls'), {
        label: 'الزاوية θ', min: 10, max: 80, step: 1, value: state.theta, unit: '°', dec: 0,
        onInput: (v) => { state.theta = v; update(); }
      });
      update();
    }
  });

  /* =========================================================
     النواس القذّاف
     ========================================================= */
  App.addSlide({
    id: 'pendulum', chapter: 'الدرس الأول · التصادمات', title: 'النواس القذّاف: صدمة ثم صعود',
    html: `
      ${head('النواس القذّاف: صدمة ثم صعود.', 'قذيفة تلتصق بحافظة معلّقة. في الصدم: كمية الحركة محفوظة. بعد الصدم: الطاقة الحركية تتحول إلى ارتفاع.')}
      <div class="split">
        <div class="stack">
          <div class="panel panel--tight">
            <div class="panel-label">غيّر الكتل والسرعة</div>
            <div class="controls" id="penControls"></div>
            <div class="btn-group mt-m">
              <button class="btn btn--sm" id="penFire">أطلق</button>
              <button class="btn btn--sm btn--ghost" id="penReset">أعد</button>
            </div>
            <div class="readouts mt-m">
              ${ro('penVp', 'سرعة الجملة بعد الصدم', '', 'm/s')}
              ${ro('penH', 'الارتفاع h', '', 'cm')}
              ${ro('penTh', 'الزاوية θ', '', '°', 'readout--accent')}
            </div>
          </div>
        </div>
        <div class="stack">
          ${stage('penCanvas', 'tall')}
          <p class="caption">${M.m('v′ = m v / (m + M)')} ثم ${M.m('h = l(1 − cos θ)')}. ${App.term('لماذا لا تُحفظ الطاقة في الصدم؟', '<p>لأن القذيفة تغرس في الحافظة ويتشوّه الخشب وتتولد حرارة. كمية الحركة محفوظة لأن القوى الداخلية فقط، أما الطاقة الحركية فتنقص. بعد الصدم، تتحول الطاقة الحركية المتبقية إلى ارتفاع دون ضياع إضافي (التوتر عمودي على الحركة).</p>', 'المرحلتان')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m: 30, M: 90, v: 6, l: .8, fired: false, t0: 0 };
      const vpEl = root.querySelector('#penVp');
      const hEl = root.querySelector('#penH');
      const thEl = root.querySelector('#penTh');
      const cv = root.querySelector('#penCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const m = state.m / 1000, M = state.M / 1000;
        const res = P.pendulum(m, M, state.v, state.l);
        const thetaMax = Math.min(res.theta, rad(88));
        const elapsed = state.fired ? Math.max(0, t - state.t0) : 0;
        const swing = state.fired && elapsed > .45 ? (1 - Math.cos(clamp((elapsed - .45) / 1.5, 0, 1) * Math.PI)) / 2 : 0;
        const angle = thetaMax * swing;
        const px = w * .32, py = h * .12;
        const L = clamp(state.l * h * .62, h * .32, h * .72);
        // support
        s.line(px - 60, py, px + 60, py, { color: th.ink, width: 3, alpha: .7 });
        s.line(px - 52, py, px - 52, py + 10, { color: th.ink, width: 1.5, alpha: .3 });
        s.line(px + 52, py, px + 52, py + 10, { color: th.ink, width: 1.5, alpha: .3 });
        // vertical reference
        s.line(px, py, px, py + L + 40, { color: th.ink, width: 1, alpha: .2, dash: [4, 7] });
        // string + block
        const bx = px + Math.sin(angle) * L, by = py + Math.cos(angle) * L;
        s.line(px, py, bx, by, { color: th.ink, width: 1.6, alpha: .75 });
        s.dot(px, py, 3.5, { color: th.ink });
        // block: U-shaped pan
        s.ctx.save();
        s.ctx.strokeStyle = th.ink; s.ctx.lineWidth = 2.2; s.ctx.fillStyle = th.paper2;
        s.ctx.beginPath();
        s.ctx.moveTo(bx - 22, by - 8); s.ctx.lineTo(bx - 22, by + 22);
        s.ctx.lineTo(bx + 22, by + 22); s.ctx.lineTo(bx + 22, by - 8);
        s.ctx.stroke();
        s.ctx.fillRect(bx - 22, by + 12, 44, 10);
        s.ctx.restore();
        // embedded bullet
        if (state.fired) s.dot(bx + 4, by + 10, 3.4, { color: th.accent });
        // angle arc
        if (angle > .02) {
          s.ctx.save(); s.ctx.strokeStyle = th.accent; s.ctx.lineWidth = 1.4;
          s.ctx.beginPath(); s.ctx.arc(px, py, 52, Math.PI / 2 - angle, Math.PI / 2); s.ctx.stroke(); s.ctx.restore();
          s.label('θ', px + 62 * Math.sin(angle / 2) + 8, py + 62 * Math.cos(angle / 2), { size: 12.5, color: th.accent, dir: 'ltr' });
        }
        // height dimension
        const baseY = py + L + 32;
        s.line(px + 70, baseY, bx + 70, by + 22, { color: th.ink, width: 1, alpha: .25, dash: [4, 6] });
        s.arrow(px + 84, baseY, px + 84, by + 22, { color: th.teal, width: 1.4, head: 6, double: true });
        s.label('h', px + 98, (baseY + by + 22) / 2, { size: 11.5, color: th.teal, dir: 'ltr' });
        // bullet in flight
        if (state.fired && elapsed < .4) {
          const q = elapsed / .4;
          const bxp = lerp(w * .04, bx - 24, q);
          const byp = py + L + 10;
          App.draw.ball(s, bxp, byp, 4, { color: th.accent, ring: false });
          s.arrow(bxp - 34, byp, bxp - 8, byp, { color: th.accent, width: 1.8, head: 6 });
          s.label('v', bxp - 22, byp - 12, { size: 11, color: th.accent, dir: 'ltr' });
        }
        if (res.h >= state.l) s.label('طاقة كافية لدورة كاملة', w * .5, h - 16, { size: 12, color: th.accent, weight: 600 });
        s.label('قبل الصدم', w * .62, 30, { size: 11, color: th.muted });
        if (state.fired) s.label('بعد الصدم', w * .62, 30, { size: 11, color: th.accent, weight: 600 });
        // formula marks
        s.label('ℓ', px - 16, py + L * .48, { size: 11, color: th.muted, dir: 'ltr' });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const m = state.m / 1000, M = state.M / 1000;
        const res = P.pendulum(m, M, state.v, state.l);
        vpEl.innerHTML = fmt(res.vp, 2) + '<small>&nbsp;m/s</small>';
        hEl.innerHTML = fmt(res.h * 100, 1) + '<small>&nbsp;cm</small>';
        if (res.h >= state.l) { thEl.innerHTML = '≥ 90<small>&nbsp;°</small>'; } else { thEl.innerHTML = fmt(deg(res.theta), 1) + '<small>&nbsp;°</small>'; }
      }
      const host = root.querySelector('#penControls');
      App.slider(host, { label: 'كتلة القذيفة m', min: 5, max: 50, step: 1, value: state.m, unit: 'g', dec: 0, onInput: (v) => { state.m = v; state.fired = false; update(); } });
      App.slider(host, { label: 'كتلة الحافظة M', min: 50, max: 500, step: 10, value: state.M, unit: 'g', dec: 0, onInput: (v) => { state.M = v; state.fired = false; update(); } });
      App.slider(host, { label: 'سرعة القذيفة v', min: 2, max: 20, step: .5, value: state.v, unit: 'm/s', dec: 1, onInput: (v) => { state.v = v; state.fired = false; update(); } });
      App.slider(host, { label: 'طول الخيط ℓ', min: .4, max: 1.2, step: .05, value: state.l, unit: 'm', dec: 2, onInput: (v) => { state.l = v; state.fired = false; update(); } });
      update();
      ctx.on(root.querySelector('#penFire'), 'click', () => { state.fired = true; state.t0 = sim.t; });
      ctx.on(root.querySelector('#penReset'), 'click', () => { state.fired = false; });
    }
  });

  /* =========================================================
     اشتقاق سرعة القذيفة في النواس
     ========================================================= */
  App.addSlide({
    id: 'pendulum-derive', chapter: 'الدرس الأول · التصادمات', title: 'من الصدم إلى الصعود: اشتقاق السرعة',
    html: `
      ${head('من الصدم إلى الصعود.', 'نحفظ كمية الحركة في الصدم، ثم نحفظ الطاقة في الصعود. الخلط بين المرحلتين هو الخطأ الأول.')}
      <div class="split">
        <div class="stack">
          <div class="solve-grid">
            <div class="step"><span class="step-k">1</span><div class="step-t">أثناء الصدم: كمية الحركة محفوظة.
              <div class="eq">m v = (m + M) v′</div>
              <div class="eq">⇒ v′ = ${M.frac(M.m('m'), M.m('m') + ' + ' + M.m('M'))} v</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">بعد الصدم: الطاقة الحركية تتحول إلى ارتفاع. التوتر عمودي على الحركة، فلا يعمل.
              <div class="eq">${M.frac('1', '2')}(m + M)v′² = (m + M)gh</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">نختصر الكتلة ونجذر:
              <div class="eq">v′ = ${M.sqrt('2gh')}</div>
            </div></div>
            <div class="step"><span class="step-k">4</span><div class="step-t">نعوّض v′ و h = ℓ(1 − cos θ):
              <div class="eq">v = ${M.frac(M.m('m') + ' + ' + M.m('M'), M.m('m'))}${M.sqrt('2gℓ(1 − cos θ)')}</div>
            </div></div>
          </div>
          <div class="panel panel--tight mt-s">
            <div class="note-links">
              ${App.term('لماذا لا نحفظ الطاقة في المرحلة الأولى؟', '<p>لأن الصدم غير مرن: القذيفة تغرس في الحافظة، ويحدث تشوّه وحرارة. الطاقة الحركية تنقص. أما كمية الحركة فتبقى لأن القوى المؤثرة داخلية وأفقية المحصلة صفر.</p>', 'المرحلة الأولى')}
              ${App.term('لماذا W_T = 0؟', '<p>قوة التوتر تشدّ الخيط باتجاه مركز التعليق، والحركة عمودية عليها في كل لحظة. لذلك لا تبذل شغلاً، ولا تغيّر الطاقة الحركية للجملة.</p>', 'التوتر')}
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="eq-panel">
            <div class="eq">${M.m('v')} = ${M.frac(M.m('m') + ' + ' + M.m('M'), M.m('m'))} ${M.sqrt('2gℓ(1 − cos θ)')}</div>
            <div class="eq-label">سرعة القذيفة قبل الصدم</div>
          </div>
          <figure style="margin:0;background:var(--paper-2);padding:10px">
            <svg class="diagram" viewBox="0 0 420 300" style="width:min(100%,360px);height:auto;margin:0 auto" aria-label="مخطط النواس القذاف">
              <line x1="120" y1="22" x2="290" y2="22" stroke="var(--ink)" stroke-width="4"/>
              <line x1="200" y1="22" x2="200" y2="90" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 6" opacity=".35"/>
              <line x1="200" y1="22" x2="286" y2="196" stroke="var(--ink)" stroke-width="1.8"/>
              <circle cx="200" cy="22" r="4" fill="var(--ink)"/>
              <rect x="266" y="196" width="40" height="34" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.2"/>
              <line x1="266" y1="208" x2="306" y2="208" stroke="var(--ink)" stroke-width="1.4" opacity=".4"/>
              <path d="M200 82 A 58 58 0 0 1 252 60" fill="none" stroke="var(--accent)" stroke-width="1.6"/>
              <text x="214" y="74" font-size="13" fill="var(--accent)">θ</text>
              <text x="238" y="120" font-size="13" fill="var(--ink-2)">ℓ</text>
              <line x1="320" y1="230" x2="320" y2="206" stroke="var(--teal)" stroke-width="1.5"/>
              <line x1="318" y1="230" x2="306" y2="230" stroke="var(--teal)" stroke-width="1"/>
              <line x1="318" y1="206" x2="306" y2="206" stroke="var(--teal)" stroke-width="1"/>
              <text x="330" y="222" font-size="12" fill="var(--teal)">h</text>
              <line x1="40" y1="212" x2="120" y2="212" stroke="var(--accent)" stroke-width="2.4"/>
              <path d="M120 212 l-8 -5 v10 z" fill="var(--accent)"/>
              <text x="62" y="200" font-size="12" fill="var(--accent)">v</text>
              <circle cx="128" cy="212" r="4" fill="var(--accent)"/>
            </svg>
          </figure>
          <p class="caption">${M.m('h = ℓ(1 − cos θ)')}: إذا كانت الزاوية صغيرة، كان الارتفاع صغيراً. وإذا اقتربت من 90°، اقترب الارتفاع من ℓ.</p>
        </div>
      </div>`,
    mount(root, ctx) {}
  });

  /* =========================================================
     موازنة الطاقة في الصدم الليّن
     ========================================================= */
  App.addSlide({
    id: 'energy-loss', chapter: 'الدرس الأول · التصادمات', title: 'أين ذهبت الطاقة؟',
    html: `
      ${head('أين ذهبت الطاقة؟', 'في الصدم الليّن، تبقى كمية الحركة وتنقص الطاقة الحركية. النسبة تعتمد على كتلة القذيفة إلى كتلة الحافظة.')}
      <div class="split">
        <div class="stack">
          <div class="panel panel--tight">
            <div class="controls" id="elControls"></div>
            <div class="readouts mt-s">
              ${ro('elRatio', 'الطاقة المتبقية', '', '%', 'readout--accent')}
              ${ro('elLost', 'الطاقة المفقودة', '', '%')}
            </div>
            <div class="ratio-bar mt-s" aria-hidden="true"><span id="elKeep" style="width:50%"></span><span id="elDrop" style="width:50%"></span></div>
          </div>
          <div class="eq-panel">
            <div class="eq">${M.frac('K′', 'K')} = ${M.frac(M.m('m'), M.m('m') + ' + ' + M.m('M'))} &lt; 1</div>
            <div class="math-note">كلما كانت الحافظة أثقل، صغُرت النسبة وبقيت طاقة أقل. في الحد M ≫ m تقترب النسبة من الصفر.</div>
          </div>
        </div>
        <div class="stack">
          <div id="elPlot"></div>
          <p class="caption">${App.term('أين تذهب الطاقة المفقودة؟', '<p>تتحول إلى حرارة وتشوّه دائم في الحافظة وصوت. الطاقة لا تختفي، لكنها تخرج من صورة الطاقة الحركية المنتظمة إلى صور أخرى.</p>', 'الطاقة لا تختفي')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { m: 30, M: 90 };
      const ratioEl = root.querySelector('#elRatio');
      const lostEl = root.querySelector('#elLost');
      const keep = root.querySelector('#elKeep');
      const drop = root.querySelector('#elDrop');
      const plot = new App.Plot(root.querySelector('#elPlot'), {
        width: 640, height: 320, pad: { l: 58, r: 28, t: 26, b: 48 },
        x: { min: 0, max: 10, step: 2, label: 'M / m' },
        y: { min: 0, max: 1, step: .2, label: 'K′ / K' },
        ariaLabel: 'نسبة الطاقة المتبقية مقابل نسبة الكتلة'
      });
      function render() {
        const m = state.m / 1000, M = state.M / 1000;
        const ratio = m / (m + M);
        const x = M / m;
        plot.update({
          series: [{ fn: (t) => 1 / (1 + t), color: 'accent', width: 3, xmax: 10 }],
          markers: [{ x: Math.min(x, 10), y: 1 / (1 + Math.min(x, 10)), label: fmt(ratio * 100, 0) + '%', color: 'accent', labelDy: -12, labelAnchor: 'middle' }],
          guides: [{ x: Math.min(x, 10), color: 'var(--ink-3)' }]
        });
        ratioEl.innerHTML = fmt(ratio * 100, 1) + '<small>&nbsp;%</small>';
        lostEl.innerHTML = fmt((1 - ratio) * 100, 1) + '<small>&nbsp;%</small>';
        keep.style.width = (ratio * 100) + '%';
        drop.style.width = ((1 - ratio) * 100) + '%';
      }
      const host = root.querySelector('#elControls');
      App.slider(host, { label: 'كتلة القذيفة m', min: 5, max: 50, step: 1, value: state.m, unit: 'g', dec: 0, onInput: (v) => { state.m = v; render(); } });
      App.slider(host, { label: 'كتلة الحافظة M', min: 50, max: 500, step: 10, value: state.M, unit: 'g', dec: 0, onInput: (v) => { state.M = v; render(); } });
      render();
    }
  });

  /* =========================================================
     نتيجة الصدم الليّن
     ========================================================= */
  App.addSlide({
    id: 'inelastic-result', chapter: 'الدرس الأول · التصادمات', title: 'خلاصة الصدم الليّن',
    html: `
      ${head('خلاصة الصدم الليّن.', 'ثلاث جمل تلخّص ما يحدث، ثم اختبار سريع. لا تحفظها قبل أن تفهم سبب كل واحدة.')}
      <div class="result-band">
        <div class="result-item"><span class="result-k">كمية الحركة</span><strong>محفوظة</strong><small>لأن القوى المؤثرة داخلية، ومحصلتها الخارجية صفر.</small></div>
        <div class="result-item"><span class="result-k">الطاقة الحركية</span><strong>غير محفوظة</strong><small>جزء منها يتحول إلى حرارة وتشوّه وصوت.</small></div>
        <div class="result-item"><span class="result-k">الجسمان</span><strong>يلتحمان</strong><small>يتحركان معاً بسرعة واحدة بعد الصدم، أو يحدث تشوّه دائم.</small></div>
      </div>
      <div class="split mt-m">
        <div class="stack">
          <div class="eq-panel">
            <div class="eq">${M.vec('P')}<span class="sub">f</span> = ${M.vec('P')}<span class="sub">i</span> &nbsp;،&nbsp; ${M.m('K′')} &lt; ${M.m('K')}</div>
          </div>
          <p class="caption">${App.term('هل يمكن أن ترتد الأجسام في صدم ليّن؟', '<p>في الصدم الليّن التام يلتحم الجسمان ويتحركان معاً. أما إذا كان الصدم «ليّناً» جزئياً فقد ينفصلان مع فقدان جزء من الطاقة. المصطلح في الكتاب يشير إلى الحالة التي تلتحم فيها الجملة.</p>', 'دقة المصطلح')}</p>
        </div>
        <div class="stack">
          <div class="quiz" id="irQuiz"></div>
        </div>
      </div>`,
    mount(root, ctx) {
      App.Quiz(root.querySelector('#irQuiz'), {
        questions: [
          {
            q: 'في الصدم الليّن، كمية حركة الجملة…',
            options: [
              { t: 'محفوظة إذا لم توجد قوى خارجية محصلتها غير معدومة.', ok: true, why: 'القوى الداخلية تظهر في أزواج متعاكسة، ولا تغيّر المجموع. الشرط هو انعدام المحصلة الخارجية.' },
              { t: 'تزداد لأن الجسمين يلتحمان.', ok: false, why: 'الالتحام لا يخلق كمية حركة. السرعة المشتركة تكون أصغر لتناسب الكتلة الأكبر.' },
              { t: 'تنقص مثل الطاقة الحركية تماماً.', ok: false, why: 'كمية الحركة لا تتبدد بالحرارة. الطاقة الحركية وحدها هي التي تنقص.' }
            ]
          },
          {
            q: 'الطاقة الحركية بعد الصدم الليّن…',
            options: [
              { t: 'أقل من قبل الصدم.', ok: true, why: 'جزء منها يتحول إلى حرارة وتشوّه. النسبة K′/K = m/(m+M) أصغر من 1.' },
              { t: 'تساوي ما قبل الصدم.', ok: false, why: 'هذا شرط الصدم المرن، لا الليّن. في الليّن يوجد فقدان.' },
              { t: 'أكبر من قبل الصدم.', ok: false, why: 'لا يمكن أن تزداد الطاقة من دون مصدر خارجي. الصدم الليّن يبدد طاقة.' }
            ]
          },
          {
            q: 'جسمان متساويان، أحدهما ساكن، والتحما بعد الصدم. سرعتهما المشتركة…',
            options: [
              { t: 'نصف سرعة الجسم المتحرك.', ok: true, why: 'P = m v = (2m) v′ ⇒ v′ = v/2.' },
              { t: 'تساوي سرعة الجسم المتحرك.', ok: false, why: 'لو تساوت، لكانت كمية الحركة بعد الصدم ضعف ما قبلها، وهذا مستحيل دون قوة خارجية.' },
              { t: 'ضعف سرعة الجسم المتحرك.', ok: false, why: 'هذا يخالف حفظ كمية الحركة تماماً.' }
            ]
          }
        ]
      });
    }
  });

  /* =========================================================
     ملخص الدرس الأول
     ========================================================= */
  App.addSlide({
    id: 'lesson1-summary', chapter: 'الدرس الأول · التصادمات', title: 'ما تعلّمته في الدرس الأول',
    html: `
      ${head('ما تعلّمته، في صفحة واحدة.', 'اضغط أي بطاقة لتكشف معناها. هذه ليست قائمة للحفظ، بل خريطة لما جربته.')}
      <div class="formula-deck four">
        <div class="fcard"><div class="eq">${M.vec('P')} = ${M.m('m')}${M.vec('v')}</div><div class="fcard-name">كمية حركة نقطة مادية</div><div class="fcard-hint">الكتلة × السرعة، في اتجاه الحركة.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>شعاع في اتجاه السرعة، طوله يساوي الكتلة × السرعة. وحدته kg·m/s.</p></div></div>
        <div class="fcard"><div class="eq">${M.vec('P')} = Σ${M.m('m')}<span class="sub">i</span>${M.vec('v')}<span class="sub">i</span></div><div class="fcard-name">كمية حركة جملة</div><div class="fcard-hint">اجمع الأشعة؛ وفي الجسم الصلب P = (Σm)v.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>نجمع الأشعة. في الحركة الانسحابية: P = (Σm) v.</p></div></div>
        <div class="fcard"><div class="eq">Σ${M.vec('F')} = ${M.frac(M.D + M.vec('P'), M.D + 't')}</div><div class="fcard-name">القانون الثاني بصيغة كمية الحركة</div><div class="fcard-hint">القوة = معدل تغير كمية الحركة.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>القوة هي معدل تغيّر كمية الحركة. صالحة حتى مع تغيّر الكتلة.</p></div></div>
        <div class="fcard"><div class="eq">${M.D}${M.vec('P')} = (Σ${M.vec('F')}) ${M.D}t</div><div class="fcard-name">شعاع الدفع</div><div class="fcard-hint">القوة × الزمن؛ مساحة منحنى F–t.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>يساوي المساحة تحت منحنى القوة–الزمن. وحدته N·s.</p></div></div>
        <div class="fcard"><div class="eq">${M.vec('P')}<span class="sub">f</span> = ${M.vec('P')}<span class="sub">i</span></div><div class="fcard-name">المصونية</div><div class="fcard-hint">إذا انعدمت المحصلة، بقي الشعاع ثابتاً.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>إذا كانت المحصلة الخارجية صفراً، بقي الشعاع ثابتاً حاملاً وجهة وشدة.</p></div></div>
        <div class="fcard"><div class="eq">${M.vec('v')}<span class="sub">2</span> = −${M.frac(M.m('m'), M.m('M'))}${M.vec('v')}<span class="sub">1</span></div><div class="fcard-name">ارتداد سلاح</div><div class="fcard-hint">المجموع صفر؛ الإشارة تعني الاتجاه المعاكس.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>الإشارة السالبة تعني الاتجاه المعاكس. المدفع الأثقل يتحرك أبطأ.</p></div></div>
        <div class="fcard"><div class="eq">${M.m('v')}<span class="sub">1</span>′ = ${M.frac(`(${M.m('m')}<span class="sub">1</span> − ${M.m('m')}<span class="sub">2</span>)${M.m('v')}<span class="sub">1</span>`, `${M.m('m')}<span class="sub">1</span> + ${M.m('m')}<span class="sub">2</span>`)}</div><div class="fcard-name">الصدم المرن على مستقيم (v₂ = 0)</div><div class="fcard-hint">الطاقة محفوظة؛ m₁ = m₂ تتبادل السرعة.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>مع v₂ = 0. الكتلة المتساوية تتبادل السرعة، والأخف يرتد.</p></div></div>
        <div class="fcard"><div class="eq">${M.m('v')} = ${M.frac(M.m('m') + ' + ' + M.m('M'), M.m('m'))}${M.sqrt('2gℓ(1−cosθ)')}</div><div class="fcard-name">النواس القذّاف</div><div class="fcard-hint">صدم ليّن ثم صعود؛ v من الزاوية θ.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>صدم غير مرن ثم صعود. نقيس الزاوية لنستنتج سرعة القذيفة.</p></div></div>
        <div class="fcard"><div class="eq">${M.frac('K′', 'K')} = ${M.frac(M.m('m'), M.m('m') + ' + ' + M.m('M'))}</div><div class="fcard-name">نسبة الطاقة في الصدم الليّن</div><div class="fcard-hint">الطاقة المتبقية = m/(m+M) < 1.</div><div class="fcard-open"><button class="fcard-close" aria-label="إغلاق">×</button><p>الطاقة الحركية المتبقية أصغر من 1. الفقدان يتحول إلى حرارة وتشوّه.</p></div></div>
      </div>
      <div class="row between mt-m">
        <p class="caption" style="margin:0">${App.term('لماذا بطاقات بدل ملخص نصي؟', '<p>لأن استرجاع المعادلة من الذاكرة أقوى من قراءتها. حاول أن تتوقع المعادلة قبل أن تكشف البطاقة.</p>', 'كيف تستعملها')}</p>
        <button class="btn btn--sm btn--ghost" data-jump="quiz-elastic">إلى التمارين
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>`,
    mount(root, ctx) {
      const b = root.querySelector('[data-jump]');
      if (b) ctx.on(b, 'click', () => {
        const i = App.slides.findIndex((s) => s.id === 'quiz-elastic');
        if (i >= 0) App.go(i);
      });
    }
  });


})();
