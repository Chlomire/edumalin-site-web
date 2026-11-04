/* Interface du mode édition : barre d'outils, contrôles de section, édition des textes et des liens. */
(function () {
  var E = window.EdumalinEdits;
  var page = document.body.getAttribute('data-page');
  var data = E.load();
  var undo = [];
  var flashTimer = null;

  function pd() { return data[page] || (data[page] = { text: {}, href: {}, hidden: [], moves: [] }); }
  function persist() {
    var d = pd();
    if (!Object.keys(d.text).length && !Object.keys(d.href).length && !d.hidden.length && !d.moves.length) delete data[page];
    flash(E.save(data) ? 'Enregistré' : 'Stockage indisponible : exportez vos modifications');
  }
  function flash(msg) {
    var f = document.querySelector('.adm-flash');
    if (!f) return;
    f.textContent = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { f.textContent = ''; }, 2500);
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  /* ---- Barre d'outils ---- */
  var bar = el('div', 'adm-ui adm-bar');
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Mode édition');
  bar.innerHTML =
    '<strong>Mode édition</strong>' +
    '<span class="adm-bar__hint">Cliquez sur un texte pour le modifier. Entrée valide, Maj+Entrée ajoute un retour à la ligne.</span>' +
    '<span class="adm-flash" role="status" aria-live="polite"></span>' +
    '<button type="button" data-a="undo">↶ Annuler</button>' +
    '<button type="button" data-a="export">Exporter</button>' +
    '<button type="button" data-a="reset">Réinitialiser la page</button>' +
    '<a href="admin.html">Tableau de bord</a>' +
    '<button type="button" data-a="quit">Quitter</button>';
  document.body.insertBefore(bar, document.body.firstChild);

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    var a = b.getAttribute('data-a');
    if (a === 'undo') { var u = undo.pop(); if (u) { u(); persist(); } else flash('Rien à annuler'); }
    if (a === 'export') download();
    if (a === 'reset') {
      if (confirm('Annuler toutes les modifications de cette page ?')) { delete data[page]; E.save(data); location.reload(); }
    }
    if (a === 'quit') {
      try { sessionStorage.removeItem(E.FLAG); } catch (x) { /* rien */ }
      location.href = location.pathname;
    }
  });

  function download() {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'edumalin-site-modifications.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    flash('Fichier exporté');
  }

  /* ---- Textes ---- */
  Array.prototype.forEach.call(document.querySelectorAll('main [data-tid]'), function (node) {
    var tid = node.getAttribute('data-tid');
    node.setAttribute('contenteditable', 'true');
    node.setAttribute('spellcheck', 'true');
    node.addEventListener('focus', function () { node.__before = node.innerHTML; });
    node.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        if (ev.shiftKey) document.execCommand('insertLineBreak'); else node.blur();
      }
    });
    node.addEventListener('paste', function (ev) {
      ev.preventDefault();
      var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, t);
    });
    node.addEventListener('blur', function () {
      var html = E.sanitize(node.innerHTML);
      var before = node.__before;
      if (before === undefined || E.norm(html) === E.norm(E.sanitize(before))) return;
      node.innerHTML = html;
      var rec = pd().text[tid];
      var prev = rec ? rec.html : null;
      var orig = rec ? rec.orig : E.sanitize(node.__o);
      if (E.norm(html) === E.norm(orig)) delete pd().text[tid]; else pd().text[tid] = { orig: orig, html: html };
      node.setAttribute('data-edited', E.norm(html) === E.norm(orig) ? '' : '1');
      if (E.norm(html) === E.norm(orig)) node.removeAttribute('data-edited');
      undo.push(function () {
        node.innerHTML = before;
        if (prev === null) delete pd().text[tid]; else pd().text[tid] = { orig: orig, html: prev };
      });
      persist();
    });
  });

  /* Les liens et les titres repliables ne doivent pas se déclencher pendant l'édition */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('main a');
    if (a) e.preventDefault();
    if (e.target.closest('main summary')) e.preventDefault();
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);
  Array.prototype.forEach.call(document.querySelectorAll('main details'), function (d) {
    d.open = true;
    d.addEventListener('toggle', function () { d.open = true; });
  });

  /* ---- Contrôles de section ---- */
  Array.prototype.forEach.call(document.querySelectorAll('main section[data-sid]'), function (sec) {
    var sid = sec.getAttribute('data-sid');
    var ctl = el('div', 'adm-ui adm-ctl');
    ctl.innerHTML =
      '<span class="adm-ctl__name"></span>' +
      '<button type="button" data-a="up" aria-label="Monter la section">↑</button>' +
      '<button type="button" data-a="down" aria-label="Descendre la section">↓</button>' +
      '<button type="button" data-a="hide" aria-pressed="false">Masquer</button>';
    ctl.querySelector('.adm-ctl__name').textContent = 'Section · ' + E.label(sec);
    sec.insertBefore(ctl, sec.firstChild);
    var hideBtn = ctl.querySelector('[data-a="hide"]');
    function syncHide() {
      var h = sec.hasAttribute('data-hidden');
      hideBtn.textContent = h ? 'Afficher' : 'Masquer';
      hideBtn.setAttribute('aria-pressed', String(h));
    }
    syncHide();
    ctl.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'up' || a === 'down') {
        var dir = a === 'up' ? -1 : 1;
        if (!E.moveSection(sec, dir)) { flash('Déjà à la limite'); return; }
        pd().moves.push(sid + ':' + dir);
        undo.push(function () { E.moveSection(sec, -dir); pd().moves.pop(); });
        sec.scrollIntoView({ block: 'center' });
        persist();
      }
      if (a === 'hide') {
        var toggle = function () {
          var d = pd(), i = d.hidden.indexOf(sid);
          if (i >= 0) { d.hidden.splice(i, 1); sec.removeAttribute('data-hidden'); }
          else { d.hidden.push(sid); sec.setAttribute('data-hidden', '1'); }
          syncHide();
        };
        toggle();
        undo.push(toggle);
        persist();
      }
    });
  });

  /* ---- Lien du bouton ou de la carte sélectionnée ---- */
  var panel = el('div', 'adm-ui adm-link');
  panel.hidden = true;
  panel.innerHTML = '<label for="adm-href">Destination du lien</label><input id="adm-href" type="text" spellcheck="false"><button type="button">Appliquer</button>';
  document.body.appendChild(panel);
  var input = panel.querySelector('input');
  var current = null;
  document.addEventListener('focusin', function (e) {
    if (e.target.closest('.adm-link')) return;
    var a = e.target.closest ? e.target.closest('main a[data-aid]') : null;
    if (a) { current = a; input.value = a.getAttribute('href'); panel.hidden = false; }
    else if (!e.target.closest('.adm-ui')) { panel.hidden = true; current = null; }
  });
  function applyHref() {
    if (!current) return;
    var v = input.value.trim();
    if (!v || /^(javascript|data):/i.test(v)) { flash('Lien non valide'); return; }
    var aid = current.getAttribute('data-aid');
    var prev = current.getAttribute('href');
    if (v === prev) return;
    var rec = pd().href[aid];
    var orig = rec ? rec.orig : current.__h;
    var target = current;
    target.setAttribute('href', v);
    if (v === orig) delete pd().href[aid]; else pd().href[aid] = { orig: orig, href: v };
    undo.push(function () {
      target.setAttribute('href', prev);
      if (prev === orig) delete pd().href[aid]; else pd().href[aid] = { orig: orig, href: prev };
    });
    persist();
  }
  panel.querySelector('button').addEventListener('click', applyHref);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyHref(); } });
})();
