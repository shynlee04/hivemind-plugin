# HiveMind Context Governance

HiveMind is an OpenCode plugin that keeps AI sessions coherent from start to finish.

It connects:
- install and project initialization,
- OpenCode runtime hooks,
- governance tools,
- session archives and memory,
- and optional live dashboard,

into one operating model instead of disconnected helpers.

`14 tools` | `governance hooks + events` | `interactive init` | `EN/VI support` | `Ink TUI dashboard (optional)`

## What HiveMind Solves

Without governance, long AI sessions often drift:
- focus changes but no explicit checkpoint,
- work happens without a stable intent/action chain,
- compaction loses why decisions were made,
- subagent outputs are not fed back into the parent thread.

HiveMind enforces a simple backbone:

`declare_intent -> map_context -> execute -> compact_session`

and preserves state under `.hivemind/` so each session can continue with traceable context.

## Quick Start

```bash
# 1) Install
npm install hivemind-context-governance

# 2) Initialize (interactive wizard, recommended)
npx hivemind-context-governance

# 3) Or initialize with flags
npx hivemind-context-governance init --mode assisted --lang en
```

The wizard configures:
- governance mode,
- language,
- automation level,
- agent behavior (expert level/output style),
- constraints (code review/TDD),

then creates `.hivemind/` and registers the plugin in `opencode.json` or `opencode.jsonc`.

## First-Run Behavior in OpenCode

If OpenCode loads the plugin before initialization (`.hivemind/config.json` missing), HiveMind enters setup guidance mode.

In this mode, the system prompt injects:
- setup instructions (`npx hivemind-context-governance`),
- detected project/framework hints,
- and a mandatory first-run reconnaissance protocol:
  - scan repo structure and artifacts,
  - read core docs/config,
  - isolate stale/conflicting context,
  - build project backbone before implementation.

Important:
- HiveMind no longer silently bootstraps a default session through `declare_intent` when config is missing.
- You must initialize first, then governance tools become fully operational.

## End-to-End Product Flow

1. Install plugin package
2. Run CLI init wizard
3. Open OpenCode in project
4. Agent starts with declared intent and hierarchy updates
5. Hooks track drift/violations/evidence pressure
6. `compact_session` archives and prepares next compaction context
7. Next session resumes with preserved context instead of reset chaos

## Governance Modes

| Mode | Behavior | Typical use |
| --- | --- | --- |
| `strict` | Session starts `LOCKED`; strongest pressure and warnings | Regulated/high-risk workflows |
| `assisted` | Session starts `OPEN`; balanced guidance | Default for most teams |
| `permissive` | Open flow with lighter pressure | Expert users, low ceremony |

## Automation Levels

`manual -> guided -> assisted -> full -> retard`

`retard` is intentional naming in this project and means maximum handholding/pushback:
- strict governance,
- skeptical output style,
- stronger discipline around evidence and structure.

## Core Tools (14)

### Session lifecycle
- `declare_intent`: unlock and set trajectory
- `map_context`: maintain trajectory/tactic/action alignment
- `compact_session`: archive and reset cleanly

### Awareness and correction
- `scan_hierarchy`
- `think_back`
- `check_drift`
- `self_rate`

### Persistent intelligence
- `save_anchor`
- `save_mem`
- `list_shelves`
- `recall_mems`

### Tree maintenance
- `hierarchy_prune`
- `hierarchy_migrate`

### Subagent result capture
- `export_cycle`

## Runtime Hooks

- `experimental.chat.system.transform`: injects `<hivemind>` prompt context every turn
- `tool.execute.before`: governance gate/warnings before tool execution
- `tool.execute.after`: tracking, counters, escalation signals, cycle capture
- `experimental.session.compacting`: compaction context preservation
- `event`: session/event-driven toasts and governance signals

Note: in OpenCode v1.1+, before-hook cannot hard-block execution; HiveMind enforces through state + warnings + escalation.

## CLI Commands

```bash
npx hivemind-context-governance
npx hivemind-context-governance init
npx hivemind-context-governance status
npx hivemind-context-governance settings
npx hivemind-context-governance compact
npx hivemind-context-governance dashboard
npx hivemind-context-governance help
```

Common flags:
- `--mode <permissive|assisted|strict>`
- `--lang <en|vi>`
- `--automation <manual|guided|assisted|full|retard>`
- `--expert <beginner|intermediate|advanced|expert>`
- `--style <explanatory|outline|skeptical|architecture|minimal>`
- `--code-review`
- `--tdd`

### Dashboard (optional)

```bash
npm install ink react
npx hivemind-context-governance dashboard --lang vi --refresh 1
```

## Upgrade Guide (especially from v2.5.x)

1. Update package:

```bash
npm install hivemind-context-governance@latest
```

2. Re-run init to refresh config defaults and behavior profile:

```bash
npx hivemind-context-governance
```

3. Verify settings:

```bash
npx hivemind-context-governance settings
```

4. Optional cleanup of legacy/stale artifacts:
- remove old experimental docs that conflict with current flow,
- ensure only the active project copy is being used,
- resolve framework conflicts (`.planning` and `.spec-kit` both present) by selecting one active framework path.

Migration notes:
- Brain state migration backfills newly added metrics fields for older `brain.json` files.
- Compaction reports are now consumed once (injected then cleared), preventing stale repeated injections.

## `.hivemind/` Layout

```text
.hivemind/
  config.json
  brain.json
  hierarchy.json
  anchors.json
  mems.json
  logs/
  templates/
    session.md
  sessions/
    manifest.json
    active.md
    index.md
    archive/
      exports/
```

## Troubleshooting

- `setup guidance keeps appearing`:
  - run `npx hivemind-context-governance` in the project root,
  - confirm `.hivemind/config.json` exists.

- `framework conflict warning`:
  - if both `.planning` and `.spec-kit` exist, set explicit framework metadata before implementation.

- `dashboard does not start`:
  - install optional deps `ink react`.

- `session feels stale/weird after long idle`:
  - stale session auto-archive may have rotated state,
  - use `scan_hierarchy` and `think_back` to realign.

## Development Verification

In this repo:

```bash
npm test
npm run typecheck
```

## License

MIT

---

## Tieng Viet (Giai thich chi tiet hon)

### HiveMind la gi, va tai sao can no?

Neu ban de AI code trong nhieu turn, van de lon nhat khong phai la "khong biet code", ma la "mat mach su nghiep":
- dang lam A nhay sang B,
- quyen tac thay doi nhung khong cap nhat context,
- sau compaction thi quen mat ly do quyet dinh truoc do,
- subagent tra ve ket qua nhung khong duoc tong hop vao luong chinh.

HiveMind giai quyet bang mot xuong song rat ro:

`declare_intent -> map_context -> execute -> compact_session`

Y nghia thuc te:
- Luon co muc tieu hien tai (trajectory/tactic/action),
- Moi lan doi focus deu co dau vet,
- Ket thuc session thi du lieu duoc luu co cau truc,
- Session sau vao lai khong bi "reset tri nho".

### Luong su dung de dung ngay

1. Cai dat:

```bash
npm install hivemind-context-governance
```

2. Chay wizard:

```bash
npx hivemind-context-governance
```

3. Mo OpenCode tai dung project.

4. Trong qua trinh lam viec:
- khai bao y dinh: `declare_intent`
- doi ngu canh: `map_context`
- ket session: `compact_session`

### First-run trong OpenCode (quan trong)

Neu plugin duoc load ma chua init, HiveMind se khong cho session governance day du ngay lap tuc.
Thay vao do, no chen block huong dan setup + recon protocol de agent:
- quet cau truc repo,
- doc tai lieu cot loi,
- tach context bi "nhiem" (stale/xung dot/trung lap),
- sau do moi bat dau implement.

Muc tieu: tranh tinh trang "vua vao da sua code" khi chua hieu project.

### Nang cap tu ban cu (vi du 2.5.x)

Lam ngan gon theo thu tu:

1. cap nhat package,
2. chay lai wizard init,
3. kiem tra settings,
4. dep artifact cu neu dang bi roi (du an clone cu, docs conflict, framework conflict).

Neu thay warning lien quan `.planning` va `.spec-kit`, do la canh bao co chu dich:
ban can chon framework dang active va cap metadata ro rang truoc khi cho AI implement tiep.

### Goi y van hanh de doan team de on dinh

- Khong bo qua `declare_intent` o dau session.
- Moi lan doi huong lon, goi `map_context` truoc khi tiep tuc.
- Sau mot chang viec, `compact_session` de giu tri nho co cau truc.
- Dung `export_cycle` sau khi subagent tra ket qua de khong that lac tri thuc.

Neu ban coi HiveMind nhu "bo dieu phoi context" thay vi "mot bo tool phu", chat luong session se khac biet rat ro.
