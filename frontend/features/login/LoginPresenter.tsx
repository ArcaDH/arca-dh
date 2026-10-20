"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/models/useAuth";
import { cancelOnboarding } from "@/models/useOnboarding";
import LoginView from "@/features/login/LoginView";

export default function LoginPresenter() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit() {
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          cancelOnboarding();
          router.push("/");
        },
      },
    );
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
