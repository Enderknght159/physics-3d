/* =========================================================
   الفصل الرابع — تمارين الدرس الأول وحركة القذائف
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

  /* shared projectile drawing */
  function proj(s, o) {
    const th = s.theme(), w = s.w, h = s.h, g = 10;
    const pr = P.projectile(o.v0, o.theta, { h0: o.h0 || 0, g });
    const worldW = o.worldW || Math.max(8, pr.range * 1.15);
    const worldH = o.worldH || Math.max(5, pr.peak * 1.3);
    const pad = { l: 48, r: 26, t: 24, b: 42 };
    const sc = Math.min((w - pad.l - pad.r) / worldW, (h - pad.t - pad.b) / worldH);
    const ox = pad.l, oy = h - pad.b;
    const X = (x) => ox + x * sc;
    const Y = (y) => oy - y * sc;
    // grid + axes
    const xStep = worldW > 40 ? 10 : 5, yStep = worldH > 20 ? 5 : 2;
    for (let x = 0; x <= worldW; x += xStep) s.line(X(x), oy, X(x), pad.t, { color: th.ink, width: 1, alpha: .055, dash: [1, 6] });
    for (let y = 0; y <= worldH; y += yStep) s.line(ox, Y(y), w - pad.r, Y(y), { color: th.ink, width: 1, alpha: .055, dash: [1, 6] });
    s.line(ox, oy, w - pad.r + 2, oy, { color: th.ink, width: 1.5, alpha: .55 });
    s.line(ox, oy, ox, pad.t - 2, { color: th.ink, width: 1.5, alpha: .55 });
    s.arrow(ox, oy, w - pad.r, oy, { color: th.ink, width: 1.1, head: 5, alpha: .4 });
    s.arrow(ox, oy, ox, pad.t, { color: th.ink, width: 1.1, head: 5, alpha: .4 });
    s.label('x (m)', w - pad.r, oy + 22, { size: 11, color: th.muted, align: 'right', dir: 'ltr' });
    s.label('y (m)', ox - 10, pad.t + 4, { size: 11, color: th.muted, align: 'right', dir: 'ltr' });
    // tick labels
    for (let x = 0; x <= worldW; x += xStep) {
      if (x === 0) continue;
      s.label(String(x), X(x), oy + 14, { size: 9.5, color: th.muted, dir: 'ltr' });
    }
    for (let y = 0; y <= worldH; y += yStep) {
      if (y === 0) continue;
      s.label(String(y), ox - 8, Y(y), { size: 9.5, color: th.muted, align: 'right', dir: 'ltr' });
    }
    // ghosts
    (o.ghosts || []).forEach((gg) => {
      const gp = P.projectile(gg.v0, gg.theta, { h0: o.h0 || 0, g });
      s.ctx.save();
      s.ctx.strokeStyle = th.ink; s.ctx.globalAlpha = .18; s.ctx.lineWidth = 1.4; s.ctx.setLineDash([4, 6]);
      s.ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const tt = gp.tFlight * i / 100;
        const px = X(gp.x(tt)), py = Y(Math.max(0, gp.y(tt)));
        i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
      }
      s.ctx.stroke(); s.ctx.restore();
    });
    // path
    s.ctx.save();
    s.ctx.strokeStyle = th.ink; s.ctx.globalAlpha = .38; s.ctx.lineWidth = 1.4; s.ctx.setLineDash([4, 7]);
    s.ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const tt = pr.tFlight * i / 120;
      const px = X(pr.x(tt)), py = Y(Math.max(0, pr.y(tt)));
      i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
    }
    s.ctx.stroke(); s.ctx.restore();
    // flown
    const tNow = clamp(o.t == null ? pr.tFlight : o.t, 0, pr.tFlight);
    s.ctx.save();
    s.ctx.strokeStyle = th.accent; s.ctx.lineWidth = 2.8; s.ctx.lineCap = 'round';
    s.ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const tt = tNow * i / 120;
      const px = X(pr.x(tt)), py = Y(Math.max(0, pr.y(tt)));
      i ? s.ctx.lineTo(px, py) : s.ctx.moveTo(px, py);
    }
    s.ctx.stroke(); s.ctx.restore();
    // peak
    if (o.stats !== false) {
      s.line(X(pr.range / 2), oy, X(pr.range / 2), Y(pr.peak), { color: th.ink, width: 1, alpha: .18, dash: [2, 6] });
      s.label('الذروة', X(pr.range / 2) + 8, Y(pr.peak) - 10, { size: 10.5, color: th.muted, align: 'left' });
      if (X(pr.range) < w - 10) {
        s.arrow(X(0) + 4, oy + 30, X(pr.range) - 4, oy + 30, { color: th.ink, width: 1, head: 5, double: true, alpha: .35 });
        s.label('المدى', X(pr.range / 2), oy + 42, { size: 10.5, color: th.muted });
      }
    }
    // target
    if (o.target) {
      const tx = X(o.target.x), ty = Y(o.target.y);
      s.ring(tx, ty, 13, { color: th.accent, width: 2, dash: [3, 4] });
      s.dot(tx, ty, 4, { color: th.accent });
      s.label('الهدف', tx, ty - 22, { size: 10.5, color: th.accent });
    }
    // ball
    const bx = X(pr.x(tNow)), by = Y(Math.max(0, pr.y(tNow)));
    s.dot(bx, by, 6, { color: th.accent });
    // velocity components
    if (o.components) {
      const vx = pr.vx, vy = pr.vyAt(tNow);
      const cvx = X(0) + 50, cvy = Y(0) - 50;
      s.arrow(bx, by, bx + vx * 3.2, by, { color: th.teal, width: 2, head: 7 });
      s.label('vx', bx + vx * 3.2 + 8, by, { size: 10.5, color: th.teal, dir: 'ltr', align: 'left' });
      s.arrow(bx, by, bx, by - vy * 3.2, { color: th.ink, width: 2, head: 7 });
      s.label('vy', bx - 10, by - vy * 3.2 - 8, { size: 10.5, color: th.ink, dir: 'ltr', align: 'right' });
    }
    return { pr, X, Y, sc, ox, oy, tNow, bx, by };
  }
  App.projScene = proj;

  /* =========================================================
     اختبر: كرة تصدم كرة أثقل
     ========================================================= */
  App.addSlide({
    id: 'quiz-elastic', chapter: 'الدرس الأول · تمارين', title: 'اختبر: كرة تصدم كرة أثقل',
    html: `
      ${head('كرة صغيرة، وهدف ثقيل.', 'm₂ = 3m₁ والكرة الثانية ساكنة. الصدم مرن وعلى المستقيم نفسه. ما سرعة الكرة الثانية بعد الصدم؟')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="30" y1="170" x2="490" y2="170" stroke="var(--ink)" stroke-width="1.6" opacity=".4"/>
            <circle cx="140" cy="152" r="20" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4"/>
            <text x="140" y="110" text-anchor="middle" font-size="13" fill="var(--ink)">m₁</text>
            <circle cx="360" cy="135" r="37" fill="rgba(195,67,40,.12)" stroke="var(--accent)" stroke-width="2.6"/>
            <text x="360" y="82" text-anchor="middle" font-size="13" fill="var(--ink)">m₂ = 3m₁</text>
            <text x="360" y="140" text-anchor="middle" font-size="11" fill="var(--ink-3)">ساكنة</text>
            ${App.arrowSVG(182, 152, 290, 152, { color: 'accent', w: 2.4, head: 9, label: 'v₁' })}
          `, '0 0 520 220', 'كرتان على سطح أفقي، الصغيرة تتحرك نحو الكبيرة الساكنة')}
          <p class="caption">${App.term('كيف نعرف الاتجاه دون حساب؟', '<p>الكرة الصغيرة أخف من الكبيرة. في الصدم المرن على المستقيم، ترتد الصغيرة إلى الخلف، بينما تستمر الكبيرة إلى الأمام. الصيغة تؤكد ذلك بالإشارة السالبة.</p>', 'الاتجاه')}</p>
        </div>
        <div class="stack">
          <div class="quiz" id="qeQuiz"></div>
          <div class="note-links">
            ${App.term('ما العلاقة التي تحسم السؤال؟', '<p>من حفظ كمية الحركة: m₁v₁ = m₁v₁′ + 3m₁v₂′. ومن حفظ الطاقة نحصل على v₁ = v₂′ − v₁′. بجمعهما: v₂′ = v₁/2.</p>', 'الحل السريع')}
          </div>
        </div>
      </div>`,
    mount(root, ctx) {
      App.Quiz(root.querySelector('#qeQuiz'), {
        q: 'كمية حركة الكرة الأولى قبل الصدم m₁v₁. بعد الصدم، سرعة الثانية v₂′ تساوي:',
        options: [
          { t: `${M.m('v₂′ = ½ v₁')}`, ok: true, why: 'لأن m₂ = 3m₁: v₂′ = 2m₁v₁/(m₁+3m₁) = v₁/2. الاختيار (ج).' },
          { t: `${M.m('v₂′ = 4v₁')}`, ok: false, why: 'هذا أكبر من السرعة الابتدائية، ويخالف حفظ الطاقة. راجع الصيغة: 2m₁/(m₁+3m₁) = ½.' },
          { t: `${M.m('v₂′ = 3v₁')}`, ok: false, why: 'معامل 3 هو نسبة الكتلة، وليس نسبة السرعة. الكتلة الأكبر تعني سرعة أصغر عند كمية الحركة نفسها.' },
          { t: `${M.m('v₂′ = ¼ v₁')}`, ok: false, why: 'هذه نسبة الكتلة مقلوبة. الحساب الصحيح يعطي ½ v₁.' }
        ]
      });
    }
  });

  /* =========================================================
     اختبر: كتلتان تلتحمان
     ========================================================= */
  App.addSlide({
    id: 'quiz-inelastic', chapter: 'الدرس الأول · تمارين', title: 'اختبر: كتلتان تلتحمان',
    html: `
      ${head('صدم ليّن: كتلتان تصبحان واحدة.', 'كتلة m₁ تتحرك بسرعة v₁، وتصدم كتلة ساكنة كتلتها 2m₁ وتلتحم معها. ما سرعة الجملة بعد الصدم؟')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="30" y1="160" x2="490" y2="160" stroke="var(--ink)" stroke-width="1.5" opacity=".4"/>
            <line x1="260" y1="40" x2="260" y2="200" stroke="var(--ink)" stroke-width="1" stroke-dasharray="4 6" opacity=".25"/>
            <text x="140" y="42" text-anchor="middle" font-size="11" fill="var(--ink-3)">قبل الصدم</text>
            <text x="380" y="42" text-anchor="middle" font-size="11" fill="var(--ink-3)">بعد الصدم</text>
            <rect x="70" y="126" width="34" height="34" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2"/>
            <text x="87" y="112" text-anchor="middle" font-size="12" fill="var(--ink)">m₁</text>
            <rect x="175" y="118" width="52" height="42" fill="rgba(195,67,40,.12)" stroke="var(--accent)" stroke-width="2.2"/>
            <text x="201" y="104" text-anchor="middle" font-size="12" fill="var(--accent)">2m₁</text>
            <text x="201" y="184" text-anchor="middle" font-size="10" fill="var(--ink-3)">ساكنة</text>
            ${App.arrowSVG(110, 143, 168, 143, { color: 'accent', w: 2.2, head: 8, label: 'v₁' })}
            <rect x="320" y="122" width="96" height="38" fill="rgba(195,67,40,.08)" stroke="var(--accent)" stroke-width="2.2"/>
            <line x1="368" y1="122" x2="368" y2="160" stroke="var(--ink)" stroke-width="1" opacity=".3"/>
            ${App.arrowSVG(424, 141, 480, 141, { color: 'teal', w: 2.2, head: 8, label: 'v′' })}
          `, '0 0 520 240', 'كتلة صغيرة تتحرك نحو كتلة أكبر ساكنة ثم تلتحمان')}
          <p class="caption">${App.term('لماذا لا تُحفظ الطاقة هنا؟', '<p>لأن الالتحام يشوّه الجسمين ويولّد حرارة. كمية الحركة وحدها هي المحفوظة، لأن القوى المؤثرة داخلية.</p>', 'الطاقة')}</p>
        </div>
        <div class="stack">
          <div class="quiz" id="qiQuiz"></div>
        </div>
      </div>`,
    mount(root, ctx) {
      App.Quiz(root.querySelector('#qiQuiz'), {
        q: 'سرعة الجملة بعد الالتحام تساوي:',
        options: [
          { t: `${M.m('v′ = ⅓ v₁')}`, ok: true, why: 'm₁v₁ = (m₁ + 2m₁)v′ = 3m₁v′ ⇒ v′ = v₁/3. الاختيار (ب).' },
          { t: `${M.m('v′ = ½ v₁')}`, ok: false, why: 'هذه الحالة لو كانت الكتلة الثانية m₁ لا 2m₁. الكتلة الكلية هنا 3m₁.' },
          { t: `${M.m('v′ = 2v₁')}`, ok: false, why: 'هذا يخالف حفظ كمية الحركة؛ السرعة لا تزداد عند الالتحام.' },
          { t: `${M.m('v′ = 0')}`, ok: false, why: 'التوقف التام يحتاج تصادماً مع جدار ثابت، لا مع كتلة متحركة.' }
        ]
      });
    }
  });

  /* =========================================================
     اختبر: كرتان معلقتان
     ========================================================= */
  App.addSlide({
    id: 'quiz-pendulum', chapter: 'الدرس الأول · تمارين', title: 'اختبر: كرتان معلّقتان',
    html: `
      ${head('كرتان، خيطان، وارتفاع واحد.', 'كرتان متساويتان في الكتلة. نزيح الأولى بزاوية ثم نتركها. بعد صدم مرن مباشر، ماذا يحدث؟')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="80" y1="40" x2="440" y2="40" stroke="var(--ink)" stroke-width="4"/>
            <line x1="160" y1="40" x2="230" y2="160" stroke="var(--ink)" stroke-width="1.7"/>
            <circle cx="230" cy="160" r="13" fill="var(--accent)"/>
            <text x="230" y="196" text-anchor="middle" font-size="12" fill="var(--accent)">m₁</text>
            <line x1="160" y1="40" x2="160" y2="190" stroke="var(--ink)" stroke-width="1" stroke-dasharray="4 6" opacity=".3"/>
            <line x1="360" y1="40" x2="360" y2="190" stroke="var(--ink)" stroke-width="1.7"/>
            <circle cx="360" cy="190" r="13" fill="var(--ink)"/>
            <text x="360" y="226" text-anchor="middle" font-size="12" fill="var(--ink)">m₂</text>
            <path d="M160 100 A 60 60 0 0 1 200 75" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
            <text x="190" y="105" font-size="12" fill="var(--accent)">θ</text>
            ${App.dimSVG(300, 160, 300, 40, 'h₁', { color: 'muted' })}
          `, '0 0 520 260', 'نواسان: كرة مرفوعة وكرة ساكنة في الأسفل')}
          <p class="caption">${App.term('لماذا يتوقف الجسمان المتساويان ويتبادلان السرعة؟', '<p>في الصدم المرن المباشر بين كتلتين متساويتين، تعطي معادلتا الحفظ v₁′ = 0 و v₂′ = v₁. تنتقل السرعة كاملة من الأولى إلى الثانية.</p>', 'تبادل السرعة')}</p>
        </div>
        <div class="stack">
          <div class="quiz" id="qpQuiz"></div>
          <div class="eq-panel">
            <div class="eq small">${M.m('m₁ = m₂')} ⇒ ${M.m('v₁′ = 0')} , ${M.m('v₂′ = v₁')}</div>
          </div>
        </div>
      </div>`,
    mount(root, ctx) {
      App.Quiz(root.querySelector('#qpQuiz'), {
        q: 'بعد الصدم، أي وصف هو الصحيح؟',
        options: [
          { t: 'الكرة الأولى تقف، والكرة الثانية ترتفع إلى الارتفاع نفسه h₁.', ok: true, why: 'تبادلتا السرعة. الثانية تبدأ بالسرعة التي وصلت بها الأولى إلى أسفل، فترتفع إلى الارتفاع نفسه (بإهمال الفقدان).' },
          { t: 'الكرة الأولى ترتد، والثانية ترتفع إلى ارتفاع أكبر من h₁.', ok: false, why: 'الارتفاع الأكبر يحتاج طاقة أكبر، ولا يوجد مصدر إضافي. والصدم المرن لا يخلق طاقة.' },
          { t: 'الكرة الأولى تقف، والثانية ترتفع إلى ارتفاع أصغر من h₁.', ok: false, why: 'هذا يحدث في صدم ليّن (فقدان طاقة)، لا في صدم مرن بين كتلتين متساويتين.' },
          { t: 'الكرة الأولى ترتد، والثانية ترتفع إلى ارتفاع أصغر من h₁.', ok: false, why: 'لا ترتد الأولى إذا كانت الكتلتان متساويتين ومباشرتين. تنتقل السرعة كاملة.' }
        ]
      });
    }
  });

  /* =========================================================
     مسألة نصف الكرة
     ========================================================= */
  App.addSlide({
    id: 'prob-hemisphere', chapter: 'الدرس الأول · تمارين', title: 'مسألة: نصف كرة أملس',
    html: `
      ${head('مسألة: نصف كرة أملس.', 'm₁ = m₂ تنزلق من حافة وعاء نصف كروي نصف قطره R، وتصدم m₂ الساكنة في القاع صدماً ليّناً. أثبت أن ارتفاع الجملة h = R/4.')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <path d="M50 55 A 170 170 0 0 0 390 55" fill="none" stroke="var(--ink)" stroke-width="12" opacity=".9"/>
            <path d="M50 55 A 170 170 0 0 0 390 55" fill="none" stroke="var(--paper)" stroke-width="4" opacity=".3"/>
            <circle cx="220" cy="55" r="3" fill="var(--ink)"/>
            <line x1="220" y1="55" x2="220" y2="225" stroke="var(--accent)" stroke-width="1.4" stroke-dasharray="4 5"/>
            <text x="232" y="150" font-size="12" fill="var(--accent)">R</text>
            <rect x="42" y="40" width="17" height="17" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2"/>
            <text x="51" y="30" text-anchor="middle" font-size="11" fill="var(--ink)">m₁</text>
            <rect x="208" y="210" width="24" height="16" fill="rgba(195,67,40,.15)" stroke="var(--accent)" stroke-width="2"/>
            <text x="220" y="248" text-anchor="middle" font-size="11" fill="var(--accent)">m₂</text>
            <rect x="326" y="146" width="30" height="18" fill="rgba(195,67,40,.15)" stroke="var(--accent)" stroke-width="2"/>
            ${App.dimSVG(382, 218, 382, 164, 'h', { color: 'teal', labelDx: 12, labelDy: 4 })}
            <line x1="220" y1="218" x2="300" y2="155" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="3 5" opacity=".7"/>
          `, '0 0 440 270', 'وعاء نصف كروي، كتلة عند الحافة وأخرى في القاع، والجملة تصل إلى ارتفاع h')}
          <p class="caption">ينزلق m₁ على السطح الداخلي الملس: الطاقة الميكانيكية محفوظة. عند القاع يصطدم بـ m₂ ويلتحمان.</p>
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:10px">
            <div class="step"><span class="step-k">1</span><div class="step-t">قبل الصدم: من الطاقة، سرعة m₁ عند القاع:
              <div class="eq">${M.frac('1','2')}${M.m('m')}${M.m('v')}<span class="sub">1</span><span class="sup">2</span> = ${M.m('m')}${M.m('g')}${M.m('R')} ⇒ ${M.m('v')}<span class="sub">1</span> = ${M.sqrt('2gR')}</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">الصدم الليّن: الكتلتان متساويتان، فكمية الحركة تعطي:
              <div class="eq">${M.m('m v₁ = 2m v′')} ⇒ ${M.m('v′ = v₁/2')}</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">بعد الصدم: الطاقة الحركية تتحول إلى ارتفاع.
              <div class="eq">${M.frac('1','2')}(2m)${M.m('(v₁/2)')}<span class="sup">2</span> = 2mg h</div>
              <div class="eq">${M.m('m g R / 2 = 2m g h')} ⇒ ${M.m('h = R/4')}</div>
            </div></div>
          </div>
          <div class="result-band" style="grid-template-columns:1fr">
            <div class="result-item"><span class="result-k">النتيجة</span><strong>h = R/4</strong><small>نصف الطاقة ضاعت في الصدم، وربع الارتفاع الأصلي يكفي لتخزين ما تبقى.</small></div>
          </div>
        </div>
      </div>`,
    mount() {}
  });

  /* =========================================================
     مسألة السيارتين
     ========================================================= */
  App.addSlide({
    id: 'prob-cars', chapter: 'الدرس الأول · تمارين', title: 'مسألة: تصادم من الخلف',
    html: `
      ${head('مسألة: تصادم من الخلف.', 'سيارة A كتلتها <span class="ltr">3000 kg</span> تسير بسرعة <span class="ltr">2 m/s</span>، تصدمها B كتلتها <span class="ltr">1000 kg</span> من الخلف وتلتحم معها. سرعة الجملة بعد الصدم <span class="ltr">4 m/s</span>. قوة الفرملة <span class="ltr">1600 N</span>.')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <rect x="20" y="150" width="480" height="60" fill="var(--paper-3)"/>
            <line x1="20" y1="180" x2="500" y2="180" stroke="var(--paper)" stroke-width="2" stroke-dasharray="14 10" opacity=".8"/>
            <rect x="300" y="132" width="90" height="34" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2"/>
            <rect x="322" y="120" width="46" height="16" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.2"/>
            <text x="345" y="113" text-anchor="middle" font-size="12" fill="var(--ink)">A = 3000 kg</text>
            <rect x="170" y="140" width="70" height="28" fill="rgba(195,67,40,.1)" stroke="var(--accent)" stroke-width="2.2"/>
            <rect x="186" y="128" width="36" height="14" fill="rgba(195,67,40,.1)" stroke="var(--accent)" stroke-width="2.2"/>
            <text x="205" y="121" text-anchor="middle" font-size="12" fill="var(--accent)">B = 1000 kg</text>
            ${App.arrowSVG(170, 110, 280, 110, { color: 'accent', w: 2.2, head: 8, label: '2 m/s' })}
            ${App.arrowSVG(170, 205, 290, 205, { color: 'ink', w: 2.2, head: 8, label: 'B قبل الصدم' })}
          `, '0 0 520 240', 'سيارة A أمام سيارة B على طريق أفقي')}
          <p class="caption">بعد الالتحام تتحرك الجملة بسرعة 4 m/s، ثم توقفها قوة احتكاك 1600 N. ${App.term('لماذا نستخدم كمية الحركة أولاً؟', '<p>لأن الصدم سريع وقوى الاحتكاك خلاله صغيرة مقارنة بقوى الصدم، فتُهمل. بعد الصدم يصبح الاحتكاك هو القوة الخارجية المؤثرة، فنستخدم ΔP = FΔt لحساب المسافة.</p>', 'لماذا على مرحلتين؟')}</p>
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:10px">
            <div class="step"><span class="step-k">1</span><div class="step-t">حفظ كمية الحركة:
              <div class="eq">3000×2 + 1000×${M.m('v_B')} = 4000×4</div>
              <div class="eq">${M.m('v_B')} = 10 m/s</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">بعد الصدم: قوة الفرملة توقف 4000 kg.
              <div class="eq">${M.m('a = F/m = 1600/4000 = 0.4 m/s²')}</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">المسافة حتى التوقف:
              <div class="eq">${M.m('d = v²/(2a) = 16/(0.8) = 20 m')}</div>
            </div></div>
          </div>
          <div class="readouts">
            ${ro('carsVB', 'سرعة B قبل الصدم', '10', 'm/s')}
            ${ro('carsD', 'مسافة التوقف', '20', 'm', 'readout--accent')}
          </div>
        </div>
      </div>`,
    mount() {}
  });

  /* =========================================================
     مسألة البلياردو
     ========================================================= */
  App.addSlide({
    id: 'prob-billiards', chapter: 'الدرس الأول · تمارين', title: 'مسألة: ثلاث كرات على الطاولة',
    html: `
      ${head('مسألة: ثلاث كرات على الطاولة.', 'كرة بيضاء بسرعة <span class="ltr">√3 m/s</span> تصدم الكرة 11 صدماً غير مباشر. بعد الصدم تسير البيضاء بزاوية <span class="ltr">30°</span> فوق الأفق، و11 بزاوية <span class="ltr">60°</span> تحته. ثم تصطدم كل منهما كرة ساكنة صدماً مباشراً.')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <rect x="25" y="30" width="470" height="250" rx="6" fill="#2C5149" stroke="#6E4D36" stroke-width="8"/>
            <circle cx="70" cy="70" r="7" fill="#111A1F"/><circle cx="450" cy="70" r="7" fill="#111A1F"/>
            <circle cx="70" cy="240" r="7" fill="#111A1F"/><circle cx="450" cy="240" r="7" fill="#111A1F"/>
            <circle cx="260" cy="30" r="7" fill="#111A1F"/><circle cx="260" cy="280" r="7" fill="#111A1F"/>
            <circle cx="120" cy="200" r="9" fill="#F3EEE3"/>
            <line x1="130" y1="200" x2="250" y2="160" stroke="#F3EEE3" stroke-width="2" opacity=".7"/>
            <circle cx="260" cy="155" r="9" fill="var(--accent)"/>
            <text x="260" y="140" text-anchor="middle" font-size="11" fill="var(--cream)">11</text>
            <line x1="270" y1="155" x2="390" y2="105" stroke="#F3EEE3" stroke-width="2.2"/>
            <line x1="270" y1="155" x2="390" y2="215" stroke="var(--accent)" stroke-width="2.2"/>
            <text x="398" y="100" font-size="11" fill="var(--cream)">30°</text>
            <text x="398" y="222" font-size="11" fill="var(--cream)">60°</text>
            <line x1="270" y1="155" x2="420" y2="155" stroke="var(--cream)" stroke-width="1" stroke-dasharray="4 4" opacity=".4"/>
            <circle cx="390" cy="105" r="9" fill="#E0A12A"/>
            <circle cx="390" cy="215" r="9" fill="var(--accent)"/>
            <text x="120" y="226" text-anchor="middle" font-size="10" fill="var(--cream)">البيضاء</text>
          `, '0 0 520 310', 'طاولة بلياردو: مسار الكرة البيضاء والكرة 11 بزاويتين 30 و60 درجة')}
          <p class="caption">${App.term('لماذا نستخدم 30° و60°؟', '<p>لأن الزاويتين مجموعهما 90°، وهذا متسق مع نتيجة الصدم المرن بين كرتين متماثلتين: السرعتان متعامدتان. تُستخدم الزاويتان لحساب المركبتين.</p>', 'هندسة المسألة')}</p>
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:10px">
            <div class="step"><span class="step-k">1</span><div class="step-t">المركبة الأفقية محفوظة:
              <div class="eq">√3 = v₁′ cos30 + v₂′ cos60</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">المركبة العمودية تلغي نفسها:
              <div class="eq">v₁′ sin30 = v₂′ sin60 ⇒ v₁′ = √3 v₂′</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">بالتعويض: v₂′ = √3/2 ≈ 0.87 m/s، و v₁′ = 1.5 m/s.</div></div>
            <div class="step"><span class="step-k">4</span><div class="step-t">في الصدمات المباشرة التالية تنتقل السرعة كاملة: الكرة الصفراء تأخذ 1.5، والحمراء تأخذ 0.87. البيضاء و11 تتوقفان.</div></div>
          </div>
          <div class="readouts">
            ${ro('billV1', 'سرعة البيضاء بعد الأولى', '1.5', 'm/s')}
            ${ro('billV2', 'سرعة 11 بعد الأولى', '0.87', 'm/s', 'readout--accent')}
          </div>
        </div>
      </div>`,
    mount() {}
  });

  /* =========================================================
     مسألة سهم اللوح
     ========================================================= */
  App.addSlide({
    id: 'prob-arrow', chapter: 'الدرس الأول · تمارين', title: 'مسألة: سهم ولوح معلّق',
    html: `
      ${head('مسألة: سهم ولوح معلّق.', 'سهم كتلته <span class="ltr">30 g</span> يلتصق بلوح <span class="ltr">90 g</span> معلّق بخيط، فيرتفع مركز عطالة الجملة <span class="ltr">10 cm</span>. استنتج سرعة السهم قبل الصدم (<span class="ltr">g = 10</span>).')}
      <div class="split">
        <div class="stack">
          ${fig(`
            <line x1="120" y1="35" x2="400" y2="35" stroke="var(--ink)" stroke-width="4"/>
            <line x1="270" y1="35" x2="270" y2="130" stroke="var(--ink)" stroke-width="1.6"/>
            <line x1="340" y1="35" x2="340" y2="130" stroke="var(--ink)" stroke-width="1.6"/>
            <rect x="258" y="130" width="94" height="70" fill="var(--paper-2)" stroke="var(--ink)" stroke-width="2.4"/>
            <text x="305" y="170" text-anchor="middle" font-size="12" fill="var(--ink-3)">M = 90 g</text>
            <line x1="60" y1="160" x2="240" y2="160" stroke="var(--accent)" stroke-width="2.6"/>
            <path d="M240 160 l-10 -6 v12 z" fill="var(--accent)"/>
            <text x="90" y="145" font-size="12" fill="var(--accent)">v</text>
            <text x="150" y="185" text-anchor="middle" font-size="11" fill="var(--accent)">m = 30 g</text>
            <rect x="258" y="70" width="94" height="70" fill="none" stroke="var(--ink)" stroke-width="1.3" stroke-dasharray="5 6" opacity=".3"/>
            ${App.dimSVG(382, 200, 382, 140, 'h = 10 cm', { color: 'teal', labelDx: 14, labelDy: 4 })}
          `, '0 0 480 250', 'سهم يتجه نحو لوح معلق بخيطين، ويرتفع اللوح مسافة h')}
          <p class="caption">مرحلتان: صدم غير مرن (كمية الحركة)، ثم صعود (طاقة). الترتيب مهم.</p>
        </div>
        <div class="stack">
          <div class="steps" style="display:grid;gap:10px">
            <div class="step"><span class="step-k">1</span><div class="step-t">بعد الصدم، سرعة الجملة من الارتفاع:
              <div class="eq">${M.m('v′')} = ${M.sqrt('2gh')} = ${M.m('√(2×10×0.1) ≈ 1.41 m/s')}</div>
            </div></div>
            <div class="step"><span class="step-k">2</span><div class="step-t">حفظ كمية الحركة في الصدم:
              <div class="eq">${M.m('m v = (m+M) v′')}</div>
            </div></div>
            <div class="step"><span class="step-k">3</span><div class="step-t">نعوّض:
              <div class="eq">${M.m('v = (0.12/0.03) × 1.41 = 5.66 m/s')}</div>
            </div></div>
          </div>
          <div class="readouts">
            ${ro('arrowV', 'سرعة السهم', '5.66', 'm/s', 'readout--accent')}
          </div>
        </div>
      </div>`,
    mount() {}
  });

})();
