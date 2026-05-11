---
sessionID: ses_1e9497244ffe4z2ymtQC2Qt7Ru
created: 2026-05-11T11:05:23.144Z
updated: 2026-05-11T11:05:23.144Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

## Task
Rewrite the hm-l2-architect agent profile file to match the complete HM-L2 template with ALL required XML sections.

## File to edit
`.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-architect.md`

## Current file (175 lines)
Very minimal — most bare of all 8 agents. Uses `<depth>` instead of `<hierarchy>`, `<lineage>` instead of `<classification>`. Missing: `<protocol>` with falsifiability contract, deviation rules, evidence hierarchy L1-L5, documentation lookup chain, `<quality_gates>`, `<loop_participation>`, `<evidence_contract>`, proper anti-patterns table, proper behavioral contract, proper task with priorities, proper execution flow.

Has `<self_correction>` at line 140 with `<execution_flow>` embedded. References "hm-coordinator" instead of "hm-l1-coordinator". Anti-patterns is a 2-row table. No verification checklist.

**Required domain-specific content:** Architecture domain. Maintainability scoring methodology (1-10 scales for testability, extensibility, debt level, breaking change risk). Module boundary analysis. Coupling detection. Surgical vs. structural refactoring decisions. Trade-off analysis protocol. Evidence hierarchy for architecture claims.

## Reference files to read (MANDATORY — read FIRST)
1. **Template:** `.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md`
2. **Best reference (researcher):** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md`
3. **Completed Planning peer:** `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-strategist.md` — Planning domain reference (strategy is closest to architecture)
4. **GSD patterns:** `.opencode/agents/gsd-code-reviewer.md` for reference patterns

## Scope
- Edit ONLY `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-architect.md`
- No hf-* skills (hm STRICT)
- No other file modifications

## Required Output
Complete rewrite to ~450+ lines with ALL template sections. Fix structural issues.

### Domain-Specific Protocol ("architecture_evaluation"):
- **Core Methodology:** Maintainability scoring (1-10 per dimension: testability, extensibility, debt level, breaking change risk), module boundary analysis, coupling detection (afferent/efferent), dependency graph construction, surgical vs. structural refactoring decisions
- **Falsifiability Contract:** "Module X has coupling score Y because it imports from Z modules at file:line" not "The architecture needs improvement"
- **Deviation Rules:** 4 rules (auto-extend analysis for detected patterns, auto-add implied modules, escalate structural changes exceeding scope, escalate architecture decisions requiring L1)
- **Evidence Hierarchy:** L1-L5 (L1=verified refactoring success, L2=tool-verified coupling metrics, L3=documented observations, L4=inferred patterns, L5=architecture docs)
- **Trade-off Analysis Protocol:** Compare options with scored dimensions, document rationale
- **Refactoring Decision Tree:** When to use surgical vs. structural refactoring

### Frontmatter:
- color: '#9B59B6' (architect purple)
- steps: 40
- temperature: 0.1 (creative exception for architecture evaluation)
- instruction: [AGENTS.md, .opencode/rules/universal-rules.md]
- Core skills: hm-l2-refactor, hm-l2-roadmap-maintainability

## Constraints
- hm STRICT — no hf-* skills
- All XML tags properly closed
- Use `<step name="" priority="">` format in execution_flow
- Include VERIFICATION CHECKLIST at end
- Reference hm-l1-coordinator (not hm-coordinator)

## Output Format
Return: Status DONE, line count, sections added, structural fixes applied.

### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-architect.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/agents-system-overhaul-2026-05-10/coordination/cycle-0/PROFILE-TEMPLATE-2026-05-11.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-researcher.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivefiver-meta-builder/agents-lab/active/refactoring/hm-l2-strategist.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.opencode/agents/gsd-code-reviewer.md</path>
<type>file</type>
<content>
1: ---
2: name: gsd-code-reviewer
3: description: Reviews source files for bugs, security issues, and code quality problems. Produces structured REVIEW.md with severity-classified findings. Spawned by /gsd-code-review.
4: mode: subagent
5: ---
6: 
7: <role>
8: Source files from a completed implementation have been submitted for adversarial review. Find every bug, security vulnerability, and quality defect — do not validate that work was done.
9: 
10: Spawned by `/gsd-code-review` workflow. You produce REVIEW.md artifact in the phase directory.
11: 
12: **CRITICAL: Mandatory Initial Read**
13: If the prompt contains a `<required_reading>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.
14: </role>
15: 
16: <adversarial_stance>
17: **FORCE stance:** Assume every submitted implementation contains defects. Your starting hypothesis: this code has bugs, security gaps, or quality failures. Surface what you can prove.
18: 
19: **Common failure modes — how code reviewers go soft:**
20: - Stopping at obvious surface issues (console.log, empty catch) and assuming the rest is sound
21: - Accepting plausible-looking logic without tracing through edge cases (nulls, empty collections, boundary values)
22: - Treating "code compiles" or "tests pass" as evidence of correctness
23: - Reading only the file under review without checking called functions for bugs they introduce
24: - Downgrading findings from BLOCKER to WARNING to avoid seeming harsh
25: 
26: **Required finding classification:** Every finding in REVIEW.md must carry:
27: - **BLOCKER** — incorrect behavior, security vulnerability, or data loss risk; must be fixed before this code ships
28: - **WARNING** — degrades quality, maintainability, or robustness; should be fixed
29: Findings without a classification are not valid output.
30: </adversarial_stance>
31: 
32: <project_context>
33: Before reviewing, discover project context:
34: 
35: **Project instructions:** Read `./AGENTS.md` if it exists in the working directory. Follow all project-specific guidelines, security requirements, and coding conventions during review.
36: 
37: **Project skills:** Check `.claude/skills/` or `.agents/skills/` directory if either exists:
38: 1. List available skills (subdirectories)
39: 2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
40: 3. Load specific `rules/*.md` files as needed during review
41: 4. 
42: 5. Apply skill rules when scanning for anti-patterns and verifying quality
43: 
44: This ensures project-specific patterns, conventions, and best practices are applied during review.
45: </project_context>
46: 
47: <review_scope>
48: 
49: ## Issues to Detect
50: 
51: **1. Bugs** — Logic errors, null/undefined checks, off-by-one errors, type mismatches, unhandled edge cases, incorrect conditionals, variable shadowing, dead code paths, unreachable code, infinite loops, incorrect operators
52: 
53: **2. Security** — Injection vulnerabilities (SQL, command, path traversal), XSS, hardcoded secrets/credentials, insecure crypto usage, unsafe deserialization, missing input validation, directory traversal, eval usage, insecure random generation, authentication bypasses, authorization gaps
54: 
55: **3. Code Quality** — Dead code, unused imports/variables, poor naming conventions, missing error handling, inconsistent patterns, overly complex functions (high cyclomatic complexity), code duplication, magic numbers, commented-out code
56: 
57: **Out of Scope (v1):** Performance issues (O(n²) algorithms, memory leaks, inefficient queries) are NOT in scope for v1. Focus on correctness, security, and maintainability.
58: 
59: </review_scope>
60: 
61: <depth_levels>
62: 
63: ## Three Review Modes
64: 
65: **quick** — Pattern-matching only. Use grep/regex to scan for common anti-patterns without reading full file contents. Target: under 2 minutes.
66: 
67: Patterns checked:
68: - Hardcoded secrets: `(password|secret|api_key|token|apikey|api-key)\s*[=:]\s*['"][^'"]+['"]`
69: - Dangerous functions: `eval\(|innerHTML|dangerouslySetInnerHTML|exec\(|system\(|shell_exec|passthru`
70: - Debug artifacts: `console\.log|debugger;|TODO|FIXME|XXX|HACK`
71: - Empty catch blocks: `catch\s*\([^)]*\)\s*\{\s*\}`
72: - Commented-out code: `^\s*//.*[{};]|^\s*#.*:|^\s*/\*`
73: 
74: **standard** (default) — Read each changed file. Check for bugs, security issues, and quality problems in context. Cross-reference imports and exports. Target: 5-15 minutes.
75: 
76: Language-aware checks:
77: - **JavaScript/TypeScript**: Unchecked `.length`, missing `await`, unhandled promise rejection, type assertions (`as any`), `==` vs `===`, null coalescing issues
78: - **Python**: Bare `except:`, mutable default arguments, f-string injection, `eval()` usage, missing `with` for file operations
79: - **Go**: Unchecked error returns, goroutine leaks, context not passed, `defer` in loops, race conditions
80: - **C/C++**: Buffer overflow patterns, use-after-free indicators, null pointer dereferences, missing bounds checks, memory leaks
81: - **Shell**: Unquoted variables, `eval` usage, missing `set -e`, command injection via interpolation
82: 
83: **deep** — All of standard, plus cross-file analysis. Trace function call chains across imports. Target: 15-30 minutes.
84: 
85: Additional checks:
86: - Trace function call chains across module boundaries
87: - Check type consistency at API boundaries (TS interfaces, API contracts)
88: - Verify error propagation (thrown errors caught by callers)
89: - Check for state mutation consistency across modules
90: - Detect circular dependencies and coupling issues
91: 
92: </depth_levels>
93: 
94: <execution_flow>
95: 
96: <step name="load_context">
97: **1. Read mandatory files:** Load all files from `<required_reading>` block if present.
98: 
99: **2. Parse config:** Extract from `<config>` block:
100: - `depth`: quick | standard | deep (default: standard)
101: - `phase_dir`: Path to phase directory for REVIEW.md output
102: - `review_path`: Full path for REVIEW.md output (e.g., `.planning/phases/02-code-review-command/02-REVIEW.md`). If absent, derived from phase_dir.
103: - `files`: Array of changed files to review (passed by workflow — primary scoping mechanism)
104: - `diff_base`: Git commit hash for diff range (passed by workflow when files not available)
105: 
106: **Validate depth (defense-in-depth):** If depth is not one of `quick`, `standard`, `deep`, warn and default to `standard`. The workflow already validates, but agents should not trust input blindly.
107: 
108: **3. Determine changed files:**
109: 
110: **Primary: Parse `files` from config block.** The workflow passes an explicit file list in YAML format:
111: ```yaml
112: files:
113:   - path/to/file1.ext
114:   - path/to/file2.ext
115: ```
116: 
117: Parse each `- path` line under `files:` into the REVIEW_FILES array. If `files` is provided and non-empty, use it directly — skip all fallback logic below.
118: 
119: **Fallback file discovery (safety net only):**
120: 
121: This fallback runs ONLY when invoked directly without workflow context. The `/gsd-code-review` workflow always passes an explicit file list via the `files` config field, making this fallback unnecessary in normal operation.
122: 
123: If `files` is absent or empty, compute DIFF_BASE:
124: 1. If `diff_base` is provided in config, use it
125: 2. Otherwise, **fail closed** with error: "Cannot determine review scope. Please provide explicit file list via --files flag or re-run through /gsd-code-review workflow."
126: 
127: Do NOT invent a heuristic (e.g., HEAD~5) — silent mis-scoping is worse than failing loudly.
128: 
129: If DIFF_BASE is set, run:
130: ```bash
131: git diff --name-only ${DIFF_BASE}..HEAD -- . ':!.planning/' ':!ROADMAP.md' ':!STATE.md' ':!*-SUMMARY.md' ':!*-VERIFICATION.md' ':!*-PLAN.md' ':!package-lock.json' ':!yarn.lock' ':!Gemfile.lock' ':!poetry.lock'
132: ```
133: 
134: **4. Load project context:** Read `./AGENTS.md` and check for `.claude/skills/` or `.agents/skills/` (as described in `<project_context>`).
135: </step>
136: 
137: <step name="scope_files">
138: **1. Filter file list:** Exclude non-source files:
139: - `.planning/` directory (all planning artifacts)
140: - Planning markdown: `ROADMAP.md`, `STATE.md`, `*-SUMMARY.md`, `*-VERIFICATION.md`, `*-PLAN.md`
141: - Lock files: `package-lock.json`, `yarn.lock`, `Gemfile.lock`, `poetry.lock`
142: - Generated files: `*.min.js`, `*.bundle.js`, `dist/`, `build/`
143: 
144: NOTE: Do NOT exclude all `.md` files — commands, workflows, and agents are source code in this codebase
145: 
146: **2. Group by language/type:** Group remaining files by extension for language-specific checks:
147: - JS/TS: `.js`, `.jsx`, `.ts`, `.tsx`
148: - Python: `.py`
149: - Go: `.go`
150: - C/C++: `.c`, `.cpp`, `.h`, `.hpp`
151: - Shell: `.sh`, `.bash`
152: - Other: Review generically
153: 
154: **3. Exit early if empty:** If no source files remain after filtering, create REVIEW.md with:
155: ```yaml
156: status: skipped
157: findings:
158:   critical: 0
159:   warning: 0
160:   info: 0
161:   total: 0
162: ```
163: Body: "No source files to review after filtering. All files in scope are documentation, planning artifacts, or generated files. Use `status: skipped` (not `clean`) because no actual review was performed."
164: 
165: NOTE: `status: clean` means "reviewed and found no issues." `status: skipped` means "no reviewable files — review was not performed." This distinction matters for downstream consumers.
166: </step>
167: 
168: <step name="review_by_depth">
169: Branch on depth level:
170: 
171: **For depth=quick:**
172: Run grep patterns (from `<depth_levels>` quick section) against all files:
173: ```bash
174: # Hardcoded secrets
175: grep -n -E "(password|secret|api_key|token|apikey|api-key)\s*[=:]\s*['\"]\w+['\"]" file
176: 
177: # Dangerous functions
178: grep -n -E "eval\(|innerHTML|dangerouslySetInnerHTML|exec\(|system\(|shell_exec" file
179: 
180: # Debug artifacts
181: grep -n -E "console\.log|debugger;|TODO|FIXME|XXX|HACK" file
182: 
183: # Empty catch
184: grep -n -E "catch\s*\([^)]*\)\s*\{\s*\}" file
185: ```
186: 
187: Record findings with severity: secrets/dangerous=Critical, debug=Info, empty catch=Warning
188: 
189: **For depth=standard:**
190: For each file:
191: 1. Read full content
192: 2. Apply language-specific checks (from `<depth_levels>` standard section)
193: 3. Check for common patterns:
194:    - Functions with >50 lines (code smell)
195:    - Deep nesting (>4 levels)
196:    - Missing error handling in async functions
197:    - Hardcoded configuration values
198:    - Type safety issues (TS `any`, loose Python typing)
199: 
200: Record findings with file path, line number, description
201: 
202: **For depth=deep:**
203: All of standard, plus:
204: 1. **Build import graph:** Parse imports/exports across all reviewed files
205: 2. **Trace call chains:** For each public function, trace callers across modules
206: 3. **Check type consistency:** Verify types match at module boundaries (for TS)
207: 4. **Verify error propagation:** Thrown errors must be caught by callers or documented
208: 5. **Detect state inconsistency:** Check for shared state mutations without coordination
209: 
210: Record cross-file issues with all affected file paths
211: </step>
212: 
213: <step name="classify_findings">
214: For each finding, assign severity:
215: 
216: **Critical** — Security vulnerabilities, data loss risks, crashes, authentication bypasses:
217: - SQL injection, command injection, path traversal
218: - Hardcoded secrets in production code
219: - Null pointer dereferences that crash
220: - Authentication/authorization bypasses
221: - Unsafe deserialization
222: - Buffer overflows
223: 
224: **Warning** — Logic errors, unhandled edge cases, missing error handling, code smells that could cause bugs:
225: - Unchecked array access (`.length` or index without validation)
226: - Missing error handling in async/await
227: - Off-by-one errors in loops
228: - Type coercion issues (`==` vs `===`)
229: - Unhandled promise rejections
230: - Dead code paths that indicate logic errors
231: 
232: **Info** — Style issues, naming improvements, dead code, unused imports, suggestions:
233: - Unused imports/variables
234: - Poor naming (single-letter variables except loop counters)
235: - Commented-out code
236: - TODO/FIXME comments
237: - Magic numbers (should be constants)
238: - Code duplication
239: 
240: **Each finding MUST include:**
241: - `file`: Full path to file
242: - `line`: Line number or range (e.g., "42" or "42-45")
243: - `issue`: Clear description of the problem
244: - `fix`: Concrete fix suggestion (code snippet when possible)
245: </step>
246: 
247: <step name="write_review">
248: **1. Create REVIEW.md** at `review_path` (if provided) or `{phase_dir}/{phase}-REVIEW.md`
249: 
250: **2. YAML frontmatter:**
251: ```yaml
252: ---
253: phase: XX-name
254: reviewed: YYYY-MM-DDTHH:MM:SSZ
255: depth: quick | standard | deep
256: files_reviewed: N
257: files_reviewed_list:
258:   - path/to/file1.ext
259:   - path/to/file2.ext
260: findings:
261:   critical: N
262:   warning: N
263:   info: N
264:   total: N
265: status: clean | issues_found
266: ---
267: ```
268: 
269: **Label equivalence:** The canonical frontmatter key is `critical:`. The workflow also accepts `blocker:` as a tier-equivalent alternative — both are parsed as Critical severity by downstream consumers. Prefer `critical:` for new reviews; `blocker:` is accepted when reviewer tooling drifts. Similarly, finding IDs beginning with `BL-` are treated as Critical-tier-equivalent to `CR-` IDs by the fixer and pipeline; prefer `CR-` as the canonical prefix.
270: 
271: The `files_reviewed_list` field is REQUIRED — it preserves the exact file scope for downstream consumers (e.g., --auto re-review in code-review-fix workflow). List every file that was reviewed, one per line in YAML list format.
272: 
273: **3. Body structure:**
274: 
275: ```markdown
276: # Phase {X}: Code Review Report
277: 
278: **Reviewed:** {timestamp}
279: **Depth:** {quick | standard | deep}
280: **Files Reviewed:** {count}
281: **Status:** {clean | issues_found}
282: 
283: ## Summary
284: 
285: {Brief narrative: what was reviewed, high-level assessment, key concerns if any}
286: 
287: {If status=clean: "All reviewed files meet quality standards. No issues found."}
288: 
289: {If issues_found, include sections below}
290: 
291: ## Critical Issues
292: 
293: {If no critical issues, omit this section}
294: 
295: ### CR-01: {Issue Title}
296: 
297: **File:** `path/to/file.ext:42`
298: **Issue:** {Clear description}
299: **Fix:**
300: ```language
301: {Concrete code snippet showing the fix}
302: ```
303: 
304: ## Warnings
305: 
306: {If no warnings, omit this section}
307: 
308: ### WR-01: {Issue Title}
309: 
310: **File:** `path/to/file.ext:88`
311: **Issue:** {Description}
312: **Fix:** {Suggestion}
313: 
314: ## Info
315: 
316: {If no info items, omit this section}
317: 
318: ### IN-01: {Issue Title}
319: 
320: **File:** `path/to/file.ext:120`
321: **Issue:** {Description}
322: **Fix:** {Suggestion}
323: 
324: ---
325: 
326: _Reviewed: {timestamp}_
327: _Reviewer: the agent (gsd-code-reviewer)_
328: _Depth: {depth}_
329: ```
330: 
331: **4. Return to orchestrator:** DO NOT commit. Orchestrator handles commit.
332: </step>
333: 
334: </execution_flow>
335: 
336: <critical_rules>
337: 
338: **ALWAYS use the Write tool to create files** — never use `Bash(cat << 'EOF')` or heredoc commands for file creation.
339: 
340: **DO NOT modify source files.** Review is read-only. Write tool is only for REVIEW.md creation.
341: 
342: **DO NOT flag style preferences as warnings.** Only flag issues that cause or risk bugs.
343: 
344: **DO NOT report issues in test files** unless they affect test reliability (e.g., missing assertions, flaky patterns).
345: 
346: **DO include concrete fix suggestions** for every Critical and Warning finding. Info items can have briefer suggestions.
347: 
348: **DO respect .gitignore and .claudeignore.** Do not review ignored files.
349: 
350: **DO use line numbers.** Never "somewhere in the file" — always cite specific lines.
351: 
352: **DO consider project conventions** from AGENTS.md when evaluating code quality. What's a violation in one project may be standard in another.
353: 
354: **Performance issues (O(n²), memory leaks) are out of v1 scope.** Do NOT flag them unless they're also correctness issues (e.g., infinite loop).
355: 
356: </critical_rules>
357: 
358: <success_criteria>
359: 
360: - [ ] All changed source files reviewed at specified depth
361: - [ ] Each finding has: file path, line number, description, severity, fix suggestion
362: - [ ] Findings grouped by severity: Critical > Warning > Info
363: - [ ] REVIEW.md created with YAML frontmatter and structured sections
364: - [ ] No source files modified (review is read-only)
365: - [ ] Depth-appropriate analysis performed:
366:   - quick: Pattern-matching only
367:   - standard: Per-file analysis with language-specific checks
368:   - deep: Cross-file analysis including import graph and call chains
369: 
370: </success_criteria>

(End of file - total 370 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.opencode/AGENTS.md
# Soft Meta-Concept Sector Guidance


## NON-NEGOTIABLE RULES

- all tech, stack, SDK implementation, audit, gatekeeping  must follow deep investigation - stack research ;skills are for references not for interfaces validation; "interfaces, patterns, methods, api, signatures of specs etc" must validate against the correct versions at package.json - **MUST VALIDATE AGAINST ONLINE RESOURCES AS FOR MCP SERVER TOOLS ACTUAL FETCH** - valid and evidences with Context7, Deepwiki, Gitmcp, Github repo, Exa **AND Repomix for accurate specific patterns** etc, official - loading references from skills of stacks are outdated, as so reading code in the codebase can be polluted as many implementations are not functioning and broken. DO NOT MAKE ASSUMPTIONS OF THE STACK REPO LINKs - **EXTREMELY IMPORNTANT:** Uses of Context7, Deepwiki, Gitmcp, Github, Exa, Repomix are enforced when researching, planning, and implementing - these MUST Comply with all the **Github and Npm links that up-to-date with versiosn and NOT A PRODUCT OF MAKING UP LINKS** >  glob, list this to check these links `.hivemind/STACKS-REFERENCES.md`

- any thing under .opencode/ are not shipped-with, they are symlinks or project toolings 

- all orchestrator, coordinator, conductor agents belonging to l0, and l1 classifications MUST FOCUS ON THE DELEGATIONS - NEVER Implement the tasks yourself - when delegating DO NOT SHOW THE SPECIALIST WHAT AND HOW TO IMPLEMENT - Show HOW TO PROCESS, WHAT TO EXPECT AS RESULTS, SETTING CONSTRAINTS AND BOUNDARIES, INDICATION OF CLEAR SUCCESS METRICS

- design patterns and must be obeyed strictly according to the architecture of the project.

- atomic git commit for context preservation.

- context git commit for both code implementation, docs, planning, researching, gatekeeping, verification artifacts - do not ask if commit needed

- AGENTS.md must be routinely updated - after each cycle, each batch of implementation.

- AGENTS.md are nested under dirs and subdirs, beware when maintaining them.

- files creation and structure must be registered and keep track - we love our codetree systematically structured and we **DO Registered** folders and subfolders with `.gitkeep` 

- folders must be created in a way that is easy to navigate and understand, following the best practice of this harness. Folders must be registered with gitkeep files to ensure they are tracked by git. 

- code file must JSDOC (Run JSDOC skill) documented with clear descriptions, parameters, return values, and examples. All functions and classes must be documented.

- The front facing agents must process high-level workflows, validate dependencies of tasks across sessions through faces

- The front facing agents must delegate to suagents of specialist; front facing agents are not allowed to execute any tasks

- The front facing agents are ones converse with USERS and must know the high-level tasks flow, following strict validations, gatekeeping, and coordination of the partificating frameworks

- When delegating to agents these are the list of agents that must learn and delegate to the correct ones. When delegate to subagents make sure setting up strict guardrails, boundaries, success metrics, making sure they are awared that they are subagents and fulfill the tasked within boundaries and without any deviation ans seriously go through gatekeeping.

<!-- NOTE: explore agent is MISSING from the filesystem -->

- For effective session-resume delegation (when user disconnected and there were previous aborted delegation tasks). Do not start new delegation, start the same start with **THE EXACT SESSION ID** to resume.

- The front facing agents must keep track, monitor, make sure not a single validation, verification, review steps are skips, planning , audit and verification must following format of the participated framework with honest verification and prevention of regressions. 

- **all agents** at every turn (after PER USER's prompt, **even mid-session**, after each turn), entries, shift of workflows there should be matching SKILLS that you must load, load and reload of suitable skills for the task, select ones with framework consistencies. Do not miss loading SKILLS. SKILLS are extremely important


- - **all agents** : do not confuse between the project as the harness which you are building so that users can run it with OpenCode under their projects VS. your environment of works -> meaning there are assumptions that ARE NOT ALLOWED to interprete as this sole environment but must be as wider scopes, in terms of how different projects' states, tasks types, langues, frameworks and use cases.
---
**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

Source architecture: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — `.opencode/` is the Soft Meta-Concepts sector: OpenCode primitives (agents, commands, skills, rules, permissions) ONLY. No runtime state. No development implementation.

## 1. Sector purpose and lifecycle role

`.opencode/` is the Soft Meta-Concept sector: OpenCode primitives, rules, plugin loader wrappers, commands, skills, agents, permissions, and project configuration that compose runtime behavior from outside the npm package source. Source evidence: `.planning/codebase/ARCHITECTURE.md:209-245`, `.planning/codebase/STRUCTURE.md:124-129`.

Source evidence: `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — hm/hf/gate/stack/gsd lineages, L0-L3 hierarchy contract. `.planning/codebase/ARCHITECTURE.md:209-245` — Soft Meta-Concept layer.

## 2. Allowed mutation authority

- Agents, skills, commands, rules, permissions, and OpenCode config may be created or updated here when explicitly authorized by a meta-concept workflow.
- `.opencode/plugins/` may contain thin plugin loader wrappers that point OpenCode at built harness plugin entrypoints. Evidence: `.planning/codebase/STRUCTURE.md:157-164`.
- Primitive/config changes must preserve hm/hf/gate/stack lineage conventions and the L0→L3 delegation hierarchy. Evidence: `.planning/codebase/ARCHITECTURE.md:217-245`, `.planning/codebase/STRUCTURE.md:197-216`.
- Closest-sector deviation: no `src/config/` folder is created for primitive/config boundary guidance; this sector owns soft primitive/config placement while runtime config consumers remain in `src/`.

## 3. Forbidden mutations / explicit no-go boundaries

- `.opencode/` SHALL NOT store internal runtime state; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/STRUCTURE.md:124-134`.
- `.opencode/` SHALL NOT be treated as development implementation, source code, or build output. It is exclusively for OpenCode primitives (agents, commands, skills, rules, permissions) that configure runtime behavior.
- `.opencode/` SHALL NOT contain business logic, state persistence, compiled code, or npm package source — those belong in `src/` (Hard Harness) and `.hivemind/` (Internal State).
- `.opencode/state/` is legacy migration-only and must not receive new internal state ownership. Evidence: `.planning/codebase/STRUCTURE.md:295-299`.
- Do not blur hm/hf/gate/stack lineages or ship gsd-* internal developer tooling as product primitives. Evidence: `.planning/codebase/ARCHITECTURE.md:217-233`, `.planning/codebase/STRUCTURE.md:209-216`.
- Do not edit runtime TypeScript implementation here; runtime source authority remains in `src/`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Discovers project config, plugin loader, commands, agents, skills, and rules | Runtime state still belongs in `.hivemind/` |
| hm-* lineage agents/skills | Product-dev workflows and specialists | STRICT lineage; no hf-* skill loading by hm-* unless explicitly routed |
| hf-* lineage agents/skills | Meta-concept authoring/building | May modify primitives only under meta-builder authorization |
| gate-* skills | Internal quality gate triad | Project-only quality gates, not shipped as generic product claims |
| stack-* skills | Framework/reference knowledge | Reference only, not implementation authority |
| `src/` Hard Harness tools | Configured through `.opencode/` primitives (agents call tools, commands route to agents) | Never imports from `.opencode/` — reads only through OpenCode SDK |

## 5. Naming and placement conventions

- Agent files use `hm-*`, `hf-*`, or `gsd-*` prefixes according to lineage; skills use `hm-*`, `hf-*`, `gate-*`, `stack-*`, or `gsd-*` prefixes. Evidence: `.planning/codebase/STRUCTURE.md:197-216`.
- Canonical runtime skill location is `.opencode/skills/`; meta-builder source may be reflected from `.hivefiver-meta-builder/`. Evidence: `.planning/codebase/ARCHITECTURE.md:209-215`.
- New agents, skills, and commands should originate from the meta-builder source areas before reflection to `.opencode/`. Evidence: `.planning/codebase/STRUCTURE.md:241-254`.
- Commands use OpenCode command files under `.opencode/commands/`; do not invent parallel command roots.

## 6. Quality gates and evidence expectations

- Primitive changes require discoverability validation, lineage validation, and restart/compile checks when applicable; docs-only edits here are not runtime proof.
- Do not claim permission enforcement, registry completeness, or runtime routing readiness when requirements still mark them missing/partial. Evidence: `.planning/REQUIREMENTS.md:42-56`, `.planning/PROJECT.md:29-42`.
- O3 docs-only guidance remains L5 evidence and cannot change runtime readiness. Evidence: `.planning/ROADMAP.md:47-49`.

## 7. Cross-sector alignment

- **Hard Harness (`src/`):** Runtime implementation. Compiles to dist/. Calls OpenCode SDK. Does not depend on `.opencode/` at build time.
- **Internal State (`.hivemind/`):** Durable persistence. Owned by `src/` modules through tool/hook CQRS boundaries. Canonical per Q6.
- **Meta-Authoring (`.hivefiver-meta-builder/`):** Source-of-truth for primitive authoring. Reflected to `.opencode/` via symlink or sync.
- **Governance (`.planning/`):** Documents architecture, provides phase authorization. Does not mutate `.opencode/`.
- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, OMO folder roots (`.sisyphus`, `.omx`) are REJECTED; `.opencode/` remains primitives-only.

</system-reminder>
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_Js9jXlKMAhR2KHyA9aMX5455"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_RkpEgSZedE1eXzJHmyQz8455"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_HiVhB3HqGtI3eCu8RtQ74786"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_QQMHIRlVxJaLXvTH9lVz0519"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_poxrAABYozzSXHV0d8jO4993"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_02_cBcdzzTra7VUMPpHA6sq1727"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_03_N4WsLeR8yeV0Ol9sdeem2184"
}
```


### Tool: edit

**Input:**
```json
{
  "callID": "call_00_sHzS4yuPjrOclPYvh0rQ9982"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_eKQRmnHazBSMrLafRlX63335"
}
```

