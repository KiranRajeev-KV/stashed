import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { collectionQueryKey, deleteCollection } from "../../api/collections.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";
import {
  twDeleteDialogActions,
  twDeleteDialogContent,
  twDeleteDialogDescription,
  twDeleteDialogIdeaTitle,
  twDeleteDialogOverlay,
  twDeleteDialogTitle,
  twUiDialogBackdrop,
  twUiDialogPanel,
} from "../../styles/dialogs-styles.js";

export function DeleteCollectionDialog({
  collectionId,
  collectionName,
}: {
  collectionId: string;
  collectionName: string;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteCollection(collectionId),
    onSuccess: async () => {
      await queryClient.cancelQueries({
        queryKey: collectionQueryKey(collectionId),
        exact: true,
      });
      queryClient.removeQueries({
        queryKey: collectionQueryKey(collectionId),
        exact: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted", {
        description: "The Ideas themselves were not changed.",
      });
      await navigate({ to: "/collections", replace: true });
    },
  });
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) {
          setOpen(next);
          if (!next) mutation.reset();
        }
      }}
    >
      <AlertDialog.Trigger asChild>
        <Button variant="ghost">
          <Trash2 size={16} aria-hidden="true" />
          Delete collection
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={`${twDeleteDialogOverlay} ${twUiDialogBackdrop}`}
        />
        <AlertDialog.Content
          className={`${twDeleteDialogContent} ${twUiDialogPanel}`}
          onEscapeKeyDown={(event) => {
            if (mutation.isPending) event.preventDefault();
          }}
        >
          <AlertDialog.Title className={twDeleteDialogTitle}>
            Delete this collection?
          </AlertDialog.Title>
          <AlertDialog.Description className={twDeleteDialogDescription}>
            <span className={twDeleteDialogIdeaTitle}>“{collectionName}”</span>
            <span>
              This permanently deletes the collection and its memberships. The
              Ideas themselves will not be changed.
            </span>
          </AlertDialog.Description>
          <ActionFeedback
            className="mt-4"
            state={
              mutation.isError
                ? "error"
                : mutation.isPending
                  ? "pending"
                  : "idle"
            }
          >
            {mutation.isError
              ? `Couldn’t delete this collection. ${mutation.error.message} Nothing was deleted.`
              : mutation.isPending
                ? "Deleting collection…"
                : null}
          </ActionFeedback>
          <div className={twDeleteDialogActions}>
            <AlertDialog.Cancel asChild>
              <Button disabled={mutation.isPending}>Cancel</Button>
            </AlertDialog.Cancel>
            <Button
              variant="destructive"
              loading={mutation.isPending}
              loadingLabel="Deleting…"
              onClick={() => mutation.mutate()}
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete collection
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
