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

  /* ---- bandeau du prix (accueil, pages cabane) : en remontant avec sa cabane, il disparaît dès qu'il touche la barre du haut,
         pour ne jamais passer sous / à côté du logo ---- */
  var strips = all('.strip');
  if (strips.length && head) {
    var stripQ = false, stripApply = function () {
      stripQ = false;
      var h = head.getBoundingClientRect().bottom;
      strips.forEach(function (s) { s.classList.toggle('strip-under', s.getBoundingClientRect().top < h); });
    };
    var stripQueue = function () { if (!stripQ) { stripQ = true; requestAnimationFrame(stripApply); } };
    window.addEventListener('scroll', stripQueue, { passive: true });
    window.addEventListener('resize', stripQueue);
    stripApply();
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

  /* ---- branches animées : « rails » de branches dans le vide sur les côtés (pages cabane, cabanes de l'accueil, sommaire).
     Chaque rail (.br-rail, data-z = zone qu'il couvre) contient ses branches ; ce script les pose là où il y a de la place :
     au moins 40 px de tout texte, photo ou bouton, collées au bord de l'écran (à droite ; aussi à gauche sur téléphone).
     data-m = branche gardée sur téléphone ; data-ar = hauteur / largeur du dessin ; data-side = côté d'attache du dessin.
     Sommaire (data-rows) : une branche par ligne, centrée sur sa ligne.
     L'arrivée (vent, animal) part une fois, quand la zone est visible à 25 % (filet : 1,2 s après l'arrivée de la branche à l'écran),
     décalée de 0,3 s d'une branche à l'autre ; hors de l'écran, le balancement est en pause (.off).
     Sans JS : la première branche de chaque rail est posée en haut à droite (CSS). Mouvement réduit : tout est posé, immobile. ---- */
  var rails = all('.br-rail');
  if (rails.length) {
    var GAP = 40, last = 0;
    var hh = function () { var h = D.querySelector('.site-header'); return h ? h.offsetHeight : 72; };
    var zoneOf = function (rail) { return rail.getAttribute('data-z').split(',').map(function (s) { return D.querySelector(s); }).filter(Boolean); };
    // tout ce qu'une branche ne doit pas approcher : lignes de texte, images, boutons, champs (coordonnées de la page)
    var obstacles = function () {
      var out = [], sx = window.scrollX, sy = window.scrollY;
      var skip = '.br-rail,script,style,.site-header,.drawer,.bookbar,.strip,.cc-fab,.skip,[hidden]';
      // un bloc .reveal pas encore apparu est 34 px plus bas que sa place finale : on compte les deux positions
      var add = function (r, up) { if (r.width > 1 && r.height > 1) out.push({ l: r.left + sx, r: r.right + sx, t: r.top + sy - up, b: r.bottom + sy }); };
      var lift = function (e) { return e.closest('.reveal:not(.seen)') ? 34 : 0; };
      // ce qui flotte au-dessus de la page (Edith, bandeaux fixes) ne compte pas
      var fixed = Array.prototype.filter.call(D.body.children, function (e) { var p = getComputedStyle(e).position; return p === 'fixed' || p === 'sticky'; });
      var off = function (e) { return e.closest(skip) || fixed.some(function (f) { return f.contains(e); }); };
      var tw = D.createTreeWalker(D.body, NodeFilter.SHOW_TEXT, null), rg = D.createRange(), n;
      while ((n = tw.nextNode())) {
        var pe = n.parentElement;
        if (!n.textContent.trim() || !pe || off(pe)) continue;
        var up = lift(pe); rg.selectNodeContents(n);
        Array.prototype.forEach.call(rg.getClientRects(), function (r) { add(r, up); });
      }
      all('img,svg,iframe,video,canvas,input,textarea,select,button,figure,.btn,.go,.planyo-slot').forEach(function (e) {
        // une image dans un cadre (figure) compte pour son cadre (l'effet de dévoilement la grossit un instant)
        if (e.tagName === 'IMG' && e.closest('figure')) return;
        if (!off(e) && e.getClientRects().length) add(e.getBoundingClientRect(), lift(e));
      });
      // traits de séparation du sommaire (seuls traits qu'une branche évite ; les autres lignes ne sont pas du contenu)
      all('.som-item').forEach(function (e) {
        if (off(e)) return;
        var r = e.getBoundingClientRect();
        if (r.width) [r.top, r.bottom - 1].forEach(function (y) { add({ left: r.left, right: r.right, top: y, bottom: y + 2, width: r.width, height: 2 }, 0); });
      });
      out.push({ l: 0, r: 1e5, t: 0, b: hh() }); // la barre du haut, en haut de page
      return out;
    };
    // animaux (.br-a, data-a = pattes x y + boîte x y l h, en unités du dessin) : au moins 44 px de haut (32 sur téléphone),
    // agrandis autour de leurs pattes si la branche est petite ; puis gardés entiers dans la branche et à 12 px au moins
    // du bord de l'écran (8 demandés + marge), balancement compris — sinon déplacés le long de la tige.
    // Rend false si un animal n'atteint pas sa taille minimale (la branche est alors trop petite : on en cherche une plus grande).
    var fitAnimals = function (b, w, mob) {
      var as = all('.br-a', b), full = true; if (!as.length) return true;
      var vb = b.querySelector('svg').getAttribute('viewBox').split(' ').map(Number), k = w / vb[2];
      var st = (b.getAttribute('data-stem') || '').split(' ').map(Number), o = (b.getAttribute('data-o') || '0 0').split(' ').map(Number);
      var side = b.getAttribute('data-side'), m8 = 12 / k, minPx = mob ? 32 : 44;
      var P = function (t) { var u = 1 - t; return [u * u * st[0] + 2 * u * t * st[2] + t * t * st[4], u * u * st[1] + 2 * u * t * st[3] + t * t * st[5]]; };
      var sway = function (x, y) { return Math.hypot(x - o[0], y - o[1]) * 0.025; }; // 1,4° de balancement
      as.forEach(function (a) {
        var d = a.getAttribute('data-a').split(' ').map(Number), ax = d[0], ay = d[1];
        var box = function (s, dx, dy) { return { l: ax + (d[2] - ax) * s + dx, t: ay + (d[3] - ay) * s + dy, r: ax + (d[2] + d[4] - ax) * s + dx, b: ay + (d[3] + d[5] - ay) * s + dy }; };
        var ok = function (q) {
          return q.l >= vb[0] + sway(q.l, q.b) + (side === 'L' ? m8 : 0) && q.r <= vb[0] + vb[2] - sway(q.r, q.b) - (side === 'R' ? m8 : 0) &&
            q.t >= vb[1] && q.b <= vb[1] + vb[3];
        };
        var s = Math.max(1, minPx / (d[5] * k)), dx = 0, dy = 0, done = ok(box(s, 0, 0));
        if (!done && st.length === 6) {
          var t0 = 0, bd = 1e9;
          for (var t = 0; t <= 1; t += 0.01) { var p = P(t), dd = (p[0] - ax) * (p[0] - ax) + (p[1] - ay) * (p[1] - ay); if (dd < bd) { bd = dd; t0 = t; } }
          var p0 = P(t0);
          for (var s2 = s; !done && s2 >= 1; s2 = s2 > 1 ? Math.max(1, s2 * 0.92) : 0) {
            for (var j = 1; j < 95 && !done; j++) {
              [t0 + j * 0.01, t0 - j * 0.01].forEach(function (tt) {
                if (done || tt < 0.05 || tt > 0.98) return;
                var p1 = P(tt);
                if (ok(box(s2, p1[0] - p0[0], p1[1] - p0[1]))) { done = true; s = s2; dx = p1[0] - p0[0]; dy = p1[1] - p0[1]; }
              });
            }
          }
        }
        if (!done || s * d[5] * k < minPx - 0.5) full = false;
        a.setAttribute('transform', 'translate(' + (ax + dx).toFixed(1) + ' ' + (ay + dy).toFixed(1) + ') scale(' + s.toFixed(3) + ') translate(' + (-ax) + ' ' + (-ay) + ')');
      });
      return full;
    };
    var layout = function () {
      var W = root.clientWidth, vw = window.innerWidth, mob = vw < 960, obs = obstacles(), sx = window.scrollX, sy = window.scrollY;
      var T = Math.min(600, Math.max(280, vw * 0.30)) * (mob ? 0.55 : 1), minW = mob ? 96 : 150;
      rails.forEach(function (rail) {
        var zr = null;
        zoneOf(rail).forEach(function (e) {
          var r = e.getBoundingClientRect();
          zr = zr ? { t: Math.min(zr.t, r.top + sy), b: Math.max(zr.b, r.bottom + sy) } : { t: r.top + sy, b: r.bottom + sy };
        });
        var o = rail.getBoundingClientRect(), ox = o.left + sx, oy = o.top + sy, placed = [];
        var bs = all('.br', rail), rows = rail.hasAttribute('data-rows') ? all(rail.getAttribute('data-rows')) : null;
        var use = bs.filter(function (b) { return rows || !mob || b.hasAttribute('data-m'); });
        bs.forEach(function (b) { b.style.display = 'none'; b.removeAttribute('data-placed'); });
        if (!zr) return;
        // largeur libre depuis le bord (côté R ou L) sur la hauteur [t, b]
        var mw = !mob && rail.hasAttribute('data-min') ? +rail.getAttribute('data-min') : minW;
        var near = obs.filter(function (q) { return q.b > zr.t - 80 && q.t < zr.b + 80; });
        var free = function (side, t, b, alone) {
          var f = W;
          (alone ? near : near.concat(placed)).forEach(function (q) {
            if (q.b + GAP <= t || q.t - GAP >= b) return;
            f = Math.min(f, side === 'R' ? W - q.r - GAP : q.l - GAP);
          });
          return f;
        };
        // plus grande branche posée en y : moins large si un obstacle est à côté, moins haute s'il barre tout le passage
        var fit = function (side, y, ar, cap, lo) {
          var w = Math.min(cap, (zr.b - y) / ar);
          for (var k = 0; k < 40 && w >= lo; k++) {
            var fw = free(side, y, y + w * ar);
            if (fw >= w) return w;
            if (fw >= lo) { w = fw; continue; }
            // barré plus bas : on raccourcit juste au-dessus du premier obstacle qui ferme le passage
            var stop = 1e9;
            near.concat(placed).forEach(function (q) {
              if (q.t - GAP > y && q.t - GAP < y + w * ar && (side === 'R' ? W - q.r - GAP : q.l - GAP) < lo) stop = Math.min(stop, q.t - GAP);
            });
            w = stop < 1e9 ? Math.min(w - 1, (stop - y) / ar - 0.5) : w - 16;
          }
          return 0;
        };
        var n = use.length, H = zr.b - zr.t, relaxed = false;
        var place = function (b, i) {
          if (b.hasAttribute('data-placed')) return;
          var ar = +b.getAttribute('data-ar'), best = null;
          if (rows) {
            var li = rows[i]; if (!li) return;
            // sur sa ligne (jusqu'à 2,2 fois sa hauteur), sans toucher la branche de la ligne d'avant :
            // on essaie plusieurs hauteurs autour du milieu de la ligne et on garde la plus grande branche
            var lr = li.getBoundingClientRect(), cap = Math.min(mob ? Math.max(130, Math.min(T, 200)) : Math.min(440, Math.max(280, vw * 0.21)), 2.2 * lr.height / ar);
            for (var off2 = -0.3; off2 <= 0.301; off2 += 0.05) {
              var cy = lr.top + sy + lr.height * (0.5 + off2), w = cap;
              for (var k = 0; k < 60 && w > 0; k++) {
                var t2 = cy - w * ar / 2, b2 = cy + w * ar / 2, fw = free('R', t2, b2, true), hit = false;
                placed.forEach(function (q) { if (q.b + GAP > t2 && q.t - GAP < b2) hit = true; });
                if (hit) { w -= 8; continue; }
                if (fw >= w) break; w = fw;
              }
              if (w >= (mob ? 100 : 200) && (!best || w > best.w + 0.5)) best = { side: 'R', y: cy - w * ar / 2, w: w };
            }
          }
          var search = function (lo, cap) {
            var bst = null, sides = mob ? ['R', 'L'] : ['R'];
            // premier passage tous les 24 px, puis on affine autour de la meilleure place (moins de calcul au chargement)
            var ys = [];
            for (var y0 = Math.max(zr.t, hh() + 8); y0 < zr.b - 40; y0 += 24) ys.push(y0);
            var tryY = function (y) {
              sides.forEach(function (side) {
                var w = fit(side, y, ar, cap, lo); if (w < lo) return; // trop petite ici : pas de branche
                var c = y + w * ar / 2, dmin = H;
                placed.forEach(function (p) { dmin = Math.min(dmin, Math.abs(p.c - c)); });
                // réparties sur la hauteur : pas deux branches l'une sur l'autre
                if (placed.length && dmin < (relaxed ? w * ar : Math.max(w * ar, H / (n * 1.7)))) return;
                var score = w * (1 + 0.35 * Math.min(1, dmin / (H / n)));
                if (!bst || score > bst.s) bst = { side: side, y: y, w: w, s: score };
              });
            };
            ys.forEach(tryY);
            if (bst) { var c0 = bst.y; for (var d = -20; d <= 20; d += 4) if (d && c0 + d >= zr.t && c0 + d < zr.b - 40) tryY(c0 + d); }
            return bst;
          };
          var put = function (bst) {
            var h = bst.w * ar, x = bst.side === 'R' ? W - bst.w : 0;
            b.style.display = 'block';
            b.style.left = (x - ox) + 'px'; b.style.top = (bst.y - oy) + 'px'; b.style.width = bst.w + 'px'; b.style.height = h + 'px';
            // le dessin s'accroche au bord de l'écran : on le retourne s'il est dessiné pour l'autre côté
            b.classList.toggle('mir', b.getAttribute('data-side') !== bst.side);
            // entre deux branches : 24 px (les 40 px restent la règle face au texte, aux photos et aux boutons)
            b.__p = { l: x - 24 + GAP, r: x + bst.w + 24 - GAP, t: bst.y - 24 + GAP, b: bst.y + h + 24 - GAP, c: bst.y + h / 2 };
            b.__w = bst.w;
            return fitAnimals(b, bst.w, mob);
          };
          if (!rows) {
            // une branche dont l'animal n'atteint pas sa taille minimale prend une place plus grande, s'il y en a une
            var lo = Math.max(mw, b.__lo || 0), cap = T;
            for (var tries = 0; tries < 6; tries++) {
              var cand = search(lo, cap); if (!cand) break;
              best = cand;
              if (put(best)) break;
              lo = best.w + 24; cap = Math.max(cap, Math.min(mob ? vw * 0.9 : 600, lo + 120));
            }
          }
          if (!best) return;
          if (rows || !b.__p || b.style.width !== best.w + 'px') put(best);
          placed.push(b.__p);
          b.setAttribute('data-placed', '');
        };
        use.forEach(place);
        // au moins 2 branches par zone sur ordinateur : second passage, espacement minimal seulement
        if (!rows && !mob && placed.length < 2) {
          relaxed = true; use.forEach(place);
          // toujours une seule : elle cède sa place à une autre (qui ne tient peut-être que là) et cherche ailleurs
          var b0 = use.filter(function (b) { return b.hasAttribute('data-placed'); })[0];
          if (placed.length < 2 && b0) {
            placed.splice(placed.indexOf(b0.__p), 1); b0.removeAttribute('data-placed'); b0.style.display = 'none';
            use.forEach(function (b) { if (b !== b0) place(b); });
            place(b0);
          }
        }
        // pages cabane (data-big) : au moins 2 grandes branches sur ordinateur ; sinon la plus petite va chercher une grande place
        var big = !mob && +rail.getAttribute('data-big');
        if (big) {
          for (var round = 0; round < 3; round++) {
            var on = use.filter(function (b) { return b.hasAttribute('data-placed'); });
            if (on.filter(function (b) { return b.__w >= big; }).length >= 2) break;
            var small = on.filter(function (b) { return b.__w < big; }).sort(function (a, c) { return a.__w - c.__w; })[0];
            var cand2 = use.filter(function (b) { return !b.hasAttribute('data-placed'); })[0] || small;
            if (!cand2) break;
            if (cand2 === small) { placed.splice(placed.indexOf(small.__p), 1); small.removeAttribute('data-placed'); small.style.display = 'none'; }
            relaxed = true; cand2.__lo = big; place(cand2); cand2.__lo = 0;
            if (!cand2.hasAttribute('data-placed') && cand2 === small) { place(small); break; }
          }
        }
      });
      check();
    };
    var arrive = function (b) {
      if (b.classList.contains('in') || b.__q) return;
      var now = Date.now(), at = Math.max(now, last + 300); last = at; b.__q = 1;
      setTimeout(function () { b.classList.add('in'); }, at - now);
    };
    var check = function () {
      var vh = window.innerHeight || 800, now = Date.now();
      rails.forEach(function (rail) {
        var vis = 0, tot = 0;
        zoneOf(rail).forEach(function (e) { var r = e.getBoundingClientRect(); tot += r.height; vis += Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)); });
        var zoneOn = tot > 0 && (vis / tot >= 0.25 || vis >= vh * 0.25);
        all('.br[data-placed]', rail).forEach(function (b) {
          var r = b.getBoundingClientRect(), on = r.bottom > 0 && r.top < vh;
          b.classList.toggle('off', !on);
          if (!on) { b.__seen = 0; return; }
          if (!b.__seen) b.__seen = now;
          if (zoneOn || now - b.__seen >= 1200) arrive(b);
          else setTimeout(check, 1250);
        });
      });
    };
    if (calm) all('.br').forEach(function (b) { b.classList.add('in'); });
    else if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(check, { threshold: [0, 0.25, 0.5, 1] });
      all('.br').forEach(function (b) { bio.observe(b); });
      rails.forEach(function (rail) { zoneOf(rail).forEach(function (e) { bio.observe(e); }); });
    }
    var lq = false, relayout = function () { if (!lq) { lq = true; setTimeout(function () { lq = false; layout(); }, 150); } };
    var cq = false;
    window.addEventListener('scroll', function () { if (!cq) { cq = true; requestAnimationFrame(function () { cq = false; check(); }); } }, { passive: true });
    window.addEventListener('resize', relayout);
    // les branches se posent quand la page a fini de charger (et quand le navigateur est libre) : rien ne ralentit
    // l'affichage du contenu ; un second calage 1,5 s plus tard rattrape les calendriers / polices arrivés en retard
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1); };
    var loaded = false;
    var start = function () { loaded = true; idle(function () { layout(); }, { timeout: 1200 }); setTimeout(relayout, 1500); };
    if (D.readyState === 'complete') start(); else window.addEventListener('load', start);
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (loaded) relayout(); });
  }
})();
