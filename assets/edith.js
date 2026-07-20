/* Les Cabanes de Marie — widget Edith réutilisable.
   Inclure sur n'importe quelle page :  <script src="assets/edith.js" defer></script>
   Appelle /api/edith SANS prompt système -> le serveur applique son prompt par défaut.
   Langue lue depuis localStorage 'cdm_lang' (fr par défaut). */
(function(){
  if (window.__edithLoaded) return;
  window.__edithLoaded = true;

  var T = {
    fr:{ fab:"Une question ?", sub:"En ligne · Les Cabanes de Marie",
         hi:"Bonjour 🐶 Je suis Edith, la concierge des Cabanes de Marie. Une nuit perchée dans les arbres vous tente ? Posez-moi vos questions — cabanes, spa, repas, réservation…",
         q:["Quelle cabane pour 2 ?","C'est ouvert en hiver ?","Le spa, ça marche comment ?"],
         ph:"Votre question…", err:"Oups, petite panne de connexion. Réessayez dans un instant 🌿",
         empty:"Désolée, je n'ai pas pu répondre. Réessayez dans un instant 🌿" },
    de:{ fab:"Eine Frage?", sub:"Online · Les Cabanes de Marie",
         hi:"Hallo 🐶 Ich bin Edith, die Concierge von Les Cabanes de Marie. Lust auf eine Nacht in den Bäumen? Fragen Sie mich — Hütten, Spa, Mahlzeiten, Reservierung…",
         q:["Welche Hütte für 2?","Im Winter geöffnet?","Wie funktioniert das Spa?"],
         ph:"Ihre Frage…", err:"Ups, kleine Verbindungsstörung. Bitte gleich nochmals 🌿",
         empty:"Entschuldigung, ich konnte nicht antworten. Bitte gleich nochmals 🌿" },
    en:{ fab:"A question?", sub:"Online · Les Cabanes de Marie",
         hi:"Hello 🐶 I'm Edith, the concierge of Les Cabanes de Marie. Fancy a night up in the trees? Ask me anything — cabins, spa, meals, booking…",
         q:["Which cabin for 2?","Open in winter?","How does the spa work?"],
         ph:"Your question…", err:"Oops, a little connection hiccup. Please try again in a moment 🌿",
         empty:"Sorry, I couldn't reply. Please try again in a moment 🌿" }
  };
  function lang(){ try{ var l=localStorage.getItem('cdm_lang'); return T[l]?l:'fr'; }catch(e){ return 'fr'; } }

  var css = ""
    + ".cc-fab{position:fixed;right:20px;bottom:20px;z-index:9600;display:flex;align-items:center;gap:10px;background:#222C18;color:#F2ECDF;border:none;padding:13px 20px 13px 14px;border-radius:50px;cursor:pointer;font-family:'Hanken Grotesk',sans-serif;font-size:.9rem;font-weight:600;box-shadow:0 18px 40px -16px rgba(0,0,0,.6);transition:transform .3s,opacity .3s}"
    + ".cc-fab:hover{transform:translateY(-3px)}"
    + ".cc-fab .cc-ico{width:30px;height:30px;border-radius:50%;background:linear-gradient(140deg,#CBA968,#B5663B);display:flex;align-items:center;justify-content:center;font-size:.95rem}"
    + ".cc-fab.hide{transform:translateY(120px);opacity:0;pointer-events:none}"
    + ".cc-panel{position:fixed;right:20px;bottom:20px;z-index:9600;width:min(380px,calc(100vw - 32px));height:min(560px,calc(100svh - 100px));background:#FBF7EE;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 30px 70px -30px rgba(0,0,0,.65);transform:translateY(24px) scale(.96);opacity:0;pointer-events:none;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .35s}"
    + ".cc-panel.open{transform:none;opacity:1;pointer-events:auto}"
    + ".cc-head{background:#222C18;color:#F2ECDF;padding:16px 18px;display:flex;align-items:center;gap:12px}"
    + ".cc-head .av{width:42px;height:42px;border-radius:50%;background:linear-gradient(140deg,#CBA968,#B5663B);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}"
    + ".cc-head h4{font-family:'Fraunces',serif;font-weight:400;font-size:1.1rem;line-height:1.1;margin:0}"
    + ".cc-head p{font-size:.72rem;color:rgba(242,236,223,.65);display:flex;align-items:center;gap:6px;margin:2px 0 0}"
    + ".cc-head .cdot{width:7px;height:7px;border-radius:50%;background:#7fb069;box-shadow:0 0 0 3px rgba(127,176,105,.25)}"
    + ".cc-head .cx{margin-left:auto;background:none;border:none;color:rgba(242,236,223,.7);font-size:1.05rem;cursor:pointer;padding:4px}"
    + ".cc-body{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:13px}"
    + ".cc-msg{max-width:86%;padding:11px 15px;border-radius:16px;font-size:.92rem;line-height:1.5}"
    + ".cc-msg.bot{background:#fff;border:1px solid rgba(34,31,24,.16);border-bottom-left-radius:4px;align-self:flex-start;color:#33302a}"
    + ".cc-msg.user{background:#222C18;color:#F2ECDF;border-bottom-right-radius:4px;align-self:flex-end}"
    + ".cc-msg.bot strong{color:#B5663B}"
    + ".cc-typing{align-self:flex-start;background:#fff;border:1px solid rgba(34,31,24,.16);padding:13px 16px;border-radius:16px;border-bottom-left-radius:4px;display:flex;gap:5px}"
    + ".cc-typing span{width:6px;height:6px;border-radius:50%;background:#6E7C52;animation:ccb 1.2s infinite}"
    + ".cc-typing span:nth-child(2){animation-delay:.15s}.cc-typing span:nth-child(3){animation-delay:.3s}"
    + "@keyframes ccb{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}"
    + ".cc-chips{display:flex;gap:7px;flex-wrap:wrap;padding:0 16px 10px}"
    + ".cc-chip{background:transparent;border:1px solid rgba(34,31,24,.16);color:#222C18;padding:8px 12px;border-radius:30px;font-size:.78rem;cursor:pointer;font-family:inherit;transition:.25s}"
    + ".cc-chip:hover{background:#222C18;color:#F2ECDF;border-color:#222C18}"
    + ".cc-bar{padding:12px 14px 14px;border-top:1px solid rgba(34,31,24,.16);display:flex;gap:8px;background:#FBF7EE}"
    + ".cc-bar input{flex:1;border:1px solid rgba(34,31,24,.16);background:#fff;border-radius:30px;padding:11px 16px;font-family:inherit;font-size:.9rem;outline:none}"
    + ".cc-bar input:focus{border-color:#6E7C52;box-shadow:0 0 0 3px rgba(110,124,82,.15)}"
    + ".cc-bar button{width:44px;height:44px;border-radius:50%;border:none;background:#B5663B;color:#fff;cursor:pointer;flex-shrink:0}"
    + ".cc-bar button:disabled{opacity:.5;cursor:not-allowed}"
    + ".cc-body::-webkit-scrollbar{width:6px}.cc-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:10px}";
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var t = T[lang()];
  var fab = document.createElement('button');
  fab.className = 'cc-fab'; fab.id = 'ccFab'; fab.setAttribute('aria-label','Edith');
  fab.innerHTML = '<span class="cc-ico">🐾</span><span class="cc-txt">'+t.fab+'</span>';

  var panel = document.createElement('div');
  panel.className = 'cc-panel'; panel.id = 'ccPanel';
  panel.innerHTML =
      '<div class="cc-head"><div class="av">🐶</div>'
    + '<div><h4>Edith — Concierge</h4><p><i class="cdot"></i> <span class="cc-sub">'+t.sub+'</span></p></div>'
    + '<button class="cx" id="ccX" aria-label="Fermer">✕</button></div>'
    + '<div class="cc-body" id="ccBody"></div>'
    + '<div class="cc-chips" id="ccChips"></div>'
    + '<div class="cc-bar"><input id="ccInput" autocomplete="off"><button id="ccSend" aria-label="Send">➤</button></div>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  var body=panel.querySelector('#ccBody'), input=panel.querySelector('#ccInput'),
      send=panel.querySelector('#ccSend'), x=panel.querySelector('#ccX'), chips=panel.querySelector('#ccChips');
  var hist=[], greeted=false;

  function paint(){
    t = T[lang()];
    fab.querySelector('.cc-txt').textContent = t.fab;
    panel.querySelector('.cc-sub').textContent = t.sub;
    input.placeholder = t.ph;
    chips.innerHTML='';
    t.q.forEach(function(q){
      var b=document.createElement('button'); b.className='cc-chip'; b.textContent=q;
      b.addEventListener('click',function(){ ask(q); });
      chips.appendChild(b);
    });
    if(!greeted){ body.innerHTML=''; add('bot', t.hi); greeted=true; }
  }
  function add(role,txt){
    var d=document.createElement('div');
    d.className='cc-msg '+(role==='user'?'user':'bot');
    d.innerHTML=txt.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
    body.appendChild(d); body.scrollTop=body.scrollHeight;
  }
  function typing(on){
    var el=document.getElementById('ccTyping');
    if(on&&!el){ el=document.createElement('div'); el.id='ccTyping'; el.className='cc-typing';
      el.innerHTML='<span></span><span></span><span></span>'; body.appendChild(el); body.scrollTop=body.scrollHeight; }
    else if(!on&&el){ el.remove(); }
  }
  async function ask(text){
    add('user',text); hist.push({role:'user',content:text});
    input.value=''; send.disabled=true; chips.style.display='none'; typing(true);
    try{
      var r=await fetch('/api/edith',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:hist})});
      var data=await r.json();
      var reply=(data.content||[]).filter(function(b){return b.type==='text';}).map(function(b){return b.text;}).join('\n').trim() || T[lang()].empty;
      hist.push({role:'assistant',content:reply}); typing(false); add('bot',reply);
    }catch(e){ typing(false); add('bot', T[lang()].err); }
    send.disabled=false; input.focus();
  }

  fab.addEventListener('click',function(){ paint(); panel.classList.add('open'); fab.classList.add('hide'); setTimeout(function(){input.focus();},300); });
  x.addEventListener('click',function(){ panel.classList.remove('open'); fab.classList.remove('hide'); });
  send.addEventListener('click',function(){ if(input.value.trim()) ask(input.value.trim()); });
  input.addEventListener('keydown',function(e){ if(e.key==='Enter'&&input.value.trim()) ask(input.value.trim()); });

  paint();
})();
