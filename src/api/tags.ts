import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";
import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiClient, apiRequest } from "./client.js";

const listTagsRequest = apiClient.api.tags.$get;
const suggestTagsRequest = apiClient.api.tags.suggestions.$post;

export type ListTagsQuery = InferRequestType<typeof listTagsRequest>["query"];
type TagsPage = InferResponseType<typeof listTagsRequest, 200>;
export type Tag = TagsPage["tags"][number];
export type SuggestTagsInput = InferRequestType<
  typeof suggestTagsRequest
>["json"];
export type SuggestedTag = InferResponseType<
  typeof suggestTagsRequest,
  200
>["tags"][number];

function tagsQueryKey(query: ListTagsQuery = {}) {
  return [
    "tags",
    {
      q: query.q,
      limit: query.limit,
      offset: query.offset,
    },
  ] as const;
}

export function tagsQueryOptions(query: ListTagsQuery = {}) {
  return queryOptions({
    queryKey: tagsQueryKey(query),
    queryFn: () => listTags(query),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}

function listTags(query: ListTagsQuery = {}) {
  return apiRequest(() => parseResponse(listTagsRequest({ query })));
}

export function suggestTags(json: SuggestTagsInput, signal?: AbortSignal) {
  return apiRequest(() =>
    parseResponse(suggestTagsRequest({ json }, { init: { signal } })),
  );
}
