// Kirish: parol xeshi (scrypt), imzolangan sessiya cookie (HMAC-SHA256), foydalanuvchini tekshirish.
import crypto from 'node:crypto';
import { q } from './db.js';

const COOKIE = 'qz_s';
const SESSION_DAYS = 30;
const RENEW_DAYS = 15;          // 15 kundan kam qolgan sessiya avtomatik uzaytiriladi
const SCRYPT = { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 };

function secret() {
  const s = process.env.SESSION_SECRET || '';
  if (s.length < 32) {
    const e = new Error('SESSION_SECRET kamida 32 belgi bo\'lishi kerak');
    e.qz = 'no_secret';
    throw e;
  }
  return s;
}
export function secretOk() {
  return (process.env.SESSION_SECRET || '').length >= 32;
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');

function scrypt(pw, salt, p) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(pw, salt, 64, { N: p.N, r: p.r, p: p.p, maxmem: SCRYPT.maxmem }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(pw).normalize('NFC'), salt, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${b64u(salt)}$${b64u(key)}`;
}

export async function verifyPassword(pw, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const p = { N: +parts[1], r: +parts[2], p: +parts[3] };
  const salt = Buffer.from(parts[4], 'base64url');
  const want = Buffer.from(parts[5], 'base64url');
  const got = await scrypt(String(pw).normalize('NFC'), salt, p);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

// Noma'lum login uchun ham vaqt sarflash (login borligini javob vaqtidan bilib bo'lmasin)
let dummy = null;
export async function dummyVerify(pw) {
  if (!dummy) dummy = await hashPassword('dummy-password-qz');
  await verifyPassword(pw, dummy);
  return false;
}

export function passwordProblem(pw, login, role) {
  const s = String(pw || '');
  const min = role === 'admin' ? 10 : 8;
  if (s.length < min) return `Parol kamida ${min} belgi bo'lishi kerak`;
  if (s.length > 200) return 'Parol juda uzun';
  if (login && s.toLowerCase().includes(String(login).toLowerCase())) return "Parolda login bo'lmasin";
  return null;
}

function sign(payload) {
  const body = b64u(JSON.stringify(payload));
  const mac = b64u(crypto.createHmac('sha256', secret()).update('v1.' + body).digest());
  return `v1.${body}.${mac}`;
}

function unsign(tok) {
  const parts = String(tok || '').split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return null;
  const want = crypto.createHmac('sha256', secret()).update('v1.' + parts[1]).digest();
  let got;
  try { got = Buffer.from(parts[2], 'base64url'); } catch (e) { return null; }
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')); } catch (e) { return null; }
}

function isSecure(req) {
  if (process.env.VERCEL) return true;
  return String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https';
}

function appendCookie(res, c) {
  const prev = res.getHeader('Set-Cookie');
  const arr = prev ? (Array.isArray(prev) ? prev : [prev]) : [];
  res.setHeader('Set-Cookie', arr.concat(c));
}

export function setSession(req, res, user) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const tok = sign({ u: user.id, pv: user.pv, exp });
  appendCookie(res, `${COOKIE}=${tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${isSecure(req) ? '; Secure' : ''}`);
}

export function clearSession(req, res) {
  appendCookie(res, `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure(req) ? '; Secure' : ''}`);
}

// Foydalanuvchi qatori qisqa muddat xotirada saqlanadi (har so'rovda bazaga ikkinchi marta bormaslik uchun).
// Bloklash, rol yoki parol o'zgarishi shu muddat ichida barcha serverlarda kuchga kiradi.
const CACHE_MS = process.env.QZ_USER_CACHE_MS != null ? +process.env.QZ_USER_CACHE_MS : 20000;
const cache = new Map();

export function forgetUser(id) { cache.delete(id); }

export async function loadUser(id) {
  const c = cache.get(id);
  if (c && Date.now() - c.t < CACHE_MS) return c.u;
  const rows = await q(`SELECT id, login, name, role, site, pv, active FROM users WHERE id = $1::int`, [id]);
  const u = rows[0] || null;
  cache.set(id, { t: Date.now(), u });
  return u;
}

export function cookieName() { return COOKIE; }

export async function currentUser(req, res) {
  const raw = (String(req.headers.cookie || '').split(';').map((s) => s.trim()).find((s) => s.startsWith(COOKIE + '=')) || '').slice(COOKIE.length + 1);
  if (!raw) return null;
  const p = unsign(raw);
  if (!p || typeof p.u !== 'number' || typeof p.exp !== 'number' || p.exp < Date.now()) return null;
  const u = await loadUser(p.u);
  if (!u || !u.active || u.pv !== p.pv) return null;
  if (res && p.exp - Date.now() < RENEW_DAYS * 864e5) setSession(req, res, u);
  return { id: u.id, uid: 'u' + u.id, login: u.login, name: u.name, role: u.role, site: u.site || null, pv: u.pv };
}

export function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

// Barcha foydalanuvchilar ismlari: { u1: 'Ism', ... } — tarixda «kim o'zgartirdi» ko'rsatish uchun
export async function names() {
  const rows = await q(`SELECT id, name FROM users ORDER BY id`);
  const o = {};
  for (const r of rows) o['u' + r.id] = r.name;
  return o;
}
