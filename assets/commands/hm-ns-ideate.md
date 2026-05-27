---
description: "exploration capture | explore sketch spike spec capture"
argument-hint: ""
requires: [capture, explore, sketch, spike, spec-phase]
tools:
  read: true
  skill: true
---

Route to the appropriate exploration / capture skill based on the user's intent.
`hm-note`, `hm-add-todo`, `hm-add-backlog`, and `hm-plant-seed` were folded
into `hm-capture` (with `--note`, default, `--backlog`, `--seed` modes) by
#2790. The capture target lists pending todos via `--list`.

| User wants | Invoke |
|---|---|
| Explore an idea or opportunity | hm-explore |
| Sketch out a rough design or plan | hm-sketch |
| Time-boxed technical spike | hm-spike |
| Write a spec for a phase | hm-spec-phase |
| Capture a thought (todo / note / backlog / seed) | hm-capture |

Invoke the matched skill directly using the Skill tool.
