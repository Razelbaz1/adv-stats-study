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

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Plotly === 'undefined') {
      document.querySelectorAll('.widget').forEach(function (w) {
        w.insertAdjacentHTML('afterbegin', '<p style="color:var(--bad)">⚠️ לטעינת הווידג\'ט האינטראקטיבי צריך חיבור לאינטרנט (Plotly)</p>');
      });
      return;
    }
    initInteraction();
    initOverfit();
  });
})();
