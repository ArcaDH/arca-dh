import type { LoginInput, RegisterInput } from "@/types/user";
import { apiClient } from "./ApiClient";
import { setTokenCookie, clearTokenCookie } from "./cookies";
import { Endpoints } from "./endpoints";

type LoginResponse = { id: number; token: string };

export const authApi = {
  register: (input: RegisterInput) => apiClient.post<void>(Endpoints.Users.register(), input),

  login: async (input: LoginInput): Promise<{ id: number }> => {
    const data = await apiClient.post<LoginResponse>(Endpoints.Users.login(), input);
    setTokenCookie(data.token);
    return { id: data.id };
  },

  logout: (): Promise<void> => {
    clearTokenCookie();
    return Promise.resolve();
  },
};
