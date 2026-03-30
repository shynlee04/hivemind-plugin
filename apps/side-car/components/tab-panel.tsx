'use client'

import React from 'react'

/** Props for the TabPanel content wrapper. */
export interface TabPanelProps {
  isActive: boolean
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  children: React.ReactNode
}

/** Spinner displayed while a tab's spec is loading. */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <svg
        className="h-6 w-6 animate-spin text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-sm">Loading...</span>
    </div>
  )
}

/** Error card with retry button. */
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16">
      <div className="rounded-lg border border-destructive/50 bg-card p-6 text-center">
        <p className="mb-4 text-sm text-destructive">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground
                       hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * TabPanel wraps tab content and handles visibility, loading, and error states.
 * Inactive panels use display:none — they do not render to the DOM.
 */
export default function TabPanel({ isActive, isLoading, error, onRetry, children }: TabPanelProps) {
  if (!isActive) return null

  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (isLoading) return <LoadingState />

  return <>{children}</>
}
