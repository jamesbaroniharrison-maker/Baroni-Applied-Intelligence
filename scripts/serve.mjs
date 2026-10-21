// Local preview + editor server.
//   node scripts/serve.mjs          site on http://localhost:8080, editor at /admin
//   node scripts/serve.mjs --lan    also reachable from your phone (e.g. over Tailscale);
//                                   the editor and /api stay on this computer only
// The editor saves to content/content.json, keeps a copy of every save in
// history/, and rebuilds the pages.
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, normalize, extname } from 'node:path';
import { networkInterfaces } from 'node:os';
import { ROOT, build } from './build.mjs';

const PORT = Number(process.env.PORT) || 8080;
const LAN = process.argv.includes('--lan');
const HISTORY = join(ROOT, 'history');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain',
};

const isLocal = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const readBody = (req) => new Promise((ok, fail) => {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 5e6) fail(new Error('too big')); });
  req.on('end', () => ok(data));
  req.on('error', fail);
});

function history() {
  if (!existsSync(HISTORY)) return [];
  return readdirSync(HISTORY).filter((f) => f.endsWith('.json')).sort().reverse()
    .map((f) => ({ id: f.replace(/\.json$/, ''), date: new Date(Number(f.split('-')[0])).toISOString(), note: f.split('-').slice(1).join('-').replace(/\.json$/, '') }));
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  try {
    if (path.startsWith('/api/') || path.startsWith('/admin')) {
      if (!isLocal(req)) return send(res, 404, 'Not found', 'text/plain');
    }
    if (path === '/api/content' && req.method === 'GET') {
      return send(res, 200, { mode: 'local', content: JSON.parse(readFileSync(join(ROOT, 'content', 'content.json'), 'utf8')) });
    }
    if (path === '/api/save' && req.method === 'POST') {
      const { content, note } = JSON.parse(await readBody(req));
      if (!content || !content.site) return send(res, 400, { error: 'No content' });
      mkdirSync(HISTORY, { recursive: true });
      const safeNote = String(note || 'save').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
      writeFileSync(join(HISTORY, `${Date.now()}-${safeNote}.json`), JSON.stringify(content, null, 2));
      writeFileSync(join(ROOT, 'content', 'content.json'), JSON.stringify(content, null, 2) + '\n');
      return send(res, 200, { ok: true, pages: build() });
    }
    if (path === '/api/history' && req.method === 'GET') return send(res, 200, history());
    if (path.startsWith('/api/history/')) {
      const id = path.split('/').pop().replace(/[^\w.-]/g, '');
      const f = join(HISTORY, id + '.json');
      return existsSync(f) ? send(res, 200, readFileSync(f, 'utf8')) : send(res, 404, { error: 'No such version' });
    }
    if (path === '/admin') { res.writeHead(301, { Location: '/admin/' }); return res.end(); }
    if (path.endsWith('/')) path += 'index.html';
    if (path === '/privacy') path = '/privacy.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
    return send(res, 200, readFileSync(file), TYPES[extname(file)] || 'application/octet-stream');
  } catch (err) {
    return send(res, 500, { error: String(err.message || err) });
  }
}).listen(PORT, LAN ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Site:   http://localhost:${PORT}/`);
  console.log(`Editor: http://localhost:${PORT}/admin/`);
  if (LAN) {
    for (const list of Object.values(networkInterfaces())) {
      for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`Phone:  http://${a.address}:${PORT}/  (site only)`);
    }
  }
});
