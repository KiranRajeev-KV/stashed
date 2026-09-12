import { twIdeaStatus } from "../../styles/archive-styles.js";
import { Select } from "../../components/ui/select.js";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import type { IdeaStatus } from "../../api/ideas.js";
import { IDEA_STATUSES, IDEA_STATUS_LABELS } from "./idea-status.js";

const ALL_STATUSES = "ALL";
const statusDotColors: Record<IdeaStatus, string> = {
  DRAFT: "bg-muted-foreground",
  ACTIVE: "bg-status-active",
  PLANNED: "bg-status-planned",
  IN_PROGRESS: "bg-warning",
  COMPLETED: "bg-success",
  ARCHIVED: "bg-status-archived",
};

function StatusDot({ status }: { status: IdeaStatus }) {
  return (
    <span
      aria-hidden="true"
      data-status={status}
      className={`size-1.5 shrink-0 rounded-full ${statusDotColors[status]}`}
    />
  );
}
const triggerClass =
  "flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-surface text-left text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:border-border-strong data-[popup-open]:bg-surface-elevated";
const badgeTriggerClass = `${twIdeaStatus} inline-flex cursor-pointer items-center gap-1 text-left transition-colors duration-(--duration-fast) hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`;
const optionClass =
  "group grid min-h-11 w-full cursor-pointer grid-cols-1 items-center gap-2 rounded-control px-3 py-2 text-sm text-foreground outline-none select-none data-[highlighted]:bg-surface-muted";

type StatusSelectProps = {
  allowAll?: boolean;
  className?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  label: string;
  labelClassName?: string;
  icon?: "chevrons" | "down";
  iconClassName?: string;
  name?: string;
  onBlur?: () => void;
  onValueChange: (status?: IdeaStatus) => void;
  size?: "filter" | "form";
  hideIcon?: boolean;
  triggerClassName?: string;
  triggerDataStatus?: IdeaStatus;
  variant?: "default" | "badge";
  value?: IdeaStatus;
};

export function StatusSelect({
  allowAll = false,
  className,
  description,
  disabled = false,
  icon = "down",
  iconClassName,
  label,
  labelClassName,
  name,
  onBlur,
  onValueChange,
  hideIcon = false,
  size = "filter",
  triggerClassName,
  triggerDataStatus,
  variant = "default",
  value,
}: StatusSelectProps) {
  const descriptionId = React.useId();
  const selectedValue = value ?? ALL_STATUSES;
  const sizeClass = size === "form" ? "min-h-11 px-4" : "min-h-11 px-3";
  const Icon = icon === "down" ? ChevronDown : ChevronsUpDown;
  const triggerClasses =
    variant === "badge"
      ? `${badgeTriggerClass} ${triggerClassName ?? ""}`
      : `${triggerClass} ${sizeClass} ${triggerClassName ?? ""}`;

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
          className={triggerClasses}
          aria-describedby={description ? descriptionId : undefined}
          data-status={triggerDataStatus ?? value}
          onBlur={onBlur}
        >
          <Select.Value className="flex min-w-0 items-center gap-2">
            {variant !== "badge" && selectedValue !== ALL_STATUSES ? (
              <StatusDot status={selectedValue} />
            ) : null}
            {selectedValue === ALL_STATUSES
              ? "Every status"
              : IDEA_STATUS_LABELS[selectedValue]}
          </Select.Value>
          {!hideIcon ? (
            <Select.Icon
              className={`grid shrink-0 place-items-center ${iconClassName ?? "text-muted-foreground"}`}
            >
              <Icon
                className={variant === "badge" ? "size-3" : "size-4"}
                aria-hidden="true"
              />
            </Select.Icon>
          ) : null}
        </Select.Trigger>
        {description ? <div id={descriptionId}>{description}</div> : null}
      </div>

      <Select.Portal>
        <Select.Positioner
          align="start"
          alignItemWithTrigger={false}
          className="z-[70] w-max min-w-(--anchor-width) max-w-[calc(100vw-2rem)] outline-none"
          sideOffset={6}
        >
          <Select.Popup className="flex max-h-[min(24rem,var(--available-height))] w-full min-w-0 flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated text-foreground shadow-overlay">
            <Select.List className="w-full max-h-[min(24rem,var(--available-height))] overflow-y-auto p-1 outline-none">
              {allowAll ? (
                <Select.Item value={ALL_STATUSES} className={optionClass}>
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
                  <Select.ItemText className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                    <StatusDot status={status} />
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
