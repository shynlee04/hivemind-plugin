import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { measureIdeationClarity } from "../../src/lib/ideation-engine.js"

/**
 * Helper to create a valid spec for reuse across tests.
 */
function makeValidSpec(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    user_intent: "Build a task management API with PostgreSQL backend",
    proposed_stack: ["Node.js", "PostgreSQL", "Express"],
    mcp_research_refs: ["deepwiki: expressjs/express - middleware patterns"],
    requirements: [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        feature_name: "Task CRUD",
        state_matrix: {
          ideal: "POST /tasks creates task, returns 201 with task object including generated UUID",
          empty: "GET /tasks returns empty array with 200 status when no tasks exist in database",
          latency: "Database query exceeds 5 second timeout, return 504 with retry-after header",
          partial_failure: "Redis cache unavailable but PostgreSQL responds, serve from database directly",
          destructive: "DELETE /tasks/:id soft-deletes by setting deleted_at timestamp, returns 204",
        },
        tdd_vectors: [
          "Given empty database When POST /tasks with valid body Then return 201 with task",
          "When GET /tasks and database is empty Then return 200 with empty array",
          "Given database timeout exceeds 5 seconds When any query Then return 504",
        ],
        code_intel_anchors: ["TaskSchema", "TaskController"],
      },
    ],
    ...overrides,
  }
}

describe("ideation-engine", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // QAI Dimension Tests (Weasel Word Detection)
  // ═══════════════════════════════════════════════════════════════════════════

  it("QAI passes when no weasel words present", () => {
    const spec = makeValidSpec()
    const result = measureIdeationClarity(spec, [])

    const qai = result.dimensions.find(d => d.dimension === "QAI")
    assert.ok(qai)
    assert.strictEqual(qai.passed, true)
    assert.strictEqual(qai.score, 100)
    assert.deepStrictEqual(qai.warnings, [])
  })

  it("QAI fails when weasel words detected", () => {
    const spec = makeValidSpec({
      user_intent: "Build a fast and scalable task management API",
    })
    const result = measureIdeationClarity(spec, [])

    const qai = result.dimensions.find(d => d.dimension === "QAI")
    assert.ok(qai)
    assert.strictEqual(qai.passed, false)
    assert.ok(qai.warnings.length > 0)
    assert.ok(qai.warnings[0].includes("fast"))
    assert.ok(qai.warnings[0].includes("scalable"))
  })

  it("QAI score decreases per weasel word found", () => {
    const spec = makeValidSpec({
      user_intent: "Build a fast, scalable, robust, modern, and efficient API",
    })
    const result = measureIdeationClarity(spec, [])

    const qai = result.dimensions.find(d => d.dimension === "QAI")
    assert.ok(qai)
    assert.strictEqual(qai.passed, false)
    // 5 weasel words = 100 - 5*20 = 0, but with Math.max(0, ...) protection
    assert.ok(qai.score <= 40, `Expected score <= 40, got ${qai.score}`)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // UPS Dimension Tests (5-State MECE Matrix)
  // ═══════════════════════════════════════════════════════════════════════════

  it("UPS passes when all 5 states defined with >= 10 chars", () => {
    const spec = makeValidSpec()
    const result = measureIdeationClarity(spec, [])

    const ups = result.dimensions.find(d => d.dimension === "UPS")
    assert.ok(ups)
    assert.strictEqual(ups.passed, true)
    assert.strictEqual(ups.score, 100)
    assert.deepStrictEqual(ups.warnings, [])
  })

  it("UPS fails when states are missing", () => {
    const spec = makeValidSpec({
      requirements: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          feature_name: "Task CRUD",
          state_matrix: {
            ideal: "POST /tasks creates task, returns 201 with task object",
            empty: "GET /tasks returns empty array with 200 status",
            latency: "Database query exceeds 5 second timeout, return 504",
            // Missing: partial_failure, destructive
          },
          tdd_vectors: ["Given empty database When POST /tasks Then return 201"],
        },
      ],
    })
    const result = measureIdeationClarity(spec, [])

    const ups = result.dimensions.find(d => d.dimension === "UPS")
    assert.ok(ups)
    assert.strictEqual(ups.passed, false)
    assert.ok(ups.warnings.some(w => w.includes("partial_failure") || w.includes("destructive")))
  })

  it("UPS fails when state text is too short", () => {
    const spec = makeValidSpec({
      requirements: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          feature_name: "Task CRUD",
          state_matrix: {
            ideal: "POST /tasks creates task, returns 201 with task object including generated UUID",
            empty: "GET /tasks returns empty array with 200 status when no tasks exist in database",
            latency: "Database query exceeds 5 second timeout, return 504 with retry-after header",
            partial_failure: "too short",  // < 10 chars
            destructive: "DELETE /tasks/:id soft-deletes by setting deleted_at timestamp, returns 204",
          },
          tdd_vectors: ["Given empty database When POST /tasks Then return 201"],
        },
      ],
    })
    const result = measureIdeationClarity(spec, [])

    const ups = result.dimensions.find(d => d.dimension === "UPS")
    assert.ok(ups)
    assert.strictEqual(ups.passed, false)
    assert.ok(ups.warnings.some(w => w.includes("partial_failure")))
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // AGS Dimension Tests (MCP Research References)
  // ═══════════════════════════════════════════════════════════════════════════

  it("AGS passes when mcp_research_refs is non-empty", () => {
    const spec = makeValidSpec()
    const result = measureIdeationClarity(spec, [])

    const ags = result.dimensions.find(d => d.dimension === "AGS")
    assert.ok(ags)
    assert.strictEqual(ags.passed, true)
    assert.strictEqual(ags.score, 100)
    assert.deepStrictEqual(ags.warnings, [])
  })

  it("AGS fails when mcp_research_refs is empty or missing", () => {
    const spec = makeValidSpec({ mcp_research_refs: [] })
    const result = measureIdeationClarity(spec, [])

    const ags = result.dimensions.find(d => d.dimension === "AGS")
    assert.ok(ags)
    assert.strictEqual(ags.passed, false)
    assert.strictEqual(ags.score, 0)
    assert.ok(ags.warnings[0].includes("No MCP research citations"))
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NR Dimension Tests (Noun Resolution)
  // ═══════════════════════════════════════════════════════════════════════════

  it("NR passes when entities are grounded in knownSymbols", () => {
    const spec = makeValidSpec()
    // Ground most entities found in spec: TaskSchema, TaskController, PostgreSQL, Express, Node, etc.
    // NR allows up to 5 unresolved, spec has ~13 entities
    const knownSymbols = [
      "TaskSchema", "TaskController", "PostgreSQL", "Express", "Node",
      "Task", "CRUD", "Redis", "Database", "POST", "GET", "DELETE", "Build",
    ]
    const result = measureIdeationClarity(spec, knownSymbols)

    const nr = result.dimensions.find(d => d.dimension === "NR")
    assert.ok(nr)
    assert.strictEqual(nr.passed, true)
  })

  it("NR fails when too many unresolved entities", () => {
    const spec = makeValidSpec({
      user_intent: "Build a task management system with UnknownEntityA, UnknownEntityB, UnknownEntityC, UnknownEntityD, UnknownEntityE, UnknownEntityF, UnknownEntityG, UnknownEntityH, UnknownEntityI, UnknownEntityJ, UnknownEntityK",
    })
    const result = measureIdeationClarity(spec, [])

    const nr = result.dimensions.find(d => d.dimension === "NR")
    assert.ok(nr)
    assert.strictEqual(nr.passed, false)
    assert.ok(nr.warnings.some(w => w.includes("entities not grounded")))
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // TDD-M Dimension Tests (Given/When/Then Vectors)
  // ═══════════════════════════════════════════════════════════════════════════

  it("TDD-M passes when all requirements have valid vectors", () => {
    const spec = makeValidSpec()
    const result = measureIdeationClarity(spec, [])

    const tddm = result.dimensions.find(d => d.dimension === "TDD-M")
    assert.ok(tddm)
    assert.strictEqual(tddm.passed, true)
    assert.strictEqual(tddm.score, 100)
    assert.deepStrictEqual(tddm.warnings, [])
  })

  it("TDD-M fails when vectors do not start with Given/When/Then", () => {
    const spec = makeValidSpec({
      requirements: [
        {
          id: "550e8400-e29b-41d4-a716-446655440001",
          feature_name: "Task CRUD",
          state_matrix: {
            ideal: "POST /tasks creates task, returns 201 with task object including generated UUID",
            empty: "GET /tasks returns empty array with 200 status when no tasks exist in database",
            latency: "Database query exceeds 5 second timeout, return 504 with retry-after header",
            partial_failure: "Redis cache unavailable but PostgreSQL responds, serve from database directly",
            destructive: "DELETE /tasks/:id soft-deletes by setting deleted_at timestamp, returns 204",
          },
          tdd_vectors: [
            "The system should create tasks when POST is called",
            "When GET /tasks and database is empty Then return 200 with empty array",
          ],
        },
      ],
    })
    const result = measureIdeationClarity(spec, [])

    const tddm = result.dimensions.find(d => d.dimension === "TDD-M")
    assert.ok(tddm)
    assert.strictEqual(tddm.passed, false)
    assert.ok(tddm.warnings.some(w => w.includes("not starting with Given/When/Then")))
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // Integration Tests (Overall Results)
  // ═══════════════════════════════════════════════════════════════════════════

  it("returns passed=true when all 5 dimensions pass", () => {
    const spec = makeValidSpec()
    // Ground most entities found in spec to satisfy NR dimension (threshold allows up to 5 unresolved)
    const knownSymbols = [
      "TaskSchema", "TaskController", "PostgreSQL", "Express", "Node",
      "Task", "CRUD", "Redis", "Database", "POST", "GET", "DELETE", "Build",
    ]
    const result = measureIdeationClarity(spec, knownSymbols)

    assert.strictEqual(result.passed, true)
    assert.strictEqual(result.overallScore, 100)
    assert.deepStrictEqual(result.warnings, [])
    assert.strictEqual(result.dimensions.length, 5)
    assert.ok(result.dimensions.every(d => d.passed))
  })

  it("returns passed=false when any dimension fails", () => {
    const spec = makeValidSpec({
      user_intent: "Build a fast task management API",
    })
    const result = measureIdeationClarity(spec, ["TaskSchema", "TaskController"])

    assert.strictEqual(result.passed, false)
    assert.ok(result.warnings.length > 0)
    assert.ok(result.warnings.some(w => w.includes("fast")))
  })
})
