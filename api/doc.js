// Bitta hujjatni o'qish (GET) va yozish (POST: set / update).
import { route, HttpError, send } from '../lib/http.js';
import { q, ALL_COLLS } from '../lib/db.js';
import { checkWrite, ID_RE } from '../lib/rules.js';

const SQL_UPDATE = `
WITH w AS (
  UPDATE docs SET body = jsonb_deep_merge(body, $3::text::jsonb), updated_by = $4::text
  WHERE coll = $1::text AND id = $2::text
  RETURNING seq
), a AS (
  INSERT INTO audit (uid, act, coll, doc, info)
  SELECT $5::int, 'update', $1::text, $2::text, $3::text::jsonb FROM w
)
SELECT seq::float8 AS seq, false AS created FROM w`;

const SQL_MERGE = `
WITH w AS (
  INSERT INTO docs (coll, id, body, updated_by) VALUES ($1::text, $2::text, $3::text::jsonb, $4::text)
  ON CONFLICT (coll, id) DO UPDATE SET body = jsonb_deep_merge(docs.body, EXCLUDED.body), updated_by = EXCLUDED.updated_by
  RETURNING seq, (xmax = 0) AS created
), a AS (
  INSERT INTO audit (uid, act, coll, doc, info)
  SELECT $5::int, CASE WHEN w.created THEN 'create' ELSE 'merge' END, $1::text, $2::text, $3::text::jsonb FROM w
)
SELECT seq::float8 AS seq, created FROM w`;

const SQL_REPLACE = `
WITH w AS (
  INSERT INTO docs (coll, id, body, updated_by) VALUES ($1::text, $2::text, $3::text::jsonb, $4::text)
  ON CONFLICT (coll, id) DO UPDATE SET body = EXCLUDED.body, updated_by = EXCLUDED.updated_by
  RETURNING seq, (xmax = 0) AS created
), a AS (
  INSERT INTO audit (uid, act, coll, doc, info)
  SELECT $5::int, CASE WHEN w.created THEN 'create' ELSE 'replace' END, $1::text, $2::text, $3::text::jsonb FROM w
)
SELECT seq::float8 AS seq, created FROM w`;

export default route({
  GET: {
    auth: 'any',
    fn: async ({ res, q: p }) => {
      if (!ALL_COLLS.includes(p.coll) || !ID_RE.test(p.id || '')) throw new HttpError(400, 'invalid_argument', "Hujjat nomi noto'g'ri");
      const rows = await q(`SELECT body::text AS body, seq::float8 AS seq FROM docs WHERE coll = $1::text AND id = $2::text`, [p.coll, p.id]);
      if (!rows.length) return { exists: false };
      send(res, 200, `{"exists":true,"seq":${JSON.stringify(rows[0].seq)},"body":${rows[0].body}}`);
    },
  },
  POST: {
    auth: 'write',
    limit: 1_500_000,
    fn: async ({ user, body }) => {
      const { coll, id, op } = body;
      const { data, mode } = checkWrite(user, coll, id, op, body.data);
      const json = JSON.stringify(data);
      const sql = mode === 'update' ? SQL_UPDATE : mode === 'merge' ? SQL_MERGE : SQL_REPLACE;
      const rows = await q(sql, [coll, id, json, user.uid, user.id]);
      if (!rows.length) throw new HttpError(404, 'invalid_argument', 'Hujjat topilmadi');
      return { ok: true, seq: rows[0].seq, created: !!rows[0].created, mode };
    },
  },
});
