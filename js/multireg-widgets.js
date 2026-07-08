/* ===== ווידג'טים אינטראקטיביים ליחידה 5 — רגרסיה מרובה =====
   דורש Plotly (gl3d bundle) ו-window.FACTORY_DATA (הנתונים האמיתיים מהשיעור). */
(function () {
  'use strict';

  /* המקדמים המדויקים מהשיעור (אומתו מול הנתונים ב-numpy):
     מודל בסיסי:  accidents = 348.0794 − 9.5080·guidance − 1.8757·investment   (R²=0.858)
     מודל עם דמה: accidents = 360.5409 − 10.0151·g − 1.9784·i − 11.610·Ariel − 21.6935·Haifa  (R²=0.993) */
  var BASIC = { b0: 348.0794, b1: -9.5080, b2: -1.8757, r2: 0.858 };
  var DUMMY = { b0: 360.5409, b1: -10.0151, b2: -1.9784, dA: -11.610, dH: -21.6935, r2: 0.993 };
  var COLORS = ['#e05252', '#4f6df5', '#1fa971']; /* Ariel, Haifa, Jerusalem */
  var HEB = ['אריאל', 'חיפה', 'ירושלים'];

  function planeTrace(intercept, b1, b2, color, name) {
    /* מישור לינארי: מספיק רשת 2x2 — פינות הטווח */
    var xs = [0, 4], ys = [0, 30];
    var z = ys.map(function (y) {
      return xs.map(function (x) { return intercept + b1 * x + b2 * y; });
    });
    return {
      type: 'surface', x: xs, y: ys, z: z,
      colorscale: [[0, color], [1, color]], showscale: false,
      opacity: 0.35, hoverinfo: 'skip', name: name
    };
  }

  function initThreeD() {
    var el = document.getElementById('w-3d-plot');
    if (!el || typeof Plotly === 'undefined' || !window.FACTORY_DATA) return;
    var D = window.FACTORY_DATA;
    var out = document.getElementById('w-3d-readout');

    function currentModel() {
      var r = document.querySelector('input[name="w-3d-model"]:checked');
      return r ? r.value : 'points';
    }
    function draw() {
      var mode = currentModel();
      var traces = [];
      /* נקודות לפי מפעל */
      for (var f = 0; f < 3; f++) {
        var xs = [], ys = [], zs = [];
        for (var k = 0; k < D.g.length; k++) if (D.f[k] === f) { xs.push(D.g[k]); ys.push(D.i[k]); zs.push(D.a[k]); }
        traces.push({
          type: 'scatter3d', mode: 'markers', x: xs, y: ys, z: zs,
          marker: { size: 3.5, color: COLORS[f] }, name: HEB[f],
          hovertemplate: HEB[f] + '<br>הדרכה %{x} · השקעה %{y}<br>תאונות %{z}<extra></extra>'
        });
      }
      if (mode === 'basic') {
        traces.push(planeTrace(BASIC.b0, BASIC.b1, BASIC.b2, '#5b6478', 'המישור'));
      } else if (mode === 'dummy') {
        traces.push(planeTrace(DUMMY.b0 + DUMMY.dA, DUMMY.b1, DUMMY.b2, COLORS[0], 'אריאל'));
        traces.push(planeTrace(DUMMY.b0 + DUMMY.dH, DUMMY.b1, DUMMY.b2, COLORS[1], 'חיפה'));
        traces.push(planeTrace(DUMMY.b0, DUMMY.b1, DUMMY.b2, COLORS[2], 'ירושלים'));
      }
      Plotly.react(el, traces, {
        margin: { l: 0, r: 0, t: 10, b: 0 },
        font: { family: 'Heebo, sans-serif', size: 11 },
        showlegend: true,
        legend: { orientation: 'h', y: 1.02 },
        scene: {
          xaxis: { title: 'שעות הדרכה' },
          yaxis: { title: 'השקעה (אלפי $)' },
          zaxis: { title: 'תאונות' },
          camera: { eye: { x: 1.6, y: 1.6, z: 0.9 } }
        }
      }, { displayModeBar: false, responsive: true });

      if (mode === 'points') out.innerHTML = 'הנתונים בלבד — 125 תצפיות משלושה מפעלים. סובב עם האצבע/עכבר ושים לב: התאונות יורדות גם לאורך ציר ההדרכה וגם לאורך ציר ההשקעה, וגם — כל מפעל "מרחף" בגובה קצת אחר.';
      else if (mode === 'basic') out.innerHTML = 'המודל הבסיסי: מישור אחד לכולם — <code>348.08 − 9.51·הדרכה − 1.88·השקעה</code>, R²=<strong>0.858</strong>. סובב וראה: הנקודות האדומות (אריאל) והכחולות (חיפה) שוכבות שיטתית מתחת/מעל למישור — יש מידע שהמודל מפספס.';
      else out.innerHTML = 'המודל עם משתני דמה: <strong>שלושה מישורים מקבילים</strong> — אותם שיפועים, חותך שונה לכל מפעל (ירושלים 360.5, אריאל ‎−11.6‎ מתחתיה, חיפה ‎−21.7‎ מתחתיה). R² קפץ ל-<strong>0.993</strong>! זה בדיוק מה שמשתנה דמה עושה: מזיז את הגובה, לא את השיפוע.';
    }
    document.querySelectorAll('input[name="w-3d-model"]').forEach(function (r) { r.addEventListener('change', draw); });
    draw();
  }

  /* ===== ווידג'ט משתני דמה — קווים מקבילים (שאלה 1 במבחן) ===== */
  function initDummy() {
    var el = document.getElementById('w-dm-plot');
    if (!el || typeof Plotly === 'undefined') return;
    var out = document.getElementById('w-dm-readout');
    var s2 = document.getElementById('w-dm-d2');
    var s3 = document.getElementById('w-dm-d3');
    var B0 = 30.114, B1 = 2.3; /* קטגוריית הבסיס — כמו בשאלה 1 במבחן */

    function line(b0, color, name, dashed) {
      return { x: [0, 10], y: [b0, b0 + B1 * 10], mode: 'lines',
        line: { color: color, width: 3, dash: dashed ? 'dash' : 'solid' }, name: name, hoverinfo: 'skip' };
    }
    function draw() {
      var d2 = parseFloat(s2.value), d3 = parseFloat(s3.value);
      var traces = [
        line(B0, '#e05252', 'קטגוריה 1 (בסיס)'),
        line(B0 + d2, '#4f6df5', 'קטגוריה 2', true),
        line(B0 + d3, '#1fa971', 'קטגוריה 3', true),
        { x: [0, 0, 0], y: [B0, B0 + d2, B0 + d3], mode: 'markers+text',
          marker: { size: 10, color: ['#e05252', '#4f6df5', '#1fa971'] },
          text: [B0.toFixed(2), (B0 + d2).toFixed(2), (B0 + d3).toFixed(2)],
          textposition: 'middle right', textfont: { size: 12 }, showlegend: false, hoverinfo: 'skip' }
      ];
      Plotly.react(el, traces, {
        margin: { l: 45, r: 12, t: 10, b: 40 },
        font: { family: 'Heebo, sans-serif', size: 12 },
        legend: { orientation: 'h', y: 1.1 },
        dragmode: false, plot_bgcolor: '#fbfcff',
        xaxis: { title: 'X', range: [-0.6, 10.4], fixedrange: true },
        yaxis: { title: 'Y', fixedrange: true },
      }, { displayModeBar: false, responsive: true });
      out.innerHTML =
        'המודל: ‎ y = ' + B0.toFixed(2) + ' + ' + B1 + '·x + d₂·D₂ + d₃·D₃ ‎<br>' +
        'חיתוכים עם ציר Y (כש-X=0): בסיס <strong>' + B0.toFixed(2) + '</strong> · קטגוריה 2: ' + B0.toFixed(2) + '+(' + d2.toFixed(2) + ')=<strong>' + (B0 + d2).toFixed(2) + '</strong> · קטגוריה 3: <strong>' + (B0 + d3).toFixed(2) + '</strong><br>' +
        'שים לב: שלושת הקווים <strong>מקבילים</strong> — הדמה מזיז רק את הגובה, אף פעם לא את השיפוע (בלי אינטראקציה — יחידה 6!).';
      document.getElementById('w-dm-d2-val').textContent = d2.toFixed(2);
      document.getElementById('w-dm-d3-val').textContent = d3.toFixed(2);
    }
    s2.addEventListener('input', draw);
    s3.addEventListener('input', draw);
    document.getElementById('w-dm-exam').addEventListener('click', function () {
      s2.value = 9.692; s3.value = -5.049; draw();
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
    initThreeD();
    initDummy();
  });
})();
