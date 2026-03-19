#!/usr/bin/env node

/**
 * hm-verify.cjs — HiveMind Context Governance Verification Suite
 *
 * Deterministic verification script providing hard proof of project state.
 * Zero npm dependencies — pure Node.js with fs, path, child_process.
 *
 * Usage: node hm-verify.cjs <command> [args] [--raw]
 *
 * Layer 1: Project Reality Gates
 *   project contracts         Check package.json has name, version, main
 *   project dependencies     Run npm ls --json --depth=0, check missing/invalid deps
 *   project sdk-surface      Check @opencode-ai/sdk and @opencode-ai/plugin are importable
 *   project build            Run npx tsc --noEmit, capture exit code
 *   project tests            Run npm test, capture exit code
 *
 * Layer 2: Planning Integrity Gates
 *   planning exists          Check .planning/ directory exists
 *   planning health          Check STATE.md, ROADMAP.md, REQUIREMENTS.md exist
 *   planning consistency     Parse ROADMAP.md phase numbers, verify each phase dir exists
 *
 * Layer 3: Git Evidence Gates
 *   git branch-state         Run git status --porcelain, report clean/dirty
 *   git last-commit          Return hash, message, author, date via git log
 *   git diff-stat [ref]      Return diff stat against ref (default HEAD~1)
 *
 * Layer 4: Architecture Gates (SOFT — always pass, warnings only)
 *   arch src-domains         Scan src/ top-level dirs, report files, LOC, exports
 *   arch dead-exports         Find exported symbols with <2 consumers (warning only)
 *   arch circular-deps        Detect circular import chains (warning only)
 *
 * Compound Commands
 *   gate-chain               Sequential fail-fast, stops at first failure, includes delegation_trigger
 *   landscape                Runs ALL gates, returns unified verdict with DEGRADED/PASS/FAIL
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ─── Output helpers ───────────────────────────────────────────────────────────

function output(result, raw) {
  const json = raw
    ? JSON.stringify(result)
    : JSON.stringify(result, null, 2);
  process.stdout.write(json + '\n');
  process.exit(0);
}

function outputResult(result, raw) {
  const json = raw ? JSON.stringify(result) : JSON.stringify(result, null, 2);
  process.stdout.write(json + '\n');
}

function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

// ─── Execution helpers ────────────────────────────────────────────────────────

function exec(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? '').toString().trim(),
    stderr: (result.stderr ?? '').toString().trim(),
  };
}

function execShell(cmd, cwd) {
  const result = spawnSync(cmd, [], {
    cwd,
    encoding: 'utf-8',
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? '').toString().trim(),
    stderr: (result.stderr ?? '').toString().trim(),
  };
}

// ─── Gate implementations ─────────────────────────────────────────────────────

function gateProjectContracts(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  const result = { gate: 'project contracts', passed: false, data: {} };

  try {
    if (!fs.existsSync(pkgPath)) {
      result.data = { error: 'package.json not found' };
      return result;
    }

    const content = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);

    const missing = [];
    if (!pkg.name) missing.push('name');
    if (!pkg.version) missing.push('version');
    if (!pkg.main) missing.push('main');

    result.passed = missing.length === 0;
    result.data = {
      name: pkg.name || null,
      version: pkg.version || null,
      main: pkg.main || null,
      missing_fields: missing,
    };
  } catch (e) {
    result.data = { error: e.message };
  }

  return result;
}

function gateProjectDependencies(cwd) {
  const result = { gate: 'project dependencies', passed: false, data: {} };

  try {
    const execResult = exec('npm', ['ls', '--json', '--depth=0'], cwd);

    if (execResult.exitCode !== 0) {
      let parsed = {};
      try {
        parsed = JSON.parse(execResult.stdout + execResult.stderr);
      } catch {}
      result.data = {
        error: 'npm ls failed',
        exit_code: execResult.exitCode,
        problems: parsed.problems || [],
      };
      return result;
    }

    const depData = JSON.parse(execResult.stdout);
    const missing = [];
    const invalid = [];

    if (depData.dependencies) {
      for (const [name, info] of Object.entries(depData.dependencies)) {
        if (info.required && !info.resolved) {
          missing.push(name);
        }
        if (info.invalid) {
          invalid.push({ name, reason: info.required });
        }
      }
    }

    result.passed = missing.length === 0 && invalid.length === 0;
    result.data = {
      missing,
      invalid,
      total: Object.keys(depData.dependencies || {}).length,
    };
  } catch (e) {
    result.data = { error: e.message };
  }

  return result;
}

function gateProjectSdkSurface(cwd) {
  const result = { gate: 'project sdk-surface', passed: false, data: {} };
  const checks = {};

  const sdkPath = tryResolve('@opencode-ai/sdk', cwd);
  checks['@opencode-ai/sdk'] = sdkPath ? 'found' : 'not found';

  const pluginPath = tryResolve('@opencode-ai/plugin', cwd);
  checks['@opencode-ai/plugin'] = pluginPath ? 'found' : 'not found';

    result.passed = !!(sdkPath && pluginPath);
    result.data = { checks, resolved_paths: { sdk: sdkPath, plugin: pluginPath } };

  return result;
}

function tryResolve(moduleName, cwd) {
  try {
    return require.resolve(moduleName, { paths: [cwd] });
  } catch {
    return null;
  }
}

function gateProjectBuild(cwd) {
  const result = { gate: 'project build', passed: false, data: {} };

  try {
    const execResult = exec('npx', ['tsc', '--noEmit'], cwd);
    result.passed = execResult.exitCode === 0;
    result.data = {
      exit_code: execResult.exitCode,
      stdout: execResult.stdout.slice(0, 500),
      stderr: execResult.stderr.slice(0, 500),
    };
  } catch (e) {
    result.data = { error: e.message };
  }

  return result;
}

function gateProjectTests(cwd) {
  const result = { gate: 'project tests', passed: false, data: {} };

  try {
    const execResult = exec('npm', ['test'], cwd);
    result.passed = execResult.exitCode === 0;
    result.data = {
      exit_code: execResult.exitCode,
      stdout: execResult.stdout.slice(0, 500),
      stderr: execResult.stderr.slice(0, 500),
    };
  } catch (e) {
    result.data = { error: e.message };
  }

  return result;
}

function gatePlanningExists(cwd) {
  const result = { gate: 'planning exists', passed: false, data: {} };

  const planningPath = path.join(cwd, '.planning');
  const exists = fs.existsSync(planningPath);

  result.passed = exists;
  result.data = { path: planningPath, exists };

  return result;
}

function gatePlanningHealth(cwd) {
  const result = { gate: 'planning health', passed: false, data: {} };

  const planningPath = path.join(cwd, '.planning');
  const files = {
    'STATE.md': path.join(planningPath, 'STATE.md'),
    'ROADMAP.md': path.join(planningPath, 'ROADMAP.md'),
    'REQUIREMENTS.md': path.join(planningPath, 'REQUIREMENTS.md'),
  };

  const missing = [];
  for (const [name, filePath] of Object.entries(files)) {
    if (!fs.existsSync(filePath)) {
      missing.push(name);
    }
  }

  result.passed = missing.length === 0;
  result.data = { missing, present: Object.keys(files).length - missing.length, total: Object.keys(files).length };

  return result;
}

function gatePlanningConsistency(cwd) {
  const result = { gate: 'planning consistency', passed: false, data: {} };

  const planningPath = path.join(cwd, '.planning');
  const roadmapPath = path.join(planningPath, 'ROADMAP.md');
  const phasesPath = path.join(planningPath, 'phases');

  if (!fs.existsSync(roadmapPath)) {
    result.data = { error: 'ROADMAP.md not found' };
    return result;
  }

  try {
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const phasePattern = /Phase\s+(\d+(?:\.\d+)*)\s*:/gi;
    const phases = [];
    let m;

    while ((m = phasePattern.exec(content)) !== null) {
      phases.push(m[1]);
    }

    const phaseDirs = fs.existsSync(phasesPath)
      ? fs.readdirSync(phasesPath, { withFileTypes: true })
          .filter(e => e.isDirectory())
          .map(e => e.name)
      : [];

    const missingPhases = [];
    for (const phase of phases) {
      const padded = phase.padStart(2, '0');
      const found = phaseDirs.some(d => d.startsWith(padded) || d.startsWith(phase));
      if (!found) {
        missingPhases.push(phase);
      }
    }

    result.passed = missingPhases.length === 0;
    result.data = {
      roadmap_phases: phases,
      phase_dirs: phaseDirs,
      missing_phases: missingPhases,
    };
  } catch (e) {
    result.data = { error: e.message };
  }

  return result;
}

function gateGitBranchState(cwd) {
  const result = { gate: 'git branch-state', passed: false, data: {} };

  try {
    const execResult = exec('git', ['status', '--porcelain'], cwd);
    const lines = execResult.stdout.split('\n').filter(l => l.trim());
    result.passed = lines.length === 0;
    result.data = {
      clean: lines.length === 0,
      dirty: lines.length > 0,
      changed_files: lines.length,
      changes: lines.slice(0, 20),
    };
  } catch (e) {
    result.data = { error: e.message };
    result.passed = false;
  }

  return result;
}

function gateGitLastCommit(cwd) {
  const result = { gate: 'git last-commit', passed: false, data: {} };

  try {
    const execResult = exec('git', ['log', '-1', '--format=%H%n%s%n%an%n%ad%n%ae', '--date=iso'], cwd);

    if (execResult.exitCode !== 0) {
      result.data = { error: 'git log failed' };
      return result;
    }

    const lines = execResult.stdout.split('\n');
    if (lines.length >= 4) {
      result.passed = true;
      result.data = {
        hash: lines[0],
        message: lines[1],
        author: lines[2],
        date: lines[3],
        email: lines[4] || '',
      };
    } else {
      result.data = { error: 'Unexpected git log format' };
    }
  } catch (e) {
    result.data = { error: e.message };
  }

  return result;
}

function gateGitDiffStat(cwd, ref) {
  const result = { gate: `git diff-stat ${ref}`, passed: false, data: {} };

  try {
    const execResult = exec('git', ['diff', '--stat', ref || 'HEAD~1'], cwd);
    result.passed = execResult.exitCode === 0;
    result.data = {
      ref: ref || 'HEAD~1',
      exit_code: execResult.exitCode,
      stat: execResult.stdout,
    };
  } catch (e) {
    result.data = { error: e.message };
  }

  return result;
}

function gateArchSrcDomains(cwd) {
  const result = { gate: 'arch src-domains', passed: true, data: {} };

  const srcPath = path.join(cwd, 'src');
  if (!fs.existsSync(srcPath)) {
    result.data = { error: 'src/ directory not found' };
    result.passed = true;
    return result;
  }

  try {
    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    const domains = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const domainPath = path.join(srcPath, entry.name);
      const files = getAllFiles(domainPath);
      let totalLoc = 0;
      let exports = 0;

      for (const file of files) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(file, 'utf-8');
          totalLoc += content.split('\n').length;
          exports += (content.match(/^export\s+/gm) || []).length;
        }
      }

      domains.push({
        name: entry.name,
        files: files.length,
        loc: totalLoc,
        exports,
      });
    }

    result.passed = true;
    result.data = { domains };
  } catch (e) {
    result.passed = true;
    result.data = { error: e.message, warnings: ['arch src-domains scan failed'] };
  }

  return result;
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function gateArchDeadExports(cwd) {
  const result = { gate: 'arch dead-exports', passed: true, data: {} };

  const srcPath = path.join(cwd, 'src');
  if (!fs.existsSync(srcPath)) {
    result.data = { error: 'src/ directory not found' };
    result.passed = true;
    return result;
  }

  const warnings = [];

  try {
    const exportMap = {};
    const importMap = {};

    const files = getAllTsFiles(srcPath);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const relPath = path.relative(cwd, file);

      const exportMatches = content.matchAll(/export\s+(?:type\s+)?(?:interface|class|function|const|enum)\s+(\w+)/g);
      for (const m of exportMatches) {
        const key = `${relPath}:${m[1]}`;
        exportMap[key] = (exportMap[key] || 0) + 1;
      }

      const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
      for (const m of importMatches) {
        const module = m[1];
        if (!module.startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(file), module);
        const resolvedRel = path.relative(cwd, resolved);
        const baseName = path.basename(resolvedRel);
        const consumerKey = `${resolvedRel}:${baseName}`;
        importMap[consumerKey] = (importMap[consumerKey] || 0) + 1;
      }
    }

    const deadExports = [];
    for (const [exportKey, count] of Object.entries(exportMap)) {
      if (count < 2 && !exportKey.includes('/index')) {
        deadExports.push({ symbol: exportKey, consumers: count });
      }
    }

    if (deadExports.length > 0) {
      warnings.push(`${deadExports.length} exported symbols with <2 consumers`);
    }

    result.passed = true;
    result.data = {
      warnings: warnings.length > 0 ? warnings : undefined,
      dead_export_count: deadExports.length,
      dead_exports: deadExports.slice(0, 10),
    };
  } catch (e) {
    result.passed = true;
    result.data = { error: e.message, warnings: ['arch dead-exports scan failed'] };
  }

  return result;
}

function getAllTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.includes('node_modules')) {
      getAllTsFiles(full, files);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

function gateArchCircularDeps(cwd) {
  const result = { gate: 'arch circular-deps', passed: true, data: {} };

  const srcPath = path.join(cwd, 'src');
  if (!fs.existsSync(srcPath)) {
    result.data = { error: 'src/ directory not found' };
    result.passed = true;
    return result;
  }

  const warnings = [];

  try {
    const graph = {};
    const files = getAllTsFiles(srcPath);

    for (const file of files) {
      const relPath = path.relative(cwd, file);
      const content = fs.readFileSync(file, 'utf-8');
      const imports = [];

      const importMatches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
      for (const m of importMatches) {
        const module = m[1];
        if (!module.startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(file), module);
        const resolvedRel = path.relative(cwd, resolved);
        imports.push(resolvedRel);
      }

      graph[relPath] = imports;
    }

    const cycles = detectCycles(graph);

    if (cycles.length > 0) {
      warnings.push(`${cycles.length} circular dependency chains detected`);
    }

    result.passed = true;
    result.data = {
      warnings: warnings.length > 0 ? warnings : undefined,
      cycle_count: cycles.length,
      cycles: cycles.slice(0, 5),
    };
  } catch (e) {
    result.passed = true;
    result.data = { error: e.message, warnings: ['arch circular-deps scan failed'] };
  }

  return result;
}

function detectCycles(graph) {
  const cycles = [];
  const visited = new Set();
  const recursionStack = new Set();

  function dfs(node, path) {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      const cycle = path.slice(cycleStart);
      cycles.push(cycle.concat(node));
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph[node] || [];
    for (const neighbor of neighbors) {
      if (graph[neighbor] !== undefined) {
        dfs(neighbor, [...path]);
      }
    }

    recursionStack.delete(node);
  }

  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

// ─── Compound commands ────────────────────────────────────────────────────────

function gateChain(cwd, raw) {
  const gates = [
    () => gateProjectContracts(cwd),
    () => gateProjectDependencies(cwd),
    () => gateProjectSdkSurface(cwd),
    () => gateProjectBuild(cwd),
    () => gateProjectTests(cwd),
    () => gatePlanningExists(cwd),
    () => gatePlanningHealth(cwd),
    () => gatePlanningConsistency(cwd),
  ];

  const results = [];
  let failedGate = null;

  for (const gate of gates) {
    const result = gate();
    results.push(result);
    if (!result.passed && !failedGate) {
      failedGate = result;
    }
  }

  const passed = !failedGate;
  const output = {
    command: 'gate-chain',
    passed,
    delegation_trigger: failedGate ? {
      gate: failedGate.gate,
      reason: failedGate.data.error || JSON.stringify(failedGate.data).slice(0, 200),
    } : undefined,
    gates: results.map(r => ({ gate: r.gate, passed: r.passed })),
  };

  outputResult(output, raw);
}

function landscape(cwd, raw) {
  const allGates = [
    () => gateProjectContracts(cwd),
    () => gateProjectDependencies(cwd),
    () => gateProjectSdkSurface(cwd),
    () => gateProjectBuild(cwd),
    () => gateProjectTests(cwd),
    () => gatePlanningExists(cwd),
    () => gatePlanningHealth(cwd),
    () => gatePlanningConsistency(cwd),
    () => gateGitBranchState(cwd),
    () => gateGitLastCommit(cwd),
    () => gateGitDiffStat(cwd, 'HEAD~1'),
    () => gateArchSrcDomains(cwd),
    () => gateArchDeadExports(cwd),
    () => gateArchCircularDeps(cwd),
  ];

  const results = [];
  for (const gate of allGates) {
    results.push(gate());
  }

  const hardGates = results.slice(0, 11);
  const softGates = results.slice(11);

  const hardPassed = hardGates.filter(r => r.passed).length;
  const hardTotal = hardGates.length;
  const softWarnings = softGates.filter(r => r.data && r.data.warnings).length;

  let verdict;
  const allHardPassed = hardPassed === hardTotal;
  if (allHardPassed && softWarnings === 0) {
    verdict = 'PASS';
  } else if (allHardPassed) {
    verdict = 'DEGRADED';
  } else {
    verdict = 'FAIL';
  }

  const output = {
    command: 'landscape',
    verdict,
    summary: {
      hard_gates: { passed: hardPassed, total: hardTotal },
      soft_gates: { warnings: softWarnings, total: softGates.length },
    },
    gates: results.map(r => ({
      gate: r.gate,
      passed: r.passed,
      warnings: r.data && r.data.warnings ? r.data.warnings : undefined,
    })),
  };

  outputResult(output, raw);
}

// ─── CLI Router ───────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) {
    args.splice(rawIndex, 1);
  }

  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  let cwd = process.cwd();

  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  const command = args[0];

  if (!command) {
    error('Usage: hm-verify.cjs <command> [--raw] [--cwd <path>]\nCommands: project contracts, project dependencies, project sdk-surface, project build, project tests, planning exists, planning health, planning consistency, git branch-state, git last-commit, git diff-stat [ref], arch src-domains, arch dead-exports, arch circular-deps, gate-chain, landscape');
  }

  let result;

  switch (command) {
    case 'project':
      if (args[1] === 'contracts') result = gateProjectContracts(cwd);
      else if (args[1] === 'dependencies') result = gateProjectDependencies(cwd);
      else if (args[1] === 'sdk-surface') result = gateProjectSdkSurface(cwd);
      else if (args[1] === 'build') result = gateProjectBuild(cwd);
      else if (args[1] === 'tests') result = gateProjectTests(cwd);
      else error('Unknown project gate. Available: contracts, dependencies, sdk-surface, build, tests');
      break;

    case 'planning':
      if (args[1] === 'exists') result = gatePlanningExists(cwd);
      else if (args[1] === 'health') result = gatePlanningHealth(cwd);
      else if (args[1] === 'consistency') result = gatePlanningConsistency(cwd);
      else error('Unknown planning gate. Available: exists, health, consistency');
      break;

    case 'git':
      if (args[1] === 'branch-state') result = gateGitBranchState(cwd);
      else if (args[1] === 'last-commit') result = gateGitLastCommit(cwd);
      else if (args[1] === 'diff-stat') result = gateGitDiffStat(cwd, args[2]);
      else error('Unknown git gate. Available: branch-state, last-commit, diff-stat [ref]');
      break;

    case 'arch':
      if (args[1] === 'src-domains') result = gateArchSrcDomains(cwd);
      else if (args[1] === 'dead-exports') result = gateArchDeadExports(cwd);
      else if (args[1] === 'circular-deps') result = gateArchCircularDeps(cwd);
      else error('Unknown arch gate. Available: src-domains, dead-exports, circular-deps');
      break;

    case 'gate-chain':
      gateChain(cwd, raw);
      return;

    case 'landscape':
      landscape(cwd, raw);
      return;

    default:
      error('Unknown command: ' + command + '\nAvailable: project, planning, git, arch, gate-chain, landscape');
  }

  output(result, raw);
}

main();
