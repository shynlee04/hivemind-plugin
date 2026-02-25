#!/usr/bin/env bash
# validate-framework.sh — Framework asset integrity validator
# Checks cross-references, naming, bridge packs, module completeness, sync state

PASS=0
FAIL=0
WARN=0

pass() { ((PASS++)) || true; }
fail() { ((FAIL++)) || true; echo "FAIL: $1"; }
warn() { ((WARN++)) || true; echo "WARN: $1"; }
ok()   { pass; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== HiveMind Framework Validation ==="
echo ""

# R01: Agent file structure
echo "-- R01: Agent Definitions --"
for f in agents/*.md; do
  name=$(basename "$f" .md)
  if head -20 "$f" | grep -q "^name:" 2>/dev/null; then ok; else fail "R01 $name: missing name"; fi
  if head -20 "$f" | grep -q "^mode:" 2>/dev/null; then ok; else fail "R01 $name: missing mode"; fi
done

# R04: Skill directory structure
echo "-- R04: Skill Structure --"
for d in skills/*/; do
  skill=$(basename "$d")
  if [ -f "${d}SKILL.md" ]; then
    if head -10 "${d}SKILL.md" | grep -q "^name:" 2>/dev/null; then ok; else fail "R04 $skill: SKILL.md missing name"; fi
  else
    fail "R04 $skill: missing SKILL.md"
  fi
done

# R05: No date-stamps
echo "-- R05: No Date-Stamps --"
found=0
for dir in agents commands workflows skills templates prompts scripts references bridges; do
  if [ -d "$dir" ]; then
    matches=$(find "$dir" -maxdepth 2 -name "*[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]*" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$matches" -gt 0 ]; then
      fail "R05: $matches date-stamped files in $dir/"
      found=1
    fi
  fi
done
if [ "$found" -eq 0 ]; then ok; fi

# R06: Cross-reference integrity — command execution_context → workflow exists
echo "-- R06: Cross-References --"
for f in commands/*.md; do
  cmd=$(basename "$f" .md)
  ec=$(grep "^execution_context:" "$f" 2>/dev/null | head -1 | sed 's/execution_context: *//;s/"//g;s/ *$//' || true)
  if [ -n "$ec" ]; then
    if [ -f "$ec" ]; then ok; else fail "R06 $cmd: execution_context '$ec' NOT FOUND"; fi
  fi
done

# R06b: command required_skills → skill dir exists
for f in commands/*.md; do
  cmd=$(basename "$f" .md)
  # Use sed to extract only lines between required_skills: and next YAML key
  sed -n '/^required_skills:/,/^[a-z_]*:/{ /^required_skills:/d; /^[a-z_]*:/d; p; }' "$f" 2>/dev/null | grep "^  - " | while read -r line; do
    skill=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//;s/"//g;s/[[:space:]]*$//')
    if [ -n "$skill" ] && [ "$skill" != "required_skills:" ]; then
      if [ -d "skills/$skill" ]; then pass; else fail "R06 $cmd: skill '$skill' NOT FOUND"; fi
    fi
  done
done

# R06c: command required_templates → template exists
for f in commands/*.md; do
  cmd=$(basename "$f" .md)
  grep -A5 "^required_templates:" "$f" 2>/dev/null | grep "^  - " | while read -r line; do
    tmpl=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//;s/"//g;s/[[:space:]]*$//')
    if [ -n "$tmpl" ] && [ "$tmpl" != "required_templates:" ]; then
      if [ -f "$tmpl" ]; then pass; else fail "R06 $cmd: template '$tmpl' NOT FOUND"; fi
    fi
  done
done

# R07: Root ↔ .opencode sync
echo "-- R07: Sync Check --"
for dir in agents commands workflows; do
  if [ -d ".opencode/$dir" ]; then
    diff_out=$(diff -rq "$dir/" ".opencode/$dir/" 2>/dev/null || true)
    if [ -z "$diff_out" ]; then
      ok
    else
      echo "$diff_out" | while read -r line; do fail "R07: $line"; done
    fi
  fi
done

# R08: Bridge pack integrity
echo "-- R08: Bridge Packs --"
if [ -d "bridges" ]; then
  for d in bridges/*/; do
    pack=$(basename "$d")
    if [ -f "${d}pack.yaml" ]; then
      ok
      # Check target_agent
      target=$(grep "^target_agent:" "${d}pack.yaml" 2>/dev/null | head -1 | sed 's/target_agent: *//' || true)
      if [ -n "$target" ]; then
        if [ -f "agents/${target}.md" ]; then ok; else fail "R08 $pack: target_agent '$target' NOT FOUND"; fi
      fi
    else
      fail "R08 $pack: missing pack.yaml"
    fi
  done
fi

# R09: Module definition integrity
echo "-- R09: Module Definitions --"
if [ -d "modules" ]; then
  for d in modules/*/; do
    mod=$(basename "$d")
    if [ -f "${d}module.yaml" ]; then
      ok
      # Check agent reference
      agent=$(grep "^  agent:" "${d}module.yaml" 2>/dev/null | head -1 | sed 's/  agent: *//' || true)
      if [ -n "$agent" ]; then
        if [ -f "$agent" ]; then ok; else fail "R09 $mod: agent '$agent' NOT FOUND"; fi
      fi
      # Check command references
      grep "^      - commands/" "${d}module.yaml" 2>/dev/null | while read -r line; do
        cmd=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
        if [ -f "$cmd" ]; then pass; else fail "R09 $mod: command '$cmd' NOT FOUND"; fi
      done
      # Check workflow references
      grep "^      - workflows/" "${d}module.yaml" 2>/dev/null | while read -r line; do
        wf=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
        if [ -f "$wf" ]; then pass; else fail "R09 $mod: workflow '$wf' NOT FOUND"; fi
      done
      # Check skill references
      grep "^      - skills/" "${d}module.yaml" 2>/dev/null | while read -r line; do
        skill=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
        if [ -d "$skill" ]; then pass; else fail "R09 $mod: skill '$skill' NOT FOUND"; fi
      done
      # Check template references
      grep "^      - templates/" "${d}module.yaml" 2>/dev/null | while read -r line; do
        tmpl=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
        if [ -f "$tmpl" ]; then pass; else fail "R09 $mod: template '$tmpl' NOT FOUND"; fi
      done
      # Check bridge references
      grep "^      - bridges/" "${d}module.yaml" 2>/dev/null | while read -r line; do
        bridge=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
        if [ -d "$bridge" ]; then pass; else fail "R09 $mod: bridge '$bridge' NOT FOUND"; fi
      done
      # Check prompt references
      grep "^      - prompts/" "${d}module.yaml" 2>/dev/null | while read -r line; do
        prompt=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
        if [ -f "$prompt" ]; then pass; else fail "R09 $mod: prompt '$prompt' NOT FOUND"; fi
      done
      # Check reference references
      grep "^      - references/" "${d}module.yaml" 2>/dev/null | while read -r line; do
        ref=$(echo "$line" | sed 's/^[[:space:]]*-[[:space:]]*//')
        if [ -f "$ref" ]; then pass; else fail "R09 $mod: reference '$ref' NOT FOUND"; fi
      done
    else
      fail "R09 $mod: missing module.yaml"
    fi
  done
fi

# R10: LOC limits
echo "-- R10: Source LOC Limits --"
if [ -d "src" ]; then
  loc_violations=$(find src -name "*.ts" -exec wc -l {} \; 2>/dev/null | awk '$1 > 550' | wc -l | tr -d ' ')
  if [ "$loc_violations" -gt 0 ]; then
    find src -name "*.ts" -exec wc -l {} \; 2>/dev/null | awk '$1 > 550 {print "FAIL: R10 " $2 ": " $1 " LOC"}' | sort -rn
    FAIL=$((FAIL + loc_violations))
  else
    ok
  fi
fi

echo ""
echo "=== RESULTS ==="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
echo "WARN: $WARN"

if [ "$FAIL" -eq 0 ]; then
  echo "Framework validation PASSED"
  exit 0
else
  echo "Framework validation FAILED ($FAIL failures)"
  exit 1
fi
