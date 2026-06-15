/**
 * English keyword map for intent classification (P27.2 T22).
 *
 * @see `src/features/intent-classification/engine.ts` KEYWORD_MAP for original.
 */

import type { LocaleKeywordMap } from "../vocabulary.js"

/**
 * English keyword map. Extracted from the original engine.ts KEYWORD_MAP.
 */
export const localeKeywords: LocaleKeywordMap = {
  CODE_TOUCH: [
    ["implement", /\b(implement|implementing|implemented)\b/i],
    ["fix", /\b(fix|fixes|fixing|fixed)\b/i],
    ["add", /\b(add|adds|adding|added)\b/i],
    ["create", /\b(create|creates|creating|created)\b/i],
    ["build", /\b(build|builds|building|built)\b/i],
    ["refactor", /\b(refactor|refactors|refactoring|refactored)\b/i],
    ["modify", /\b(modify|modifies|modifying|modified)\b/i],
    ["update", /\b(update|updates|updating|updated)\b/i],
    ["write", /\b(write|writes|writing|wrote)\b/i],
    ["change", /\b(change|changes|changing|changed)\b/i],
    ["rewrite", /\b(rewrite|rewrites|rewriting|rewrote)\b/i],
    ["patch", /\b(patch|patches|patching|patched)\b/i],
  ],
  RESEARCH: [
    ["how does", /\b(how does|how do|how is|how are)\b/i],
    ["explain", /\b(explain|explains|explaining|explained)\b/i],
    ["what is", /\b(what is|what are)\b/i],
    ["describe", /\b(describe|describes|describing|described)\b/i],
    ["document", /\b(document|documents|documenting|documented)\b/i],
    ["overview", /\b(overview|overviews)\b/i],
    ["introduce", /\b(introduce|introduces|introducing|introduced)\b/i],
    ["tell me about", /\b(tell me about)\b/i],
  ],
  INVESTIGATION: [
    ["why is", /\b(why is|why are|why does|why did|why do)\b/i],
    ["find", /\b(find|finds|finding|found)\b/i],
    ["root cause", /\b(root cause)\b/i],
    ["debug", /\b(debug|debugs|debugging|debugged)\b/i],
    ["investigate", /\b(investigate|investigates|investigating|investigated)\b/i],
    ["diagnose", /\b(diagnose|diagnoses|diagnosing|diagnosed)\b/i],
    ["troubleshoot", /\b(troubleshoot|troubleshoots|troubleshooting|troubleshot)\b/i],
    ["broken", /\b(broken|break|breaks|breaking|broke)\b/i],
    ["failing", /\b(failing|fails|failed)\b/i],
    ["error", /\b(error|errors|errored)\b/i],
    ["crash", /\b(crash|crashes|crashing|crashed)\b/i],
  ],
  EXPLORATION: [
    ["what if", /\b(what if)\b/i],
    ["design", /\b(design|designs|designing|designed)\b/i],
    ["brainstorm", /\b(brainstorm|brainstorms|brainstorming|brainstormed)\b/i],
    ["ideate", /\b(ideate|ideates|ideating|ideated)\b/i],
    ["explore", /\b(explore|explores|exploring|explored)\b/i],
    ["consider", /\b(consider|considers|considering|considered)\b/i],
    ["options", /\b(options|option)\b/i],
    ["alternative", /\b(alternative|alternatives)\b/i],
    ["possibility", /\b(possibility|possibilities)\b/i],
    ["could we", /\b(could we|should we|might we)\b/i],
  ],
}
