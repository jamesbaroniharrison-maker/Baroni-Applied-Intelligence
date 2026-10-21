// The site editor. Runs in two modes:
//   local - served by `node scripts/serve.mjs`: loads and saves through /api on
//           this computer (saves rebuild the pages and keep a copy in history/).
//   live  - on the real site: signs in with GitHub and publishes by committing
//           content/content.json plus every rebuilt page in one commit.
import { renderSite } from '../scripts/render.js';
import { pages as schemaPages, NEW_ITEMS } from './schema.js';

const GH = {
  repo: 'jamesbaroniharrison-maker/Baroni-Applied-Intelligence',
  branch: 'main',
  auth: 'https://mywebsite.james-baroniharrison.workers.dev', // the OAuth proxy the old admin used
  file: 'content/content.json',
};
const DRAFT_KEY = 'baroni-editor:draft';
const TOKEN_KEY = 'baroni-editor:token';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const join = (base, rel) => (rel === '' || rel == null ? base : base === '' ? rel : `${base}.${rel}`);
const getAt = (obj, path) => (path === '' ? obj : path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj));
function setAt(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k) => { o = o[k]; });
  o[keys[keys.length - 1]] = value;
}
const pattern = (path) => path.replace(/\.\d+(?=\.|$)/g, '.*');

const S = {
  mode: null,           // 'local' | 'live'
  base: null,           // content as last saved/published
  draft: null,          // content being edited
  page: 'home',
  device: 'desktop',
  undo: [],
  redo: [],
  lastEdit: { path: '', at: 0 },
  scrollY: {},          // remembered preview scroll per page
  gh: { token: '', user: null, commit: '' },
  fieldEls: new Map(),  // path -> input element in the panel
  labels: {},           // path -> "Section · Field" for the preview's hover tag
};

// ===================================================================== start
init().catch((err) => fatal(err));

async function init() {
  wireChrome();
  try {
    const r = await fetch('/api/content', { cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      S.mode = 'local';
      return start(data.content);
    }
  } catch { /* not the local server: use GitHub */ }
  S.mode = 'live';
  S.gh.token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
  if (S.gh.token) {
    try { return start(await ghLoad()); } catch (err) { if (!/401|403/.test(String(err.message))) throw err; signOut(); }
  }
  showSignIn();
}

function start(content) {
  S.base = content;
  S.draft = clone(content);
  $('#signin').hidden = true;
  $('#app').hidden = false;
  $('#mode').innerHTML = S.mode === 'local'
    ? '<i></i>Saving to this computer'
    : `${S.gh.user && S.gh.user.avatar_url ? `<img src="${esc(S.gh.user.avatar_url)}" alt="">` : '<i></i>'}Live site`;
  const saved = readDraft();
  if (saved && !same(saved.draft, S.base) && same(saved.base, S.base)) {
    $('#restore-text').textContent = `You have unpublished changes from ${new Date(saved.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.`;
    $('#restore').hidden = false;
    $('#restore-yes').onclick = () => { S.draft = clone(saved.draft); $('#restore').hidden = true; refreshAll(); toast('Changes brought back.'); };
    $('#restore-no').onclick = () => { clearDraft(); $('#restore').hidden = true; };
  }
  const want = new URLSearchParams(location.search).get('page');
  if (want) S.page = want;
  refreshAll();
  addEventListener('beforeunload', (e) => { if (changes().length) { e.preventDefault(); e.returnValue = ''; } });
}

function fatal(err) {
  console.error(err);
  document.body.innerHTML = `<div class="signin"><div class="signin-card"><h1>Something went wrong</h1><p>${esc(err.message || err)}</p><button class="b" onclick="location.reload()">Try again</button></div></div>`;
}

// ===================================================================== chrome
function wireChrome() {
  $$('.seg button').forEach((b) => b.addEventListener('click', () => {
    S.device = b.dataset.device;
    $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    fitFrame();
  }));
  addEventListener('resize', fitFrame);
  $('#undo').addEventListener('click', undo);
  $('#redo').addEventListener('click', redo);
  $('#changes-btn').addEventListener('click', () => openDrawer('changes'));
  $('#history-btn').addEventListener('click', () => openDrawer('history'));
  $('#publish-btn').addEventListener('click', openPublish);
  $('#publish-go').addEventListener('click', publish);
  $('#revert-all').addEventListener('click', () => {
    if (!confirm('Undo every unpublished change?')) return;
    snapshot();
    S.draft = clone(S.base);
    afterChange({ structural: true });
    renderChanges();
  });
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => { b.closest('.drawer, .modal').hidden = true; }));
  $('#find').addEventListener('input', renderFind);
  $('#signin-btn').addEventListener('click', signIn);
  addEventListener('keydown', (e) => shortcut(e.key.toLowerCase(), e.shiftKey, e.ctrlKey || e.metaKey, e));
  addEventListener('message', onFrameMessage);
}

function shortcut(key, shift, mod, e) {
  if (!mod) {
    if (key === 'escape') $$('.drawer, .modal').forEach((d) => { d.hidden = true; });
    return;
  }
  if (key === 'z' && !shift) { e?.preventDefault(); undo(); }
  if ((key === 'z' && shift) || key === 'y') { e?.preventDefault(); redo(); }
  if (key === 's') { e?.preventDefault(); openPublish(); }
}

function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast ${kind}`;
  t.hidden = false;
  clearTimeout(t.timer);
  t.timer = setTimeout(() => { t.hidden = true; }, kind === 'err' ? 7000 : 3200);
}

// ===================================================================== pages + schema
function allPages() {
  const list = schemaPages(S.draft);
  const site = list.find((p) => p.id === 'site');
  const other = uncovered(list);
  if (other.length) {
    site.sections.push({
      label: 'Other text', help: 'Text the editor has no special place for yet.',
      fields: other.map((path) => ({ type: typeof getAt(S.draft, path) === 'number' ? 'num' : typeof getAt(S.draft, path) === 'boolean' ? 'bool' : 'text', path, label: path })),
    });
  }
  return list;
}

// every leaf in content.json that no field (or list) covers
function uncovered(list) {
  const covered = [];
  const walk = (fields, base) => fields.forEach((f) => {
    const p = join(base, f.path);
    covered.push(pattern(p));
    if (f.type === 'list') covered.push(`${pattern(p)}.*`);
  });
  list.forEach((pg) => pg.sections.forEach((s) => walk(s.fields, '')));
  const isCovered = (path) => {
    const pat = pattern(path);
    return covered.some((c) => pat === c || pat.startsWith(`${c}.`) || (c.endsWith('.*') && pat.startsWith(c.slice(0, -1))));
  };
  const out = [];
  const leaves = (v, path) => {
    if (v && typeof v === 'object') {
      if (Array.isArray(v) && isCovered(path)) return;
      Object.keys(v).forEach((k) => leaves(v[k], join(path, k)));
    } else if (!isCovered(path)) out.push(path);
  };
  leaves(S.draft, '');
  return out;
}

function currentPage() {
  const list = allPages();
  return list.find((p) => p.id === S.page) || list[0];
}

function renderPageList() {
  const list = allPages();
  const counts = {};
  changes().forEach((c) => { const id = pageOfPath(c.path, list); counts[id] = (counts[id] || 0) + 1; });
  const items = [];
  list.forEach((p) => {
    if (p.id === 'site') items.push('<li class="sep" aria-hidden="true"></li>');
    items.push(`<li class="${p.indent ? 'indent' : ''}"><button type="button" data-page="${p.id}"${p.id === S.page ? ' aria-current="page"' : ''}><span>${esc(p.label)}</span>${counts[p.id] ? '<i class="dot" title="Unpublished changes"></i>' : ''}</button></li>`);
  });
  $('#pages').innerHTML = items.join('');
  $$('#pages button').forEach((b) => b.addEventListener('click', () => goPage(b.dataset.page)));
}

function pageOfPath(path, list = allPages()) {
  const pat = pattern(path);
  for (const p of list) {
    for (const s of p.sections) {
      for (const f of s.fields) {
        const fp = pattern(f.path);
        if (pat === fp || pat.startsWith(`${fp}.`)) return p.id === 'work' && /^cases\.\d+/.test(path) ? `case-${path.split('.')[1]}` : p.id;
      }
    }
  }
  return 'site';
}

function goPage(id, then) {
  if (id !== S.page) S.scrollY[S.page] = S.scrollY.current || 0;
  S.page = id;
  history.replaceState(null, '', `?page=${encodeURIComponent(id)}`);
  renderPageList();
  renderPanel();
  renderFrame(then);
}

// ===================================================================== panel
function renderPanel() {
  const pg = currentPage();
  const panel = $('#panel');
  S.fieldEls.clear();
  S.labels = {};
  const open = new Set($$('.sec[open]', panel).map((d) => d.dataset.key));
  const fresh = panel.dataset.page !== pg.id;
  panel.dataset.page = pg.id;
  panel.innerHTML = `<div class="panel-head"><h2>${esc(pg.label)}</h2><p>Click text on the page, or use the fields below. <a href="../${pg.file}" target="_blank" rel="noopener">Open the live page ↗</a></p></div>`;
  pg.sections.forEach((sec, i) => {
    const key = `${pg.id}:${sec.label}`;
    const d = document.createElement('details');
    d.className = 'sec';
    d.dataset.key = key;
    d.open = fresh ? i === 0 : open.has(key);
    d.innerHTML = `<summary><span>${esc(sec.label)}</span></summary><div class="sec-body">${sec.help ? `<p class="sec-help">${esc(sec.help)}</p>` : ''}</div>`;
    const body = $('.sec-body', d);
    sec.fields.forEach((f) => body.append(fieldEl(f, '', sec.label)));
    panel.append(d);
  });
  markChanged();
  postFrame({ type: 'labels', labels: S.labels });
}

function fieldEl(f, base, section) {
  const path = join(base, f.path);
  S.labels[path] = `${section} · ${f.label}`;
  if (f.type === 'list') return listEl(f, path, section);
  const value = getAt(S.draft, path);
  const wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.dataset.path = path;
  const id = `f-${path.replace(/[^\w]/g, '_')}`;
  const top = `<div class="field-top"><label for="${id}">${esc(f.label)}</label>${f.type === 'text' || f.type === 'long' ? `<span class="count">${String(value ?? '').length}</span>` : ''}<button type="button" class="show" title="Show it on the page">show ↗</button></div>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}`;
  let input = '';
  if (f.type === 'text') input = `<input type="text" id="${id}" value="${esc(value)}">`;
  if (f.type === 'long') input = `<textarea id="${id}" rows="3">${esc(value)}</textarea>`;
  if (f.type === 'num') input = `<input type="number" id="${id}" step="any" value="${esc(value)}">`;
  if (f.type === 'bool') input = `<label class="toggle"><input type="checkbox" id="${id}"${value ? ' checked' : ''}><span>${value ? 'On' : 'Off'}</span></label>`;
  if (f.type === 'pick') input = `<select id="${id}">${f.options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  wrap.innerHTML = top + input;
  const el = $(`#${CSS.escape(id)}`, wrap);
  S.fieldEls.set(path, el);
  const count = $('.count', wrap);
  if (el.tagName === 'TEXTAREA') autosize(el);
  const read = () => (f.type === 'num' ? (el.value === '' ? 0 : Number(el.value)) : f.type === 'bool' ? el.checked : el.value);
  el.addEventListener(f.type === 'bool' || f.type === 'pick' ? 'change' : 'input', () => {
    if (count) count.textContent = el.value.length;
    if (el.tagName === 'TEXTAREA') autosize(el);
    if (f.type === 'bool') $('span', el.parentNode).textContent = el.checked ? 'On' : 'Off';
    update(path, read(), { text: f.type === 'text' || f.type === 'long' });
  });
  el.addEventListener('focus', () => postFrame({ type: 'highlight', path }));
  $('.show', wrap).addEventListener('click', () => showOnPage(path));
  return wrap;
}

function listEl(f, path, section) {
  const arr = getAt(S.draft, path) || [];
  const wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.dataset.path = path;
  wrap.innerHTML = `<div class="field-top"><label>${esc(f.label)}</label><span class="count">${arr.length}</span></div>${f.hint ? `<div class="hint">${esc(f.hint)}</div>` : ''}<div class="list"></div><button type="button" class="add">+ Add ${esc(singular(f))}</button>`;
  const box = $('.list', wrap);
  const simple = !Array.isArray(f.item);
  arr.forEach((itemVal, i) => {
    const ip = `${path}.${i}`;
    const tools = `<div class="tools"><button type="button" data-act="up" title="Move up"${i === 0 ? ' disabled' : ''}>↑</button><button type="button" data-act="down" title="Move down"${i === arr.length - 1 ? ' disabled' : ''}>↓</button><button type="button" data-act="dup" title="Duplicate">⧉</button><button type="button" data-act="del" class="del" title="Delete">×</button></div>`;
    const item = document.createElement('div');
    item.className = 'item';
    if (simple) {
      item.innerHTML = `<div class="item-head"><span class="num">${String(i + 1).padStart(2, '0')}</span><div class="item-simple"></div>${tools}</div>`;
      const fe = fieldEl({ ...f.item, path: '', label: `${f.item.label} ${i + 1}` }, ip, section);
      const input = $('input, textarea, select', fe);
      $('.item-simple', item).append(input);
      $('.item-simple', item).style.flex = '1';
    } else {
      const sumKey = f.summary || (f.item[0] && f.item[0].path);
      const sum = sumKey ? getAt(itemVal, sumKey) : '';
      const key = `${ip}`;
      item.classList.toggle('closed', !openItems.has(key));
      item.innerHTML = `<div class="item-head"><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="sum" title="Open or close">${esc(sum || singular(f))}</span>${tools}</div><div class="item-body"></div>`;
      const body = $('.item-body', item);
      if (!item.classList.contains('closed')) f.item.forEach((sub) => body.append(fieldEl(sub, ip, section)));
      $('.sum', item).addEventListener('click', () => {
        if (openItems.has(key)) openItems.delete(key); else openItems.add(key);
        renderPanel();
      });
    }
    $$('.tools button', item).forEach((b) => b.addEventListener('click', () => listAct(path, i, b.dataset.act)));
    box.append(item);
  });
  $('.add', wrap).addEventListener('click', () => {
    const tpl = NEW_ITEMS[pattern(path)];
    const fallback = arr.length ? clone(arr[arr.length - 1]) : '';
    snapshot();
    const next = (getAt(S.draft, path) || []).concat([clone(tpl !== undefined ? tpl : fallback)]);
    setAt(S.draft, path, next);
    if (!simple) openItems.add(`${path}.${next.length - 1}`);
    afterChange({ structural: true });
  });
  return wrap;
}
const openItems = new Set();
const singular = (f) => (Array.isArray(f.item) ? (f.label.replace(/s$/, '').toLowerCase() || 'item') : (f.item.label || 'item').toLowerCase());

function listAct(path, i, act) {
  const arr = clone(getAt(S.draft, path));
  if (act === 'del' && !confirm('Delete this item?')) return;
  snapshot();
  if (act === 'up' && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
  if (act === 'down' && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
  if (act === 'dup') arr.splice(i + 1, 0, clone(arr[i]));
  if (act === 'del') arr.splice(i, 1);
  setAt(S.draft, path, arr);
  afterChange({ structural: true });
}

function autosize(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 360) + 'px'; }

function markChanged() {
  const changed = new Set(changes().map((c) => c.path));
  $$('.field[data-path]').forEach((w) => w.classList.toggle('changed', changed.has(w.dataset.path)));
}

function showOnPage(path) {
  postFrame({ type: 'highlight', path });
}

// ===================================================================== editing
function snapshot() {
  S.undo.push(JSON.stringify(S.draft));
  if (S.undo.length > 200) S.undo.shift();
  S.redo = [];
}

// value changed in the panel or on the page
function update(path, value, { text = false, fromFrame = false } = {}) {
  const now = Date.now();
  if (S.lastEdit.path !== path || now - S.lastEdit.at > 1500) snapshot();
  S.lastEdit = { path, at: now };
  setAt(S.draft, path, value);
  if (text) {
    if (!fromFrame) postFrame({ type: 'set', path, value });
    afterChange({ structural: false });
  } else {
    afterChange({ structural: true });
  }
}

let renderT = 0;
function afterChange({ structural }) {
  saveDraft();
  updateButtons();
  markChanged();
  renderPageList();
  if (structural) {
    renderPanel();
    renderFrame();
  } else {
    // text shows on the page straight away; rebuild in the background for the
    // places that reuse it (menus, tiles, page titles)
    clearTimeout(renderT);
    renderT = setTimeout(() => { if (!frameEditing) renderFrame(); }, 1400);
  }
}

function undo() {
  if (!S.undo.length) return;
  S.redo.push(JSON.stringify(S.draft));
  S.draft = JSON.parse(S.undo.pop());
  S.lastEdit = { path: '', at: 0 };
  refreshAll();
}
function redo() {
  if (!S.redo.length) return;
  S.undo.push(JSON.stringify(S.draft));
  S.draft = JSON.parse(S.redo.pop());
  S.lastEdit = { path: '', at: 0 };
  refreshAll();
}

function refreshAll() {
  if (!allPages().some((p) => p.id === S.page)) S.page = 'home';
  saveDraft();
  updateButtons();
  renderPageList();
  renderPanel();
  renderFrame();
}

function updateButtons() {
  const n = changes().length;
  $('#undo').disabled = !S.undo.length;
  $('#redo').disabled = !S.redo.length;
  $('#publish-btn').disabled = !n;
  const c = $('#changes-count');
  c.textContent = n;
  c.classList.toggle('on', n > 0);
  document.title = `${n ? `(${n}) ` : ''}Editor - Baroni Applied Intelligence`;
}

// ===================================================================== changes
function changes() {
  if (!S.base || !S.draft) return [];
  const out = [];
  const walk = (a, b, path) => {
    if (same(a, b)) return;
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) { a.forEach((_, i) => walk(a[i], b[i], join(path, String(i)))); return; }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      new Set([...Object.keys(a), ...Object.keys(b)]).forEach((k) => walk(a[k], b[k], join(path, k)));
      return;
    }
    out.push({ path, before: a, after: b });
  };
  walk(S.base, S.draft, '');
  return out;
}

function describe(v) {
  if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? '' : 's'}: ${v.map((x) => (typeof x === 'object' ? (x && (x.name || x.title || x.q || x.say || x.day || x.label)) || '…' : x)).join(' · ')}`;
  if (v === undefined) return '(nothing)';
  if (typeof v === 'boolean') return v ? 'On' : 'Off';
  return String(v);
}

function labelFor(path) {
  if (S.labels[path]) return S.labels[path];
  for (const pg of allPages()) {
    for (const s of pg.sections) {
      const hit = findField(s.fields, '', path);
      if (hit) return `${pg.label} · ${s.label} · ${hit}`;
    }
  }
  return path;
}
function findField(fields, base, path) {
  for (const f of fields) {
    const p = join(base, f.path);
    if (pattern(p) === pattern(path)) return f.label;
    if (f.type === 'list' && pattern(path).startsWith(`${pattern(p)}.*`)) {
      const m = path.slice(p.length + 1).split('.');
      const i = m.shift();
      if (!m.length) return `${f.label} ${Number(i) + 1}`;
      if (Array.isArray(f.item)) { const sub = findField(f.item, `${p}.${i}`, path); if (sub) return `${f.label} ${Number(i) + 1} · ${sub}`; }
    }
  }
  return '';
}

function renderChanges() {
  const list = changes();
  const box = $('#changes-list');
  if (!list.length) { box.innerHTML = '<p class="empty">No unpublished changes.</p>'; return; }
  box.innerHTML = '';
  list.forEach((c) => {
    const d = document.createElement('div');
    d.className = 'chg';
    d.innerHTML = `<div class="chg-top"><div><b>${esc(labelFor(c.path))}</b></div><button type="button" class="b b-small b-quiet">Undo</button></div><span class="out">${esc(describe(c.before))}</span><span class="in">${esc(describe(c.after))}</span>`;
    $('button', d).addEventListener('click', () => {
      snapshot();
      if (c.before === undefined) {
        const keys = c.path.split('.');
        const last = keys.pop();
        const parentObj = getAt(S.draft, keys.join('.'));
        if (parentObj) delete parentObj[last];
      } else setAt(S.draft, c.path, clone(c.before));
      afterChange({ structural: true });
      renderChanges();
    });
    $('b', d).style.cursor = 'pointer';
    $('b', d).addEventListener('click', () => { $('#changes').hidden = true; goToPath(c.path); });
    box.append(d);
  });
}

function goToPath(path) {
  const id = pageOfPath(path);
  // open the section and list item that hold the field
  const parts = path.split('.');
  for (let k = 2; k <= parts.length; k += 1) if (/^\d+$/.test(parts[k - 1])) openItems.add(parts.slice(0, k).join('.'));
  const focus = () => {
    const el = S.fieldEls.get(path);
    if (el) {
      const sec = el.closest('.sec');
      if (sec) sec.open = true;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.closest('.field').classList.add('flash');
      setTimeout(() => el.closest('.field')?.classList.remove('flash'), 1300);
      el.focus({ preventScroll: true });
    }
  };
  if (id !== S.page) goPage(id, () => postFrame({ type: 'highlight', path }));
  else { renderPanel(); postFrame({ type: 'highlight', path }); }
  requestAnimationFrame(focus);
}

// ===================================================================== find any text
function renderFind() {
  const q = $('#find').value.trim().toLowerCase();
  const box = $('#find-results');
  $('#pages').hidden = !!q;
  box.hidden = !q;
  if (!q) return;
  const hits = [];
  const walk = (v, path) => {
    if (v && typeof v === 'object') { Object.keys(v).forEach((k) => walk(v[k], join(path, k))); return; }
    if (typeof v === 'string' && v.toLowerCase().includes(q)) hits.push({ path, v });
  };
  walk(S.draft, '');
  if (!hits.length) { box.innerHTML = '<p class="none">Nothing found.</p>'; return; }
  box.innerHTML = '';
  hits.slice(0, 60).forEach((h) => {
    const i = h.v.toLowerCase().indexOf(q);
    const start = Math.max(0, i - 24);
    const snip = `${start ? '…' : ''}${esc(h.v.slice(start, i))}<mark>${esc(h.v.slice(i, i + q.length))}</mark>${esc(h.v.slice(i + q.length, i + q.length + 40))}`;
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<small>${esc(labelFor(h.path))}</small>${snip}`;
    b.addEventListener('click', () => { $('#find').value = ''; renderFind(); goToPath(h.path); });
    box.append(b);
  });
}

// ===================================================================== preview
let frameReady = false;
let frameEditing = false;
let onFrameReady = null;
function renderFrame(then) {
  const pg = currentPage();
  let html;
  try {
    html = renderSite(S.draft, { edit: true })[pg.file] || renderSite(S.draft, { edit: true })['index.html'];
  } catch (err) {
    toast(`Preview problem: ${err.message}`, 'err');
    return;
  }
  const base = new URL('../', location.href).href;
  html = html.replace('<head>', `<head><base href="${base}">`)
    .replace('</body>', `<link rel="stylesheet" href="admin/frame.css"><script src="admin/frame.js"></script></body>`);
  frameReady = false;
  onFrameReady = then || null;
  const f = $('#frame');
  f.dataset.page = pg.id;
  f.srcdoc = html;
  fitFrame();
}

function postFrame(msg) {
  const f = $('#frame');
  if (frameReady && f.contentWindow) f.contentWindow.postMessage({ src: 'baroni-editor', ...msg }, '*');
}

function onFrameMessage(e) {
  const m = e.data;
  if (!m || m.src !== 'baroni-frame' || e.source !== $('#frame').contentWindow) return;
  if (m.type === 'ready') {
    frameReady = true;
    postFrame({ type: 'labels', labels: S.labels });
    const y = S.scrollY[S.page];
    if (y) postFrame({ type: 'scrollTo', y });
    if (onFrameReady) { const fn = onFrameReady; onFrameReady = null; fn(); }
  }
  if (m.type === 'scroll') { S.scrollY[S.page] = m.y; S.scrollY.current = m.y; }
  if (m.type === 'focus') {
    frameEditing = true;
    goToPathInPanel(m.path);
  }
  if (m.type === 'blur') {
    frameEditing = false;
    clearTimeout(renderT);
    renderT = setTimeout(() => { if (!frameEditing) renderFrame(); }, 600);
  }
  if (m.type === 'input') {
    const el = S.fieldEls.get(m.path);
    if (el) { el.value = m.value; const c = $('.count', el.closest('.field')); if (c) c.textContent = m.value.length; }
    update(m.path, m.value, { text: true, fromFrame: true });
  }
  if (m.type === 'nav') {
    const pg = allPages().find((p) => p.file === m.href && p.id !== 'site');
    if (pg) goPage(pg.id);
  }
  if (m.type === 'key') shortcut(m.key, m.shift, true);
  if (m.type === 'missing') toast('That text is not shown on this page right now (for example, it only appears on phones or after a click).');
}

function goToPathInPanel(path) {
  const parts = path.split('.');
  let opened = false;
  for (let k = 2; k <= parts.length; k += 1) {
    const key = parts.slice(0, k).join('.');
    if (/^\d+$/.test(parts[k - 1]) && !openItems.has(key)) { openItems.add(key); opened = true; }
  }
  if (opened || !S.fieldEls.get(path)) renderPanel();
  const el = S.fieldEls.get(path);
  if (!el) return;
  const sec = el.closest('.sec');
  if (sec) sec.open = true;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.closest('.field').classList.add('flash');
  setTimeout(() => el.closest('.field')?.classList.remove('flash'), 1300);
}

function fitFrame() {
  const stage = $('#stage');
  const wrap = $('#frame-wrap');
  const f = $('#frame');
  const W = { desktop: 1440, tablet: 834, phone: 390 }[S.device];
  const availW = stage.clientWidth - 40;
  const availH = stage.clientHeight - 40;
  const s = Math.min(1, availW / W);
  f.style.width = `${W}px`;
  f.style.height = `${Math.max(400, availH / s)}px`;
  wrap.style.transform = `translateX(-50%) scale(${s})`;
}

// ===================================================================== drafts kept in this browser
function saveDraft() {
  try {
    if (!changes().length) { localStorage.removeItem(DRAFT_KEY); return; }
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ at: Date.now(), base: S.base, draft: S.draft }));
  } catch { /* private window: no autosave */ }
}
function readDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } }

// ===================================================================== drawers
function openDrawer(id) {
  $$('.drawer').forEach((d) => { d.hidden = d.id !== id; });
  if (id === 'changes') renderChanges();
  if (id === 'history') renderHistory();
}

async function renderHistory() {
  const box = $('#history-list');
  box.innerHTML = '<p class="empty">Loading…</p>';
  try {
    const list = S.mode === 'local'
      ? (await (await fetch('/api/history', { cache: 'no-store' })).json()).map((v) => ({ id: v.id, title: v.note.replace(/-/g, ' ') || 'Saved', date: v.date }))
      : (await gh(`/repos/${GH.repo}/commits?path=${encodeURIComponent(GH.file)}&sha=${GH.branch}&per_page=40`)).map((c) => ({ id: c.sha, title: c.commit.message.split('\n')[0], date: c.commit.author.date }));
    if (!list.length) { box.innerHTML = '<p class="empty">Nothing published yet.</p>'; return; }
    box.innerHTML = '';
    list.forEach((v, i) => {
      const d = document.createElement('div');
      d.className = 'ver';
      d.innerHTML = `<div><b>${esc(v.title)}</b><small>${new Date(v.date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}${i === 0 ? ' · current' : ''}</small></div><button type="button" class="b b-small">Bring back</button>`;
      $('button', d).addEventListener('click', async () => {
        try {
          const content = S.mode === 'local'
            ? await (await fetch(`/api/history/${encodeURIComponent(v.id)}`, { cache: 'no-store' })).json()
            : JSON.parse(b64decode((await gh(`/repos/${GH.repo}/contents/${GH.file}?ref=${v.id}`)).content));
          snapshot();
          S.draft = content;
          refreshAll();
          $('#history').hidden = true;
          toast('That version is loaded as unpublished changes. Check it, then Publish.');
        } catch (err) { toast(`Could not load it: ${err.message}`, 'err'); }
      });
      box.append(d);
    });
  } catch (err) {
    box.innerHTML = `<p class="empty">Could not load the history: ${esc(err.message)}</p>`;
  }
}

// ===================================================================== publish
function openPublish() {
  const list = changes();
  if (!list.length) { toast('Nothing to publish yet.'); return; }
  $('#publish-sub').textContent = S.mode === 'local'
    ? `${list.length} change${list.length === 1 ? '' : 's'}. This saves to your computer and rebuilds the pages. Push to GitHub when you want it live.`
    : `${list.length} change${list.length === 1 ? '' : 's'}. They go live on the site in about a minute.`;
  $('#publish-list').innerHTML = list.slice(0, 30).map((c) => `<li>${esc(labelFor(c.path))}</li>`).join('') + (list.length > 30 ? `<li>…and ${list.length - 30} more</li>` : '');
  $('#publish-note').value = '';
  $('#publish').hidden = false;
  $('#publish-go').focus();
}

async function publish() {
  const btn = $('#publish-go');
  const note = $('#publish-note').value.trim();
  const list = changes();
  const summary = note || `Edit ${list.slice(0, 3).map((c) => labelFor(c.path).split(' · ').slice(-1)[0]).join(', ')}${list.length > 3 ? ` and ${list.length - 3} more` : ''}`;
  btn.disabled = true;
  btn.textContent = 'Publishing…';
  try {
    if (S.mode === 'local') {
      const r = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: S.draft, note: summary }) });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || `save failed (${r.status})`);
      toast('Saved and rebuilt on this computer.', 'ok');
    } else {
      await ghPublish(`Content: ${summary}`);
      toast('Published. The live site updates in about a minute.', 'ok');
    }
    S.base = clone(S.draft);
    clearDraft();
    $('#publish').hidden = true;
    refreshAll();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publish';
  }
}

// ===================================================================== GitHub (live mode)
function showSignIn() {
  $('#app').hidden = true;
  $('#signin').hidden = false;
}

function signIn() {
  const err = $('#signin-err');
  err.textContent = '';
  const authOrigin = new URL(GH.auth).origin;
  const popup = window.open(`${GH.auth}/auth?provider=github&site_id=${encodeURIComponent(location.hostname)}&scope=repo`, 'baroni-auth', 'width=620,height=720');
  if (!popup) { err.textContent = 'Your browser blocked the sign-in window. Allow pop-ups for this page and try again.'; return; }
  const onMsg = async (e) => {
    if (e.origin !== authOrigin || typeof e.data !== 'string') return;
    if (e.data === 'authorizing:github') { popup.postMessage(e.data, e.origin); return; }
    const m = e.data.match(/^authorization:github:(success|error):(.*)$/s);
    if (!m) return;
    removeEventListener('message', onMsg);
    let payload = {};
    try { payload = JSON.parse(m[2]); } catch { /* ignore */ }
    if (m[1] !== 'success' || !payload.token) { err.textContent = payload.error || payload.message || 'Sign-in did not finish.'; return; }
    S.gh.token = payload.token;
    try { localStorage.setItem(TOKEN_KEY, payload.token); } catch { sessionStorage.setItem(TOKEN_KEY, payload.token); }
    try { start(await ghLoad()); } catch (e2) { err.textContent = e2.message; }
  };
  addEventListener('message', onMsg);
}

function signOut() {
  S.gh.token = '';
  try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${S.gh.token}`, Accept: 'application/vnd.github+json', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) },
    cache: 'no-store',
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(`GitHub ${r.status}: ${body.message || r.statusText}`);
  }
  return r.status === 204 ? null : r.json();
}

function b64decode(s) {
  const bin = atob(String(s).replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}

async function ghLoad() {
  S.gh.user = await gh('/user').catch(() => null);
  const ref = await gh(`/repos/${GH.repo}/git/ref/heads/${GH.branch}`);
  S.gh.commit = ref.object.sha;
  const file = await gh(`/repos/${GH.repo}/contents/${GH.file}?ref=${S.gh.commit}`);
  return JSON.parse(b64decode(file.content));
}

async function ghPublish(message) {
  const ref = await gh(`/repos/${GH.repo}/git/ref/heads/${GH.branch}`);
  const head = ref.object.sha;
  if (head !== S.gh.commit) {
    // someone (or another tab) published since this was loaded
    const cmp = await gh(`/repos/${GH.repo}/compare/${S.gh.commit}...${head}`);
    if ((cmp.files || []).some((f) => f.filename === GH.file)) {
      throw new Error('The site was changed somewhere else since you opened the editor. Your changes are kept here: reload the page, bring them back, and publish again.');
    }
  }
  const commit = await gh(`/repos/${GH.repo}/git/commits/${head}`);
  const built = renderSite(S.draft);
  const tree = [{ path: GH.file, mode: '100644', type: 'blob', content: `${JSON.stringify(S.draft, null, 2)}\n` }]
    .concat(Object.entries(built).map(([path, content]) => ({ path, mode: '100644', type: 'blob', content })));
  // a deleted case study takes its page with it
  const root = await gh(`/repos/${GH.repo}/git/trees/${commit.tree.sha}`);
  root.tree.filter((e) => /^case-\d+\.html$/.test(e.path) && !(e.path in built)).forEach((e) => tree.push({ path: e.path, mode: '100644', type: 'blob', sha: null }));
  const newTree = await gh(`/repos/${GH.repo}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
  const newCommit = await gh(`/repos/${GH.repo}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }) });
  await gh(`/repos/${GH.repo}/git/refs/heads/${GH.branch}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha }) });
  S.gh.commit = newCommit.sha;
}
