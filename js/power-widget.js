/* ===== ווידג'ט אינטראקטיבי — טעות סוג I, טעות סוג II ועוצמה (יחידה 3) =====
   שתי התפלגויות הדגימה של הממוצע: תחת H0 ותחת H1, עם אזורי אלפא ובטא.
   מבחן חד-צדדי ימני להמחשה: דוחים כאשר X̄ > ערך קריטי. */
(function () {
  'use strict';

  /* ---- פונקציות נורמליות ---- */
  function erf(x) { /* Abramowitz & Stegun 7.1.26, דיוק ~1.5e-7 */
    var sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sign * y;
  }
  function normCdf(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function normPdf(x, mu, sd) {
    var z = (x - mu) / sd;
    return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
  }
  function normInv(p) { /* Acklam's algorithm */
    var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    var plow = 0.02425, phigh = 1 - plow, q, r;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
             ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p <= phigh) {
      q = p - 0.5; r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
             (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var el = document.getElementById('w-pw-plot');
    if (!el) return;
    if (typeof Plotly === 'undefined') {
      el.insertAdjacentHTML('beforebegin', '<p style="color:var(--bad)">⚠️ לטעינת הווידג\'ט האינטראקטיבי צריך חיבור לאינטרנט (Plotly)</p>');
      return;
    }

    var sN = document.getElementById('w-pw-n');
    var sSig = document.getElementById('w-pw-sigma');
    var sDelta = document.getElementById('w-pw-delta');
    var sAlpha = document.getElementById('w-pw-alpha');
    var out = document.getElementById('w-pw-readout');
    var MU0 = 100;

    function fmt(v, d) { return Number(v).toFixed(d === undefined ? 1 : d); }

    function draw() {
      var n = parseInt(sN.value, 10);
      var sigma = parseFloat(sSig.value);
      var delta = parseFloat(sDelta.value);
      var alpha = parseFloat(sAlpha.value);
      var mu1 = MU0 + delta;
      var se = sigma / Math.sqrt(n);
      var zc = normInv(1 - alpha);
      var xcrit = MU0 + zc * se;
      var beta = normCdf((xcrit - mu1) / se);
      var power = 1 - beta;

      /* טווח הציור */
      var xmin = MU0 - 4 * se, xmax = mu1 + 4 * se;
      var K = 240, xs = [], p0 = [], p1 = [], i, xv;
      for (i = 0; i <= K; i++) {
        xv = xmin + (xmax - xmin) * i / K;
        xs.push(xv);
        p0.push(normPdf(xv, MU0, se));
        p1.push(normPdf(xv, mu1, se));
      }
      /* שטח אלפא: הזנב הימני של H0 מעבר לערך הקריטי */
      var xa = [], ya = [];
      for (i = 0; i <= K; i++) if (xs[i] >= xcrit) { xa.push(xs[i]); ya.push(p0[i]); }
      xa.unshift(xcrit); ya.unshift(normPdf(xcrit, MU0, se));
      /* שטח בטא: החלק של H1 שמשמאל לערך הקריטי (אזור הקבלה) */
      var xb = [], yb = [];
      for (i = 0; i <= K; i++) if (xs[i] <= xcrit) { xb.push(xs[i]); yb.push(p1[i]); }
      xb.push(xcrit); yb.push(normPdf(xcrit, mu1, se));

      var ymax = Math.max.apply(null, p0.concat(p1)) * 1.12;

      Plotly.react(el, [
        { x: xb, y: yb, mode: 'lines', line: { width: 0 }, fill: 'tozeroy', fillcolor: 'rgba(217,145,20,.45)', hoverinfo: 'skip', name: 'β (פספוס)' },
        { x: xa, y: ya, mode: 'lines', line: { width: 0 }, fill: 'tozeroy', fillcolor: 'rgba(224,82,82,.55)', hoverinfo: 'skip', name: 'α (אזעקת שווא)' },
        { x: xs, y: p0, mode: 'lines', line: { color: '#5b6478', width: 2.5 }, hoverinfo: 'skip', name: 'העולם לפי H0' },
        { x: xs, y: p1, mode: 'lines', line: { color: '#1fa971', width: 2.5 }, hoverinfo: 'skip', name: 'העולם לפי H1' },
        { x: [xcrit, xcrit], y: [0, ymax], mode: 'lines', line: { color: '#1d2433', width: 2, dash: 'dash' }, hoverinfo: 'skip', name: 'ערך קריטי' }
      ], {
        margin: { l: 40, r: 12, t: 34, b: 40 },
        font: { family: 'Heebo, sans-serif', size: 12 },
        showlegend: true,
        legend: { orientation: 'h', y: 1.15 },
        dragmode: false,
        plot_bgcolor: '#fbfcff',
        xaxis: { title: 'ממוצע המדגם X̄', fixedrange: true },
        yaxis: { title: 'צפיפות', fixedrange: true, range: [0, ymax] },
        annotations: [
          { x: MU0, y: normPdf(MU0, MU0, se), text: 'H0: μ=' + MU0, showarrow: false, yshift: 14, font: { color: '#5b6478', size: 12 } },
          { x: mu1, y: normPdf(mu1, mu1, se), text: 'H1: μ=' + fmt(mu1, 1), showarrow: false, yshift: 14, font: { color: '#1fa971', size: 12 } }
        ]
      }, { displayModeBar: false, responsive: true });

      var msg;
      if (power >= 0.8) msg = '💪 עוצמה מצוינת (מעל 80% — הרף המקובל במחקר): אם יש אפקט אמיתי, המבחן כמעט בטוח יתפוס אותו.';
      else if (power >= 0.5) msg = '🙂 עוצמה בינונית: יש סיכוי לא מבוטל לפספס אפקט אמיתי.';
      else msg = '😴 עוצמה חלשה: גם אם H1 נכונה, המבחן כנראה יפספס. צריך יותר נתונים / אפקט גדול יותר.';
      out.innerHTML =
        '<span style="color:#e05252">α (טעות סוג I) = <strong>' + fmt(100 * alpha) + '%</strong> — קבעת מראש</span> · ' +
        '<span style="color:#d99114">β (טעות סוג II) = <strong>' + fmt(100 * beta) + '%</strong></span> · ' +
        '<span style="color:#1fa971">עוצמה 1−β = <strong style="font-size:1.2em">' + fmt(100 * power) + '%</strong></span><br>' +
        'טעות התקן של הממוצע: σ/√n = ' + fmt(sigma, 1) + '/√' + n + ' = <strong>' + fmt(se, 2) + '</strong> (רוחב הפעמונים) · ערך קריטי: ' + fmt(xcrit, 2) + '<br>' + msg;

      document.getElementById('w-pw-n-val').textContent = n;
      document.getElementById('w-pw-sigma-val').textContent = fmt(sigma, 1);
      document.getElementById('w-pw-delta-val').textContent = fmt(delta, 1);
      document.getElementById('w-pw-alpha-val').textContent = fmt(100 * alpha, 0) + '%';
    }

    [sN, sSig, sDelta, sAlpha].forEach(function (s) { s.addEventListener('input', draw); });
    draw();
  });
})();
