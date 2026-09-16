import { Select, type SelectOption } from "../../components/ui/select.js";

import type { SortValue } from "./idea-sort.js";

const DEFAULT_SORT = "UPDATED_DESC";

type SortSelectProps<Value extends SortValue> = {
  className?: string;
  labelClassName?: string;
  onValueChange: (sort?: Value) => void;
  options: ReadonlyArray<SelectOption<Value>>;
  value?: Value;
};

export function SortSelect<Value extends SortValue>({
  className,
  labelClassName,
  onValueChange,
  options,
  value,
}: SortSelectProps<Value>) {
  return (
    <Select
      className={className}
      label="Sort"
      labelClassName={labelClassName}
      options={options}
      positionerProps={{ align: "end" }}
      value={value ?? DEFAULT_SORT}
      variant="filter"
      onValueChange={(nextValue) =>
        onValueChange(nextValue === DEFAULT_SORT ? undefined : nextValue)
      }
    />
  );
}
