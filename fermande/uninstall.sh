#!/bin/sh
# Fermande uninstaller for macOS and Linux.
#
#   ./uninstall.sh           removes the hooks, the /fermande command and the app; keeps your log
#   ./uninstall.sh --purge   also deletes the log and settings
F="${FERMANDE_HOME:-$HOME/.fermande}/bin/fermande"
if [ -x "$F" ]; then
  exec "$F" remove "$@"
fi
echo "Fermande is not installed in ${FERMANDE_HOME:-$HOME/.fermande}."
