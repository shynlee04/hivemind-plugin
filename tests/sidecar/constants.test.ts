// Evidence label: manual-only
// Phase AUDIT-04.02.4 REQ-01: Sidecar port pool bump (D-36)
// T-01: HIVEMIND_PLUGIN_PORT_LIST[0] must be 4106 (not 4096)
// T-02: Pool size = 10
// T-03: Env var override HIVEMIND_PLUGIN_PORT_LIST=4096,4097 still works
// T-18: npm run typecheck clean
// T-19: npm test no regression

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  HIVEMIND_PLUGIN_PORT_LIST,
  parsePortList,
} from "../../src/sidecar/server/constants.js"

describe("REQ-01: Sidecar port pool starts at 4106 (collision-free)", () => {
  const ENV_KEY = "HIVEMIND_PLUGIN_PORT_LIST"

  beforeEach(() => {
    delete process.env[ENV_KEY]
  })

  afterEach(() => {
    delete process.env[ENV_KEY]
  })

  it("[T-01] HIVEMIND_PLUGIN_PORT_LIST[0] must be 4106 (not 4096)", () => {
    expect(HIVEMIND_PLUGIN_PORT_LIST[0]).toBe(4106)
  })

  it("[T-01] Pool size must remain 10 ports (no ports removed)", () => {
    expect(HIVEMIND_PLUGIN_PORT_LIST.length).toBe(10)
  })

  it("[T-01] Pool must be consecutive: 4106..4115", () => {
    expect(HIVEMIND_PLUGIN_PORT_LIST).toEqual([
      4106, 4107, 4108, 4109, 4110, 4111, 4112, 4113, 4114, 4115,
    ])
  })

  it("[T-01] Pool must NOT include 4096 (OpenCode default server URL port)", () => {
    expect(HIVEMIND_PLUGIN_PORT_LIST).not.toContain(4096)
  })

  it("[T-01] parsePortList() default (no env) must return 4106..4115", () => {
    delete process.env[ENV_KEY]
    expect(parsePortList()).toEqual([
      4106, 4107, 4108, 4109, 4110, 4111, 4112, 4113, 4114, 4115,
    ])
  })

  it("[T-03] parsePortList() honors env var override HIVEMIND_PLUGIN_PORT_LIST=4096,4097", () => {
    process.env[ENV_KEY] = "4096,4097"
    try {
      expect(parsePortList()).toEqual([4096, 4097])
    } finally {
      delete process.env[ENV_KEY]
    }
  })
})
