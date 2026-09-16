import * as React from "react";

import type { IdeaStatus } from "../../api/ideas.js";
import { Select, type SelectOption } from "../../components/ui/select.js";
import { twIdeaStatus } from "../../styles/archive-styles.js";
import { IDEA_STATUSES, IDEA_STATUS_LABELS } from "./idea-status.js";

const statusDotColors: Record<IdeaStatus, string> = {
  DRAFT: "bg-muted-foreground",
  ACTIVE: "bg-status-active",
  PLANNED: "bg-status-planned",
  IN_PROGRESS: "bg-warning",
  COMPLETED: "bg-success",
  ARCHIVED: "bg-status-archived",
};

export function StatusDot({ status }: { status: IdeaStatus }) {
  return (
    <span
      aria-hidden="true"
      data-status={status}
      className={`size-1.5 shrink-0 rounded-full ${statusDotColors[status]}`}
    />
  );
}

type StatusSelectProps = {
  className?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  label: string;
  labelClassName?: string;
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
  className,
  description,
  disabled = false,
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
  const options: SelectOption<IdeaStatus>[] = IDEA_STATUSES.map((status) => ({
    value: status,
    label: IDEA_STATUS_LABELS[status],
    icon: <StatusDot status={status} />,
  }));

  return (
    <Select
      className={className}
      description={description}
      disabled={disabled}
      chevronClassName={iconClassName}
      dataStatus={triggerDataStatus ?? value}
      hideChevron={hideIcon}
      label={label}
      labelClassName={labelClassName}
      name={name}
      options={options}
      triggerClassName={`${variant === "badge" ? twIdeaStatus : ""} ${triggerClassName ?? ""}`}
      triggerProps={{ onBlur }}
      value={value}
      variant={
        variant === "badge" ? "inline" : size === "form" ? "field" : "filter"
      }
      renderValue={(option) => (
        <>
          {variant !== "badge" && value ? <StatusDot status={value} /> : null}
          <span className="min-w-0 truncate">
            {option?.valueLabel ?? option?.label}
          </span>
        </>
      )}
      onValueChange={onValueChange}
    />
  );
}
