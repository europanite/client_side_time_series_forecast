#!/usr/bin/env bash
# Publish a completed report or an input-hashed partial forecast cache.
# Run only in the disposable GitHub Actions checkout after committing outputs.
set -euo pipefail

# The collector rewrites these input snapshots during each run. They are not
# part of the published report commit, so their tracked edits would otherwise
# cause `git pull --rebase` to fail with "You have unstaged changes".
# Never use `git reset --hard`, `git clean`, or an unscoped `git restore`.
collector_inputs=(
  data/stocks/multivariate.csv
  data/stocks/multivariate.opens.csv
  data/stocks/multivariate.meta.json
)
for path in "${collector_inputs[@]}"; do
  if git ls-files --error-unmatch -- "$path" >/dev/null 2>&1; then
    git restore --worktree -- "$path"
  fi
done

# Do not discard changes to code, configuration, or other unexpected files.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo '::error::Unexpected tracked changes after stock input cleanup; refusing to rebase' >&2
  git status --short >&2
  exit 1
fi

# The remote may have advanced while the (potentially long) model evaluation ran.
git fetch origin main
git -c rebase.autoStash=false rebase FETCH_HEAD
git push origin HEAD:main
