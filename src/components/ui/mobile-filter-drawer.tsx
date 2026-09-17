import { Drawer } from "@base-ui/react/drawer";
import { ListFilter, X } from "lucide-react";
import * as React from "react";

import { buttonStyles } from "./button-variants.js";
import {
  twUiDialogBackdrop,
  twUiDialogSheet,
} from "../../styles/dialogs-styles.js";
import {
  twUiSelectSheet,
  twUiSelectTrigger,
} from "../../styles/selects-styles.js";

type MobileFilterDrawerProps = {
  activeCount: number;
  children: React.ReactNode;
  closeLabel: string;
  description: string;
  onApply: () => void;
  onClear: () => void;
  onOpenChange?: (open: boolean) => void;
  title: string;
  triggerSummary: string;
};

/**
 * A compact mobile archive filter trigger and its composable filter sheet.
 * The parent owns draft state so each archive can supply its own filter set.
 */
export function MobileFilterDrawer({
  activeCount,
  children,
  closeLabel,
  description,
  onApply,
  onClear,
  onOpenChange,
  title,
  triggerSummary,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange?.(nextOpen);
    setOpen(nextOpen);
  }

  function applyFilters() {
    onApply();
    setOpen(false);
  }

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange}>
      <Drawer.Trigger
        className={`${twUiSelectTrigger} flex min-h-14 min-w-0 items-center gap-3 rounded-control border border-border-strong bg-surface px-3 text-left text-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
      >
        <ListFilter className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-ui font-medium leading-5">Filters</span>
          <span className="block truncate text-caption leading-4 text-muted-foreground">
            {triggerSummary}
          </span>
        </span>
        {activeCount > 0 ? (
          <span className="grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 font-mono text-micro text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Drawer.Trigger>

      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop
            className={`${twUiDialogBackdrop} fixed inset-0 z-50 bg-foreground/35 opacity-100 backdrop-blur-[2px] transition-opacity duration-(--duration-standard) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none`}
          />
          <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
            <Drawer.Popup
              className={`${twUiDialogSheet} ${twUiSelectSheet} flex max-h-[min(88dvh,52rem)] w-full translate-y-[var(--drawer-swipe-movement-y)] flex-col overflow-hidden rounded-t-[1rem] border border-b-0 border-border-strong bg-surface-elevated text-foreground shadow-overlay transition-transform duration-(--duration-slow) ease-emphasized data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[swiping]:select-none motion-reduce:transition-none sm:max-w-xl`}
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

              <Drawer.Content className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                <div className="grid gap-5" data-base-ui-swipe-ignore>
                  {children}
                </div>
              </Drawer.Content>

              <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-3 border-t border-border bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <button
                  type="button"
                  className={buttonStyles({ variant: "ghost" })}
                  onClick={onClear}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className={buttonStyles({ variant: "primary" })}
                  onClick={applyFilters}
                >
                  View results
                </button>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}
