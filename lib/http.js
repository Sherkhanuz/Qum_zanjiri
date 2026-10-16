// So'rov va javob bilan ishlash. Vercel yordamchilariga (req.query, res.json) tayanmaydi —
// oddiy Node http obyektlari bilan ham, Vercel bilan ham bir xil ishlaydi.
import { currentUser } from './auth.js';

export class HttpError extends Error {
  constructor(status, code, message, extra) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.extra = extra || null;
  }
}

export function send(res, status, obj, headers) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.statusCode = status;
  if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (headers) for (const k in headers) res.setHeader(k, headers[k]);
  res.end(body);
}

export function query(req) {
  const u = new URL(req.url || '/', 'http://x');
  const o = {};
  for (const [k, v] of u.searchParams) o[k] = v;
  return o;
}

export function cookies(req) {
  const out = {};
  const h = req.headers && req.headers.cookie;
  if (!h) return out;
  for (const part of String(h).split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k || k in out) continue;
    try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch (e) { out[k] = part.slice(i + 1).trim(); }
  }
  return out;
}

function readStream(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0, done = false;
    req.on('data', (c) => {
      if (done) return;
      n += c.length;
      if (n > limit) { done = true; reject(new HttpError(413, 'too_large', "So'rov juda katta")); return; }
      chunks.push(c);
    });
    req.on('end', () => { if (!done) { done = true; resolve(Buffer.concat(chunks).toString('utf8')); } });
    req.on('error', (e) => { if (!done) { done = true; reject(e); } });
  });
}

// JSON tanani o'qish. Vercel tanani o'zi o'qib req.body ga qo'ygan bo'lsa — o'shani oladi.
export async function jsonBody(req, limit = 1_000_000) {
  const ct = String((req.headers && req.headers['content-type']) || '').toLowerCase();
  if (!ct.startsWith('application/json')) throw new HttpError(415, 'bad_request', 'Content-Type application/json bo\'lishi kerak');
  let raw;
  let pre;
  try { pre = req.body; } catch (e) { throw new HttpError(400, 'bad_request', "JSON noto'g'ri"); }
  if (pre !== undefined && pre !== null) {
    if (Buffer.isBuffer(pre)) raw = pre.toString('utf8');
    else if (typeof pre === 'string') raw = pre;
    else {
      // allaqachon obyekt: hajmini tekshirish uchun qayta matnga aylantiramiz
      const s = JSON.stringify(pre);
      if (s.length > limit) throw new HttpError(413, 'too_large', "So'rov juda katta");
      if (typeof pre !== 'object' || Array.isArray(pre)) throw new HttpError(400, 'bad_request', "JSON obyekt bo'lishi kerak");
      return pre;
    }
  } else {
    raw = await readStream(req, limit);
  }
  if (raw.length > limit) throw new HttpError(413, 'too_large', "So'rov juda katta");
  let v;
  try { v = JSON.parse(raw); } catch (e) { throw new HttpError(400, 'bad_request', "JSON noto'g'ri"); }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, 'bad_request', "JSON obyekt bo'lishi kerak");
  return v;
}

// Boshqa saytdan yuborilgan so'rovni rad etish: maxsus sarlavha + Origin tekshiruvi.
function checkOrigin(req) {
  if (req.headers['x-qz'] !== '1') throw new HttpError(403, 'refused', "So'rov rad etildi");
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch (e) { host = ''; }
    const mine = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    if (!host || host !== mine) throw new HttpError(403, 'refused', "So'rov rad etildi");
  }
}

const ROLE_OK = {
  any: () => true,
  write: (u) => u.role === 'admin' || u.role === 'operator',
  admin: (u) => u.role === 'admin',
};

// handlers: { GET: {auth, fn}, POST: {auth, fn, limit} } ; auth: false | 'any' | 'write' | 'admin'
export function route(handlers) {
  return async function handler(req, res) {
    try {
      const m = String(req.method || 'GET').toUpperCase();
      const h = handlers[m];
      if (!h) {
        res.setHeader('Allow', Object.keys(handlers).join(', '));
        throw new HttpError(405, 'bad_request', 'Usul qo\'llanmaydi');
      }
      if (m !== 'GET') checkOrigin(req);
      let user = null;
      if (h.auth) {
        user = await currentUser(req, res);
        if (!user) throw new HttpError(401, 'unauthenticated', 'Tizimga kiring');
        if (!ROLE_OK[h.auth](user)) throw new HttpError(403, 'refused', "Bu amalga ruxsat yo'q");
      }
      const body = m === 'GET' ? null : await jsonBody(req, h.limit || 1_000_000);
      const out = await h.fn({ req, res, user, q: query(req), body });
      if (out !== undefined && !res.writableEnded) send(res, 200, out);
    } catch (e) {
      if (res.writableEnded) return;
      if (e instanceof HttpError) {
        send(res, e.status, { error: Object.assign({ code: e.code, message: e.message }, e.extra || {}) });
        return;
      }
      // Baza xatolari
      if (e && e.qz === 'no_database') { send(res, 503, { error: { code: 'no_database', message: 'Baza ulanmagan (DATABASE_URL)' } }); return; }
      if (e && e.qz === 'no_secret') { send(res, 503, { error: { code: 'no_secret', message: 'SESSION_SECRET sozlanmagan' } }); return; }
      const pg = e && e.code;
      if (pg === '54000') { send(res, 413, { error: { code: 'quota_exceeded', message: 'Hujjat juda katta' } }); return; }
      if (pg === '42P01' || pg === '42883') { send(res, 503, { error: { code: 'setup_needed', message: "Baza hali sozlanmagan — /setup.html ni oching" } }); return; }
      if (pg === '22P02' || pg === '22P05' || pg === '22021') { send(res, 400, { error: { code: 'bad_request', message: "Ma'lumot noto'g'ri" } }); return; }
      console.error('[qz]', req.method, req.url, e && (e.stack || e.message || e));
      send(res, 500, { error: { code: 'internal', message: 'Server xatosi' } });
    }
  };
}

export function clientIp(req) {
  const x = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '';
  const ip = String(x).split(',')[0].trim();
  return ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}
