/* ===== ווידג'טים אינטראקטיביים ליחידה 4 — רגרסיה לינארית =====
   דורש Plotly (basic) טעון מראש. כל הנתונים דטרמיניסטיים (seed קבוע). */
(function () {
  'use strict';

  /* ---------- כלי עזר ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussians(n, seed) {
    var rnd = mulberry32(seed), out = [], u, v;
    while (out.length < n) {
      u = Math.max(rnd(), 1e-12); v = rnd();
      out.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
      out.push(Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v));
    }
    return out.slice(0, n);
  }
  function olsFit(x, y) {
    var n = x.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
    mx /= n; my /= n;
    var sxy = 0, sxx = 0;
    for (i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); }
    var b1 = sxy / sxx, b0 = my - b1 * mx;
    var sse = 0, sst = 0, e;
    for (i = 0; i < n; i++) {
      e = y[i] - (b0 + b1 * x[i]); sse += e * e;
      sst += (y[i] - my) * (y[i] - my);
    }
    return { b0: b0, b1: b1, sse: sse, sst: sst, r2: 1 - sse / sst, ymean: my };
  }
  function sseFor(x, y, b0, b1) {
    var s = 0, e, i;
    for (i = 0; i < x.length; i++) { e = y[i] - (b0 + b1 * x[i]); s += e * e; }
    return s;
  }
  /* קטעי סטייה אנכיים כטרייס אחד (מופרד ב-null) */
  function segTrace(x, yFrom, yTo, color) {
    var xs = [], ys = [], i;
    for (i = 0; i < x.length; i++) {
      xs.push(x[i], x[i], null);
      ys.push(yFrom[i], yTo[i], null);
    }
    return { x: xs, y: ys, mode: 'lines', line: { color: color, width: 1.6 }, hoverinfo: 'skip', showlegend: false };
  }
  var BASE_LAYOUT = {
    margin: { l: 45, r: 12, t: 28, b: 40 },
    font: { family: 'Heebo, sans-serif', size: 12 },
    showlegend: false,
    dragmode: false,
    plot_bgcolor: '#fbfcff'
  };
  var CFG = { displayModeBar: false, responsive: true };
  function fmt(v, d) { return Number(v).toFixed(d === undefined ? 2 : d); }

  /* =====================================================================
     ווידג'ט A — מגרש המשחקים של OLS (דוגמת המשכורות)
  ===================================================================== */
  function initOLS() {
    var el = document.getElementById('w-ols-plot');
    if (!el) return;
    var X = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var E = [0.6, -0.5, -0.8, 0.4, 0.3, 0.3, 0.4, -0.8, -0.5, 0.6];
    var Y = X.map(function (x, i) { return 8.0825 + 2.3178 * x + E[i]; });
    var fit = olsFit(X, Y); /* בדיוק b0=8.0825, b1=2.3178 */

    var s0 = document.getElementById('w-ols-b0');
    var s1 = document.getElementById('w-ols-b1');
    var out = document.getElementById('w-ols-readout');

    function draw() {
      var b0 = parseFloat(s0.value), b1 = parseFloat(s1.value);
      var yLine = X.map(function (x) { return b0 + b1 * x; });
      var sse = sseFor(X, Y, b0, b1);
      var traces = [
        segTrace(X, Y, yLine, '#7c3aed'),
        { x: [0.5, 10.5], y: [b0 + 0.5 * b1, b0 + 10.5 * b1], mode: 'lines', line: { color: '#4f6df5', width: 3 }, hoverinfo: 'skip' },
        { x: X, y: Y, mode: 'markers', marker: { color: '#e05252', size: 9 }, hovertemplate: 'שנות לימוד %{x}<br>משכורת %{y:.1f}<extra></extra>' }
      ];
      Plotly.react(el, traces, Object.assign({}, BASE_LAYOUT, {
        xaxis: { title: 'שנות לימוד (X)', range: [0.4, 10.6], fixedrange: true },
        yaxis: { title: 'משכורת (Y)', range: [4, 36], fixedrange: true },
        title: { text: 'ŷ = ' + fmt(b0) + ' + ' + fmt(b1) + '·x', font: { size: 14 } }
      }), CFG);
      var ratio = sse / fit.sse;
      var msg;
      if (ratio < 1.02) msg = '🏆 מושלם! מצאת (בערך) את קו ה-OLS';
      else if (ratio < 1.6) msg = '🔥 חם מאוד — כמעט שם';
      else if (ratio < 4) msg = '🙂 קרוב, אפשר יותר טוב';
      else msg = '❄️ רחוק — נסה לשנות את השיפוע והחותך';
      out.innerHTML = 'SSE שלך: <strong>' + fmt(sse) + '</strong> · המינימום האפשרי (OLS): <strong>' + fmt(fit.sse) + '</strong><br>' + msg;
      document.getElementById('w-ols-b0-val').textContent = fmt(b0);
      document.getElementById('w-ols-b1-val').textContent = fmt(b1);
    }
    s0.addEventListener('input', draw);
    s1.addEventListener('input', draw);
    document.getElementById('w-ols-solve').addEventListener('click', function () {
      s0.value = fit.b0; s1.value = fit.b1; draw();
    });
    draw();
  }

  /* =====================================================================
     ווידג'ט B — ממחיש R²: SST מול SSR ורעש
  ===================================================================== */
  function initR2() {
    var el = document.getElementById('w-r2-plot');
    if (!el) return;
    var n = 40, X = [], Z = gaussians(n, 4242), i;
    for (i = 0; i < n; i++) X.push(i * 10 / (n - 1));
    var sN = document.getElementById('w-r2-noise');
    var out = document.getElementById('w-r2-readout');

    function currentView() {
      var r = document.querySelector('input[name="w-r2-view"]:checked');
      return r ? r.value : 'both';
    }
    function draw() {
      var sig = parseFloat(sN.value);
      var Y = X.map(function (x, i) { return 5 + 2 * x + sig * Z[i]; });
      var fit = olsFit(X, Y);
      var yHat = X.map(function (x) { return fit.b0 + fit.b1 * x; });
      var yBar = X.map(function () { return fit.ymean; });
      var view = currentView();
      var traces = [];
      if (view === 'sst' || view === 'both') traces.push(segTrace(X, Y, yBar, '#d99114'));
      if (view === 'ssr' || view === 'both') traces.push(segTrace(X, Y, yHat, '#7c3aed'));
      traces.push({ x: [0, 10], y: [fit.ymean, fit.ymean], mode: 'lines', line: { color: '#9aa3b8', width: 2, dash: 'dash' }, hoverinfo: 'skip' });
      traces.push({ x: [0, 10], y: [fit.b0, fit.b0 + 10 * fit.b1], mode: 'lines', line: { color: '#4f6df5', width: 3 }, hoverinfo: 'skip' });
      traces.push({ x: X, y: Y, mode: 'markers', marker: { color: '#e05252', size: 7 }, hoverinfo: 'skip' });
      Plotly.react(el, traces, Object.assign({}, BASE_LAYOUT, {
        xaxis: { title: 'X', fixedrange: true },
        yaxis: { title: 'Y', fixedrange: true },
        title: { text: 'קו מקווקו אפור = הממוצע (המודל הנאיבי) · קו כחול = הרגרסיה', font: { size: 13 } }
      }), CFG);
      var ssr = fit.sse, sst = fit.sst, r2 = fit.r2;
      out.innerHTML =
        '<span style="color:#d99114">SST (סטיות מהממוצע): <strong>' + fmt(sst, 0) + '</strong></span> · ' +
        '<span style="color:#7c3aed">SSR (שגיאות הרגרסיה): <strong>' + fmt(ssr, 0) + '</strong></span><br>' +
        'R² = (SST − SSR) / SST = <strong style="font-size:1.25em; color:#1fa971">' + fmt(r2, 3) + '</strong>' +
        ' — המודל מסביר ' + fmt(100 * r2, 1) + '% מהשונות של Y';
      document.getElementById('w-r2-noise-val').textContent = fmt(sig, 1);
    }
    sN.addEventListener('input', draw);
    document.querySelectorAll('input[name="w-r2-view"]').forEach(function (r) { r.addEventListener('change', draw); });
    draw();
  }

  /* =====================================================================
     ווידג'ט C — טרנספורמציות (דוגמת הנתרן הפחמתי)
  ===================================================================== */
  function initTransform() {
    var elL = document.getElementById('w-tr-work');
    if (!elL) return;
    var elR = document.getElementById('w-tr-orig');
    var n = 60, X = [], Z = gaussians(n, 777), i;
    for (i = 0; i < n; i++) X.push(i / (n - 1));
    /* כמו בשיעור: זיהום ≈ e^{0.01 + 3.51x} עם רעש כפלי */
    var Y = X.map(function (x, i) { return Math.exp(0.01 + 3.51 * x + 0.15 * Z[i]); });
    var out = document.getElementById('w-tr-readout');

    var TR = {
      none: { fwd: function (y) { return y; }, inv: function (v) { return v; }, label: 'Y (ללא טרנספורמציה)' },
      log:  { fwd: function (y) { return Math.log(y); }, inv: function (v) { return Math.exp(v); }, label: 'Ln(Y)' },
      sqrt: { fwd: function (y) { return Math.sqrt(y); }, inv: function (v) { return v * v; }, label: '√Y' }
    };
    function currentTr() {
      var r = document.querySelector('input[name="w-tr-choice"]:checked');
      return r ? r.value : 'none';
    }
    function draw() {
      var key = currentTr(), tr = TR[key];
      var Yt = Y.map(tr.fwd);
      var fit = olsFit(X, Yt);
      var xs = [], line = [], curve = [];
      for (i = 0; i <= 100; i++) {
        var xv = i / 100;
        xs.push(xv);
        var v = fit.b0 + fit.b1 * xv;
        line.push(v);
        curve.push(tr.inv(v));
      }
      /* פאנל שמאל: העולם שבו המודל "חי" */
      Plotly.react(elL, [
        { x: xs, y: line, mode: 'lines', line: { color: '#e05252', width: 3 }, hoverinfo: 'skip' },
        { x: X, y: Yt, mode: 'markers', marker: { color: '#2f6db5', size: 6 }, hoverinfo: 'skip' }
      ], Object.assign({}, BASE_LAYOUT, {
        xaxis: { title: 'נתרן פחמתי', fixedrange: true },
        yaxis: { title: tr.label, fixedrange: true },
        title: { text: 'הסקלה שעליה מתאימים את הקו: ' + tr.label, font: { size: 13 } }
      }), CFG);
      /* פאנל ימין: חזרה לעולם האמיתי */
      Plotly.react(elR, [
        { x: xs, y: curve, mode: 'lines', line: { color: '#e05252', width: 3 }, hoverinfo: 'skip' },
        { x: X, y: Y, mode: 'markers', marker: { color: '#2f6db5', size: 6 }, hoverinfo: 'skip' }
      ], Object.assign({}, BASE_LAYOUT, {
        xaxis: { title: 'נתרן פחמתי', fixedrange: true },
        yaxis: { title: 'זיהום אוויר (סקלה מקורית)', fixedrange: true },
        title: { text: 'המודל מתורגם חזרה לסקלה המקורית', font: { size: 13 } }
      }), CFG);
      var verdict = key === 'log' ? ' 🏆 — כמעט קו ישר מושלם!' : (key === 'sqrt' ? ' — יותר טוב, אבל עדיין עקום בקצוות' : ' — הקו הישר מפספס שיטתית');
      out.innerHTML = 'R² על הסקלה של ' + tr.label + ': <strong style="font-size:1.2em; color:' + (fit.r2 > 0.98 ? '#1fa971' : '#d99114') + '">' + fmt(fit.r2, 3) + '</strong>' + verdict;
    }
    document.querySelectorAll('input[name="w-tr-choice"]').forEach(function (r) { r.addEventListener('change', draw); });
    draw();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Plotly === 'undefined') {
      document.querySelectorAll('.widget').forEach(function (w) {
        w.insertAdjacentHTML('afterbegin', '<p style="color:var(--bad)">⚠️ לטעינת הווידג\'ט האינטראקטיבי צריך חיבור לאינטרנט (Plotly)</p>');
      });
      return;
    }
    initOLS();
    initR2();
    initTransform();
  });
})();
