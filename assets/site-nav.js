/* Les Cabanes de Marie — menu de navigation partagé + bouton « Réserver » toujours visible.
   Inclure sur les pages SANS menu (sous-pages + pages cabane) :
     <script src="assets/site-nav.js" defer></script>
   Injecte :
   - un bouton ☰ + un panneau coulissant (liens traduits FR/DE/EN) ;
   - un bouton « Réserver » dans l'en-tête (écran large) et une barre fixe en bas (mobile) :
       · pages cabane  -> réservation Planyo de CETTE cabane ;
       · autres pages  -> index.html#reserver (choix de la cabane).
   La langue est lue dans localStorage 'cdm_lang' et mise à jour quand on change de langue.
   Ne touche pas au menu de l'accueil. */
(function(){
  if (window.__siteNav) return; window.__siteNav = true;

  var L = {
    fr:{ menu:'Menu', home:'Accueil', cab:'Les cabanes', spa:'Spa & saveurs', act:'Activités',
         info:'Infos pratiques', faq:'Des questions ?', cg:'Conditions', gift:'Bon cadeau',
         contact:'Contact', book:'Réserver une nuit', bookShort:'Réserver', bookCab:'Réserver cette cabane', close:'Fermer' },
    de:{ menu:'Menü', home:'Startseite', cab:'Die Hütten', spa:'Spa & Genuss', act:'Aktivitäten',
         info:'Praktische Infos', faq:'Fragen?', cg:'AGB', gift:'Gutschein',
         contact:'Kontakt', book:'Eine Nacht buchen', bookShort:'Reservieren', bookCab:'Diese Hütte reservieren', close:'Schliessen' },
    en:{ menu:'Menu', home:'Home', cab:'The cabins', spa:'Spa & flavours', act:'Activities',
         info:'Practical info', faq:'FAQ', cg:'Terms', gift:'Gift voucher',
         contact:'Contact', book:'Book a night', bookShort:'Book', bookCab:'Book this cabin', close:'Close' }
  };
  function lang(){ try{ var l=localStorage.getItem('cdm_lang'); return L[l]?l:'fr'; }catch(e){ return 'fr'; } }

  // Page cabane = elle contient déjà son propre lien de réservation Planyo.
  var own = document.querySelector("a[href*='planyo.com/booking.php']");
  var cabinHref = own ? own.getAttribute('href') : null;
  function bookHref(){
    if (!cabinHref) return 'index.html#reserver';
    var up = lang().toUpperCase();
    return /custom-language=[A-Za-z]*/.test(cabinHref)
      ? cabinHref.replace(/custom-language=[A-Za-z]*/, 'custom-language=' + up)
      : cabinHref + (cabinHref.indexOf('?') > -1 ? '&' : '?') + 'custom-language=' + up;
  }

  var css = ""
    + ".snav-burger{display:flex;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:6px;z-index:20}"
    + ".snav-burger span{display:block;width:26px;height:2px;background:var(--forest,#222C18);border-radius:2px;transition:.3s}"
    + ".snav-overlay{position:fixed;inset:0;background:rgba(20,26,12,.5);opacity:0;pointer-events:none;transition:none;z-index:9998}"
    + ".snav-overlay.open{opacity:1;pointer-events:auto}"
    + ".snav-panel{position:fixed;top:0;right:0;bottom:0;left:auto;width:min(82vw,330px);background:var(--forest,#222C18);"
    + "display:flex;flex-direction:column;align-items:flex-start;gap:20px;"
    + "padding:calc(env(safe-area-inset-top,0px) + 26px) 40px calc(env(safe-area-inset-bottom,0px) + 40px);"
    + "overflow-y:auto;-webkit-overflow-scrolling:touch;transform:translateX(100%);transition:none;"
    + "box-shadow:-18px 0 50px -28px rgba(0,0,0,.55);z-index:9999;visibility:hidden}"
    + ".snav-panel.open{transform:translateX(0);visibility:visible}"
    + ".snav-panel .snav-close{align-self:flex-end;background:none;border:none;color:rgba(242,236,223,.7);font-size:1.3rem;cursor:pointer;padding:0 0 6px;line-height:1}"
    + ".snav-panel a{color:var(--bone,#F2ECDF);text-decoration:none;font-family:'Fraunces',serif;font-weight:300;font-size:1.35rem;letter-spacing:-.01em;transition:color .2s}"
    + ".snav-panel a:hover,.snav-panel a:focus-visible{color:var(--sand,#CBA968)}"
    + ".snav-panel .snav-cta{margin-top:8px;font-family:'Hanken Grotesk',sans-serif;font-size:1rem;font-weight:600;background:var(--clay,#B5663B);color:#fff;padding:13px 26px;border-radius:40px;align-self:stretch;text-align:center}"
    + ".snav-panel .snav-cta:hover{color:#fff;filter:brightness(1.06)}"
    /* en-tête des sous-pages : collé en haut pour que menu + Réserver restent accessibles au défilement */
    + ".bar{position:sticky;top:0;z-index:40;max-width:none !important;margin:0 !important;"
    + "padding:12px max(22px,calc((100% - 980px)/2)) !important;background:rgba(242,236,223,.94);"
    + "-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid rgba(34,31,24,.12)}"
    /* bouton « Réserver » : en-tête (écran large) */
    + ".snav-book{display:inline-flex;align-items:center;background:var(--clay,#B5663B);color:#fff;font-family:'Hanken Grotesk',sans-serif;"
    + "font-weight:600;font-size:.88rem;padding:9px 20px;border-radius:40px;text-decoration:none;white-space:nowrap;transition:filter .2s}"
    + ".snav-book:hover{filter:brightness(1.08)}"
    + ".snav-bar{display:none}"
    /* barre fixe en bas (mobile) */
    + "@media(max-width:880px){"
    + ".snav-book{display:none}"
    + ".snav-bar{display:flex;align-items:center;justify-content:center;position:fixed;left:12px;right:12px;"
    + "bottom:calc(env(safe-area-inset-bottom,0px) + 12px);z-index:9500;background:var(--clay,#B5663B);color:#fff;"
    + "padding:15px 18px;border-radius:40px;font-family:'Hanken Grotesk',sans-serif;font-weight:600;font-size:1rem;"
    + "text-decoration:none;box-shadow:0 14px 34px -10px rgba(0,0,0,.55)}"
    + ".cc-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 80px) !important}"
    + "footer,.foot{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 92px) !important}"
    + "}";
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // bouton ☰ + bouton « Réserver » insérés dans l'en-tête existant (à droite)
  var burger = document.createElement('button');
  burger.className = 'snav-burger'; burger.setAttribute('aria-expanded','false');
  burger.innerHTML = '<span></span><span></span><span></span>';
  var pill = document.createElement('a'); pill.className = 'snav-book';

  var right = document.querySelector('.bar-r');
  if (right) {
    var back = right.querySelector('.back'); if (back) back.style.display = 'none'; // redondant avec le menu
    var sw = right.querySelector('.langsw');
    right.insertBefore(pill, sw || null);
    right.appendChild(burger);
  } else {
    var hdr = document.querySelector('.hdr');
    var langsw = hdr && hdr.querySelector('.langsw');
    if (hdr && langsw) {
      var grp = document.createElement('div');
      grp.style.cssText = 'display:flex;align-items:center;gap:12px';
      hdr.insertBefore(grp, langsw); grp.appendChild(pill); grp.appendChild(langsw); grp.appendChild(burger);
    } else {
      burger.style.cssText = 'position:fixed;top:16px;right:16px;z-index:40'; document.body.appendChild(burger);
      pill.style.cssText = 'position:fixed;top:16px;right:64px;z-index:40'; document.body.appendChild(pill);
    }
  }

  // overlay + panneau + barre fixe
  var overlay = document.createElement('div'); overlay.className = 'snav-overlay';
  var panel = document.createElement('nav'); panel.className = 'snav-panel';
  var bar = document.createElement('a'); bar.className = 'snav-bar';
  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  document.body.appendChild(bar);

  function render(){
    var t = L[lang()];
    var links = [
      ['index.html', t.home],
      ['index.html#cabanes', t.cab],
      ['index.html#spa', t.spa],
      ['index.html#activites', t.act],
      ['index.html#infos', t.info],
      ['faq.html', t.faq],
      ['conditions-generales.html', t.cg],
      ['bons-cadeaux.html', t.gift],
      ['contact.html', t.contact]
    ];
    var html = '<button class="snav-close" aria-label="'+t.close+'">✕</button>';
    links.forEach(function(l){ html += '<a href="'+l[0]+'">'+l[1]+'</a>'; });
    html += '<a class="snav-cta" href="index.html#reserver">'+t.book+'</a>';
    panel.innerHTML = html;
    panel.setAttribute('aria-label', t.menu);
    burger.setAttribute('aria-label', t.menu);
    pill.textContent = t.bookShort;
    pill.setAttribute('href', bookHref());
    bar.textContent = cabinHref ? t.bookCab : t.book;
    bar.setAttribute('href', bookHref());
  }

  function open(){ panel.classList.add('open'); overlay.classList.add('open'); burger.setAttribute('aria-expanded','true');
    var c = panel.querySelector('.snav-close'); if (c) c.focus(); }
  function close(){ panel.classList.remove('open'); overlay.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  burger.addEventListener('click', open);
  overlay.addEventListener('click', close);
  panel.addEventListener('click', function(e){
    var el = e.target.closest ? e.target.closest('.snav-close, a') : null;
    if (el) close();
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
  // le changement de langue est géré par la page : on rafraîchit nos libellés juste après
  document.querySelectorAll('.lang-b').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(render, 0); });
  });
  render();
})();
