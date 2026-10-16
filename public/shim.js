/* Qum zanjiri — sahifani o'z serveringizga ulovchi qatlam.
   Sahifa dasturi (api/app) claude.ai muhitida ishlagani kabi window.claude.use('db' | 'user' | 'downloads')
   orqali ishlaydi; bu fayl o'sha uchta imkoniyatni /api ga ulab beradi. Dastur kodi o'zgarmagan.

   Ma'lumot oqimi:
   - Kirishda barcha jurnal hujjatlari bir marta yuklanadi (/api/sync), keyin faqat o'zgarganlari olinadi:
     sahifa ochiq va foydalanuvchi faol bo'lsa har 20 soniyada, 2 daqiqa harakatsizlikdan keyin har daqiqada,
     15 daqiqadan keyin to'xtaydi (bosish yoki oynaga qaytish bilan darhol davom etadi).
   - Har javobda server hujjatlar soni va tartib raqamlari yig'indisini beradi; brauzerdagi nusxa farq qilsa,
     hammasi qayta yuklanadi.
   - Yozish: serverga yuboriladi, muvaffaqiyatli bo'lsa brauzerdagi nusxaga ham qo'llanadi. Aloqa uzilsa
     2 marta qayta urinadi (bir xil yozuvni qayta yuborish xavfsiz — natija o'zgarmaydi). */
(function () {
  'use strict';
  var SYNC = ['config', 'reys', 'vagon', 'tex', 'mat', 'xar', 'inv', 'karyer'];
  var ROLE_NAME = { admin: 'Administrator', operator: 'Operator', viewer: "Ko'ruvchi" };
  var ACTIVE_MS = 120000, IDLE_MS = 900000, FAST = 20000, SLOW = 60000;

  /* ---------------- tarmoq ---------------- */
  var authLost = false;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function mapErr(status, er) {
    var c = (er && er.code) || '';
    if (status === 401) return 'not_granted';
    if (status === 403) return 'refused';
    if (status === 404 || status === 400 || status === 409 || status === 415) return 'invalid_argument';
    if (status === 413) return 'quota_exceeded';
    if (status === 429) return 'rate_limited';
    return c === 'setup_needed' ? 'setup_needed' : 'unavailable';
  }
  function api(method, url, body) {
    var h = { 'X-QZ': '1' };
    var opt = { method: method, credentials: 'same-origin', cache: 'no-store', headers: h };
    if (body !== undefined) { h['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(url, opt).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        if (r.ok) { if (authLost) authBack(); return j; }
        var er = (j && j.error) || {};
        if (r.status === 401 && ME) authGone();
        throw { code: mapErr(r.status, er), status: r.status, message: er.message || ('HTTP ' + r.status), retry: r.status >= 500 && ['setup_needed', 'no_database', 'no_secret'].indexOf(er.code) < 0 };
      });
    }, function () { throw { code: 'unavailable', status: 0, message: 'Tarmoq xatosi', retry: true }; });
  }
  // Yozuvlar takror yuborilsa ham natija bir xil (chuqur birlashtirish), shuning uchun qayta urinish xavfsiz
  function withRetry(fn) {
    var n = 0;
    function go() {
      return fn().catch(function (e) {
        if (e && e.retry && n < 2) { n++; return sleep(n === 1 ? 1000 : 3000).then(go); }
        throw e;
      });
    }
    return go();
  }

  /* ---------------- brauzerdagi nusxa ---------------- */
  var C = {};
  SYNC.forEach(function (c) { C[c] = new Map(); });
  var since = 0, initial = false, subs = [], bootAt = Date.now();
  var clone = function (x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); };
  // claude.ai bazasining update() qoidasi bilan bir xil: ichma-ich obyektlar birlashadi, qolgani almashtiriladi
  function merge(a, b) {
    for (var k in b) {
      if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]);
      else a[k] = b[k];
    }
    return a;
  }
  function collSnap(coll) {
    var docs = [];
    C[coll].forEach(function (v, id) { docs.push({ id: id, exists: true, data: function () { return v.body; } }); });
    docs.sort(function (x, y) {
      var a = String((x.data() && x.data().p) || ''), b = String((y.data() && y.data().p) || '');
      return a < b ? 1 : a > b ? -1 : (x.id < y.id ? -1 : x.id > y.id ? 1 : 0);
    });
    return { docs: docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function docSnap(coll, id) {
    var v = C[coll] && C[coll].get(id);
    return { id: id, exists: !!v, data: function () { return v ? v.body : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function fireOne(s) {
    try { if (s.kind === 'coll') s.cb(collSnap(s.coll)); else s.cb(docSnap(s.coll, s.id)); } catch (e) { console.error(e); }
  }
  function fire(colls) {
    if (!initial) return;
    subs.slice().forEach(function (s) { if (s.on && colls.has(s.coll)) fireOne(s); });
  }
  function counts() {
    var n = 0, sum = 0, max = 0;
    SYNC.forEach(function (c) { C[c].forEach(function (v) { n++; sum += v.seq; if (v.seq > max) max = v.seq; }); });
    return { n: n, sum: sum, max: max };
  }

  /* ---------------- sinxronlash ---------------- */
  var pulling = null, again = false, lastTry = 0, lastOk = 0, resyncAt = 0, failN = 0;
  function pull(full) {
    if (pulling) { again = true; return pulling; }
    lastTry = Date.now();
    var needResync = false;
    pulling = (async function () {
      var cur = full ? 0 : since, fresh = null, changed = new Set(), last = null;
      if (full) { fresh = {}; SYNC.forEach(function (c) { fresh[c] = new Map(); }); }
      for (var i = 0; i < 500; i++) {
        var r = await api('GET', '/api/sync?since=' + cur);
        r.docs.forEach(function (d) {
          var m = fresh ? fresh[d.coll] : C[d.coll];
          if (!m) return;
          var old = m.get(d.id);
          if (!old || d.seq >= old.seq) { m.set(d.id, { seq: d.seq, body: d.body }); changed.add(d.coll); }
        });
        last = r;
        var nx = r.next;
        if (!r.more || nx <= cur) { cur = Math.max(cur, nx); break; }
        cur = nx;
      }
      if (fresh) {
        // to'liq qayta yuklash paytida tugagan o'z yozuvlarimiz yo'qolmasin
        SYNC.forEach(function (c) {
          C[c].forEach(function (v, id) { var f = fresh[c].get(id); if (v.seq > cur && (!f || f.seq < v.seq)) fresh[c].set(id, v); });
          C[c] = fresh[c];
          changed.add(c);
        });
      }
      since = cur;
      lastOk = Date.now(); failN = 0;
      if (last && !last.more && !last.young) {
        var k = counts();
        if (k.max <= last.head && (k.n !== last.n || k.sum !== last.sum)) {
          if (!full && Date.now() - resyncAt > 120000) { resyncAt = Date.now(); needResync = true; console.warn('qz: brauzerdagi nusxa serverdan farq qildi — qayta yuklanmoqda', k, last); }
          else console.warn('qz: nusxa farqi saqlanib qoldi', k, last);
        }
      }
      if (!initial && last && last.young && Date.now() - bootAt < 15000) {
        // Hozirgina yozilgan hujjatlar bir necha soniyadan keyin beriladi — bo'sh holatni ko'rsatmaslik uchun kutamiz
        setTimeout(function () { if (!pulling) pull().catch(function () { }); }, 1500);
        return;
      }
      if (!initial) { initial = true; SYNC.forEach(function (c) { changed.add(c); }); }
      fire(changed);
      status();
    })();
    return pulling.then(function () { }, function (e) { failN++; status(e); throw e; }).finally(function () {
      pulling = null;
      if (needResync) { pull(true).catch(function () { }); }
      else if (again) { again = false; pull().catch(function () { }); }
    });
  }

  var lastAct = Date.now();
  function due() {
    if (document.visibilityState !== 'visible' || authLost) return false;
    var idle = Date.now() - lastAct;
    var iv = !initial ? 5000 : idle < ACTIVE_MS ? FAST : idle < IDLE_MS ? SLOW : 0;
    if (!iv) return false;
    if (failN) iv = Math.min(SLOW, Math.max(iv, 5000 * failN));
    return Date.now() - lastTry >= iv - 300;
  }
  function tick() { if (due() && !pulling) pull().catch(function () { }); setTimeout(tick, 4000); }
  function poke() {
    var wasIdle = Date.now() - lastAct > ACTIVE_MS;
    lastAct = Date.now();
    if (wasIdle && Date.now() - lastTry > 5000 && !pulling) pull().catch(function () { });
  }

  /* ---------------- db imkoniyati ---------------- */
  function splitPath(p) { var s = String(p).split('/'); return { coll: s[0], id: s[1] }; }
  function docRef(coll, id) {
    var synced = !!C[coll];
    return {
      id: id, path: coll + '/' + id,
      get: function () {
        return withRetry(function () { return api('GET', '/api/doc?coll=' + encodeURIComponent(coll) + '&id=' + encodeURIComponent(id)); }).then(function (r) {
          if (r.exists && synced) {
            var old = C[coll].get(id);
            if (!old || r.seq > old.seq) { C[coll].set(id, { seq: r.seq, body: r.body }); fire(new Set([coll])); }
          }
          var b = r.exists ? r.body : undefined;
          return { id: id, exists: !!r.exists, data: function () { return b; }, metadata: { fromCache: false } };
        });
      },
      set: function (data) { return write(coll, id, 'set', data); },
      update: function (data) { return write(coll, id, 'update', data); },
      delete: function () { return Promise.reject({ code: 'refused', message: "O'chirish qo'llanmaydi" }); },
      acquire: function () { return Promise.resolve({ acquired: true }); },   // server yangi hujjatni bir vaqtda ikki kishi yaratsa ham birlashtiradi
      release: function () { return Promise.resolve(); },
      onSnapshot: function (cb, err) {
        if (!synced) { setTimeout(function () { err && err({ code: 'invalid_argument' }); }, 0); return function () { }; }
        var s = { kind: 'doc', coll: coll, id: id, cb: cb, err: err, on: true };
        subs.push(s);
        if (initial) setTimeout(function () { if (s.on) fireOne(s); }, 0);
        return function () { s.on = false; };
      },
    };
  }
  function write(coll, id, op, data) {
    var payload = clone(data);
    return withRetry(function () { return api('POST', '/api/doc', { coll: coll, id: id, op: op, data: payload }); }).then(function (r) {
      var m = C[coll];
      if (m) {
        var old = m.get(id), body = null;
        if (r.mode === 'replace') body = clone(payload);
        else if (old) body = merge(clone(old.body), clone(payload));
        else if (r.created) body = clone(payload);
        if (body && (!old || r.seq >= old.seq)) { m.set(id, { seq: r.seq, body: body }); fire(new Set([coll])); }
        else if (!body) { setTimeout(function () { pull().catch(function () { }); }, 500); }
      }
      return undefined;
    });
  }
  function collRef(coll) {
    var w = {}, lim = 1000;
    var qy = {
      doc: function (id) { return docRef(coll, id); },
      orderBy: function () { return qy; },
      limit: function (n) { lim = n; return qy; },
      where: function (f, op, v) { if (f === 'd' && op === '>=') w.from = v; else if (f === 'd' && op === '<=') w.to = v; else w.bad = true; return qy; },
      get: function () {
        if (C[coll] && !w.from) return Promise.resolve(collSnap(coll));
        if (w.bad || !w.from || !w.to) return Promise.reject({ code: 'invalid_argument', message: "So'rov qo'llanmaydi" });
        var url = '/api/query?coll=' + encodeURIComponent(coll) + '&from=' + encodeURIComponent(w.from) + '&to=' + encodeURIComponent(w.to) + '&limit=' + lim;
        return withRetry(function () { return api('GET', url); }).then(function (r) {
          var docs = r.docs.map(function (d) { return { id: d.id, exists: true, data: function () { return d.body; } }; });
          return { docs: docs, size: docs.length, empty: !docs.length, truncated: !!r.truncated };
        });
      },
      onSnapshot: function (cb, err) {
        if (!C[coll]) { setTimeout(function () { err && err({ code: 'invalid_argument' }); }, 0); return function () { }; }
        var s = { kind: 'coll', coll: coll, cb: cb, err: err, on: true };
        subs.push(s);
        if (initial) setTimeout(function () { if (s.on) fireOne(s); }, 0);
        return function () { s.on = false; };
      },
    };
    return qy;
  }
  var db = Object.freeze({
    doc: function (p) { var x = splitPath(p); return docRef(x.coll, x.id); },
    collection: function (c) { return collRef(c); },
  });

  /* ---------------- user va downloads ---------------- */
  var ME = null, NAMES = {}, namesAt = 0;
  var user = Object.freeze({
    me: function () { return Promise.resolve({ id: ME.id, name: ME.name, role: ME.role, site: ME.site || null }); },
    id: function () { return Promise.resolve(ME.id); },
    isOwner: function () { return ME.role === 'admin'; },
    canEdit: function () { return Promise.resolve(ME.role === 'admin'); },
    can: function (n) { return Promise.resolve(n === 'data.write' ? ME.role !== 'viewer' : false); },
    profiles: function (ids) {
      var miss = (ids || []).some(function (i) { return !(i in NAMES); });
      var p = miss && Date.now() - namesAt > 60000
        ? api('GET', '/api/auth').then(function (r) { NAMES = r.names || NAMES; namesAt = Date.now(); }, function () { })
        : Promise.resolve();
      return p.then(function () {
        var o = {};
        (ids || []).forEach(function (i) { o[i] = { id: i, name: NAMES[i] || '' }; });
        return o;
      });
    },
  });
  var downloads = Object.freeze({
    save: function (o) {
      try {
        var name = String((o && o.filename) || 'fayl');
        var d = o && o.data;
        var type = /\.csv$/i.test(name) ? 'text/csv;charset=utf-8' : /\.xlsx$/i.test(name) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : /\.json$/i.test(name) ? 'application/json' : 'application/octet-stream';
        var blob = (typeof Blob !== 'undefined' && d instanceof Blob) ? d : new Blob([d == null ? '' : d], { type: type });
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = name; a.style.display = 'none';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 30000);
        return Promise.resolve({ saved: true });
      } catch (e) { return Promise.reject({ code: 'failed', message: String(e && e.message || e) }); }
    },
  });

  /* ---------------- ekran: foydalanuvchi, holat, ogohlantirish ---------------- */
  var ui = {};
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) { if (k === 'text') e.textContent = attrs[k]; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function hhmm(t) { var d = new Date(t); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function status(err) {
    if (!ui.st) return;
    if (err && !lastOk) { ui.st.textContent = "Ma'lumot yuklanmadi — qayta urinilmoqda"; ui.st.className = 'qz-st bad'; return; }
    if (err) { ui.st.textContent = "Aloqa yo'q · oxirgi " + hhmm(lastOk); ui.st.className = 'qz-st bad'; ui.st.title = "Serverdan yangilanish olinmadi. Kiritilgan yozuvlar saqlanayotganini «Saqlangan» belgisidan tekshiring."; return; }
    ui.st.textContent = 'Yangilandi ' + hhmm(lastOk);
    ui.st.className = 'qz-st';
    ui.st.title = "Boshqa foydalanuvchilar kiritgan ma'lumot avtomatik olinadi";
  }
  function authGone() {
    if (authLost) return;
    authLost = true;
    if (!ui.ban) {
      ui.ban = el('div', { class: 'qz-ban', role: 'alert' }, [
        el('span', { text: "Sessiya tugagan — yangi yozuvlar saqlanmaydi. Qayta kiring, so'ng shu sahifada yozuvni yana saqlang." }),
        el('a', { href: '/login.html?w=1', target: '_blank', rel: 'noopener', text: 'Qayta kirish (yangi oynada)' }),
        el('button', { type: 'button', text: 'Tekshirish', onclick: function () { api('GET', '/api/auth').then(function () { authBack(); }, function () { }); } }),
      ]);
      document.body.appendChild(ui.ban);
    }
    ui.ban.hidden = false;
  }
  function authBack() { authLost = false; if (ui.ban) ui.ban.hidden = true; pull().catch(function () { }); }
  function topbar() {
    var ctl = document.querySelector('.topbar .ctl');
    if (!ctl) return;
    ui.st = el('span', { class: 'qz-st', text: 'Yuklanmoqda…' });
    var who = el('span', { class: 'qz-me', title: ROLE_NAME[ME.role] || ME.role, text: ME.name });
    var link = el('a', { class: 'qz-lnk', href: '/users.html', text: ME.role === 'admin' ? 'Foydalanuvchilar' : 'Parol' });
    var out = el('button', { type: 'button', class: 'qz-out', text: 'Chiqish', onclick: function () {
      api('POST', '/api/auth', { op: 'logout' }).then(function () { location.replace('/login.html'); }, function () { location.replace('/login.html'); });
    } });
    ctl.insertBefore(el('span', { class: 'qz-user' }, [who, ui.st, link, out]), ctl.firstChild);
  }
  function fatal(msg) {
    var main = document.getElementById('main');
    if (!main) return;
    main.innerHTML = '';
    main.appendChild(el('div', { class: 'qz-fatal' }, [
      el('p', { text: msg }),
      el('button', { type: 'button', class: 'pri', text: 'Qayta urinish', onclick: function () { location.reload(); } }),
    ]));
  }

  /* ---------------- ishga tushirish ---------------- */
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var ready = api('GET', '/api/auth').then(function (r) {
    ME = r.user; NAMES = r.names || {}; namesAt = Date.now();
    // Bitta qurilmada boshqa foydalanuvchi kirgan bo'lsa — oldingisining sahifa sozlamalari tozalanadi
    if (ls('qzv-uid') !== ME.id) { ['qz-site', 'qz-full', 'qz-tab'].forEach(function (k) { ls(k, null); }); ls('qzv-uid', ME.id); }
    if (ME.role === 'operator' && ME.site && !ls('qz-site')) ls('qz-site', ME.site);
    if (ME.role === 'viewer') {
      if (ls('qz-full') == null) ls('qz-full', '1');
      if (!location.hash && !ls('qz-tab')) { try { history.replaceState(null, '', '#panel'); } catch (e) { } }
    }
    topbar();
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, poke, { passive: true, capture: true }); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') { lastAct = Date.now(); if (Date.now() - lastTry > 5000 && !pulling) pull().catch(function () { }); } });
    window.addEventListener('online', function () { if (!pulling) pull().catch(function () { }); });
    pull().catch(function () { });
    setTimeout(tick, 4000);
    var s = document.createElement('script');
    s.src = '/api/app';
    s.onerror = function () { fatal("Sahifa dasturini yuklab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."); };
    document.body.appendChild(s);
    return true;
  }, function (e) {
    if (e && e.status === 401) { location.replace('/login.html' + (location.hash ? '?h=' + encodeURIComponent(location.hash.slice(1)) : '')); return false; }
    if (e && (e.code === 'setup_needed' || e.status === 503)) { location.replace('/setup.html'); return false; }
    fatal("Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.");
    return false;
  });

  window.claude = Object.freeze({
    use: function (name) {
      return ready.then(function (ok) {
        if (!ok) return null;
        return name === 'db' ? db : name === 'user' ? user : name === 'downloads' ? downloads : null;
      });
    },
  });
})();
