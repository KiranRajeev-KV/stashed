import { Select } from "../../components/ui/select.js";
import { ChevronDown as ChevronsUpDown } from "lucide-react";
import * as React from "react";

import {
  IDEA_VISIBILITIES,
  IDEA_VISIBILITY_LABELS,
  type IdeaVisibility,
} from "./idea-visibility.js";
import { VisibilityIcon } from "./visibility-icon.js";
import { twIdeaVisibilityTrigger } from "../../styles/selects-styles.js";

const triggerClass =
  "flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-surface px-4 text-left text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:border-border-strong data-[popup-open]:bg-surface-elevated";
const optionClass =
  "group grid min-h-11 w-full cursor-pointer grid-cols-1 items-center gap-2 rounded-control px-3 py-2 text-sm text-foreground outline-none select-none data-[highlighted]:bg-surface-muted";
const ALL_VISIBILITIES = "ALL";

type VisibilitySelectProps = {
  allowAll?: boolean;
  allLabel?: string;
  className?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  variant?: "default" | "inline";
  label: string;
  labelClassName?: string;
  name?: string;
  onBlur?: () => void;
  onValueChange: (visibility?: IdeaVisibility) => void;
  optionLabels?: Record<IdeaVisibility, string>;
  size?: "filter" | "form";
  value?: IdeaVisibility;
  valueLabels?: Record<IdeaVisibility, string>;
};

export function VisibilitySelect({
  allowAll = false,
  allLabel = "Every visibility",
  className,
  description,
  disabled,
  variant = "default",
  label,
  labelClassName,
  name,
  onBlur,
  onValueChange,
  optionLabels = IDEA_VISIBILITY_LABELS,
  size = "form",
  value,
  valueLabels = IDEA_VISIBILITY_LABELS,
}: VisibilitySelectProps) {
  const descriptionId = React.useId();
  const selectedValue = value ?? ALL_VISIBILITIES;
  const sizeClass = size === "form" ? "min-h-11 px-4" : "min-h-11 px-3";

  return (
    <Select.Root
      name={name}
      disabled={disabled}
      value={selectedValue}
      onValueChange={(nextValue) =>
        onValueChange(
          allowAll && nextValue === ALL_VISIBILITIES
            ? undefined
            : (nextValue as IdeaVisibility),
        )
      }
    >
      <div className={className}>
        <Select.Label className={labelClassName}>{label}</Select.Label>
        <Select.Trigger
          className={
            variant === "inline"
              ? twIdeaVisibilityTrigger
              : `${triggerClass} ${sizeClass}`
          }
          aria-describedby={description ? descriptionId : undefined}
          onBlur={onBlur}
        >
          <span className="flex min-w-0 items-center gap-2">
            {value ? (
              <VisibilityIcon visibility={value} className="size-4 shrink-0" />
            ) : null}
            <Select.Value>{value ? valueLabels[value] : allLabel}</Select.Value>
          </span>
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
          className="z-[70] w-max min-w-(--anchor-width) max-w-[calc(100vw-2rem)] outline-none"
          sideOffset={6}
        >
          <Select.Popup className="flex max-h-[min(24rem,var(--available-height))] w-full min-w-0 flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated text-foreground shadow-overlay">
            <Select.List className="max-h-[min(24rem,var(--available-height))] w-full overflow-y-auto p-1 outline-none">
              {allowAll ? (
                <Select.Item value={ALL_VISIBILITIES} className={optionClass}>
                  <Select.ItemText className="min-w-0 whitespace-nowrap">
                    {allLabel}
                  </Select.ItemText>
                </Select.Item>
              ) : null}
              {IDEA_VISIBILITIES.map((visibility) => (
                <Select.Item
                  key={visibility}
                  value={visibility}
                  className={optionClass}
                >
                  <Select.ItemText className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                    <VisibilityIcon
                      visibility={visibility}
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    {optionLabels[visibility]}
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
