import { Select as BaseSelect } from "@base-ui/react/select";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import {
  SelectTrigger,
  SelectPopup,
  SelectItem,
  ComboboxTrigger,
  ComboboxPopup,
  ComboboxItem,
} from "./select-primitives.js";

// Preserve the accessible primitives and generic root types behind shared styling.
export const Select = {
  ...BaseSelect,
  Trigger: SelectTrigger,
  Popup: SelectPopup,
  Item: SelectItem,
};
export const Combobox = {
  ...BaseCombobox,
  Trigger: ComboboxTrigger,
  Popup: ComboboxPopup,
  Item: ComboboxItem,
};
