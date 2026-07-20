/* =========================================================================
   Les Cabanes de Marie — envoi des formulaires SANS ouvrir le logiciel mail.
   Utilise Web3Forms (gratuit, aucun serveur, aucun DNS à toucher).

   >>> POUR ACTIVER (1 minute) :
   1. Aller sur  https://web3forms.com
   2. Saisir l'e-mail de réception : info@lescabanesdemarie.com
   3. La clé (Access Key) arrive par e-mail — la coller ci-dessous à la place
      de PLACEHOLDER, entre les guillemets.

   Tant que la clé n'est pas renseignée, les formulaires continuent de
   fonctionner via l'e-mail classique (mailto) : rien ne casse.
   La clé est prévue pour être publique (elle n'envoie qu'à VOTRE adresse).
   ========================================================================= */
window.CDM_FORM_KEY = "PLACEHOLDER";

/* Vrai si une clé valable a été renseignée. */
window.cdmFormReady = function () {
  var k = window.CDM_FORM_KEY;
  return !!(k && k !== "PLACEHOLDER" && k.length > 20);
};

/* Envoie le formulaire. Renvoie true si parti, false sinon (=> repli mailto). */
window.cdmSendForm = async function (fields, subject) {
  if (!window.cdmFormReady()) return false;
  try {
    var body = Object.assign({
      access_key: window.CDM_FORM_KEY,
      subject: subject || "Message du site — Les Cabanes de Marie",
      from_name: "Site Les Cabanes de Marie"
    }, fields);
    var r = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    });
    var d = {};
    try { d = await r.json(); } catch (e) {}
    return !!(r.ok && d.success);
  } catch (e) {
    return false;
  }
};
