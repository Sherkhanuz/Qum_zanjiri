// O'zgarishlar tarixi (log, cfglog) — sana oralig'i bo'yicha. Javob hajmi 4 MB bilan cheklanadi
// (eng yangilari birinchi); cheklovga yetsa "truncated": true qaytadi.
import { route, HttpError, send } from '../lib/http.js';
import { q } from '../lib/db.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const SQL = `
SELECT id, body::text AS body FROM (
  SELECT id, body, size, body->>'d' AS d, sum(size) OVER (ORDER BY body->>'d' DESC, id) AS run
  FROM docs
  WHERE coll = $1::text AND body->>'d' >= $2::text AND body->>'d' <= $3::text
  ORDER BY body->>'d' DESC, id
  LIMIT $4::int
) t WHERE run - size < 4000000
ORDER BY d DESC, id`;

export default route({
  GET: {
    auth: 'any',
    fn: async ({ res, q: p }) => {
      if (p.coll !== 'log' && p.coll !== 'cfglog') throw new HttpError(400, 'invalid_argument', 'Faqat log va cfglog');
      if (!DAY.test(p.from || '') || !DAY.test(p.to || '')) throw new HttpError(400, 'invalid_argument', "Sana noto'g'ri");
      const limit = Math.max(1, Math.min(1000, Math.floor(Number(p.limit) || 1000)));
      const rows = await q(SQL, [p.coll, p.from, p.to, String(limit)]);
      const cnt = await q(`SELECT count(*)::int AS n FROM docs WHERE coll = $1::text AND body->>'d' >= $2::text AND body->>'d' <= $3::text`, [p.coll, p.from, p.to]);
      const total = cnt[0] ? cnt[0].n : rows.length;
      const parts = rows.map((r) => `{"id":${JSON.stringify(r.id)},"body":${r.body}}`);
      send(res, 200, `{"total":${total},"truncated":${rows.length < total},"docs":[${parts.join(',')}]}`);
    },
  },
});
