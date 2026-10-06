import type { LoginInput, RegisterInput, User } from "@/types/user";
import { requestHelper } from "./request";

const loginEndpoint = "/auth/login";
const registerEndpoint = "/auth/register";
const logoutEndpoint = "/auth/logout";
const currentUserEndpoint = "/auth/me";

export const authApi = {
  register: (input: RegisterInput) =>
    requestHelper<User>(registerEndpoint, { method: "POST", body: JSON.stringify(input) }),

  login: (input: LoginInput) => requestHelper<User>(loginEndpoint, { method: "POST", body: JSON.stringify(input) }),

  logout: () => requestHelper<void>(logoutEndpoint, { method: "POST" }),

  getCurrentUser: () => requestHelper<User>(currentUserEndpoint),
};
