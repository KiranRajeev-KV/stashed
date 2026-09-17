import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  createCollection,
  type CreateCollectionInput,
} from "../../api/collections.js";
import { CollectionForm } from "./collection-form.js";

export function NewCollectionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: createCollection });
  async function submit(values: Required<CreateCollectionInput>) {
    const result = await mutation.mutateAsync(values);
    await queryClient.invalidateQueries({ queryKey: ["collections"] });
    toast.success("Collection created");
    await navigate({
      to: "/collections/$collectionId",
      params: { collectionId: result.collection.id },
      replace: true,
    });
  }
  return (
    <section>
      <CollectionForm
        error={mutation.error?.message}
        onCancel={() => navigate({ to: "/collections" })}
        onSubmit={submit}
      />
    </section>
  );
}
