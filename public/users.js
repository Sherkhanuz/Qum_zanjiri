(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var el = QZ.el;
  var ROLE = { admin: 'Administrator', operator: 'Operator', viewer: "Ko'ruvchi" };
  var SITE = { SAM: 'Samarqand', QIB: 'Qibray', CHU: 'Chust', MEG: 'Megaton' };
  var ME = null, USERS = [], edit = null, rfile = null;

  function genPass() {
    var a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(14), s = '';
    crypto.getRandomValues(b);
    for (var i = 0; i < b.length; i++) s += a[b[i] % a.length];
    return s.slice(0, 4) + '-' + s.slice(4, 9) + '-' + s.slice(9);
  }

  $('out').addEventListener('click', function () {
    QZ.api('POST', '/api/auth', { op: 'logout' }).finally(function () { location.replace('/login.html'); });
  });

  $('fp').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var m = $('mp');
    if ($('pn').value !== $('pr').value) { QZ.msg(m, 'bad', 'Yangi parollar bir xil emas'); return; }
    QZ.api('POST', '/api/users', { op: 'mypass', old: $('po').value, password: $('pn').value }).then(function () {
      QZ.msg(m, 'ok', 'Parol almashtirildi.'); $('fp').reset();
    }, function (e) { QZ.msg(m, 'bad', e.message); });
  });

  /* ---------- ro'yxat ---------- */
  function load() {
    return QZ.api('GET', '/api/users').then(function (r) { USERS = r.users; render(); }, function (e) { QZ.msg($('mu'), 'bad', e.message); });
  }
  function act(body, okText) {
    return QZ.api('POST', '/api/users', body).then(function () { QZ.msg($('mu'), 'ok', okText); return load(); }, function (e) { QZ.msg($('mu'), 'bad', e.message); });
  }
  function render() {
    var tb = $('tbl').querySelector('tbody'); tb.innerHTML = '';
    USERS.forEach(function (u) {
      var self = u.id === ME.nid;
      tb.appendChild(el('tr', { 'data-login': u.login }, [
        el('td', { text: u.login }),
        el('td', { text: u.name }),
        el('td', { text: ROLE[u.role] || u.role }),
        el('td', { text: u.site ? SITE[u.site] || u.site : '—' }),
        el('td', null, [el('span', { class: 'chip ' + (u.active ? 'ok' : 'bad'), text: u.active ? 'faol' : 'bloklangan' })]),
        el('td', { text: u.last_login || '—' }),
        el('td', null, [
          el('button', { type: 'button', class: 'link', text: 'Tahrirlash', onclick: function () { openEd(u); } }),
          el('button', { type: 'button', class: 'link', text: 'Parolni tiklash', onclick: function () { resetPw(u); } }),
          self ? null : el('button', { type: 'button', class: 'link' + (u.active ? ' danger' : ''), text: u.active ? 'Bloklash' : 'Faollashtirish',
            onclick: function () { act({ op: 'update', id: u.id, active: !u.active }, u.login + (u.active ? ' bloklandi — u endi kira olmaydi.' : ' faollashtirildi.')); } }),
        ]),
      ]));
    });
  }
  function resetPw(u) {
    var p = genPass();
    QZ.api('POST', '/api/users', { op: 'password', id: u.id, password: p }).then(function () {
      var m = $('mu'); m.hidden = false; m.className = 'msg ok'; m.textContent = '';
      m.appendChild(document.createTextNode(u.login + ' uchun yangi parol: '));
      m.appendChild(el('code', { text: p }));
      m.appendChild(document.createTextNode(" — uni foydalanuvchiga bering. U kirgach «Parol» bo'limida o'zgartiradi. Eski kirishlari yopildi."));
    }, function (e) { QZ.msg($('mu'), 'bad', e.message); });
  }

  /* ---------- tahrirlash / yangi ---------- */
  function openEd(u) {
    edit = u || null;
    $('ed').hidden = false; QZ.msg($('me'), '', '');
    $('edh').textContent = u ? u.login + ' — tahrirlash' : 'Yangi foydalanuvchi';
    $('e-login').value = u ? u.login : ''; $('e-login').disabled = !!u;
    $('e-name').value = u ? u.name : '';
    $('e-role').value = u ? u.role : 'operator';
    $('e-site').value = u && u.site ? u.site : '';
    $('e-pw-f').hidden = !!u; $('e-gen').hidden = !!u;
    $('e-pw').value = u ? '' : genPass();
    $('ed').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    (u ? $('e-name') : $('e-login')).focus();
  }
  $('add').addEventListener('click', function () { openEd(null); });
  $('e-gen').addEventListener('click', function () { $('e-pw').value = genPass(); });
  $('e-cancel').addEventListener('click', function () { $('ed').hidden = true; edit = null; });
  $('fe').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var b = { name: $('e-name').value, role: $('e-role').value, site: $('e-site').value || null };
    var login = $('e-login').value.trim().toLowerCase(), pw = $('e-pw').value;
    var req = edit ? Object.assign({ op: 'update', id: edit.id }, b) : Object.assign({ op: 'create', login: login, password: pw }, b);
    QZ.api('POST', '/api/users', req).then(function () {
      $('ed').hidden = true;
      if (!edit) {
        var m = $('mu'); m.hidden = false; m.className = 'msg ok'; m.textContent = '';
        m.appendChild(document.createTextNode(login + ' qo\'shildi. Parol: '));
        m.appendChild(el('code', { text: pw }));
        m.appendChild(document.createTextNode(' — foydalanuvchiga bering.'));
      } else QZ.msg($('mu'), 'ok', 'Saqlandi.');
      edit = null; load();
    }, function (e) { QZ.msg($('me'), 'bad', e.message); });
  });

  /* ---------- zaxira ---------- */
  $('bk').addEventListener('click', function () {
    var b = this; b.disabled = true; $('bkn').textContent = 'Yuklanmoqda…';
    QZB.download(function (n) { $('bkn').textContent = n + ' ta hujjat…'; }).then(function (n) {
      $('bkn').textContent = n + ' ta hujjat yuklab olindi.'; b.disabled = false;
    }, function (e) { $('bkn').textContent = 'Xato: ' + e.message; b.disabled = false; });
  });
  function rState() {
    var rep = $('rm').value === 'replace';
    $('rcw').hidden = !rep;
    $('rb').disabled = !rfile || (rep && !$('rc').checked);
    $('rb').className = rep ? 'danger' : 'pri';
  }
  $('rf').addEventListener('change', function () {
    var f = this.files && this.files[0]; rfile = null; QZ.msg($('mr'), '', ''); rState();
    if (!f) return;
    f.text().then(function (t) {
      try {
        rfile = QZB.parse(t);
        QZ.msg($('mr'), 'ok', rfile.count + ' ta hujjat, ' + rfile.rows + ' ta yozuv' + (rfile.data.exportedAt ? ' (nusxa vaqti: ' + String(rfile.data.exportedAt).slice(0, 16).replace('T', ' ') + ')' : '') + '.');
      } catch (e) { QZ.msg($('mr'), 'bad', e.message); }
      rState();
    });
  });
  $('rm').addEventListener('change', rState);
  $('rc').addEventListener('change', rState);
  $('rb').addEventListener('click', function () {
    if (!rfile) return;
    var mode = $('rm').value, pg = $('rpg');
    $('rb').disabled = true; pg.hidden = false;
    QZB.upload(rfile.data.docs, mode, function (i, n) { pg.max = n; pg.value = i; }).then(function (t) {
      QZ.msg($('mr'), 'ok', 'Tayyor: ' + t.added + ' ta yangi qo\'shildi' + (t.replaced ? ', ' + t.replaced + ' tasi almashtirildi' : '') + (t.skipped ? ', ' + t.skipped + ' tasiga tegilmadi' : '') + '. Asosiy sahifa bir daqiqa ichida yangilanadi.');
      rState(); loadAudit();
    }, function (e) { QZ.msg($('mr'), 'bad', "To'xtadi: " + e.message); rState(); });
  });

  /* ---------- server jurnali ---------- */
  var ACT = { create: 'Yangi hujjat', merge: "Qo'shildi", update: "O'zgartirildi", replace: 'Almashtirildi', setup: 'Birinchi sozlash',
    'import.add': 'Zaxiradan qo\'shildi', 'import.replace': 'Zaxiradan almashtirildi', 'user.create': "Foydalanuvchi qo'shildi",
    'user.update': 'Foydalanuvchi o\'zgartirildi', 'user.password': 'Parol tiklandi', 'user.mypass': 'O\'z parolini almashtirdi' };
  function loadAudit() {
    return QZ.api('GET', '/api/backup?audit=1').then(function (r) {
      var tb = $('atbl').querySelector('tbody'); tb.innerHTML = '';
      r.audit.forEach(function (a) {
        tb.appendChild(el('tr', null, [el('td', { text: a.at }), el('td', { text: a.name || (a.uid ? 'u' + a.uid : '—') }), el('td', { text: ACT[a.act] || a.act }),
          el('td', { text: (a.coll || '') + (a.doc ? '/' + a.doc : '') }), el('td', { class: 'wrap', text: a.info || '' })]));
      });
    }, function () { });
  }
  $('al').addEventListener('click', loadAudit);

  QZ.api('GET', '/api/auth').then(function (r) {
    ME = r.user; ME.nid = +String(ME.id).slice(1);
    $('who').textContent = ME.name + ' · ' + (ROLE[ME.role] || ME.role) + ' · ' + ME.login;
    if (ME.role === 'admin') { $('admin').hidden = false; load(); loadAudit(); }
    else document.querySelector('h1').textContent = 'Mening hisobim';
  }, function (e) {
    if (e.status === 401) location.replace('/login.html'); else QZ.msg($('mp'), 'bad', e.message);
  });
})();
