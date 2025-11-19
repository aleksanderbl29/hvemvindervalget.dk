import { runtimeConfig } from "./config";

type ApiTimingMetric = {
  url: string;
  durationMs: number;
  status: number;
  bytes?: number;
};

const isDev = process.env.NODE_ENV === "development";
const telemetryEnabled = runtimeConfig.telemetryEnabled;

function logTelemetryDebug(
  message: string,
  metadata?: Record<string, unknown> | ApiTimingMetric,
) {
  if (!isDev) return;
  if (metadata) {
    console.info(`[telemetry] ${message}`, metadata);
    return;
  }
  console.info(`[telemetry] ${message}`);
}

export function logApiTiming(metric: ApiTimingMetric) {
  logTelemetryDebug("api timing telemetry suppressed", {
    ...metric,
    telemetryEnabled,
  });
}

export function logClientEvent(
  name: string,
  payload: Record<string, unknown>,
) {
  logTelemetryDebug("client event telemetry suppressed", {
    name,
    payloadKeys: Object.keys(payload),
    telemetryEnabled,
  });
}

