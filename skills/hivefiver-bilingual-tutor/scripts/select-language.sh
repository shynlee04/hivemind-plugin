#!/usr/bin/env bash
set -euo pipefail

lang="${1:-en}"
case "$lang" in
  en|vi|bilingual)
    echo "$lang"
    ;;
  *)
    echo "en"
    ;;
esac
