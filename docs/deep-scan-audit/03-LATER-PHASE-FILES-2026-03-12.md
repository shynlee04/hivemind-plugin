# Later Phase Files

**Generated**: 2026-03-12
**Scope**: Files deferred to Phases 2-5
**Prerequisite**: Phase 1 concerns resolved first

---

## Phase 2: Identity Normalization

> Target: `.hivemind/` identity and session model files

### Files

| File/Directory | Issue | Dependency |
|----------------|-------|------------|
| `.hivemind/identity/` | Session identity model incomplete | Phase 1 injection stability |
| `.hivemind/sessions/active/*/profile.json` | Agent resolution model | event-handler.ts stable |
| `.hivemind/state/lineage.json` | Lineage tracking | Phase 1 authority surfaces |
| `src/lib/session-identity.ts` | Identity resolution logic | Phase 1 hooks stable |

### Handoff/Export Authority

| File | Issue | Dependency |
|------|-------|------------|
| `src/lib/handoff-authority.ts` | Export authority unclear | State authority pass complete |
| `src/lib/session-export.ts` | Export format governance | Compaction engine stable |
| `src/tools/hivemind-cycle.ts` | Cycle/export tool | Export authority defined |
| `src/lib/resume-authority.ts` | Resume state reconstruction | Session identity complete |

### Phase 2 Trigger Conditions

- [ ] Phase 1 restricted zones addressed with phased plan
- [ ] CQRS violations resolved
- [ ] Injection pipeline stable under testing
- [ ] Ownership coverage tests green

---

## Phase 3: Donor Absorption

> Target: `.opencode/**` donor files to be absorbed or deprecated

### Files

| Path | Issue | Action |
|------|-------|--------|
| `.opencode/agents/` | Duplicate agent definitions | Absorb or deprecate |
| `.opencode/commands/` | Mirror of root commands | Verify sync, deprecate mirror |
| `.opencode/skills/` | Mirror of root skills | Verify sync, deprecate mirror |
| `.opencode/workflows/` | Mirror of root workflows | Verify sync, deprecate mirror |

### Duplicated Tool/Command Domains

| Root File | .opencode Mirror | Conflict Type |
|-----------|------------------|---------------|
| `commands/hivefiver*.md` | `.opencode/commands/hivefiver*.md` | Duplication |
| `commands/hivemind*.md` | `.opencode/commands/hivemind*.md` | Duplication |
| `skills/*/SKILL.md` | `.opencode/skills/*/SKILL.md` | Duplication |

### Phase 3 Trigger Conditions

- [ ] Phase 2 identity normalization complete
- [ ] Clear ownership model for framework assets
- [ ] Sync tooling verified (`src/cli/sync-assets.ts`)

---

## Phase 3a: Registry Cleanup

> Target: Skills registry and platform adapter directories

### Skills Registry

| File | Issue | Action |
|------|-------|--------|
| `skills/registry.yaml` | 22 phantom entries | Audit and remove |
| `.opencode/skills/registry.yaml` | Mirror with same issue | Sync after root fix |

### Phantom Entries Detection

```yaml
# Entries in registry.yaml without corresponding SKILL.md files
# Run: find skills -name "SKILL.md" | sort > actual-skills.txt
# Compare with registry.yaml entries
```

### Platform Adapter Directories

| Directory | Issue | Action |
|-----------|-------|--------|
| `.opencode/skills/platform-adapter/` | Broken symlinks | Verify or remove |
| `.cursor/skills/` | Platform-specific mirror | Audit for staleness |
| `.windsurf/skills/` | Platform-specific mirror | Audit for staleness |
| `.claude/skills/` | Platform-specific mirror | Audit for staleness |
| `.qwen/skills/` | Platform-specific mirror | Audit for staleness |
| `.trae/skills/` | Platform-specific mirror | Audit for staleness |
| `.crush/skills/` | Platform-specific mirror | Audit for staleness |
| `.qoder/skills/` | Platform-specific mirror | Audit for staleness |
| `.codex/skills/` | Platform-specific mirror | Audit for staleness |
| `.continue/skills/` | Platform-specific mirror | Audit for staleness |
| `.aider/skills/` | Platform-specific mirror | Audit for staleness |

### Phase 3a Trigger Conditions

- [ ] Phase 3 donor absorption complete
- [ ] Platform adapter skill stabilized
- [ ] Clear policy on platform-specific mirrors

---

## Phase 4: Build & Distribution

> Target: `dist/**` parity and build graph verification

### Files

| Path | Issue | Action |
|------|-------|--------|
| `dist/` | Verify parity with src/ | Full build verification |
| `package.json` | Publish entries | Audit for accuracy |
| `tsconfig.json` | Build configuration | Verify output paths |
| `src/cli/` | CLI entry points | Verify bin mapping |

### Build Graph Verification

```bash
# Verify build output matches source
npm run build
diff -r src/ dist/src/ --exclude="*.ts" || echo "Mismatch detected"

# Verify bin entries
node dist/cli/index.js --version
```

### Dashboard/Bin Sidecars

| Path | Issue | Action |
|------|-------|--------|
| `src/dashboard/` | Ink-based dashboard | Verify TypeScript compilation |
| `bin/hivemind-context-governance` | CLI entry | Verify symlink/integration |

### Phase 4 Trigger Conditions

- [ ] Phase 3a registry cleanup complete
- [ ] All tests passing
- [ ] Type check clean (`npx tsc --noEmit`)

---

## Phase 5: Final Cleanup

> Target: Leftover dependencies and stale stores

### Leftover `.opencode` Runtime Dependencies

| Path | Issue | Action |
|------|-------|--------|
| `.opencode/config.json` | Runtime config | Verify no stale references |
| `.opencode/hooks/` | Legacy hooks | Audit for removal |
| `.opencode/plugins/` (non-governance) | Other plugins | Audit for necessity |

### Stale Session/Planning Stores

| Path | Issue | Action |
|------|-------|--------|
| `.hivemind/sessions/archive/` | Old session archives | Implement retention policy |
| `.hivemind/plans/` | Unvalidated planning artifacts | Migrate to `.hivemind/project/planning/` |
| `.hivemind/manifests/` | Old manifests | Audit for relevance |

### Duplicated Scripts

| Path | Issue | Action |
|------|-------|--------|
| `scripts/` | Root scripts | Audit for duplication with npm scripts |
| `.opencode/scripts/` | Mirror scripts | Verify sync or deprecate |

### Dead Command Surfaces

| Command | Issue | Action |
|---------|-------|--------|
| TBD | Scan for commands with no consumers | Archive |

### Phase 5 Trigger Conditions

- [ ] Phase 4 build verification complete
- [ ] Distribution ready for publish
- [ ] All prior phases documented

---

## Phase Dependency Graph

```
Phase 1 (Current)
├── Restricted zones addressed
├── Injection pipeline stable
└── CQRS violations resolved
    ↓
Phase 2
├── Identity normalization
└── Handoff/export authority
    ↓
Phase 3
├── Donor absorption
└── Duplicate domain resolution
    ↓
Phase 3a
├── Registry cleanup
└── Platform adapter audit
    ↓
Phase 4
├── Build verification
└── Distribution parity
    ↓
Phase 5
├── Final cleanup
└── Retention policies
```

---

## Summary

| Phase | Target | Files | Trigger |
|-------|--------|-------|---------|
| 2 | Identity normalization | ~10 | Phase 1 stable |
| 3 | Donor absorption | ~20 | Phase 2 complete |
| 3a | Registry cleanup | ~30 | Phase 3 complete |
| 4 | Build verification | ~15 | Phase 3a complete |
| 5 | Final cleanup | ~20 | Phase 4 complete |

---

*Maintained by: hivefiver meta-builder*
*Next review: 2026-03-19*
