#!/usr/bin/env bash
#
# detect-entry.sh - Deprecated entry-state donor
#
# This script no longer owns entry-state detection or lineage authority.
# Canonical owners:
#   - session/bootstrap state: src/hooks/event-handler.ts
#   - runtime state reads: src/lib/persistence.ts + src/lib/paths.ts
#   - lineage classification: src/lib/session-intent-classifier.ts
#
# Kept only as a compatibility marker so stale callers fail closed instead of
# routing from legacy flat-state assumptions.

set -u

cat >&2 <<'EOF'
DEPRECATED: scripts/detect-entry.sh is no longer an authoritative entry probe.

Use canonical src-owned state and lineage readers instead:
  - src/hooks/event-handler.ts
  - src/lib/persistence.ts
  - src/lib/session-intent-classifier.ts

This legacy script now exits without producing routing authority.
EOF

exit 2
