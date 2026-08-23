import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { toast } from "sonner";

import {
  ideaQueryKey,
  type IdeaListItem,
  type IdeaStatus,
  updateIdea,
} from "../../api/ideas.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";
import { StatusSelect } from "./status-select.js";

type IdeaStatusEditorProps = {
  idea: Pick<IdeaListItem, "id" | "status">;
};

export function IdeaStatusEditor({ idea }: IdeaStatusEditorProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = React.useState(idea.status);
  const mutation = useMutation({
    mutationFn: (status: IdeaStatus) => updateIdea(idea.id, { status }),
    onSuccess: async ({ idea: updatedIdea }) => {
      setSelectedStatus(updatedIdea.status);
      queryClient.setQueryData(ideaQueryKey(updatedIdea.id), updatedIdea);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
      ]);
      toast.success("Status updated", {
        description: `Marked as ${IDEA_STATUS_LABELS[updatedIdea.status]}.`,
      });
    },
    onError: (error) => {
      setSelectedStatus(idea.status);
      toast.error("Failed to update status", { description: error.message });
    },
  });

  React.useEffect(() => {
    if (!mutation.isPending) setSelectedStatus(idea.status);
  }, [idea.status, mutation.isPending]);

  function handleStatusChange(status?: IdeaStatus) {
    if (!status || status === selectedStatus || mutation.isPending) return;

    setSelectedStatus(status);
    mutation.mutate(status);
  }

  return (
    <div className="idea-status-editor">
      <StatusSelect
        className="min-w-0"
        disabled={mutation.isPending}
        icon="down"
        iconClassName="text-current"
        label="Change status"
        labelClassName="sr-only"
        onValueChange={handleStatusChange}
        triggerClassName="idea-status-trigger"
        triggerDataStatus={selectedStatus}
        variant="badge"
        value={selectedStatus}
      />
      <span className="sr-only" aria-live="polite">
        {mutation.isPending ? "Updating status" : ""}
      </span>
    </div>
  );
}
