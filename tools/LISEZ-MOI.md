# Outils de vérification et de maintenance

Ces scripts ne sont **pas publiés** sur le site (dossier `tools/` exclu par `.vercelignore`).
Ils se lancent depuis la racine du dépôt, dans PowerShell.

## Avant chaque publication (obligatoire)

```
powershell -ExecutionPolicy Bypass -File tools/check-site.ps1 -Stamp
```

Contrôle : fichiers tronqués ou minuscules (le fameux « upload de 2 octets »), `</html>` présent,
UTF-8, liens / images / ancres qui existent, images en base64 interdites, traductions FR/DE/EN
complètes, liens Wix / Google Fonts / liens morts, clés secrètes, fichiers devenus inutiles.
`-Stamp` met à jour les empreintes `?v=…` des fichiers `.css` / `.js` : indispensable, car
`/assets/*` est mis en cache **un an** (sans empreinte, les visiteurs garderaient l'ancienne version).
Code de sortie 0 = tout est bon ; 1 = ne pas publier.

## Changer le menu ou le pied de page

Le menu, le tiroir mobile, le pied de page et la barre « Réserver » sont écrits **une seule fois** :

- `tools/chrome/header.html`
- `tools/chrome/footer.html`

Après modification : `powershell -ExecutionPolicy Bypass -File tools/sync-chrome.ps1`
(recopie le bloc dans toutes les pages ; `-Check` vérifie seulement).

## Où modifier quoi

| Je veux changer… | Où |
|---|---|
| un texte français | directement dans la page HTML (`data-i="clé"`) |
| sa traduction DE / EN | dictionnaire `window.CDM_I18N` en bas de la page |
| un texte du menu / pied de page (DE / EN) | `assets/site.js` (objet `CHROME`) |
| les couleurs, polices, boutons | `assets/site.css` (variables en haut du fichier) |
| les sections de l'accueil | `assets/home.css` |
| Edith (chatbot) : aspect / comportement / consigne | `assets/site.css` (`.cc-*`) / `assets/edith.js` / `api/edith.js` |