import { type InferResponseType, parseResponse } from "hono/client";
import { queryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient, apiRequest } from "./client.js";

const getCurrentUserRequest = apiClient.api.auth.me.$get;

export type CurrentUserResponse = InferResponseType<
  typeof getCurrentUserRequest,
  200
>;
export type CurrentUser = CurrentUserResponse["user"];

export const githubLoginPath = apiClient.api.auth.github.$path();
export const currentUserQueryKey = ["auth", "me"] as const;

export function getCurrentUser() {
  return apiRequest(() => parseResponse(getCurrentUserRequest()));
}

async function getSessionUser(): Promise<CurrentUser | null> {
  try {
    const response = await getCurrentUser();
    return response.user;
  } catch (error) {
    if (error instanceof ApiClientError && error.code === "UNAUTHORIZED") {
      return null;
    }
    throw error;
  }
}

export function currentUserQueryOptions() {
  return queryOptions({
    queryKey: currentUserQueryKey,
    queryFn: getSessionUser,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) =>
      !(error instanceof ApiClientError && error.status === 401) &&
      failureCount < 2,
  });
}

export function logout() {
  return apiRequest(() => parseResponse(apiClient.api.auth.logout.$post()));
}
