#!/usr/bin/env bash
# Fermande installer for macOS and Linux. On Windows, run install.cmd instead.
#
#   ./install.sh               install or update
#   ./install.sh --no-history  install without reading existing conversations
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
die() { printf 'Fermande: %s\n' "$*" >&2; exit 1; }
[ -f "$HERE/app/fermande.py" ] || die "run this from the unzipped fermande folder."

good_python() { "$1" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)' >/dev/null 2>&1; }
PY=""
if [ -n "${FERMANDE_PYTHON:-}" ]; then
  PY="$FERMANDE_PYTHON"
else
  for cand in "$(command -v python3 || true)" /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
    [ -n "$cand" ] && [ -x "$cand" ] || continue
    if good_python "$cand"; then PY="$cand"; break; fi
  done
fi
[ -n "$PY" ] && good_python "$PY" || die "Python 3.8 or newer was not found. Install it, or set FERMANDE_PYTHON=/path/to/python3."

exec "$PY" "$HERE/app/fermande.py" setup --from "$HERE" "$@"
