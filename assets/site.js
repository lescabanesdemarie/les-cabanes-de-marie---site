/* =====================================================================
   Les Cabanes de Marie — comportements communs à TOUTES les pages
   · la langue est donnée par l'adresse (/, /de/, /en/) : chaque page est écrite dans sa langue par tools/build.ps1,
     rien n'est traduit ici. Le sélecteur FR / DE / EN est fait de simples liens vers la page équivalente.
   · pages cabane : les boutons « Réserver » mènent à Planyo pour CETTE cabane
   · tiroir de navigation, barre du haut repliable, apparition des blocs au défilement
   ===================================================================== */
(function () {
  'use strict';
  var D = document, root = D.documentElement;
  root.classList.add('js');

  function all(sel, ctx) { return Array.prototype.slice.call((ctx || D).querySelectorAll(sel)); }

  /* ---- langue de la page (pour les scripts : Planyo, formulaires, Edith) ---- */
  var lang = (root.getAttribute('lang') || 'fr').slice(0, 2);
  window.__lang = lang;
  window.CDM = {
    lang: function () { return lang; },
    // textes utilisés par un script de page (window.CDM_UI est écrit dans la page par le build)
    t: function (k) { return (window.CDM_UI || {})[k]; }
  };

  /* ---- page cabane : les boutons « Réserver » mènent à Planyo pour CETTE cabane ---- */
  var main = D.querySelector('a[data-book-main]');
  if (main) {
    var href = main.getAttribute('href');
    all('a[data-book]').forEach(function (a) { a.setAttribute('href', href); });
  }

  /* ---- lien de la page en cours (menu) ---- */
  var here = location.pathname.replace(/\/index\.html$/, '/');
  all('.nav a, .drawer a.dl').forEach(function (a) {
    var u; try { u = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
    if (!u.hash && u.pathname === here && !/\/(de\/|en\/)?$/.test(here)) a.setAttribute('aria-current', 'page');
  });

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
    var B = D.body, hero = D.getElementById('top'), rupt = D.getElementById('rupture'), brand = head.querySelector('.brand');
    var isHome = B.classList.contains('home');
    var desk = window.matchMedia ? matchMedia('(min-width:961px) and (hover:hover) and (pointer:fine)') : { matches: false };
    var lastY = window.scrollY, acc = 0, goingUp = false, peek = false, kbd = false, queued = false;
    var barApply = function () {
      queued = false;
      var h = head.offsetHeight, rr = rupt ? rupt.getBoundingClientRect() : null;
      var inRupt = !!rr && rr.top <= h / 2 && rr.bottom >= h / 2;
      var heroOn = isHome && hero && hero.getBoundingClientRect().bottom > h;
      var min = desk.matches && !heroOn && (inRupt || !(kbd || peek || goingUp));
      B.classList.toggle('bar-min', min);
      B.classList.toggle('bar-off', inRupt && !kbd);
      // logo seul : clair sur un fond sombre (sommaire, bain…), foncé avec un halo partout ailleurs (photo, crème)
      var dark = false;
      if (min && !inRupt && D.elementsFromPoint) {
        var r = brand.getBoundingClientRect(), under = D.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        for (var i = 0; i < under.length; i++) {
          if (head.contains(under[i])) continue;
          dark = !!(under[i].closest && under[i].closest('.dark, .deep, .warm'));
          break;
        }
      }
      B.classList.toggle('bar-ondark', dark);
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
    // filet de sécurité : si l'observateur ne signale rien (visionneuse intégrée, onglet en arrière-plan…), on révèle ce qui est à l'écran
    var sweep = function () {
      var vh = window.innerHeight || 800;
      reveals.forEach(function (el) {
        if (el.classList.contains('seen')) return;
        var r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh * 0.96) { el.classList.add('seen'); io.unobserve(el); }
      });
    };
    var sweeping = false;
    window.addEventListener('scroll', function () { if (!sweeping) { sweeping = true; requestAnimationFrame(function () { sweeping = false; sweep(); }); } }, { passive: true });
    window.addEventListener('resize', sweep);
    window.addEventListener('load', function () { setTimeout(sweep, 600); });
  }
})();
