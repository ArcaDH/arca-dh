import {
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  Goal,
  type LucideIcon,
  Menu,
  Wallet,
  LogOut,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { FC, ReactNode } from "react";
import logo from "@/public/logo.svg";
import Button from "../ui/button";
import IconButton from "../ui/IconButton";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/", label: "Budget", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/goals", label: "Savings goals", icon: Goal },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

interface SidebarViewProps {
  pathname: string;
  planPicker: ReactNode;
  collapsed: boolean;
  mobileOpen: boolean;
  isLoggingOut: boolean;
  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const SidebarView: FC<SidebarViewProps> = ({
  pathname,
  planPicker,
  collapsed,
  mobileOpen,
  isLoggingOut,
  onToggleCollapsed,
  onOpenMobile,
  onCloseMobile,
  onLogout,
}) => {
  const hiddenWhenCollapsed = collapsed ? "md:sr-only" : "";

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-foreground/10 bg-background px-2 md:hidden">
        <IconButton onClick={onOpenMobile} aria-label="Open menu" aria-expanded={mobileOpen} className="rounded-md">
          <Menu size={20} strokeWidth={1.75} aria-hidden />
        </IconButton>
        <Link href="/" className="flex items-center">
          <Image src={logo} alt="Arca" width={75} height={32} priority />
        </Link>
      </div>

      {mobileOpen && (
        <div aria-hidden onClick={onCloseMobile} className="fixed inset-0 z-40 bg-foreground/30 md:hidden" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-foreground/10 bg-background transition-[translate,width] duration-200 md:sticky md:top-0 md:z-auto md:h-svh md:translate-x-0 md:self-start ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-17" : "md:w-64"}`}
      >
        <div
          className={`flex h-16 shrink-0 items-center justify-between overflow-hidden border-b border-foreground/10 pr-3.5 pl-5 ${
            collapsed ? "md:justify-center md:px-3" : ""
          }`}
        >
          <Link href="/" onClick={onCloseMobile} className={`flex items-center ${collapsed ? "md:hidden" : ""}`}>
            <Image src={logo} alt="Arca" width={75} height={32} priority />
          </Link>
          <IconButton onClick={onCloseMobile} aria-label="Close menu" className="rounded-md md:hidden">
            <X size={18} strokeWidth={1.5} aria-hidden />
          </IconButton>
          <IconButton
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className="hidden rounded-md md:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden />
            )}
          </IconButton>
        </div>

        <div className="border-b border-foreground/10 px-3 py-3">{planPicker}</div>

        <nav className="overflow-hidden px-3 py-5">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onCloseMobile}
                    title={collapsed ? label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                      isActive
                        ? "border-foreground/10 bg-white font-medium text-foreground shadow-sm"
                        : "border-transparent text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2}
                      className={isActive ? "shrink-0 text-primary" : "shrink-0"}
                      aria-hidden
                    />
                    <span className={hiddenWhenCollapsed}>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto overflow-hidden border-t border-foreground/10 px-3 py-4">
          <Button
            variant="ghost"
            onClick={onLogout}
            isLoading={isLoggingOut}
            title={collapsed ? "Log out" : undefined}
            className="w-full justify-start"
          >
            <LogOut size={18} strokeWidth={2} className="shrink-0" aria-hidden />
            <span className={hiddenWhenCollapsed}>{isLoggingOut ? "Logging out…" : "Log out"}</span>
          </Button>
        </div>
      </aside>
    </>
  );
};
