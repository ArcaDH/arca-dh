"use client";

import {
  ArrowLeftRight,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { href: "/plans", label: "Plans", icon: ClipboardList },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden border-r border-foreground/10 px-3 transition-[width] duration-200 ${
        collapsed ? "w-17" : "w-64"
      }`}
    >
      <div
        className={`flex h-16 items-center border-b border-foreground/10 ${
          collapsed ? "justify-center" : "justify-between pl-3"
        }`}
      >
        {!collapsed && (
          <Link
            href="/"
            className="font-heading text-xl font-bold tracking-tight whitespace-nowrap"
          >
            Arca
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="rounded-md p-1.5 cursor-pointer text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>

      <nav className="py-5">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);

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
                    strokeWidth={1.5}
                    className="shrink-0"
                    aria-hidden
                  />
                  <span className={collapsed ? "sr-only" : undefined}>
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
