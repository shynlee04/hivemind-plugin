#!/usr/bin/env node
/**
 * scope-validator.cjs - Validate scope declaration is bounded
 * 
 * Checks that a delegation scope is properly bounded with:
 * - Explicit boundaries (what's in scope)
 * - Explicit exclusions (what's out of scope)
 * - Result contract defined
 */

const scopeDeclaration = process.argv[2] || '';

function validateScope(scope) {
  const result = {
    is_valid: false,
    errors: [],
    warnings: [],
    bounded: false
  };

  if (!scope || scope.trim() === '') {
    result.errors.push('Scope declaration is empty');
    return result;
  }

  // Check for boundary indicators
  const boundaryIndicators = ['include:', 'exclude:', 'scope:', 'boundary:', 'limited to'];
  const hasBoundaries = boundaryIndicators.some(ind => scope.toLowerCase().includes(ind));
  
  if (!hasBoundaries) {
    result.warnings.push('Scope may be unbounded - no explicit boundaries found');
  }

  // Check for result contract
  const contractIndicators = ['return:', 'result:', 'deliver:', 'output:', 'expect:'];
  const hasContract = contractIndicators.some(ind => scope.toLowerCase().includes(ind));
  
  if (!hasContract) {
    result.warnings.push('No result contract found');
  }

  result.bounded = hasBoundaries && hasContract;
  result.is_valid = result.errors.length === 0 && result.warnings.length === 0;
  
  console.log(JSON.stringify(result, null, 2));
  return result;
}

validateScope(scopeDeclaration);
