import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";

import { apiClient, apiRequest } from "./client.js";

const searchIdeasRequest = apiClient.api.search.$get;

export type SearchIdeasQuery = InferRequestType<
  typeof searchIdeasRequest
>["query"];
export type SearchResultsPage = InferResponseType<
  typeof searchIdeasRequest,
  200
>;
export type SearchResult = SearchResultsPage["results"][number];

export function searchIdeas(query: SearchIdeasQuery) {
  return apiRequest(() => parseResponse(searchIdeasRequest({ query })));
}
