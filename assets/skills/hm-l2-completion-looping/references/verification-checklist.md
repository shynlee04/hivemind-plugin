# Verification Checklist

## Output Gate

- [ ] All expected artifacts exist on disk
- [ ] Artifact paths match task envelope
- [ ] No missing files from the expected set

## Quality Gate

- [ ] Code artifacts pass syntax check (if applicable)
- [ ] Markdown artifacts have valid frontmatter
- [ ] JSON artifacts are valid JSON
- [ ] No stub content (<10 LOC without explanation)

## Scope Gate

- [ ] Output matches task envelope exactly
- [ ] Nothing extra was added
- [ ] Nothing from the scope is missing

## Loop Decision

| Result | Action |
|--------|--------|
| All gates pass | Accept DONE |
| Output gate fails | Re-dispatch with corrected scope |
| Quality gate fails | Return DONE_WITH_CONCERNS, fix then re-verify |
| Scope gate fails | Re-dispatch with spec-compliance emphasis |
