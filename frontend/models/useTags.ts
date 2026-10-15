import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tagsApi } from "@/api/tags";

const tagKeys = {
  all: ["tags"] as const,
};

export function useTags() {
  return useQuery({ queryKey: tagKeys.all, queryFn: tagsApi.list });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tagKeys.all }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tagsApi.remove,
    // The tag disappears from the transactions that had it, so the transaction lists reload too
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: tagKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ]),
  });
}
