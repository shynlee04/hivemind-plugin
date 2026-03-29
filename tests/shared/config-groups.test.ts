import assert from 'node:assert/strict'
import test from 'node:test'

import { SupportedLanguage } from '../../src/schema-kernel/config-records.js'
import { CONFIG_GROUPS } from '../../src/shared/config-groups.js'

test('language validValues come from SupportedLanguage schema authority', () => {
  const supportedLanguages = Object.values(SupportedLanguage)

  assert.deepEqual(
    CONFIG_GROUPS.language.validValues?.communication_language,
    supportedLanguages,
  )
  assert.deepEqual(
    CONFIG_GROUPS.language.validValues?.document_language,
    supportedLanguages,
  )
})
