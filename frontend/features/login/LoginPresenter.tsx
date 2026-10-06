"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLogin } from "@/models/useAuth";
import LoginView from "@/features/login/LoginView";

export default function LoginPresenter() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit() {
    login.mutate({ email, password }, { onSuccess: () => router.replace("/") });
  }

  return (
    <LoginView
      email={email}
      password={password}
      error={login.error?.message ?? null}
      isPending={login.isPending}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}
