# Version Tracking — Detection, Staleness, and Updates

## The Version Rule

```
Never trust a cached tech stack whose version doesn't match what's installed.
```

Cached tech stacks are snapshots. They represent the documentation and API surface at a specific point in time. When the installed version changes, the cache becomes a liability — quality gates would validate against a stale API.

## Version Detection

### Step 1: Detect the Installed Version

**Node.js / npm:**
```bash
# Exact version from lock file
npm ls <package-name> --depth=0 2>/dev/null

# Version range from package.json
grep '"<package-name>"' package.json | sed 's/.*": "\(.*\)".*/\1/'

# Latest available (for comparison)
npm view <package-name> version
```

**Python / pip:**
```bash
pip show <package-name> 2>/dev/null | grep Version
pip index versions <package-name> 2>/dev/null | head -5
```

**Go:**
```bash
grep "<module-path>" go.mod | awk '{print $2}'
```

**Rust:**
```bash
grep '<crate-name>' Cargo.lock | head -1
```

**Java / Maven:**
```bash
grep -A 1 "<artifactId><package-name>" pom.xml | grep version
```

### Step 2: Cross-Reference Against package.json (MANDATORY)

Before comparing against the cached version, confirm the exact installed version by cross-referencing both the manifest and the lock file:

```bash
# Step 2a: Read the declared version range from the manifest
grep '"<package-name>"' package.json

# Step 2b: Read the exact installed version from the lock file
grep -A 2 '"<package-name>"' package-lock.json | grep '"version"'

# Step 2c: If no lock file, resolve from the manifest range
npm ls <package-name> --depth=0 2>/dev/null

# Step 2d: Cross-validate — lock file version MUST match what npm ls reports
# If mismatch → the project may have uncommitted changes → flag as NEEDS_INVESTIGATION
```

**Rule:** The lock file version is canonical. The manifest version is a range. Never use the manifest version alone for staleness decisions.

### Step 3: Compare Against Cached Version

```bash
# Read cached version
python3 -c "import json; print(json.load(open('references/tech-stacks/<stack-name>/metadata.json'))['version'])"

# Compare
echo "Installed: <installed-version>"
echo "Cached: <cached-version>"
```

### Step 3: Determine Staleness

| Installed vs Cached | Verdict | Action |
|--------------------|---------|--------|
| `installed > cached` | **STALE — UPGRADE** | Re-ingest the new version. Archive old version. |
| `installed < cached` | **MISMATCH — INVESTIGATE** | Downgrade may be intentional. Flag as NEEDS_INVESTIGATION. Re-ingest if confirmed. |
| `installed == cached` | **FRESH** | No action needed. Proceed with cached assets. |
| `cached_version == null` | **MISSING** | Run full ingestion pipeline. |
| `installed == "latest" or "*"` | **AMBIGUOUS** | Resolve to actual installed version via lock file. If no lock file, flag as approximate. |

## Staleness Thresholds

Not all staleness is equal. Use these thresholds:

| Cache Age | Verdict | Action |
|-----------|---------|--------|
| < 30 days | FRESH | No action needed |
| 30-90 days | WARM | Check if installed version changed. Re-ingest if yes. |
| 90-180 days | STALE | Flag for re-ingestion even if version unchanged (docs may have updated). |
| > 180 days | ROTTEN | Do NOT use for quality gate validation. Force re-ingestion. |

### Severity-Aware Re-Verification Windows

The staleness thresholds above are the DEFAULT for STANDARD severity. Adjust based on the package's severity tier:

| Severity Tier | Re-Verify Window | Override Threshold | Examples |
|---------------|-----------------|-------------------|----------|
| **CRITICAL** | 24 hours | Any cache > 1 day MUST be re-verified before Validation Tier use | Pre-1.0 packages, active betas, canary releases |
| **HIGH** | 7 days | Any cache > 7 days MUST be re-verified before Validation Tier use | Plugin SDKs, frameworks with major-version breaks |
| **STANDARD** | 30 days (default above) | Follow the standard staleness thresholds | Most mature libraries (Zod, Lodash, date-fns) |
| **LOW** | 90 days | Only flag for re-verification after 90 days | DOM APIs, Node.js built-ins, stable specs |

**How to determine severity:** Check `metadata.json` → `severity_tier`. If not set, default to STANDARD. Classify as CRITICAL if the package version starts with `0.` or the changelog shows breaking changes in the last 3 releases.

## Automated Staleness Scan

Run this scan to check ALL ingested stacks against installed versions:

```bash
#!/bin/bash
# Check all ingested tech stacks for staleness

INDEX="references/tech-stacks/index.json"

if [ ! -f "$INDEX" ]; then
    echo "No ingested stacks found. Run ingestion pipeline first."
    exit 0
fi

echo "=== Tech Stack Staleness Report ==="
echo "Date: $(date '+%Y-%m-%d')"
echo ""

# For each stack in the index
python3 -c "
import json, os, datetime

with open('$INDEX') as f:
    data = json.load(f)

for stack in data.get('stacks', []):
    name = stack['name']
    version = stack.get('version', 'unknown')
    path = stack.get('path', '')
    ingested = stack.get('ingested', 'unknown')
    last_validated = stack.get('last_validated', 'unknown')
    
    metadata_path = os.path.join(path, 'metadata.json')
    if not os.path.exists(metadata_path):
        print(f'[MISSING] {name} — metadata.json not found')
        continue
    
    with open(metadata_path) as f:
        meta = json.load(f)
    
    ingest_date = meta.get('ingest_date', 'unknown')
    
    # Calculate age
    try:
        ingest_dt = datetime.datetime.strptime(ingest_date, '%Y-%m-%d')
        age_days = (datetime.datetime.now() - ingest_dt).days
    except:
        age_days = -1
    
    # Determine staleness
    if age_days < 0:
        status = 'UNKNOWN'
    elif age_days < 30:
        status = 'FRESH'
    elif age_days < 90:
        status = 'WARM'
    elif age_days < 180:
        status = 'STALE'
    else:
        status = 'ROTTEN'
    
    print(f'[{status}] {name} v{version} — cached {age_days}d ago ({ingest_date})')
    
    if status in ('STALE', 'ROTTEN'):
        print(f'  ACTION: Re-ingest {name}')
    elif status == 'WARM':
        print(f'  ACTION: Check for version changes')
"
echo ""
echo "=== End Report ==="
```

## Version Update Workflow

When re-ingestion is triggered by a version change:

### Step 1: Archive the Current Version

```bash
# Move current cached version to archive
mkdir -p references/tech-stacks/archive/<stack-name>-<old-version>
cp -r references/tech-stacks/<stack-name>/* references/tech-stacks/archive/<stack-name>-<old-version>/

# Clear the current directory (but keep the structure)
rm -rf references/tech-stacks/<stack-name>/{api,docs,examples,raw}
# Keep TOC.md and metadata.json as templates for the new version
```

### Step 2: Ingest the New Version

Run Phases 1-5 of the ingestion pipeline (see `references/ingestion-protocol.md`).

### Step 3: Write a Changelog Entry

Append to `references/tech-stacks/<stack-name>/changelog.md`:

```markdown
## 2026-04-28 — Re-ingested v4.3.6 (was v4.3.5)

**Reason:** Version upgraded in project dependencies.
**Source:** github.com/colinhacks/zod — tag v4.3.6
**Tools Used:** repomix + context7 + deepwiki
**Changes Detected:**
- Added `z.enum()` support for const arrays
- Updated error formatting pipeline
- New `z.function()` schema type (experimental)
**Archive:** `archive/zod-v4.3.5/`
```

### Step 4: Update the Master Index

Update `references/tech-stacks/index.json` with the new version and ingest date.

### Step 5: Validate

```bash
# Confirm new version is cached
python3 -c "import json; print(json.load(open('references/tech-stacks/<stack-name>/metadata.json'))['version'])"

# Confirm old version is archived
ls references/tech-stacks/archive/<stack-name>-<old-version>/metadata.json

# Check changelog entry
tail -5 references/tech-stacks/<stack-name>/changelog.md
```

## Version Range Handling

### Semantic Version Ranges

| Range in Manifest | How to Resolve |
|-------------------|---------------|
| `^1.2.3` | Compatible with `>=1.2.3 <2.0.0`. Use the installed version from lock file. |
| `~1.2.3` | Approximately `>=1.2.3 <1.3.0`. Use lock file version. |
| `>=1.2.3 <2.0.0` | Any version in range. Use lock file version as the canonical one. |
| `*` or `latest` | Any version. Resolve to installed version. Mark as "approximate — no pinned version". |
| `1.2.3` (exact) | Exact version. No resolution needed. Trust the manifest. |
| `file:../local-pkg` | Local package. Cannot be ingested from remote. Skip or ingest from local disk. |
| `git+https://...` | Git dependency. Clone the repo at the specific commit and ingest. |
| `workspace:*` | Monorepo workspace. Ingest from the local monorepo package directory. |

### Lock File Priority

When both manifest and lock file exist, **always use the lock file version**. The lock file represents what's actually installed.

```
package.json: "zod": "^4.0.0"
package-lock.json: "zod": { "version": "4.3.6" }
→ Canonical version: 4.3.6 (from lock file)
```

## Migration Tracking

When a library has a major version bump (e.g., v3 → v4), track migration documentation:

1. Search for migration guides using `tavily_tavily_search`: "zod v3 to v4 migration guide"
2. Store migration docs at `references/tech-stacks/<stack-name>/docs/migration.md`
3. Tag the cached stack with breaking changes in metadata:
   ```json
   {
     "breaking_changes": {
       "from_version": "3.23.8",
       "to_version": "4.3.6",
       "migration_guide": "docs/migration.md",
       "key_changes": ["New ._def structure", "Removed preprocess", "Changed refine signature"]
     }
   }
   ```

## Diff-Tracking Between Ingestion Versions

When re-ingesting a stack (version upgrade), capture what changed between the old and new cached versions:

### Step 1: Snapshot the Old API Surface

Before re-ingesting, extract the old API surface for comparison:

```bash
# Snapshot exported symbols from the old cache
grep -r "^## \`" references/tech-stacks/<stack-name>/api/exports.md > /tmp/old-exports.txt
grep -r "^## \`" references/tech-stacks/<stack-name>/api/types.md >> /tmp/old-exports.txt
```

### Step 2: Re-Ingest and Snapshot the New API Surface

After re-ingesting, extract the new API surface:

```bash
# Snapshot exported symbols from the new cache
grep -r "^## \`" references/tech-stacks/<stack-name>/api/exports.md > /tmp/new-exports.txt
grep -r "^## \`" references/tech-stacks/<stack-name>/api/types.md >> /tmp/new-exports.txt
```

### Step 3: Diff and Record

```bash
# Find added, removed, and changed symbols
diff /tmp/old-exports.txt /tmp/new-exports.txt
```

Append the diff summary to `changelog.md`:

```markdown
## YYYY-MM-DD — Re-ingested vNEW (was vOLD)

**API Diff:**
- ADDED: `newFunction()`, `NewType`
- REMOVED: `deprecatedFunction()`, `OldType`
- CHANGED: `existingFunction()` (signature changed: added optional param)
- UNCHANGED: 42 symbols
```

### Step 4: Update metadata.json with Diff Summary

```json
{
  "last_diff": {
    "from_version": "4.3.5",
    "to_version": "4.3.6",
    "added": 3,
    "removed": 1,
    "changed": 2,
    "unchanged": 42,
    "diff_date": "2026-05-10"
  }
}
```

This diff-tracking enables downstream agents to quickly understand whether a version bump affects their validation scope without reading the entire API surface.

## Anti-Patterns in Version Tracking

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Trusting the Manifest Blindly** | Version from `package.json` used instead of lock file | Always resolve against lock file first. Only fall back to manifest if no lock file exists. |
| **Ignoring Version Ranges** | Exact version assumed from range (e.g., `^1.2.3` read as `1.2.3`) | Resolve the range to the installed version via lock file or `npm ls`. |
| **Skipping Staleness Checks** | Cached stack used without checking `ingest_date` | Run the staleness scan before every major quality validation. |
| **No Archive on Re-ingestion** | Old version overwritten without backup | Always archive old versions. You may need them for historical comparison. |
| **Stale Changelog** | Re-ingested but changelog.md not updated | Always append to changelog after re-ingestion. |
| **Forgetting Peer Dependencies** | Main package re-ingested but peer deps still stale | When a package changes version, check its peer deps too. |
| **The "Close Enough" Assumption** | "v4.3.5 cache is fine for v4.3.6 — it's a patch release" | Patch releases can change APIs. Always match EXACT versions for quality gate validation. |
| **The Severity Ignorance** | CRITICAL-tier package treated with STANDARD 30-day re-verify window | Check `severity_tier` in metadata.json. Apply the correct re-verification window. |
| **The Diff Skip** | Re-ingested without comparing old vs new API surface | Always run the Diff-Tracking protocol to capture added/removed/changed symbols. |
