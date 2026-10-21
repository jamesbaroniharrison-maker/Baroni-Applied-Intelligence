// Baroni Applied Intelligence - multi-page site. Plain JS, no build step for
// this file. The pages themselves are generated from content/content.json by
// scripts/build.mjs (and edited at /admin).

// Each page's side rail lists its own sections, in page order.
const TRACKED_SECTIONS = [...document.querySelectorAll('.rail-node')].map((n) => n.dataset.rail);
// The editor preview shows everything in its finished state, with no intro.
const EDITING = document.documentElement.hasAttribute('data-editing');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, '0');
// Runs fn once, the first time el is well inside the screen.
function onFirstView(el, fn, threshold = 0.4) {
  if (!el) return;
  if (EDITING) { fn(); return; }
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    fn();
  }, { threshold });
  io.observe(el);
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

// Build 03's tender mock-up: scan the pack (page counter ticks up), light
// each finding's line and drop its row in, stamp the verdict, hold, repeat.
// Runs only while on screen.
function initTenderVisuals() {
  // The £2m vs £5m result (Build 03): the figures count up, the shortfall turns red, the note and the
  // HARD STOP tag arrive, then the NO BID stamp lands. Plays once when the card scrolls into view,
  // then holds that final state (it doesn't loop).
  $$('.visual-tender').forEach((v) => {
    const nums = $$('.big[data-to]', v);
    let frame = 0;
    const at = (ms, fn) => setTimeout(fn, ms);
    const label = (el, n) => { el.textContent = `£${n}m`; };

    const countUp = (el, ms) => {
      const to = Number(el.dataset.to);
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / ms);
        label(el, Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      ['is-1', 'is-2', 'is-3', 'is-4', 'is-5'].forEach((c) => v.classList.remove(c));
      nums.forEach((el) => label(el, 0));
    };
    const cycle = () => {
      at(300, () => { v.classList.add('is-1'); countUp(nums[0], 800); });   // £2m
      at(1300, () => { v.classList.add('is-2'); countUp(nums[1], 900); });  // vs £5m
      at(2500, () => v.classList.add('is-3'));                               // the shortfall turns red
      at(3000, () => v.classList.add('is-4'));                               // note + HARD STOP
      at(3600, () => v.classList.add('is-5'));                               // NO BID stamp
    };

    reset();
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      cycle();
    }, { threshold: 0.4 });
    observer.observe(v);
  });
}

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

// Active nav, the left scroll rail and the mobile bar.
function initScroll() {
  const navLinks = $$('.nav-links a');
  const railFill = $('.rail-fill');
  const railNodes = $$('.rail-node');
  const mobileBar = $('.mobile-bar');
  if (!railFill) return;
  const small = window.matchMedia('(max-width: 699px)');

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    let active = '';
    TRACKED_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.hidden && el.getBoundingClientRect().top < innerHeight * 0.4) active = id;
    });
    // At the very bottom, the last visible section is active (a short final
    // section never reaches the 40% line on its own).
    if (max - scrollY < 4) {
      const last = TRACKED_SECTIONS.filter((id) => { const el = document.getElementById(id); return el && !el.hidden; }).pop();
      if (last) active = last;
    }
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

    if (mobileBar) mobileBar.hidden = !(small.matches && pct > 3);
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
  if (!menuBtn || !menu) return;
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.textContent = open ? 'CLOSE' : menuBtn.dataset.label;
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.dataset.label = menuBtn.textContent;
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('resize', () => { if (innerWidth >= 900) setMenu(false); });
}

function initCopyEmail() {
  const copyBtn = $('.copy-email');
  const copyLabel = $('.copy-label');
  if (!copyBtn) return;
  let copyT;
  copyBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(copyBtn.dataset.email).catch(() => {});
    copyLabel.textContent = copyBtn.dataset.copied;
    copyLabel.classList.add('is-copied');
    clearTimeout(copyT);
    copyT = setTimeout(() => {
      copyLabel.textContent = copyBtn.dataset.copy;
      copyLabel.classList.remove('is-copied');
    }, 1800);
  });
}

function initForm() {
  const form = $('.contact-form');
  if (!form) return;
  const err = $('.form-error');
  const success = $('.form-success');
  const submitBtn = $('button[type="submit"]', form);
  // Endpoint and every message come from content.json (data-* on the form).
  const msg = form.dataset;
  const CONTACT_API_BASE = msg.endpoint || '';
  const useMailto = !CONTACT_API_BASE || CONTACT_API_BASE.includes('REPLACE-WITH');
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
    const message = form.message.value.trim() || msg.emptyNote;
    if (!name || !/\S+@\S+\.\S+/.test(email)) {
      err.textContent = msg.missing;
      return;
    }

    if (useMailto) {
      const to = $('.copy-email').dataset.email;
      const subj = encodeURIComponent('Scope call enquiry from ' + name);
      const body = encodeURIComponent(message + '\n\n- ' + name + ' (' + email + ')');
      location.href = 'mailto:' + to + '?subject=' + subj + '&body=' + body;
      showSuccess(name, msg.sentMail);
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
        showSuccess(name, msg.sent);
      } else if (res.status === 429) {
        err.textContent = data.error || msg.wait;
      } else if (res.status === 422) {
        err.textContent = data.error || msg.check;
      } else if (res.ok && data.error) {
        err.textContent = data.error; // Apps Script reports problems with a 200
      } else {
        throw new Error('unexpected response');
      }
    } catch (e2) {
      err.textContent = msg.failed;
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

// ============================================
// PAGE SECTIONS
// ============================================

// Case files: the mock-up named by data-visual is cloned into the sheet.
function initCaseVisuals() {
  $$('.cf-visual[data-visual]').forEach((slot) => {
    const tpl = document.getElementById('visual-' + slot.dataset.visual);
    if (tpl && !slot.firstElementChild) slot.append(tpl.content.firstElementChild.cloneNode(true));
  });
}

// Home "What I automate": a read-through line sweeps the week planner once it
// is on screen; the jobs that could run themselves light up and the hours add
// up. It never holds the scroll. Phones stack the days, so the line goes down.
function initWeek() {
  const cal = $('.wk-cal');
  if (!cal) return;
  const scan = $('.wk-scan', cal);
  const jobs = $$('.wk-ev', cal);
  const tally = $('.wk-tally b');
  const go = $('.wk-go');
  const narrow = matchMedia('(max-width:700px)');
  const DUR = 5200;
  let p = 0;
  let t0 = 0;
  let raf = 0;
  const layout = () => {
    const r = cal.getBoundingClientRect();
    const v = narrow.matches;
    const pos = p * (v ? r.height : r.width);
    let hours = 0;
    scan.classList.toggle('v', v);
    scan.style.transform = v ? `translateY(${pos}px)` : `translateX(${pos}px)`;
    scan.style.opacity = p > 0 && p < 1 ? '1' : '0';
    jobs.forEach((job) => {
      const b = job.getBoundingClientRect();
      const mid = v ? b.top + b.height / 2 - r.top : b.left + b.width / 2 - r.left;
      const hit = job.classList.contains('auto') && mid < pos;
      job.classList.toggle('hit', hit);
      if (hit) hours += parseFloat(job.dataset.h);
    });
    tally.textContent = Math.round(hours * 10) / 10 + 'h';
    cal.classList.toggle('done', p >= 1);
    go.classList.toggle('on', p >= 1);
  };
  const step = (now) => {
    p = Math.min(1, (now - t0) / DUR);
    layout();
    raf = p < 1 ? requestAnimationFrame(step) : 0;
  };
  const play = () => { cancelAnimationFrame(raf); p = 0; t0 = performance.now(); raf = requestAnimationFrame(step); };
  if (EDITING) { p = 1; layout(); return; }
  onFirstView(cal, play);
  $('.wk-replay').addEventListener('click', play);
  addEventListener('resize', layout);
  layout();
}

// Home "The idea": two short lines that fade in once.
function initIdea() {
  const el = $('.pr');
  onFirstView(el, () => el.classList.add('on'));
}

// Home tiles: the How it works pipeline keeps running, the services light up
// in turn, and on touch screens the case folders fan out while on screen.
function initTiles() {
  const steps = $$('.bx-pipe li');
  if (!steps.length) return;
  let t = 0;
  const paint = () => {
    steps.forEach((li, i) => {
      li.classList.toggle('done', i < t);
      li.classList.toggle('run', i === t);
      $('span', li).textContent = i < t ? 'DONE' : i === t ? 'RUNNING' : 'QUEUED';
    });
    t = t >= steps.length + 2 ? 0 : t + 1;
  };
  paint();
  setInterval(paint, 1000);
  const words = $$('.bx-words li');
  let w = 0;
  setInterval(() => { words.forEach((li, i) => li.classList.toggle('on', i === w)); w = (w + 1) % words.length; }, 1300);
  const work = $('.bx-work');
  if (work && !matchMedia('(hover:hover)').matches) {
    const io = new IntersectionObserver(([en]) => work.classList.toggle('fan', en.isIntersecting), { threshold: 0.6 });
    io.observe(work);
  }
}

// How it works: the steps run QUEUED -> RUNNING -> DONE once, then the safety
// checks pass one by one.
function initHow() {
  const run = $('.hw-run');
  if (!run) return;
  const steps = $$('.hw-step', run);
  const state = $('.hw-state', run);
  const box = $('.hw-checks');
  const checks = $$('li', box);
  const pass = $('.hw-pass');
  const paint = (t) => {
    steps.forEach((el, i) => {
      el.classList.toggle('is-done', i < t);
      el.classList.toggle('is-run', i === t);
      $('.step-status', el).textContent = i < t ? 'DONE' : i === t ? 'RUNNING' : 'QUEUED';
    });
    state.textContent = t >= steps.length ? run.dataset.live : run.dataset.running;
  };
  const passed = (n) => {
    checks.forEach((li, i) => li.classList.toggle('on', i < n));
    pass.textContent = `${n} / ${checks.length} ${box.dataset.passed}`;
    pass.classList.toggle('all', n === checks.length);
  };
  if (EDITING) { paint(steps.length); passed(checks.length); return; }
  paint(-1);
  state.textContent = run.dataset.ready;
  onFirstView(run, () => {
    for (let t = 0; t <= steps.length; t++) setTimeout(() => paint(t), 250 + t * 900);
  }, 0.35);
  onFirstView(box, () => {
    checks.forEach((li, i) => setTimeout(() => passed(i + 1), 400 + i * 450));
  }, 0.35);
}

// Services: each row plays as a short exchange when it arrives - the client's
// line, a moment of typing, then the answer.
function initServices() {
  initServicePicker();
  initServiceCards();
  const rows = $$('.sv-row');
  if (!rows.length) return;
  if (EDITING) { rows.forEach((r) => r.classList.add('ask', 'answer')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const row = en.target;
      io.unobserve(row);
      row.classList.add('ask');
      setTimeout(() => row.classList.add('typing'), 450);
      setTimeout(() => { row.classList.remove('typing'); row.classList.add('answer'); }, 1500);
    });
  }, { threshold: 0.35 });
  rows.forEach((r) => io.observe(r));
}

// Services, "pick your problem": choose the line that sounds like you and its
// answer shows alongside (underneath on phones). Until someone picks, it moves
// on by itself every few seconds, with a bar showing when.
function initServicePicker() {
  const items = $$('.svp-item');
  if (!items.length) return;
  const STEP = 6000;
  let cur = 0;
  let timer = 0;
  // phones start still: the list would shift under your thumb every few seconds
  let auto = !EDITING && !matchMedia('(max-width: 860px)').matches;
  const phone = matchMedia('(max-width: 860px)');
  const show = (i, fromUser) => {
    cur = i;
    items.forEach((li, k) => {
      li.classList.toggle('on', k === i);
      $('.svp-q', li).setAttribute('aria-expanded', String(k === i));
    });
    if (fromUser) {
      auto = false;
      items.forEach((li) => li.classList.remove('timing'));
      // on phones the list shifts as the old answer closes: keep the chosen line in view
      if (phone.matches) setTimeout(() => items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 380);
    }
    clearTimeout(timer);
    if (!auto) return;
    const li = items[i];
    li.classList.remove('timing');
    void li.offsetWidth;
    li.classList.add('timing');
    timer = setTimeout(() => show((cur + 1) % items.length), STEP);
  };
  items.forEach((li, i) => {
    $('.svp-q', li).addEventListener('click', () => show(i, true));
    li.addEventListener('ed:reveal', () => show(i, true));
  });
  const list = $('.svp-list');
  list.addEventListener('mouseenter', () => { if (auto) { clearTimeout(timer); items[cur].classList.add('paused'); } });
  list.addEventListener('mouseleave', () => { if (auto) { items[cur].classList.remove('paused'); show(cur); } });
  onFirstView(list, () => show(0), 0.3);
}

// Services as cards: your line on the front; hover (or tap) to turn it over.
function initServiceCards() {
  const cards = $$('.svc-card');
  if (!cards.length) return;
  cards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      card.classList.toggle('flipped');
    });
    card.addEventListener('ed:reveal', (e) => card.classList.toggle('flipped', !!e.target.closest('.svc-back')));
  });
  if (EDITING) return;
  // deal the cards in as they arrive
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      en.target.classList.add('in');
    });
  }, { threshold: 0.2 });
  cards.forEach((c, i) => { c.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(c); });
}

// Book a call: the questions sit on the inside of a curved strip. Drag or use
// the arrows to turn it; tap the front card to flip it to its answer.
function initFaq() {
  const stage = $('.cv-stage');
  if (!stage) return;
  const ring = $('.cv-ring', stage);
  const cards = [...ring.children];
  const N = cards.length;
  if (!N) return;
  const STEP = 360 / N;
  let rot = 0;
  let target = 0;
  let raf = 0;
  const radius = () => (cards[0].offsetWidth + 26) / (2 * Math.sin(Math.PI / Math.max(N, 3)));
  const draw = () => {
    rot += (target - rot) * 0.16;
    if (Math.abs(target - rot) < 0.01) rot = target;
    const r = radius();
    ring.style.transform = `translateZ(${r}px)`;
    cards.forEach((card, i) => {
      let a = rot - i * STEP;
      a = ((a % 360) + 540) % 360 - 180;
      card.style.transform = `rotateY(${a}deg) translateZ(${-r}px)`;
      card.style.opacity = Math.abs(a) < 80 ? String(1 - Math.max(0, Math.abs(a) - 40) / 50) : '0';
      card.style.pointerEvents = Math.abs(a) < STEP / 2 ? 'auto' : 'none';
      if (Math.abs(a) > STEP / 2) card.classList.remove('flipped');
    });
    const idx = ((Math.round(target / STEP) % N) + N) % N;
    $('.cv-count').textContent = `${idx + 1} / ${N}`;
    raf = rot !== target ? requestAnimationFrame(draw) : 0;
  };
  const go = (to) => { target = to; if (!raf) raf = requestAnimationFrame(draw); };
  const snap = () => go(Math.round(target / STEP) * STEP);
  $$('.cv-ctrl button').forEach((b) => b.addEventListener('click', () => go(Math.round(target / STEP) * STEP + Number(b.dataset.d) * STEP)));
  let startX = 0;
  let startT = 0;
  let moved = false;
  stage.addEventListener('pointerdown', (ev) => {
    if (EDITING) return;
    startX = ev.clientX; startT = target; moved = false;
    stage.classList.add('drag');
    stage.setPointerCapture(ev.pointerId);
  });
  stage.addEventListener('pointermove', (ev) => {
    if (!stage.classList.contains('drag')) return;
    const dx = ev.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    go(startT - dx * 0.18);
  });
  const up = (ev) => {
    if (!stage.classList.contains('drag')) return;
    stage.classList.remove('drag');
    if (!moved) {
      const card = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.cv-card');
      if (card) card.classList.toggle('flipped');
    }
    snap();
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', (ev) => {
    if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY)) return;
    ev.preventDefault();
    go(target + ev.deltaX * 0.15);
    clearTimeout(stage.snapT);
    stage.snapT = setTimeout(snap, 160);
  }, { passive: false });
  addEventListener('resize', () => go(target));
  // the editor can ask for a given question to come to the front
  addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'faq:show') go(Number(ev.data.index) * STEP);
  });
  draw();
}

// ============================================
// START
// ============================================

const safe = (fn) => { try { fn(); } catch (err) { console.warn(err); } };
if ($('.intro-overlay') && !EDITING) safe(initIntro);
[initCaseVisuals, initToTop, initRunLog, initMenu, initCopyEmail, initForm, initTenderVisuals,
  initWeek, initIdea, initTiles, initHow, initServices, initFaq, initScroll].forEach(safe);
