type CorrelationCandidate = {
  source: string;
  value: unknown;
};

export const SURFACE_POLL_CADENCE_MS = 5000;
const STALE_MULTIPLIER = 3;

export const SURFACE_STALE_AFTER_MS = SURFACE_POLL_CADENCE_MS * STALE_MULTIPLIER;

export interface SurfaceFreshness {
  lastUpdatedAt: string;
  ageMs: number;
  pollCadenceMs: number;
  staleAfterMs: number;
  isStale: boolean;
}

export interface SurfaceCorrelation {
  runKey: string;
  source: string;
}

function normalizeToken(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (text === "" || text.toLowerCase() === "n/a") return "";
  return text;
}

function parseIsoMs(value: string): number | null {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

export function resolveRunCorrelation(candidates: CorrelationCandidate[], fallback = "n/a"): SurfaceCorrelation {
  for (const candidate of candidates) {
    const normalized = normalizeToken(candidate.value);
    if (normalized) {
      return {
        runKey: normalized,
        source: candidate.source,
      };
    }
  }

  return {
    runKey: fallback,
    source: "fallback",
  };
}

export function resolveFreshness(lastUpdatedAt: unknown, nowIso: string): SurfaceFreshness {
  const normalizedLastUpdated = normalizeToken(lastUpdatedAt) || nowIso;
  const nowMs = parseIsoMs(nowIso);
  const updatedMs = parseIsoMs(normalizedLastUpdated);

  let ageMs = 0;
  if (nowMs !== null && updatedMs !== null) {
    ageMs = Math.max(0, nowMs - updatedMs);
  }

  return {
    lastUpdatedAt: normalizedLastUpdated,
    ageMs,
    pollCadenceMs: SURFACE_POLL_CADENCE_MS,
    staleAfterMs: SURFACE_STALE_AFTER_MS,
    isStale: ageMs > SURFACE_STALE_AFTER_MS,
  };
}
