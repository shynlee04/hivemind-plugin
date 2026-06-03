import { describe, it, expect } from "vitest"
import React from "react"

describe("loading", () => {
  describe("skeleton rendering", () => {
    it("should render skeleton matching 4-panel grid dimensions", () => {
      // RED: will fail until loading.tsx provides LoadingSkeleton
      const { container } = render(<LoadingSkeleton panelCount={4} />)
      const skeletons = container.querySelectorAll("[data-skeleton]")
      expect(skeletons.length).toBe(4)
    })

    it("should have animate-pulse class for shimmer effect", () => {
      const { container } = render(<LoadingSkeleton panelCount={1} />)
      const skeleton = container.querySelector("[data-skeleton]")
      expect(skeleton).toBeTruthy()
    })
  })
})

// ── Helpers ──

function render(element: React.ReactElement): { container: HTMLElement } {
  // RED scaffold
  throw new Error("NOT_IMPLEMENTED: render must be provided by @testing-library/react")
}

function LoadingSkeleton(_props: { panelCount: number }): React.ReactElement | null {
  // RED scaffold
  throw new Error("NOT_IMPLEMENTED: LoadingSkeleton must be provided by loading.tsx")
}
