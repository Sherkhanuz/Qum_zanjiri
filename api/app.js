// Sahifa dasturi (hisob-kitob dvigateli va ko'rinishlar) — faqat tizimga kirgan foydalanuvchiga.
// Kodda standart normativlar va reja raqamlari bor, shuning uchun ochiq fayl sifatida berilmaydi.
import { route, send } from '../lib/http.js';
import { CODE, HASH } from '../lib/app-bundle.js';

const ETAG = `"${HASH}"`;

export default route({
  GET: {
    auth: 'any',
    fn: async ({ req, res }) => {
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      res.setHeader('ETag', ETAG);
      if (req.headers['if-none-match'] === ETAG) {
        res.statusCode = 304;
        res.setHeader('Cache-Control', 'private, no-cache');
        res.end();
        return;
      }
      send(res, 200, CODE, { 'Cache-Control': 'private, no-cache' });
    },
  },
});
