# What's Delivered Component Table (Archived from STATE.md)

**Archived:** 2026-05-11 per Phase 11 D-10. Replaced in STATE.md by summary paragraph.

---

## What's Delivered

| Component | Status | Details |
|-----------|--------|---------|
| Build system | ✅ | tsc clean, typecheck passes, dist/ produces correctly |
| Test suite | ✅ | 125 test files, 1767 tests, 2 failures (README heading assertions) |
| 16 custom tools | ✅ | Registered in plugin.ts, Zod schemas, CQRS write-side |
| 6 hook types | ✅ | Event observers, system/messages transforms, tool guards |
| configs.json schema | ✅ | 29 fields, readConfigs()/writeConfigs(), lazy-cached subscriber |
| Behavioral profiles | ✅ | 3 modes → profile mapping, wired into hooks/delegation/gates |
| Toggle gates | ✅ | 6 toggles wired, 4 @future-consumer annotated, 4 deferred |
| Delegation engine | ✅ | WaiterModel dispatch, dual-signal completion, PTY/SDK lanes |
| Continuity persistence | ✅ | Deep-clone-on-read, session journal, Q6 state root migration |
| 89 agents | ✅ | L0/L1/L2/L3 hierarchy, hm-* + hf-* lineages |
| 123 active skill directories | ✅ | Current primitive inventory excludes `.gitkeep`; lineage counts require MCM doctor proof before shipping claims |
| 19 commands | ✅ | start-work, plan, deep-init, ultrawork, harness-doctor, etc. |
| Agent/skill integration constitution | ✅ | BOOT-08: lineage, permissions, hierarchy, routing contracts (L5 governance) |
| Agent migration verification | ✅ | MCM-01: 56 shipped agents (45 hm-* + 11 hf-*) classified and discoverable |
| Skill migration verification | ✅ | MCM-02: 48 shipped skills (35 hm-* + 13 hf-*) classified and discoverable |
