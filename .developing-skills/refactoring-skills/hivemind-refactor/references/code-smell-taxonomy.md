# Code Smell Taxonomy

## Category 1: Bloaters

Bloaters are code that has grown so large that it can no longer be effectively worked with.

### Long Method

**Detection:**
- Function exceeds 30 lines
- Requires scrolling to understand
- Needs multiple comments to explain sections
- Has more than 3 levels of nesting

**Fix:** Extract Function, Replace Temp with Query, Introduce Parameter Object, Replace Method with Method Object.

### Large Class

**Detection:**
- Class has more than 10 instance fields
- Class has more than 20 methods
- Class name includes "Manager", "Handler", "Processor", "Util"
- Class has multiple unrelated responsibilities

**Fix:** Extract Class, Extract Subclass, Extract Interface.

### Long Parameter List

**Detection:**
- Function takes more than 4 parameters
- Same parameter group appears in multiple functions
- Callers pass `null` or `undefined` for optional params

**Fix:** Replace Parameter with Method, Preserve Whole Object, Introduce Parameter Object.

### Primitive Obsession

**Detection:**
- Strings representing structured data (emails, phone numbers, URLs)
- Numbers with special meaning (flags, codes)
- Collections as parameters instead of domain objects
- String concatenation for structured output

**Fix:** Replace Data Value with Object, Replace Type Code with Class, Extract Class.

### Data Clumps

**Detection:**
- Same 3+ variables passed together to multiple functions
- Same fields appear together in multiple classes
- Removing one field from the group breaks other usages

**Fix:** Extract Class, Introduce Parameter Object, Preserve Whole Object.

---

## Category 2: OO Abusers

These smells indicate incomplete or incorrect application of object-oriented principles.

### Switch Statements

**Detection:**
- `switch` or `if-else` chain checking type fields
- Same type-based switch appears in multiple locations
- Adding a new type requires modifying multiple switches

**Fix:** Replace Conditional with Polymorphism, Replace Type Code with Subclasses, State/Strategy Pattern.

### Temporary Field

**Detection:**
- Instance field is set only in certain circumstances
- Field is `null` or `undefined` most of the time
- Methods check if the field exists before using it

**Fix:** Extract Class, Introduce Null Object, Special Case Pattern.

### Refused Bequest

**Detection:**
- Subclass uses only some inherited methods
- Subclass overrides a method to do nothing or throw
- `@override` annotations that change behavior entirely

**Fix:** Replace Inheritance with Delegation, Push Down Method, Push Down Field.

### Alternative Classes with Different Interfaces

**Detection:**
- Two classes do the same thing with different method names
- Code converts between equivalent types from different libraries

**Fix:** Rename Method, Move Method, Extract Superclass.

---

## Category 3: Change Preventers

These smells make changes difficult because a single change requires modifications in many places.

### Divergent Change

**Detection:**
- One class is commonly changed for different reasons
- Class has multiple methods that change for unrelated features
- Commit messages reference the same file for different concerns

**Fix:** Extract Class, Split Phase.

### Shotgun Surgery

**Detection:**
- Making a change requires touching many classes
- A single feature is spread across 5+ files
- Search results for a concept return many unrelated files

**Fix:** Move Method, Move Field, Inline Class, Inline Function.

### Parallel Inheritance Hierarchies

**Detection:**
- Creating a subclass in one hierarchy requires creating one in another
- Class names in two hierarchies mirror each other
- Changes to one hierarchy cascade to the other

**Fix:** Move Method, Move Field, Make One Hierarchy Reference the Other.

---

## Category 4: Dispensables

These are unnecessary elements that should be removed.

### Dead Code

**Detection:**
- Functions/classes with zero callers (check with IDE "Find Usages")
- Code commented out for more than 2 weeks
- Conditional branches that never execute (always true/false)
- Imports that are never used
- `TODO` comments older than 30 days

**Fix:** Remove Dead Code, Inline Class, Collapse Hierarchy.

### Zombie Code

**Detection:**
- Code that "should work" but is never called in production paths
- Feature flags that are permanently enabled/disabled
- API endpoints with zero traffic
- Test utilities referenced only by other dead tests

**Fix:** Remove after confirming no production usage (check logs, metrics).

### Comments

**Detection:**
- Comments explaining what code does (instead of why)
- Commented-out code blocks
- TODO/FIXME/HACK comments without issue links
- JSDoc that duplicates what the name already says

**Fix:** Extract Function, Rename Method, Introduce Assertion. Remove the comment if the code is clear.

### Duplicate Code

**Detection:**
- Identical or near-identical code in 2+ locations
- Copy-paste with variable name changes only
- Same algorithm reimplemented in different files

**Fix:** Extract Function + Pull Up Method, Extract Superclass, Form Template Method.

---

## Detection Quick Reference

| Smell | Automated Detection | Manual Detection |
|-------|-------------------|-----------------|
| Long Method | `>30 lines` | Hard to name what it does |
| Large Class | `>10 fields` or `>20 methods` | Hard to describe responsibility |
| Long Parameter List | `>4 params` | Caller looks cluttered |
| Switch Statements | `switch` + type field | Same switch in 2+ places |
| Dead Code | 0 callers | Nobody remembers why it exists |
| Duplicate Code | Copy-paste detector | Same change in 2+ files |
| Divergent Change | Git blame shows multiple authors | Changed for 3+ unrelated reasons |
| Shotgun Surgery | 5+ files for one feature | Grep returns too many hits |
