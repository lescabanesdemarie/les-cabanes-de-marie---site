<#
  check-site.ps1 - verification AVANT chaque push (le site se deploie tout seul sur `main`).
  A lancer depuis la racine du depot :
      powershell -ExecutionPolicy Bypass -File tools/check-site.ps1
  Options :
      -Stamp   reecrit ?v=<empreinte> sur chaque reference locale .css/.js des pages HTML
               (indispensable : /assets/* est mis en cache 1 an par vercel.json)
      -Online  verifie aussi que les liens externes repondent (lent)
  Code de sortie : 0 = tout est bon, 1 = au moins un controle en echec.
  Ce script ne modifie rien sans -Stamp. Il est exclu du deploiement (.vercelignore).
#>
param([switch]$Stamp, [switch]$Online)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$strict = New-Object System.Text.UTF8Encoding($false, $true)   # leve une erreur si UTF-8 invalide
$fails = New-Object System.Collections.ArrayList
$warns = New-Object System.Collections.ArrayList
function Fail([string]$m) { [void]$fails.Add($m) }
function Warn([string]$m) { [void]$warns.Add($m) }

# motifs d'accents corrompus, construits par code pour que ce fichier reste 100 % ASCII
$mojibake = [string][char]0xC3 + '[\u0080-\u00BF]|' + [char]0xE2 + [char]0x20AC
$skipDirs = '\\(\.git|\.claude|_reference|tools|node_modules)\\'
$all = Get-ChildItem -Path $root -Recurse -File -Force | Where-Object { ($_.FullName + '\') -notmatch $skipDirs -and $_.FullName -notmatch '\\\.git\\' }
$rel = { param($p) $p.Substring($root.Length + 1).Replace('\', '/') }

# ---------------------------------------------------------------- 1. fichiers texte
$textExt = '.html', '.css', '.js', '.json', '.svg', '.xml', '.txt', '.md', '.webmanifest'
$texts = @{}
foreach ($f in $all) {
  $ext = $f.Extension.ToLower()
  if ($textExt -notcontains $ext) { continue }
  $name = & $rel $f.FullName
  if ($f.Length -lt 20) { Fail "$name : fichier minuscule ($($f.Length) octets) - upload incomplet ?"; continue }
  try { $t = $strict.GetString([IO.File]::ReadAllBytes($f.FullName)) } catch { Fail "$name : UTF-8 invalide"; continue }
  $texts[$name] = $t
  if ($t.Trim().Length -eq 0) { Fail "$name : vide"; continue }
  if ($t.IndexOf([char]0) -ge 0) { Fail "$name : contient des octets NUL" }
  if ($t.Contains([string][char]0xFFFD)) { Fail "$name : contient le caractere de remplacement U+FFFD (accents corrompus)" }
  if ($t -match $mojibake) { Fail "$name : sequences d'accents corrompus (mojibake)" }
  if ($t.Length -gt 0 -and $t[0] -eq [char]0xFEFF) { Warn "$name : commence par un BOM" }
  if ($ext -eq '.html') {
    if ($t -notmatch '(?is)^\s*(<!--.*?-->\s*)?<!doctype html>') { Fail "$name : <!DOCTYPE html> manquant en tete" }
    if ($t.TrimEnd() -notmatch '(?i)</html>$') { Fail "$name : ne se termine pas par </html> (fichier tronque ?)" }
    if ($t -notmatch '(?i)<title>[^<]+</title>') { Fail "$name : <title> manquant" }
    if ($f.Length -gt 300KB) { Warn "$name : $([int]($f.Length/1KB)) Ko (lourd)" }
    if ($t -match '(?i)const SYSTEM\s*=') { Fail "$name : une consigne d'Edith est encore dans la page (elle doit vivre dans api/edith.js)" }
  }
  if ($ext -in '.json') { try { [void]($t | ConvertFrom-Json) } catch { Fail "$name : JSON invalide" } }
  if ($t -match 'data:image/[a-z+.-]+;base64,[A-Za-z0-9+/=]{2000,}') { Fail "$name : image base64 volumineuse integree (interdit)" }
  if ($t -match '(?i)static\.wixstatic\.com') { Fail "$name : reference a Wix (static.wixstatic.com)" }
  if ($t -match '(?i)fonts\.(googleapis|gstatic)\.com') { Fail "$name : appel a Google Fonts (interdit : Cabinet Grotesk vient de Fontshare via tools/chrome/head.html, la police de secours Hanken Grotesk est dans assets/fonts/)" }
  if ($ext -eq '.html' -and $name -ne '404.html' -and $t -notmatch 'api\.fontshare\.com/v2/css\?f\[\]=cabinet-grotesk') { Warn "$name : le lien Fontshare (Cabinet Grotesk) est absent : lancer tools/sync-chrome.ps1" }
  if ($t -match '(?i)bainsdeyverdon') { Fail "$name : lien mort bainsdeyverdon.ch (la bonne adresse est bainsyverdon.ch)" }
  foreach ($pat in 'sk-ant-[A-Za-z0-9_-]{10,}', 'AKIA[0-9A-Z]{16}', '-----BEGIN [A-Z ]*PRIVATE KEY-----', 'ghp_[A-Za-z0-9]{20,}', 'xox[bp]-[A-Za-z0-9-]{10,}', 'AIza[0-9A-Za-z_-]{30,}') {
    if ($t -match $pat) { Fail "$name : ressemble a un secret/une cle ($pat)" }
  }
}

# ---------------------------------------------------------------- 2. fichiers binaires
# licence ITF Free Font License : Cabinet Grotesk ne doit pas etre redistribue depuis un depot public
foreach ($f in $all) {
  if ($f.Extension.ToLower() -in '.woff2', '.woff', '.ttf', '.otf', '.eot' -and $f.Name -match '(?i)cabinet') {
    Fail ((& $rel $f.FullName) + " : la police Cabinet Grotesk ne doit PAS etre publiee dans le depot (licence Fontshare/ITF) : elle se charge depuis Fontshare")
  }
}
foreach ($f in $all) {
  $ext = $f.Extension.ToLower()
  if ($ext -notin '.jpg', '.jpeg', '.png', '.webp', '.woff2', '.ico') { continue }
  $name = & $rel $f.FullName
  if ($f.Length -lt 500) { Fail "$name : image/police minuscule ($($f.Length) octets) - upload incomplet ?"; continue }
  $fs = [IO.File]::OpenRead($f.FullName); $h = New-Object byte[] 12; [void]$fs.Read($h, 0, 12); $fs.Dispose()
  $hex = ($h | ForEach-Object { $_.ToString('x2') }) -join ''
  $ok = switch ($ext) {
    { $_ -in '.jpg', '.jpeg' } { $hex.StartsWith('ffd8ff') }
    '.png' { $hex.StartsWith('89504e47') }
    '.webp' { $hex.StartsWith('52494646') -and $hex.Substring(16, 8) -eq '57454250' }
    '.woff2' { $hex.StartsWith('774f4632') }
    '.ico' { $hex.StartsWith('00000100') }
  }
  if (-not $ok) { Fail "$name : en-tete de fichier invalide (pas un vrai $ext ?)" }
  if ($ext -in '.jpg', '.jpeg', '.png', '.webp' -and $f.Length -gt 600KB) { Warn "$name : $([int]($f.Length/1KB)) Ko (lourd)" }
}

# ---------------------------------------------------------------- 3. references locales
function Test-Local([string]$fromName, [string]$ref, [string]$kind) {
  $r = $ref.Trim()
  if ($r -eq '' -or $r -match '^(https?:|//|mailto:|tel:|javascript:|data:|sms:)') {
    if ($r -match '^https?://(www\.)?lescabanesdemarie\.com/(.*)$') { $r = $Matches[2] } else { return }
  }
  if ($r.StartsWith('#')) { return }
  $hash = ''
  if ($r.Contains('#')) { $hash = $r.Substring($r.IndexOf('#') + 1); $r = $r.Substring(0, $r.IndexOf('#')) }
  if ($r.Contains('?')) { $r = $r.Substring(0, $r.IndexOf('?')) }
  if ($r -eq '') { return }
  $dir = Split-Path $fromName -Parent
  $target = if ($r.StartsWith('/')) { $r.TrimStart('/') } elseif ($dir) { "$dir/$r" } else { $r }
  if ($target -eq '') { $target = 'index.html' }
  $path = Join-Path $root ($target.Replace('/', '\'))
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { Fail "$fromName : $kind introuvable -> $ref"; return }
  if ($hash -and $target -match '\.html$') {
    $tt = $texts[$target]
    if ($tt -and $tt -notmatch ('(?i)\sid=["'']' + [regex]::Escape($hash) + '["'']')) { Fail "$fromName : ancre #$hash absente de $target" }
  }
}
foreach ($name in @($texts.Keys)) {
  $t = $texts[$name]
  if ($name -match '\.html$') {
    foreach ($m in [regex]::Matches($t, '(?i)\b(?:href|src|poster)=["'']([^"'']+)["'']')) { Test-Local $name $m.Groups[1].Value 'lien/fichier' }
    foreach ($m in [regex]::Matches($t, '(?i)<meta[^>]+(?:property|name)=["''](?:og:image|twitter:image)["''][^>]*content=["'']([^"'']+)["'']')) { Test-Local $name $m.Groups[1].Value 'image de partage' }
    foreach ($m in [regex]::Matches($t, '(?i)\bsrcset=["'']([^"'']+)["'']')) { foreach ($part in $m.Groups[1].Value.Split(',')) { Test-Local $name ($part.Trim().Split(' ')[0]) 'srcset' } }
  }
  if ($name -match '\.(html|css)$') {
    foreach ($m in [regex]::Matches($t, '(?i)url\(\s*["'']?([^)"'']+)["'']?\s*\)')) { Test-Local $name $m.Groups[1].Value 'url() CSS' }
  }
  if ($name -match '\.(js|html)$') {
    foreach ($m in [regex]::Matches($t, '(?<![\w/.-])(assets/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp|svg|woff2|css|js|json))')) { Test-Local 'index.html' $m.Groups[1].Value 'fichier cite dans le code' }
  }
}

# ---------------------------------------------------------------- 4. empreintes de cache (?v=)
$sha = [System.Security.Cryptography.SHA1]::Create()
function Get-Stamp([string]$assetRel) {
  $p = Join-Path $root ($assetRel.Replace('/', '\'))
  if (-not (Test-Path -LiteralPath $p)) { return $null }
  $bytes = [IO.File]::ReadAllBytes($p)
  # le contenu texte est normalise (fins de ligne) pour que Windows et Linux donnent la meme empreinte
  if ($p -match '\.(css|js)$') { $bytes = [Text.Encoding]::UTF8.GetBytes(([Text.Encoding]::UTF8.GetString($bytes)).Replace("`r`n", "`n")) }
  return (($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 8)
}
$stampRx = '(?i)\b(href|src)=(["''])(assets/[^"''?#]+\.(?:css|js))(?:\?v=[0-9a-f]+)?\2'
foreach ($name in @($texts.Keys | Where-Object { $_ -match '\.html$' })) {
  $t = $texts[$name]
  $new = [regex]::Replace($t, $stampRx, {
      param($m)
      $s = Get-Stamp $m.Groups[3].Value
      if ($null -eq $s) { return $m.Value }
      return $m.Groups[1].Value + '=' + $m.Groups[2].Value + $m.Groups[3].Value + '?v=' + $s + $m.Groups[2].Value
    })
  if ($new -ne $t) {
    if ($Stamp) { [IO.File]::WriteAllText((Join-Path $root $name.Replace('/', '\')), $new, (New-Object System.Text.UTF8Encoding($false))); $texts[$name] = $new; Write-Host "  stamp : $name mis a jour" }
    else { Fail "$name : empreinte ?v= absente ou perimee sur un .css/.js -> relancer avec -Stamp (sinon les visiteurs gardent l'ancienne version 1 an)" }
  }
}

# ---------------------------------------------------------------- 5. traductions FR/DE/EN
$sharedJs = $texts['assets/site.js']
foreach ($name in @($texts.Keys | Where-Object { $_ -match '\.html$' -and $_ -ne '404.html' })) {
  $t = $texts[$name]
  $keys = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($m in [regex]::Matches($t, '\bdata-i="([^"]+)"')) { [void]$keys.Add($m.Groups[1].Value) }
  if ($keys.Count -eq 0) { continue }
  $js = ([regex]::Matches($t, '(?is)<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>') | ForEach-Object { $_.Groups[1].Value }) -join "`n"
  if ($t -match 'assets/site\.js' -and $sharedJs) { $js += "`n" + $sharedJs }
  $phKeys = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($m in [regex]::Matches($t, '\bdata-i-ph="([^"]+)"')) { [void]$phKeys.Add($m.Groups[1].Value) }
  foreach ($k in $keys) {
    $n = ([regex]::Matches($js, '"' + [regex]::Escape($k) + '"\s*:')).Count
    if ($n -eq 0) { Warn "$name : cle de traduction '$k' absente en DE et EN" }
    elseif ($n -eq 1) { Warn "$name : cle de traduction '$k' presente dans une seule langue (DE ou EN manquant)" }
  }
  foreach ($k in $phKeys) {
    $n = ([regex]::Matches($js, '"ph\.' + [regex]::Escape($k) + '"\s*:')).Count
    if ($n -lt 2) { Warn "$name : placeholder 'ph.$k' non traduit dans les deux langues ($n/2)" }
  }
}

# ---------------------------------------------------------------- 6. divers
if ($texts.ContainsKey('api/edith.js')) {
  $e = $texts['api/edith.js']
  if ($e -match '\{\s*system\b[^}]*\}\s*=\s*(typeof|req)') { Fail 'api/edith.js : accepte une consigne (system) venant du navigateur' }
  if ($e -notmatch 'ANTHROPIC_API_KEY') { Fail 'api/edith.js : ANTHROPIC_API_KEY non lue' }
  if ($e -notmatch 'allowedOrigin') { Fail 'api/edith.js : controle d''origine absent' }
}
if ($texts.ContainsKey('sitemap.xml')) {
  foreach ($m in [regex]::Matches($texts['sitemap.xml'], '<loc>([^<]+)</loc>')) { Test-Local 'sitemap.xml' $m.Groups[1].Value 'URL du sitemap' }
}
foreach ($must in 'index.html', '404.html', 'vercel.json', 'robots.txt', 'sitemap.xml', 'manifest.json', 'api/edith.js') {
  if (-not (Test-Path -LiteralPath (Join-Path $root $must.Replace('/', '\')))) { Fail "$must : fichier indispensable manquant" }
}
# fichiers de assets/ que plus aucune page ne cite (a supprimer ?)
$blob = ($texts.Values -join "`n")
foreach ($f in $all) {
  if ($f.FullName -notmatch '\\assets\\') { continue }
  if ($f.Extension.ToLower() -in '.html', '.css', '.js') { continue }
  $bn = $f.Name
  if (-not $blob.Contains($bn)) { Warn ("assets/" + ($f.FullName.Substring($root.Length + 8).Replace('\', '/')) + " : plus cite nulle part (inutile ?)") }
}
$assetsSize = ($all | Where-Object { $_.FullName -match '\\assets\\' } | Measure-Object Length -Sum).Sum
if ($assetsSize -gt 12MB) { Warn ("assets/ pese " + [int]($assetsSize / 1MB) + " Mo") }

if ($Online) {
  $urls = New-Object 'System.Collections.Generic.HashSet[string]'
  foreach ($name in @($texts.Keys | Where-Object { $_ -match '\.html$' })) {
    foreach ($m in [regex]::Matches($texts[$name], '(?i)\bhref=["''](https?://[^"'']+)["'']')) {
      $u = $m.Groups[1].Value
      if ($u -notmatch 'planyo\.com|lescabanesdemarie\.com|google\.com/maps|facebook\.com|instagram\.com') { [void]$urls.Add($u) }
    }
  }
  foreach ($u in $urls) {
    try { $r = Invoke-WebRequest -Uri $u -Method Head -UseBasicParsing -TimeoutSec 15 -MaximumRedirection 5; Write-Host "  ok   $($r.StatusCode) $u" }
    catch { Warn "lien externe injoignable : $u" }
  }
}

# ---------------------------------------------------------------- resultat
Write-Host ''
Write-Host ("Fichiers controles : {0}  |  pages HTML : {1}" -f $all.Count, @($texts.Keys | Where-Object { $_ -match '\.html$' }).Count)
foreach ($w in $warns) { Write-Host "  [avertissement] $w" -ForegroundColor Yellow }
foreach ($x in $fails) { Write-Host "  [ECHEC]         $x" -ForegroundColor Red }
if ($fails.Count -gt 0) { Write-Host ("`n{0} echec(s), {1} avertissement(s) : NE PAS POUSSER." -f $fails.Count, $warns.Count) -ForegroundColor Red; exit 1 }
Write-Host ("`nTout est bon ({0} avertissement(s)). Pret a pousser." -f $warns.Count) -ForegroundColor Green
exit 0
