# Code Review Implementation Playbook: Epostal Edition

> **Version:** 1.0.0
> **Target:** Corporate-grade Google Apps Script & React Ecosystem
> **Source:** Loki Mode (Autonomous SDLC 2.35.0)

This playbook provides systematic checklists and patterns for performing production-ready code reviews.

---

## ๑. Architecture & Design Patterns

### 1.1 Separation of Concerns (SoC)
- [ ] **Backend (GAS)**: Is business logic decoupled from Sheet manipulation? (Use `Service_DB.gs` for DB access).
- [ ] **Frontend (React)**: Are components purely UI? (Logic should reside in `hooks/` or `utils/`).
- [ ] **API Boundary**: Is there a clear contract between `Service_Package.gs` and `usePostalApi.ts`?

### 1.2 Design Consistency
- [ ] **Blueprint Alignment**: Does the code match the **Master Blueprint v3.0** (Nexus Design Standards)?
- [ ] **Naming**: Are variables using `camelCase` for JS/TS and `snake_case` or `camelCase` consistently for GAS? (Avoid abbreviations).

---

## ๒. Security Guardrails (CRITICAL)

### 2.1 Authorization (RBAC)
- [ ] **Server-side check**: Does every `doPost` or exposed GAS function verify `Service_Auth.getUserRole()`?
- [ ] **Admin Isolation**: Are admin operations (e.g., Delete, Config) restricted to `AdminService`?

### 2.2 Data Integrity
- [ ] **Sanitization**: Are inputs stripped of script tags? (Prevent XSS in Sheet display).
- [ ] **Deduplication**: Is the `checkDuplicate` logic enforced *before* commit?

### 2.3 Secret Management
- [ ] **No Hardcoding**: Credentials (API Keys) must stay in **Script Properties** or Environment Variables.

---

## ๓. Performance & Scalability

### 3.1 Sheet Access Optimization (GAS)
- [ ] **Batch Operations**: Use `getValues()` and `setValues()` on arrays. NEVER call `getValue()` inside a loop.
- [ ] **Sharding Compliance**: Does query logic respect `_getCurrentFiscalYear()` for multi-year databases?

### 3.2 Frontend Responsiveness
- [ ] **Memoization**: Are expensive computations wrapped in `useMemo`?
- [ ] **Debouncing**: Are search inputs/filter updates debounced?

---

## ๔. Loki Mode: Autonomous SDLC Compliance

### 4.1 RARV Cycle Validation
- [ ] **Reason**: Is there a comment explaining the "Why" behind complex logic?
- [ ] **Act**: Is the implementation atomic (one feature per PR)?
- [ ] **Verify**: Does the code include or update corresponding unit/E2E tests?

---

## ๕. Severity-Based Review Matrix

| Severity | Definition | Action |
|----------|------------|--------|
| 🔴 **Blocking** | Security hole, Data loss path, or Blueprint violation | Must fix before merge |
| 🟠 **Important** | Performance bottleneck, Poor SoC, Missing tests | Refactor requested |
| 🟡 **Minor** | Typos, Formatting, Documentation | Fix or log as TODO |
| 🔵 **Info** | Suggestion for future improvement | Discussion item |

---

## ๖. Test Signal Checklist

- [ ] **Playwright**: All `playwright-test-full-journey.js` scenarios pass.
- [ ] **Backend Logs**: No `ERROR` or `CRITICAL` entries in `Service_Health.gs` after manual test run.
- [ ] **Type Safety**: Zero `any` types in TSX files.
