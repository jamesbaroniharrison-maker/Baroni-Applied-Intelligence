# Tender scanning animation (saved for later)

The first version of the Build 03 (Construction Tender) animation, saved on 2026-10-17 when the card
was simplified to the result-and-steps layout.

What it shows, in a loop while the card is on screen:
1. A tender document scans page by page (the page counter runs to 38).
2. Findings drop in one at a time and light their line on the page: deadline, documents to return,
   a site visit marked "unverified, not guessed".
3. The big GBP 2m vs GBP 5m result lands, then the HARD STOP tag and the NO BID stamp.

The figures other than 2m vs 5m (14 Nov, 7 documents, 38 pages) are illustrative.

Files here
- `template.html`: the `<template id="visual-tender">` block that goes in `index.html`.
- `styles.css`: the CSS block (also includes the `.c-steps` styles used by the layout).
- `animation.js`: the `initTenderVisuals()` function that runs it.
- `demo-laptop.webm`, `demo-phone.webm`, `stages-laptop.png`: what it looked like.

To bring it back
1. In `index.html`, replace the current `<template id="visual-tender">` block with `template.html`.
2. In `script.js`, replace the current `initTenderVisuals()` with `animation.js`.
3. In `styles.css`, replace the block that starts `/* Build 03 "Result with steps"` (to the end of the file)
   with `styles.css`.
4. Bump the `?v=` numbers on the two links in `index.html`.
The layout in `script.js` (`renderResultCard`, and `applyVisuals` putting the visual in `.c-visual`) is
unchanged, so nothing else needs touching.
