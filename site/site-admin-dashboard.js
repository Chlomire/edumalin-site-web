/* Tableau de bord d'administration : pages, sauvegarde, export du contenu pour Figma. */
(function () {
  var E = window.EdumalinEdits;
  var PAGES = [
    ['index', 'Accueil'], ['plateforme', 'La plateforme'], ['solutions', 'Solutions'],
    ['solutions-etablissements', 'Établissements et réseaux scolaires'], ['solutions-enseignants', 'Enseignants et formateurs'],
    ['solutions-organismes', 'Organismes de formation'], ['solutions-institutions', 'Institutions et territoires'],
    ['impact', 'Impact'], ['webinaires', 'Webinaires'], ['webinaire-inscription', 'Inscription à un webinaire'],
    ['faq', 'FAQ'], ['a-propos', 'À propos'], ['blog', 'Blog'], ['contact', 'Contact'], ['liste-attente', 'Liste d’attente']
  ];
  var msg = document.getElementById('msg');
  var out = document.getElementById('out');
  function say(t) { msg.textContent = t; }

  function counts(d) {
    d = d || {};
    return { t: Object.keys(d.text || {}).length, l: Object.keys(d.href || {}).length, h: (d.hidden || []).length, m: (d.moves || []).length };
  }
  function render() {
    var data = E.load();
    var grid = document.getElementById('pages');
    grid.innerHTML = '';
    PAGES.forEach(function (p) {
      var c = counts(data[p[0]]);
      var total = c.t + c.l + c.h + c.m;
      var card = document.createElement('article');
      card.className = 'adm-card' + (total ? ' is-edited' : '');
      var h = document.createElement('h3');
      h.textContent = p[1];
      var info = document.createElement('p');
      info.textContent = total
        ? c.t + ' texte(s) · ' + c.l + ' lien(s) · ' + c.h + ' section(s) masquée(s) · ' + c.m + ' déplacement(s)'
        : 'Aucune modification';
      var actions = document.createElement('div');
      actions.className = 'adm-actions';
      var edit = document.createElement('a');
      edit.className = 'btn btn--primary btn--sm';
      edit.href = p[0] + '.html?admin=1';
      edit.textContent = 'Éditer';
      var view = document.createElement('a');
      view.className = 'btn btn--ghost btn--sm';
      view.href = p[0] + '.html?admin=0';
      view.textContent = 'Voir';
      actions.appendChild(edit);
      actions.appendChild(view);
      if (total) {
        var rs = document.createElement('button');
        rs.type = 'button';
        rs.className = 'btn btn--ghost btn--sm';
        rs.textContent = 'Réinitialiser';
        rs.addEventListener('click', function () {
          if (!confirm('Annuler les modifications de « ' + p[1] + ' » ?')) return;
          var d = E.load(); delete d[p[0]]; E.save(d); render(); say('Page réinitialisée.');
        });
        actions.appendChild(rs);
      }
      card.appendChild(h); card.appendChild(info); card.appendChild(actions);
      grid.appendChild(card);
    });
  }

  function saveFile(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type }));
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  document.getElementById('export').addEventListener('click', function () {
    saveFile('edumalin-site-modifications.json', JSON.stringify(E.load(), null, 2), 'application/json');
    say('Fichier exporté.');
  });
  document.getElementById('import').addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('forme');
        var known = PAGES.map(function (p) { return p[0]; });
        var clean = {};
        Object.keys(d).forEach(function (k) {
          if (known.indexOf(k) < 0 || !d[k] || typeof d[k] !== 'object') return;
          var v = d[k];
          clean[k] = { text: v.text && typeof v.text === 'object' ? v.text : {}, href: v.href && typeof v.href === 'object' ? v.href : {}, hidden: Array.isArray(v.hidden) ? v.hidden : [], moves: Array.isArray(v.moves) ? v.moves : [] };
        });
        if (!confirm('Remplacer les modifications actuelles par celles du fichier (' + Object.keys(clean).length + ' page(s)) ?')) return;
        E.save(clean); render(); say('Fichier importé.');
      } catch (x) { say('Fichier non valide.'); }
    };
    r.readAsText(f);
    e.target.value = '';
  });
  document.getElementById('reset-all').addEventListener('click', function () {
    if (!confirm('Supprimer toutes les modifications de toutes les pages ?')) return;
    E.save({}); render(); say('Tout est réinitialisé.');
  });

  /* ---- Contenu pour Figma ---- */
  function kind(el) {
    var t = el.tagName;
    if (t === 'H1') return 'Titre de page';
    if (t === 'H2') return 'Titre de section';
    if (t === 'H3') return 'Sous-titre';
    if (el.classList.contains('eyebrow')) return 'Étiquette';
    if (el.classList.contains('btn') || el.classList.contains('cta-link__t')) return 'Bouton';
    if (el.classList.contains('card__more')) return 'Lien';
    if (el.classList.contains('ptag')) return 'Mot-clé';
    if (el.classList.contains('tag') || el.classList.contains('sticker')) return 'Pastille';
    if (t === 'LI') return 'Élément de liste';
    if (t === 'SUMMARY') return 'Question';
    if (t === 'LABEL') return 'Champ';
    return 'Texte';
  }
  function pageMarkdown(doc, id, title, d) {
    E.index(doc);
    E.apply(doc, d);
    var md = '# ' + title + ' (' + id + '.html)\n\n';
    var n = 0;
    Array.prototype.forEach.call(doc.querySelectorAll('main section'), function (sec) {
      if (sec.hasAttribute('data-hidden')) return;
      n++;
      md += '## Section ' + n + ' · ' + E.label(sec) + '\n\n';
      Array.prototype.forEach.call(sec.querySelectorAll('[data-tid]'), function (el) {
        var tmp = document.createElement('div'); tmp.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, ' '); var text = E.norm(tmp.textContent);
        if (!text) return;
        var a = el.closest('a[data-aid]');
        var line = '- **' + kind(el) + ' :** ' + text;
        if (a && (el.classList.contains('btn') || el.classList.contains('cta-link__t') || el.classList.contains('card__more'))) line += ' → `' + a.getAttribute('href') + '`';
        md += line + '\n';
      });
      md += '\n';
    });
    return md;
  }
  document.getElementById('gen').addEventListener('click', function () {
    var data = E.load();
    say('Lecture des pages…');
    Promise.all(PAGES.map(function (p) {
      return fetch(p[0] + '.html').then(function (r) { return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        return pageMarkdown(doc, p[0], p[1], data[p[0]]);
      });
    })).then(function (parts) {
      out.value = '# Site vitrine Édumalin : contenu\n\n' + parts.join('\n---\n\n');
      say('Contenu généré (' + PAGES.length + ' pages).');
    }).catch(function () { say('Impossible de lire les pages : ouvrez ce tableau de bord depuis le serveur de démo.'); });
  });
  document.getElementById('copy').addEventListener('click', function () {
    if (!out.value) { say('Générez d’abord le contenu.'); return; }
    out.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    say(ok ? 'Contenu copié.' : 'Copie impossible : sélectionnez le texte et copiez-le.');
  });
  document.getElementById('dl').addEventListener('click', function () {
    if (!out.value) { say('Générez d’abord le contenu.'); return; }
    saveFile('edumalin-site-contenu.md', out.value, 'text/markdown');
    say('Fichier téléchargé.');
  });

  render();
})();
