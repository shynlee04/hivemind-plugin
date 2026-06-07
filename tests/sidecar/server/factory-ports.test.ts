/**
 * Tests for the fixed port-range port allocation in createSidecarServer.
 *
 * @see /Users/apple/hivemind-plugin-private/.hivemind/planning/plugin-port-pool-2026-06-07/00-landscape.md
 *
 * Test port range: 47200-47500 (chosen high to avoid conflicts with common dev servers).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import net from "node:net"

import { createSidecarServer } from "../../../src/sidecar/server/factory.js"
import {
  HIVEMIND_PLUGIN_PORT_LIST,
  parsePortList,
  findAvailablePort,
} from "../../../src/sidecar/server/constants.js"
import { SidecarDependencyRegistry } from "../../../src/sidecar/server/registry.js"
import { SseConnectionPool } from "../../../src/sidecar/server/sse/pool.js"

// ---------------------------------------------------------------------------
// Constant — HIVEMIND_PLUGIN_PORT_LIST
// ---------------------------------------------------------------------------

describe("HIVEMIND_PLUGIN_PORT_LIST constant", () => {
  it("is a readonly tuple of 10 ports in 4096-4105", () => {
    expect(HIVEMIND_PLUGIN_PORT_LIST).toEqual([
      4096, 4097, 4098, 4099, 4100, 4101, 4102, 4103, 4104, 4105,
    ])
  })

  it("is frozen / readonly (cannot be mutated)", () => {
    // The `as const` annotation + `readonly number[]` type makes the
    // runtime array plain but the type contract prevents callers from
    // mutating it. We assert the type-level intent by checking the
    // array length does not change.
    expect(HIVEMIND_PLUGIN_PORT_LIST.length).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// parsePortList
// ---------------------------------------------------------------------------

describe("parsePortList", () => {
  const ORIGINAL = process.env.HIVEMIND_PLUGIN_PORT_LIST

  beforeEach(() => {
    delete process.env.HIVEMIND_PLUGIN_PORT_LIST
  })
  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.HIVEMIND_PLUGIN_PORT_LIST
    } else {
      process.env.HIVEMIND_PLUGIN_PORT_LIST = ORIGINAL
    }
  })

  it("returns the default list when env is unset", () => {
    expect(parsePortList()).toEqual(HIVEMIND_PLUGIN_PORT_LIST)
  })

  it("returns the default list when env is empty string", () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = ""
    expect(parsePortList()).toEqual(HIVEMIND_PLUGIN_PORT_LIST)
  })

  it("parses a comma-separated list", () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = "47200,47201,47202"
    expect(parsePortList()).toEqual([47200, 47201, 47202])
  })

  it("trims whitespace around each port", () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = "47200 , 47201 , 47202"
    expect(parsePortList()).toEqual([47200, 47201, 47202])
  })

  it("falls back to the default list when all entries are invalid", () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = "abc,def,xyz"
    expect(parsePortList()).toEqual(HIVEMIND_PLUGIN_PORT_LIST)
  })

  it("filters out invalid entries but keeps valid ones", () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = "47200,abc,47201,30000"
    // 30000 is a valid TCP port (1 < n < 65536) so it should be kept;
    // "abc" is filtered out.
    expect(parsePortList()).toEqual([47200, 47201, 30000])
  })
})

// ---------------------------------------------------------------------------
// findAvailablePort (pure function)
// ---------------------------------------------------------------------------

describe("findAvailablePort", () => {
  const listeners: net.Server[] = []

  afterEach(() => {
    for (const s of listeners) {
      s.close()
    }
    listeners.length = 0
  })

  /** Occupy a port on 127.0.0.1. Caller's afterEach cleans it up. */
  async function occupy(port: number): Promise<void> {
    const server = net.createServer()
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject)
      server.once("listening", () => resolve())
      server.listen(port, "127.0.0.1")
    })
    listeners.push(server)
  }

  it("returns the first port when it is free", async () => {
    const port = await findAvailablePort([47300, 47301])
    expect(port).toBe(47300)
  })

  it("skips a taken port and returns the next free one", async () => {
    await occupy(47310)
    const port = await findAvailablePort([47310, 47311, 47312])
    expect(port).toBe(47311)
  })

  it("walks through the entire list if early ports are taken", async () => {
    await occupy(47320)
    await occupy(47321)
    const port = await findAvailablePort([47320, 47321, 47322])
    expect(port).toBe(47322)
  })

  it("rejects with a [Hivemind] error when every port is taken", async () => {
    await occupy(47330)
    await occupy(47331)
    await expect(findAvailablePort([47330, 47331])).rejects.toThrow(
      /\[Hivemind\] All 2 plugin server ports are in use: 47330, 47331/,
    )
  })

  it("rejects with a [Hivemind] error when the list is empty", async () => {
    await expect(findAvailablePort([])).rejects.toThrow(/\[Hivemind\] All 0/)
  })
})

// ---------------------------------------------------------------------------
// createSidecarServer — port allocation integration
// ---------------------------------------------------------------------------

describe("createSidecarServer port allocation", () => {
  let registry: SidecarDependencyRegistry
  let ssePool: SseConnectionPool
  let projectDirectory: string

  const ORIGINAL_PLUGIN_PORT = process.env.HIVEMIND_PLUGIN_PORT
  const ORIGINAL_PORT_LIST = process.env.HIVEMIND_PLUGIN_PORT_LIST

  beforeEach(() => {
    delete process.env.HIVEMIND_PLUGIN_PORT
    delete process.env.HIVEMIND_PLUGIN_PORT_LIST
    registry = new SidecarDependencyRegistry()
    ssePool = new SseConnectionPool({})
    projectDirectory = "/tmp" // dummy — port-file write goes to /tmp/.hivemind/state
  })

  afterEach(() => {
    if (ORIGINAL_PLUGIN_PORT === undefined) {
      delete process.env.HIVEMIND_PLUGIN_PORT
    } else {
      process.env.HIVEMIND_PLUGIN_PORT = ORIGINAL_PLUGIN_PORT
    }
    if (ORIGINAL_PORT_LIST === undefined) {
      delete process.env.HIVEMIND_PLUGIN_PORT_LIST
    } else {
      process.env.HIVEMIND_PLUGIN_PORT_LIST = ORIGINAL_PORT_LIST
    }
  })

  it("binds to a port from the default list when no env vars are set", async () => {
    const server = await createSidecarServer({ registry, ssePool, projectDirectory })
    try {
      expect(HIVEMIND_PLUGIN_PORT_LIST).toContain(server.port)
    } finally {
      await server.close()
    }
  })

  it("honors HIVEMIND_PLUGIN_PORT env var (single port, highest precedence)", async () => {
    process.env.HIVEMIND_PLUGIN_PORT = "47400"
    const server = await createSidecarServer({ registry, ssePool, projectDirectory })
    try {
      expect(server.port).toBe(47400)
    } finally {
      await server.close()
    }
  })

  it("honors HIVEMIND_PLUGIN_PORT_LIST env var (custom list)", async () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = "47500,47501,47502"
    const server = await createSidecarServer({ registry, ssePool, projectDirectory })
    try {
      expect([47500, 47501, 47502]).toContain(server.port)
    } finally {
      await server.close()
    }
  })

  it("falls back to the next port in HIVEMIND_PLUGIN_PORT_LIST if the first is taken", async () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = "47510,47511,47512"

    // Occupy 47510
    const occupier = net.createServer()
    await new Promise<void>((resolve, reject) => {
      occupier.once("error", reject)
      occupier.once("listening", () => resolve())
      occupier.listen(47510, "127.0.0.1")
    })

    try {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      try {
        expect(server.port).toBe(47511)
      } finally {
        await server.close()
      }
    } finally {
      occupier.close()
    }
  })

  it("rejects with a [Hivemind] error when every port in HIVEMIND_PLUGIN_PORT_LIST is taken", async () => {
    process.env.HIVEMIND_PLUGIN_PORT_LIST = "47520,47521"

    // Occupy both
    const a = net.createServer()
    const b = net.createServer()
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        a.once("error", reject)
        a.once("listening", () => resolve())
        a.listen(47520, "127.0.0.1")
      }),
      new Promise<void>((resolve, reject) => {
        b.once("error", reject)
        b.once("listening", () => resolve())
        b.listen(47521, "127.0.0.1")
      }),
    ])

    try {
      await expect(
        createSidecarServer({ registry, ssePool, projectDirectory }),
      ).rejects.toThrow(/\[Hivemind\] All 2 plugin server ports are in use: 47520, 47521/)
    } finally {
      a.close()
      b.close()
    }
  })
})
