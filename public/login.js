(function () {
  'use strict';
  var f = document.getElementById('f'), m = document.getElementById('m'), go = document.getElementById('go');
  var qs = new URLSearchParams(location.search);
  var back = function () {
    if (qs.get('w') === '1') { QZ.msg(m, 'ok', "Kirdingiz. Oldingi oynaga qaytib, yozuvni yana saqlang. Bu oynani yopishingiz mumkin."); return; }
    var h = qs.get('h');
    location.replace('/' + (h && /^[a-z]{2,8}$/.test(h) ? '#' + h : ''));
  };
  // Allaqachon kirgan bo'lsa — to'g'ri sahifaga
  QZ.api('GET', '/api/auth').then(function () { if (qs.get('w') !== '1') back(); }, function () {});
  QZ.api('GET', '/api/setup').then(function (s) { if (s && (!s.schema || !s.users)) location.replace('/setup.html'); }, function () {});
  document.getElementById('login').focus();
  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var login = document.getElementById('login').value.trim(), pw = document.getElementById('pw').value;
    if (!login || !pw) { QZ.msg(m, 'bad', 'Login va parolni kiriting'); return; }
    go.disabled = true; QZ.msg(m, '', '');
    QZ.api('POST', '/api/auth', { op: 'login', login: login, password: pw }).then(function () {
      back();
    }, function (e) {
      go.disabled = false;
      QZ.msg(m, 'bad', e.message);
      if (e.code === 'bad_credentials') { var p = document.getElementById('pw'); p.value = ''; p.focus(); }
    });
  });
})();
