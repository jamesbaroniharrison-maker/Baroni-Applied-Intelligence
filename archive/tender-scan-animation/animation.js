function initTenderVisuals() {
  $$('.visual-tender').forEach((v) => {
    const page = $('.tender-page', v);
    // three findings, then the result they lead to (the big figures and the stamp)
    const rows = [...$$('.tender-row', v), $('.tender-result', v)].filter(Boolean);
    const verdict = $('.tender-verdict', v);
    const kinds = rows.map((r) => (r.classList.contains('is-stop') ? 'is-stop' : r.classList.contains('is-warn') ? 'is-warn' : ''));
    const hits = rows.map((_, i) => $(`.tl-hit[data-hit="${i}"]`, v));
    const PAGES = 38;
    let timers = [];
    let running = false;
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    const reset = () => {
      v.classList.remove('is-scanning');
      rows.forEach((r) => r.classList.remove('is-in'));
      hits.forEach((h) => h && h.classList.remove('is-hit', 'is-stop', 'is-warn'));
      verdict.classList.remove('is-in');
      page.textContent = '1';
    };
    const cycle = () => {
      reset();
      at(400, () => v.classList.add('is-scanning'));
      for (let p = 2; p <= PAGES; p += 1) at(400 + (p - 1) * 105, () => { page.textContent = String(p); });
      rows.forEach((r, i) => at(1100 + i * 900, () => {
        if (hits[i]) hits[i].classList.add('is-hit', ...(kinds[i] ? [kinds[i]] : []));
        r.classList.add('is-in');
      }));
      const end = 1100 + rows.length * 900;
      at(end - 300, () => v.classList.remove('is-scanning'));
      at(end + 200, () => verdict.classList.add('is-in'));
      at(end + 4500, cycle);
    };
    const stop = () => { timers.forEach(clearTimeout); timers = []; };

    reset();
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; cycle(); }
      else if (!entry.isIntersecting && running) { running = false; stop(); }
    }, { threshold: 0.4 }).observe(v);
  });
}
