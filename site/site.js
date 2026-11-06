/* Site vitrine Édumalin : en-tête, pied de page, menus, apparitions, formulaires de démonstration */
(function () {
  var NAV = [
    { id: 'accueil', label: 'Accueil', href: 'index.html' },
    { id: 'plateforme', label: 'La plateforme', href: 'plateforme.html' },
    { id: 'solutions', label: 'Solutions', href: 'solutions.html', children: [
      { id: 'solutions', label: 'Toutes les solutions', href: 'solutions.html' },
      { id: 'solutions-etablissements', label: 'Établissements et réseaux scolaires', href: 'solutions-etablissements.html' },
      { id: 'solutions-enseignants', label: 'Enseignants et formateurs', href: 'solutions-enseignants.html' },
      { id: 'solutions-organismes', label: 'Organismes de formation', href: 'solutions-organismes.html' },
      { id: 'solutions-institutions', label: 'Institutions et territoires', href: 'solutions-institutions.html' }
    ] },
    { id: 'p2ia', label: 'P2IA', href: 'p2ia.html' },
    { id: 'ressources', label: 'Ressources', href: 'webinaires.html', children: [
      { id: 'webinaires', label: 'Webinaires', href: 'webinaires.html' },
      { id: 'faq', label: 'FAQ', href: 'faq.html' }
    ] },
    { id: 'a-propos', label: 'À propos', href: 'a-propos.html' },
    { id: 'blog', label: 'Blog', href: 'blog.html' }
  ];

  var page = document.body.getAttribute('data-page') || '';

  function isCurrent(item) {
    if (item.id === page) return true;
    if (item.children) return item.children.some(function (c) { return c.id === page; }) ||
      (item.id === 'solutions' && page.indexOf('solutions') === 0) ||
      (item.id === 'ressources' && (page === 'webinaire-inscription'));
    return false;
  }

  function langBlock() {
    return '<div class="lang" role="group" aria-label="Langue du site">' +
      '<span aria-current="true" lang="fr">FR</span>' +
      '<span aria-disabled="true" lang="en" title="Version anglaise bientôt disponible">EN</span></div>';
  }

  /* Pied de page : colonnes de liens (le CMS peut les remplacer, voir renderMenus) */
  var FOOTER = [
    { title: 'Découvrir', links: [
      { label: 'La plateforme', href: 'plateforme.html' }, { label: 'Solutions', href: 'solutions.html' },
      { label: 'P2IA', href: 'p2ia.html' }, { label: 'À propos', href: 'a-propos.html' }] },
    { title: 'Ressources', links: [
      { label: 'Webinaires', href: 'webinaires.html' }, { label: 'FAQ', href: 'faq.html' }, { label: 'Blog', href: 'blog.html' }] },
    { title: 'Contact', links: [
      { label: 'Échanger sur votre projet', href: 'contact.html' }] }
  ];

  function esc(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* Lien sûr : relatif, ancre, http(s), mailto ou tel uniquement */
  function safeHref(h) {
    if (typeof h !== 'string') return null;
    var t = h.trim();
    if (!t || /[\u0000-\u001f\u007f]/.test(t) || /^(\/\/|\\)/.test(t)) return null;
    var m = /^([a-z][a-z0-9+.\-]*):/i.exec(t);
    if (m && !/^(https?|mailto|tel)$/i.test(m[1])) return null;
    return t;
  }

  function navHtml(items) {
    return items.map(function (item, i) {
      if (!item.children) {
        return '<div class="nav__item"><a class="nav__link" href="' + esc(item.href) + '"' +
          (isCurrent(item) ? ' aria-current="page"' : '') + '>' + esc(item.label) + '</a></div>';
      }
      var id = 'menu-' + i;
      return '<div class="nav__item">' +
        '<button class="nav__link" type="button" aria-expanded="false" aria-controls="' + id + '"' +
        (isCurrent(item) ? ' aria-current="true"' : '') + '>' + esc(item.label) + ' <span aria-hidden="true">▾</span></button>' +
        '<div class="nav__menu" id="' + id + '">' + item.children.map(function (c) {
          return '<a href="' + esc(c.href) + '"' + (c.id === page ? ' aria-current="page"' : '') + '>' + esc(c.label) + '</a>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function footerCols(cols) {
    return cols.map(function (col) {
      return '<div><h2>' + esc(col.title) + '</h2><ul>' + col.links.map(function (l) {
        return '<li><a href="' + esc(l.href) + '">' + esc(l.label) + '</a></li>';
      }).join('') + '</ul></div>';
    }).join('');
  }

  /* Menus actuels, au format du CMS (reports/backoffice-site/plan.md) */
  function defaultMenus() {
    return {
      header: NAV.map(function (it) {
        var o = { label: it.label, href: it.href };
        if (it.children) o.children = it.children.map(function (c) { return { label: c.label, href: c.href }; });
        return o;
      }),
      footer: FOOTER.map(function (col) {
        return { title: col.title, links: col.links.map(function (l) { return { label: l.label, href: l.href }; }) };
      })
    };
  }

  /* Identifiant de page déduit d'un lien publié (pour aria-current) */
  function idFor(href, withChildren) {
    if (withChildren) {
      for (var k = 0; k < NAV.length; k++) if (NAV[k].children && NAV[k].href === href) return NAV[k].id;
    }
    var b = (href.split(/[?#]/)[0].split('/').pop() || '').replace(/\.html$/, '');
    return b === 'index' ? 'accueil' : b;
  }
  function cleanLinks(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (l) {
      var h = l && safeHref(l.href);
      if (h && typeof l.label === 'string' && l.label.trim()) out.push({ label: l.label, href: h, id: idFor(h, false) });
    });
    return out;
  }

  /* Reconstruit le menu principal et les colonnes du pied de page depuis les menus publiés.
     Une liste absente, vide ou invalide laisse le rendu d'origine. */
  function renderMenus(menus) {
    if (!menus || typeof menus !== 'object') return false;
    var done = false;
    var header = [];
    (Array.isArray(menus.header) ? menus.header : []).forEach(function (it) {
      if (!it || typeof it.label !== 'string' || !it.label.trim()) return;
      var kids = cleanLinks(it.children);
      var h = safeHref(it.href) || (kids[0] && kids[0].href);
      if (!h) return;
      var o = { label: it.label, href: h, id: idFor(h, kids.length > 0) };
      if (kids.length) o.children = kids;
      header.push(o);
    });
    var nav = document.getElementById('nav-principal');
    if (header.length && nav) {
      nav.innerHTML = navHtml(header) + '<div class="nav__lang">' + langBlock() + '</div>';
      bindNav();
      done = true;
    }
    var cols = [];
    (Array.isArray(menus.footer) ? menus.footer : []).forEach(function (c) {
      if (!c || typeof c.title !== 'string') return;
      var links = cleanLinks(c.links);
      if (c.title.trim() || links.length) cols.push({ title: c.title, links: links });
    });
    var grid = document.querySelector('.site-footer__grid');
    if (cols.length && grid && grid.firstElementChild) {
      while (grid.firstElementChild.nextElementSibling) grid.removeChild(grid.firstElementChild.nextElementSibling);
      grid.insertAdjacentHTML('beforeend', footerCols(cols));
      done = true;
    }
    return done;
  }

  function build() {
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#contenu';
    skip.textContent = 'Aller au contenu';
    document.body.insertBefore(skip, document.body.firstChild);

    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="container site-header__bar">' +
      '<a class="brand" href="index.html" aria-label="Édumalin, accueil"><img class="brand__c" src="assets/logo-edumalin.webp" alt="Édumalin"><img class="brand__w" src="assets/logo-edumalin-blanc.webp" alt="Édumalin"></a>' +
      '<button class="burger" type="button" aria-expanded="false" aria-controls="nav-principal" aria-label="Ouvrir le menu"><span class="burger__bars" aria-hidden="true"></span></button>' +
      '<nav class="nav" id="nav-principal" aria-label="Navigation principale">' + navHtml(NAV) +
      '<div class="nav__lang">' + langBlock() + '</div></nav>' +
      '<div class="site-header__cta">' + langBlock() +
      '</div></div>';
    document.body.insertBefore(header, skip.nextSibling);

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="container"><div class="site-footer__grid">' +
      '<div><a class="brand" href="index.html" aria-label="Édumalin, accueil"><img class="brand__c" src="assets/logo-edumalin.webp" alt="Édumalin"><img class="brand__w" src="assets/logo-edumalin-blanc.webp" alt="Édumalin"></a>' +
      '<p>Chaque apprenant peut progresser, à condition de lui apporter la bonne aide au bon moment.</p></div>' +
      footerCols(FOOTER) +
      '</div><p class="site-footer__legal">© Édumalin. Programme P2IA, partenariat DNE.</p></div>';
    document.body.appendChild(footer);
  }

  function closeAll(except) {
    document.querySelectorAll('.nav__link[aria-expanded="true"]').forEach(function (b) {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls')).classList.remove('is-open');
    });
  }

  /* Boutons des sous-menus : rattachés à chaque (re)construction du menu */
  function bindNav() {
    document.querySelectorAll('#nav-principal button.nav__link').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') === 'true';
        closeAll(b);
        b.setAttribute('aria-expanded', String(!open));
        document.getElementById(b.getAttribute('aria-controls')).classList.toggle('is-open', !open);
      });
    });
  }

  function menus() {
    var burger = document.querySelector('.burger');
    var nav = document.getElementById('nav-principal');
    bindNav();
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Ouvrir le menu' : 'Fermer le menu');
      nav.classList.toggle('is-open', !open);
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav__item')) closeAll();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAll();
      if (burger.getAttribute('aria-expanded') === 'true') burger.click();
    });
  }

  function reveal() {
    var els = document.querySelectorAll('.reveal');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* Formulaires de démonstration : aucune donnée n'est envoyée.
     En production : Mailjet (liste d'attente) et HubSpot (contact, webinaires). */
  function forms() {
    document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
      var ok = form.querySelector('.form__ok');
      form.setAttribute('novalidate', '');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstBad = null;
        form.querySelectorAll('[required]').forEach(function (f) {
          var field = f.closest('.field');
          var old = field.querySelector('.form__err');
          if (old) old.remove();
          f.removeAttribute('aria-invalid');
          var bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
          if (bad) {
            var p = document.createElement('p');
            p.className = 'form__err';
            p.id = f.id + '-err';
            p.textContent = f.type === 'email' ? 'Indiquez une adresse e-mail valide.' : 'Ce champ est nécessaire.';
            field.appendChild(p);
            f.setAttribute('aria-invalid', 'true');
            f.setAttribute('aria-describedby', p.id);
            if (!firstBad) firstBad = f;
          }
        });
        if (firstBad) { firstBad.focus(); return; }
        ok.classList.add('is-visible');
        ok.focus();
        form.reset();
      });
    });
  }


  /* Démo du graphe : cherche la cause d'une difficulté, étape par étape */
  function labs() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var script = [
      { cls: 'is-blocked', txt: 'Difficulté visible' },
      { cls: 'is-mid', txt: 'En cours d’acquisition' },
      { cls: 'is-ok', txt: 'Maîtrisé' },
      { cls: 'is-gap', txt: 'Cause probable : à consolider' }
    ];
    document.querySelectorAll('[data-lab]').forEach(function (lab) {
      var nodes = lab.querySelectorAll('.node');
      var result = lab.querySelector('.lab__result');
      var live = lab.querySelector('[data-lab-live]');
      var timers = [];
      function setNode(n, step) {
        n.classList.remove('is-unknown', 'is-scanning', 'is-blocked', 'is-mid', 'is-ok', 'is-gap');
        n.classList.add(step.cls);
        n.querySelector('.node__state').textContent = step.txt;
      }
      function reset() {
        timers.forEach(clearTimeout); timers = [];
        nodes.forEach(function (n, i) {
          n.classList.remove('is-scanning', 'is-mid', 'is-ok', 'is-gap', 'is-blocked');
          n.classList.add(i === 0 ? 'is-blocked' : 'is-unknown');
          n.querySelector('.node__state').textContent = i === 0 ? 'Difficulté visible' : 'À vérifier';
        });
        result.hidden = true;
      }
      function finish() {
        result.hidden = false;
        live.textContent = 'La cause probable est le calcul avec les fractions. Un parcours de consolidation est proposé.';
      }
      function run() {
        reset();
        live.textContent = 'Analyse des prérequis en cours.';
        if (reduce) { nodes.forEach(function (n, i) { if (i) setNode(n, script[i]); }); finish(); return; }
        for (var i = 1; i < nodes.length; i++) {
          (function (i) {
            timers.push(setTimeout(function () { nodes[i].classList.remove('is-unknown'); nodes[i].classList.add('is-scanning'); nodes[i].querySelector('.node__state').textContent = 'Vérification…'; }, (i - 1) * 1100));
            timers.push(setTimeout(function () { setNode(nodes[i], script[i]); if (i === nodes.length - 1) finish(); }, (i - 1) * 1100 + 800));
          })(i);
        }
      }
      /* L'analyse se lance seule, une fois, dès que la section est visible */
      if ('IntersectionObserver' in window) {
        var started = false;
        new IntersectionObserver(function (en, obs) {
          en.forEach(function (x) { if (x.isIntersecting && !started) { started = true; obs.disconnect(); run(); } });
        }, { threshold: 0.6 }).observe(lab);
      } else { run(); }
    });
  }

  /* Carrousel des principes : boutons précédent / suivant (le défilement tactile, la molette et le clavier fonctionnent aussi) */
  function pcar() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-pcar]').forEach(function (root) {
      var track = root.querySelector('.pcar__track'), btns = root.querySelectorAll('.pcar__btn');
      function step() { var c = track.querySelector('.pcar__card'); return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24) : 320; }
      function sync() {
        btns[0].disabled = track.scrollLeft <= 2;
        btns[1].disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      }
      btns.forEach(function (b) { b.addEventListener('click', function () { track.scrollBy({ left: step() * Number(b.getAttribute('data-dir')), behavior: reduce ? 'auto' : 'smooth' }); }); });
      track.addEventListener('scroll', function () { window.requestAnimationFrame(sync); }, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  /* Onglets (contextes) */
  function tabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (root) {
      var list = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
      function select(t, focus) {
        list.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', String(on));
          x.tabIndex = on ? 0 : -1;
          document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
        });
        if (focus) t.focus();
      }
      list.forEach(function (t, i) {
        t.addEventListener('click', function () { select(t); });
        t.addEventListener('keydown', function (e) {
          var j = null;
          if (e.key === 'ArrowRight') j = (i + 1) % list.length;
          if (e.key === 'ArrowLeft') j = (i - 1 + list.length) % list.length;
          if (e.key === 'Home') j = 0;
          if (e.key === 'End') j = list.length - 1;
          if (j !== null) { e.preventDefault(); select(list[j], true); }
        });
      });
    });
  }

  /* Parallaxe douce des formes */
  function parallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var shapes = document.querySelectorAll('[data-speed], .shape');
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      shapes.forEach(function (el) {
        var sp = parseFloat(el.getAttribute('data-speed') || '0.15');
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * -sp).toFixed(1) + 'px');
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* Parcours : la ligne se dessine et les étapes s'allument au fil du défilement */
  function paths() {
    var els = document.querySelectorAll('.path');
    if (!els.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    els.forEach(function (el) { el.classList.add('is-live'); });
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (r.height + vh * 0.1)));
        el.style.setProperty('--p', p.toFixed(3));
        var items = el.querySelectorAll('li');
        items.forEach(function (li, i) { li.classList.toggle('is-lit', p >= i / items.length + 0.04); });
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Titre du hero : les mots montent un à un */
  function heroWords() {
    document.querySelectorAll('[data-words]').forEach(function (h) {
      var i = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span');
              w.className = 'word'; w.style.setProperty('--wi', i++); w.textContent = part;
              frag.appendChild(w);
            });
            node.replaceChild(frag, c);
          } else if (c.nodeType === 1) { walk(c); }
        });
      })(h);
    });
  }

  /* Phrase qui s'allume mot à mot pendant le défilement */
  function scrollWords() {
    var els = document.querySelectorAll('[data-scrollwords]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    els.forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    });
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var spans = el.querySelectorAll('.w');
        var r = el.getBoundingClientRect();
        var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.25)));
        var n = Math.round(p * spans.length);
        spans.forEach(function (s, i) { s.classList.toggle('is-lit', i < n); });
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* Vitrine : la fonctionnalité au centre de l'écran allume sa maquette */
  function showcase() {
    document.querySelectorAll('[data-showcase]').forEach(function (root) {
      var items = root.querySelectorAll('.feature');
      var mocks = root.querySelectorAll('.stage-mock');
      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var i = en.target.getAttribute('data-i');
          items.forEach(function (it) { it.classList.toggle('is-active', it === en.target); });
          mocks.forEach(function (m) { m.classList.toggle('is-active', m.getAttribute('data-for') === i); });
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      items.forEach(function (it) { io.observe(it); });
    });
  }

  /* Chiffres qui comptent jusqu'à leur valeur */
  function counters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; io.unobserve(el);
        var to = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / 1100);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { el.textContent = '0'; io.observe(el); });
  }

  /* Route : l'avatar avance sur le chemin, les étapes s'allument */
  function roads() {
    document.querySelectorAll('[data-road]').forEach(function (road) {
      var track = road.querySelector('.road__track'), done = road.querySelector('.road__done'), av = road.querySelector('.road__av');
      var stops = road.querySelectorAll('.road__stop');
      var L = track.getTotalLength();
      var live = !window.__adminEdit && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      done.style.strokeDasharray = L;
      if (live) road.classList.add('is-live');
      var ticking = false;
      function update() {
        var vh = window.innerHeight, r = road.getBoundingClientRect();
        var p = live ? Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (r.height + vh * 0.2))) : 1;
        done.style.strokeDashoffset = L * (1 - p);
        var pt = track.getPointAtLength(L * p);
        av.setAttribute('transform', 'translate(' + pt.x + ',' + pt.y + ')');
        road.style.setProperty('--p', p.toFixed(3));
        stops.forEach(function (s) { s.classList.toggle('is-lit', p >= parseFloat(s.getAttribute('data-t')) - 0.01); });
        ticking = false;
      }
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      window.addEventListener('resize', update);
      update();
    });
  }

  /* Configurateur de l'essai */
  function trials() {
    document.querySelectorAll('[data-trial]').forEach(function (t) {
      var title = t.querySelector('[data-trial-title]'), live = t.querySelector('[data-trial-live]');
      var chips = t.querySelector('.trial__chips');
      function refresh() {
        var l = t.querySelector('input[name="lvl"]:checked').value, s = t.querySelector('input[name="sub"]:checked').value;
        title.textContent = l + ' · ' + s;
        live.textContent = 'Aperçu : ' + l + ', ' + s + '.';
        var c = chips.cloneNode(true); chips.parentNode.replaceChild(c, chips); chips = c;
      }
      t.addEventListener('change', refresh);
    });
  }

  /* Couches : survol, focus, ou rotation automatique */
  function layers() {
    document.querySelectorAll('[data-layers]').forEach(function (root) {
      var items = root.querySelectorAll('.layers__list li');
      var timer = null, i = 0, hold = false;
      function set(n) {
        if (n === null) { root.removeAttribute('data-active'); items.forEach(function (x) { x.classList.remove('is-on'); }); return; }
        root.setAttribute('data-active', n);
        items.forEach(function (x, k) { x.classList.toggle('is-on', k === n); });
      }
      items.forEach(function (it, k) {
        it.addEventListener('mouseenter', function () { hold = true; set(k); });
        it.addEventListener('focus', function () { hold = true; set(k); });
        it.addEventListener('mouseleave', function () { hold = false; });
        it.addEventListener('blur', function () { hold = false; });
      });
      if (window.__adminEdit || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(function () { if (hold) return; i = (i + 1) % items.length; set(i); }, 2600);
      set(0);
    });
  }

  /* Texte cinétique : les lignes glissent en sens opposés au défilement */
  function kinetic() {
    var rows = document.querySelectorAll('.kin');
    if (!rows.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      rows.forEach(function (k) {
        var r = k.getBoundingClientRect();
        var p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
        k.querySelectorAll('.kin__row').forEach(function (row) { row.style.setProperty('--k', (-p * 2).toFixed(3)); });
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* Bénéfices : chaque carte arrive de son côté (gauche, droite, gauche) à mesure qu'on défile */
  function zigzag() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || window.__adminEdit) return;
    document.querySelectorAll('.deck--zig').forEach(function (deck) {
      var cards = deck.querySelectorAll('.deck__card'), ticking = false;
      function update() {
        ticking = false;
        var vh = window.innerHeight, dist = deck.parentNode.clientWidth * 0.7;
        cards.forEach(function (c, k) {
          var r = c.getBoundingClientRect();
          var p = Math.max(0, Math.min(1, (vh * 0.95 - r.top) / (vh * 0.4)));
          var e = 1 - Math.pow(1 - p, 3), side = k % 2 === 0 ? -1 : 1;
          c.style.translate = (side * dist * (1 - e)) + 'px 0';
          c.style.rotate = (side * 4 * (1 - e)) + 'deg';
          c.style.opacity = String(Math.min(1, p * 2));
        });
      }
      function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
      window.addEventListener('scroll', req, { passive: true });
      window.addEventListener('resize', req);
      update();
    });
  }

  /* Phrase à trous : le mot change au clic (pas de défilement automatique) ; ses options apparaissent dessous */
  function madlibs() {
    document.querySelectorAll('[data-mad]').forEach(function (root) {
      var word = root.querySelector('.mad__w'), label = word.querySelector('span');
      var panels = root.querySelectorAll('.mad__d'), tabs = root.querySelectorAll('.mad__tab'), pause = root.querySelector('.mad__pause'), live = root.querySelector('[data-mad-live]');
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.__adminEdit;
      var cur = 0, timer = null, paused = true, visible = false;
      function show(i, announce) {
        cur = (i + panels.length) % panels.length;
        label.textContent = panels[cur].getAttribute('data-w');
        word.setAttribute('data-c', panels[cur].getAttribute('data-c'));
        word.setAttribute('aria-label', label.textContent + ' : afficher la dimension suivante');
        panels.forEach(function (p, k) {
          p.hidden = k !== cur;
          if (k === cur) { p.querySelectorAll('li, p').forEach(function (n) { n.style.animation = 'none'; void n.offsetWidth; n.style.animation = ''; }); }
        });
        tabs.forEach(function (t, k) { t.setAttribute('aria-pressed', String(k === cur)); });
        if (!reduce) { word.classList.remove('is-in'); void word.offsetWidth; word.classList.add('is-in'); }
        if (announce) live.textContent = 'Dimension affichée : ' + label.textContent;
      }
      function tick() { clearInterval(timer); timer = null; if (!paused && visible) timer = setInterval(function () { show(cur + 1, false); }, 3400); }
      function setPaused(p) { paused = p; if (pause) { pause.setAttribute('aria-pressed', String(p)); pause.textContent = p ? 'Reprendre' : 'Mettre en pause'; } tick(); }
      word.addEventListener('click', function () { show(cur + 1, true); setPaused(true); });
      tabs.forEach(function (t, k) { t.addEventListener('click', function () { show(k, true); setPaused(true); }); });
      if (pause) { pause.addEventListener('click', function () { setPaused(!paused); }); pause.hidden = reduce; }
      show(0, false); setPaused(paused);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; tick(); }, { threshold: 0.3 }).observe(root);
      }
    });
  }

  /* Hero : le ruban à boucles file de gauche à droite derrière le texte et disparaît en défilant */
  function heroLoop() {
    var path = document.querySelector('.hero__loop-p');
    if (!path) return;
    var svg = path.ownerSVGElement;
    if (svg.getAttribute('data-mode') === 'draw') {
      var LL = path.getTotalLength();
      var still2 = window.__adminEdit || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var head = still2 ? 1 : 0, tail = 0, tk = false;
      function paint() {
        var len = Math.max(0, (head - tail) * LL);
        path.style.strokeDasharray = len + ' ' + (LL * 2);
        path.style.strokeDashoffset = String(-tail * LL);
        path.style.opacity = len < 2 ? '0' : '0.9';
      }
      function onScroll2() { tail = Math.min(head, Math.max(0, window.scrollY / (window.innerHeight * 0.55))); paint(); tk = false; }
      if (!still2) {
        window.addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(onScroll2); } }, { passive: true });
        var s0 = null;
        (function grow(t) {
          if (s0 === null) s0 = t;
          var k = Math.min(1, Math.max(0, (t - s0 - 300) / 2200));
          head = 1 - Math.pow(1 - k, 3);
          tail = Math.min(head, Math.max(0, window.scrollY / (window.innerHeight * 0.55)));
          paint();
          if (k < 1) requestAnimationFrame(grow);
        })(performance.now());
      } else { paint(); }
      return;
    }
    var L = path.getTotalLength(), S = L * parseFloat(svg.getAttribute('data-seg') || '0.3');
    var intro = parseFloat(svg.getAttribute('data-intro') || '0.14');
    var still = window.__adminEdit || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var base = still ? Math.max(0.45, intro) : 0, p = 0, ticking = false;
    path.style.strokeDasharray = S + ' ' + (L + S);
    function draw() {
      var head = (base + (1 - base) * p) * (L + S);
      path.style.strokeDashoffset = S - head;
      path.style.opacity = String(0.85 * (1 - Math.max(0, (p - 0.85) / 0.15)));
    }
    function onScroll() {
      p = Math.max(0, Math.min(1, window.scrollY / (window.innerHeight * 0.9)));
      draw(); ticking = false;
    }
    if (!still) {
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
      var t0 = null;
      (function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, Math.max(0, (t - t0 - 400) / 1600));
        base = intro * (1 - Math.pow(1 - k, 3));
        draw();
        if (k < 1) requestAnimationFrame(step);
      })(performance.now());
      onScroll();
    } else { draw(); }
  }

  /* Petites boucles : le ruban file en continu sur son tracé tant que la section est visible */
  function miniLoops() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.__adminEdit;
    document.querySelectorAll('.mini-loop').forEach(function (svg) {
      var path = svg.querySelector('.mini-loop__p'), L = path.getTotalLength(), SEG = 0.45, CYCLE = 1 + SEG, DUR = 5200;
      function paint(t) {
        var head = Math.min(1, t), tail = Math.max(0, t - SEG);
        path.style.strokeDasharray = Math.max(0, (head - tail) * L) + ' ' + (L * 2);
        path.style.strokeDashoffset = String(-tail * L);
      }
      if (reduce || !('IntersectionObserver' in window)) { path.style.strokeDasharray = L + ' ' + (L * 2); return; }
      var raf = null, t0 = null;
      function frame(now) {
        if (t0 === null) t0 = now;
        var u = ((now - t0) % DUR) / DUR;
        var e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        paint(e * CYCLE);
        raf = requestAnimationFrame(frame);
      }
      paint(0);
      new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting && raf === null) { t0 = null; raf = requestAnimationFrame(frame); }
          if (!x.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0.2 }).observe(svg.parentElement);
    });
  }

  build();
  menus();
  /* Point d'accroche du CMS : site-content.js appelle renderMenus avec les menus publiés */
  window.EdumalinSite = { defaultMenus: defaultMenus, renderMenus: renderMenus };
  if (window.EdumalinSiteContent && window.EdumalinSiteContent.__pendingMenus) renderMenus(window.EdumalinSiteContent.__pendingMenus);
  labs();
  tabs();
  if (!window.__adminEdit) parallax();
  if (!window.__adminEdit) { paths(); heroWords(); scrollWords(); counters(); }
  showcase();
  roads();
  trials();
  layers();
  madlibs();
  pcar();
  zigzag();
  heroLoop();
  miniLoops();
  if (!window.__adminEdit) kinetic();
  reveal();
  forms();
})();
