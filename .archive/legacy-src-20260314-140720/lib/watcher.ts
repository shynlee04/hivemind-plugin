/**
 * File System Watcher for idumb-v2
 *
 * Uses native fs.watch with debouncing to prevent event loop
 * exhaustion on bulk file operations.
 *
 * @module lib/watcher
 */

import { watch, type FSWatcher, statSync } from "fs";
import { join } from "path";
import { EventEmitter } from "events";
import type { ArtifactEvent } from "../schemas/events.js";
import { createEvent } from "./event-bus.js";

// ─── Types ──────────────────────────────────────────────────────────────

export interface WatcherConfig {
  /** Debounce interval in milliseconds */
  debounceMs: number;
  /** Patterns to ignore */
  ignorePatterns: RegExp[];
}

export interface FileChangeEvent {
  /** Absolute file path */
  path: string;
  /** Event type */
  type: "created" | "modified" | "deleted";
  /** Timestamp */
  timestamp: string;
}

// ─── Default Configuration ──────────────────────────────────────────────

const DEFAULT_CONFIG: WatcherConfig = {
  debounceMs: 300,
  ignorePatterns: [
    /node_modules/,
    /\.git/,
    /\.hivemind/,
    /dist/,
    /build/,
    /\.DS_Store/,
    /thumbs\.db/i,
  ],
};

// ─── File System Watcher Class ──────────────────────────────────────────

/**
 * Native file system watcher with debouncing support.
 * Emits "file:created", "file:modified", "file:deleted" events.
 */
export class FileSystemWatcher extends EventEmitter {
  private watchers: Map<string, FSWatcher> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: WatcherConfig;

  constructor(config?: Partial<WatcherConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Watch a directory recursively
   */
  watchDirectory(dir: string): void {
    if (this.watchers.has(dir)) {
      return; // Already watching
    }

    // Create watcher for directory
    const watcher = watch(
      dir,
      { recursive: true, persistent: false },
      (eventType, filename) => {
        if (!filename) return;

        const fullPath = join(dir, filename);

        // Check ignore patterns
        if (this.shouldIgnore(fullPath)) {
          return;
        }

        // Debounce the event
        this.debouncedEmit(fullPath, eventType);
      }
    );

    watcher.on("error", (err) => {
      this.emit("error", err);
    });

    this.watchers.set(dir, watcher);

    // Emit activation event
    const event: ArtifactEvent = createEvent(
      "plugin:activated",
      { directory: dir },
      "fs-watcher"
    );
    this.emit("event", event);
  }

  /**
   * Stop watching a directory
   */
  stopWatching(dir: string): void {
    const watcher = this.watchers.get(dir);
    if (watcher) {
      watcher.close();
      this.watchers.delete(dir);
    }

    // Clear any pending debounce timers for this directory
    for (const [path, timer] of this.debounceTimers) {
      if (path.startsWith(dir)) {
        clearTimeout(timer);
        this.debounceTimers.delete(path);
      }
    }
  }

  /**
   * Stop all watchers
   */
  stopAll(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Check if a path should be ignored
   */
  private shouldIgnore(path: string): boolean {
    return this.config.ignorePatterns.some((pattern) => pattern.test(path));
  }

  /**
   * Emit event with debouncing to prevent rapid-fire events
   */
  private debouncedEmit(path: string, eventType: string): void {
    // Clear existing timer if any
    const existingTimer = this.debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(path);
      this.emitFileEvent(path, eventType);
    }, this.config.debounceMs);

    this.debounceTimers.set(path, timer);
  }

  /**
   * Emit the actual file event
   */
  private emitFileEvent(path: string, eventType: string): void {
    let eventTypeStr: "file:created" | "file:modified" | "file:deleted";

    // Map fs.watch event types to our event types
    if (eventType === "rename") {
      // 'rename' can be create or delete
      // Check if file exists
      try {
        statSync(path);
        eventTypeStr = "file:created";
      } catch {
        eventTypeStr = "file:deleted";
      }
    } else {
      // 'change' = modified
      eventTypeStr = "file:modified";
    }

    const event: ArtifactEvent = createEvent(
      eventTypeStr,
      { path },
      "fs-watcher"
    );

    // Emit both the specific event type and generic "event"
    this.emit(eventTypeStr, event);
    this.emit("event", event);
  }

  /**
   * Get count of active watchers
   */
  get watcherCount(): number {
    return this.watchers.size;
  }

  /**
   * Check if a directory is being watched
   */
  isWatching(dir: string): boolean {
    return this.watchers.has(dir);
  }
}

// ─── Singleton Export ───────────────────────────────────────────────────

export const fileWatcher = new FileSystemWatcher();
