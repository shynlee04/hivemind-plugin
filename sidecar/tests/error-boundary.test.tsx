import { describe, it, expect, vi, beforeEach } from "vitest"
import React from "react"

describe("error-boundary", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("crash isolation", () => {
    it("should show fallback UI when child throws", () => {
      // RED: will fail until error-boundary.tsx provides ErrorBoundary
      const { container } = render(
        <ErrorBoundary fallback={<div data-testid="fallback">Error</div>}>
          <ThrowingComponent />
        </ErrorBoundary>,
      )
      const fallback = container.querySelector('[data-testid="fallback"]')
      expect(fallback).toBeTruthy()
    })

    it("should render children when no error occurs", () => {
      const { container } = render(
        <ErrorBoundary fallback={<div>Error</div>}>
          <div data-testid="child">OK</div>
        </ErrorBoundary>,
      )
      const child = container.querySelector('[data-testid="child"]')
      expect(child).toBeTruthy()
    })

    it("should not crash other panels when one panel throws", () => {
      const { container } = render(
        <div>
          <ErrorBoundary fallback={<div data-testid="panel1-error">Error in Panel 1</div>}>
            <ThrowingComponent />
          </ErrorBoundary>
          <ErrorBoundary fallback={<div>Error</div>}>
            <div data-testid="panel2-ok">Panel 2 OK</div>
          </ErrorBoundary>
        </div>,
      )
      const panel1Error = container.querySelector('[data-testid="panel1-error"]')
      const panel2Ok = container.querySelector('[data-testid="panel2-ok"]')
      expect(panel1Error).toBeTruthy()
      expect(panel2Ok).toBeTruthy()
    })
  })

  describe("retry functionality", () => {
    it("should provide retry button in fallback UI", () => {
      const { container } = render(
        <ErrorBoundary fallback={<div data-testid="fallback">Error</div>}>
          <ThrowingComponent />
        </ErrorBoundary>,
      )
      const retryButton = container.querySelector('[data-testid="retry-button"]')
      expect(retryButton).toBeTruthy()
    })

    it("should re-render children on retry", () => {
      const { container } = render(
        <ErrorBoundary fallback={<div data-testid="fallback">Error</div>}>
          <div data-testid="child-after-retry">Retried</div>
        </ErrorBoundary>,
      )
      const retryButton = container.querySelector('[data-testid="retry-button"]')
      if (retryButton) {
        const click = new MouseEvent("click", { bubbles: true })
        retryButton.dispatchEvent(click)
      }
      const child = container.querySelector('[data-testid="child-after-retry"]')
      expect(child).toBeTruthy()
    })
  })
})

// ── Helpers ──

class ThrowingComponent extends React.Component {
  componentDidMount() {
    throw new Error("Test error")
  }
  render() {
    return null
  }
}

function render(element: React.ReactElement): { container: HTMLElement } {
  // RED scaffold
  throw new Error("NOT_IMPLEMENTED: render must be provided by @testing-library/react")
}

function ErrorBoundary(_props: {
  children: React.ReactNode
  fallback: React.ReactElement
}): React.ReactElement | null {
  // RED scaffold
  throw new Error("NOT_IMPLEMENTED: ErrorBoundary must be provided by error-boundary.tsx")
}
