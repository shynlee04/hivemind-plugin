#!/usr/bin/env bash
# hm-reality-check.sh — First-turn reality check for HiveMind
# Agent runs this ONCE at session start to understand project state
# before doing ANYTHING. Output is structured for agent consumption.
#
# Usage: bash bin/hm-reality-check.sh [project-root]
# Default project-root: current directory

set -euo pipefail

ROOT="${1:-.}"
HM="${ROOT}/.hivemind"

echo "=== HIVEMIND REALITY CHECK ==="
echo "Project root: $(cd "$ROOT" && pwd)"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo ""

# ─── 1. BRAIN STATE ───────────────────────────────────────────────
echo "--- BRAIN STATE ---"
if [ -f "$HM/brain.json" ]; then
  # Extract key fields with node (portable JSON parsing)
  node -e "
    const b = JSON.parse(require('fs').readFileSync('$HM/brain.json','utf8'));
    const ago = (ms) => {
      const d = Date.now() - ms;
      if (d < 3600000) return Math.floor(d/60000) + 'm ago';
      if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
      return Math.floor(d/86400000) + 'd ago';
    };
    console.log('Session ID: ' + b.session.id);
    console.log('Mode: ' + b.session.mode);
    console.log('Status: ' + b.session.governance_status);
    console.log('Governance: ' + b.session.governance_mode);
    console.log('Last activity: ' + ago(b.session.last_activity));
    console.log('Turns: ' + b.metrics.turn_count);
    console.log('Drift: ' + b.metrics.drift_score + '/100');
    console.log('Files touched: ' + b.metrics.files_touched.length);
    console.log('Compactions: ' + (b.compaction_count || 0));
    console.log('Pending failure: ' + (b.pending_failure_ack || false));
    console.log('Trajectory: ' + (b.hierarchy.trajectory || '(none)'));
    console.log('Tactic: ' + (b.hierarchy.tactic || '(none)'));
    console.log('Action: ' + (b.hierarchy.action || '(none)'));
  " 2>/dev/null || echo "ERROR: brain.json exists but failed to parse"
else
  echo "NO BRAIN — .hivemind/brain.json does not exist"
fi
echo ""

# ─── 2. CONFIG ────────────────────────────────────────────────────
echo "--- CONFIG ---"
if [ -f "$HM/config.json" ]; then
  node -e "
    const c = JSON.parse(require('fs').readFileSync('$HM/config.json','utf8'));
    console.log('Governance mode: ' + (c.governance_mode || 'unknown'));
    console.log('Language: ' + (c.language || 'unknown'));
    console.log('Automation: ' + (c.automation_level || 'unknown'));
    console.log('Expert level: ' + (c.agent_behavior?.expert_level || 'unknown'));
    console.log('Stale days: ' + (c.stale_session_days || 'unknown'));
  " 2>/dev/null || echo "ERROR: config.json parse failed"
else
  echo "NO CONFIG — hivemind not initialized"
fi
echo ""

# ─── 3. MEMS ──────────────────────────────────────────────────────
echo "--- MEMS ---"
if [ -f "$HM/mems.json" ]; then
  node -e "
    const m = JSON.parse(require('fs').readFileSync('$HM/mems.json','utf8'));
    const shelves = {};
    for (const mem of m) {
      shelves[mem.shelf] = (shelves[mem.shelf] || 0) + 1;
    }
    console.log('Total mems: ' + m.length);
    for (const [s,c] of Object.entries(shelves)) {
      console.log('  ' + s + ': ' + c);
    }
    if (m.length > 0) {
      const latest = m[m.length-1];
      const age = Date.now() - latest.timestamp;
      const ageStr = age < 86400000 ? Math.floor(age/3600000)+'h ago' : Math.floor(age/86400000)+'d ago';
      console.log('Latest: [' + latest.shelf + '] ' + ageStr + ' — ' + latest.content.substring(0,80));
    }
  " 2>/dev/null || echo "ERROR: mems.json parse failed"
else
  echo "NO MEMS"
fi
echo ""

# ─── 4. HIERARCHY TREE ───────────────────────────────────────────
echo "--- HIERARCHY ---"
if [ -f "$HM/hierarchy.json" ]; then
  node -e "
    const h = JSON.parse(require('fs').readFileSync('$HM/hierarchy.json','utf8'));
    const count = (n) => { let c=1; for (const ch of (n.children||[])) c+=count(ch); return c; };
    if (h.root) {
      console.log('Nodes: ' + count(h.root));
      console.log('Root: ' + h.root.content.substring(0,80));
      const cursor = h.cursor;
      if (cursor) console.log('Cursor: ' + cursor);
    } else {
      console.log('EMPTY — no hierarchy tree');
    }
  " 2>/dev/null || echo "ERROR: hierarchy.json parse failed"
else
  echo "NO HIERARCHY"
fi
echo ""

# ─── 5. SESSIONS ─────────────────────────────────────────────────
echo "--- SESSIONS ---"
if [ -d "$HM/sessions" ]; then
  active_count=$(find "$HM/sessions" -maxdepth 1 -name "*.md" ! -name "active.md" ! -name "index.md" 2>/dev/null | wc -l | tr -d ' ')
  archive_count=$(find "$HM/sessions/archive" -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  export_count=$(find "$HM/sessions/archive/exports" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
  echo "Active session files: $active_count"
  echo "Archived sessions: $archive_count"
  echo "Session exports: $export_count"
  if [ -f "$HM/sessions/manifest.json" ]; then
    echo "Manifest: exists"
  else
    echo "Manifest: MISSING"
  fi
else
  echo "NO SESSIONS DIRECTORY"
fi
echo ""

# ─── 6. FILE MAP ─────────────────────────────────────────────────
echo "--- .HIVEMIND FILE MAP ---"
if [ -d "$HM" ]; then
  find "$HM" -type f 2>/dev/null | while read -r f; do
    rel="${f#$HM/}"
    size=$(wc -c < "$f" 2>/dev/null | tr -d ' ')
    age_sec=$(( $(date +%s) - $(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null || echo 0) ))
    if [ "$age_sec" -lt 3600 ]; then
      age="${age_sec}s"
    elif [ "$age_sec" -lt 86400 ]; then
      age="$((age_sec/3600))h"
    else
      age="$((age_sec/86400))d"
    fi
    echo "  $rel ($size bytes, $age)"
  done
else
  echo "NO .hivemind/ DIRECTORY"
fi
echo ""

# ─── 7. PROJECT FILE CLASSIFICATION ──────────────────────────────
echo "--- PROJECT FILES ---"
cd "$ROOT"

echo "CODE:"
find . -maxdepth 3 -type f \( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.hivemind/*" 2>/dev/null | head -30 | while read -r f; do
  echo "  $f"
done

echo "DOCS:"
find . -maxdepth 3 -type f \( -name "*.md" -o -name "*.txt" -o -name "*.rst" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.hivemind/*" ! -path "*/.planning/*" 2>/dev/null | head -20 | while read -r f; do
  age_sec=$(( $(date +%s) - $(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null || echo 0) ))
  stale=""
  if [ "$age_sec" -gt 172800 ]; then stale=" [STALE >48h]"; fi
  echo "  $f$stale"
done

echo "CONFIGS:"
find . -maxdepth 2 -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.yml" -o -name "*.toml" \) \
  ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.hivemind/*" ! -path "*/.planning/*" 2>/dev/null | head -15 | while read -r f; do
  echo "  $f"
done

echo "PLANNING/ARTIFACTS:"
if [ -d ".planning" ]; then
  find .planning -type f 2>/dev/null | head -20 | while read -r f; do
    age_sec=$(( $(date +%s) - $(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null || echo 0) ))
    stale=""
    if [ "$age_sec" -gt 172800 ]; then stale=" [STALE >48h]"; fi
    echo "  $f$stale"
  done
fi
echo ""

# ─── 8. PROBLEMS DETECTED ────────────────────────────────────────
echo "--- PROBLEMS DETECTED ---"
problems=0

# Missing .gitignore entry
if [ -f "$ROOT/.gitignore" ]; then
  if ! grep -q "\.hivemind" "$ROOT/.gitignore" 2>/dev/null; then
    echo "  [CRITICAL] .hivemind/ not in .gitignore — state files will be committed"
    problems=$((problems+1))
  fi
else
  echo "  [WARN] No .gitignore file found"
  problems=$((problems+1))
fi

# Backup file exists but never read
if [ -f "$HM/brain.json.bak" ]; then
  echo "  [WARN] brain.json.bak exists — backup recovery is not implemented"
  problems=$((problems+1))
fi

# Orphan session files (no manifest entry)
if [ -f "$HM/sessions/manifest.json" ] && [ -d "$HM/sessions" ]; then
  orphans=$(find "$HM/sessions" -maxdepth 1 -name "*.md" ! -name "active.md" ! -name "index.md" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$orphans" -gt 5 ]; then
    echo "  [WARN] $orphans session files accumulating — no housekeeping"
    problems=$((problems+1))
  fi
fi

# Mems growing unbounded
if [ -f "$HM/mems.json" ]; then
  mem_count=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$HM/mems.json','utf8')).length)" 2>/dev/null || echo 0)
  if [ "$mem_count" -gt 50 ]; then
    echo "  [WARN] $mem_count mems — growing unbounded, no cap"
    problems=$((problems+1))
  fi
fi

# Brain last activity staleness
if [ -f "$HM/brain.json" ]; then
  stale_hours=$(node -e "
    const b = JSON.parse(require('fs').readFileSync('$HM/brain.json','utf8'));
    console.log(Math.floor((Date.now()-b.session.last_activity)/3600000));
  " 2>/dev/null || echo 0)
  if [ "$stale_hours" -gt 48 ]; then
    echo "  [WARN] Last brain activity was ${stale_hours}h ago — context is stale"
    problems=$((problems+1))
  fi
fi

if [ "$problems" -eq 0 ]; then
  echo "  None detected"
fi
echo ""
echo "=== END REALITY CHECK ==="
