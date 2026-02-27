# Research Question Framing

When given a vague topic or broad question, transform it into structured, answerable research sub-questions before beginning investigation.

## Framing Process

1. **Identify the core knowledge gap**: What exactly is unknown? Strip away assumptions and restate the actual uncertainty.

2. **Decompose into sub-questions**: Break the topic into 3-5 specific questions that, when answered together, resolve the core gap.
   - Each sub-question should be independently answerable
   - Each should have a clear "what constitutes a satisfactory answer"
   - Avoid overlapping scope between sub-questions

3. **Scope each sub-question**:
   - What is IN scope (specific versions, platforms, contexts)
   - What is OUT of scope (adjacent topics, future concerns)
   - What time range is relevant (current state only, historical evolution, future trajectory)

4. **Classify by source type**:
   - Can this be answered from code? → Use grep, glob, read, repomix
   - Can this be answered from documentation? → Use Context7, DeepWiki
   - Can this be answered from web? → Use Tavily, Google search
   - Requires multiple source types? → Plan investigation order

## Example Transformation

**Vague**: "How does OpenCode handle plugins?"

**Framed**:
1. What is the plugin registration and lifecycle API? (source: OpenCode SDK docs via DeepWiki)
2. What hook types are available and what events do they intercept? (source: OpenCode repo via Repomix)
3. How does plugin context (`ctx`) provide access to session, tools, and events? (source: SDK docs + code examples)
4. What are the limitations and known issues with the current plugin system? (source: GitHub issues + community)

## Anti-Patterns

- **Too broad**: "Tell me about React" → Narrow to specific aspect
- **Too narrow**: "What's on line 45 of auth.ts?" → That's a file read, not research
- **Leading**: "Why is X better than Y?" → Reframe as "How do X and Y compare on criteria Z?"
- **Unanswerable**: "What will the next version include?" → Reframe as "What's on the public roadmap?"
