/* ===== סביבת למידה — לוגיקה משותפת ===== */
(function () {
  'use strict';

  const LS_KEY = 'advStatsProgress';

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) { localStorage.setItem(LS_KEY, JSON.stringify(p)); }

  window.StudyApp = { loadProgress, saveProgress };

  document.addEventListener('DOMContentLoaded', function () {

    /* ---- פס התקדמות בעת גלילה ---- */
    const bar = document.getElementById('progress-bar');
    const chip = document.getElementById('pct-chip');
    if (bar) {
      const onScroll = function () {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        const pct = max > 0 ? Math.min(100, Math.round((h.scrollTop / max) * 100)) : 0;
        bar.style.width = pct + '%';
        if (chip) chip.textContent = pct + '%';
      };
      document.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* ---- בניית תוכן עניינים אוטומטית מ-h2/h3 ---- */
    const toc = document.getElementById('toc-links');
    if (toc) {
      const heads = document.querySelectorAll('main h2[id], main h3[id]');
      heads.forEach(function (h) {
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        if (h.tagName === 'H3') a.className = 'lvl3';
        toc.appendChild(a);
      });

      /* הדגשת הסעיף הפעיל בגלילה */
      const links = toc.querySelectorAll('a');
      const byId = {};
      links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
      const obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (a) { a.classList.remove('active'); });
            const a = byId[en.target.id];
            if (a) {
              a.classList.add('active');
              a.scrollIntoView({ block: 'nearest' });
            }
          }
        });
      }, { rootMargin: '-15% 0px -75% 0px' });
      heads.forEach(function (h) { obs.observe(h); });
    }

    /* ---- שאלונים ---- */
    document.querySelectorAll('.quiz').forEach(function (quiz, qi) {
      const opts = quiz.querySelectorAll('.opt');
      opts.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quiz.classList.contains('answered')) return;
          quiz.classList.add('answered');
          const isRight = btn.hasAttribute('data-correct');
          btn.classList.add(isRight ? 'correct' : 'wrong');
          opts.forEach(function (b) {
            b.disabled = true;
            if (b.hasAttribute('data-correct')) b.classList.add('correct');
          });
          /* שמירת תוצאה */
          const page = document.body.dataset.topic;
          if (page) {
            const p = loadProgress();
            p[page] = p[page] || {};
            p[page].quiz = p[page].quiz || {};
            p[page].quiz[qi] = isRight;
            saveProgress(p);
          }
          updateQuizSummary();
        });
      });
    });

    function updateQuizSummary() {
      const el = document.getElementById('quiz-summary');
      if (!el) return;
      const total = document.querySelectorAll('.quiz').length;
      const page = document.body.dataset.topic;
      const p = loadProgress();
      const res = (p[page] && p[page].quiz) || {};
      const answered = Object.keys(res).length;
      const right = Object.values(res).filter(Boolean).length;
      el.textContent = 'ענית על ' + answered + ' מתוך ' + total + ' שאלות, מהן ' + right + ' נכונות';
    }
    updateQuizSummary();

    /* ---- כפתור "סיימתי את הנושא" ---- */
    const btnDone = document.getElementById('btn-complete');
    if (btnDone) {
      const page = document.body.dataset.topic;
      const refresh = function () {
        const p = loadProgress();
        const done = p[page] && p[page].done;
        btnDone.classList.toggle('done', !!done);
        btnDone.textContent = done ? '✓ הנושא הושלם — כל הכבוד!' : 'סיימתי את הנושא ✓';
      };
      btnDone.addEventListener('click', function () {
        const p = loadProgress();
        p[page] = p[page] || {};
        p[page].done = !p[page].done;
        saveProgress(p);
        refresh();
      });
      refresh();
    }

    /* ---- דשבורד: סטטוס לכל נושא ---- */
    document.querySelectorAll('[data-topic-card]').forEach(function (card) {
      const id = card.getAttribute('data-topic-card');
      const p = loadProgress();
      const st = card.querySelector('.t-status');
      const badge = card.querySelector('.t-badge');
      if (p[id] && p[id].done) {
        if (st) st.textContent = '✅';
        if (badge) { badge.textContent = 'הושלם'; badge.className = 't-badge done'; }
      }
    });
    const fill = document.getElementById('overall-fill');
    const overallTxt = document.getElementById('overall-text');
    if (fill) {
      const cards = document.querySelectorAll('[data-topic-card]:not(.locked)');
      const p = loadProgress();
      let done = 0;
      cards.forEach(function (c) {
        if (p[c.getAttribute('data-topic-card')] && p[c.getAttribute('data-topic-card')].done) done++;
      });
      const totalPlanned = document.querySelectorAll('[data-topic-card]').length;
      const pct = totalPlanned ? Math.round((done / totalPlanned) * 100) : 0;
      fill.style.width = pct + '%';
      if (overallTxt) overallTxt.textContent = 'השלמת ' + done + ' מתוך ' + totalPlanned + ' נושאים (' + pct + '%)';
    }
  });
})();
