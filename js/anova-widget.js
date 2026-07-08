/* ===== ווידג'טים ליחידה 8 — ANOVA חד-כיוונית =====
   ווידג'ט 1 (w-an-*): מעבדת אות/רעש — פירוק השונות בשידור חי.
     שלוש קבוצות (פרונטלי/היברידי/מקוון), סליידרים למרחק בין הממוצעים,
     לרעש בתוך הקבוצות ולגודל הקבוצה. מחשב SSB/SSW/SST, MS, F,
     F קריטי ו-p-value אמיתיים (התפלגות F דרך פונקציית בטא לא-שלמה).
   ווידג'ט 2 (w-tc-*): מאמן השלמת טבלת ANOVA — התרגיל מההרצאה
     (k=4, N=24, SSB=180, SST=306), חשיפת תא-אחר-תא עם הזהות שמאחוריו. */
(function () {
  'use strict';

  /* ---------- נומריקה: התפלגות F ---------- */
  function logGamma(x) {
    var c = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
             -176.61502916214059, 12.507343278686905, -0.13857109526572012,
             9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) {
      return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
    }
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
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      var del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  /* פונקציית בטא לא-שלמה מנורמלת I_x(a,b) */
  function ibeta(a, b, x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) +
                      a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) return bt * betacf(a, b, x) / a;
    return 1 - bt * betacf(b, a, 1 - x) / b;
  }

  function fCdf(f, d1, d2) {
    if (f <= 0) return 0;
    return ibeta(d1 / 2, d2 / 2, d1 * f / (d1 * f + d2));
  }

  function fCrit(d1, d2, p) {
    var lo = 0, hi = 1000;
    for (var i = 0; i < 90; i++) {
      var mid = (lo + hi) / 2;
      if (fCdf(mid, d1, d2) < p) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ---------- ווידג'ט 1: מעבדת אות/רעש ---------- */

  /* "רעש" קבוע מראש (נראה אקראי, דטרמיניסטי — כדי שהניסוי יהיה שחזיר):
     3 שורות של 30 ערכים בסגנון N(0,1) */
  var JITTER = [
    [0.42, -1.13, 0.68, -0.35, 1.51, -0.82, 0.11, -1.96, 0.74, 0.29,
     -0.57, 1.08, -0.23, 0.91, -1.42, 0.05, 0.63, -0.74, 1.85, -0.18,
     -1.05, 0.38, 0.96, -0.61, 0.20, -1.28, 1.33, -0.44, 0.52, -0.88],
    [-0.31, 0.77, -1.62, 0.24, 0.58, -0.95, 1.19, -0.08, -0.66, 1.42,
     0.03, -1.17, 0.85, -0.39, 0.66, -2.05, 0.47, 1.02, -0.52, 0.15,
     0.92, -0.79, -0.12, 1.61, -1.34, 0.33, -0.26, 0.71, -0.98, 0.49],
    [0.88, -0.42, -1.08, 1.27, -0.15, 0.56, -0.71, 0.19, 1.74, -0.93,
     -0.28, 0.64, -1.51, 0.41, 1.05, -0.06, -0.83, 1.38, 0.27, -1.22,
     0.73, -0.49, 0.09, -1.77, 0.94, 0.36, -0.64, 1.16, -0.21, 0.59]
  ];
  /* פיזור אופקי קבוע של הנקודות בתוך כל קבוצה (פיקסלים סביב מרכז הקבוצה) */
  var XJIT = [-48, -32, -16, 0, 16, 32, 48, -40, -24, -8, 8, 24, 40, -52, -36,
              -20, -4, 12, 28, 44, -44, -28, -12, 4, 20, 36, 52, -50, -14, 22];
  /* רעש דגימה של ממוצעי הקבוצות: הזזה קבועה לכל קבוצה בסדר גודל σ/√n —
     כמו במדגם אמיתי. בלעדיה ממוצעי המדגם היו יוצאים כמעט זהים תחת H0
     וה-F היה מוצג קרוב ל-0 במקום לרחף סביב 1 */
  var MEAN_SHIFT = [-0.9, 0.15, 0.85];

  var GROUP_NAMES = ['פרונטלי', 'היברידי', 'מקוון'];
  var GROUP_COLORS = ['#e05252', '#1fa971', '#7c3aed'];

  function computeAnova(sep, noise, n) {
    var trueMeans = [50 - sep, 50, 50 + sep];
    var groups = [], all = [];
    for (var i = 0; i < 3; i++) {
      var g = [];
      for (var j = 0; j < n; j++) {
        var y = trueMeans[i] + noise * JITTER[i][j] +
                noise * MEAN_SHIFT[i] / Math.sqrt(n);
        g.push(y); all.push(y);
      }
      groups.push(g);
    }
    var grand = all.reduce(function (s, v) { return s + v; }, 0) / all.length;
    var means = groups.map(function (g) {
      return g.reduce(function (s, v) { return s + v; }, 0) / g.length;
    });
    var ssb = 0, ssw = 0, sst = 0;
    for (i = 0; i < 3; i++) {
      ssb += n * Math.pow(means[i] - grand, 2);
      for (j = 0; j < n; j++) {
        ssw += Math.pow(groups[i][j] - means[i], 2);
        sst += Math.pow(groups[i][j] - grand, 2);
      }
    }
    var dfb = 2, dfw = 3 * n - 3;
    var msb = ssb / dfb, msw = ssw / dfw;
    var F = msb / msw;
    return { groups: groups, means: means, grand: grand,
             ssb: ssb, ssw: ssw, sst: sst, dfb: dfb, dfw: dfw,
             msb: msb, msw: msw, F: F,
             fcrit: fCrit(dfb, dfw, 0.95), p: 1 - fCdf(F, dfb, dfw) };
  }

  function initLab() {
    var stage = document.getElementById('w-an-stage');
    if (!stage) return;

    var elSep = document.getElementById('w-an-sep');
    var elNoise = document.getElementById('w-an-noise');
    var elN = document.getElementById('w-an-n');
    var elSepV = document.getElementById('w-an-sep-val');
    var elNoiseV = document.getElementById('w-an-noise-val');
    var elNV = document.getElementById('w-an-n-val');
    var elShow = document.getElementById('w-an-show');
    var readout = document.getElementById('w-an-readout');

    /* סקלת ציור: y בתחום [15,85] ממופה ל-viewBox */
    function py(y) {
      var v = Math.max(15, Math.min(85, y));
      return 18 + (85 - v) * (280 / 70);
    }

    function render() {
      var sep = parseFloat(elSep.value);
      var noise = parseFloat(elNoise.value);
      var n = parseInt(elN.value, 10);
      elSepV.textContent = sep.toFixed(1);
      elNoiseV.textContent = noise.toFixed(1);
      elNV.textContent = n;

      var r = computeAnova(sep, noise, n);
      var cx = [130, 350, 570];
      var show = elShow.checked;
      var s = '';

      /* רשת ותוויות ציר */
      for (var t = 20; t <= 80; t += 10) {
        s += '<line x1="38" y1="' + py(t) + '" x2="662" y2="' + py(t) +
             '" stroke="#edf0f7" stroke-width="1"/>' +
             '<text x="30" y="' + (py(t) + 4) + '" font-size="11" fill="#8a92a6" text-anchor="end">' + t + '</text>';
      }
      /* קו הממוצע הכללי */
      s += '<line x1="40" y1="' + py(r.grand) + '" x2="660" y2="' + py(r.grand) +
           '" stroke="#1d2433" stroke-width="2" stroke-dasharray="7,5" opacity=".65"/>' +
           '<text x="656" y="' + (py(r.grand) - 6) + '" font-size="11.5" fill="#1d2433" text-anchor="end" font-weight="700">ממוצע כללי</text>';

      for (var i = 0; i < 3; i++) {
        var gm = py(r.means[i]);
        /* קווי "בין הקבוצות": ממוצע הקבוצה מול הממוצע הכללי */
        if (show) {
          s += '<line x1="' + cx[i] + '" y1="' + py(r.grand) + '" x2="' + cx[i] + '" y2="' + gm +
               '" stroke="#4f6df5" stroke-width="5" opacity=".8"/>';
        }
        /* קווי "בתוך הקבוצות": נקודה מול ממוצע הקבוצה */
        for (var j = 0; j < parseInt(elN.value, 10); j++) {
          var px = cx[i] + XJIT[j] * 1.15;
          var pyy = py(r.groups[i][j]);
          if (show) {
            s += '<line x1="' + px + '" y1="' + pyy + '" x2="' + px + '" y2="' + gm +
                 '" stroke="#d99114" stroke-width="1" opacity=".33"/>';
          }
          s += '<circle cx="' + px + '" cy="' + pyy + '" r="4" fill="' + GROUP_COLORS[i] + '" opacity=".78"/>';
        }
        /* קו ממוצע הקבוצה */
        s += '<line x1="' + (cx[i] - 72) + '" y1="' + gm + '" x2="' + (cx[i] + 72) + '" y2="' + gm +
             '" stroke="' + GROUP_COLORS[i] + '" stroke-width="3.5"/>' +
             '<text x="' + cx[i] + '" y="322" font-size="13" fill="' + GROUP_COLORS[i] +
             '" text-anchor="middle" font-weight="700">' + GROUP_NAMES[i] + '</text>';
      }

      stage.innerHTML =
        '<svg viewBox="0 0 700 330" style="width:100%;display:block;direction:ltr">' + s + '</svg>';

      /* פס יחס SSB/SST */
      var pctB = r.sst > 0 ? (r.ssb / r.sst) * 100 : 0;
      var reject = r.F > r.fcrit;
      var pTxt = r.p < 0.0001 ? '&lt; 0.0001' : '≈ ' + r.p.toFixed(4);

      readout.innerHTML =
        '<div style="display:flex;flex-wrap:wrap;gap:6px 26px">' +
        '<span>SSB = <strong style="color:#4f6df5">' + r.ssb.toFixed(1) + '</strong> (df = ' + r.dfb + ') ⇐ MSB = <strong>' + r.msb.toFixed(2) + '</strong></span>' +
        '<span>SSW = <strong style="color:#d99114">' + r.ssw.toFixed(1) + '</strong> (df = ' + r.dfw + ') ⇐ MSW = <strong>' + r.msw.toFixed(2) + '</strong></span>' +
        '<span>SST = ' + r.sst.toFixed(1) + ' ✓</span>' +
        '</div>' +
        '<div style="background:#eef1f8;border-radius:8px;height:16px;margin:8px 0 4px;overflow:hidden;direction:ltr">' +
        '<div style="background:#4f6df5;height:100%;width:' + pctB.toFixed(1) + '%"></div></div>' +
        '<div style="font-size:.85rem;color:#5b6478">החלק הכחול = SSB מתוך SST: <strong>' + pctB.toFixed(1) + '%</strong> מהפיזור מוסבר ע"י ההבדל בין הקבוצות (הצצה קדימה: למספר הזה נקרא ביחידה 9 בשם eta²)</div>' +
        '<hr style="border:none;border-top:1px solid #e3e7ef;margin:8px 0">' +
        '<div style="font-size:1.05rem">F = MSB / MSW = <strong style="direction:ltr;unicode-bidi:embed">' + r.F.toFixed(2) + '</strong>' +
        ' &nbsp;·&nbsp; ערך קריטי F<sub>0.95</sub>(' + r.dfb + ', ' + r.dfw + ') = ' + r.fcrit.toFixed(2) +
        ' &nbsp;·&nbsp; p ' + pTxt + '</div>' +
        '<div style="margin-top:6px;font-weight:700;padding:6px 12px;border-radius:8px;display:inline-block;' +
        (reject ? 'background:#e2f7ee;color:#1fa971">✓ F גדול מהערך הקריטי ⇐ דוחים את H0 — ההבדל בין הקבוצות גדול מכפי שרעש לבדו מסביר'
                : 'background:#eef0f5;color:#5b6478">✗ F לא עובר את הערך הקריטי ⇐ לא דוחים את H0 — הבדל כזה בין ממוצעים יכול לקרות מרעש בלבד') +
        '</div>';
    }

    [elSep, elNoise, elN].forEach(function (el) { el.addEventListener('input', render); });
    elShow.addEventListener('change', render);

    /* תרחישים מוכנים */
    function preset(d, s2, n2) {
      elSep.value = d; elNoise.value = s2; elN.value = n2; render();
    }
    var b1 = document.getElementById('w-an-preset-h0');
    var b2 = document.getElementById('w-an-preset-hard');
    var b3 = document.getElementById('w-an-preset-clear');
    if (b1) b1.addEventListener('click', function () { preset(0, 4, 10); });
    if (b2) b2.addEventListener('click', function () { preset(1.5, 7, 10); });
    if (b3) b3.addEventListener('click', function () { preset(6, 3, 10); });

    render();
  }

  /* ---------- ווידג'ט 2: מאמן השלמת טבלת ANOVA ---------- */
  function initTableTrainer() {
    var wrap = document.getElementById('w-tc-table');
    if (!wrap) return;

    var log = document.getElementById('w-tc-log');
    var btnNext = document.getElementById('w-tc-next');
    var btnReset = document.getElementById('w-tc-reset');

    /* התרגיל מההרצאה: k=4 קבוצות, N=24 תצפיות, נתונים SSB ו-SST */
    var cells; /* מצב הטבלה */
    var stepIdx;

    var STEPS = [
      { cell: 'df_b', value: '3',
        how: 'df<sub>B</sub> = k − 1 = 4 − 1 = <strong>3</strong>',
        why: 'מספר הקבוצות פחות אילוץ אחד — בהינתן הממוצע הכללי, רק 3 ממוצעי קבוצות חופשיים' },
      { cell: 'df_w', value: '20',
        how: 'df<sub>W</sub> = N − k = 24 − 4 = <strong>20</strong>',
        why: 'בכל אחת מ-4 הקבוצות "שילמנו" דרגת חופש אחת על ממוצע הקבוצה' },
      { cell: 'df_t', value: '23',
        how: 'df<sub>T</sub> = N − 1 = <strong>23</strong>',
        why: 'ובדיקת עקביות: 3 + 20 = 23 ✓ — דרגות החופש מתחלקות בדיוק כמו סכומי הריבועים' },
      { cell: 'ss_w', value: '126',
        how: 'SS<sub>W</sub> = SS<sub>T</sub> − SS<sub>B</sub> = 306 − 180 = <strong>126</strong>',
        why: 'זהות הפירוק SST = SSB + SSW עובדת בשני הכיוונים — אפשר לחלץ ממנה כל איבר חסר' },
      { cell: 'ms_b', value: '60',
        how: 'MS<sub>B</sub> = SS<sub>B</sub> / df<sub>B</sub> = 180 / 3 = <strong>60</strong>',
        why: 'ריבוע ממוצע = סכום ריבועים חלקי דרגות החופש שלו. תמיד.' },
      { cell: 'ms_w', value: '6.3',
        how: 'MS<sub>W</sub> = SS<sub>W</sub> / df<sub>W</sub> = 126 / 20 = <strong>6.3</strong>',
        why: 'זה אומדן השונות של הרעש (σ²) בתוך הקבוצות' },
      { cell: 'f', value: '9.52',
        how: 'F = MS<sub>B</sub> / MS<sub>W</sub> = 60 / 6.3 ≈ <strong>9.52</strong>',
        why: 'האות גדול פי 9.5 מהרעש' },
      { cell: null, value: null,
        how: 'שלב אחרון — החלטה: הערך הקריטי F<sub>0.95</sub>(3, 20) ≈ 3.10, ו-9.52 גדול ממנו בהרבה',
        why: '⇐ דוחים את H0: יש הבדל מובהק בין הקבוצות. הטבלה הושלמה 🎉' }
    ];

    function freshCells() {
      return {
        ss_b: { v: '180', known: true }, df_b: { v: '?', known: false },
        ms_b: { v: '?', known: false }, f: { v: '?', known: false },
        ss_w: { v: '?', known: false }, df_w: { v: '?', known: false },
        ms_w: { v: '?', known: false },
        ss_t: { v: '306', known: true }, df_t: { v: '?', known: false }
      };
    }

    function td(key, extra) {
      var c = cells[key];
      var style = 'direction:ltr;text-align:center;';
      if (c.known) style += 'font-weight:700;';
      else style += 'color:#b6bccb;';
      if (c.flash) style += 'background:#e2f7ee;color:#1fa971;font-weight:800;';
      return '<td style="' + style + (extra || '') + '">' + c.v + '</td>';
    }

    function render() {
      wrap.innerHTML =
        '<table class="tbl" style="margin:0">' +
        '<tr><th>מקור השונות</th><th style="text-align:center">SS</th><th style="text-align:center">df</th><th style="text-align:center">MS</th><th style="text-align:center">F</th></tr>' +
        '<tr><td><strong>בין הקבוצות</strong> (Between)</td>' + td('ss_b') + td('df_b') + td('ms_b') + td('f') + '</tr>' +
        '<tr><td><strong>בתוך הקבוצות</strong> (Within)</td>' + td('ss_w') + td('df_w') + td('ms_w') + '<td style="background:#fafbfe"></td></tr>' +
        '<tr><td><strong>סה"כ</strong> (Total)</td>' + td('ss_t') + td('df_t') + '<td style="background:#fafbfe"></td><td style="background:#fafbfe"></td></tr>' +
        '</table>';
    }

    function addLog(html, color) {
      var div = document.createElement('div');
      div.style.cssText = 'background:#fff;border:1px solid #e3e7ef;border-right:4px solid ' +
        (color || '#4f6df5') + ';border-radius:8px;padding:7px 12px;margin-top:7px;font-size:.9rem';
      div.innerHTML = html;
      log.appendChild(div);
    }

    function reset() {
      cells = freshCells();
      stepIdx = 0;
      log.innerHTML = '';
      btnNext.disabled = false;
      btnNext.textContent = '▶ גלה את הצעד הבא';
      render();
      addLog('<strong>נתון:</strong> k = 4 קבוצות, N = 24 תצפיות, SS<sub>B</sub> = 180, SS<sub>T</sub> = 306. כל שאר התאים — עליך. נסה לחשב בראש כל תא לפני שאתה חושף אותו!', '#5b6478');
    }

    btnNext.addEventListener('click', function () {
      if (stepIdx >= STEPS.length) return;
      /* לנקות הבהוב קודם */
      Object.keys(cells).forEach(function (k) { delete cells[k].flash; });
      var st = STEPS[stepIdx];
      if (st.cell) {
        cells[st.cell].v = st.value;
        cells[st.cell].known = true;
        cells[st.cell].flash = true;
      }
      addLog('<strong>צעד ' + (stepIdx + 1) + ':</strong> ' + st.how + '<br><span style="color:#5b6478">' + st.why + '</span>',
             stepIdx === STEPS.length - 1 ? '#1fa971' : '#4f6df5');
      render();
      stepIdx++;
      if (stepIdx >= STEPS.length) {
        btnNext.disabled = true;
        btnNext.textContent = '✓ הטבלה הושלמה';
      }
    });
    btnReset.addEventListener('click', reset);

    reset();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLab();
    initTableTrainer();
  });
})();
