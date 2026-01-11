/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ingest from "../ingest.js";
import type * as ingestDirect from "../ingestDirect.js";
import type * as ingestMutations from "../ingestMutations.js";
import type * as municipalities from "../municipalities.js";
import type * as nationalOverview from "../nationalOverview.js";
import type * as polls from "../polls.js";
import type * as scenarios from "../scenarios.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ingest: typeof ingest;
  ingestDirect: typeof ingestDirect;
  ingestMutations: typeof ingestMutations;
  municipalities: typeof municipalities;
  nationalOverview: typeof nationalOverview;
  polls: typeof polls;
  scenarios: typeof scenarios;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
