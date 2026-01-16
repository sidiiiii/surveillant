# Script de deploiement automatique
# Executez ce script dans PowerShell pour pousser vos changements sur GitHub

Write-Host "🚀 Demarrage du processus de deploiement..." -ForegroundColor Cyan
Write-Host ""

# Verifier si Git est installe
try {
    $gitVersion = git --version
    Write-Host "✅ Git detecte: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installe ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host "Installez Git depuis: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Appuyez sur Entree pour fermer"
    exit 1
}

Write-Host ""
Write-Host "📂 Repertoire actuel: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Verifier le statut Git
Write-Host "📊 Verification du statut Git..." -ForegroundColor Cyan
git status

Write-Host ""
$continue = Read-Host "Voulez-vous continuer et pousser ces changements sur GitHub? (O/N)"

if ($continue -ne "O" -and $continue -ne "o") {
    Write-Host "❌ Operation annulee" -ForegroundColor Red
    exit 0
}

# Ajouter tous les fichiers
Write-Host ""
Write-Host "📦 Ajout des fichiers..." -ForegroundColor Cyan
git add .

# Creer le commit
Write-Host ""
$commitMessage = Read-Host "Message du commit (appuyez sur Entree pour utiliser le message par defaut)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Add deployment configuration and documentation"
}

Write-Host "💾 Creation du commit: $commitMessage" -ForegroundColor Cyan
git commit -m "$commitMessage"

# Pousser sur GitHub
Write-Host ""
Write-Host "🌐 Push vers GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ✅ ✅ SUCCES! ✅ ✅ ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "Votre code a ete pousse sur GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/sidiiiii/surveilleur" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎯 Prochaines etapes:" -ForegroundColor Yellow
    Write-Host "  1. Creez un compte sur Render: https://dashboard.render.com/register" -ForegroundColor White
    Write-Host "  2. Creez un compte sur Vercel: https://vercel.com/signup" -ForegroundColor White
    Write-Host "  3. Suivez le guide dans DEPLOY_NOW.md" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du push" -ForegroundColor Red
    Write-Host "Verifiez votre connexion internet et vos identifiants GitHub" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Appuyez sur Entree pour fermer"
