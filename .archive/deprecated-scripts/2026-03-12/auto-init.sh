#!/usr/bin/env bash
#
# auto-init.sh - Deprecated startup donor
#
# This script no longer owns HiveMind bootstrap formation.
# Canonical owners:
#   - project bootstrap: src/cli/init.ts + src/lib/fs/planning-ops.ts
#   - session-created bootstrap: src/hooks/event-handler.ts
#   - manual recovery fallback: src/tools/hivemind-bootstrap.ts
#
# Kept only as a compatibility marker so old references fail closed instead of
# silently mutating .hivemind with legacy assumptions.

set -u

cat >&2 <<'EOF'
DEPRECATED: scripts/auto-init.sh is no longer an authoritative startup path.

Use one of:
  - npx hivemind-context-governance init --mode assisted
  - the canonical src runtime bootstrap in src/hooks/event-handler.ts
  - hivemind_bootstrap for controlled manual recovery

This legacy script now exits without writing .hivemind state.
EOF
exit 2
