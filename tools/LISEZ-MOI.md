# Outils de vérification et de maintenance

Ces scripts ne sont **pas publiés** sur le site (dossier `tools/` exclu par `.vercelignore`).
Ils se lancent depuis la racine du dépôt, dans PowerShell.

## Avant chaque publication (obligatoire)

```
powershell -ExecutionPolicy Bypass -File tools/check-site.ps1 -Stamp
```

Contrôle : fichiers tronqués ou minuscules (le fameux « upload de 2 octets »), `</html>` présent,
UTF-8, liens / images / ancres qui existent, images en base64 interdites, traductions FR/DE/EN
complètes, liens Wix / Google Fonts / liens morts, clés secrètes, fichiers devenus inutiles, et
**fichier de police Cabinet Grotesk déposé par erreur dans le dépôt** (interdit par sa licence).
`-Stamp` met à jour les empreintes `?v=…` des fichiers `.css` / `.js` : indispensable, car
`/assets/*` est mis en cache **un an** (sans empreinte, les visiteurs garderaient l'ancienne version).
Code de sortie 0 = tout est bon ; 1 = ne pas publier.

## Changer le menu, le pied de page ou la police

Le menu, le tiroir mobile, le pied de page, la barre « Réserver » et le chargement de la police sont
écrits **une seule fois** :

- `tools/chrome/header.html` — en-tête et menu
- `tools/chrome/footer.html` — pied de page (dont l'ordre des cabanes : Mathis, Alanis, Camille, Mila)
- `tools/chrome/head.html` — chargement de la police **Cabinet Grotesk depuis Fontshare** (voir plus bas)

Après modification : `powershell -ExecutionPolicy Bypass -File tools/sync-chrome.ps1`
(recopie les blocs dans toutes les pages ; `-Check` vérifie seulement).

## La police (licence)

Le site est en **Cabinet Grotesk** (Indian Type Foundry, via Fontshare). Sa licence autorise l'usage
commercial mais **interdit de la redistribuer depuis un dépôt public** : on ne met donc **aucun fichier**
Cabinet Grotesk dans le dépôt, la police se charge depuis `api.fontshare.com` (voir `tools/chrome/head.html`).
Le temps du chargement, une police de secours aux mesures voisines (Hanken Grotesk, `assets/fonts/`,
voir `assets/fonts.css`) évite que la page « saute ». La page Confidentialité mentionne Fontshare.

## Où modifier quoi

| Je veux changer… | Où |
|---|---|
| un texte français | directement dans la page HTML (`data-i="clé"`) |
| sa traduction DE / EN | dictionnaire `window.CDM_I18N` en bas de la page |
| un texte du menu / pied de page (DE / EN) | `assets/site.js` (objet `CHROME`) |
| les couleurs, la police, les boutons | `assets/site.css` (variables `:root` en haut du fichier) |
| les sections de l'accueil | `assets/home.css` (et `index.html`) |
| la phrase de la « rupture » et sa flèche | `index.html` (section `#rupture`, clés `rupt.*`) et `assets/home.js` |
| les 4 citations du sommaire des cabanes | `index.html` (clés `q.mathis`, `q.alanis`, `q.camille`, `q.mila`) |
| le calendrier d'une cabane (« Voir les dates ») | `assets/home.js` (identifiants Planyo dans `index.html`, attribut `data-res`) |
| Edith (chatbot) : aspect / comportement / consigne | `assets/site.css` (`.cc-*`) / `assets/edith.js` / `api/edith.js` |
