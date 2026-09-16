import {
  twUiSelectItem,
  twUiSelectPopup,
  twUiSelectTrigger,
} from "../../styles/selects-styles.js";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import type { ComponentProps } from "react";
export function ComboboxTrigger({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Trigger>) {
  return (
    <BaseCombobox.Trigger
      {...props}
      className={
        typeof className === "function"
          ? (state) => `${twUiSelectTrigger} ${className(state)}`
          : `${twUiSelectTrigger} ${className ?? ""}`
      }
    />
  );
}
export function ComboboxPopup({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Popup>) {
  return (
    <BaseCombobox.Popup
      {...props}
      className={
        typeof className === "function"
          ? (state) => `${twUiSelectPopup} ${className(state)}`
          : `${twUiSelectPopup} ${className ?? ""}`
      }
    />
  );
}
export function ComboboxItem({
  className,
  ...props
}: ComponentProps<typeof BaseCombobox.Item>) {
  return (
    <BaseCombobox.Item
      {...props}
      className={
        typeof className === "function"
          ? (state) => `${twUiSelectItem} ${className(state)}`
          : `${twUiSelectItem} ${className ?? ""}`
      }
    />
  );
}
