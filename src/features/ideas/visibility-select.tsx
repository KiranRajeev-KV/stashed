import { Select } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import {
  IDEA_VISIBILITIES,
  IDEA_VISIBILITY_LABELS,
  IDEA_VISIBILITY_OPTION_LABELS,
  type IdeaVisibility,
} from "./idea-visibility.js";
import { VisibilityIcon } from "./visibility-icon.js";

const triggerClass =
  "flex min-h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-surface px-4 text-left text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:border-border-strong data-[popup-open]:bg-surface-elevated";
const optionClass =
  "group grid min-h-11 w-full cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-2 rounded-control px-3 py-2 text-sm text-foreground outline-none select-none data-[highlighted]:bg-surface-muted";
const indicatorClass =
  "invisible grid place-items-center text-primary group-data-[selected]:visible [&_svg]:size-4";

type VisibilitySelectProps = {
  className?: string;
  description?: React.ReactNode;
  label: string;
  labelClassName?: string;
  name?: string;
  onBlur?: () => void;
  onValueChange: (visibility: IdeaVisibility) => void;
  value: IdeaVisibility;
};

export function VisibilitySelect({
  className,
  description,
  label,
  labelClassName,
  name,
  onBlur,
  onValueChange,
  value,
}: VisibilitySelectProps) {
  const descriptionId = React.useId();

  return (
    <Select.Root
      name={name}
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue as IdeaVisibility)}
    >
      <div className={className}>
        <Select.Label className={labelClassName}>{label}</Select.Label>
        <Select.Trigger
          className={triggerClass}
          aria-describedby={description ? descriptionId : undefined}
          onBlur={onBlur}
        >
          <span className="flex min-w-0 items-center gap-2">
            <VisibilityIcon visibility={value} className="size-4 shrink-0" />
            <Select.Value>{IDEA_VISIBILITY_LABELS[value]}</Select.Value>
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
          className="z-50 w-max min-w-(--anchor-width) max-w-[calc(100vw-2rem)] outline-none"
          sideOffset={6}
        >
          <Select.Popup className="flex max-h-[min(24rem,var(--available-height))] w-full min-w-0 flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated text-foreground shadow-overlay">
            <Select.List className="max-h-[min(24rem,var(--available-height))] w-full overflow-y-auto p-1 outline-none">
              {IDEA_VISIBILITIES.map((visibility) => (
                <Select.Item
                  key={visibility}
                  value={visibility}
                  className={optionClass}
                >
                  <Select.ItemIndicator keepMounted className={indicatorClass}>
                    <Check aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="flex min-w-0 items-center gap-2 whitespace-nowrap">
                    <VisibilityIcon
                      visibility={visibility}
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    {IDEA_VISIBILITY_OPTION_LABELS[visibility]}
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
