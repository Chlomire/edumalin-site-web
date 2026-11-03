/* Édition du contenu du site vitrine, stockée dans le navigateur (localStorage).
   Partagé par toutes les pages (application des modifications) et par admin.html.
   Chaque section reçoit un identifiant (data-sid), chaque texte (data-tid) et chaque lien (data-aid)
   d'après l'ordre d'origine du HTML. Une modification n'est appliquée que si le texte d'origine n'a pas changé. */
(function (root) {
  var KEY = 'edumalin_site_edits_v1';
  var FLAG = 'edumalin_site_admin';
  var EXCLUDE = '.lab, .mock, .stage-mock, .feature__mock, .showcase__stage, .marquee-wrap, .mad, .trial__card, .road__svg, .layers__viz, .kin, .orbit__ring, .site-header, .site-footer, .adm-ui';
  var SEL = 'h1, h2, h3, p, li, .road__verb, summary, label, .btn, .cta-link__t, .eyebrow, .tag, .ptag, .card__more, .sticker, .bubble strong, .bubble > span, .float-card span';
  var TAGS = { BR: 1, SPAN: 1, STRONG: 1, EM: 1, B: 1, I: 1 };

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } }
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function clean(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) return;
      if (c.nodeType !== 1) { node.removeChild(c); return; }
      if (!TAGS[c.tagName]) {
        clean(c);
        while (c.firstChild) node.insertBefore(c.firstChild, c);
        node.removeChild(c);
        return;
      }
      Array.prototype.slice.call(c.attributes).forEach(function (a) {
        var keep = a.name === 'class' && c.tagName === 'SPAN' && /^(mark( mark--[a-z]+)?|circled)$/.test(a.value);
        if (!keep) c.removeAttribute(a.name);
      });
      clean(c);
    });
  }
  function sanitize(html) {
    var doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
    clean(doc.body);
    return doc.body.innerHTML.replace(/&nbsp;/g, ' ');
  }

  function editable(el) {
    if (el.tagName === 'BUTTON' || el.closest(EXCLUDE) || el.querySelector(SEL)) return false;
    return norm(el.textContent) !== '';
  }

  function index(doc) {
    Array.prototype.slice.call(doc.querySelectorAll('main section')).forEach(function (s, i) {
      s.setAttribute('data-sid', 's' + i);
      var n = 0, a = 0;
      Array.prototype.slice.call(s.querySelectorAll(SEL)).forEach(function (e) {
        if (!editable(e)) return;
        e.setAttribute('data-tid', 's' + i + 't' + (n++));
        e.__o = e.innerHTML;
      });
      Array.prototype.slice.call(s.querySelectorAll('a[href]')).forEach(function (e) {
        if (e.closest(EXCLUDE)) return;
        e.setAttribute('data-aid', 's' + i + 'a' + (a++));
        e.__h = e.getAttribute('href');
      });
    });
  }

  function moveSection(sec, dir) {
    var sib = dir < 0 ? sec.previousElementSibling : sec.nextElementSibling;
    while (sib && sib.tagName !== 'SECTION') sib = dir < 0 ? sib.previousElementSibling : sib.nextElementSibling;
    if (!sib) return false;
    if (dir < 0) sec.parentNode.insertBefore(sec, sib); else sec.parentNode.insertBefore(sib, sec);
    return true;
  }

  function apply(doc, pd) {
    var conflicts = 0;
    if (!pd) return conflicts;
    Object.keys(pd.text || {}).forEach(function (k) {
      var el = doc.querySelector('[data-tid="' + k + '"]'), r = pd.text[k];
      if (!el) { conflicts++; return; }
      if (r.orig !== undefined && norm(r.orig) !== norm(el.__o)) { el.setAttribute('data-conflict', '1'); conflicts++; return; }
      el.innerHTML = sanitize(r.html);
      el.setAttribute('data-edited', '1');
    });
    Object.keys(pd.href || {}).forEach(function (k) {
      var el = doc.querySelector('[data-aid="' + k + '"]'), r = pd.href[k];
      if (!el) { conflicts++; return; }
      if (r.orig !== undefined && r.orig !== el.__h) { conflicts++; return; }
      if (/^(javascript|data):/i.test(r.href.trim())) return;
      el.setAttribute('href', r.href);
      el.setAttribute('data-edited', '1');
    });
    (pd.moves || []).forEach(function (m) {
      var p = m.split(':'), sec = doc.querySelector('[data-sid="' + p[0] + '"]');
      if (sec) moveSection(sec, parseInt(p[1], 10));
    });
    (pd.hidden || []).forEach(function (sid) {
      var sec = doc.querySelector('[data-sid="' + sid + '"]');
      if (sec) sec.setAttribute('data-hidden', '1');
    });
    return conflicts;
  }

  function label(sec) {
    var e = sec.querySelector('.eyebrow'), h = sec.querySelector('h1, h2, h3');
    var t = norm((e && e.textContent) || (h && h.textContent) || sec.className.replace(/\bs\b|\s+/g, ' '));
    return t.length > 48 ? t.slice(0, 47) + '…' : t || 'Section';
  }

  root.EdumalinEdits = { KEY: KEY, FLAG: FLAG, SEL: SEL, EXCLUDE: EXCLUDE, load: load, save: save, index: index, apply: apply, sanitize: sanitize, moveSection: moveSection, label: label, norm: norm };

  var page = document.body && document.body.getAttribute('data-page');
  if (!page || page === 'admin' || document.body.hasAttribute('data-v2')) return;
  try {
    if (/[?&]admin=1/.test(location.search)) sessionStorage.setItem(FLAG, '1');
    if (/[?&]admin=0/.test(location.search)) sessionStorage.removeItem(FLAG);
  } catch (e) { /* stockage indisponible */ }
  index(document);
  apply(document, load()[page]);
  var on = false;
  try { on = sessionStorage.getItem(FLAG) === '1'; } catch (e) { on = false; }
  if (on) {
    root.__adminEdit = true;
    document.body.classList.add('is-admin');
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'site-admin.css?v=3';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'site-admin.js?v=1';
    document.body.appendChild(js);
  }
})(window);
