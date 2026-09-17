import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import {
  twUiSelectItem,
  twUiSelectPopup,
  twUiSelectTrigger,
} from "../../styles/selects-styles.js";

export type SelectOption<Value extends string> = {
  value: Value;
  label: React.ReactNode;
  valueLabel?: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Use a non-modal popup when the select lives inside another modal surface. */
  modal?: boolean;
  textValue?: string;
};

type SelectVariant = "field" | "filter" | "compact" | "inline";

const triggerVariants: Record<SelectVariant, string> = {
  field:
    "flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 px-4 text-left",
  filter:
    "flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 px-3 text-left",
  compact:
    "select-compact inline-flex min-w-0 cursor-pointer items-center justify-between gap-2 px-2.5 text-left text-caption",
  inline:
    "inline-flex min-w-0 cursor-pointer items-center justify-between gap-1.5 px-2 text-left",
};

type BaseTriggerProps = React.ComponentProps<typeof BaseSelect.Trigger>;
type BasePositionerProps = React.ComponentProps<typeof BaseSelect.Positioner>;
export type SelectPortalContainer = React.ComponentProps<
  typeof BaseSelect.Portal
>["container"];

export type SelectProps<Value extends string> = {
  value?: Value;
  options: ReadonlyArray<SelectOption<Value>>;
  onValueChange: (value: Value) => void;
  label: React.ReactNode;
  className?: string;
  labelClassName?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  /** Use a non-modal popup when the select lives inside another modal surface. */
  modal?: boolean;
  required?: boolean;
  name?: string;
  placeholder?: React.ReactNode;
  variant?: SelectVariant;
  triggerClassName?: string;
  popupClassName?: string;
  positionerClassName?: string;
  /** Keeps a popup within a containing modal's focus and pointer boundary. */
  portalContainer?: SelectPortalContainer;
  hideChevron?: boolean;
  chevronClassName?: string;
  dataStatus?: string;
  renderOption?: (option: SelectOption<Value>) => React.ReactNode;
  renderValue?: (option: SelectOption<Value> | undefined) => React.ReactNode;
  triggerProps?: Omit<BaseTriggerProps, "children" | "className">;
  positionerProps?: Omit<BasePositionerProps, "children" | "className">;
};

/**
 * The application-wide single-choice control. Domain selects provide data and
 * optional renderers; this component owns behavior, accessibility, and layout.
 */
export function Select<Value extends string>({
  value,
  options,
  onValueChange,
  label,
  className,
  labelClassName = "sr-only",
  description,
  disabled = false,
  modal,
  required = false,
  name,
  placeholder = "Select an option",
  variant = "field",
  triggerClassName,
  popupClassName,
  positionerClassName,
  portalContainer,
  hideChevron = false,
  chevronClassName,
  dataStatus,
  renderOption,
  renderValue,
  triggerProps,
  positionerProps,
}: SelectProps<Value>) {
  const descriptionId = React.useId();
  const selectedOption = options.find((option) => option.value === value);
  const describedBy = description
    ? descriptionId
    : triggerProps?.["aria-describedby"];

  return (
    <BaseSelect.Root<Value>
      value={value ?? null}
      disabled={disabled}
      modal={modal}
      required={required}
      name={name}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue);
      }}
    >
      <div className={className}>
        <BaseSelect.Label className={labelClassName}>{label}</BaseSelect.Label>
        <BaseSelect.Trigger
          {...triggerProps}
          aria-describedby={describedBy}
          data-status={dataStatus}
          className={`${twUiSelectTrigger} ${triggerVariants[variant]} ${triggerClassName ?? ""}`}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            {renderValue ? (
              renderValue(selectedOption)
            ) : selectedOption ? (
              <>
                {selectedOption.icon ? (
                  <span
                    className="grid shrink-0 place-items-center text-muted-foreground"
                    aria-hidden="true"
                  >
                    {selectedOption.icon}
                  </span>
                ) : null}
                <span className="min-w-0 truncate">
                  {selectedOption.valueLabel ?? selectedOption.label}
                </span>
              </>
            ) : (
              <span className="truncate text-muted-foreground">
                {placeholder}
              </span>
            )}
          </span>
          {!hideChevron ? (
            <BaseSelect.Icon className="grid shrink-0 place-items-center text-muted-foreground">
              <ChevronDown
                className={`size-4 ${chevronClassName ?? ""}`}
                aria-hidden="true"
              />
            </BaseSelect.Icon>
          ) : null}
        </BaseSelect.Trigger>
        {description ? (
          <div
            id={descriptionId}
            className="text-caption leading-relaxed text-muted-foreground"
          >
            {description}
          </div>
        ) : null}
      </div>

      <BaseSelect.Portal container={portalContainer}>
        <BaseSelect.Positioner
          align="start"
          alignItemWithTrigger={false}
          collisionAvoidance={{
            align: "shift",
            fallbackAxisSide: "none",
            side: "flip",
          }}
          collisionPadding={16}
          sideOffset={6}
          {...positionerProps}
          className={`z-[70] w-max min-w-(--anchor-width) max-w-[calc(100vw-2rem)] outline-none ${positionerClassName ?? ""}`}
        >
          <BaseSelect.Popup
            className={`${twUiSelectPopup} flex w-full min-w-0 flex-col overflow-hidden ${popupClassName ?? ""}`}
          >
            <BaseSelect.List className="max-h-[min(24rem,var(--available-height))] w-full overflow-x-hidden overflow-y-auto p-[5px] outline-none">
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  label={
                    option.textValue ??
                    (typeof option.label === "string"
                      ? option.label
                      : option.value)
                  }
                  disabled={option.disabled}
                  className={`${twUiSelectItem} group grid w-full cursor-pointer grid-cols-1 items-center text-left outline-none select-none`}
                >
                  <BaseSelect.ItemText className="min-w-0">
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <span className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2">
                        {option.icon ? (
                          <span
                            className="grid shrink-0 place-items-center text-muted-foreground"
                            aria-hidden="true"
                          >
                            {option.icon}
                          </span>
                        ) : null}
                        <span
                          className={`min-w-0 ${option.icon ? "col-start-2" : "col-span-2"}`}
                        >
                          <span className="block wrap-anywhere">
                            {option.label}
                          </span>
                          {option.description ? (
                            <span className="mt-0.5 block text-caption font-normal text-muted-foreground">
                              {option.description}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    )}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
