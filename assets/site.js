/* =====================================================================
   Les Cabanes de Marie — comportements communs à TOUTES les pages
   · langue FR / DE / EN  : le français est écrit dans le HTML (data-i="clé"),
     le DE et l'EN viennent de window.CDM_I18N (propre à chaque page) + CHROME
     ci-dessous (en-tête, pied de page, barre « Réserver »…)
   · boutons et calendriers Planyo dans la langue de la page
   · tiroir de navigation, barre « Réserver » (pages cabane : Planyo de la cabane)
   · apparition des blocs au défilement
   Pour traduire un texte : FR dans le HTML ; DE/EN dans le dictionnaire de la page.
   ===================================================================== */
(function () {
  'use strict';
  var D = document, root = D.documentElement;
  root.classList.add('js');

  /* ---- textes partagés (DE / EN) : en-tête, pied de page, barre Réserver ---- */
  var CHROME = {
    de: {
      "skip": "Zum Inhalt springen",
      "nav.cab": "Die Hütten", "nav.spa": "Spa & Genuss", "nav.act": "Aktivitäten", "nav.info": "Infos",
      "nav.faq": "Fragen?", "nav.cg": "AGB", "nav.gift": "Gutschein", "nav.contact": "Kontakt",
      "nav.book": "Reservieren", "nav.home": "Startseite", "nav.menu": "Menü", "nav.close": "Schliessen",
      "bar.book": "Eine Nacht buchen", "bar.cab": "Diese Hütte reservieren", "lang.label": "Sprache",
      "ft.tag": "Baumhütten in Ogens, im Herzen des Schweizer Mittellands.",
      "ft.c1": "Die Hütten", "ft.c2": "Der Aufenthalt", "ft.c3": "Reservieren",
      "ft.spa": "Öko-Spa", "ft.sav": "Genuss & Mahlzeiten", "ft.act": "Aktivitäten", "ft.gift": "Geschenkgutscheine",
      "ft.tar": "Preise", "ft.disp": "Verfügbarkeiten", "ft.info": "Praktische Infos", "ft.faq": "FAQ",
      "ft.contact": "Kontakt", "ft.cg": "AGB", "ft.priv": "Datenschutz",
      "ft.hours": "Geöffnet von April bis Ende Oktober · Ankunft ab 16 Uhr · Abreise 11 Uhr",
      "ft.rights": "© 2026 Les Cabanes de Marie — Ogens (VD), Schweiz",
      "ft.made": "Website mit ♥ von unserem Sohn Mathis gemacht",
      "ui.book": "Diese Hütte reservieren", "ui.gift": "Gutschein verschenken",
      "cab.others": "Und die drei anderen.", "strip.dates": "Daten ansehen",
      "ui.incH": "Was Sie erwartet",
      "inc.1": "Lokales Frühstück inklusive, im Korb bis zur Hütte gebracht.",
      "inc.2": "Zugang zum Öko-Spa: Holzfeuer-Bad und Sauna.",
      "inc.3": "Bettwäsche, Handtücher und Heizung inklusive.",
      "inc.4": "Check-in ab 16 Uhr · Check-out vor 11 Uhr.",
      "inc.5": "Ca. 30 Min. von Lausanne, nahe Yverdon — Ogens (VD).",
      "ui.availH": "Reservieren Sie Ihre Daten",
      "ui.availLead": "Sehen Sie den Live-Kalender und reservieren Sie in wenigen Klicks online.",
      "cal.title": "Verfügbarkeitskalender"
    },
    en: {
      "skip": "Skip to content",
      "nav.cab": "The cabins", "nav.spa": "Spa & dining", "nav.act": "Activities", "nav.info": "Info",
      "nav.faq": "Questions?", "nav.cg": "Terms", "nav.gift": "Gift voucher", "nav.contact": "Contact",
      "nav.book": "Book", "nav.home": "Home", "nav.menu": "Menu", "nav.close": "Close",
      "bar.book": "Book a night", "bar.cab": "Book this cabin", "lang.label": "Language",
      "ft.tag": "Treehouses in Ogens, in the heart of the Swiss countryside.",
      "ft.c1": "The cabins", "ft.c2": "The stay", "ft.c3": "Book",
      "ft.spa": "Eco-spa", "ft.sav": "Dining & meals", "ft.act": "Activities", "ft.gift": "Gift vouchers",
      "ft.tar": "Rates", "ft.disp": "Availability", "ft.info": "Practical info", "ft.faq": "FAQ",
      "ft.contact": "Contact", "ft.cg": "Terms & conditions", "ft.priv": "Privacy",
      "ft.hours": "Open April to end of October · Check-in from 4 pm · Check-out 11 am",
      "ft.rights": "© 2026 Les Cabanes de Marie — Ogens (VD), Switzerland",
      "ft.made": "Website made with ♥ by our son, Mathis",
      "ui.book": "Book this cabin", "ui.gift": "Gift a voucher",
      "cab.others": "And the other three.", "strip.dates": "See dates",
      "ui.incH": "What awaits you",
      "inc.1": "Local breakfast included, brought up to the cabin in a basket.",
      "inc.2": "Access to the Eco-Spa: wood-fired bath and sauna.",
      "inc.3": "Linens, towels and heating provided.",
      "inc.4": "Check-in from 4pm · check-out before 11am.",
      "inc.5": "About 30 min from Lausanne, near Yverdon — Ogens (VD).",
      "ui.availH": "Book your dates",
      "ui.availLead": "Check the live calendar, then book online in a few clicks.",
      "cal.title": "Availability calendar"
    }
  };
  var LANGS = ['fr', 'de', 'en'];

  function all(sel, ctx) { return Array.prototype.slice.call((ctx || D).querySelectorAll(sel)); }
  function savedLang() { try { var l = localStorage.getItem('cdm_lang'); return LANGS.indexOf(l) > -1 ? l : 'fr'; } catch (e) { return 'fr'; } }

  /* ---- page cabane : les boutons « Réserver » mènent à Planyo pour CETTE cabane ---- */
  var main = D.querySelector('a[data-book-main]');
  if (main) {
    var href = main.getAttribute('href');
    all('a[data-book]').forEach(function (a) { a.setAttribute('href', href); });
    all('.bookbar').forEach(function (a) { a.setAttribute('data-i', 'bar.cab'); a.textContent = 'Réserver cette cabane'; });
  }

  /* ---- mémorise le texte français d'origine de chaque élément traduisible ---- */
  var frTitle = D.title;
  all('[data-i]').forEach(function (el) { el.__fr = el.innerHTML; });
  all('[data-i-ph]').forEach(function (el) { el.__frPh = el.getAttribute('placeholder') || ''; });
  all('[data-i-aria]').forEach(function (el) { el.__frAria = el.getAttribute('aria-label') || ''; });
  all('[data-i-title]').forEach(function (el) { el.__frTitle = el.getAttribute('title') || ''; });

  function dict(l) {
    var out = {}, a = CHROME[l] || {}, b = (window.CDM_I18N && window.CDM_I18N[l]) || {}, k;
    for (k in a) out[k] = a[k];
    for (k in b) out[k] = b[k];
    return out;
  }

  /* ---- Planyo : même langue que la page (boutons de réservation et calendriers) ---- */
  function withLang(v, L) {
    return /custom-language=[A-Za-z]*/.test(v)
      ? v.replace(/custom-language=[A-Za-z]*/, 'custom-language=' + L)
      : v + (v.indexOf('?') > -1 ? '&' : '?') + 'custom-language=' + L;
  }
  function planyo(l) {
    var L = l.toUpperCase();
    all("iframe[src*='planyo.com']").forEach(function (f) {
      var s = f.getAttribute('src'); if (!s) return;
      var n = withLang(s, L); if (n !== s) f.setAttribute('src', n);
    });
    all("a[href*='planyo.com']").forEach(function (a) {
      var h = a.getAttribute('href'); if (!h) return;
      var n = withLang(h, L); if (n !== h) a.setAttribute('href', n);
    });
  }

  /* ---- changement de langue ---- */
  function setLang(l) {
    if (LANGS.indexOf(l) < 0) l = 'fr';
    var d = dict(l), fr = (l === 'fr');
    root.lang = l;
    window.__lang = l;
    all('[data-i]').forEach(function (el) {
      var k = el.getAttribute('data-i');
      el.innerHTML = (!fr && d[k] != null) ? d[k] : el.__fr;
    });
    all('[data-i-ph]').forEach(function (el) {
      var k = 'ph.' + el.getAttribute('data-i-ph');
      el.setAttribute('placeholder', (!fr && d[k] != null) ? d[k] : el.__frPh);
    });
    all('[data-i-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i-aria');
      el.setAttribute('aria-label', (!fr && d[k] != null) ? d[k] : el.__frAria);
    });
    all('[data-i-title]').forEach(function (el) {
      var k = el.getAttribute('data-i-title');
      el.setAttribute('title', (!fr && d[k] != null) ? d[k] : el.__frTitle);
    });
    D.title = (!fr && d['meta.title']) ? d['meta.title'] : frTitle;
    all('.lang-b').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-l') === l ? 'true' : 'false'); });
    planyo(l);
    try { localStorage.setItem('cdm_lang', l); } catch (e) {}
    try { D.dispatchEvent(new CustomEvent('cdm:lang', { detail: l })); } catch (e) {}
  }
  window.CDM = { setLang: setLang, lang: function () { return window.__lang || 'fr'; }, t: function (k) { var d = dict(window.__lang || 'fr'); return d[k]; } };
  D.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.lang-b') : null;
    if (b) setLang(b.getAttribute('data-l'));
  });
  var start = savedLang();
  if (start !== 'fr') setLang(start); else { window.__lang = 'fr'; all('.lang-b').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-l') === 'fr' ? 'true' : 'false'); }); planyo('fr'); }

  /* ---- lien de la page en cours (menu) ---- */
  var here = location.pathname.replace(/\/index\.html$/, '/');
  all('.nav a, .drawer a.dl').forEach(function (a) {
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
    if (!u.hash && u.pathname === here && here !== '/') a.setAttribute('aria-current', 'page');
  });

  /* ---- depuis l'accueil, les liens « index.html#section » défilent doucement (sans recharger la page) ---- */
  var onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
  var calmMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (onHome) {
    D.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var m = /^index\.html(?:#(.*))?$/.exec(a.getAttribute('href'));
      if (!m) return;
      var t = m[1] ? D.getElementById(m[1]) : null;
      if (m[1] && !t) return;
      e.preventDefault();
      if (t) t.scrollIntoView({ behavior: calmMotion ? 'auto' : 'smooth' }); else window.scrollTo({ top: 0, behavior: calmMotion ? 'auto' : 'smooth' });
      try { history.pushState(null, '', m[1] ? '#' + m[1] : location.pathname); } catch (x) {}
    });
  }

  /* ---- tiroir de navigation ---- */
  var burger = D.getElementById('burger'), drawer = D.getElementById('drawer'), scrim = D.getElementById('scrim');
  if (burger && drawer && scrim) {
    var openMenu = function () {
      drawer.classList.add('open'); scrim.classList.add('open'); D.body.classList.add('menu-open');
      burger.setAttribute('aria-expanded', 'true');
      var c = drawer.querySelector('.drawer-close'); if (c) c.focus();
    };
    var closeMenu = function (back) {
      drawer.classList.remove('open'); scrim.classList.remove('open'); D.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      if (back) burger.focus();
    };
    burger.addEventListener('click', openMenu);
    scrim.addEventListener('click', function () { closeMenu(true); });
    drawer.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('.drawer-close, a') : null;
      if (!t) return;
      closeMenu(t.classList.contains('drawer-close'));
    });
    D.addEventListener('keydown', function (e) {
      if (!drawer.classList.contains('open')) return;
      if (e.key === 'Escape') { closeMenu(true); return; }
      if (e.key !== 'Tab') return;
      var f = all('a, button', drawer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1999 && drawer.classList.contains('open')) closeMenu(false); });
  }

  /* ---- barre du haut : sur ordinateur, repliée en « logo seul » (hors accueil, et sur l'accueil après l'entrée).
         Elle revient en remontant, quand la souris approche du haut, ou au clavier ; elle se replie quand on descend.
         Téléphone / tactile : jamais repliée. Pendant la rupture (#rupture) : tout s'efface (classe bar-off). ---- */
  var head = D.querySelector('.site-header');
  if (head) {
    var B = D.body, hero = D.getElementById('top'), rupt = D.getElementById('rupture');
    var isHome = B.classList.contains('home');
    var desk = window.matchMedia ? matchMedia('(min-width:961px) and (hover:hover) and (pointer:fine)') : { matches: false };
    var lastY = window.scrollY, acc = 0, goingUp = false, peek = false, kbd = false, queued = false;
    var barApply = function () {
      queued = false;
      var h = head.offsetHeight, rr = rupt ? rupt.getBoundingClientRect() : null;
      var inRupt = !!rr && rr.top <= h / 2 && rr.bottom >= h / 2;
      var heroOn = isHome && hero && hero.getBoundingClientRect().bottom > h;
      B.classList.toggle('bar-min', desk.matches && !heroOn && (inRupt || !(kbd || peek || goingUp)));
      B.classList.toggle('bar-off', inRupt && !kbd);
    };
    var barQueue = function () { if (!queued) { queued = true; requestAnimationFrame(barApply); } };
    window.addEventListener('scroll', function () {
      var y = window.scrollY, d = y - lastY; lastY = y;
      if (!d) return;
      acc = ((d > 0) === (acc > 0)) ? acc + d : d;
      if (acc > 14) goingUp = false; else if (acc < -14) goingUp = true;
      barQueue();
    }, { passive: true });
    window.addEventListener('mousemove', function (e) {
      if (!desk.matches) return;
      if (e.clientY <= 96) { if (!peek) { peek = true; barQueue(); } }
      else if (peek && e.clientY > 170) { peek = false; barQueue(); }
    }, { passive: true });
    head.addEventListener('focusin', function (e) {
      var vis = true; try { vis = e.target.matches(':focus-visible'); } catch (x) {}
      if (vis) { kbd = true; barQueue(); }
    });
    head.addEventListener('focusout', function (e) { if (!head.contains(e.relatedTarget)) { kbd = false; barQueue(); } });
    window.addEventListener('resize', barQueue);
    if (desk.addEventListener) desk.addEventListener('change', barQueue);
    barApply();
  }

  /* ---- apparition au défilement (sans JS ou avec « mouvement réduit » : tout est visible) ---- */
  var reveals = all('.reveal, .unveil');
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || calm) {
    reveals.forEach(function (el) { el.classList.add('seen'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
