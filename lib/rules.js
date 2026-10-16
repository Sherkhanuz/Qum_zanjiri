// Yozish qoidalari: kim, qaysi kolleksiyaga, qanday shakldagi ma'lumot yoza oladi.
// Server «kim yozdi» maydonlarini (by, dby, u) o'zi qo'yadi — brauzer yuborgan qiymatga ishonmaydi.
import { HttpError } from './http.js';
import { JOURNALS } from './db.js';

export const ID_RE = /^[A-Za-z0-9_.-]{1,80}$/;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const bad = (m) => new HttpError(400, 'invalid_argument', m);
const refused = (m) => new HttpError(403, 'refused', m || "Bu amalga ruxsat yo'q");

function onlyKeys(o, allowed, what) {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) throw bad(`${what}: ruxsat etilmagan maydon «${k}»`);
}

function stampRows(rows, uid, what) {
  if (!isObj(rows)) throw bad(`${what}: rows obyekt bo'lishi kerak`);
  const ids = Object.keys(rows);
  if (ids.length > 1000) throw bad(`${what}: bir so'rovda 1000 dan ortiq yozuv`);
  for (const id of ids) {
    if (!ID_RE.test(id)) throw bad(`${what}: yozuv id noto'g'ri`);
    const r = rows[id];
    if (!isObj(r)) throw bad(`${what}: yozuv obyekt bo'lishi kerak`);
    if ('by' in r) r.by = uid;
    if (r.dby != null) r.dby = uid;
  }
}

function stampEntries(e, uid) {
  if (!isObj(e)) throw bad("log: e obyekt bo'lishi kerak");
  const ids = Object.keys(e);
  if (ids.length > 500) throw bad("log: juda ko'p yozuv");
  for (const id of ids) {
    if (!ID_RE.test(id)) throw bad("log: id noto'g'ri");
    if (!isObj(e[id])) throw bad("log: yozuv obyekt bo'lishi kerak");
    e[id].by = uid;
  }
}

// Natija: { data, mode } ; mode: 'merge' (yo'q bo'lsa yaratadi, bor bo'lsa chuqur birlashtiradi),
// 'replace' (to'liq almashtiradi), 'update' (faqat mavjud hujjatni birlashtiradi).
export function checkWrite(user, coll, id, op, data) {
  if (typeof coll !== 'string' || typeof id !== 'string' || !ID_RE.test(id)) throw bad("Kolleksiya yoki hujjat nomi noto'g'ri");
  if (op !== 'set' && op !== 'update') throw bad("Amal noto'g'ri");
  if (!isObj(data)) throw bad("Ma'lumot obyekt bo'lishi kerak");
  const uid = user.uid;
  const writer = user.role === 'admin' || user.role === 'operator';
  if (!writer) throw refused();

  if (coll === 'config') {
    if (user.role !== 'admin') throw refused('Sozlamani faqat administrator o\'zgartiradi');
    if (id !== 'main' || op !== 'set') throw bad('config: faqat main hujjatini to\'liq saqlash mumkin');
    return { data, mode: 'replace' };
  }
  if (coll === 'cfglog') {
    if (user.role !== 'admin') throw refused();
    if (op !== 'set') throw bad('cfglog: faqat yangi yozuv');
    onlyKeys(data, ['t', 'd', 'by', 'ch', 'prev'], 'cfglog');
    if (typeof data.d !== 'string' || data.d.length > 20) throw bad('cfglog: sana noto\'g\'ri');
    data.by = uid;
    return { data, mode: 'replace' };
  }
  if (coll === 'log') {
    if (op === 'set') {
      onlyKeys(data, ['d', 'u', 'e'], 'log');
      if (typeof data.d !== 'string' || data.d.length > 20) throw bad('log: sana noto\'g\'ri');
      data.u = uid;
      if (data.e !== undefined) stampEntries(data.e, uid);
      return { data, mode: 'merge' };
    }
    onlyKeys(data, ['d', 'u', 'e'], 'log');
    if (data.e === undefined) throw bad('log: e kerak');
    stampEntries(data.e, uid);
    return { data: { e: data.e }, mode: 'update' };
  }
  if (JOURNALS.includes(coll)) {
    if (op === 'set') {
      onlyKeys(data, ['p', 'k', 'rows'], coll);
      if (typeof data.p !== 'string' || !data.p || data.p.length > 20) throw bad(`${coll}: davr noto'g'ri`);
      if (!Number.isInteger(data.k) || data.k < 1 || data.k > 9999) throw bad(`${coll}: bo'lak raqami noto'g'ri`);
      if (id !== `${data.p}_${data.k}`) throw bad(`${coll}: hujjat nomi davrga mos emas`);
      if (data.rows === undefined) data.rows = {};
      stampRows(data.rows, uid, coll);
      return { data, mode: 'merge' };
    }
    onlyKeys(data, ['p', 'k', 'rows'], coll);
    if (data.rows === undefined) throw bad(`${coll}: rows kerak`);
    stampRows(data.rows, uid, coll);
    return { data: { rows: data.rows }, mode: 'update' };
  }
  if (coll === 'karyer') throw refused("Eski karyer yozuvlari faqat o'qiladi");
  throw bad("Noma'lum kolleksiya");
}
