<#
  build.ps1 - fabrique le site : francais a la racine, allemand sous /de/, anglais sous /en/ (pages STATIQUES : les textes
  traduits sont ecrits dans le HTML, aucun echange par JavaScript), plus robots.txt et sitemap.xml.

  Sources (a modifier) :
    src/*.html            pages en francais ; la traduction DE / EN est dans le dictionnaire window.CDM_I18N en bas de chaque page
    src/i18n/chrome.json  traductions DE / EN du menu, du pied de page et des textes partages
    src/i18n/site.json    titres, descriptions, adresse, telephone, coordonnees GPS, saison, images de reference
    src/i18n/alt.json     textes alternatifs des photos (cle = texte francais)
    tools/chrome/*.html   menu, pied de page, en-tete commun
  Sorties (ne pas modifier a la main) : index.html ... a la racine, de/*.html, en/*.html, robots.txt, sitemap.xml

  Usage :  powershell -ExecutionPolicy Bypass -File tools/build.ps1
           -Preview -Out <dossier> : copie d'apercu (liens vers index.html, pour une visionneuse sans serveur)
#>
param([switch]$Preview, [string]$Out = '')

# =====================================================================================================================
#  INDEXABLE : LA seule variable qui decide si Google peut indexer le site.
#    $false = apercu : chaque page porte <meta name="robots" content="noindex, nofollow">, robots.txt interdit tout,
#             sitemap.xml existe mais n'est pas annonce.
#    $true  = lancement : plus aucun noindex, robots.txt autorise tout et annonce sitemap.xml.
#  (la page 404 reste toujours en noindex)
$INDEXABLE = $true
# =====================================================================================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Web.Extensions
$root = Split-Path -Parent $PSScriptRoot
if (-not $Out) { $Out = $root }
$utf8 = New-Object System.Text.UTF8Encoding($false)
$ser = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$ser.MaxJsonLength = [int]::MaxValue
$problems = New-Object System.Collections.ArrayList
function Problem([string]$m) { [void]$script:problems.Add($m) }

function Read-Json([string]$p) { $ser.DeserializeObject([IO.File]::ReadAllText($p, $utf8)) }
$site = Read-Json (Join-Path $root 'src\i18n\site.json')
$chrome = Read-Json (Join-Path $root 'src\i18n\chrome.json')
$altMap = Read-Json (Join-Path $root 'src\i18n\alt.json')
$parts = @{}
foreach ($n in 'head', 'header', 'footer') { $parts[$n] = ([IO.File]::ReadAllText((Join-Path $PSScriptRoot ('chrome\' + $n + '.html')), $utf8)).Trim() }
$pages = @('index', 'cabane-mathis', 'cabane-alanis', 'cabane-camille', 'cabane-mila', 'faq', 'contact', 'bons-cadeaux', 'conditions-generales', 'confidentialite', '404')
$langs = @('fr', 'de', 'en')
$jsKeys = @('ct.err', 'bc.frame')      # textes lus par du JavaScript de page (CDM.t) : recopies dans window.CDM_UI

# ---------------------------------------------------------------------------------------------------- outils
function Get-JsObject([string]$text, [int]$openIdx) {
  $depth = 0; $inStr = $false; $esc = $false
  for ($i = $openIdx; $i -lt $text.Length; $i++) {
    $c = $text[$i]
    if ($inStr) { if ($esc) { $esc = $false } elseif ($c -eq '\') { $esc = $true } elseif ($c -eq '"') { $inStr = $false }; continue }
    if ($c -eq '"') { $inStr = $true; continue }
    if ($c -eq '{') { $depth++ } elseif ($c -eq '}') { $depth--; if ($depth -eq 0) { return $text.Substring($openIdx, $i - $openIdx + 1) } }
  }
  throw 'objet JS non ferme'
}
$closeRx = @{}
function Get-InnerEnd([string]$html, [int]$from, [string]$tag) {
  $k = $tag.ToLower()
  if (-not $closeRx.ContainsKey($k)) { $closeRx[$k] = New-Object System.Text.RegularExpressions.Regex(('<(/?)' + [regex]::Escape($k) + '(?=[\s>/])'), 'IgnoreCase') }
  $rx = $closeRx[$k]; $depth = 1; $pos = $from
  while ($true) {
    $m = $rx.Match($html, $pos)
    if (-not $m.Success) { throw ('balise <' + $tag + '> non fermee') }
    if ($m.Groups[1].Value -eq '/') { $depth--; if ($depth -eq 0) { return $m.Index } } else { $depth++ }
    $pos = $m.Index + $m.Length
  }
}
function Esc-Amp([string]$s) { [regex]::Replace($s, '&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#x[0-9a-fA-F]+);)', '&amp;') }
function Esc-Attr([string]$s) { (Esc-Amp $s).Replace('"', '&quot;').Replace('<', '&lt;').Replace('>', '&gt;') }

# data-i="cle" : le contenu de l'element est remplace par la traduction (DE / EN) ; l'attribut disparait dans toutes les langues
function Apply-Dict([string]$html, $dict, [string]$lang, [string]$pageName) {
  $sb = New-Object System.Text.StringBuilder
  $rx = New-Object System.Text.RegularExpressions.Regex('<(?<tag>[a-zA-Z][a-zA-Z0-9]*)(?<a1>[^<>]*?)\sdata-i="(?<key>[^"]+)"(?<a2>[^<>]*)>')
  $pos = 0
  while ($true) {
    $m = $rx.Match($html, $pos)
    if (-not $m.Success) { break }
    [void]$sb.Append($html.Substring($pos, $m.Index - $pos))
    $tag = $m.Groups['tag'].Value; $key = $m.Groups['key'].Value
    $open = '<' + $tag + $m.Groups['a1'].Value + $m.Groups['a2'].Value + '>'
    $start = $m.Index + $m.Length
    [void]$sb.Append($open)
    if ($lang -eq 'fr') { $pos = $start }
    else {
      $end = Get-InnerEnd $html $start $tag
      if ($dict.ContainsKey($key)) { [void]$sb.Append((Esc-Amp ([string]$dict[$key]))) }
      else { Problem ($pageName + ' : cle non traduite : ' + $key); [void]$sb.Append($html.Substring($start, $end - $start)) }
      $pos = $end
    }
  }
  [void]$sb.Append($html.Substring($pos))
  return $sb.ToString()
}
# data-i-ph / data-i-aria / data-i-title : placeholder, aria-label, title
function Apply-Attrs([string]$html, $dict, [string]$lang, [string]$pageName) {
  $rx = New-Object System.Text.RegularExpressions.Regex('<[a-zA-Z][^<>]*\sdata-i-(?:ph|aria|title)="[^"]*"[^<>]*>')
  return $rx.Replace($html, [System.Text.RegularExpressions.MatchEvaluator] {
    param($m)
    $tagText = $m.Value
    foreach ($kind in @(@('ph', 'placeholder', 'ph.'), @('aria', 'aria-label', ''), @('title', 'title', ''))) {
      $am = [regex]::Match($tagText, '\sdata-i-' + $kind[0] + '="([^"]*)"')
      if (-not $am.Success) { continue }
      $key = $am.Groups[1].Value
      $tagText = $tagText.Replace($am.Value, '')
      if ($lang -eq 'fr') { continue }
      $dk = $kind[2] + $key
      if (-not $dict.ContainsKey($dk)) { Problem ($pageName + ' : cle non traduite : ' + $dk); continue }
      $val = Esc-Attr ([string]$dict[$dk])
      $existing = [regex]::Match($tagText, '\s' + [regex]::Escape($kind[1]) + '="[^"]*"')
      if ($existing.Success) { $tagText = $tagText.Replace($existing.Value, ' ' + $kind[1] + '="' + $val + '"') }
      else { $tagText = [regex]::Replace($tagText, '(\s*/?>)$', ' ' + $kind[1] + '="' + $val + '"$1') }
    }
    $tagText })
}
function Page-Dir([string]$lang) { if ($lang -eq 'fr') { '' } else { $lang + '/' } }
# adresse d'une page vue d'une autre page (liens relatifs ; les pages d'accueil en « ./ » pour le vrai site)
function Page-Url([string]$page, [string]$from, [string]$to) {
  if ($page -eq '404') { $page = 'index' }
  $file = if ($page -eq 'index') { if ($Preview) { 'index.html' } else { '' } } else { $page + '.html' }
  if ($from -eq $to) { $u = $file } else { $u = $(if ($from -eq 'fr') { '' } else { '../' }) + (Page-Dir $to) + $file }
  if ($u -eq '') { $u = './' }
  return $u
}
function Abs-Url([string]$page, [string]$lang) {
  $file = if ($page -eq 'index') { '' } else { $page + '.html' }
  return $site['base'] + '/' + (Page-Dir $lang) + $file
}
function Html-Text([string]$s) { [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($s, '<[^>]+>', ''))).Trim() }

# ---------------------------------------------------------------------------------------------------- empreintes (?v=) des css / js
$stamp = @{}
foreach ($f in Get-ChildItem (Join-Path $root 'assets') -File | Where-Object { $_.Extension -in '.css', '.js', '.svg' }) {
  $sha = [System.Security.Cryptography.SHA1]::Create()
  $h = [BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($f.FullName))).Replace('-', '').Substring(0, 8).ToLower()
  $stamp[$f.Name] = $h
}

# ---------------------------------------------------------------------------------------------------- sources
$sources = @{}; $dicts = @{}
foreach ($p in $pages) {
  $t = [IO.File]::ReadAllText((Join-Path $root ('src\' + $p + '.html')), $utf8).Replace("`r", '')
  foreach ($n in 'head', 'header', 'footer') {
    $rx = New-Object System.Text.RegularExpressions.Regex(('<!--chrome:' + $n + '-->.*?<!--/chrome:' + $n + '-->'), 'Singleline')
    $part = $parts[$n]
    if ($rx.IsMatch($t)) { $t = $rx.Replace($t, [System.Text.RegularExpressions.MatchEvaluator] { param($m) $part }) }
  }
  $pd = @{ de = @{}; en = @{} }
  $m = [regex]::Match($t, 'window\.CDM_I18N\s*=\s*\{')
  if ($m.Success) {
    $obj = Get-JsObject $t ($m.Index + $m.Length - 1)
    $obj = [regex]::Replace($obj, '(?m)^(\s*)(de|en)\s*:', '$1"$2":')
    $obj = [regex]::Replace($obj, ',(\s*[}\]])', '$1')
    $pd = $ser.DeserializeObject($obj)
  }
  $dicts[$p] = $pd
  $sources[$p] = $t
}

# ---------------------------------------------------------------------------------------------------- une page, une langue
$count = 0
foreach ($p in $pages) {
  foreach ($lang in $langs) {
    if ($p -eq '404' -and $lang -ne 'fr') { continue }       # Vercel sert une seule page 404 (a la racine)
    $name = $(if ($lang -eq 'fr') { '' } else { $lang + '/' }) + $p + '.html'
    $t = $sources[$p]
    if ($t.Contains('data-book-main')) { $t = $t.Replace('data-i="bar.book">Réserver une nuit</a>', 'data-i="bar.cab">Réserver cette cabane</a>') }

    # liens de langue du menu
    foreach ($l in $langs) {
      $t = $t.Replace('{{lang:' + $l + '}}', (Page-Url $p $lang $l))
      $t = $t.Replace('{{cur:' + $l + '}}', $(if ($l -eq $lang) { ' aria-current="true"' } else { '' }))
    }
    # traductions
    $dict = @{}
    if ($lang -ne 'fr') {
      foreach ($k in $chrome[$lang].Keys) { $dict[$k] = $chrome[$lang][$k] }
      if ($dicts[$p].ContainsKey($lang)) { foreach ($k in $dicts[$p][$lang].Keys) { $dict[$k] = $dicts[$p][$lang][$k] } }
    }
    $t = Apply-Dict $t $dict $lang $name
    $t = Apply-Attrs $t $dict $lang $name
    # page 404 : Vercel n'en sert qu'une (a la racine) ; sous /de/ ou /en/ elle se met dans la langue de l'adresse
    # (textes [data-nf] et liens [data-nf-href] vers les pages de cette langue)
    if ($p -eq '404') {
      $nf = @{}
      foreach ($l in 'de', 'en') {
        $nf[$l] = @{ 'title' = $dicts['404'][$l]['meta.title']; 'nav.cab' = $chrome[$l]['nav.cab'] }
        foreach ($k in $dicts['404'][$l].Keys) { if ($k -like 'nf.*') { $nf[$l][$k] = $dicts['404'][$l][$k] } }
      }
      $nfJs = "<script>(function(){var m=location.pathname.match(/^\/(de|en)\//),T=" + $ser.Serialize($nf) + ";if(!m)return;var l=m[1],d=T[l];" +
        "document.documentElement.lang=l;document.title=d.title;" +
        "[].forEach.call(document.querySelectorAll('[data-nf]'),function(e){var v=d[e.getAttribute('data-nf')];if(v)e.innerHTML=v;});" +
        "[].forEach.call(document.querySelectorAll('[data-nf-href]'),function(a){var h=a.getAttribute('href');a.setAttribute('href',l+'/'+(h.indexOf('./')===0?h.slice(2):h));});})();</script>"
      $t = $t.Replace('</body>', $nfJs + "`n</body>")
    }
    $t = [regex]::Replace($t, '(?s)<script>\s*window\.CDM_I18N\s*=.*?</script>\s*', '')
    $t = [regex]::Replace($t, '(?s)<!--(?!\[|/?build:).*?-->', '')             # plus de commentaires dans le HTML publie
    $t = $t.Replace('<html lang="fr">', '<html lang="' + $lang + '">')

    # photos : texte alternatif dans la langue de la page
    if ($lang -ne 'fr') {
      $t = [regex]::Replace($t, '(<img\b[^<>]*?\salt=")([^"]*)(")', [System.Text.RegularExpressions.MatchEvaluator] {
        param($m)
        $a = [System.Net.WebUtility]::HtmlDecode($m.Groups[2].Value)
        if ($a -eq '') { return $m.Value }
        if ($altMap.ContainsKey($a) -and $altMap[$a].ContainsKey($lang)) { return $m.Groups[1].Value + (Esc-Attr $altMap[$a][$lang]) + $m.Groups[3].Value }
        Problem ($name + ' : alt non traduit : ' + $a); return $m.Value })
    }
    # reservation Planyo dans la langue de la page
    $t = [regex]::Replace($t, 'custom-language=[A-Za-z]{2}', 'custom-language=' + $lang.ToUpper())

    # chemins : les pages de /de/ et /en/ sont un cran plus bas
    $up = ''
    if ($lang -ne 'fr') {
      $up = '../'
      $t = [regex]::Replace($t, '(\s(?:href|src|poster)=")(assets/|favicon\.svg|manifest\.json)', '$1../$2')
      $t = [regex]::Replace($t, '(\s(?:srcset|imagesrcset)=")([^"]*)(")', [System.Text.RegularExpressions.MatchEvaluator] {
        param($m) $m.Groups[1].Value + [regex]::Replace($m.Groups[2].Value, '(^|,\s*)assets/', '$1../assets/') + $m.Groups[3].Value })
    }
    # liens vers l'accueil : « ./ » (adresse propre) ; en apercu on garde index.html
    if (-not $Preview) { $t = [regex]::Replace($t, 'href="index\.html(#[^"]*)?"', 'href="./$1"') }
    if ($p -eq '404' -and $Preview) { $t = $t.Replace('<base href="/">', '') }

    # empreintes des css / js / svg (flora.svg#chene : l'ancre reste apres ?v=)
    $t = [regex]::Replace($t, '((?:href|src)="(?:\.\./)?assets/([A-Za-z0-9._-]+\.(?:css|js|svg)))(#[^"]*)?"', [System.Text.RegularExpressions.MatchEvaluator] {
      param($m) $f = $m.Groups[2].Value; if ($stamp.ContainsKey($f)) { return $m.Groups[1].Value + '?v=' + $stamp[$f] + $m.Groups[3].Value + '"' } else { return $m.Value } })

    # textes lus par du JavaScript de page
    $ui = @{}
    foreach ($k in $jsKeys) { if ($dict.ContainsKey($k)) { $ui[$k] = $dict[$k] } }
    $uiScript = ''
    if ($ui.Count -gt 0) { $uiScript = "`n<script>window.CDM_UI=" + $ser.Serialize($ui) + ';</script>' }

    # ---- en-tete : titre, description, canonical, hreflang, reseaux sociaux, JSON-LD, prechargements
    $mt = $site['pages'][$p]; $mm = $mt[$lang]
    if ($mm['title'].Length -gt 60) { Problem ($name + ' : titre de ' + $mm['title'].Length + ' caracteres (max 60)') }
    if ($mm['desc'].Length -gt 155) { Problem ($name + ' : description de ' + $mm['desc'].Length + ' caracteres (max 155)') }
    $meta = New-Object System.Text.StringBuilder
    [void]$meta.AppendLine('<title>' + (Esc-Attr $mm['title']) + '</title>')
    [void]$meta.AppendLine('<meta name="description" content="' + (Esc-Attr $mm['desc']) + '">')
    if ($p -eq '404') { [void]$meta.AppendLine('<meta name="robots" content="noindex">') }
    elseif (-not $INDEXABLE) { [void]$meta.AppendLine('<meta name="robots" content="noindex, nofollow">') }
    else { [void]$meta.AppendLine('<meta name="robots" content="index, follow, max-image-preview:large">') }
    if ($p -ne '404') {
      [void]$meta.AppendLine('<link rel="canonical" href="' + (Abs-Url $p $lang) + '">')
      foreach ($l in $langs) { [void]$meta.AppendLine('<link rel="alternate" hreflang="' + $l + '" href="' + (Abs-Url $p $l) + '">') }
      [void]$meta.AppendLine('<link rel="alternate" hreflang="x-default" href="' + (Abs-Url $p 'fr') + '">')
    }
    [void]$meta.AppendLine('<link rel="icon" type="image/svg+xml" href="' + $up + 'favicon.svg">')
    [void]$meta.AppendLine('<meta name="theme-color" content="#EFE8D8">')
    [void]$meta.AppendLine('<link rel="apple-touch-icon" href="' + $up + 'assets/img/apple-touch-icon.png">')
    [void]$meta.AppendLine('<link rel="manifest" href="' + $up + 'manifest.json">')
    if ($p -eq 'index') {
      # la photo d'entree est prechargee (celle du format de l'ecran)
      $pre = [regex]::Match($t, '<!--build:hero-preload-->(.*?)<!--/build:hero-preload-->', 'Singleline')
      if ($pre.Success) { [void]$meta.AppendLine($pre.Groups[1].Value.Trim()) }
    }
    if ($p -ne '404') {
      $ogImg = $site['base'] + '/' + $mt['og']
      [void]$meta.AppendLine('<meta property="og:type" content="website">')
      [void]$meta.AppendLine('<meta property="og:site_name" content="' + $site['name'] + '">')
      [void]$meta.AppendLine('<meta property="og:locale" content="' + $site['locales'][$lang] + '">')
      foreach ($l in $langs) { if ($l -ne $lang) { [void]$meta.AppendLine('<meta property="og:locale:alternate" content="' + $site['locales'][$l] + '">') } }
      [void]$meta.AppendLine('<meta property="og:title" content="' + (Esc-Attr $mm['title']) + '">')
      [void]$meta.AppendLine('<meta property="og:description" content="' + (Esc-Attr $mm['desc']) + '">')
      [void]$meta.AppendLine('<meta property="og:url" content="' + (Abs-Url $p $lang) + '">')
      [void]$meta.AppendLine('<meta property="og:image" content="' + $ogImg + '">')
      [void]$meta.AppendLine('<meta property="og:image:width" content="' + $mt['ogw'] + '">')
      [void]$meta.AppendLine('<meta property="og:image:height" content="' + $mt['ogh'] + '">')
      [void]$meta.AppendLine('<meta property="og:image:alt" content="' + (Esc-Attr $mm['title']) + '">')
      [void]$meta.AppendLine('<meta name="twitter:card" content="summary_large_image">')
      [void]$meta.AppendLine('<meta name="twitter:title" content="' + (Esc-Attr $mm['title']) + '">')
      [void]$meta.AppendLine('<meta name="twitter:description" content="' + (Esc-Attr $mm['desc']) + '">')
      [void]$meta.AppendLine('<meta name="twitter:image" content="' + $ogImg + '">')
    }
    if ($p -eq 'index') {
      # saison a venir (a partir d'octobre : la saison suivante)
      $y = (Get-Date).Year; if ((Get-Date).Month -ge $site['seasonCloseMonth']) { $y++ }
      $ld = [ordered]@{
        '@context' = 'https://schema.org'; '@type' = 'LodgingBusiness'; '@id' = $site['base'] + '/#lodging'
        name = $site['name']; description = $mm['desc']; url = (Abs-Url 'index' $lang); inLanguage = $lang
        telephone = $site['phone']; email = $site['email']
        image = @($site['images'] | ForEach-Object { $site['base'] + '/' + $_ })
        priceRange = $site['priceRange']
        address = [ordered]@{ '@type' = 'PostalAddress'; streetAddress = $site['street']; postalCode = $site['postalCode']; addressLocality = $site['locality']; addressRegion = $site['region']; addressCountry = $site['country'] }
        geo = [ordered]@{ '@type' = 'GeoCoordinates'; latitude = $site['lat']; longitude = $site['lon'] }
        checkinTime = $site['checkin']; checkoutTime = $site['checkout']
        openingHoursSpecification = @([ordered]@{ '@type' = 'OpeningHoursSpecification'; validFrom = ('{0}-{1:00}-01' -f $y, $site['seasonOpenMonth']); validThrough = ('{0}-{1:00}-{2}' -f $y, $site['seasonCloseMonth'], [DateTime]::DaysInMonth($y, $site['seasonCloseMonth'])) })
        sameAs = @($site['sameAs'])
      }
      [void]$meta.AppendLine('<script type="application/ld+json">' + (ConvertTo-Json -InputObject $ld -Depth 6 -Compress) + '</script>')
    }
    if ($p -eq 'faq') {
      $qa = @()
      foreach ($m in [regex]::Matches($t, '(?s)<details[^>]*>\s*<summary[^>]*>(.*?)</summary>\s*<div class="a"[^>]*>(.*?)</div>\s*</details>')) {
        $qa += [ordered]@{ '@type' = 'Question'; name = (Html-Text $m.Groups[1].Value); acceptedAnswer = [ordered]@{ '@type' = 'Answer'; text = (Html-Text $m.Groups[2].Value) } }
      }
      if ($qa.Count -gt 0) {
        $fq = [ordered]@{ '@context' = 'https://schema.org'; '@type' = 'FAQPage'; inLanguage = $lang; mainEntity = $qa }
        [void]$meta.AppendLine('<script type="application/ld+json">' + (ConvertTo-Json -InputObject $fq -Depth 6 -Compress) + '</script>')
      }
    }
    $t = [regex]::Replace($t, '(?s)<!--build:hero-preload-->.*?<!--/build:hero-preload-->\s*', '')
    $t = $t.Replace('<!--build:meta-->', $meta.ToString().TrimEnd() + $uiScript)
    # --- bilan par page
    if ($t -match '\sdata-i(-[a-z]+)?="') { Problem ($name + ' : attribut data-i restant') }
    if ($t -match '\{\{(lang|cur):') { Problem ($name + ' : repere {{...}} restant') }
    $h1 = ([regex]::Matches($t, '<h1[\s>]')).Count
    if ($h1 -ne 1) { Problem ($name + ' : ' + $h1 + ' balise(s) h1 (il en faut une seule)') }

    # --- ecriture
    $dest = Join-Path $Out ($name.Replace('/', '\'))
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $dest) | Out-Null
    [IO.File]::WriteAllText($dest, $t, $utf8)
    $count++
  }
}

# ---------------------------------------------------------------------------------------------------- titres et descriptions uniques
foreach ($l in $langs) {
  $seenT = @{}; $seenD = @{}
  foreach ($p in $pages) {
    $mm = $site['pages'][$p][$l]
    if ($seenT.ContainsKey($mm['title'])) { Problem ('titre en double [' + $l + '] : ' + $mm['title']) }
    if ($seenD.ContainsKey($mm['desc'])) { Problem ('description en double [' + $l + '] : ' + $mm['desc']) }
    $seenT[$mm['title']] = 1; $seenD[$mm['desc']] = 1
  }
}

# ---------------------------------------------------------------------------------------------------- robots.txt, sitemap.xml
$today = (Get-Date).ToString('yyyy-MM-dd')
if ($INDEXABLE) { $robots = "User-agent: *`nAllow: /`n`nSitemap: " + $site['base'] + "/sitemap.xml`n" }
else { $robots = "# Apercu : le site n'est pas encore indexable (variable INDEXABLE dans tools/build.ps1).`nUser-agent: *`nDisallow: /`n" }
[IO.File]::WriteAllText((Join-Path $Out 'robots.txt'), $robots, $utf8)
$sm = New-Object System.Text.StringBuilder
[void]$sm.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sm.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">')
foreach ($p in $pages) {
  if ($p -eq '404') { continue }
  foreach ($l in $langs) {
    [void]$sm.AppendLine('  <url>')
    [void]$sm.AppendLine('    <loc>' + (Abs-Url $p $l) + '</loc>')
    [void]$sm.AppendLine('    <lastmod>' + $today + '</lastmod>')
    foreach ($a in $langs) { [void]$sm.AppendLine('    <xhtml:link rel="alternate" hreflang="' + $a + '" href="' + (Abs-Url $p $a) + '"/>') }
    [void]$sm.AppendLine('    <xhtml:link rel="alternate" hreflang="x-default" href="' + (Abs-Url $p 'fr') + '"/>')
    [void]$sm.AppendLine('  </url>')
  }
}
[void]$sm.AppendLine('</urlset>')
[IO.File]::WriteAllText((Join-Path $Out 'sitemap.xml'), $sm.ToString(), $utf8)

# Web3Forms : sans cle, les formulaires passent par l'e-mail (mailto) ; ce n'est pas une erreur, juste un avertissement visible.
# Pour l'activer : coller la cle a la place de PLACEHOLDER dans assets/forms.js (une seule ligne), puis relancer build.ps1.
if ([IO.File]::ReadAllText((Join-Path $root 'assets\forms.js'), $utf8) -match 'CDM_FORM_KEY\s*=\s*"PLACEHOLDER"') {
  Write-Host 'AVERTISSEMENT : cle Web3Forms absente : les formulaires utilisent le repli mailto' -ForegroundColor Yellow
}
Write-Host ('build : {0} pages ecrites dans {1} ({2}) ; INDEXABLE = {3}' -f $count, $Out, $(if ($Preview) { 'apercu' } else { 'site' }), $INDEXABLE)
if ($problems.Count -gt 0) {
  Write-Host ('{0} PROBLEME(S) :' -f $problems.Count) -ForegroundColor Red
  $problems | Select-Object -First 40 | ForEach-Object { Write-Host ('  - ' + $_) -ForegroundColor Red }
  exit 1
}
exit 0
