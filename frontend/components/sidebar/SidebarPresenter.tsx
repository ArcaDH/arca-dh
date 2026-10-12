"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { PlanPickerPresenter } from "@/components/sidebar/plan-picker/PlanPickerPresenter";
import { useLogout } from "@/models/useAuth";
import { SidebarView } from "@/components/sidebar/SidebarView";

export const SidebarPresenter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  return (
    <SidebarView
      pathname={pathname}
      planPicker={<PlanPickerPresenter collapsed={collapsed} />}
      collapsed={collapsed}
      isLoggingOut={logout.isPending}
      onToggleCollapsed={() => setCollapsed((current) => !current)}
      onLogout={handleLogout}
    />
  );
};
