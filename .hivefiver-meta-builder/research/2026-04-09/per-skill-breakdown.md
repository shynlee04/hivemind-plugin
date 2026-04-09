# Per-Skill Detailed Breakdown

**Date:** 2026-04-09

---

## 1. agent-authorization → FLAG (Merge)

**Root cause:** No standalone expertise. It's a gate-checking workflow that belongs inside agent creation.

**What it teaches:** 4-gate authorization checklist (skills loaded → specialists available → capability match → scope defined) + checkpoint types (human-verify, decision, human-action).

**Overlap with `agents-and-subagents-dev`:**
- Both cover agent creation permissions
- Both cover specialist capability matching
- Both cover delegation scope definition
- `agent-authorization` adds checkpoint XML templates; `agents-and-subagents-dev` has better delegation protocol

**Refactoring plan:**
1. Extract checkpoint XML templates → add to `agents-and-subagents-dev` as "Authorization Checkpoints" section
2. Merge specialist capability matrix → already exists in `agents-and-subagents-dev`
3. Delete `agent-authorization/SKILL.md` and its directory

**Estimated LOC after merge:** +50 lines to `agents-and-subagents-dev`

---

## 2. agents-and-subagents-dev → PASS

**Strengths:** "Iron Law" framing, agent rationalization table, worked delegation example, frontmatter guide, worktree rules, session ID tracking.

**Weaknesses:** Description too broad (agent creation + delegation + worktree + session ID + parallel tasks + fork sessions). Could be split but currently coherent enough.

**No action needed.**

---

## 3. command-dev → PASS (but absorbs others)

**Strengths:** Clear Iron Law, agent rationalization table, command anatomy reference, non-interactive shell mandates, anti-patterns.

**Will absorb:**
- `command-parser`'s $ARGUMENTS grammar (add as reference section)
- `opencode-non-interactive-shell`'s banned commands table (or differentiate clearly)

**Refactoring plan:**
1. Add `$ARGUMENTS Parsing Reference` section from `command-parser`
2. Add `Shell Safety Quick Reference` from `opencode-non-interactive-shell` OR merge entirely
3. Update description to reflect expanded scope

---

## 4. command-parser → FLAG (Merge or Differentiate)

**Option A — Merge:** Move parsing patterns into `command-dev` as reference section. Delete standalone skill.

**Option B — Differentiate:** Add "When to Use" overview. Clarify: this skill parses `$ARGUMENT` strings mentally (LLM parsing, not code). Add worked examples showing command string → flags map conversion.

**Recommendation:** Option A (merge). Command parsing is not a standalone expertise — it's part of command creation.

---

## 5. coordinating-loop → PASS

**Strengths:** Best-in-class skill. Hierarchy enforcement, procedural steps (ASSESS→DECIDE→DISPATCH→MONITOR→INTEGRATE→VERIFY), gate scripts, ralph-loop integration, worked example, anti-patterns, platform adaptation.

**No action needed.** This is the gold standard for Group 1 skills.

---

## 6. custom-tools-dev → PASS

**Strengths:** Zod-first approach, plugin lifecycle, script rule, agent rationalization table, worked example, anti-patterns.

**No action needed.**

---

## 7. gsd-agent-composition → PASS

**Strengths:** XML block quick reference, 5 non-negotiables, loading triggers, anti-patterns, worked example template.

**Minor issue:** Description very long. Could be tightened but content is excellent.

**No action needed.**

---

## 8. harness-audit → FLAG (Rewrite Body)

**Problem:** Body is 80% dispatch orchestration, 0% audit methodology. A skill should TEACH expertise, not just delegate.

**What's missing:**
- What makes a good skill? (trigger accuracy, description quality, reference completeness)
- What makes a good agent? (role clarity, permission minimization, delegation envelope)
- What makes a good command? ($ARGUMENTS usage, shell safety, agent binding)
- Quality scoring rubric
- Evidence collection patterns

**Refactoring plan:**
1. Keep dispatch orchestration as "Execution" section
2. ADD "Audit Methodology" section with quality dimensions per artifact type
3. ADD "Scoring Rubric" with concrete criteria
4. ADD worked example of auditing a real skill

---

## 9. harness-delegation-inspection → PASS

**Strengths:** GSD execution model, bash→parse→connect→launch→fail-resume, checkpoint format, deviation rules, wave-based execution, MCP usage, inspection protocol.

**No action needed.**

---

## 10. hm-deep-research → PASS

**Strengths:** Case-based teaching, 6 concepts with decision frameworks, edge cases, requirements-vs-spec boundary, research archetypes, tool quick reference, budget rules, anti-patterns.

**No action needed.** Excellent Group 2 skill.

---

## 11. hm-detective → PASS

**Strengths:** Three reading modes with token costs, escalation rules, token-efficient patterns, tech registry, swarm recovery, surgical edits, document pipeline.

**No action needed.** Excellent Group 2 skill.

---

## 12. hm-synthesis → PASS

**Strengths:** Compression tiers, cross-dep 5-step protocol, interface extraction, pattern classifier, corpus gate, artifact export, anti-patterns.

**No action needed.** Excellent Group 2 skill.

---

## 13. meta-builder → PASS

**Strengths:** Routing table, stacking recipes, power tools reference, 5-step workflow, anti-patterns, question discipline, reference map.

**No action needed.** The definitive router skill.

---

## 14. oh-my-openagent-reference → BLOCK (Delete)

**Problem:** Not a skill. It's a README for packed XML. No expertise taught.

**Evidence:**
- Description: "Reference codebase for oh-my-openagent"
- Body: "How to Use" = grep instructions
- No workflow, no decision framework, no specialist knowledge

**Refactoring plan:**
1. Move packed XML to `opencode-platform-reference/references/`
2. Delete `oh-my-openagent-reference/` directory
3. Remove from any skill stacks that reference it

---

## 15. opencode-non-interactive-shell → FLAG (Merge or Add Examples)

**Option A — Merge:** Fold into `command-dev`'s shell safety section.

**Option B — Add substance:** Add worked examples showing headless shell failures. Add "cognitive patterns" with BAD vs GOOD framing. Add prompt handling workarounds.

**Recommendation:** Option A. Shell safety is not a standalone expertise — it's part of command execution.

---

## 16. opencode-platform-reference → PASS

**Strengths:** 20 reference files indexed, composition patterns (permission cascading, tool hook pipeline, agent-skill loading, subtask spawning), anti-patterns.

**No action needed.** Good reference skill.

---

## 17. phase-loop → FLAG (Add Worked Examples)

**Problem:** Skeleton content. Loop definition, exit criteria, stall detection — but no worked examples, no integration with critic/builder agents.

**What's missing:**
- Worked example: critic reviews document → phase-loop applies fixes → validator re-checks
- Integration with `coordinating-loop` (when to use which)
- Real anti-pattern examples

**Refactoring plan:**
1. Add worked example with critic/builder cycle
2. Add "phase-loop vs coordinating-loop" differentiation
3. Add frontmatter metadata (currently missing `version`, `role`)

---

## 18. planning-with-files → PASS

**Strengths:** Iron Law, 3-file system, tiered response, delegation protocol, session recovery, error discipline, anti-patterns.

**No action needed.** Excellent Group 1 skill.

---

## 19. session-context-manager → FLAG (Merge or Differentiate)

**Problem:** Overlaps with `planning-with-files` — both persist state, both manage phases, both track checkpoints.

**Differentiation if kept:**
- `planning-with-files` = task-level (task_plan.md, findings.md, progress.md)
- `session-context-manager` = YAML frontmatter checkpoint schema for phase transitions

**Merge if combined:**
- Add "Session Context Schema" section to `planning-with-files`
- Delete standalone skill

**Recommendation:** Merge. The context schema is a detail of planning, not a standalone expertise.

---

## 20. use-authoring-skills → PASS

**Strengths:** Iron Law (description = skill), preflight validator, decision tree, agentskills.io principles, validation loop, gate system, worked example, platform adaptation, script audit.

**No action needed.** Excellent Group 2 skill.

---

## 21. user-intent-interactive-loop → PASS

**Strengths:** Hard gates, PROBE/UNDERSTAND/PLAN/DELEGATE/UPDATE/DELIVER loop, 6 stop conditions, question protocols, persistence protocol, anti-patterns, worked examples.

**No action needed.** Excellent Group 1 skill.

---

## 22. (implicit) — The Missing Skills

### Gaps identified during inventory:

1. **No skill teaches `permission` configuration** — permissions are mentioned in `agents-and-subagents-dev` and `opencode-platform-reference` but no dedicated skill.
2. **No skill teaches `workflow` authoring** — workflows are mentioned in meta-builder's routing table but no dedicated skill exists.
3. **No skill teaches `rule` configuration** — `.opencode/rules/` mentioned but no skill teaches rule authoring.

*These are observations for future skill creation, not refactoring targets.*
