"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlanPickerPresenter } from "@/components/sidebar/plan-picker/PlanPickerPresenter";
import { useLogout } from "@/models/useAuth";
import { SidebarView } from "@/components/sidebar/SidebarView";

export const SidebarPresenter = () => {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(false);
  // On phone the sidebar is a drawer instead. Opens from menu button in the header.
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  function handleLogout() {
    logout.mutate(undefined, { onSettled: () => router.replace("/login") });
  }

  return (
    <SidebarView
      pathname={pathname}
      planPicker={<PlanPickerPresenter collapsed={collapsed && !mobileOpen} />}
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      isLoggingOut={logout.isPending}
      onToggleCollapsed={() => setCollapsed((current) => !current)}
      onOpenMobile={() => setMobileOpen(true)}
      onCloseMobile={() => setMobileOpen(false)}
      onLogout={handleLogout}
    />
  );
};
