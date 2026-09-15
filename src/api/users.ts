import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { type InferResponseType, parseResponse } from "hono/client";

import { apiClient, apiRequest } from "./client.js";

const request = apiClient.api.users.$get;
type UserSearchResponse = InferResponseType<typeof request, 200>;

export function userSearchQueryOptions(query: string) {
  return queryOptions({
    queryKey: ["users", "search", query] as const,
    enabled: query.trim().length >= 2,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<UserSearchResponse["users"]> =>
      (await apiRequest(() => parseResponse(request({ query: { q: query } }))))
        .users,
  });
}
