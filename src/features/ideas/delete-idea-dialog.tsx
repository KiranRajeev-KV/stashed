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
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { deleteIdea, ideaQueryKey } from "../../api/ideas.js";

type DeleteIdeaDialogProps = {
  ideaId: string;
  ideaTitle: string;
};

export function DeleteIdeaDialog({ ideaId, ideaTitle }: DeleteIdeaDialogProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteIdea(ideaId),
    onSuccess: async () => {
      await queryClient.cancelQueries({
        queryKey: ideaQueryKey(ideaId),
        exact: true,
      });
      queryClient.removeQueries({
        queryKey: ideaQueryKey(ideaId),
        exact: true,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
        queryClient.invalidateQueries({ queryKey: ["tags"] }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
      ]);

      toast.success("Idea deleted");
      await navigate({ to: "/ideas", replace: true });
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (mutation.isPending) return;

    setOpen(nextOpen);
    if (!nextOpen) mutation.reset();
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger asChild>
        <Button variant="ghost">
          <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />
          Delete idea
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
            Delete this idea?
          </AlertDialog.Title>
          <AlertDialog.Description className={twDeleteDialogDescription}>
            <span className={twDeleteDialogIdeaTitle}>“{ideaTitle}”</span>
            <span>This permanently deletes the idea and cannot be undone.</span>
          </AlertDialog.Description>

          <ActionFeedback
            state={
              mutation.isError
                ? "error"
                : mutation.isPending
                  ? "pending"
                  : "idle"
            }
            className="mt-4"
          >
            {mutation.isError
              ? `Couldn’t delete this idea. ${mutation.error.message} Nothing was deleted. Try again or cancel.`
              : mutation.isPending
                ? "Deleting idea…"
                : null}
          </ActionFeedback>

          <div className={twDeleteDialogActions}>
            <AlertDialog.Cancel asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <Button
              type="button"
              variant="destructive"
              loading={mutation.isPending}
              loadingLabel="Deleting…"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />
              Delete idea
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
