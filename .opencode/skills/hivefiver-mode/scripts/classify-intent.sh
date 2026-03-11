#!/usr/bin/env bash
#
# Thin compatibility bridge to canonical src-owned HiveFiver intake logic.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"

cd "${REPO_ROOT}"

TEXT="${1-}"

npx tsx src/cli.ts hivefiver-intake --action classify-intent --text "${TEXT}"
