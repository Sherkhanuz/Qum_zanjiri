/* Zaxira nusxa: yuklab olish va fayldan tiklash (administrator) */
window.QZB = (function () {
  'use strict';
  var COLLS = ['config', 'reys', 'vagon', 'tex', 'mat', 'xar', 'inv', 'karyer', 'log', 'cfglog'];
  var ID = /^[A-Za-z0-9_.-]{1,80}$/;
  var CHUNK = 1500000;

  // Fayl tekshiruvi: { app:'qum-zanjiri', format:1, docs:[{coll,id,body}] }
  function parse(text) {
    var d;
    try { d = JSON.parse(text); } catch (e) { throw new Error("Fayl JSON emas"); }
    if (!d || d.app !== 'qum-zanjiri' || !Array.isArray(d.docs)) throw new Error("Bu Qum zanjiri zaxira fayli emas");
    var seen = {}, by = {};
    d.docs.forEach(function (x, i) {
      if (!x || COLLS.indexOf(x.coll) < 0 || typeof x.id !== 'string' || !ID.test(x.id) || !x.body || typeof x.body !== 'object' || Array.isArray(x.body)) throw new Error('Faylda ' + (i + 1) + "-hujjat noto'g'ri");
      var k = x.coll + '/' + x.id;
      if (seen[k]) throw new Error(k + ' ikki marta uchradi');
      seen[k] = 1; by[x.coll] = (by[x.coll] || 0) + 1;
    });
    var rows = 0;
    d.docs.forEach(function (x) { if (x.body.rows) rows += Object.keys(x.body.rows).length; });
    return { data: d, count: d.docs.length, by: by, rows: rows };
  }

  function chunks(docs) {
    var out = [], cur = [], size = 0;
    docs.forEach(function (x) {
      var s = JSON.stringify(x).length;
      if (cur.length && (size + s > CHUNK || cur.length >= 200)) { out.push(cur); cur = []; size = 0; }
      cur.push(x); size += s;
    });
    if (cur.length) out.push(cur);
    return out;
  }

  async function upload(docs, mode, onp) {
    var parts = chunks(docs), tot = { added: 0, replaced: 0, skipped: 0 };
    for (var i = 0; i < parts.length; i++) {
      var r = await QZ.api('POST', '/api/backup', { mode: mode, docs: parts[i] });
      tot.added += r.added; tot.replaced += r.replaced; tot.skipped += r.skipped;
      if (onp) onp(i + 1, parts.length);
    }
    return tot;
  }

  async function download(onp) {
    var since = 0, map = new Map(), n = 0;
    for (var i = 0; i < 1000; i++) {
      var r = await QZ.api('GET', '/api/backup?since=' + since);
      r.docs.forEach(function (x) { map.set(x.coll + '/' + x.id, x); });   // sahifalash paytida o'zgargan hujjat — eng so'nggisi qoladi
      n += r.docs.length; if (onp) onp(map.size);
      if (!r.more || r.next <= since) break;
      since = r.next;
    }
    var docs = Array.from(map.values()).sort(function (a, b) { return a.coll < b.coll ? -1 : a.coll > b.coll ? 1 : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    var t = new Date(Date.now() + 5 * 36e5).toISOString();
    var file = { app: 'qum-zanjiri', format: 1, exportedAt: t, docs: docs };
    var blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'qum-zanjiri-zaxira-' + t.slice(0, 16).replace(/[T:]/g, '-') + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 30000);
    return docs.length;
  }

  return { parse: parse, upload: upload, download: download, chunks: chunks };
})();
