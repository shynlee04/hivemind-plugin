#!/usr/bin/env bash
set -euo pipefail

echo "== Agent Registry Parity Check =="
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

npx tsx scripts/check-agent-registry-parity.ts
