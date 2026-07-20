/* Les Cabanes de Marie — menu de navigation partagé.
   Inclure sur les pages SANS menu (sous-pages + pages cabane) :
     <script src="assets/site-nav.js" defer></script>
   Injecte un bouton ☰ + un panneau coulissant, liens traduits FR/DE/EN
   (langue lue depuis localStorage 'cdm_lang'). Ne touche pas au menu de l'accueil. */
(function(){
  if (window.__siteNav) return; window.__siteNav = true;

  var L = {
    fr:{ menu:'Menu', home:'Accueil', cab:'Les cabanes', spa:'Spa & saveurs', act:'Activités',
         info:'Infos pratiques', faq:'Des questions ?', cg:'Conditions', gift:'Bon cadeau',
         contact:'Contact', book:'Réserver une nuit', close:'Fermer' },
    de:{ menu:'Menü', home:'Startseite', cab:'Die Hütten', spa:'Spa & Genuss', act:'Aktivitäten',
         info:'Praktische Infos', faq:'Fragen ?', cg:'AGB', gift:'Gutschein',
         contact:'Kontakt', book:'Eine Nacht buchen', close:'Schliessen' },
    en:{ menu:'Menu', home:'Home', cab:'The cabins', spa:'Spa & flavours', act:'Activities',
         info:'Practical info', faq:'FAQ', cg:'Terms', gift:'Gift voucher',
         contact:'Contact', book:'Book a night', close:'Close' }
  };
  function lang(){ try{ var l=localStorage.getItem('cdm_lang'); return L[l]?l:'fr'; }catch(e){ return 'fr'; } }
  var t = L[lang()];

  var LINKS = [
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

  var css = ""
    + ".snav-burger{display:flex;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:6px;z-index:20}"
    + ".snav-burger span{display:block;width:26px;height:2px;background:var(--forest,#222C18);border-radius:2px;transition:.3s}"
    + ".snav-overlay{position:fixed;inset:0;background:rgba(20,26,12,.5);opacity:0;pointer-events:none;transition:none;z-index:9998}"
    + ".snav-overlay.open{opacity:1;pointer-events:auto}"
    + ".snav-panel{position:fixed;top:0;right:0;bottom:0;left:auto;width:min(82vw,330px);background:var(--forest,#222C18);"
    + "display:flex;flex-direction:column;align-items:flex-start;gap:20px;"
    + "padding:calc(env(safe-area-inset-top,0px) + 26px) 40px calc(env(safe-area-inset-bottom,0px) + 40px);"
    + "overflow-y:auto;-webkit-overflow-scrolling:touch;transform:translateX(100%);transition:none;"
    + "box-shadow:-18px 0 50px -28px rgba(0,0,0,.55);z-index:9999}"
    + ".snav-panel.open{transform:translateX(0)}"
    + ".snav-panel .snav-close{align-self:flex-end;background:none;border:none;color:rgba(242,236,223,.7);font-size:1.3rem;cursor:pointer;padding:0 0 6px;line-height:1}"
    + ".snav-panel a{color:var(--bone,#F2ECDF);text-decoration:none;font-family:'Fraunces',serif;font-weight:300;font-size:1.35rem;letter-spacing:-.01em;transition:color .2s}"
    + ".snav-panel a:hover,.snav-panel a:focus-visible{color:var(--sand,#CBA968)}"
    + ".snav-panel .snav-cta{margin-top:8px;font-family:'Hanken Grotesk',sans-serif;font-size:1rem;font-weight:600;background:var(--clay,#B5663B);color:#fff;padding:13px 26px;border-radius:40px;align-self:stretch;text-align:center}"
    + ".snav-panel .snav-cta:hover{color:#fff;filter:brightness(1.06)}";
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // bouton ☰ inséré dans l'en-tête existant (à droite)
  var burger = document.createElement('button');
  burger.className = 'snav-burger'; burger.setAttribute('aria-label', t.menu); burger.setAttribute('aria-expanded','false');
  burger.innerHTML = '<span></span><span></span><span></span>';

  var right = document.querySelector('.bar-r');
  if (right) {
    var back = right.querySelector('.back'); if (back) back.style.display = 'none'; // redondant avec le menu
    right.appendChild(burger);
  } else {
    var hdr = document.querySelector('.hdr');
    var langsw = hdr && hdr.querySelector('.langsw');
    if (hdr && langsw) {
      var grp = document.createElement('div');
      grp.style.cssText = 'display:flex;align-items:center;gap:12px';
      hdr.insertBefore(grp, langsw); grp.appendChild(langsw); grp.appendChild(burger);
    } else {
      burger.style.cssText = 'position:fixed;top:16px;right:16px;' ; document.body.appendChild(burger);
    }
  }

  // overlay + panneau
  var overlay = document.createElement('div'); overlay.className = 'snav-overlay';
  var panel = document.createElement('nav'); panel.className = 'snav-panel';
  panel.setAttribute('aria-label', t.menu);
  var html = '<button class="snav-close" aria-label="'+t.close+'">✕</button>';
  LINKS.forEach(function(l){ html += '<a href="'+l[0]+'">'+l[1]+'</a>'; });
  html += '<a class="snav-cta" href="index.html#reserver">'+t.book+'</a>';
  panel.innerHTML = html;
  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  function open(){ panel.classList.add('open'); overlay.classList.add('open'); burger.setAttribute('aria-expanded','true'); }
  function close(){ panel.classList.remove('open'); overlay.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }
  burger.addEventListener('click', open);
  overlay.addEventListener('click', close);
  panel.querySelector('.snav-close').addEventListener('click', close);
  panel.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', close); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
})();
