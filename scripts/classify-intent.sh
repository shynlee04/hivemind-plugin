#!/usr/bin/env bash
#
# classify-intent.sh - Deprecated startup routing donor
#
# Root-level intent/lineage classification is now owned by:
#   - src/lib/session-intent-classifier.ts
#
# Kept only as a compatibility marker so stale callers fail closed instead of
# producing parallel lineage authority from an old shell classifier.

set -u

cat >&2 <<'EOF'
DEPRECATED: scripts/classify-intent.sh is no longer an authoritative classifier.

Use the canonical src classifier instead:
  - src/lib/session-intent-classifier.ts

This legacy script now exits without producing routing authority.
EOF

exit 2
