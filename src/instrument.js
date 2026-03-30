import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://2627892d70b946fc945748fb8516159b@bugsink.acentosdeco.lat/1",
  integrations: [],
  tracesSampleRate: 1.0,
});
