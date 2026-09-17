export const archiveSortOptions = [
  { value: "UPDATED_DESC", label: "Recently updated" },
  { value: "CREATED_DESC", label: "Newest" },
  { value: "CREATED_ASC", label: "Oldest" },
  { value: "NAME_ASC", label: "Name A–Z" },
  { value: "NAME_DESC", label: "Name Z–A" },
] as const;

export type ArchiveSort = (typeof archiveSortOptions)[number]["value"];
