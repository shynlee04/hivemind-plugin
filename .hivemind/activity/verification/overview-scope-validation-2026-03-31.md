# OVERVIEW Scope Validation — 2026-03-31

## Evidence baseline

- **Project root:** `/Users/apple/hivemind-plugin/.worktrees/product-detox`
- **HEAD:** `d48dd1b65b28f13bbe604d09b462e2bde547291b`
- **Entry gate:** `DEGRADED` via `.opencode/skills/use-hivemind/scripts/hm-entry-gate.cjs`
  - manifest OK
  - typecheck/build OK (`npm run typecheck` passed)
  - deps OK
  - working tree dirty (`dirtyCount: 687`)
  - structure warning: `rootMdCount: 44`
- **Targeted verification tests:** `37 pass / 10 fail`
  - **Broken:** 6 journal write tests fail with `ENOENT`
  - **Broken:** 2 runtime-status/plugin-runtime tests fail because `src/shared/opencode-agent-registry.ts:94-100` loads `agents/{id}.deprecated.md`, but root `agents/` only contains non-deprecated names
  - **Broken/drifted:** 2 plugin-assembly tests fail because expected hook surface no longer matches live plugin wiring

## Executive verdict

**Brutal answer:** `OVERVIEW.md` and `AGENTS.md` are materially out of sync with the live codebase.

- The repo does **not** consistently implement the claimed **Tool → Feature → Intelligence** architecture.
- The documented **Tier 1 / 2 / 3** model is mostly a narrative, not an enforced architectural boundary.
- The managing-layer surfaces are uneven:
  - **task** and **trajectory** are real and live
  - **handoff** is real but overcoupled
  - **journal** is architecturally false-by-claim and functionally failing in tests
  - **agent_work** is live but mislayered and inconsistently exposed
- The docs undercount tools, overstate hook discipline, and still claim paths/surfaces that are deleted or missing in the current tree.

## Health snapshot

| Check | Result | Evidence |
|---|---|---|
| Typecheck/build health | PASS | entry gate: `npm run typecheck` exit code 0 |
| Repo structural health | DEGRADED | entry gate: `rootMdCount: 44`, dirty tree 687 |
| Managing-tool verification health | MIXED | targeted tests: 37 pass / 10 fail |
| Journal tool | BROKEN | `src/tools/hivemind-journal.test.ts` write-path tests fail with `ENOENT` |
| Runtime status / agent registry | BROKEN | plugin-runtime tests fail on missing `agents/hivefiver.deprecated.md` |
| Governance docs vs code | DEGRADED | multiple count/path mismatches below |

---

## Matrix — OVERVIEW.md claims vs reality

Legend: **EXISTS / PARTIAL / DOES NOT EXIST / BROKEN**

| Claim source | Claim | Reality | Status | Evidence |
|---|---|---|---|---|
| `OVERVIEW.md:1` | Framework integrates context, tools, plugins, SDK, specialist agents | Broadly true, but stated scope is bigger than enforced architecture | PARTIAL | live plugin/tools/features exist; enforcement gaps below |
| `OVERVIEW.md:8-19` | Atomic constraints are enforced (`≤300 LOC`, no god functions/components, no dead code) | Not enforced globally; large source files exist | BROKEN | `src/hooks/event-handler.ts` = 493 LOC, `src/core/workflow-management/task-lifecycle.ts` = 353 LOC, `src/tools/hivefiver-setting/spec-builder.ts` = 309 LOC |
| `OVERVIEW.md:25-46` | Metrics are automated and programmatically verifiable | Some are, but no universal metrics framework found | PARTIAL | tests exist; no repo-wide metrics authority found in source scan |
| `OVERVIEW.md:52-58` | Ecosystem includes Graph dependency tracking | Real runtime graph/state exists | EXISTS | root `.hivemind/graph/`; `src/shared/paths.ts:58-71` |
| `OVERVIEW.md:54-55` | Ecosystem includes Trajectory execution ledger | Real | EXISTS | `src/core/trajectory/`; `src/shared/paths.ts:58-71` |
| `OVERVIEW.md:55` and `OVERVIEW.md:77` | There are **7 hivemind_* tools** | Live plugin wires **12** managed tools | BROKEN | `src/plugin/opencode-plugin.ts:122-135`, `src/tools/index.ts:28-137`, `src/hooks/runtime-loader/tool-governance.ts:4-17` |
| `OVERVIEW.md:56-57` | Engines include `event-tracker`, `agent-work-contract`, `session-journal` | Real | EXISTS | `src/features/event-tracker/`, `src/features/agent-work-contract/`, `src/features/session-journal/` |
| `OVERVIEW.md:57` | `.hivemind/*.*/` runtime state exists | Real | EXISTS | root `.hivemind/` plus `src/shared/paths.ts:58-71` |
| `OVERVIEW.md:72-75` | `runtime-attachment.json` and `entry-kernel-state.json` exist | Real, but under `.hivemind/config/` | EXISTS | `src/shared/paths.ts:67-71`, `src/shared/entry-kernel-state.ts:30-35` |
| `OVERVIEW.md:76` | 13+ specialist agents exist | Real | EXISTS | root `agents/` has 13 entries |
| `OVERVIEW.md:77` | 7 HiveMind tools + SDK tools | Actual managed-tool count is 12 | BROKEN | `src/plugin/opencode-plugin.ts:122-135` |
| `OVERVIEW.md:78` | Workflows resolve entry to exit | Workflow chains exist, but root `workflows/` path is gone | PARTIAL | `src/commands/slash-command/command-bundles.ts:4-179`; root listing has no `workflows/` |
| `OVERVIEW.md:98-104` | Tier 1 paths (`src/core/trajectory`, `src/core/workflow-management`, `src/schema-kernel`) exist | Real | EXISTS | live directories present |
| `OVERVIEW.md:110-117` | Tier 2 has 1 active plugin | Real | EXISTS | `src/plugin/opencode-plugin.ts:115-250` exports one plugin |
| `OVERVIEW.md:110-117` | Tier 2 has **16 active hooks** | Live plugin exposes 11 hook keys | BROKEN | `src/plugin/opencode-plugin.ts:115-249` |
| `OVERVIEW.md:110-117` | Tier 2 has **10 active command bundles** | Real | EXISTS | `src/commands/slash-command/command-bundles.ts:4-179` |
| `OVERVIEW.md:110-117` | Tier 2 has **9+ active tools** | True, but inconsistent with “7 tools” elsewhere | EXISTS | 12 tools wired in plugin |
| `OVERVIEW.md:110-117` | Tier 2 has **13+ active agents** | True | EXISTS | root `agents/` = 13 |
| `OVERVIEW.md:122-127` | Tier 3 has **19+ skill packages** | True | EXISTS | root `skills/` = 19 dirs + registry file |
| `OVERVIEW.md:125-127` | `registry-internal.yaml` is active | Exists, but is not runtime discovery authority | PARTIAL | `skills/registry-internal.yaml:4-5,17-19`; runtime scan uses `.opencode/skills` via `src/shared/opencode-skill-registry.ts:137-147` |
| `OVERVIEW.md:127` | `npx skills add` not implemented | True in live code | EXISTS | repo search found docs only; no implementation surface |
| `OVERVIEW.md:131-134` | Tier dependency direction is enforced | I found tier vocabulary, not enforcement of the documented 3-tier dependency rules | PARTIAL | `src/shared/tiered-injection.ts:1-14,35-57`; `src/schema-kernel/agent-records.ts:53-57` |
| `OVERVIEW.md:142-146` | `hiveminder` coordinates, delegates, never implements | Matches agent doc | EXISTS | `agents/hiveminder.md` |
| `OVERVIEW.md:150-158` | `hiveq` verifies and gives PASS/FAIL | Matches agent doc | EXISTS | `agents/hiveq.md` |
| `OVERVIEW.md:155-158` | `code-skeptic` challenges assumptions | Matches agent doc | EXISTS | `agents/code-skeptic.md` |
| `OVERVIEW.md:162-174` | Listed specialist agents exist | All listed root agents exist except `explore-small` is not a root agent | PARTIAL | root `agents/` directory; hidden projection exists in `.opencode/agents/` only |
| `OVERVIEW.md:178-184` | Every delegation carries scope/constraints/return contract/return gate | The principle exists; hard runtime enforcement not proven as one canonical schema | PARTIAL | delegation tooling exists, but single-source enforcement not located in this pass |

### OVERVIEW conclusion

`OVERVIEW.md` is not empty marketing; several claims are grounded. But it is **internally inconsistent** on tool counts and **overstates enforcement**. The cleanest summary is: **concepts exist, enforcement does not.**

---

## Matrix — AGENTS.md claims vs reality

| Claim source | Claim | Reality | Status | Evidence |
|---|---|---|---|---|
| `AGENTS.md:7` | This is the only `AGENTS.md` | True in current tree | EXISTS | root glob found only one `AGENTS.md` |
| `AGENTS.md:52-66` | `.hivemind/activity/` layout exists | Mostly true | EXISTS | root `.hivemind/activity/` present |
| `AGENTS.md:68-70` | Agents resolve activity paths from `pathing/active-paths.json` | Not verified in this pass | PARTIAL | pathing exists as a documented rule; direct enforcement not established |
| `AGENTS.md:94-100` | SDK-first / CQRS hard boundary / projection-not-authority | Only partially true in code | PARTIAL | several violations below |
| `AGENTS.md:127-156` | 17 plugin hooks available as listed | Docs conflate availability with wiring; live plugin exposes 11 keys, several under `experimental.*` names | PARTIAL | `src/plugin/opencode-plugin.ts:115-249` |
| `AGENTS.md:129-130` | `tool.schema` and ToolContext contract are used | True | EXISTS | e.g. `src/tools/task/tools.ts:10-26`, `src/features/agent-work-contract/tools/create-contract-tool.ts` |
| `AGENTS.md:160-168` | `shared/event-bus.ts` and `core/session/kernel.ts` are dead/removed | True | EXISTS | paths absent in current tree |
| `AGENTS.md:172-179` | Must use `tool.schema` for tool args | True for inspected tool surfaces | EXISTS | `src/tools/task/tools.ts:15-25`, `src/tools/hivemind-journal.ts:67-87` |
| `AGENTS.md:176` | Tools own writes; hooks are read-only | False | BROKEN | hook writers mutate session/journal state: `src/hooks/chat-message-handler.ts:63-88`, `src/hooks/text-complete-handler.ts:96-155`, `src/hooks/compaction-handler.ts:64-93`, `src/hooks/tool-execution-handler.ts:45-84` |
| `AGENTS.md:191-201` | There are **7 custom tools** in listed locations | False; there are 12 managed tools | BROKEN | `src/plugin/opencode-plugin.ts:122-135`, `src/tools/index.ts:28-137` |
| `AGENTS.md:200-201` | `hivemind_journal` lives at `src/tools/journal/` | False | DOES NOT EXIST | live file is `src/tools/hivemind-journal.ts:140-196` |
| `AGENTS.md:203-221` | Layer architecture is “verified from code” | Mixed; names are mostly real, rules are not consistently true | PARTIAL | e.g. doc layer is clean; managing layers are not |
| `AGENTS.md:207` | `src/tools/` is write-side, ≤300 LOC, clean tool surface | Mixed | PARTIAL | tools are real, but agent-work tools live under `src/features/agent-work-contract/tools/` |
| `AGENTS.md:208` | `src/hooks/` has no durable writes | False | BROKEN | multiple hook writers mutate files/state directly |
| `AGENTS.md:209` | `src/plugin/` is assembly only, no business logic | False | BROKEN | plugin performs IO/projection work and runtime coordination: `src/plugin/opencode-plugin.ts:70-81,90-93` |
| `AGENTS.md:214` | Features are listed accurately | Mixed | PARTIAL | feature dirs exist, but counts are stale and some package sizes are much larger than implied |
| `AGENTS.md:223-257` | Source code structure counts are current | Frequently stale | BROKEN | examples: `cli` actual 5, `commands/slash-command` actual 5, `workflow-management` actual 6, `dashboard-v2` not empty |
| `AGENTS.md:235` | `dashboard-v2` is an empty dead stub | False; not empty, but still effectively dead | BROKEN | `src/dashboard-v2/package-lock.json` exists |
| `AGENTS.md:263` | `agents/` has 14 files | False | BROKEN | root `agents/` has 13 |
| `AGENTS.md:264` | `commands/` has 10 active + 33 noise | Active count is right; noise count is stale | PARTIAL | root `commands/` has 45 files total; 10 active bundles = **35** noise/orphans |
| `AGENTS.md:265` | `skills/` has 20 packages | Actually 19 directories + 1 registry file | PARTIAL | root `skills/` count |
| `AGENTS.md:266` | `workflows/` has 22 legacy/noise files | Path is gone in current tree | DOES NOT EXIST | root listing has no `workflows/` |
| `AGENTS.md:268-272` | `scripts/templates/references/prompts/modules` counts are current | False | BROKEN | actual counts: scripts 13, templates 9, references 5, prompts 10, modules 6 |
| `AGENTS.md:273` | Side-car app is active Next.js app | True | EXISTS | `apps/side-car/package.json` and app routes present |
| `AGENTS.md:292-299` | `dist/plugin/opencode-plugin.js` exists | True | EXISTS | path exists |
| `AGENTS.md:298` | `.planning/` exists | False | DOES NOT EXIST | missing from root listing |
| `AGENTS.md:299` | `conductor/` exists | False | DOES NOT EXIST | missing from root listing |

### AGENTS conclusion

`AGENTS.md` is the worse offender. It mixes real architecture, stale counts, missing paths, and false boundary claims. The biggest problem is not a typo count; it is that **the document claims CQRS purity and hook read-only behavior that the code directly violates.**

---

## Managing-layer tool assessment

True use frequency below is based on actual grep/call-site evidence, not just declarations.

| Surface | Live entrypoint(s) | True use frequency | Architectural fit | Refactor priority (1-5) | LOC cost | Justifies its LOC? | Verdict |
|---|---|---|---|---:|---|---|---|
| **task** | `src/tools/task/tools.ts`, `src/features/workflow/task.ts`, `src/core/workflow-management/` | Low external tool usage; core authority is live. Refs cluster around plugin registration/tests plus direct core/runtime consumers. | **Tool → Feature → Core**, not Tool → Feature → Intelligence | 2 | tool 42 + feature 190 + core pkg 662 | **Mostly yes** for core authority; weaker for public tool surface | Keep, but do not pretend the feature layer is the real authority boundary |
| **trajectory** | `src/tools/trajectory/tools.ts`, `src/features/trajectory/trajectory.ts`, `src/core/trajectory/` | Low external tool usage; core trajectory ledger is used directly by hooks, runtime-entry, recovery, handoff | **Tool → Feature → Core**, with heavy direct core bypass | 4 | tool 49 + feature 178 + core pkg 760 | **Yes**, but architecture is leaky | Keep, but tighten boundaries around core access |
| **handoff** | `src/tools/handoff/tools.ts`, `src/features/handoff/handoff.ts`, `src/delegation/` | Low real production use outside registration/docs/tests; feature file acts as cross-layer orchestrator | **Bad fit**: Tool → Feature → Delegation/Core/Runtime-entry/Agent-work | 5 | tool 54 + feature 271 + delegation pkg 472 | **Weakly**; cost is high for current coupling and low external use | Keep concept, split implementation |
| **journal** | `src/tools/hivemind-journal.ts`; hooks/event-tracker/session-journal also write same state | Public tool exposure is low; real writes happen directly in hooks. Tool tests fail. | **Broken authority model**. Claimed sole write-side entrypoint is false. | 5 | tool 196 + session-journal pkg 207 + event-tracker pkg 8569 | **No** as currently shaped | Fix or demote immediately |
| **agent_work** | feature-local tools under `src/features/agent-work-contract/tools/`; plugin/catalog promote only create/export | Strong internal feature usage; create/export tools are live; classify-intent exists but is not runtime-promoted | **Mislayered**: public tool surface lives in `features/`, not `src/tools/` | 4 | create 155 + export 67 + classify 50 + feature pkg 5394 | **Yes** for feature/store/engine, **no** for current public layering story | Keep engine; normalize its public tool boundary |

### Supporting evidence by surface

#### task
- Tool wrapper is thin: `src/tools/task/tools.ts:1-42`
- Feature is thin authority adapter over core: `src/features/workflow/task.ts:1-190`
- Core lifecycle is the real authority: `src/core/workflow-management/task-lifecycle.ts` (353 LOC)
- Runtime/core consumers bypass the public tool path in practice

#### trajectory
- Tool wrapper is thin: `src/tools/trajectory/tools.ts`
- Feature immediately calls core ledger and workflow state: `src/features/trajectory/trajectory.ts:1-178`
- Core trajectory is used directly from hooks/runtime/recovery/handoff, so the advertised layering is not enforced

#### handoff
- `src/features/handoff/handoff.ts:1-16` imports across delegation, core trajectory, agent-work chain execution, runtime-entry continuity, and tool helper types
- This is not a neat feature; it is a cross-tier orchestrator pretending to be one

#### journal
- Tool explicitly claims sole write authority: `src/tools/hivemind-journal.ts:4-5,134-145`
- Hooks directly write journal/session data anyway:
  - `src/hooks/chat-message-handler.ts:63-88`
  - `src/hooks/text-complete-handler.ts:96-155`
  - `src/hooks/compaction-handler.ts:64-93`
  - `src/hooks/tool-execution-handler.ts:45-84`
- Tool write tests fail with `ENOENT`, so the tool is both **architecturally false** and **functionally unhealthy**

#### agent_work
- Public managed tools point into feature-local files: `src/tools/index.ts:84-99`
- Feature-local export surface includes a third tool (`classify-intent`) that is intentionally not runtime-promoted: `src/features/agent-work-contract/tools/index.ts:8-19`
- Create/export tests pass, so the engine/store are real; the public layering is the bad part

---

## Key questions answered

### 1) Does the 3-layer architecture (Tool → Feature → Intelligence) actually hold?

**No.**

It holds cleanly for the doc surface only:

- tool: `src/tools/doc/tools.ts:3`
- feature: `src/features/doc-intelligence/doc.ts:1-8`
- intelligence: `src/intelligence/doc/index.ts`

It does **not** hold for the managing surfaces:

- **task** = Tool → Feature → Core
- **trajectory** = Tool → Feature → Core
- **handoff** = Tool → Feature → Delegation/Core/Runtime-entry/Agent-work
- **journal** = Tool + Hooks both writing the same state
- **agent_work** = Feature-local tools + engine/store/hooks, with no `src/tools/agent-work/` public symmetry

### 2) Are there tools that should be in features but are in tools, or vice versa?

**Yes.**

- **agent_work** public tool factories are in `src/features/agent-work-contract/tools/` while the rest of the public tool catalog lives in `src/tools/`. That is backwards for the repo's stated architecture.
- **journal** probably belongs under a single session/event authority surface, not split between tool and hooks.
- **handoff** is exposed correctly as a tool, but too much orchestration logic is trapped inside one feature file.

### 3) Is the tier system properly enforced?

**No.**

What exists in code is a **different** tier system:

- `src/shared/tiered-injection.ts:1-14,35-57` defines a **two-tier skill injection** model
- `src/schema-kernel/agent-records.ts:53-57` defines **phase tiers** (`project-initiation`, `planning-execution`)

What I did **not** find is enforcement of the repo-wide `OVERVIEW.md` 3-tier dependency contract (`Tier 1 cannot depend on Tier 2 or Tier 3`, etc.). The tier language exists; the dependency firewall does not.

### 4) What is actually BROKEN vs working vs dead code?

#### Working / justified
- `src/core/workflow-management/`
- `src/core/trajectory/`
- `src/features/agent-work-contract/engine/contract-store*`
- create/export agent-work tools
- slash command bundle registry (`10` active bundles)

#### Broken
- **journal tool** write-path tests
- **runtime status / plugin-runtime pathing** due deprecated agent filename expectation
- **plugin assembly expectations** vs live hook wiring
- **doc/governance truthfulness** around hooks, tools, counts, and paths
- `hm-tdd` bundle points at agent `verifier`, which is not a real root agent: `src/commands/slash-command/command-bundles.ts:145-160`

#### Dead / low-value / noise
- `src/dashboard-v2/` is effectively dead stub material
- root `commands/` has **45** files but only **10** active bundles → **35 orphan/noise files**
- root `workflows/` is gone, but docs still talk as if it exists
- `.planning/` and `conductor/` are missing but still documented as live reference paths
- `classify-intent` is a real internal tool, but dead as a public/runtime surface

---

## Top 5 architectural violations found

1. **Documented CQRS boundary is false in practice**
   - Docs say hooks are read-only and tools own writes
   - Hooks directly write session/journal artifacts anyway

2. **Journal authority is split and failing**
   - `src/tools/hivemind-journal.ts` claims sole authority
   - hooks bypass it
   - journal tests fail

3. **Public tool architecture is inconsistent**
   - most tools live in `src/tools/`
   - agent-work public tools live in `src/features/agent-work-contract/tools/`
   - this breaks the repo's own layer story

4. **Handoff is a god-feature orchestrator**
   - one feature file spans delegation store, trajectory core, runtime continuity, and agent-work chain execution
   - that is orchestration coupling, not clean feature decomposition

5. **Governance documents are materially stale**
   - wrong tool counts
   - wrong hook story
   - wrong surface counts
   - deleted/missing paths still documented (`workflows/`, `.planning/`, `conductor/`)

---

## Recommended scope

### KEEP

- `src/core/workflow-management/` as the real task authority
- `src/core/trajectory/` as the real trajectory authority
- `src/features/agent-work-contract/engine/` and store/schema work
- doc stack (`src/tools/doc` → `src/features/doc-intelligence` → `src/intelligence/doc`) because it is the only clean exemplar of the claimed architecture
- active `hm-*` command bundle registry

### CUT

- `src/dashboard-v2/` dead stub surface
- orphaned/non-registered command markdown noise in root `commands/`
- stale narrative claims about `workflows/`, `.planning/`, and `conductor/` unless those surfaces are restored
- public mention of agent-work `classify-intent` as a runtime tool unless it is actually promoted

### FIX FIRST

1. **Fix journal authority and journal tests**
   - pick one writer model
   - either route hook writes through the same authority or stop claiming sole authority

2. **Fix agent registry pathing**
   - `src/shared/opencode-agent-registry.ts:94-100` hardcodes `agents/{id}.deprecated.md`
   - root `agents/` contains normal `.md` files only
   - this is breaking runtime-status flows in tests

3. **Normalize the public tool boundary**
   - move/promote agent-work public tools into `src/tools/agent-work/` or explicitly redefine the rule

4. **Split handoff orchestration**
   - separate delegation store work, trajectory side effects, runtime continuity linkage, and agent-work chain dispatch

5. **Rewrite OVERVIEW.md and AGENTS.md from code truth**
   - current docs are not trustworthy enough to guide architecture without live verification

---

## Final scope call

If the product owner wants a truthful MVP scope, the answer is:

- **KEEP the real authorities**: core workflow, core trajectory, agent-work engine/store, doc intelligence
- **CUT dead shells and orphan surfaces**: dashboard-v2, command noise, stale deleted-path narratives
- **FIX first what lies about authority**: journal, agent registry, hook/write boundaries, handoff coupling

Anything else is polishing the brochure while the architecture contradicts itself.
