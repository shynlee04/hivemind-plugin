# GitHub Ingestion

## Overview

This reference covers the INGEST phase of the skill-synthesis pipeline: fetching remote repositories, extracting skill patterns, and preparing them for classification. The goal is to build a pattern corpus from real-world skill implementations across GitHub.

## Repomix Remote Ingestion

### Correct CLI Usage

```bash
# Pack a remote repo, extracting only skill-related files
repomix --remote <owner/repo> \
  --include "**/SKILL.md,**/skills/**/*.md,**/evals/**/*.json,**/references/**/*.md" \
  --style xml \
  -o /tmp/skill-ingest-<timestamp>.xml
```

**Critical:** Use `--include` (NOT `--include-patterns`). The `--include` flag accepts comma-separated glob patterns. This is the correct repomix CLI flag as documented in `repomix-exploration-guide`.

### Branch-Targetable Ingestion

```bash
# Target a specific branch
repomix --remote <owner/repo> \
  --include "**/SKILL.md,**/skills/**/*.md" \
  --remote-branch <branch-name> \
  -o /tmp/skill-ingest-<timestamp>.xml

# Target a specific commit or tag via URL
repomix --remote "https://github.com/<owner>/<repo>/tree/<tag-or-commit>" \
  --include "**/SKILL.md" \
  -o /tmp/skill-ingest-<timestamp>.xml
```

### Focused Slices for Skill Discovery

```bash
# Broad sweep: all markdown files (catches skills in non-standard locations)
repomix --remote <owner/repo> \
  --include "**/*.md" \
  --ignore "**/node_modules/**,**/dist/**,**/.git/**" \
  --compress \
  -o /tmp/skill-ingest-broad-<timestamp>.xml

# Narrow sweep: only files matching skill anatomy patterns
repomix --remote <owner/repo> \
  --include "**/SKILL.md,**/skill.md,**/skills/**,**/.claude/skills/**,**/.opencode/skills/**" \
  -o /tmp/skill-ingest-narrow-<timestamp>.xml
```

### Output Format: JSON Report

After ingestion, produce a structured JSON report:

```json
{
  "repo": "<owner/repo>",
  "branch": "<branch-or-null>",
  "timestamp": "<ISO-8601>",
  "skills_found": 12,
  "files": [
    {
      "path": ".opencode/skills/deep-research/SKILL.md",
      "lines": 180,
      "references": 5,
      "has_evals": true,
      "has_scripts": false
    }
  ],
  "total_lines": 2400,
  "output_file": "/tmp/skill-ingest-<timestamp>.xml"
}
```

Generate this by parsing the XML output:

```bash
#!/usr/bin/env bash
set -euo pipefail
CI=true GIT_TERMINAL_PROMPT=0 PAGER=cat

INPUT_FILE="${1:?Usage: parse-ingest.sh <xml-file>}"
REPO="${2:-unknown}"

skills_found=0
total_lines=0
files_json="[]"

while IFS= read -r line; do
  if [[ "$line" =~ \<file\ path=\"([^\"]+)\" ]]; then
    filepath="${BASH_REMATCH[1]}"
    if [[ "$filepath" == *"SKILL.md"* ]]; then
      skills_found=$((skills_found + 1))
    fi
  fi
done < "$INPUT_FILE"

# Count lines in packed output (approximate — repomix includes line numbers)
total_lines=$(wc -l < "$INPUT_FILE")

jq -n \
  --arg repo "$REPO" \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --argjson skills "$skills_found" \
  --argjson lines "$total_lines" \
  --arg outfile "$INPUT_FILE" \
  '{
    repo: $repo,
    timestamp: $ts,
    skills_found: $skills,
    files: [],
    total_lines: $lines,
    output_file: $outfile
  }'
```

## Webfetch: Canonical Spec

Always fetch the agentskills.io spec fresh — never cache it across sessions:

```bash
# Fetch canonical skill specification
webfetch https://agentskills.io/llms.txt

# Save to temp for reference during session
# The output is markdown — parse for frontmatter schema, pattern definitions, eval structure
```

Use this as ground truth for:
- Frontmatter field requirements (`name`, `description`, `metadata`, `allowed-tools`)
- Pattern definitions (P1/P2/P3 thresholds)
- Eval structure expectations
- Cross-platform compatibility rules

## Websearch: Pattern Corpus

Search GitHub for real-world skill implementations to build a classification corpus:

```bash
# Search for SKILL.md files with frontmatter
websearch "site:github.com SKILL.md agent skill frontmatter"

# Search for eval patterns
websearch "site:github.com evals.json trigger-queries.json skill"

# Search for specific platform skill directories
websearch "site:github.com .opencode/skills SKILL.md"
websearch "site:github.com .claude/skills SKILL.md"
```

Results form a pattern corpus. Each result URL can be fed back into repomix for deep extraction.

## Non-Interactive Shell Constraints

All ingestion scripts run in non-interactive environments (CI, subagents, headless shells). Enforce these constraints:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Environment — prevent interactive prompts
export CI=true
export GIT_TERMINAL_PROMPT=0
export GIT_PAGER=cat
export PAGER=cat
export DEBIAN_FRONTEND=noninteractive

# Timeout wrapper for any command that might hang
timeout 30 repomix --remote "$REPO" --include "**/SKILL.md" -o /tmp/ingest.xml

# Cleanup trap — always remove temp files
cleanup() {
  rm -f /tmp/skill-ingest-*.xml /tmp/spec-*.md /tmp/classify-*.json
}
trap cleanup EXIT
```

**Banned in non-interactive shells:** `vim`, `less`, `git add -p`, `read -p`, `select`, any command requiring TTY input.

## Error Handling

### Repo Not Found / Private

```bash
if ! repomix --remote "$REPO" --include "**/SKILL.md" -o /tmp/ingest.xml 2>/tmp/repomix-err.log; then
  err=$(cat /tmp/repomix-err.log)
  if echo "$err" | grep -qi "not found\|private\|404"; then
    echo '{"error": "repo_not_found", "message": "Repository not found or is private. Verify the repo exists and is public."}' >&2
    exit 1
  fi
  echo "{\"error\": \"repomix_failed\", \"message\": \"$err\"}" >&2
  exit 1
fi
```

### Empty Results

```bash
skill_count=$(grep -c '<file path=' /tmp/ingest.xml || true)
if [ "$skill_count" -eq 0 ]; then
  echo '{"error": "no_skills_found", "message": "No SKILL.md files found in repository. Try a broader --include pattern or verify the repo contains skills."}' >&2
  exit 1
fi
```

### Network Timeout

```bash
# Wrap network calls with timeout
timeout 60 repomix --remote "$REPO" --include "**/SKILL.md" -o /tmp/ingest.xml || {
  echo '{"error": "timeout", "message": "Ingestion timed out after 60s. The repo may be too large or network is slow."}' >&2
  exit 1
}
```

## Cleanup Protocol

Every ingestion session must clean up temp files:

```bash
# Trap-based cleanup (preferred)
cleanup() {
  rm -f /tmp/skill-ingest-*.xml /tmp/spec-*.md /tmp/classify-*.json /tmp/repomix-err.log
}
trap cleanup EXIT

# Manual cleanup (if trap is not available)
rm -f /tmp/skill-ingest-*.xml /tmp/spec-*.md /tmp/classify-*.json
```

## Ingestion Workflow Summary

```
1. Set non-interactive env vars (CI=true, etc.)
2. Fetch canonical spec via webfetch (agentskills.io/llms.txt)
3. Run repomix --remote with --include patterns for skill files
4. Parse XML output → JSON report (skills_found, files, total_lines)
5. Handle errors: repo not found, empty results, timeouts
6. Clean up temp files via trap
7. Return structured JSON for classification phase
```
