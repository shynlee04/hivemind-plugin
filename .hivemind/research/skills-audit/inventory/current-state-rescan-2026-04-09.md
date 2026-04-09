# Current State Rescan — 19 Live Skills (2026-04-09)

> **Mode:** Orchestrator direct (swarm delegation failed silently)
> **Method:** head -5 of all 19 SKILL.md + prior inventory data

---

## Frontmatter State

| # | Skill | Name Match | Description Quality | Lines | Layer | Issues |
|---|-------|-----------|-------------------|-------|-------|--------|
| 1 | meta-builder | ✅ | GOOD (has triggers but includes `/hf-*`) | 403 | 0 | Internal vocab `/hf-create`, `/hf-audit`, `/hf-stack` |
| 2 | use-authoring-skills | ✅ | MED (no trigger phrases in desc body) | 255 | 4 | Self-contradiction: teaches triggers, has none |
| 3 | agents-and-subagents-dev | ✅ | POOR ("This skill should be used when..." formulaic) | 177 | 2 | 68-word single sentence |
| 4 | command-dev | ✅ | POOR (formulaic opening) | 80 | 2 | Lean body but formulaic description |
| 5 | custom-tools-dev | ✅ | POOR (formulaic opening) | 86 | 2 | Lean body but formulaic description |
| 6 | coordinating-loop | ✅ | GOOD (active voice, concise) | 370 | 3 | Has `.opencode/` duplicate |
| 7 | phase-loop | ✅ | POOR (search-index style, pipe to `|`) | 117 | — | Multiline YAML literal, reads like keywords |
| 8 | planning-with-files | ✅ | POOR (formulaic + YAML `>-` folded) | 276 | — | Has `.opencode/` v2.0.0 duplicate |
| 9 | session-context-manager | ✅ | MED (circular "manages session context") | 155 | — | FAIL verdict, merge candidate |
| 10 | user-intent-interactive-loop | ✅ | GOOD (has triggers, active voice) | 389 | 1 | Has `.opencode/` duplicate |
| 11 | opencode-platform-reference | ✅ | GOOD (has triggers, concise) | 62 | 3 | Self-contained reference |
| 12 | opencode-non-interactive-shell | ✅ | GOOD (has triggers, self-contained) | 237 | 3 | Best-in-class behavioral skill |
| 13 | oh-my-openagent-reference | ✅ | POOR ("OMO architecture" internal vocab) | 55 | 3 | Phantom refs, empty files |
| 14 | harness-audit | ✅ | MED (has triggers but "harness" internal) | 152 | 1 | Internal vocab in triggers |
| 15 | harness-delegation-inspection | ✅ | MED (triggers too broad, "GSD" internal) | 194 | 1 | Identity crisis: 4+ concerns |
| 16 | agent-authorization | ✅ | MED (has triggers but "specialist agent profile" vague) | 233 | — | Scripts not integrated |
| 17 | command-parser | ✅ | GOOD (has triggers, concise) | 79 | 3 | Focused, immediately usable |
| 18 | hm-deep-research | ✅ | EXCELLENT (full trigger set, stage gates described) | 234 | — | Gold standard methodology skill |
| 19 | skill-synthesis | ✅ | MED (triggers too narrow, missing "eval-driven") | 174 | 3 | validate-gate.sh bug |
| 20 | eval-harness | ✅ | POOR (1 sentence, no triggers, wrong location) | 270 | — | `.agents/skills/` not `.claude/skills/` |

---

## Description Pattern Analysis

### Formulaic "This skill should be used when..." (5 skills)
1. agents-and-subagents-dev
2. command-dev
3. custom-tools-dev
4. planning-with-files (YAML `>-` folded variant)
5. (partial) agent-authorization

### Internal Vocabulary Leaks (7 skills)
1. meta-builder — `/hf-create`, `/hf-audit`, `/hf-stack`, `hivefiver-*`
2. harness-audit — "audit harness", "full harness audit"
3. harness-delegation-inspection — "GSD execution model", "ecosystem structure"
4. oh-my-openagent-reference — "OMO architecture", "compare harness to OMO"
5. agent-authorization — "specialist agent profile" (hivefiver-specific)
6. eval-harness — "harness" in name
7. session-context-manager — `.hivemind/state/` hardcoded paths

### Missing Trigger Phrases (3 skills)
1. use-authoring-skills — description mentions none of its own trigger concepts
2. eval-harness — no triggers at all
3. phase-loop — keyword list instead of natural language

### Location Anomalies
- eval-harness: `.agents/skills/` (should be `.claude/skills/`)
- 5 skills with `.opencode/` duplicates (coordinating-loop, phase-loop, planning-with-files, session-context-manager, user-intent-interactive-loop)

---

## Line Count Distribution

| Range | Count | Skills |
|-------|-------|--------|
| 50-100 | 4 | opencode-platform-reference (62), command-parser (79), command-dev (80), custom-tools-dev (86) |
| 100-200 | 7 | oh-my-openagent-reference (55→effective), phase-loop (117), session-context-manager (155), harness-audit (152), harness-delegation-inspection (194), skill-synthesis (174), agents-and-subagents-dev (177) |
| 200-300 | 4 | agent-authorization (233), hm-deep-research (234), opencode-non-interactive-shell (237), planning-with-files (276), eval-harness (270) |
| 300-400 | 3 | use-authoring-skills (255→300+effective), coordinating-loop (370), user-intent-interactive-loop (389) |
| 400+ | 1 | meta-builder (403) — over target of 200 for a router |

---

_Generated: 2026-04-09_
_Method: Direct scan, swarm delegation non-functional_
