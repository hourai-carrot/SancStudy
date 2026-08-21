/**
 * SancStudy Main JavaScript
 * Public data is read from Supabase with the publishable key only.
 * Management operations are intentionally not implemented in the browser.
 */

'use strict';

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// ---------------------------------------------------------------------------
// Supabase Configuration
// Project URL and publishable key are safe for a browser only when RLS is set.
// Never add secret, service_role, or database credentials to this file.
// ---------------------------------------------------------------------------
const SUPABASE_URL = 'https://bduejgzyauqilbhkisen.supabase.co';
const SUPABASE_KEY = 'sb_publishable_J9yXztCQd9VRBF92l-dYew_kwrVpw3L';
let supabaseClient = null;
let publicPortalData = null;

function initSupabase() {
  if (supabaseClient) return true;
  if (!window.supabase || typeof window.supabase.createClient !== 'function') return false;
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
  return true;
}

// ---------------------------------------------------------------------------
// Safe DOM helpers
// ---------------------------------------------------------------------------
function text(value) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function createElement(tag, className = '', content = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== '') element.textContent = text(content);
  return element;
}

function clearElement(element) {
  if (element) element.replaceChildren();
}

function isSafeHttpsUrl(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isSafeArticlePath(value) {
  return typeof value === 'string' && /^articles\/[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(value);
}

function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', options).format(date);
}

function formatMonth(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long' }).format(date);
}

function setLoading(element, message = '読み込み中です…') {
  if (!element) return;
  clearElement(element);
  const state = createElement('p', 'dynamic-state dynamic-state--loading', message);
  state.setAttribute('role', 'status');
  element.append(state);
}

function setEmpty(element, message) {
  if (!element) return;
  clearElement(element);
  element.append(createElement('p', 'dynamic-state', message));
}

function setError(element, message = '情報を読み込めませんでした。時間をおいて再度お試しください。') {
  if (!element) return;
  clearElement(element);
  const state = createElement('p', 'dynamic-state dynamic-state--error', message);
  state.setAttribute('role', 'alert');
  element.append(state);
}

function createAvatar(member, className = 'member-avatar') {
  // Every avatar keeps the shared class so its size and image fitting remain
  // consistent across creator chips, team cards, and profile headers.
  const root = createElement('span', `${className} member-avatar`);
  root.setAttribute('aria-hidden', 'true');
  const fallback = text(member?.name).trim().slice(0, 1).toUpperCase() || 'S';
  root.textContent = fallback;

  if (isSafeHttpsUrl(member?.avatar_url)) {
    const image = document.createElement('img');
    image.alt = '';
    // Do not wait for a detached lazy image. Keeping the image in the DOM
    // lets mobile browsers start the request; the fallback stays visible
    // until the image finishes loading successfully.
    image.loading = 'eager';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    image.style.opacity = '0';
    image.addEventListener('load', () => {
      image.style.opacity = '';
      root.replaceChildren(image);
    }, { once: true });
    image.addEventListener('error', () => image.remove(), { once: true });
    root.append(image);
    image.src = member.avatar_url;
  }
  return root;
}

function createBadge(badge) {
  const allowedKeys = new Set(['developer', 'writer', 'supporter']);
  const badgeKey = allowedKeys.has(badge?.badge_key) ? badge.badge_key : 'supporter';
  const node = createElement('span', `role-badge role-badge--${badgeKey}`, badge?.label || badgeKey);
  return node;
}

function makeProfileHref(slug) {
  return `profile.html?member=${encodeURIComponent(text(slug))}`;
}

function createAuthorChip(member, badges = []) {
  const link = document.createElement('a');
  link.className = 'content-creator';
  link.href = makeProfileHref(member.slug);
  link.setAttribute('aria-label', `${text(member.name)}のプロフィールを見る`);

  link.append(createAvatar(member, 'content-creator__avatar'));
  const detail = createElement('span', 'content-creator__detail');
  detail.append(createElement('span', 'content-creator__label', '制作'));
  detail.append(createElement('span', 'content-creator__name', member.name));
  if (badges.length) {
    const badgesWrap = createElement('span', 'content-creator__badges');
    badges.slice(0, 2).forEach((badge) => badgesWrap.append(createBadge(badge)));
    detail.append(badgesWrap);
  }
  link.append(detail);
  return link;
}

// ---------------------------------------------------------------------------
// Navigation and Hero
// ---------------------------------------------------------------------------
function initNav() {
  const burger = $('.nav__hamburger');
  const menu = $('.nav__menu');
  const overlay = $('.nav__overlay');
  if (!burger || !menu || !overlay) return;

  const close = () => {
    burger.classList.remove('active');
    menu.classList.remove('open');
    overlay.classList.remove('show');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const toggle = () => {
    const isOpen = burger.classList.toggle('active');
    menu.classList.toggle('open', isOpen);
    overlay.classList.toggle('show', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  burger.addEventListener('click', toggle);
  overlay.addEventListener('click', close);
  // The drawer can be dismissed by tapping anywhere outside it, not only the × button.
  document.addEventListener('pointerdown', (event) => {
    if (!burger.classList.contains('active')) return;
    if (!menu.contains(event.target) && !burger.contains(event.target)) close();
  });
  $$('.nav__menu a').forEach((link) => link.addEventListener('click', close));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && burger.classList.contains('active')) close();
  });

  const current = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav__menu a').forEach((link) => {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });
}

function initHeroSlider() {
  const hero = $('.hero');
  const slides = $$('.hero__slide');
  const dots = $$('.hero__dot');
  const prev = $('.hero__arrow--prev');
  const next = $('.hero__arrow--next');
  if (!hero || !slides.length) return;

  let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('active')));
  let timer = null;
  let touchStartX = 0;
  let touchStartY = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, itemIndex) => slide.classList.toggle('active', itemIndex === current));
    dots.forEach((dot, itemIndex) => {
      dot.classList.toggle('active', itemIndex === current);
      dot.setAttribute('aria-current', itemIndex === current ? 'true' : 'false');
    });
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    stop();
    timer = window.setInterval(() => show(current + 1), 5000);
  };
  const restart = () => start();

  next?.addEventListener('click', () => { show(current + 1); restart(); });
  prev?.addEventListener('click', () => { show(current - 1); restart(); });
  dots.forEach((dot, index) => dot.addEventListener('click', () => { show(index); restart(); }));

  hero.addEventListener('touchstart', (event) => {
    const point = event.changedTouches[0];
    touchStartX = point.screenX;
    touchStartY = point.screenY;
  }, { passive: true });

  hero.addEventListener('touchend', (event) => {
    const point = event.changedTouches[0];
    const distanceX = touchStartX - point.screenX;
    const distanceY = touchStartY - point.screenY;
    // Horizontal gestures longer than 50px switch slides. Vertical page scrolls do not.
    if (Math.abs(distanceX) > 50 && Math.abs(distanceX) > Math.abs(distanceY)) {
      show(distanceX > 0 ? current + 1 : current - 1);
      restart();
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  // Prevent a blank first paint even if other async features are slow.
  show(current);
  start();
}

// ---------------------------------------------------------------------------
// Scroll reveal and counters
// ---------------------------------------------------------------------------
function startCounters(container) {
  const counters = $$('[data-count]', container);
  counters.forEach((element) => {
    if (element.dataset.started === 'true') return;
    const target = Number.parseInt(element.dataset.count || '0', 10);
    if (Number.isNaN(target)) return;

    element.dataset.started = 'true';
    const startTime = performance.now();
    const duration = 1200;
    const update = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      element.textContent = Math.floor(target * eased).toLocaleString('ja-JP');
      if (progress < 1) requestAnimationFrame(update);
      else element.textContent = target.toLocaleString('ja-JP');
    };
    requestAnimationFrame(update);
  });
}

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    $$('[data-reveal]').forEach((element) => element.classList.add('revealed'));
    $$('.stats').forEach(startCounters);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('revealed');
      if (entry.target.hasAttribute('data-count') || entry.target.querySelector('[data-count]')) {
        startCounters(entry.target);
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  $$('[data-reveal]').forEach((element) => observer.observe(element));
  $$('.stats').forEach((element) => observer.observe(element));
}

// ---------------------------------------------------------------------------
// Reviews (existing approval flow)
// ---------------------------------------------------------------------------
async function fetchApprovedReviews() {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('reviews')
    .select('id, created_at, name, rating, content')
    .eq('approved', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function submitReview(review) {
  if (!supabaseClient) return { error: new Error('Supabase is not available.') };
  const { error } = await supabaseClient
    .from('reviews')
    .insert([{ name: review.name, rating: review.rating, content: review.content, approved: false }]);
  return { error };
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

function updateReviewStats(reviews) {
  const average = $('#review-avg');
  const bigStars = $('#big-stars');
  const count = $('#review-count');
  if (!average || !bigStars || !count) return;

  if (!reviews.length) {
    average.textContent = '—';
    bigStars.textContent = '☆☆☆☆☆';
    count.textContent = '0件のレビュー';
    [1, 2, 3, 4, 5].forEach((rating) => {
      const bar = $(`#bar-${rating}`);
      if (bar) bar.style.width = '0%';
    });
    return;
  }

  const sum = reviews.reduce((total, review) => total + Number(review.rating || 0), 0);
  const result = (sum / reviews.length).toFixed(1);
  average.textContent = result;
  bigStars.textContent = renderStars(Math.round(Number(result)));
  count.textContent = `${reviews.length}件のレビュー`;

  [1, 2, 3, 4, 5].forEach((rating) => {
    const bar = $(`#bar-${rating}`);
    if (!bar) return;
    const frequency = reviews.filter((review) => Number(review.rating) === rating).length;
    bar.style.width = `${(frequency / reviews.length) * 100}%`;
  });

  const satisfaction = Math.round((Number(result) / 5) * 100);
  const satisfactionCounter = $('#stat-satisfaction');
  if (satisfactionCounter) {
    satisfactionCounter.dataset.count = String(satisfaction);
    satisfactionCounter.dataset.started = '';
    satisfactionCounter.textContent = '0';
    const statRoot = satisfactionCounter.closest('[data-reveal]') || satisfactionCounter.parentElement;
    if (statRoot?.classList.contains('revealed')) startCounters(statRoot);
  }
}

async function updateReviewDisplay() {
  const list = $('#review-list');
  if (!list || !supabaseClient) return;
  try {
    const reviews = await fetchApprovedReviews();
    clearElement(list);
    if (!reviews.length) {
      list.append(createElement('p', 'dynamic-state', '承認済みのレビューはまだありません。'));
      updateReviewStats([]);
      return;
    }

    reviews.forEach((review) => {
      const card = createElement('article', 'review-card');
      const header = createElement('div', 'review-card__header');
      header.append(createElement('div', 'review-card__avatar', text(review.name).slice(0, 1).toUpperCase() || 'S'));
      const details = document.createElement('div');
      details.append(createElement('div', 'review-card__name', review.name));
      details.append(createElement('div', 'review-card__date', formatDate(review.created_at)));
      header.append(details);
      card.append(header);
      card.append(createElement('div', 'review-card__stars', renderStars(review.rating)));
      card.append(createElement('p', 'review-card__text', review.content));
      list.append(card);
    });
    updateReviewStats(reviews);
  } catch (error) {
    console.error('Could not load reviews:', error);
    setError(list, 'レビューを読み込めませんでした。時間をおいて再度お試しください。');
  }
}

function showToast(message, type = 'success') {
  const toast = createElement('div', `toast toast--${type}`, message);
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  window.setTimeout(() => {
    toast.classList.remove('show');
    window.setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function initReviewForm() {
  const form = $('#review-form');
  if (!form) return;
  let selectedRating = 0;
  const stars = $$('.star-picker [role="radio"]');

  const updatePicker = () => {
    stars.forEach((star, index) => {
      const selected = index < selectedRating;
      star.classList.toggle('lit', selected);
      star.setAttribute('aria-checked', String(index + 1 === selectedRating));
    });
  };

  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      selectedRating = index + 1;
      updatePicker();
    });
    star.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        selectedRating = Math.min(5, selectedRating + 1 || 1);
        updatePicker();
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        selectedRating = Math.max(1, selectedRating - 1 || 1);
        updatePicker();
      }
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = text($('#reviewer-name')?.value).trim();
    const content = text($('#review-comment')?.value).trim();
    const button = $('[type="submit"]', form);
    if (!name || !content || !selectedRating) {
      showToast('すべての項目を入力してください。', 'error');
      return;
    }

    button.disabled = true;
    button.textContent = '送信中…';
    const { error } = await submitReview({ name, rating: selectedRating, content });
    button.disabled = false;
    button.textContent = '投稿する';

    if (error) {
      console.error('Could not submit review:', error);
      showToast('送信できませんでした。時間をおいて再度お試しください。', 'error');
      return;
    }
    form.reset();
    selectedRating = 0;
    updatePicker();
    showToast('レビューを送信しました。管理者の承認後に掲載されます。');
  });
}

// ---------------------------------------------------------------------------
// Dynamic public content (Members, badges, content creators, news, articles)
// ---------------------------------------------------------------------------
async function selectRows(table, orderColumn, ascending = true) {
  const { data, error } = await supabaseClient
    .from(table)
    .select('*')
    .order(orderColumn, { ascending });
  if (error) throw error;
  return data || [];
}

function getResultValue(result) {
  return result.status === 'fulfilled' ? result.value : [];
}

function hasResultError(result) {
  return result.status === 'rejected';
}

function buildDataIndexes(data) {
  const membersById = new Map(data.members.map((member) => [member.id, member]));
  const membersBySlug = new Map(data.members.map((member) => [member.slug, member]));
  const badgesByMemberId = new Map();
  data.badges.forEach((badge) => {
    if (!badgesByMemberId.has(badge.member_id)) badgesByMemberId.set(badge.member_id, []);
    badgesByMemberId.get(badge.member_id).push(badge);
  });
  badgesByMemberId.forEach((badges) => badges.sort((a, b) => a.sort_order - b.sort_order));
  return { membersById, membersBySlug, badgesByMemberId };
}

async function loadPublicPortalData() {
  if (!supabaseClient) return null;
  const results = await Promise.allSettled([
    selectRows('members', 'sort_order'),
    selectRows('member_badges', 'sort_order'),
    selectRows('content_items', 'sort_order'),
    selectRows('updates', 'published_at', false),
    selectRows('articles', 'published_at', false),
    selectRows('site_settings', 'setting_key'),
    selectRows('site_history', 'occurred_on', false)
  ]);

  const [membersResult, badgesResult, contentResult, updatesResult, articlesResult, settingsResult, historyResult] = results;
  publicPortalData = {
    members: getResultValue(membersResult),
    badges: getResultValue(badgesResult),
    contentItems: getResultValue(contentResult),
    updates: getResultValue(updatesResult),
    articles: getResultValue(articlesResult),
    settings: getResultValue(settingsResult),
    history: getResultValue(historyResult),
    errors: {
      members: hasResultError(membersResult),
      badges: hasResultError(badgesResult),
      contentItems: hasResultError(contentResult),
      updates: hasResultError(updatesResult),
      articles: hasResultError(articlesResult),
      settings: hasResultError(settingsResult),
      history: hasResultError(historyResult)
    }
  };
  publicPortalData.indexes = buildDataIndexes(publicPortalData);
  return publicPortalData;
}

function memberBadges(memberId, data = publicPortalData) {
  return data?.indexes?.badgesByMemberId.get(memberId) || [];
}

function renderCreatorSlots(data) {
  if (!data || data.errors.contentItems || data.errors.members) return;
  const bySlug = new Map(data.contentItems.map((item) => [item.slug, item]));
  $$('[data-content-creator]').forEach((slot) => {
    const item = bySlug.get(slot.dataset.contentCreator);
    const member = item ? data.indexes.membersById.get(item.author_member_id) : null;
    if (!member) return;
    clearElement(slot);
    slot.append(createAuthorChip(member, memberBadges(member.id, data)));
  });
}

function renderHomeStats(data) {
  const contentCount = $('#stat-content-count');
  const memberCount = $('#stat-member-count');
  if (contentCount && !data.errors.contentItems) {
    contentCount.dataset.count = String(data.contentItems.length);
    contentCount.textContent = String(data.contentItems.length);
  }
  if (memberCount && !data.errors.members) {
    memberCount.dataset.count = String(data.members.length);
    memberCount.textContent = String(data.members.length);
  }
}

function renderAboutPage(data) {
  const team = $('#team-list');
  if (team) {
    if (data.errors.members || data.errors.badges) {
      setError(team, '運営メンバー情報を読み込めませんでした。');
    } else if (!data.members.length) {
      setEmpty(team, '公開中の運営メンバー情報は準備中です。');
    } else {
      clearElement(team);
      data.members.forEach((member) => {
        const card = document.createElement('a');
        card.className = 'team-card team-card--link';
        card.href = makeProfileHref(member.slug);
        card.append(createAvatar(member, 'team-card__avatar'));
        card.append(createElement('div', 'team-card__name', member.name));
        if (member.role_title) card.append(createElement('div', 'team-card__role', member.role_title));
        const badges = memberBadges(member.id, data);
        if (badges.length) {
          const badgesWrap = createElement('div', 'role-badges');
          badges.forEach((badge) => badgesWrap.append(createBadge(badge)));
          card.append(badgesWrap);
        }
        if (member.bio) card.append(createElement('div', 'team-card__bio', member.bio));
        card.append(createElement('span', 'team-card__profile-link', 'プロフィールを見る →'));
        team.append(card);
      });
    }
  }

  const memberTotal = $('#about-member-count');
  if (memberTotal) memberTotal.textContent = !data.errors.members ? `${data.members.length}名` : '情報を取得できません';
  const contentTotal = $('#about-content-count');
  if (contentTotal) contentTotal.textContent = !data.errors.contentItems ? `${data.contentItems.length}` : '情報を取得できません';

  const settingMap = new Map(data.settings.map((item) => [item.setting_key, item.setting_value]));
  const started = $('#about-started-on');
  if (started) started.textContent = settingMap.get('site_started_on') || '公開情報を準備中です';
  const lastUpdated = $('#about-last-updated');
  if (lastUpdated) {
    const dates = [
      ...data.members.map((item) => item.updated_at),
      ...data.contentItems.map((item) => item.updated_at),
      ...data.updates.map((item) => item.updated_at),
      ...data.articles.map((item) => item.updated_at),
      ...data.history.map((item) => item.updated_at)
    ].filter(Boolean).map((value) => new Date(value)).filter((value) => !Number.isNaN(value.getTime()));
    lastUpdated.textContent = dates.length ? formatMonth(new Date(Math.max(...dates.map((item) => item.getTime())))) : '公開情報を準備中です';
  }
  const mission = $('#about-mission-copy');
  if (mission && settingMap.has('mission')) mission.textContent = settingMap.get('mission');

  const history = $('#history-list');
  if (history) {
    if (data.errors.history) {
      setError(history, '沿革を読み込めませんでした。');
    } else if (!data.history.length) {
      setEmpty(history, '公開中の沿革は準備中です。');
    } else {
      clearElement(history);
      data.history.forEach((item) => {
        const entry = createElement('article', 'history-item');
        entry.append(createElement('div', 'history-item__date', item.occurred_on ? formatMonth(item.occurred_on) : 'お知らせ'));
        entry.append(createElement('h3', 'history-item__title', item.title));
        entry.append(createElement('p', 'history-item__summary', item.summary));
        history.append(entry);
      });
    }
  }
}

function updateFilterButtons(items) {
  $$('.tab-nav__item').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.tab-nav__item').forEach((node) => {
        const isActive = node === button;
        node.classList.toggle('active', isActive);
        node.setAttribute('aria-selected', String(isActive));
      });
      const category = button.dataset.tab || 'all';
      items.forEach((item) => {
        item.hidden = category !== 'all' && item.dataset.category !== category;
      });
    });
  });
}

function renderNewsPage(data) {
  const list = $('#news-list');
  if (!list) return;
  if (data.errors.updates) {
    setError(list, '更新情報を読み込めませんでした。');
    return;
  }
  if (!data.updates.length) {
    setEmpty(list, '公開中の更新情報はまだありません。');
    return;
  }

  clearElement(list);
  const entries = [];
  data.updates.forEach((update) => {
    const entry = createElement('article', 'news-item');
    entry.dataset.category = update.category;
    entry.append(createElement('time', 'news-item__date', formatDate(update.published_at, { year: 'numeric', month: '2-digit', day: '2-digit' }).replaceAll('/', '.')));
    entry.append(createElement('span', `news-item__badge news-item__badge--${update.category}`, { game: 'ゲーム', tool: 'ツール', site: 'サイト' }[update.category] || '更新'));
    const body = createElement('div', 'news-item__body');
    body.append(createElement('h2', 'news-item__title', update.title));
    body.append(createElement('p', 'news-item__text', update.summary));
    const author = data.indexes.membersById.get(update.author_member_id);
    if (author) body.append(createAuthorChip(author, memberBadges(author.id, data)));
    entry.append(body);
    list.append(entry);
    entries.push(entry);
  });
  updateFilterButtons(entries);
}

function createArticleCard(article, data) {
  const card = document.createElement('article');
  card.className = 'article-card';
  const link = document.createElement('a');
  link.href = `article.html?slug=${encodeURIComponent(article.slug)}`;
  link.className = 'article-card__link';

  if (isSafeHttpsUrl(article.cover_image_url)) {
    const image = document.createElement('img');
    image.className = 'article-card__image';
    image.src = article.cover_image_url;
    image.alt = '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    link.append(image);
  } else {
    link.append(createElement('div', 'article-card__image article-card__image--placeholder', 'SancStudy Articles'));
  }

  const body = createElement('div', 'article-card__body');
  body.append(createElement('span', 'article-card__category', article.category));
  body.append(createElement('h2', 'article-card__title', article.title));
  body.append(createElement('p', 'article-card__excerpt', article.excerpt));
  const meta = createElement('div', 'article-card__meta');
  meta.append(createElement('time', '', formatDate(article.published_at)));
  const author = data.indexes.membersById.get(article.author_member_id);
  if (author) meta.append(createElement('span', '', `執筆: ${author.name}`));
  body.append(meta);
  link.append(body);
  card.append(link);
  return card;
}

function renderArticlesPage(data) {
  const list = $('#article-list');
  if (!list) return;
  if (data.errors.articles) {
    setError(list, '記事一覧を読み込めませんでした。');
    return;
  }
  if (!data.articles.length) {
    setEmpty(list, '公開中の記事はまだありません。');
    return;
  }
  clearElement(list);
  data.articles.forEach((article) => list.append(createArticleCard(article, data)));
}

function renderLatestArticles(data) {
  const list = $('#latest-articles-list');
  if (!list) return;
  if (data.errors.articles) {
    setError(list, '最新の記事を読み込めませんでした。');
    return;
  }
  if (!data.articles.length) {
    setEmpty(list, '公開中の記事はまだありません。');
    return;
  }
  clearElement(list);
  data.articles.slice(0, 3).forEach((article) => list.append(createArticleCard(article, data)));
}

function createProfileContentCard(item) {
  const card = createElement('a', 'profile-content-card');
  card.href = item.destination_url;
  card.target = '_blank';
  card.rel = 'noopener';
  card.append(createElement('span', 'profile-content-card__type', item.content_type === 'tool' ? 'Tool' : 'Game'));
  card.append(createElement('span', 'profile-content-card__name', item.name));
  card.append(createElement('span', 'profile-content-card__cta', 'コンテンツを開く →'));
  return card;
}

function renderProfilePage(data) {
  const root = $('#profile-root');
  if (!root) return;
  const slug = new URLSearchParams(window.location.search).get('member') || '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    setError(root, 'プロフィールが見つかりません。');
    return;
  }
  if (data.errors.members) {
    setError(root, 'プロフィールを読み込めませんでした。');
    return;
  }
  const member = data.indexes.membersBySlug.get(slug);
  if (!member) {
    setEmpty(root, '指定されたプロフィールは公開されていません。');
    return;
  }

  clearElement(root);
  const header = createElement('section', 'profile-hero');
  header.append(createAvatar(member, 'profile-hero__avatar'));
  const headerInfo = createElement('div', 'profile-hero__info');
  headerInfo.append(createElement('p', 'section-label', 'Member Profile'));
  headerInfo.append(createElement('h1', 'profile-hero__name', member.name));
  if (member.role_title) headerInfo.append(createElement('p', 'profile-hero__role', member.role_title));
  const badges = memberBadges(member.id, data);
  if (badges.length) {
    const badgesWrap = createElement('div', 'role-badges');
    badges.forEach((badge) => badgesWrap.append(createBadge(badge)));
    headerInfo.append(badgesWrap);
  }
  header.append(headerInfo);
  root.append(header);

  const bio = createElement('section', 'profile-section');
  bio.append(createElement('h2', 'profile-section__title', '紹介'));
  bio.append(createElement('p', 'profile-section__text', member.bio || '紹介文は準備中です。'));
  if (member.started_on) bio.append(createElement('p', 'profile-section__started', `活動開始: ${formatMonth(member.started_on)}`));
  if (isSafeHttpsUrl(member.profile_url)) {
    const external = createElement('a', 'btn-outline', '外部プロフィールを見る');
    external.href = member.profile_url;
    external.target = '_blank';
    external.rel = 'noopener';
    bio.append(external);
  }
  root.append(bio);

  const contents = data.contentItems.filter((item) => item.author_member_id === member.id);
  const contentSection = createElement('section', 'profile-section');
  contentSection.append(createElement('h2', 'profile-section__title', '担当コンテンツ'));
  const grid = createElement('div', 'profile-content-grid');
  if (contents.length) contents.forEach((item) => grid.append(createProfileContentCard(item)));
  else grid.append(createElement('p', 'dynamic-state', '公開中の担当コンテンツはありません。'));
  contentSection.append(grid);
  root.append(contentSection);
}

function sanitizeArticleFragment(markup) {
  const template = document.createElement('template');
  template.innerHTML = text(markup);

  // Everything other than this explicit allowlist is either unwrapped as text
  // or removed if it can execute code / embed content.
  const allowedTags = new Set(['A', 'BLOCKQUOTE', 'BR', 'CODE', 'EM', 'FIGCAPTION', 'FIGURE', 'H2', 'H3', 'H4', 'HR', 'IMG', 'LI', 'OL', 'P', 'PRE', 'SPAN', 'STRONG', 'TABLE', 'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'UL']);
  const allowedClasses = new Set(['article-note', 'article-callout', 'article-lead']);
  const dangerousTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'FORM', 'INPUT', 'BUTTON', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'VIDEO', 'AUDIO', 'SOURCE']);

  // Work from deepest nodes upward so unsafe wrappers cannot preserve attributes.
  [...template.content.querySelectorAll('*')].reverse().forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      if (dangerousTags.has(node.tagName)) node.remove();
      else node.replaceWith(...node.childNodes);
      return;
    }

    const rawClass = node.getAttribute('class') || '';
    const rawHref = node.getAttribute('href') || '';
    const rawSrc = node.getAttribute('src') || '';
    const rawAlt = node.getAttribute('alt') || '';
    [...node.attributes].forEach((attribute) => node.removeAttribute(attribute.name));

    const safeClass = rawClass.split(/\s+/).find((name) => allowedClasses.has(name));
    if (safeClass) node.className = safeClass;

    if (node.tagName === 'A') {
      const safeLink = rawHref.startsWith('/') || rawHref.startsWith('./') || rawHref.startsWith('../') || isSafeHttpsUrl(rawHref);
      if (safeLink) {
        node.setAttribute('href', rawHref);
        if (isSafeHttpsUrl(rawHref)) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }

    if (node.tagName === 'IMG') {
      const safeImage = rawSrc.startsWith('assets/') || rawSrc.startsWith('../assets/') || isSafeHttpsUrl(rawSrc);
      if (!safeImage) {
        node.remove();
        return;
      }
      node.setAttribute('src', rawSrc);
      node.setAttribute('alt', rawAlt);
      node.setAttribute('loading', 'lazy');
      node.setAttribute('referrerpolicy', 'no-referrer');
    }
  });

  return template.content;
}

function setArticleSeo(article, author) {
  document.title = `${text(article.title)} | SancStudy`;
  const description = $('meta[name="description"]');
  if (description) description.setAttribute('content', text(article.excerpt));

  let canonical = $('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = `https://hourai-carrot.github.io/SancStudy/article.html?slug=${encodeURIComponent(article.slug)}`;

  $('#article-jsonld')?.remove();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: text(article.title),
    description: text(article.excerpt),
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: author ? { '@type': 'Person', name: text(author.name) } : undefined,
    publisher: { '@type': 'Organization', name: 'SancStudy' },
    mainEntityOfPage: canonical.href
  };
  if (isSafeHttpsUrl(article.cover_image_url)) schema.image = [article.cover_image_url];
  const schemaTag = document.createElement('script');
  schemaTag.id = 'article-jsonld';
  schemaTag.type = 'application/ld+json';
  schemaTag.textContent = JSON.stringify(schema);
  document.head.append(schemaTag);
}

async function renderArticlePage(data) {
  const root = $('#article-root');
  if (!root) return;
  const slug = new URLSearchParams(window.location.search).get('slug') || '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    setError(root, '記事が見つかりません。');
    return;
  }
  if (data.errors.articles) {
    setError(root, '記事情報を読み込めませんでした。');
    return;
  }
  const article = data.articles.find((item) => item.slug === slug);
  if (!article || !isSafeArticlePath(article.html_path)) {
    setEmpty(root, '指定された記事は公開されていません。');
    return;
  }

  clearElement(root);
  const author = data.indexes.membersById.get(article.author_member_id);
  setArticleSeo(article, author);
  const header = createElement('header', 'article-header');
  header.append(createElement('p', 'article-header__category', article.category));
  header.append(createElement('h1', 'article-header__title', article.title));
  header.append(createElement('p', 'article-header__excerpt', article.excerpt));
  const meta = createElement('div', 'article-header__meta');
  meta.append(createElement('time', '', formatDate(article.published_at)));
  if (author) meta.append(createAuthorChip(author, memberBadges(author.id, data)));
  header.append(meta);
  root.append(header);

  const body = createElement('article', 'article-body');
  body.setAttribute('aria-busy', 'true');
  body.append(createElement('p', 'dynamic-state dynamic-state--loading', '本文を読み込んでいます…'));
  root.append(body);

  try {
    const response = await fetch(article.html_path, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`Article fetch failed: ${response.status}`);
    const markup = await response.text();
    const fragment = sanitizeArticleFragment(markup);
    clearElement(body);
    body.append(fragment);
    body.setAttribute('aria-busy', 'false');
  } catch (error) {
    console.error('Could not load article body:', error);
    setError(body, '記事本文を読み込めませんでした。公開ファイルのパスを確認してください。');
    body.setAttribute('aria-busy', 'false');
  }
}

async function initDynamicContent() {
  if (!initSupabase()) return;
  try {
    const data = await loadPublicPortalData();
    renderCreatorSlots(data);
    renderHomeStats(data);
    renderAboutPage(data);
    renderNewsPage(data);
    renderArticlesPage(data);
    renderLatestArticles(data);
    renderProfilePage(data);
    await renderArticlePage(data);
  } catch (error) {
    // Each renderer has its own error/empty state. Never block existing site functions.
    console.error('Could not initialize dynamic portal content:', error);
  }
}

// ---------------------------------------------------------------------------
// Cookie notice and smooth scroll
// ---------------------------------------------------------------------------
function initCookieBanner() {
  const key = 'sancstudy_cookie_consent';
  if (localStorage.getItem(key)) return;
  const banner = document.createElement('aside');
  banner.className = 'cookie-banner';
  banner.setAttribute('aria-label', 'Cookieの利用について');

  const title = createElement('div', 'cookie-banner__title', 'Cookieの利用について');
  const paragraph = createElement('div', 'cookie-banner__text');
  paragraph.append('当サイトでは、利便性向上とアクセス解析のためにCookieを使用しています。詳細は');
  const privacy = createElement('a', '', 'プライバシーポリシー');
  privacy.href = 'privacy.html';
  paragraph.append(privacy, 'をご覧ください。');
  const actions = createElement('div', 'cookie-banner__actions');
  const accept = createElement('button', 'cookie-banner__btn cookie-banner__btn--accept', '同意する');
  accept.type = 'button';
  const settings = createElement('button', 'cookie-banner__btn cookie-banner__btn--settings', 'ブラウザ設定で無効にする方法');
  settings.type = 'button';
  actions.append(accept, settings);
  banner.append(title, paragraph, actions);
  document.body.append(banner);

  requestAnimationFrame(() => banner.classList.add('show'));
  accept.addEventListener('click', () => {
    localStorage.setItem(key, 'true');
    banner.classList.remove('show');
    window.setTimeout(() => banner.remove(), 300);
  });
  settings.addEventListener('click', () => { window.location.href = 'privacy.html#cookie-settings'; });
}

function initSmoothScroll() {
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (href === '#') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = href ? $(href) : null;
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function startApp() {
  initNav();
  initHeroSlider();
  initScrollReveal();
  initReviewForm();
  initSmoothScroll();
  initCookieBanner();

  if (initSupabase()) {
    updateReviewDisplay();
    initDynamicContent();
  } else {
    // The SDK is included with defer on every page; this only covers a slow CDN.
    window.setTimeout(() => {
      if (initSupabase()) {
        updateReviewDisplay();
        initDynamicContent();
      }
    }, 800);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startApp, { once: true });
else startApp();
