"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/models/useCurrentUser";
import SidebarPresenter from "@/components/sidebar/SidebarPresenter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn, isLoading, router]);

  if (isLoading || !isLoggedIn) {
    // Render nothing while checking auth / during redirect
    return null;
  }

  return (
    <div className="flex flex-1 flex-row">
      <SidebarPresenter />
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
