/**
 * Dashboard shell component — tab navigation with 4-panel grid layout.
 *
 * A `'use client'` component that reads the `?panel=` URL search param
 * to determine the active panel. Tab switches update the URL via
 * `useRouter` and `useSearchParams`. Non-selected panels are hidden via
 * CSS `display: none` but remain mounted to preserve their state.
 *
 * @module sidecar/components/dashboard-shell
 */

"use client"

import React, { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PANELS, DEFAULT_PANEL } from "@lib/constants"
import type { PanelId } from "@lib/constants"
import { useSse } from "@lib/use-sse"
import type { SidecarEvent } from "@lib/types"
import { ErrorBoundary } from "./error-boundary"

export interface DashboardShellProps {
  /** Whether the plugin server is available. */
  pluginAvailable?: boolean
  /** Callback when an SSE event is received. */
  onSseEvent?: (event: SidecarEvent) => void
}

/**
 * The main dashboard shell with tab navigation and 4-panel grid.
 * Uses URL search params for panel state persistence.
 */
function DashboardShellInner({ pluginAvailable = true, onSseEvent }: DashboardShellProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activePanel = (searchParams.get("panel") as PanelId) || DEFAULT_PANEL

  // SSE connection
  const { connected } = useSse({
    onEvent: onSseEvent,
  })

  // Panel components (lazy-loaded)
  const [panelComponents, setPanelComponents] = useState<
    Record<string, React.ComponentType | null>
  >({})

  // Bug #2 fix: track panel ids that have been attempted (success OR fail).
  // Without this guard, a failing dynamic import set state to null, the
  // effect re-ran because panelComponents changed, saw null was still
  // falsy, and re-attempted the import — an infinite tight loop that
  // crashed the browser tab.
  const attemptedRef = useRef<Set<string>>(new Set())

  // Dynamically import panels
  useEffect(() => {
    for (const panel of PANELS) {
      // Already loaded successfully — skip.
      if (panelComponents[panel.id]) continue
      // Already attempted (success path stores the component, fail path
      // stores null) — skip to prevent the re-import loop.
      if (attemptedRef.current.has(panel.id)) continue

      const id = panel.id
      // Mark BEFORE the async import. Even if the import throws
      // synchronously or the component is still rendering when we
      // get here, attemptedRef is the source of truth.
      attemptedRef.current.add(id)

      const importPanel = async () => {
        try {
          const mod = await import(`@panels/${id}`)
          setPanelComponents((prev) => ({ ...prev, [id]: mod.default }))
        } catch (err) {
          // Bug #3 fix: log the actual error so the operator can see
          // what went wrong instead of staring at "Loading..." forever.
          console.error(`[sidecar] Failed to import panel "${id}":`, err)
          setPanelComponents((prev) => ({ ...prev, [id]: null }))
        }
      }
      importPanel()
    }
  }, [panelComponents])

  /** Switch to a different panel tab. */
  const switchPanel = (panelId: PanelId): void => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("panel", panelId)
    router.push(`?${params.toString()}`)
  }

  // Plugin unavailable state
  if (!pluginAvailable) {
    return (
      <div data-not-available="true" style={{ padding: "40px", textAlign: "center" }}>
        <h2>Sidecar not available</h2>
        <p style={{ color: "#64748b" }}>Waiting for plugin server to start...</p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header with tab navigation */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          height: "48px",
          borderBottom: "1px solid var(--panel-border, #e2e8f0)",
          background: "var(--panel-header-bg, #f8fafc)",
          gap: "4px",
        }}
      >
        {/* SSE connection indicator */}
        <span
          data-sse-status={connected ? "connected" : "disconnected"}
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: connected
              ? "var(--status-connected, #22c55e)"
              : "var(--status-disconnected, #ef4444)",
            marginRight: "8px",
            flexShrink: 0,
          }}
          title={connected ? "Connected" : "Disconnected"}
        />

        {/* Tab buttons */}
        {PANELS.map((panel) => (
          <button
            key={panel.id}
            data-tab={panel.id}
            onClick={() => switchPanel(panel.id)}
            title={panel.description}
            style={{
              padding: "6px 12px",
              border: "none",
              background:
                activePanel === panel.id
                  ? "var(--panel-active-tab, #3b82f6)"
                  : "transparent",
              color:
                activePanel === panel.id
                  ? "#ffffff"
                  : "var(--panel-inactive-tab, #64748b)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activePanel === panel.id ? 600 : 400,
              transition: "all 0.15s ease",
            }}
          >
            {panel.icon} {panel.label}
          </button>
        ))}
      </header>

      {/* 2×2 Panel grid */}
      <main
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "1px",
          background: "var(--panel-border, #e2e8f0)",
          overflow: "hidden",
        }}
      >
        {PANELS.map((panel) => {
          const PanelComponent = panelComponents[panel.id]
          return (
            <div
              key={panel.id}
              data-panel="true"
              data-panel-id={panel.id}
              data-active={activePanel === panel.id ? "true" : "false"}
              style={{
                display: activePanel === panel.id ? "flex" : "none",
                flexDirection: "column",
                background: "var(--panel-bg, #ffffff)",
                overflow: "auto",
                padding: "16px",
              }}
            >
              <Suspense
                fallback={
                  <div data-skeleton="true" style={{ flex: 1, borderRadius: "8px", background: "var(--skeleton-bg, #e2e8f0)", animation: "pulse 2s ease-in-out infinite" }} />
                }
              >
                <ErrorBoundary>
                  {PanelComponent ? (
                    <PanelComponent />
                  ) : attemptedRef.current.has(panel.id) ? (
                    // Bug #3 fix: the import was attempted and failed.
                    // Surface a visible error so the operator knows
                    // something is wrong (was: silent "Loading..." forever).
                    <div
                      data-panel-error="true"
                      data-panel-id={panel.id}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#dc2626",
                        fontSize: "13px",
                      }}
                    >
                      <strong>⚠️ Failed to load {panel.label}</strong>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          marginTop: "4px",
                        }}
                      >
                        Check browser console for import error.
                      </div>
                    </div>
                  ) : (
                    // Not yet attempted — genuine loading state.
                    <div
                      data-panel-loading="true"
                      data-panel-id={panel.id}
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "13px",
                      }}
                    >
                      Loading {panel.label}...
                    </div>
                  )}
                </ErrorBoundary>
              </Suspense>
            </div>
          )
        })}
      </main>
    </div>
  )
}

/**
 * Dashboard shell wrapper — wraps the inner component in a Suspense
 * boundary so `useSearchParams` works with Next.js CSR.
 */
export function DashboardShell(props: DashboardShellProps): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          Loading dashboard...
        </div>
      }
    >
      <DashboardShellInner {...props} />
    </Suspense>
  )
}
