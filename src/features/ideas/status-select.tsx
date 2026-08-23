import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import type { IdeaStatus } from "../../api/ideas.js";
import { IDEA_STATUSES, IDEA_STATUS_LABELS } from "./idea-status.js";

const ALL_STATUSES = "ALL";
const triggerClass =
  "flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-surface text-left text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:border-border-strong data-[popup-open]:bg-surface-elevated";
const optionClass =
  "group grid min-h-11 w-full cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2 rounded-control px-3 py-2 text-sm text-foreground outline-none select-none data-[highlighted]:bg-surface-muted";
const indicatorClass =
  "invisible grid place-items-center text-primary group-data-[selected]:visible [&_svg]:size-4";

type StatusSelectProps = {
  allowAll?: boolean;
  className?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  label: string;
  labelClassName?: string;
  name?: string;
  onBlur?: () => void;
  onValueChange: (status?: IdeaStatus) => void;
  size?: "filter" | "form";
  triggerClassName?: string;
  value?: IdeaStatus;
};

export function StatusSelect({
  allowAll = false,
  className,
  description,
  disabled = false,
  label,
  labelClassName,
  name,
  onBlur,
  onValueChange,
  size = "filter",
  triggerClassName,
  value,
}: StatusSelectProps) {
  const descriptionId = React.useId();
  const selectedValue = value ?? ALL_STATUSES;
  const sizeClass = size === "form" ? "min-h-12 px-4" : "min-h-11 px-3";

  return (
    <Select.Root
      name={name}
      value={selectedValue}
      disabled={disabled}
      onValueChange={(nextValue) =>
        onValueChange(
          allowAll && nextValue === ALL_STATUSES
            ? undefined
            : (nextValue as IdeaStatus),
        )
      }
    >
      <div className={className}>
        <Select.Label className={labelClassName}>{label}</Select.Label>
        <Select.Trigger
          className={`${triggerClass} ${sizeClass} ${triggerClassName ?? ""}`}
          aria-describedby={description ? descriptionId : undefined}
          onBlur={onBlur}
        >
          <Select.Value>
            {selectedValue === ALL_STATUSES
              ? "Every status"
              : IDEA_STATUS_LABELS[selectedValue]}
          </Select.Value>
          <Select.Icon className="grid shrink-0 place-items-center text-muted-foreground">
            <ChevronsUpDown className="size-4" aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
        {description ? <div id={descriptionId}>{description}</div> : null}
      </div>

      <Select.Portal>
        <Select.Positioner
          align="start"
          alignItemWithTrigger={false}
          className="z-50 w-max min-w-(--anchor-width) max-w-[calc(100vw-2rem)] outline-none"
          sideOffset={6}
        >
          <Select.Popup className="flex max-h-[min(24rem,var(--available-height))] w-full min-w-0 flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated text-foreground shadow-overlay">
            <Select.List className="w-full max-h-[min(24rem,var(--available-height))] overflow-y-auto p-1 outline-none">
              {allowAll ? (
                <Select.Item value={ALL_STATUSES} className={optionClass}>
                  <Select.ItemIndicator keepMounted className={indicatorClass}>
                    <Check aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="min-w-0 whitespace-nowrap">
                    Every status
                  </Select.ItemText>
                </Select.Item>
              ) : null}
              {IDEA_STATUSES.map((status) => (
                <Select.Item
                  key={status}
                  value={status}
                  className={optionClass}
                >
                  <Select.ItemIndicator keepMounted className={indicatorClass}>
                    <Check aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="min-w-0 whitespace-nowrap">
                    {IDEA_STATUS_LABELS[status]}
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
