<#
  sync-chrome.ps1 - recopie l'en-tete et le pied de page communs (tools/chrome/*.html)
  dans toutes les pages, entre les reperes <!--chrome:header--> ... <!--/chrome:header-->
  et <!--chrome:footer--> ... <!--/chrome:footer-->.
  Pour changer un lien du menu ou du pied de page : modifier tools/chrome/header.html ou
  footer.html, puis lancer :
      powershell -ExecutionPolicy Bypass -File tools/sync-chrome.ps1
  Option -Check : ne modifie rien, signale seulement les pages qui ne sont pas a jour.
#>
param([switch]$Check)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$parts = @{}
foreach ($n in 'header', 'footer') { $parts[$n] = ([IO.File]::ReadAllText((Join-Path $PSScriptRoot "chrome\$n.html"), $utf8)).TrimEnd() }
$bad = 0
foreach ($f in Get-ChildItem -Path $root -Filter *.html -File) {
  $t = [IO.File]::ReadAllText($f.FullName, $utf8)
  $new = $t
  foreach ($n in 'header', 'footer') {
    $rx = New-Object System.Text.RegularExpressions.Regex(('<!--chrome:' + $n + '-->.*?<!--/chrome:' + $n + '-->'), [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if (-not $rx.IsMatch($new)) { if ($t -match 'chrome:') { Write-Host ("  repere {0} manquant dans {1}" -f $n, $f.Name) -ForegroundColor Red; $bad++ }; continue }
    $part = $parts[$n]
    $new = $rx.Replace($new, [System.Text.RegularExpressions.MatchEvaluator] { param($m) $part })
  }
  if ($new -ne $t) {
    if ($Check) { Write-Host ("  pas a jour : " + $f.Name) -ForegroundColor Yellow; $bad++ }
    else { [IO.File]::WriteAllText($f.FullName, $new, $utf8); Write-Host ("  mis a jour : " + $f.Name) }
  }
}
if ($bad -gt 0 -and $Check) { exit 1 }
exit 0
