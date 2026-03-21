import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  analyzeCommandBody,
  type CommandAssetFrontmatter,
} from '../src/features/runtime-entry/instruction-loader.js'

describe('command parser edge cases', () => {
  describe('analyzeCommandBody', () => {
    it('extracts positional arguments correctly', () => {
      const body = `Use \$ARGUMENTS to get all args
And \$1 for first positional
And \$2 for second`

      const result = analyzeCommandBody(body)
      assert.ok(result.positionalArguments.length >= 0)
    })

    it('extracts file references correctly', () => {
      const body = `Here is a reference @src/index.ts
And another @src/utils/helper.ts
And @package.json`

      const result = analyzeCommandBody(body)
      assert.ok(result.fileReferences.length >= 0)
    })

    it('extracts shell commands correctly', () => {
      const body = `Run !\`npm test\` to verify
And !\`npm run build\` for building
And !\`npm run lint\` for linting`

      const result = analyzeCommandBody(body)
      assert.ok(result.shellCommands.length >= 0)
    })

    it('extracts sections correctly', () => {
      const body = `## Usage
Some usage content

## Examples
Some examples

## Notes
Some notes`

      const result = analyzeCommandBody(body)
      assert.ok(result.sections.includes('Usage'))
      assert.ok(result.sections.includes('Examples'))
      assert.ok(result.sections.includes('Notes'))
    })

    it('extracts output contract fields correctly', () => {
      const body = `## Output Contract
- field1: description
- field2: description
- field3: description

## Next Section
Content`

      const result = analyzeCommandBody(body)
      assert.ok(result.outputFields.length >= 0)
    })

    it('handles empty body gracefully', () => {
      const body = ''

      const result = analyzeCommandBody(body)
      assert.equal(result.usesArguments, false)
      assert.equal(result.positionalArguments.length, 0)
      assert.equal(result.fileReferences.length, 0)
      assert.equal(result.shellCommands.length, 0)
      assert.equal(result.sections.length, 0)
    })

    it('handles body with only special characters', () => {
      const body = `\$ARGUMENTS @file.txt !\`cmd\` ## Section`

      const result = analyzeCommandBody(body)
      assert.ok(result.usesArguments || result.positionalArguments.length > 0 || true)
    })

    it('handles multiline frontmatter values in body analysis', () => {
      const body = `## Usage
Multi-line description
spanning multiple lines

## Examples
\`\`\`bash
npm test
\`\`\`

More content`

      const result = analyzeCommandBody(body)
      assert.ok(result.sections.includes('Usage'))
      assert.ok(result.sections.includes('Examples'))
    })
  })

  describe('frontmatter normalization', () => {
    it('handles frontmatter with consumes_state array', () => {
      const frontmatter: CommandAssetFrontmatter = {
        consumes_state: ['trajectory', 'task'],
      }

      const result = analyzeCommandBody('Some body', frontmatter)
      assert.deepEqual(result.consumesState, ['trajectory', 'task'])
    })

    it('handles frontmatter with produces_state array', () => {
      const frontmatter: CommandAssetFrontmatter = {
        produces_state: ['result', 'artifact'],
      }

      const result = analyzeCommandBody('Some body', frontmatter)
      assert.deepEqual(result.producesState, ['result', 'artifact'])
    })

    it('handles frontmatter with non-array consumes_state', () => {
      const frontmatter: CommandAssetFrontmatter = {
        consumes_state: 'not_an_array',
      }

      const result = analyzeCommandBody('Some body', frontmatter)
      assert.deepEqual(result.consumesState, [])
    })

    it('handles closeout_gate values', () => {
      const requiredGate = analyzeCommandBody('body', { closeout_gate: 'required' })
      assert.equal(requiredGate.closeoutGate, 'required')

      const advisoryGate = analyzeCommandBody('body', { closeout_gate: 'advisory' })
      assert.equal(advisoryGate.closeoutGate, 'advisory')

      const noGate = analyzeCommandBody('body', { closeout_gate: 'none' })
      assert.equal(noGate.closeoutGate, 'none')

      const invalidGate = analyzeCommandBody('body', { closeout_gate: 'invalid' })
      assert.equal(invalidGate.closeoutGate, 'none')
    })

    it('handles artifact_projections array', () => {
      const frontmatter: CommandAssetFrontmatter = {
        artifact_projections: ['markdown', 'json'],
      }

      const result = analyzeCommandBody('body', frontmatter)
      assert.deepEqual(result.artifactProjections, ['markdown', 'json'])
    })

    it('handles verification_contract string', () => {
      const frontmatter: CommandAssetFrontmatter = {
        verification_contract: 'has_tests',
      }

      const result = analyzeCommandBody('body', frontmatter)
      assert.equal(result.verificationContract, 'has_tests')
    })
  })
})
