// Builds every page from content/content.json into the repo root.
//   node scripts/build.mjs
// GitHub Pages serves the generated files as they are; the editor at /admin
// does the same render in the browser and commits the results.
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSite } from './render.js';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function build() {
  const content = JSON.parse(readFileSync(join(ROOT, 'content', 'content.json'), 'utf8'));
  const pages = renderSite(content);
  for (const [file, html] of Object.entries(pages)) writeFileSync(join(ROOT, file), html);
  // sitemap + robots so search engines find every page
  const base = content.site.url;
  const urls = Object.keys(pages).map((f) => (f === 'index.html' ? base : base + f));
  const entries = urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n');
  writeFileSync(join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
  writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`);
  // a deleted case study leaves its old page behind; remove it
  for (const f of readdirSync(ROOT)) {
    if (/^case-\d+\.html$/.test(f) && !(f in pages)) unlinkSync(join(ROOT, f));
  }
  return Object.keys(pages);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log('built', build().join(', '));
}
