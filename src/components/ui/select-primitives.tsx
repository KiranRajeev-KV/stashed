import {
  twUiSelectItem,
  twUiSelectPopup,
  twUiSelectTrigger,
} from "../../styles/selects-styles.js";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import type { ComponentProps } from "react";

export function SelectTrigger({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Trigger>) {
  return (
    <BaseSelect.Trigger
      {...props}
      className={
        typeof className === "function"
          ? (state) => `${twUiSelectTrigger} ${className(state)}`
          : `${twUiSelectTrigger} ${className ?? ""}`
      }
    />
  );
}
export function SelectPopup({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Popup>) {
  return (
    <BaseSelect.Popup
      {...props}
      className={
        typeof className === "function"
          ? (state) => `${twUiSelectPopup} ${className(state)}`
          : `${twUiSelectPopup} ${className ?? ""}`
      }
    />
  );
}
export function SelectItem({
  className,
  ...props
}: ComponentProps<typeof BaseSelect.Item>) {
  return (
    <BaseSelect.Item
      {...props}
      className={
        typeof className === "function"
          ? (state) => `${twUiSelectItem} ${className(state)}`
          : `${twUiSelectItem} ${className ?? ""}`
      }
    />
  );
}
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
