
#!/usr/bin/env bash
# guided-discovery.sh — User profiler for adaptive guided discovery
#
# Analyzes user input to detect:
#   1. Language preference (en, vi, bilingual)
#   2. Maturity level (L0 beginner, L1 intermediate, L2 advanced, L3 expert)
#   3. Input complexity band (short, medium, long, wall-of-text)
#   4. Guidance needs (high, medium, low)
#
# Feeds into journey-intake-qa.sh to adapt question delivery style.
#
# Usage:
#   guided-discovery.sh "user input text"
#   guided-discovery.sh --json "tôi muốn tạo một agent mới"
#
# Output: JSON profile for downstream consumption by discovery command

set -Eeuo pipefail

MODE="json"
INPUT=""

for arg in "$@"; do
  case "$arg" in
    --json)    MODE="json" ;;
    --human)   MODE="human" ;;
    --*)       printf '{"error":"unknown_flag","flag":"%s"}\n' "$arg" >&2; exit 1 ;;
    *)         INPUT="$arg" ;;
  esac
done

# --- Guard: empty input ---

if [[ -z "$INPUT" ]]; then
  printf '{"language":"en","maturity":"L0","input_band":"short","guidance":"high","needs_discovery":true,"reasoning":"No input. Defaulting to beginner English with full guidance."}\n'
  exit 0
fi

NORM=$(printf '%s' "$INPUT" | tr '[:upper:]' '[:lower:]')
CHAR_COUNT=${#INPUT}
WORD_COUNT=$(printf '%s' "$INPUT" | wc -w | tr -d ' ')

# ========================================================
# 1. LANGUAGE DETECTION
# ========================================================

lang_vi_score=0
lang_en_score=0

# Vietnamese Unicode markers (diacritical characters)
vi_chars="ă|â|đ|ê|ô|ơ|ư|ắ|ằ|ẳ|ẵ|ặ|ấ|ầ|ẩ|ẫ|ậ|ế|ề|ể|ễ|ệ|ố|ồ|ổ|ỗ|ộ|ớ|ờ|ở|ỡ|ợ|ứ|ừ|ử|ữ|ự"

if printf '%s' "$INPUT" | grep -qiE "$vi_chars"; then
  lang_vi_score=$((lang_vi_score + 10))
fi

# Vietnamese common words/phrases
for vw in "tôi" "muốn" "cần" "tạo" "sửa" "giúp" "làm" "thế nào" "là gì" \
           "được không" "bị" "lỗi" "kiểm tra" "xem" "cho" "một" "này" "những" \
           "không" "có" "và" "hoặc" "nhưng" "nếu" "thì" "với" "từ" "đến" \
           "hãy" "xin" "vui lòng" "cám ơn" "dạ" "vâng" "ừ" "ok" \
           "agent" "skill" "command" "workflow"; do
  if [[ "$NORM" == *"$vw"* ]]; then
    lang_vi_score=$((lang_vi_score + 2))
  fi
done

# Vietnamese full phrases
for vp in "tôi muốn" "tạo một" "giúp tôi" "làm thế nào" "là gì" \
          "bị lỗi" "không hoạt động" "kiểm tra giúp" "xin hãy" \
          "cần giúp" "tôi cần" "cho tôi"; do
  if [[ "$NORM" == *"$vp"* ]]; then
    lang_vi_score=$((lang_vi_score + 5))
  fi
done

# English common words (only count if substantial)
for ew in "build" "create" "fix" "help" "want" "need" "please" "check" \
          "how" "what" "why" "when" "should" "could" "would" "can" \
          "the" "is" "are" "this" "that" "my" "your"; do
  if [[ "$NORM" == *"$ew"* ]]; then
    lang_en_score=$((lang_en_score + 1))
  fi
done

# Determine language
detected_lang="en"
if (( lang_vi_score >= 10 && lang_vi_score > lang_en_score )); then
  detected_lang="vi"
elif (( lang_vi_score >= 5 && lang_en_score >= 5 )); then
  detected_lang="bilingual"
fi

# ========================================================
# 2. MATURITY LEVEL DETECTION
# ========================================================

maturity_score=0

# Beginner signals (negative = more beginner)
for beg in "how do i" "what is" "what does" "can you explain" "i don't know" \
           "i'm new" "beginner" "first time" "never used" "confused" \
           "what should i" "help me" "i don't understand" "where do i start" \
           "là gì" "thế nào" "giúp tôi" "không biết" "lần đầu" "mới dùng"; do
  if [[ "$NORM" == *"$beg"* ]]; then
    maturity_score=$((maturity_score - 3))
  fi
done

# Expert signals (positive = more expert)
for exp in "frontmatter" "schema" "contract" "delegation" "pipeline" "gate" \
           "anti-pattern" "parity" "cross-reference" "verification" "evidence" \
           "enforcement" "trajectory" "milestone" "quality-check" "state-update" \
           "agent profile" "permission" "scope boundary" "deterministic"; do
  if [[ "$NORM" == *"$exp"* ]]; then
    maturity_score=$((maturity_score + 3))
  fi
done

# Technical vocabulary density (expert signal)
tech_count=0
for tech in "git" "bash" "json" "yaml" "typescript" "opencode" "hivemind" \
            "api" "sdk" "cli" "npm" "tsc" "hook" "middleware" "schema" "zod"; do
  if [[ "$NORM" == *"$tech"* ]]; then
    tech_count=$((tech_count + 1))
  fi
done

if (( tech_count >= 4 )); then
  maturity_score=$((maturity_score + 5))
elif (( tech_count >= 2 )); then
  maturity_score=$((maturity_score + 2))
fi

# Determine maturity level
detected_maturity="L1"
if (( maturity_score <= -5 )); then
  detected_maturity="L0"
elif (( maturity_score <= 2 )); then
  detected_maturity="L1"
elif (( maturity_score <= 8 )); then
  detected_maturity="L2"
else
  detected_maturity="L3"
fi

# ========================================================
# 3. INPUT COMPLEXITY BAND
# ========================================================

input_band="medium"
if (( WORD_COUNT <= 5 )); then
  input_band="short"
elif (( WORD_COUNT <= 30 )); then
  input_band="medium"
elif (( WORD_COUNT <= 100 )); then
  input_band="long"
else
  input_band="wall_of_text"
fi

# ========================================================
# 4. GUIDANCE NEEDS
# ========================================================

# High guidance = beginner + short input + low confidence signals
guidance="medium"
needs_discovery=true

if [[ "$detected_maturity" == "L0" ]]; then
  guidance="high"
  needs_discovery=true
elif [[ "$detected_maturity" == "L1" ]]; then
  guidance="medium"
  needs_discovery=true
elif [[ "$detected_maturity" == "L2" ]]; then
  guidance="low"
  # Still need discovery if input is vague
  if [[ "$input_band" == "short" ]]; then
    needs_discovery=true
  else
    needs_discovery=false
  fi
elif [[ "$detected_maturity" == "L3" ]]; then
  guidance="low"
  needs_discovery=false
fi

# Wall-of-text always needs discovery (to summarize and clarify)
if [[ "$input_band" == "wall_of_text" ]]; then
  needs_discovery=true
  guidance="medium"
fi

# ========================================================
# 5. BUILD REASONING
# ========================================================

reasoning=""
if [[ "$detected_lang" == "vi" ]]; then
  reasoning="Vietnamese detected (score: ${lang_vi_score}). "
elif [[ "$detected_lang" == "bilingual" ]]; then
  reasoning="Mixed EN/VI detected (vi: ${lang_vi_score}, en: ${lang_en_score}). "
fi

case "$detected_maturity" in
  L0) reasoning="${reasoning}Beginner signals found (score: ${maturity_score}). Full guidance with examples." ;;
  L1) reasoning="${reasoning}Intermediate user (score: ${maturity_score}). Structured guidance." ;;
  L2) reasoning="${reasoning}Advanced user (score: ${maturity_score}). Light guidance." ;;
  L3) reasoning="${reasoning}Expert user (score: ${maturity_score}). Compact mode." ;;
esac

if [[ "$input_band" == "wall_of_text" ]]; then
  reasoning="${reasoning} Long input (${WORD_COUNT} words) — will summarize before asking questions."
fi

# ========================================================
# 6. OUTPUT
# ========================================================

case "$MODE" in
  json)
    printf '{"language":"%s","maturity":"%s","input_band":"%s","guidance":"%s","needs_discovery":%s,"word_count":%d,"lang_vi_score":%d,"lang_en_score":%d,"maturity_score":%d,"reasoning":"%s"}\n' \
      "$detected_lang" "$detected_maturity" "$input_band" "$guidance" \
      "$needs_discovery" "$WORD_COUNT" "$lang_vi_score" "$lang_en_score" \
      "$maturity_score" "$reasoning"
    ;;
  human)
    printf '\n'
    printf 'User Profile\n'
    printf '============\n'
    printf '  Language:   %s (vi: %d, en: %d)\n' "$detected_lang" "$lang_vi_score" "$lang_en_score"
    printf '  Maturity:   %s (score: %d)\n' "$detected_maturity" "$maturity_score"
    printf '  Input band: %s (%d words)\n' "$input_band" "$WORD_COUNT"
    printf '  Guidance:   %s\n' "$guidance"
    printf '  Discovery:  %s\n' "$needs_discovery"
    printf '  Reasoning:  %s\n' "$reasoning"
    printf '\n'
    ;;
esac
