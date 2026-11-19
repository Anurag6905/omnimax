#!/usr/bin/env bash
# One-time setup on macOS / Linux. Run from the omnimax folder:
#   bash scripts/setup-github.sh
# Needs: git, GitHub CLI (brew install gh), Node 22+.
set -euo pipefail
REPO_NAME="${1:-omnimax}"

command -v gh >/dev/null || { echo "Install GitHub CLI first: brew install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || gh auth login

[ -d .git ] || git init -b main
git add .
git commit -m "chore: Phase 1A project scaffold and client data schema"

# Private repo: this project holds client-related logic and must not be public.
gh repo create "$REPO_NAME" --private --source . --remote origin --push

git checkout -b phase-1a
git push -u origin phase-1a

npm install
echo
echo "Done. Repo created and pushed. You are on branch phase-1a."
echo "Open in VS Code with:  code ."
