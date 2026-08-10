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
// when scrolled past and back in when scrolled back to, per request.
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
      if (!target) return;
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