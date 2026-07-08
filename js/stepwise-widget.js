/* ===== ווידג'ט יחידה 7 — סימולטור בחירת משתנים: Forward / Backward / Stepwise =====
   תרחיש אחיד ל-4 מועמדים (מבוסס על הדוגמה המודרכת מהמחברת): X1 ו-X2 מתואמים
   ("מספרים את אותו סיפור", X2 טוב יותר), X3 מועיל, X4 חסר ערך.
   ספים: כניסה p<0.05, הסרה p>0.10. DOM בלבד, בלי Plotly. */
(function () {
  'use strict';

  var METHODS = {
    forward: {
      label: 'Forward Selection',
      intro: '<strong>Forward:</strong> מתחילים ממודל ריק. בכל סבב בוחנים את כל המועמדים שבחוץ ומכניסים את בעל ה-p הנמוך ביותר — אם הוא מתחת לסף הכניסה 0.05. <strong>אין מנגנון הוצאה.</strong>',
      steps: [
        {
          phase: 'סבב 1 — כניסה',
          table: { title: 'p-value של כל מועמד (בהינתן המודל הריק)', rows: [['X1', 0.001, 'min'], ['X2', 0.030, ''], ['X3', 0.210, ''], ['X4', 0.550, '']] },
          decision: 'המינימלי הוא X1 (p=0.001) &lt; 0.05 ⇐ <strong>X1 נכנס</strong>.',
          modelAfter: ['X1']
        },
        {
          phase: 'סבב 2 — כניסה',
          table: { title: 'p-value של המועמדים שנותרו (בהינתן X1)', rows: [['X2', 0.020, 'min'], ['X3', 0.180, ''], ['X4', 0.470, '']] },
          decision: 'המינימלי הוא X2 (p=0.020) &lt; 0.05 ⇐ <strong>X2 נכנס</strong>. 👀 שים לב: ברגע ש-X2 נכנס, המובהקות של X1 (בהינתן X2) צונחת ל-p≈0.13 — אבל Forward <strong>בכלל לא בודק את זה</strong>. אין לו מבט אחורה.',
          modelAfter: ['X1', 'X2']
        },
        {
          phase: 'סבב 3 — כניסה',
          table: { title: 'p-value של המועמדים שנותרו (בהינתן X1, X2)', rows: [['X3', 0.046, 'min'], ['X4', 0.510, '']] },
          decision: 'המינימלי הוא X3 (p=0.046) &lt; 0.05 ⇐ <strong>X3 נכנס</strong>.',
          modelAfter: ['X1', 'X2', 'X3']
        },
        {
          phase: 'סבב 4 — עצירה 🛑',
          table: { title: 'p-value של המועמד האחרון', rows: [['X4', 0.610, '']] },
          decision: 'אף מועמד לא עובר את סף הכניסה (0.610 &gt; 0.05) ⇐ <strong>עצירה</strong>.<br>המודל הסופי: <strong>X1 + X2 + X3</strong> — כולל את X1, שכבר מזמן איבד את המובהקות שלו (p≈0.14 בהינתן האחרים)! זו בדיוק החולשה של Forward: מי שנכנס — נשאר, גם אם התייתר. את התיקון תראה בלשונית Stepwise.',
          modelAfter: ['X1', 'X2', 'X3'],
          final: true
        }
      ]
    },
    backward: {
      label: 'Backward Elimination',
      intro: '<strong>Backward:</strong> מתחילים מהמודל המלא (כל הארבעה בפנים). בכל סבב מסירים את בעל ה-p <strong>הגבוה</strong> ביותר — אם הוא מעל סף ההסרה 0.10 — ומריצים מחדש. <strong>אין מנגנון הכנסה.</strong>',
      steps: [
        {
          phase: 'סבב 1 — הסרה',
          table: { title: 'p-value של כל החברים במודל המלא {X1, X2, X3, X4}', rows: [['X1', 0.210, ''], ['X2', 0.006, 'ok'], ['X3', 0.055, 'ok'], ['X4', 0.620, 'bad']] },
          decision: 'הגבוה ביותר הוא X4 (p=0.620) &gt; 0.10 ⇐ <strong>X4 מוסר</strong>. מריצים את המודל מחדש — כל המובהקויות יחושבו שוב.',
          modelAfter: ['X1', 'X2', 'X3']
        },
        {
          phase: 'סבב 2 — הסרה',
          table: { title: 'p-value של החברים במודל {X1, X2, X3}', rows: [['X1', 0.130, 'bad'], ['X2', 0.007, 'ok'], ['X3', 0.042, 'ok']] },
          decision: 'הגבוה ביותר הוא X1 (p=0.130) &gt; 0.10 ⇐ <strong>X1 מוסר</strong>. 💡 למה דווקא הוא? X1 מתואם עם X2 — בהינתן ש-X2 במודל, X1 לא תורם תרומה ייחודית.',
          modelAfter: ['X2', 'X3']
        },
        {
          phase: 'סבב 3 — עצירה 🛑',
          table: { title: 'p-value של החברים במודל {X2, X3}', rows: [['X2', 0.008, 'ok'], ['X3', 0.040, 'ok']] },
          decision: 'הגבוה ביותר (0.040) מתחת לסף ההסרה ⇐ כל החברים מובהקים ⇐ <strong>עצירה</strong>.<br>המודל הסופי: <strong>X2 + X3</strong>. שים לב: Backward הגיע כאן לאותה תוצאה כמו Stepwise — אבל בדרך הפוכה לגמרי, וזה ממש לא מובטח תמיד.',
          modelAfter: ['X2', 'X3'],
          final: true
        }
      ]
    },
    stepwise: {
      label: 'Stepwise',
      intro: '<strong>Stepwise:</strong> מתחילים ממודל ריק. אחרי כל כניסה (כמו Forward) בודקים אם מישהו בפנים איבד מובהקות ומסירים אותו (כמו Backward). ספים: כניסה p&lt;0.05, הסרה p&gt;0.10.',
      steps: [
        {
          phase: 'סבב 1 — כניסה',
          table: { title: 'p-value של כל מועמד (בהינתן המודל הריק)', rows: [['X1', 0.001, 'min'], ['X2', 0.030, ''], ['X3', 0.210, ''], ['X4', 0.550, '']] },
          decision: 'המינימלי הוא X1 (p=0.001) &lt; 0.05 ⇐ <strong>X1 נכנס</strong>.',
          modelAfter: ['X1']
        },
        {
          phase: 'סבב 1 — בדיקת הסרה',
          table: { title: 'p-value של החברים במודל {X1}', rows: [['X1', 0.001, 'ok']] },
          decision: 'אף חבר לא מעל סף ההסרה 0.10 ⇐ אף אחד לא יוצא. לסבב הבא.',
          modelAfter: ['X1']
        },
        {
          phase: 'סבב 2 — כניסה',
          table: { title: 'p-value של המועמדים (בהינתן X1)', rows: [['X2', 0.020, 'min'], ['X3', 0.180, ''], ['X4', 0.470, '']] },
          decision: 'המינימלי הוא X2 (p=0.020) &lt; 0.05 ⇐ <strong>X2 נכנס</strong>. המודל: X1 + X2.',
          modelAfter: ['X1', 'X2']
        },
        {
          phase: 'סבב 2 — בדיקת הסרה 💥',
          table: { title: 'p-value של החברים במודל {X1, X2}', rows: [['X1', 0.130, 'bad'], ['X2', 0.004, 'ok']] },
          decision: 'פתאום X1 כבר לא מובהק! p=0.130 &gt; 0.10 ⇐ <strong>X1 מוסר</strong>. 💡 X1 ו-X2 מתואמים — "מספרים את אותו סיפור" — וברגע ש-X2 (המספר הטוב יותר) נכנס, X1 התייתר. בדיוק בגלל הרגע הזה Stepwise בודק הסרה אחרי כל כניסה.',
          modelAfter: ['X2']
        },
        {
          phase: 'סבב 3 — כניסה',
          table: { title: 'p-value של המועמדים (בהינתן X2)', rows: [['X1', 0.130, ''], ['X3', 0.040, 'min'], ['X4', 0.380, '']] },
          decision: 'המינימלי הוא X3 (p=0.040) &lt; 0.05 ⇐ <strong>X3 נכנס</strong>. (שים לב: X1 שהוסר חזר לרשימת המועמדים ונבחן שוב — אבל 0.130 לא עובר.)',
          modelAfter: ['X2', 'X3']
        },
        {
          phase: 'סבב 3 — בדיקת הסרה',
          table: { title: 'p-value של החברים במודל {X2, X3}', rows: [['X2', 0.008, 'ok'], ['X3', 0.040, 'ok']] },
          decision: 'שניהם מתחת לסף ההסרה ⇐ אף אחד לא יוצא.',
          modelAfter: ['X2', 'X3']
        },
        {
          phase: 'סבב 4 — עצירה 🛑',
          table: { title: 'p-value של המועמדים שנותרו', rows: [['X1', 0.210, ''], ['X4', 0.520, '']] },
          decision: '<strong>הרגע של שאלה 13 במבחן:</strong> אף מועמד לא עובר את סף הכניסה (0.210 &gt; 0.05) <strong>וגם</strong> אף חבר לא עובר את סף ההסרה ⇐ אין שינוי אפשרי ⇐ <strong>עצירה</strong>.<br>המודל הסופי: <strong>X2 + X3</strong> (‏Y = β₀ + β₂X₂ + β₃X₃). ‏X1 שנכנס ראשון — בכלל לא בפנים!',
          modelAfter: ['X2', 'X3'],
          final: true
        }
      ]
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    var stage = document.getElementById('w-sw-stage');
    if (!stage) return;
    var log = document.getElementById('w-sw-log');
    var btnNext = document.getElementById('w-sw-next');
    var btnReset = document.getElementById('w-sw-reset');
    var idx = -1;

    function currentMethod() {
      var r = document.querySelector('input[name="w-sw-method"]:checked');
      return METHODS[r ? r.value : 'forward'];
    }
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
             '<table class="tbl" style="max-width:440px"><tr><th>משתנה</th><th>p-value</th></tr>' + rows + '</table>';
    }
    function render() {
      var m = currentMethod();
      if (idx < 0) {
        var startModel = m === METHODS.backward ? ['X1', 'X2', 'X3', 'X4'] : [];
        stage.innerHTML = '<p>' + m.intro + '</p><p>המודל בהתחלה: ' + chips(startModel) + '</p><p style="color:var(--muted);font-size:.9rem">לחץ "הצעד הבא" כדי להריץ.</p>';
        log.innerHTML = '';
        btnNext.disabled = false;
        btnNext.textContent = '▶ הצעד הבא';
        return;
      }
      var s = m.steps[idx];
      stage.innerHTML =
        '<div style="font-weight:800;color:var(--accent);margin-bottom:6px">' + m.label + ' · ' + s.phase + '</div>' +
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
      var m = currentMethod();
      if (idx < m.steps.length - 1) { idx++; render(); }
    });
    btnReset.addEventListener('click', function () { idx = -1; render(); });
    document.querySelectorAll('input[name="w-sw-method"]').forEach(function (r) {
      r.addEventListener('change', function () { idx = -1; render(); });
    });
    render();
  });
})();
