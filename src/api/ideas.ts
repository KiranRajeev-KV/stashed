import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { ApiClientError, apiClient, apiRequest } from "./client.js";

const listIdeasRequest = apiClient.api.ideas.$get;
const getIdeaRequest = apiClient.api.ideas[":id"].$get;
const createIdeaRequest = apiClient.api.ideas.$post;
const updateIdeaRequest = apiClient.api.ideas[":id"].$patch;

export type ListIdeasQuery = InferRequestType<typeof listIdeasRequest>["query"];
export type IdeasPage = InferResponseType<typeof listIdeasRequest, 200>;
export type IdeaListItem = IdeasPage["ideas"][number];
export type IdeaStatus = IdeaListItem["status"];
export type IdeaSort = Exclude<ListIdeasQuery["sort"], undefined>;
export type IdeaResponse = InferResponseType<typeof getIdeaRequest, 200>;
export type Idea = IdeaResponse["idea"];
export type CreateIdeaInput = InferRequestType<
  typeof createIdeaRequest
>["json"];
export type UpdateIdeaInput = InferRequestType<
  typeof updateIdeaRequest
>["json"];

export type IdeaListFilters = {
  status?: IdeaStatus;
  sort?: IdeaSort;
  tagIds?: string[];
};

export const IDEAS_PAGE_SIZE = "20";

export function ideasQueryKey(filters: IdeaListFilters) {
  const tagIds = filters.tagIds
    ? [...new Set(filters.tagIds)].sort()
    : undefined;

  return [
    "ideas",
    {
      status: filters.status,
      sort: filters.sort,
      tagIds,
      limit: IDEAS_PAGE_SIZE,
    },
  ] as const;
}

export function ideasInfiniteQueryOptions(filters: IdeaListFilters) {
  const tagIds = filters.tagIds
    ? [...new Set(filters.tagIds)].sort()
    : undefined;

  return infiniteQueryOptions({
    queryKey: ideasQueryKey({ ...filters, tagIds }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listIdeas({
        status: filters.status,
        sort: filters.sort,
        tagId: tagIds,
        cursor: pageParam ?? undefined,
        limit: IDEAS_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function ideaQueryKey(id: string) {
  return ["idea", id] as const;
}

export function ideaQueryOptions(id: string) {
  return queryOptions({
    queryKey: ideaQueryKey(id),
    queryFn: async () => (await getIdea(id)).idea,
    staleTime: 30_000,
    retry: (failureCount, error) =>
      !(
        error instanceof ApiClientError &&
        [400, 401, 403, 404].includes(error.status)
      ) && failureCount < 2,
  });
}

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
