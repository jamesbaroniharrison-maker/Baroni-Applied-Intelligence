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

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
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

// Hero graphic parallax (desktop pointer only, respects reduced motion)
const heroGraphic = document.getElementById('hero-graphic');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroGraphic && !prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  const heroSection = document.getElementById('top');
  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 14;
    heroGraphic.style.transform = `translate(${-x}px, ${-y}px)`;
  });
  heroSection.addEventListener('mouseleave', () => {
    heroGraphic.style.transform = 'translate(0, 0)';
  });
}