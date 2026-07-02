# ePostal Production Readiness Live Gate

Generated: 2026-07-01  
Current production deployment: `@264`  
Current production URL: `https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec`

## Status Model

The project is treated as **Production Ready for core workflows** only when local gates pass and the live read-only gate passes against the current Apps Script deployment.

The project is treated as **Full Production Ready with PWA support** only after a real Android Chrome install/offline check is also completed.

## Local Gates

Run these before any deployment sign-off:

```powershell
npm.cmd run test:unit
npm.cmd audit --audit-level=high
npm.cmd run build --prefix frontend
npm.cmd run build:gas --prefix frontend
npx.cmd playwright test
```

## Live Readiness Gate

Read-only live checks:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
npm.cmd run test:live-readiness
```

Authenticated read checks:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
$env:EPOSTAL_LIVE_AUTH_TOKEN = "<admin-session-token>"
npm.cmd run test:live-readiness
```

Production write lifecycle check, explicit opt-in:

```powershell
$env:EPOSTAL_LIVE_BASE_URL = "https://script.google.com/macros/s/AKfycby1OeoMCo5wRhQFc5d-HhTqIFiXT4WAq5CjZduj34FUK9KHGLJYLzaQD6JXc8JqwwGp1g/exec"
$env:EPOSTAL_LIVE_AUTH_TOKEN = "<admin-session-token>"
$env:EPOSTAL_LIVE_WRITE = "1"
npm.cmd run test:live-readiness
```

## What The Gate Verifies

- Public tracking page loads from the live deployment.
- GAS serves manifest content from `?get=manifest`.
- GAS serves service worker content from `?get=sw`.
- `systemHealthCheck` exposes integrity, access, config, backup, trigger, monitor, and sharding checks.
- Protected admin actions reject unauthenticated and invalid-token requests.
- Optional authenticated read smoke verifies admin users and package search.
- Optional write smoke creates a uniquely named production test record and verifies it via search.
- OCR is retired: production UI must not show the AI parcel scan button, and backend `performOCR` must not be exposed in `Code.gs` route/permission maps.

## Manual Mobile PWA Check

Use Android Chrome against the production URL:

- Open the live URL and confirm no service worker MIME error appears.
- Confirm install prompt or Add to Home Screen is available.
- Install the app and launch it from the home screen.
- Reopen with network disabled and confirm the app shell loads.

If this manual check is not complete, keep the release status at **Production Ready for core workflows**, not full PWA readiness.
