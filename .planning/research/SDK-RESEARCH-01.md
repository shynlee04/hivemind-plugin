# Research Task: SDK-RESEARCH-01

**Title:** OpenCode SDK TUI Capabilities — Custom Panel Support
**Phase:** 1 (SDK Foundation)
**Priority:** HIGH — Blocks embedded dashboard decision
**Status:** Pending

---

## Objective

Determine whether the OpenCode SDK supports plugins registering custom TUI panels/tabs, or if `client.tui.showToast()` is the only UI integration point.

---

## Research Questions

### Primary Questions
1. **Can plugins register custom panels?**
   - Is there `client.tui.registerPanel()` or similar API?
   - Can panels be positioned (sidebar, tab, bottom panel)?
   - What component format is required (React, Ink, OpenTUI)?

2. **What are the technical constraints?**
   - Panel lifecycle (who manages mount/unmount)?
   - State synchronization (who owns state: plugin or host)?
   - Event handling (can panels receive keyboard input?)
   - Performance limits (render frequency, update throttling)

3. **What are the UX constraints?**
   - Can panels have custom titles/icons?
   - Can panels be toggled by users?
   - Are there size/position restrictions?

### Secondary Questions
4. **If panels ARE supported:**
   - What SDK version introduced this?
   - Are there example plugins using custom panels?
   - What's the stability/maturity level?

5. **If panels are NOT supported:**
   - Is this on the roadmap?
   - Are there alternative approaches (WebView panels, CLI commands)?
   - Can we request this feature upstream?

---

## Research Methods

1. **SDK Documentation Review**
   - Check `@opencode-ai/plugin` types (PluginInput, client.tui.*)
   - Review OpenCode plugin SDK reference docs
   - Look for TUI/hooks section

2. **Code Search**
   - Search OpenCode source for `registerPanel`, `tui.panel`, `sidebar`
   - Check existing plugins in ecosystem for panel usage
   - Review plugin examples in official repos

3. **Upstream Inquiry**
   - Check OpenCode GitHub issues/discussions for panel requests
   - Review plugin SDK changelog for TUI features
   - Consider asking in OpenCode community (if needed)

---

## Decision Matrix

| Finding | Action | Impact on Phase 1 |
|---------|--------|-------------------|
| **Panels supported** | Add SDK-06/07/08 requirements for embedded dashboard | High — adds TUI panel work to Phase 1 |
| **Panels NOT supported** | Document as v2 requirement (SDK-06+) | Low — proceed with original Phase 1 scope |
| **Partial support** | Document limitations, decide on hybrid approach | Medium — may add constraints |

---

## Deliverables

1. **Research Report** (1-2 paragraphs):
   - What SDK APIs exist
   - Whether panels are supported
   - Technical constraints identified

2. **Recommendation**:
   - YES → proceed with embedded dashboard
   - NO → defer to v2, keep standalone TUI
   - PARTIAL → define constraints and hybrid approach

3. **Updated Planning Documents**:
   - Add new requirements if YES
   - Document as v2 if NO

---

## Dependencies

- Access to `@opencode-ai/plugin` source or documentation
- OpenCode SDK reference (if public)
- Time: ~2-4 hours

---

## Assigned

**TBD** — assign during Phase 1 planning

---

*Research task created: 2026-02-12*
