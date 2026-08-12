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

// Contact form backend — see ../SERVER_SETUP.md. Update once the API is
// deployed as its own Render Web Service (separate from this static site).
const CONTACT_API_BASE = 'https://REPLACE-WITH-YOUR-CONTACT-API-URL';

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
  const [site, work, services, process] = await Promise.all([
    fetchJson('content/site.json'),
    fetchJson('content/work.json'),
    fetchJson('content/services.json'),
    fetchJson('content/process.json'),
  ]);
  if (!site && !work && !services && !process) return null;
  return { site, work, services, process };
}

function setText(selector, value) {
  if (value === undefined || value === null) return;
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function applySiteSettings(site) {
  if (!site) return;

  if (site.hero) {
    setText('#top .eyebrow', site.hero.eyebrow);
    if (Array.isArray(site.hero.headline_lines)) {
      const headlineEl = document.querySelector('.hero-headline');
      if (headlineEl) {
        headlineEl.innerHTML = site.hero.headline_lines.map(escapeHtml).join('<br>');
      }
    }
    setText('.hero-sub', site.hero.sub);
    const primaryBtn = document.querySelector('.hero-actions .btn-primary');
    if (primaryBtn && site.hero.primary_cta_label) primaryBtn.textContent = site.hero.primary_cta_label;
    if (primaryBtn && site.hero.primary_cta_target) primaryBtn.setAttribute('href', '#' + site.hero.primary_cta_target);
    const secondaryBtn = document.querySelector('.hero-actions .btn-ghost');
    if (secondaryBtn && site.hero.secondary_cta_label) secondaryBtn.textContent = site.hero.secondary_cta_label;
    if (secondaryBtn && site.hero.secondary_cta_target) secondaryBtn.setAttribute('href', '#' + site.hero.secondary_cta_target);
  }

  if (site.about) {
    setText('#about .eyebrow', site.about.eyebrow);
    setText('#about .section-heading', site.about.heading);
    setText('.about-body', site.about.body);
    const statusEl = document.querySelector('.about-status');
    if (statusEl && site.about.status) {
      statusEl.innerHTML = '<span class="status-dot" aria-hidden="true"></span>' + escapeHtml(site.about.status);
    }
  }

  if (site.process) {
    setText('#process .eyebrow', site.process.eyebrow);
    setText('#process .section-heading', site.process.heading);
  }
  if (site.work) {
    setText('#work .eyebrow', site.work.eyebrow);
    setText('#work .section-heading', site.work.heading);
  }
  if (site.services) {
    setText('#services .eyebrow', site.services.eyebrow);
    setText('#services .section-heading', site.services.heading);
  }

  if (site.contact) {
    setText('#contact .eyebrow', site.contact.eyebrow);
    setText('#contact .section-heading', site.contact.heading);
    setText('.contact-body', site.contact.body);
    if (site.contact.email) {
      const mailLink = document.querySelector('.contact-link[href^="mailto:"]');
      if (mailLink) {
        mailLink.setAttribute('href', 'mailto:' + site.contact.email);
        mailLink.textContent = site.contact.email;
      }
      const copyBtn = document.getElementById('copy-email');
      if (copyBtn) copyBtn.dataset.email = site.contact.email;
    }
    const links = document.querySelectorAll('.contact-links > a.contact-link');
    links.forEach((link) => {
      if (link.textContent.trim() === 'LinkedIn' && site.contact.linkedin_url) {
        link.setAttribute('href', site.contact.linkedin_url);
      }
      if (link.textContent.trim() === 'GitHub' && site.contact.github_url) {
        link.setAttribute('href', site.contact.github_url);
      }
    });
  }

  if (site.footer && site.footer.name) {
    setText('.footer-inner p:first-child', site.footer.name);
  }

  if (site.settings) {
    if (site.settings.accent) {
      document.documentElement.setAttribute('data-accent', site.settings.accent);
    }
    if (site.settings.font_pairing) {
      document.documentElement.setAttribute('data-font', site.settings.font_pairing);
    }
    if (site.settings.sections) {
      Object.entries(site.settings.sections).forEach(([id, visible]) => {
        const section = document.getElementById(id);
        if (!section) return;
        section.hidden = !visible;
        const navLink = document.querySelector(`.nav-menu a[href="#${id}"]`);
        if (navLink) navLink.closest('li').hidden = !visible;
        const spineNode = document.querySelector(`.spine-node[data-target="${id}"]`);
        if (spineNode) spineNode.hidden = !visible;
      });
    }
  }
}

function renderProcess(items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = document.querySelector('.process-list');
  if (!list) return;
  list.innerHTML = items.map((item, i) => `
    <li class="process-item reveal">
      <span class="process-index">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="process-title">${escapeHtml(item.title)}</h3>
      <p class="process-desc">${escapeHtml(item.description)}</p>
    </li>
  `).join('');
}

function renderWork(items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = document.querySelector('.work-list');
  if (!list) return;
  list.innerHTML = items.map((item) => {
    const tags = Array.isArray(item.tags) ? item.tags.map(escapeHtml).join(' · ') : '';
    const flow = Array.isArray(item.flow) && item.flow.length
      ? `<div class="work-flow"><ol>${item.flow.map((step, i) => `<li><span class="flow-num">${String(i + 1).padStart(2, '0')}</span>${escapeHtml(step)}</li>`).join('')}</ol></div>`
      : '';
    return `
      <article class="work-item reveal">
        <div class="work-item-head">
          <h3 class="work-title">${escapeHtml(item.title)}</h3>
          <p class="work-tags">${tags}</p>
        </div>
        <p class="work-desc">${escapeHtml(item.description)}</p>
        ${flow}
      </article>
    `;
  }).join('');
}

function renderServices(items) {
  if (!Array.isArray(items) || !items.length) return;
  const list = document.querySelector('.services-list');
  if (!list) return;
  list.innerHTML = items.map((item) => `
    <li class="service-item reveal">
      <svg class="service-mark" viewBox="0 0 16 16" aria-hidden="true"><circle cx="3" cy="8" r="2" fill="currentColor"/><path d="M5 8 H13" stroke="currentColor" stroke-width="1.4"/><circle cx="13" cy="8" r="2" fill="currentColor"/></svg>
      <div>
        <h3 class="service-title">${escapeHtml(item.title)}</h3>
        <p class="service-desc">${escapeHtml(item.description)}</p>
      </div>
    </li>
  `).join('');
}

// ============================================
// INTERACTIONS — nav, scroll reveal, copy-email, footer year, hero
// parallax, scroll spine. Runs once (after any content render above so
// it always binds to the final DOM).
// ============================================

function initInteractions() {
  // Mobile nav toggle
  const menuToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('nav-menu');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll reveal — re-triggers both ways, so content animates back out
  // when scrolled past and back in when scrolled back to.
  const revealEls = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));

  // Copy email to clipboard
  const copyBtn = document.getElementById('copy-email');
  const copyNote = document.getElementById('copy-note');

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email;
      try {
        await navigator.clipboard.writeText(email);
        copyNote.textContent = 'Copied — ' + email;
      } catch (err) {
        copyNote.textContent = email;
      }
    });
  }

  // Contact form
  const contactForm = document.getElementById('contact-form');
  const cfSubmit = document.getElementById('cf-submit');
  const cfStatus = document.getElementById('cf-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        name: contactForm.name.value,
        email: contactForm.email.value,
        message: contactForm.message.value,
        company: contactForm.company.value, // honeypot
      };

      cfSubmit.disabled = true;
      cfStatus.dataset.state = '';
      cfStatus.textContent = 'Sending…';

      try {
        const res = await fetch(`${CONTACT_API_BASE}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));

        if (res.ok && body.ok) {
          cfStatus.dataset.state = 'ok';
          cfStatus.textContent = "Message sent — I'll get back to you soon.";
          contactForm.reset();
        } else if (res.status === 429) {
          cfStatus.dataset.state = 'error';
          cfStatus.textContent = body.error || 'Please wait a moment before sending another message.';
        } else if (res.status === 422) {
          cfStatus.dataset.state = 'error';
          cfStatus.textContent = body.error || 'Please check the form and try again.';
        } else {
          throw new Error('unexpected response');
        }
      } catch (err) {
        cfStatus.dataset.state = 'error';
        cfStatus.textContent = 'Something went wrong sending that — try again, or email directly using the address above.';
      } finally {
        cfSubmit.disabled = false;
      }
    });
  }

  // Footer year
  const yearEl = document.querySelector('.footer-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Hero graphic parallax — mouse tilt (desktop pointer only) combined with
  // a scroll-linked drift, respects reduced motion.
  const heroGraphic = document.getElementById('hero-graphic');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroGraphic && !prefersReducedMotion) {
    const heroSection = document.getElementById('top');
    let mouseX = 0;
    let mouseY = 0;
    let scrollDrift = 0;

    const applyHeroTransform = () => {
      heroGraphic.style.transform = `translate(${mouseX}px, ${mouseY + scrollDrift}px)`;
    };

    if (window.matchMedia('(hover: hover)').matches) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
        mouseX = -x;
        mouseY = -y;
        applyHeroTransform();
      });
      heroSection.addEventListener('mouseleave', () => {
        mouseX = 0;
        mouseY = 0;
        applyHeroTransform();
      });
    }

    window.addEventListener('scroll', () => {
      const rect = heroSection.getBoundingClientRect();
      scrollDrift = Math.max(0, -rect.top) * 0.12;
      applyHeroTransform();
    }, { passive: true });
  }

  // Scroll-progress spine — fill tracks how far down the page you are,
  // nodes light up when their section is centered in view.
  const spineFill = document.getElementById('spine-fill');
  if (spineFill) {
    const updateSpineFill = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      spineFill.style.transform = `scaleY(${progress})`;
    };
    updateSpineFill();
    window.addEventListener('scroll', updateSpineFill, { passive: true });
    window.addEventListener('resize', updateSpineFill);

    const spineNodes = document.querySelectorAll('.spine-node');
    const positionSpineNodes = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      spineNodes.forEach((node) => {
        const target = document.getElementById(node.dataset.target);
        if (!target || node.hidden) return;
        const pct = (target.getBoundingClientRect().top + window.scrollY) / docHeight;
        node.style.top = `${Math.min(100, Math.max(0, pct * 100))}%`;
      });
    };
    positionSpineNodes();
    window.addEventListener('resize', positionSpineNodes);
    window.addEventListener('load', positionSpineNodes);

    const spineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const node = document.querySelector(`.spine-node[data-target="${entry.target.id}"]`);
          if (node) node.classList.toggle('active', entry.isIntersecting);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    spineNodes.forEach((node) => {
      const target = document.getElementById(node.dataset.target);
      if (target) spineObserver.observe(target);
    });
  }
}

(async () => {
  const content = await loadContent();
  if (content) {
    applySiteSettings(content.site);
    if (content.process) renderProcess(content.process.items);
    if (content.work) renderWork(content.work.items);
    if (content.services) renderServices(content.services.items);
  }
  initInteractions();
})();
