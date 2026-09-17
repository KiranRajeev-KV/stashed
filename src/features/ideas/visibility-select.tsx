import * as React from "react";

import {
  Select,
  type SelectOption,
  type SelectPortalContainer,
} from "../../components/ui/select.js";
import { twIdeaVisibilityTrigger } from "../../styles/selects-styles.js";
import {
  IDEA_VISIBILITIES,
  IDEA_VISIBILITY_LABELS,
  type IdeaVisibility,
} from "./idea-visibility.js";
import { VisibilityIcon } from "./visibility-icon.js";

type VisibilitySelectProps = {
  className?: string;
  description?: React.ReactNode;
  disabled?: boolean;
  modal?: boolean;
  variant?: "default" | "inline";
  label: string;
  labelClassName?: string;
  name?: string;
  onBlur?: () => void;
  portalContainer?: SelectPortalContainer;
  onValueChange: (visibility?: IdeaVisibility) => void;
  optionLabels?: Record<IdeaVisibility, string>;
  size?: "filter" | "form";
  value?: IdeaVisibility;
  valueLabels?: Record<IdeaVisibility, string>;
};

export function VisibilitySelect({
  className,
  description,
  disabled,
  modal,
  variant = "default",
  label,
  labelClassName,
  name,
  onBlur,
  portalContainer,
  onValueChange,
  optionLabels = IDEA_VISIBILITY_LABELS,
  size = "form",
  value,
  valueLabels = IDEA_VISIBILITY_LABELS,
}: VisibilitySelectProps) {
  const options: SelectOption<IdeaVisibility>[] = IDEA_VISIBILITIES.map(
    (visibility) => ({
      value: visibility,
      label: optionLabels[visibility],
      valueLabel: valueLabels[visibility],
      icon: (
        <VisibilityIcon visibility={visibility} className="size-4 shrink-0" />
      ),
    }),
  );

  return (
    <Select
      className={className}
      description={description}
      disabled={disabled}
      modal={modal}
      label={label}
      labelClassName={labelClassName}
      name={name}
      options={options}
      triggerClassName={
        variant === "inline" ? twIdeaVisibilityTrigger : undefined
      }
      triggerProps={{ onBlur }}
      portalContainer={portalContainer}
      value={value}
      variant={
        variant === "inline" ? "inline" : size === "form" ? "field" : "filter"
      }
      onValueChange={onValueChange}
    />
  );
}
