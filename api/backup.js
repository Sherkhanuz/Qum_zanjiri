// Zaxira nusxa (faqat administrator).
// GET  ?since=N        — barcha hujjatlar sahifalab (parol xeshlari hech qachon chiqmaydi)
// GET  ?audit=1        — server jurnalining oxirgi yozuvlari
// POST {mode, docs[]}  — zaxiradan yuklash. mode 'add': faqat bazada yo'q hujjatlar qo'shiladi (standart);
//                        mode 'replace': mavjud hujjat ham fayldagisi bilan almashtiriladi.
import { route, HttpError, send } from '../lib/http.js';
import { q, ALL_COLLS } from '../lib/db.js';
import { ID_RE } from '../lib/rules.js';

const PAGE_BYTES = 2_500_000;
const SQL_PAGE = `
SELECT p.coll, p.id, p.body::text AS body, p.seq::float8 AS seq, p.cnt FROM (
  SELECT coll, id, body, seq, size, sum(size) OVER (ORDER BY seq) AS run, (count(*) OVER ())::int AS cnt
  FROM docs WHERE seq > $1::bigint
) p WHERE p.run - p.size < $2::bigint ORDER BY p.seq`;

const SQL_IMPORT = (mode) => `
WITH src AS (
  SELECT x.coll, x.id, x.body FROM jsonb_to_recordset($1::text::jsonb) AS x(coll text, id text, body jsonb)
), w AS (
  INSERT INTO docs (coll, id, body, updated_by)
  SELECT coll, id, body, $2::text FROM src
  ON CONFLICT (coll, id) DO ${mode === 'replace' ? 'UPDATE SET body = EXCLUDED.body, updated_by = EXCLUDED.updated_by' : 'NOTHING'}
  RETURNING (xmax = 0) AS created
)
SELECT (count(*) FILTER (WHERE created))::int AS added, (count(*) FILTER (WHERE NOT created))::int AS replaced FROM w`;

export default route({
  GET: {
    auth: 'admin',
    fn: async ({ res, q: p }) => {
      if (p.audit) {
        const rows = await q(`SELECT a.n::float8 AS n, to_char(a.at AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD HH24:MI:SS') AS at,
            a.uid, u.name, a.act, a.coll, a.doc, left(a.info::text, 300) AS info
          FROM audit a LEFT JOIN users u ON u.id = a.uid ORDER BY a.n DESC LIMIT 200`);
        return { audit: rows };
      }
      const since = Number(p.since || 0);
      if (!Number.isInteger(since) || since < 0) throw new HttpError(400, 'bad_request', "since noto'g'ri");
      const rows = await q(SQL_PAGE, [String(since), String(PAGE_BYTES)]);
      const total = rows.length ? rows[0].cnt : 0;
      const next = rows.length ? rows[rows.length - 1].seq : since;
      const parts = rows.map((r) => `{"coll":${JSON.stringify(r.coll)},"id":${JSON.stringify(r.id)},"body":${r.body}}`);
      send(res, 200, `{"next":${next},"more":${rows.length < total},"docs":[${parts.join(',')}]}`);
    },
  },
  POST: {
    auth: 'admin',
    limit: 4_000_000,
    fn: async ({ user, body }) => {
      const mode = body.mode === 'replace' ? 'replace' : 'add';
      const docs = body.docs;
      if (!Array.isArray(docs) || !docs.length || docs.length > 500) throw new HttpError(400, 'invalid_argument', "Hujjatlar ro'yxati noto'g'ri");
      const seen = new Set();
      for (const d of docs) {
        if (!d || !ALL_COLLS.includes(d.coll) || typeof d.id !== 'string' || !ID_RE.test(d.id)) throw new HttpError(400, 'invalid_argument', "Faylda noto'g'ri hujjat bor");
        if (!d.body || typeof d.body !== 'object' || Array.isArray(d.body)) throw new HttpError(400, 'invalid_argument', `${d.coll}/${d.id}: tanasi obyekt emas`);
        const key = d.coll + '/' + d.id;
        if (seen.has(key)) throw new HttpError(400, 'invalid_argument', `${key} ikki marta uchradi`);
        seen.add(key);
      }
      const json = JSON.stringify(docs.map((d) => ({ coll: d.coll, id: d.id, body: d.body })));
      const r = (await q(SQL_IMPORT(mode), [json, user.uid]))[0] || { added: 0, replaced: 0 };
      await q(`INSERT INTO audit (uid, act, coll, doc, info) VALUES ($1::int, $2::text, NULL, NULL, $3::text::jsonb)`,
        [user.id, 'import.' + mode, JSON.stringify({ docs: docs.length, added: r.added, replaced: r.replaced, ids: [...seen].slice(0, 200) })]);
      return { ok: true, mode, docs: docs.length, added: r.added, replaced: r.replaced, skipped: docs.length - r.added - r.replaced };
    },
  },
});
