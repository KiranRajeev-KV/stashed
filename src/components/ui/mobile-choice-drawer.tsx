import { Drawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import * as React from "react";

import {
  twUiDialogBackdrop,
  twUiDialogSheet,
} from "../../styles/dialogs-styles.js";
import {
  twUiSelectSheet,
  twUiSelectTrigger,
} from "../../styles/selects-styles.js";

export type MobileChoice<Value extends string> = {
  value: Value;
  label: string;
  disabled?: boolean;
};

type MobileChoiceDrawerProps<Value extends string> = {
  closeLabel: string;
  description: string;
  options: ReadonlyArray<MobileChoice<Value>>;
  selectedLabel: string;
  title: string;
  triggerIcon: React.ReactNode;
  triggerLabel: string;
  value: Value;
  onValueChange: (value: Value) => void;
};

/** A compact mobile archive control that expands into a single-choice sheet. */
export function MobileChoiceDrawer<Value extends string>({
  closeLabel,
  description,
  options,
  selectedLabel,
  title,
  triggerIcon,
  triggerLabel,
  value,
  onValueChange,
}: MobileChoiceDrawerProps<Value>) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function select(nextValue: Value) {
    onValueChange(nextValue);
    setOpen(false);
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        className={`${twUiSelectTrigger} flex min-h-14 min-w-0 items-center gap-3 rounded-control border border-border-strong bg-surface px-3 text-left text-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
      >
        <span className="grid shrink-0 place-items-center" aria-hidden="true">
          {triggerIcon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-ui font-medium leading-5">
            {triggerLabel}
          </span>
          <span className="block truncate text-caption leading-4 text-muted-foreground">
            {selectedLabel}
          </span>
        </span>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Backdrop
          className={`${twUiDialogBackdrop} fixed inset-0 z-50 bg-foreground/35 opacity-100 backdrop-blur-[2px] transition-opacity duration-(--duration-standard) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none`}
        />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup
            className={`${twUiDialogSheet} ${twUiSelectSheet} flex max-h-[min(80dvh,32rem)] w-full translate-y-[var(--drawer-swipe-movement-y)] flex-col overflow-hidden rounded-t-[1rem] border border-b-0 border-border-strong bg-surface-elevated text-foreground shadow-overlay transition-transform duration-(--duration-slow) ease-emphasized data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[swiping]:select-none motion-reduce:transition-none sm:max-w-xl`}
          >
            <div className="grid shrink-0 gap-4 border-b border-border px-4 pb-4 pt-2 sm:px-6">
              <div
                className="mx-auto h-1 w-11 rounded-full bg-border-strong"
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Drawer.Title className="text-xl font-semibold tracking-tight">
                    {title}
                  </Drawer.Title>
                  <Drawer.Description className="mt-1 text-ui text-muted-foreground">
                    {description}
                  </Drawer.Description>
                </div>
                <Drawer.Close
                  className="grid size-11 shrink-0 place-items-center rounded-control text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                  aria-label={closeLabel}
                >
                  <X className="size-5" aria-hidden="true" />
                </Drawer.Close>
              </div>
            </div>

            <Drawer.Content className="min-h-0 overflow-y-auto overscroll-contain p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-4">
              <div className="grid gap-1" data-base-ui-swipe-ignore>
                {options.map((option) => {
                  const selected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      disabled={option.disabled}
                      className="group grid min-h-12 w-full grid-cols-1 items-center gap-3 rounded-control px-3 py-2 text-left text-ui text-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring aria-pressed:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
                      onClick={() => select(option.value)}
                    >
                      <span className="min-w-0 leading-5">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
