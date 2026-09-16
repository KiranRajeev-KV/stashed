import { X } from "lucide-react";

import {
  FilterChoiceGroup,
  type FilterChoice,
} from "../../components/ui/filter-choice-group.js";
import { Select, type SelectOption } from "../../components/ui/select.js";
import type { IdeaStatus } from "../../api/ideas.js";
import type { IdeaVisibility } from "./idea-visibility.js";
import { IDEA_STATUSES, IDEA_STATUS_LABELS } from "./idea-status.js";
import { StatusDot } from "./status-select.js";
import { VisibilityIcon } from "./visibility-icon.js";

const statusOptions = IDEA_STATUSES.map((status): SelectOption<IdeaStatus> => ({
  value: status,
  label: IDEA_STATUS_LABELS[status],
  icon: <StatusDot status={status} />,
}));

const statusChoices = IDEA_STATUSES.map((status): FilterChoice<IdeaStatus> => ({
  value: status,
  label: IDEA_STATUS_LABELS[status],
  icon: <StatusDot status={status} />,
}));

const visibilityChoices: ReadonlyArray<FilterChoice<IdeaVisibility>> = [
  {
    value: "PUBLIC",
    label: "Public",
    icon: <VisibilityIcon visibility="PUBLIC" className="size-3.5 shrink-0" />,
  },
  {
    value: "UNLISTED",
    label: "Unlisted",
    icon: (
      <VisibilityIcon visibility="UNLISTED" className="size-3.5 shrink-0" />
    ),
  },
  {
    value: "PRIVATE",
    label: "Private",
    icon: <VisibilityIcon visibility="PRIVATE" className="size-3.5 shrink-0" />,
  },
];

type FilterControlProps<Value extends string> = {
  className?: string;
  label: string;
  labelClassName?: string;
  onValueChange: (value?: Value) => void;
  value?: Value;
};

export function StatusFilter({
  className,
  label,
  labelClassName = "sr-only",
  onValueChange,
  value,
}: FilterControlProps<IdeaStatus>) {
  return (
    <div className={`grid min-w-0 gap-2 ${className ?? ""}`}>
      <span className={labelClassName}>{label}</span>
      <div className="flex min-w-0">
        <Select
          className="contents"
          label={label}
          labelClassName="sr-only"
          options={statusOptions}
          placeholder="Status"
          triggerClassName={`min-w-0 flex-1 ${value ? "rounded-r-none" : ""}`}
          value={value}
          variant="filter"
          onValueChange={onValueChange}
        />
        {value ? (
          <button
            type="button"
            className="-ml-px grid size-control shrink-0 place-items-center rounded-r-control border border-border bg-surface text-muted-foreground transition-colors duration-(--duration-fast) hover:z-1 hover:border-border-strong hover:bg-surface-muted hover:text-foreground focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
            onClick={() => onValueChange(undefined)}
            aria-label="Clear status filter"
            title="Clear status filter"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function StatusChoiceFilter({
  className,
  label,
  labelClassName,
  onValueChange,
  value,
}: FilterControlProps<IdeaStatus>) {
  return (
    <FilterChoiceGroup
      choices={statusChoices}
      className={className}
      label={label}
      labelClassName={labelClassName}
      value={value}
      variant="grid"
      onValueChange={onValueChange}
    />
  );
}

export function VisibilityFilter({
  className,
  label,
  labelClassName,
  onValueChange,
  value,
}: FilterControlProps<IdeaVisibility>) {
  return (
    <FilterChoiceGroup
      choices={visibilityChoices}
      className={className}
      label={label}
      labelClassName={labelClassName}
      value={value}
      onValueChange={onValueChange}
    />
  );
}
