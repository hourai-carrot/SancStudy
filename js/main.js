/**
 * SancStudy Main JS
 * Fixed version with correct selectors and robust Supabase initialization
 */

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// --- Supabase Configuration ---
const SUPABASE_URL = "https://bduejgzyauqilbhkisen.supabase.co";
const SUPABASE_KEY = "sb_publishable_J9yXztCQd9VRBF92l-dYew_kwrVpw3L";
let supabaseClient = null;

function initSupabase() {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.supabaseClient = supabaseClient;
    return true;
  }
  return false;
}

// --- XSS Protection ---
function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Navigation ──────────────────────────────────────────────────
function initNav() {
  const burger = $('.nav__hamburger');
  const menu = $('.nav__menu');
  const overlay = $('.nav__overlay');
  if (!burger) return;

  const toggle = () => {
    const active = burger.classList.toggle('active');
    menu.classList.toggle('open'); // Fixed: changed from active to open
    overlay.classList.toggle('show'); // Fixed: changed from active to show
    burger.setAttribute('aria-expanded', active);
    document.body.style.overflow = active ? 'hidden' : '';
  };

  burger.addEventListener('click', toggle);
  overlay.addEventListener('click', toggle);
  
  // Close menu on link click
  $$('.nav__menu a').forEach(a => {
    a.addEventListener('click', () => {
      if (burger.classList.contains('active')) toggle();
    });
  });

  // Active link underline
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav__menu a').forEach(a => {
    if (a.getAttribute('href') === currentPath) a.classList.add('active');
  });
}

// ── Hero Slider ────────────────────────────────────────────────
function initHeroSlider() {
  const slides = $$('.hero__slide');
  const dots = $$('.hero__dot');
  const prev = $('.hero__arrow--prev'); // Fixed: changed from .hero__btn--prev
  const next = $('.hero__arrow--next'); // Fixed: changed from .hero__btn--next
  if (!slides.length) return;

  let current = 0;
  let timer = null;

  const show = index => {
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  };

  const start = () => {
    stop();
    timer = setInterval(() => show(current + 1), 5000);
  };
  const stop = () => clearInterval(timer);

  next?.addEventListener('click', () => { show(current + 1); start(); });
  prev?.addEventListener('click', () => { show(current - 1); start(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { show(i); start(); }));

  start();
}

// ── Scroll Reveal ──────────────────────────────────────────────
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Check if this element or its children have data-count
        if (entry.target.hasAttribute('data-count') || entry.target.querySelector('[data-count]')) {
          startCounters(entry.target);
        }
      }
    });
  }, { threshold: 0.1 });

  $$('[data-reveal]').forEach(el => observer.observe(el));
}

// ── Counters ──────────────────────────────────────────────────
function startCounters(container) {
  const nums = container.querySelectorAll('[data-count]');
  nums.forEach(el => {
    if (el.dataset.started) return;
    el.dataset.started = "true";
    const target = parseInt(el.dataset.count);
    let count = 0;
    const duration = 2000;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(ease * target);
      
      el.textContent = currentCount.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
      }
    };
    requestAnimationFrame(update);
  });
}

// ── Reviews (Supabase) ─────────────────────────────────────────
async function fetchApprovedReviews() {
  if (!supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Fetch reviews error:", err);
    return [];
  }
}

async function submitReview(review) {
  if (!supabaseClient) return { error: "Supabase not initialized" };
  try {
    const { error } = await supabaseClient
      .from('reviews')
      .insert([{ ...review, approved: false }]);
    return { error };
  } catch (err) {
    return { error: err.message };
  }
}

function renderStars(rating) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

async function updateReviewDisplay() {
  const listEl = $('#review-list');
  if (!listEl) return;

  const reviews = await fetchApprovedReviews();
  
  if (reviews.length === 0) {
    listEl.innerHTML = '<p style="text-align:center; padding: 40px; grid-column: 1/-1; color: var(--gray-500);">承認済みのレビューはまだありません。</p>';
    updateStats([]);
    return;
  }

  listEl.innerHTML = reviews.map(r => `
    <article class="review-card">
      <div class="review-card__header">
        <div class="review-card__avatar">${escapeHTML(r.name.charAt(0))}</div>
        <div>
          <div class="review-card__name">${escapeHTML(r.name)}</div>
          <div class="review-card__date">${new Date(r.created_at).toLocaleDateString()}</div>
        </div>
      </div>
      <div class="review-card__stars">${renderStars(r.rating)}</div>
      <p class="review-card__text">${escapeHTML(r.content)}</p>
    </article>
  `).join('');

  updateStats(reviews);
}

function updateStats(reviews) {
  const avgEl = $('#review-avg');
  const starsEl = $('#big-stars');
  const countEl = $('#review-count');
  if (!avgEl) return;

  const count = reviews.length;
  if (count === 0) {
    avgEl.textContent = "—";
    starsEl.textContent = "☆☆☆☆☆";
    countEl.textContent = "0件のレビュー";
    [1,2,3,4,5].forEach(i => {
      const bar = $(`#bar-${i}`);
      if (bar) bar.style.width = "0%";
    });
    return;
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = (sum / count).toFixed(1);
  
  avgEl.textContent = avg;
  starsEl.textContent = renderStars(Math.round(avg));
  countEl.textContent = `${count}件のレビュー`;

  const distribution = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  reviews.forEach(r => distribution[r.rating]++);
  Object.keys(distribution).forEach(star => {
    const bar = $(`#bar-${star}`);
    if (bar) {
      const percent = (distribution[star] / count) * 100;
      bar.style.width = `${percent}%`;
    }
  });

  const statsNum = $$('.stats__num span');
  if (statsNum.length >= 3) {
    const satisfaction = Math.round((avg / 5) * 100);
    statsNum[2].dataset.count = satisfaction;
    if (statsNum[2].dataset.started) {
      statsNum[2].dataset.started = "";
      startCounters(statsNum[2].parentElement);
    }
  }
}

function initReviewForm() {
  const form = $('#review-form');
  if (!form) return;

  let selectedRating = 0;
  const stars = $$('.star-picker span');
  
  stars.forEach((star, i) => {
    star.addEventListener('click', () => {
      selectedRating = i + 1;
      stars.forEach((s, j) => s.classList.toggle('lit', j <= i)); // Fixed: changed from active to lit
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#reviewer-name').value.trim();
    const content = $('#review-comment').value.trim();
    const btn = form.querySelector('button[type="submit"]');

    if (!name || !content || selectedRating === 0) {
      showToast('すべての項目を入力してください', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '送信中...';

    const { error } = await submitReview({ name, rating: selectedRating, content });

    if (error) {
      showToast('エラーが発生しました。後ほどお試しください', 'error');
      btn.disabled = false;
      btn.textContent = '投稿する';
    } else {
      showToast('レビューを送信しました！管理者の承認後に掲載されます。', 'success');
      form.reset();
      selectedRating = 0;
      stars.forEach(s => s.classList.remove('lit'));
      btn.disabled = false;
      btn.textContent = '投稿する';
    }
  });
}

// ── Toast ──────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 4000);
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

// ── Smooth Scroll ──────────────────────────────────────────────
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === "#") {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      try {
        const target = $(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (err) {}
    });
  });
}

// ── Init ──────────────────────────────────────────────────────
function startApp() {
  initNav();
  initHeroSlider();
  initScrollReveal();
  initReviewForm();
  initSmoothScroll();
  initCookieBanner();
  
  // Try to init Supabase and fetch reviews
  if (initSupabase()) {
    updateReviewDisplay();
  } else {
    // Retry once after a short delay if SDK not ready
    setTimeout(() => {
      if (initSupabase()) updateReviewDisplay();
    }, 1000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
