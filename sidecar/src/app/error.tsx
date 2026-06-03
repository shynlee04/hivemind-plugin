/**
 * Error page for the sidecar — global error boundary.
 *
 * A `'use client'` component that receives `error` and `reset` props
 * from Next.js's error boundary. Provides a "Try again" button to
 * recover from transient errors.
 *
 * @module sidecar/app/error
 */

"use client"

export interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error page for the sidecar app.
 *
 * @param props - Error details and reset function from Next.js.
 * @returns An error UI with details and retry capability.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 600, margin: "0 0 8px", color: "#ef4444" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#64748b", margin: "0 0 24px", maxWidth: "480px", fontSize: "14px", lineHeight: 1.5 }}>
        {error.message || "An unexpected error occurred while loading the sidecar dashboard."}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "10px 24px",
          borderRadius: "8px",
          border: "1px solid var(--panel-border, #e2e8f0)",
          background: "var(--panel-header-bg, #f8fafc)",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        Try again
      </button>
    </div>
  )
}
