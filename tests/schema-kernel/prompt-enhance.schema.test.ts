import { describe, it, expect } from "vitest"
import {
  PromptSkimResultSchema,
  PromptAnalysisFindingSchema,
  PromptAnalysisResultSchema,
  ContextBudgetRecordSchema,
  SessionPatchRecordSchema,
  EnhancedPromptOutputSchema,
  PipelineStateSchema,
} from "../../src/schema-kernel/index.js"
import type {
  PromptSkimResult,
  PromptAnalysisFinding,
  PromptAnalysisResult,
  ContextBudgetRecord,
  SessionPatchRecord,
  EnhancedPromptOutput,
  PipelineState,
} from "../../src/schema-kernel/index.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validSkim(): PromptSkimResult {
  return {
    word_count: 500,
    line_count: 40,
    token_estimate: 650,
    url_count: 2,
    urls: ["https://example.com", "https://docs.example.org/api"],
    path_count: 1,
    paths: [{ path: "/src/lib/helpers.ts", exists: true }],
    absolute_claim_count: 3,
    complexity_score: 6,
    flooding_risk: "medium",
    recommended_lanes: ["investigation", "clarification"],
  }
}

function validFinding(): PromptAnalysisFinding {
  return {
    line: 12,
    text: "The system guarantees 99.99% uptime",
    type: "absolute_claim",
    severity: "critical",
    suggestion: "Add error budget context or qualify the claim",
  }
}

function validAnalysis(): PromptAnalysisResult {
  return {
    findings: [validFinding()],
    finding_count: 1,
    by_severity: { critical: 1, important: 0, minor: 0 },
    clarity_score: 72,
  }
}

function validBudget(): ContextBudgetRecord {
  return {
    budget_pct: 65,
    compaction_count: 2,
    status: "warning",
    remaining_estimate: 5000,
    risk_level: "medium",
  }
}

function validPatch(): SessionPatchRecord {
  return {
    section: "status",
    old_value: "idle",
    new_value: "running",
    backup_path: ".hivemind/state/.patches/status.bak",
    timestamp: "2026-04-06T10:00:00Z",
    status: "ok",
  }
}

function validOutput(): EnhancedPromptOutput {
  return {
    frontmatter: {
      version: "1.0.0",
      enhanced_at: "2026-04-06T10:00:00Z",
      complexity_before: 7,
      complexity_after: 4,
      confidence: 0.85,
      phases_completed: ["skim", "bridge", "investigation"],
    },
    body_xml: "<enhanced><section>content</section></enhanced>",
  }
}

function validPipeline(): PipelineState {
  return {
    current_phase: "investigation",
    phase_results: [{ skim: "done" }],
    blockers: [],
    ready_for_next_phase: true,
    session_id: "ses_abc123",
    started_at: "2026-04-06T09:00:00Z",
    updated_at: "2026-04-06T09:30:00Z",
  }
}

// ---------------------------------------------------------------------------
// PromptSkimResultSchema
// ---------------------------------------------------------------------------

describe("PromptSkimResultSchema", () => {
  it("accepts a valid record", () => {
    const result = PromptSkimResultSchema.safeParse(validSkim())
    expect(result.success).toBe(true)
  })

  it("rejects missing required field (word_count)", () => {
    const { word_count, ...rest } = validSkim()
    const result = PromptSkimResultSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it("rejects negative word_count", () => {
    const result = PromptSkimResultSchema.safeParse({ ...validSkim(), word_count: -1 })
    expect(result.success).toBe(false)
  })

  it("rejects float complexity_score", () => {
    const result = PromptSkimResultSchema.safeParse({ ...validSkim(), complexity_score: 5.5 })
    expect(result.success).toBe(false)
  })

  it("rejects out-of-range complexity_score (0)", () => {
    const result = PromptSkimResultSchema.safeParse({ ...validSkim(), complexity_score: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects out-of-range complexity_score (11)", () => {
    const result = PromptSkimResultSchema.safeParse({ ...validSkim(), complexity_score: 11 })
    expect(result.success).toBe(false)
  })

  it("rejects invalid flooding_risk value", () => {
    const result = PromptSkimResultSchema.safeParse({ ...validSkim(), flooding_risk: "extreme" })
    expect(result.success).toBe(false)
  })

  it("rejects non-url in urls array", () => {
    const result = PromptSkimResultSchema.safeParse({
      ...validSkim(),
      urls: ["not-a-url"],
    })
    expect(result.success).toBe(false)
  })

  it("rejects extra fields (strict)", () => {
    const result = PromptSkimResultSchema.safeParse({
      ...validSkim(),
      extra_field: "should not exist",
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PromptAnalysisFindingSchema
// ---------------------------------------------------------------------------

describe("PromptAnalysisFindingSchema", () => {
  it("accepts a valid finding", () => {
    const result = PromptAnalysisFindingSchema.safeParse(validFinding())
    expect(result.success).toBe(true)
  })

  it("rejects non-positive line number", () => {
    const result = PromptAnalysisFindingSchema.safeParse({ ...validFinding(), line: 0 })
    expect(result.success).toBe(false)
  })

  it("rejects empty text", () => {
    const result = PromptAnalysisFindingSchema.safeParse({ ...validFinding(), text: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid type enum value", () => {
    const result = PromptAnalysisFindingSchema.safeParse({
      ...validFinding(),
      type: "unknown_type",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty suggestion", () => {
    const result = PromptAnalysisFindingSchema.safeParse({ ...validFinding(), suggestion: "" })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PromptAnalysisResultSchema
// ---------------------------------------------------------------------------

describe("PromptAnalysisResultSchema", () => {
  it("accepts a valid analysis result", () => {
    const result = PromptAnalysisResultSchema.safeParse(validAnalysis())
    expect(result.success).toBe(true)
  })

  it("rejects clarity_score above 100", () => {
    const result = PromptAnalysisResultSchema.safeParse({
      ...validAnalysis(),
      clarity_score: 101,
    })
    expect(result.success).toBe(false)
  })

  it("rejects clarity_score below 0", () => {
    const result = PromptAnalysisResultSchema.safeParse({
      ...validAnalysis(),
      clarity_score: -1,
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing by_severity object", () => {
    const { by_severity, ...rest } = validAnalysis()
    const result = PromptAnalysisResultSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ContextBudgetRecordSchema
// ---------------------------------------------------------------------------

describe("ContextBudgetRecordSchema", () => {
  it("accepts a valid budget record", () => {
    const result = ContextBudgetRecordSchema.safeParse(validBudget())
    expect(result.success).toBe(true)
  })

  it("accepts minimal record without optional fields", () => {
    const result = ContextBudgetRecordSchema.safeParse({
      budget_pct: 50,
      compaction_count: 0,
      status: "ok",
    })
    expect(result.success).toBe(true)
  })

  it("rejects budget_pct above 100", () => {
    const result = ContextBudgetRecordSchema.safeParse({
      ...validBudget(),
      budget_pct: 150,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative budget_pct", () => {
    const result = ContextBudgetRecordSchema.safeParse({
      ...validBudget(),
      budget_pct: -10,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid status value", () => {
    const result = ContextBudgetRecordSchema.safeParse({
      ...validBudget(),
      status: "unknown",
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// SessionPatchRecordSchema
// ---------------------------------------------------------------------------

describe("SessionPatchRecordSchema", () => {
  it("accepts a valid patch record", () => {
    const result = SessionPatchRecordSchema.safeParse(validPatch())
    expect(result.success).toBe(true)
  })

  it("accepts record with optional error field", () => {
    const result = SessionPatchRecordSchema.safeParse({
      ...validPatch(),
      status: "error",
      error: "File not found",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty section", () => {
    const result = SessionPatchRecordSchema.safeParse({ ...validPatch(), section: "" })
    expect(result.success).toBe(false)
  })

  it("rejects empty new_value", () => {
    const result = SessionPatchRecordSchema.safeParse({ ...validPatch(), new_value: "" })
    expect(result.success).toBe(false)
  })

  it("rejects invalid datetime format", () => {
    const result = SessionPatchRecordSchema.safeParse({
      ...validPatch(),
      timestamp: "not-a-date",
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// EnhancedPromptOutputSchema
// ---------------------------------------------------------------------------

describe("EnhancedPromptOutputSchema", () => {
  it("accepts a valid output", () => {
    const result = EnhancedPromptOutputSchema.safeParse(validOutput())
    expect(result.success).toBe(true)
  })

  it("accepts output with optional warnings", () => {
    const result = EnhancedPromptOutputSchema.safeParse({
      ...validOutput(),
      frontmatter: {
        ...validOutput().frontmatter,
        warnings: ["Low confidence on complexity estimate"],
      },
    })
    expect(result.success).toBe(true)
  })

  it("rejects confidence above 1", () => {
    const result = EnhancedPromptOutputSchema.safeParse({
      ...validOutput(),
      frontmatter: { ...validOutput().frontmatter, confidence: 1.5 },
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative confidence", () => {
    const result = EnhancedPromptOutputSchema.safeParse({
      ...validOutput(),
      frontmatter: { ...validOutput().frontmatter, confidence: -0.1 },
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty body_xml", () => {
    const result = EnhancedPromptOutputSchema.safeParse({
      ...validOutput(),
      body_xml: "",
    })
    expect(result.success).toBe(false)
  })

  it("rejects extra fields on root (strict)", () => {
    const result = EnhancedPromptOutputSchema.safeParse({
      ...validOutput(),
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// PipelineStateSchema
// ---------------------------------------------------------------------------

describe("PipelineStateSchema", () => {
  it("accepts a valid pipeline state", () => {
    const result = PipelineStateSchema.safeParse(validPipeline())
    expect(result.success).toBe(true)
  })

  it("rejects invalid phase name", () => {
    const result = PipelineStateSchema.safeParse({
      ...validPipeline(),
      current_phase: "unknown_phase",
    })
    expect(result.success).toBe(false)
  })

  it("rejects non-boolean ready_for_next_phase", () => {
    const result = PipelineStateSchema.safeParse({
      ...validPipeline(),
      ready_for_next_phase: "yes",
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid datetime", () => {
    const result = PipelineStateSchema.safeParse({
      ...validPipeline(),
      started_at: "not-a-datetime",
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing session_id", () => {
    const { session_id, ...rest } = validPipeline()
    const result = PipelineStateSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })
})
