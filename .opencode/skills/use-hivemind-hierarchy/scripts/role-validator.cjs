#!/usr/bin/env node
/**
 * role-validator.cjs - Verify Diamond model compliance
 * 
 * Validates that an action is compliant with the Diamond model:
 * - Orchestrators delegate, never execute
 * - Executors implement, never delegate
 * - Verifiers validate, independent of executor
 * - Researchers investigate, no implementation
 */

const action = process.argv[2] || '';
const agentRole = process.argv[3] || 'unknown';

const DIAMOND_MODEL = {
  orchestrator: {
    can: ['delegate', 'plan', 'coordinate', 'monitor'],
    cannot: ['implement', 'execute_code', 'write_files']
  },
  executor: {
    can: ['implement', 'execute_code', 'write_files', 'run_tests'],
    cannot: ['delegate', 'plan_for_others', 'approve_gates']
  },
  verifier: {
    can: ['validate', 'verify', 'check', 'report'],
    cannot: ['implement', 'delegate', 'approve_own_work']
  },
  researcher: {
    can: ['investigate', 'analyze', 'report', 'recommend'],
    cannot: ['implement', 'delegate', 'approve']
  }
};

function validateRole(action, agentRole) {
  const result = {
    is_compliant: false,
    role: agentRole,
    action: action,
    violations: [],
    allowed: []
  };

  const rolePerms = DIAMOND_MODEL[agentRole];
  if (!rolePerms) {
    result.violations.push(`Unknown role: ${agentRole}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  }

  // Check if action matches allowed patterns
  const actionLower = action.toLowerCase();
  const isAllowed = rolePerms.can.some(p => actionLower.includes(p));
  const isForbidden = rolePerms.cannot.some(p => actionLower.includes(p));

  if (isForbidden) {
    result.violations.push(`${agentRole} cannot perform: ${action}`);
  } else if (isAllowed) {
    result.is_compliant = true;
    result.allowed.push(action);
  } else {
    result.violations.push(`Action "${action}" not in ${agentRole} capability set`);
  }

  console.log(JSON.stringify(result, null, 2));
  return result;
}

validateRole(action, agentRole);
