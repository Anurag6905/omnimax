# One-time setup on Windows (PowerShell). Run from the omnimax folder:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-github.ps1
# Needs: git, GitHub CLI (winget install GitHub.cli), Node 22+.
param([string]$RepoName = "omnimax")
$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "Install GitHub CLI first: winget install GitHub.cli" }
$ErrorActionPreference = "Continue"; gh auth status *> $null; $ok = $LASTEXITCODE; $ErrorActionPreference = "Stop"
if ($ok -ne 0) { gh auth login }

if (-not (Test-Path .git)) {
  git init -b main
}
git add .
git commit -m "chore: Phase 1A project scaffold and client data schema"

# Private repo: this project holds client-related logic and must not be public.
gh repo create $RepoName --private --source . --remote origin --push

git checkout -b phase-1a
git push -u origin phase-1a

npm install
Write-Host "`nDone. Repo created and pushed. You are on branch phase-1a."
Write-Host "Open in VS Code with:  code ."
