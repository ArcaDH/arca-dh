import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { useRouter } from "next/navigation";

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      router.push("/login");
    },
  });
}
