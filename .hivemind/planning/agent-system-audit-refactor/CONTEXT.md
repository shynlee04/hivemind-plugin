---
feature: agent-system-audit-refactor
category: master-context
updated: 2026-05-10
---

# CONTEXT — Agent System Audit & Refactor

## Why This Matters

The HIVEMIND harness is a runtime composition engine. Its value proposition is intelligent agent orchestration across complex, multi-domain projects. But the current agent system has critical flaws:

1. **Permissions are too restrictive** — L2 agents have `deny` on 8+ tools, making them unable to function as designed
2. **Naming is misleading** — hm-/hf- prefixes and l0-l3 suffixes suggest a hierarchy that doesn't exist mechanically
3. **OpenCode SDK compliance gaps** — deprecated fields, custom permission keys, missing required fields
4. **Skill-agent bindings broken** — 86% of skills lack `consumed-by` metadata; 21 have naming mismatches
5. **No mechanical enforcement** — delegation rules are conventions, not code; intake gate has stale references

## Source of Truth

All validation MUST come from:
- OpenCode SDK source: `anomalyco/opencode` → `packages/opencode/src/config/agent.ts`
- OpenCode SDK source: `anomalyco/opencode` → `packages/opencode/src/config/permission.ts`
- NOT from local docs, AGENTS.md, or previously generated artifacts

## Key References

- `/Users/apple/Documents/coding-projects/hivemind-plugin-1/docs/draft/HIVEMIND-PHILOSOPHY-2026-04-10.md` — 5 pillars
- `/Users/apple/Documents/coding-projects/hivemind-plugin-1/.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md` — documented gaps
- `src/routing/session-entry/intake-gate.ts` — current agent routing
- `src/schema-kernel/agent-frontmatter.schema.ts` — harness agent schema
- `src/schema-kernel/permission.schema.ts` — harness permission schema
- `src/config/compiler.ts` — agent compilation pipeline
- `.opencode/agents/` — 58 agent definition files (dev env only)

## Two Halves Reminder

| Half | What | Ships? |
|------|------|--------|
| Hard Harness (`src/`) | npm package — tools, hooks, plugin | YES — to end users |
| Soft Meta-Concepts (`.opencode/`) | Agents, skills, commands | NO — dev env only |
| Internal State (`.hivemind/`) | State, planning, journals | NO — runtime-generated |
