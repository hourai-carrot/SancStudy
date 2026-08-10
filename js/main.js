/* ============================================================
   SancStudy - Main JavaScript
   ============================================================ */

'use strict';

// ── Utility ──────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ── Nav ──────────────────────────────────────────────────────
function initNav() {
  const nav       = $('.nav');
  const hamburger = $('.nav__hamburger');
  const menu      = $('.nav__menu');
  const overlay   = $('.nav__overlay');

  if (!nav) return;

  // Scroll state
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Toggle drawer
  function toggleMenu(open) {
    hamburger.classList.toggle('active', open);
    menu.classList.toggle('open', open);
    overlay.classList.toggle('show', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  hamburger.addEventListener('click', () => toggleMenu(!menu.classList.contains('open')));
  overlay.addEventListener('click', () => toggleMenu(false));

  // Active link highlight
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  $$('.nav__menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // Close on link click
  $$('.nav__menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
}

// ── Hero Slider ───────────────────────────────────────────────
function initHeroSlider() {
  const slides = $$('.hero__slide');
  const dots   = $$('.hero__dot');
  if (!slides.length) return;

  let current = 0;
  let timer;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  // Init
  goTo(0);
  startAuto();

  // Dots
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); startAuto(); }));

  // Arrows
  const btnPrev = $('.hero__arrow--prev');
  const btnNext = $('.hero__arrow--next');
  btnPrev?.addEventListener('click', () => { prev(); startAuto(); });
  btnNext?.addEventListener('click', () => { next(); startAuto(); });

  // Touch / swipe
  let startX = 0;
  const heroEl = $('.hero');
  heroEl?.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  heroEl?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); startAuto(); }
  }, { passive: true });
}

// ── Scroll Reveal ─────────────────────────────────────────────
function initScrollReveal() {
  const els = $$('[data-reveal]');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
}

// ── Stats Counter ─────────────────────────────────────────────
function initCounters() {
  const nums = $$('[data-count]');
  if (!nums.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el  = e.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = 1800;
      const step = 16;
      const inc = end / (dur / step);
      let cur = 0;
      const t = setInterval(() => {
        cur = Math.min(cur + inc, end);
        el.textContent = Math.floor(cur).toLocaleString();
        if (cur >= end) clearInterval(t);
      }, step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => io.observe(n));
}

// ── Star Picker ───────────────────────────────────────────────
function initStarPicker() {
  $$('.star-picker').forEach(picker => {
    const stars = $$('span', picker);
    const input = picker.nextElementSibling;

    function setStars(n) {
      stars.forEach((s, i) => s.classList.toggle('lit', i < n));
      if (input && input.type === 'hidden') input.value = n;
    }

    stars.forEach((s, i) => {
      s.addEventListener('mouseover', () => setStars(i + 1));
      s.addEventListener('click',     () => { setStars(i + 1); picker.dataset.rating = i + 1; });
    });
    picker.addEventListener('mouseleave', () => {
      const r = parseInt(picker.dataset.rating || 0);
      setStars(r);
    });
  });
}

// ── Review System ─────────────────────────────────────────────
const STORAGE_KEY = 'sancstudy_reviews';

function loadReviews() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveReviews(reviews) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function renderReviews() {
  const container = $('#review-list');
  if (!container) return;

  const reviews = loadReviews();
  const avgEl   = $('#review-avg');
  const countEl = $('#review-count');

  // Compute avg
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  if (avgEl)   avgEl.textContent = avg;
  if (countEl) countEl.textContent = `${reviews.length}件のレビュー`;

  // Bar chart
  for (let i = 5; i >= 1; i--) {
    const bar = $(`#bar-${i}`);
    if (!bar) continue;
    const cnt = reviews.filter(r => r.rating === i).length;
    const pct = reviews.length ? (cnt / reviews.length * 100) : 0;
    bar.style.width = pct + '%';
  }

  // Big stars
  const bigStars = $('#big-stars');
  if (bigStars) {
    const n = Math.round(parseFloat(avg));
    bigStars.innerHTML = '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  // List
  if (!reviews.length) {
    container.innerHTML = '<p style="text-align:center;color:var(--gray-400);padding:2rem 0;">まだレビューがありません。最初のレビューを投稿しましょう！</p>';
    return;
  }

  container.innerHTML = reviews.slice().reverse().slice(0, 12).map(r => `
    <div class="review-card" data-reveal>
      <div class="review-card__header">
        <div class="review-card__avatar">${r.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="review-card__name">${escHtml(r.name)}</div>
          <div class="review-card__date">${r.date}</div>
        </div>
      </div>
      <div class="review-card__stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <div class="review-card__text">${escHtml(r.comment)}</div>
    </div>
  `).join('');

  // Re-observe new elements
  $$('[data-reveal]', container).forEach(el => {
    if (!el.classList.contains('revealed')) {
      setTimeout(() => el.classList.add('revealed'), 50);
    }
  });
}

function initReviewForm() {
  const form = $('#review-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.querySelector('[name="reviewer-name"]').value.trim();
    const comment = form.querySelector('[name="review-comment"]').value.trim();
    const rating  = parseInt(form.querySelector('[name="rating"]').value || 0);

    if (!name || !comment) { showToast('名前とコメントを入力してください', 'error'); return; }
    if (!rating)            { showToast('星の評価を選択してください', 'error'); return; }

    const reviews = loadReviews();
    reviews.push({ name, comment, rating, date: new Date().toLocaleDateString('ja-JP') });
    saveReviews(reviews);
    renderReviews();
    form.reset();
    $$('.star-picker span', form).forEach(s => s.classList.remove('lit'));
    form.querySelector('[name="rating"]').value = '';
    const picker = form.querySelector('.star-picker');
    if (picker) picker.dataset.rating = 0;
    showToast('レビューを投稿しました！ありがとうございます ★', 'success');
  });
}

// ── Feedback Form ─────────────────────────────────────────────
function initFeedbackForm() {
  const form = $('#feedback-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const type    = form.querySelector('[name="fb-type"]').value;
    const site    = form.querySelector('[name="fb-site"]').value;
    const content = form.querySelector('[name="fb-content"]').value.trim();
    
    if (!content) { showToast('内容を入力してください', 'error'); return; }

    btn.disabled = true;
    btn.textContent = '送信中...';

    // --- 実装案: Formspree を使用する場合 ---
    // const FORMSPREE_URL = "https://formspree.io/f/YOUR_FORM_ID";
    // try {
    //   const response = await fetch(FORMSPREE_URL, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ type, site, content })
    //   });
    //   if (response.ok) {
    //     showToast('送信完了！管理者へ通知されました', 'success');
    //     form.reset();
    //   } else { throw new Error(); }
    // } catch (err) {
    //   showToast('送信に失敗しました。後ほどお試しください', 'error');
    // }

    // 現在はデモ用に localStorage に保存
    const feedbacks = JSON.parse(localStorage.getItem('sancstudy_feedback') || '[]');
    feedbacks.push({ type, site, content, date: new Date().toISOString() });
    localStorage.setItem('sancstudy_feedback', JSON.stringify(feedbacks));
    
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '送信する';
      form.reset();
      showToast('フィードバックを送信しました（デモ）', 'success');
    }, 800);
  });
}

// ── Tabs ──────────────────────────────────────────────────────
function initTabs() {
  $$('.tab-nav').forEach(nav => {
    const items  = $$('.tab-nav__item', nav);
    const panels = $$('.tab-panel', nav.closest('.tabs-wrapper') || document);

    items.forEach((item, i) => {
      item.addEventListener('click', () => {
        items.forEach(it => it.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        item.classList.add('active');
        panels[i]?.classList.add('active');
      });
    });
  });
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  let toast = $('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast toast--${type}`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── Escape HTML ───────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Smooth anchor scroll ──────────────────────────────────────
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ── Cookie Banner ──────────────────────────────────────────
function initCookieBanner() {
  const COOKIE_KEY = 'sancstudy_cookie_consent';
  if (localStorage.getItem(COOKIE_KEY)) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.innerHTML = `
    <div class="cookie-banner__title">Cookieの利用について</div>
    <div class="cookie-banner__text">
      当サイトでは、利便性向上とアクセス解析のためにCookieを使用しています。
      詳細は<a href="privacy.html" style="color:var(--blue-mid);text-decoration:underline;">プライバシーポリシー</a>をご覧ください。
    </div>
    <div class="cookie-banner__actions">
      <button class="cookie-banner__btn cookie-banner__btn--accept">同意する</button>
      <button class="cookie-banner__btn cookie-banner__btn--settings">ブラウザ設定で無効にする方法</button>
    </div>
  `;
  document.body.appendChild(banner);

  setTimeout(() => banner.classList.add('show'), 1000);

  banner.querySelector('.cookie-banner__btn--accept').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'true');
    banner.classList.remove('show');
    setTimeout(() => banner.remove(), 500);
  });

  banner.querySelector('.cookie-banner__btn--settings').addEventListener('click', () => {
    location.href = 'privacy.html#cookie-settings';
  });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeroSlider();
  initScrollReveal();
  initCounters();
  initStarPicker();
  initReviewForm();
  initFeedbackForm();
  initTabs();
  initSmoothScroll();
  renderReviews();
  initCookieBanner();

  // Seed sample reviews if empty
  if (!loadReviews().length) {
    const samples = [
      { name: '中2 Kさん', comment: '漢字大戦が楽しすぎて毎日やってます！気づいたら漢字が得意になってた。', rating: 5, date: '2026/7/15' },
      { name: '高1 Tさん', comment: 'LEAP OVER QUESTで英単語を覚えるのが楽しくなりました。ゲーム感覚で続けられます。', rating: 5, date: '2026/7/20' },
      { name: '中3 Mさん', comment: '宿題マネージャーで提出忘れがなくなりました！スマホとPCで同期できるのが便利。', rating: 4, date: '2026/7/28' },
      { name: '高2 Sさん', comment: 'Prime Strikerで数学の素因数分解が得意になった。友達と対戦できるのが最高！', rating: 5, date: '2026/8/1' },
      { name: '中1 Aさん', comment: 'デザインがかっこよくて使いやすい。もっとゲームが増えてほしいです！', rating: 4, date: '2026/8/3' },
    ];
    saveReviews(samples);
    renderReviews();
  }
});
