/**
 * json-render catalog wrapper — deep-frozen typed export.
 *
 * @module sidecar/catalog/json-render-catalog
 */

import data from "./json-render-catalog.json" with { type: "json" }

/** Recursively freeze an object. */
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj
  for (const name of Object.getOwnPropertyNames(obj)) {
    const value = (obj as Record<string, unknown>)[name]
    if (value && typeof value === "object") deepFreeze(value)
  }
  return Object.freeze(obj)
}

export const JSON_RENDER_CATALOG = deepFreeze(data)
