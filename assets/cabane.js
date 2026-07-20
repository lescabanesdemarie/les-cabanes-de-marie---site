/* Les Cabanes de Marie — pages cabane : multilingue FR/DE/EN + sync langue Planyo.
   Le FR est dans le HTML (data-i / data-i-ph). Le DE/EN vient de window.CDM_I18N.
   La langue est mémorisée dans localStorage 'cdm_lang' (partagée avec le site). */
(function(){
  // Textes d'interface partagés par toutes les cabanes (le FR est dans le HTML).
  var SHARED = {
    de:{
      "ui.book":"Diese Hütte reservieren","ui.check":"Verfügbarkeiten prüfen","ui.gift":"Gutschein verschenken",
      "ui.aboutEb":"Die Hütte","ui.aboutH":"Willkommen in Ihrer Hütte",
      "ui.incEb":"Inbegriffen","ui.incH":"Was Sie erwartet",
      "inc.1":"Lokales Frühstück inklusive, im Korb bis zur Hütte gebracht.",
      "inc.2":"Zugang zum Öko-Spa: Holzfeuer-Bad und Sauna.",
      "inc.3":"Bettwäsche, Handtücher und Heizung inklusive.",
      "inc.4":"Check-in ab 16 Uhr · Check-out vor 11 Uhr.",
      "inc.5":"Ca. 30 Min. von Lausanne, nahe Yverdon — Ogens (VD).",
      "ui.availEb":"Verfügbarkeiten","ui.availH":"Reservieren Sie Ihre Daten",
      "ui.availLead":"Sehen Sie den Live-Kalender und reservieren Sie in wenigen Klicks online.",
      "ui.footQ":"Eine Frage? Rufen Sie uns an — wir sprechen gern darüber.",
      "ui.backSite":"Das ganze Anwesen entdecken"
    },
    en:{
      "ui.book":"Book this cabin","ui.check":"Check availability","ui.gift":"Gift a voucher",
      "ui.aboutEb":"The cabin","ui.aboutH":"Welcome to your cabin",
      "ui.incEb":"Included","ui.incH":"What awaits you",
      "inc.1":"Local breakfast included, brought up to the cabin in a basket.",
      "inc.2":"Access to the Eco-Spa: wood-fired bath and sauna.",
      "inc.3":"Linens, towels and heating provided.",
      "inc.4":"Check-in from 4pm · check-out before 11am.",
      "inc.5":"About 30 min from Lausanne, near Yverdon — Ogens (VD).",
      "ui.availEb":"Availability","ui.availH":"Book your dates",
      "ui.availLead":"Check the live calendar, then book online in a few clicks.",
      "ui.footQ":"A question? Call us — we love to chat.",
      "ui.backSite":"Discover the whole estate"
    }
  };
  var page = window.CDM_I18N || {};
  var I18N = {
    de: Object.assign({}, SHARED.de, page.de || {}),
    en: Object.assign({}, SHARED.en, page.en || {})
  };
  var cache = {}, phCache = {};
  document.querySelectorAll('[data-i]').forEach(function(el){ cache[el.dataset.i] = el.innerHTML; });
  document.querySelectorAll('[data-i-ph]').forEach(function(el){ phCache[el.dataset.iPh] = el.getAttribute('placeholder') || ''; });

  function withLang(v, L){
    return /custom-language=[A-Za-z]*/.test(v)
      ? v.replace(/custom-language=[A-Za-z]*/, 'custom-language=' + L)
      : v + (v.indexOf('?') > -1 ? '&' : '?') + 'custom-language=' + L;
  }
  function updatePlanyoLang(l){
    var L = (l || 'fr').toUpperCase();
    document.querySelectorAll("iframe[src*='planyo.com']").forEach(function(f){
      var s = f.getAttribute('src'); if(!s) return;
      var ns = withLang(s, L); if(ns !== s) f.setAttribute('src', ns);
    });
    document.querySelectorAll("a[href*='planyo.com']").forEach(function(a){
      var h = a.getAttribute('href'); if(!h) return;
      var nh = withLang(h, L); if(nh !== h) a.setAttribute('href', nh);
    });
  }
  function setLang(l){
    document.documentElement.lang = l;
    document.querySelectorAll('[data-i]').forEach(function(el){
      var k = el.dataset.i;
      if(l === 'fr'){ if(cache[k] != null) el.innerHTML = cache[k]; }
      else if(I18N[l] && I18N[l][k] != null){ el.innerHTML = I18N[l][k]; }
    });
    document.querySelectorAll('[data-i-ph]').forEach(function(el){
      var k = el.dataset.iPh;
      if(l === 'fr'){ if(phCache[k] != null) el.setAttribute('placeholder', phCache[k]); }
      else if(I18N[l] && I18N[l]['ph.' + k] != null){ el.setAttribute('placeholder', I18N[l]['ph.' + k]); }
    });
    document.querySelectorAll('.lang-b').forEach(function(b){ b.classList.toggle('on', b.dataset.l === l); });
    updatePlanyoLang(l);
    try{ localStorage.setItem('cdm_lang', l); }catch(e){}
    window.__lang = l;
  }
  window.cdmSetLang = setLang;

  document.querySelectorAll('.lang-b').forEach(function(b){
    b.addEventListener('click', function(){ setLang(b.dataset.l); });
  });

  var saved; try{ saved = localStorage.getItem('cdm_lang'); }catch(e){}
  if(saved && saved !== 'fr' && I18N[saved]) setLang(saved); else updatePlanyoLang('fr');
})();
