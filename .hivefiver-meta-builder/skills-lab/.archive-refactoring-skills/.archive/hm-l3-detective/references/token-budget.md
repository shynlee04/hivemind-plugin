# Token Budget

Cost tables, estimation formulas, and escalation rules for context-efficient investigation.

---

## Token Estimation Formulas

### Basic Conversion

```
chars ≈ tokens × 4
tokens ≈ chars ÷ 4
lines ≈ tokens × 4 ÷ 80  (assuming 80 chars/line average)
```

### Reading Mode Costs

| Mode | Approximate Cost | Example |
|------|-----------------|---------|
| SKIM (glob/ls) | ~50-200 tokens | Directory listing, file counts |
| SKIM (grep -c) | ~100-300 tokens | Match counts across files |
| SKIM (frontmatter) | ~200-500 tokens | YAML block of a planning doc |
| SCAN (grep -n) | ~200-500 tokens | Line numbers for a pattern |
| SCAN (offset read ±20) | ~400-800 tokens | 40 lines of context |
| SCAN (TOC extraction) | ~100-300 tokens | Heading structure of a doc |
| DEEP (full file <200 lines) | ~800-2000 tokens | Small utility file |
| DEEP (full file 200-500 lines) | ~2000-5000 tokens | Core module |
| DEEP (full file >500 lines) | ~5000+ tokens | Large orchestrator |
| Repomix (compressed) | ~30% of raw | Entire codebase summary |

### Budget Calculation

```
Available tokens = Context window - System prompt - Conversation history
Usable chars = Available tokens × 4
Research budget = Usable chars × 0.6  (reserve 40% for output and synthesis)
```

### Concrete Budget Examples

| Context Window | After System/History | Research Budget | Equivalent Reads |
|---------------|---------------------|-----------------|-----------------|
| 200,000 tokens | 150,000 available | 360,000 chars (~90K tokens) | ~45 SCAN reads or 18 DEEP reads (500 LOC) |
| 128,000 tokens | 80,000 available | 192,000 chars (~48K tokens) | ~24 SCAN reads or 10 DEEP reads (500 LOC) |
| 32,000 tokens | 20,000 available | 48,000 chars (~12K tokens) | ~6 SCAN reads or 2 DEEP reads (500 LOC) |

---

## Budget Allocation per Investigation Phase

| Phase | Budget % | Purpose |
|-------|---------|---------|
| Orientation (SKIM) | 10% | Map the territory, identify targets |
| Targeted Search (SCAN) | 40% | Locate specific code, read context |
| Deep Understanding (DEEP) | 35% | Full reads of confirmed targets |
| Documentation | 15% | Write findings, update registry |

---

## Escalation Rules

### When to Escalate (SKIM → SCAN → DEEP)

| Condition | Action |
|-----------|--------|
| SKIM found 0 matches | Widen search pattern or check different files |
| SKIM found >20 files with matches | Narrow pattern, add file filters |
| SCAN found target but context insufficient | Read ±40 lines instead of ±20 |
| SCAN found target spans multiple sections | Escalate to DEEP for that file |
| DEEP file >500 lines and you need specific sections | Back to SCAN with more precise grep |

### When to STOP (Budget Exhaustion)

| Condition | Action |
|-----------|--------|
| Context > 50% consumed | Stop fetching. Synthesize what you have. |
| Context > 70% consumed | CRITICAL. Write findings immediately. Document gaps. |
| 3rd search returns no new information | STOP. You've hit diminishing returns. |
| Single DEEP read would exceed remaining budget | Use SCAN with tighter offsets instead |

---

## Cost-Saving Checklist

Before every read operation, run this checklist:

- [ ] Have I grepped first to confirm the file contains my target?
- [ ] Can I use offset reading instead of full file read?
- [ ] Is there a compressed repomix pack I can grep instead?
- [ ] Am I reading frontmatter-only for planning docs?
- [ ] Have I checked .tech-registry.json before re-discovering?
- [ ] Is this the cheapest mode that answers my question?

### Case Study: Budget Blow Prevention

**Scenario**: Agent needs to understand error handling across a 50-file codebase.

**Wrong approach**: Read all 50 files. Estimated cost: 50 × 300 lines × 80 chars ÷ 4 = 300,000 tokens. On a 128K context window, this blows the budget immediately.

**Right approach**:
1. SKIM: `grep -rn "catch\|throw\|Error" src/ --include="*.ts" | wc -l` → 87 matches
2. SKIM: `grep -rn "catch\|throw\|Error" src/ --include="*.ts" | cut -d: -f1 | sort -u` → 12 unique files
3. SCAN: For each of 12 files, grep -n to find line numbers, then offset read ±20
4. DEEP: Only the 3 files with the most error handling logic (confirmed by match counts)

**Cost**: ~12 SCAN reads (12 × 600 tokens) + 3 DEEP reads (3 × 3000 tokens) = ~16,200 tokens. **95% savings**.

---

## Repomix Token Optimization

When using repomix for codebase analysis:

| Setting | Value | Reason |
|---------|-------|--------|
| compress | true | 70% token reduction |
| includePatterns | `**/*.ts` (or relevant) | Exclude noise files |
| ignorePatterns | `test/**,*.spec.ts,node_modules/**` | Skip test/vendor code |
| style | xml | Structured output for grep |

### Repomix Workflow

```
1. repomix_pack_codebase(compress=true, includePatterns="**/*.ts")
2. repomix_grep_repomix_output(outputId, pattern="yourPattern")
3. repomix_read_repomix_output(outputId, startLine=N, endLine=N+50)
```

Never read the full repomix output. Always grep first, then read targeted sections.
