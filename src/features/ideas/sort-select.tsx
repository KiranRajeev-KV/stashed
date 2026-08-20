import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";

import type { IdeaSort } from "../../api/ideas.js";
import type { SearchIdeaSort } from "../../api/search.js";

type SortValue = IdeaSort | SearchIdeaSort;

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { value: "UPDATED_DESC", label: "Recently updated" },
  { value: "CREATED_DESC", label: "Recently created" },
  { value: "UPDATED_ASC", label: "Least recently updated" },
  { value: "CREATED_ASC", label: "Oldest created" },
];
const BEST_MATCH_OPTION = {
  value: "BEST_MATCH" as const,
  label: "Best match",
};

const triggerClass =
  "flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 text-left text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:border-border-strong data-[popup-open]:bg-surface-elevated";
const optionClass =
  "group grid min-h-11 w-full cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2 rounded-control px-3 py-2 text-sm text-foreground outline-none select-none data-[highlighted]:bg-surface-muted";
const indicatorClass =
  "invisible grid place-items-center text-primary group-data-[selected]:visible [&_svg]:size-4";

type SortSelectProps = {
  className?: string;
  includeBestMatch?: boolean;
  labelClassName?: string;
  onValueChange: (sort?: SortValue) => void;
  value?: SortValue;
};

export function SortSelect({
  className,
  includeBestMatch = false,
  labelClassName,
  onValueChange,
  value,
}: SortSelectProps) {
  const selectedValue = value ?? "UPDATED_DESC";
  const options = includeBestMatch
    ? [BEST_MATCH_OPTION, ...SORT_OPTIONS]
    : SORT_OPTIONS;

  return (
    <Select.Root
      value={selectedValue}
      onValueChange={(nextValue) =>
        onValueChange(
          nextValue === "UPDATED_DESC" ? undefined : (nextValue as SortValue),
        )
      }
    >
      <div className={className}>
        <Select.Label className={labelClassName}>Sort</Select.Label>
        <Select.Trigger className={triggerClass}>
          <Select.Value>
            {options.find((option) => option.value === selectedValue)?.label}
          </Select.Value>
          <Select.Icon className="grid shrink-0 place-items-center text-muted-foreground">
            <ChevronsUpDown className="size-4" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
      </div>

      <Select.Portal>
        <Select.Positioner
          align="start"
          alignItemWithTrigger={false}
          className="z-50 w-(--anchor-width) outline-none"
          sideOffset={6}
        >
          <Select.Popup className="flex max-h-[min(24rem,var(--available-height))] w-full min-w-0 flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated text-foreground shadow-overlay">
            <Select.List className="w-full max-h-[min(24rem,var(--available-height))] overflow-y-auto p-1 outline-none">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={optionClass}
                >
                  <Select.ItemIndicator keepMounted className={indicatorClass}>
                    <Check aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="min-w-0 whitespace-nowrap">
                    {option.label}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
