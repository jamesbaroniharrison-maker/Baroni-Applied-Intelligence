// Site v2 (freelance-first). Plain JS, no build step. Content comes from
// content/*.json (edited via /admin); the static HTML in index.html is the
// fallback if any fetch fails.

// Contact form backend - see SERVER_SETUP.md. Update once the API is
// deployed as its own Render Web Service. While it's still the placeholder,
// the form opens the visitor's email app with the note pre-filled.
const CONTACT_API_BASE = 'https://REPLACE-WITH-YOUR-CONTACT-API-URL';

// Numbered "NN - LABEL" sections, in page order.
const LABELLED_SECTIONS = ['how', 'work', 'services', 'faq', 'credentials', 'book'];
// Everything the rail / active-section tracking follows, in page order.
const TRACKED_SECTIONS = ['proof', ...LABELLED_SECTIONS];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ============================================
// CONTENT LOADING
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

// Plain text followed by the gold italic <em> part.
function withEmphasis(lead, emphasis) {
  return (lead ? escapeHtml(lead) + (emphasis ? ' ' : '') : '') + (emphasis ? `<em>${escapeHtml(emphasis)}</em>` : '');
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
    if (site.hero.primary_cta_label) setText('.hero-primary .btn-label', site.hero.primary_cta_label);
    if (site.hero.primary_cta_target) $('.hero-primary').setAttribute('href', '#' + site.hero.primary_cta_target);
    if (site.hero.secondary_cta_label) setText('.hero-secondary', site.hero.secondary_cta_label);
    if (site.hero.secondary_cta_target) $('.hero-secondary').setAttribute('href', '#' + site.hero.secondary_cta_target);
  }

  LABELLED_SECTIONS.forEach((id) => {
    const block = site[id];
    if (!block) return;
    const label = $(`#${id} .section-label`);
    if (block.eyebrow && label) label.dataset.eyebrow = block.eyebrow;
    if (id !== 'book') setText(`#${id} .h2`, block.heading);
  });

  if (site.book) {
    if (site.book.heading) $('.contact-title').innerHTML = withEmphasis(site.book.heading, site.book.heading_emphasis);
    setText('.contact-body', site.book.body);
    if (site.book.email) {
      $('.copy-email').dataset.email = site.book.email;
      setText('.copy-email .email', site.book.email);
      $('.footer-pm').setAttribute('href', `mailto:${site.book.email}?subject=${encodeURIComponent('AI PM enquiry')}`);
    }
    if (site.book.linkedin_url) $$('.linkedin-link').forEach((a) => a.setAttribute('href', site.book.linkedin_url));
    if (site.book.github_url) $$('.github-link').forEach((a) => a.setAttribute('href', site.book.github_url));
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
    const flow = Array.isArray(item.flow) ? item.flow : [];
    // highlighted steps: [{ step, label }], e.g. 04 · YOU (older single-field items still work)
    const keys = new Map((item.highlights || (item.highlight_step ? [{ step: item.highlight_step, label: item.highlight_label }] : []))
      .map((h) => [Number(h.step), h.label || '']));
    const strip = flow.length ? `<ol class="strip">${flow.map((step, s) => {
      const isKey = keys.has(s + 1);
      const tag = keys.get(s + 1);
      const num = pad(s + 1) + (isKey && tag ? ' · ' + escapeHtml(String(tag).toUpperCase()) : '');
      const conn = s < flow.length - 1 ? '<i class="conn"></i>' : '';
      return `<li class="strip-item"><div class="strip-step${isKey ? ' is-key' : ''}"><div class="strip-num">${num}</div><div class="strip-label">${escapeHtml(step)}</div></div>${conn}</li>`;
    }).join('')}</ol>` : '';
    const tags = (item.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('');
    const label = item.label ? ' · ' + escapeHtml(String(item.label).toUpperCase()) : '';
    return `
      <article class="build">
        <div class="build-meta"><span>BUILD ${pad(i + 1)}${label}</span><span>${escapeHtml(item.meta || 'Solo · end-to-end')}</span></div>
        <h3 class="h3">${withEmphasis(item.title, item.title_emphasis)}</h3>
        <p class="build-desc">${escapeHtml(item.description)}</p>
        ${strip}
        ${tags ? `<div class="build-foot"><div class="tags">${tags}</div></div>` : ''}
      </article>`;
  }).join('');
}

// The full-width "AI PM / embedded ops" row stays; only the cells before it are replaced.
function renderServices(items) {
  const grid = $('.services-grid');
  $$('.svc', grid).forEach((el) => el.remove());
  grid.insertAdjacentHTML('afterbegin', items.map((item) => `
    <div class="cell svc"><div class="svc-title">${escapeHtml(item.title)}</div><p>${escapeHtml(item.description)}</p></div>
  `).join(''));
}

function renderFaq(items) {
  $('.faq-list').innerHTML = items.map((item, i) => {
    const open = i === 0;
    return `
      <div class="faq-item">
        <button type="button" class="faq-q" aria-expanded="${open}" aria-controls="faq-a-${i + 1}" id="faq-q-${i + 1}"><span>${escapeHtml(item.question)}</span><span class="faq-sign" aria-hidden="true">${open ? '−' : '+'}</span></button>
        <p class="faq-a" id="faq-a-${i + 1}" role="region" aria-labelledby="faq-q-${i + 1}"${open ? '' : ' hidden'}>${escapeHtml(item.answer)}</p>
      </div>`;
  }).join('');
}

function renderCredentials(items) {
  $('.creds').innerHTML = items.map((item) => {
    let status = '';
    if (item.status === 'in_progress') {
      status = '<span class="cred-status cred-status--gold">IN PROGRESS</span>';
    } else if (item.status === 'completed') {
      status = '<span class="cred-status">COMPLETED</span>';
    } else if (item.status === 'link' && item.link_url) {
      status = `<a class="cred-status cred-status--link" href="${escapeHtml(item.link_url)}" target="_blank" rel="noopener">${escapeHtml(String(item.link_label || 'Verify').toUpperCase())} ↗</a>`;
    }
    return `<li class="cred"><div class="cred-text"><span class="cred-title">${escapeHtml(item.title)}</span>${item.subtitle ? `<span class="cred-sub">${escapeHtml(item.subtitle)}</span>` : ''}</div>${status}</li>`;
  }).join('');
}

// "01 - HOW IT WORKS" etc., numbered over visible sections only.
function numberSections() {
  let n = 0;
  LABELLED_SECTIONS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section || section.hidden) return;
    const label = $('.section-label', section);
    n += 1;
    if (label) label.textContent = `${pad(n)} - ${label.dataset.eyebrow}`;
  });
}

const hasItems = (json) => json && Array.isArray(json.items) && json.items.length;

async function loadContent() {
  const [site, work, services, process, credentials, faq] = await Promise.all([
    fetchJson('content/site.json'),
    fetchJson('content/work.json'),
    fetchJson('content/services.json'),
    fetchJson('content/process.json'),
    fetchJson('content/credentials.json'),
    fetchJson('content/faq.json'),
  ]);
  if (site) applySite(site);
  if (hasItems(process)) renderProcess(process.items);
  if (hasItems(work)) renderWork(work.items);
  if (hasItems(services)) renderServices(services.items);
  if (hasItems(credentials)) renderCredentials(credentials.items);
  if (hasItems(faq)) renderFaq(faq.items);
  numberSections();
}

// ============================================
// INTERACTIONS
// ============================================

// Run-log animation - state changes only, no movement, so it runs
// regardless of reduced-motion. Ticks 5-7 hold everything "done".
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

// Case-study step strips light up like the hero pipeline, but faster: each
// strip starts on its own once its step boxes are on screen, lights its
// steps in turn (current = gold), then stays lit. Every strip takes the same
// total time whatever its step count. Runs once per strip; state changes
// only, so it runs regardless of reduced motion.
function initStrips() {
  const TOTAL_MS = 2750; // start of the first step to all steps lit
  $$('.build .strip').forEach((strip) => {
    const steps = $$('.strip-step', strip);
    const conns = $$('.conn', strip);
    const paint = (tick) => {
      steps.forEach((el, i) => {
        el.classList.toggle('is-done', i < tick);
        el.classList.toggle('is-current', i === tick);
      });
      conns.forEach((el, i) => el.classList.toggle('is-done', i < tick));
    };
    paint(-1); // nothing lit until the boxes are on screen

    const start = () => {
      let tick = 0;
      paint(tick);
      const timer = setInterval(() => {
        tick += 1;
        paint(tick);
        if (tick >= steps.length) clearInterval(timer);
      }, TOTAL_MS / steps.length);
    };

    // most of the strip visible, not just the top of the card
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      start();
    }, { threshold: 0.75 });
    observer.observe(strip);
  });
}

// Reduced-rate spots left this quarter. Not a live count: it steps down
// through each calendar quarter - 2 left in the first third, 1 in the
// middle third, 0 in the last - then resets when the next quarter starts.
function initSpots() {
  const now = new Date();
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const qStart = new Date(now.getFullYear(), qStartMonth, 1);
  const qEnd = new Date(now.getFullYear(), qStartMonth + 3, 1);
  const progress = (now - qStart) / (qEnd - qStart);
  const left = progress < 1 / 3 ? 2 : progress < 2 / 3 ? 1 : 0;
  const line = $('.spots-left');
  if (!line) return;
  line.classList.toggle('is-full', left === 0);
  if (left > 0) {
    setText('.spots-text', `${left} of 2 spots left this quarter`);
  } else {
    const opens = qEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    setText('.spots-text', `This quarter's spots are taken - next 2 open ${opens}`);
    setText('.spots-link', 'ASK ABOUT NEXT QUARTER →');
  }
}

// Active nav, the left scroll rail and the mobile bar.
function initScroll() {
  const navLinks = $$('.nav-links a');
  const railFill = $('.rail-fill');
  const railNodes = $$('.rail-node');
  const mobileBar = $('.mobile-bar');
  const small = window.matchMedia('(max-width: 699px)');

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    let active = '';
    TRACKED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hidden && el.getBoundingClientRect().top < innerHeight * 0.4) active = id;
    });
    if (max - scrollY < 4) active = 'book';
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === active));

    const pct = max > 0 ? Math.min(100, (scrollY / max) * 100) : 0;

    // Gradient fill grows with scroll; each dot sits where the fill
    // arrives when its section reaches the header.
    railFill.style.clipPath = 'inset(0 0 ' + (100 - pct) + '% 0)';
    railNodes.forEach((n) => {
      const sec = document.getElementById(n.dataset.rail);
      const p = sec && max > 0 ? Math.min(1, Math.max(0, (sec.offsetTop - 70) / max)) * 100 : 0;
      n.style.top = p + '%';
      const isActive = n.dataset.rail === active;
      n.classList.toggle('is-active', isActive);
      n.classList.toggle('is-passed', !isActive && p <= pct + 0.5);
      if (isActive) n.setAttribute('aria-current', 'true');
      else n.removeAttribute('aria-current');
    });

    mobileBar.hidden = !(small.matches && pct > 3 && active !== 'book');
  };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('load', onScroll); // fonts/content can shift section offsets
  onScroll();
  setTimeout(onScroll, 600);
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

// One answer open at a time; clicking the open one closes it.
function initFaq() {
  $('.faq-list').addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-q');
    if (!btn) return;
    const opening = btn.getAttribute('aria-expanded') !== 'true';
    $$('.faq-q').forEach((q) => {
      const open = q === btn && opening;
      q.setAttribute('aria-expanded', String(open));
      $('.faq-sign', q).textContent = open ? '−' : '+';
      document.getElementById(q.getAttribute('aria-controls')).hidden = !open;
    });
  });
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
    // The note is optional, so say so rather than sending an empty body.
    const message = form.message.value.trim() || '(No details yet - happy to explain on a call.)';
    if (!name || !/\S+@\S+\.\S+/.test(email)) {
      err.textContent = 'Add your name and a valid email.';
      return;
    }

    if (useMailto) {
      const to = $('.copy-email').dataset.email;
      const subj = encodeURIComponent('Scope call enquiry from ' + name);
      const body = encodeURIComponent(message + '\n\n- ' + name + ' (' + email + ')');
      location.href = 'mailto:' + to + '?subject=' + subj + '&body=' + body;
      showSuccess(name, "Your email app should have opened with the note ready. I'll reply within 24 hours.");
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
        showSuccess(name, "Your note is on its way. I'll reply within 24 hours.");
      } else if (res.status === 429) {
        err.textContent = data.error || 'Please wait a moment before sending another note.';
      } else if (res.status === 422) {
        err.textContent = data.error || 'Please check the form and try again.';
      } else {
        throw new Error('unexpected response');
      }
    } catch (e2) {
      err.textContent = 'Something went wrong sending that - try again, or email me directly.';
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
initSpots();
initMenu();
initCopyEmail();
initForm();
setText('.footer-year', new Date().getFullYear());
loadContent().finally(() => {
  initFaq();
  initStrips();
  initScroll();
});
