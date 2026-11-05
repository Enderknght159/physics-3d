/* =========================================================
   الفصل الخامس — تفكير ناقد وحركة القذائف
   ========================================================= */
(function () {
  'use strict';
  const App = window.App, M = App.M, P = App.physics;
  const { fmt, clamp, rad, deg, qs, qsa, lerp } = App.util;

  const head = (t, l = '', cls = '') =>
    `<div class="head-block rise" style="--i:0"><h2 class="h2 ${cls}">${t}</h2>${l ? `<p class="lede">${l}</p>` : ''}</div>`;
  const stage = (id, cls = 'tall', extra = '') =>
    `<div class="stage ${cls}" ${extra}><canvas id="${id}" aria-label="محاكاة حركة"></canvas></div>`;
  const ro = (id, k, v = '—', u = '', cls = '') =>
    `<div class="readout ${cls}"><span class="readout-k">${k}</span><span class="readout-v" id="${id}">${v}${u ? `<small>&nbsp;${u}</small>` : ''}</span></div>`;
  const fig = (inner, vb = '0 0 520 300', label = '') =>
    `<figure class="svg-figure"><svg class="diagram" viewBox="${vb}" role="img" ${label ? `aria-label="${label}"` : ''}>${inner}</svg></figure>`;

  /* =========================================================
     تفكير ناقد: معدن أم بلاستيك
     ========================================================= */
  App.addSlide({
    id: 'critical-bumper', chapter: 'الدرس الأول · تفكير ناقد', title: 'معدن أم بلاستيك؟',
    html: `
      ${head('معدن أم بلاستيك؟', 'المصدّ القديم معدن، والحديث بلاستيك. أيهما أفضل؟ لا توجد إجابة واحدة قبل أن نسأل: أفضل عند أي سرعة، ولحماية مَن؟')}
      <div class="split">
        <div class="stack">
          <div class="bumper-card">
            <div class="bumper-fig">
              <svg class="diagram" viewBox="0 0 300 160" aria-label="سيارة كلاسيكية بمصد معدني">
                <rect x="30" y="70" width="240" height="40" rx="8" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4"/>
                <path d="M80 70 L105 42 L195 42 L222 70" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4"/>
                <circle cx="90" cy="118" r="16" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4"/>
                <circle cx="210" cy="118" r="16" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4"/>
                <rect x="12" y="88" width="30" height="10" rx="2" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/><rect x="252" y="88" width="30" height="10" rx="2" fill="var(--paper-3)" stroke="var(--ink)" stroke-width="2"/>
                <text x="150" y="150" text-anchor="middle" font-size="11" fill="var(--ink-3)">مصدّ معدني صلب</text>
              </svg>
            </div>
            <h3 class="h4">المعدن</h3>
            <ul class="plain-list">
              <li>قوي، يحمي جسم السيارة في الاصطدامات البطيئة.</li>
              <li>يتشوّه أقل، لكنه ينقل القوة إلى الركاب.</li>
              <li>أثقل، ويصدأ، ويحتاج تجديداً.</li>
            </ul>
          </div>
        </div>
        <div class="stack">
          <div class="bumper-card">
            <div class="bumper-fig">
              <svg class="diagram" viewBox="0 0 300 160" aria-label="سيارة حديثة بمصد بلاستيكي">
                <path d="M30 112 L34 82 Q40 62 70 58 L95 44 L190 44 Q220 55 240 70 L266 82 L266 112 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4"/>
                <circle cx="90" cy="118" r="16" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4"/>
                <circle cx="210" cy="118" r="16" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.4"/>
                <path d="M30 86 Q34 74 50 70 L250 70 Q264 74 266 86" fill="none" stroke="var(--accent)" stroke-width="6" opacity=".75"/>
                <text x="150" y="150" text-anchor="middle" font-size="11" fill="var(--ink-3)">مصدّ بلاستيكي قابل للانطواء</text>
              </svg>
            </div>
            <h3 class="h4">البلاستيك</h3>
            <ul class="plain-list">
              <li>ينطوي ويطيل زمن التوقف، فتقل القوة على الركاب.</li>
              <li>أخف، ولا يصدأ، ويسهل تشكيله.</li>
              <li>يتشقق بسهولة، وقد لا يحمي في الاصطدامات العنيفة.</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="panel mt-m">
        <p class="body" style="margin:0">${App.term('ما الذي يحدده الفيزياء؟', '<p>المصدّ لا يغيّر كمية الحركة التي يجب أن تتوقف؛ إنه يغيّر الزمن الذي يحدث فيه ذلك. من F = ΔP/Δt، الزمن الأطول يعني قوة أصغر. البلاستيك والهيكل القابل للانطواء يمدّان الزمن، لكنهما قد لا يمنعان الضرر في السرعات العالية. لهذا تُصمّم السيارات الحديثة بمصدّ بلاستيكي فوق بنية معدنية تمتص الطاقة.</p>', 'الفكرة الفيزيائية')} أي التصميمين تختار؟ يعتمد على السرعة المتوقعة، وتكلفة الإصلاح، وحماية الركاب. السؤال الفيزيائي الصحيح ليس «أقوى» بل «كيف نوزّع التغيّر على زمن أطول».</p>
      </div>`,
    mount() {}
  });

  /* =========================================================
     أبحث أكثر: التمثال والشخص
     ========================================================= */
  App.addSlide({
    id: 'research-statue', chapter: 'الدرس الأول · تفكير ناقد', title: 'لماذا ينكسر التمثال ولا يُصاب الشخص؟',
    html: `
      ${head('نفس السقوط، نتيجة مختلفة.', 'تمثال وشخص بالكتلة نفسها يسقطان من متر. أحدهما يتحطم والآخر يقف. لماذا؟', 'wide')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="30" y1="230" x2="490" y2="230" stroke="var(--ink)" stroke-width="2" opacity=".4"/>
            <path d="M100 120 Q100 160 80 200 L95 200 M100 160 Q118 175 120 200 L108 200" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="100" cy="105" r="13" fill="none" stroke="var(--ink)" stroke-width="2.4"/>
            <line x1="100" y1="118" x2="100" y2="160" stroke="var(--ink)" stroke-width="2.4"/>
            <text x="100" y="262" text-anchor="middle" font-size="12" fill="var(--ink-3)">شخص يثني ركبتيه</text>
            <rect x="330" y="140" width="60" height="90" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4"/>
            <path d="M338 150 L352 178 L342 190 L358 205" fill="none" stroke="var(--accent)" stroke-width="2.2"/>
            <text x="360" y="262" text-anchor="middle" font-size="12" fill="var(--ink-3)">تمثال صلب</text>
            ${App.dimSVG(32, 70, 32, 230, 'h = 1 m', { color: 'muted', labelDx: 14, labelDy: 0, anchor: 'start' })}
          `, '0 0 520 280', 'شخص يثني ركبتيه عند الهبوط وتمثال صلب')}
          <div class="eq-panel"><div class="eq">F = ${M.frac('ΔP', 'Δt')}</div></div>
          <p class="caption">كلاهما يصل إلى الأرض بالسرعة نفسها تقريباً، لكن زمن التوقف يختلف كثيراً.</p>
        </div>
        <div class="stack">
          <div class="panel panel--tight">
            <div class="panel-label">الفرق في زمن التوقف</div>
            <div class="controls" id="stControls"></div>
            <div class="readouts mt-s">
              ${ro('stF', 'القوة على الشخص', '', 'kN', 'readout--accent')}
              ${ro('stFs', 'القوة على التمثال', '15', 'kN')}
            </div>
          </div>
          <div id="stPlot"></div>
          <p class="caption">${App.term('أين ذهبت كمية الحركة؟', '<p>إلى الأرض في الحالتين. الفرق أن الشخص يوزّع التغيّر على زمن أطول بثني الركبتين وتشوّه الأنسجة، فيقلّل القوة. التمثال صلب، فزمن التوقف قصير والقوة كبيرة.</p>', 'الدفع نفسه')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const dP = 300; // N.s
      const state = { dt: 0.25 };
      const fEl = root.querySelector('#stF');
      const plot = new App.Plot(root.querySelector('#stPlot'), {
        width: 640, height: 240, pad: { l: 62, r: 28, t: 24, b: 44 },
        x: { min: 0, max: .45, step: .05, label: 'Δt (s)' },
        y: { min: 0, max: 32, step: 5, label: 'F (kN)' },
        ariaLabel: 'القوة مقابل زمن التوقف عند دفع ثابت'
      });
      function render() {
        const Fp = dP / state.dt / 1000;
        plot.update({
          series: [{ fn: (t) => dP / Math.max(t, .008) / 1000, color: 'accent', width: 3, xmin: .008, xmax: .45 }],
          markers: [
            { x: .02, y: dP / .02 / 1000, label: 'تمثال', color: 'ink', labelDy: -12, labelAnchor: 'middle' },
            { x: state.dt, y: Fp, label: 'شخص', color: 'accent', labelDy: -12, labelAnchor: 'middle' }
          ],
          guides: [{ y: 15, color: 'var(--ink-3)', label: '15 kN' }]
        });
        fEl.innerHTML = fmt(Fp, 2) + '<small>&nbsp;kN</small>';
      }
      App.slider(root.querySelector('#stControls'), {
        label: 'زمن توقف الشخص', min: .1, max: .45, step: .01, value: state.dt, unit: 's', dec: 2,
        onInput: (v) => { state.dt = v; render(); }
      });
      render();
    }
  });

  /* =========================================================
     فاصل الدرس الثاني
     ========================================================= */
  App.addSlide({
    id: 'l2', chapter: 'الدرس الثاني · حركة القذائف', title: 'الدرس الثاني: حركة القذائف', theme: 'night', className: 'divider',
    html: `
      <div class="divider-grid">
        <div>
          <div class="kicker rise" style="--i:0">الدرس الثاني</div>
          <h2 class="rise" style="--i:1">حركة<br>القذائف</h2>
          <p class="lede rise" style="--i:2">بعد أن تترك اليد الجسم، تبقى السرعة الأفقية، وتعمل الجاذبية عمودياً. النتيجة قوس يمكن التنبؤ به.</p>
        </div>
        <div class="divider-figure rise" style="--i:3">
          <svg class="diagram" viewBox="0 0 520 260" style="width:100%;height:auto" aria-label="مسار قطع مكافئ">
            <line x1="30" y1="225" x2="490" y2="225" stroke="rgba(243,238,227,.35)" stroke-width="1.5"/>
            <path d="M40 225 Q260 -30 480 225" fill="none" stroke="var(--accent)" stroke-width="2.8" stroke-dasharray="6 7"/>
            <circle cx="260" cy="97" r="7" fill="var(--accent)"/>
            <line x1="40" y1="225" x2="100" y2="165" stroke="rgba(243,238,227,.6)" stroke-width="1.6"/>
            <text x="110" y="160" font-size="12" fill="rgba(243,238,227,.7)">v₀</text>
            <line x1="260" y1="97" x2="260" y2="225" stroke="rgba(243,238,227,.2)" stroke-width="1" stroke-dasharray="3 6"/>
            <text x="270" y="120" font-size="12" fill="rgba(243,238,227,.6)">الذروة</text>
          </svg>
        </div>
      </div>
      <div class="divider-num">2</div>`
  });

  /* =========================================================
     تعريف القذيفة
     ========================================================= */
  App.addSlide({
    id: 'projectile-def', chapter: 'الدرس الثاني · حركة القذائف', title: 'ما الذي يجعل الجسم قذيفة؟',
    html: `
      ${head('ليست كل كرة طائرة «قذيفة».', 'القذيفة جسم صغير، كثيف، يُقذف بسرعة ابتدائية، ونهمل تأثير الهواء أمام ثقله.')}
      <div class="split">
        <div class="stack">
          <p class="body">نقول إن الجسم «قذيفة» إذا تحققت ثلاثة شروط تقريبية: أبعاده صغيرة، وكثافته كبيرة بحيث يكون تأثير الهواء ضعيفاً، وحقل الثقالة منتظم في المنطقة التي يتحرك فيها. هذه ليست شروطاً مطلقة، بل تقريبات تجعل النموذج بسيطاً وقوياً.</p>
          <div class="note-links">
            ${App.term('لماذا نهمل الهواء؟', '<p>لأن قوة مقاومة الهواء تعتمد على الشكل والسرعة، وتجعل المسار معقداً. إذا كانت الكثافة كبيرة والمسافة قصيرة، تكون هذه القوة صغيرة أمام الوزن، فيمكن إهمالها كتقريب أول.</p>', 'إهمال الهواء')}
            ${App.term('لماذا حقل الثقالة منتظم؟', '<p>لأننا نتعامل مع مسافات صغيرة مقارنة بنصف قطر الأرض. في هذه المسافات، g ثابت تقريباً في الشدة والاتجاه (إلى الأسفل).</p>', 'حقل منتظم')}
          </div>
          <div class="panel panel--tight mt-m">
            <div class="panel-label">أي مما يلي يُعدّ قذيفة في هذا النموذج؟</div>
            <div class="choice-grid" id="defChoices">
              <button class="iq-opt" data-ok="1">كرة قدم في الهواء</button>
              <button class="iq-opt" data-ok="0">ريشة تسقط ببطء</button>
              <button class="iq-opt" data-ok="1">صخرة صغيرة تُرمى</button>
              <button class="iq-opt" data-ok="0">طائرة ورقية</button>
            </div>
            <div class="inline-q-fb" id="defFb" role="status"></div>
          </div>
        </div>
        <div class="stack">
          ${fig(`
            <line x1="30" y1="235" x2="490" y2="235" stroke="var(--ink)" stroke-width="1.6" opacity=".4"/>
            <path d="M50 235 Q250 10 450 235" fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-dasharray="5 7"/>
            <circle cx="50" cy="235" r="9" fill="var(--accent)"/>
            ${App.arrowSVG(60, 235, 130, 170, { color: 'accent', w: 2.4, head: 8, label: 'v₀' })}
            <circle cx="250" cy="88" r="7" fill="var(--ink)"/>
            <text x="250" y="70" text-anchor="middle" font-size="12" fill="var(--ink-3)">الذروة</text>
            <text x="450" y="262" text-anchor="middle" font-size="11" fill="var(--ink-3)">المدى</text>
            <line x1="50" y1="252" x2="450" y2="252" stroke="var(--ink)" stroke-width="1" stroke-dasharray="4 4" opacity=".3"/>
          `, '0 0 520 280', 'مسار قذيفة من نقطة الإطلاق إلى المدى')}
          <p class="caption">${App.term('ما شكل المسار في الواقع؟', '<p>مع الهواء، لا يكون قطعاً مكافئاً تماماً: ينحدر الجزء الأخير أكثر، وقد يتباطأ أفقياً. لكن في النموذج المدرسي، ولمسافات قصيرة، يكون القطع المكافئ تقريباً ممتازاً.</p>', 'النموذج والواقع')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const fb = root.querySelector('#defFb');
      const opts = qsa('#defChoices .iq-opt', root);
      let count = 0;
      opts.forEach((b) => ctx.on(b, 'click', () => {
        b.classList.toggle('is-on');
        const ok = b.dataset.ok === '1';
        fb.style.display = 'block';
        fb.style.color = ok ? 'var(--green)' : 'var(--accent-ink)';
        fb.style.borderRight = '3px solid ' + (ok ? 'var(--green)' : 'var(--accent)');
        fb.textContent = ok
          ? 'نعم، هذا تقريب جيد: الجسم صغير وكثيف، والمسافة قصيرة، ويمكن إهمال الهواء.'
          : 'في هذا النموذج لا نعتبره قذيفة: مقاومة الهواء أو الشكل تجعل المسار بعيداً عن القطع المكافئ البسيط.';
      }));
    }
  });

  /* =========================================================
     لماذا القوس؟
     ========================================================= */
  App.addSlide({
    id: 'why-parabola', chapter: 'الدرس الثاني · حركة القذائف', title: 'لماذا يرسم القذيفة قوساً؟',
    html: `
      ${head('لماذا قوس، لا خط مستقيم؟', 'لأن القوة الوحيدة المؤثرة هي الوزن، إلى الأسفل. أفقياً لا توجد قوة، فتثبت السرعة. عمودياً تتغيّر.')}
      <div class="split">
        <div class="stack">
          <div class="eq-panel">
            <div class="eq">Σ${M.vec('F')} = ${M.vec('w')} = ${M.m('m')}${M.vec('g')} ⇒ ${M.vec('a')} = ${M.vec('g')}</div>
            <div class="math-note">التسارع ثابت في الشدة والاتجاه: إلى الأسفل. لذلك نفصل الحركة إلى محورين.</div>
          </div>
          <div class="axis-table">
            <div class="axis-col"><span class="axis-name">على ox</span><div>${M.m('a_x = 0')}</div><div>${M.m('v_x = v₀ cos θ')}</div><div>${M.m('ثابتة')}</div></div>
            <div class="axis-col"><span class="axis-name">على oy</span><div>${M.m('a_y = −g')}</div><div>${M.m('v_y = v₀ sin θ − gt')}</div><div>${M.m('متغيّرة بانتظام')}</div></div>
          </div>
          <div class="controls mt-m" id="wpControls"></div>
          <p class="caption">${App.term('لماذا لا تؤثر السرعة الأفقية في السقوط؟', '<p>لأن الحركتين مستقلتان: قوة الوزن عمودية فقط، ولا تغيّر المركبة الأفقية. لهذا تصل كرة مُقذفة أفقياً وكرة ساقطة من الارتفاع نفسه إلى الأرض في اللحظة نفسها (بإهمال الهواء).</p>', 'استقلال المحورين')}</p>
        </div>
        <div class="stack">
          ${stage('wpCanvas', 'tall')}
          <p class="caption">الأخضر: المركبة الأفقية الثابتة. الداكن: المركبة العمودية المتغيرة.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 16, theta: 50, t: 0 };
      const cv = root.querySelector('#wpCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        const tNow = (t * .32) % (pr.tFlight * 1.1);
        const o = App.projScene(s, { v0: state.v0, theta: state.theta, t: Math.min(tNow, pr.tFlight), components: true, stats: false });
        // snapshots labels
        s.label('vx ثابتة', w * .52, 28, { size: 11.5, color: th.teal, weight: 600 });
        s.label('vy تتغيّر', w * .52, 46, { size: 11.5, color: th.ink, weight: 600 });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      const host = root.querySelector('#wpControls');
      App.slider(host, { label: 'السرعة الابتدائية', min: 8, max: 26, step: 1, value: state.v0, unit: 'm/s', dec: 0, onInput: (v) => { state.v0 = v; } });
      App.slider(host, { label: 'زاوية القذف', min: 15, max: 80, step: 1, value: state.theta, unit: '°', dec: 0, onInput: (v) => { state.theta = v; } });
    }
  });

  /* =========================================================
     معادلات الحركة
     ========================================================= */
  App.addSlide({
    id: 'oblique-eq', chapter: 'الدرس الثاني · حركة القذائف', title: 'معادلات الحركة: محوران، حكايتان',
    html: `
      ${head('محوران، معادلتان، حركة واحدة.', 'نأخذ لحظة القذف بداية للزمن، ونقطة القذف بداية للفواصل. نسقط الحركة على المحورين.')}
      <div class="split">
        <div class="stack">
          ${stage('oeCanvas', 'tall')}
          <p class="caption">اسحب الزمن لترى الموضع والمركبتين في كل لحظة. ${M.m('x')} يتغير بانتظام، ${M.m('y')} يتبع قطعاً مكافئاً.</p>
        </div>
        <div class="stack">
          <table class="dtable">
            <thead><tr><th>على ox</th><th>على oy</th></tr></thead>
            <tbody>
              <tr><td class="num">${M.m('a_x = 0')}</td><td class="num">${M.m('a_y = −g')}</td></tr>
              <tr><td class="num">${M.m('v_x = v₀ cos θ')}</td><td class="num">${M.m('v_y = v₀ sin θ − gt')}</td></tr>
              <tr><td class="num">${M.m('x = v₀ cos θ · t')}</td><td class="num">${M.m('y = v₀ sin θ · t − ½gt²')}</td></tr>
            </tbody>
          </table>
          <div class="panel panel--tight mt-s">
            <div class="controls inline" id="oeControls"></div>
            <div class="readouts mt-s">
              ${ro('oeX', 'x', '', 'm')}
              ${ro('oeY', 'y', '', 'm')}
              ${ro('oeVx', 'vx', '', 'm/s')}
              ${ro('oeVy', 'vy', '', 'm/s')}
            </div>
          </div>
          <p class="caption">المركبتان الابتدائيتان: ${M.m('v₀x = v₀ cos θ')} و ${M.m('v₀y = v₀ sin θ')}.</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 18, theta: 50, t: 0 };
      const xEl = root.querySelector('#oeX');
      const yEl = root.querySelector('#oeY');
      const vxEl = root.querySelector('#oeVx');
      const vyEl = root.querySelector('#oeVy');
      const cv = root.querySelector('#oeCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        const tt = clamp(state.t, 0, pr.tFlight);
        App.projScene(s, { v0: state.v0, theta: state.theta, t: tt, components: true, stats: false, worldW: 40, worldH: 20 });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        const tt = clamp(state.t, 0, pr.tFlight);
        xEl.innerHTML = fmt(pr.x(tt), 1) + '<small>&nbsp;m</small>';
        yEl.innerHTML = fmt(Math.max(0, pr.y(tt)), 1) + '<small>&nbsp;m</small>';
        vxEl.innerHTML = fmt(pr.vx, 1) + '<small>&nbsp;m/s</small>';
        vyEl.innerHTML = fmt(pr.vyAt(tt), 1) + '<small>&nbsp;m/s</small>';
      }
      const host = root.querySelector('#oeControls');
      App.slider(host, { label: 'السرعة الابتدائية', min: 8, max: 26, step: 1, value: state.v0, unit: 'm/s', dec: 0, onInput: (v) => { state.v0 = v; update(); } });
      App.slider(host, { label: 'الزاوية', min: 15, max: 80, step: 1, value: state.theta, unit: '°', dec: 0, onInput: (v) => { state.theta = v; update(); } });
      const tSl = App.slider(host, { label: 'الزمن t', min: 0, max: 5, step: .05, value: 0, unit: 's', dec: 2, onInput: (v) => { state.t = v; update(); } });
      if (tSl) tSl.el.style.gridColumn = '1 / -1';
      update();
    }
  });

  /* =========================================================
     معادلة المسار
     ========================================================= */
  App.addSlide({
    id: 'path-eq', chapter: 'الدرس الثاني · حركة القذائف', title: 'حذف الزمن: معادلة المسار',
    html: `
      ${head('المسار: قطع مكافئ.', 'الزمن ليس جزءاً من شكل المسار. نحذفه بين المعادلتين، فتبقى علاقة مباشرة بين x و y.')}
      <div class="split">
        <div class="stack">
          ${stage('peCanvas', 'tall')}
          <p class="caption">كل زاوية ترسم قطعاً مكافئاً مختلفاً. ${App.term('لماذا لا يكون الخط مستقيماً؟', '<p>لأن y تحتوي على t² بينما x خطية في t. عندما نستبدل t بدلالة x، يظهر حد x²، وهو ما يجعل المسار مكافئاً.</p>', 'سبب التربيع')}</p>
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:8px">
            <div class="step"><span class="step-k">1</span><div class="step-t">من معادلة x:
              <div class="eq">${M.m('t = x/(v₀ cos θ)')}</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">نعوّض في y ونبسّط:
              <div class="eq">${M.m('y = −')} ${M.frac(M.m('g'), '2' + M.m('v₀²cos²θ'))} ${M.m('x² + x tan θ')}</div>
            </div></div>
          </div>
          <div class="eq-panel">
            <div class="eq">${M.m('y = x tan θ −')} ${M.frac(M.m('g x²'), '2' + M.m('v₀² cos²θ'))}</div>
            <div class="eq-label">معادلة مسار القذف المائل</div>
          </div>
          <div class="controls mt-s" id="peControls"></div>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 18, theta: 50 };
      const cv = root.querySelector('#peCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        App.projScene(s, {
          v0: state.v0, theta: state.theta, t: P.projectile(state.v0, state.theta, { g: 10 }).tFlight,
          stats: true, worldW: 40, worldH: 22,
          ghosts: [{ v0: state.v0, theta: 30 }, { v0: state.v0, theta: 45 }, { v0: state.v0, theta: 70 }]
        });
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      const host = root.querySelector('#peControls');
      App.slider(host, { label: 'الزاوية', min: 20, max: 80, step: 1, value: state.theta, unit: '°', dec: 0, onInput: (v) => { state.theta = v; } });
    }
  });

  /* =========================================================
     مختبر القذف
     ========================================================= */
  App.addSlide({
    id: 'projectile-lab', chapter: 'الدرس الثاني · حركة القذائف', title: 'مختبر القذف',
    html: `
      ${head('مختبر القذف.', 'حدّد الهدف والسرعة والزاوية، ثم أطلق. هل يمرّ القذيفة من الهدف؟')}
      <div class="split">
        <div class="stack">
          ${stage('labCanvas', 'tall')}
          <div class="row between">
            <div class="readouts">
              ${ro('labRange', 'المدى', '', 'm')}
              ${ro('labPeak', 'الذروة', '', 'm')}
              ${ro('labTime', 'زمن الطيران', '', 's')}
            </div>
          </div>
        </div>
        <div class="stack">
          <div class="panel panel--tight">
            <div class="panel-label">تحكم التجربة</div>
            <div class="controls" id="labControls"></div>
            <div class="row between mt-m">
              <div class="btn-group">
                <button class="btn btn--sm" id="labFire">أطلق</button>
                <button class="btn btn--sm btn--ghost" id="labReset">أعد</button>
              </div>
              <div class="target-status" id="labStatus">جرّب</div>
            </div>
          </div>
          <div class="eq-panel">
            <div class="eq small">R = ${M.frac('v₀² sin 2θ', 'g')}</div>
            <div class="eq small">H = ${M.frac('v₀² sin²θ', '2g')}</div>
          </div>
          <p class="caption">${App.term('لماذا نغيّر الزاوية والسرعة معاً؟', '<p>لأن المدى والذروة يتحددان بهما معاً. لسرعة معينة توجد زاوية تصيب الهدف؛ ولسرعة أخرى قد تحتاج زاوية مختلفة. هذا هو جوهر التحكم في القذف.</p>', 'التحكم')}</p>
        </div>
      </div>`,
    mount(root, ctx) {
      const state = { v0: 18, theta: 45, target: 30, fired: false, t0: 0, done: false };
      const rangeEl = root.querySelector('#labRange');
      const peakEl = root.querySelector('#labPeak');
      const timeEl = root.querySelector('#labTime');
      const statusEl = root.querySelector('#labStatus');
      const targetY = 2;
      const cv = root.querySelector('#labCanvas');
      const sim = new App.Sim(cv, (s, t) => {
        const th = s.theme(), w = s.w, h = s.h;
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        const elapsed = state.fired ? clamp(t - state.t0, 0, 2.2) : 0;
        const tNow = state.fired ? clamp(elapsed / 2.2, 0, 1) * pr.tFlight : 0;
        App.projScene(s, {
          v0: state.v0, theta: state.theta, t: tNow,
          target: { x: state.target, y: targetY },
          worldW: Math.max(45, state.target + 12), worldH: 24,
          stats: true
        });
        if (state.fired) {
          const tAt = state.target / pr.vx;
          const yAt = pr.y(tAt);
          const hit = tAt > 0 && tAt <= pr.tFlight && Math.abs(yAt - targetY) < .5;
          s.label(hit ? 'أصابت!' : 'لم تصب', w * .5, 24, { size: 15, color: hit ? th.teal : th.accent, weight: 700 });
        }
      });
      sim.start();
      ctx.onDestroy(() => sim.stop());
      function update() {
        const pr = P.projectile(state.v0, state.theta, { g: 10 });
        rangeEl.innerHTML = fmt(pr.range, 1) + '<small>&nbsp;m</small>';
        peakEl.innerHTML = fmt(pr.peak, 1) + '<small>&nbsp;m</small>';
        timeEl.innerHTML = fmt(pr.tFlight, 2) + '<small>&nbsp;s</small>';
        const tAt = state.target / pr.vx;
        const yAt = pr.y(tAt);
        const hit = tAt > 0 && tAt <= pr.tFlight && Math.abs(yAt - targetY) < .5;
        statusEl.textContent = hit ? 'الهدف في المرور' : 'لم تصب بعد';
        statusEl.className = 'target-status ' + (hit ? 'ok' : 'no');
        state.done = hit;
      }
      const host = root.querySelector('#labControls');
      App.slider(host, { label: 'السرعة الابتدائية', min: 8, max: 30, step: 1, value: state.v0, unit: 'm/s', dec: 0, onInput: (v) => { state.v0 = v; state.fired = false; update(); } });
      App.slider(host, { label: 'زاوية القذف', min: 10, max: 80, step: 1, value: state.theta, unit: '°', dec: 0, onInput: (v) => { state.theta = v; state.fired = false; update(); } });
      App.slider(host, { label: 'بُعد الهدف', min: 10, max: 45, step: 1, value: state.target, unit: 'm', dec: 0, onInput: (v) => { state.target = v; state.fired = false; update(); } });
      update();
      ctx.on(root.querySelector('#labFire'), 'click', () => { state.fired = true; state.t0 = sim.t; });
      ctx.on(root.querySelector('#labReset'), 'click', () => { state.fired = false; update(); });
    }
  });

})();
