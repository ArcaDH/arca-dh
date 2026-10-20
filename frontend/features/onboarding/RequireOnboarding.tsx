"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppSkeleton } from "@/components/AppSkeleton";
import { useOnboardingPending } from "@/models/useOnboarding";

// New accounts who have not onboarded are sent here
export const RequireOnboarding = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pending = useOnboardingPending();

  useEffect(() => {
    if (pending) router.replace("/welcome");
  }, [pending, router]);

  return pending === false ? children : <AppSkeleton />;
};
