// Mahalliy ishga tushirish: Vercel kabi public/ va api/ ni xizmat qiladi.
//   npm run dev                — .env dagi DATABASE_URL bo'lsa Neon'ga, bo'lmasa kompyuterdagi PGlite bazasiga (.pglite/) ulanadi
//   PORT=4000 npm run dev      — boshqa port
// Faqat sinash uchun; haqiqiy ish Vercel'da.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadEnv(file = path.join(root, '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

export async function usePglite(dir) {
  const { PGlite } = await import('@electric-sql/pglite');
  const pg = dir ? new PGlite(dir) : new PGlite();
  await pg.waitReady;
  globalThis.__QZ_DB__ = async (text, params) => (await pg.query(text, params)).rows;
  return pg;
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png' };

function vercelHeaders() {
  const v = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const out = [];
  for (const h of v.headers || []) {
    if (h.source !== '/(.*)') throw new Error('dev.mjs faqat "/(.*)" manbasini qo\'llaydi');
    for (const x of h.headers) out.push([x.key, x.value]);
  }
  return out;
}

// opts.helpers: Vercel kabi req.body ni oldindan o'qib qo'yish (ikkala yo'lni sinash uchun)
export function createServer(opts = {}) {
  const hdrs = vercelHeaders();
  const mods = new Map();
  return http.createServer(async (req, res) => {
    for (const [k, v] of hdrs) res.setHeader(k, v);
    const url = new URL(req.url, 'http://localhost');
    const p = decodeURIComponent(url.pathname);
    try {
      const m = p.match(/^\/api\/([a-z]+)$/);
      if (m) {
        const file = path.join(root, 'api', m[1] + '.js');
        if (!fs.existsSync(file)) { res.statusCode = 404; res.end('Not found'); return; }
        if (!mods.has(file)) mods.set(file, (await import(pathToFileURL(file).href)).default);
        if (opts.helpers && req.method !== 'GET') {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const raw = Buffer.concat(chunks).toString('utf8');
          const ct = String(req.headers['content-type'] || '');
          let parsed = raw, bad = false;
          if (ct.startsWith('application/json')) { try { parsed = raw ? JSON.parse(raw) : undefined; } catch (e) { bad = true; } }
          Object.defineProperty(req, 'body', { get() { if (bad) throw new Error('Invalid JSON'); return parsed; } });
        }
        await mods.get(file)(req, res);
        return;
      }
      let f = p === '/' ? '/index.html' : p;
      const full = path.join(root, 'public', f);
      if (!full.startsWith(path.join(root, 'public')) || !fs.existsSync(full) || !fs.statSync(full).isFile()) { res.statusCode = 404; res.end('Not found'); return; }
      res.setHeader('Content-Type', TYPES[path.extname(full)] || 'application/octet-stream');
      res.end(fs.readFileSync(full));
    } catch (e) {
      console.error(e);
      if (!res.writableEnded) { res.statusCode = 500; res.end('dev server error'); }
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  loadEnv();
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    await usePglite(path.join(root, '.pglite'));
    console.log('Baza: kompyuterdagi PGlite (.pglite/ papkasi)');
  } else console.log('Baza: DATABASE_URL');
  if (!process.env.SESSION_SECRET) { process.env.SESSION_SECRET = 'dev-only-secret-dev-only-secret-0123456789'; console.log('SESSION_SECRET berilmagan — mahalliy sinov qiymati ishlatildi'); }
  if (!process.env.SETUP_TOKEN) { process.env.SETUP_TOKEN = 'dev-setup-token-1234'; console.log('SETUP_TOKEN = dev-setup-token-1234 (faqat mahalliy)'); }
  const port = +(process.env.PORT || 3000);
  createServer().listen(port, () => console.log(`http://localhost:${port}`));
}
