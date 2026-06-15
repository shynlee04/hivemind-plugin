# Instructions for Hivemind

- Use the hivemind skill when the user asks for Hivemind or uses a `hm-*` command.
- Treat `/hm-...` or `hm-...` as command invocations and load the matching file from `.github/skills/hm-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply Hivemind workflows unless the user explicitly asks for them.
- After completing any `hm-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
