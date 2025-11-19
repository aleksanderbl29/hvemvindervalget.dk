import { runtimeConfig } from "./src/lib/config";

export async function register() {
  if (process.env.NODE_ENV === "development") {
    console.info(
      `[instrumentation] telemetry enabled: ${runtimeConfig.telemetryEnabled}, stub data: ${runtimeConfig.useStubData}, chart library: ${runtimeConfig.chartLibrary}`,
    );
  }
}

