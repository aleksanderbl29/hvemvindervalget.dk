import { cache } from "react";
import { runtimeConfig } from "../config";
import { logApiTiming } from "../telemetry";
import {
  mockMunicipalitySnapshots,
  mockNationalOverview,
  mockPollHighlights,
  mockScenarioInsights,
} from "./mock";
import type {
  MunicipalitySnapshot,
  NationalOverview,
  PollHighlight,
  ScenarioInsight,
} from "./types";

type FetchArgs = RequestInit & { path: string };

async function apiFetch<T>(args: FetchArgs): Promise<T> {
  const url = new URL(args.path, runtimeConfig.apiBaseUrl).toString();
  if (process.env.NODE_ENV === "development") {
    console.info("[api] fetch", { url, method: args.method ?? "GET" });
  }
  const started = Date.now();
  const response = await fetch(url, {
    ...args,
    headers: {
      "content-type": "application/json",
      ...(args.headers ?? {}),
    },
    next: args.next ?? { revalidate: 60 },
  });
  const durationMs = Date.now() - started;
  const body = await response.json();

  const bytes = Number(response.headers.get("content-length") ?? "0");
  logApiTiming({
    url,
    status: response.status,
    durationMs,
    bytes,
  });

  if (!response.ok) {
    throw new Error(
      `[api] Request failed (${response.status}) for ${url}: ${JSON.stringify(body)}`,
    );
  }

  return body as T;
}

const fetchNationalOverview = cache(async () => {
  if (runtimeConfig.useStubData) {
    if (process.env.NODE_ENV === "development") {
      console.info("[api] using stub data: national overview");
    }
    return mockNationalOverview();
  }
  return apiFetch<NationalOverview>({ path: "/v1/national-overview" });
});

const fetchMunicipalitySnapshots = cache(async () => {
  if (runtimeConfig.useStubData) {
    if (process.env.NODE_ENV === "development") {
      console.info("[api] using stub data: municipality snapshots");
    }
    return mockMunicipalitySnapshots();
  }
  return apiFetch<MunicipalitySnapshot[]>({
    path: "/v1/municipalities/snapshots",
  });
});

const fetchPollHighlights = cache(async () => {
  if (runtimeConfig.useStubData) {
    if (process.env.NODE_ENV === "development") {
      console.info("[api] using stub data: poll highlights");
    }
    return mockPollHighlights();
  }
  return apiFetch<PollHighlight[]>({ path: "/v1/polls/highlights" });
});

const fetchScenarioInsights = cache(async () => {
  if (runtimeConfig.useStubData) {
    if (process.env.NODE_ENV === "development") {
      console.info("[api] using stub data: scenario insights");
    }
    return mockScenarioInsights();
  }
  return apiFetch<ScenarioInsight[]>({ path: "/v1/scenarios" });
});

export const api = {
  getNationalOverview: fetchNationalOverview,
  getMunicipalitySnapshots: fetchMunicipalitySnapshots,
  getPollHighlights: fetchPollHighlights,
  getScenarioInsights: fetchScenarioInsights,
};

