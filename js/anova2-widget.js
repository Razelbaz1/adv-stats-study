/* ===== ווידג'טים ליחידה 9 — השוואות מרובות והפרות הנחות =====
   ווידג'ט 1 (w-fw-*): מעבדת FWER — כמה מהר "דולפת" טעות סוג I כשמרבים
     בהשוואות: גרף FWER = 1-(1-α)^m כפונקציה של מספר ההשוואות, עם סמן
     על המצב הנוכחי (נגזר ממספר הקבוצות) והשוואה לתיקון בונפרוני.
   ווידג'ט 2 (w-dn-*): נווט ההחלטה — מסלול השאלות של דף העזר:
     כמה קבוצות? ← נורמליות? ← שוויון שונויות? ← השוואות מתוכננות?
     ובסוף: המבחן הגלובלי, ה-Post-Hoc והאם מוסיפים בונפרוני. */
(function () {
  'use strict';

  /* ---------- ווידג'ט 1: מעבדת FWER ---------- */
  function initFwer() {
    var stage = document.getElementById('w-fw-stage');
    if (!stage) return;

    var elK = document.getElementById('w-fw-k');
    var elKV = document.getElementById('w-fw-k-val');
    var elA = document.getElementById('w-fw-alpha');
    var elAV = document.getElementById('w-fw-alpha-val');
    var readout = document.getElementById('w-fw-readout');

    var M_MAX = 45; /* C(10,2) */

    function fwer(alpha, m) { return 1 - Math.pow(1 - alpha, m); }

    function render() {
      var k = parseInt(elK.value, 10);
      var alpha = parseFloat(elA.value);
      elKV.textContent = k;
      elAV.textContent = alpha.toFixed(3);
      var m = k * (k - 1) / 2;
      var cur = fwer(alpha, m);
      var bonfAlpha = alpha / m;
      var bonfFwer = fwer(bonfAlpha, m);

      /* גרף: x = מספר השוואות 1..45, y = FWER 0..1 */
      var W = 700, H = 300, L = 52, R = 16, T = 18, B = 40;
      function px(mm) { return L + (mm - 1) * (W - L - R) / (M_MAX - 1); }
      function py(p) { return T + (1 - p) * (H - T - B); }

      var s = '';
      /* רשת אופקית */
      for (var t = 0; t <= 100; t += 20) {
        s += '<line x1="' + L + '" y1="' + py(t / 100) + '" x2="' + (W - R) + '" y2="' + py(t / 100) +
             '" stroke="#edf0f7"/>' +
             '<text x="' + (L - 8) + '" y="' + (py(t / 100) + 4) + '" font-size="11" fill="#8a92a6" text-anchor="end">' + t + '%</text>';
      }
      /* ציר x */
      for (var xm = 5; xm <= M_MAX; xm += 5) {
        s += '<text x="' + px(xm) + '" y="' + (H - B + 18) + '" font-size="11" fill="#8a92a6" text-anchor="middle">' + xm + '</text>';
      }
      s += '<text x="' + (L + (W - L - R) / 2) + '" y="' + (H - 4) + '" font-size="12" fill="#5b6478" text-anchor="middle">מספר ההשוואות m</text>';
      /* קו היעד 5% */
      s += '<line x1="' + L + '" y1="' + py(0.05) + '" x2="' + (W - R) + '" y2="' + py(0.05) +
           '" stroke="#1fa971" stroke-width="1.5" stroke-dasharray="6,4"/>' +
           '<text x="' + (W - R - 4) + '" y="' + (py(0.05) - 6) + '" font-size="11" fill="#1fa971" text-anchor="end">היעד: 5%</text>';
      /* עקומת FWER ללא תיקון */
      var path = '';
      for (var mm = 1; mm <= M_MAX; mm++) {
        path += (mm === 1 ? 'M' : 'L') + px(mm).toFixed(1) + ',' + py(fwer(alpha, mm)).toFixed(1);
      }
      s += '<path d="' + path + '" fill="none" stroke="#e05252" stroke-width="2.5"/>';
      /* עקומת בונפרוני: FWER עם אלפא/m בכל נקודה */
      var path2 = '';
      for (mm = 1; mm <= M_MAX; mm++) {
        path2 += (mm === 1 ? 'M' : 'L') + px(mm).toFixed(1) + ',' + py(fwer(alpha / mm, mm)).toFixed(1);
      }
      s += '<path d="' + path2 + '" fill="none" stroke="#4f6df5" stroke-width="2.5" stroke-dasharray="2,3"/>';
      /* סמן המצב הנוכחי */
      s += '<line x1="' + px(m) + '" y1="' + py(0) + '" x2="' + px(m) + '" y2="' + py(cur) +
           '" stroke="#d99114" stroke-width="1.5" stroke-dasharray="4,3"/>' +
           '<circle cx="' + px(m) + '" cy="' + py(cur) + '" r="6" fill="#e05252"/>' +
           '<circle cx="' + px(m) + '" cy="' + py(fwer(alpha / m, m)) + '" r="5" fill="#4f6df5"/>';
      /* מקרא */
      s += '<rect x="' + (L + 8) + '" y="' + (T + 2) + '" width="230" height="40" rx="8" fill="#ffffffcc"/>' +
           '<line x1="' + (L + 16) + '" y1="' + (T + 14) + '" x2="' + (L + 44) + '" y2="' + (T + 14) + '" stroke="#e05252" stroke-width="2.5"/>' +
           '<text x="' + (L + 50) + '" y="' + (T + 18) + '" font-size="11.5" fill="#1d2433">בלי תיקון: כל מבחן ברמת α</text>' +
           '<line x1="' + (L + 16) + '" y1="' + (T + 32) + '" x2="' + (L + 44) + '" y2="' + (T + 32) + '" stroke="#4f6df5" stroke-width="2.5" stroke-dasharray="2,3"/>' +
           '<text x="' + (L + 50) + '" y="' + (T + 36) + '" font-size="11.5" fill="#1d2433">בונפרוני: כל מבחן ברמת α/m</text>';

      stage.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;display:block;direction:ltr">' + s + '</svg>';

      readout.innerHTML =
        '<strong>' + k + ' קבוצות</strong> ⇐ ' +
        '\\(\\binom{' + k + '}{2}\\) = <strong>' + m + '</strong> השוואות זוגיות.<br>' +
        'בלי תיקון (כל מבחן ברמת ' + alpha.toFixed(3) + '): הסיכוי ל<strong>לפחות</strong> מובהקות-שווא אחת: ' +
        '<span dir="ltr" style="unicode-bidi:isolate">1 − (1 − ' + alpha.toFixed(3) + ')<sup>' + m + '</sup> = <strong style="color:#e05252">' + (cur * 100).toFixed(1) + '%</strong></span>.<br>' +
        'עם תיקון בונפרוני (כל מבחן ברמת <span dir="ltr" style="unicode-bidi:isolate">' + alpha.toFixed(3) + '/' + m + ' = ' + bonfAlpha.toFixed(4) + '</span>): FWER = <strong style="color:#4f6df5">' +
        (bonfFwer * 100).toFixed(1) + '%</strong> — חוזרים אל מתחת ליעד.';
      /* רינדור מחדש של נוסחאות KaTeX בתוך ה-readout */
      if (window.renderMathInElement) {
        window.renderMathInElement(readout, { delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ] });
      }
    }

    elK.addEventListener('input', render);
    elA.addEventListener('input', render);
    render();
  }

  /* ---------- ווידג'ט 2: נווט ההחלטה ---------- */
  function initNavigator() {
    var stage = document.getElementById('w-dn-stage');
    if (!stage) return;

    var log = document.getElementById('w-dn-log');
    var btnReset = document.getElementById('w-dn-reset');

    /* מכונת מצבים: כל שלב = שאלה עם שתי תשובות, או תוצאה */
    var FLOW = {
      start: {
        q: 'כמה קבוצות אתה משווה?',
        opts: [
          { label: 'שתיים בלבד', log: '2 קבוצות', next: 'res_ttest' },
          { label: '3 או יותר', log: '3+ קבוצות', next: 'levene' }
        ]
      },
      /* Levene קודם! רק אם השונויות שוות מותר לאחד את כל השאריות
         למבחן נורמליות אחד (האזהרה של 9.4) */
      levene: {
        q: 'קודם כל — מבחן Levene לשוויון שונויות. מה יצא?',
        opts: [
          { label: 'p גדול מ-0.05 — אין עדות להפרה', log: 'שוויון שונויות: אין עדות להפרה ⇐ מותר לאחד שאריות', next: 'normal_pooled' },
          { label: 'p קטן מ-0.05 — השונויות שונות', log: 'שוויון שונויות: מופר ✗', next: 'normal_pergroup' }
        ]
      },
      normal_pooled: {
        q: 'שוויון השונויות שרד — ולכן מותר לבדוק נורמליות על <strong>כל השאריות יחד</strong> (זוכר את 9.4? המרכוז מאפשר איחוד). Shapiro-Wilk על השאריות + מבט ב-QQ. מה יצא?',
        opts: [
          { label: 'p גדול מ-0.05 והנקודות על הקו — נראה נורמלי', log: 'נורמליות (שאריות מאוחדות): אין עדות להפרה', next: 'planned' },
          { label: 'p קטן מ-0.05 וסטייה ברורה — הפרה חמורה', log: 'נורמליות: מופרת ✗', next: 'res_kw' }
        ]
      },
      normal_pergroup: {
        q: 'Levene נכשל — אז <strong>אסור</strong> לאחד את השאריות למבחן אחד (אין להן אותה התפלגות). בודקים נורמליות לכל קבוצה <strong>בנפרד</strong>. מה יצא?',
        opts: [
          { label: 'כל הקבוצות נראות נורמליות', log: 'נורמליות פר-קבוצה: תקינה', next: 'res_welch' },
          { label: 'יש קבוצות שממש לא נורמליות', log: 'נורמליות: מופרת גם היא ✗', next: 'res_kw' }
        ]
      },
      planned: {
        q: 'האם יש לך השוואות ספציפיות שתכננת <strong>מראש</strong> (לפני שראית את הנתונים)?',
        opts: [
          { label: 'לא — אני רוצה לסרוק את כל הזוגות', log: 'ללא השוואות מתוכננות', next: 'res_anova' },
          { label: 'כן — יש לי מספר קטן של השערות ממוקדות', log: 'השוואות מתוכננות מראש', next: 'res_contrast' }
        ]
      },
      res_ttest: {
        result: { global: 't-test (מיחידה 3!)', posthoc: 'אין — יש רק זוג אחד', bonf: 'לא — השוואה בודדת, אין ריבוי',
          why: 'עם שתי קבוצות אין בעיית ריבוי השוואות בכלל — מבחן t רגיל (או Welch t אם השונויות שונות) עושה את העבודה. זו השורה האחרונה בטבלת דף העזר.' }
      },
      res_kw: {
        result: { global: 'Kruskal-Wallis', posthoc: 'Dunn', bonf: 'כן! Dunn לא מתקן לבד — מוסיפים בונפרוני',
          why: 'בלי נורמליות אסור לסמוך על התפלגות F. עוברים לעולם הדירוגים: KW הוא "ANOVA על דירוגים" ולא מניח נורמליות. שים לב — זה גם הפתרון לסולמות אורדינליים (כמו 1–10 של שביעות רצון בשאלה 19).' }
      },
      res_welch: {
        result: { global: 'Welch ANOVA', posthoc: 'Games-Howell', bonf: 'לא — Games-Howell כבר שולט ב-FWER בעצמו',
          why: 'הנורמליות (פר-קבוצה!) בסדר אבל השונויות שונות — Welch משקלל כל קבוצה לפי השונות שלה (בדיוק כמו Welch t מיחידה 3, רק ל-k קבוצות). שים לב שגם Welch מניח נורמליות בתוך כל קבוצה — לכן בדקנו אותה. ל-post-hoc לוקחים את Games-Howell, שהוא "Tukey שלא מניח שוויון שונויות".' }
      },
      res_anova: {
        result: { global: 'One-Way ANOVA', posthoc: 'Tukey HSD', bonf: 'לא — Tukey כבר שולט ב-FWER בעצמו',
          why: 'כל ההנחות מתקיימות ורוצים לסרוק את כל הזוגות — הבחירה הסטנדרטית. השורה הראשונה בטבלת דף העזר.' }
      },
      res_contrast: {
        result: { global: 'ANOVA', posthoc: 'Contrast t-tests על ההשוואות שתוכננו', bonf: 'כן — בונפרוני על מספר ההשוואות המתוכננות בלבד',
          why: 'למה לא Tukey? כי הוא "משלם" על כל הזוגות ומפסיד עוצמה (שאלה 17!). מתקנים רק על m ההשוואות שבאמת מעניינות — סף מחמיר פחות, עוצמה גבוהה יותר.' }
      }
    };

    var state;

    function addLog(html, color) {
      var div = document.createElement('div');
      div.style.cssText = 'background:#fff;border:1px solid #e3e7ef;border-right:4px solid ' +
        (color || '#4f6df5') + ';border-radius:8px;padding:7px 12px;margin-top:7px;font-size:.9rem';
      div.innerHTML = html;
      log.appendChild(div);
    }

    function render() {
      var node = FLOW[state];
      if (node.result) {
        var r = node.result;
        stage.innerHTML =
          '<div style="font-weight:800;color:#1fa971;margin-bottom:8px">🏁 ההחלטה שלך מוכנה:</div>' +
          '<table class="tbl" style="margin:0">' +
          '<tr><th>מבחן גלובלי</th><th>Post-Hoc</th><th>בונפרוני?</th></tr>' +
          '<tr><td><strong>' + r.global + '</strong></td><td><strong>' + r.posthoc + '</strong></td><td><strong>' + r.bonf + '</strong></td></tr>' +
          '</table>' +
          '<div style="margin-top:10px;font-size:.92rem;color:#5b6478">' + r.why + '</div>';
        return;
      }
      var html = '<div style="font-weight:700;margin-bottom:10px">' + node.q + '</div>';
      stage.innerHTML = html;
      node.opts.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'w-btn';
        b.style.cssText = 'display:block;width:100%;text-align:right;margin:6px 0;background:#fff;color:#1d2433;border:1.5px solid #c9cfdd';
        b.innerHTML = opt.label;
        b.addEventListener('mouseenter', function () { b.style.borderColor = '#4f6df5'; b.style.background = '#e8edff'; });
        b.addEventListener('mouseleave', function () { b.style.borderColor = '#c9cfdd'; b.style.background = '#fff'; });
        b.addEventListener('click', function () {
          addLog('✔ ' + opt.log, FLOW[opt.next].result ? '#1fa971' : '#4f6df5');
          state = opt.next;
          render();
        });
        stage.appendChild(b);
      });
    }

    function reset() {
      state = 'start';
      log.innerHTML = '';
      addLog('התחלנו מסלול חדש. ענה על השאלות כמו שהיית עונה מול פלט אמיתי.', '#5b6478');
      render();
    }

    btnReset.addEventListener('click', reset);
    reset();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFwer();
    initNavigator();
  });
})();
