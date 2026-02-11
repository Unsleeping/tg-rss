/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as articles from "../articles.js";
import type * as crons from "../crons.js";
import type * as digest from "../digest.js";
import type * as feeds from "../feeds.js";
import type * as fetchErrors from "../fetchErrors.js";
import type * as http from "../http.js";
import type * as lib_contentExtractor from "../lib/contentExtractor.js";
import type * as lib_formatDigest from "../lib/formatDigest.js";
import type * as rss from "../rss.js";
import type * as telegram from "../telegram.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  articles: typeof articles;
  crons: typeof crons;
  digest: typeof digest;
  feeds: typeof feeds;
  fetchErrors: typeof fetchErrors;
  http: typeof http;
  "lib/contentExtractor": typeof lib_contentExtractor;
  "lib/formatDigest": typeof lib_formatDigest;
  rss: typeof rss;
  telegram: typeof telegram;
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
