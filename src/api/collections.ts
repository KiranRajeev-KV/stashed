import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from "@tanstack/react-query";
import {
  type InferRequestType,
  type InferResponseType,
  parseResponse,
} from "hono/client";

import { ApiClientError, apiClient, apiRequest } from "./client.js";

const listRequest = apiClient.api.collections.$get;
const detailRequest = apiClient.api.collections[":id"].$get;
const createRequest = apiClient.api.collections.$post;
const updateRequest = apiClient.api.collections[":id"].$patch;
const ideasRequest = apiClient.api.collections[":id"].ideas.$get;
const ideaCandidatesRequest =
  apiClient.api.collections[":id"].ideas.candidates.$get;
const addIdeasRequest = apiClient.api.collections[":id"].ideas.batch.$post;
const removeIdeasRequest = apiClient.api.collections[":id"].ideas.batch.$delete;
const collaboratorsRequest =
  apiClient.api.collections[":id"].collaborators.$get;
const ideaTargetsRequest = apiClient.api.collections["idea-targets"].$get;

export type CollectionListQuery = InferRequestType<typeof listRequest>["query"];
type CollectionListResponse = InferResponseType<typeof listRequest, 200>;
export type CollectionListItem = CollectionListResponse["collections"][number];
export type CreateCollectionInput = InferRequestType<
  typeof createRequest
>["json"];
export type UpdateCollectionInput = InferRequestType<
  typeof updateRequest
>["json"];
export type CollectionIdeasQuery = InferRequestType<
  typeof ideasRequest
>["query"];
export type CollectionIdeasResponse = InferResponseType<
  typeof ideasRequest,
  200
>;
export type CollectionIdeaCandidatesQuery = InferRequestType<
  typeof ideaCandidatesRequest
>["query"];
type CollectionIdeaCandidatesResponse = InferResponseType<
  typeof ideaCandidatesRequest,
  200
>;
export type CollectionIdeaCandidate =
  CollectionIdeaCandidatesResponse["ideas"][number];
export type CollectionIdeaTargetsQuery = InferRequestType<
  typeof ideaTargetsRequest
>["query"];
type CollectionIdeaTargetsResponse = InferResponseType<
  typeof ideaTargetsRequest,
  200
>;
export type CollectionIdeaTarget =
  CollectionIdeaTargetsResponse["collections"][number];

const PAGE_SIZE = "20";

function collectionsQueryKey(query: CollectionListQuery) {
  return ["collections", query] as const;
}

export function collectionsInfiniteQueryOptions(query: CollectionListQuery) {
  return infiniteQueryOptions({
    queryKey: collectionsQueryKey({ ...query, limit: PAGE_SIZE }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      listCollections({
        ...query,
        limit: PAGE_SIZE,
        offset: String(pageParam),
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

export function collectionQueryKey(id: string) {
  return ["collection", id] as const;
}

export function collectionQueryOptions(id: string) {
  return queryOptions({
    queryKey: collectionQueryKey(id),
    queryFn: async () => (await getCollection(id)).collection,
    retry: (count, error) =>
      !(
        error instanceof ApiClientError &&
        [400, 401, 403, 404].includes(error.status)
      ) && count < 2,
  });
}

function collectionIdeasQueryKey(id: string, query: CollectionIdeasQuery) {
  return ["collection", id, "ideas", query] as const;
}

export function collectionIdeasQueryOptions(
  id: string,
  query: CollectionIdeasQuery,
) {
  return queryOptions({
    queryKey: collectionIdeasQueryKey(id, query),
    queryFn: () => getCollectionIdeas(id, { ...query, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
}

/** The member list is also used by management sheets that can load more. */
export function collectionIdeasInfiniteQueryOptions(
  id: string,
  query: CollectionIdeasQuery,
) {
  return infiniteQueryOptions({
    queryKey: collectionIdeasQueryKey(id, { ...query, limit: PAGE_SIZE }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      getCollectionIdeas(id, {
        ...query,
        limit: PAGE_SIZE,
        offset: String(pageParam),
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

function collectionIdeaCandidatesQueryKey(
  id: string,
  query: CollectionIdeaCandidatesQuery,
) {
  return ["collection", id, "idea-candidates", query] as const;
}

export function collectionIdeaCandidatesInfiniteQueryOptions(
  id: string,
  query: CollectionIdeaCandidatesQuery,
) {
  return infiniteQueryOptions({
    queryKey: collectionIdeaCandidatesQueryKey(id, {
      ...query,
      limit: PAGE_SIZE,
    }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      getCollectionIdeaCandidates(id, {
        ...query,
        limit: PAGE_SIZE,
        offset: String(pageParam),
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

function collectionIdeaTargetsQueryKey(query: CollectionIdeaTargetsQuery) {
  return ["collections", "idea-targets", query] as const;
}

/** Collections where the signed-in user can associate a particular Idea. */
export function collectionIdeaTargetsInfiniteQueryOptions(
  query: CollectionIdeaTargetsQuery,
) {
  return infiniteQueryOptions({
    queryKey: collectionIdeaTargetsQueryKey({ ...query, limit: PAGE_SIZE }),
    initialPageParam: 0,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      getCollectionIdeaTargets({
        ...query,
        limit: PAGE_SIZE,
        offset: String(pageParam),
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
}

export function collaboratorsQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["collection", id, "collaborators"] as const,
    queryFn: async () => (await getCollaborators(id)).collaborators,
  });
}

function listCollections(query: CollectionListQuery) {
  return apiRequest(() => parseResponse(listRequest({ query })));
}

function getCollection(id: string) {
  return apiRequest(() => parseResponse(detailRequest({ param: { id } })));
}

export function createCollection(json: CreateCollectionInput) {
  return apiRequest(() => parseResponse(createRequest({ json })));
}

export function updateCollection(id: string, json: UpdateCollectionInput) {
  return apiRequest(() =>
    parseResponse(updateRequest({ param: { id }, json })),
  );
}

export function deleteCollection(id: string) {
  return apiRequest(() =>
    parseResponse(apiClient.api.collections[":id"].$delete({ param: { id } })),
  );
}

function getCollectionIdeas(id: string, query: CollectionIdeasQuery) {
  return apiRequest(() =>
    parseResponse(ideasRequest({ param: { id }, query })),
  );
}

function getCollectionIdeaCandidates(
  id: string,
  query: CollectionIdeaCandidatesQuery,
) {
  return apiRequest(() =>
    parseResponse(ideaCandidatesRequest({ param: { id }, query })),
  );
}

function getCollectionIdeaTargets(query: CollectionIdeaTargetsQuery) {
  return apiRequest(() => parseResponse(ideaTargetsRequest({ query })));
}

export function addCollectionIdeas(id: string, ideaIds: string[]) {
  return apiRequest(() =>
    parseResponse(addIdeasRequest({ param: { id }, json: { ideaIds } })),
  );
}

export function removeCollectionIdea(id: string, ideaId: string) {
  return apiRequest(() =>
    parseResponse(
      apiClient.api.collections[":id"].ideas[":ideaId"].$delete({
        param: { id, ideaId },
      }),
    ),
  );
}

export function removeCollectionIdeas(id: string, ideaIds: string[]) {
  return apiRequest(() =>
    parseResponse(removeIdeasRequest({ param: { id }, json: { ideaIds } })),
  );
}

function getCollaborators(id: string) {
  return apiRequest(() =>
    parseResponse(collaboratorsRequest({ param: { id } })),
  );
}

export function setCollectionCollaborator(
  id: string,
  userId: string,
  role: "EDITOR" | "VIEWER",
) {
  return apiRequest(() =>
    parseResponse(
      apiClient.api.collections[":id"].collaborators[":userId"].$put({
        param: { id, userId },
        json: { role },
      }),
    ),
  );
}

export function removeCollectionCollaborator(id: string, userId: string) {
  return apiRequest(() =>
    parseResponse(
      apiClient.api.collections[":id"].collaborators[":userId"].$delete({
        param: { id, userId },
      }),
    ),
  );
}
