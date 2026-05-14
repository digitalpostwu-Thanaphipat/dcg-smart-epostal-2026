---
name: tdd-workflow
description: "Hardened Test-Driven Development workflow. Focuses on Vertical Slicing, Tracer Bullets, and Public Interface verification."
risk: low
source: community
date_added: "2026-02-27"
last_updated: "2026-05-01"
---

# Hardened TDD Workflow

> Write tests first, code second. Verify behavior, not implementation.

---

## 1. Philosophy: Public Interface Focus

**Core principle**: Tests should verify behavior through public interfaces, not implementation details.
- **Good tests** are integration-style: they exercise real code paths through public APIs. They describe *what* the system does, not *how* it does it.
- **Bad tests** are coupled to implementation. They mock internal collaborators unnecessarily or test private methods. If you rename an internal function and tests fail, those tests were testing implementation, not behavior.

---

## 2. Anti-Pattern: Horizontal Slices

**DO NOT write all tests first, then all implementation.** This is "horizontal slicing" and leads to "outrunning your headlights."

- Tests written in bulk test *imagined* behavior.
- You commit to test structure before understanding implementation.
- Tests become fragile and insensitive to real behavior changes.

**Correct approach**: **Vertical slices via tracer bullets.** One test → one implementation → repeat.

---

## 3. The Vertical TDD Cycle

```
🔴 RED → Write ONE failing test for ONE behavior
    ↓
🟢 GREEN → Write minimal code to pass THAT test
    ↓
🔵 REFACTOR → Improve code quality (staying GREEN)
    ↓
   Repeat for the next behavior...
```

### Tracer Bullet (Cycle #1)
The first cycle must be a **tracer bullet**—a test that confirms the path works end-to-end (e.g., a simple API response or a component rendering). This proves the plumbing is correct before building complexity.

---

## 4. Workflow Steps

### Phase 1: Planning (Spec-First)
- [ ] Confirm with user what interface changes are needed.
- [ ] Confirm which behaviors to test (prioritize critical paths).
- [ ] List behaviors (not implementation steps).
- [ ] Get user approval on the plan.

### Phase 2: The Loop
For each behavior:
1. **RED**: Write the next test for the smallest observable behavior. Ensure it fails.
2. **GREEN**: Write the **simplest** code to make the test pass. Avoid YAGNI (You Aren't Gonna Need It).
3. **REFACTOR**: Only once green. Clean up duplication, improve naming, but keep tests passing.

---

## 5. AAA Pattern (Arrange, Act, Assert)

Every test should follow:
- **Arrange**: Set up test data and state.
- **Act**: Execute the public interface under test.
- **Assert**: Verify the expected outcome/behavior.

---

## 6. Checklist Per Cycle

- [ ] Test describes behavior, not implementation.
- [ ] Test uses public interface only.
- [ ] Test would survive internal refactor.
- [ ] Code is minimal for this specific test.
- [ ] No speculative features added.

---

## 7. Anti-Patterns to Avoid

| ❌ Don't | ✅ Do |
|----------|-------|
| Skip the RED phase | Watch test fail first. |
| Write tests after code | Write tests before code. |
| **Horizontal Slicing** | **Vertical Slicing (One at a time).** |
| Mock internal logic | Mock only external boundaries (APIs/DB). |
| Test implementation | Test behavior via public APIs. |

---

> **Note:** The test is the specification. If you can't write a test, you don't understand the requirement. Respect the "Immutable After Pass" rule—once a vertical slice is complete and verified, avoid touching it unless restarting the cycle.
