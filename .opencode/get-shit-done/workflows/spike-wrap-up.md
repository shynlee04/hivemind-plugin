<purpose>
Curate spike experiment findings and package them into a persistent project skill for future
build conversations. Reads from `.planning/spikes/`, writes skill to `./.opencode/skills/spike-findings-[project]/`
(project-local) and summary to `.planning/spikes/WRAP-UP-SUMMARY.md`.
Companion to `/gsd-spike`.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="banner">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPIKE WRAP-UP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="gather">
## Gather Spike Inventory

1. Read `.planning/spikes/MANIFEST.md` for the overall idea context
2. Glob `.planning/spikes/*/README.md` and parse YAML frontmatter from each
3. Check if `./.opencode/skills/spike-findings-*/SKILL.md` exists for this project
   - If yes: read its `processed_spikes` list from the metadata section and filter those out
   - If no: all spikes are candidates

If no unprocessed spikes exist:
```
No unprocessed spikes found in `.planning/spikes/`.
Run `/gsd-spike` first to create experiments.
```
Exit.

Check `commit_docs` config:
```bash
COMMIT_DOCS=$(gsd-sdk query config-get commit_docs 2>/dev/null || echo "true")
```
</step>

<step name="curate">
## Curate Spikes One-at-a-Time

Present each unprocessed spike in ascending order. For each spike, show:

- **Spike number and name**
- **Validates:** the Given/When/Then from frontmatter
- **Verdict:** VALIDATED / INVALIDATED / PARTIAL
- **Tags:** from frontmatter
- **Key findings:** summarize the Results section from the README
- **Grey areas:** anything uncertain or partially proven

Then ask the user:

╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: Decision Required                               ║
╚══════════════════════════════════════════════════════════════╝

Spike {NNN}: {name} — {verdict}

{key findings summary}

──────────────────────────────────────────────────────────────
→ Include / Exclude / Partial / Help me UAT this
──────────────────────────────────────────────────────────────

**If "Help me UAT this":**
1. Read the spike's README "How to Run" and "What to Expect" sections
2. Present step-by-step instructions
3. Ask: "Does this match what you expected?"
4. After UAT, return to the include/exclude/partial decision

**If "Partial":**
Ask what specifically to include or exclude. Record their notes alongside the spike.
</step>

<step name="group">
## Auto-Group by Feature Area

After all spikes are curated:

1. Read all included spikes' tags, names, `related` fields, and content
2. Propose feature-area groupings, e.g.:
   - "**WebSocket Streaming** — spikes 001, 004, 007"
   - "**Foo API Integration** — spikes 002, 003"
   - "**PDF Parsing** — spike 005"
3. Present the grouping for approval — user may merge, split, rename, or rearrange

Each group becomes one reference file in the generated skill.
</step>

<step name="skill_name">
## Determine Output Skill Name

Derive the skill name from the project directory:

1. Get the project root directory name (e.g., `solana-tracker`)
2. The skill will be created at `./.opencode/skills/spike-findings-[project-dir-name]/`

If a skill already exists at that path (append mode), update in place.
</step>

<step name="copy_sources">
## Copy Source Files

For each included spike:

1. Identify the core source files — the actual scripts, main files, and config that make the spike work. Exclude:
   - `node_modules/`, `__pycache__/`, `.venv/`, build artifacts
   - Lock files (`package-lock.json`, `yarn.lock`, etc.)
   - `.git/`, `.DS_Store`
2. Copy the README.md and core source files into `sources/NNN-spike-name/` inside the generated skill directory
</step>

<step name="synthesize">
## Synthesize Reference Files

For each feature-area group, write a reference file at `references/[feature-area-name].md`:

```markdown
# [Feature Area Name]

## Validated Patterns
[For each validated finding: describe the approach that works, include key code snippets extracted from the spike source, explain why it works]

## Landmines
[Things that look right but aren't. Gotchas. Anti-patterns discovered during spiking.]

## Constraints
[Hard facts: rate limits, library limitations, version requirements, incompatibilities]

## Origin
Synthesized from spikes: NNN, NNN, NNN
Source files available in: sources/NNN-spike-name/, sources/NNN-spike-name/
```
</step>

<step name="write_skill">
## Write SKILL.md

Create (or update) the generated skill's SKILL.md:

```markdown
---
name: spike-findings-[project-dir-name]
description: Validated patterns, constraints, and implementation knowledge from spike experiments. Auto-loaded during implementation work on [project-dir-name].
---

<context>
## Project: [project-dir-name]

[One paragraph from MANIFEST.md describing the overall idea]

Spike sessions wrapped: [date(s)]
</context>

<findings_index>
## Feature Areas

| Area | Reference | Key Finding |
|------|-----------|-------------|
| [Name] | references/[name].md | [One-line summary] |

## Source Files

Original spike source files are preserved in `sources/` for complete reference.
</findings_index>

<metadata>
## Processed Spikes

[List of spike numbers wrapped up]

- 001-spike-name
- 002-spike-name
</metadata>
```
</step>

<step name="write_summary">
## Write Planning Summary

Write `.planning/spikes/WRAP-UP-SUMMARY.md` for project history:

```markdown
# Spike Wrap-Up Summary

**Date:** [date]
**Spikes processed:** [count]
**Feature areas:** [list]
**Skill output:** `./.opencode/skills/spike-findings-[project]/`

## Included Spikes
| # | Name | Verdict | Feature Area |
|---|------|---------|--------------|

## Excluded Spikes
| # | Name | Reason |
|---|------|--------|

## Key Findings
[consolidated findings summary]
```
</step>

<step name="update_claude_md">
## Update Project AGENTS.md

Add an auto-load routing line to the project's AGENTS.md (create the file if it doesn't exist):

```
- **Spike findings for [project]** (implementation patterns, constraints, gotchas) → `Skill("spike-findings-[project-dir-name]")`
```

If this routing line already exists (append mode), leave it as-is.
</step>

<step name="commit">
Commit all artifacts (if `COMMIT_DOCS` is true):

```bash
gsd-sdk query commit "docs(spike-wrap-up): package [N] spike findings into project skill" .planning/spikes/WRAP-UP-SUMMARY.md
```
</step>

<step name="report">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► SPIKE WRAP-UP COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Curated:** {N} spikes ({included} included, {excluded} excluded)
**Feature areas:** {list}
**Skill:** `./.opencode/skills/spike-findings-[project]/`
**Summary:** `.planning/spikes/WRAP-UP-SUMMARY.md`
**AGENTS.md:** routing line added

The spike-findings skill will auto-load in future build conversations.
```

───────────────────────────────────────────────────────────────

## ▶ Next Up

**Start building** — plan the real implementation

`/gsd-plan-phase`

───────────────────────────────────────────────────────────────

**Also available:**
- `/gsd-add-phase` — add a phase based on spike findings
- `/gsd-spike` — spike additional ideas
- `/gsd-explore` — continue exploring

───────────────────────────────────────────────────────────────
</step>

</process>

<success_criteria>
- [ ] Every unprocessed spike presented for individual curation
- [ ] Feature-area grouping proposed and approved
- [ ] Spike-findings skill exists at `./.opencode/skills/` with SKILL.md, references/, sources/
- [ ] Core source files from included spikes copied into sources/
- [ ] Reference files contain validated patterns, code snippets, landmines, constraints
- [ ] `.planning/spikes/WRAP-UP-SUMMARY.md` written for project history
- [ ] Project AGENTS.md has auto-load routing line
- [ ] Summary presented with next-step routing
</success_criteria>
