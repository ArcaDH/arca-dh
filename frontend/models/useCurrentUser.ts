import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import type { User } from "@/types/user";

export const currentUserKey = ["auth", "me"];

export function useCurrentUser() {
  const { data, isLoading, error } = useQuery<User | null>({
    queryKey: currentUserKey,
    queryFn: authApi.getCurrentUser,
    staleTime: Infinity,
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    error,
  };
}
