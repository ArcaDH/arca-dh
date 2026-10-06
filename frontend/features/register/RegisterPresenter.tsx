"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLogin, useRegister } from "@/models/useAuth";
import type { RegisterInput } from "@/types/user";
import RegisterView from "@/features/register/RegisterView";

const emptyForm: RegisterInput = { firstName: "", lastName: "", username: "", email: "", password: "" };

export default function RegisterPresenter() {
  const router = useRouter();
  const register = useRegister();
  const login = useLogin();
  const [form, setForm] = useState<RegisterInput>(emptyForm);

  function handleChange(field: keyof RegisterInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    register.mutate(form, {
      onSuccess: () =>
        login.mutate({ email: form.email, password: form.password }, { onSuccess: () => router.replace("/") }),
    });
  }

  return (
    <RegisterView
      form={form}
      error={register.error?.message ?? login.error?.message ?? null}
      isPending={register.isPending || login.isPending}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
}
