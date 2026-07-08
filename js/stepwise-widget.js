/* ===== ווידג'ט יחידה 7 — סימולטור Stepwise צעד-אחר-צעד =====
   מבוסס על הדוגמה המודרכת מהמחברת של השיעור: ספי כניסה p<0.05, הסרה p>0.10.
   4 מועמדים, X1 נכנס ראשון ומוסר בהמשך בגלל קורלציה עם X2. DOM בלבד, בלי Plotly. */
(function () {
  'use strict';

  /* כל צעד: תיאור, טבלת p-values של המועמדים/החברים, החלטה, ומצב המודל אחרי */
  var STEPS = [
    {
      phase: 'התחלה',
      model: [],
      table: { title: 'p-value של כל מועמד (אילו היה נכנס לבדו)', rows: [['X1', 0.001, 'min'], ['X2', 0.030, ''], ['X3', 0.210, ''], ['X4', 0.550, '']] },
      decision: 'צעד קדימה (Forward): המועמד עם ה-p הנמוך ביותר הוא X1 (p=0.001), והוא עובר את סף הכניסה 0.05 ⇐ <strong>X1 נכנס</strong>.',
      modelAfter: ['X1']
    },
    {
      phase: 'סבב 1 — בדיקת הסרה',
      model: ['X1'],
      table: { title: 'p-value של החברים במודל', rows: [['X1', 0.001, 'ok']] },
      decision: 'צעד אחורה (Backward): אף חבר לא עובר את סף ההסרה 0.10 ⇐ אף אחד לא יוצא. ממשיכים לסבב הבא.',
      modelAfter: ['X1']
    },
    {
      phase: 'סבב 2 — כניסה',
      model: ['X1'],
      table: { title: 'p-value של המועמדים (בהינתן ש-X1 במודל)', rows: [['X2', 0.020, 'min'], ['X3', 0.180, ''], ['X4', 0.470, '']] },
      decision: 'Forward: המינימום הוא X2 (p=0.020) < 0.05 ⇐ <strong>X2 נכנס</strong>. המודל עכשיו: X1 + X2.',
      modelAfter: ['X1', 'X2']
    },
    {
      phase: 'סבב 2 — בדיקת הסרה 💥',
      model: ['X1', 'X2'],
      table: { title: 'p-value של החברים במודל {X1, X2}', rows: [['X1', 0.130, 'bad'], ['X2', 0.004, 'ok']] },
      decision: 'Backward: פתאום X1 כבר לא מובהק! p=0.130 > סף ההסרה 0.10 ⇐ <strong>X1 מוסר מהמודל</strong>. 💡 מה קרה? X1 ו-X2 מתואמים — הם "מספרים את אותו סיפור", וברגע ש-X2 (המספר הטוב יותר) נכנס, X1 הפסיק לתרום תרומה ייחודית. זו בדיוק הסיבה ש-Stepwise בודק הסרה אחרי כל כניסה.',
      modelAfter: ['X2']
    },
    {
      phase: 'סבב 3 — כניסה',
      model: ['X2'],
      table: { title: 'p-value של המועמדים (בהינתן ש-X2 במודל)', rows: [['X1', 0.130, ''], ['X3', 0.040, 'min'], ['X4', 0.380, '']] },
      decision: 'Forward: המינימום הוא X3 (p=0.040) < 0.05 ⇐ <strong>X3 נכנס</strong>. (שים לב: X1 מוזמן לנסות שוב — אבל p=0.130 לא עובר.)',
      modelAfter: ['X2', 'X3']
    },
    {
      phase: 'סבב 3 — בדיקת הסרה',
      model: ['X2', 'X3'],
      table: { title: 'p-value של החברים במודל {X2, X3}', rows: [['X2', 0.008, 'ok'], ['X3', 0.040, 'ok']] },
      decision: 'Backward: שניהם מתחת לסף ההסרה 0.10 ⇐ אף אחד לא יוצא.',
      modelAfter: ['X2', 'X3']
    },
    {
      phase: 'סבב 4 — עצירה 🛑',
      model: ['X2', 'X3'],
      table: { title: 'p-value של המועמדים שנותרו', rows: [['X1', 0.210, ''], ['X4', 0.520, '']] },
      decision: '<strong>העצירה — הרגע של שאלה 13 במבחן:</strong> אף מועמד לא עובר את סף הכניסה (המינימום 0.210 > 0.05) <strong>וגם</strong> אף חבר לא עובר את סף ההסרה ⇐ אין שינוי אפשרי ⇐ <strong>האלגוריתם עוצר</strong>. המודל הסופי: Y = β₀ + β₂X₂ + β₃X₃. שים לב: X1 שנכנס ראשון בכלל לא במודל הסופי!',
      modelAfter: ['X2', 'X3'],
      final: true
    }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var stage = document.getElementById('w-sw-stage');
    if (!stage) return;
    var log = document.getElementById('w-sw-log');
    var btnNext = document.getElementById('w-sw-next');
    var btnReset = document.getElementById('w-sw-reset');
    var idx = -1;

    function chips(model) {
      if (!model.length) return '<em style="color:var(--muted)">מודל ריק (רק חותך)</em>';
      return model.map(function (v) {
        return '<span style="display:inline-block;background:var(--good-soft);color:var(--good);font-weight:700;border-radius:12px;padding:2px 14px;margin:0 3px">' + v + '</span>';
      }).join(' ');
    }
    function tableHtml(t) {
      var rows = t.rows.map(function (r) {
        var style = r[2] === 'min' ? 'background:var(--accent-soft);font-weight:700' :
                    r[2] === 'bad' ? 'background:var(--bad-soft);font-weight:700' :
                    r[2] === 'ok' ? 'background:var(--good-soft)' : '';
        var note = r[2] === 'min' ? ' ⬅ המינימלי' : (r[2] === 'bad' ? ' ⬅ מעל סף ההסרה!' : '');
        return '<tr style="' + style + '"><td style="direction:ltr;text-align:center">' + r[0] + '</td><td style="direction:ltr;text-align:center">' + r[1].toFixed(3) + note + '</td></tr>';
      }).join('');
      return '<div style="font-size:.88rem;color:var(--muted);margin-bottom:4px">' + t.title + '</div>' +
             '<table class="tbl" style="max-width:420px"><tr><th>משתנה</th><th>p-value</th></tr>' + rows + '</table>';
    }
    function render() {
      if (idx < 0) {
        stage.innerHTML = '<p><strong>ספי ההחלטה:</strong> כניסה — p &lt; 0.05 · הסרה — p &gt; 0.10.<br>המודל מתחיל ריק. לחץ "הצעד הבא" כדי להריץ את האלגוריתם.</p><p>המודל כרגע: ' + chips([]) + '</p>';
        log.innerHTML = '';
        btnNext.disabled = false;
        btnNext.textContent = '▶ הצעד הבא';
        return;
      }
      var s = STEPS[idx];
      stage.innerHTML =
        '<div style="font-weight:800;color:var(--accent);margin-bottom:6px">' + s.phase + '</div>' +
        tableHtml(s.table) +
        '<p style="margin-top:10px">' + s.decision + '</p>' +
        '<p>המודל אחרי הצעד: ' + chips(s.modelAfter) + '</p>';
      var li = document.createElement('div');
      li.style.cssText = 'padding:4px 10px;border-right:3px solid ' + (s.final ? 'var(--bad)' : 'var(--accent)') + ';margin:4px 0;font-size:.88rem;background:#fff;border-radius:6px';
      li.innerHTML = '<strong>' + s.phase + ':</strong> מודל ⇐ ' + (s.modelAfter.length ? s.modelAfter.join(' + ') : 'ריק');
      log.appendChild(li);
      if (s.final) {
        btnNext.disabled = true;
        btnNext.textContent = '🏁 האלגוריתם עצר';
      }
    }
    btnNext.addEventListener('click', function () {
      if (idx < STEPS.length - 1) { idx++; render(); }
    });
    btnReset.addEventListener('click', function () { idx = -1; render(); });
    render();
  });
})();
