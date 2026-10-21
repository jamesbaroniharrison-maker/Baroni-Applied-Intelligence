// Templates for every page of the site. renderSite(content) returns
// { 'index.html': '<!DOCTYPE html>…', … }. Shared by scripts/build.mjs (Node)
// and the editor's live preview (browser), so it must not use Node APIs.
//
// With { edit: true } every piece of text gets data-edit="<path in
// content.json>" so the editor can find it, and animations start finished.

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const hrs = (h) => String(Math.round(Number(h) * 10) / 10);

// Bump when styles.css, site.css or script.js change, so browsers fetch the new copy.
export const ASSET_VERSION = '5';

export const PAGE_ORDER = ['index.html', 'how.html', 'work.html', 'services.html', 'about.html', 'book.html'];

export function caseFile(i) { return `case-${i + 1}.html`; }

export function renderSite(c, { edit = false } = {}) {
  // data-edit attribute for a content path (only in the editor)
  const ed = (path) => (edit ? ` data-edit="${path}"` : '');
  // text with its data-edit wrapper: <span data-edit="path">text</span>
  const t = (path, value) => (edit ? `<span data-edit="${path}">${esc(value)}</span>` : esc(value));
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), c);
  const T = (path) => t(path, get(path));
  // a heading written as plain lead + gold italic ending
  const emph = (base, lead = 'title', em = 'titleEm') =>
    `${T(`${base}.${lead}`)}${get(`${base}.${em}`) ? ` <em>${T(`${base}.${em}`)}</em>` : ''}`;

  const S = c.site;
  const nav = S.nav;
  const cases = c.cases || [];
  const pages = {};

  const NAMES = { 'index.html': nav.home, 'how.html': nav.how, 'work.html': nav.work, 'services.html': nav.services, 'about.html': nav.about, 'book.html': nav.book };
  cases.forEach((cs, i) => { NAMES[caseFile(i)] = `${c.caseFile.caseWord} ${pad(i + 1)}`; });

  // the page the big Next link at the bottom leads to
  function nextOf(f) {
    if (f.startsWith('case-')) {
      const i = Number(f.match(/\d+/)[0]);
      return i < cases.length ? caseFile(i) : 'services.html';
    }
    return PAGE_ORDER[(PAGE_ORDER.indexOf(f) + 1) % PAGE_ORDER.length];
  }

  // ------------------------------------------------------------------ shared parts
  const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    + '<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500'
    + '&family=Geist:wght@400;500;600;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">';

  // Cloudflare Web Analytics - cookieless, no consent banner needed. See ANALYTICS_SETUP.md.
  const ANALYTICS = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "1a0039f6788443d9a61ef4c3ae94fdaa"}'></script>`;

  // Plays the opening animation on every plain load of the home page.
  const INTRO_HEAD = `<script>(function(){try{if(!location.hash||location.hash==='#top'){if(location.hash)history.replaceState(null,'',location.pathname+location.search);if('scrollRestoration' in history)history.scrollRestoration='manual';document.documentElement.classList.add('intro')}}catch(e){}})();</script>`;
  const INTRO = `<div class="intro-overlay" aria-hidden="true">
  <div class="intro-bg"></div>
  <div class="intro-stage">
    <div class="intro-flower"><svg viewBox="0 0 64 64"></svg></div>
    <div class="intro-word"><span class="intro-name">${esc(S.signOff.word)}</span><span class="intro-tag">${esc(S.logoTag)}</span></div>
  </div>
</div>`;

  const header = (cur) => {
    const current = (f) => (f === cur || (cur.startsWith('case-') && f === 'work.html') ? ' aria-current="page"' : '');
    const items = [['how.html', 'how'], ['work.html', 'work'], ['services.html', 'services'], ['about.html', 'about']];
    return `<header class="site-header">
  <div class="container header-row">
    <a href="index.html" class="logo" aria-label="${esc(S.name)} - home">
      <img src="brand/baroni-mark-sm.svg" alt="" width="30" height="30">
      <span class="logo-word">${esc(S.signOff.word)}</span>
      <span class="logo-tag">${esc(S.logoTag)}</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <div class="nav-links">${items.map(([f, k]) => `<a href="${f}"${current(f)}${ed(`site.nav.${k}`)}>${esc(nav[k])}</a>`).join('')}</div>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu"${ed('site.nav.menu')}>${esc(nav.menu)}</button>
      <a href="book.html" class="btn btn-primary btn-sm"${ed('site.nav.book')}>${esc(nav.book)}</a>
    </nav>
  </div>
  <div class="mobile-menu" id="mobile-menu" hidden>${[['index.html', 'home'], ...items].map(([f, k]) => `<a href="${f}"${current(f)}><span>${esc(nav[k])}</span><span class="arrow">→</span></a>`).join('')}<a href="book.html" class="menu-contact"><span>${esc(nav.book)}</span><span class="arrow">→</span></a></div>
</header>`;
  };

  const rail = (items) => `<nav class="rail" aria-label="Page sections">
  <div class="rail-track"></div>
  <div class="rail-fill"></div>
  ${items.map(([id, label]) => `<a class="rail-node" href="#${id}" data-rail="${id}" data-label="${esc(label)}" aria-label="${esc(label)}"><span class="rail-dot"></span></a>`).join('')}
</nav>`;

  const next = (f) => {
    const n = nextOf(f);
    const label = n === 'index.html' ? t('site.next.home', S.next.home) : esc(NAMES[n]);
    return `<a class="t-next" href="${n}"><span${ed('site.next.label')}>${esc(S.next.label)}</span><strong>${label}</strong></a>`;
  };

  const cta = (title = emph('site.cta')) => `  <section class="cta-band" id="cta"><div class="wrap cta-inner"><h2>${title}</h2><a class="btn btn-primary" href="book.html"${ed('site.cta.button')}>${esc(S.cta.button)}</a></div></section>
`;

  const pageHead = (base, key, lead) => `  <section class="wrap p-head"><h1 class="p-title" style="view-transition-name:t-${key}"${ed(`${base}.title`)}>${esc(get(`${base}.title`))}</h1><p class="p-lead">${lead}</p></section>
`;

  const signOff = `<section class="sign-off" aria-label="${esc(S.name)}">
  <div class="container sign-off-inner">
    <img class="sign-off-mark" src="brand/baroni-mark-lg.svg" alt="Baroni sunflower mark">
    <div class="sign-off-word"${ed('site.signOff.word')}>${esc(S.signOff.word)}</div>
    <div class="sign-off-tag"${ed('site.signOff.tag')}>${esc(S.signOff.tag)}</div>
    <a href="#top" class="to-top sign-off-top"${ed('site.footer.toTop')}>${esc(S.footer.toTop)}</a>
  </div>
</section>`;

  const footer = `<footer class="site-footer">
  <div class="container footer-row">
    <span class="footer-name"${ed('site.footer.name')}>${esc(S.footer.name)}</span>
    <span${ed('site.footer.role')}>${esc(S.footer.role)}</span>
    <a href="mailto:${esc(S.email)}?subject=${encodeURIComponent('AI PM enquiry')}" class="footer-pm"${ed('site.footer.pm')}>${esc(S.footer.pm)}</a>
    <a href="privacy"${ed('site.footer.privacy')}>${esc(S.footer.privacy)}</a>
    <span>© <span class="footer-year">${new Date().getFullYear()}</span></span>
  </div>
</footer>`;

  const mobileBar = `<div class="mobile-bar" hidden>
  <div class="mobile-bar-text"><span${ed('site.mobileBar.line1')}>${esc(S.mobileBar.line1)}</span><span${ed('site.mobileBar.line2')}>${esc(S.mobileBar.line2)}</span></div>
  <a href="book.html" class="mobile-bar-cta"${ed('site.mobileBar.button')}>${esc(S.mobileBar.button)}</a>
</div>`;

  // Case-study mock-ups, cloned into each case file's .cf-visual slot by script.js.
  const V = c.visuals;
  const templates = `<template id="visual-approval">
  <div class="build-visual visual-approval" aria-hidden="true">
    <img class="visual-mark" src="brand/baroni-mark-lg.svg" alt="">
    <div class="approval-window">
      <div class="approval-bar"><span></span><span></span><span></span><span class="approval-title"${ed('visuals.approval.title')}>${esc(V.approval.title)}</span></div>
      <div class="approval-body">
        <div class="approval-tabs">${V.approval.tabs.map((tab, i) => `<span${i === 0 ? ' class="is-on"' : ''}${ed(`visuals.approval.tabs.${i}`)}>${esc(tab)}</span>`).join('')}</div>
        <span class="approval-text"${ed('visuals.approval.text')}>${esc(V.approval.text)}</span>
        <span class="approval-line" style="width:70%"></span><span class="approval-line" style="width:52%"></span>
        <div class="approval-actions"><span class="approval-publish"${ed('visuals.approval.publish')}>${esc(V.approval.publish)}</span><span class="approval-edit"${ed('visuals.approval.edit')}>${esc(V.approval.edit)}</span></div>
      </div>
    </div>
    <span class="approval-tag"${ed('visuals.approval.tag')}>${esc(V.approval.tag)}</span>
  </div>
</template>
<template id="visual-voice">
  <div class="build-visual visual-voice" aria-hidden="true">
    <div class="voice-sample">
      <div class="voice-label"${ed('visuals.voice.sampleLabel')}>${esc(V.voice.sampleLabel)}</div>
      <p${ed('visuals.voice.sample')}>${esc(V.voice.sample)}</p>
    </div>
    <span class="voice-arrow">→</span>
    <div class="voice-draft">
      <div class="voice-draft-head"><span${ed('visuals.voice.draftLabel')}>${esc(V.voice.draftLabel)}</span><span class="voice-ok"${ed('visuals.voice.ok')}>${esc(V.voice.ok)}</span></div>
      <p${ed('visuals.voice.draft')}>${esc(V.voice.draft)}</p>
    </div>
  </div>
</template>
<template id="visual-tender">
  <div class="build-visual visual-tender" aria-hidden="true">
    <span class="tv-eyebrow"${ed('visuals.tender.eyebrow')}>${esc(V.tender.eyebrow)}</span>
    <div class="tv-versus"><span class="big bad" data-to="${esc(V.tender.from)}">£${esc(V.tender.from)}m</span><span class="mid"${ed('visuals.tender.vs')}>${esc(V.tender.vs)}</span><span class="big" data-to="${esc(V.tender.to)}">£${esc(V.tender.to)}m</span></div>
    <p class="tv-note"${ed('visuals.tender.note')}>${esc(V.tender.note)}</p>
    <div class="tv-end"><span class="tv-pill"${ed('visuals.tender.pill')}>${esc(V.tender.pill)}</span><div class="tender-verdict"><span${ed('visuals.tender.verdictLabel')}>${esc(V.tender.verdictLabel)}</span><b${ed('visuals.tender.verdict')}>${esc(V.tender.verdict)}</b></div></div>
  </div>
</template>`;

  function page(file, { title, main, rails, home = false, withTemplates = false, withMobileBar = true, jsonLd = '' }) {
    const url = S.url + (file === 'index.html' ? '' : file);
    pages[file] = `<!DOCTYPE html>
<html lang="en"${edit ? ' data-editing' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(S.description)}">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="brand/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="brand/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<meta name="theme-color" content="#1b1f1a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(S.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(S.url)}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(S.description)}">
<meta name="twitter:image" content="${esc(S.url)}og-image.png">
${FONTS}
<link rel="stylesheet" href="styles.css?v=${ASSET_VERSION}">
<link rel="stylesheet" href="site.css?v=${ASSET_VERSION}">
${home && !edit ? INTRO_HEAD : ''}
${jsonLd}
</head>
<body>
${home && !edit ? INTRO : ''}
<a class="skip-link" href="#top">Skip to content</a>
${header(file)}
${rail(rails)}
<main id="top">
${main}
${next(file)}
</main>
${signOff}
${withTemplates ? templates : ''}
${footer}
${withMobileBar ? mobileBar : ''}
<script src="script.js?v=${ASSET_VERSION}"></script>
${edit ? '' : ANALYTICS}
</body>
</html>
`;
  }

  // ================================================================== HOME
  const H = c.home;
  const hero = `  <div class="hero-wrap">
  <section class="container hero">
    <img class="watermark watermark--hero" src="brand/baroni-mark-lg.svg" alt="" aria-hidden="true">
    <div class="hero-text">
      <div class="status-pill"><span class="diamond" aria-hidden="true"></span><span class="status-text"${ed('home.hero.eyebrow')}>${esc(H.hero.eyebrow)}</span></div>
      <h1 class="h1 hero-title">${emph('home.hero')}</h1>
      <p class="lead"${ed('home.hero.sub')}>${esc(H.hero.sub)}</p>
      <div class="btn-row">
        <a href="work.html" class="btn btn-primary hero-primary"><span class="btn-label"${ed('home.hero.primary')}>${esc(H.hero.primary)}</span> <span aria-hidden="true">→</span></a>
        <a href="book.html" class="btn btn-secondary hero-secondary"${ed('home.hero.secondary')}>${esc(H.hero.secondary)}</a>
      </div>
      <p class="trust-line">${H.hero.trust.map((x, i) => `<span${ed(`home.hero.trust.${i}`)}>${esc(x)}</span>`).join('<span class="diamond-sm" aria-hidden="true"></span>')}</p>
    </div>
    <div class="runlog" aria-label="Example pipeline run">
      <div class="runlog-head">
        <span${ed('home.pipeline.label')}>${esc(H.pipeline.label)}</span>
        <span class="runlog-live"><span class="dot dot-sage pulse-fast"></span><span${ed('home.pipeline.live')}>${esc(H.pipeline.live)}</span></span>
      </div>
      <ol class="runlog-steps">
        ${H.pipeline.steps.map((s, i) => `<li class="step"${s.await ? ' data-await="true"' : ''}><span class="step-ring"></span><div><div class="step-name"${ed(`home.pipeline.steps.${i}.name`)}>${esc(s.name)}</div><div class="step-detail"${ed(`home.pipeline.steps.${i}.detail`)}>${esc(s.detail)}</div></div><span class="step-status">QUEUED</span></li>`).join('\n        ')}
        <li class="step step-joke" aria-hidden="true"><span class="step-ring"></span><div><div class="step-name">Fax to head office</div></div><span class="step-status">QUEUED</span></li>
      </ol>
      <a href="${caseFile(1)}" class="runlog-foot"><span class="runlog-foot-label"${ed('home.pipeline.foot')}>${esc(H.pipeline.foot)}</span><span>→</span></a>
    </div>
  </section>
  </div>
`;
  const factsRun = (withEdit) => H.facts.map((f, i) => `<span${withEdit ? ed(`home.facts.${i}`) : ''}>${esc(f)}</span><i>◆</i>`).join('');
  const facts = `<div class="perf"></div><div class="facts" aria-label="Key facts"><div class="facts-run">${factsRun(true)}<span class="facts-copy" aria-hidden="true">${factsRun(false)}</span></div></div><div class="perf"></div>
`;
  const W = H.week;
  const week = `  <section class="wk" id="automate"><div class="wrap">
  <div class="wk-head"><span class="bracket"${ed('home.week.eyebrow')}>${esc(W.eyebrow)}</span><h2>${emph('home.week')}</h2></div>
  <div class="wk-cal"><div class="wk-scan" aria-hidden="true"><span${ed('home.week.scan')}>${esc(W.scan)}</span></div>${W.days.map((d, di) => `<div class="wk-day"><h3${ed(`home.week.days.${di}.day`)}>${esc(d.day)}</h3>${d.jobs.map((j, ji) => {
    const p = `home.week.days.${di}.jobs.${ji}`;
    return `<div class="wk-ev${j.auto ? ' auto' : ''}" data-h="${hrs(j.hours)}" style="--h:${Math.max(Number(j.hours) || 1, 1)}"><span class="wk-t"><span${ed(`${p}.time`)}>${esc(j.time)}</span> · ${hrs(j.hours)}h</span><b${ed(`${p}.name`)}>${esc(j.name)}</b>${j.auto ? `<span class="wk-tag">${esc(W.tag)}</span>` : ''}</div>`;
  }).join('')}</div>`).join('')}</div>
  <div class="wk-foot"><p class="wk-tally"><b>0h</b> <span${ed('home.week.tally')}>${esc(W.tally)}</span></p><button type="button" class="wk-replay"${ed('home.week.replay')}>${esc(W.replay)}</button>
  <a class="wk-go" href="how.html"${ed('home.week.go')}>${esc(W.go)}</a></div>
  <p class="wk-ex"${ed('home.week.note')}>${esc(W.note)}</p>
</div></section>
`;
  const idea = `  <section class="wrap pr" id="idea"><span class="bracket"${ed('home.idea.eyebrow')}>${esc(H.idea.eyebrow)}</span>
<p class="pr-a">${emph('home.idea', 'line', 'lineEm')}</p>
<p class="pr-b"${ed('home.idea.sub')}>${esc(H.idea.sub)}</p></section>
`;
  const X = H.explore;
  const tile = (key, file, extra) => `<a class="bx bx-${key === 'services' ? 'svc' : key}" href="${file}"><span class="t-type"${ed(`home.explore.${key}.type`)}>${esc(X[key].type)}</span><span class="bx-title" style="view-transition-name:t-${key}">${esc(nav[key])}</span>
    <p${ed(`home.explore.${key}.line`)}>${esc(X[key].line)}</p>${extra}<span class="t-explore">${esc(X.button)}</span></a>`;
  const caseStack = `<div class="t-stack t-files" aria-hidden="true">${cases.slice(0, 3).map((cs, i) => `<span class="tf tf-${esc(cs.color)}"><b>${esc(c.caseFile.caseWord)} ${pad(i + 1)}</b><i>${esc(cs.name)}</i></span>`).join('')}</div>`;
  const svcWords = `<ul class="bx-words" aria-hidden="true">${c.services.rows.map((r) => `<li>${esc(r.name)}</li>`).join('')}</ul>`;
  const pipe = `<ol class="bx-pipe" aria-hidden="true">${c.how.steps.map((s) => `<li><i></i>${esc(s.name)}<span>QUEUED</span></li>`).join('')}</ol>`;
  const aboutFacts = `<div class="bx-facts" aria-hidden="true"><img src="brand/baroni-mark-lg.svg" alt=""><ul>${c.about.facts.map((f) => `<li><span>${esc(f.label)}</span>${esc(f.value)}</li>`).join('')}</ul></div>`;
  const explore = `  <section class="wrap bx-sec" id="explore"><span class="bracket"${ed('home.explore.eyebrow')}>${esc(X.eyebrow)}</span><div class="bx-grid">
  ${tile('how', 'how.html', pipe)}
  ${tile('work', 'work.html', caseStack)}
  ${tile('services', 'services.html', svcWords)}
  ${tile('about', 'about.html', aboutFacts)}
</div></section>
`;
  const jsonLd = `<script type="application/ld+json">
${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Person', name: S.person, jobTitle: S.jobTitle, url: S.url, description: S.description,
    knowsAbout: ['AI Automation', 'AI Integration', 'AI Workflow Automation', 'Business Process Automation', 'Content Automation'],
    workLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: 'Croydon', addressRegion: 'London', addressCountry: 'GB' } },
    areaServed: 'GB',
    worksFor: { '@type': 'Organization', name: S.name, url: S.url, logo: `${S.url}brand/icon-512.png` },
    sameAs: [S.linkedin, S.github],
  }, null, 2)}
</script>`;
  page('index.html', {
    title: H.seoTitle, home: true, jsonLd,
    rails: [['automate', W.eyebrow], ['idea', H.idea.eyebrow], ['explore', X.eyebrow], ['cta', nav.book]],
    main: hero + facts + week + idea + explore + cta(),
  });

  // ================================================================== HOW IT WORKS
  const HW = c.how;
  const how = pageHead('how', 'how', emph('how', 'lead', 'leadEm')) + `  <section class="wrap hw">
  <div class="hw-run" id="steps" data-ready="${esc(HW.panel.ready)}" data-running="${esc(HW.panel.running)}" data-live="${esc(HW.panel.live)}"><div class="runlog-head"><span${ed('how.panel.label')}>${esc(HW.panel.label)}</span><span class="runlog-live"><span class="dot dot-sage pulse-fast"></span><span class="hw-state">${esc(HW.panel.ready)}</span></span></div>
    <ol class="hw-steps">${HW.steps.map((s, i) => `<li class="step hw-step"><span class="step-ring"></span><div><div class="step-name"><span class="hw-n">${pad(i + 1)}</span><span${ed(`how.steps.${i}.name`)}>${esc(s.name)}</span></div><div class="hw-line"${ed(`how.steps.${i}.line`)}>${esc(s.line)}</div><div class="step-detail"><span${ed('how.panel.yourPart')}>${esc(HW.panel.yourPart)}</span> <span${ed(`how.steps.${i}.you`)}>${esc(s.you)}</span></div></div><span class="step-status">QUEUED</span></li>`).join('')}</ol>
    <div class="hw-foot">${HW.panel.foot.map((f, i) => `<span${ed(`how.panel.foot.${i}`)}>${esc(f)}</span>`).join('')}</div></div>
  <div class="hw-checks" id="checks" data-passed="${esc(HW.checks.passed)}"><div class="hw-checks-head"><span${ed('how.checks.label')}>${esc(HW.checks.label)}</span><b class="hw-pass">0 / ${HW.checks.items.length} ${esc(HW.checks.passed)}</b></div><ul>${HW.checks.items.map((k, i) => `<li><span class="hw-tick" aria-hidden="true">✓</span><div><b${ed(`how.checks.items.${i}.title`)}>${esc(k.title)}</b><small${ed(`how.checks.items.${i}.detail`)}>${esc(k.detail)}</small></div><span class="hw-ok">${esc(HW.checks.pass)}</span></li>`).join('')}</ul>
    <p class="hw-gdpr"><span${ed('how.gdpr')}>${esc(HW.gdpr)}</span> <a href="privacy"${ed('how.privacyLink')}>${esc(HW.privacyLink)}</a></p></div>
</section>
`;
  page('how.html', { title: HW.seoTitle, rails: [['steps', HW.steps.length ? `${pad(HW.steps.length)} steps` : 'Steps'], ['checks', HW.checks.label]], main: how });

  // ================================================================== CASE FILES
  const CFL = c.caseFile;
  const folder = (cs, i) => `<a class="cf-folder cf-${esc(cs.color)}" href="${caseFile(i)}" style="view-transition-name:case-${i + 1}"><span class="cf-tab">${esc(CFL.caseWord)} ${pad(i + 1)}</span><span class="cf-status${cs.live ? '' : ' amber'}">${esc(cs.stamp)}</span><strong>${esc(cs.name)}</strong><span class="cf-line">${esc(cs.line)}</span><span class="cf-open">${esc(CFL.open)}</span></a>`;
  const WK = c.work;
  const work = pageHead('work', 'work', emph('work', 'lead', 'leadEm')) + `  <section class="wrap" id="files"><p class="cf-hint"${ed('work.hint')}>${esc(WK.hint)}</p><div class="cf-row">${cases.map(folder).join('')}</div>
<div class="cf-proof" id="results">${WK.stats.map((s, i) => `<div><b${ed(`work.stats.${i}.big`)}>${esc(s.big)}</b><small${ed(`work.stats.${i}.small`)}>${esc(s.small)}</small></div>`).join('')}</div></section>
` + cta(emph('work', 'ctaTitle', 'ctaTitleEm'));
  page('work.html', { title: WK.seoTitle, rails: [['files', WK.title], ['results', 'Results'], ['cta', nav.book]], main: work });

  cases.forEach((cs, i) => {
    const p = `cases.${i}`;
    const n = cases[(i + 1) % cases.length];
    const sheet = `<article class="cf-sheet" style="view-transition-name:case-${i + 1}">
  <div class="cf-sheet-top"><span class="cf-ref">${esc(CFL.caseWord)} ${pad(i + 1)} · ${esc(String(cs.name).toUpperCase())}</span><span class="cf-right"><span class="cf-stamp${cs.live ? '' : ' amber'}"${ed(`${p}.stamp`)}>${esc(cs.stamp)}</span></span></div>
  <h1 class="cf-title">${emph(p)}</h1>
  <div class="cf-blocks"><div><span${ed('caseFile.problem')}>${esc(CFL.problem)}</span><p${ed(`${p}.problem`)}>${esc(cs.problem)}</p></div><div><span${ed('caseFile.does')}>${esc(CFL.does)}</span><p${ed(`${p}.does`)}>${esc(cs.does)}</p></div><div class="res"><span${ed('caseFile.result')}>${esc(CFL.result)}</span><p${ed(`${p}.result`)}>${esc(cs.result)}</p></div></div>
  <div class="cf-body"><ol class="cf-steps">${cs.steps.map((s, k) => `<li${Number(cs.youStep) === k + 1 ? ` class="you" data-you="${esc(CFL.you)}"` : ''}${ed(`${p}.steps.${k}`)}>${esc(s)}</li>`).join('')}</ol><div class="cf-visual" data-visual="${esc(cs.visual)}"></div></div>
  <div class="cf-sheet-foot"><span${ed('caseFile.foot')}>${esc(CFL.foot)}</span><a class="btn btn-primary" href="book.html"${ed('caseFile.button')}>${esc(CFL.button)}</a></div>
</article>`;
    const main = `  <section class="wrap cf-page-main" id="file"><a class="cf-back" href="work.html"${ed('caseFile.back')}>${esc(CFL.back)}</a>
${sheet}
<div class="cf-next" id="next-file"><span${ed('caseFile.nextFile')}>${esc(CFL.nextFile)}</span>${cases.length > 1 ? folder(n, (i + 1) % cases.length) : ''}</div></section>
`;
    page(caseFile(i), { title: `${cs.name} - ${S.name}`, rails: [['file', cs.name], ['next-file', CFL.nextFile]], main, withTemplates: true });
  });

  // ================================================================== SERVICES
  const SV = c.services;
  const svLayout = ['picker', 'cards', 'chat'].includes(SV.layout) ? SV.layout : 'picker';
  // the answer to one row: service name, headline, line, link
  const svAnswer = (r, i, cls) => {
    const p = `services.rows.${i}`;
    return `<div class="${cls}"><span class="t-type">${pad(i + 1)} · <span${ed(`${p}.name`)}>${esc(r.name)}</span></span><h3${ed(`${p}.lead`)}>${esc(r.lead)}</h3><p${ed(`${p}.body`)}>${esc(r.body)}</p><a class="sv-case" href="${esc(r.href)}"><span${ed(`${p}.link`)}>${esc(r.link)}</span> →</a></div>`;
  };
  let svBody;
  if (svLayout === 'chat') {
    svBody = `<section class="wrap sv">${SV.rows.map((r, i) => {
      const p = `services.rows.${i}`;
      return `<article class="sv-row" id="sv-${i + 1}">
<div class="sv-ask"><span class="sv-who"${ed('services.say')}>${esc(SV.say)}</span><p class="sv-say">${t(`${p}.say`, r.say)}</p></div>
<div class="sv-typing" aria-hidden="true"><i></i><i></i><i></i></div>
${svAnswer(r, i, 'sv-do')}</article>`;
    }).join('')}</section>`;
  } else if (svLayout === 'cards') {
    svBody = `<section class="wrap svc" id="sv"><div class="svc-grid">${SV.rows.map((r, i) => {
      const p = `services.rows.${i}`;
      return `<article class="svc-card svc-${['manila', 'sage', 'gold'][i % 3]}" id="sv-${i + 1}"><div class="svc-inner">
<div class="svc-face svc-front"><span class="svc-n">${pad(i + 1)}</span><span class="sv-who"${ed('services.say')}>${esc(SV.say)}</span><p class="sv-say">"${t(`${p}.say`, r.say)}"</p><span class="svc-turn" aria-hidden="true">Turn over ↻</span></div>
${svAnswer(r, i, 'svc-face svc-back')}</div></article>`;
    }).join('')}</div></section>`;
  } else {
    svBody = `<section class="wrap svp" id="sv"><p class="svp-hint"${ed('services.say')}>${esc(SV.say)}</p><ol class="svp-list">${SV.rows.map((r, i) => {
      const p = `services.rows.${i}`;
      return `<li class="svp-item${i === 0 ? ' on' : ''}" id="sv-${i + 1}"><button type="button" class="svp-q" aria-expanded="${i === 0}"><span class="svp-n">${pad(i + 1)}</span><span class="svp-say">"${t(`${p}.say`, r.say)}"</span><i class="svp-bar" aria-hidden="true"></i></button>
${svAnswer(r, i, 'svp-a')}</li>`;
    }).join('')}</ol></section>`;
  }
  const services = pageHead('services', 'services', emph('services', 'lead', 'leadEm')) + `  ${svBody}
` + cta();
  page('services.html', {
    title: SV.seoTitle,
    rails: svLayout === 'chat' ? [...SV.rows.map((r, i) => [`sv-${i + 1}`, r.name]), ['cta', nav.book]] : [['sv', SV.title], ['cta', nav.book]],
    main: services,
  });

  // ================================================================== ABOUT
  const A = c.about;
  const credStatus = (cr) => {
    let s = A.statusWords[cr.status] ? esc(A.statusWords[cr.status]) : '';
    if (cr.status === 'link' && cr.linkUrl) s = `<a href="${esc(cr.linkUrl)}" target="_blank" rel="noopener">${esc(String(cr.linkLabel || 'Verify').toUpperCase())} ↗</a>`;
    if (cr.note) s += ` · ${esc(String(cr.note).toUpperCase())}`;
    return s;
  };
  const about = `  <section class="t-spread"><img src="brand/baroni-mark-lg.svg" alt=""><div class="wrap"><a class="t-back" href="index.html"${ed('about.back')}>${esc(A.back)}</a>
<h1 class="p-title" style="view-transition-name:t-about"${ed('about.title')}>${esc(A.title)}</h1></div></section>
  <section class="wrap" id="credentials"><div class="t-about"><div><p class="p-lead" style="color:var(--ink)"${ed('about.bio')}>${esc(A.bio)}</p>
<div class="t-links"><a class="btn btn-ghost" href="${esc(S.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a><a class="btn btn-ghost" href="${esc(S.github)}" target="_blank" rel="noopener">GitHub ↗</a></div></div>
<ul class="t-facts">${A.facts.map((f, i) => `<li><span${ed(`about.facts.${i}.label`)}>${esc(f.label)}</span><span class="t-fv"${ed(`about.facts.${i}.value`)}>${esc(f.value)}</span></li>`).join('')}</ul></div>
<span class="bracket t-sub" id="background"${ed('about.backgroundLabel')}>${esc(A.backgroundLabel)}</span><div class="t-creds">${A.creds.map((cr, i) => `<div><b${ed(`about.creds.${i}.title`)}>${esc(cr.title)}</b><small${ed(`about.creds.${i}.subtitle`)}>${esc(cr.subtitle)}</small><em>${credStatus(cr)}</em></div>`).join('')}</div>
<p class="t-quote" id="quote"${ed('about.quote')}>${esc(A.quote)}</p></section>
` + cta();
  page('about.html', { title: A.seoTitle, rails: [['credentials', A.title], ['background', A.backgroundLabel], ['quote', 'In short']], main: about });

  // ================================================================== BOOK A CALL
  const B = c.book;
  const F = B.form;
  const book = `  <section id="book" class="section">
    <div class="container contact">
      <div class="contact-intro">
        <div class="section-label" style="view-transition-name:t-book"${ed('book.eyebrow')}>${esc(B.eyebrow)}</div>
        <h1 class="contact-title">${emph('book')}</h1>
        <p class="body-lg narrow contact-body"${ed('book.body')}>${esc(B.body)}</p>
        <p class="trust-line">${B.trust.map((x, i) => `<span${ed(`book.trust.${i}`)}>${esc(x)}</span>`).join('<span class="diamond-sm" aria-hidden="true"></span>')}</p>
        <div class="link-list">
          <button type="button" class="link-row copy-email" data-email="${esc(S.email)}" data-copy="${esc(B.copy)}" data-copied="${esc(B.copied)}"><span class="email">${esc(S.email)}</span><span class="copy-label" aria-live="polite">${esc(B.copy)}</span></button>
          <a class="link-row linkedin-link" href="${esc(S.linkedin)}" target="_blank" rel="noopener"><span>LinkedIn</span><span>↗</span></a>
          <a class="link-row github-link" href="${esc(S.github)}" target="_blank" rel="noopener"><span>GitHub</span><span>↗</span></a>
        </div>
      </div>
      <div class="form-panel">
        <div class="form-panel-head"${ed('book.form.head')}>${esc(F.head)}</div>
        <div class="form-panel-body">
          <form class="contact-form" novalidate data-endpoint="${esc(S.formEndpoint)}" data-missing="${esc(F.missing)}" data-sent-mail="${esc(F.sentMail)}" data-sent="${esc(F.sent)}" data-wait="${esc(F.wait)}" data-check="${esc(F.check)}" data-failed="${esc(F.failed)}" data-empty-note="${esc(F.emptyNote)}">
            <div class="field-row">
              <label><span${ed('book.form.name')}>${esc(F.name)}</span><input name="name" placeholder="${esc(F.namePlaceholder)}" autocomplete="name" maxlength="100"></label>
              <label><span${ed('book.form.email')}>${esc(F.email)}</span><input name="email" type="email" placeholder="${esc(F.emailPlaceholder)}" autocomplete="email" maxlength="200"></label>
            </div>
            <label><span${ed('book.form.message')}>${esc(F.message)}</span> <span class="label-hint"${ed('book.form.messageHint')}>${esc(F.messageHint)}</span><textarea name="message" rows="3" maxlength="5000" placeholder="${esc(F.messagePlaceholder)}"></textarea></label>
            <!-- honeypot: hidden from real visitors via CSS (not type="hidden",
                 which some bots skip), left for bots that fill every field -->
            <label class="honeypot" aria-hidden="true">Company<input name="company" tabindex="-1" autocomplete="off"></label>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary"${ed('book.form.submit')}>${esc(F.submit)}</button>
              <span class="form-error" role="alert"></span>
            </div>
            <p class="price-line"${ed('book.form.price')}>${esc(F.price)}</p>
          </form>
          <div class="form-success" hidden>
            <span class="diamond diamond-lg" aria-hidden="true"></span>
            <div class="success-title" tabindex="-1">${esc(F.thanks)} <span class="success-name"></span>.</div>
            <p class="success-body"></p>
            <button type="button" class="text-btn reset-form">${esc(F.again)}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="cv" id="faq"><div class="wrap cv-head"><span class="bracket"${ed('book.faqEyebrow')}>${esc(B.faqEyebrow)}</span><h2>${emph('book', 'faqTitle', 'faqTitleEm')}</h2></div>
<div class="cv-stage"><div class="cv-floor"></div><div class="cv-ring">${B.faq.map((f, i) => `<div class="cv-card" data-i="${i}"><div class="cv-inner"><div class="cv-face cv-front"><span class="cv-q">Q${i + 1}</span><h3${ed(`book.faq.${i}.q`)}>${esc(f.q)}</h3><span class="cv-tap">${esc(B.tap)}</span></div>
<div class="cv-face cv-back"><span class="cv-q">A${i + 1}</span><p${ed(`book.faq.${i}.a`)}>${esc(f.a)}</p></div></div></div>`).join('')}</div></div>
<div class="cv-ctrl"><button type="button" class="btn btn-ghost" data-d="-1" aria-label="Previous question">←</button><span class="cv-count">1 / ${B.faq.length}</span><button type="button" class="btn btn-ghost" data-d="1" aria-label="Next question">→</button></div></section>
`;
  page('book.html', { title: B.seoTitle, rails: [['book', nav.book], ['faq', B.faqEyebrow]], main: book, withMobileBar: false });

  return pages;
}
