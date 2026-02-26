# Dashboard-v2 Complete Overhaul Plan

> **Document Type**: Corporate-Level Phase Plan
> **Persona Lane**: Enterprise Architect
> **Governance Mode**: Strict
> **Created**: 2026-02-26
> **Status**: PLANNING

---

## Executive Summary

This document defines a **5-phase comprehensive overhaul** of the HiveMind Dashboard-v2 to transform it from a non-functional display into a **fully operational control panel** with:
- Real-time data synchronization
- Full CRUD capabilities
- Bilingual support (EN/VI)
- Enterprise-grade error handling
- Complete integration with OpenCode server

---

## Current State Assessment

### What Works
- ✅ UI renders without crash (OpenTUI)
- ✅ Tab navigation (1-7, Tab, j/k)
- ✅ Cyberpunk styling (neon colors, borders)
- ✅ Local snapshot loading from `.hivemind/`
- ✅ Phase 1: Server data flow fixed
- ✅ Phase 2: InputModal component created

### What's Broken/Missing
- ❌ No real-time updates (no SSE subscription)
- ❌ InputModal exists but not fully integrated
- ❌ No actual text input capture in production
- ❌ No command picker for `/` commands
- ❌ No session management UI
- ❌ No error recovery mechanism
- ❌ Bilingual keys incomplete

---

## 5-Phase Execution Plan

### Phase 1: Foundation & Data Flow (COMPLETED)
**Goal**: Ensure all data flows correctly from server to UI

| Task ID | Atomic Task | Evidence | Status |
|---------|-------------|----------|--------|
| 1.1 | Fix `snapshot.ts` data flow bug | `bunx tsc --noEmit` passes | ✅ DONE |
| 1.2 | Wire keyboard shortcuts to API | `c/m/x/t` call `apiClient` | ✅ DONE |
| 1.3 | Add server connection status tracking | Header shows ONLINE/OFFLINE | ✅ DONE |
| 1.4 | Verify TypeScript compilation | 0 errors | ✅ DONE |
| 1.5 | Verify root tests pass | 197/197 tests | ✅ DONE |

**Validation Gate**:
```bash
cd src/dashboard-v2 && bunx tsc --noEmit
cd /Users/apple/hivemind-plugin && npm test
```

---

### Phase 2: Input Modal System (COMPLETED)
**Goal**: Enable user text input for messages and commands

| Task ID | Atomic Task | Evidence | Status |
|---------|-------------|----------|--------|
| 2.1 | Fix `borderBottom` prop error | OpenTUI constraint satisfied | ✅ DONE |
| 2.2 | Remove `SelectModal` non-existent import | No import errors | ✅ DONE |
| 2.3 | Add `modal` state to AppState | Type-safe state management | ✅ DONE |
| 2.4 | Add `OPEN_MODAL`/`CLOSE_MODAL` actions | Reducer handles modal state | ✅ DONE |
| 2.5 | Wire `c/m/x` keys to open modals | Keys trigger InputModal | ✅ DONE |
| 2.6 | Add modal i18n keys (EN/VI) | `modal.title_*` keys exist | ✅ DONE |
| 2.7 | Render InputModal in App component | Modal appears on screen | ✅ DONE |

**Validation Gate**:
```bash
cd src/dashboard-v2 && bunx tsc --noEmit
# Manual: Press 'm' → Modal appears → Type → Enter submits
```

---

### Phase 3: SSE Real-Time Updates (PENDING)
**Goal**: Subscribe to OpenCode server `/event` SSE for live data

| Task ID | Atomic Task | Evidence | Dependencies |
|---------|-------------|----------|--------------|
| 3.1 | Add `subscribeToEvents()` to api.ts | Function exists with EventSource | None |
| 3.2 | Define event type handlers | `session.status`, `message.part.updated`, `todo.updated` | 3.1 |
| 3.3 | Add SSE connection state to AppState | `sseConnected: boolean` | 3.1 |
| 3.4 | Wire SSE in App useEffect | Subscription on mount, cleanup on unmount | 3.2, 3.3 |
| 3.5 | Add SSE indicator in footer | "🔴 LIVE" when connected | 3.4 |
| 3.6 | Handle reconnection on error | Exponential backoff, max 3 retries | 3.4 |
| 3.7 | Update snapshot on `context:purged` event | Refresh local data | 3.2 |

**Validation Gate**:
```bash
# Terminal 1: opencode serve
# Terminal 2: cd src/dashboard-v2 && bun run src/index.tsx
# Verify footer shows "🔴 LIVE"
# In another terminal: send message to server
# Verify dashboard updates automatically
```

**Files to Modify**:
- `src/dashboard-v2/src/api.ts` - Add SSE client
- `src/dashboard-v2/src/index.tsx` - Wire SSE subscription
- `src/dashboard-v2/src/types.ts` - Add event types

---

### Phase 4: Complete Bilingual Support (PARTIAL)
**Goal**: Full EN/VI support with language toggle

| Task ID | Atomic Task | Evidence | Dependencies |
|---------|-------------|----------|--------------|
| 4.1 | Audit all hardcoded strings | grep for strings not using `t()` | None |
| 4.2 | Add missing i18n keys to DashboardStrings | Type-safe keys | 4.1 |
| 4.3 | Add VI translations for all keys | Complete STRINGS.vi object | 4.2 |
| 4.4 | Add language toggle (`L` key) | `toggleLang()` called on 'l' | 4.3 |
| 4.5 | Persist language preference | localStorage working | 4.4 |
| 4.6 | Add language indicator in footer | "[L] EN/VI" | 4.4 |
| 4.7 | Update all components to use `t()` | No hardcoded strings | 4.5 |

**Validation Gate**:
```bash
# Manual: Press 'L' → Language toggles
# Verify all text changes language
# Restart dashboard → Language persisted
```

**Files to Modify**:
- `src/dashboard-v2/src/i18n.ts` - Complete translations
- `src/dashboard-v2/src/index.tsx` - Add 'L' handler, use `t()`

---

### Phase 5: Integration Testing & Polish (PENDING)
**Goal**: Production-ready dashboard with error handling

| Task ID | Atomic Task | Evidence | Dependencies |
|---------|-------------|----------|--------------|
| 5.1 | Add error boundary component | Catches render errors | None |
| 5.2 | Add retry mechanism for API calls | 3 retries with backoff | 5.1 |
| 5.3 | Add loading states for all actions | Spinner/indicator | 5.2 |
| 5.4 | Add keyboard help overlay (`?` key) | Shows all shortcuts | None |
| 5.5 | Add session selector component | Switch between sessions | Phase 3 |
| 5.6 | Add command history | Up/Down arrow navigation | Phase 2 |
| 5.7 | Add confirmation dialogs | Destructive actions require confirm | 5.4 |
| 5.8 | E2E test: Create session → Send message → Verify | Manual test pass | All phases |
| 5.9 | E2E test: Offline mode → Reconnect → Verify | Manual test pass | Phase 3 |
| 5.10 | Document keyboard shortcuts in README | `docs/dashboard-v2.md` | 5.8 |

**Validation Gate**:
```bash
# Full E2E workflow test:
# 1. Start server: opencode serve
# 2. Start dashboard: cd src/dashboard-v2 && bun run src/index.tsx
# 3. Press 'c' → Enter title → Create session
# 4. Press 'm' → Type message → Send
# 5. Verify message appears in server logs
# 6. Disconnect server → Verify offline state
# 7. Reconnect → Verify auto-reconnect
# 8. Press 'L' → Verify language toggle
# 9. Press '?' → Verify help overlay
```

**Files to Create/Modify**:
- `src/dashboard-v2/src/components/ErrorBoundary.tsx` - NEW
- `src/dashboard-v2/src/components/HelpOverlay.tsx` - NEW
- `src/dashboard-v2/src/components/SessionSelector.tsx` - NEW
- `docs/dashboard-v2.md` - NEW documentation

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenTUI API changes | High | Pin version, document used APIs |
| SSE connection drops | Medium | Reconnection logic, fallback polling |
| Server offline | Medium | Graceful degradation, clear error messages |
| Input conflicts | Low | Modal mode disables main keyboard handlers |

---

## Success Criteria

### Must Have (P0)
- [ ] Dashboard connects to OpenCode server at localhost:4096
- [ ] Real-time updates via SSE
- [ ] Create session via 'c' key with modal input
- [ ] Send message via 'm' key with modal input
- [ ] Execute command via 'x' key with modal input
- [ ] Bilingual EN/VI toggle

### Should Have (P1)
- [ ] Session selector to switch between active sessions
- [ ] Command history with Up/Down navigation
- [ ] Help overlay showing all shortcuts
- [ ] Error boundary with recovery

### Nice to Have (P2)
- [ ] Configurable server URL
- [ ] Theme customization
- [ ] Export session data

---

## Execution Timeline

| Phase | Duration | Dependencies | Status |
|-------|----------|--------------|--------|
| Phase 1 | 1 hour | None | ✅ COMPLETE |
| Phase 2 | 1 hour | Phase 1 | ✅ COMPLETE |
| Phase 3 | 2 hours | Phase 2 | ⏳ PENDING |
| Phase 4 | 1 hour | Phase 2 | ⏳ PARTIAL |
| Phase 5 | 2 hours | Phase 3, 4 | ⏳ PENDING |

**Total Estimated**: 7 hours

---

## Appendix A: File Structure

```
src/dashboard-v2/src/
├── api.ts                 # HTTP + SSE client
├── index.tsx              # Main app
├── snapshot.ts            # Data loading
├── types.ts               # Type definitions
├── i18n.ts                # Translations
└── components/
    ├── InputModal.tsx     # Text input modal
    ├── ErrorBoundary.tsx  # Error handling (Phase 5)
    ├── HelpOverlay.tsx    # Keyboard help (Phase 5)
    └── SessionSelector.tsx # Session picker (Phase 5)
```

---

## Appendix B: OpenCode Server API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/global/health` | GET | Health check |
| `/session` | GET | List sessions |
| `/session` | POST | Create session |
| `/session/:id/message` | POST | Send message |
| `/session/:id/command` | POST | Execute command |
| `/session/:id/todo` | GET | Get todos |
| `/agent` | GET | List agents |
| `/event` | GET | SSE stream |

---

*Document generated following HiveFiver enterprise_architect persona lane*
