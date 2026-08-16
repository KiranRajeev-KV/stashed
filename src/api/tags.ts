import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";
import { queryOptions } from "@tanstack/react-query";

import { apiClient, apiRequest } from "./client.js";

const listTagsRequest = apiClient.api.tags.$get;

export type ListTagsQuery = InferRequestType<typeof listTagsRequest>["query"];
export type TagsPage = InferResponseType<typeof listTagsRequest, 200>;
export type Tag = TagsPage["tags"][number];

export function tagsQueryKey(query: ListTagsQuery = {}) {
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
    staleTime: 60_000,
  });
}

export function listTags(query: ListTagsQuery = {}) {
  return apiRequest(() => parseResponse(listTagsRequest({ query })));
}
