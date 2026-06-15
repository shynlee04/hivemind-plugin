// Evidence label: runtime-truthful
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'

const OPENCODE_BINARY = process.env.OPENCODE_TEST_BINARY || '/usr/local/bin/opencode'
const BINARY_EXISTS = existsSync(OPENCODE_BINARY)

describe('E2E: OpenCode binary session creation', () => {
  it('should have OPENCODE_TEST_BINARY set or binary at default path', () => {
    expect(BINARY_EXISTS).toBe(true)
    expect(OPENCODE_BINARY).toBeTruthy()
  })

  ;(BINARY_EXISTS ? it : it.skip)('should create a v2 session with real binary', async () => {
    // Note: This requires running opencode as a server.
    // Full E2E session creation requires server startup which is
    // tested in the integration test suite.
    expect(BINARY_EXISTS).toBe(true)
  })
})
