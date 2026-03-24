# Role Model on Different Platforms

> The Diamond model is CONCEPTUAL. How roles manifest depends on the platform's agent model.

## Multi-Agent Platforms (OpenCode, Claude Code, Antigravity, Codex)

Roles map to separate agents or subagent dispatches:

| Role | Manifests As |
|------|-------------|
| Orchestrator | Main/parent agent session |
| Executor | Delegated subagent with write access |
| Verifier | Delegated subagent (read + run tests) |
| Researcher | Delegated subagent (read + search + web) |
| Planner | Main agent in planning mode |
| Meta-builder | Dedicated session with framework scope |

**Key rule:** Subagents do NOT delegate further. Only orchestrator delegates.

## Single-Agent Platforms (Cursor, Windsurf, Kilo Code, Roo, Trae, etc.)

All roles collapse to **sequential phases** in one agent's workflow:

| Phase | Role Applied | Self-Check |
|-------|-------------|------------|
| 1. Understand request | Planner | "Am I planning or already implementing?" |
| 2. Research unknowns | Researcher | "Am I researching or making decisions?" |
| 3. Decide approach | Orchestrator | "Am I deciding or executing?" |
| 4. Implement | Executor | "Am I only implementing the decided scope?" |
| 5. Verify | Verifier | "Am I verifying independently, not confirming my own work?" |

**Critical adaptation**: On single-agent platforms, the agent must SWITCH hats explicitly. The most common violation is role-bleed between Phase 4 (Executor) and Phase 5 (Verifier) — verifying your own work without the mental reset.

### Self-Check Protocol (Single-Agent)

Before each phase transition, ask:
1. Did I complete the PREVIOUS role's work fully?
2. Am I switching to the NEXT role with fresh perspective?
3. Am I NOT carrying implementation assumptions into verification?
