import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";

import { apiClient, apiRequest } from "./client.js";

const listIdeasRequest = apiClient.api.ideas.$get;
const getIdeaRequest = apiClient.api.ideas[":id"].$get;
const createIdeaRequest = apiClient.api.ideas.$post;
const updateIdeaRequest = apiClient.api.ideas[":id"].$patch;

export type ListIdeasQuery = InferRequestType<typeof listIdeasRequest>["query"];
export type IdeasPage = InferResponseType<typeof listIdeasRequest, 200>;
export type IdeaListItem = IdeasPage["ideas"][number];
export type IdeaResponse = InferResponseType<typeof getIdeaRequest, 200>;
export type Idea = IdeaResponse["idea"];
export type CreateIdeaInput = InferRequestType<
  typeof createIdeaRequest
>["json"];
export type UpdateIdeaInput = InferRequestType<
  typeof updateIdeaRequest
>["json"];

export function listIdeas(query: ListIdeasQuery = {}) {
  return apiRequest(() => parseResponse(listIdeasRequest({ query })));
}

export function getIdea(id: string) {
  return apiRequest(() =>
    parseResponse(
      getIdeaRequest({
        param: { id },
      }),
    ),
  );
}

export function createIdea(json: CreateIdeaInput) {
  return apiRequest(() => parseResponse(createIdeaRequest({ json })));
}

export function updateIdea(id: string, json: UpdateIdeaInput) {
  return apiRequest(() =>
    parseResponse(
      updateIdeaRequest({
        json,
        param: { id },
      }),
    ),
  );
}

export function deleteIdea(id: string) {
  return apiRequest(() =>
    parseResponse(
      apiClient.api.ideas[":id"].$delete({
        param: { id },
      }),
    ),
  );
}
