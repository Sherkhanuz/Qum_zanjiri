// GET  — holat: muhit o'zgaruvchilari bormi, baza ulanadimi, sxema va foydalanuvchilar bormi (sirlarni ko'rsatmaydi)
// POST {token, login, name, password} — birinchi sozlash: sxema yaratiladi, birinchi administrator qo'shiladi.
//      Foydalanuvchi allaqachon bo'lsa, faqat sxema yangilanadi (yangi versiyadan keyin) — administrator yaratilmaydi.
import { route, HttpError } from '../lib/http.js';
import zlib from 'node:zlib';
import { q, dbUrl, ALL_COLLS } from '../lib/db.js';
import { ID_RE } from '../lib/rules.js';
import { SCHEMA, SCHEMA_VERSION } from '../lib/schema.js';
import { hashPassword, passwordProblem, secretOk, setSession, safeEqual } from '../lib/auth.js';

// Loyiha bilan birga yuklangan ma'lumot (lib/seed-data.js, bo'lsa) — faqat baza bo'sh bo'lganda, bir marta.
async function seed(uid) {
  if (process.env.QZ_NO_SEED === '1') return 0;
  let packed;
  try { packed = (await import('../lib/seed-data.js')).default; } catch (e) { return 0; }
  if ((await q(`SELECT count(*)::int AS n FROM docs`))[0].n > 0) return 0;
  const file = JSON.parse(zlib.brotliDecompressSync(Buffer.from(packed, 'base64')).toString('utf8'));
  const docs = (file.docs || []).filter((d) => d && ALL_COLLS.includes(d.coll) && typeof d.id === 'string' && ID_RE.test(d.id) && d.body && typeof d.body === 'object');
  let added = 0;
  for (let i = 0; i < docs.length; i += 40) {
    const part = docs.slice(i, i + 40).map((d) => ({ coll: d.coll, id: d.id, body: d.body }));
    const r = await q(`WITH w AS (INSERT INTO docs (coll, id, body, updated_by)
        SELECT x.coll, x.id, x.body, $2::text FROM jsonb_to_recordset($1::text::jsonb) AS x(coll text, id text, body jsonb)
        ON CONFLICT (coll, id) DO NOTHING RETURNING 1) SELECT count(*)::int AS n FROM w`, [JSON.stringify(part), 'u' + uid]);
    added += r[0].n;
  }
  await q(`INSERT INTO audit (uid, act, coll, doc, info) VALUES ($1::int, 'import.seed', NULL, NULL, $2::text::jsonb)`,
    [uid, JSON.stringify({ docs: docs.length, added, exportedAt: file.exportedAt || null })]);
  return added;
}

function tokenOk() { return (process.env.SETUP_TOKEN || '').length >= 16; }

async function status() {
  const out = { env: { db: !!dbUrl() || !!globalThis.__QZ_DB__, secret: secretOk(), token: tokenOk() }, dbOk: false, schema: false, users: 0, version: SCHEMA_VERSION };
  if (!out.env.db) return out;
  try {
    const r = await q(`SELECT to_regclass('public.users') IS NOT NULL AS s`);
    out.dbOk = true;
    out.schema = !!(r[0] && r[0].s);
    if (out.schema) out.users = (await q(`SELECT count(*)::int AS n FROM users`))[0].n;
  } catch (e) {
    out.dbError = 'Bazaga ulanib bo\'lmadi';
  }
  return out;
}

export default route({
  GET: { auth: false, fn: async () => status() },
  POST: {
    auth: false,
    limit: 10_000,
    fn: async ({ req, res, body }) => {
      if (!tokenOk()) throw new HttpError(503, 'no_token', "SETUP_TOKEN sozlanmagan (kamida 16 belgi)");
      if (!secretOk()) throw new HttpError(503, 'no_secret', 'SESSION_SECRET sozlanmagan (kamida 32 belgi)');
      if (!safeEqual(String(body.token || ''), process.env.SETUP_TOKEN)) {
        await new Promise((r) => setTimeout(r, 800));
        throw new HttpError(403, 'bad_token', "Sozlash kaliti noto'g'ri");
      }
      for (const stmt of SCHEMA) await q(stmt);
      const n = (await q(`SELECT count(*)::int AS n FROM users`))[0].n;
      if (n > 0) return { ok: true, migrated: true, created: false };

      const login = String(body.login || '').trim().toLowerCase();
      if (!/^[a-z0-9._-]{3,32}$/.test(login)) throw new HttpError(400, 'invalid_argument', "Login 3–32 belgi: kichik lotin harflari, raqam, nuqta, chiziqcha");
      const name = String(body.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!name) throw new HttpError(400, 'invalid_argument', 'Ismni kiriting');
      const prob = passwordProblem(body.password, login, 'admin');
      if (prob) throw new HttpError(400, 'invalid_argument', prob);
      const h = await hashPassword(body.password);
      // Faqat jadval bo'sh bo'lsa qo'shiladi: ikki kishi bir vaqtda sozlasa ham bittasi o'tadi
      const rows = await q(`INSERT INTO users (login, name, role, pass)
          SELECT $1::text, $2::text, 'admin', $3::text WHERE NOT EXISTS (SELECT 1 FROM users)
          RETURNING id, pv`, [login, name, h]);
      if (!rows.length) return { ok: true, migrated: true, created: false };
      await q(`INSERT INTO audit (uid, act, coll, doc, info) VALUES ($1::int, 'setup', 'users', $2::text, $3::text::jsonb)`,
        [rows[0].id, String(rows[0].id), JSON.stringify({ login, name, version: SCHEMA_VERSION })]);
      setSession(req, res, rows[0]);
      const seeded = await seed(rows[0].id);
      return { ok: true, created: true, seeded };
    },
  },
});
