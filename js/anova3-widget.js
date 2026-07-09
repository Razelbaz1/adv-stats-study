/* ===== ווידג'טים ליחידה 10 — ANOVA דו-כיוונית =====
   ווידג'ט 1 (w-iv-*): חוקר האינטראקציה — סליידר "עוצמת אינטראקציה" שממורף
     את ממוצעי התאים מעולם אדיטיבי (קווים מקבילים) לדוגמת הקולה האמיתית
     ואף מעבר. מצייר גרף אינטראקציה חי + התחזית האדיטיבית כרפאים, ומחשב
     טבלת ANOVA דו-כיוונית מלאה (SS_A/SS_B/SS_AB/SS_E, F, p) בזמן אמת.
   ווידג'ט 2 (w-t2-*): מאמן טבלת ANOVA דו-כיוונית — נתוני הקולה מההרצאה,
     חשיפת תא-אחר-תא של שלוש שורות האפקטים (A, B, AB) + שגיאה. */
(function () {
  'use strict';

  /* ---------- נומריקה: התפלגות F (זהה לזו של anova-widget) ---------- */
  function logGamma(x) {
    var c = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
             -176.61502916214059, 12.507343278686905, -0.13857109526572012,
             9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    x -= 1;
    var a = 0.99999999999980993, t = x + 7.5;
    for (var i = 0; i < 8; i++) a += c[i] / (x + i + 1);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }
  function betacf(a, b, x) {
    var MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
    var qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) +
                      a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function fSf(f, d1, d2) { /* survival = p-value */
    if (f <= 0) return 1;
    return 1 - ibeta(d1 / 2, d2 / 2, d1 * f / (d1 * f + d2));
  }

  /* ---------- מודל דו-כיווני: דוגמת הקולה ---------- */
  /* A = סוג בקבוק (0=זכוכית, 1=פלסטיק), a=2
     B = מיקום במדף (0=low, 1=med, 2=high), b=3 */
  var GRAND = 54.3333;
  /* התחזית האדיטיבית (קווים מקבילים) — grand + alpha_i + beta_j */
  var ADD = [
    [30.75, 56.5, 35.25],   /* זכוכית: low, med, high */
    [57.75, 83.5, 62.25]    /* פלסטיק */
  ];
  /* דפוס האינטראקציה של הקולה (actual - additive); שורות ועמודות מסתכמות ל-0 */
  var GAMMA = [
    [-3.25, -5.5, 8.75],
    [3.25, 5.5, -8.75]
  ];
  /* jitter ממורכז לכל תא (סכום 0) — הסטיות האמיתיות של נתוני הקולה,
     בסדר התאים i*b+j (זכוכית low/med/high ואז פלסטיק low/med/high).
     כך שבעוצמה=1 ורעש=1 מתקבלת בדיוק טבלת ההרצאה (N=12, SS_E=127) */
  var JIT = [
    [-4.5, 4.5],   /* זכוכית low  {23,32} */
    [-4, 4],       /* זכוכית med  {47,55} */
    [-4, 4],       /* זכוכית high {40,48} */
    [-2, 2],       /* פלסטיק low  {59,63} */
    [-1, 1],       /* פלסטיק med  {88,90} */
    [-2.5, 2.5]    /* פלסטיק high {51,56} */
  ];
  var NPC = 2;                  /* תצפיות בכל תא — כמו בהרצאה */
  var LOC = ['low', 'med', 'high'];
  var BOT = ['זכוכית', 'פלסטיק'];
  var BCOL = ['#4f6df5', '#e0447c'];

  function cellMean(i, j, lam) { return ADD[i][j] + lam * GAMMA[i][j]; }

  function computeTwoWay(lam, noise) {
    var a = 2, b = 3, n = NPC, N = a * b * n;
    var obs = [];   /* obs[i][j] = array */
    var cellM = [[0,0,0],[0,0,0]];
    for (var i = 0; i < a; i++) {
      obs.push([]);
      for (var j = 0; j < b; j++) {
        var m = cellMean(i, j, lam);
        cellM[i][j] = m;
        var arr = [];
        var jitRow = JIT[i * b + j];
        for (var k = 0; k < n; k++) arr.push(m + noise * jitRow[k]);
        obs[i].push(arr);
      }
    }
    var all = [];
    for (i = 0; i < a; i++) for (j = 0; j < b; j++) all = all.concat(obs[i][j]);
    var grand = all.reduce(function (s, v) { return s + v; }, 0) / N;
    /* ממוצעים שוליים */
    var mA = [], mB = [0, 0, 0];
    for (i = 0; i < a; i++) {
      var si = 0, ci = 0;
      for (j = 0; j < b; j++) for (var k2 = 0; k2 < n; k2++) { si += obs[i][j][k2]; ci++; }
      mA.push(si / ci);
    }
    for (j = 0; j < b; j++) {
      var sj = 0, cj = 0;
      for (i = 0; i < a; i++) for (k2 = 0; k2 < n; k2++) { sj += obs[i][j][k2]; cj++; }
      mB[j] = sj / cj;
    }
    /* ממוצעי תאים בפועל */
    var cbar = [[0,0,0],[0,0,0]];
    for (i = 0; i < a; i++) for (j = 0; j < b; j++) {
      var s = 0; for (k2 = 0; k2 < n; k2++) s += obs[i][j][k2];
      cbar[i][j] = s / n;
    }
    var ssA = 0, ssB = 0, ssAB = 0, ssE = 0;
    for (i = 0; i < a; i++) ssA += n * b * Math.pow(mA[i] - grand, 2);
    for (j = 0; j < b; j++) ssB += n * a * Math.pow(mB[j] - grand, 2);
    for (i = 0; i < a; i++) for (j = 0; j < b; j++)
      ssAB += n * Math.pow(cbar[i][j] - mA[i] - mB[j] + grand, 2);
    for (i = 0; i < a; i++) for (j = 0; j < b; j++) for (k2 = 0; k2 < n; k2++)
      ssE += Math.pow(obs[i][j][k2] - cbar[i][j], 2);
    var dfA = a - 1, dfB = b - 1, dfAB = (a - 1) * (b - 1), dfE = N - a * b;
    var msE = ssE / dfE;
    function row(ss, df) { var ms = ss / df, F = ms / msE; return { ss: ss, df: df, ms: ms, F: F, p: fSf(F, df, dfE) }; }
    return {
      cellM: cellM, cbar: cbar, mA: mA, mB: mB, grand: grand,
      A: row(ssA, dfA), B: row(ssB, dfB), AB: row(ssAB, dfAB),
      E: { ss: ssE, df: dfE, ms: msE }
    };
  }

  /* ---------- ווידג'ט 1: חוקר האינטראקציה ---------- */
  function initVisualizer() {
    var stage = document.getElementById('w-iv-stage');
    if (!stage) return;
    var elLam = document.getElementById('w-iv-lam');
    var elLamV = document.getElementById('w-iv-lam-val');
    var elNoise = document.getElementById('w-iv-noise');
    var elNoiseV = document.getElementById('w-iv-noise-val');
    var elGhost = document.getElementById('w-iv-ghost');
    var readout = document.getElementById('w-iv-readout');

    function py(y) { /* תחום ערכים ~15..100 -> ציור */
      var v = Math.max(15, Math.min(100, y));
      return 20 + (100 - v) * (250 / 85);
    }

    function render() {
      var lam = parseFloat(elLam.value);
      var noise = parseFloat(elNoise.value);
      elLamV.textContent = lam.toFixed(1);
      elNoiseV.textContent = noise.toFixed(1);
      var r = computeTwoWay(lam, noise);
      var ghost = elGhost.checked;

      var cx = [150, 370, 590];  /* low, med, high */
      var s = '';
      /* רשת + תוויות ציר Y */
      for (var t = 20; t <= 100; t += 20) {
        s += '<line x1="70" y1="' + py(t) + '" x2="660" y2="' + py(t) + '" stroke="#edf0f7"/>' +
             '<text x="62" y="' + (py(t) + 4) + '" font-size="11" fill="#8a92a6" text-anchor="end">' + t + '</text>';
      }
      /* תוויות ציר X */
      for (var j = 0; j < 3; j++)
        s += '<text x="' + cx[j] + '" y="292" font-size="13" fill="#5b6478" text-anchor="middle" font-weight="600">' + LOC[j] + '</text>';
      s += '<text x="365" y="14" font-size="12" fill="#5b6478" text-anchor="middle">ממוצע מכירות לפי מיקום במדף (קו לכל סוג בקבוק)</text>';

      for (var i = 0; i < 2; i++) {
        /* קווי רפאים אדיטיביים (מקבילים) */
        if (ghost && Math.abs(lam) > 0.05) {
          var pa = '';
          for (j = 0; j < 3; j++) pa += (j === 0 ? 'M' : 'L') + cx[j] + ',' + py(ADD[i][j]).toFixed(1);
          s += '<path d="' + pa + '" fill="none" stroke="' + BCOL[i] + '" stroke-width="1.5" stroke-dasharray="4,4" opacity=".45"/>';
        }
        /* הקו בפועל */
        var p = '';
        for (j = 0; j < 3; j++) p += (j === 0 ? 'M' : 'L') + cx[j] + ',' + py(r.cellM[i][j]).toFixed(1);
        s += '<path d="' + p + '" fill="none" stroke="' + BCOL[i] + '" stroke-width="3"/>';
        for (j = 0; j < 3; j++)
          s += '<circle cx="' + cx[j] + '" cy="' + py(r.cellM[i][j]) + '" r="5" fill="' + BCOL[i] + '"/>';
        /* תווית סדרה */
        s += '<circle cx="' + (90 + i * 120) + '" cy="270" r="5" fill="' + BCOL[i] + '"/>' +
             '<text x="' + (100 + i * 120) + '" y="274" font-size="12" fill="' + BCOL[i] + '" font-weight="700">' + BOT[i] + '</text>';
      }
      stage.innerHTML = '<svg viewBox="0 0 700 300" style="width:100%;display:block;direction:ltr">' + s + '</svg>';

      /* מד מקבילות: כמה SS_AB מתוך (SS_AB+שארית-מקבילות) */
      var parallel = Math.abs(lam) < 0.05;
      var interSig = r.AB.p < 0.05;
      function fmt(x) { return x.toFixed(1); }
      function pf(x) { return x < 0.0001 ? '&lt;0.0001' : x.toFixed(4); }

      readout.innerHTML =
        '<table class="tbl" style="margin:0 0 8px">' +
        '<tr><th>מקור</th><th style="text-align:center">SS</th><th style="text-align:center">df</th><th style="text-align:center">MS</th><th style="text-align:center">F</th><th style="text-align:center">p</th></tr>' +
        '<tr><td>סוג בקבוק (A)</td><td style="direction:ltr;text-align:center">' + fmt(r.A.ss) + '</td><td style="direction:ltr;text-align:center">' + r.A.df + '</td><td style="direction:ltr;text-align:center">' + fmt(r.A.ms) + '</td><td style="direction:ltr;text-align:center">' + r.A.F.toFixed(2) + '</td><td style="direction:ltr;text-align:center">' + pf(r.A.p) + '</td></tr>' +
        '<tr><td>מיקום (B)</td><td style="direction:ltr;text-align:center">' + fmt(r.B.ss) + '</td><td style="direction:ltr;text-align:center">' + r.B.df + '</td><td style="direction:ltr;text-align:center">' + fmt(r.B.ms) + '</td><td style="direction:ltr;text-align:center">' + r.B.F.toFixed(2) + '</td><td style="direction:ltr;text-align:center">' + pf(r.B.p) + '</td></tr>' +
        '<tr style="background:#fff0f4"><td><strong>אינטראקציה (A×B)</strong></td><td style="direction:ltr;text-align:center">' + fmt(r.AB.ss) + '</td><td style="direction:ltr;text-align:center">' + r.AB.df + '</td><td style="direction:ltr;text-align:center">' + fmt(r.AB.ms) + '</td><td style="direction:ltr;text-align:center"><strong>' + r.AB.F.toFixed(2) + '</strong></td><td style="direction:ltr;text-align:center">' + pf(r.AB.p) + '</td></tr>' +
        '<tr><td>שגיאה</td><td style="direction:ltr;text-align:center">' + fmt(r.E.ss) + '</td><td style="direction:ltr;text-align:center">' + r.E.df + '</td><td style="direction:ltr;text-align:center">' + fmt(r.E.ms) + '</td><td></td><td></td></tr>' +
        '</table>' +
        '<div style="font-weight:700;padding:6px 12px;border-radius:8px;display:inline-block;' +
        (parallel
          ? 'background:#e2f7ee;color:#1fa971">▬ הקווים מקבילים ⇐ אין אינטראקציה: אפקט המיקום זהה לשני סוגי הבקבוק'
          : (interSig
            ? 'background:#fdeaea;color:#e05252">✗ הקווים לא מקבילים ⇐ אינטראקציה מובהקת (p=' + pf(r.AB.p) + '): השפעת המיקום תלויה בסוג הבקבוק'
            : 'background:#fdf3dd;color:#d99114">≈ הקווים כמעט מקבילים ⇐ אינטראקציה קיימת אך לא מובהקת ברעש הזה')) +
        '</div>' +
        '<div style="font-size:.85rem;color:#5b6478;margin-top:6px">שים לב: כשמזיזים את עוצמת האינטראקציה — ‏SS של האפקטים הראשיים (A ו-B) כמעט לא זזים; רק ‏SS_AB (השורה הוורודה) גדל. זה בדיוק פירוק השונות בפעולה.</div>';
    }

    [elLam, elNoise].forEach(function (el) { el.addEventListener('input', render); });
    elGhost.addEventListener('change', render);
    function preset(l, nz) { elLam.value = l; elNoise.value = nz; render(); }
    var b0 = document.getElementById('w-iv-add');
    var b1 = document.getElementById('w-iv-cola');
    var b2 = document.getElementById('w-iv-strong');
    if (b0) b0.addEventListener('click', function () { preset(0, 1); });
    if (b1) b1.addEventListener('click', function () { preset(1, 1); });
    if (b2) b2.addEventListener('click', function () { preset(2.2, 1); });
    render();
  }

  /* ---------- ווידג'ט 2: מאמן טבלת ANOVA דו-כיוונית (נתוני הקולה) ---------- */
  function initTrainer() {
    var wrap = document.getElementById('w-t2-table');
    if (!wrap) return;
    var log = document.getElementById('w-t2-log');
    var btnNext = document.getElementById('w-t2-next');
    var btnReset = document.getElementById('w-t2-reset');

    var cells, stepIdx;

    var STEPS = [
      { k: 'dfA', v: '1', how: 'df<sub>A</sub> = a − 1 = 2 − 1 = <strong>1</strong>', why: 'שני סוגי בקבוק (a=2) פחות אילוץ אחד' },
      { k: 'dfB', v: '2', how: 'df<sub>B</sub> = b − 1 = 3 − 1 = <strong>2</strong>', why: 'שלושה מיקומים (b=3) פחות אילוץ אחד' },
      { k: 'dfAB', v: '2', how: 'df<sub>A×B</sub> = (a−1)(b−1) = 1 × 2 = <strong>2</strong>', why: 'זו הנוסחה הייחודית לאינטראקציה — מכפלת דרגות החופש של שני הגורמים' },
      { k: 'dfE', v: '6', how: 'df<sub>E</sub> = N − ab = 12 − 6 = <strong>6</strong>', why: '12 תצפיות פחות 6 תאים (אמדנו ממוצע לכל תא)' },
      { k: 'ssAB', v: '469.5', how: 'SS<sub>A×B</sub> = SS<sub>T</sub> − SS<sub>A</sub> − SS<sub>B</sub> − SS<sub>E</sub> = 4296.67 − 2187 − 1513.17 − 127 = <strong>469.5</strong>', why: 'זהות הפירוק הדו-כיוונית: הכול מתחלק בין שני האפקטים, האינטראקציה והשגיאה' },
      { k: 'msA', v: '2187', how: 'MS<sub>A</sub> = 2187 / 1 = <strong>2187</strong>', why: 'MS = SS/df, שורה-שורה' },
      { k: 'msB', v: '756.6', how: 'MS<sub>B</sub> = 1513.17 / 2 = <strong>756.6</strong>', why: '' },
      { k: 'msAB', v: '234.75', how: 'MS<sub>A×B</sub> = 469.5 / 2 = <strong>234.75</strong>', why: '' },
      { k: 'msE', v: '21.17', how: 'MS<sub>E</sub> = 127 / 6 = <strong>21.17</strong>', why: 'זה המכנה המשותף של כל שלושת מבחני ה-F — אומדן שונות הרעש' },
      { k: 'fA', v: '103.3', how: 'F<sub>A</sub> = 2187 / 21.17 = <strong>103.3</strong>', why: 'סוג הבקבוק — אפקט ענק' },
      { k: 'fB', v: '35.74', how: 'F<sub>B</sub> = 756.6 / 21.17 = <strong>35.74</strong>', why: 'המיקום — גם מובהק מאוד' },
      { k: 'fAB', v: '11.09', how: 'F<sub>A×B</sub> = 234.75 / 21.17 = <strong>11.09</strong>', why: 'האינטראקציה — p=0.0097, מובהקת! ולכן מפרשים אותה קודם' },
      { k: null, v: null, how: '🏁 הטבלה הושלמה. שלושה מבחני F, כולם מחולקים באותו MS<sub>E</sub>=21.17.', why: 'המסקנה: כל שלושת האפקטים מובהקים. כי האינטראקציה מובהקת — מתחילים לפרש ממנה: השפעת המיקום על המכירות שונה בין זכוכית לפלסטיק.' }
    ];

    function fresh() {
      return {
        ssA: { v: '2187', known: true }, dfA: { v: '?', known: false }, msA: { v: '?', known: false }, fA: { v: '?', known: false },
        ssB: { v: '1513.17', known: true }, dfB: { v: '?', known: false }, msB: { v: '?', known: false }, fB: { v: '?', known: false },
        ssAB: { v: '?', known: false }, dfAB: { v: '?', known: false }, msAB: { v: '?', known: false }, fAB: { v: '?', known: false },
        ssE: { v: '127', known: true }, dfE: { v: '?', known: false }, msE: { v: '?', known: false },
        ssT: { v: '4296.67', known: true }, dfT: { v: '11', known: true }
      };
    }

    function td(key) {
      var c = cells[key];
      var st = 'direction:ltr;text-align:center;';
      if (c.known) st += 'font-weight:700;'; else st += 'color:#b6bccb;';
      if (c.flash) st += 'background:#e2f7ee;color:#1fa971;font-weight:800;';
      return '<td style="' + st + '">' + c.v + '</td>';
    }

    function render() {
      wrap.innerHTML =
        '<table class="tbl" style="margin:0">' +
        '<tr><th>מקור השונות</th><th style="text-align:center">SS</th><th style="text-align:center">df</th><th style="text-align:center">MS</th><th style="text-align:center">F</th></tr>' +
        '<tr><td><strong>סוג בקבוק (A)</strong></td>' + td('ssA') + td('dfA') + td('msA') + td('fA') + '</tr>' +
        '<tr><td><strong>מיקום (B)</strong></td>' + td('ssB') + td('dfB') + td('msB') + td('fB') + '</tr>' +
        '<tr style="background:#fff0f4"><td><strong>אינטראקציה (A×B)</strong></td>' + td('ssAB') + td('dfAB') + td('msAB') + td('fAB') + '</tr>' +
        '<tr><td><strong>שגיאה</strong></td>' + td('ssE') + td('dfE') + td('msE') + '<td style="background:#fafbfe"></td></tr>' +
        '<tr><td><strong>סה"כ</strong></td>' + td('ssT') + td('dfT') + '<td style="background:#fafbfe"></td><td style="background:#fafbfe"></td></tr>' +
        '</table>';
    }

    function addLog(html, color) {
      var d = document.createElement('div');
      d.style.cssText = 'background:#fff;border:1px solid #e3e7ef;border-right:4px solid ' + (color || '#4f6df5') +
        ';border-radius:8px;padding:7px 12px;margin-top:7px;font-size:.9rem';
      d.innerHTML = html;
      log.appendChild(d);
    }

    function reset() {
      cells = fresh(); stepIdx = 0; log.innerHTML = '';
      btnNext.disabled = false; btnNext.textContent = '▶ גלה את הצעד הבא';
      render();
      addLog('<strong>נתון (מהחישוב הידני בהרצאה):</strong> a=2 סוגי בקבוק, b=3 מיקומים, N=12 תצפיות. ‏SS<sub>A</sub>=2187, ‏SS<sub>B</sub>=1513.17, ‏SS<sub>E</sub>=127, ‏SS<sub>T</sub>=4296.67. השלם את שאר הטבלה!', '#5b6478');
    }

    btnNext.addEventListener('click', function () {
      if (stepIdx >= STEPS.length) return;
      Object.keys(cells).forEach(function (k) { delete cells[k].flash; });
      var st = STEPS[stepIdx];
      if (st.k) { cells[st.k].v = st.v; cells[st.k].known = true; cells[st.k].flash = true; }
      addLog('<strong>צעד ' + (stepIdx + 1) + ':</strong> ' + st.how + (st.why ? '<br><span style="color:#5b6478">' + st.why + '</span>' : ''),
             stepIdx === STEPS.length - 1 ? '#1fa971' : '#4f6df5');
      render();
      stepIdx++;
      if (stepIdx >= STEPS.length) { btnNext.disabled = true; btnNext.textContent = '✓ הטבלה הושלמה'; }
    });
    btnReset.addEventListener('click', reset);
    reset();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initVisualizer();
    initTrainer();
  });
})();
