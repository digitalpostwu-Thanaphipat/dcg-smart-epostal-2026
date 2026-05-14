---
name: grill-with-docs
description: Vet a plan against the project's documentation. Use when user wants to verify if a plan matches the project's standards, or after writing a plan to ensure it's correct.
---

# Grill with Docs

Vet a plan against the project's documentation.

## Domain awareness

Before you begin, you must have a clear mental model of the project's domain.

1. **Glossary**. Read the project's domain glossary (usually `docs/agents/GLOSSARY.md` or similar). Use its vocabulary throughout the session. If the user uses a term that isn't in the glossary, or uses a term in a way that contradicts the glossary, challenge them.

2. **File structure**. Read the project's file structure documentation (usually `docs/agents/FILE_STRUCTURE.md` or similar). Ensure the plan respects the intended location for new files and the boundaries between modules.

## During the session

1. **Challenge against the glossary**. If the plan uses fuzzy language or non-standard terms, ask for clarification. Reference the glossary.

2. **Sharpen fuzzy language**. If the plan says "the system", "the user", or "the data", ask for specifics. Which part of the system? Which actor? Which entity?

3. **Discuss concrete scenarios**. Instead of discussing the plan in the abstract, walk through specific scenarios. "If the user does X, how does the plan handle Y?"

4. **Cross-reference with code**. If the plan makes assumptions about the codebase, verify them.

5. **Update CONTEXT.md inline**. If the plan involves a sequence of steps, keep a `CONTEXT.md` (or similar) file updated with the current state of the plan and the decisions made so far.

6. **Offer ADRs sparingly**. If a decision is made that has long-term architectural implications, suggest capturing it in an Architectural Decision Record (ADR).
