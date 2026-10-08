/* =====================================================================
   Les Cabanes de Marie — Edith, la concierge virtuelle (widget unique pour TOUTES les pages)
   Inclure : <script src="assets/edith.js" defer></script>
   Le widget n'envoie que les messages à /api/edith : la consigne d'Edith vit côté serveur
   (api/edith.js). L'aspect est dans assets/site.css (classes .cc-*).
   Langue lue dans localStorage 'cdm_lang' et mise à jour quand on change de langue.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__edithLoaded) return;
  window.__edithLoaded = true;

  var T = {
    fr: { fab: 'Une question ?', sub: 'En ligne · Les Cabanes de Marie', title: 'Edith — Concierge',
          hi: 'Bonjour 🐶 Je suis Edith, la concierge des Cabanes de Marie. Une nuit perchée dans les arbres vous tente ? Posez-moi vos questions — cabanes, spa, repas, réservation…',
          q: ['Quelle cabane pour 2 ?', "C'est ouvert en hiver ?", 'Le spa, ça marche comment ?'],
          ph: 'Votre question…', send: 'Envoyer', close: 'Fermer',
          err: 'Oups, petite panne de connexion. Réessayez dans un instant.',
          empty: "Désolée, je n'ai pas pu répondre. Réessayez dans un instant.",
          busy: 'Je reçois beaucoup de questions en ce moment. Réessayez dans quelques minutes, ou appelez-nous au +41 79 534 71 15.' },
    de: { fab: 'Eine Frage?', sub: 'Online · Les Cabanes de Marie', title: 'Edith — Concierge',
          hi: 'Hallo 🐶 Ich bin Edith, die Concierge von Les Cabanes de Marie. Lust auf eine Nacht in den Bäumen? Fragen Sie mich — Hütten, Spa, Mahlzeiten, Reservierung…',
          q: ['Welche Hütte für 2?', 'Im Winter geöffnet?', 'Wie funktioniert das Spa?'],
          ph: 'Ihre Frage…', send: 'Senden', close: 'Schliessen',
          err: 'Ups, kleine Verbindungsstörung. Bitte gleich nochmals.',
          empty: 'Entschuldigung, ich konnte nicht antworten. Bitte gleich nochmals.',
          busy: 'Ich bekomme gerade viele Fragen. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns an: +41 79 534 71 15.' },
    en: { fab: 'A question?', sub: 'Online · Les Cabanes de Marie', title: 'Edith — Concierge',
          hi: "Hello 🐶 I'm Edith, the concierge of Les Cabanes de Marie. Fancy a night up in the trees? Ask me anything — cabins, spa, meals, booking…",
          q: ['Which cabin for 2?', 'Open in winter?', 'How does the spa work?'],
          ph: 'Your question…', send: 'Send', close: 'Close',
          err: 'Oops, a little connection hiccup. Please try again in a moment.',
          empty: "Sorry, I couldn't reply. Please try again in a moment.",
          busy: "I'm getting a lot of questions right now. Please try again in a few minutes, or call us on +41 79 534 71 15." }
  };
  function lang() { try { var l = localStorage.getItem('cdm_lang'); return T[l] ? l : 'fr'; } catch (e) { return 'fr'; } }

  var t = T[lang()];
  var fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'cc-fab'; fab.id = 'ccFab';
  fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML = '<span class="cc-ico" role="img" aria-label="Edith"></span><span class="cc-txt"></span>';

  var panel = document.createElement('div');
  panel.className = 'cc-panel'; panel.id = 'ccPanel';
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Edith');
  panel.innerHTML =
      '<div class="cc-head"><div class="av" role="img" aria-label="Edith"></div>'
    + '<div><h4></h4><p><i class="cdot"></i><span class="cc-sub"></span></p></div>'
    + '<button type="button" class="cx" id="ccX">✕</button></div>'
    + '<div class="cc-body" id="ccBody" aria-live="polite"></div>'
    + '<div class="cc-chips" id="ccChips"></div>'
    + '<div class="cc-bar"><input id="ccInput" type="text" autocomplete="off" maxlength="600"><button type="button" id="ccSend">➤</button></div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body = panel.querySelector('#ccBody'), input = panel.querySelector('#ccInput'),
      send = panel.querySelector('#ccSend'), x = panel.querySelector('#ccX'), chips = panel.querySelector('#ccChips');
  var hist = [], greeted = false, busy = false;

  function paint() {
    t = T[lang()];
    fab.querySelector('.cc-txt').textContent = t.fab;
    panel.querySelector('h4').textContent = t.title;
    panel.querySelector('.cc-sub').textContent = t.sub;
    input.placeholder = t.ph; input.setAttribute('aria-label', t.ph);
    send.setAttribute('aria-label', t.send); x.setAttribute('aria-label', t.close);
    chips.innerHTML = '';
    if (!hist.length) {
      t.q.forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'cc-chip'; b.textContent = q;
        b.addEventListener('click', function () { ask(q); });
        chips.appendChild(b);
      });
    }
    if (!greeted) { body.innerHTML = ''; add('bot', t.hi); greeted = true; }
  }
  function add(role, txt) {
    var d = document.createElement('div');
    d.className = 'cc-msg ' + (role === 'user' ? 'user' : 'bot');
    // le texte reçu est affiché comme du TEXTE (jamais interprété comme du HTML) ; seul **gras** est mis en forme
    String(txt).split('\n').forEach(function (line, i) {
      if (i) d.appendChild(document.createElement('br'));
      line.split(/(\*\*[^*]+\*\*)/).forEach(function (part) {
        if (/^\*\*[^*]+\*\*$/.test(part)) { var s = document.createElement('strong'); s.textContent = part.slice(2, -2); d.appendChild(s); }
        else if (part) d.appendChild(document.createTextNode(part));
      });
    });
    body.appendChild(d); body.scrollTop = body.scrollHeight;
  }
  function typing(on) {
    var el = document.getElementById('ccTyping');
    if (on && !el) {
      el = document.createElement('div'); el.id = 'ccTyping'; el.className = 'cc-typing';
      el.innerHTML = '<span></span><span></span><span></span>'; body.appendChild(el); body.scrollTop = body.scrollHeight;
    } else if (!on && el) { el.remove(); }
  }
  function ask(text) {
    text = String(text || '').trim();
    if (!text || busy) return Promise.resolve();
    busy = true;
    add('user', text); hist.push({ role: 'user', content: text });
    input.value = ''; send.disabled = true; chips.innerHTML = ''; typing(true);
    return fetch('/api/edith', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: hist }) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (data) {
          if (r.status === 429) return { fail: T[lang()].busy };
          if (!r.ok) return { fail: T[lang()].err };
          var reply = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n').trim();
          return reply ? { ok: reply } : { fail: T[lang()].empty };
        });
      })
      .catch(function () { return { fail: T[lang()].err }; })
      .then(function (res) {
        typing(false);
        if (res.ok) { hist.push({ role: 'assistant', content: res.ok }); add('bot', res.ok); }
        else { hist.pop(); add('bot', res.fail); }
        busy = false; send.disabled = false; input.focus();
      });
  }

  function open() { paint(); panel.classList.add('open'); fab.classList.add('hide'); fab.setAttribute('aria-expanded', 'true'); setTimeout(function () { input.focus(); }, 250); }
  function close() { panel.classList.remove('open'); fab.classList.remove('hide'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
  fab.addEventListener('click', open);
  x.addEventListener('click', close);
  send.addEventListener('click', function () { ask(input.value); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(input.value); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
  document.addEventListener('cdm:lang', function () { greeted = hist.length > 0; paint(); });
  paint();
})();
