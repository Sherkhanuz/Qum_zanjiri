// Foydalanuvchilarni boshqarish (administrator) va o'z parolini almashtirish (har kim).
import { route, HttpError } from '../lib/http.js';
import { q } from '../lib/db.js';
import { hashPassword, verifyPassword, passwordProblem, setSession, forgetUser } from '../lib/auth.js';

export const ROLES = ['admin', 'operator', 'viewer'];
export const SITES = ['SAM', 'QIB', 'CHU', 'MEG'];
const LOGIN_RE = /^[a-z0-9._-]{3,32}$/;

const bad = (m) => new HttpError(400, 'invalid_argument', m);
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 80);
const cleanSite = (s) => (s == null || s === '' ? null : SITES.includes(s) ? s : (() => { throw bad("Uchastka noto'g'ri"); })());

async function audit(uid, act, info) {
  await q(`INSERT INTO audit (uid, act, coll, doc, info) VALUES ($1::int, $2::text, 'users', $3::text, $4::text::jsonb)`,
    [uid, act, info && info.id != null ? String(info.id) : null, JSON.stringify(info || {})]);
}

// Oxirgi faol administratorni o'chirish yoki rolini tushirish mumkin emas
const SQL_GUARD = `(SELECT count(*) FROM users WHERE role = 'admin' AND active AND id <> $1::int) > 0`;

export default route({
  GET: {
    auth: 'admin',
    fn: async () => {
      const rows = await q(`SELECT id, login, name, role, site, active,
          to_char(created_at AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD HH24:MI') AS created,
          to_char(last_login AT TIME ZONE 'Asia/Tashkent', 'YYYY-MM-DD HH24:MI') AS last_login
        FROM users ORDER BY id`);
      return { users: rows.map((r) => Object.assign({}, r, { uid: 'u' + r.id })) };
    },
  },
  POST: {
    auth: 'any',
    limit: 10_000,
    fn: async ({ req, res, user, body }) => {
      const op = body.op;
      if (op === 'mypass') {
        const rows = await q(`SELECT pass, pv, login, role FROM users WHERE id = $1::int`, [user.id]);
        const u = rows[0];
        if (!u || !(await verifyPassword(String(body.old || ''), u.pass))) throw new HttpError(403, 'bad_credentials', "Joriy parol noto'g'ri");
        const prob = passwordProblem(body.password, u.login, u.role);
        if (prob) throw bad(prob);
        const h = await hashPassword(body.password);
        const r2 = await q(`UPDATE users SET pass = $2::text, pv = pv + 1 WHERE id = $1::int RETURNING pv`, [user.id, h]);
        forgetUser(user.id);
        await audit(user.id, 'user.mypass', { id: user.id });
        setSession(req, res, { id: user.id, pv: r2[0].pv });        // boshqa qurilmalardagi sessiyalar yopiladi, bu qoladi
        return { ok: true };
      }

      if (user.role !== 'admin') throw new HttpError(403, 'refused', "Bu amalga ruxsat yo'q");

      if (op === 'create') {
        const login = String(body.login || '').trim().toLowerCase();
        if (!LOGIN_RE.test(login)) throw bad("Login 3–32 belgi: kichik lotin harflari, raqam, nuqta, chiziqcha");
        const name = cleanName(body.name);
        if (!name) throw bad('Ismni kiriting');
        if (!ROLES.includes(body.role)) throw bad("Rol noto'g'ri");
        const site = cleanSite(body.site);
        const prob = passwordProblem(body.password, login, body.role);
        if (prob) throw bad(prob);
        const h = await hashPassword(body.password);
        const rows = await q(`INSERT INTO users (login, name, role, site, pass) VALUES ($1::text, $2::text, $3::text, $4::text, $5::text)
          ON CONFLICT (login) DO NOTHING RETURNING id`, [login, name, body.role, site, h]);
        if (!rows.length) throw new HttpError(409, 'exists', 'Bu login band');
        await audit(user.id, 'user.create', { id: rows[0].id, login, name, role: body.role, site });
        return { ok: true, id: rows[0].id };
      }

      const id = Number(body.id);
      if (!Number.isInteger(id) || id < 1) throw bad("Foydalanuvchi noto'g'ri");

      if (op === 'update') {
        const cur = (await q(`SELECT id, login, name, role, site, active FROM users WHERE id = $1::int`, [id]))[0];
        if (!cur) throw new HttpError(404, 'not_found', 'Foydalanuvchi topilmadi');
        const next = {
          name: body.name !== undefined ? cleanName(body.name) : cur.name,
          role: body.role !== undefined ? body.role : cur.role,
          site: body.site !== undefined ? cleanSite(body.site) : cur.site,
          active: body.active !== undefined ? !!body.active : cur.active,
        };
        if (!next.name) throw bad('Ismni kiriting');
        if (!ROLES.includes(next.role)) throw bad("Rol noto'g'ri");
        const demote = cur.role === 'admin' && cur.active && (next.role !== 'admin' || !next.active);
        const rows = await q(`UPDATE users SET name = $2::text, role = $3::text, site = $4::text, active = $5::boolean,
            pv = CASE WHEN $5::boolean = false OR $3::text <> role THEN pv + 1 ELSE pv END
          WHERE id = $1::int ${demote ? 'AND ' + SQL_GUARD : ''} RETURNING id`,
          [id, next.name, next.role, next.site, next.active ? 'true' : 'false']);
        if (!rows.length) throw new HttpError(409, 'last_admin', "Oxirgi faol administratorni o'chirib yoki rolini o'zgartirib bo'lmaydi");
        forgetUser(id);
        await audit(user.id, 'user.update', { id, from: cur, to: next });
        return { ok: true };
      }

      if (op === 'password') {
        const cur = (await q(`SELECT login, role FROM users WHERE id = $1::int`, [id]))[0];
        if (!cur) throw new HttpError(404, 'not_found', 'Foydalanuvchi topilmadi');
        const prob = passwordProblem(body.password, cur.login, cur.role);
        if (prob) throw bad(prob);
        const h = await hashPassword(body.password);
        await q(`UPDATE users SET pass = $2::text, pv = pv + 1 WHERE id = $1::int`, [id, h]);
        await q(`DELETE FROM throttle WHERE k = $1::text`, ['l:' + cur.login]);
        forgetUser(id);
        await audit(user.id, 'user.password', { id });
        if (id === user.id) {
          const pv = (await q(`SELECT pv FROM users WHERE id = $1::int`, [id]))[0].pv;
          setSession(req, res, { id, pv });
        }
        return { ok: true };
      }

      throw bad("Amal noto'g'ri");
    },
  },
});
