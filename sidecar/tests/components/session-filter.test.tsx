/**
 * Tests for SessionFilter component (SC-04 Wave 2b).
 *
 * Per 04-SPEC.md:
 *   - UR-SC04-05: Search/filter input that filters by id/description/status/agent
 *   - ER-SC04-03: Debounced search (150ms) — PARENT'S responsibility
 *   - AC-SC04-07: Search debounce is 150ms
 *
 * Per 04-PATTERNS.md (Class Sketches 4.4) — SessionFilter is a pure
 * controlled input. The component does NOT debounce itself; debouncing
 * is the parent's responsibility (Wave 3 panel composition wraps the
 * onChange callback in useDeferredValue + 150ms setTimeout per 04-CONTEXT.md
 * GA-3).
 *
 * Per 04-CONTEXT.md GA-3: 150ms debounce at the panel layer.
 *
 * @see ../../src/components/session-filter.tsx
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md (UR-SC04-05)
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-CONTEXT.md (GA-3)
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PATTERNS.md (Class Sketches 4.4)
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SessionFilter } from "@components/session-filter"

describe("SessionFilter", () => {
  it("renders an input with placeholder text", () => {
    render(<SessionFilter value="" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText(/search sessions/i)
    expect(input).toBeInTheDocument()
  })

  it("calls onChange immediately when typing (pure controlled input — no internal debounce)", () => {
    const onChange = vi.fn()
    render(<SessionFilter value="" onChange={onChange} />)
    const input = screen.getByTestId("session-filter-input")
    fireEvent.change(input, { target: { value: "research" } })
    // Every keystroke fires onChange immediately.
    // Debouncing is the parent's responsibility per 04-PATTERNS.md.
    expect(onChange).toHaveBeenCalledWith("research")
  })

  it("displays the current value (controlled input)", () => {
    render(<SessionFilter value="active" onChange={vi.fn()} />)
    const input = screen.getByTestId("session-filter-input")
    expect(input).toHaveValue("active")
  })

  it("has a clear button when value is non-empty", () => {
    render(<SessionFilter value="research" onChange={vi.fn()} />)
    expect(screen.getByTestId("session-filter-clear")).toBeInTheDocument()
  })

  it("does NOT have a clear button when value is empty", () => {
    render(<SessionFilter value="" onChange={vi.fn()} />)
    expect(screen.queryByTestId("session-filter-clear")).not.toBeInTheDocument()
  })

  it("clear button calls onChange with empty string", () => {
    const onChange = vi.fn()
    render(<SessionFilter value="research" onChange={onChange} />)
    fireEvent.click(screen.getByTestId("session-filter-clear"))
    expect(onChange).toHaveBeenCalledWith("")
  })

  it("component does NOT debounce — fires onChange on every keystroke (parent's job per 04-PATTERNS.md)", () => {
    // This test asserts the component is NOT debouncing — it calls
    // onChange on every keystroke. The parent (Wave 3 panel composition)
    // wraps this in useDeferredValue + 150ms setTimeout per 04-CONTEXT.md GA-3.
    const onChange = vi.fn()
    render(<SessionFilter value="" onChange={onChange} />)
    const input = screen.getByTestId("session-filter-input")
    fireEvent.change(input, { target: { value: "a" } })
    fireEvent.change(input, { target: { value: "ab" } })
    fireEvent.change(input, { target: { value: "abc" } })
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenNthCalledWith(1, "a")
    expect(onChange).toHaveBeenNthCalledWith(2, "ab")
    expect(onChange).toHaveBeenNthCalledWith(3, "abc")
  })

  it("renders with consistent styling (matches dashboard shell color palette)", () => {
    const { container } = render(<SessionFilter value="" onChange={vi.fn()} />)
    const input = container.querySelector('[data-testid="session-filter-input"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    // Verify it has the expected font size and border styling for visual consistency
    expect(input.style.fontSize).toBe("13px")
    expect(input.style.border).toContain("1px solid")
  })

  it("accepts a custom placeholder override", () => {
    render(<SessionFilter value="" onChange={vi.fn()} placeholder="Find sessions..." />)
    expect(screen.getByPlaceholderText("Find sessions...")).toBeInTheDocument()
  })
})
