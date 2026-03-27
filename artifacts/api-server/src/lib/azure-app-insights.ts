type InitState = "unconfigured" | "initializing" | "ready" | "error";

let client: import("applicationinsights").TelemetryClient | null = null;
let initState: InitState = "unconfigured";

export function initAppInsights(): void {
  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!connectionString) {
    console.warn(
      "[Application Insights] APPLICATIONINSIGHTS_CONNECTION_STRING is not configured. " +
      "Telemetry will not be collected. Add this secret to enable observability."
    );
    initState = "unconfigured";
    return;
  }
  initState = "initializing";
  import("applicationinsights").then((appInsights) => {
    appInsights.setup(connectionString)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(false)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(false)
      .start();
    client = appInsights.defaultClient;
    initState = "ready";
    console.log("[Application Insights] Telemetry initialized.");
  }).catch((err) => {
    initState = "error";
    console.error("[Application Insights] Failed to initialize:", err);
  });
}

export function getAppInsightsState(): InitState {
  return initState;
}

export function isAppInsightsAvailable(): boolean {
  return initState === "ready" && client !== null;
}

export function trackEvent(name: string, properties?: Record<string, string>, measurements?: Record<string, number>): void {
  if (!client) return;
  try {
    client.trackEvent({ name, properties, measurements });
  } catch {
  }
}

export function trackException(error: Error, properties?: Record<string, string>): void {
  if (!client) return;
  try {
    client.trackException({ exception: error, properties });
  } catch {
  }
}

export function trackMetric(name: string, value: number, properties?: Record<string, string>): void {
  if (!client) return;
  try {
    client.trackMetric({ name, value, properties });
  } catch {
  }
}
