// GET  — kim kirgan (va foydalanuvchilar ismlari — tarixda «kim o'zgartirdi» uchun)
// POST {op:'login', login, password} — kirish ; POST {op:'logout'} — chiqish
import { route, HttpError, clientIp } from '../lib/http.js';
import { q } from '../lib/db.js';
import { verifyPassword, dummyVerify, setSession, clearSession, forgetUser, names } from '../lib/auth.js';

const IP_LIMIT = 5;        // bitta manzildan bitta loginga: 5 xato → 15 daqiqa kutish
const LOGIN_LIMIT = 30;    // bitta loginga jami: soatiga 30 xato → 15 daqiqa kutish

const SQL_FAIL = `
INSERT INTO throttle (k, n, since, until) VALUES ($1::text, 1, now(), CASE WHEN 1 >= $2::int THEN now() + interval '15 minutes' END)
ON CONFLICT (k) DO UPDATE SET
  n = CASE WHEN throttle.since < now() - interval '1 hour' THEN 1 ELSE throttle.n + 1 END,
  since = CASE WHEN throttle.since < now() - interval '1 hour' THEN now() ELSE throttle.since END,
  until = CASE WHEN (CASE WHEN throttle.since < now() - interval '1 hour' THEN 1 ELSE throttle.n + 1 END) >= $2::int
               THEN now() + interval '15 minutes' ELSE throttle.until END`;

export default route({
  GET: {
    auth: 'any',
    fn: async ({ user }) => ({
      user: { id: user.uid, login: user.login, name: user.name, role: user.role, site: user.site },
      names: await names(),
    }),
  },
  POST: {
    auth: false,
    limit: 10_000,
    fn: async ({ req, res, body }) => {
      if (body.op === 'logout') {
        clearSession(req, res);
        return { ok: true };
      }
      if (body.op !== 'login') throw new HttpError(400, 'bad_request', "Amal noto'g'ri");
      const login = String(body.login || '').trim().toLowerCase().slice(0, 64);
      const pw = String(body.password || '');
      if (!login || !pw) throw new HttpError(400, 'bad_request', 'Login va parolni kiriting');
      const kIp = 'i:' + clientIp(req) + '|' + login, kLogin = 'l:' + login;
      const lock = await q(
        `SELECT ceil(extract(epoch FROM max(until) - now()))::int AS s FROM throttle WHERE k IN ($1::text, $2::text) AND until > now()`,
        [kIp, kLogin]);
      if (lock[0] && lock[0].s > 0) {
        throw new HttpError(429, 'locked', `Ko'p marta noto'g'ri parol kiritildi. ${Math.ceil(lock[0].s / 60)} daqiqadan keyin urinib ko'ring.`, { retryAfter: lock[0].s });
      }
      const rows = await q(`SELECT id, pass, pv, active FROM users WHERE login = $1::text`, [login]);
      const u = rows[0];
      const ok = u ? (await verifyPassword(pw, u.pass)) && u.active : await dummyVerify(pw);
      if (!ok) {
        await q(SQL_FAIL, [kIp, String(IP_LIMIT)]);
        await q(SQL_FAIL, [kLogin, String(LOGIN_LIMIT)]);
        await q(`DELETE FROM throttle WHERE since < now() - interval '1 day' AND (until IS NULL OR until < now())`);
        throw new HttpError(401, 'bad_credentials', "Login yoki parol noto'g'ri");
      }
      await q(`DELETE FROM throttle WHERE k = $1::text`, [kIp]);
      await q(`UPDATE users SET last_login = now() WHERE id = $1::int`, [u.id]);
      forgetUser(u.id);
      setSession(req, res, { id: u.id, pv: u.pv });
      return { ok: true };
    },
  },
});
