<purpose>
Rapid feasibility validation through focused, throwaway experiments. Each spike answers one
specific question with observable evidence. Saves artifacts to `.planning/spikes/`.
Companion to `/gsd-spike-wrap-up`.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="banner">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPIKING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Parse `$ARGUMENTS` for:
- `--quick` flag → set `QUICK_MODE=true`
- Remaining text → the idea to spike
</step>

<step name="setup_directory">
Create `.planning/spikes/` if it doesn't exist:

```bash
mkdir -p .planning/spikes
```

Check for existing spikes to determine numbering:
```bash
ls -d .planning/spikes/[0-9][0-9][0-9]-* 2>/dev/null | sort | tail -1
```

Check `commit_docs` config:
```bash
COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
```
</step>

<step name="detect_stack">
Check for the project's tech stack to inform spike technology choices:

```bash
ls package.json pyproject.toml Cargo.toml go.mod 2>/dev/null
```

Use the project's language/framework by default. For greenfield projects with no existing stack, pick whatever gets to a runnable result fastest (Python, Node, Bash, single HTML file).

Avoid unless the spike specifically requires it:
- Complex package management beyond `npm install` or `pip install`
- Build tools, bundlers, or transpilers
- Docker, containers, or infrastructure
- Env files or config systems — hardcode everything
</step>

<step name="decompose">
**If `QUICK_MODE` is true:** Skip decomposition and alignment. Take the user's idea as a single spike question. Assign it spike number `001` (or next available). Jump to `build_spikes`.

**Otherwise:**

Break the idea into 2-5 independent questions that each prove something specific. Frame each as an informal Given/When/Then. Present as a table:

```
| # | Spike | Validates (Given/When/Then) | Risk |
|---|-------|-----------------------------|------|
| 001 | websocket-streaming | Given a WS connection, when LLM streams tokens, then client receives chunks < 100ms | **High** |
| 002 | pdf-extraction | Given a multi-page PDF, when parsed with pdfjs, then structured text is extractable | Medium |
```

Good spikes answer one specific feasibility question:
- "Can we parse X format and extract Y?" — script that does it on a sample file
- "How fast is X approach?" — benchmark with real-ish data
- "Can we get X and Y to talk to each other?" — thinnest integration
- "What does X feel like as a UI?" — minimal interactive prototype
- "Does X API actually support Y?" — script that calls it and shows the response

Bad spikes are too broad or don't produce observable output:
- "Set up the project" — not a question, just busywork
- "Design the architecture" — planning, not spiking
- "Build the backend" — too broad, no specific question

Order by risk — the spike most likely to kill the idea runs first.
</step>

<step name="align">
**If `QUICK_MODE` is true:** Skip.

Present the ordered spike list and ask which to build:

╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Decision Required                               ║
╚══════════════════════════════════════════════════════════════╝

{spike table from decompose step}

──────────────────────────────────────────────────────────────
→ Build all in this order, or adjust the list?
──────────────────────────────────────────────────────────────

The user may reorder, merge, split, or skip spikes. Wait for alignment.
</step>

<step name="create_manifest">
Create or update `.planning/spikes/MANIFEST.md`:

```markdown
# Spike Manifest

## Idea
[One paragraph describing the overall idea being explored]

## Spikes

| # | Name | Validates | Verdict | Tags |
|---|------|-----------|---------|------|
```

If MANIFEST.md already exists, append new spikes to the existing table.
</step>

<step name="build_spikes">
Build each spike sequentially, highest-risk first.

### For Each Spike:

**a.** Find next available number by checking existing `.planning/spikes/NNN-*/` directories.
Format: three-digit zero-padded + hyphenated descriptive name.

**b.** Create the spike directory: `.planning/spikes/NNN-descriptive-name/`

**c.** Build the minimum code that answers the spike's question. Every line must serve the question — nothing incidental. If auth isn't the question, hardcode a token. If the database isn't the question, use a JSON file. Strip everything that doesn't directly answer "does X work?"

**d.** Write `README.md` with YAML frontmatter:

```markdown
---
spike: NNN
name: descriptive-name
validates: "Given [precondition], when [action], then [expected outcome]"
verdict: PENDING
related: []
tags: [tag1, tag2]
---

# Spike NNN: Descriptive Name

## What This Validates
[The specific feasibility question, framed as Given/When/Then]

## How to Run
[Single command or short sequence to run the spike]

## What to Expect
[Concrete observable outcomes: "When you click X, you should see Y within Z seconds"]

## Results
[Filled in after running — verdict, evidence, surprises]
```

**e.** Auto-link related spikes: read existing spike READMEs and infer relationships from tags, names, and descriptions. Write the `related` field silently.

**f.** Run and verify:
- If self-verifiable: run it, check output, update README verdict and Results section
- If needs human judgment: run it, present instructions using a checkpoint box:

╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Verification Required                           ║
╚══════════════════════════════════════════════════════════════╝

**Spike {NNN}: {name}**

**How to run:** {command}
**What to expect:** {concrete outcomes}

──────────────────────────────────────────────────────────────
→ Does this match what you expected? Describe what you see.
──────────────────────────────────────────────────────────────

**g.** Update verdict to VALIDATED / INVALIDATED / PARTIAL. Update Results section with evidence.

**h.** Update `.planning/spikes/MANIFEST.md` with the spike's row.

**i.** Commit (if `COMMIT_DOCS` is true):
```bash
gsd-sdk query commit "docs(spike-NNN): [VERDICT] — [key finding in one sentence]" .planning/spikes/NNN-descriptive-name/ .planning/spikes/MANIFEST.md
```

**j.** Report before moving to next spike:
```
◆ Spike NNN: {name}
  Verdict: {VALIDATED ✓ / INVALIDATED ✗ / PARTIAL ⚠}
  Finding: {one sentence}
  Impact: {effect on remaining spikes, if any}
```

**k.** If a spike invalidates a core assumption: stop and present:

╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Decision Required                               ║
╚══════════════════════════════════════════════════════════════╝

Core assumption invalidated by Spike {NNN}.

{what was invalidated and why}

──────────────────────────────────────────────────────────────
→ Continue with remaining spikes / Pivot approach / Abandon
──────────────────────────────────────────────────────────────

Only proceed if the user says to.
</step>

<step name="report">
After all spikes complete, present the consolidated report:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPIKE COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Verdicts

| # | Name | Verdict |
|---|------|---------|
| 001 | {name} | ✓ VALIDATED |
| 002 | {name} | ✗ INVALIDATED |

## Key Discoveries
{surprises, gotchas, things that weren't expected}

## Feasibility Assessment
{overall, is the idea viable?}

## Signal for the Build
{what the real implementation should use, avoid, or watch out for}
```

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Package findings** — wrap spike knowledge into a reusable skill

`/gsd-spike-wrap-up`

───────────────────────────────────────────────────────────────

**Also available:**
- `/gsd-plan-phase` — start planning the real implementation
- `/gsd-explore` — continue exploring the idea
- `/gsd-add-phase` — add a phase to the roadmap based on findings

───────────────────────────────────────────────────────────────
</step>

</process>

<success_criteria>
- [ ] `.planning/spikes/` created (auto-creates if needed, no project init required)
- [ ] Each spike answers one specific question with observable evidence
- [ ] Each spike README has complete frontmatter, run instructions, and results
- [ ] User verified each spike (self-verified or human checkpoint)
- [ ] MANIFEST.md is current
- [ ] Commits use `docs(spike-NNN): [VERDICT]` format
- [ ] Consolidated report presented with next-step routing
- [ ] If core assumption invalidated, execution stopped and user consulted
</success_criteria>
