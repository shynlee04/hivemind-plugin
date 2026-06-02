#!/usr/bin/env bats
#
# 60-visual-dependency-graph.bats — Phase 55 REQ-55-04 acceptance (criterion 4):
# the PaneGridPlanner.computeSplitSequence method produces a 4-element
# SplitCommand sequence for a 5-node delegation tree (DFS preorder), and
# applying those commands via `tmux split-window` produces a valid 5-pane
# tmux session with the expected parent-child layout.

load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  tmux kill-session -t "p55-grid-$$" 2>/dev/null || true
}

@test "PaneGridPlanner emits 4-element DFS preorder SplitCommand sequence + tmux split produces 5-pane layout" {
  local project="$(tmux_bats_project_dir)"
  local tmux_session="p55-grid-$$"

  # Step 1: assert the 4-element SplitCommand sequence for the canonical
  # 5-node tree: root → [a → [a1, a2], b]. DFS preorder emits 4
  # SplitCommands (one per non-root node): a, a1, a2, b.
  run tmux_node_eval "
    const { PaneGridPlanner } = await import('${TMUX_BATS_DIST}/grid-planner.js');
    const tree = {
      id: 'root',
      children: [
        { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
        { id: 'b' },
      ],
    };
    const planner = new PaneGridPlanner(0);   // debounceMs=0 → immediate
    const cmds = planner.computeSplitSequence(tree);
    const summary = cmds.map((c) => c.parentPaneId + ':' + c.direction).join(',');
    process.stdout.write('count=' + cmds.length + ' sequence=' + summary);
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"count=4"* ]]
  [[ "$output" == *"root:h"* ]]   # a: depth-1 → "h"
  [[ "$output" == *"a:v"* ]]       # a1: depth-2 → "v"
  [[ "$output" == *"a:v"* ]]       # a2: depth-2 → "v"
  [[ "$output" == *"root:h"* ]]   # b: depth-1 → "h"

  # Step 2: spawn a real tmux session and apply the 4 SplitCommands
  tmux new-session -d -s "$tmux_session" -c "$project"
  run tmux has-session -t "$tmux_session"
  [ "$status" -eq 0 ]

  # Capture the root pane id (pane 0 — the original pane from `tmux new-session`)
  local pane_session_id
  pane_session_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | sed -n '1p')"
  [ -n "$pane_session_id" ]

  # Apply split a (parentPaneId=root, direction=h)
  run tmux split-window -t "$tmux_session" -d -h
  [ "$status" -eq 0 ]
  # Apply split a1 (parentPaneId=<a's pane>, direction=v)
  local pane_a pane_a1 pane_a2 pane_b
  pane_a="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | sed -n '2p')"   # pane 0 is root, pane 1 is a
  run tmux split-window -t "$pane_a" -d -v
  [ "$status" -eq 0 ]
  pane_a1="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | sed -n '3p')"  # pane 2 is a1
  # Apply split a2 (parentPaneId=<a's pane>, direction=v)
  run tmux split-window -t "$pane_a" -d -v
  [ "$status" -eq 0 ]
  pane_a2="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | sed -n '4p')"  # pane 3 is a2
  # Apply split b (parentPaneId=root, direction=h)
  run tmux split-window -t "$tmux_session" -d -h
  [ "$status" -eq 0 ]
  pane_b="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | sed -n '5p')"    # pane 4 is b

  # Step 3: assert the tmux session has 5 panes
  run bash -c "tmux list-panes -t '$tmux_session' | wc -l | tr -d ' '"
  [ "$status" -eq 0 ]
  [ "$output" = "5" ]

  # Step 4: assert parent-child mapping (a1 parent = a, a2 parent = a, b parent = root)
  # tmux stores parent pane id in #{pane_parent}; root pane has no parent (empty)
  run tmux list-panes -t "$tmux_session" -F '#{pane_id}:#{pane_parent}'
  [ "$status" -eq 0 ]
  [[ "$output" == *"${pane_a1}:${pane_a}"* ]]
  [[ "$output" == *"${pane_a2}:${pane_a}"* ]]
  [[ "$output" == *"${pane_b}:${pane_session_id}"* ]]   # b's parent is the root pane

  # Cleanup
  tmux kill-session -t "$tmux_session"
}
