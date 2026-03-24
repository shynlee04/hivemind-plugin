# Plan #4 Code-Skeptic Review — 2026-03-24

## Files Reviewed
| # | File | Lines | Issues Found |
|---|------|-------|--------------|
| 1 | src/features/event-tracker/parser/types.ts | 55 | 0 |
| 2 | src/features/event-tracker/parser/header-parser.ts | 41 | 2 |
| 3 | src/features/event-tracker/parser/splitter.ts | 17 | 0 |
| 4 | src/features/event-tracker/parser/meta-parser.ts | 50 | 2 |
| 5 | src/features/event-tracker/parser/delegation-extractor.ts | 33 | 2 |
| 6 | src/features/event-tracker/parser/counter.ts | 31 | 0 |
| 7 | src/features/event-tracker/parser/turn-parser.ts | 73 | 3 |

## Findings

### Critical

**None**

### High

1. **delegation-extractor.ts:20 — JSON.parse without validation**
   - Line 20: `const parsed = JSON.parse(jsonStr)` parses raw JSON with no schema validation
   - `ParsedDelegation` fields (`agent`, `description`, `subagent_type`, `packet_id`) are accessed directly without existence checks
   - If JSON structure differs, fields will be `undefined` (not `''` or `null`)
   - **Risk**: Silently produces corrupt `ParsedDelegation` records with empty strings where values expected

2. **turn-parser.ts:27 — Fragile user message extraction**
   - Line 27: `/##\s+User\s*\n([\s\S]*?)(?=\n---|\n##\s+Assistant)/`
   - If `## User` is followed by `---` without an `## Assistant` after (or vice versa), regex fails silently
   - Returns empty `userMessage` instead of actual content
   - **Risk**: Real sessions with unusual turn structure produce empty userMessage

3. **turn-parser.ts:31 — Assistant header extraction ignores malformed headers**
   - Line 31: `/##\s+Assistant\s*\([^)]+\)/`
   - The `[^)]+` requires at least one character inside parentheses
   - If header is `## Assistant` with no parentheses (rare but possible), `assistantHeader` becomes `''`
   - Downstream `parseAssistantMeta('')` returns `{ agentName: '', model: '', duration: null }`
   - **Risk**: Metadata silently defaults to empty; no parsing error is surfaced

### Medium

1. **header-parser.ts:17 — Title extraction uses loose regex**
   - Line 17: `/^#\s+(.+)$/m`
   - `m` flag allows `^`/`$` per line, but `(.+)` is greedy — will capture entire heading including inline markdown
   - If title is `# **Session: foo**`, captures `**Session: foo**` with the markdown
   - **Risk**: Titles may contain residual markdown formatting

2. **header-parser.ts:23-37 — Field extraction has no anchoring**
   - Lines 23, 29, 35: `/\*\*FieldName:\*\*\s*(.+)/` — unanchored, matches first occurrence anywhere in markdown
   - If multiple `**Session ID:**` appear (e.g., in delegation packet references), first one wins
   - **Risk**: Duplicate field markers cause incorrect values

3. **meta-parser.ts:21 — Duration parser assumes specific format**
   - Line 21: `parts[1] ?? ''` and `parts[2] ?? ''` assume exactly 3 `·`-separated parts
   - If actual format is `AgentName · model` (no duration), `parts[1]` is `undefined`, not `''`
   - Wait — line 22 uses `??` correctly, but line 23 `parts[1] ?? ''` is wrong: duration is at `parts[2]`
   - **Bug**: `const model = parts[1] ?? ''` is correct for 2 parts, but `durationStr = parts[2] ?? ''` will be `undefined` if only 2 parts exist (Agent · model)
   - Actually re-reading: if format is `Agent · model · 500ms`, parts = [Agent, model, 500ms]. If format is `Agent · model`, parts = [Agent, model]. So `parts[2]` would be `undefined` in 2-part case.
   - **Risk**: 2-part assistant headers produce null duration correctly, but this is implicit not explicit

4. **meta-parser.ts:38 — parseDuration has floating point precision issue**
   - Line 40: `Math.round(parseFloat(secMatch[1]) * 1000)`
   - `22.5s * 1000 = 22500.000000000003` in JS floating point
   - `Math.round` mitigates this, but the intent is likely integer ms
   - **Risk**: Low — Math.round handles it, but unusual durations like `0.1s` may accumulate rounding

5. **turn-parser.ts:35 — Content extraction greedy match**
   - Line 35: `/##\s+Assistant\s*\([^)]+\)\s*\n([\s\S]*)/`
   - `[\s\S]*` is greedy and captures everything to end of block
   - If multiple `## Assistant` blocks exist in a turn (shouldn't happen but possible in malformed input), captures too much
   - **Risk**: Malformed input produces oversized assistantContent

### Low

1. **delegation-extractor.ts:27-29 — Silent error swallowing**
   - Line 27-29: `catch { /* Skip malformed JSON — don't throw */ }`
   - No logging, no count of skipped blocks
   - **Risk**: Debugging production issues with missing delegations will be difficult

2. **turn-parser.ts:43 — Thinking extraction regex is brittle**
   - Line 43: `/_Thinking:_\s*\n([\s\S]*?)(?=\n\*\*Tool:|\n---|$)/`
   - Requires exact `_Thinking:` format (with underscores)
   - If format varies (e.g., `**Thinking:**` or `Thinking:`), no thinking extracted
   - **Risk**: Real sessions using different thinking annotation produce null thinking

## Assumption Risks

| Location | Assumption | Reality Risk |
|----------|------------|--------------|
| header-parser.ts:23-37 | `**FieldName:**` format for all headers | If session markdown uses different formatting (e.g., `Session ID:` without bold), fields silently default to 'N/A' |
| splitter.ts:11 | Turns split at `## User` boundaries | If `## User` appears in code blocks within user messages, turn boundaries misaligned |
| meta-parser.ts:16 | `## Assistant (Agent · model · duration)` format | If format is `## Assistant` without parentheses, or different separator, parsing fails silently |
| turn-parser.ts:27 | User message ends at `---` or `## Assistant` | If user message contains `---` as separator within content, extraction truncates |
| delegation-extractor.ts:14 | JSON inside ` ```json ` code blocks | If JSON uses ` ``` ` (no 'json' identifier) or uses different block markers, no delegations extracted |
| turn-parser.ts:43 | Thinking annotated as `_Thinking:` | Any other thinking annotation format is silently ignored |

## Edge Cases Not Covered

1. **Empty markdown input** — `splitTurns('')` returns `[]`, `parseSessionHeader('')` returns empty header. **Covered** (line 14 header-parser, line 8 splitter)

2. **Turn with no assistant block** — If a turn has `## User` but no `## Assistant`, `assistantContent` is `''`, `agentName`/`model`/`duration` are `''`/`''`/null. **Not explicitly handled** — falls through to defaults.

3. **Turn with no user message** — If `## User` is immediately followed by `---`, `userMessage` is `''`. Line 17 counter skips empty/whitespace-only. **Covered**.

4. **Multiple `## User` in same turn** — `splitTurns` would create separate turns from each. **Not an error**, but may produce unusual turn counts.

5. **Delegation JSON with extra fields** — `JSON.parse` succeeds, extra fields ignored. **Safe**.

6. **Delegation JSON missing required fields** — `parsed.agent ?? ''` produces empty string. **Silent corruption**.

7. **Very long assistant content** — `[\s\S]*` is unbounded. **Potential memory issue** with extremely large sessions.

8. **Unicode in session content** — No explicit handling. **Likely fine** since JS strings are UTF-16, but not validated.

## Verdict

**CONDITIONAL**

## Required Changes

1. **delegation-extractor.ts:20-26 — Add schema validation**
   ```typescript
   // Instead of direct field access, validate:
   if (typeof parsed.agent === 'string' && parsed.description !== undefined) {
     results.push({...})
   }
   ```
   Or use Zod schema validation to ensure `ParsedDelegation` contract is met.

2. **turn-parser.ts:27 — Make user message regex more robust**
   - Add defensive check: if `userMatch` but content is suspiciously short or empty, log warning or surface as `null` instead of `''`.

3. **turn-parser.ts:31 — Guard against missing parentheses**
   - Add validation: if `assistantMatch` is null but `## Assistant` text exists, attempt alternative extraction or set a flag.

4. **header-parser.ts — Consider escaping special regex characters in field values**
   - If any field value contains `.` or `*`, the regex match could behave unexpectedly. Not currently handled.

5. **delegation-extractor.ts:27-29 — Add logging for skipped blocks**
   ```typescript
   } catch (e) {
     // Consider: client.app.log('warn', 'Skipped malformed delegation JSON')
   }
   ```

6. **turn-parser.ts:43 — Add fallback for thinking formats**
   - Check for alternative thinking markers: `**Thinking:**`, `Thinking:`, `### Thinking`
