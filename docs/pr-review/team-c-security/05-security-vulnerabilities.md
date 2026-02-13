# Vulnerability Analysis: Path Traversal (CWE-22)

**PR:** #12 - Path Traversal Fix  
**Date:** 2026-02-13  
**Classification:** CWE-22: Improper Limitation of a Pathname to a Restricted Directory  
**Severity:** High (Critical if exploited)

---

## Attack Scenarios

### Scenario 1: Configuration File Tampering
**Prerequisites:**
- Attacker has write access to `.hivemind/sessions/manifest.json`
- Plugin processes the malicious manifest

**Attack Steps:**
1. Attacker modifies manifest.json:
```json
{
  "sessions": [
    {
      "stamp": "attack",
      "file": "../../../.ssh/id_rsa",
      "status": "active",
      "created": 1700000000000
    }
  ],
  "active_stamp": "attack"
}
```

2. Plugin calls `getActiveSessionPath()`:
```typescript
const entry = manifest.sessions.find(s => s.stamp === "attack");
// entry.file = "../../../.ssh/id_rsa"
return join(paths.activeDir, entry.file);
// Returns: /project/.hivemind/sessions/active/../../../.ssh/id_rsa
// Resolves to: /project/.ssh/id_rsa
```

3. Subsequent read/write operations access sensitive files

**Impact:**
- **Information Disclosure:** Read SSH private keys, API credentials, environment files
- **Data Destruction:** Overwrite critical system or application files
- **Privilege Escalation:** Modify sudoers, cron jobs, or service configurations

### Scenario 2: Session File Manipulation
**Prerequisites:**
- Attacker can control session stamp or filename during session creation

**Attack Steps:**
1. Attacker creates session with malicious stamp:
```typescript
// via compromised tool or malicious session import
const stamp = "../../../sensitive_file";
await resolveSessionFilePathByStamp(projectRoot, stamp);
```

2. Without PR #12 fix, this would resolve to:
```
.hivemind/sessions/active/../../../sensitive_file.md
→ /sensitive_file.md
```

**Impact:**
- Read/write arbitrary files with plugin's permissions

---

## Fix Completeness Assessment

### What PR #12 Fixes ✅
```typescript
// Sanitized in resolveSessionFilePathByStamp()
const sanitizedStamp = basename(stamp)
const byStampInActiveDir = join(activeDir, `${sanitizedStamp}.md`)
```

This prevents traversal via the `stamp` parameter specifically in the fallback path resolution.

### What PR #12 Does NOT Fix ❌

#### 1. `entry.file` from Manifest (HIGH RISK)
**Location:** `src/lib/planning-fs.ts:262`
```typescript
const activePath = join(effective.activeDir, entry.file)
// entry.file comes from manifest - NOT SANITIZED!
```

**Location:** `src/lib/paths.ts:356`
```typescript
return join(paths.activeDir, entry.file)
// entry.file comes from manifest - NOT SANITIZED!
```

#### 2. Archive Operations (MEDIUM RISK)
**Location:** `src/lib/planning-fs.ts:313-320`
```typescript
const archivedPath = join(paths.archiveDir, entry.file)
const sessionPath = join(paths.sessionsDir, entry.file)
// entry.file NOT SANITIZED!
```

**Location:** `src/lib/planning-fs.ts:714-715`
```typescript
const sourceCandidates = [
  join(effective.activeDir, entry.file),
  join(paths.sessionsDir, entry.file),
]
// entry.file NOT SANITIZED!
```

#### 3. Migration Operations (LOW-MEDIUM RISK)
**Location:** `src/lib/migrate.ts` (multiple locations)
```typescript
join(legacy.sessionsDir, entry.file)
join(paths.sessionsDir, entry.file)
join(paths.activeDir, entry.file)
join(paths.archiveDir, entry.file)
// entry.file NOT SANITIZED!
```

### Vulnerable Code Coverage

| Component | Fixed | Vulnerable | Status |
|-----------|-------|------------|--------|
| `resolveSessionFilePathByStamp()` stamp param | ✅ Yes | - | **Fixed** |
| `getActiveSessionPath()` entry.file | - | ✅ Yes | **Vulnerable** |
| `archiveSession()` entry.file | - | ✅ Yes | **Vulnerable** |
| `migrate.ts` entry.file | - | ✅ Yes | **Vulnerable** |
| `paths.ts` getActiveSessionPath() entry.file | - | ✅ Yes | **Vulnerable** |

**Fix Coverage: ~20%** (1 out of 5 vulnerable locations)

---

## Residual Risks

### Risk 1: Manifest Poisoning
**Likelihood:** Medium  
**Impact:** High  
**Risk Level:** **High**

Even with the stamp parameter fix, an attacker can still poison the manifest's `file` field to access arbitrary files. This is the primary attack vector and remains unpatched.

### Risk 2: Archive Traversal
**Likelihood:** Low-Medium  
**Impact:** Medium  
**Risk Level:** **Medium**

Archive operations could be manipulated to write session data to sensitive locations if the archive filename is controlled.

### Risk 3: Migration Data Exposure
**Likelihood:** Low  
**Impact:** Medium  
**Risk Level:** **Low-Medium**

During migration from legacy structure, unsanitized paths could expose old session data to unexpected locations.

---

## Defense in Depth Recommendations

### Layer 1: Input Validation (REQUIRED)
Sanitize ALL path inputs at the entry point:

```typescript
// Recommended approach
function sanitizeFilename(filename: string): string {
  // Remove path separators and traversal sequences
  return basename(filename).replace(/[\\/]/g, '');
}

function validateSessionPath(
  baseDir: string,
  filename: string
): string | null {
  const sanitized = sanitizeFilename(filename);
  const fullPath = join(baseDir, sanitized);
  
  // Ensure resolved path is within base directory
  const resolved = resolve(fullPath);
  const resolvedBase = resolve(baseDir);
  
  if (!resolved.startsWith(resolvedBase)) {
    return null; // Path traversal detected
  }
  
  return fullPath;
}
```

### Layer 2: Manifest Schema Validation (REQUIRED)
Validate manifest entries when reading/writing:

```typescript
const VALID_FILENAME_REGEX = /^[a-zA-Z0-9._-]+$/;

function validateManifestEntry(entry: SessionManifestEntry): boolean {
  if (!VALID_FILENAME_REGEX.test(entry.file)) {
    return false;
  }
  if (entry.file.includes('..') || entry.file.includes('/')) {
    return false;
  }
  return true;
}
```

### Layer 3: Runtime Path Validation (RECOMMENDED)
Add runtime checks before file operations:

```typescript
async function safeReadFile(
  baseDir: string,
  filename: string
): Promise<string | null> {
  const validPath = validateSessionPath(baseDir, filename);
  if (!validPath) {
    await logger?.error(`Path traversal attempt blocked: ${filename}`);
    return null;
  }
  return readFile(validPath, 'utf-8');
}
```

### Layer 4: Audit Logging (RECOMMENDED)
Log all file path resolutions for security monitoring:

```typescript
await logger?.debug(`Resolving session path: ${filename} -> ${resolvedPath}`);
```

---

## Exploitability Assessment

### Attack Requirements
1. **Write access to manifest.json** OR
2. **Ability to influence session stamp** OR
3. **Compromised tool that accepts user input for stamps**

### Real-World Scenarios
1. **Multi-user environment:** User A crafts malicious manifest to access User B's files
2. **CI/CD compromise:** Build process injects malicious session configuration
3. **Social engineering:** Tricking user into importing malicious session export
4. **Backup restore:** Restoring compromised backup with malicious manifest

### Exploit Difficulty
- **Technical Difficulty:** Low (simple path traversal)
- **Prerequisites:** Medium (requires manifest write access)
- **Detection Difficulty:** High (looks like normal file operations)

---

## Immediate Action Items

### Before Merge
- [ ] Verify PR #12 doesn't break existing functionality
- [ ] Review all uses of `entry.file` in codebase

### After Merge (Critical)
- [ ] Create follow-up PR to fix remaining vulnerable locations
- [ ] Add comprehensive path traversal tests
- [ ] Implement input validation layer
- [ ] Add security audit logging

### Long-term
- [ ] Conduct security audit of all path construction
- [ ] Add security linting rules (e.g., detect unsanitized path joins)
- [ ] Document secure coding guidelines for path handling

---

## Conclusion

PR #12 provides a **partial fix** for the path traversal vulnerability. While it correctly addresses one attack vector (stamp parameter), the more dangerous vector (manifest entry.file) remains unpatched. 

**Risk remains HIGH** until all vulnerable code paths are sanitized.

**Recommendation:** Merge PR #12 as a first step, but treat this as a security incident requiring immediate follow-up to complete the fix.
