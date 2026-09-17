import { Combobox as BaseCombobox } from "@base-ui/react/combobox";

import {
  ComboboxItem,
  ComboboxPopup,
  ComboboxTrigger,
} from "./select-primitives.js";

// Searchable and multi-value selection has different semantics, but shares the
// same visual primitives with Select.
export const Combobox = {
  ...BaseCombobox,
  Trigger: ComboboxTrigger,
  Popup: ComboboxPopup,
  Item: ComboboxItem,
};
