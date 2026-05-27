<purpose>
Analyze freeform text from the user and route to the most appropriate Hivemind command. This is a dispatcher — it never does the work itself. Match user intent to the best command, confirm the routing, and hand off.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="validate">
**Check for input.**


**Text mode (`workflow.text_mode: true` in config or `--text` flag):** Set `TEXT_MODE=true` if `--text` is present in `$ARGUMENTS` OR `text_mode` from init JSON is `true`. When TEXT_MODE is active, replace every `question` call with a plain-text numbered list and ask the user to type their choice number. This is required for non-the agent runtimes (OpenAI Codex, Gemini CLI, etc.) where `question` is not available.
If `$ARGUMENTS` is empty, ask via question:

```
What would you like to do? Describe the task, bug, or idea and I'll route it to the right Hivemind command.
```

Wait for response before continuing.
</step>

<step name="check_project">
**Check if project exists.**

```bash
# SDK resolution: prefer local node shim, fall back to global hm-sdk (#3668)
_Hivemind_SHIM_NAME="hm-tools.cjs"
Hivemind_TOOLS="${RUNTIME_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}/hivemind/bin/${_Hivemind_SHIM_NAME}"
if [ -f "$Hivemind_TOOLS" ]; then
  Hivemind_SDK="node $Hivemind_TOOLS"
elif command -v hm-sdk >/dev/null 2>&1; then
  Hivemind_SDK="hm-sdk"
else
  echo "ERROR: hm-sdk not found on PATH and $Hivemind_TOOLS does not exist." >&2
  echo "Run: npx hivemind-cc@latest --claude --local" >&2
  exit 1
fi
INIT=$($Hivemind_SDK query state.load 2>/dev/null)
```

Track whether `.planning/` exists — some routes require it, others don't.
</step>

<step name="route">
**Match intent to command.**

Evaluate `$ARGUMENTS` against these routing rules. Apply the **first matching** rule:

| If the text describes... | Route to | Why |
|--------------------------|----------|-----|
| Starting a new project, "set up", "initialize" | `/hm-new-project` | Needs full project initialization |
| Mapping or analyzing an existing codebase | `/hm-map-codebase` | Codebase discovery |
| A bug, error, crash, failure, or something broken | `/hm-debug` | Needs systematic investigation |
| Spiking, "test if", "will this work", "experiment", "prove this out", validate feasibility | `/hm-spike` | Throwaway experiment to validate feasibility |
| Sketching, "mockup", "what would this look like", "prototype the UI", "design this", explore visual direction | `/hm-sketch` | Throwaway HTML mockups to explore design |
| Wrapping up spikes, "package the spikes", "consolidate spike findings" | `/hm-spike --wrap-up` | Package spike findings into reusable skill |
| Wrapping up sketches, "package the designs", "consolidate sketch findings" | `/hm-sketch --wrap-up` | Package sketch findings into reusable skill |
| Exploring, researching, comparing, or "how does X work" | `/hm-explore` | Socratic ideation and idea routing |
| Discussing vision, "how should X look", brainstorming | `/hm-discuss-phase` | Needs context gathering |
| A complex task: refactoring, migration, multi-file architecture, system redesign | `/hm-phase` | Needs a full phase with plan/build cycle |
| Planning a specific phase or "plan phase N" | `/hm-plan-phase` | Direct planning request |
| Executing a phase or "build phase N", "run phase N" | `/hm-execute-phase` | Direct execution request |
| Running all remaining phases automatically | `/hm-autonomous` | Full autonomous execution |
| A review or quality concern about existing work | `/hm-verify-work` | Needs verification |
| Checking progress, status, "where am I" | `/hm-progress` | Status check |
| Resuming work, "pick up where I left off" | `/hm-resume-work` | Session restoration |
| A note, idea, or "remember to..." | `/hm-capture` | Capture for later |
| Adding tests, "write tests", "test coverage" | `/hm-add-tests` | Test generation |
| Completing a milestone, shipping, releasing | `/hm-complete-milestone` | Milestone lifecycle |
| A specific, actionable, small task (add feature, fix typo, update config) | `/hm-quick` | Self-contained, single executor |

**Requires `.planning/` directory:** All routes except `/hm-new-project`, `/hm-map-codebase`, `/hm-spike`, `/hm-sketch`, and `/hm-help`. If the project doesn't exist and the route requires it, suggest `/hm-new-project` first.

**Ambiguity handling:** If the text could reasonably match multiple routes, ask the user via question with the top 2-3 options. For example:

```
"Refactor the authentication system" could be:
1. /hm-phase — Full planning cycle (recommended for multi-file refactors)
2. /hm-quick — Quick execution (if scope is small and clear)

Which approach fits better?
```
</step>

<step name="display">
**Show the routing decision.**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Hivemind ► ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Input:** {first 80 chars of $ARGUMENTS}
**Routing to:** {chosen command}
**Reason:** {one-line explanation}
```
</step>

<step name="dispatch">
**Invoke the chosen command.**

Run the selected `/hm-*` command, passing `$ARGUMENTS` as args.

If the chosen command expects a phase number and one wasn't provided in the text, extract it from context or ask via question.

After invoking the command, stop. The dispatched command handles everything from here.
</step>

</process>

<success_criteria>
- [ ] Input validated (not empty)
- [ ] Intent matched to exactly one Hivemind command
- [ ] Ambiguity resolved via user question (if needed)
- [ ] Project existence checked for routes that require it
- [ ] Routing decision displayed before dispatch
- [ ] Command invoked with appropriate arguments
- [ ] No work done directly — dispatcher only
</success_criteria>
