# {{gate_type}} — Gate Checklist

**Date:** {{date}}  
**Executor:** HiveQ  
**Mode:** {{mode}}  

---

## Gates Executed

| # | Gate ID | Command | Exit Code | Verdict | Duration |
|---|---------|---------|:---------:|:-------:|:--------:|
{{gate_rows}}

---

## Gate Details

### {{gate_1_id}}

**Command:** `{{gate_1_command}}`

**Output:**
```
{{gate_1_output}}
```

**Verdict:** {{gate_1_verdict}}  
**Details:** {{gate_1_details}}

### {{gate_2_id}}

**Command:** `{{gate_2_command}}`

**Output:**
```
{{gate_2_output}}
```

**Verdict:** {{gate_2_verdict}}  
**Details:** {{gate_2_details}}

---

## Aggregate Result

- **Gates executed:** {{total_gates}}
- **PASS:** {{pass_count}}
- **FAIL:** {{fail_count}}
- **Overall:** {{overall_verdict}}

**Blocking Issues:**
{{blocking_issues}}
