import { test } from 'node:test';
import assert from 'node:assert';
import { mkdtemp, writeFile, mkdir, rm, rename } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createStateManager } from '../src/lib/persistence.js';
import type { Logger } from '../src/lib/logging.js';

test('persistence withState logs error when backup fails', async (t) => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'hivemind-test-'));

  // Setup paths according to standard structure (v2)
  const hivemindDir = join(tmpDir, '.hivemind');
  const stateDir = join(hivemindDir, 'state');

  const brainPath = join(stateDir, 'brain.json');
  const bakPath = join(stateDir, 'brain.json.bak');

  try {
    // 1. Setup initial state directories and file
    await mkdir(stateDir, { recursive: true });

    const initialState = {
      session: {
        id: 'test-session',
        start_time: Date.now(),
        last_activity: Date.now(),
        governance_status: 'OPEN',
        governance_mode: 'assisted',
        meta_key: '',
        role: '',
        by_ai: true,
        date: new Date().toISOString().split('T')[0],
      },
      hierarchy: {
        trajectory: '',
        tactic: '',
        action: '',
      },
      metrics: {
        files_touched: [],
        turn_count: 0,
        drift_score: 0,
        consecutive_failures: 0,
        consecutive_same_section: 0,
        last_section_content: '',
        keyword_flags: [],
        write_without_read_count: 0,
        tool_type_counts: { read: 0, write: 0, query: 0, governance: 0 },
        governance_counters: {
            out_of_order: 0,
            drift: 0,
            compaction: 0,
            evidence_pressure: 0,
            ignored: 0,
            acknowledged: false,
            prerequisites_completed: false,
        },
      },
      framework_selection: {
        choice: null,
        active_phase: "",
        active_spec_path: "",
        acceptance_note: "",
        updated_at: 0,
      },
      last_commit_suggestion_turn: 0,
      compaction_count: 0,
      last_compaction_time: 0,
      next_compaction_report: null,
      cycle_log: [],
      pending_failure_ack: false,
    };

    await writeFile(brainPath, JSON.stringify(initialState));

    // 2. Create directory at backup path to force rename failure (EISDIR)
    await mkdir(bakPath);

    // 3. Create spy logger
    const logs: string[] = [];
    const logger: Logger = {
      debug: async (msg) => { logs.push(`DEBUG: ${msg}`); },
      info: async (msg) => { logs.push(`INFO: ${msg}`); },
      warn: async (msg) => { logs.push(`WARN: ${msg}`); },
      error: async (msg) => { logs.push(`ERROR: ${msg}`); },
    };

    // 4. Create state manager
    const stateManager = createStateManager(tmpDir, logger);

    // 5. Call withState
    await stateManager.withState(async (state) => {
      state.metrics.turn_count += 1;
      return state;
    });

    // 6. Verify logs
    const hasWarnLog = logs.some(log => log.includes('WARN: Failed to create backup'));

    // Check if the log exists.
    assert.ok(hasWarnLog, 'Should have logged a warning about backup failure. Logs: ' + JSON.stringify(logs));

  } finally {
    // Cleanup
    await rm(tmpDir, { recursive: true, force: true });
  }
});
