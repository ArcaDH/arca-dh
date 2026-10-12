import { SidebarPresenter } from "@/components/sidebar/SidebarPresenter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-row">
      <SidebarPresenter />
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
