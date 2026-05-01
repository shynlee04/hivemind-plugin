/**
 * Sidecar root page — Phase 42 foundation stub.
 *
 * Real dashboard tabs are deferred to SIDECAR-01. This stub renders a
 * placeholder so the Next.js skeleton has a valid entrypoint and the
 * foundation PR doesn't leave a 404 at the root route.
 */

/**
 * Foundation-only landing page. Will be replaced by the dashboard
 * tab router in SIDECAR-01.
 *
 * @returns A placeholder React element documenting the deferred scope.
 */
export default function HomePage() {
  return (
    <main>
      <h1>OpenCode Harness Sidecar</h1>
      <p>
        Phase 42 foundation. Dashboard tabs (SIDECAR-01) and OpenCode SDK bridge (SIDECAR-02) are
        deferred to follow-up phases. Read-only enforcement against canonical state (SIDECAR-03) is
        live; see <code>../src/sidecar/readonly-state.ts</code>.
      </p>
    </main>
  )
}
