// ============================================
// CONTENT LOADING — fetches content/*.json (edited via /admin, the Decap
// CMS). If a fetch fails (offline, file missing, JSON malformed), the
// static HTML already in index.html stays exactly as it is — this is
// progressive enhancement, not a hard dependency on the content files.
// ============================================

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// Contact form backend — see SERVER_SETUP.md. Update once the API is
// deployed as its own Render Web Service (separate from this static site).
// While it's still the placeholder, the form falls back to opening the
// visitor's email app with the message pre-filled.
const CONTACT_API_BASE = 'https://REPLACE-WITH-YOUR-CONTACT-API-URL';

// Sections that carry a numbered "NN — LABEL" in their left column, in page order.
const LABELLED_SECTIONS = ['about', 'work', 'services', 'credentials', 'contact'];

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function loadContent() {
  const [site, work, services, process, credentials] = await Promise.all([
    fetchJson('content/site.json'),
    fetchJson('content/work.json'),
    fetchJson('content/services.json'),
    fetchJson('content/process.json'),
    fetchJson('content/credentials.json'),
  ]);
  if (!site && !work && !services && !process && !credentials) return null;
  return { site, work, services, process, credentials };
}

function setText(selector, value) {
  if (value === undefined || value === null) return;
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// "Let's talk." -> "Let's <em>talk.</em>" — the last word gets the gold italic.
function emphasiseLastWord(text) {
  const words = String(text).trim().split(/\s+/);
  const last = words.pop();
  return (words.length ? escapeHtml(words.join(' ')) + ' ' : '') + `<em>${escapeHtml(last)}</em>`;
}

function applySiteSettings(site) {
  if (!site) return;

  if (site.hero) {
    setText('.status-pill-text', site.hero.eyebrow);
    if (Array.isArray(site.hero.headline_lines) && site.hero.headline_lines.length) {
      // every line but the last reads plain; the last line is the gold italic
      const lines = site.hero.headline_lines.slice();
      const last = lines.pop();
      const headline = document.querySelector('.hero-headline');
      if (headline) {
        headline.innerHTML = (lines.length ? escapeHtml(lines.join(' ')) + ' ' : '') + `<em>${escapeHtml(last)}</em>`;
      }
    }
    setText('.hero-lead', site.hero.sub);
    const primary = document.getElementById('hero-primary');
    if (primary && site.hero.primary_cta_label) primary.querySelector('.btn-label').textContent = site.hero.primary_cta_label;
    if (primary && site.hero.primary_cta_target) primary.setAttribute('href', '#' + site.hero.primary_cta_target);
    const secondary = document.getElementById('hero-secondary');
    if (secondary && site.hero.secondary_cta_label) secondary.textContent = site.hero.secondary_cta_label;
    if (secondary && site.hero.secondary_cta_target) secondary.setAttribute('href', '#' + site.hero.secondary_cta_target);
  }

  ['about', 'work', 'services', 'credentials'].forEach((id) => {
    const block = site[id];
    if (!block) return;
    setText(`#${id} .section-eyebrow`, block.eyebrow);
    setText(`#${id} .section-heading`, block.heading);
  });
  if (site.about) setText('.about-body', site.about.body);

  if (site.process && (site.process.eyebrow || site.process.heading)) {
    const heading = String(site.process.heading || '').replace(/\.$/, '');
    setText('.process-caption', [site.process.eyebrow, heading].filter(Boolean).join(' — '));
  }

  if (site.contact) {
    setText('#contact .section-eyebrow', site.contact.eyebrow);
    const heading = document.querySelector('.contact-heading');
    if (heading && site.contact.heading) heading.innerHTML = emphasiseLastWord(site.contact.heading);
    setText('.contact-body', site.contact.body);
    if (site.contact.email) {
      const copyBtn = document.getElementById('copy-email');
      if (copyBtn) copyBtn.dataset.email = site.contact.email;
      setText('.contact-email', site.contact.email);
    }
    if (site.contact.linkedin_url) document.getElementById('linkedin-link')?.setAttribute('href', site.contact.linkedin_url);
    if (site.contact.github_url) document.getElementById('github-link')?.setAttribute('href', site.contact.github_url);
  }

  if (site.footer && site.footer.name) setText('.footer-name', site.footer.name);

  if (site.settings && site.settings.sections) {
    Object.entries(site.settings.sections).forEach(([id, visible]) => {
      const section = document.getElementById(id);
      if (!section) return;
      section.hidden = !visible;
      document.querySelectorAll(`[data-section="${id}"]`).forEach((link) => { link.hidden = !visible; });
    });
  }
}

// Renumber the "NN — LABEL" column so hidden sections don't leave gaps.
function numberSections() {
  let n = 0;
  LABELLED_SECTIONS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section || section.hidden) return;
    n += 1;
    const label = section.querySelector('.section-label');
    const eyebrow = label && label.querySelector('.section-eyebrow');
    if (label && eyebrow) {
      label.innerHTML = `${pad(n)} — <span class="section-eyebrow">${escapeHtml(eyebrow.textContent)}</span>`;
    }
  });
}

function renderProcess(items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = document.querySelector('.process-list');
  if (!list) return;
  list.innerHTML = items.map((item, i) => `
    <li class="process-cell">
      <span class="process-num">${pad(i + 1)}</span>
      <h3 class="process-title">${escapeHtml(item.title)}</h3>
      <p class="process-desc">${escapeHtml(item.description)}</p>
    </li>
  `).join('');
}

function renderWork(items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = document.querySelector('.work-list');
  if (!list) return;
  list.innerHTML = items.map((item, i) => {
    const tags = Array.isArray(item.tags) && item.tags.length
      ? `<ul class="tags">${item.tags.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
      : '';
    const flow = Array.isArray(item.flow) ? item.flow : [];
    const highlight = Number(item.highlight_step) || 0;
    const pipeline = flow.length
      ? `<ol class="pipeline${flow.length <= 4 ? ' pipeline--wide' : ''}">${flow.map((step, s) => {
          const isHl = s + 1 === highlight;
          const num = pad(s + 1) + (isHl && item.highlight_label ? ' · ' + escapeHtml(String(item.highlight_label).toUpperCase()) : '');
          return `<li class="pipe-step${isHl ? ' pipe-step--hl' : ''}"><span class="pipe-num">${num}</span><span class="pipe-name">${escapeHtml(step)}</span></li>`;
        }).join('')}</ol>`
      : '';
    return `
      <article class="build-card">
        <div class="build-meta"><span>BUILD ${pad(i + 1)}</span><span>${escapeHtml(item.meta || 'Solo · end-to-end')}</span></div>
        <h3 class="build-title">${escapeHtml(item.title)}</h3>
        ${tags}
        <p class="build-desc">${escapeHtml(item.description)}</p>
        ${pipeline}
      </article>
    `;
  }).join('');

  const runLogLink = document.querySelector('.run-log-link span');
  if (runLogLink && items[0].title) runLogLink.textContent = `Build 01 — ${items[0].title}`;
}

function renderServices(items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = document.querySelector('.services-list');
  if (!list) return;
  list.innerHTML = items.map((item) => `
    <li class="service-cell">
      <h3 class="service-title">${escapeHtml(item.title)}</h3>
      <p class="service-desc">${escapeHtml(item.description)}</p>
    </li>
  `).join('');
}

function renderCredentials(items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = document.querySelector('.cred-list');
  if (!list) return;
  list.innerHTML = items.map((item) => {
    let status = '';
    if (item.status === 'in_progress') {
      status = '<span class="pill pill--progress"><span class="dot dot--gold" aria-hidden="true"></span>IN PROGRESS</span>';
    } else if (item.status === 'link' && item.link_url) {
      status = `<a class="pill pill--link" href="${escapeHtml(item.link_url)}" target="_blank" rel="noopener">${escapeHtml(item.link_label || 'VERIFY')} →</a>`;
    } else if (item.status === 'completed') {
      status = '<span class="pill">COMPLETED</span>';
    }
    return `
      <li class="cred-row">
        <span class="cred-badge" aria-hidden="true">${escapeHtml(item.badge || '')}</span>
        <div class="cred-text">
          <h3 class="cred-title">${escapeHtml(item.title)}</h3>
          ${item.subtitle ? `<p class="cred-sub">${escapeHtml(item.subtitle)}</p>` : ''}
        </div>
        ${status}
      </li>
    `;
  }).join('');
}

// ============================================
// INTERACTIONS — header (menu, active link, progress), hero run log,
// copy-email, contact form, footer year. Runs once, after any content
// render above so it always binds to the final DOM.
// ============================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'CLOSE' : 'MENU';
  };

  toggle.addEventListener('click', () => setOpen(menu.hidden));
  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

function initScrollState() {
  const progress = document.getElementById('scroll-progress');
  const links = document.querySelectorAll('.nav-link, .mobile-link');

  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    if (progress) {
      progress.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
    }

    let active = '';
    LABELLED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hidden && el.getBoundingClientRect().top < window.innerHeight * 0.4) active = id;
    });
    if (max - window.scrollY < 4) active = 'contact';

    links.forEach((link) => {
      const isActive = link.dataset.section === active;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

function initRunLog() {
  const steps = Array.from(document.querySelectorAll('.run-step'));
  if (!steps.length) return;

  const render = (tick) => {
    steps.forEach((step, i) => {
      const done = i < tick;
      const current = i === tick;
      step.classList.toggle('is-done', done);
      step.classList.toggle('is-current', current);
      step.querySelector('.run-status').textContent = done
        ? 'DONE'
        : current ? (step.dataset.currentLabel || 'RUNNING') : 'QUEUED';
    });
  };

  // Reduced motion: leave every step showing as done, no loop.
  if (prefersReducedMotion) {
    render(steps.length);
    return;
  }

  // 0..4 walk through the steps; 5..7 hold everything "done" for a beat.
  let tick = 0;
  render(tick);
  setInterval(() => {
    tick = tick >= 7 ? 0 : tick + 1;
    render(tick);
  }, 1100);
}

function initCopyEmail() {
  const btn = document.getElementById('copy-email');
  const label = document.getElementById('copy-label');
  if (!btn || !label) return;
  let timer;

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.email);
    } catch (err) {
      // clipboard blocked (e.g. insecure context) — fall back to mailto
      window.location.href = 'mailto:' + btn.dataset.email;
      return;
    }
    label.textContent = 'COPIED ✓';
    label.classList.add('is-copied');
    clearTimeout(timer);
    timer = setTimeout(() => {
      label.textContent = 'COPY';
      label.classList.remove('is-copied');
    }, 1800);
  });
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  const submit = document.getElementById('cf-submit');
  const error = document.getElementById('cf-error');
  const sent = document.getElementById('form-sent');
  const sentTitle = document.getElementById('sent-title');
  const sentBody = document.getElementById('sent-body');
  const again = document.getElementById('send-another');
  if (!form) return;

  const useMailto = CONTACT_API_BASE.includes('REPLACE-WITH');
  const showError = (msg) => { error.textContent = msg; };

  form.addEventListener('input', () => showError(''));

  const showSent = (name, body) => {
    sentTitle.textContent = `Thanks, ${name}.`;
    sentBody.textContent = body;
    form.hidden = true;
    sent.hidden = false;
    sentTitle.focus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      message: form.message.value.trim(),
      company: form.company.value, // honeypot
    };

    if (!payload.name || !/\S+@\S+\.\S+/.test(payload.email) || !payload.message) {
      showError('Add your name, a valid email, and a message.');
      return;
    }

    if (useMailto) {
      const to = document.getElementById('copy-email')?.dataset.email || '';
      const subject = `Project enquiry from ${payload.name}`;
      const body = `${payload.message}\n\n— ${payload.name} (${payload.email})`;
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showSent(payload.name, 'Your email app should have opened with the message ready. I usually reply within a day or two.');
      return;
    }

    submit.disabled = true;
    try {
      const res = await fetch(`${CONTACT_API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok && body.ok) {
        showSent(payload.name, "Your message is on its way. I usually reply within a day or two.");
      } else if (res.status === 429) {
        showError(body.error || 'Please wait a moment before sending another message.');
      } else if (res.status === 422) {
        showError(body.error || 'Please check the form and try again.');
      } else {
        throw new Error('unexpected response');
      }
    } catch (err) {
      showError('Something went wrong sending that — try again, or email me directly.');
    } finally {
      submit.disabled = false;
    }
  });

  again.addEventListener('click', () => {
    form.message.value = '';
    sent.hidden = true;
    form.hidden = false;
    form.message.focus();
  });
}

function initInteractions() {
  initMenu();
  initScrollState();
  initRunLog();
  initCopyEmail();
  initContactForm();

  const yearEl = document.querySelector('.footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

(async () => {
  const content = await loadContent();
  if (content) {
    applySiteSettings(content.site);
    if (content.process) renderProcess(content.process.items);
    if (content.work) renderWork(content.work.items);
    if (content.services) renderServices(content.services.items);
    if (content.credentials) renderCredentials(content.credentials.items);
  }
  numberSections();
  initInteractions();
})();
