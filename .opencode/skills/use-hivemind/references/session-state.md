# Session State

How to track and manage conversation continuity — what persists, what to re-derive, when to abandon.

---

## States & Detection

| State | Entry Trigger | Key Signal |
|-------|---------------|------------|
| **Fresh** | First message | No continuity file |
| **Active** | Delegation dispatched | Continuity file + tool output visible |
| **Post-compaction** | Compaction event | Message seems disconnected, carry-forward exists |
| **Post-disconnect** | Session resumed | Gap in conversation, user says "continue" |
| **Recovery** | Distrust ≥ DEGRADED | Prior claims don't match code |

---

## Carry-Forward (≤5 items)

| Item | Purpose |
|------|---------|
| Key findings (1-3 sentences) | What was discovered |
| Active blockers (0-3) | What prevents progress |
| Next action (1 sentence) | What happens next |
| Output paths (0-5) | Where evidence lives |
| Open decisions (0-3) | Unresolved choices |

**Does NOT persist:** file contents, investigation depth, sub-agent state, conversation nuance. Re-derive from carry-forward or re-read/re-run.

---

## Compaction Recovery

**Re-derive:** file state, build status, test status, git status.
**Trust:** carry-forward summary, output paths on disk, open decisions, distrust level.

Procedure: `read continuity → verify paths exist → re-read targets → re-assess distrust → resume from "next action"`

---

## Disconnect Recovery

**Default posture: SUSPECT.** Verify before trusting.

| Check | Pass If |
|-------|---------|
| Files exist | All referenced paths resolve |
| Code matches carry-forward | Key file content aligns |
| Build passes | Zero errors |
| Tests pass | All green |
| Git clean | No unexpected changes |

| Results | Action |
|---------|--------|
| All pass | Resume from next action |
| 1-2 fail | Fix, then resume |
| 3+ fail | **Start fresh.** Inform user. |

---

## Abandon Prior Context When

- User contradicts prior decision
- POISONED distrust level
- Carry-forward missing or corrupted
- 3+ verification checks fail
- User's message is clearly a new topic

**Do NOT abandon for:** one failed check (fix + continue), tangential questions (answer inline + return), compaction (use carry-forward), minor context loss (re-derive).

---

## Continuity File

```json
{
  "timestamp": "ISO-8601",
  "session_state": "Fresh|Active|Post-compaction|Post-disconnect|Recovery",
  "carry_forward": { "key_findings":[], "active_blockers":[], "next_action":"", "output_paths":[], "open_decisions":[] },
  "distrust_level": "CLEAN|SUSPECT|DEGRADED|POLLUTED|POISONED"
}
```

- Update: every turn boundary, after routing, after delegation returns, after compaction, after redirect
- Location: project-local state dir (not version-controlled)
- Size: **≤ 500 chars** for carry-forward — compress, don't store context
