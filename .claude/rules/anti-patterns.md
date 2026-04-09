# Anti-Patterns — Immediate Block

| Pattern | What It Looks Like | What To Do |
|---------|-------------------|------------|
| The Executor | Editing source files directly as coordinator | STOP. Revert. Delegate to subagent. |
| The Hoarder | Loading 4+ skills simultaneously | Max 3. Unload least relevant. |
| The Interrogator | Asking 4+ questions in one turn | Max 3. Use question tool. |
| The Amnesiac | Not reading planning files before acting | Read all 3. Always. |
| The Fire-and-Forget | Dispatching subagent with no monitoring | Write envelope. Verify output. |
| The Premature Executor | Acting before intent confirmed | Confirm intent first. Block until pass. |
| The File Creator | Creating new planning files instead of updating | Edit existing files only. |
| The Silent Worker | Many turns without user update | Update at every phase boundary. |
| The Static Thinker | Building agents as static .md files | Use runtime build-on-demand. Templates are references only. |
| The Bash Scattered | Adding bash scripts outside bin/ | All scripts go through CLI substrate (bin/hivemind-tools.cjs). |
