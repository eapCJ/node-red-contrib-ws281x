#!/usr/bin/env bash
# scripts/rewrite_commit_messages.sh
# ------------------------------------------------------------
# Rewrite all commit messages in the current repository so that
# they follow Conventional Commits as documented in CONTRIBUTING.md.
#
# Usage:
#   ./scripts/rewrite_commit_messages.sh [type]
#
# Arguments:
#   type   The Conventional Commit type to prepend to non-compliant
#          commit subjects (default: "chore"). Examples: feat, fix,
#          docs, style, refactor, test, perf.
#
# The script keeps messages that already match the Conventional
# Commits regex intact, inserts a blank line between header and body
# when missing, and wraps body lines to ≤ 72 chars.
#
# Safety notes:
#   • This **REWRITES HISTORY** – you will need to --force-push.
#   • It stops if the working tree is not clean.
#
# Prerequisites:
#   • git ≥ 2.22
#   • Either `git-filter-repo` (recommended) or `git filter-branch`.
#     git-filter-repo: https://github.com/newren/git-filter-repo
# ------------------------------------------------------------
set -euo pipefail

# Ensure we are inside a Git repository
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: Not inside a Git repository." >&2
  exit 1
fi

if [[ -n $(git status --porcelain) ]]; then
  echo "Error: Working tree is dirty. Commit or stash changes first." >&2
  exit 2
fi

# Conventional Commit types regex (from spec)
readonly CC_TYPES="build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test"

DEFAULT_TYPE="chore"
PREFIX_TYPE="${1:-$DEFAULT_TYPE}"

if [[ ! $PREFIX_TYPE =~ ^($CC_TYPES)$ ]]; then
  echo "Error: Invalid type '$PREFIX_TYPE'. Must match one of: $CC_TYPES" >&2
  exit 3
fi

# Helper: Python inline script to transform commit message
read -r -d '' PY_FILTER <<'PY'
import os, re, textwrap

type_prefix = os.environ['PREFIX_TYPE']
pattern = re.compile(rf'^({os.environ["CC_TYPES"]})(\([\w\-]+\))?: ')

def wrap_body(body: str) -> str:
    wrapped = []
    for para in re.split(r"\n{2,}", body.strip()):
        for line in textwrap.wrap(para, 72):
            wrapped.append(line)
        wrapped.append("")
    return "\n".join(wrapped).strip()

msg = commit.message.decode('utf-8', errors='replace').rstrip()
# Split into header and body
parts = msg.split('\n', 1)
header = parts[0].strip()
body = parts[1] if len(parts) == 2 else ''

# Prepend type if missing
if not pattern.match(header):
    header = f"{type_prefix}: {header}"

# Ensure blank line before body if body exists
if body:
    body = wrap_body(body)
    commit.message = f"{header}\n\n{body}\n".encode()
else:
    commit.message = f"{header}\n".encode()
PY

export PREFIX_TYPE CC_TYPES

if command -v git-filter-repo >/dev/null 2>&1; then
  echo "Using git-filter-repo to rewrite history…" >&2
  git filter-repo --force --commit-callback "$PY_FILTER"
else
  echo "git-filter-repo not found. Falling back to git filter-branch (slow)…" >&2
  git filter-branch --force --msg-filter "python - <<'PY'\n$PY_FILTER\nPY" --tag-name-filter cat -- --all
fi

echo "\n✔️  History rewritten. Review with 'git log --graph --oneline --decorate'." >&2
printf "\nNext steps:\n  git push --force-with-lease\n" 