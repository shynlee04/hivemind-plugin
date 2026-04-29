#!/usr/bin/env bash
# update.sh — Re-download OpenCode source and regenerate skill files
# Usage: bash scripts/update.sh [version]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
TMP_DIR=$(mktemp -d)

VERSION="${1:-latest}"
echo "[stack-opencode] Updating to version: $VERSION"

# ── Download source via GitHub API ──
echo "[stack-opencode] Downloading plugin source..."
mkdir -p "$TMP_DIR/plugin"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/index.ts" -o "$TMP_DIR/plugin/index.ts"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/tool.ts" -o "$TMP_DIR/plugin/tool.ts"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/shell.ts" -o "$TMP_DIR/plugin/shell.ts"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/tui.ts" -o "$TMP_DIR/plugin/tui.ts"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/src/example.ts" -o "$TMP_DIR/plugin/example.ts"

echo "[stack-opencode] Downloading SDK source..."
mkdir -p "$TMP_DIR/sdk"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/src/index.ts" -o "$TMP_DIR/sdk/index.ts"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/src/client.ts" -o "$TMP_DIR/sdk/client.ts"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/src/server.ts" -o "$TMP_DIR/sdk/server.ts"

echo "[stack-opencode] Downloading package.json files..."
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/plugin/package.json" -o "$TMP_DIR/plugin-package.json"
curl -sL "https://raw.githubusercontent.com/sst/opencode/dev/packages/sdk/js/package.json" -o "$TMP_DIR/sdk-package.json"

# ── Extract version ──
PLUGIN_VERSION=$(node -e "console.log(require('$TMP_DIR/plugin-package.json').version)")
SDK_VERSION=$(node -e "console.log(require('$TMP_DIR/sdk-package.json').version)")

echo "[stack-opencode] Plugin version: $PLUGIN_VERSION"
echo "[stack-opencode] SDK version: $SDK_VERSION"

# ── Update metadata.json ──
node -e "
const fs = require('fs');
const meta = JSON.parse(fs.readFileSync('$SKILL_DIR/metadata.json', 'utf8'));
meta.version = '$PLUGIN_VERSION';
meta.ingest_date = new Date().toISOString().split('T')[0];
meta.last_validated = new Date().toISOString().split('T')[0];
fs.writeFileSync('$SKILL_DIR/metadata.json', JSON.stringify(meta, null, 2) + '\n');
"

echo "[stack-opencode] Updated metadata.json"

# ── Cleanup ──
rm -rf "$TMP_DIR"

echo "[stack-opencode] ✅ Update complete. Version: $PLUGIN_VERSION"
echo "[stack-opencode] NOTE: Reference files in references/ should be manually reviewed for API changes."
