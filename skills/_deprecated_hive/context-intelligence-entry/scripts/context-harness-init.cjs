#!/usr/bin/env node
/**
 * Context Harness Init - Entry State Detection
 * 
 * Detects session state and context rot level for multi-agent IDE environments.
 * Outputs structured JSON for agent context inclusion.
 * 
 * Usage: node context-harness-init.js [--format json|markdown]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Detection dimensions
const DIMENSIONS = {
  GOVERNANCE: 'governance',
  TEMPORAL: 'temporal',
  DELEGATION: 'delegation',
  WORKFLOW: 'workflow',
  PLATFORM: 'platform'
};

// Session types
const SESSION_TYPES = {
  NEW: 'NEW',
  RESUMED: 'RESUMED',
  DEGRADED: 'DEGRADED',
  DELEGATED: 'DELEGATED',
  INTERRUPTED: 'INTERRUPTED'
};

// Rot levels
const ROT_LEVELS = {
  CLEAN: 0,
  SUSPECT: 1,
  DEGRADED: 2,
  POLLUTED: 3,
  POISONED: 4
};

// Trust weights
const TRUST_WEIGHTS = {
  LIVE_SDK: { weight: 1.0, score: 1.0 },
  USER_CONFIRM: { weight: 1.0, score: 1.0 },
  GIT_VERIFIED: { weight: 0.9, score: 0.95 },
  TYPE_CHECKED: { weight: 0.8, score: 0.9 },
  LOCAL_FILE: { weight: 0.7, score: 0.8 },
  DOCUMENTATION: { weight: 0.5, score: 0.5 },
  INHERITED: { weight: 0.4, score: 0.4 },
  UNVERIFIED: { weight: 0.1, score: 0.1 },
  CONTRADICTORY: { weight: 0.0, score: 0.0 }
};

/**
 * Count files matching pattern recursively
 */
function countFiles(dir, pattern, excludeDirs = []) {
  let count = 0;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (excludeDirs.includes(item.name)) continue;
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        count += countFiles(fullPath, pattern, excludeDirs);
      } else if (item.isFile()) {
        if (pattern.test(item.name)) {
          count++;
        }
      }
    }
  } catch (e) {
    // Directory doesn't exist or can't be read
  }
  return count;
}

/**
 * Find duplicate files by name across directories
 */
function findDuplicates(dir, filename, excludeDirs = []) {
  const found = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (excludeDirs.includes(item.name)) continue;
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        found.push(...findDuplicates(fullPath, filename, excludeDirs));
      } else if (item.isFile() && item.name === filename) {
        found.push(fullPath);
      }
    }
  } catch (e) {}
  return found;
}

/**
 * Check for context rot - focuses on RUNTIME pollution, not filesystem bloat
 * 
 * Context ROT counts:
 * - Plans pointing to broken/non-existent paths
 * - Implementation NOT linked to any plan  
 * - Conflicting governance in ACTIVE scope
 * - Broken symlinks (runtime errors)
 * - Merge conflicts (runtime blocking)
 * 
 * Filesystem BLOAT (NOT rot - doesn't affect runtime):
 * - Organized hierarchies across platforms
 * -Dormant directories not in scope
 * - Artifacts in proper places
 */
function checkContextFlood(projectDir) {
  const issues = [];
  let floodScore = 0;

  // Only check what's in ACTIVE runtime scope
  const primaryFramework = detectPrimaryFramework(projectDir);
  const activeScopeDirs = getActiveScopeDirs(projectDir, primaryFramework);
  
  // Check for broken plan -> implementation links (THIS IS ROT)
  const brokenLinks = checkBrokenPlanLinks(projectDir);
  if (brokenLinks.count > 0) {
    // Cap at 10 - broken links are bad but not catastrophic
    const cappedCount = Math.min(brokenLinks.count, 10);
    issues.push(`Broken plan links: ${brokenLinks.count} plans reference non-existent paths (capped at ${cappedCount})`);
    floodScore += cappedCount;
  }
  
  // Check for orphaned implementation (NOT linked to plan) - only in active scope
  const orphanedImpl = checkOrphanedImplementation(projectDir, activeScopeDirs);
  if (orphanedImpl.count > 0) {
    issues.push(`Orphaned implementation: ${orphanedImpl.count} code files without plan linkage`);
    floodScore += Math.min(orphanedImpl.count, 5);
  }

  // Check for conflicting governance in ACTIVE scope (THIS IS ROT)
  const governanceConflicts = checkGovernanceConflicts(projectDir, activeScopeDirs);
  if (governanceConflicts.count > 0) {
    issues.push(`Governance conflicts: ${governanceConflicts.count} conflicting authority files in active scope`);
    floodScore += governanceConflicts.count * 2; // Weighted higher
  }

  // Check for broken symlinks (runtime errors)
  try {
    const brokenSymlinks = parseInt(
      execSync('find . -xtype l 2>/dev/null | head -20 | wc -l', {
        cwd: projectDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim() || '0',
      10
    );
    if (brokenSymlinks > 0) {
      issues.push(`Broken symlinks: ${brokenSymlinks} (runtime errors)`);
      floodScore += Math.min(brokenSymlinks, 5);
    }
  } catch (e) {}

  // Check for merge conflict markers (runtime blocking) - but cap the score
  try {
    const mergeMarkers = execSync('grep -r "<<<<\\|====\\|>>>>" --include="*.ts" --include="*.js" --include="*.md" . 2>/dev/null | wc -l', {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    const markerCount = parseInt(mergeMarkers, 10) || 0;
    if (markerCount > 0) {
      // Merge conflicts are critical but cap at 10 for scoring
      const cappedCount = Math.min(markerCount, 10);
      issues.push(`Merge conflicts: ${markerCount} markers blocking runtime (score capped at ${cappedCount})`);
      floodScore += cappedCount;
    }
  } catch (e) {}

  // Count active planning docs (informational only)
  const activePlanningDocs = countActivePlanningDocs(projectDir, activeScopeDirs);
  
  return {
    hasFlood: floodScore > 0,
    floodScore,
    issues,
    runtimeContext: {
      primaryFramework: primaryFramework.name,
      activeScopeDirs: activeScopeDirs.map(d => path.basename(d)),
      brokenPlanLinks: brokenLinks.count,
      orphanedImpl: orphanedImpl.count,
      governanceConflicts: governanceConflicts.count
    },
    metrics: {
      activePlanningDocs,
      filesystemBloat: {
        note: 'Filesystem bloat does NOT count as rot - only affects storage, not runtime'
      }
    }
  };
}

/**
 * Detect primary framework (the one actually in use)
 */
function detectPrimaryFramework(projectDir) {
  // Check opencode.json for primary
  const opencodeJson = path.join(projectDir, 'opencode.json');
  if (fs.existsSync(opencodeJson)) {
    return { name: 'OpenCode', dir: '.opencode' };
  }
  
  // Check for Claude Code
  if (fs.existsSync(path.join(projectDir, 'CLAUDE.md'))) {
    return { name: 'Claude Code', dir: '.claude' };
  }
  
  // Default to first found
  const platforms = ['.opencode', '.claude', '.codex', '.cursor', '.gemini'];
  for (const dir of platforms) {
    if (fs.existsSync(path.join(projectDir, dir))) {
      return { name: dir.slice(1), dir };
    }
  }
  
  return { name: 'Unknown', dir: null };
}

/**
 * Get directories that are in ACTIVE runtime scope
 */
function getActiveScopeDirs(projectDir, primaryFramework) {
  const scope = [];
  
  // Always in scope
  scope.push(projectDir); // root
  scope.push(path.join(projectDir, 'src'));
  scope.push(path.join(projectDir, 'skills'));
  scope.push(path.join(projectDir, 'commands'));
  scope.push(path.join(projectDir, 'agents'));
  
  // Primary framework's scope
  if (primaryFramework.dir) {
    scope.push(path.join(projectDir, primaryFramework.dir));
  }
  
  // Active planning state
  const planningDir = path.join(projectDir, '.planning');
  if (fs.existsSync(planningDir)) {
    scope.push(planningDir);
  }
  
  return scope.filter(fs.existsSync);
}

/**
 * Check for broken plan links - ONLY trace the ACTIVE plan path
 * 
 * Single authoritative path:
 * 1. `.planning/` - active planning directory
 * 2. `task_plan.md` - active task plan (if exists)
 * 3. `.hivemind/session` - active session state
 * 
 * NOT checking all historical plans - those are archives, not rot
 */
function checkBrokenPlanLinks(projectDir) {
  let count = 0;
  const brokenLinks = [];
  
  // ONLY check the ACTIVE plan path - not all plans
  const activePlanPath = path.join(projectDir, 'task_plan.md');
  const planningDir = path.join(projectDir, '.planning');
  const sessionPath = path.join(projectDir, '.hivemind', 'session');
  
  // Check if active task_plan.md exists and has broken links
  if (fs.existsSync(activePlanPath)) {
    try {
      const content = fs.readFileSync(activePlanPath, 'utf-8');
      // Look for file references: src/path/to/file.ts or ./path/to/file
      const fileRefs = content.match(/(?:src\/[\w\/\-\.]+\.[a-z]+|\.\/[\w\/\-\.]+)/gi) || [];
      for (const ref of fileRefs) {
        const refPath = path.resolve(projectDir, ref);
        if (!fs.existsSync(refPath)) {
          count++;
          if (brokenLinks.length < 5) {
            brokenLinks.push({ plan: 'task_plan.md', brokenRef: ref });
          }
        }
      }
    } catch (e) {}
  }
  
  // Check active session state exists (if .hivemind/session referenced)
  if (fs.existsSync(sessionPath)) {
    try {
      const sessionContent = fs.readFileSync(sessionPath, 'utf-8');
      // Check if session references files that don't exist
      const sessionRefs = sessionContent.match(/["']([a-zA-Z0-9_\-\/\.]+\.(ts|js|json|md))["']/g) || [];
      for (const ref of sessionRefs) {
        const cleanedRef = ref.replace(/["']/g, '');
        const refPath = path.join(projectDir, cleanedRef);
        if (!fs.existsSync(refPath)) {
          count++;
          if (brokenLinks.length < 5) {
            brokenLinks.push({ plan: '.hivemind/session', brokenRef: cleanedRef });
          }
        }
      }
    } catch (e) {}
  }
  
  return { count, links: brokenLinks };
}

/**
 * Check for orphaned implementation - ONLY in active scope, not all files
 * 
 * Active scope files that should link to active plan:
 * - Files in src/ that are actively being worked on
 * - NOT checking all historical implementation
 */
function checkOrphanedImplementation(projectDir, activeScopeDirs) {
  let count = 0;
  
  // Only check if there's an active plan
  const activePlanPath = path.join(projectDir, 'task_plan.md');
  if (!fs.existsSync(activePlanPath)) {
    // No active plan = no orphan check needed
    return { count: 0 };
  }
  
  // Get files referenced in active plan
  const referencedFiles = new Set();
  try {
    const planContent = fs.readFileSync(activePlanPath, 'utf-8');
    const fileRefs = planContent.match(/(?:src\/[\w\/\-\.]+\.[a-z]+)/gi) || [];
    fileRefs.forEach(ref => referencedFiles.add(ref));
  } catch (e) {}
  
  // Check if src/ files exist without plan reference (SAMPLE, not exhaustive)
  const srcDir = path.join(projectDir, 'src');
  if (fs.existsSync(srcDir)) {
    try {
      // Only check first 20 src files as a sample
      const srcFiles = execSync('find src -name "*.ts" -type f 2>/dev/null | head -20', {
        cwd: projectDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim().split('\n').filter(Boolean);
      
      for (const srcFile of srcFiles) {
        // Skip test files
        if (srcFile.includes('.test.') || srcFile.includes('.spec.')) continue;
        if (!referencedFiles.has(srcFile)) {
          count++;
        }
      }
    } catch (e) {}
  }
  
  // Cap at 10 - this is a sample check, not exhaustive
  return { count: Math.min(count, 10) };
}

/**
 * Check for conflicting governance files in active scope
 */
function checkGovernanceConflicts(projectDir, activeScopeDirs) {
  let count = 0;
  const conflicts = [];
  
  // Check for multiple AGENTS.md in active scope
  const agentsFiles = [];
  for (const scopeDir of activeScopeDirs) {
    const agentsMd = path.join(scopeDir, 'AGENTS.md');
    if (fs.existsSync(agentsMd)) {
      agentsFiles.push(agentsMd);
    }
  }
  
  if (agentsFiles.length > 1) {
    count += agentsFiles.length - 1; // Each additional is a conflict
    conflicts.push({ type: 'AGENTS.md', files: agentsFiles });
  }
  
  // Check for multiple governanceClaims at same level
  // This is more complex - simplified for now
  
  return { count, conflicts };
}

/**
 * Count active planning documents (not filesystem bloat)
 */
function countActivePlanningDocs(projectDir, activeScopeDirs) {
  let count = 0;
  
  for (const scopeDir of activeScopeDirs) {
    try {
      const docs = execSync(`find "${scopeDir}" -name "*.md" -type f 2>/dev/null | wc -l`, {
        cwd: projectDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
count += parseInt(docs, 10) || 0;
    } catch (e) {}
  }
  
  return count;
}

/**
 * Check governance integrity
 */
function checkGovernanceIntegrity(projectDir) {
  const checks = {};
  let rotPoints = 0;

  // Check for AGENTS.md in root
  const agentsMd = path.join(projectDir, 'AGENTS.md');
  checks.agents_md_exists = fs.existsSync(agentsMd);
  if (!checks.agents_md_exists) {
    rotPoints += 2;
  }

  // Check for governance directories
  const govDirs = ['src/hooks', 'src/tools', 'src/plugin', 'src/commands'];
  checks.governance_dirs_exist = govDirs.every(d => {
    const govPath = path.join(projectDir, d);
    return fs.existsSync(govPath) || fs.existsSync(path.join(govPath, 'AGENTS.md'));
  });
  if (!checks.governance_dirs_exist) {
    rotPoints += 1;
  }

  // Check for formatters/linters (governance enforcement)
  const formatters = ['eslint', 'prettier', 'ruff', 'biome'];
  checks.formatters_configured = formatters.some(f => {
    return fs.existsSync(path.join(projectDir, `.${f}rc`)) ||
           fs.existsSync(path.join(projectDir, `${f}.config.js`)) ||
           fs.existsSync(path.join(projectDir, `.eslintrc.json`)) ||
           fs.existsSync(path.join(projectDir, `.prettierrc`));
  });
  if (!checks.formatters_configured) {
    rotPoints += 1;
  }

  // Check for tests directory
  checks.tests_exist = fs.existsSync(path.join(projectDir, 'tests')) ||
                       fs.existsSync(path.join(projectDir, 'test')) ||
                       fs.existsSync(path.join(projectDir, '__tests__'));
  if (!checks.tests_exist) {
    rotPoints += 1;
  }

  // Check for package.json or project config
  checks.project_config_exists = fs.existsSync(path.join(projectDir, 'package.json')) ||
                                  fs.existsSync(path.join(projectDir, 'Cargo.toml')) ||
                                  fs.existsSync(path.join(projectDir, 'pyproject.toml'));
  if (!checks.project_config_exists) {
    rotPoints += 2;
  }

  return { checks, rotPoints };
}

/**
 * Check temporal consistency
 */
function checkTemporalConsistency(projectDir) {
  const checks = {};
  let rotPoints = 0;

  const gitDir = path.join(projectDir, '.git');
  checks.is_git_repo = fs.existsSync(gitDir);

  if (checks.is_git_repo) {
    try {
      // Check for uncommitted changes
      const status = execSync('git status --porcelain', { 
        cwd: projectDir, 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      checks.has_uncommitted_changes = status.length > 0;
      if (checks.has_uncommitted_changes) {
        rotPoints += 1;
      }

      // Check last commit age
      const lastCommit = execSync('git log -1 --format="%ci"', { 
        cwd: projectDir, 
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      
      if (lastCommit) {
        const commitDate = new Date(lastCommit);
        const daysSince = (Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24);
        checks.last_commit_days_ago = Math.floor(daysSince);
        
        if (daysSince > 30) {
          checks.stale_commits = true;
          rotPoints += 2;
        } else if (daysSince > 7) {
          checks.stale_commits = true;
          rotPoints += 1;
        } else {
          checks.stale_commits = false;
        }
      }
    } catch (e) {
      checks.git_error = true;
      rotPoints += 1;
    }
  } else {
    checks.git_error = true;
    rotPoints += 1; // Not a git repo is suspicious for a project
  }

  // Check for future-dated files
  try {
    const files = execSync('find . -type f -newermt "+1 day" 2>/dev/null | head -5', {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    checks.has_future_dated_files = files.length > 0;
    if (checks.has_future_dated_files) {
      rotPoints += 2;
    }
  } catch (e) {
    checks.future_date_check_error = true;
  }

  return { checks, rotPoints };
}

/**
 * Check delegation scope
 */
function checkDelegationScope(projectDir) {
  const checks = {};
  let rotPoints = 0;

  const hivemindDir = path.join(projectDir, '.hivemind');
  const planningDir = path.join(projectDir, '.planning');
  const sisyphusDir = path.join(projectDir, '.sisyphus');

  // Check for session state
  checks.has_session_state = false;
  checks.has_delegation_marker = false;
  checks.has_interrupted_marker = false;

  if (fs.existsSync(hivemindDir)) {
    const sessionFile = path.join(hivemindDir, 'session');
    checks.has_session_state = fs.existsSync(sessionFile);

    const delegationFile = path.join(hivemindDir, 'delegation.json');
    checks.has_delegation_marker = fs.existsSync(delegationFile);

    const interruptedFile = path.join(hivemindDir, '.interrupted');
    checks.has_interrupted_marker = fs.existsSync(interruptedFile);
  }

  // Check for multiple context directories (confusion)
  checks.multiple_context_dirs = 0;
  if (fs.existsSync(hivemindDir)) checks.multiple_context_dirs++;
  if (fs.existsSync(planningDir)) checks.multiple_context_dirs++;
  if (fs.existsSync(sisyphusDir)) checks.multiple_context_dirs++;

  if (checks.multiple_context_dirs > 1) {
    rotPoints += 1; // Multiple context directories = potential confusion
  }

  // Check for state inconsistency
  if (checks.has_delegation_marker) {
    try {
      const delegationData = JSON.parse(
        fs.readFileSync(path.join(hivemindDir, 'delegation.json'), 'utf-8')
      );
      checks.delegation_has_scope = !!delegationData.scope;
      checks.delegation_has_task = !!delegationData.task;
      checks.delegation_has_boundaries = !!delegationData.boundaries;
      
      if (!checks.delegation_has_scope || !checks.delegation_has_task) {
        rotPoints += 1; // Incomplete delegation
      }
    } catch (e) {
      checks.delegation_parse_error = true;
      rotPoints += 2;
    }
  }

  return { checks, rotPoints };
}

/**
 * Check workflow integrity
 */
function checkWorkflowIntegrity(projectDir) {
  const checks = {};
  let rotPoints = 0;

  // Check for plan documents without implementation
  const plansDir = path.join(projectDir, '.planning');
  const plansExist = fs.existsSync(plansDir);
  
  if (plansExist) {
    try {
      const planFiles = execSync('find .planning -name "*.md" -type f 2>/dev/null | wc -l', {
        cwd: projectDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      checks.plan_files_count = parseInt(planFiles, 10) || 0;

      // Check for orphaned plans (old, uncompleted)
      const oldPlans = execSync('find .planning -name "*.md" -type f -mtime +7 2>/dev/null | wc -l', {
        cwd: projectDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      checks.orphaned_plan_files = parseInt(oldPlans, 10) || 0;

      if (checks.orphaned_plan_files > 10) {
        rotPoints += 2;
      } else if (checks.orphaned_plan_files > 5) {
        rotPoints += 1;
      }
    } catch (e) {
      checks.plan_check_error = true;
    }
  }

  // Check for test failures or incomplete implementations
  const testsDir = path.join(projectDir, 'tests');
  checks.tests_exist = fs.existsSync(testsDir);

  // Check for TODO/FIXME accumulation
  try {
    const todoCount = execSync('grep -r "TODO\\|FIXME\\|XXX\\|HACK" --include="*.ts" --include="*.js" --include="*.py" . 2>/dev/null | wc -l', {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    checks.todo_fixme_count = parseInt(todoCount, 10) || 0;

    if (checks.todo_fixme_count > 100) {
      rotPoints += 2;
    } else if (checks.todo_fixme_count > 50) {
      rotPoints += 1;
    }
  } catch (e) {
    checks.todo_check_error = true;
  }

  // Check for incomplete merge/rebase
  try {
    const mergeMarkers = execSync('grep -r "<<<<\\|====\\|>>>>" --include="*.ts" --include="*.js" . 2>/dev/null | wc -l', {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    checks.merge_conflict_markers = parseInt(mergeMarkers, 10) || 0;

    if (checks.merge_conflict_markers > 0) {
      rotPoints += 3; // Merge conflicts are critical
    }
  } catch (e) {
    checks.merge_check_error = true;
  }

  return { checks, rotPoints };
}

/**
 * Check platform surface - DETECT FRAMEWORKS
 */
function checkPlatformSurface(projectDir) {
  const checks = {};
  let rotPoints = 0;

  // Define platform directories and their framework signatures
  const FRAMEWORK_SIGNATURES = {
    '.opencode': {
      name: 'OpenCode',
      primary: ['opencode.json', 'AGENTS.md'],
      secondary: ['commands/', 'agents/', 'get-shit-done/'],
      skill_indicator: 'skills/',
      weight: 1.0
    },
    '.claude': {
      name: 'Claude Code',
      primary: ['CLAUDE.md'],
      secondary: ['commands/', 'skills/'],
      skill_indicator: 'skills/',
      weight: 0.9
    },
    '.codex': {
      name: 'Codex',
      primary: ['CODEX.md'],
      secondary: ['commands/', 'skills/'],
      skill_indicator: 'skills/',
      weight: 0.8
    },
    '.github': {
      name: 'GitHub',
      primary: ['skills/gsd-'],
      secondary: ['get-shit-done/'],
      skill_indicator: 'skills/',
      weight: 0.7
    },
    '.qwen': {
      name: 'Qwen',
      primary: ['QWEN.md'],
      secondary: ['skills/'],
      skill_indicator: 'skills/',
      weight: 0.6
    },
    '.roo': {
      name: 'Roo',
      primary: ['ROO.md'],
      secondary: ['skills/'],
      skill_indicator: 'skills/',
      weight: 0.5
    },
    '.cursor': {
      name: 'Cursor',
      primary: ['cursor.json', '.cursorrules'],
      secondary: ['skills/', 'commands/'],
      skill_indicator: 'skills/',
      weight: 0.7
    },
    '.windsurf': {
      name: 'Windsurf',
      primary: [],
      secondary: ['skills/', 'commands/'],
      skill_indicator: 'skills/',
      weight: 0.5
    },
    '.gemini': {
      name: 'Gemini',
      primary: [],
      secondary: ['agents/', 'commands/', 'get-shit-done/'],
      skill_indicator: 'skills/',
      weight: 0.5
    },
    '.agent': {
      name: 'Agent',
      primary: ['AGENT.md'],
      secondary: ['skills/'],
      skill_indicator: 'skills/',
      weight: 0.6
    },
    '.crush': {
      name: 'Crush',
      primary: [],
      secondary: ['skills/', 'planning-with-files/'],
      skill_indicator: 'skills/',
      weight: 0.4
    },
    '.sisyphus': {
      name: 'Sisyphus',
      primary: ['plans/'],
      secondary: [],
      skill_indicator: 'skills/',
      weight: 0.5
    },
    '.qoder': {
      name: 'Qoder',
      primary: [],
      secondary: ['skills/', 'planning-with-files/'],
      skill_indicator: 'skills/',
      weight: 0.4
    },
    '.kilocode': {
      name: 'KiloCode',
      primary: [],
      secondary: ['skills/'],
      skill_indicator: 'skills/',
      weight: 0.4
    },
    '.iflow': {
      name: 'iFlow',
      primary: [],
      secondary: ['skills/'],
      skill_indicator: 'skills/',
      weight: 0.4
    },
    '.factory': {
      name: 'Factory',
      primary: [],
      secondary: ['skills/'],
      skill_indicator: 'skills/',
      weight: 0.4
    },
    '.trae': {
      name: 'Trae',
      primary: [],
      secondary: ['skills/'],
      skill_indicator: 'skills/',
      weight: 0.4
    },
    '.beads': {
      name: 'Beads',
      primary: [],
      secondary: [],
      skill_indicator: 'skills/',
      weight: 0.3
    }
  };

  // Detect which frameworks are present
  const detectedFrameworks = [];
  
  for (const [dir, config] of Object.entries(FRAMEWORK_SIGNATURES)) {
    const basePath = path.join(projectDir, dir);
    
    if (!fs.existsSync(basePath)) {
      continue;
    }

    let score = 0;
    const reasons = [];
    const findings = [];

    // Check primary indicators (highest weight)
    for (const indicator of config.primary) {
      if (indicator.includes('/')) {
        // It's a subdirectory
        if (fs.existsSync(path.join(basePath, indicator))) {
          score += config.weight * 0.5;
          reasons.push(`Has primary: ${indicator}`);
        }
      } else {
        // It's a file
        if (fs.existsSync(path.join(basePath, indicator))) {
          score += config.weight * 0.5;
          reasons.push(`Has primary: ${indicator}`);
        }
      }
    }

    // Check secondary indicators
    for (const indicator of config.secondary) {
      if (fs.existsSync(path.join(basePath, indicator))) {
        score += config.weight * 0.25;
        findings.push(`Has secondary: ${indicator}`);
      }
    }

    // Count skills
    const skillsDir = path.join(basePath, config.skill_indicator);
    if (fs.existsSync(skillsDir)) {
      try {
        const skillCount = parseInt(
          execSync(`find "${dir}/${config.skill_indicator}" -name "SKILL.md" 2>/dev/null | wc -l`, {
            cwd: projectDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          }).trim() || '0',
          10
        );
        if (skillCount > 0) {
          score += Math.min(skillCount * 0.05, config.weight * 0.3);
          findings.push(`${skillCount} skills`);
        }
      } catch (e) {}
    }

    // Count commands/agents
    try {
      const cmdAgentCount = parseInt(
        execSync(`find "${dir}" -name "*.md" 2>/dev/null | wc -l`, {
          cwd: projectDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        }).trim() || '0',
        10
      );
      if (cmdAgentCount > 5) {
        score += Math.min(cmdAgentCount * 0.02, config.weight * 0.2);
        findings.push(`${cmdAgentCount} .md files`);
      }
    } catch (e) {}

    if (score > 0) {
      detectedFrameworks.push({
        directory: dir,
        name: config.name,
        score: Math.round(score * 100) / 100,
        reasons,
        findings,
        skill_count: countFiles(skillsDir, /SKILL\.md$/, [])
      });
    }
  }

  // Sort by score descending
  detectedFrameworks.sort((a, b) => b.score - a.score);

  // Determine primary framework (highest score)
  const primaryFramework = detectedFrameworks.length > 0 ? detectedFrameworks[0] : null;

  // Check for framework conflicts (multiple high-scoring frameworks)
  checks.primary_framework = primaryFramework ? primaryFramework.name : 'NONE';
  checks.primary_framework_dir = primaryFramework ? primaryFramework.directory : null;
  checks.primary_framework_score = primaryFramework ? primaryFramework.score : 0;
  checks.all_frameworks = detectedFrameworks;
  
  // Framework conflict detection
  if (detectedFrameworks.length >= 3) {
    const top3 = detectedFrameworks.slice(0, 3);
    if (top3[0].score - top3[1].score < 0.3 && top3[1].score - top3[2].score < 0.3) {
      checks.framework_conflict = true;
      checks.conflict_reason = `Multiple frameworks with similar presence: ${top3.map(f => f.name).join(', ')}`;
      rotPoints += 2;
    }
  }

  // Context bloat from too many frameworks
  if (detectedFrameworks.length > 6) {
    checks.context_bloat = true;
    rotPoints += 1;
  }

  // Check for duplicate skills across platforms (pollution source)
  checks.duplicate_skills = [];
  const seenSkills = new Map();
  
  for (const fw of detectedFrameworks) {
    if (fw.skill_count > 0) {
      // Check each skill in this framework
      const fwPath = path.join(projectDir, fw.directory, 'skills');
      if (fs.existsSync(fwPath)) {
        try {
          const skillFiles = execSync(`find "${fw.directory}/skills" -name "SKILL.md" -type f 2>/dev/null`, {
            cwd: projectDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          }).trim().split('\n').filter(Boolean);
          
          for (const skillPath of skillFiles) {
            const skillName = path.basename(path.dirname(skillPath)); // Parent dir is skill name
            if (seenSkills.has(skillName)) {
              checks.duplicate_skills.push({
                skill: skillName,
                locations: [seenSkills.get(skillName), fw.directory]
              });
            } else {
              seenSkills.set(skillName, fw.directory);
            }
          }
        } catch (e) {}
      }
    }
  }

  if (checks.duplicate_skills.length > 10) {
    rotPoints += 2;
    checks.duplicate_skills_warning = `${checks.duplicate_skills.length} skills duplicated across platforms`;
  }

  // Platform directories summary
  checks.platform_dirs_found = detectedFrameworks.map(f => f.directory);
  checks.platform_dirs_count = detectedFrameworks.length;

  // Check for root skills
  checks.has_root_skills = fs.existsSync(path.join(projectDir, 'skills'));
  checks.root_skill_count = checks.has_root_skills 
    ? countFiles(path.join(projectDir, 'skills'), /SKILL\.md$/, []) 
    : 0;

  // Check for broken symlinks
  try {
    const brokenSymlinks = parseInt(
      execSync('find . -xtype l 2>/dev/null | head -10 | wc -l', {
        cwd: projectDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim() || '0',
      10
    );
    checks.broken_symlinks = brokenSymlinks;

    if (brokenSymlinks > 5) {
      rotPoints += 2;
    } else if (brokenSymlinks > 0) {
      rotPoints += 1;
    }
  } catch (e) {
    checks.symlink_check_error = true;
  }

  // Build framework reasoning
  checks.framework_reasoning = [];
  if (primaryFramework) {
    checks.framework_reasoning.push(
      `PRIMARY: ${primaryFramework.name} (${primaryFramework.directory}) with score ${primaryFramework.score}`
    );
    if (primaryFramework.reasons.length > 0) {
      checks.framework_reasoning.push(`  Evidence: ${primaryFramework.reasons.join(', ')}`);
    }
    if (primaryFramework.findings.length > 0) {
      checks.framework_reasoning.push(`  Findings: ${primaryFramework.findings.join(', ')}`);
    }
    
    // Suggest framework-specific approach
    if (primaryFramework.directory === '.opencode') {
      checks.framework_suggestion = 'Use OpenCode-native commands and GSD workflows';
    } else if (primaryFramework.directory === '.claude') {
      checks.framework_suggestion = 'Use CLAUDE.md directives and task artifacts';
    } else if (primaryFramework.directory === '.github') {
      checks.framework_suggestion = 'Use GitHub-native actions and skills';
    } else {
      checks.framework_suggestion = `Use ${primaryFramework.name} conventions`;
    }
  }

  if (detectedFrameworks.length > 1) {
    checks.other_frameworks = detectedFrameworks
      .slice(1, 4)
      .map(f => `${f.name} (${f.score})`)
      .join(', ');
    checks.framework_reasoning.push(
      `OTHER DETECTED: ${checks.other_frameworks}`
    );
  }

  return { checks, rotPoints };
}

/**
 * Detect session type based on environment signals
 */
function detectSessionType(projectDir) {
  const hivemindDir = path.join(projectDir, '.hivemind');
  
  // Check for interrupted marker
  if (fs.existsSync(path.join(hivemindDir, '.interrupted'))) {
    return SESSION_TYPES.INTERRUPTED;
  }
  
  // Check for delegation marker
  if (fs.existsSync(path.join(hivemindDir, 'delegation.json'))) {
    return SESSION_TYPES.DELEGATED;
  }
  
  // Check for session state (resumed)
  if (fs.existsSync(path.join(hivemindDir, 'session'))) {
    // Check for gaps (degraded)
    try {
      const sessionStat = fs.statSync(path.join(hivemindDir, 'session'));
      const hoursSinceMod = (Date.now() - sessionStat.mtime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceMod > 24) {
        return SESSION_TYPES.DEGRADED;
      }
    } catch (e) {}
    return SESSION_TYPES.RESUMED;
  }
  
  return SESSION_TYPES.NEW;
}

/**
 * Calculate rot level from checks
 */
function calculateRotLevel(governance, temporal, delegation, workflow, platform, flood) {
  let totalRotPoints = 0;
  let criticalIssues = 0;

  totalRotPoints += governance.rotPoints;
  totalRotPoints += temporal.rotPoints;
  totalRotPoints += delegation.rotPoints;
  totalRotPoints += workflow.rotPoints;
  totalRotPoints += platform.rotPoints;
  totalRotPoints += flood.floodScore;

  // Critical issues
  if (workflow.checks.merge_conflict_markers > 0) criticalIssues++;
  if (flood.floodScore > 5) criticalIssues++;
  if (!governance.checks.agents_md_exists) criticalIssues++;

  // Calculate level based on rot points
  if (criticalIssues > 0 || totalRotPoints >= 15) {
    return { level: ROT_LEVELS.POISONED, name: 'POISONED', score: totalRotPoints };
  }
  if (totalRotPoints >= 10) {
    return { level: ROT_LEVELS.POLLUTED, name: 'POLLUTED', score: totalRotPoints };
  }
  if (totalRotPoints >= 5) {
    return { level: ROT_LEVELS.DEGRADED, name: 'DEGRADED', score: totalRotPoints };
  }
  if (totalRotPoints >= 2) {
    return { level: ROT_LEVELS.SUSPECT, name: 'SUSPECT', score: totalRotPoints };
  }
  return { level: ROT_LEVELS.CLEAN, name: 'CLEAN', score: totalRotPoints };
}

/**
 * Calculate trust score
 */
function calculateTrustScore(governance, temporal, platform) {
  const signals = [];

  // Git-verified
  if (temporal.checks.is_git_repo && !temporal.checks.git_error) {
    signals.push({ type: 'GIT_VERIFIED', applicable: true, score: 0.95, source: 'git status verified' });
  } else {
    signals.push({ type: 'GIT_VERIFIED', applicable: false, score: 0, source: 'not a git repo or error' });
  }

  // Governance files exist
  if (governance.checks.agents_md_exists) {
    signals.push({ type: 'DOCUMENTATION', applicable: true, score: 0.5, source: 'AGENTS.md exists' });
  }

  // Local file system accessible
  signals.push({ type: 'LOCAL_FILE', applicable: true, score: 0.8, source: 'file system accessible' });

  // Project config
  if (governance.checks.project_config_exists) {
    signals.push({ type: 'TYPE_CHECKED', applicable: true, score: 0.9, source: 'project config exists' });
  }

  // Tests exist
  if (governance.checks.tests_exist) {
    signals.push({ type: 'DOCUMENTATION', applicable: true, score: 0.5, source: 'tests directory exists' });
  }

  // Platform directories
  if (platform.checks.platform_dirs_count > 0) {
    signals.push({ type: 'DOCUMENTATION', applicable: true, score: 0.3, source: `${platform.checks.platform_dirs_count} platform dirs` });
  }

  // Calculate effective trust
  let totalWeight = 0;
  let weightedScore = 0;
  const breakdown = {};

  for (const signal of signals) {
    if (signal.applicable) {
      const weight = TRUST_WEIGHTS[signal.type]?.weight || 0.5;
      const score = signal.score || TRUST_WEIGHTS[signal.type]?.score || 0.5;
      
      totalWeight += weight;
      weightedScore += weight * score;
      breakdown[signal.type] = { weight, score, contribution: weight * score };
    }
  }

  const effectiveTrust = totalWeight > 0 ? weightedScore / totalWeight : 0.5;
  
  return {
    score: Math.round(effectiveTrust * 100) / 100,
    level: effectiveTrust >= 0.8 ? 'HIGH' : effectiveTrust >= 0.6 ? 'MEDIUM' : 'LOW',
    signals,
    breakdown
  };
}

/**
 * Calculate action gates
 */
function calculateActionGates(trustScore, rotLevel) {
  return {
    read_files: trustScore >= 0.4,
    write_files: trustScore >= 0.6 && rotLevel <= ROT_LEVELS.DEGRADED,
    delete_files: trustScore >= 0.8 && rotLevel <= ROT_LEVELS.SUSPECT,
    execute_commands: trustScore >= 0.7 && rotLevel <= ROT_LEVELS.DEGRADED,
    delegate: trustScore >= 0.6 && rotLevel <= ROT_LEVELS.POLLUTED,
    claim_completion: trustScore >= 0.8 && rotLevel <= ROT_LEVELS.DEGRADED
  };
}

/**
 * Generate recommendations
 */
function generateRecommendations(sessionType, rotLevel, flood, governance, temporal, workflow) {
  const recommendations = [];

  // Context flood recommendations
  if (flood.hasFlood) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Cleanup duplicate documentation and planning files',
      reason: `Context flood detected: ${flood.issues.join(', ')}`
    });
  }

  // Rot-based recommendations
  if (rotLevel >= ROT_LEVELS.DEGRADED) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Assess context integrity before proceeding',
      reason: `Context rot level: ${rotLevel}`
    });
  }

  if (rotLevel >= ROT_LEVELS.POLLUTED) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'Stop and rebuild context from authoritative sources',
      reason: `Context is polluted or poisoned`
    });
  }

  // Merge conflicts
  if (workflow.checks.merge_conflict_markers > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'Resolve merge conflicts before continuing',
      reason: `${workflow.checks.merge_conflict_markers} merge conflict markers found`
    });
  }

  // Session type recommendations
  if (sessionType === SESSION_TYPES.INTERRUPTED) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Re-establish truth and check what completed',
      reason: 'Interrupted session - partial state possible'
    });
  }

  if (sessionType === SESSION_TYPES.DEGRADED) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Rebuild context from authoritative sources',
      reason: 'Degraded session - significant context drift'
    });
  }

  if (sessionType === SESSION_TYPES.DELEGATED) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Verify delegation scope and boundaries',
      reason: 'Delegated session - understand inherited vs own scope'
    });
  }

  // Governance recommendations
  if (!governance.checks.agents_md_exists) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Create AGENTS.md governance file',
      reason: 'No governance file found'
    });
  }

  // Temporal recommendations
  if (temporal.checks.stale_commits) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Review uncommitted changes and recent activity',
      reason: `Last commit was ${temporal.checks.last_commit_days_ago} days ago`
    });
  }

  return recommendations;
}

/**
 * Main detection function
 */
function runDetection() {
  const startTime = Date.now();
  const projectDir = process.cwd();
  
  // Run all checks
  const flood = checkContextFlood(projectDir);
  const governance = checkGovernanceIntegrity(projectDir);
  const temporal = checkTemporalConsistency(projectDir);
  const delegation = checkDelegationScope(projectDir);
  const workflow = checkWorkflowIntegrity(projectDir);
  const platform = checkPlatformSurface(projectDir);

  // Detect session type
  const sessionType = detectSessionType(projectDir);

  // Calculate rot level
  const rotResult = calculateRotLevel(governance, temporal, delegation, workflow, platform, flood);

  // Calculate trust score
  const trustResult = calculateTrustScore(governance, temporal, platform);

  // Calculate action gates
  const actionGates = calculateActionGates(trustResult.score, rotResult.level);

  // Generate recommendations
  const recommendations = generateRecommendations(sessionType, rotResult.name, flood, governance, temporal, workflow);

  // Build result
  const result = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    duration_ms: Date.now() - startTime,
    
    // Session classification
    session_type: sessionType,
    
    // Rot assessment
    rot_level: rotResult.name,
    rot_score: rotResult.score,
    rot_points: {
      governance: governance.rotPoints,
      temporal: temporal.rotPoints,
      delegation: delegation.rotPoints,
      workflow: workflow.rotPoints,
      platform: platform.rotPoints,
      flood: flood.floodScore
    },
    
    // Trust scoring
    trust: {
      score: trustResult.score,
      level: trustResult.level,
      signals: trustResult.signals,
      breakdown: trustResult.breakdown
    },
    
    // Dimension details
    dimensions: {
      governance_integrity: {
        checks: governance.checks,
        rot_points: governance.rotPoints
      },
      temporal_consistency: {
        checks: temporal.checks,
        rot_points: temporal.rotPoints
      },
      delegation_scope: {
        checks: delegation.checks,
        rot_points: delegation.rotPoints
      },
      workflow_integrity: {
        checks: workflow.checks,
        rot_points: workflow.rotPoints
      },
      platform_surface: {
        checks: platform.checks,
        rot_points: platform.rotPoints
      }
    },
    
    // Context flood special check
    context_flood: {
      has_flood: flood.hasFlood,
      flood_score: flood.floodScore,
      issues: flood.issues,
      metrics: flood.metrics
    },
    
    // Action gates
    action_gate: actionGates,
    
    // Recommendations
    recommendations: recommendations
  };

  return result;
}

/**
 * Output result
 */
function output(result, format = 'json') {
  if (format === 'markdown') {
    console.log('# Context Harness Report\n');
    console.log(`**Timestamp:** ${result.timestamp}`);
    console.log(`**Version:** ${result.version}`);
    console.log(`**Duration:** ${result.duration_ms}ms\n`);
    
    console.log('## Session State\n');
    console.log(`**Type:** ${result.session_type}`);
    console.log(`**Rot Level:** ${result.rot_level} (${result.rot_score} points)\n`);
    
    console.log('## Trust Score\n');
    console.log(`**Score:** ${result.trust.score}`);
    console.log(`**Level:** ${result.trust.level}\n`);
    
    console.log('## Action Gates\n');
    console.log('| Action | Permitted |');
    console.log('|--------|-----------|');
    for (const [action, permitted] of Object.entries(result.action_gate)) {
      console.log(`| ${action} | ${permitted ? '✓' : '✗'} |`);
    }
    console.log('');
    
    if (result.context_flood.has_flood) {
      console.log('## ⚠️ Context Flood Detected\n');
      console.log(`**Flood Score:** ${result.context_flood.flood_score}`);
      console.log(`**Issues:** ${result.context_flood.issues.join(', ')}\n`);
    }
    
    console.log('## Recommendations\n');
    for (const rec of result.recommendations) {
      console.log(`- **[${rec.priority}]** ${rec.action} - ${rec.reason}`);
    }
    
    console.log('## Framework Detection\n');
    const platform = result.dimensions.platform_surface;
    if (platform.checks.primary_framework) {
      console.log(`**Primary:** ${platform.checks.primary_framework}`);
      console.log(`**Directory:** ${platform.checks.primary_framework_dir}`);
      console.log(`**Score:** ${platform.checks.primary_framework_score}\n`);
      
      if (platform.checks.framework_suggestion) {
        console.log(`**Suggestion:** ${platform.checks.framework_suggestion}\n`);
      }
      
      if (platform.checks.all_frameworks && platform.checks.all_frameworks.length > 1) {
        console.log('**Other Detected Platforms:**');
        for (const fw of platform.checks.all_frameworks.slice(1, 5)) {
          console.log(`  - ${fw.name} (${fw.directory}): score ${fw.score}`);
        }
        console.log('');
      }
      
      if (platform.checks.duplicate_skills && platform.checks.duplicate_skills.length > 0) {
        console.log(`**⚠️ Duplicate Skills:** ${platform.checks.duplicate_skills.length} skills exist across multiple platforms`);
        console.log('');
      }
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

// CLI entry point
const args = process.argv.slice(2);

// Granular control flags
const FLAGS = {
  '--quick': 'Quick check - only PRIMARY path, skip exhaustive scans',
  '--full': 'Full check - all dimensions (default)',
  '--cache': 'Use cached result if < 1 hour old',
  '--force': 'Force re-run even if cache exists',
  '--fix': 'Output suggested fixes for detected issues',
  '--path-only': 'Only check path validation, skip other dimensions',
  '--json': 'Output as JSON (default)',
  '--markdown': 'Output as markdown'
};

// Parse flags
const useCache = args.includes('--cache');
const forceRun = args.includes('--force');
const quickMode = args.includes('--quick');
const pathOnly = args.includes('--path-only');
const showFixes = args.includes('--fix');
const formatArg = args.find(a => a.startsWith('--format')) || (args.includes('--markdown') ? '--format=markdown' : '--format=json');
const format = formatArg.includes('=') ? formatArg.split('=')[1] : 'json';

// Cache file path
const CACHE_FILE = path.join(process.cwd(), '.hivemind', 'context-check.json');

/**
 * Check cache validity
 */
function getCachedResult() {
  if (!useCache && !forceRun) return null;
  
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    
    if (cacheAge < ONE_HOUR && !forceRun) {
      return cached;
    }
  } catch (e) {}
  
  return null;
}

/**
 * Write cache
 */
function writeCache(result) {
  try {
    const hivemindDir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(hivemindDir)) {
      fs.mkdirSync(hivemindDir, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(result, null, 2));
  } catch (e) {}
}

/**
 * Deterministic rot check - PASS/FAIL with specific criteria
 * No scores, no heuristics - just clear pass/fail
 */
function runRotCheck(projectDir) {
  const failures = [];
  const passes = [];
  
  // Check 1: Governance - AGENTS.md exists
  const agentsMd = path.join(projectDir, 'AGENTS.md');
  if (fs.existsSync(agentsMd)) {
    passes.push({ check: 'governance', reason: 'AGENTS.md exists' });
  } else {
    failures.push({ check: 'governance', reason: 'AGENTS.md missing', fix: 'Create AGENTS.md in project root' });
  }
  
  // Check 2: Session - exists or first run
  const sessionFile = path.join(projectDir, '.hivemind', 'session');
  if (!fs.existsSync(sessionFile)) {
    passes.push({ check: 'session', reason: 'First run (no session needed)' });
  } else {
    try {
      JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      passes.push({ check: 'session', reason: 'Session valid and readable' });
    } catch (e) {
      failures.push({ check: 'session', reason: 'Session corrupt/unreadable', fix: 'Delete .hivemind/session' });
    }
  }
  
  // Check 3: Git - clean working tree (merge conflicts)
  try {
    const gitDir = path.join(projectDir, '.git');
    if (fs.existsSync(gitDir)) {
      // Check for merge conflict markers in tracked files
      const conflicts = execSync(
        'git diff --check 2>/dev/null || true',
        { cwd: projectDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      
      // Also check for conflict markers in files
      const conflictMarkers = execSync(
        'grep -r "<<<<<<\\|======\\|>>>>>>" --include="*.ts" --include="*.js" --include="*.md" . 2>/dev/null | head -5 || true',
        { cwd: projectDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
      ).trim();
      
      if (conflicts.length === 0 && conflictMarkers.length === 0) {
        passes.push({ check: 'git', reason: 'Clean working tree' });
      } else {
        failures.push({ 
          check: 'git', 
          reason: 'Merge conflict markers in tracked files',
          fix: 'Run: git mergetool to resolve conflicts'
        });
      }
    } else {
      passes.push({ check: 'git', reason: 'Not a git repository (skipped)' });
    }
  } catch (e) {
    passes.push({ check: 'git', reason: 'Git check skipped (not critical)' });
  }
  
  // Check 4: Plan - task_plan.md references exist
  const taskPlan = path.join(projectDir, 'task_plan.md');
  if (fs.existsSync(taskPlan)) {
    try {
      const content = fs.readFileSync(taskPlan, 'utf-8');
      const refs = content.match(/(?:src\/[\w\/\-\.]+\.[a-z]+)/gi) || [];
      const brokenRefs = [];
      
      for (const ref of refs.slice(0, 20)) { // Check first 20 refs
        if (!fs.existsSync(path.join(projectDir, ref))) {
          brokenRefs.push(ref);
        }
      }
      
      if (brokenRefs.length === 0) {
        passes.push({ check: 'plan', reason: `All ${refs.length} references valid` });
      } else {
        failures.push({
          check: 'plan',
          reason: `${brokenRefs.length} references in task_plan.md don't exist`,
          details: brokenRefs.slice(0, 5),
          fix: 'Update task_plan.md with correct file paths'
        });
      }
    } catch (e) {
      passes.push({ check: 'plan', reason: 'task_plan.md readable' });
    }
  } else {
    passes.push({ check: 'plan', reason: 'No active task_plan.md (skipped)' });
  }
  
  // Check 5: Trust - single authority in scope
  const authorityFiles = [];
  const scopeDirs = ['.', 'src', 'skills', 'commands', 'agents'];
  
  for (const dir of scopeDirs) {
    const authorityPath = path.join(projectDir, dir, 'AGENTS.md');
    if (fs.existsSync(authorityPath)) {
      authorityFiles.push(authorityPath);
    }
  }
  
  if (authorityFiles.length <= 1) {
    passes.push({ check: 'trust', reason: `Single authority: ${authorityFiles[0] || 'root AGENTS.md'}` });
  } else {
    failures.push({
      check: 'trust',
      reason: `Multiple AGENTS.md in scope: ${authorityFiles.length}`,
      details: authorityFiles,
      fix: 'Keep only primary AGENTS.md, remove or symlink others'
    });
  }
  
  // Deterministic result
  const passed = failures.length === 0;
  
  return {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    mode: 'rot-check',
    duration_ms: 0, // Set by caller
    result: passed ? 'PASS' : 'FAIL',
    passed,
    checks: {
      total: passes.length + failures.length,
      passed: passes.length,
      failed: failures.length
    },
    passes,
    failures,
    action_gate: {
      read_files: true,
      write_files: passed,
      delete_files: passed && failures.filter(f => f.check === 'git').length === 0,
      execute_commands: passed,
      delegate: true,
      claim_completion: passed && failures.length === 0
    }
  };
}

/**
 * Quick state read - run EVERY time for workflow continuity
 * Fast (~50ms), no exhaustive scans, just state continuity
 */
function runQuickCheck(projectDir) {
  const checks = {
    task_plan_exists: fs.existsSync(path.join(projectDir, 'task_plan.md')),
    agents_md_exists: fs.existsSync(path.join(projectDir, 'AGENTS.md')),
    session_exists: fs.existsSync(path.join(projectDir, '.hivemind', 'session')),
    git_clean: false,
    session_stale: false
  };
  
  let issues = [];
  
  // Quick git status
  try {
    const status = execSync('git status --porcelain 2>/dev/null', {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    checks.git_clean = status.length === 0;
    if (!checks.git_clean) {
      issues.push(`Uncommitted changes: ${status.split('\n').length} files`);
    }
  } catch (e) {
    checks.git_clean = true; // Assume clean if git unavailable
  }
  
  // Check session staleness
  if (checks.session_exists) {
    try {
      const stat = fs.statSync(path.join(projectDir, '.hivemind', 'session'));
      const hoursSince = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        checks.session_stale = true;
        issues.push(`Session stale: ${Math.floor(hoursSince)}h old`);
      }
    } catch (e) {}
  }
  
  return {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    mode: 'quick',
    duration_ms: 0, // Will be set by caller
    session_type: checks.session_exists ? 'RESUMED' : 'NEW',
    state: checks,
    issues,
    can_proceed: checks.agents_md_exists && (!checks.session_exists || !checks.session_stale)
  };
}

/**
 * Full rot check - run ONLY when explicitly requested
 * Expensive (~5s), exhaustive analysis - DEPRECATED, use runRotCheck
 */
function runFullCheck(projectDir) {
  return runDetection();
}

/**
 * Generate fix suggestions
 */
function generateFixes(result) {
  const fixes = [];
  
  if (result.context_flood?.issues) {
    for (const issue of result.context_flood.issues) {
      if (issue.includes('Merge conflicts')) {
        fixes.push({
          issue: 'Merge conflicts',
          fix: 'Run: git mergetool or resolve conflicts manually',
          priority: 'CRITICAL'
        });
      }
      if (issue.includes('Governance conflicts')) {
        fixes.push({
          issue: 'Multiple AGENTS.md in scope',
          fix: 'Keep only PRIMARY AGENTS.md, symlink others or remove',
          priority: 'HIGH'
        });
      }
    }
  }
  
  if (result.rot_level === 'POISONED' || result.rot_level === 'POLLUTED') {
    fixes.push({
      issue: 'Context rot detected',
      fix: 'Run: hm-init --clean to rebuild context',
      priority: 'CRITICAL'
    });
  }
  
  return fixes;
}

// Cache file path
const CACHE_FILE_PATH = '.hivemind/context-check.json';

/**
 * Check cache validity
 */
function getCachedResult(projectDir, forceRun) {
  // Only use cache for --cache flag
  if (!useCache || forceRun) return null;
  
  const cacheFile = path.join(projectDir, CACHE_FILE_PATH);
  
  try {
    if (!fs.existsSync(cacheFile)) return null;
    
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
    const ONE_HOUR = 60 * 60 * 1000;
    
    if (cacheAge < ONE_HOUR) {
      return { ...cached, _cached: true };
    }
  } catch (e) {}
  
  return null;
}

/**
 * Write cache
 */
function writeCache(projectDir, result) {
  const cacheFile = path.join(projectDir, CACHE_FILE_PATH);
  try {
    const hivemindDir = path.dirname(cacheFile);
    if (!fs.existsSync(hivemindDir)) {
      fs.mkdirSync(hivemindDir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
  } catch (e) {}
}

/**
 * Generate fix suggestions
 */
function generateFixes(result) {
  const fixes = [];
  
  if (result.context_flood?.issues) {
    for (const issue of result.context_flood.issues) {
      if (issue.includes('Merge conflicts')) {
        fixes.push({
          issue: 'Merge conflicts',
          fix: 'Run: git mergetool or resolve conflicts manually',
          priority: 'CRITICAL'
        });
      }
      if (issue.includes('Governance conflicts')) {
        fixes.push({
          issue: 'Multiple AGENTS.md in scope',
          fix: 'Keep only PRIMARY AGENTS.md, symlink others or remove',
          priority: 'HIGH'
        });
      }
    }
  }
  
  if (result.rot_level === 'POISONED' || result.rot_level === 'POLLUTED') {
    fixes.push({
      issue: 'Context rot detected',
      fix: 'Run: hm-init --clean to rebuild context',
      priority: 'CRITICAL'
    });
  }
  
  return fixes;
}

// Main execution
const projectDir = process.cwd();
const startTime = Date.now();

try {
  // Check cache first (--cache only)
  const cached = getCachedResult(projectDir, forceRun);
  if (cached) {
    if (format === 'markdown') {
      console.log('# Context Harness Report (Cached)\n');
      console.log(`**Cached at:** ${cached.timestamp}`);
      console.log(`**Age:** ${Math.round((Date.now() - new Date(cached.timestamp).getTime()) / 60000)} minutes\n`);
      console.log('```json');
      console.log(JSON.stringify(cached, null, 2));
      console.log('```');
    } else {
      console.log(JSON.stringify(cached, null, 2));
    }
    process.exit(0);
  }
  
  // Run appropriate check
  let result;
  
  if (quickMode || pathOnly) {
    // Quick check (~50ms) - run EVERY time
    result = runQuickCheck(projectDir);
  } else {
    // Full check (~5s) - run ONLY when requested
    result = runFullCheck(projectDir);
  }
  
  // Set duration
  result.duration_ms = Date.now() - startTime;
  
  // Add fixes if requested (--fix flag)
  if (showFixes) {
    result.fixes = generateFixes(result);
  }
  
  // Write cache (only for full check)
  if (!quickMode && !pathOnly) {
    writeCache(projectDir, result);
  }
  
  // Output
  output(result, format);
  
} catch (error) {
  console.error(JSON.stringify({
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  }, null, 2));
  process.exit(1);
}