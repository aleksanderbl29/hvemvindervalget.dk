import { z } from "zod";

const chartLibraryOptions = ["plotly", "echarts", "chartjs", "vega-lite"] as const;

const envSchema = z.object({
  // Client-side (exposed to browser)
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .trim()
    .url()
    .default("https://api.hvemvindervalget.dk"),
  NEXT_PUBLIC_USE_STUB_DATA: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  NEXT_PUBLIC_CHART_LIBRARY: z
    .enum(chartLibraryOptions)
    .default("plotly"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_USE_STUB_DATA:
    (process.env.NEXT_PUBLIC_USE_STUB_DATA ??
      process.env.USE_STUB_DATA ??
      "true") as "true" | "false",
  NEXT_PUBLIC_CHART_LIBRARY: process.env.NEXT_PUBLIC_CHART_LIBRARY as (typeof chartLibraryOptions)[number] | undefined,
});

if (!parsed.success) {
  console.warn(
    "[config] Falling back to defaults. Issues:",
    parsed.error.flatten().fieldErrors,
  );
}

const fallback = envSchema.parse({});

const env = parsed.success ? parsed.data : fallback;

// Use server-side URL if available (server-side only), otherwise fall back to public URL
// This allows server-side code to use internal URLs while client-side uses public URLs
const getApiBaseUrl = () => {
  // On server-side, prefer API_BASE_URL if set, otherwise use NEXT_PUBLIC_API_BASE_URL
  // On client-side, only NEXT_PUBLIC_API_BASE_URL is available
  return process.env.API_BASE_URL ?? env.NEXT_PUBLIC_API_BASE_URL;
};

export const runtimeConfig = {
  apiBaseUrl: getApiBaseUrl(),
  useStubData: env.NEXT_PUBLIC_USE_STUB_DATA,
  telemetryEnabled: false as const,
  chartLibrary: env.NEXT_PUBLIC_CHART_LIBRARY,
} as const;

