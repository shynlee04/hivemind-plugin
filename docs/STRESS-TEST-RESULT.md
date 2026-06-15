# Stress Test Result — hivemind-doc

# Summary

Stress test of the hivemind-doc tool completed on 2026-06-09. The test exercised the tool across two major scenarios: PART A (multi-format knowledge base with 5 files) and PART B (5-level nested planner).

The tool exposed many unexpected behaviors, silent failures, schema mismatches with documentation, and broken nesting logic. The following sections enumerate each observed flaw in detail.

## Critical Flaws

F-01: create does not create parent directories. Calling create on `kb/architecture.md` when `kb/` does not exist returns error `[Harness] Failed to acquire lock for .../kb/architecture.md: ENOENT: no such file or directory, mkdir '.../kb/architecture.md.lock'`. Manual directory creation required.

F-02: metadata parameter type mismatch. Tool description says: metadata "Frontmatter as JSON string". The Zod schema requires a record (object). Passing a JSON string returns `expected record, received string`. This affects create, set_metadata. All documentation claims about "JSON string" are misleading.

F-03: batch and batch_files cannot accept arrays. Tool description says `ops: "JSON array of section operations"`. The schema rejects both string and object. Every batch and batch_files call returns `expected array, received object` or `received string`. The tool is unusable for batch operations from this client.

F-04: xref marks ALL links as invalid. All 15 links in deployment.md (including self-references and cross-file) were marked `valid: false`. The xref action returns links but the validation logic appears broken or never resolves anchors.

F-05: read action ignores the heading parameter. Calling read with heading="REST" or heading="API Service" returns the entire file (full content, not truncated). Same for nonexistent headings — silent full-file return with no error.

F-06: heading hierarchy/parent assignment is broken. The level parameter on upsert has no apparent effect on parent assignment. All H2 sections land as children of the last H1 ("Scaling"), H3 under last H2, etc. creating a sequential chain rather than the intended 5-bucket structure.

## Metadata Coercion Bugs

F-07: Array values in metadata are coerced to objects. set_metadata with `tags: ["system", "design"]` is stored as `{"item": ["system", "design"]}`. Doubly nested when called as `tags: [["stress-test"]]` — stored as `{"item": {"item": "stress-test"}}`. This breaks downstream consumers expecting arrays.

F-08: Single-element arrays become objects. `related_docs: ["kb/architecture.md"]` stored as `{"item": "kb/architecture.md"}` — an object with a single key, not an array.

F-09: Numeric values can be coerced to strings. `waves: 5` stored as `waves: "5"` in the metadata read.

F-10: set_metadata on index.json silently drops nested objects. Setting the full KB index structure only persisted `version` and `last_updated` — the nested `documents` and `stats` objects were silently discarded.

F-11: set_metadata on config.yaml is a complete silent failure. The hash returned matches the original create hash, and metadata read only returns the title. All provided fields were silently dropped.

F-12: title appears in metadata automatically. Even when no metadata was provided, `metadata` action returns `{"title": "..."}`. This is undocumented behavior.

## Section / Hierarchy Bugs

F-13: Sequential chain parent assignment. Sections get parents in sequential order: H1 #1 has no parent, H2 #1 gets parent H1 #1, H2 #2 gets parent H1 #1, ..., H1 #2 lands, then ALL subsequent H2s become children of H1 #2. The parent is whichever H1 was created LAST before the H2.

F-14: outline tree nests ALL H2s under the LAST H1. After creating 5 H1s and 14 H2s, the outline tree shows all H2s under "Scaling" (the 5th H1). No way to specify target H1 parent.

F-15: headingPath/parentHeading in chunk output reflect sequential chain. Chunks show headingPath as a sequential chain (e.g., ["System Architecture", "Overview", "Components", ...]) rather than actual logical nesting.

F-16: chunk IDs include raw heading text with spaces. Example: `kb/architecture.md#System Architecture-2` — invalid as an HTML anchor since anchors must not contain spaces.

F-17: Mismatched level in upsert duplicates. Calling upsert heading="Chapter 1: Foundation" with level=2 (original was level=1) creates a SECOND section with the same name, doesn't replace or warn.

F-18: insert afterHeading=Endpoint Validation fails silently. Error: "Target heading not found: Endpoint Validation". No suggestions for close matches (actual heading is "Endpoints").

F-19: delete action returns mode="section" by default. Explicitly setting mode="section" returns error: `expected "file"`. Default behavior contradicts the documented mode values.

F-20: chunks contain incorrect parentHeading. parentHeading is "Scaling" for chunks whose actual logical parent is something else (e.g., "Authentication" H3 has parentHeading "Scaling", not "Components").

F-21: TOC indentation does not match heading depth. Items at depth 5 (e.g., "New Sub-Sub-Task") show with same indentation as depth 3 (Canary) parent.

## Line/Offset Bugs

F-22: write_offset replaces MORE characters than `limit` value. On index.json with `limit: 3`, the replacement inserted "REPLACED_JSON_START" (21+ chars) instead of just 3 chars. Limit semantics unclear or broken.

F-23: line/offset actions are format-unaware. Using write_offset on index.json replaced "---" (YAML frontmatter) with "REPLACED_JSON_START" then `"title": ...` — JSON is no longer valid. insert_lines on schema.xml placed text outside the root element, breaking XML. write_lines on config.yaml replaced the original content with a flat key.

F-24: read does not return hash. The read action provides no hash for use with expectedHash in subsequent write operations. The test had to perform a no-op write to obtain the new hash.

F-25: index headingPath for architecture.md is misleading. The index action reports `headingPath: "System Architecture > Overview > Components"` — these are not the section's actual logical parents, but the first 3 H1s in document order.

F-26: context action lacks output budget enforcement. Returns 10 sections whose total tokens may exceed the budget, or undershoots significantly. tokenEstimate is computed but no enforcement is visible.

## Working Behaviors

W-01: create action succeeds when parent directory exists. Returns opId and hash.

W-02: upsert action creates new sections without error. Returns opId, hash, changed status, bytesChanged.

W-03: write action supports expectedHash for atomic check. Stale hash correctly rejected with "Stale file: hash mismatch" error. Test in B.11 confirms this works on api-reference.md.

W-04: hash-based concurrency works. Two consecutive writes with valid then stale expectedHash demonstrate proper stale detection.

W-05: chunk action includes frontmatter in every chunk. Verified across 43 chunks in architecture.md and 29 chunks in complex-plan.md.

W-06: chunk action returns headingPath, depth, parentHeading per chunk. (Values are wrong per F-15, F-20, but the structure is present.)

W-07: search action returns matches across files. 12 matches for "API" across architecture.md and deployment.md, with snippet, line, and heading fields.

W-08: search with regex=true accepted. No error.

W-09: outline returns both flat and tree representations. Tree structure exists even though nesting is wrong (see F-14).

W-10: set_metadata with shallow object works on .md files. version, author, last_updated preserved correctly. Partial updates merge with previous fields (B.12).

W-11: delete_metadata removes field correctly. Verified on architecture.md (author) and complex-plan.md (approved_by).

W-12: insert with afterHeading works when target exists. "API Service Auth" was correctly placed after "API Service" in complex-plan.md.

W-13: All 6 new line/offset actions work. write_lines, write_offset, insert_lines, insert_offset, delete_lines, delete_offset all return success. Side effects on JSON/XML validity are flaws (F-22, F-23) but operations themselves complete.

W-14: toc action returns a markdown-formatted table of contents. Format is correct markdown but indentation does not reflect depth (F-21).

W-15: context action with deep query returns relevant sections. 7 sections for "API service REST endpoint validation" with relevance scores.

## Tool Description Mismatches

D-01: create action — "Frontmatter as JSON string" is wrong. Schema requires object, not string. JSON string returns invalid_type error.

D-02: set_metadata action — "Frontmatter as JSON string" is wrong. Same as D-01.

D-03: batch action — "ops: JSON array of section operations" is misleading. Schema expects array, but the client tool framework auto-converts JSON arrays to objects, making this action unreachable from this client.

D-04: batch_files action — "files: JSON array of per-file batches" same issue as D-03. Unreachable.

D-05: xref action — Returns links with `valid: false` for all links including obvious self-references. The validation logic seems broken, but the action does not document any "validation disabled" mode.

D-06: read action — heading parameter is documented as scoping to a specific section, but is silently ignored. The action always returns the full file content.

D-07: delete action — mode values documented as "section" or "file" but the schema only accepts "file". Default behavior is section, but explicit section is rejected.

## Cross-Format Inconsistencies

CF-01: index.json — write_offset breaks JSON validity. The action operates on raw text and doesn't recognize JSON structure.

CF-02: config.yaml — write_lines on YAML produces non-YAML output. Replaced top-level content with a flat key:value. The YAML file now has different structure than expected.

CF-03: schema.xml — insert_lines inserts text outside root element. XML is no longer well-formed (multiple top-level children).

CF-04: YAML frontmatter (--- blocks) are not preserved by all line/offset operations. After write_offset on architecture.md, the first 3 chars `---` were replaced, breaking the frontmatter delimiter.

CF-05: All non-md files (json, yaml, xml) lack frontmatter concept. set_metadata on them either drops fields (json) or silently fails (yaml). XML metadata was never tested but inferred to be similar.

## File-by-File Inventory

All operations recorded per file. opId + hash captured for every write/create.

kb/index.json: opId ebaf844b532e, hash ef388dde092e. Metadata partially persisted (F-10). Line/offset damaged structure (F-22).

kb/architecture.md: opId f65b2edb02a3, hash 22c87e9f25d3. 37 headings created. Frontmatter corrupted by line/offset ops (F-04 of metadata). Tree structure broken (F-14).

kb/deployment.md: opId 00234e0f71f8, hash 3174f66f9077. 16 headings created. All xrefs marked invalid (F-04).

kb/config.yaml: opId bfd382884516, hash 1b4912e42941. Metadata set silently failed (F-11). YAML structure altered by line/offset (CF-02).

kb/schema.xml: opId e6a5a608999d, hash 00d9e6d5f3d0. Structure damaged by insert_lines (CF-03).

kb/complex-plan.md: opId 0a8035bf7fce, hash 4e059e703ad8. 30+ headings. Frontmatter stored with double-nested tags (F-07). Chapter 1 deleted but Goals chain relocated to Chapter 5 (F-22, F-18).

kb/api-reference.md: opId 6be6a1bdd127, hash 5133ee84b35ab. Hash concurrency verified (W-03, W-04).

docs/STRESS-TEST-RESULT.md: opId b05f8f749425, hash 8b76da324148. This report.

# Final Flaw Count

Total flaws logged: 26 critical/structural flaws (F-01 through F-26). Total working behaviors verified: 15 (W-01 through W-15). Total description mismatches: 7 (D-01 through D-07). Total cross-format inconsistencies: 5 (CF-01 through CF-05).

The tool is partially functional for simple create/upsert/metadata operations. The batch, batch_files, read-by-section, hierarchy-construction, and cross-format-line-edit features are either broken, misleading, or unreachable from this client.
