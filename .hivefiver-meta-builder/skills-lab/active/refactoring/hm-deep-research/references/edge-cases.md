# Edge Cases

Real-life edge cases encountered during research, and how to handle them. Each case follows: Situation → Detection → Resolution → Prevention.

---

## Edge Case 1: Contradictory Sources

### Situation

Two authoritative sources disagree. React docs say one thing, a popular tutorial says another. A GitHub issue confirms the tutorial behavior. Which do you trust?

### Detection

- Two sources make opposing claims about the same feature
- StackOverflow answers conflict with official documentation
- A library's README contradicts its API documentation

### Resolution

```
1. Check dates: which source is newer?
   - Newer source wins IF the topic is time-sensitive (APIs, versions, features)
   - Older source wins IF the topic is fundamental (algorithms, design patterns)

2. Check authority:
   - Official docs > community posts > random blog
   - Source code > all documentation
   - Recent GitHub issues > old StackOverflow answers

3. Verify directly:
   - Write a minimal test case
   - Check the source code (grep the implementation)
   - If both sources are wrong, trust the code

4. Document the contradiction:
   - Note both sources with dates
   - State which you trusted and why
   - Flag as "contradicted" in findings
```

### Prevention

Always check source dates. Always prefer source code over documentation when they conflict. Always note contradictions in findings — never silently resolve them.

---

## Edge Case 2: Outdated or Deprecated Information

### Situation

The top search results point to a blog post from 2023 about a library that had a major version release in 2025. The post's examples no longer work.

### Detection

- Blog post or article is > 12 months old
- API examples reference functions that don't exist in current version
- GitHub repository shows major version bump since article was written
- Search results return old domain content (e.g., pre-migration URLs)

### Resolution

```
1. Check the library's release history:
   - GitHub releases page or npm version history
   - Identify when breaking changes occurred

2. Search with freshness filters:
   - tavily-search with time_range: "month" or "year"
   - brave-search with freshness: "pm" or "py"
   - Restrict to recent results

3. Find the migration guide:
   - Most major libraries publish migration guides
   - Search: "[library] migration guide [old version] to [new version]"

4. If no recent documentation exists:
   - Read the source code directly (DeepWiki, repomix)
   - Check the changelog (CHANGELOG.md or GitHub releases)
   - Build a minimal prototype to validate assumptions
```

### Prevention

Set freshness filters by default when researching active technologies. Check publication dates before trusting any non-official source. When citing a source, always note the date.

---

## Edge Case 3: Technology Too New for Established Patterns

### Situation

A library is < 6 months old with < 500 GitHub stars. No tutorials, no best practices guides, no StackOverflow answers. Only the README and source code exist.

### Detection

- GitHub stars < 500
- No tagged releases or only 0.x versions
- npm weekly downloads < 1000
- Search returns only the repo itself and maybe 1-2 mentions

### Resolution

```
1. Read the source code:
   - DeepWiki for architecture understanding
   - repomix pack for detailed analysis
   - Focus on: types, exports, error handling, test files

2. Analyze the tests:
   - Tests are the most reliable documentation for new libraries
   - grep for test files, read test cases
   - Tests show intended usage patterns

3. Build a spike:
   - Create a minimal prototype (30-60 min)
   - Focus on: your specific use case, error behavior, edge cases
   - Document what works and what doesn't

4. Assess risk:
   - Maintenance: is the author responsive to issues?
   - Community: are there any open PRs from contributors?
   - Scope: does it do one thing well, or is it ambitious but incomplete?
   - Alternatives: could you build the same thing in-house faster?

5. Make a risk-aware recommendation:
   - If low risk (easily replaceable) → proceed with caution
   - If high risk (deep integration) → recommend established alternative or in-house
```

### Prevention

For new technologies, always prototype before committing. Never recommend a new library for critical infrastructure without a spike. Document the risk level in findings.

---

## Edge Case 4: Vendor Documentation Is Wrong

### Situation

The official documentation says a function accepts an object, but the actual TypeScript types show it accepts a different shape. Calling it as documented causes a runtime error.

### Detection

- Code examples from docs don't compile or don't run
- TypeScript types don't match documented signatures
- GitHub issues confirm the docs are wrong
- Runtime behavior contradicts documented behavior

### Resolution

```
1. Trust the code, not the docs:
   - Read the source code (the source of truth)
   - Check TypeScript type definitions (.d.ts files)
   - Run the code and observe actual behavior

2. Check if there's an open issue:
   - Search GitHub issues for "docs" or "documentation"
   - If an issue exists, note the issue number in findings

3. File a correction:
   - Note the discrepancy in your findings
   - If it's a public project, file a docs issue or PR

4. Document what actually works:
   - Write the correct usage based on source code
   - Cite the source code (file:line), not the docs
   - Flag the documentation as "incorrect as of [date]"
```

### Prevention

When official docs and source code disagree, always cite the source code. Mark documentation-derived findings as "per docs, unverified" until confirmed against code.

---

## Edge Case 5: Multiple Valid Approaches, No Clear Winner

### Situation

Three different state management approaches all work for your use case. Each has tradeoffs. No approach is clearly better. Community is split.

### Detection

- Comparison articles end with "it depends"
- Multiple approaches score equally on your evaluation criteria
- Community discussions show strong advocates for each option
- Your requirements don't clearly eliminate any option

### Resolution

```
1. Define your constraints FIRST (before looking at options):
   - Team experience: what does the team already know?
   - Project constraints: bundle size, SSR requirements, testing needs
   - Timeline: how much time for migration/learning?
   - Risk tolerance: how reversible is this choice?

2. Score each option against YOUR constraints:
   | Constraint | Option A | Option B | Option C |
   |-----------|----------|----------|----------|
   | Team knows it | Yes | No | Partial |
   | Fits timeline | Yes | Yes | No |
   | Reversible | Yes | No | Yes |

3. If still tied after constraint scoring:
   - Pick the simplest option (fewest concepts, smallest API surface)
   - Simplicity is a feature, not a compromise
   - Document why you chose it and what would trigger a re-evaluation

4. Never say "they're all equal":
   - They might be equal for OTHER teams, not yours
   - Your constraints break the tie
   - If constraints don't break the tie, you haven't defined them well enough
```

### Prevention

Always define constraints before evaluating options. Never evaluate options in a vacuum. The "best" option is the one that fits your constraints, not the one with the most features.

---

## Edge Case 6: Research Scope Creep

### Situation

You started researching ORM options. Now you're also looking at database engines, migration tools, connection pooling, and deployment strategies. The research question keeps expanding.

### Detection

- Your findings document has 8+ sections when you planned 3
- You've spent > 2x your estimated time budget
- You keep finding "just one more thing" to investigate
- The original question feels distant from current findings

### Resolution

```
1. Stop. Write the original question in one sentence.
2. Check: does this new finding directly answer the original question?
   - If YES → include it
   - If NO → note it as a separate research topic, don't pursue now
3. Create a scope boundary:
   - IN SCOPE: [list the 3-5 specific things you're investigating]
   - OUT OF SCOPE: [list everything you've discovered but aren't pursuing]
   - DEFERRED: [list things that need their own research session]
4. Return to the original question with your scope enforced.
```

### Prevention

Write the research question as a one-sentence scope before starting. Review it every 30 minutes. If the scope expanded, force it back to the original question. Create a "deferred" list for interesting but off-topic findings.

---

## Edge Case Quick Reference

| Edge Case | First Response | Escalation |
|-----------|---------------|------------|
| Contradictory sources | Check dates, trust source code | Document both, flag contradiction |
| Outdated information | Freshness filter, check releases | Read source code directly |
| Too new for patterns | Read tests, build a spike | Risk assessment, consider alternatives |
| Vendor docs wrong | Trust source code over docs | File issue, document actual behavior |
| No clear winner | Define constraints first | Simplicity as tiebreaker |
| Scope creep | Write one-sentence scope | Create deferred list, enforce boundary |
