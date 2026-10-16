// Sinxronlash: brauzer «since» tartib raqamidan keyin o'zgargan hujjatlarni oladi.
// So'nggi 5 soniyada yozilgan hujjatlar keyingi so'rovga qoldiriladi: tartib raqami olingan, lekin hali
// tugallanmagan yozuv o'tkazib yuborilmasligi uchun. Har javobda bazadagi hujjatlar soni va tartib
// raqamlari yig'indisi keladi — brauzer o'zidagi nusxa bilan solishtirib, farq bo'lsa hammasini qayta oladi.
import { route, HttpError, send } from '../lib/http.js';
import { q, SYNC_COLLS } from '../lib/db.js';

export const PAGE_BYTES = 2_500_000;
const SETTLE = `interval '5 seconds'`;

export const SQL_SYNC = `
WITH m AS (
  SELECT count(*)::int AS n,
         coalesce(max(seq), 0)::float8 AS head,
         coalesce(sum(seq), 0)::float8 AS sum,
         (count(*) FILTER (WHERE seq > $1::bigint AND updated_at >= clock_timestamp() - ${SETTLE}))::int AS young
  FROM docs WHERE coll = ANY (string_to_array($2::text, ','))
), t AS (
  SELECT coll, id, body, seq, size,
         sum(size) OVER w AS run,
         bool_and(updated_at < clock_timestamp() - ${SETTLE}) OVER w AS ok
  FROM docs
  WHERE seq > $1::bigint AND coll = ANY (string_to_array($2::text, ','))
  WINDOW w AS (ORDER BY seq)
), p AS (
  SELECT coll, id, body, seq, run, size, (count(*) OVER ())::int AS okn FROM t WHERE ok
)
SELECT m.n, m.head, m.sum, m.young, p.coll, p.id, p.body::text AS body, p.seq::float8 AS seq, p.okn
FROM m LEFT JOIN p ON p.run - p.size < $3::bigint
ORDER BY p.seq`;

// Javobni matn sifatida yig'amiz: hujjat tanasi bazadan tayyor JSON matn bo'lib keladi.
export function pageJson(rows, since) {
  const r0 = rows[0] || {};
  const docs = rows.filter((r) => r.coll != null);
  const okn = docs.length ? docs[0].okn : 0;
  const next = docs.length ? docs[docs.length - 1].seq : since;
  const parts = docs.map((r) => `{"coll":${JSON.stringify(r.coll)},"id":${JSON.stringify(r.id)},"seq":${JSON.stringify(r.seq)},"body":${r.body}}`);
  return `{"n":${r0.n || 0},"head":${r0.head || 0},"sum":${r0.sum || 0},"young":${r0.young || 0},"next":${next},"more":${docs.length < okn},"docs":[${parts.join(',')}]}`;
}

export default route({
  GET: {
    auth: 'any',
    fn: async ({ res, q: p }) => {
      const since = p.since == null || p.since === '' ? 0 : Number(p.since);
      if (!Number.isFinite(since) || since < 0 || Math.floor(since) !== since) throw new HttpError(400, 'bad_request', "since noto'g'ri");
      const rows = await q(SQL_SYNC, [String(since), SYNC_COLLS.join(','), String(PAGE_BYTES)]);
      send(res, 200, pageJson(rows, since));
    },
  },
});
