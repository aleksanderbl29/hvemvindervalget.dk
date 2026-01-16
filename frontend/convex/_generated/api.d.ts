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
import type * as ingestPolls from "../ingestPolls.js";
import type * as municipalities from "../municipalities.js";
import type * as nationalOverview from "../nationalOverview.js";
import type * as parties from "../parties.js";
import type * as polls from "../polls.js";
import type * as pollsters from "../pollsters.js";
import type * as regions from "../regions.js";
import type * as scenarios from "../scenarios.js";
import type * as schemaMapping from "../schemaMapping.js";
import type * as seedPolls from "../seedPolls.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ingest: typeof ingest;
  ingestDirect: typeof ingestDirect;
  ingestMutations: typeof ingestMutations;
  ingestPolls: typeof ingestPolls;
  municipalities: typeof municipalities;
  nationalOverview: typeof nationalOverview;
  parties: typeof parties;
  polls: typeof polls;
  pollsters: typeof pollsters;
  regions: typeof regions;
  scenarios: typeof scenarios;
  schemaMapping: typeof schemaMapping;
  seedPolls: typeof seedPolls;
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
