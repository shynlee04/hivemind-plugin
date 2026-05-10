# Workflow: Agent Creation

> **Loading trigger:** When routing to agent creation.

## 5-Step Procedural

1. **Define role** — what does this agent do? Primary or subagent?
2. **Assign tools** — which tools does it need? Minimal permissions only
3. **Set permissions** — allow/ask/ask per tool, wildcards for MCP
4. **Configure delegation** — mode (all/subagent), hidden flag, temperature
5. **Validate** — check agent definition, verify tool availability, test routing

## Delegation
Route to: `agents-and-subagents-dev` → specialist agent `hivefiver-agent-builder`
