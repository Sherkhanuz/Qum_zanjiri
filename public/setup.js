(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var el = QZ.el, parsed = null;

  function row(ok, label, hint) {
    return el('div', null, [el('span', { class: 'chip ' + (ok ? 'ok' : 'bad'), text: ok ? 'bor' : "yo'q" }), el('span', { text: label }), hint ? el('span', { class: 'note', text: hint }) : null]);
  }

  function showImport() {
    $('s2').hidden = false;
    $('file').addEventListener('change', function () {
      var f = this.files && this.files[0];
      parsed = null; $('b2').disabled = true; QZ.msg($('m2'), '', '');
      if (!f) return;
      f.text().then(function (t) {
        try {
          parsed = QZB.parse(t);
          var by = Object.keys(parsed.by).map(function (k) { return k + ': ' + parsed.by[k]; }).join(', ');
          QZ.msg($('m2'), 'ok', parsed.count + ' ta hujjat, ' + parsed.rows + ' ta yozuv (' + by + ').');
          $('b2').disabled = false;
        } catch (e) { QZ.msg($('m2'), 'bad', e.message); }
      });
    });
    $('b2').addEventListener('click', function () {
      if (!parsed) return;
      $('b2').disabled = true; $('file').disabled = true;
      var pg = $('pg'); pg.hidden = false;
      QZB.upload(parsed.data.docs, 'add', function (i, n) { pg.max = n; pg.value = i; }).then(function (t) {
        QZ.msg($('m2'), 'ok', "Yuklandi: " + t.added + " ta yangi hujjat" + (t.skipped ? ', ' + t.skipped + " tasi bazada allaqachon bor edi — tegilmadi" : '') + '.');
        $('s3').hidden = false;
      }, function (e) {
        $('b2').disabled = false; $('file').disabled = false;
        QZ.msg($('m2'), 'bad', "Yuklash to'xtadi: " + e.message + ". Qayta bosing — yuklangan qismi takrorlanmaydi.");
      });
    });
  }

  $('b3').addEventListener('click', function () { location.href = '/'; });

  QZ.api('GET', '/api/setup').then(function (s) {
    var c = $('chk'); c.innerHTML = '';
    c.appendChild(row(s.env.db, 'DATABASE_URL — Neon bazasi manzili'));
    c.appendChild(row(s.env.secret, 'SESSION_SECRET — kamida 32 belgili tasodifiy matn'));
    c.appendChild(row(s.env.token, 'SETUP_TOKEN — kamida 16 belgi', s.users ? '(endi shart emas)' : null));
    c.appendChild(row(s.dbOk, 'Bazaga ulanish', s.dbError || null));
    c.appendChild(row(s.schema, 'Jadvallar'));
    c.appendChild(el('div', null, [el('span', { class: 'chip', text: String(s.users) }), el('span', { text: 'foydalanuvchi' })]));
    if (!s.env.db || !s.env.secret) {
      QZ.msg($('m0'), 'warn', "Vercel loyihasi sozlamalarida (Settings → Environment Variables) yetishmagan o'zgaruvchilarni qo'shing va qayta deploy qiling. README faylida qadamlar bor.");
      return;
    }
    if (!s.dbOk) { QZ.msg($('m0'), 'bad', "Bazaga ulanib bo'lmadi. DATABASE_URL to'g'ri ko'chirilganini tekshiring."); return; }
    if (!s.users) {
      if (!s.env.token) { QZ.msg($('m0'), 'warn', "SETUP_TOKEN qo'shing (kamida 16 belgi) va qayta deploy qiling."); return; }
      $('s1').hidden = false; $('tok').focus();
      return;
    }
    QZ.api('GET', '/api/auth').then(function (r) {
      if (r.user.role === 'admin') {
        QZ.msg($('m0'), 'ok', "Tizim sozlangan. Kerak bo'lsa, quyida ma'lumot faylini yuklashingiz mumkin.");
        showImport();
      } else QZ.msg($('m0'), 'ok', 'Tizim sozlangan.');
    }, function () {
      $('m0').hidden = false; $('m0').className = 'msg ok'; $('m0').textContent = 'Tizim sozlangan. ';
      $('m0').appendChild(el('a', { href: '/login.html', text: 'Kirish →' }));
    });
  }, function (e) { QZ.msg($('m0'), 'bad', e.message); });

  $('f1').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var m = $('m1');
    if ($('p1').value !== $('p2').value) { QZ.msg(m, 'bad', 'Parollar bir xil emas'); return; }
    $('b1').disabled = true; QZ.msg(m, '', '');
    QZ.api('POST', '/api/setup', { token: $('tok').value, login: $('lg').value, name: $('nm').value, password: $('p1').value }).then(function (r) {
      if (!r.created) { QZ.msg(m, 'warn', "Administrator allaqachon bor — jadvallar yangilandi. Kirish sahifasidan kiring."); return; }
      $('f1').hidden = true;
      if (r.seeded) {
        QZ.msg(m, 'ok', "Jadvallar yaratildi, administrator qo'shildi, hozirgi ma'lumot yuklandi (" + r.seeded + " ta hujjat). Siz tizimga kirdingiz.");
        $('s3').hidden = false;
      } else {
        QZ.msg(m, 'ok', 'Jadvallar yaratildi, administrator qo\'shildi va siz tizimga kirdingiz.');
        showImport();
      }
    }, function (e) { $('b1').disabled = false; QZ.msg(m, 'bad', e.message); });
  });
})();
