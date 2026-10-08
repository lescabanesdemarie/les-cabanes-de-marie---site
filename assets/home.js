/* =====================================================================
   Les Cabanes de Marie — comportements propres à la page d'accueil
   · barre de progression de lecture
   · repères latéraux (« parcours ») : met en évidence la partie en cours
   · formulaire « cabane complète ? » (alerte de disponibilité)
   ===================================================================== */
(function () {
  'use strict';
  var D = document;

  /* ---- progression + repère actif (au défilement) ---- */
  var prog = D.getElementById('prog');
  var rail = [].slice.call(D.querySelectorAll('.rail a'));
  var map = { story: 'story', cabanes: 'cabanes', camille: 'cabanes', mathis: 'cabanes', alanis: 'cabanes', mila: 'cabanes',
              disponibilites: 'cabanes', 'alerte-dispo': 'cabanes', spa: 'spa', paniers: 'saveurs', boissons: 'saveurs',
              domaine: 'domaine', activites: 'activites', avis: 'reserver', 'bons-cadeaux': 'reserver', tarifs: 'reserver', infos: 'reserver' };
  var secs = Object.keys(map).map(function (id) { return D.getElementById(id); }).filter(Boolean);
  var ticking = false;
  function frame() {
    ticking = false;
    var h = D.documentElement.scrollHeight - window.innerHeight;
    if (prog && h > 0) prog.style.width = (window.scrollY / h * 100) + '%';
    var cur = null, line = window.innerHeight * 0.45;
    for (var i = 0; i < secs.length; i++) { if (secs[i].getBoundingClientRect().top <= line) cur = map[secs[i].id]; }
    rail.forEach(function (a) { a.classList.toggle('on', !!cur && a.getAttribute('data-t') === cur); });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  window.addEventListener('resize', frame);
  frame();

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
