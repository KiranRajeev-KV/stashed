import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";

import {
  twDeleteDialogActions,
  twDeleteDialogContent,
  twDeleteDialogDescription,
  twDeleteDialogOverlay,
  twDeleteDialogTitle,
  twResourceEditSheet,
  twResourceEditSheetBackdrop,
  twResourceEditSheetHeader,
  twResourceEditSheetWide,
  twUiDialogBackdrop,
  twUiDialogPanel,
} from "../../styles/dialogs-styles.js";
import { buttonStyles } from "./button-variants.js";
import { Button } from "./button.js";

type ResourceEditSheetProps = {
  open: boolean;
  title: string;
  description: string;
  dirty?: boolean;
  pending?: boolean;
  size?: "default" | "wide";
  onClose: () => void;
  children: (controls: {
    requestClose: () => void;
    selectPortalContainer: RefObject<HTMLDivElement | null>;
  }) => ReactNode;
};

/**
 * A modal edit surface that preserves the resource page as useful background
 * context. It owns the common dismissal and unsaved-draft protection rules.
 */
export function ResourceEditSheet({
  open,
  title,
  description,
  dirty = false,
  pending = false,
  size = "default",
  onClose,
  children,
}: ResourceEditSheetProps) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const selectPortalContainer = useRef<HTMLDivElement>(null);

  const requestClose = () => {
    if (pending) return;
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  return (
    <>
      <Dialog.Root
        open={open}
        disablePointerDismissal
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop
            className={twResourceEditSheetBackdrop}
            onClick={requestClose}
          />
          <Dialog.Viewport className="fixed inset-0 z-[50]">
            <Dialog.Popup
              className={`${twResourceEditSheet} ${size === "wide" ? twResourceEditSheetWide : ""}`}
            >
              <div className={twResourceEditSheetHeader}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Dialog.Title className="text-ui font-medium">
                      {title}
                    </Dialog.Title>
                    {dirty && !pending ? (
                      <span className="text-metadata text-muted-foreground">
                        Unsaved changes
                      </span>
                    ) : null}
                  </div>
                  <Dialog.Description className="mt-1 text-caption leading-relaxed text-muted-foreground">
                    {description}
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  className={buttonStyles({ variant: "ghost", size: "icon" })}
                  aria-label={`Close ${title.toLowerCase()}`}
                  disabled={pending}
                >
                  <X size={16} aria-hidden="true" />
                </Dialog.Close>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                {children({ requestClose, selectPortalContainer })}
              </div>
              <div
                ref={selectPortalContainer}
                className="pointer-events-none fixed inset-0 z-[60] [&_[data-base-ui-portal]]:pointer-events-auto"
              />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={confirmDiscard}
        onOpenChange={(next) => {
          if (!next) setConfirmDiscard(false);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            className={`${twDeleteDialogOverlay} ${twUiDialogBackdrop} z-[89]`}
          />
          <AlertDialog.Content
            className={`${twDeleteDialogContent} ${twUiDialogPanel} z-[90]`}
          >
            <AlertDialog.Title className={twDeleteDialogTitle}>
              Discard unsaved changes?
            </AlertDialog.Title>
            <AlertDialog.Description className={twDeleteDialogDescription}>
              Your edits to this collection have not been saved.
            </AlertDialog.Description>
            <div className={twDeleteDialogActions}>
              <AlertDialog.Cancel asChild>
                <Button>Keep editing</Button>
              </AlertDialog.Cancel>
              <Button
                variant="destructive"
                onClick={() => {
                  setConfirmDiscard(false);
                  onClose();
                }}
              >
                Discard changes
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
