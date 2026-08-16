# GitHub Sync and Zero-Conflict Deployment Strategy

This workflow preserves existing repository history, isolates the refactor, and prevents local secrets or generated artifacts from being committed. Replace the placeholder remote URL with the organization’s approved repository URL.

## 1. Preserve the current local state

Run these commands from the project root before modifying the repository:

```bash
git status --short --branch
git remote -v
git fetch --all --prune
git branch --show-current
git branch backup/pre-refactor-$(date +%Y%m%d-%H%M%S)
```

If the supplied archive is not yet a Git working tree, initialize it once and create a history-preserving baseline:

```bash
git init
git add .gitignore .env.example README.md USER_GUIDE.md backend frontend docker-compose.yml DEPLOYMENT.sh docs
git commit -m "chore(repo): capture pre-refactor application baseline"
git branch -M main
```

If a remote already exists, verify it before changing it. If no remote exists, add the approved URL:

```bash
git remote add origin <github-repository-url>
git fetch origin --prune
```

## 2. Create the isolated refactor branch

Start from the latest remote default branch. Confirm whether the default is `main` or `master` with `git remote show origin`.

```bash
git remote show origin
git switch main
git pull --ff-only origin main
git switch -c refactor/production-ready-v2
```

If the remote default is `master`, substitute `master` in the commands above. Do not use an unqualified merge pull before confirming the branch.

## 3. Verify that secrets and generated files are excluded

Before staging, confirm that environment files, dependency directories, build output, Python caches, and local model weights are ignored.

```bash
git status --short --ignored
git check-ignore -v .env frontend/.env backend/.env frontend/node_modules backend/__pycache__
grep -RIn --exclude-dir=.git --exclude-dir=node_modules --exclude='*.pyc' \
  -E 'samraksha_secret|super-secret|mock_token_for_now|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|api[_-]?key[[:space:]]*=' .
```

If a real credential has ever been committed, rotate it before pushing. Removing the file in a later commit does not remove it from history; use the organization’s approved secret-removal process after rotation and review.

## 4. Run the quality gates locally

```bash
cd backend
python3 -m pytest -q
python3 -m compileall -q .
cd ../frontend
npm ci
npm run typecheck
npm test -- --run
npm run build
cd ..
```

Apply the document-template migration to a disposable or staging database and run authenticated smoke tests:

```bash
psql "$DATABASE_URL" -f backend/db/migrations/20260816_document_templates.sql
```

## 5. Stage and commit with semantic messages

Review the exact diff before staging. Separate functional and documentation commits when that improves review quality.

```bash
git status --short
git diff --stat
git diff --check
git add backend frontend
 git diff --cached --check
 git commit -m "fix(security): harden sessions and connector configuration"
```

Remove the leading spaces before `git diff` and `git commit` when copying the block above, or use this exact version:

```bash
git diff --cached --check
git commit -m "fix(security): harden sessions and connector configuration"
git add backend frontend
git commit -m "fix(documents): persist and dynamically generate case documents"
git add README.md USER_GUIDE.md docker-compose.yml .env.example docs .gitignore
git commit -m "docs(repo): add project report and operating guide"
```

A one-commit alternative is:

```bash
git add backend frontend README.md USER_GUIDE.md docker-compose.yml .env.example docs .gitignore
git diff --cached --check
git commit -m "refactor(repo): prepare production-ready v2"
```

## 6. Push and open a Pull Request

```bash
git push --set-upstream origin refactor/production-ready-v2
```

Open a Pull Request from `refactor/production-ready-v2` into the current default branch. Require CI to run backend tests, Python compilation, frontend type checking, frontend tests, frontend build, dependency auditing, secret scanning, and migration validation. Require review of access control and the operational document and translation workflows.

## 7. Keep the merge history clean

If the default branch advances while the Pull Request is open, use a rebase only if the team policy permits rebasing published branches:

```bash
git fetch origin
git switch refactor/production-ready-v2
git rebase origin/main
# resolve conflicts, then:
git add <resolved-files>
git rebase --continue
git push --force-with-lease
```

The safer shared-branch alternative is a merge commit:

```bash
git fetch origin
git switch refactor/production-ready-v2
git merge --no-ff origin/main
# resolve conflicts, run all quality gates, then:
git add <resolved-files>
git commit
git push
```

Never resolve a conflict by accepting “ours” or “theirs” across the entire repository. Manually inspect authentication, document API, schema migration, environment configuration, and frontend document-modal files first.

## 8. Merge into the default branch

Prefer the protected Pull Request merge after all checks pass. If a maintainer must merge locally:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git merge --no-ff refactor/production-ready-v2 -m "merge: production-ready Samraksha refactor"
git push origin main
```

Preserve the old history. Do not use `git reset --hard`, `git push --force`, or a new unrelated root commit to replace the repository.

## 9. Deploy from the merged commit

Tag the exact commit that passed CI, deploy it to staging, apply the document-template migration, and complete smoke tests for login, role authorization, case access boundaries, FIR creation, diary persistence, DOCX generation and re-download, translation availability, voice upload limits, WebSocket session validation, and logout revocation. Promote the same immutable image or commit to production after staging approval.

```bash
git switch main
git pull --ff-only origin main
git tag -a v2.0.0-production-ready -m "SAMRAKSHA production-ready repair"
git push origin v2.0.0-production-ready
```

Keep the previous production tag available for rollback. A rollback should restore the application image and configuration as a matched pair; review database migration compatibility before reverting application code.
