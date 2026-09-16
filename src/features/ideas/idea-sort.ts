import {
  archiveSortOptions,
  type ArchiveSort,
} from "../../components/ui/archive-sort-options.js";

export type SortValue = ArchiveSort;

export function getSortOptions() {
  return archiveSortOptions;
}

export function getSortLabel(value: SortValue) {
  return getSortOptions().find((option) => option.value === value)?.label;
}
