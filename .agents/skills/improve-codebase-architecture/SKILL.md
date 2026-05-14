---
name: improve-codebase-architecture
description: Evaluate and improve the codebase architecture by identifying and fixing coupling, leaky abstractions, and testing bottlenecks. Use when user says "improve the architecture", "fix this mess", or after a hard bug reveals architectural flaws.
---

# Improve Codebase Architecture

A skill for evaluating and evolving the architecture of the codebase.

## Phase 1 — Contextualise

Before making changes, understand the current architectural intent.

1. **Glossary**. Read the project's domain glossary (usually `docs/agents/GLOSSARY.md` or similar). Architectural changes MUST use this vocabulary.
2. **ADRs**. Read existing Architectural Decision Records. Understand why current patterns exist before you try to change them.
3. **Current state**. Explore the codebase to identify the specific area of friction. Is it a coupling problem? A leaky abstraction? A testing bottleneck?

## Phase 2 — Identify the Smells

Look for specific architectural anti-patterns:

- **Shallow modules**. Modules with complex interfaces that do very little.
- **Leaky abstractions**. Details of the implementation escaping into the interface.
- **Tight coupling**. Changes in one module requiring changes in many others.
- **Testing bottlenecks**. Code that is hard to test in isolation due to global state or hidden dependencies.
- **Inconsistent vocabulary**. Code that uses different terms for the same domain concepts.

## Phase 3 — Propose a Change

Before implementing, describe the proposed change.

1. **State the goal**. What architectural property are we trying to improve? (e.g. "decouple auth from storage", "extract a deep module for pricing logic").
2. **Sketch the new interface**. Show the proposed new interface for the affected modules.
3. **Identify the migration path**. How do we get from A to B without breaking the system?

Check with the user that the proposed architecture aligns with their vision.

## Phase 4 — Implement

Apply the changes incrementally. Use the `/tdd` skill to ensure the new architecture is verifiable.

1. **Extract**. Move logic into the new modules/interfaces.
2. **Refactor**. Update callers to use the new interfaces.
3. **Delete**. Remove the old, deprecated code paths.

## Phase 5 — Record

If the change has long-term architectural implications, document it in an ADR. Update the domain glossary if new concepts were introduced.
