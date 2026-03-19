import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REFINEMENT_REF_PATH = resolve(__dirname, '../../.opencode/skills/hivemind-skill-writer/references/07-iterative-refinement.md');

describe('Iterative Refinement Reference', () => {
  describe('Reference file existence', () => {
    it('should exist at references/07-iterative-refinement.md', () => {
      assert.ok(existsSync(REFINEMENT_REF_PATH), '07-iterative-refinement.md should exist');
    });
  });

  describe('Hook definitions', () => {
    it('should document before_skill_audit hook', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('before_skill_audit'), 'should contain before_skill_audit');
    });

    it('should document after_skill_create hook', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('after_skill_create'), 'should contain after_skill_create');
    });

    it('should document on_validation_fail hook', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('on_validation_fail'), 'should contain on_validation_fail');
    });
  });

  describe('Pattern extraction protocol', () => {
    it('should document pattern extraction steps', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('Pattern Extraction'), 'should contain Pattern Extraction');
      assert.ok(content.includes('Identify Experience'), 'should contain Identify Experience');
      assert.ok(content.includes('Abstract Pattern'), 'should contain Abstract Pattern');
    });
  });

  describe('Confidence threshold', () => {
    it('should document confidence threshold >0.8', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.match(/confidence.*0\.8|0\.8.*confidence/i), 'should mention confidence 0.8');
      assert.ok(content.includes('>0.8'), 'should contain >0.8 threshold');
    });
  });

  describe('Memory systems', () => {
    it('should document semantic memory', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('Semantic Memory'), 'should contain Semantic Memory');
    });

    it('should document episodic memory', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('Episodic Memory'), 'should contain Episodic Memory');
    });

    it('should document working memory', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('Working Memory'), 'should contain Working Memory');
    });
  });

  describe('Refinement loop', () => {
    it('should document refinement loop steps', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('Refinement Loop'), 'should contain Refinement Loop');
      assert.ok(content.includes('Analyze Failure'), 'should contain Analyze Failure');
      assert.ok(content.includes('Identify Gap'), 'should contain Identify Gap');
      assert.ok(content.includes('Apply Fix'), 'should contain Apply Fix');
      assert.ok(content.includes('Re-validate'), 'should contain Re-validate');
    });

    it('should document Skill-Judge threshold of 3.5', () => {
      const content = readFileSync(REFINEMENT_REF_PATH, 'utf-8');
      assert.ok(content.includes('3.5'), 'should contain 3.5 threshold');
    });
  });
});
