import {
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Goal,
  type LucideIcon,
  Wallet,
  LogOut,
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
  { href: "/", label: "Overview", icon: Home },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/goals", label: "Savings goals", icon: Goal },
];

interface SidebarViewProps {
  pathname: string;
  planPicker: ReactNode;
  collapsed: boolean;
  isLoggingOut: boolean;
  onToggleCollapsed: () => void;
  onLogout: () => void;
}

export const SidebarView: FC<SidebarViewProps> = ({
  pathname,
  planPicker,
  collapsed,
  isLoggingOut,
  onToggleCollapsed,
  onLogout,
}) => {
  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-foreground/10 transition-[width] duration-200 ${
        collapsed ? "w-17" : "w-64"
      }`}
    >
      <div
        className={`flex h-16 items-center overflow-hidden border-b border-foreground/10 ${
          collapsed ? "justify-center px-3" : "justify-between pr-3.5 pl-5"
        }`}
      >
        {!collapsed && (
          <Link href="/" className="flex items-center">
            <Image src={logo} alt="Arca" width={75} height={32} priority />
          </Link>
        )}
        <IconButton
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="rounded-md"
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
                  <span className={collapsed ? "sr-only" : undefined}>{label}</span>
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
          <span className={collapsed ? "sr-only" : undefined}>{isLoggingOut ? "Logging out…" : "Log out"}</span>
        </Button>
      </div>
    </aside>
  );
};
