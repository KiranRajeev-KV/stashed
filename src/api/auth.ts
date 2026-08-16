import { type InferResponseType, parseResponse } from "hono/client";

import { apiClient, apiRequest } from "./client.js";

const getCurrentUserRequest = apiClient.api.auth.me.$get;

export type CurrentUserResponse = InferResponseType<
  typeof getCurrentUserRequest,
  200
>;
export type CurrentUser = CurrentUserResponse["user"];

export const githubLoginPath = apiClient.api.auth.github.$path();

export function getCurrentUser() {
  return apiRequest(() => parseResponse(getCurrentUserRequest()));
}

export function logout() {
  return apiRequest(() => parseResponse(apiClient.api.auth.logout.$post()));
}
