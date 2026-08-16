import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";

import { apiClient, apiRequest } from "./client.js";

const listTagsRequest = apiClient.api.tags.$get;

export type ListTagsQuery = InferRequestType<typeof listTagsRequest>["query"];
export type TagsPage = InferResponseType<typeof listTagsRequest, 200>;
export type Tag = TagsPage["tags"][number];

export function listTags(query: ListTagsQuery = {}) {
  return apiRequest(() => parseResponse(listTagsRequest({ query })));
}
