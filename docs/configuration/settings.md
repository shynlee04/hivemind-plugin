<!-- generated-by: gsd-doc-writer -->

# Cấu hình Hivemind — Hivemind Configuration

> Cấu hình runtime cho Hivemind, được tải tại mỗi lần bắt đầu phiên front-facing và tải lại sau mỗi prompt người dùng.
> Runtime configuration for Hivemind, loaded at every front-facing session start and reloaded after each user prompt.

---

## 1. Config File Location & Format / Vị Trí và Định Dạng

**File:** `.hivemind/configs.json` (relative to project root)

The config file is a standard JSON file. A JSON Schema is also shipped at `.hivemind/configs.schema.json` for IDE autocompletion and validation.

Example minimal file:

```json
{
  "$schema": "./configs.schema.json",
  "conversation_language": "vi",
  "documents_and_artifacts_language": "en",
  "mode": "hivemind-powered",
  "user_expert_level": "clumsy-vibecoder",
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  },
  "parallelization": true,
  "atomic_commit": true,
  "commit_docs": true,
  "workflow": {
    "research": true,
    "cross_session_tasks_dependencies_validation": true,
    "trajectory_control": true,
    "advanced_continuity_validation": true,
    "task_plus_enabled": true,
    "plan_check": true,
    "verifier": true,
    "ui_phase": false,
    "ui_safety_gate": true,
    "ai_integration_phase": true,
    "research_before_questions": true,
    "discuss_mode": "intensive-phase-discussion",
    "use_worktrees": true
  }
}
```

**Missing/invalid fallback:** If the file is missing or contains invalid JSON, the system silently falls back to defaults (never crashes). Unknown fields are stripped for forward-compatibility.

**Legacy key migration:** camelCase keys (e.g. `conversationLanguage`) are auto-mapped to snake_case (e.g. `conversation_language`) via `LEGACY_KEY_MAP` in `src/schema-kernel/hivemind-configs.schema.ts` lines 213–219.

---

## 2. All Config Fields / Toàn Bộ Trường Cấu Hình

Defined by `HivemindConfigsSchema` in `src/schema-kernel/hivemind-configs.schema.ts` lines 266–287, validated via Zod, and also available as a JSON Schema at `.hivemind/configs.schema.json`.

| Field | Type | Default | Description / Mô tả |
|-------|------|---------|---------------------|
| `$schema` | `string` | `"./configs.schema.json"` | Relative path to the shipped JSON Schema for IDE support. |
| `conversation_language` | `enum` | `"en"` | Language for agent conversation output. See §3 below. |
| `documents_and_artifacts_language` | `enum` | `"en"` | Language for generated documents and artifacts. See §3 below. |
| `document_paths` | `string[]` | `[".hivemind/planning/"]` | Document path prefixes for language enforcement — supports recursive subdirectory globbing. |
| `mode` | `enum` | `"expert-advisor"` | Guardrail intensity level: `"expert-advisor"`, `"hivemind-powered"`, or `"free-style"`. |
| `user_expert_level` | `enum` | `"intermediate-high-level"` | User proficiency level affecting output style. Values: `"clumsy-vibecoder"`, `"beginner-friendly"`, `"intermediate-high-level"`, `"architecture-driven"`, `"absolute-expert"`. |
| `delegation_systems` | `object` | all `true` | Toggles for available delegation mechanisms. See §5 below. |
| `parallelization` | `boolean` | `true` | Enable parallel task execution. |
| `atomic_commit` | `boolean` | `true` | Enforce atomic commits (one logical change = one commit). |
| `commit_docs` | `boolean` | `true` | Commit documentation changes alongside code. |
| `workflow` | `object` | (see table) | Runtime feature toggles. See below. |

### Workflow Sub-Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `research` | `boolean` | `true` | Enable research step before implementation. |
| `cross_session_tasks_dependencies_validation` | `boolean` | `false` | Cross-session task dependency validation. <!-- VERIFY: CA-04 future-consumer — lifecycle-manager.ts --> |
| `trajectory_control` | `boolean` | `false` | Trajectory ledger control. <!-- VERIFY: CA-04 future-consumer — hivemind-trajectory tool --> |
| `advanced_continuity_validation` | `boolean` | `false` | Advanced continuity validation. <!-- VERIFY: CA-04 future-consumer — continuity.ts --> |
| `task_plus_enabled` | `boolean` | `false` | Enhanced task status tracking. <!-- VERIFY: CA-04 future-consumer — task-status.ts --> |
| `plan_check` | `boolean` | `true` | Enable plan verification before execution. |
| `verifier` | `boolean` | `true` | Enable dual-signal completion verification. |
| `ui_phase` | `boolean` | `false` | UI phase support. <!-- VERIFY: Future — sidecar UI WS-2/WS-8 --> |
| `ui_safety_gate` | `boolean` | `false` | UI safety gate. <!-- VERIFY: Future — sidecar UI WS-2/WS-8 --> |
| `ai_integration_phase` | `boolean` | `false` | AI integration phase. <!-- VERIFY: Future — WS-4 workstream --> |
| `research_before_questions` | `boolean` | `true` | Research codebase before asking questions. |
| `discuss_mode` | `enum` | `"sufficient-phase-discussion"` | Phase discussion intensity. Values: `"sufficient-phase-discussion"`, `"intensive-phase-discussion"`, `"skip-phase-discussion"`. |
| `use_worktrees` | `boolean` | `false` | Use git worktrees for isolated development. |

---

## 3. Language Settings / Cài Đặt Ngôn Ngữ

### `conversation_language`

Controls the language used for **agent-to-user conversation** — all output, explanations, and interactive dialogue.

### `documents_and_artifacts_language`

Controls the language used for **written artifacts** — documentation files, specs, plans, and commit messages.

**Supported language codes** (defined by `SupportedLanguageSchema` lines 18–29):

| Code | Language |
|------|----------|
| `en` | English |
| `vi` | Tiếng Việt |
| `zh` | 中文 |
| `fr` | Français |
| `ja` | 日本語 |
| `ko` | 한국어 |
| `de` | Deutsch |
| `es` | Español |
| `th` | ภาษาไทย |
| `id` | Bahasa Indonesia |

**Example: English conversation + Vietnamese documents:**

```json
{
  "conversation_language": "en",
  "documents_and_artifacts_language": "vi"
}
```

**Resolution at runtime:** The `resolveBehavioralProfile()` function in `src/routing/behavioral-profile/resolve-behavioral-profile.ts` reads fresh config from disk via `getFreshConfig()` every time a session starts, picking up language changes immediately without a plugin restart.

---

## 4. Behavioral Profiles Resolution Chain / Chuỗi Phân Giải Hồ Sơ Hành Vi

The behavioral profile system combines **static config lookup** with **runtime profile detection** in a merged resolution chain.

### 4.1. Three Modes / Ba Chế Độ

Defined by `HivemindModeSchema` (`src/schema-kernel/hivemind-configs.schema.ts` lines 50–54) and mapped to profiles in `src/routing/behavioral-profile/profiles.ts`:

| Mode | guardrailLevel | delegationMode | toolAccessPattern | skillFilter | Use Case |
|------|---------------|----------------|-------------------|-------------|----------|
| `expert-advisor` | `moderate` | `waiter` | `full` | `all` | Agent-led with TDD, spec-driven, research-first, systematic planning |
| `hivemind-powered` | `strict` | `waiter` | `restricted` | `curated` | Stricter guardrails, hierarchical tracking, cross-context persistence |
| `free-style` | `minimal` | `disabled` | `full` | `all` | Features only available if child control-panes are active |

### 4.2. Resolution Chain / Chuỗi Phân Giải

The resolution is orchestrated by `resolveBehavioralProfile()` in `src/routing/behavioral-profile/resolve-behavioral-profile.ts`:

```
Config (configs.json)
  ├── mode → BehavioralProfiles[mode] (static lookup — guardrails, delegation, tools, skills)
  ├── user_expert_level → mapLevelToExpertise() (config-first)
  ├── conversation_language → language.conversation
  ├── documents_and_artifacts_language → language.documents
  └── workflow.discuss_mode → discussMode

Runtime (profile-resolver.ts)
  └── session context → resolveProfile() (runtime detection)
       ├── message length → communicationStyle
       ├── response time → decisionSpeed
       └── technical terms → expertise

Merge: config-first with runtime fallback (D-06)
  ├── expertise: configExpertise ?? runtimeProfile.expertise
  ├── communicationStyle: runtimeProfile.communicationStyle
  └── decisionSpeed: runtimeProfile.decisionSpeed
```

**Result** (`ResolvedBehavioralProfile` in `src/routing/behavioral-profile/types.ts` lines 65–87) contains the complete merged profile including:

- `mode` — the raw mode string
- `behavioralProfile` — the static lookup result (guardrails, delegation, tools, skills)
- `language` — conversation + documents language
- `userExpertLevel` — raw expert level from config
- `discussMode` — discussion mode signal
- `runtimeProfile` — raw runtime detection result
- `merged` — the final merged fields

### 4.3. User Expert Level Mapping / Ánh Xạ Cấp Độ Chuyên Gia

| Config Value | Mapped Expertise | Meaning |
|-------------|-----------------|---------|
| `clumsy-vibecoder` | `junior` | Beginner, needs detailed hand-holding (vi: người mới, cần hướng dẫn chi tiết) |
| `beginner-friendly` | `junior` | Beginner-friendly explanation level |
| `intermediate-high-level` | `mid` | Intermediate user (default) |
| `architecture-driven` | `senior` | Experienced, architecture-aware |
| `absolute-expert` | `senior` | Expert-level, minimal explanation needed |

---

## 5. Delegation Systems Configuration / Cấu Hình Hệ Thống Ủy Quyền

Defined by `DelegationSystemsSchema` (`src/schema-kernel/hivemind-configs.schema.ts` lines 185–197):

```json
{
  "delegation_systems": {
    "native_task": true,
    "delegate_task": true,
    "background_delegation": true
  }
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `native_task` | `true` | OpenCode innate task tool (always available). WaiterModel dispatch with configurable polling. |
| `delegate_task` | `true` | Custom delegation via Hivemind harness (`f-06`). Provides session stacking, contract enforcement, dual-signal completion. |
| `background_delegation` | `true` | Background/async delegation (`f-06 advanced`). Enables non-blocking dispatch for long-running research or monitoring tasks. |

When disabled, the corresponding tool returns a graceful error rather than crashing. The `delegate-task` tool respects `delegation_systems.delegate_task` — when set to `false`, it returns an informative error message.

---

## 6. Schema Validation via Zod / Xác Thực Schema Qua Zod

All config validation is performed by `HivemindConfigsSchema` in `src/schema-kernel/hivemind-configs.schema.ts` lines 266–287.

### Validation Flow / Luồng Xác Thực

```
configs.json on disk
    ↓ (readFileSync + JSON.parse)
raw Record<string, unknown>
    ↓ (migrateKeys — legacy camelCase → snake_case)
migrated object
    ↓ (HivemindConfigsSchema.safeParse — Zod validation)
Validated HivemindConfigs OR defaults
```

### Key Behaviors / Hành Vi Chính

- **`.strip()`** — Unknown fields are silently removed (forward-compatible with future schema versions)
- **`.default()`** — Every field has a safe default; missing fields never cause crashes
- **`safeParse()`** — Invalid types produce a fallback to defaults rather than throwing

### Read Functions

| Function | File | Behavior |
|----------|------|----------|
| `readConfigs(projectRoot)` | schema-kernel module | Read + validate from disk. Missing file → defaults. Invalid JSON → defaults. Invalid schema → defaults. |
| `validateConfigsFile(projectRoot)` | schema-kernel module | Explicit validation for diagnostics (`hivemind doctor`). Returns success/failure with human-readable error messages — no silent fallback. |
| `writeConfigs(projectRoot, config)` | schema-kernel module | Validates via `.parse()`, creates parent dir if needed, writes canonical snake_case JSON. Throws on invalid config. |
| `getConfig(projectRoot)` | `src/config/subscriber.ts` | Lazy-loaded + cached wrapper. First call reads disk, subsequent calls return cached value. |
| `getFreshConfig(projectRoot)` | `src/config/subscriber.ts` | Always reads from disk — bypasses cache. Used by hooks for current config snapshot. |
| `invalidateConfigCache()` | `src/config/subscriber.ts` | Clears cache. Next `getConfig()` re-reads from disk. |

### JSON Schema (IDE Support)

A JSON Schema file is also shipped at `.hivemind/configs.schema.json` (189 lines) providing IDE autocompletion and inline validation. Referenced via:

```json
{
  "$schema": "./configs.schema.json"
}
```

The schema ID is `https://hivemind.dev/schema/configs/2.0.0` and targets JSON Schema draft 2020-12. <!-- VERIFY: external schema URL — https://hivemind.dev/schema/configs/2.0.0 -->

### Config File Validation Diagnostics / Chẩn Đoán Xác Thực

When running `hivemind doctor` (or equivalent diagnostics), the `validateConfigsFile()` function provides explicit error messages:

- **Missing file:** `"Missing /path/to/.hivemind/configs.json"`
- **Invalid JSON:** JSON parse error message
- **Schema violation:** Zod error issues formatted as `"field.path: error message"` joined by semicolons

---

## 7. Config Subscriber Architecture / Kiến Trúc Đăng Ký Cấu Hình

The `src/config/` directory provides three modules:

| Module | File | Purpose |
|--------|------|---------|
| **Subscriber** | `src/config/subscriber.ts` | Lazy-load + cache + fallback for reading configs at runtime. Cache-per-project, invalidation support. |
| **Compiler** | `src/config/compiler.ts` | Compile/decompile OpenCode primitives (agents, commands, skills) with YAML frontmatter and Zod validation. |
| **Workflow** | `src/config/workflow/` | Config workflow state machine (8-turn: discovery → investigate → collect → proposal → validate → compile → test → save). |

The subscriber is the primary consumer-facing API — most runtime code calls `getConfig(projectRoot)` or `getFreshConfig(projectRoot)` from `subscriber.ts` rather than calling the schema kernel directly.

---

## 8. Environment Variables / Biến Môi Trường

In addition to `.hivemind/configs.json`, the runtime respects these environment variables (all optional):

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_HARNESS_STATE_DIR` | `.hivemind/state/` | Override persistent state directory. |
| `OPENCODE_HARNESS_CONTINUITY_FILE` | `{stateDir}/session-continuity.json` | Override session continuity file path. |
| `OPENCODE_HARNESS_CONCURRENCY_LIMIT` | `3` | Max concurrent delegated sessions. Clamped to 3 if below 1. |
| `OPENCODE_CONFIG_DIR` | `~/.config/opencode` | Global primitive config directory. |
| `NODE_ENV` | — | When `"test"`, relaxes SDK session ID prefix-stripping for test isolation. |
