# Add Backlog Item Workflow

Invoked by `/hm-capture --backlog` (`commands/hm/capture.md`).

Adds an idea to the ROADMAP.md backlog parking lot using 999.x numbering. Backlog items
are unsequenced ideas that aren't ready for active planning — they live outside the normal
phase sequence and accumulate context over time.

<process>

## Step 1: Read ROADMAP.md

Check for existing backlog entries:

```bash
cat .planning/ROADMAP.md
```

## Step 2: Find next backlog number

```bash
# SDK resolution: prefer local hm-tools.cjs, fall back to global hm-sdk (#3668)
Hivemind_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/hivemind/bin/hm-tools.cjs"
if [ -f "$Hivemind_TOOLS" ]; then
  Hivemind_SDK="node $Hivemind_TOOLS"
elif command -v hm-sdk >/dev/null 2>&1; then
  Hivemind_SDK="hm-sdk"
else
  echo "ERROR: hm-sdk not found on PATH and $Hivemind_TOOLS does not exist." >&2
  echo "Run: npx hivemind-cc@latest --claude --local" >&2
  exit 1
fi
NEXT=$($Hivemind_SDK query phase.next-decimal 999 --raw)
```

If no 999.x phases exist yet, `phase.next-decimal` returns `999.1`. Sparse numbering
is fine (e.g. 999.1, 999.3) — always use `phase.next-decimal`, never guess.

## Step 3: Write ROADMAP entry

**Write the ROADMAP entry BEFORE creating the directory.** Directory existence is a
reliable indicator that the phase is already registered, which prevents false duplicate
detection in any hook that checks for existing 999.x directories (#2280).

Add under a `## Backlog` section. If the section doesn't exist, create it at the end
of ROADMAP.md:

```markdown
## Backlog

### Phase {NEXT}: {description} (BACKLOG)

**Goal:** [Captured for future planning]
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /hm-review-backlog when ready)
```

## Step 4: Create the phase directory

Apply the `project_code` prefix (if set in `.planning/config.json`) so the backlog directory name is consistent with all other phase-creation paths:

```bash
SLUG=$($Hivemind_SDK query generate-slug "$ARGUMENTS" --raw)
PROJECT_CODE=$($Hivemind_SDK query config-get project_code --raw 2>/dev/null || echo "")
PREFIX=$([ -n "$PROJECT_CODE" ] && echo "${PROJECT_CODE}-" || echo "")
PHASE_DIR=".planning/phases/${PREFIX}${NEXT}-${SLUG}"
mkdir -p "${PHASE_DIR}"
touch "${PHASE_DIR}/.gitkeep"
```

## Step 5: Commit

```bash
$Hivemind_SDK query commit "docs: add backlog item ${NEXT} — ${ARGUMENTS}" --files .planning/ROADMAP.md "${PHASE_DIR}/.gitkeep"
```

## Step 6: Report

```
## 📋 Backlog Item Added

Phase {NEXT}: {description}
Directory: {PHASE_DIR}/

This item lives in the backlog parking lot.
Use /hm-discuss-phase {NEXT} to explore it further.
Use /hm-review-backlog to promote items to active milestone.
```

</process>

<notes>
- 999.x numbering keeps backlog items out of the active phase sequence
- Phase directories are created immediately so /hm-discuss-phase and /hm-plan-phase work on them
- No `Depends on:` field — backlog items are unsequenced by definition
- Sparse numbering is fine (999.1, 999.3) — always uses next-decimal
- Promote backlog items to the active milestone with /hm-review-backlog
</notes>
