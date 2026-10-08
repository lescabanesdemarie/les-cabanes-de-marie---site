/* =====================================================================
   Les Cabanes de Marie — comportements propres à la page d'accueil
   · la rupture : la phrase apparaît doucement puis s'en va doucement (un seul écran sombre)
   · « Voir les dates » : un volet qui monte du bas avec le calendrier de LA cabane choisie
   · formulaire « cabane complète ? » (alerte de disponibilité)
   Sans JavaScript ou avec « mouvement réduit » : tout reste lisible, rien ne bouge.
   ===================================================================== */
(function () {
  'use strict';
  var D = document;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function ease(t) { return t * t * (3 - 2 * t); }

  /* ---- la rupture : la phrase se révèle, tient, puis s'efface, au rythme du défilement ---- */
  var run = D.querySelector('.rupt-run'), big = D.getElementById('ruptBig');
  if (run && big && !calm) {
    var ticking = false;
    var frame = function () {
      ticking = false;
      var hh = (D.querySelector('.site-header') || {}).offsetHeight || 0;
      var r = run.getBoundingClientRect();
      var total = r.height - (window.innerHeight - hh);       // distance pendant laquelle l'écran reste collé
      var p = total > 0 ? clamp((hh - r.top) / total, 0, 1) : 1;
      var inn = ease(ramp(p, 0.06, 0.34)), out = ease(ramp(p, 0.66, 0.94));
      big.style.setProperty('--o', (inn * (1 - out)).toFixed(3));
      big.style.setProperty('--y', (30 * (1 - inn) - 30 * out).toFixed(1) + 'px');
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  } else if (big) {
    big.style.setProperty('--o', '1'); big.style.setProperty('--y', '0px');
  }

  /* ---- « Voir les dates » : calendrier d'une seule cabane, dans un volet ---- */
  var panel = D.getElementById('calPanel'), scrim = D.getElementById('calScrim');
  if (panel && scrim) {
    var frameEl = D.getElementById('calp_panel'), title = D.getElementById('calTitle'),
        wait = D.getElementById('calWait'), book = D.getElementById('calBook'), close = D.getElementById('calX');
    var opener = null, current = null;
    var embed = function (res) {
      var L = (window.CDM ? CDM.lang() : 'fr').toUpperCase();
      return 'https://www.planyo.com/embed-calendar.php?resource_id=' + res + '&calendar=51020&style=multi-month-responsive&morning_icons=1&custom-language=' + L + '&ifr=calp_panel&lightbox=1&';
    };
    var openPanel = function (a) {
      opener = a; current = a.getAttribute('data-res');
      title.textContent = a.getAttribute('data-name') || '';
      book.setAttribute('href', a.getAttribute('href'));
      if (wait) wait.style.display = '';
      frameEl.hidden = false;
      frameEl.style.height = '';
      frameEl.setAttribute('src', embed(current));
      panel.classList.add('open'); scrim.classList.add('open'); D.body.classList.add('cal-open');
      setTimeout(function () { close.focus(); }, 60);
    };
    var closePanel = function () {
      panel.classList.remove('open'); scrim.classList.remove('open'); D.body.classList.remove('cal-open');
      if (opener) opener.focus();
    };
    D.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a.cal-open') : null;
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      openPanel(a);
    });
    close.addEventListener('click', closePanel);
    scrim.addEventListener('click', closePanel);
    frameEl.addEventListener('load', function () { if (wait) wait.style.display = 'none'; });
    D.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('open')) return;
      if (e.key === 'Escape') { closePanel(); return; }
      if (e.key !== 'Tab') return;
      var f = [].slice.call(panel.querySelectorAll('a[href], button')).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // le lien « Réserver » du volet suit la langue (le script commun réécrit les liens Planyo) ; le calendrier se recharge dans la bonne langue
    D.addEventListener('cdm:lang', function () {
      if (panel.classList.contains('open') && current) frameEl.setAttribute('src', embed(current));
    });
  }

  /* ---- alerte de disponibilité (liste d'attente) ---- */
  var f = D.getElementById('alForm');
  if (!f) return;
  var done = D.getElementById('alDone'), err = D.getElementById('alErr');
  var L = {
    fr: { bad: 'Merci de vérifier votre e-mail, votre téléphone et vos dates.', order: "Le départ doit être après l'arrivée." },
    de: { bad: 'Bitte überprüfen Sie E-Mail, Telefon und Daten.', order: 'Die Abreise muss nach der Anreise liegen.' },
    en: { bad: 'Please check your email, phone and dates.', order: 'Departure must be after arrival.' }
  };
  function m(k) { var l = window.__lang || 'fr'; return (L[l] || L.fr)[k]; }
  function fail(msg) { err.textContent = msg; err.classList.add('show'); }
  function clear() { err.textContent = ''; err.classList.remove('show'); }
  function finish() { f.style.display = 'none'; done.style.display = 'block'; }

  f.addEventListener('submit', async function (e) {
    e.preventDefault();
    clear();
    // piège anti-robots : champ caché rempli = on fait semblant que tout s'est bien passé
    if (f.elements['website'] && f.elements['website'].value) { finish(); return; }
    var email = f.email.value.trim(), tel = (f.tel && f.tel.value) ? f.tel.value.trim() : '',
        start = f.start.value, end = f.end.value, guests = (f.guests && f.guests.value) ? f.guests.value : '';
    var cabs = [].slice.call(f.querySelectorAll('input[name=cabin]:checked')).map(function (c) { return c.value; });
    if (!email || !/.+@.+\..+/.test(email) || !tel || !start || !end) { fail(m('bad')); return; }
    if (end <= start) { fail(m('order')); return; }
    if (!cabs.length) cabs = ["N'importe laquelle"];
    var btn = f.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;
    // envoi direct (n'ouvre pas le logiciel mail) ; repli mailto si la clé Web3Forms n'est pas renseignée
    var ok = false;
    try {
      ok = await window.cdmSendForm({
        email: email, telephone: (tel || '—'), arrivee: start, depart: end,
        personnes: (guests || '—'), cabanes: cabs.join(', '),
        langue: (window.__lang || 'fr'), replyto: email
      }, 'Alerte disponibilité — ' + cabs.join(', '));
    } catch (x) { ok = false; }
    if (!ok) {
      var subj = encodeURIComponent('Alerte disponibilité — ' + cabs.join(', '));
      var body = encodeURIComponent('Bonjour,\n\nMerci de me prévenir si une cabane se libère :\n\nCabane(s) : ' + cabs.join(', ') + '\nArrivée : ' + start + '\nDépart : ' + end + '\nNombre de personnes : ' + guests + '\nE-mail : ' + email + '\nTéléphone : ' + tel + '\n\nMerci !');
      window.location.href = 'mailto:info@lescabanesdemarie.com?subject=' + subj + '&body=' + body;
    }
    if (btn) btn.disabled = false;
    finish();
  });
})();
