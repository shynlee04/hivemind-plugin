#!/usr/bin/env node
/**
 * gate-runner.cjs - Execute build/test/git gates
 * 
 * Runs verification gates and returns pass/fail with evidence.
 * Gates: build | test | git
 */

const { execSync } = require('child_process');

const gate = process.argv[2] || 'all';

const results = {
  build: { passed: false, evidence: '', command: 'npx tsc --noEmit' },
  test: { passed: false, evidence: '', command: 'npm test' },
  git: { passed: false, evidence: '', command: 'git status --porcelain' }
};

function runGate(name) {
  try {
    const output = execSync(results[name].command, { encoding: 'utf-8', stdio: 'pipe' });
    results[name].passed = true;
    results[name].evidence = output || 'PASS (no output)';
  } catch (error) {
    results[name].passed = false;
    results[name].evidence = error.stdout || error.message;
  }
}

if (gate === 'all') {
  runGate('build');
  runGate('test');
  runGate('git');
} else if (results[gate]) {
  runGate(gate);
}

console.log(JSON.stringify(results, null, 2));
