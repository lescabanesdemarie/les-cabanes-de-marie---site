# Outils de fabrication, de vérification et de maintenance

Ces scripts ne sont **pas publiés** sur le site (`tools/` et `src/` sont exclus par `.vercelignore`).
Ils se lancent depuis la racine du dépôt, dans PowerShell.

## Comment le site est fait (à lire en premier)

Le site existe en trois langues, **une adresse par langue** :

| Langue | Adresses |
|---|---|
| français | `/`, `/cabane-mathis.html`, `/faq.html`… (à la racine) |
| allemand | `/de/`, `/de/cabane-mathis.html`… |
| anglais | `/en/`, `/en/cabane-mathis.html`… |

Chaque page est un fichier HTML **statique, déjà écrit dans sa langue** (rien n'est traduit par JavaScript).
Ces fichiers sont **fabriqués** par `tools/build.ps1` à partir des sources :

- `src/*.html` — les pages en français, avec `data-i="clé"` sur chaque texte à traduire, et en bas de chaque page
  le dictionnaire `window.CDM_I18N` (allemand, anglais) ;
- `src/i18n/chrome.json` — allemand et anglais du menu, du pied de page et des textes partagés des pages cabane ;
- `src/i18n/site.json` — **titre et description de chaque page dans chaque langue** (60 / 155 caractères au plus),
  adresse, téléphone, coordonnées GPS, saison, images du référencement ;
- `src/i18n/alt.json` — textes alternatifs des photos en allemand et en anglais (la clé est le texte français) ;
- `tools/chrome/*.html` — menu, tiroir téléphone, pied de page, en-tête commun (écrits une seule fois).

**Ne jamais modifier à la main** les pages de la racine, de `de/` et de `en/`, ni `robots.txt` / `sitemap.xml` :
ils sont écrasés à chaque fabrication.

## Après chaque modification (obligatoire)

```
powershell -ExecutionPolicy Bypass -File tools/build.ps1
powershell -ExecutionPolicy Bypass -File tools/check-site.ps1
```

`build.ps1` fabrique les 31 pages (10 pages × 3 langues + la page 404), `robots.txt` et `sitemap.xml`, et refuse de
finir (liste des problèmes, code de sortie 1) si une traduction manque, si un texte alternatif n'est pas traduit, si un
titre ou une description est trop long ou en double, ou si une page n'a pas exactement un `<h1>`. Il ajoute aussi les
empreintes `?v=…` des `.css` / `.js` (indispensable : `/assets/*` est mis en cache un an).

`check-site.ps1` contrôle ensuite le résultat : fichiers tronqués, `</html>`, UTF-8, liens / images / ancres qui
existent (y compris hreflang, canonical et sitemap), images en base64 interdites, liens morts connus, clés secrètes,
fichiers devenus inutiles, et **fichier de police Cabinet Grotesk déposé par erreur dans le dépôt** (interdit par sa licence).
Code de sortie 0 = tout est bon ; 1 = ne pas publier.

`build.ps1 -Preview -Out <dossier>` fabrique une copie d'aperçu dont les liens visent `index.html` (pour une visionneuse
sans serveur) ; le vrai site utilise des adresses propres (`/`, `/de/`, `/en/`).

## Ouvrir le site à Google (le jour du lancement)

Une seule variable, en haut de `tools/build.ps1` : **`$INDEXABLE = $false`**.
Tant qu'elle vaut `$false`, chaque page porte `noindex`, `robots.txt` interdit tout et `sitemap.xml` n'est pas annoncé.
Le jour du lancement : la passer à `$true`, relancer `build.ps1` puis `check-site.ps1`, publier. Le `noindex` disparaît
partout, `robots.txt` autorise tout et annonce `sitemap.xml`.

## Référencement : ce que la fabrication écrit dans chaque page

- `<html lang>` de la langue, `<title>` et description (de `src/i18n/site.json`) ;
- `canonical` vers sa propre adresse, `hreflang` fr / de / en + `x-default` (vers le français) sur toutes les versions ;
- `og:locale` (fr_CH, de_CH, en_GB) et les balises de partage ;
- accueil : données structurées `LodgingBusiness` (adresse, téléphone, coordonnées, photos, arrivée / départ, saison à venir),
  **sans note moyenne** (Google n'affiche pas les étoiles pour ses propres avis) ; FAQ : `FAQPage` dans la langue de la page ;
- le sélecteur FR / DE / EN est fait de liens vers la page équivalente ; aucune redirection selon la langue du navigateur.

## Redirections (anciennes adresses)

À faire quand la liste exacte des anciennes adresses sera connue : ajouter dans `vercel.json` une rubrique `redirects`,
avec une ligne par ancienne adresse : `{ "source": "/ancienne-adresse", "destination": "/nouvelle-adresse.html", "permanent": true }`.
En attendant, les noms de fichiers restent ceux d'aujourd'hui. (Des redirections de `/index.html` ont fait échouer le déploiement
Vercel le 27/10 : retirées, la balise canonical suffit.)

## Photos

Les grandes photos existent en plusieurs largeurs (fichiers `-560`, `-800`, `-900`, `-1280`… en WebP) ; la page les
annonce avec `srcset` / `sizes` et le navigateur prend la plus petite qui suffit. Les photos sous la ligne de flottaison
sont en `loading="lazy"` ; la photo d'entrée est préchargée (`<!--build:hero-preload-->` dans `src/index.html`).
Les JPEG `mathis-1`, `alanis-2`, `camille-1`, `mila-1` et `share.jpg` restent en JPEG : ce sont les images de partage.

## La police (licence)

Le site est en **Cabinet Grotesk** (Indian Type Foundry, via Fontshare). Licence : https://www.fontshare.com/licenses/itf-ffl
(version 2.0 du 17 août 2026). L'usage commercial et l'**auto-hébergement sur son propre site sont autorisés** (§01), l'API
Fontshare est facultative ; mais le §02 **interdit de redistribuer la police via un dépôt ou un serveur public** et le dépôt GitHub
du site est **public** : on ne met donc **aucun fichier** Cabinet Grotesk dans le dépôt, la police se charge depuis
les serveurs de Fontshare (3 adresses `cdn.fontshare.com` déclarées dans **`assets/fonts.css`, le seul endroit à modifier**). Pour passer en
auto-hébergement : passer d'abord le dépôt en **privé** (Réglages du dépôt GitHub, par Marie), puis déposer les .woff2 officiels (sans les
modifier ni les « subsetter ») dans `assets/fonts/` et remplacer les 3 adresses dans `assets/fonts.css` (mode d'emploi en tête de ce fichier) ;
retirer ensuite les lignes « fontshare » de `tools/chrome/head.html` et Fontshare de la page Confidentialité.
Le temps du chargement, une police de secours aux mesures voisines (Hanken Grotesk, `assets/fonts/`,
voir `assets/fonts.css`) évite que la page « saute ».

## Formulaires

`assets/forms.js` : la clé Web3Forms est en `PLACEHOLDER` tant que Marie ne l'a pas fournie ; d'ici là, les formulaires
de contact et d'alerte ouvrent un e-mail prérempli (repli `mailto`). La page Confidentialité mentionne Web3Forms.

## Où modifier quoi

| Je veux changer… | Où |
|---|---|
| un texte français | `src/<page>.html` (élément `data-i="clé"`), puis `build.ps1` |
| sa traduction DE / EN | dictionnaire `window.CDM_I18N` en bas de `src/<page>.html` |
| un texte du menu / pied de page (FR) | `tools/chrome/header.html` / `footer.html` ; DE / EN : `src/i18n/chrome.json` |
| le titre ou la description d'une page (Google) | `src/i18n/site.json` |
| le texte alternatif d'une photo en DE / EN | `src/i18n/alt.json` |
| les couleurs, la police, les boutons, la largeur du contenu (`--wrap`) | `assets/site.css` (variables `:root` en haut du fichier) |
| les sections de l'accueil | `assets/home.css` (et `src/index.html`) |
| une cabane (accueil ET pages cabane : le rêve, « Dans cette cabane », la bande pratique, la galerie) | `assets/site.css`, section « une cabane » |
| la photo d'accueil en plein cadre et son dégradé sombre | `assets/home.css` (section « entrée ») ; photo portrait pour téléphone : `assets/img/hero-bg-portrait*.webp` |
| le rappel d'avis (avant la rupture) / les avis complets (en bas) | `src/index.html` (`#avis-rappel`, clés `rev.*` / `#avis`, clés `av.*`) |
| ce qui s'efface pendant la rupture (barre « Réserver », bouton d'Edith) | `assets/home.js` (classe `hush`) et `assets/site.css` (`body.hush`) |
| la barre du haut (logo seul, retour au défilement vers le haut / souris / clavier ; tout s'efface pendant la rupture) | `assets/site.js` (bloc « barre du haut ») et `assets/site.css` (`.bar-min`, `.bar-off`, `.bar-ondark`) |
| la phrase de la « rupture » et sa flèche | `src/index.html` (section `#rupture`, clés `rupt.*`) et `assets/home.js` |
| les 4 citations du sommaire des cabanes | `src/index.html` (clés `q.mathis`, `q.alanis`, `q.camille`, `q.mila`) |
| le calendrier d'une cabane (« Voir les dates ») | `assets/home.js` (identifiants Planyo dans `src/index.html`, attribut `data-res`) |
| Edith (chatbot) : aspect / comportement / consigne | `assets/site.css` (`.cc-*`) / `assets/edith.js` / `api/edith.js` |
