/**
 * React error boundary component — catches render errors in child components
 * and displays a fallback UI with retry functionality.
 *
 * Each panel in the dashboard shell is wrapped in its own ErrorBoundary
 * instance so that one panel's crash does not affect the others.
 *
 * @module sidecar/components/error-boundary
 */

"use client"

import React from "react"

export interface ErrorBoundaryProps {
  children: React.ReactNode
  /** Optional custom fallback rendered when an error is caught. */
  fallback?: React.ReactNode
  /** Optional callback invoked when an error is caught. */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary that catches JavaScript errors in its child
 * component tree and displays a fallback UI.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError?.(error, errorInfo)
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid var(--panel-border, #e2e8f0)",
            background: "var(--panel-bg, #ffffff)",
          }}
        >
          <h3 style={{ color: "#ef4444", margin: "0 0 8px" }}>Something went wrong</h3>
          <p style={{ color: "#64748b", margin: "0 0 16px", fontSize: "14px" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            data-testid="retry-button"
            onClick={this.handleRetry}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--panel-border, #e2e8f0)",
              background: "var(--panel-header-bg, #f8fafc)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
