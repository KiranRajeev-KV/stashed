import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";
import { infiniteQueryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient, apiRequest } from "./client.js";

const searchIdeasRequest = apiClient.api.search.$get;

export type SearchIdeasQuery = InferRequestType<
  typeof searchIdeasRequest
>["query"];
export type SearchResultsPage = InferResponseType<
  typeof searchIdeasRequest,
  200
>;
export type SearchResult = SearchResultsPage["results"][number];

export const SEARCH_PAGE_SIZE = "20";

export function searchQueryKey(q: string) {
  return ["search", { q, limit: SEARCH_PAGE_SIZE }] as const;
}

export function searchInfiniteQueryOptions(q: string) {
  return infiniteQueryOptions({
    queryKey: searchQueryKey(q),
    initialPageParam: 0,
    enabled: q.length > 0,
    queryFn: ({ pageParam }) =>
      searchIdeas({
        q,
        limit: SEARCH_PAGE_SIZE,
        offset: String(pageParam),
      }),
    getNextPageParam: (lastPage) =>
      lastPage.results.length < Number(SEARCH_PAGE_SIZE)
        ? undefined
        : lastPage.offset + lastPage.results.length,
    staleTime: 30_000,
    retry: (failureCount, error) =>
      !(
        error instanceof ApiClientError &&
        [400, 401, 403, 404].includes(error.status)
      ) && failureCount < 2,
  });
}

export function searchIdeas(query: SearchIdeasQuery) {
  return apiRequest(() => parseResponse(searchIdeasRequest({ query })));
}
