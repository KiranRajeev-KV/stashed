import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle, Trash2 } from "lucide-react";
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
    onError: (error) => {
      toast.error("Failed to delete idea", { description: error.message });
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
        <button type="button" className="idea-delete-trigger">
          <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />
          Delete idea
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="delete-dialog-overlay" />
        <AlertDialog.Content
          className="delete-dialog-content"
          onEscapeKeyDown={(event) => {
            if (mutation.isPending) event.preventDefault();
          }}
        >
          <p className="delete-dialog-kicker">Permanent action</p>
          <AlertDialog.Title className="delete-dialog-title">
            Delete this idea?
          </AlertDialog.Title>
          <AlertDialog.Description className="delete-dialog-description">
            <span className="delete-dialog-idea-title">“{ideaTitle}”</span>
            <span>This permanently deletes the idea and cannot be undone.</span>
          </AlertDialog.Description>

          {mutation.isError ? (
            <p className="delete-dialog-error" role="alert">
              {mutation.error.message} The idea has not been deleted.
            </p>
          ) : null}

          <div className="delete-dialog-actions">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="delete-dialog-cancel"
                disabled={mutation.isPending}
              >
                Cancel
              </button>
            </AlertDialog.Cancel>
            <button
              type="button"
              className="delete-dialog-confirm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="delete-dialog-spinner"
                  size={17}
                />
              ) : (
                <Trash2 aria-hidden="true" size={17} strokeWidth={1.8} />
              )}
              {mutation.isPending ? "Deleting…" : "Delete idea"}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
