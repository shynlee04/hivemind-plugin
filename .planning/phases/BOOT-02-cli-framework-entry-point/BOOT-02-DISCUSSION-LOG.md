# BOOT-02 Discussion Log

**Date:** 2026-05-07

## Question 1: Init Wizard Flow
**Options:** 3-step minimal / 5-step thorough / Context-aware adaptive  
**User response:** Full onboarding wizard with config setup — languages, mode, expertise level, delegation systems. Plus meta-concept installation scope (global vs project).  
**Decision:** Wizard includes all 5 config fields + scope selection. D-01 through D-04.

## Question 2: Symlink Granularity
**Options:** Directory-level / File-level  
**Agent self-answered:** Directory-level symlinks (one per skill dir). OpenCode discovers by directory. Simpler for recover. Nested references/ preserved.  
**Decision:** D-05, D-06.

## Question 3: Config Schema Distribution
**Options:** Copy at init time / Embed in source / Reference npm path  
**User:** "Make it work — configs are core and must be comprehensively integrated"  
**Decision:** Build artifact from Zod schema. D-07, D-08.

## Deferred
- Global OpenCode config integration → post-BOOT-07
- hf-doctor / hf-meta-authoring → MCM phases
- Config consumer runtime wiring → CA-04.2
