// Site v2 (freelance-first). Plain JS, no build step. Content comes from
// content/*.json (edited via /admin); the static HTML in index.html is the
// fallback if any fetch fails.

// Contact form back end - see CONTACT_SETUP_GMAIL.md (Google Apps Script,
// paste its full ".../exec" address here) or CONTACT_SETUP.md (Cloudflare
// Worker, paste its base address). While it's still the placeholder, the form
// only opens the visitor's own email app with the note pre-filled, so
// nothing is sent or stored.
const CONTACT_API_BASE = 'https://script.google.com/macros/s/AKfycbzRIVVDXSVmHsGYT8t143YNNz1DgjkftDlVWt3qrehW2-Jg0dPIaVBzoxS0_TtlTZxcEg/exec';

// Numbered "NN - LABEL" sections, in page order.
const LABELLED_SECTIONS = ['how', 'work', 'services', 'faq', 'book', 'credentials'];
// Everything the rail / active-section tracking follows, in page order.
const TRACKED_SECTIONS = ['automate', 'proof', ...LABELLED_SECTIONS];

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
      <article class="build" id="build-${pad(i + 1)}"${item.image ? ` data-image="${escapeHtml(item.image)}"` : ''}${item.visual ? ` data-visual="${escapeHtml(item.visual)}"` : ''}>
        <div class="build-meta"><span>BUILD ${pad(i + 1)}${label}</span><span>${escapeHtml(item.meta || 'Solo · end-to-end')}</span></div>
        <h3 class="h3">${withEmphasis(item.title, item.title_emphasis)}</h3>
        <p class="build-desc">${escapeHtml(item.description)}</p>
        ${strip}
        ${tags ? `<div class="build-foot"><div class="tags">${tags}</div></div>` : ''}
      </article>`;
  }).join('');
}

// Case-study visuals go between the description and the step strip. A card
// with data-image shows that screenshot; otherwise data-visual picks one of
// the placeholder mock-ups in <template id="visual-…"> in index.html.
function applyVisuals() {
  $$('.build').forEach((card) => {
    if ($('.build-visual', card)) return;
    let visual = null;
    if (card.dataset.image) {
      visual = document.createElement('div');
      visual.className = 'build-visual build-visual--image';
      const img = document.createElement('img');
      img.src = card.dataset.image;
      img.alt = '';
      img.loading = 'lazy';
      visual.append(img);
    } else if (card.dataset.visual) {
      const tpl = document.getElementById('visual-' + card.dataset.visual);
      if (tpl) visual = tpl.content.firstElementChild.cloneNode(true);
    }
    if (!visual) return;
    const before = $('.strip', card) || $('.build-foot', card);
    card.insertBefore(visual, before);
  });
}

// The full-width "AI PM / embedded ops" row stays; only the cells before it are
// replaced. A service can point at a case study by its label; the build
// number comes from the case studies' current order, so it never goes stale.
function renderServices(items, workItems) {
  const labels = (workItems || []).map((w) => w.label);
  const grid = $('.services-grid');
  $$('.svc', grid).forEach((el) => el.remove());
  grid.insertAdjacentHTML('afterbegin', items.map((item) => {
    const k = labels.indexOf(item.case_study) + 1;
    const link = k ? `<a class="svc-link" href="#build-${pad(k)}">→ Build ${pad(k)}: ${escapeHtml(item.case_study)}</a>` : '';
    return `<div class="cell svc"><div class="svc-title">${escapeHtml(item.title)}</div><p>${escapeHtml(item.description)}</p>${link}</div>`;
  }).join(''));
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
    // optional small note under the status, e.g. "Completing in 2027"
    if (item.note) status = `<span class="cred-state">${status}<span class="cred-note">${escapeHtml(item.note)}</span></span>`;
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
  if (hasItems(services)) renderServices(services.items, hasItems(work) ? work.items : null);
  if (hasItems(credentials)) renderCredentials(credentials.items);
  if (hasItems(faq)) renderFaq(faq.items);
  applyVisuals();
  numberSections();
}

// ============================================
// OPENING ANIMATION
// ============================================

// The sunflower mark's dots [cx, cy, r, colour], copied from
// brand/baroni-mark-lg.svg so the flower lands exactly on the hero watermark.
const MARK_DOTS = [[30.73,33.16,0.73,"8fb69a"],[32.26,29.03,0.79,"90b69a"],[34.34,35.05,0.82,"90b699"],[27.52,31.21,0.85,"91b699"],[36.36,29.23,0.87,"91b698"],[30.52,37.51,0.89,"92b698"],[29.14,26.49,0.91,"93b698"],[38.26,34.29,0.93,"93b697"],[25.44,34.71,0.95,"94b697"],[35.18,25.21,0.96,"94b597"],[34.36,39.52,0.98,"95b596"],[24.86,27.86,0.99,"95b596"],[40.4,30.15,1.01,"96b595"],[26.86,39.31,1.02,"97b595"],[30.81,22.81,1.03,"97b595"],[39.33,38.17,1.04,"98b594"],[22.12,32.41,1.06,"98b594"],[39.22,24.82,1.07,"99b594"],[31.52,42.45,1.08,"9ab593"],[25.12,23.75,1.09,"9ab593"],[42.92,33.47,1.1,"9bb592"],[22.74,38.44,1.11,"9bb592"],[34.53,20.74,1.13,"9cb592"],[37.86,42.23,1.14,"9db591"],[20.53,28.34,1.15,"9db591"],[43.15,26.85,1.16,"9eb591"],[27.16,43.56,1.17,"9eb590"],[27.68,19.99,1.18,"9fb490"],[43.5,38.04,1.19,"9fb48f"],[19.22,35.37,1.2,"a0b48f"],[39.27,20.7,1.21,"a1b48f"],[34.31,45.46,1.22,"a1b48e"],[21.03,23.51,1.23,"a2b48e"],[46.04,30.84,1.23,"a2b48e"],[22.29,42.49,1.24,"a3b48d"],[32.07,17.5,1.25,"a4b48d"],[41.88,42.89,1.26,"a4b48c"],[17.16,30.62,1.27,"a5b48c"],[44.03,22.87,1.28,"a5b48c"],[29.26,47.05,1.29,"a6b48b"],[23.75,18.89,1.3,"a6b48b"],[47.12,36.14,1.3,"a7b48b"],[17.89,39.24,1.31,"a8b48a"],[37.58,16.95,1.32,"a8b48a"],[38.12,47.03,1.33,"a9b489"],[17.17,24.97,1.34,"a9b389"],[47.86,27.11,1.35,"aab389"],[23.52,46.47,1.35,"abb388"],[28.44,15.43,1.36,"abb388"],[45.96,41.91,1.37,"acb387"],[14.84,34.14,1.38,"acb387"],[43.32,18.7,1.39,"adb387"],[32.64,49.62,1.39,"aeb386"],[19.51,19.32,1.4,"aeb386"],[49.94,32.92,1.41,"afb386"],[18.03,43.55,1.42,"afb385"],[34.53,13.88,1.42,"b0b385"],[42.46,47.2,1.43,"b0b384"],[13.86,27.83,1.44,"b1b384"],[48.33,22.75,1.45,"b2b384"],[26.16,50,1.45,"b2b383"],[24.08,14.64,1.46,"b3b383"],[49.71,39.51,1.47,"b3b383"],[13.72,38.47,1.47,"b4b282"],[41.18,14.75,1.48,"b5b282"],[36.93,51.07,1.49,"b5b281"],[15.36,21.19,1.5,"b6b281"],[51.72,28.71,1.5,"b6b281"],[19.59,47.86,1.51,"b7b280"],[30.42,11.78,1.52,"b8b280"],[46.93,45.95,1.52,"b8b280"],[11.43,31.8,1.53,"b9b27f"],[47.41,18.15,1.54,"b9b27f"],[29.97,52.76,1.54,"bab27f"],[19.38,15.21,1.55,"bab27e"],[52.78,35.89,1.56,"bab27e"],[13.93,43.25,1.56,"bbb17e"],[37.76,11.37,1.57,"bbb17d"],[41.75,51.23,1.58,"bbb17d"],[11.69,24.36,1.58,"bcb17d"],[52.26,23.87,1.59,"bcb17d"],[22.5,51.8,1.6,"bdb17c"],[25.59,10.85,1.6,"bdb17c"],[51.13,43.34,1.61,"bdb07c"],[10.11,36.59,1.61,"beb07b"],[45.12,13.72,1.62,"beb07b"],[34.69,54.47,1.63,"beb07b"],[14.74,17.16,1.63,"bfb07a"],[54.88,31.28,1.64,"bfb07a"],[15.52,48.08,1.65,"c0b07a"],[33.29,8.89,1.65,"c0af7a"],[46.74,50.02,1.66,"c0af79"],[8.84,28.65,1.66,"c1af79"],[51.44,18.75,1.67,"c1af79"],[26.58,55.03,1.68,"c1af78"],[20.38,11.25,1.68,"c2af78"],[54.7,39.49,1.69,"c2af78"],[10.09,41.86,1.69,"c3ae78"],[41.54,9.81,1.7,"c3ae77"],[39.99,54.92,1.71,"c3ae77"],[10.52,20.44,1.71,"c4ae77"],[55.77,25.98,1.72,"c4ae76"],[18.47,52.59,1.72,"c5ae76"],[28.05,7.56,1.73,"c5ae76"],[51.52,47.42,1.74,"c5ad75"],[7.07,33.82,1.74,"c6ad75"],[49.23,13.73,1.75,"c6ad75"],[31.63,57.23,1.75,"c6ad75"],[15.15,13.06,1.76,"c7ad74"],[57.33,34.6,1.76,"c7ad74"],[11.47,47.26,1.77,"c8ad74"],[36.85,6.77,1.78,"c8ac73"],[45.53,53.98,1.78,"c8ac73"],[7.07,24.9,1.79,"c9ac73"],[55.28,20.34,1.79,"c9ac73"],[22.67,56.43,1.8,"c9ac72"],[22.34,7.58,1.8,"caac72"],[55.72,43.53,1.81,"caac72"],[6.61,39.56,1.81,"cbab71"],[45.67,9.18,1.82,"cbab71"],[37.35,58.17,1.83,"cbab71"],[10.29,16.25,1.83,"ccab70"],[58.76,28.93,1.84,"ccab70"],[14.27,52.42,1.84,"ccab70"],[31.28,4.86,1.85,"cdab70"],[50.94,51.6,1.85,"cdab6f"],[4.68,30.34,1.86,"ceaa6f"],[53.35,14.71,1.86,"ceaa6f"],[27.92,59.28,1.87,"ceaa6e"],[16.52,9.04,1.87,"cfaa6e"],[59.03,38.5,1.88,"cfaa6e"],[7.59,45.52,1.88,"cfaa6e"],[40.9,5.44,1.89,"d0aa6d"],[43.42,57.69,1.89,"d0a96d"],[6.13,20.73,1.9,"d1a96d"],[58.79,22.8,1.91,"d1a96c"],[18.41,56.97,1.91,"d1a96c"],[25.13,4.31,1.92,"d2a96c"],[55.86,47.84,1.92,"d2a96b"],[3.61,36.45,1.93,"d2a96b"],[49.99,9.46,1.93,"d3a86b"],[33.97,60.88,1.94,"d3a86b"],[10.97,11.96,1.94,"d4a86a"],[61.14,32.57,1.95,"d4a86a"]];

// Plays on every load of the top of the page (the inline script in <head>
// adds html.intro) and again when the header logo is clicked. As the wordmark
// fades, the flower turns slowly and settles into the hero watermark, which
// stays hidden until it lands. Any click, key, scroll or swipe skips ahead to
// that landing.
function initIntro() {
  const root = document.documentElement;
  const overlay = $('.intro-overlay');
  if (!overlay || !overlay.animate) { root.classList.remove('intro'); return; }

  const flower = $('.intro-flower', overlay);
  const svg = $('svg', overlay);
  const bg = $('.intro-bg', overlay);
  const [name, tag] = $$('.intro-word > span', overlay);
  const mark = $('.watermark--hero');
  svg.innerHTML = MARK_DOTS.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#${c}"/>`).join('');
  const dots = $$('circle', svg);

  const EASE_OUT = 'cubic-bezier(.2,.7,.2,1)';
  const EASE_IN_OUT = 'cubic-bezier(.65,0,.35,1)';
  const SKIP_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchmove'];
  let anims = [];
  let timer = 0;
  let state = 'idle'; // idle -> blooming -> leaving -> idle
  const run = (el, frames, opts) => { const a = el.animate(frames, opts); anims.push(a); return a; };

  function finish() {
    if (state === 'idle') return;
    state = 'idle';
    clearTimeout(timer);
    SKIP_EVENTS.forEach((t) => removeEventListener(t, leave, true));
    anims.forEach((a) => a.cancel());
    anims = [];
    overlay.style.pointerEvents = '';
    root.classList.remove('intro');
    root.classList.add('intro-landing');
    setTimeout(() => root.classList.remove('intro-landing'), 1400);
  }

  // The wordmark fades while the flower turns slowly and shrinks into the
  // watermark, and the background lifts away.
  function leave() {
    if (state !== 'blooming') return;
    state = 'leaving';
    clearTimeout(timer);
    overlay.style.pointerEvents = 'none';

    const f = flower.getBoundingClientRect();
    const m = mark ? mark.getBoundingClientRect() : null;
    let to = 'scale(.2)';
    let fade = 0;
    if (m && m.width) {
      const dx = m.left + m.width / 2 - (f.left + f.width / 2);
      const dy = m.top + m.height / 2 - (f.top + f.height / 2);
      to = `translate(${dx}px, ${dy}px) scale(${m.width / f.width})`;
      fade = parseFloat(getComputedStyle(mark).opacity) || 0;
    }
    const time = 1900;
    run(name, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 600, easing: 'ease-in-out', fill: 'forwards' });
    run(tag, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 600, delay: 80, easing: 'ease-in-out', fill: 'forwards' });
    run(svg, [{ transform: 'rotate(-180deg)' }, { transform: 'rotate(0deg)' }], { duration: time, easing: EASE_IN_OUT, fill: 'forwards' });
    run(flower, [{ transform: 'none', opacity: 1 }, { transform: to, opacity: fade }], { duration: time, delay: 150, easing: EASE_IN_OUT, fill: 'forwards' });
    run(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 1300, delay: 450, easing: 'ease-in-out', fill: 'forwards' });
    timer = setTimeout(finish, time + 170);
  }

  function play() {
    finish();
    state = 'blooming';
    root.classList.remove('intro-landing');
    root.classList.add('intro');

    // Dots grow from the centre outwards while the whole head turns.
    dots.forEach((d, i) => run(d, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 520, delay: 80 + i * 6, easing: EASE_OUT, fill: 'backwards' }));
    // It settles half a turn round, so the slow half turn on the way out lands
    // it exactly on the watermark.
    run(svg, [{ transform: 'rotate(-330deg) scale(.7)' }, { transform: 'rotate(-180deg)' }], { duration: 1600, easing: EASE_OUT, fill: 'forwards' });
    run(name, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 600, easing: EASE_OUT, fill: 'both' });
    run(tag, [{ opacity: 0, letterSpacing: '.9em' }, { opacity: 1, letterSpacing: '.32em' }], { duration: 900, delay: 800, easing: EASE_OUT, fill: 'both' });

    SKIP_EVENTS.forEach((t) => addEventListener(t, leave, { capture: true, passive: true }));
    timer = setTimeout(leave, 2200);
  }

  // The logo goes to the very top of the page (not just the start of <main>,
  // which sits under the sticky header) and replays the intro.
  const logo = $('.site-header .logo');
  if (logo) logo.addEventListener('click', (e) => {
    e.preventDefault();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    scrollTo({ top: 0, behavior: 'instant' });
    play();
  });

  if (root.classList.contains('intro')) {
    scrollTo({ top: 0, behavior: 'instant' });
    play();
  }
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

// "Back to top" links go to the very top of the page (not the start of
// <main>, which sits under the sticky header) and clear any #section from
// the URL.
function initToTop() {
  $$('.to-top').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    scrollTo({ top: 0, behavior: 'smooth' });
  }));
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
  // Apps Script always answers HTTP 200 and can't handle a CORS pre-flight, so
  // it gets the note as text/plain and reports problems in the JSON body.
  const isAppsScript = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec/.test(CONTACT_API_BASE);

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
      const res = await fetch(isAppsScript ? CONTACT_API_BASE : `${CONTACT_API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': isAppsScript ? 'text/plain;charset=utf-8' : 'application/json' },
        body: JSON.stringify({ name, email, message, company: form.company.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        showSuccess(name, "Your note is on its way. I'll reply within 24 hours.");
      } else if (res.status === 429) {
        err.textContent = data.error || 'Please wait a moment before sending another note.';
      } else if (res.status === 422) {
        err.textContent = data.error || 'Please check the form and try again.';
      } else if (res.ok && data.error) {
        err.textContent = data.error; // Apps Script reports problems with a 200
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

initIntro();
initToTop();
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
