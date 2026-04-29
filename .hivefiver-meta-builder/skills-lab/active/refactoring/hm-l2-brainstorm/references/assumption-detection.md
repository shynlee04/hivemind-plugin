# Detecting Unstated Assumptions

Every brainstorming session carries hidden assumptions — beliefs about the user, the problem, the constraints, the environment, or the solution that were never explicitly stated. Undetected assumptions become scope creep, missed requirements, or architectural dead ends.

## What Is an Unstated Assumption?

A belief that materially affects requirements but was:
- Never spoken by the user
- Never validated by you
- Never surfaced in the requirements brief

**Example:** User says "I need a login page." Unstated assumptions: users have email addresses, passwords are the auth method, there's a database for user records, the app has sessions, there's a registration flow, there's a password reset flow, etc.

## Assumption Taxonomy

Categorize every assumption you detect:

| Category | Definition | Example |
|----------|-----------|---------|
| **User** | Who the user is, what they know, what they can do | "The user has a verified email address" |
| **Environment** | Where the system runs, what's already available | "The app is behind a corporate VPN" |
| **Data** | What data exists, its shape, volume, source | "User data is stored in PostgreSQL" |
| **Behavior** | How the system or user will act | "Users will complete the flow in one session" |
| **Constraint** | Limits that may or may not be real | "This must work offline" |
| **Dependency** | What the system depends on that wasn't stated | "An email service is configured and available" |
| **Priority** | What's more important than what | "Speed matters more than accuracy" |

## Detection Protocol

Run this protocol after Phase 1.3 (clarifying questions) and again before Phase 3 (producing requirements brief).

### Step 1: List Every Assumption

Write down every assumption you're making about the request. Be exhaustive. Use this prompt internally:

> "What am I taking for granted about this request? What would surprise me if it weren't true?"

### Step 2: Categorize Each Assumption

Map each assumption to one of the 7 categories above. This reveals blind spots — if you have no Environment assumptions, you're probably missing something.

### Step 3: Prioritize by Impact

Score each assumption by impact if wrong:

| Impact | Definition | Action |
|--------|-----------|--------|
| **High** | If wrong, entire requirement set changes | MUST validate with user |
| **Medium** | If wrong, some requirements shift | Validate if time permits |
| **Low** | If wrong, implementation details change but not requirements | Document and move on |

### Step 4: Validate High-Impact Assumptions

For each High-impact assumption, construct a validation question using Pattern 3 from `references/question-patterns.md`:

```
I'm assuming [specific assumption] based on [evidence].

Is that correct, or is [alternative] more accurate?
```

### Step 5: Document All Assumptions

In the requirements brief, record all assumptions — validated, unvalidated, and rejected:

```markdown
## Assumptions

| # | Assumption | Category | Status | Validation |
|---|-----------|----------|--------|------------|
| A1 | Users are authenticated | User | Confirmed | User confirmed via question |
| A2 | PostgreSQL is available | Environment | Assumed | Not validated — flag for spec phase |
| A3 | Offline support not needed | Constraint | Rejected | User clarified offline IS needed |
```

## Common Hidden Assumptions by Domain

### Web Applications
- Users have modern browsers (Chrome/Firefox/Safari last 2 versions)
- HTTPS is configured and available
- A CDN or hosting platform already exists
- Authentication infrastructure exists (or doesn't)
- Responsive design is required (or isn't)

### APIs / Backend Services
- Rate limiting is needed (or isn't)
- Authentication tokens are JWT (or something else)
- The API is REST (or GraphQL, gRPC, etc.)
- Database schema already exists (or needs creation)
- Logging/monitoring infrastructure is in place

### CLI Tools
- The tool runs on the same OS as the developer
- stdin/stdout/stderr are the interfaces
- Configuration files follow a specific format
- The tool is installed globally vs. per-project
- Error codes follow a convention

### Data / ML Pipelines
- Data volumes fit in memory (or don't)
- Data quality is sufficient (or needs cleaning)
- Labels/training data exists (or needs creation)
- The pipeline runs in batch (or real-time)
- A model serving infrastructure exists

## Assumption Challenge Technique (from Jamie-BitFlight)

Beyond detection, actively challenge assumptions:

### Necessity Challenge
"What if this assumption is false? Does the requirement still make sense?"

If the requirement collapses when the assumption is removed, the assumption is actually a hidden hard constraint — surface it.

### Inversion Challenge
"What if the OPPOSITE were true?"

If the opposite produces a totally different requirement set, the assumption is critical — it must be validated with the user.

### Audience Challenge
"Who else would make a different assumption here?"

If different stakeholders would assume different things, the assumption is ambiguous — it needs explicit confirmation.

## Assumption Self-Audit Checklist

Before the requirements brief, run this checklist:

- [ ] Do I have assumptions in ALL 7 categories? (gaps = blind spots)
- [ ] Are all High-impact assumptions validated by the user?
- [ ] Did I challenge at least 2 assumptions using the techniques above?
- [ ] Are there any assumptions I'm afraid to state because they might be wrong? (Those are the most important ones.)
- [ ] Would the requirements brief still make sense if any assumption were inverted?

## Red Flags — When to Pause and Validate

| Red Flag | Implication | Action |
|----------|------------|--------|
| "This should be simple" | Massive hidden assumptions about scope | Run the Necessity Challenge on all assumptions |
| "Just like [existing system]" | Assumed feature parity without explicit mapping | Ask: "Which specific behaviors of [existing system] are required?" |
| "The user will figure it out" | Assumed user knowledge/behavior without evidence | Surface as User-category assumption and validate |
| "We'll handle that later" | Hidden scope deferral — may be a P0 in disguise | Ask: "If we don't handle this, what breaks?" |
| "Everyone does it this way" | Industry assumption that may not apply to this project | Challenge: "What if this project is the exception?" |
