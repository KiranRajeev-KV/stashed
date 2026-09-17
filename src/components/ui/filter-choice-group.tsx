import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import * as React from "react";

export type FilterChoice<Value extends string> = {
  value: Value;
  label: React.ReactNode;
  icon?: React.ReactNode;
};

type FilterChoiceGroupProps<Value extends string> = {
  choices: ReadonlyArray<FilterChoice<Value>>;
  className?: string;
  disabled?: boolean;
  label: string;
  labelClassName?: string;
  onValueChange: (value?: Value) => void;
  value?: Value;
  variant?: "segmented" | "grid";
};

const groupVariants = {
  segmented: "grid-cols-3",
  grid: "grid-cols-2",
} as const;

const choiceVariants = {
  segmented: "justify-center px-2",
  grid: "justify-start px-3",
} as const;

/** A compact optional single-choice filter. No pressed choice means no filter. */
export function FilterChoiceGroup<Value extends string>({
  choices,
  className,
  disabled = false,
  label,
  labelClassName = "sr-only",
  onValueChange,
  value,
  variant = "segmented",
}: FilterChoiceGroupProps<Value>) {
  const labelId = React.useId();

  return (
    <div className={`grid min-w-0 gap-2 ${className ?? ""}`}>
      <span id={labelId} className={labelClassName}>
        {label}
      </span>
      <ToggleGroup<Value>
        aria-labelledby={labelId}
        className={`grid min-w-0 ${groupVariants[variant]} gap-1 rounded-control border border-border bg-surface p-1 shadow-control`}
        disabled={disabled}
        value={value ? [value] : []}
        onValueChange={(nextValues) => onValueChange(nextValues[0])}
      >
        {choices.map((choice) => (
          <Toggle<Value>
            key={choice.value}
            value={choice.value}
            className={`group inline-flex min-h-9 min-w-0 items-center gap-1.5 rounded-[4px] text-caption text-muted-foreground transition-[background-color,color,box-shadow] duration-(--duration-fast) hover:bg-surface-muted/55 hover:text-foreground focus-visible:relative focus-visible:z-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring data-pressed:bg-surface-muted data-pressed:font-medium data-pressed:text-foreground data-pressed:shadow-control disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${choiceVariants[variant]}`}
          >
            {choice.icon ? (
              <span
                className="grid shrink-0 place-items-center text-muted-foreground group-data-pressed:text-primary"
                aria-hidden="true"
              >
                {choice.icon}
              </span>
            ) : null}
            <span className="min-w-0 truncate">{choice.label}</span>
          </Toggle>
        ))}
      </ToggleGroup>
    </div>
  );
}
