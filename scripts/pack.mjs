// app/ dagi sahifa manbasidan serverga tayyor fayllarni yig'adi:
//   app/markup.html -> public/index.html   (ochiq: faqat ko'rinish va uslub, ma'lumot yo'q)
//   app/app.js      -> lib/app-code-1..4.js (siqilgan; faqat tizimga kirganlarga /api/app orqali beriladi)
//   data/qum-zanjiri-data.json -> lib/seed-data.js (bo'lsa; birinchi sozlashda bo'sh bazaga yuklanadi; GitHub'ga chiqmaydi)
// Sahifa kodi o'zgarsa: node scripts/pack.mjs   (yoki npm run pack)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => fs.readFileSync(path.join(root, p), 'utf8');

export function buildIndex(markup) {
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<link rel="stylesheet" href="/qz.css">
</head>
<body>
${markup.trim()}
<script src="/shim.js"></script>
</body>
</html>
`;
}

// Sahifa kodi siqilgan (brotli) holda bir necha modulga bo'linadi — serverga yuklash hajmi ~4 marta kam.
// lib/app-bundle.js ularni birlashtirib, ochadi.
const BR = { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_LGWIN]: 24 } };
export const PARTS = 4;
export function packText(text) { return zlib.brotliCompressSync(Buffer.from(text, 'utf8'), BR).toString('base64'); }
export function buildParts(code) {
  const b64 = packText(code), n = Math.ceil(b64.length / PARTS), out = [];
  for (let i = 0; i < PARTS; i++) out.push(`// AVTOMATIK YIG'ILGAN — qo'lda o'zgartirmang (npm run pack)\nexport default ${JSON.stringify(b64.slice(i * n, (i + 1) * n))};\n`);
  return out;
}
export function buildSeed(json) {
  return `// AVTOMATIK YIG'ILGAN — birinchi sozlashda bo'sh bazaga yuklanadigan ma'lumot (data/qum-zanjiri-data.json, brotli)\nexport default ${JSON.stringify(packText(json))};\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(root, 'public/index.html'), buildIndex(rd('app/markup.html')));
  buildParts(rd('app/app.js')).forEach((t, i) => fs.writeFileSync(path.join(root, `lib/app-code-${i + 1}.js`), t));
  const dataFile = path.join(root, 'data/qum-zanjiri-data.json');
  if (fs.existsSync(dataFile)) fs.writeFileSync(path.join(root, 'lib/seed-data.js'), buildSeed(fs.readFileSync(dataFile, 'utf8')));
  console.log('public/index.html, lib/app-code-*.js' + (fs.existsSync(dataFile) ? ', lib/seed-data.js' : '') + ' yangilandi');
}
