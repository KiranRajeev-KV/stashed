import type { IdeaSort } from "../../api/ideas.js";
import type { SearchIdeaSort } from "../../api/search.js";

export type SortValue = IdeaSort | SearchIdeaSort;

export const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { value: "UPDATED_DESC", label: "Recently updated" },
  { value: "CREATED_DESC", label: "Recently created" },
  { value: "UPDATED_ASC", label: "Least recently updated" },
  { value: "CREATED_ASC", label: "Oldest created" },
];

export const BEST_MATCH_OPTION = {
  value: "BEST_MATCH" as const,
  label: "Best match",
};

export function getSortOptions(includeBestMatch: boolean) {
  return includeBestMatch ? [BEST_MATCH_OPTION, ...SORT_OPTIONS] : SORT_OPTIONS;
}

export function getSortLabel(value: SortValue, includeBestMatch: boolean) {
  return getSortOptions(includeBestMatch).find(
    (option) => option.value === value,
  )?.label;
}
