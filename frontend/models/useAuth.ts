import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { currentUserKey } from "./useCurrentUser";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      queryClient.clear(); // clear in case of previous user
      queryClient.setQueryData(currentUserKey, user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => queryClient.setQueryData(currentUserKey, null),
  });
}
