# Phase 22: Script Hardening + 6-NON — Playbook Phase 4

**Status:** NOT SUBSTANTIATED — Phase directory created 2026-04-23, no prior work exists

**Goal:** Harden all skill scripts against 6-NON failures and add defence tables.

**Requirements from Playbook Phase 4:**
- Add 6-NON defence tables to all 7 differential cluster skills
- Harden scripts: add guards, validation, error handling
- Ensure scripts report facts, not judgments (per NON-5)
- Each script must have proper `validate-skill.sh` coverage

**Reality Check (from audit 2026-04-23):**
- Commit `4aa2c79e` added 6-NON tables to 7 *existing* skills NOT the Phase 20 created skills
- Some Phase 20 created skills (`hm-opencode-project-inspection`, `hm-subagent-delegation-patterns`) have no eval bundles
- No phase directory existed before 2026-04-23

**Plans:** 1 plan

Plans:
- [ ] 22-01-PLAN.md — Add 6-NON defence tables to 7 Phase 20 created/split skills, harden scripts with guards/validation, verify with `validate-skill.sh`
