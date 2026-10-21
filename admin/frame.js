// Runs inside the editor's preview of a page. Click any outlined text to type
// over it; the editor panel follows along. Links switch the editor to that
// page instead of navigating.
(() => {
  const post = (msg) => parent.postMessage({ src: 'baroni-frame', ...msg }, '*');
  const sel = (path) => `[data-edit="${CSS.escape(path)}"]`;
  let editing = null;
  let labels = {};

  const tag = document.createElement('div');
  tag.className = 'ed-tag';
  tag.hidden = true;
  document.body.append(tag);

  function start(el) {
    if (editing === el) return;
    stop();
    editing = el;
    el.setAttribute('contenteditable', 'plaintext-only');
    if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
    el.classList.add('ed-active');
    el.dispatchEvent(new CustomEvent('ed:reveal', { bubbles: true }));
    el.focus();
    post({ type: 'focus', path: el.dataset.edit });
  }
  function stop() {
    if (!editing) return;
    const el = editing;
    editing = null;
    el.removeAttribute('contenteditable');
    el.classList.remove('ed-active');
    post({ type: 'blur', path: el.dataset.edit });
  }

  // capture phase, so the page's own buttons and links never react while editing
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-edit]');
    if (el) { e.preventDefault(); e.stopPropagation(); start(el); return; }
    const a = e.target.closest('a[href]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    const href = a.getAttribute('href');
    if (href.startsWith('#')) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else if (/^[\w-]+\.html(#.*)?$/.test(href)) {
      post({ type: 'nav', href: href.split('#')[0] });
    }
  }, true);

  document.addEventListener('input', (e) => {
    const el = e.target.closest && e.target.closest('[data-edit]');
    if (!el) return;
    const value = el.textContent.replace(/\s*\n\s*/g, ' ');
    document.querySelectorAll(sel(el.dataset.edit)).forEach((o) => { if (o !== el) o.textContent = value; });
    post({ type: 'input', path: el.dataset.edit, value });
  });
  document.addEventListener('keydown', (e) => {
    if (!editing) return;
    if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') { e.preventDefault(); editing.blur(); }
    // let the editor's undo/redo/save shortcuts through
    if ((e.ctrlKey || e.metaKey) && ['z', 'y', 's'].includes(e.key.toLowerCase())) post({ type: 'key', key: e.key.toLowerCase(), shift: e.shiftKey });
  });
  document.addEventListener('keydown', (e) => {
    if (editing) return;
    if ((e.ctrlKey || e.metaKey) && ['z', 'y', 's'].includes(e.key.toLowerCase())) { e.preventDefault(); post({ type: 'key', key: e.key.toLowerCase(), shift: e.shiftKey }); }
  });
  document.addEventListener('focusout', (e) => { if (editing && e.target === editing) stop(); });
  // paste as plain text only
  document.addEventListener('paste', (e) => {
    if (!editing) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s*\n\s*/g, ' '));
  });

  // hover: outline plus the field's name from the editor
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest && e.target.closest('[data-edit]');
    if (!el || el === editing) { tag.hidden = true; return; }
    const r = el.getBoundingClientRect();
    tag.textContent = labels[el.dataset.edit] || 'Click to edit';
    tag.style.left = Math.max(4, r.left) + 'px';
    tag.style.top = Math.max(22, r.top - 6) + 'px';
    tag.hidden = false;
  });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[data-edit]')) tag.hidden = true; });

  let scrollT = 0;
  addEventListener('scroll', () => {
    tag.hidden = true;
    clearTimeout(scrollT);
    scrollT = setTimeout(() => post({ type: 'scroll', y: scrollY }), 120);
  }, { passive: true });

  addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.src !== 'baroni-editor') return;
    if (m.type === 'labels') labels = m.labels || {};
    if (m.type === 'set') document.querySelectorAll(sel(m.path)).forEach((o) => { if (o !== editing) o.textContent = m.value; });
    if (m.type === 'scrollTo') scrollTo(0, m.y || 0);
    if (m.type === 'highlight') {
      document.querySelectorAll(sel(m.path)).forEach((o) => o.dispatchEvent(new CustomEvent('ed:reveal', { bubbles: true })));
      const all = [...document.querySelectorAll(sel(m.path))];
      const el = all.find((o) => o.getClientRects().length) || all[0];
      if (!el) { post({ type: 'missing', path: m.path }); return; }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.classList.remove('ed-flash');
      void el.offsetWidth;
      el.classList.add('ed-flash');
    }
  });

  post({ type: 'ready', title: document.title });
})();
