// Based on the design handoff's reference build (Temporary/New/reference_build/main.js),
// plus: content loading from content/*.json (edited via /admin), the contact
// form backend, and section numbering that skips hidden sections.

// Contact form backend — see SERVER_SETUP.md. Update once the API is
// deployed as its own Render Web Service. While it's still the placeholder,
// the form opens the visitor's email app with the message pre-filled.
const CONTACT_API_BASE = 'https://REPLACE-WITH-YOUR-CONTACT-API-URL';

const SECTION_IDS = ['about', 'work', 'services', 'credentials', 'contact'];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ============================================
// CONTENT LOADING — if a fetch fails (offline, file missing, JSON
// malformed), the static HTML in index.html stays exactly as it is.
// ============================================

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

function setText(selector, value) {
  if (value === undefined || value === null) return;
  const el = $(selector);
  if (el) el.textContent = value;
}

// Plain text, with the last part wrapped in the gold italic <em>.
function withEmphasis(lead, last) {
  return (lead ? escapeHtml(lead) + ' ' : '') + `<em>${escapeHtml(last)}</em>`;
}

function applySite(site) {
  if (site.hero) {
    setText('.status-text', site.hero.eyebrow);
    const lines = Array.isArray(site.hero.headline_lines) ? site.hero.headline_lines.slice() : [];
    if (lines.length) {
      const last = lines.pop();
      $('.hero-title').innerHTML = withEmphasis(lines.join(' '), last);
    }
    setText('.lead', site.hero.sub);
    const primary = $('.hero-primary');
    if (site.hero.primary_cta_label) setText('.hero-primary .btn-label', site.hero.primary_cta_label);
    if (site.hero.primary_cta_target) primary.setAttribute('href', '#' + site.hero.primary_cta_target);
    const secondary = $('.hero-secondary');
    if (site.hero.secondary_cta_label) secondary.textContent = site.hero.secondary_cta_label;
    if (site.hero.secondary_cta_target) secondary.setAttribute('href', '#' + site.hero.secondary_cta_target);
  }

  SECTION_IDS.forEach((id) => {
    const block = site[id];
    const label = $(`#${id} .section-label`);
    if (block && block.eyebrow && label) label.dataset.eyebrow = block.eyebrow;
    if (block && id !== 'contact') setText(`#${id} .h2`, block.heading);
  });
  if (site.about) setText('.about-body', site.about.body);

  if (site.process && (site.process.eyebrow || site.process.heading)) {
    const heading = String(site.process.heading || '').replace(/\.$/, '');
    setText('#about .caption', [site.process.eyebrow, heading].filter(Boolean).join(' — ').toUpperCase());
  }

  if (site.contact) {
    if (site.contact.heading) {
      const words = String(site.contact.heading).trim().split(/\s+/);
      const last = words.pop();
      $('.contact-title').innerHTML = withEmphasis(words.join(' '), last);
    }
    setText('.contact-body', site.contact.body);
    if (site.contact.email) {
      $('.copy-email').dataset.email = site.contact.email;
      setText('.copy-email .email', site.contact.email);
    }
    if (site.contact.linkedin_url) $('.linkedin-link').setAttribute('href', site.contact.linkedin_url);
    if (site.contact.github_url) $('.github-link').setAttribute('href', site.contact.github_url);
  }

  if (site.footer && site.footer.name) setText('.footer-name', site.footer.name);

  const visible = site.settings && site.settings.sections;
  if (visible) {
    Object.entries(visible).forEach(([id, show]) => {
      const section = document.getElementById(id);
      if (section) section.hidden = !show;
      $$(`[data-nav="${id}"], [data-menu="${id}"], [data-rail="${id}"]`).forEach((el) => { el.hidden = !show; });
    });
  }
}

function renderProcess(items) {
  $('.process-grid').innerHTML = items.map((item, i) => `
    <div class="cell"><div class="num">${pad(i + 1)}</div><div class="cell-title">${escapeHtml(item.title)}</div><p>${escapeHtml(item.description)}</p></div>
  `).join('');
}

function renderWork(items) {
  $('.builds').innerHTML = items.map((item, i) => {
    const tags = (item.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('');
    const flow = Array.isArray(item.flow) ? item.flow : [];
    const key = Number(item.highlight_step) || 0;
    const strip = flow.length ? `<div class="strip">${flow.map((step, s) => {
      const isKey = s + 1 === key;
      const num = pad(s + 1) + (isKey && item.highlight_label ? ' · ' + escapeHtml(String(item.highlight_label).toUpperCase()) : '');
      const conn = s < flow.length - 1 ? '<i class="conn"></i>' : '';
      return `<div class="strip-step${isKey ? ' is-key' : ''}"><div class="strip-num">${num}</div><div class="strip-label">${escapeHtml(step)}</div></div>${conn}`;
    }).join('')}</div>` : '';
    return `
      <article class="build">
        <div class="build-meta"><span>BUILD ${pad(i + 1)}</span><span>${escapeHtml(item.meta || 'Solo · end-to-end')}</span></div>
        <h3 class="h3">${escapeHtml(item.title)}</h3>
        ${tags ? `<div class="tags">${tags}</div>` : ''}
        <p class="build-desc">${escapeHtml(item.description)}</p>
        ${strip}
      </article>`;
  }).join('');
  if (items[0] && items[0].title) setText('.runlog-foot-label', `Build 01 — ${items[0].title}`);
}

function renderServices(items) {
  $('.services-grid').innerHTML = items.map((item) => `
    <div class="cell svc"><div class="svc-title">${escapeHtml(item.title)}</div><p>${escapeHtml(item.description)}</p></div>
  `).join('');
}

function renderCredentials(items) {
  $('.creds').innerHTML = items.map((item) => {
    let status = '';
    if (item.status === 'in_progress') {
      status = '<span class="pill pill-gold"><span class="dot dot-gold pulse"></span>IN PROGRESS</span>';
    } else if (item.status === 'completed') {
      status = '<span class="pill">COMPLETED</span>';
    } else if (item.status === 'link' && item.link_url) {
      status = `<a class="pill pill-link" href="${escapeHtml(item.link_url)}" target="_blank" rel="noopener">${escapeHtml(String(item.link_label || 'Verify').toUpperCase())} →</a>`;
    }
    return `<li class="cred"><span class="badge">${escapeHtml(item.badge || '')}</span><div class="cred-text"><div class="cred-title">${escapeHtml(item.title)}</div>${item.subtitle ? `<div class="cred-sub">${escapeHtml(item.subtitle)}</div>` : ''}</div>${status}</li>`;
  }).join('');
}

// "01 — ABOUT" etc., numbered over visible sections only.
function numberSections() {
  let n = 0;
  SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section || section.hidden) return;
    const label = $('.section-label', section);
    n += 1;
    if (label) label.textContent = `${pad(n)} — ${label.dataset.eyebrow}`;
  });
}

async function loadContent() {
  const [site, work, services, process, credentials] = await Promise.all([
    fetchJson('content/site.json'),
    fetchJson('content/work.json'),
    fetchJson('content/services.json'),
    fetchJson('content/process.json'),
    fetchJson('content/credentials.json'),
  ]);
  if (site) applySite(site);
  if (process && Array.isArray(process.items) && process.items.length) renderProcess(process.items);
  if (work && Array.isArray(work.items) && work.items.length) renderWork(work.items);
  if (services && Array.isArray(services.items) && services.items.length) renderServices(services.items);
  if (credentials && Array.isArray(credentials.items) && credentials.items.length) renderCredentials(credentials.items);
  numberSections();
}

// ============================================
// INTERACTIONS
// ============================================

// Run-log animation — state changes only, no movement, so it runs
// regardless of reduced-motion. Ticks 5–7 hold everything "done".
function initRunLog() {
  const steps = $$('.runlog .step:not(.step-joke)');
  // The fax row never runs — it sits queued, then gets skipped once the
  // real steps finish.
  const joke = $('.runlog .step-joke');
  let tick = 0;
  const paint = () => {
    steps.forEach((el, i) => {
      const done = i < tick, run = i === tick;
      el.classList.toggle('is-done', done);
      el.classList.toggle('is-run', run);
      $('.step-status', el).textContent = done ? 'DONE' : run ? (el.dataset.await ? 'AWAITING' : 'RUNNING') : 'QUEUED';
    });
    if (joke) {
      const skipped = tick >= steps.length;
      joke.classList.toggle('is-skipped', skipped);
      $('.step-status', joke).textContent = skipped ? 'SKIPPED' : 'QUEUED';
    }
  };
  paint();
  setInterval(() => { tick = tick >= 7 ? 0 : tick + 1; paint(); }, 1100);
}

// Active nav and the left scroll rail.
function initScroll() {
  const navLinks = $$('.nav-links a');
  const railFill = $('.rail-fill');
  const railNodes = $$('.rail-node');

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    let active = '';
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hidden && el.getBoundingClientRect().top < innerHeight * 0.4) active = id;
    });
    if (max - scrollY < 4) active = 'contact';
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === active));

    const pct = max > 0 ? Math.min(100, (scrollY / max) * 100) : 0;

    // Gradient fill grows with scroll; each node sits where the fill
    // arrives when its section reaches the header.
    railFill.style.clipPath = 'inset(0 0 ' + (100 - pct) + '% 0)';
    railNodes.forEach((n) => {
      const sec = document.getElementById(n.dataset.rail);
      const p = sec && max > 0 ? Math.min(1, Math.max(0, (sec.offsetTop - 70) / max)) * 100 : 0;
      n.style.top = p + '%';
      n.classList.toggle('is-active', n.dataset.rail === active);
      n.classList.toggle('is-passed', n.dataset.rail !== active && p <= pct + 0.5);
    });
  };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('load', onScroll); // fonts/content can shift section offsets
  onScroll();
}

function initMenu() {
  const menuBtn = $('.menu-btn');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.textContent = open ? 'CLOSE' : 'MENU';
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('resize', () => { if (innerWidth >= 900) setMenu(false); });
}

function initCopyEmail() {
  const copyBtn = $('.copy-email');
  const copyLabel = $('.copy-label');
  let copyT;
  copyBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(copyBtn.dataset.email).catch(() => {});
    copyLabel.textContent = 'COPIED ✓';
    copyLabel.classList.add('is-copied');
    clearTimeout(copyT);
    copyT = setTimeout(() => {
      copyLabel.textContent = 'COPY';
      copyLabel.classList.remove('is-copied');
    }, 1800);
  });
}

function initForm() {
  const form = $('.contact-form');
  const err = $('.form-error');
  const success = $('.form-success');
  const submitBtn = $('button[type="submit"]', form);
  const useMailto = CONTACT_API_BASE.includes('REPLACE-WITH');

  const showSuccess = (name, message) => {
    $('.success-name').textContent = name;
    $('.success-body').textContent = message;
    form.hidden = true;
    success.hidden = false;
    $('.success-title').focus();
  };

  form.addEventListener('input', () => { err.textContent = ''; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    if (!name || !/\S+@\S+\.\S+/.test(email) || !message) {
      err.textContent = 'Add your name, a valid email, and a message.';
      return;
    }

    if (useMailto) {
      const to = $('.copy-email').dataset.email;
      const subj = encodeURIComponent('Project enquiry from ' + name);
      const body = encodeURIComponent(message + '\n\n— ' + name + ' (' + email + ')');
      location.href = 'mailto:' + to + '?subject=' + subj + '&body=' + body;
      showSuccess(name, 'Your email app should have opened with the message ready. I usually reply within a day or two.');
      return;
    }

    submitBtn.disabled = true;
    try {
      const res = await fetch(`${CONTACT_API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, company: form.company.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        showSuccess(name, 'Your message is on its way. I usually reply within a day or two.');
      } else if (res.status === 429) {
        err.textContent = data.error || 'Please wait a moment before sending another message.';
      } else if (res.status === 422) {
        err.textContent = data.error || 'Please check the form and try again.';
      } else {
        throw new Error('unexpected response');
      }
    } catch (e2) {
      err.textContent = 'Something went wrong sending that — try again, or email me directly.';
    } finally {
      submitBtn.disabled = false;
    }
  });

  $('.reset-form').addEventListener('click', () => {
    form.message.value = '';
    form.hidden = false;
    success.hidden = true;
    form.message.focus();
  });
}

initRunLog();
initMenu();
initCopyEmail();
initForm();
setText('.footer-year', new Date().getFullYear());
loadContent().finally(initScroll);
