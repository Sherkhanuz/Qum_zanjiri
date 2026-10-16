// Server sinovlari: haqiqiy Postgres (PGlite, kompyuterda) bilan, Vercel kabi HTTP server orqali.
//   npm test
// Tekshiradi: sxema, chuqur birlashtirish, rollar, kirish cheklovi, sinxronlash, parallel yozish,
// zaxira, va hozirgi ma'lumot bazadan o'tgandan keyin hisob-kitob natijalari o'zgarmasligi.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

process.env.SESSION_SECRET = 'test-secret-'.padEnd(48, 'x');
process.env.SETUP_TOKEN = 'test-setup-token-123';
process.env.QZ_USER_CACHE_MS = '0';
process.env.QZ_NO_SEED = '1';
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dev = await import('../scripts/dev.mjs');
const { q } = await import('../lib/db.js');
const { SCHEMA } = await import('../lib/schema.js');
const { buildIndex, buildParts, buildSeed } = await import('../scripts/pack.mjs');

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  XATO ' + name + '\n       ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e)); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- HTTP mijoz (cookie bilan) ----------
let base = '';
function client(ip) {
  let cookie = '';
  const c = async (m, u, b, extra = {}) => {
    const h = Object.assign({ 'X-QZ': '1', 'x-forwarded-for': ip || '10.0.0.1' }, cookie ? { cookie } : {}, b !== undefined ? { 'Content-Type': 'application/json' } : {}, extra);
    for (const k in h) if (h[k] === null) delete h[k];
    const r = await fetch(base + u, { method: m, headers: h, body: b !== undefined ? (typeof b === 'string' ? b : JSON.stringify(b)) : undefined });
    const sc = r.headers.get('set-cookie');
    if (sc) { const v = sc.split(';')[0]; cookie = v.endsWith('=') ? '' : v; }
    const txt = await r.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) { }
    return { s: r.status, j, txt, h: r.headers };
  };
  c.cookie = () => cookie;
  c.setCookie = (v) => { cookie = v; };
  return c;
}

// claude.ai bazasining (va sahifa ichidagi memDb ning) birlashtirish qoidasi
function jsMerge(a, b) {
  for (const k in b) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) jsMerge(a[k], b[k]);
    else a[k] = b[k];
  }
  return a;
}
const canon = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((o, kk) => { o[kk] = v[kk]; return o; }, {}) : v));

async function serve(helpers) {
  const srv = dev.createServer({ helpers });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return srv;
}

console.log('Sxema va SQL');
await dev.usePglite();
let srv = await serve(false);
base = 'http://127.0.0.1:' + srv.address().port;

await t('sxema ikki marta ishga tushsa ham xato bermaydi', async () => {
  for (const s of SCHEMA) await q(s);
  for (const s of SCHEMA) await q(s);
});

await t('jsonb_deep_merge = sahifadagi birlashtirish qoidasi (3000 tasodifiy holat)', async () => {
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const keys = ['a', 'b', 'c', 'rows', 'x1', 'ü', 'кл', ''];
  const val = (d) => {
    const r = rnd();
    if (d > 3 || r < 0.25) return [null, 0, -1.5, 1e21, 123456789.123, 'matn', "o'q", true, false, ''][Math.floor(rnd() * 10)];
    if (r < 0.35) return [1, { a: 2 }, null];
    const o = {}; const n = Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) o[keys[Math.floor(rnd() * keys.length)]] = val(d + 1);
    return o;
  };
  const batch = [];
  for (let i = 0; i < 3000; i++) { const a = val(0), b = val(0); batch.push([a && typeof a === 'object' && !Array.isArray(a) ? a : { v: a }, b && typeof b === 'object' && !Array.isArray(b) ? b : { v: b }]); }
  const rows = await q(`SELECT i, jsonb_deep_merge(x->0, x->1)::text AS m FROM jsonb_array_elements($1::text::jsonb) WITH ORDINALITY AS t(x, i) ORDER BY i`, [JSON.stringify(batch)]);
  assert.equal(rows.length, 3000);
  rows.forEach((r, i) => {
    const want = jsMerge(JSON.parse(JSON.stringify(batch[i][0])), JSON.parse(JSON.stringify(batch[i][1])));
    assert.equal(canon(JSON.parse(r.m)), canon(want), 'holat ' + i);
  });
});

await t('har yozuvda tartib raqami oshadi, juda katta hujjat rad etiladi, jurnal o\'zgartirilmaydi', async () => {
  await q(`INSERT INTO docs (coll, id, body) VALUES ('t', 'a', '{}')`);
  const s1 = (await q(`SELECT seq::float8 AS s, size FROM docs WHERE coll='t'`))[0];
  await q(`UPDATE docs SET body = '{"x":1}' WHERE coll='t'`);
  const s2 = (await q(`SELECT seq::float8 AS s, size FROM docs WHERE coll='t'`))[0];
  assert.ok(s2.s > s1.s); assert.equal(s2.size, '{"x": 1}'.length);
  await assert.rejects(q(`UPDATE docs SET body = jsonb_build_object('x', repeat('a', 1600000)) WHERE coll='t'`), (e) => e.code === '54000');
  await q(`DELETE FROM docs WHERE coll='t'`);
  await q(`INSERT INTO audit (act) VALUES ('t')`);
  await assert.rejects(q(`UPDATE audit SET act='y'`));
  await assert.rejects(q(`DELETE FROM audit`));
});

console.log('Birinchi sozlash va kirish');
const A = client('10.0.0.1');
await t('sozlash: noto\'g\'ri kalit rad etiladi, to\'g\'risi administrator yaratadi, ikkinchi marta yaratmaydi', async () => {
  let r = await A('GET', '/api/setup');
  assert.equal(r.s, 200); assert.equal(r.j.users, 0); assert.equal(r.j.env.secret, true);
  r = await A('POST', '/api/setup', { token: 'notogri-kalit-12345', login: 'admin', name: 'A', password: 'Juda-uzun-parol-1' });
  assert.equal(r.s, 403);
  r = await A('POST', '/api/setup', { token: process.env.SETUP_TOKEN, login: 'admin', name: 'Admin', password: 'qisqa' });
  assert.equal(r.s, 400);
  r = await A('POST', '/api/setup', { token: process.env.SETUP_TOKEN, login: 'admin', name: 'Admin Bosh', password: 'Juda-uzun-parol-1' });
  assert.equal(r.s, 200); assert.equal(r.j.created, true);
  r = await A('GET', '/api/auth'); assert.equal(r.s, 200); assert.equal(r.j.user.role, 'admin'); assert.equal(r.j.user.id, 'u1');
  const B = client('10.0.0.9');
  r = await B('POST', '/api/setup', { token: process.env.SETUP_TOKEN, login: 'boshqa', name: 'X', password: 'Juda-uzun-parol-2' });
  assert.equal(r.s, 200); assert.equal(r.j.created, false);
  assert.equal((await q(`SELECT count(*)::int AS n FROM users`))[0].n, 1);
});

const OP = client('10.0.0.2'), VW = client('10.0.0.3');
await t('foydalanuvchi qo\'shish, kirish, rollar', async () => {
  let r = await A('POST', '/api/users', { op: 'create', login: 'chust.op', name: 'Chust operatori', role: 'operator', site: 'CHU', password: 'operator-parol-1' });
  assert.equal(r.s, 200);
  r = await A('POST', '/api/users', { op: 'create', login: 'direktor', name: 'Direktor', role: 'viewer', password: 'viewer-parol-12' });
  assert.equal(r.s, 200);
  r = await A('POST', '/api/users', { op: 'create', login: 'chust.op', name: 'Ikkinchi', role: 'operator', password: 'operator-parol-2' });
  assert.equal(r.s, 409);
  r = await OP('POST', '/api/auth', { op: 'login', login: 'Chust.Op', password: 'operator-parol-1' });
  assert.equal(r.s, 200);
  r = await OP('GET', '/api/auth'); assert.equal(r.j.user.role, 'operator'); assert.equal(r.j.user.site, 'CHU'); assert.equal(r.j.names.u1, 'Admin Bosh');
  r = await VW('POST', '/api/auth', { op: 'login', login: 'direktor', password: 'viewer-parol-12' });
  assert.equal(r.s, 200);
});

await t('cookie: HttpOnly, SameSite=Lax; imzosi buzilgan cookie qabul qilinmaydi', async () => {
  const X = client('10.0.0.50');
  const r = await fetch(base + '/api/auth', { method: 'POST', headers: { 'X-QZ': '1', 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.0.50' }, body: JSON.stringify({ op: 'login', login: 'direktor', password: 'viewer-parol-12' }) });
  const sc = r.headers.get('set-cookie');
  assert.match(sc, /HttpOnly/); assert.match(sc, /SameSite=Lax/); assert.match(sc, /Max-Age=2592000/);
  const v = sc.split(';')[0];
  X.setCookie(v.slice(0, -2) + (v.slice(-2) === 'AA' ? 'AB' : 'AA'));
  assert.equal((await X('GET', '/api/auth')).s, 401);
  const parts = v.split('=')[1].split('.');
  const forged = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); forged.u = 1;
  X.setCookie('qz_s=v1.' + Buffer.from(JSON.stringify(forged)).toString('base64url') + '.' + parts[2]);
  assert.equal((await X('GET', '/api/auth')).s, 401);
});

await t('ruxsatlar: kirmagan, ko\'ruvchi, operator, administrator', async () => {
  const N = client('10.0.0.4');
  for (const u of ['/api/sync?since=0', '/api/app', '/api/doc?coll=config&id=main', '/api/query?coll=log&from=2026-01-01&to=2026-12-31', '/api/users', '/api/backup?since=0'])
    assert.equal((await N('GET', u)).s, 401, u);
  assert.equal((await N('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'set', data: { p: '2026-10', k: 1, rows: {} } })).s, 401);
  // ko'ruvchi
  assert.equal((await VW('GET', '/api/sync?since=0')).s, 200);
  assert.equal((await VW('GET', '/api/app')).s, 200);
  assert.equal((await VW('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'set', data: { p: '2026-10', k: 1, rows: {} } })).s, 403);
  assert.equal((await VW('POST', '/api/doc', { coll: 'log', id: '2026-10-12_x_1', op: 'set', data: { d: '2026-10-12', e: {} } })).s, 403);
  assert.equal((await VW('GET', '/api/users')).s, 403);
  assert.equal((await VW('GET', '/api/backup?since=0')).s, 403);
  // operator
  assert.equal((await OP('POST', '/api/doc', { coll: 'config', id: 'main', op: 'set', data: { start: '2026-01-01' } })).s, 403);
  assert.equal((await OP('POST', '/api/doc', { coll: 'cfglog', id: 'abc', op: 'set', data: { t: 1, d: '2026-10-12', ch: '[]' } })).s, 403);
  assert.equal((await OP('POST', '/api/doc', { coll: 'karyer', id: '2025-05_1', op: 'set', data: { p: '2025-05', k: 1, rows: {} } })).s, 403);
  assert.equal((await OP('POST', '/api/users', { op: 'create', login: 'yangi', name: 'Y', role: 'admin', password: 'admin-parol-123' })).s, 403);
  assert.equal((await OP('GET', '/api/backup?since=0')).s, 403);
  assert.equal((await OP('POST', '/api/backup', { mode: 'replace', docs: [{ coll: 'config', id: 'main', body: {} }] })).s, 403);
  assert.equal((await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'set', data: { p: '2026-10', k: 1, rows: {} } })).s, 200);
  assert.equal((await OP('POST', '/api/doc', { coll: 'log', id: '2026-10-12_ab12_1', op: 'set', data: { d: '2026-10-12', u: null, e: { e1: { t: 1, j: 'reys', op: 'add' } } } })).s, 200);
  // administrator
  assert.equal((await A('POST', '/api/doc', { coll: 'config', id: 'main', op: 'set', data: { start: '2025-05-01', norms: { a: 1 } } })).s, 200);
  assert.equal((await A('POST', '/api/doc', { coll: 'cfglog', id: 'k1abc', op: 'set', data: { t: 1, d: '2026-10-12', by: 'u77', ch: '[]', prev: null } })).s, 200);
});

await t('boshqa saytdan so\'rov (CSRF) va noto\'g\'ri formatlar rad etiladi', async () => {
  assert.equal((await A('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: {} } }, { 'X-QZ': null })).s, 403);
  assert.equal((await A('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: {} } }, { Origin: 'https://yomon.example' })).s, 403);
  assert.equal((await A('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: {} } }, { Origin: base })).s, 200);
  assert.equal((await A('POST', '/api/doc', 'coll=reys', { 'Content-Type': 'application/x-www-form-urlencoded' })).s, 415);
  assert.equal((await A('POST', '/api/doc', '{buzuq json')).s, 400);
  assert.equal((await A('POST', '/api/auth', { op: 'login', login: 'admin', password: 'x' }, { 'X-QZ': null })).s, 403);
});

console.log('Yozish qoidalari');
await t('«kim yozdi» maydonlarini server qo\'yadi (brauzer yuborganiga ishonilmaydi)', async () => {
  await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: { r1: { d: '2026-10-05', kg: 5, by: 'u1', at: 1 }, r2: { _del: 1, dat: 2, dby: 'u1' } } } });
  const b = JSON.parse((await A('GET', '/api/doc?coll=reys&id=2026-10_1')).txt).body;
  assert.equal(b.rows.r1.by, 'u2'); assert.equal(b.rows.r2.dby, 'u2');
  const lg = JSON.parse((await A('GET', '/api/doc?coll=log&id=2026-10-12_ab12_1')).txt).body;
  assert.equal(lg.u, 'u2'); assert.equal(lg.e.e1.by, 'u2');
  const cl = JSON.parse((await A('GET', '/api/doc?coll=cfglog&id=k1abc')).txt).body;
  assert.equal(cl.by, 'u1');
});

await t('noto\'g\'ri shakl: nom davrga mos emas, qator obyekt emas, ortiqcha maydon, yo\'q hujjatni update', async () => {
  assert.equal((await OP('POST', '/api/doc', { coll: 'reys', id: '2026-11_2', op: 'set', data: { p: '2026-11', k: 1, rows: {} } })).s, 400);
  assert.equal((await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: { a: 5 } } })).s, 400);
  assert.equal((await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: null } })).s, 400);
  assert.equal((await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: { a: null } } })).s, 400);
  assert.equal((await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: {}, boshqa: 1 } })).s, 400);
  assert.equal((await OP('POST', '/api/doc', { coll: 'reys', id: '../x', op: 'update', data: { rows: {} } })).s, 400);
  const r = await OP('POST', '/api/doc', { coll: 'reys', id: '2030-01_1', op: 'update', data: { rows: { z: { d: '2030-01-01' } } } });
  assert.equal(r.s, 404); assert.equal(r.j.error.code, 'invalid_argument');
  // p va k ni update orqali o'zgartirib bo'lmaydi
  await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { p: '1999-01', k: 9, rows: { r3: { d: '2026-10-06' } } } });
  const b = JSON.parse((await A('GET', '/api/doc?coll=reys&id=2026-10_1')).txt).body;
  assert.equal(b.p, '2026-10'); assert.equal(b.k, 1); assert.ok(b.rows.r3 && b.rows.r1);
});

await t('update: bitta qator o\'zgaradi, qolganlari joyida; null qiymat saqlanadi', async () => {
  await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: { r1: { kg: 7, n: null } } } });
  const b = JSON.parse((await A('GET', '/api/doc?coll=reys&id=2026-10_1')).txt).body;
  assert.equal(b.rows.r1.kg, 7); assert.equal(b.rows.r1.d, '2026-10-05'); assert.ok('n' in b.rows.r1); assert.equal(b.rows.r1.n, null);
  assert.ok(b.rows.r2 && b.rows.r3);
});

await t('bir vaqtda 12 kishi bitta yangi hujjatni yaratsa — hech bir yozuv yo\'qolmaydi', async () => {
  const res = await Promise.all(Array.from({ length: 12 }, (_, i) =>
    OP('POST', '/api/doc', { coll: 'vagon', id: '2026-10_1', op: 'set', data: { p: '2026-10', k: 1, rows: { ['v' + i]: { dk: '2026-10-0' + (1 + (i % 9)), kg: i } } } })));
  res.forEach((r) => assert.equal(r.s, 200));
  assert.equal(res.filter((r) => r.j.created).length, 1);
  const b = JSON.parse((await A('GET', '/api/doc?coll=vagon&id=2026-10_1')).txt).body;
  assert.equal(Object.keys(b.rows).length, 12);
});

await t('bir vaqtda 25 ta update bitta hujjatga — hammasi saqlanadi', async () => {
  await Promise.all(Array.from({ length: 25 }, (_, i) =>
    (i % 2 ? OP : A)('POST', '/api/doc', { coll: 'vagon', id: '2026-10_1', op: 'update', data: { rows: { ['w' + i]: { dk: '2026-10-11', kg: i } } } })));
  const b = JSON.parse((await A('GET', '/api/doc?coll=vagon&id=2026-10_1')).txt).body;
  assert.equal(Object.keys(b.rows).length, 37);
});

await t('server jurnali har yozishni qayd etadi', async () => {
  const n = (await q(`SELECT count(*)::int AS n FROM audit WHERE coll = 'vagon'`))[0].n;
  assert.equal(n, 37);
  const r = await A('GET', '/api/backup?audit=1');
  assert.equal(r.s, 200); assert.ok(r.j.audit.length >= 37); assert.ok(r.j.audit.some((a) => a.name === 'Chust operatori'));
});

console.log('Sinxronlash');
await t('yangi yozuv 5 soniya ushlab turiladi, keyin keladi; soni va yig\'indisi mos', async () => {
  const st = { since: 0, docs: new Map() };
  const pullAll = async () => {
    let last;
    for (let i = 0; i < 50; i++) {
      const r = await VW('GET', '/api/sync?since=' + st.since);
      assert.equal(r.s, 200);
      r.j.docs.forEach((d) => { const o = st.docs.get(d.coll + '/' + d.id); if (!o || d.seq >= o.seq) st.docs.set(d.coll + '/' + d.id, d); });
      st.since = Math.max(st.since, r.j.next); last = r.j;
      if (!r.j.more) break;
    }
    return last;
  };
  let r = await pullAll();
  assert.ok(r.young > 0, 'hozirgina yozilganlar ushlab turilishi kerak');
  await sleep(5300);
  r = await pullAll();
  assert.equal(r.young, 0);
  const seqs = [...st.docs.values()].map((d) => d.seq);
  assert.equal(st.docs.size, r.n); assert.equal(seqs.reduce((a, b) => a + b, 0), r.sum);
  assert.ok(!st.docs.has('log/2026-10-12_ab12_1'), 'log sinxronlashga kirmaydi');
  await OP('POST', '/api/doc', { coll: 'reys', id: '2026-10_1', op: 'update', data: { rows: { r9: { d: '2026-10-09' } } } });
  r = await pullAll();
  assert.equal(r.young, 1); assert.equal(r.docs.length, 0);
  await sleep(5300);
  r = await pullAll();
  assert.equal(r.docs.length, 1); assert.ok(r.docs[0].body.rows.r9);
  assert.equal(st.docs.size, r.n); assert.equal([...st.docs.values()].reduce((a, d) => a + d.seq, 0), r.sum);
});

await t('katta hajm sahifalarga bo\'linadi (har sahifa 4,5 MB dan kichik)', async () => {
  const big = 'x'.repeat(900000);
  for (let i = 1; i <= 7; i++) await q(`INSERT INTO docs (coll, id, body) VALUES ('inv', $1::text, $2::text::jsonb)`, ['Y20' + (10 + i) + '_1', JSON.stringify({ p: 'Y20' + (10 + i), k: 1, rows: { a: { pad: big } } })]);
  await sleep(5300);
  let since = 0, pages = 0, got = 0, maxLen = 0;
  for (;;) {
    const r = await VW('GET', '/api/sync?since=' + since);
    pages++; got += r.j.docs.length; maxLen = Math.max(maxLen, r.txt.length);
    since = r.j.next;
    if (!r.j.more) { assert.equal(got, r.j.n); break; }
  }
  assert.ok(pages >= 3, 'sahifalar: ' + pages); assert.ok(maxLen < 4_400_000, 'eng katta sahifa ' + maxLen);
  await q(`ALTER TABLE docs DISABLE TRIGGER docs_stamp_t`); await q(`DELETE FROM docs WHERE coll = 'inv'`); await q(`ALTER TABLE docs ENABLE TRIGGER docs_stamp_t`);
});

await t('tarix (log, cfglog) sana oralig\'i bo\'yicha', async () => {
  let r = await VW('GET', '/api/query?coll=log&from=2026-10-01&to=2026-10-31&limit=1000');
  assert.equal(r.s, 200); assert.equal(r.j.docs.length, 1); assert.equal(r.j.docs[0].body.e.e1.op, 'add');
  r = await VW('GET', '/api/query?coll=log&from=2026-11-01&to=2026-11-30');
  assert.equal(r.j.docs.length, 0);
  r = await VW('GET', '/api/query?coll=cfglog&from=2026-10-12&to=2026-10-12');
  assert.equal(r.j.docs.length, 1);
  assert.equal((await VW('GET', '/api/query?coll=reys&from=2026-10-01&to=2026-10-31')).s, 400);
});

console.log('Kirish xavfsizligi');
await t('5 marta noto\'g\'ri parol → shu manzildan 15 daqiqa kutish; boshqa manzildan kirish mumkin', async () => {
  const X = client('10.9.9.9');
  for (let i = 0; i < 5; i++) assert.equal((await X('POST', '/api/auth', { op: 'login', login: 'direktor', password: 'xato-parol' })).s, 401);
  let r = await X('POST', '/api/auth', { op: 'login', login: 'direktor', password: 'viewer-parol-12' });
  assert.equal(r.s, 429); assert.equal(r.j.error.code, 'locked');
  const Y = client('10.9.9.10');
  r = await Y('POST', '/api/auth', { op: 'login', login: 'direktor', password: 'viewer-parol-12' });
  assert.equal(r.s, 200);
  r = await X('POST', '/api/auth', { op: 'login', login: 'yoq-login', password: 'nimadir' });
  assert.equal(r.s, 401); assert.equal(r.j.error.code, 'bad_credentials');
});

await t('parol tiklansa yoki bloklansa — eski sessiya darhol yopiladi', async () => {
  const Z = client('10.0.0.21');
  await A('POST', '/api/users', { op: 'create', login: 'vaqtincha', name: 'Vaqtincha', role: 'operator', password: 'boshqa-parol-123' });
  assert.equal((await Z('POST', '/api/auth', { op: 'login', login: 'vaqtincha', password: 'boshqa-parol-123' })).s, 200);
  assert.equal((await Z('GET', '/api/sync?since=0')).s, 200);
  const id = (await q(`SELECT id FROM users WHERE login='vaqtincha'`))[0].id;
  await A('POST', '/api/users', { op: 'password', id, password: 'yangi-parol-456' });
  assert.equal((await Z('GET', '/api/sync?since=0')).s, 401);
  assert.equal((await Z('POST', '/api/auth', { op: 'login', login: 'vaqtincha', password: 'yangi-parol-456' })).s, 200);
  await A('POST', '/api/users', { op: 'update', id, active: false });
  assert.equal((await Z('GET', '/api/auth')).s, 401);
  assert.equal((await Z('POST', '/api/auth', { op: 'login', login: 'vaqtincha', password: 'yangi-parol-456' })).s, 401);
  // o'z parolini almashtirish: joriy sessiya qoladi
  assert.equal((await OP('POST', '/api/users', { op: 'mypass', old: 'xato', password: 'operator-parol-9' })).s, 403);
  assert.equal((await OP('POST', '/api/users', { op: 'mypass', old: 'operator-parol-1', password: 'operator-parol-9' })).s, 200);
  assert.equal((await OP('GET', '/api/auth')).s, 200);
});

await t('oxirgi administratorni bloklab yoki rolini tushirib bo\'lmaydi', async () => {
  let r = await A('POST', '/api/users', { op: 'update', id: 1, role: 'viewer' });
  assert.equal(r.s, 409);
  r = await A('POST', '/api/users', { op: 'update', id: 1, active: false });
  assert.equal(r.s, 409);
  assert.equal((await A('GET', '/api/auth')).j.user.role, 'admin');
});

console.log('Zaxira va hozirgi ma\'lumot');
const dataFile = path.join(root, 'data', 'qum-zanjiri-data.json');
const haveData = fs.existsSync(dataFile);
const seed = haveData ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : null;

// Sahifa kodini Node'da ishga tushirish (dvigatel funksiyalari)
function loadEngine() {
  const code = fs.readFileSync(path.join(root, 'app', 'app.js'), 'utf8');
  const module = { exports: {} };
  vm.runInNewContext(code, { module, console, Math, Date, JSON, Object, Array, Number, String, Set, Map, Intl, Boolean, RegExp, Error, TextEncoder, Uint8Array, Uint32Array, DataView, ArrayBuffer, parseFloat, parseInt, isFinite, isNaN, Infinity, NaN, Symbol, Promise, setTimeout, clearTimeout });
  return module.exports;
}
// Hisob natijalarining «barmoq izi» — yetkazilgan qiymat, ombor qoldiqlari, tan narx zanjiri, audit
function fingerprint(M, docs) {
  const { E, JN, mergeCfg, COMP, WH } = M;
  const rows = {}; JN.forEach((j) => (rows[j] = []));
  let cfgRaw = null;
  for (const d of docs) {
    if (d.coll === 'config' && d.id === 'main') cfgRaw = d.body;
    if (!JN.includes(d.coll)) continue;
    for (const id in d.body.rows || {}) { const r = d.body.rows[id]; if (!r._del) rows[d.coll].push(Object.assign({ id }, r)); }
  }
  for (const j of JN) rows[j].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const cfg = mergeCfg(cfgRaw), out = {};
  for (const D of ['2025-09-15', '2026-06-01', '2026-10-11']) {
    const c = E.ctx(cfg, rows, D), cs = E.conserve(c), sn = E.snapAt(c, D), o = {};
    o.diff = Math.round(cs.t.diff * 100) / 100;
    o.cap = {}; COMP.forEach((cp, i) => { if (Math.abs(c.led.cap[i]) > 0.005) o.cap[cp[0]] = Math.round(c.led.cap[i] * 100) / 100; });
    o.wh = {}; WH.forEach((w) => (o.wh[w] = [Math.round(sn[w].q), Math.round(E.vsum(sn[w].v) * 100) / 100]));
    const dl = E.delivered(c, c.start, D); o.del = [Math.round(dl.kg), Math.round(dl.val * 100) / 100];
    const au = E.audit(c), cnt = {}; au.forEach((a) => (cnt[a.st] = (cnt[a.st] || 0) + 1)); o.audit = cnt;
    out[D] = o;
  }
  return out;
}

await t('hozirgi ma\'lumot fayli bo\'laklab yuklanadi (sozlash sahifasidagi kabi) va bazadan aynan qaytadi', async () => {
  if (!haveData) { console.log('       (data/qum-zanjiri-data.json yo\'q — o\'tkazildi)'); return; }
  // sinov bazasini tozalab, faqat fayldagi ma'lumot qoldiramiz
  await q(`ALTER TABLE docs DISABLE TRIGGER docs_stamp_t`); await q(`DELETE FROM docs`); await q(`ALTER TABLE docs ENABLE TRIGGER docs_stamp_t`);
  const parts = []; let cur = [], size = 0;
  for (const x of seed.docs) { const s = JSON.stringify(x).length; if (cur.length && (size + s > 1500000 || cur.length >= 200)) { parts.push(cur); cur = []; size = 0; } cur.push(x); size += s; }
  if (cur.length) parts.push(cur);
  let added = 0;
  for (const p of parts) { const r = await A('POST', '/api/backup', { mode: 'add', docs: p }); assert.equal(r.s, 200, r.txt); added += r.j.added; }
  assert.equal(added, seed.docs.length);
  // takror yuklash hech narsani o'zgartirmaydi
  const r2 = await A('POST', '/api/backup', { mode: 'add', docs: parts[0] });
  assert.equal(r2.j.added, 0); assert.equal(r2.j.skipped, parts[0].length);
  // zaxira nusxa = fayl
  let since = 0; const got = new Map();
  for (;;) { const r = await A('GET', '/api/backup?since=' + since); r.j.docs.forEach((d) => got.set(d.coll + '/' + d.id, d)); if (!r.j.more) break; since = r.j.next; }
  assert.equal(got.size, seed.docs.length);
  for (const d of seed.docs) assert.equal(canon(got.get(d.coll + '/' + d.id).body), canon(d.body), d.coll + '/' + d.id);
});

await t('hisob natijalari: fayldan = bazadan sinxronlangan = kalitlar tartibi aralashtirilgan (o\'zgarmaydi)', async () => {
  if (!haveData) return;
  const M = loadEngine();
  const f0 = fingerprint(M, seed.docs);
  await sleep(5300);
  let since = 0; const docs = [];
  for (;;) { const r = await VW('GET', '/api/sync?since=' + since); docs.push(...r.j.docs); if (!r.j.more) break; since = r.j.next; }
  const f1 = fingerprint(M, docs);
  assert.equal(JSON.stringify(f1), JSON.stringify(f0));
  // jsonb kalitlar tartibini o'zgartiradi: hisob tartibga bog'liq emasligini tasodifiy tartiblar bilan tekshiramiz
  let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const shuffle = (o) => { if (Array.isArray(o)) return o.map(shuffle); if (!o || typeof o !== 'object') return o; const ks = Object.keys(o); for (let i = ks.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ks[i], ks[j]] = [ks[j], ks[i]]; } const n = {}; ks.forEach((k) => (n[k] = shuffle(o[k]))); return n; };
  for (let k = 0; k < 3; k++) {
    const sh = docs.map((d) => ({ coll: d.coll, id: d.id, body: shuffle(d.body) })).sort(() => rnd() - 0.5);
    assert.equal(JSON.stringify(fingerprint(M, sh)), JSON.stringify(f0), 'aralash ' + k);
  }
  console.log('       yetkazilgan (2026-10-11): ' + f0['2026-10-11'].del[0].toLocaleString('ru') + ' kg, ' + f0['2026-10-11'].del[1].toLocaleString('ru') + " so'm; saqlanish farqi " + f0['2026-10-11'].diff);
});

await t('zaxiradan «almashtirish» rejimi faqat administrator tasdiqlab ishlatadi va mavjud hujjatni almashtiradi', async () => {
  const before = JSON.parse((await A('GET', '/api/doc?coll=config&id=main')).txt).body;
  const r = await A('POST', '/api/backup', { mode: 'replace', docs: [{ coll: 'config', id: 'main', body: Object.assign({}, before, { start: '2025-05-02' }) }] });
  assert.equal(r.j.replaced, 1);
  assert.equal(JSON.parse((await A('GET', '/api/doc?coll=config&id=main')).txt).body.start, '2025-05-02');
  await A('POST', '/api/backup', { mode: 'replace', docs: [{ coll: 'config', id: 'main', body: before }] });
  assert.equal((await A('POST', '/api/backup', { mode: 'add', docs: [{ coll: 'users', id: 'x', body: {} }] })).s, 400);
});

await t('sahifa fayllari manbadan yig\'ilgan (npm run pack) va dastur kodi faqat kirganlarga beriladi', async () => {
  assert.equal(fs.readFileSync(path.join(root, 'public/index.html'), 'utf8'), buildIndex(fs.readFileSync(path.join(root, 'app/markup.html'), 'utf8')));
  buildParts(fs.readFileSync(path.join(root, 'app/app.js'), 'utf8')).forEach((t, i) => assert.equal(fs.readFileSync(path.join(root, `lib/app-code-${i + 1}.js`), 'utf8'), t, 'app-code-' + (i + 1)));
  if (haveData) assert.equal(fs.readFileSync(path.join(root, 'lib/seed-data.js'), 'utf8'), buildSeed(fs.readFileSync(dataFile, 'utf8')));
  const r = await VW('GET', '/api/app');
  assert.equal(r.txt, fs.readFileSync(path.join(root, 'app/app.js'), 'utf8'));
  const et = r.h.get('etag');
  const r2 = await VW('GET', '/api/app', undefined, { 'If-None-Match': et });
  assert.equal(r2.s, 304);
  const pub = fs.readdirSync(path.join(root, 'public')).join(' ');
  assert.ok(!/app\.js|data/.test(pub.replace('backup.js', '')), 'public ichida dastur kodi yoki ma\'lumot bo\'lmasin: ' + pub);
  const idx = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
  assert.ok(!/<script>/.test(idx) && !/K-ISH|49200000/.test(idx));
});

srv.close();

console.log('Vercel usulida (tana oldindan o\'qilgan) — asosiy amallar');
srv = await serve(true);
base = 'http://127.0.0.1:' + srv.address().port;
await t('kirish, yozish, noto\'g\'ri JSON — Vercel yordamchilari bilan ham bir xil', async () => {
  const H = client('10.1.1.1');
  assert.equal((await H('POST', '/api/auth', { op: 'login', login: 'admin', password: 'Juda-uzun-parol-1' })).s, 200);
  assert.equal((await H('POST', '/api/doc', { coll: 'reys', id: '2026-12_1', op: 'set', data: { p: '2026-12', k: 1, rows: { a: { d: '2026-12-01' } } } })).s, 200);
  assert.equal((await H('POST', '/api/doc', { coll: 'reys', id: '2026-12_1', op: 'update', data: { rows: { b: { d: '2026-12-02' } } } })).s, 200);
  const b = JSON.parse((await H('GET', '/api/doc?coll=reys&id=2026-12_1')).txt).body;
  assert.deepEqual(Object.keys(b.rows).sort(), ['a', 'b']);
  assert.equal((await H('POST', '/api/doc', '{buzuq')).s, 400);
});
srv.close();

console.log("Birinchi sozlashda ma'lumot o'zi yuklanadi (yangi bo'sh baza)");
await t("sozlash: administrator + 93 hujjat; hisob natijalari fayldagi bilan bir xil; ikkinchi marta yuklamaydi", async () => {
  if (!haveData) return;
  delete process.env.QZ_NO_SEED;
  await dev.usePglite();
  srv = await serve(true);
  base = 'http://127.0.0.1:' + srv.address().port;
  const S = client('10.2.2.2');
  const r = await S('POST', '/api/setup', { token: process.env.SETUP_TOKEN, login: 'bosh', name: 'Bosh', password: 'Juda-uzun-parol-7' });
  assert.equal(r.s, 200, r.txt); assert.equal(r.j.created, true); assert.equal(r.j.seeded, seed.docs.length);
  const r2 = await S('POST', '/api/setup', { token: process.env.SETUP_TOKEN, login: 'bosh2', name: 'B', password: 'Juda-uzun-parol-8' });
  assert.equal(r2.j.created, false);
  assert.equal((await q(`SELECT count(*)::int AS n FROM docs`))[0].n, seed.docs.length);
  await sleep(5300);
  let since = 0; const docs = [];
  for (;;) { const x = await S('GET', '/api/sync?since=' + since); docs.push(...x.j.docs); if (!x.j.more) break; since = x.j.next; }
  const M = loadEngine();
  assert.equal(JSON.stringify(fingerprint(M, docs)), JSON.stringify(fingerprint(M, seed.docs)));
  srv.close();
});

console.log(`\nNatija: ${pass} o'tdi, ${fail} xato`);
process.exit(fail ? 1 : 0);
