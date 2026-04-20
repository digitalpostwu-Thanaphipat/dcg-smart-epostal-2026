import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "https://placeholder-dsn@sentry.io/0";

if (SENTRY_DSN && !SENTRY_DSN.includes("placeholder")) {
  Sentry.init({
    dsn: SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/script\.google\.com/],
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  });
}
