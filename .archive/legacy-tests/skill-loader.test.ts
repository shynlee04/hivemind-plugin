import { describe, it } from "node:test"
import assert from "node:assert/strict"
import {
    resolveSkillsForIntent,
    resolveConditionalReferences,
    type SkillLoadContext,
} from "../src/lib/skill-loader.js"

/** Helper — build a SkillLoadContext with sensible defaults */
function ctx(overrides: Partial<SkillLoadContext> = {}): SkillLoadContext {
    return {
        intent: "product-impl",
        isFirstSession: false,
        isPostCompaction: false,
        platform: "antigravity",
        delegationNeeded: false,
        nonEnglishInput: false,
        ...overrides,
    }
}

describe("skill-loader: resolveSkillsForIntent", () => {
    // ── Universal invariants ─────────────────────────────────────
    it("always includes entry-resolution and platform-adapter as required", () => {
        for (const intent of [
            "framework-meta",
            "product-impl",
            "research",
            "ambiguous",
        ] as const) {
            const result = resolveSkillsForIntent(ctx({ intent }))
            assert.ok(
                result.required.includes("entry-resolution"),
                `${intent}: missing entry-resolution`,
            )
            assert.ok(
                result.required.includes("platform-adapter"),
                `${intent}: missing platform-adapter`,
            )
        }
    })

    it("never duplicates skills across required / conditional / deferred", () => {
        for (const intent of [
            "framework-meta",
            "product-impl",
            "research",
            "ambiguous",
        ] as const) {
            const result = resolveSkillsForIntent(ctx({ intent }))
            const all = [...result.required, ...result.conditional, ...result.deferred]
            const unique = new Set(all)
            assert.equal(all.length, unique.size, `${intent}: duplicate skills detected`)
        }
    })

    // ── Intent-specific mapping ──────────────────────────────────
    it("framework-meta: includes meta-builder-governance as conditional", () => {
        const result = resolveSkillsForIntent(ctx({ intent: "framework-meta" }))
        assert.ok(result.conditional.includes("meta-builder-governance"))
    })

    it("product-impl: includes verification-methodology as conditional", () => {
        const result = resolveSkillsForIntent(ctx({ intent: "product-impl" }))
        assert.ok(result.conditional.includes("verification-methodology"))
    })

    it("research: includes research-methodology as required", () => {
        const result = resolveSkillsForIntent(ctx({ intent: "research" }))
        assert.ok(result.required.includes("research-methodology"))
    })

    it("ambiguous: includes context-integrity as required, defers everything else", () => {
        const result = resolveSkillsForIntent(ctx({ intent: "ambiguous" }))
        assert.ok(result.required.includes("context-integrity"))
        assert.equal(result.conditional.length, 0, "ambiguous should have no conditional skills")
        assert.ok(result.deferred.length > 0, "ambiguous should defer non-essential skills")
    })

    // ── Context-driven promotions ────────────────────────────────
    it("post-compaction: always adds context-integrity to required", () => {
        const result = resolveSkillsForIntent(
            ctx({ intent: "product-impl", isPostCompaction: true }),
        )
        assert.ok(result.required.includes("context-integrity"))
    })

    it("delegation needed: promotes delegation-framework to conditional", () => {
        const result = resolveSkillsForIntent(
            ctx({ intent: "product-impl", delegationNeeded: true }),
        )
        assert.ok(
            result.conditional.includes("delegation-framework"),
            "delegation-framework should be conditional when delegation needed",
        )
        assert.ok(
            !result.deferred.includes("delegation-framework"),
            "delegation-framework should not remain deferred",
        )
    })
})

describe("skill-loader: resolveConditionalReferences", () => {
    it("first session: includes persona-routing reference", () => {
        const refs = resolveConditionalReferences(ctx({ isFirstSession: true }))
        assert.ok(refs.some((r) => r.reference.includes("persona-routing")))
    })

    it("non-English input: includes language-adaptation reference", () => {
        const refs = resolveConditionalReferences(ctx({ nonEnglishInput: true }))
        assert.ok(refs.some((r) => r.reference.includes("language-adaptation")))
    })

    it("post-compaction: includes tdd-gate reference", () => {
        const refs = resolveConditionalReferences(ctx({ isPostCompaction: true }))
        assert.ok(refs.some((r) => r.reference.includes("tdd-gate")))
    })

    it("default context: no conditional references", () => {
        const refs = resolveConditionalReferences(ctx())
        assert.equal(refs.length, 0)
    })
})
