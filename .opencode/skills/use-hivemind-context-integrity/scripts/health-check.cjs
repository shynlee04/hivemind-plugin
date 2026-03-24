#!/usr/bin/env node
/**
 * health-check.cjs - Quick context health assessment
 * 
 * Runs a fast context health check to determine rot level.
 * Returns: DRIFT | POLLUTION | CHAIN_BREAK | CLEAN
 */

const fs = require('fs');
const path = require('path');

function checkContextHealth() {
  const result = {
    rot_level: 'CLEAN',
    indicators: [],
    timestamp: new Date().toISOString()
  };

  // Check context depth
  const contextDepth = process.env.OPENCODE_CONTEXT_DEPTH || '0';
  const depthPercent = parseInt(contextDepth, 10) / 100;
  
  if (depthPercent > 0.7) {
    result.rot_level = 'DRIFT';
    result.indicators.push('context_depth_exceeded_70');
  }

  // Check for chain break markers
  if (process.env.OPENCODE_SESSION_PARENT_ID === 'undefined' || 
      process.env.OPENCODE_SESSION_PARENT_ID === '') {
    result.rot_level = 'CHAIN_BREAK';
    result.indicators.push('parent_context_missing');
  }

  // Check for pollution indicators
  const lastMessage = process.env.OPENCODE_LAST_MESSAGE || '';
  const pollutionKeywords = ['contradict', 'confused', 'wrong file', 'mixed up'];
  
  if (pollutionKeywords.some(kw => lastMessage.toLowerCase().includes(kw))) {
    result.rot_level = 'POLLUTION';
    result.indicators.push('contamination_detected');
  }

  console.log(JSON.stringify(result, null, 2));
  return result;
}

checkContextHealth();
