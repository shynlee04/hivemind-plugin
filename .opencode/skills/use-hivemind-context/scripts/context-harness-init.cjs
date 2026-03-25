#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SESSION_TYPES = {
  NEW: 'NEW',
  RESUMED: 'RESUMED',
  DEGRADED: 'DEGRADED',
  DELEGATED: 'DELEGATED',
  INTERRUPTED: 'INTERRUPTED',
};

const ROT_LEVELS = {
  CLEAN: 0,
  SUSPECT: 1,
  DEGRADED: 2,
  POLLUTED: 3,
  POISONED: 4,
};

const CACHE_FILE_PATH = path.join('.hivemind', 'context-check.json');
const ONE_HOUR_MS = 60 * 60 * 1000;

function hasFlag(args, flag) {
  return args.includes(flag);
}

function getFormat(args) {
  const explicit = args.find((arg) => arg.startsWith('--format='));
  if (explicit) return explicit.split('=')[1] || 'json';
  if (hasFlag(args, '--markdown')) return 'markdown';
  return 'json';
}

function getMode(args) {
  if (hasFlag(args, '--quick') || hasFlag(args, '--path-only')) return 'quick';
  if (hasFlag(args, '--rot')) return 'rot';
  return 'full';
}

function safeExec(command, cwd) {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (_error) {
    return '';
  }
}

function countMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countMarkdownFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      count += 1;
    }
  }
  return count;
}

function countSkillFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countSkillFiles(fullPath);
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      count += 1;
    }
  }
  return count;
}

function collectPlanRefs(projectDir) {
  const taskPlanPath = path.join(projectDir, 'task_plan.md');
  if (!fs.existsSync(taskPlanPath)) return [];
  const content = fs.readFileSync(taskPlanPath, 'utf-8');
  return content.match(/(?:src\/[\w./-]+\.[a-z]+|\.\/[\w./-]+)/gi) || [];
}

function getBrokenPlanRefs(projectDir) {
  return collectPlanRefs(projectDir).filter((ref) => !fs.existsSync(path.resolve(projectDir, ref)));
}

function getAuthorityFiles(projectDir) {
  const candidates = ['AGENTS.md', 'src/AGENTS.md', 'skills/AGENTS.md', 'commands/AGENTS.md', 'agents/AGENTS.md'];
  return candidates
    .map((candidate) => path.join(projectDir, candidate))
    .filter((candidate) => fs.existsSync(candidate));
}

function getMergeConflictCount(projectDir) {
  const diffCheck = safeExec('git diff --check', projectDir);
  if (!diffCheck) return 0;
  return diffCheck.split('\n').filter(Boolean).length;
}

function getGitStatus(projectDir) {
  const isGitRepo = fs.existsSync(path.join(projectDir, '.git'));
  if (!isGitRepo) {
    return { is_git_repo: false, has_uncommitted_changes: false, merge_conflict_count: 0 };
  }

  const status = safeExec('git status --porcelain', projectDir);
  const lastCommit = safeExec('git log -1 --format="%ci"', projectDir);
  const lastCommitDaysAgo = lastCommit
    ? Math.floor((Date.now() - new Date(lastCommit).getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  return {
    is_git_repo: true,
    has_uncommitted_changes: status.length > 0,
    merge_conflict_count: getMergeConflictCount(projectDir),
    last_commit_days_ago: lastCommitDaysAgo,
    stale_commits: typeof lastCommitDaysAgo === 'number' ? lastCommitDaysAgo > 7 : undefined,
  };
}

function detectSessionType(projectDir) {
  const interrupted = path.join(projectDir, '.hivemind', '.interrupted');
  const delegated = path.join(projectDir, '.hivemind', 'delegation.json');
  const sessionFile = path.join(projectDir, '.hivemind', 'session');

  if (fs.existsSync(interrupted)) return SESSION_TYPES.INTERRUPTED;
  if (fs.existsSync(delegated)) return SESSION_TYPES.DELEGATED;
  if (!fs.existsSync(sessionFile)) return SESSION_TYPES.NEW;

  const stat = fs.statSync(sessionFile);
  const hoursSinceUpdate = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60);
  if (hoursSinceUpdate > 24) return SESSION_TYPES.DEGRADED;
  return SESSION_TYPES.RESUMED;
}

function detectFrameworks(projectDir) {
  const definitions = [
    { directory: '.opencode', name: 'OpenCode', indicators: ['opencode.json', 'AGENTS.md', 'skills'] },
    { directory: '.claude', name: 'Claude Code', indicators: ['CLAUDE.md', 'skills'] },
    { directory: '.codex', name: 'Codex', indicators: ['CODEX.md', 'skills'] },
    { directory: '.cursor', name: 'Cursor', indicators: ['cursor.json', 'skills'] },
    { directory: '.gemini', name: 'Gemini', indicators: ['agents', 'commands'] },
    { directory: '.github', name: 'GitHub', indicators: ['skills'] },
    { directory: '.qwen', name: 'Qwen', indicators: ['QWEN.md', 'skills'] },
    { directory: '.agent', name: 'Agent', indicators: ['AGENT.md', 'skills'] },
  ];

  const frameworks = [];
  for (const definition of definitions) {
    const basePath = path.join(projectDir, definition.directory);
    if (!fs.existsSync(basePath)) continue;

    let score = 0.2;
    const findings = [];
    for (const indicator of definition.indicators) {
      if (fs.existsSync(path.join(basePath, indicator))) {
        score += 0.25;
        findings.push(indicator);
      }
    }

    const skillCount = countSkillFiles(path.join(basePath, 'skills'));
    if (skillCount > 0) {
      score += Math.min(skillCount * 0.02, 0.3);
      findings.push(`${skillCount} skills`);
    }

    frameworks.push({
      directory: definition.directory,
      name: definition.name,
      score: Number(score.toFixed(2)),
      findings,
      skill_count: skillCount,
    });
  }

  frameworks.sort((left, right) => right.score - left.score);
  return frameworks;
}

function calculateTrust(gitStatus, governanceChecks, platformChecks) {
  const signals = [];
  if (gitStatus.is_git_repo) {
    signals.push({ type: 'GIT_VERIFIED', applicable: true, score: 0.95, source: 'git repository detected' });
  }
  if (governanceChecks.agents_md_exists) {
    signals.push({ type: 'DOCUMENTATION', applicable: true, score: 0.5, source: 'root AGENTS.md exists' });
  }
  if (governanceChecks.project_config_exists) {
    signals.push({ type: 'TYPE_CHECKED', applicable: true, score: 0.9, source: 'project config exists' });
  }
  signals.push({ type: 'LOCAL_FILE', applicable: true, score: 0.8, source: 'local filesystem readable' });
  if (platformChecks.platform_dirs_count > 0) {
    signals.push({ type: 'DOCUMENTATION', applicable: true, score: 0.3, source: `${platformChecks.platform_dirs_count} platform dirs` });
  }

  const weights = {
    GIT_VERIFIED: 0.9,
    DOCUMENTATION: 0.5,
    TYPE_CHECKED: 0.8,
    LOCAL_FILE: 0.7,
  };

  let totalWeight = 0;
  let totalScore = 0;
  const breakdown = {};
  for (const signal of signals) {
    const weight = weights[signal.type] || 0.5;
    const contribution = weight * signal.score;
    totalWeight += weight;
    totalScore += contribution;
    breakdown[signal.type] = { weight, score: signal.score, contribution };
  }

  const score = totalWeight === 0 ? 0.5 : Number((totalScore / totalWeight).toFixed(2));
  return {
    score,
    level: score >= 0.8 ? 'HIGH' : score >= 0.6 ? 'MEDIUM' : 'LOW',
    signals,
    breakdown,
  };
}

function calculateActionGate(trustScore, rotLevel) {
  return {
    read_files: trustScore >= 0.4,
    write_files: trustScore >= 0.6 && rotLevel <= ROT_LEVELS.DEGRADED,
    delete_files: trustScore >= 0.8 && rotLevel <= ROT_LEVELS.SUSPECT,
    execute_commands: trustScore >= 0.7 && rotLevel <= ROT_LEVELS.DEGRADED,
    delegate: trustScore >= 0.6 && rotLevel <= ROT_LEVELS.POLLUTED,
    claim_completion: false,
  };
}

function runQuickCheck(projectDir) {
  const gitStatus = getGitStatus(projectDir);
  const sessionPath = path.join(projectDir, '.hivemind', 'session');
  const sessionStale = fs.existsSync(sessionPath)
    ? (Date.now() - fs.statSync(sessionPath).mtime.getTime()) / (1000 * 60 * 60) > 24
    : false;

  const issues = [];
  if (!gitStatus.has_uncommitted_changes) {
    // noop
  } else {
    issues.push('Uncommitted changes detected');
  }
  if (sessionStale) {
    issues.push('Session is stale');
  }

  return {
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    mode: 'quick',
    session_type: detectSessionType(projectDir),
    state: {
      task_plan_exists: fs.existsSync(path.join(projectDir, 'task_plan.md')),
      agents_md_exists: fs.existsSync(path.join(projectDir, 'AGENTS.md')),
      session_exists: fs.existsSync(sessionPath),
      git_clean: !gitStatus.has_uncommitted_changes,
      session_stale: sessionStale,
    },
    issues,
    can_proceed: fs.existsSync(path.join(projectDir, 'AGENTS.md')) && !sessionStale,
  };
}

function runRotCheck(projectDir) {
  const passes = [];
  const failures = [];
  const sessionFile = path.join(projectDir, '.hivemind', 'session');
  const brokenPlanRefs = getBrokenPlanRefs(projectDir);
  const authorityFiles = getAuthorityFiles(projectDir);
  const gitStatus = getGitStatus(projectDir);

  if (fs.existsSync(path.join(projectDir, 'AGENTS.md'))) {
    passes.push({ check: 'governance', reason: 'AGENTS.md exists' });
  } else {
    failures.push({ check: 'governance', reason: 'AGENTS.md missing', fix: 'Create AGENTS.md in the project root' });
  }

  if (!fs.existsSync(sessionFile)) {
    passes.push({ check: 'session', reason: 'First run (no session file required)' });
  } else {
    try {
      fs.readFileSync(sessionFile, 'utf-8');
      passes.push({ check: 'session', reason: 'Session file readable' });
    } catch (_error) {
      failures.push({ check: 'session', reason: 'Session unreadable', fix: 'Rebuild or remove the broken session file' });
    }
  }

  if (gitStatus.merge_conflict_count === 0) {
    passes.push({ check: 'git', reason: 'No merge conflicts detected' });
  } else {
    failures.push({ check: 'git', reason: 'Merge conflicts detected', fix: 'Resolve merge conflicts before continuing' });
  }

  if (brokenPlanRefs.length === 0) {
    passes.push({ check: 'plan', reason: 'Active plan references resolve' });
  } else {
    failures.push({
      check: 'plan',
      reason: `${brokenPlanRefs.length} active plan references are broken`,
      details: brokenPlanRefs.slice(0, 5),
      fix: 'Update task_plan.md to point only at existing paths',
    });
  }

  if (authorityFiles.length <= 1) {
    passes.push({ check: 'trust', reason: `Authority surface count: ${authorityFiles.length}` });
  } else {
    failures.push({
      check: 'trust',
      reason: `Multiple AGENTS.md files in active scope: ${authorityFiles.length}`,
      details: authorityFiles,
      fix: 'Collapse active authority to one governing AGENTS.md surface',
    });
  }

  const passed = failures.length === 0;
  return {
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    mode: 'rot',
    result: passed ? 'PASS' : 'FAIL',
    passed,
    checks: { total: passes.length + failures.length, passed: passes.length, failed: failures.length },
    passes,
    failures,
    action_gate: {
      read_files: true,
      write_files: passed,
      delete_files: passed,
      execute_commands: passed,
      delegate: true,
      claim_completion: false,
    },
  };
}

function runFullCheck(projectDir) {
  const sessionType = detectSessionType(projectDir);
  const gitStatus = getGitStatus(projectDir);
  const frameworkList = detectFrameworks(projectDir);
  const primaryFramework = frameworkList[0] || null;
  const brokenPlanRefs = getBrokenPlanRefs(projectDir);
  const authorityFiles = getAuthorityFiles(projectDir);

  const governanceChecks = {
    agents_md_exists: fs.existsSync(path.join(projectDir, 'AGENTS.md')),
    governance_dirs_exist: ['src', 'skills'].every((dir) => fs.existsSync(path.join(projectDir, dir))),
    formatters_configured: ['.eslintrc.json', '.prettierrc', 'eslint.config.js', 'biome.json'].some((file) => fs.existsSync(path.join(projectDir, file))),
    tests_exist: fs.existsSync(path.join(projectDir, 'tests')),
    project_config_exists: ['package.json', 'pyproject.toml', 'Cargo.toml'].some((file) => fs.existsSync(path.join(projectDir, file))),
  };

  const delegationChecks = {
    has_session_state: fs.existsSync(path.join(projectDir, '.hivemind', 'session')),
    has_delegation_marker: fs.existsSync(path.join(projectDir, '.hivemind', 'delegation.json')),
    has_interrupted_marker: fs.existsSync(path.join(projectDir, '.hivemind', '.interrupted')),
    multiple_context_dirs: ['.hivemind', '.planning', '.sisyphus'].filter((dir) => fs.existsSync(path.join(projectDir, dir))).length,
  };

  const workflowChecks = {
    plan_files_count: countMarkdownFiles(path.join(projectDir, '.planning')),
    tests_exist: fs.existsSync(path.join(projectDir, 'tests')),
    merge_conflict_markers: gitStatus.merge_conflict_count,
  };

  const platformChecks = {
    primary_framework: primaryFramework ? primaryFramework.name : 'NONE',
    primary_framework_dir: primaryFramework ? primaryFramework.directory : null,
    primary_framework_score: primaryFramework ? primaryFramework.score : 0,
    all_frameworks: frameworkList,
    platform_dirs_found: frameworkList.map((framework) => framework.directory),
    platform_dirs_count: frameworkList.length,
    has_root_skills: fs.existsSync(path.join(projectDir, 'skills')),
    root_skill_count: countSkillFiles(path.join(projectDir, 'skills')),
  };

  const contextFloodIssues = [];
  if (brokenPlanRefs.length > 0) contextFloodIssues.push(`Broken plan links: ${brokenPlanRefs.length}`);
  if (authorityFiles.length > 1) contextFloodIssues.push(`Governance conflicts: ${authorityFiles.length}`);
  if (gitStatus.merge_conflict_count > 0) contextFloodIssues.push(`Merge conflicts: ${gitStatus.merge_conflict_count}`);

  const rotPoints = {
    governance: governanceChecks.agents_md_exists ? 0 : 2,
    temporal: gitStatus.has_uncommitted_changes ? 1 : 0,
    delegation: delegationChecks.multiple_context_dirs > 1 ? 1 : 0,
    workflow: gitStatus.merge_conflict_count > 0 ? 3 : 0,
    platform: frameworkList.length > 6 ? 1 : 0,
    flood: contextFloodIssues.length,
  };

  const rotScore = Object.values(rotPoints).reduce((sum, value) => sum + value, 0);
  const rotLevel = rotScore >= 8 ? 'POISONED' : rotScore >= 5 ? 'POLLUTED' : rotScore >= 3 ? 'DEGRADED' : rotScore >= 1 ? 'SUSPECT' : 'CLEAN';
  const trust = calculateTrust(gitStatus, governanceChecks, platformChecks);
  const actionGate = calculateActionGate(trust.score, ROT_LEVELS[rotLevel]);

  const recommendations = [];
  if (contextFloodIssues.length > 0) {
    recommendations.push({ priority: 'HIGH', action: 'Review context-health blockers', reason: contextFloodIssues.join(', ') });
  }
  if (rotLevel === 'POISONED' || rotLevel === 'POLLUTED') {
    recommendations.push({ priority: 'CRITICAL', action: 'Rebuild context from authoritative sources', reason: `Rot level is ${rotLevel}` });
  }
  if (sessionType === SESSION_TYPES.INTERRUPTED || sessionType === SESSION_TYPES.DEGRADED) {
    recommendations.push({ priority: 'HIGH', action: 'Re-establish session continuity', reason: `Session type is ${sessionType}` });
  }

  return {
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    mode: 'full',
    session_type: sessionType,
    rot_level: rotLevel,
    rot_score: rotScore,
    rot_points: rotPoints,
    trust,
    dimensions: {
      governance_integrity: { checks: governanceChecks, rot_points: rotPoints.governance },
      temporal_consistency: { checks: gitStatus, rot_points: rotPoints.temporal },
      delegation_scope: { checks: delegationChecks, rot_points: rotPoints.delegation },
      workflow_integrity: { checks: workflowChecks, rot_points: rotPoints.workflow },
      platform_surface: { checks: platformChecks, rot_points: rotPoints.platform },
    },
    context_flood: {
      has_flood: contextFloodIssues.length > 0,
      flood_score: rotPoints.flood,
      issues: contextFloodIssues,
      metrics: {
        activePlanningDocs: countMarkdownFiles(path.join(projectDir, '.planning')),
        filesystemBloat: { note: 'Filesystem bloat is tracked separately from runtime context rot' },
      },
    },
    action_gate: actionGate,
    recommendations,
  };
}

function getCacheFile(projectDir) {
  return path.join(projectDir, CACHE_FILE_PATH);
}

function readCache(projectDir, forceRun) {
  if (forceRun) return null;
  const cacheFile = getCacheFile(projectDir);
  if (!fs.existsSync(cacheFile)) return null;
  try {
    const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
    return cacheAge < ONE_HOUR_MS ? { ...cached, _cached: true } : null;
  } catch (_error) {
    return null;
  }
}

function writeCache(projectDir, result) {
  const cacheFile = getCacheFile(projectDir);
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2));
}

function output(result, format) {
  if (format === 'markdown') {
    console.log(`# Context Harness Report (${result.mode})\n`);
    console.log('```json');
    console.log(JSON.stringify(result, null, 2));
    console.log('```');
    return;
  }
  console.log(JSON.stringify(result, null, 2));
}

function main() {
  const args = process.argv.slice(2);
  const mode = getMode(args);
  const format = getFormat(args);
  const useCache = hasFlag(args, '--cache');
  const forceRun = hasFlag(args, '--force');
  const projectDir = process.cwd();
  const startTime = Date.now();

  let result;
  if (mode === 'full' && useCache) {
    result = readCache(projectDir, forceRun);
  }

  if (!result) {
    result = mode === 'quick' ? runQuickCheck(projectDir) : mode === 'rot' ? runRotCheck(projectDir) : runFullCheck(projectDir);
    result.duration_ms = Date.now() - startTime;
    if (mode === 'full') {
      writeCache(projectDir, result);
    }
  }

  output(result, format);
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }, null, 2));
  process.exit(1);
}
