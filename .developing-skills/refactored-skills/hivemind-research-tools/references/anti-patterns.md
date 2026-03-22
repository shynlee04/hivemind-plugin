# Anti-Patterns — Dumb Tool Uses to Prevent

25+ cataloged anti-patterns with WHY each is harmful and what to do instead.

## Category 1: Source Ordering Failures

### AP-01: Using Web Search Before Checking Code
**Pattern**: Calling Tavily/Exa when Repomix could answer from actual codebase.
**Why**: Web results may describe outdated behavior. Code IS the truth — if it's in the repo, that's the authoritative answer.
**Fix**: Always run Repomix first. Web search is for corroboration, not primary truth.

### AP-02: Using Docs Before Checking Code
**Pattern**: Calling Context7 when the codebase already contains the answer.
**Why**: Docs describe intent; code describes reality. If they diverge, code wins.
**Fix**: Repomix → Context7 order. Use docs to explain WHY code does what it does.

### AP-03: Skipping Repository Analysis Entirely
**Pattern**: Relying only on web search for codebase-specific questions.
**Why**: No web source knows YOUR codebase. External sources guess; internal analysis knows.
**Fix**: For any question involving "in this project," start with Repomix.

### AP-04: Treating Blog Posts as Primary Sources
**Pattern**: Using a blog post as the main evidence for a technical claim.
**Why**: Blogs are opinion, may be outdated, and aren't verified by maintainers.
**Fix**: Blogs are for corroboration. Primary sources: official docs > maintained repo > RFC.

## Category 2: Corroboration Failures

### AP-05: Single-Source Conclusions
**Pattern**: Drawing conclusions from exactly one source without verification.
**Why**: One source could be wrong, outdated, or context-specific.
**Fix**: Require 2+ independent sources for any full-confidence finding.

### AP-06: Same-Provider Corroboration
**Pattern**: Getting two results from the same provider and calling it "corroborated."
**Why**: Same provider = same data source = no independent verification.
**Fix**: Corroboration requires different providers or different source URLs.

### AP-07: Ignoring Contradictions
**Pattern**: Finding conflicting evidence and proceeding without resolution.
**Why**: Unresolved contradictions mean the finding is unreliable.
**Fix**: Follow contradiction resolution protocol. 3 attempts, then caveat block.

### AP-08: Corroboration Without Quality Check
**Pattern**: Counting sources without checking if they're actually reliable.
**Why**: 5 low-quality sources < 1 high-quality source.
**Fix**: Grade each source on Authority/Recency/Corroboration/Relevance before counting.

## Category 3: Execution Failures

### AP-09: No Retry on Failure
**Pattern**: Provider returns error, agent gives up immediately.
**Why**: Transient failures are common (network, rate limits). First failure ≠ permanent failure.
**Fix**: 3 retries with increasing delays (3s, 5s, 10s).

### AP-10: Infinite Retry Loop
**Pattern**: Retrying a failed provider endlessly.
**Why**: Wastes time and tokens. If it failed 3 times, it'll likely fail again.
**Fix**: 3 retries max, then fallback provider.

### AP-11: No Fallback Strategy
**Pattern**: Research stalls when primary provider fails.
**Why**: One provider's failure shouldn't kill the entire research session.
**Fix**: Define fallback hierarchy. Context7 → DeepWiki → Tavily for docs.

### AP-12: Skipping Readiness Check
**Pattern**: Calling providers without verifying they're configured.
**Why**: Silent failures produce empty results without error messages.
**Fix**: Run `check-mcp-readiness.mjs` before research starts.

### AP-13: Chaining Without Grading Intermediate Results
**Pattern**: Passing raw tool output to next chain step without quality assessment.
**Why**: Bad input propagates — garbage in, garbage out through the entire chain.
**Fix**: Grade evidence at each chain step before passing to next.

## Category 4: Question Framing Failures

### AP-14: Answering the Wrong Question
**Pattern**: Researching what was easy to find instead of what was asked.
**Why**: Misaligned research output. User gets an answer to a question they didn't ask.
**Fix**: Frame sub-questions explicitly. Verify each maps to the original request.

### AP-15: Too-Broad Questions
**Pattern**: Asking "How does React work?" as a single research question.
**Why**: Too broad for any provider to answer meaningfully. Returns surface-level info.
**Fix**: Decompose into 3-5 specific sub-questions.

### AP-16: Too-Narrow Questions
**Pattern**: Asking about one function in isolation without context.
**Why**: Misses how it fits into the system. Answer is technically correct but useless.
**Fix**: Include surrounding context in sub-questions.

### AP-17: Assumption-Loaded Questions
**Pattern**: "Why is X better than Y?" assumes X is better.
**Why**: Biases research toward confirming the assumption.
**Fix**: Reframe as "What are the trade-offs between X and Y for use case Z?"

## Category 5: Output Failures

### AP-18: No Confidence Score
**Pattern**: Presenting findings without indicating how confident the agent is.
**Why**: User can't distinguish strong evidence from weak speculation.
**Fix**: Every finding must have full/partial/low confidence.

### AP-19: No Source Citations
**Pattern**: Presenting findings without saying where the info came from.
**Why**: Unverifiable. User can't check or update the finding later.
**Fix**: Every claim needs provider + URL/identifier.

### AP-20: Presenting Stale Data as Current
**Pattern**: Finding old info and not flagging its age.
**Why**: API behavior may have changed. User makes decisions on outdated info.
**Fix**: Check publication dates. Flag anything >18 months old.

### AP-21: Mixing Evidence Grades
**Pattern**: Treating a forum answer with the same weight as official docs.
**Why**: Inflates weak evidence. User trusts findings they shouldn't.
**Fix**: Grade on Authority dimension. H vs L evidence gets different treatment.

## Category 6: Delegation Failures

### AP-22: Parallel When Sequential Needed
**Pattern**: Spawning parallel agents for dependent sub-questions.
**Why**: Later agents can't use earlier agents' findings. Wasted work.
**Fix**: Apply independence proof test before choosing delegation pattern.

### AP-23: Sequential When Parallel Possible
**Pattern**: Running independent sub-questions one at a time.
**Why**: Unnecessary latency. Could finish in parallel in same time.
**Fix**: Check independence. If no shared entities, go parallel.

### AP-24: No Iteration Budget
**Pattern**: Letting iterative research run without a round limit.
**Why**: Infinite loops. Research never completes.
**Fix**: Max 3 rounds. Each round must narrow scope or increase confidence.

### AP-25: Spawning Agents Without Context
**Pattern**: Sub-agent starts research with no prior findings.
**Why**: Duplicates work. May contradict prior findings without knowing.
**Fix**: Always pass delegation packet with prior findings.

## Category 7: Tool-Specific Failures

### AP-26: Repomix Without Include Patterns
**Pattern**: Packing entire repo when only `src/` is relevant.
**Why**: Wastes tokens on test files, configs, node_modules.
**Fix**: Use `includePatterns` to scope analysis.

### AP-27: Context7 Without Library Resolution
**Pattern**: Searching docs with a vague name instead of resolving the exact library ID.
**Why**: May return docs for wrong library or nothing at all.
**Fix**: Always call `resolve-library-id` first.

### AP-28: Tavily Basic When Advanced Needed
**Pattern**: Using `searchDepth: "basic"` for deep research questions.
**Why**: Gets snippets, not full content. Misses nuance.
**Fix**: Use `advanced` for anything beyond quick fact-check.

### AP-29: Exa General Search for Code Questions
**Pattern**: Using `exa_web_search_exa` for programming questions instead of `exa_get_code_context_exa`.
**Why**: General search doesn't understand code context.
**Fix**: Use code-specific search for any programming question.

### AP-30: Sequential Thinking for Simple Questions
**Pattern**: Using multi-step reasoning for yes/no questions.
**Why**: Overhead without benefit. Simple questions need simple lookups.
**Fix**: Reserve Sequential Thinking for complex "why" and "what if" questions.
