/* ===== ווידג'טים אינטראקטיביים ליחידה 6 — אינטראקציות ורגרסיה פולינומית =====
   דורש Plotly (basic). ווידג'ט האוברפיטינג משתמש ב-window.POLY_DATA —
   נתוני השיעור המדויקים (seed=0, split random_state=42) עם התאמות שחושבו מראש ב-numpy. */
(function () {
  'use strict';

  var BASE_LAYOUT = {
    margin: { l: 45, r: 12, t: 28, b: 40 },
    font: { family: 'Heebo, sans-serif', size: 12 },
    dragmode: false,
    plot_bgcolor: '#fbfcff'
  };
  var CFG = { displayModeBar: false, responsive: true };
  function fmt(v, d) { return Number(v).toFixed(d === undefined ? 2 : d); }

  /* =====================================================================
     ווידג'ט A — אינטראקציה עם משתנה דמה (התבנית של שאלה 9)
     בסיס (מעשנים כבדים): y = 83.27 − 0.451·משקל
     לא מעשנים:           y = (83.27+8.73) + (−0.451+β3)·משקל
  ===================================================================== */
  function initInteraction() {
    var el = document.getElementById('w-int-plot');
    if (!el) return;
    var out = document.getElementById('w-int-readout');
    var s3 = document.getElementById('w-int-b3');
    var B0 = 83.27, B1 = -0.4507, D = 8.7326; /* מתוך פלט שאלה 9 במבחן */

    function draw() {
      var b3 = parseFloat(s3.value);
      var x0 = 40, x1 = 120;
      var base = [B0 + B1 * x0, B0 + B1 * x1];
      var grp = [(B0 + D) + (B1 + b3) * x0, (B0 + D) + (B1 + b3) * x1];
      Plotly.react(el, [
        { x: [x0, x1], y: base, mode: 'lines', line: { color: '#e05252', width: 3 }, name: 'מעשנים כבדים (בסיס)', hoverinfo: 'skip' },
        { x: [x0, x1], y: grp, mode: 'lines', line: { color: '#1fa971', width: 3, dash: 'dash' }, name: 'לא מעשנים', hoverinfo: 'skip' }
      ], Object.assign({}, BASE_LAYOUT, {
        showlegend: true, legend: { orientation: 'h', y: 1.12 },
        xaxis: { title: 'משקל (ק"ג)', fixedrange: true },
        yaxis: { title: 'אורך חיים (שנים)', fixedrange: true, range: [-25, 140] }
      }), CFG);
      var slope2 = B1 + b3;
      var rel = b3 === 0 ? 'הקווים מקבילים — אין אינטראקציה' :
                (b3 > 0 ? 'המניפה נפתחת: השיפוע של הלא-מעשנים מתון יותר (פחות שלילי)' : 'השיפוע של הלא-מעשנים תלול עוד יותר');
      var b3s = String(parseFloat(b3.toFixed(4)));
      out.innerHTML =
        'שיפוע הבסיס (מעשנים כבדים): <strong><span dir="ltr">' + fmt(B1, 3) + '</span></strong> · ' +
        'שיפוע הלא-מעשנים: <span dir="ltr">' + fmt(B1, 3) + ' + (' + b3s + ') = ' + fmt(slope2, 3) + '</span><br>' +
        '<strong style="color:#7c3aed">מקדם האינטראקציה β₃ = <span dir="ltr">' + b3s + '</span> — בדיוק ההפרש בין השיפועים.</strong> ' + rel;
      document.getElementById('w-int-b3-val').textContent = b3s;
    }
    s3.addEventListener('input', draw);
    document.getElementById('w-int-exam').addEventListener('click', function () {
      s3.value = 0.3187; draw();
    });
    draw();
  }

  /* =====================================================================
     ווידג'ט B — אוברפיטינג: דרגת הפולינום על נתוני השיעור
  ===================================================================== */
  function initOverfit() {
    var el = document.getElementById('w-of-plot');
    if (!el || !window.POLY_DATA) return;
    var D = window.POLY_DATA;
    var out = document.getElementById('w-of-readout');
    var sD = document.getElementById('w-of-degree');

    function evalPoly(coef, x) { /* מקדמים בסדר עולה — Horner מהגבוה לנמוך */
      var v = 0;
      for (var i = coef.length - 1; i >= 0; i--) v = v * x + coef[i];
      return v;
    }
    function draw() {
      var d = parseInt(sD.value, 10);
      var fit = D.fits[d];
      var xs = [], ys = [], i, xv, yv;
      for (i = 0; i <= 300; i++) {
        xv = 10 * i / 300;
        yv = evalPoly(fit.coef, xv);
        xs.push(xv);
        ys.push(Math.max(-14, Math.min(16, yv))); /* חיתוך תצוגה לדרגות המשתוללות */
      }
      Plotly.react(el, [
        { x: xs, y: ys, mode: 'lines', line: { color: '#7c3aed', width: 2.5 }, name: 'המודל', hoverinfo: 'skip' },
        { x: D.xtr, y: D.ytr, mode: 'markers', marker: { color: '#2f6db5', size: 9 }, name: 'Train (המודל ראה)', hoverinfo: 'skip' },
        { x: D.xte, y: D.yte, mode: 'markers', marker: { color: '#d99114', size: 9, symbol: 'square' }, name: 'Test (המודל לא ראה)', hoverinfo: 'skip' }
      ], Object.assign({}, BASE_LAYOUT, {
        showlegend: true, legend: { orientation: 'h', y: 1.12 },
        title: { text: 'פולינום מדרגה ' + d, font: { size: 14 } },
        xaxis: { title: 'x', fixedrange: true },
        yaxis: { title: 'y', fixedrange: true, range: [-14.5, 16.5] }
      }), CFG);
      var verdict;
      if (d <= 2) verdict = '📏 <strong>Underfitting:</strong> המודל פשוט מדי — מפספס את הגליות של הסינוס גם ב-train וגם ב-test.';
      else if (d === 3) verdict = '🙂 מתחיל לתפוס את הצורה, אבל ה-test עדיין סובל.';
      else if (d === 4) verdict = '🏆 <strong>נקודת האיזון!</strong> ה-MSE על ה-test הנמוך ביותר (0.281) — המודל תופס את הצורה בלי לשנן את הרעש. זו הדרגה ש-AIC, BIC ו-R²adj בוחרים פה אחד.';
      else if (d <= 7) verdict = '⚠️ מתחיל לשנן: ה-train משתפר אבל ה-test כבר מתדרדר.';
      else verdict = '🎢 <strong>Overfitting מפלצתי:</strong> העקומה עוברת בול דרך נקודות ה-train (MSE≈0, R²=1!) אבל בין הנקודות היא משתוללת — ראה את ה-MSE על ה-test. שינון ≠ הבנה.';
      out.innerHTML =
        '<span style="color:#2f6db5">MSE על ה-Train: <strong>' + fit.mse_tr.toFixed(3) + '</strong></span> · ' +
        '<span style="color:#d99114">MSE על ה-Test: <strong>' + fit.mse_te.toFixed(3) + '</strong></span><br>' + verdict;
      document.getElementById('w-of-degree-val').textContent = d;
    }
    sD.addEventListener('input', draw);
    draw();
  }

  /* =====================================================================
     ווידג'ט C — R² מתוקנן: מתי הוא שלילי, ומה קורה ב-n−k−1=0
  ===================================================================== */
  function initAdjR2() {
    var el = document.getElementById('w-adj-plot');
    if (!el) return;
    var out = document.getElementById('w-adj-readout');
    var sR = document.getElementById('w-adj-r2');
    var sN = document.getElementById('w-adj-n');
    var sK = document.getElementById('w-adj-k');
    var YMIN = -10;

    function adj(r2, n, k) { return 1 - (1 - r2) * (n - 1) / (n - k - 1); }

    function draw() {
      var r2 = parseFloat(sR.value), n = parseInt(sN.value, 10), k = parseInt(sK.value, 10);
      var df = n - k - 1;
      /* עקומת R²adj כפונקציה של k (באותו R² ו-n) */
      var xs = [], ys = [], kk, kmax = Math.min(40, n - 2);
      for (kk = 1; kk <= kmax; kk++) { xs.push(kk); ys.push(Math.max(YMIN, adj(r2, n, kk))); }
      var traces = [
        { x: [0, 41], y: [0, 0], mode: 'lines', line: { color: '#9aa3b8', width: 1.5, dash: 'dot' }, hoverinfo: 'skip', showlegend: false },
        { x: xs, y: ys, mode: 'lines', line: { color: '#7c3aed', width: 3 }, hoverinfo: 'skip', name: 'R²adj לפי k' }
      ];
      if (n - 1 <= 41) {
        traces.push({ x: [n - 1, n - 1], y: [YMIN, 1.1], mode: 'lines', line: { color: '#e05252', width: 2, dash: 'dash' }, hoverinfo: 'skip', name: 'k = n−1: חלוקה באפס' });
      }
      if (df > 0 && k <= 40) {
        traces.push({ x: [k], y: [Math.max(YMIN, adj(r2, n, k))], mode: 'markers', marker: { size: 13, color: adj(r2, n, k) < 0 ? '#e05252' : '#1fa971', line: { width: 2, color: '#fff' } }, hoverinfo: 'skip', name: 'המודל שלך' });
      }
      Plotly.react(el, traces, Object.assign({}, BASE_LAYOUT, {
        showlegend: true, legend: { orientation: 'h', y: 1.14 },
        xaxis: { title: 'מספר משתנים מסבירים k', range: [0, 41], fixedrange: true },
        yaxis: { title: 'R²adj', range: [YMIN - 0.5, 1.15], fixedrange: true }
      }), CFG);

      var html;
      if (df > 0) {
        var a = adj(r2, n, k), pen = (n - 1) / df;
        var eq = '<span dir="ltr">1 − (1−' + r2 + ')·(' + (n - 1) + '/' + df + ') = ' + fmt(a, 3) + '</span>';
        var verdict;
        if (a >= 0.7) verdict = '✅ מודל במצב טוב — הקנס קטן ביחס להסבר.';
        else if (a >= 0) verdict = '🟡 הקנס מכרסם: המדד נמוך משמעותית מ-R²=' + r2 + '.';
        else verdict = '🔴 <strong>R²adj שלילי!</strong> המשמעות: ביחס לכמות הפרמטרים ששרפת, המודל שלך גרוע יותר מ"מודל הממוצע" הטיפש. פורמלית — מקדם הקנס <span dir="ltr">(n−1)/(n−k−1) = ' + fmt(pen, 1) + '</span> ניפח את (1−R²) מעבר ל-1.';
        html = 'R²adj = ' + eq + ' · דרגות חופש לשארית: n−k−1 = <strong>' + df + '</strong> · מקדם הקנס: <strong>' + fmt(pen, 2) + '</strong><br>' + verdict;
      } else if (df === 0) {
        html = '💥 <strong>חלוקה באפס! n−k−1 = 0.</strong> מה קורה כאן בעצם: יש בדיוק פרמטר אחד לכל "חתיכת מידע" (k משתנים + חותך = n תצפיות) — המודל <strong>רווי</strong>: הוא עובר בול דרך כל הנקודות (זוכר? דרך n נקודות עובר פולינום מדרגה n−1). לא נשארה אף דרגת חופש לאמוד את השגיאה, ולכן למושג "אחוז שונות מוסברת מתוקנן" אין בכלל הגדרה — התוכנה תחזיר NaN/אינסוף. זה האח הגדול של סיפור ה-n−1 מיחידות 1–2: כל פרמטר "אוכל" דרגת חופש, וכאן נגמר האוכל.';
      } else {
        html = '🚫 <strong>n−k−1 שלילי: יותר פרמטרים מתצפיות!</strong> אי אפשר בכלל לאמוד מודל כזה באופן יחיד (אינסוף פתרונות שעוברים דרך כל הנקודות — כמו במולטיקוליניאריות מושלמת מיחידה 5). הנוסחה תחזיר מספר, אבל הוא חסר משמעות לחלוטין — הסימן של המכנה התהפך. בעולם האמיתי: עוד לפני שמגיעים לכאן, עצור והקטן את המודל.';
      }
      out.innerHTML = html;
      document.getElementById('w-adj-r2-val').textContent = r2;
      document.getElementById('w-adj-n-val').textContent = n;
      document.getElementById('w-adj-k-val').textContent = k;
    }
    [sR, sN, sK].forEach(function (s) { s.addEventListener('input', draw); });
    document.getElementById('w-adj-neg').addEventListener('click', function () {
      sR.value = 0.1; sN.value = 20; sK.value = 15; draw();
    });
    document.getElementById('w-adj-zero').addEventListener('click', function () {
      sR.value = 0.85; sN.value = 15; sK.value = 14; draw();
    });
    draw();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Plotly === 'undefined') {
      document.querySelectorAll('.widget').forEach(function (w) {
        w.insertAdjacentHTML('afterbegin', '<p style="color:var(--bad)">⚠️ לטעינת הווידג\'ט האינטראקטיבי צריך חיבור לאינטרנט (Plotly)</p>');
      });
      return;
    }
    initInteraction();
    initOverfit();
    initAdjR2();
  });
})();
