/* Yordamchi sahifalar uchun umumiy funksiyalar */
window.QZ = (function () {
  'use strict';
  function api(method, url, body) {
    var h = { 'X-QZ': '1' }, opt = { method: method, credentials: 'same-origin', cache: 'no-store', headers: h };
    if (body !== undefined) { h['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(url, opt).then(function (r) {
      return r.text().then(function (t) {
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) { j = null; }
        if (r.ok) return j;
        var er = (j && j.error) || {};
        throw { status: r.status, code: er.code || 'error', message: er.message || ('Server xatosi (' + r.status + ')') };
      });
    }, function () { throw { status: 0, code: 'network', message: "Serverga ulanib bo'lmadi. Internetni tekshiring." }; });
  }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c == null) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function msg(box, kind, text) {
    if (!box) return;
    box.hidden = !text;
    box.className = 'msg ' + (kind || '');
    box.textContent = text || '';
  }
  function field(label, input) { return el('div', { class: 'fld' }, [el('label', { for: input.id, text: label }), input]); }
  return { api: api, el: el, msg: msg, field: field };
})();
