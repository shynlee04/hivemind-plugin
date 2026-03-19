import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILL_MD_PATH = resolve(__dirname, '../../.opencode/skills/hivemind-skill-writer/SKILL.md');

describe('SKILL.md Iterative Refinement Integration', () => {
  describe('References section', () => {
    it('should include iterative refinement reference', () => {
      const content = readFileSync(SKILL_MD_PATH, 'utf-8');
      assert.ok(content.includes('07-iterative-refinement.md'), 'should reference 07-iterative-refinement.md');
      assert.ok(content.includes('Self-Improvement'), 'should document self-improvement context');
    });
  });

  describe('Routing logic', () => {
    it('should include refinement trigger in routing', () => {
      const content = readFileSync(SKILL_MD_PATH, 'utf-8');
      assert.ok(content.includes('improve skill') || content.includes('iterate skill'), 'should route improve/iterate tasks');
      assert.ok(content.includes('07-iterative-refinement'), 'should route to iterative refinement reference');
    });
  });

  describe('Iterative refinement triggers', () => {
    it('should document refinement trigger conditions', () => {
      const content = readFileSync(SKILL_MD_PATH, 'utf-8');
      assert.ok(content.includes('improve this skill') || content.includes('iterate on skill'), 'should document improve/iterate triggers');
      assert.ok(content.includes('refine skill quality'), 'should document refine quality trigger');
    });
  });

  describe('Hook integration', () => {
    it('should document self-improvement integration', () => {
      const content = readFileSync(SKILL_MD_PATH, 'utf-8');
      assert.ok(content.includes('Self-Improvement Integration') || content.includes('self-improvement'), 'should document self-improvement');
      assert.ok(content.includes('Pattern Extraction') || content.includes('pattern extraction'), 'should document pattern extraction');
      assert.ok(content.includes('confidence'), 'should document confidence threshold');
    });
  });
});
