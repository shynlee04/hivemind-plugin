/**
 * Loading skeleton for the sidecar dashboard.
 *
 * Renders an animated skeleton matching the 4-panel grid layout during
 * the initial page load and when dynamic imports are resolving.
 *
 * @module sidecar/app/loading
 */

/**
 * Default loading component rendered by Next.js during page transitions.
 *
 * @returns An animated 4-cell skeleton matching the dashboard grid.
 */
export default function Loading() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        height: "100vh",
        gap: "1px",
        background: "var(--panel-border, #e2e8f0)",
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          data-skeleton="true"
          style={{
            background: "var(--panel-bg, #ffffff)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Simulated header */}
          <div
            style={{
              height: "20px",
              width: "60%",
              borderRadius: "4px",
              background: "var(--skeleton-bg, #e2e8f0)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          {/* Simulated content lines */}
          <div
            style={{
              height: "12px",
              width: "90%",
              borderRadius: "4px",
              background: "var(--skeleton-bg, #e2e8f0)",
              animation: "pulse 2s ease-in-out infinite",
              animationDelay: "0.2s",
            }}
          />
          <div
            style={{
              height: "12px",
              width: "75%",
              borderRadius: "4px",
              background: "var(--skeleton-bg, #e2e8f0)",
              animation: "pulse 2s ease-in-out infinite",
              animationDelay: "0.4s",
            }}
          />
          <div
            style={{
              height: "12px",
              width: "80%",
              borderRadius: "4px",
              background: "var(--skeleton-bg, #e2e8f0)",
              animation: "pulse 2s ease-in-out infinite",
              animationDelay: "0.6s",
            }}
          />
        </div>
      ))}
    </div>
  )
}
